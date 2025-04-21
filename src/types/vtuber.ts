export interface VTuber {
  id: string;
  avatar: string;
  name: string;
  nameEN: string;
  agency?: string;
  debutDate: string;
  birthDate: string;
  seiza: string;
  description: string;
  gender: Gender;
  age: number;
  hairColor: string;
  eyeColor: string;
  height: number;
  tags: string[];
}

export type Gender = "男" | "女" | "不明";

export interface GameRound {
  targetVtuber: VTuber;
  attempts: number;
  maxAttempts: number;
}

export interface GuessResult {
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

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: string;
}
