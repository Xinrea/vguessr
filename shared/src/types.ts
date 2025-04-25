export interface Player {
  user: User;
  chance: number;
  ready: boolean;
}

export interface User {
  id: string;
  name: string;
}

export interface VTuber {
  id: string;
  avatar: string;
  name: string;
  nameEN: string;
  agency: string;
  debutDate: string;
  birthDate: string;
  description: string;
  seiza: string;
  gender: string;
  age: number;
  hairColor: string;
  eyeColor: string;
  height: number;
  tags: string[];
}

export const CHANCE_REDUCTION_INTERVAL = 25; // seconds

export interface GameRoom {
  id: string;
  players: Player[];
  status: "waiting" | "playing" | "finished";
  currentVtuber?: VTuber;
  scores: Record<string, number>;
  records: GuessResult[];
  agencyHint?: string;
  result?: GameResult;
  lastChanceReduction?: number; // timestamp of last automatic chance reduction
  playersUsedChance?: Record<string, boolean>; // tracks if players used their chance in current interval
}

export interface GameResult {
  winner?: Player;
  answer: VTuber;
}

export interface GameState {
  rooms: Record<string, GameRoom>;
  players: Record<string, string>; // playerId -> roomId
}

export interface MatchmakingQueue {
  players: User[];
}

export interface GuessResult {
  user: User | null;
  // 1: self, 2: opponent
  marker: number;
  isCorrect: boolean;
  name: string;
  nameMatch: boolean[];
  differences: {
    attribute: string;
    value: string | number;
    isMatch: boolean;
    hint?: "higher" | "lower" | "equal";
  }[];
}

// Socket.IO event types
export interface ServerToClientEvents {
  "room:joined": (room: GameRoom) => void;
  "room:updated": (room: GameRoom) => void;
  "game:started": () => void;
  "game:finished": (room: GameRoom) => void;
  "stats:update": (stats: {
    onlinePlayers: number;
    queueCount: number;
    roomCount: number;
  }) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  "matchmaking:join": (callback: (room: GameRoom) => void) => void;
  "matchmaking:leave": () => void;
  "room:ready": () => void;
  "room:leave": () => void;
  "room:join": (roomId: string) => void;
  "game:guess": (guess: VTuber) => void;
  "game:skip": () => void;
  login: (data: { userId: string }) => void;
  reconnect: () => void;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  averageAttempts: number;
}
