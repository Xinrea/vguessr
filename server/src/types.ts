import {
  GameResult,
  GameRoom,
  GuessResult,
  Player,
  VTuber,
} from "@vtuber-guessr/shared";

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ServerRoom {
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
  chanceReductionInterval?: NodeJS.Timeout; // tracks the interval for automatic chance reduction
}

export function ToGameRoom(room: ServerRoom): GameRoom {
  return {
    id: room.id,
    players: room.players,
    status: room.status,
    scores: room.scores,
    records: room.records,
    agencyHint: room.agencyHint,
    result: room.result,
    lastChanceReduction: room.lastChanceReduction,
    playersUsedChance: room.playersUsedChance,
  };
}
