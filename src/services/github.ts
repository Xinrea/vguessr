import { VTuber } from "@/types/vtuber";
import { v4 as uuidv4 } from "uuid";

const GITHUB_API_URL = "https://api.github.com";
const REPO_OWNER = "Xinrea";
const REPO_NAME = "vguessr";

export async function createPullRequest(
  vtuber: VTuber,
  token: string
): Promise<void> {
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
    throw new Error(
      `Failed to get base branch: ${baseRefResponse.status} ${
        baseRefResponse.statusText
      }. ${errorData.message || ""}`
    );
  }

  const baseRef = await baseRefResponse.json();
  if (!baseRef?.object?.sha) {
    throw new Error("Invalid base branch reference");
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
      throw new Error(
        `Failed to delete existing branch: ${deleteResponse.status} ${
          deleteResponse.statusText
        }. ${errorData.message || ""}`
      );
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
    throw new Error(
      `Failed to create branch: ${createBranchResponse.status} ${
        createBranchResponse.statusText
      }. ${errorData.message || ""}`
    );
  }

  // 2. 更新文件
  const filePath = "src/data/vtubers.json";
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
    throw new Error(`VTuber with id ${vtuber.id} not found`);
  }

  // 更新 VTuber 数据
  vtubers[index] = vtuber;

  // 转换为格式化的 JSON 字符串
  const updatedContent = JSON.stringify(vtubers, null, 2);

  // 提交更改
  await fetch(
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

  // 3. 创建 PR
  await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
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
  });
}
