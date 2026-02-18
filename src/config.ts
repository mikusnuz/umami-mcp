export interface UmamiConfig {
  baseUrl: string;
  username: string;
  password: string;
  apiKey: string;
}

export function loadConfig(): UmamiConfig {
  return {
    baseUrl: (process.env.UMAMI_URL || "").replace(/\/+$/, ""),
    username: process.env.UMAMI_USERNAME || "",
    password: process.env.UMAMI_PASSWORD || "",
    apiKey: process.env.UMAMI_API_KEY || "",
  };
}
