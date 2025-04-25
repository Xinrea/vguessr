import { VTuber } from "@vtuber-guessr/shared";
import { v4 as uuidv4 } from "uuid";
import { Result } from "../../src/types";

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  merged_at: string | null;
  reactions?: {
    "+1": number;
    "-1": number;
  };
}

interface GitHubUser {
  login: string;
  avatar_url: string;
}

interface GitHubPullRequest {
  merged_at: string | null;
}

interface GitHubSearchItem {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  user: GitHubUser;
  pull_request?: GitHubPullRequest;
  reactions?: {
    "+1": number;
    "-1": number;
  };
}

interface GitHubSearchResponse {
  items: GitHubSearchItem[];
}

const GITHUB_API_URL = "https://api.github.com";
export const REPO_OWNER = "Xinrea";
const REPO_NAME = "vguessr";

export async function createPullRequest(
  vtuber: VTuber,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const branchName = `update-vtuber-${uuidv4()}`;
  const commitMessage = `Update VTuber: ${vtuber.name}`;
  const prTitle = `Update VTuber: ${vtuber.name}`;
  const prBody = `Update VTuber information for ${vtuber.name}`;

  // 1. 创建或获取分支
  const baseBranch = "main";
  const baseRefResponse = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${baseBranch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!baseRefResponse.ok) {
    const errorData = await baseRefResponse.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to get base branch: ${baseRefResponse.status} ${
        baseRefResponse.statusText
      }. ${errorData.message || ""}`,
    };
  }

  const baseRef = await baseRefResponse.json();
  if (!baseRef?.object?.sha) {
    return { success: false, error: "Invalid base branch reference" };
  }

  // Check if branch exists and delete it if it does
  const checkBranchResponse = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${branchName}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (checkBranchResponse.ok) {
    // Branch exists, delete it
    const deleteResponse = await fetch(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${branchName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json().catch(() => ({}));
      return {
        success: false,
        error: `Failed to delete existing branch: ${deleteResponse.status} ${
          deleteResponse.statusText
        }. ${errorData.message || ""}`,
      };
    }
  }

  // Create new branch
  const createBranchResponse = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      }),
    }
  );

  if (!createBranchResponse.ok) {
    const errorData = await createBranchResponse.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to create branch: ${createBranchResponse.status} ${
        createBranchResponse.statusText
      }. ${errorData.message || ""}`,
    };
  }

  // 2. 更新文件
  const filePath = "shared/src/vtubers.json";
  const fileContent = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${branchName}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
    }
  ).then((res) => res.json());

  // 读取当前文件内容
  const currentContent = Buffer.from(fileContent.content, "base64").toString(
    "utf-8"
  );

  // 解析当前 JSON 内容
  const vtubers = JSON.parse(currentContent);

  // 找到并更新对应的 VTuber
  const index = vtubers.findIndex((v: VTuber) => v.id === vtuber.id);
  if (index === -1) {
    return { success: false, error: `VTuber with id ${vtuber.id} not found` };
  }

  // 更新 VTuber 数据
  vtubers[index] = vtuber;

  // 转换为格式化的 JSON 字符串
  const updatedContent = JSON.stringify(vtubers, null, 2);

  // 提交更改
  const updateResponse = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(updatedContent, "utf-8").toString("base64"),
        branch: branchName,
        sha: fileContent.sha,
      }),
    }
  );

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to update file: ${updateResponse.status} ${
        updateResponse.statusText
      }. ${errorData.message || ""}`,
    };
  }

  // 3. 创建 PR
  const prResponse = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        title: prTitle,
        body: prBody,
        head: branchName,
        base: baseBranch,
      }),
    }
  );

  if (!prResponse.ok) {
    const errorData = await prResponse.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to create pull request: ${prResponse.status} ${
        prResponse.statusText
      }. ${errorData.message || ""}`,
    };
  }

  return { success: true };
}

