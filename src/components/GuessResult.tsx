import React from "react";
import { GuessResult as GuessResultType, VTuber } from "@vtuber-guessr/shared";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

interface GuessResultProps {
  vtuber: VTuber | undefined;
  result: GuessResultType;
  isMobile?: boolean;
  onEdit?: (vtuber: VTuber) => void;
}

const GuessResult: React.FC<GuessResultProps> = ({
  vtuber,
  result,
  isMobile = false,
  onEdit,
}) => {
  // Separate tags from other attributes
  const tags = result.differences
    .filter((diff) => diff.attribute === "标签")
    .sort((a, b) => (b.isMatch ? 1 : 0) - (a.isMatch ? 1 : 0));
  const otherAttributes = result.differences.filter(
    (diff) => diff.attribute !== "标签"
  );

  const getBGStyle = () => {
    switch (result.marker) {
      case 1:
        return "bg-blue-50";
      case 2:
        return "bg-white";
      default:
        return "bg-white";
    }
  };

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
      <div
        className={`p-2 border-b border-gray-100 last:border-b-0 ${getBGStyle()}`}
      >
        <div className="mb-1.5">
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              if (vtuber) {
                onEdit?.(vtuber);
              }
            }}
          >
            <PencilIcon className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">编辑</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          {otherAttributes.map((attr, index) => (
            <div key={index}>
              <div className="text-[10px] text-gray-500 mb-0.5">
                {attr.attribute}
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap flex items-center ${
                  attr.isMatch
                    ? "bg-green-50 text-green-700 border-2 border-green-400 rounded-md animate-pulse-subtle"
                    : "bg-red-50 text-red-700 border border-red-200 rounded-full"
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
                    ? "bg-green-50 text-green-700 border-2 border-green-400 rounded-md animate-pulse-subtle"
                    : "bg-red-50 text-red-700 border border-red-200 rounded-full"
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
    <tr className={`border-b border-gray-100 last:border-b-0 ${getBGStyle()}`}>
      <td className="py-1 px-1.5 border-r border-gray-100 last:border-r-0">
        <div className="mb-1.5">
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              if (vtuber) {
                onEdit?.(vtuber);
              }
            }}
          >
            <PencilIcon className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </td>
      {otherAttributes.map((attr, index) => (
        <td
          key={index}
          className="py-1 px-1.5 border-r border-gray-100 last:border-r-0"
        >
          <div
            className={`px-1.5 py-0.5 rounded-full text-xs whitespace-nowrap flex items-center ${
              attr.isMatch
                ? "bg-green-50 text-green-700 border-2 border-green-400 rounded-md animate-pulse-subtle"
                : "bg-red-50 text-red-700 border border-red-200 rounded-full"
            }`}
          >
            {attr.value}
            {renderHintIcon(attr.hint)}
          </div>
        </td>
      ))}
      <td className="py-1 pl-2 pr-1.5 align-middle w-1/4">
        <div className="flex gap-0.5 overflow-x-auto whitespace-nowrap items-center h-full">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`px-1.5 py-0.5 rounded-full text-xs flex-shrink-0 ${
                tag.isMatch
                  ? "bg-green-50 text-green-700 border-2 border-green-400 rounded-md animate-pulse-subtle"
                  : "bg-red-50 text-red-700 border border-red-200 rounded-full"
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
