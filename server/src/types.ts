import { GameResult, GuessResult, Player, VTuber } from "@vtuber-guessr/shared";

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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
  chanceReductionInterval?: NodeJS.Timeout; // tracks the interval for automatic chance reduction
}