export async function createAddVtuberPullRequest(
  vtuber: VTuber,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const branchName = `add-vtuber-${uuidv4()}`;
  const commitMessage = `Add new VTuber: ${vtuber.name}`;
  const prTitle = `Add new VTuber: ${vtuber.name}`;
  const prBody = `Add new VTuber information for ${vtuber.name}`;

  // 1. 创建或获取分支
  const baseBranch = "main";
  const baseRefResponse = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${baseBranch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!baseRefResponse.ok) {
    const errorData = await baseRefResponse.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to get base branch: ${baseRefResponse.status} ${
        baseRefResponse.statusText
      }. ${errorData.message || ""}`,
    };
  }

  const baseRef = await baseRefResponse.json();
  if (!baseRef?.object?.sha) {
    return { success: false, error: "Invalid base branch reference" };
  }

  // Check if branch exists and delete it if it does
  const checkBranchResponse = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${branchName}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (checkBranchResponse.ok) {
    // Branch exists, delete it
    const deleteResponse = await fetch(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${branchName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json().catch(() => ({}));
      return {
        success: false,
        error: `Failed to delete existing branch: ${deleteResponse.status} ${
          deleteResponse.statusText
        }. ${errorData.message || ""}`,
      };
    }
  }

  // Create new branch
  const createBranchResponse = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      }),
    }
  );

  if (!createBranchResponse.ok) {
    const errorData = await createBranchResponse.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to create branch: ${createBranchResponse.status} ${
        createBranchResponse.statusText
      }. ${errorData.message || ""}`,
    };
  }

  // 2. 更新文件
  const filePath = "shared/src/vtubers.json";
  const fileContent = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${branchName}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
    }
  ).then((res) => res.json());

  // 读取当前文件内容
  const currentContent = Buffer.from(fileContent.content, "base64").toString(
    "utf-8"
  );

  // 解析当前 JSON 内容
  const vtubers = JSON.parse(currentContent);

  // 添加新的 VTuber
  vtubers.push(vtuber);

  // 转换为格式化的 JSON 字符串
  const updatedContent = JSON.stringify(vtubers, null, 2);

  // 提交更改
  const updateResponse = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(updatedContent, "utf-8").toString("base64"),
        branch: branchName,
        sha: fileContent.sha,
      }),
    }
  );

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to update file: ${updateResponse.status} ${
        updateResponse.statusText
      }. ${errorData.message || ""}`,
    };
  }

  // 3. 创建 PR
  const prResponse = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        title: prTitle,
        body: prBody,
        head: branchName,
        base: baseBranch,
      }),
    }
  );

  if (!prResponse.ok) {
    const errorData = await prResponse.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to create pull request: ${prResponse.status} ${
        prResponse.statusText
      }. ${errorData.message || ""}`,
    };
  }

  return { success: true };
}

export async function getPullRequests(
  token: string
): Promise<{ success: boolean; data?: PullRequest[]; error?: string }> {
  const [openResponse, closedResponse] = await Promise.all([
    fetch(
      `${GITHUB_API_URL}/search/issues?q=repo:${REPO_OWNER}/${REPO_NAME}+type:pr+state:open+Update+OR+Add&sort=created&order=desc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    ),
    fetch(
      `${GITHUB_API_URL}/search/issues?q=repo:${REPO_OWNER}/${REPO_NAME}+type:pr+state:closed+Update+OR+Add&per_page=5&sort=created&order=desc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    ),
  ]);

  if (!openResponse.ok || !closedResponse.ok) {
    const errorData = await (openResponse.ok ? closedResponse : openResponse)
      .json()
      .catch(() => ({}));
    return {
      success: false,
      error: `Failed to fetch pull requests: ${
        openResponse.ok ? closedResponse.status : openResponse.status
      } ${
        openResponse.ok ? closedResponse.statusText : openResponse.statusText
      }. ${errorData.message || ""}`,
    };
  }

  const openData = (await openResponse.json()) as GitHubSearchResponse;
  const closedData = (await closedResponse.json()) as GitHubSearchResponse;

  const openPRs = openData.items.map((item) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    html_url: item.html_url,
    state: item.state,
    created_at: item.created_at,
    user: {
      login: item.user.login,
      avatar_url: item.user.avatar_url,
    },
    merged_at: item.pull_request?.merged_at || null,
    reactions: item.reactions || { "+1": 0, "-1": 0 },
  }));

  const closedPRs = closedData.items.map((item) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    html_url: item.html_url,
    state: item.state,
    created_at: item.created_at,
    user: {
      login: item.user.login,
      avatar_url: item.user.avatar_url,
    },
    merged_at: item.pull_request?.merged_at || null,
    reactions: item.reactions || { "+1": 0, "-1": 0 },
  }));

  return { success: true, data: [...openPRs, ...closedPRs] };
}

