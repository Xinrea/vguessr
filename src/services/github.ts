import { VTuber } from "@vtuber-guessr/shared";

const API_BASE_URL = process.env.API_URL || "http://localhost:3001";

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

export async function createPullRequest(vtuber: VTuber): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/vtuber/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ vtuber }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create pull request");
  }
}

export async function createAddVtuberPullRequest(
  vtuber: VTuber
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/vtuber/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ vtuber }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create pull request");
  }
}

export async function getPullRequests(): Promise<PullRequest[]> {
  const response = await fetch(`${API_BASE_URL}/pull-requests`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch pull requests");
  }

  return response.json();
}

export async function getPullRequestDiff(prNumber: number): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/pull-requests/${prNumber}/diff`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch pull request diff");
  }

  return response.text();
}
