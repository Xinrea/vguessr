"use client";

import { useState, useEffect, useRef } from "react";
import { GameRoom, GameStats, VTuber } from "@vtuber-guessr/shared";
import { Manager } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const USER_ID_KEY = "vtuber-guessr-user-id";

export function useMultiplayer() {
  const [socket, setSocket] = useState<ReturnType<
    typeof Manager.prototype.socket
  > | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [roomCount, setRoomCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pvpStats, setPvpStats] = useState<GameStats>({
    totalGames: 0,
    wins: 0,
    losses: 0,
    averageAttempts: 0,
  });
  const joinSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Request notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }

    // Initialize audio
    joinSoundRef.current = new Audio("/sounds/join.mp3");
    joinSoundRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    // Load saved PvP stats from localStorage
    if (typeof window !== "undefined") {
      const savedPvpStats = localStorage.getItem("vtuber-guessr-stats-pvp");
      if (savedPvpStats) {
        setPvpStats(JSON.parse(savedPvpStats));
      }
    }

    // Get or generate user ID
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem(USER_ID_KEY, userId);
    }

    const manager = new Manager(
      process.env.API_URL || "http://localhost:3001",
      {
        query: {
          userId,
        },
      }
    );
    const newSocket = manager.socket("/");
    setSocket(newSocket);

    // Login after connection
    newSocket.on("connect", () => {
      newSocket.emit("login", { userId });
      console.log("connected login");
    });

    // login after reconnect
    newSocket.on("reconnect", () => {
      // clear room
      setCurrentRoom(null);
      setIsReady(false);
      newSocket.emit("login", { userId });
      console.log("reconnected login");
    });

    newSocket.on("room:joined", (room: GameRoom) => {
      console.log("room:joined", room);
      setCurrentRoom(room);
      setIsInQueue(false);

      // Play sound when joined
      if (joinSoundRef.current) {
        joinSoundRef.current.play().catch((error) => {
          console.error("Error playing sound:", error);
        });
      }

      // Show notification
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const currentUserId = localStorage.getItem(USER_ID_KEY);
        const opponent = room.players.find((p) => p.user.id !== currentUserId);
        new Notification("VGuessr 加入房间", {
          body: opponent ? `对手: ${opponent.user.name}` : "等待对手加入...",
          icon: "/favicon.ico",
          tag: "room-joined",
        });
      }
    });

    newSocket.on("room:updated", (room: GameRoom) => {
      console.log("room:updated", room);
      setCurrentRoom(room);
    });

    newSocket.on("game:started", () => {
      // 获取设置
      const savedSettings = localStorage.getItem("vtuber-guessr-settings");
      const settings = savedSettings
        ? JSON.parse(savedSettings)
        : { soundEnabled: true };

      // 如果音效启用，播放开始音效
      if (settings.soundEnabled) {
        const audio = new Audio("/sounds/start.mp3");
        audio
          .play()
          .catch((error) => console.log("Error playing sound:", error));
      }
    });

    newSocket.on("game:finished", (room: GameRoom) => {
      console.log("Game finished", room);
      setCurrentRoom(room);
      const isWin = room.result?.winner?.user.id === userId;
      const attempts = room.records.filter((r) => r.user?.id === userId).length;
      updatePvpStats(isWin, attempts);
    });

    newSocket.on(
      "stats:update",
      (stats: {
        onlinePlayers: number;
        queueCount: number;
        roomCount: number;
      }) => {
        setOnlinePlayers(stats.onlinePlayers);
        setQueueCount(stats.queueCount);
        setRoomCount(stats.roomCount);
      }
    );

    newSocket.on("error", (message: string) => {
      console.error("Socket error:", message);
      setError(message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updatePvpStats = (isWin: boolean, attempts: number) => {
    setPvpStats((prevStats) => {
      const newPvpStats = {
        totalGames: prevStats.totalGames + 1,
        wins: prevStats.wins + (isWin ? 1 : 0),
        losses: prevStats.losses + (isWin ? 0 : 1),
        averageAttempts: isWin
          ? (prevStats.averageAttempts * prevStats.wins + attempts) /
            (prevStats.wins + 1)
          : prevStats.averageAttempts,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "vtuber-guessr-stats-pvp",
          JSON.stringify(newPvpStats)
        );
      }

      return newPvpStats;
    });
  };

  const joinQueue = () => {
    if (socket && !isInQueue) {
      socket.emit("matchmaking:join", (room: GameRoom) => {
        setCurrentRoom(room);
        setIsInQueue(false);
      });
      setIsInQueue(true);
    }
  };

  const leaveQueue = () => {
    if (socket && isInQueue) {
      socket.emit("matchmaking:leave");
      setIsInQueue(false);
    }
  };

  const setReady = () => {
    if (socket && currentRoom) {
      socket.emit("room:ready");
      setIsReady(true);
    }
  };

  const submitGuess = (guess: VTuber) => {
    if (socket && currentRoom) {
      console.log("Submitting guess:", guess);
      socket.emit("game:guess", guess);
    }
  };

  const leaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit("room:leave");
    }
    setCurrentRoom(null);
    setIsReady(false);
  };

  const joinRoom = (
    roomId: string,
    callback?: (room: GameRoom | null) => void
  ) => {
    if (socket && !currentRoom) {
      socket.emit("room:join", roomId, (room: GameRoom | null) => {
        if (room) {
          setCurrentRoom(room);
        }
        callback?.(room);
      });
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    socket,
    isInQueue,
    currentRoom,
    isReady,
    joinQueue,
    leaveQueue,
    setReady,
    submitGuess,
    leaveRoom,
    joinRoom,
    onlinePlayers,
    queueCount,
    roomCount,
    error,
    clearError,
    pvpStats,
    updatePvpStats,
  };
}
