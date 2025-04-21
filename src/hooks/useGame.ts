import { useState, useEffect } from "react";
import { VTuber, GuessResult } from "@/types/vtuber";
import { vtubers } from "@/data/vtubers";

const MAX_ATTEMPTS = 6;

export function useGame() {
  const [targetVtuber, setTargetVtuber] = useState<VTuber | null>(null);
  const [attempts, setAttempts] = useState<VTuber[]>([]);
  const [guessResults, setGuessResults] = useState<GuessResult[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [searchResults, setSearchResults] = useState<VTuber[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const getRandomVtuber = (): VTuber => {
    const randomIndex = Math.floor(Math.random() * vtubers.length);
    return vtubers[randomIndex];
  };

  const searchVtubers = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    // 使用本地数据进行搜索
    const result = vtubers.filter(
      (vtuber) =>
        vtuber.name.toLowerCase().includes(query.toLowerCase()) ||
        vtuber.nameEN.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(result);
  };

  const startNewGame = () => {
    setTargetVtuber(null);
    setAttempts([]);
    setGuessResults([]);
    setIsGameOver(false);
    setSearchResults([]);
    setSearchQuery("");
  };

  const checkGuess = (guess: VTuber): GuessResult => {
    // Generate target VTuber if it's the first guess
    let target = targetVtuber;
    if (!target) {
      const vtuber = getRandomVtuber();
      setTargetVtuber(vtuber);
      target = vtuber;
    }

    const nameMatch = guess.name
      .split("")
      .map((char, index) => target.name[index] === char);

    const differences: GuessResult["differences"] = [];

    // 添加名字
    differences.push({
      attribute: "名字",
      value: guess.name,
      isMatch: guess.name === target.name,
    });

    // 检查性别
    differences.push({
      attribute: "性别",
      value: guess.gender,
      isMatch: guess.gender === target.gender,
    });

    // 检查生日
    // 只保留字符串中的数字，然后再进行比较
    const guessBirthDate = guess.birthDate.replace(/\D/g, "");
    const targetBirthDate = target.birthDate.replace(/\D/g, "");
    const guessBirthDateNum = parseInt(guessBirthDate, 10);
    const targetBirthDateNum = parseInt(targetBirthDate, 10);
    const birthDateMatch = guessBirthDateNum === targetBirthDateNum;
    const birthDateHint = !birthDateMatch
      ? guessBirthDateNum > targetBirthDateNum
        ? "↓"
        : "↑"
      : "";
    differences.push({
      attribute: "生日",
      value: `${guess.birthDate}${birthDateHint}`,
      isMatch: birthDateMatch,
    });

    // 检查出道时间
    const debutDateMatch = guess.debutDate === target.debutDate;
    const debutDateHint = !debutDateMatch
      ? guess.debutDate > target.debutDate
        ? "↓"
        : "↑"
      : "";

    differences.push({
      attribute: "出道时间",
      value: `${guess.debutDate}${debutDateHint}`,
      isMatch: debutDateMatch,
    });

    // 检查身高
    const heightMatch = guess.height === target.height;
    const heightHint = !heightMatch
      ? guess.height > target.height
        ? "↓"
        : "↑"
      : "";
    differences.push({
      attribute: "身高",
      value: `${guess.height}${heightHint}`,
      isMatch: heightMatch,
    });

    // 检查发色
    differences.push({
      attribute: "发色",
      value: guess.hairColor,
      isMatch: guess.hairColor === target.hairColor,
    });

    // 检查瞳色
    differences.push({
      attribute: "瞳色",
      value: guess.eyeColor,
      isMatch: guess.eyeColor === target.eyeColor,
    });

    differences.push({
      attribute: "星座",
      value: guess.seiza,
      isMatch: guess.seiza === target.seiza,
    });

    // 检查标签
    if (guess.tags) {
      // 为每个标签创建一个单独的差异项
      guess.tags.forEach((tag) => {
        const isMatch = target.tags?.includes(tag) || false;
        differences.push({
          attribute: "标签",
          value: tag,
          isMatch,
        });
      });
    }

    return {
      isCorrect: guess.id === target.id,
      name: guess.name,
      nameMatch,
      differences,
    };
  };

  const submitGuess = (guess: VTuber) => {
    const result = checkGuess(guess);
    setAttempts((prev) => [guess, ...prev]);
    setGuessResults((prev) => [result, ...prev]);
    setSearchQuery("");
    setSearchResults([]);

    if (result.isCorrect || attempts.length + 1 >= MAX_ATTEMPTS) {
      setIsGameOver(true);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      searchVtubers(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

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
  };
}
