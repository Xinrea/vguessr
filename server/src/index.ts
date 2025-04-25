import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cache from "memory-cache";
import { GameManager } from "./game";
import { PlayerStatsStorage } from "./storage";
import {
  createPullRequest,
  createAddVtuberPullRequest,
  getPullRequests as getGitHubPullRequests,
  getPullRequestDiff,
} from "./services/github";
import { getGitHubToken } from "./config";
import { PRAutoMergeService } from "./services/pr-auto-merge";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 信任代理
app.set("trust proxy", true);

const gameManager = new GameManager(io);

// 启动 PR 自动合并服务
PRAutoMergeService.getInstance().start();

// Middleware
app.use(cors());
app.use(express.json());

// Cache middleware
const cacheMiddleware = (duration: number) => {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const key = "__express__" + req.originalUrl || req.url;
    const cachedBody = cache.get(key);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    } else {
      const originalSend = res.send;
      res.send = function (body: string | object) {
        cache.put(key, body, duration * 1000);
        return originalSend.call(this, body);
      };
      next();
    }
  };
};

// Initialize services
const playerStats = new PlayerStatsStorage();

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Leaderboard routes
app.get("/leaderboard/games", cacheMiddleware(60), async (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = await playerStats.getDailyGamesLeaderboard(
      undefined,
      limit ? parseInt(limit as string) : 10
    );
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching games leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch games leaderboard" });
  }
});

app.get("/leaderboard/wins", cacheMiddleware(60), async (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = await playerStats.getDailyWinsLeaderboard(
      undefined,
      limit ? parseInt(limit as string) : 10
    );
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching wins leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch wins leaderboard" });
  }
});

app.get("/leaderboard/win-rate", cacheMiddleware(60), async (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = await playerStats.getDailyWinRateLeaderboard(
      undefined,
      limit ? parseInt(limit as string) : 10
    );
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching win rate leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch win rate leaderboard" });
  }
});

// VTuber update endpoint
app.post("/vtuber/update", async (req, res) => {
  try {
    const { vtuber } = req.body;

    if (!vtuber) {
      return res.status(400).json({ error: "Missing required field: vtuber" });
    }

    const token = await getGitHubToken();
    const result = await createPullRequest(vtuber, token);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: "Pull request created successfully" });
  } catch (error) {
    console.error("Error creating update pull request:", error);
    res.status(500).json({ error: "Failed to create pull request" });
  }
});

// VTuber add endpoint
app.post("/vtuber/add", async (req, res) => {
  try {
    const { vtuber } = req.body;

    if (!vtuber) {
      return res.status(400).json({ error: "Missing required field: vtuber" });
    }

    const token = await getGitHubToken();
    const result = await createAddVtuberPullRequest(vtuber, token);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: "Pull request created successfully" });
  } catch (error) {
    console.error("Error creating add pull request:", error);
    res.status(500).json({ error: "Failed to create pull request" });
  }
});

// Get pull requests
app.get("/pull-requests", cacheMiddleware(60), async (req, res) => {
  try {
    const token = await getGitHubToken();
    const result = await getGitHubPullRequests(token);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error("Error fetching pull requests:", error);
    res.status(500).json({ error: "Failed to fetch pull requests" });
  }
});

// Get pull request diff
app.get("/pull-requests/:id/diff", cacheMiddleware(60), async (req, res) => {
  try {
    const { id } = req.params;
    const token = await getGitHubToken();
    const result = await getPullRequestDiff(token, parseInt(id));

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.send(result.data);
  } catch (error) {
    console.error("Error fetching pull request diff:", error);
    res.status(500).json({ error: "Failed to fetch pull request diff" });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  gameManager.handleSocketConnection(socket);
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