export async function getPullRequestDiff(
  token: string,
  prNumber: number
): Promise<{ success: boolean; data?: string; error?: string }> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}.diff`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3.diff",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to fetch pull request diff: ${response.status} ${
        response.statusText
      }. ${errorData.message || ""}`,
    };
  }

  return { success: true, data: await response.text() };
}

export async function getOpenPullRequests(
  token: string
): Promise<{ success: boolean; data?: PullRequest[]; error?: string }> {
  const response = await fetch(
    `${GITHUB_API_URL}/search/issues?q=repo:${REPO_OWNER}/${REPO_NAME}+type:pr+state:open+Update+OR+Add&sort=created&order=desc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to fetch open pull requests: ${response.status} ${
        response.statusText
      }. ${errorData.message || ""}`,
    };
  }

  const data = (await response.json()) as GitHubSearchResponse;
  const prs = data.items.map((item) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    html_url: item.html_url,
    state: item.state,
    created_at: item.created_at,
    user: {
      login: item.user.login,
      avatar_url: item.user.avatar_url,
    },
    merged_at: item.pull_request?.merged_at || null,
    reactions: item.reactions || { "+1": 0, "-1": 0 },
  }));

  return { success: true, data: prs };
}

export async function mergePullRequest(
  token: string,
  prNumber: number
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}/merge`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        merge_method: "squash",
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to merge pull request: ${response.status} ${
        response.statusText
      }. ${errorData.message || ""}`,
    };
  }

  return { success: true };
}

export async function deleteBranch(
  token: string,
  branchName: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${branchName}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to delete branch: ${response.status} ${
        response.statusText
      }. ${errorData.message || ""}`,
    };
  }

  return { success: true };
}

export async function getPullRequestDetails(
  token: string,
  prNumber: number
): Promise<{
  success: boolean;
  data?: { head: { ref: string }; mergeable: boolean | null };
  error?: string;
}> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to get pull request details: ${response.status} ${
        response.statusText
      }. ${errorData.message || ""}`,
    };
  }

  const data = await response.json();
  return {
    success: true,
    data: {
      head: { ref: data.head.ref },
      mergeable: data.mergeable,
    },
  };
}

export async function createPullRequestComment(
  token: string,
  prNumber: number,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${prNumber}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({ body }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to create comment: ${response.status} ${
        response.statusText
      }. ${errorData.message || ""}`,
    };
  }

  return { success: true };
}

export async function getPullRequestComments(
  token: string,
  prNumber: number
): Promise<{ success: boolean; data?: { body: string }[]; error?: string }> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${prNumber}/comments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: `Failed to get PR comments: ${response.status} ${
        response.statusText
      }. ${errorData.message || ""}`,
    };
  }

  const data = await response.json();
  return { success: true, data };
}

interface CheckRun {
  name: string;
  conclusion: string;
}

export async function getPullRequestChecks(
  token: string,
  prNumber: number
): Promise<Result<CheckRun[]>> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${prNumber}/check-runs`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to get PR checks: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.check_runs.map(
        (run: { name: string; conclusion: string }) => ({
          name: run.name,
          conclusion: run.conclusion,
        })
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: `Error getting PR checks: ${error}`,
    };
  }
}
