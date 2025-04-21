import React, { useState } from "react";
import { TrophyIcon, XMarkIcon, ShareIcon } from "@heroicons/react/24/outline";
import ShareStatsModal from "./ShareStatsModal";

interface StatsProps {
  totalGames: number;
  wins: number;
  losses: number;
  averageAttempts: number;
}

const Stats: React.FC<StatsProps> = ({
  totalGames,
  wins,
  losses,
  averageAttempts,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const winRate =
    totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : "0.0";

  return (
    <>
      <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-sm">
        <div className="flex items-center gap-1.5">
          <TrophyIcon className="w-4 h-4 text-yellow-500" />
          <span className="text-gray-500">局</span>
          <span className="font-medium">{totalGames}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrophyIcon className="w-4 h-4 text-green-500" />
          <span className="text-gray-500">胜</span>
          <span className="font-medium">{wins}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XMarkIcon className="w-4 h-4 text-red-500" />
          <span className="text-gray-500">负</span>
          <span className="font-medium">{losses}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">胜率</span>
          <span className="font-medium">{winRate}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">平均</span>
          <span className="font-medium">{averageAttempts.toFixed(1)}</span>
        </div>
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ShareIcon className="w-4 h-4" />
          <span>分享</span>
        </button>
      </div>

      <ShareStatsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        stats={{ totalGames, wins, losses, averageAttempts }}
      />
    </>
  );
};

export default Stats;
