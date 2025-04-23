import React, { useState, useEffect } from "react";
import {
  TrophyIcon,
  XMarkIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface StatsProps {
  totalGames: number;
  wins: number;
  losses: number;
  averageAttempts: number;
  pvpStats?: {
    totalGames: number;
    wins: number;
    losses: number;
    averageAttempts: number;
  };
}

const Stats: React.FC<StatsProps> = ({
  totalGames,
  wins,
  losses,
  averageAttempts,
  pvpStats,
}) => {
  const [showPvPStats, setShowPvPStats] = useState(false);

  useEffect(() => {
    const savedShowPvPStats = localStorage.getItem(
      "vtuber-guessr-show-pvp-stats"
    );
    if (savedShowPvPStats) {
      setShowPvPStats(JSON.parse(savedShowPvPStats));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "vtuber-guessr-show-pvp-stats",
      JSON.stringify(showPvPStats)
    );
  }, [showPvPStats]);

  const currentStats =
    showPvPStats && pvpStats
      ? pvpStats
      : {
          totalGames,
          wins,
          losses,
          averageAttempts,
        };

  const winRate =
    currentStats.totalGames > 0
      ? ((currentStats.wins / currentStats.totalGames) * 100).toFixed(1)
      : "0.0";

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-2">
          {pvpStats && (
            <button
              onClick={() => setShowPvPStats(!showPvPStats)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              {showPvPStats ? (
                <UsersIcon className="w-4 h-4" />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
              <span>{showPvPStats ? "PVP记录" : "单人记录"}</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap justify-center sm:justify-end gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-1.5">
            <TrophyIcon className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-500">局</span>
            <span className="font-medium">{currentStats.totalGames}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrophyIcon className="w-4 h-4 text-green-500" />
            <span className="text-gray-500">胜</span>
            <span className="font-medium">{currentStats.wins}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XMarkIcon className="w-4 h-4 text-red-500" />
            <span className="text-gray-500">负</span>
            <span className="font-medium">{currentStats.losses}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">胜率</span>
            <span className="font-medium">{winRate}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">平均</span>
            <span className="font-medium">
              {currentStats.averageAttempts.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Stats;
