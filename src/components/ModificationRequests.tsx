import { useState, useEffect } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  PencilIcon,
  PlusIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";
import {
  getPullRequests,
  getPullRequestDiff,
  PullRequest,
} from "@/services/github";

interface PullRequestWithDiff extends PullRequest {
  diff?: string;
  isDiffLoading?: boolean;
  diffError?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} 分钟前`;
    }
    const hours = Math.floor(diffInHours);
    return `${hours} 小时前`;
  }

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function ModificationRequests() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pullRequests, setPullRequests] = useState<PullRequestWithDiff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded) {
      fetchPullRequests();
    }
  }, [isExpanded]);

  const fetchPullRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = process.env.PR_TOKEN || "";
      if (!token) {
        throw new Error("GitHub token not found. Please login first.");
      }
      const prs = await getPullRequests(token);
      setPullRequests(prs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch pull requests"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDiff = async (pr: PullRequestWithDiff) => {
    if (pr.diff !== undefined) {
      // If diff is already loaded, just toggle it
      setPullRequests((prs) =>
        prs.map((p) => (p.id === pr.id ? { ...p, diff: undefined } : p))
      );
      return;
    }

    // Start loading diff
    setPullRequests((prs) =>
      prs.map((p) =>
        p.id === pr.id ? { ...p, isDiffLoading: true, diffError: undefined } : p
      )
    );

    try {
      const token = process.env.PR_TOKEN || "";
      if (!token) {
        throw new Error("GitHub token not found. Please login first.");
      }
      const diff = await getPullRequestDiff(token, pr.number);
      setPullRequests((prs) =>
        prs.map((p) =>
          p.id === pr.id ? { ...p, diff, isDiffLoading: false } : p
        )
      );
    } catch (err) {
      setPullRequests((prs) =>
        prs.map((p) =>
          p.id === pr.id
            ? {
                ...p,
                diffError:
                  err instanceof Error ? err.message : "Failed to load diff",
                isDiffLoading: false,
              }
            : p
        )
      );
    }
  };

  const formatDiff = (diff: string) => {
    return diff.split("\n").map((line, index) => {
      let className = "text-gray-600";
      if (line.startsWith("+")) {
        className = "text-green-600 bg-green-50";
      } else if (line.startsWith("-")) {
        className = "text-red-600 bg-red-50";
      } else if (line.startsWith("@@")) {
        className = "text-blue-600 bg-blue-50";
      }
      return (
        <div key={index} className={`font-mono text-xs ${className}`}>
          {line}
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold">最近修改请求</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchPullRequests();
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="刷新"
          >
            <ArrowPathIcon className="w-5 h-5 text-gray-500" />
          </button>
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="mt-4">
          <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-700">
            <p>
              PS：这里显示的是最近提交的修改请求，你可以点击标题前往 GitHub
              进行点赞/踩或评论，如果有熟悉的 VTuber 的改动请积极参与审查；
              已合并的改动并不意味着已经发布，PVP
              服务器和网页会每两小时更新一次。
            </p>
          </div>
          {isLoading ? (
            <div className="text-sm text-gray-500">加载中...</div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : pullRequests.length === 0 ? (
            <div className="text-sm text-gray-500">暂无修改请求</div>
          ) : (
            <div className="space-y-3">
              {pullRequests.map((pr) => (
                <div key={pr.id} className="space-y-2">
                  <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {pr.title.startsWith("Update") ? (
                            <PencilIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          ) : (
                            <PlusIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          )}
                          <a
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                          >
                            {pr.title}
                          </a>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span
                            title={new Date(pr.created_at).toLocaleString(
                              "zh-CN"
                            )}
                          >
                            {formatDate(pr.created_at)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <HandThumbUpIcon className="w-3.5 h-3.5" />
                            {pr.reactions?.["+1"] || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <HandThumbDownIcon className="w-3.5 h-3.5" />
                            {pr.reactions?.["-1"] || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDiff(pr);
                          }}
                          className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          {pr.diff ? "隐藏改动" : "显示改动"}
                        </button>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            pr.state === "open"
                              ? "bg-green-100 text-green-800"
                              : !!pr.merged_at
                              ? "bg-purple-100 text-purple-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pr.state === "open"
                            ? "开放中"
                            : !!pr.merged_at
                            ? "已合并"
                            : "已拒绝"}
                        </span>
                      </div>
                    </div>
                    {pr.isDiffLoading && (
                      <div className="text-sm text-gray-500 pl-3">
                        加载改动中...
                      </div>
                    )}
                    {pr.diffError && (
                      <div className="text-sm text-red-500 pl-3">
                        {pr.diffError}
                      </div>
                    )}
                    {pr.diff && (
                      <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto border border-gray-200">
                        <pre className="text-xs">{formatDiff(pr.diff)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
