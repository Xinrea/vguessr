import React from "react";
import { GuessResult as GuessResultType } from "../types/vtuber";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

interface GuessResultProps {
  result: GuessResultType;
  isMobile?: boolean;
}

const GuessResult: React.FC<GuessResultProps> = ({
  result,
  isMobile = false,
}) => {
  // Separate tags from other attributes
  const tags = result.differences.filter((diff) => diff.attribute === "标签");
  const otherAttributes = result.differences.filter(
    (diff) => diff.attribute !== "标签"
  );

  const renderHintIcon = (hint?: "higher" | "lower" | "equal") => {
    if (!hint) return null;
    const className = "w-3 h-3 ml-1";
    const tooltipText = {
      higher: "在这之上",
      lower: "在这之下",
      equal: "相等",
    }[hint];

    const icon = {
      higher: <ArrowUpIcon className={className} />,
      lower: <ArrowDownIcon className={className} />,
      equal: <MinusIcon className={className} />,
    }[hint];

    return (
      <div className="group relative">
        {icon}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="p-2 border-b border-gray-100 last:border-b-0">
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          {otherAttributes.map((attr, index) => (
            <div key={index}>
              <div className="text-[10px] text-gray-500 mb-0.5">
                {attr.attribute}
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap flex items-center ${
                  attr.isMatch
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {attr.value}
                {renderHintIcon(attr.hint)}
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
    );
  }

  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      {otherAttributes.map((attr, index) => (
        <td
          key={index}
          className="py-1 px-1.5 border-r border-gray-100 last:border-r-0"
        >
          <div
            className={`px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap flex items-center ${
              attr.isMatch
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {attr.value}
            {renderHintIcon(attr.hint)}
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
  );
};

export default GuessResult;
