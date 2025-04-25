import { getGitHubToken } from "../config";
import {
  getOpenPullRequests,
  mergePullRequest,
  deleteBranch,
  getPullRequestDetails,
  createPullRequestComment,
  getPullRequestComments,
  REPO_OWNER,
  getPullRequestChecks,
} from "./github";

export class PRAutoMergeService {
  private static instance: PRAutoMergeService;
  private interval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): PRAutoMergeService {
    if (!PRAutoMergeService.instance) {
      PRAutoMergeService.instance = new PRAutoMergeService();
    }
    return PRAutoMergeService.instance;
  }

  public start() {
    if (this.interval) {
      return;
    }

    // 每10分钟检查一次
    this.interval = setInterval(async () => {
      try {
        await this.checkAndMergePRs();
      } catch (error) {
        console.error("Error in PR auto-merge check:", error);
      }
    }, 10 * 60 * 1000);

    // 立即执行一次
    this.checkAndMergePRs().catch((error) => {
      console.error("Error in initial PR auto-merge check:", error);
    });
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkAndMergePRs() {
    const token = await getGitHubToken();
    const result = await getOpenPullRequests(token);

    if (!result.success || !result.data) {
      console.error("Failed to get open PRs:", result.error);
      return;
    }

    for (const pr of result.data) {
      const { "+1": thumbsUp, "-1": thumbsDown } = pr.reactions || {
        "+1": 0,
        "-1": 0,
      };

      // 如果踩数量达到5，关闭PR并删除分支
      if (thumbsDown >= 5) {
        console.log(
          `PR #${pr.number} has ${thumbsDown} thumbs down, closing PR and deleting branch`
        );

        // 获取 PR 详情以获取分支名
        const detailsResult = await getPullRequestDetails(token, pr.number);
        if (!detailsResult.success || !detailsResult.data) {
          console.error(
            `Failed to get PR #${pr.number} details:`,
            detailsResult.error
          );
          continue;
        }

        const branchName = detailsResult.data.head.ref;

        // 删除分支
        const deleteResult = await deleteBranch(token, branchName);
        if (!deleteResult.success) {
          console.error(
            `Failed to delete branch ${branchName} for PR #${pr.number}:`,
            deleteResult.error
          );
          continue;
        }

        console.log(
          `Successfully deleted branch ${branchName} for PR #${pr.number}`
        );
        continue;
      }

      // 检查 +1 数量是否是 -1 的两倍
      if (thumbsUp >= thumbsDown * 2 && thumbsUp - thumbsDown >= 3) {
        console.log(
          `Checking PR #${pr.number} with ${thumbsUp} thumbs up and ${thumbsDown} thumbs down`
        );

        // 检查 GitHub Actions 状态
        const checksResult = await getPullRequestChecks(token, pr.number);
        if (!checksResult.success || !checksResult.data) {
          console.error(
            `Failed to get PR #${pr.number} checks:`,
            checksResult.error
          );
          continue;
        }

        const hasFailedChecks = checksResult.data.some(
          (check: { name: string; conclusion: string }) =>
            check.conclusion === "failure"
        );
        if (hasFailedChecks) {
          console.log(
            `PR #${pr.number} has failed checks, skipping auto-merge`
          );
          continue;
        }

        // 获取 PR 详情以获取分支名和合并状态
        const detailsResult = await getPullRequestDetails(token, pr.number);
        if (!detailsResult.success || !detailsResult.data) {
          console.error(
            `Failed to get PR #${pr.number} details:`,
            detailsResult.error
          );
          continue;
        }

        const branchName = detailsResult.data.head.ref;
        const mergeable = detailsResult.data.mergeable;

        // 检查是否可以合并
        if (mergeable === false) {
          // 检查是否已经发送过冲突通知
          const commentsResult = await getPullRequestComments(token, pr.number);
          if (!commentsResult.success || !commentsResult.data) {
            console.error(
              `Failed to get PR #${pr.number} comments:`,
              commentsResult.error
            );
            continue;
          }

          const hasConflictNotification = commentsResult.data.some((comment) =>
            comment.body.includes(`<!-- BOT_COMMENT -->`)
          );

          if (hasConflictNotification) {
            console.log(
              `PR #${pr.number} already has a conflict notification, skipping`
            );
            continue;
          }

          console.log(
            `PR #${pr.number} has conflicts that must be resolved, notifying @${REPO_OWNER}`
          );
          const commentResult = await createPullRequestComment(
            token,
            pr.number,
            `@${REPO_OWNER} 这个 PR 有冲突需要解决，请处理一下捏。\n<!-- BOT_COMMENT -->`
          );
          if (!commentResult.success) {
            console.error(
              `Failed to add comment to PR #${pr.number}:`,
              commentResult.error
            );
          }
          continue;
        } else if (mergeable === null) {
          console.log(
            `PR #${pr.number} merge status is still being calculated, skipping for now`
          );
          continue;
        }

        // 尝试合并 PR
        const mergeResult = await mergePullRequest(token, pr.number);
        if (!mergeResult.success) {
          console.error(`Failed to merge PR #${pr.number}:`, mergeResult.error);
          continue;
        }

        console.log(`Successfully merged PR #${pr.number}`);

        // 删除分支
        const deleteResult = await deleteBranch(token, branchName);
        if (!deleteResult.success) {
          console.error(
            `Failed to delete branch ${branchName} for PR #${pr.number}:`,
            deleteResult.error
          );
          continue;
        }

        console.log(
          `Successfully deleted branch ${branchName} for PR #${pr.number}`
        );
      }
    }
  }
}
