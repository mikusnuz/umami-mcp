export interface UmamiConfig {
  baseUrl: string;
  collectorUrl: string;
  username: string;
  password: string;
  apiKey: string;
}

export function loadConfig(): UmamiConfig {
  const apiKey = process.env.UMAMI_API_KEY || "";
  const configuredUrl = (process.env.UMAMI_URL || "").replace(/\/+$/, "");
  const baseUrl = configuredUrl || (apiKey ? "https://api.umami.is/v1" : "");

  return {
    baseUrl,
    collectorUrl: (
      process.env.UMAMI_COLLECTOR_URL ||
      (apiKey ? "https://cloud.umami.is" : baseUrl)
    ).replace(/\/+$/, ""),
    username: process.env.UMAMI_USERNAME || "",
    password: process.env.UMAMI_PASSWORD || "",
    apiKey,
  };
}
