import { Server, Socket } from "socket.io";
import {
  GameState,
  GameRoom,
  Player,
  MatchmakingQueue,
  ServerToClientEvents,
  ClientToServerEvents,
  User,
} from "@vtuber-guessr/shared";

export class MatchmakingSystem {
  private gameState: GameState;
  private queue: MatchmakingQueue;
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private playerSockets: Map<string, string>;
  private static readonly MAX_ROOMS = 500;
  private matchmakingInterval: NodeJS.Timeout | null = null;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
    this.playerSockets = new Map();
    this.gameState = {
      rooms: {},
      players: {},
    };
    this.queue = {
      players: [],
    };
    // Start periodic matching check
    this.startPeriodicMatching();
  }

  private startPeriodicMatching() {
    // Check every 5 seconds
    this.matchmakingInterval = setInterval(() => {
      if (this.queue.players.length >= 2) {
        this.tryMatchPlayers();
      }
    }, 5000);
  }

  public cleanup() {
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = null;
    }
  }

  public async handlePlayerConnect(socket: Socket, user: User) {
    this.playerSockets.set(user.id, socket.id);
    // if player is already in a room, send room info
    const room = this.getRoomForPlayer(user.id);
    if (room) {
      // join room
      socket.join(room.id);
      socket.emit("room:joined", room);
    }
  }

  public queueCount() {
    return this.queue.players.length;
  }

  public roomCount() {
    return Object.keys(this.gameState.rooms).length;
  }

  private getSocketByUserId(userId: string): Socket | undefined {
    return this.io.sockets.sockets.get(this.playerSockets.get(userId) || "");
  }

  public handleJoinQueue(user: User) {
    const socket = this.getSocketByUserId(user.id);

    if (this.queue.players.some((p) => p.id === user.id)) {
      socket?.emit("error", "你已经在匹配队列中");
      return;
    }

    if (this.gameState.players[user.id]) {
      socket?.emit("error", "你已经在房间中");
      return;
    }

    this.queue.players.push(user);
    console.log(`Player ${user.name} joined the queue`);

    // Try to match players
    this.tryMatchPlayers();
  }

  public handleLeaveQueue(user: User) {
    if (this.queue.players.some((p) => p.id === user.id)) {
      const index = this.queue.players.indexOf(user);
      if (index !== -1) {
        this.queue.players.splice(index, 1);
        console.log(`Player ${user.name} left the queue`);
      }
    }
  }

  private async tryMatchPlayers() {
    while (this.queue.players.length >= 2) {
      const player1 = this.queue.players.shift()!;
      const player2 = this.queue.players.shift()!;

      const roomId = await this.createRoom(player1, player2);
      if (roomId === "") {
        return;
      }

      // Notify players
      const room = this.gameState.rooms[roomId];
      const player1Socket = this.getSocketByUserId(player1.id);
      const player2Socket = this.getSocketByUserId(player2.id);

      player1Socket?.join(roomId);
      player2Socket?.join(roomId);
      player1Socket?.emit("room:created", room);
      player2Socket?.emit("room:joined", room);
    }
  }

  private generateRoomId(): string {
    const min = 1000;
    const max = 9999;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops

    while (attempts < maxAttempts) {
      const roomId = Math.floor(
        Math.random() * (max - min + 1) + min
      ).toString();
      if (!this.gameState.rooms[roomId]) {
        return roomId;
      }
      attempts++;
    }

    return "";
  }

  private async createRoom(user1: User, user2: User): Promise<string> {
    // Check if we've reached the room limit
    if (
      Object.keys(this.gameState.rooms).length >= MatchmakingSystem.MAX_ROOMS
    ) {
      return "";
    }

    const roomId = this.generateRoomId();
    if (roomId === "") {
      return "";
    }

    const player1: Player = {
      user: user1,
      chance: 0,
      ready: false,
    };

    const player2: Player = {
      user: user2,
      chance: 0,
      ready: false,
    };

    const room: GameRoom = {
      id: roomId,
      players: [player1, player2],
      status: "waiting",
      records: [],
      scores: {
        [user1.id]: 0,
        [user2.id]: 0,
      },
    };

    this.gameState.rooms[roomId] = room;
    this.gameState.players[user1.id] = roomId;
    this.gameState.players[user2.id] = roomId;

    return roomId;
  }

  public async handleJoinRoom(user: User, roomId: string) {
    const socket = this.getSocketByUserId(user.id);
    // 检查玩家是否已经在其他房间
    if (this.gameState.players[user.id]) {
      socket?.emit("error", "你已经在其他房间中");
      return;
    }

    // 检查房间ID是否为4位数字
    if (!/^\d{4}$/.test(roomId)) {
      socket?.emit("error", "房间ID必须是4位数字");
      return;
    }

    // 检查房间是否存在
    let room = this.gameState.rooms[roomId];

    // 如果房间不存在，创建新房间
    if (!room) {
      const defaultChance = 5;
      const player: Player = {
        user,
        chance: defaultChance,
        ready: false,
      };

      room = {
        id: roomId,
        players: [player],
        status: "waiting",
        records: [],
        scores: {
          [user.id]: 0,
        },
      };

      this.gameState.rooms[roomId] = room;
      this.gameState.players[user.id] = roomId;
      socket?.join(roomId);
      socket?.emit("room:created", room);
      socket?.emit("room:joined", room);
      return;
    }

    // 检查房间是否已满
    if (room.players.length >= 2) {
      socket?.emit("error", "房间已满");
      return;
    }

    // 检查房间状态
    if (room.status !== "waiting") {
      socket?.emit("error", "游戏已经开始");
      return;
    }

    // 加入房间
    const player: Player = {
      user,
      chance: 5,
      ready: false,
    };

    room.players.push(player);
    room.scores[user.id] = 0;
    this.gameState.players[user.id] = roomId;
    this.updateRoom(room);
    socket?.join(roomId);
    this.io.to(roomId).emit("room:updated", room);
  }

  public getRoomForPlayer(playerId: string): GameRoom | null {
    const roomId = this.gameState.players[playerId];
    return roomId ? this.gameState.rooms[roomId] : null;
  }

  public getRoomById(roomId: string): GameRoom | null {
    return this.gameState.rooms[roomId] || null;
  }

  public updateRoom(room: GameRoom) {
    if (
      room.records.length >= 4 &&
      !room.agencyHint &&
      room.records.every(
        (r) => !r.differences.find((d) => d.attribute === "团体")?.isMatch
      )
    ) {
      room.agencyHint = room.currentVtuber?.agency;
    }
    this.gameState.rooms[room.id] = room;
    this.io.to(room.id).emit("room:updated", room);
  }

  public deleteRoom(roomId: string, playerId: string) {
    delete this.gameState.rooms[roomId];
    delete this.gameState.players[playerId];
  }

  public playerLeaveRoom(playerId: string) {
    const roomId = this.gameState.players[playerId];
    if (roomId) {
      this.gameState.rooms[roomId].players = this.gameState.rooms[
        roomId
      ].players.filter((p) => p.user.id !== playerId);
      delete this.gameState.players[playerId];
    }
  }
}
