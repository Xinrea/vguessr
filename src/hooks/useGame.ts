"use client";

import { useState, useEffect, useCallback } from "react";
import {
  VTuber,
  GuessResult,
  checkGuess,
  vtubers,
  GameStats,
} from "@vtuber-guessr/shared";
import pinyin from "pinyin";
import { v4 as uuidv4 } from "uuid";
import { createAddVtuberPullRequest } from "@/services/github";

const MAX_ATTEMPTS = 6;

export function useGame() {
  const [targetVtuber, setTargetVtuber] = useState<VTuber | null>(null);
  const [attempts, setAttempts] = useState<VTuber[]>([]);
  const [guessResults, setGuessResults] = useState<GuessResult[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [searchResults, setSearchResults] = useState<VTuber[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState<{
    excludedAgencies: string[];
  }>(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("vtuber-guessr-settings");
      return savedSettings
        ? JSON.parse(savedSettings)
        : { excludedAgencies: [] };
    }
    return { excludedAgencies: [] };
  });
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    wins: 0,
    losses: 0,
    averageAttempts: 0,
  });
  const [isAddingVtuber, setIsAddingVtuber] = useState(false);
  const [addVtuberError, setAddVtuberError] = useState<string | null>(null);

  useEffect(() => {
    // 只在客户端加载统计数据
    const savedStats = localStorage.getItem("vtuber-guessr-stats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  const updateSettings = (newSettings: { excludedAgencies: string[] }) => {
    setSettings(newSettings);
    localStorage.setItem("vtuber-guessr-settings", JSON.stringify(newSettings));
  };

  const getRandomVtuber = (): VTuber => {
    const filteredVtubers = vtubers.filter(
      (v) => !settings.excludedAgencies.includes(v.agency || "")
    );
    const randomIndex = Math.floor(Math.random() * filteredVtubers.length);
    return filteredVtubers[randomIndex];
  };

  const updateVtuber = (updatedVtuber: VTuber) => {
    setTargetVtuber(updatedVtuber);
    // 更新本地数据
    const index = vtubers.findIndex((v) => v.id === updatedVtuber.id);
    if (index !== -1) {
      vtubers[index] = updatedVtuber;
    }
  };

  const addVtuber = async (newVtuber: Omit<VTuber, "id">) => {
    try {
      setIsAddingVtuber(true);
      setAddVtuberError(null);

      const vtuber: VTuber = {
        ...newVtuber,
        id: uuidv4(),
      };

      await createAddVtuberPullRequest(vtuber, process.env.PR_TOKEN || "");
      return vtuber;
    } catch (error) {
      setAddVtuberError(
        error instanceof Error ? error.message : "Failed to add VTuber"
      );
      throw error;
    } finally {
      setIsAddingVtuber(false);
    }
  };

  const searchVtubers = useCallback(
    async (query: string) => {
      if (!query) {
        setSearchResults([]);
        return;
      }

      const queryLower = query.toLowerCase();

      // 使用本地数据进行搜索，排除已经猜测过的 VTuber 和排除的企划
      const result = vtubers.filter((vtuber) => {
        // 检查是否已经猜测过
        if (attempts.some((attempt) => attempt.id === vtuber.id)) {
          return false;
        }

        // 检查是否在排除的企划中
        if (settings.excludedAgencies.includes(vtuber.agency || "")) {
          return false;
        }

        // 检查英文名
        if (vtuber.nameEN.toLowerCase().includes(queryLower)) {
          return true;
        }

        // 检查中文名
        if (vtuber.name.toLowerCase().includes(queryLower)) {
          return true;
        }

        // 检查拼音
        const namePinyin = pinyin(vtuber.name, {
          style: pinyin.STYLE_NORMAL,
          heteronym: false,
        }).join("");

        if (namePinyin.toLowerCase().includes(queryLower)) {
          return true;
        }

        return false;
      });

      setSearchResults(result);
    },
    [attempts, settings.excludedAgencies]
  );

  const startNewGame = () => {
    setTargetVtuber(null);
    setAttempts([]);
    setGuessResults([]);
    setIsGameOver(false);
    setSearchResults([]);
    setSearchQuery("");
  };

  const submitGuess = (guess: VTuber) => {
    // Generate target VTuber if it's the first guess
    let target = targetVtuber;
    if (!target) {
      const vtuber = getRandomVtuber();
      setTargetVtuber(vtuber);
      target = vtuber;
    }

    const result = checkGuess(null, guess, target);
    setAttempts((prev) => [guess, ...prev]);
    setGuessResults((prev) => [result, ...prev]);
    setSearchQuery("");
    setSearchResults([]);

    if (result.isCorrect || attempts.length + 1 >= MAX_ATTEMPTS) {
      setIsGameOver(true);

      // Update stats
      const newStats = {
        totalGames: stats.totalGames + 1,
        wins: stats.wins + (result.isCorrect ? 1 : 0),
        losses: stats.losses + (result.isCorrect ? 0 : 1),
        averageAttempts: result.isCorrect
          ? (stats.averageAttempts * stats.wins + attempts.length + 1) /
            (stats.wins + 1)
          : stats.averageAttempts,
      };
      setStats(newStats);
      // 只在客户端保存统计数据
      if (typeof window !== "undefined") {
        localStorage.setItem("vtuber-guessr-stats", JSON.stringify(newStats));
      }
    }
  };

  useEffect(() => {
    if (searchQuery) {
      searchVtubers(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchVtubers]);

  return {
    targetVtuber,
    attempts,
    guessResults,
    isGameOver,
    searchResults,
    searchQuery,
    setSearchQuery,
    submitGuess,
    startNewGame,
    updateVtuber,
    addVtuber,
    isAddingVtuber,
    addVtuberError,
    stats,
    settings,
    updateSettings,
  };
}
