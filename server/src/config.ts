import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// 加载 .env.local 文件
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const GITHUB_APP_ID = process.env.GITHUB_APP_ID || "";
const GITHUB_APP_PRIVATE_KEY_PATH =
  process.env.GITHUB_APP_PRIVATE_KEY_PATH || "";
const GITHUB_APP_INSTALLATION_ID = process.env.GITHUB_APP_INSTALLATION_ID || "";

if (
  !GITHUB_APP_ID ||
  !GITHUB_APP_PRIVATE_KEY_PATH ||
  !GITHUB_APP_INSTALLATION_ID
) {
  console.warn(
    "Warning: GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY_PATH, or GITHUB_APP_INSTALLATION_ID environment variables are not set"
  );
}

let privateKey: string;
try {
  privateKey = fs.readFileSync(
    path.resolve(GITHUB_APP_PRIVATE_KEY_PATH),
    "utf8"
  );
} catch (error) {
  console.error("Error reading private key file:", error);
  privateKey = "";
}

let currentToken: string | null = null;
let tokenExpiry: number = 0;

async function getInstallationAccessToken(jwtToken: string): Promise<string> {
  const response = await fetch(
    `https://api.github.com/app/installations/${GITHUB_APP_INSTALLATION_ID}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to get installation access token: ${response.status} ${
        response.statusText
      }. ${errorData.message || ""}`
    );
  }

  const data = await response.json();
  return data.token;
}

export async function getGitHubToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // If token doesn't exist or is about to expire (within 1 minute), generate a new one
  if (!currentToken || now >= tokenExpiry - 60) {
    if (!GITHUB_APP_ID || !privateKey || !GITHUB_APP_INSTALLATION_ID) {
      throw new Error("GitHub App credentials are not properly configured");
    }

    // Generate a JWT token that expires in 1 hour
    const payload = {
      iat: now,
      exp: now + 600, // 10 minutes
      iss: GITHUB_APP_ID,
    };

    const jwtToken = jwt.sign(payload, privateKey, { algorithm: "RS256" });

    // Get installation access token
    currentToken = await getInstallationAccessToken(jwtToken);
    tokenExpiry = now + 3600; // Installation tokens expire in 1 hour
  }

  return currentToken;
}
