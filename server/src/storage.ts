import Redis from "ioredis";

class RedisConnection {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
      });
    }
    return RedisConnection.instance;
  }
}

export class RedisStorage {
  protected redis: Redis;
  protected readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.redis = RedisConnection.getInstance();
  }

  public async set(key: string, value: string) {
    await this.redis.set(`${this.prefix}${key}`, value);
  }

  public async get(key: string): Promise<string | null> {
    return await this.redis.get(`${this.prefix}${key}`);
  }

  public async delete(key: string) {
    await this.redis.del(`${this.prefix}${key}`);
  }

  public async clear() {
    const keys = await this.redis.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  public async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(`${this.prefix}${key}`)) === 1;
  }

  public async setWithExpiry(key: string, value: string, seconds: number) {
    await this.redis.setex(`${this.prefix}${key}`, seconds, value);
  }
}

export class PlayerNameStorage extends RedisStorage {
  constructor() {
    super("player:name:");
  }
}

export class PlayerStatsStorage extends RedisStorage {
  private playerNames: PlayerNameStorage;

  constructor() {
    super("player:stats:");
    this.playerNames = new PlayerNameStorage();
  }

  private getDailyKey(userId: string, type: "games" | "wins"): string {
    // 获取北京时间（UTC+8）
    const now = new Date();
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const today = beijingTime.toISOString().split("T")[0];
    return `${today}:${type}:${userId}`;
  }

  private getDateKey(date: string | undefined, type: "games" | "wins"): string {
    if (!date) {
      // 获取北京时间（UTC+8）
      const now = new Date();
      const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      date = beijingTime.toISOString().split("T")[0];
    }
    return `${date}:${type}`;
  }

  public async incrementGames(userId: string) {
    const key = this.getDailyKey(userId, "games");
    const currentCount = await this.get(key);
    const newCount = (currentCount ? parseInt(currentCount) : 0) + 1;
    await this.set(key, newCount.toString());
  }

  public async incrementWins(userId: string) {
    const key = this.getDailyKey(userId, "wins");
    const currentCount = await this.get(key);
    const newCount = (currentCount ? parseInt(currentCount) : 0) + 1;
    await this.set(key, newCount.toString());
  }

  public async getStats(
    userId: string
  ): Promise<{ games: number; wins: number }> {
    const gamesKey = this.getDailyKey(userId, "games");
    const winsKey = this.getDailyKey(userId, "wins");
    const [games, wins] = await Promise.all([
      this.get(gamesKey),
      this.get(winsKey),
    ]);
    return {
      games: games ? parseInt(games) : 0,
      wins: wins ? parseInt(wins) : 0,
    };
  }

  public async getDailyStats(
    date?: string
  ): Promise<
    Array<{ userId: string; name: string; games: number; wins: number }>
  > {
    const gamesPattern = `${this.prefix}${this.getDateKey(date, "games")}:*`;
    const winsPattern = `${this.prefix}${this.getDateKey(date, "wins")}:*`;

    const [gamesKeys, winsKeys] = await Promise.all([
      this.redis.keys(gamesPattern),
      this.redis.keys(winsPattern),
    ]);

    const statsMap = new Map<
      string,
      { name: string; games: number; wins: number }
    >();

    // 处理游戏场次
    for (const key of gamesKeys) {
      const userId = key.split(":").pop()!;
      const value = await this.get(key.replace(this.prefix, ""));
      if (value) {
        const name = (await this.playerNames.get(userId)) || userId;
        statsMap.set(userId, {
          name,
          games: parseInt(value),
          wins: 0,
        });
      }
    }

    // 处理胜场
    for (const key of winsKeys) {
      const userId = key.split(":").pop()!;
      const value = await this.get(key.replace(this.prefix, ""));
      if (value) {
        const name = (await this.playerNames.get(userId)) || userId;
        const stats = statsMap.get(userId) || { name, games: 0, wins: 0 };
        stats.wins = parseInt(value);
        statsMap.set(userId, stats);
      }
    }

    return Array.from(statsMap.entries()).map(([userId, stats]) => ({
      userId,
      ...stats,
    }));
  }

  public async getDailyGamesLeaderboard(
    date?: string,
    limit: number = 10
  ): Promise<Array<{ userId: string; name: string; games: number }>> {
    const pattern = `${this.prefix}${this.getDateKey(date, "games")}:*`;
    const keys = await this.redis.keys(pattern);

    const stats = await Promise.all(
      keys.map(async (key) => {
        const userId = key.split(":").pop()!;
        const value = await this.get(key.replace(this.prefix, ""));
        const name = (await this.playerNames.get(userId)) || userId;
        return {
          userId,
          name,
          games: value ? parseInt(value) : 0,
        };
      })
    );

    // 按游戏场次降序排序
    return stats.sort((a, b) => b.games - a.games).slice(0, limit);
  }

  public async getDailyWinsLeaderboard(
    date?: string,
    limit: number = 10
  ): Promise<Array<{ userId: string; name: string; wins: number }>> {
    const pattern = `${this.prefix}${this.getDateKey(date, "wins")}:*`;
    const keys = await this.redis.keys(pattern);

    const stats = await Promise.all(
      keys.map(async (key) => {
        const userId = key.split(":").pop()!;
        const value = await this.get(key.replace(this.prefix, ""));
        const name = (await this.playerNames.get(userId)) || userId;
        return {
          userId,
          name,
          wins: value ? parseInt(value) : 0,
        };
      })
    );

    // 按胜场降序排序
    return stats.sort((a, b) => b.wins - a.wins).slice(0, limit);
  }

  public async getDailyWinRateLeaderboard(
    date?: string,
    limit: number = 10
  ): Promise<
    Array<{
      userId: string;
      name: string;
      games: number;
      wins: number;
      winRate: number;
    }>
  > {
    const stats = await this.getDailyStats(date);

    // 计算胜率并排序，只包含至少参与5场游戏的玩家
    return stats
      .filter((stat) => stat.games >= 5)
      .map((stat) => ({
        ...stat,
        winRate: stat.games > 0 ? (stat.wins / stat.games) * 100 : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, limit);
  }
}
