export interface TelegramChannelData {
  memberCount: number;
  title: string;
  error?: string;
}

const TELEGRAM_API =
  "https://functions.poehali.dev/37848519-8d12-40c1-b0cb-f22c293fcdb5";

export async function getTelegramChannelData(
  channelUsername: string,
): Promise<TelegramChannelData> {
  try {
    const response = await fetch(`${TELEGRAM_API}?channel=${channelUsername}`);

    if (!response.ok) {
      throw new Error("Failed to fetch channel data");
    }

    const data = await response.json();

    return {
      memberCount: data.memberCount || 400,
      title: data.title || "MotoTyumen",
      error: data.error,
    };
  } catch (error) {
    console.warn("Failed to fetch Telegram data:", error);
    return {
      memberCount: 400,
      title: "MotoTyumen",
      error: "Failed to sync with Telegram",
    };
  }
}

// Кэш для данных канала (обновляется каждые 10 минут)
let cachedData: TelegramChannelData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 минут

export async function getCachedTelegramData(): Promise<TelegramChannelData> {
  const now = Date.now();

  if (cachedData && now - lastFetchTime < CACHE_DURATION) {
    return cachedData;
  }

  const data = await getTelegramChannelData("MotoTyumen");
  cachedData = data;
  lastFetchTime = now;

  return data;
}
