"use client";

import { motion } from "framer-motion";
import { useGame } from "@/hooks/useGame";
import { GameOverModal } from "@/components/GameOverModal";
import GuessResult from "@/components/GuessResult";
import {
  CodeBracketIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

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
    updateVtuber,
  } = useGame();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-2xl">
        <div className="flex flex-col items-center mb-8">
          <a
            href="https://github.com/xinreasuper/vtuber-guessr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <CodeBracketIcon className="w-5 h-5" />
            <span className="text-lg">GitHub</span>
          </a>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl sm:text-4xl font-bold">VTuber Guessr</h1>
          </div>
          <div className="flex items-center gap-2 text-lg sm:text-xl bg-white px-4 py-2 rounded-full shadow-sm">
            <span className="text-gray-600">剩余尝试次数:</span>
            <span className="font-semibold text-blue-600">
              {6 - attempts.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 relative shadow-sm"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  搜索 VTuber
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="输入 VTuber 的名字..."
                    className="w-full pl-10 pr-4 py-2.5 text-base rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 z-10 mx-6">
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
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-4">猜测历史</h2>
            <div className="space-y-4">
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
          onUpdate={updateVtuber}
        />
      </div>
    </main>
  );
}
