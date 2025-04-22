"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/hooks/useGame";
import { GameOverModal } from "@/components/GameOverModal";
import GuessResult from "@/components/GuessResult";
import Stats from "@/components/Stats";
import AddVtuberModal from "@/components/AddVtuberModal";
import {
  CodeBracketIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { vtubers } from "@/data/vtubers";

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
    addVtuber,
    stats,
  } = useGame();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900">
      <div className="container mx-auto px-2 py-6 sm:py-10 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl sm:text-4xl font-bold">VTuber Guessr</h1>
          </div>
          <Stats {...stats} />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 relative shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                <label className="block text-sm font-medium text-gray-700">
                  搜索 VTuber
                </label>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>申请添加新 VTuber 信息</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-sm ml-auto sm:ml-0">
                    <span className="text-gray-500">剩余次数</span>
                    <span className="font-medium text-blue-600">
                      {6 - attempts.length}
                    </span>
                  </div>
                </div>
              </div>
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
                <div className="absolute left-0 right-0 mt-0.5 z-10 mx-6">
                  <div className="bg-white rounded-lg shadow-lg max-h-[40vh] overflow-y-auto border border-gray-200">
                    {searchResults.map((vtuber, index) => (
                      <button
                        key={vtuber.id}
                        onClick={() => submitGuess(vtuber)}
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
                            submitGuess(vtuber);
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm"
          >
            <h2 className="text-base sm:text-lg font-bold mb-2">猜测历史</h2>
            <div className="overflow-x-auto">
              {/* Desktop table */}
              {guessResults.length > 0 ? (
                <table className="w-full hidden md:table">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {guessResults[0]?.differences
                        .filter((diff) => diff.attribute !== "标签")
                        .map((diff, index) => (
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
                    {guessResults.map((result, index) => (
                      <GuessResult
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
              {guessResults.length > 0 ? (
                <div className="md:hidden">
                  {guessResults.map((result, index) => (
                    <GuessResult key={index} result={result} isMobile={true} />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4 md:hidden">
                  暂无猜测记录
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <GameOverModal
          isOpen={isGameOver}
          onClose={() => {}}
          answer={targetVtuber}
          onRestart={startNewGame}
          onUpdate={updateVtuber}
          isCorrect={guessResults.length > 0 && guessResults[0].isCorrect}
        />

        <AddVtuberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={addVtuber}
          existingVtubers={vtubers}
        />

        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <CodeBracketIcon className="w-4 h-4" />
            <a
              href="https://github.com/Xinrea/vguessr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
            >
              GitHub
            </a>
            <span>·</span>
            <span>
              Created by{" "}
              <a
                href="https://space.bilibili.com/475210"
                target="_blank"
                rel="noopener noreferrer"
              >
                @Xinrea
              </a>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
