import { useState, useEffect } from "react";
import {
  GameRoom,
  VTuber,
  GuessResult,
  CHANCE_REDUCTION_INTERVAL,
} from "@vtuber-guessr/shared";
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { vtubers } from "@vtuber-guessr/shared";
import pinyin from "pinyin";
import GuessResultComponent from "./GuessResult";
import { GameOverModal } from "./GameOverModal";

interface MultiplayerGameProps {
  room: GameRoom;
  currentPlayerId: string;
  onGuess: (vtuber: VTuber) => void;
  onRestart: () => void;
  onLeave: () => void;
  onReady: () => void;
}

export function MultiplayerGame({
  room,
  currentPlayerId,
  onGuess,
  onRestart,
  onLeave,
  onReady,
}: MultiplayerGameProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<VTuber[]>([]);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(CHANCE_REDUCTION_INTERVAL);
  const [hasUsedChance, setHasUsedChance] = useState(false);

  const playButtonSound = () => {
    const audio = new Audio("/sounds/button.mp3");
    audio.play().catch((error) => console.log("Error playing sound:", error));
  };

  useEffect(() => {
    if (room.result) {
      setIsGameOverModalOpen(true);
    }
  }, [room.result]);

  useEffect(() => {
    if (room.status !== "playing") {
      setTimeLeft(CHANCE_REDUCTION_INTERVAL);
      setHasUsedChance(false);
      return;
    }

    const lastReduction = room.lastChanceReduction || Date.now();
    const elapsed = Date.now() - lastReduction;
    const remaining = Math.max(
      0,
      CHANCE_REDUCTION_INTERVAL - Math.floor(elapsed / 1000)
    );
    setTimeLeft(remaining);
    setHasUsedChance(!!room.playersUsedChance?.[currentPlayerId]);

    const timer = setInterval(() => {
      const newElapsed = Date.now() - lastReduction;
      const newRemaining = Math.max(
        0,
        CHANCE_REDUCTION_INTERVAL - Math.floor(newElapsed / 1000)
      );
      setTimeLeft(newRemaining);
      setHasUsedChance(!!room.playersUsedChance?.[currentPlayerId]);

      if (newRemaining === 0) {
        setTimeLeft(CHANCE_REDUCTION_INTERVAL);
        setHasUsedChance(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    room.status,
    room.lastChanceReduction,
    room.playersUsedChance,
    currentPlayerId,
  ]);

  const currentPlayer = room.players.find((p) => p.user.id === currentPlayerId);
  const isReady = currentPlayer?.ready || false;

  const preprocessRecords = (records: GuessResult[]) => {
    // 按时间倒序排序
    const sortedRecords = [...records].reverse();

    // 为每个记录添加玩家信息和设置 marker
    return sortedRecords.map((record) => ({
      ...record,
      marker: record.user?.id === currentPlayerId ? 1 : 2,
    }));
  };

  const processedRecords = preprocessRecords(room.records);

  const searchVtubers = (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    const queryLower = query.toLowerCase();

    const result = vtubers.filter((vtuber) => {
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
  };

  const handleModalClose = () => {
    setIsGameOverModalOpen(false);
  };

  const handleRestart = () => {
    setIsGameOverModalOpen(false);
    onRestart();
  };

  const handleReady = () => {
    playButtonSound();
    onReady();
  };

  const handleLeave = () => {
    playButtonSound();
    onLeave();
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 relative shadow-sm"
      >
        <div className="space-y-6">
          {/* Room Info Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="text-xs sm:text-sm font-medium text-gray-500">
                  房间 ID
                </span>
                <span className="text-xs sm:text-sm font-mono bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-gray-200 text-gray-700">
                  {room.id}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(room.status === "waiting" || room.status === "finished") && (
                  <motion.button
                    onClick={handleReady}
                    disabled={isReady}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors w-1/2 sm:w-auto ${
                      isReady
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    }`}
                    whileHover={!isReady ? { scale: 1.05 } : {}}
                    whileTap={!isReady ? { scale: 0.95 } : {}}
                    animate={
                      !isReady
                        ? {
                            boxShadow: [
                              "0 0 0 0 rgba(59, 130, 246, 0.4)",
                              "0 0 0 6px rgba(59, 130, 246, 0)",
                              "0 0 0 0 rgba(59, 130, 246, 0.4)",
                            ],
                          }
                        : {}
                    }
                    transition={
                      !isReady
                        ? {
                            boxShadow: {
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }
                        : {}
                    }
                  >
                    <UserCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{isReady ? "已准备" : "准备"}</span>
                  </motion.button>
                )}
                <button
                  onClick={handleLeave}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors w-1/2 sm:w-auto"
                >
                  <span>退出房间</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
              <div
                className={`flex items-center space-x-3 ${
                  room.result?.winner?.user.id === currentPlayerId
                    ? "ring-1 ring-green-500 ring-offset-1 rounded-lg p-1"
                    : ""
                }`}
              >
                <div className="relative">
                  <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                  {room.players.find((p) => p.user.id === currentPlayerId)
                    ?.ready && (
                    <CheckCircleIcon className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 text-green-500 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-medium text-gray-900 max-w-[5ch] sm:max-w-none">
                      {room.players.find((p) => p.user.id === currentPlayerId)
                        ?.user.name || "未知"}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono bg-white px-2 py-0.5 sm:py-1 rounded-md border border-gray-200 text-blue-600 font-semibold">
                    <span className="hidden sm:inline">剩余</span>{" "}
                    {room.players.find((p) => p.user.id === currentPlayerId)
                      ?.chance || 0}{" "}
                    <span className="hidden sm:inline">次机会</span>
                    <span className="sm:hidden">次</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                {/* Score Display */}
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {room.scores?.[currentPlayerId] || 0} :{" "}
                  {room.scores?.[
                    room.players.find((p) => p.user.id !== currentPlayerId)
                      ?.user.id || ""
                  ] || 0}
                </div>

                {/* Room Status */}
                <div
                  className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                    room.status === "waiting"
                      ? "bg-yellow-50 text-yellow-600"
                      : room.status === "finished"
                      ? "bg-gray-50 text-gray-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {room.status === "waiting"
                    ? "等待准备中"
                    : room.status === "finished"
                    ? "已结束"
                    : "进行中"}
                </div>
              </div>

              <div
                className={`flex items-center space-x-3 ${
                  room.result?.winner?.user.id !== currentPlayerId &&
                  room.result?.winner
                    ? "ring-1 ring-green-500 ring-offset-1 rounded-lg p-1"
                    : ""
                }`}
              >
                <div className="relative">
                  <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                  {room.players.find((p) => p.user.id !== currentPlayerId)
                    ?.ready && (
                    <CheckCircleIcon className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 text-green-500 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-medium text-gray-900 max-w-[5ch] sm:max-w-none">
                      {room.players.find((p) => p.user.id !== currentPlayerId)
                        ?.user.name || "等待对手加入"}
                    </span>
                  </div>
                  {room.players.find((p) => p.user.id !== currentPlayerId) && (
                    <span className="text-xs sm:text-sm font-mono bg-white px-2 py-0.5 sm:py-1 rounded-md border border-gray-200 text-red-600 font-semibold">
                      <span className="hidden sm:inline">剩余</span>{" "}
                      {room.players.find((p) => p.user.id !== currentPlayerId)
                        ?.chance || 0}{" "}
                      <span className="hidden sm:inline">次机会</span>
                      <span className="sm:hidden">次</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Timer Progress Bar */}
            {room.status === "playing" && (
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {hasUsedChance
                      ? "本轮机会已使用，你可以选择继续消耗机会"
                      : "请使用本轮猜测机会，倒计时结束视为放弃"}
                  </span>
                  <span>{timeLeft}s</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${
                      hasUsedChance ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${(timeLeft / CHANCE_REDUCTION_INTERVAL) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Search Section */}
            <div className="space-y-2 relative">
              <label className="block text-sm font-medium text-gray-700">
                搜索 VTuber
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchVtubers(e.target.value);
                  }}
                  placeholder="输入 VTuber 的名字..."
                  className="w-full pl-10 pr-4 py-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={
                    room.status === "waiting" ||
                    (room.players.find((p) => p.user.id === currentPlayerId)
                      ?.chance || 0) === 0
                  }
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && searchResults.length > 0) {
                      e.preventDefault();
                      const firstItem = document.querySelector(
                        ".search-result-item"
                      ) as HTMLElement;
                      firstItem?.focus();
                    }
                  }}
                />
              </div>

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10">
                  <div className="bg-white rounded-lg shadow-lg max-h-[40vh] overflow-y-auto border border-gray-200">
                    {searchResults.map((vtuber, index) => (
                      <button
                        key={vtuber.id}
                        onClick={() => {
                          onGuess(vtuber);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full p-2 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50 search-result-item"
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            const next = searchResults[index + 1];
                            if (next) {
                              const nextElement = (e.target as HTMLElement)
                                .nextElementSibling as HTMLElement;
                              nextElement?.focus();
                            }
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            const prev = searchResults[index - 1];
                            if (prev) {
                              const prevElement = (e.target as HTMLElement)
                                .previousElementSibling as HTMLElement;
                              prevElement?.focus();
                            } else {
                              // 如果到达第一个选项，焦点回到输入框
                              const input = document.querySelector(
                                'input[type="text"]'
                              ) as HTMLElement;
                              input?.focus();
                            }
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            onGuess(vtuber);
                            setSearchQuery("");
                            setSearchResults([]);
                          }
                        }}
                      >
                        <div className="font-medium text-sm">{vtuber.name}</div>
                        <div className="text-xs text-gray-500">
                          {vtuber.agency}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-sm"
      >
        <h2 className="text-base sm:text-lg font-bold mb-2">猜测记录</h2>
        <div className="space-y-4">
          <div className="overflow-x-auto">
            {/* Desktop table */}
            {processedRecords.length > 0 ? (
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b border-gray-200">
                    {processedRecords[0]?.differences
                      .filter(
                        (diff: { attribute: string }) =>
                          diff.attribute !== "标签"
                      )
                      .map((diff: { attribute: string }, index: number) => (
                        <th
                          key={index}
                          className="py-1.5 px-1.5 text-left text-xs font-medium text-gray-700 border-r border-gray-100 last:border-r-0"
                        >
                          {diff.attribute}
                        </th>
                      ))}
                    <th className="py-1.5 pl-2 pr-1.5 text-left text-xs font-medium text-gray-700">
                      标签
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedRecords.map((result, index) => (
                    <GuessResultComponent
                      key={index}
                      result={result}
                      isMobile={false}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4 hidden md:block">
                暂无猜测记录
              </div>
            )}

            {/* Mobile cards */}
            {processedRecords.length > 0 ? (
              <div className="md:hidden">
                {processedRecords.map((result, index) => (
                  <GuessResultComponent
                    key={index}
                    result={result}
                    isMobile={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4 md:hidden">
                暂无猜测记录
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {room.result && (
        <GameOverModal
          isOpen={isGameOverModalOpen}
          onClose={handleModalClose}
          answer={room.result?.answer || null}
          onRestart={handleRestart}
          onUpdate={() => {}}
          isCorrect={room.result?.winner?.user.id === currentPlayerId}
        />
      )}
    </div>
  );
}
