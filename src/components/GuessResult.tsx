import React from "react";
import { GuessResult as GuessResultType } from "../types/vtuber";

interface GuessResultProps {
  result: GuessResultType;
}

const GuessResult: React.FC<GuessResultProps> = ({ result }) => {
  // Separate tags from other attributes
  const tags = result.differences.filter((diff) => diff.attribute === "标签");
  const otherAttributes = result.differences.filter(
    (diff) => diff.attribute !== "标签"
  );

  return (
    <>
      {/* Desktop table row */}
      <tr className="border-b border-gray-100 last:border-b-0 hidden md:table-row">
        {otherAttributes.map((attr, index) => (
          <td
            key={index}
            className="py-1 px-1.5 border-r border-gray-100 last:border-r-0"
          >
            <div
              className={`px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap ${
                attr.isMatch
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {attr.value}
            </div>
          </td>
        ))}
        <td className="py-1 pl-2 pr-1.5 align-top w-1/4">
          <div className="flex gap-0.5 overflow-x-auto whitespace-nowrap">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`px-1.5 py-0.5 rounded-full text-xs flex-shrink-0 ${
                  tag.isMatch
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {tag.value}
              </span>
            ))}
          </div>
        </td>
      </tr>

      {/* Mobile card */}
      <div className="md:hidden p-2 border-b border-gray-100 last:border-b-0">
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          {otherAttributes.map((attr, index) => (
            <div key={index}>
              <div className="text-[10px] text-gray-500 mb-0.5">
                {attr.attribute}
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap ${
                  attr.isMatch
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {attr.value}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[10px] text-gray-500 mb-0.5">标签</div>
          <div className="flex flex-wrap gap-0.5">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  tag.isMatch
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {tag.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default GuessResult;
