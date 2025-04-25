import { Server, Socket } from "socket.io";
import {
  GameRoom,
  ServerToClientEvents,
  ClientToServerEvents,
  VTuber,
  Player,
  User,
  CHANCE_REDUCTION_INTERVAL,
} from "@vtuber-guessr/shared";
import { MatchmakingSystem } from "./matchmaking";
import { vtubers } from "@vtuber-guessr/shared";
import { checkGuess } from "@vtuber-guessr/shared";
import { PlayerNameStorage } from "./storage";

export class GameManager {
  private matchmakingSystem: MatchmakingSystem;
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private playerNames: PlayerNameStorage;
  private connectedPlayers: Map<string, User>;
  private static uniqueTags: string[];
  private disconnectTimeouts: Map<string, NodeJS.Timeout>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
    this.matchmakingSystem = new MatchmakingSystem(io);
    this.playerNames = new PlayerNameStorage();
    this.connectedPlayers = new Map();
    this.disconnectTimeouts = new Map();
    // 初始化 uniqueTags
    if (!GameManager.uniqueTags) {
      // 收集所有 VTuber 的标签
      const allTags = vtubers.flatMap((vtuber) => vtuber.tags || []);

      // 过滤掉空标签和重复标签
      GameManager.uniqueTags = [
        ...new Set(allTags.filter((tag) => tag && tag.trim() !== "")),
      ];
    }
  }

  private broadcastStats() {
    const stats = {
      onlinePlayers: this.connectedPlayers.size,
      queueCount: this.matchmakingSystem.queueCount(),
      roomCount: this.matchmakingSystem.roomCount(),
    };
    this.io.emit("stats:update", stats);
  }

  private sendStats(socket: Socket) {
    const stats = {
      onlinePlayers: this.connectedPlayers.size,
      queueCount: this.matchmakingSystem.queueCount(),
      roomCount: this.matchmakingSystem.roomCount(),
    };
    socket.emit("stats:update", stats);
  }

  private generateRandomName(): string {
    const getRandomTag = () => {
      const randomIndex = Math.floor(
        Math.random() * GameManager.uniqueTags.length
      );
      return GameManager.uniqueTags[randomIndex];
    };

    // Get two different random tags
    const firstTag = getRandomTag();
    const secondTag = getRandomTag();

    return `${firstTag}${secondTag}`;
  }

  private getUserBySocketID(socket_id: string): User | undefined {
    return this.connectedPlayers.get(socket_id);
  }

  private getUserByUserId(user_id: string): User | undefined {
    return Array.from(this.connectedPlayers.values()).find(
      (user) => user.id === user_id
    );
  }

  private handleDisconnectTimeout(user: User) {
    console.log("handleDisconnectTimeout", user.name);
    this.matchmakingSystem.handleLeaveQueue(user);
    this.handlePlayerLeave(undefined, user);
    this.disconnectTimeouts.delete(user.id);
    this.broadcastStats();
  }

  public handleSocketConnection(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
  ) {
    // Handle login event
    socket.on("login", async (data: { userId: string }) => {
      if (this.getUserByUserId(data.userId)) {
        socket.emit("error", "请勿多开窗口进行游戏");
        return;
      }

      // check user name
      let userName = await this.playerNames.get(data.userId);
      if (!userName) {
        userName = this.generateRandomName();
        await this.playerNames.set(data.userId, userName);
      }

      const user = {
        id: data.userId,
        name: userName,
      };

      this.connectedPlayers.set(socket.id, user);

      console.log("user connected", user.name);

      const timeout = this.disconnectTimeouts.get(data.userId);
      if (timeout) {
        clearTimeout(timeout);
        this.disconnectTimeouts.delete(data.userId);
      }

      await this.matchmakingSystem.handlePlayerConnect(socket, user);

      this.broadcastStats();
    });

    // Matchmaking events
    socket.on("matchmaking:join", (callback) => {
      const user = this.getUserBySocketID(socket.id);
      if (!user) {
        socket.emit("error", "游戏状态异常");
        return;
      }

      this.matchmakingSystem.handleJoinQueue(user);
      const room = this.matchmakingSystem.getRoomForPlayer(user.id);
      if (room) {
        console.log(`Player ${user.name} joined room ${room.id}`);
        // 确保房间内的所有玩家都收到了更新
        this.io.to(room.id).emit("room:updated", room);
        callback(room);
      }

      this.broadcastStats();
    });

    socket.on("matchmaking:leave", () => {
      const user = this.getUserBySocketID(socket.id);
      if (!user) {
        socket.emit("error", "游戏状态异常");
        return;
      }

      this.matchmakingSystem.handleLeaveQueue(user);

      this.broadcastStats();
    });

    // Room events
    socket.on("room:join", (roomId: string) => {
      const user = this.getUserBySocketID(socket.id);
      if (!user) {
        socket.emit("error", "游戏状态异常");
        return;
      }
      console.log("room:join", user.name, roomId);
      this.matchmakingSystem.handleJoinRoom(user, roomId);
    });

    // Game events
    socket.on("room:ready", () => {
      const user = this.getUserBySocketID(socket.id);
      if (!user) {
        socket.emit("error", "游戏状态异常");
        return;
      }

      const room = this.matchmakingSystem.getRoomForPlayer(user.id);
      if (!room) return;

      // reset room
      room.result = undefined;
      room.status = "waiting";

      const player = room.players.find((p) => p.user.id === user?.id);
      if (player) {
        console.log("player ready", player.user.name);
        player.ready = true;
        this.matchmakingSystem.updateRoom(room);

        // Check if all players are ready
        if (room.players.length == 2 && room.players.every((p) => p.ready)) {
          console.log("room start with", room.players);
          this.startGame(room);
        }
      }
    });

    socket.on("game:guess", (guess: VTuber) => {
      const user = this.getUserBySocketID(socket.id);
      if (!user) {
        socket.emit("error", "游戏状态异常");
        return;
      }

      const room = this.matchmakingSystem.getRoomForPlayer(user.id);
      if (!room || room.status !== "playing" || !room.currentVtuber) return;

      const player = room.players.find((p) => p.user.id === user?.id);
      if (!player) return;

      if (player.chance <= 0) {
        return;
      }

      const result = checkGuess(user, guess, room.currentVtuber);
      room.records.push(result);

      // Mark that player has used their chance in this interval
      if (!room.playersUsedChance) {
        room.playersUsedChance = {};
      }
      room.playersUsedChance[user.id] = true;

      // Update score if correct
      if (result.isCorrect) {
        console.log("player win", player.user.name);
        // set all players chance to 0
        room.players.forEach((p) => {
          p.chance = 0;
        });
        room.scores[player.user.id]++;
        this.matchmakingSystem.updateRoom(room);
        this.endGame(room, player);
        return;
      }

      player.chance--;

      // if all players have 0 chance, end the game
      if (room.players.every((p) => p.chance <= 0)) {
        this.endGame(room);
      }

      // update room
      this.matchmakingSystem.updateRoom(room);
    });

    socket.on("room:leave", () => {
      const user = this.getUserBySocketID(socket.id);
      if (!user) {
        socket.emit("error", "游戏状态异常");
        return;
      }

      this.handlePlayerLeave(socket, user);
      this.broadcastStats();
    });

    socket.on("disconnect", () => {
      const user = this.getUserBySocketID(socket.id);
      if (user) {
        // Clear any existing timeout for this socket
        const existingTimeout = this.disconnectTimeouts.get(user.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set a new timeout for 10 seconds
        const timeout = setTimeout(() => {
          this.handleDisconnectTimeout(user);
        }, 10000);

        this.disconnectTimeouts.set(user.id, timeout);
        this.connectedPlayers.delete(socket.id);
        this.broadcastStats();
      }
    });
  }

  private startGame(room: GameRoom) {
    const defaultChance = 5;
    room.status = "playing";
    room.result = undefined;
    room.players.forEach((p) => {
      p.chance = defaultChance;
    });
    room.records = [];
    room.lastChanceReduction = Date.now();
    room.playersUsedChance = {};

    const randomIndex = Math.floor(Math.random() * vtubers.length);
    const vtuber = vtubers[randomIndex];
    room.currentVtuber = vtuber;
    console.log("game start with", room.currentVtuber.name);
    this.matchmakingSystem.updateRoom(room);
    this.io.to(room.id).emit("game:started", room);

    // Start the automatic chance reduction interval
    this.startChanceReductionInterval(room);
  }

  private startChanceReductionInterval(room: GameRoom) {
    const interval = setInterval(() => {
      if (room.status !== "playing") {
        clearInterval(interval);
        return;
      }

      const now = Date.now();
      if (
        now - (room.lastChanceReduction || 0) >=
        CHANCE_REDUCTION_INTERVAL * 1000
      ) {
        this.reduceChances(room);
      }
    }, 1000); // Check every second
  }

  private reduceChances(room: GameRoom) {
    room.players.forEach((player) => {
      // Only reduce chance if player hasn't used it in this interval
      if (!room.playersUsedChance?.[player.user.id]) {
        player.chance = Math.max(0, player.chance - 1);
      }
    });

    // Reset tracking for next interval
    room.playersUsedChance = {};
    room.lastChanceReduction = Date.now();

    // Update room state
    this.matchmakingSystem.updateRoom(room);

    // Check if game should end
    if (room.players.every((p) => p.chance <= 0)) {
      this.endGame(room);
    }
  }

  private endGame(room: GameRoom, winner?: Player) {
    room.status = "finished";
    // reset ready status
    room.players.forEach((p) => {
      p.ready = false;
    });
    room.result = {
      winner,
      answer: room.currentVtuber!,
    };
    room.lastChanceReduction = undefined;
    room.playersUsedChance = undefined;
    this.matchmakingSystem.updateRoom(room);
    this.io.to(room.id).emit("game:finished", room);
  }

  private handlePlayerLeave(socket: Socket | undefined, player: User) {
    const room = this.matchmakingSystem.getRoomForPlayer(player.id);
    if (room) {
      // Remove player from room
      room.players = room.players.filter((p) => p.user.id !== player.id);

      socket?.leave(room.id);

      console.log("player leave", player.name, room.id);

      if (room.players.length === 0) {
        // Delete empty room
        this.matchmakingSystem.deleteRoom(room.id, player.id);
      } else {
        // Notify remaining players
        // Reset score
        room.players.forEach((p) => {
          room.scores[p.user.id] = 0;
        });
        // reset status
        room.status = "waiting";
        room.records = [];
        this.matchmakingSystem.playerLeaveRoom(player.id);
        this.matchmakingSystem.updateRoom(room);
      }
    }
  }
}
