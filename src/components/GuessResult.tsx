import React from "react";
import { GuessResult as GuessResultType } from "../types/vtuber";

interface GuessResultProps {
  result: GuessResultType;
}

const GuessResult: React.FC<GuessResultProps> = ({ result }) => {
  return (
    <div className="p-2 border border-gray-200 rounded-lg bg-white">
      <div className="flex flex-wrap gap-2">
        {result.differences.map((diff, index) => (
          <div
            key={index}
            className={`px-3 py-1 rounded-full text-sm ${
              diff.isMatch
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {diff.attribute === "标签"
              ? diff.value
              : diff.attribute === "名字"
              ? diff.value
              : `${diff.attribute}: ${diff.value}`}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuessResult;
