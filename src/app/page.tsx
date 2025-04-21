"use client";

import { motion } from "framer-motion";
import { useGame } from "@/hooks/useGame";
import { GameOverModal } from "@/components/GameOverModal";
import GuessResult from "@/components/GuessResult";

export default function Home() {
  const {
    targetVtuber,
    attempts,
    guessResults,
    isGameOver,
    searchResults,
    searchQuery,
    setSearchQuery,
    submitGuess,
    startNewGame,
  } = useGame();

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <div className="flex flex-col items-center mb-6">
          <a
            href="https://github.com/xinreasuper/vtuber-guessr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <span className="text-lg">GitHub</span>
          </a>
          <p className="text-center text-gray-600 max-w-lg">
            一个有趣的 VTuber 猜谜游戏！测试你对 VTuber 的了解程度，看看你能在 6
            次尝试内猜出目标 VTuber 吗？
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold">VTuber Guessr</h1>
          <div className="text-lg sm:text-xl">
            剩余尝试次数: {6 - attempts.length}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-4 sm:p-6 relative shadow-sm"
          >
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  搜索 VTuber
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入 VTuber 的名字..."
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 z-10 mx-4">
                  <div className="bg-white rounded-lg shadow-lg max-h-[60vh] overflow-y-auto border border-gray-200">
                    {searchResults.map((vtuber) => (
                      <button
                        key={vtuber.id}
                        onClick={() => submitGuess(vtuber)}
                        className="w-full p-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-base">
                          {vtuber.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vtuber.agency}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-4 sm:p-6 shadow-sm"
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              猜测历史
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {guessResults.map((result, index) => (
                <GuessResult key={index} result={result} />
              ))}
            </div>
          </motion.div>
        </div>

        <GameOverModal
          isOpen={isGameOver}
          onClose={() => {}}
          answer={targetVtuber}
          onRestart={startNewGame}
        />
      </div>
    </main>
  );
}
