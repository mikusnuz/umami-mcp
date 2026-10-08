export type UmamiMode = "self-hosted" | "cloud";

export interface UmamiConfig {
  mode?: UmamiMode;
  baseUrl: string;
  collectorUrl: string;
  username: string;
  password: string;
  apiKey: string;
}

export function inferMode(baseUrl: string, apiKey: string): UmamiMode {
  if (!baseUrl) return apiKey ? "cloud" : "self-hosted";
  return new URL(baseUrl).hostname === "api.umami.is" ? "cloud" : "self-hosted";
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): UmamiConfig {
  const apiKey = env.UMAMI_API_KEY || "";
  const configuredUrl = (env.UMAMI_URL || "").replace(/\/+$/, "");
  const configuredMode = env.UMAMI_MODE;
  if (configuredMode && configuredMode !== "self-hosted" && configuredMode !== "cloud") {
    throw new Error("UMAMI_MODE must be 'self-hosted' or 'cloud'.");
  }
  const mode: UmamiMode = configuredMode === "cloud" || configuredMode === "self-hosted"
    ? configuredMode
    : inferMode(configuredUrl, apiKey);
  const baseUrl = configuredUrl || (mode === "cloud" ? "https://api.umami.is/v1" : "");

  return {
    mode,
    baseUrl,
    collectorUrl: (
      env.UMAMI_COLLECTOR_URL ||
      (mode === "cloud" ? "https://cloud.umami.is" : baseUrl)
    ).replace(/\/+$/, ""),
    username: env.UMAMI_USERNAME || "",
    password: env.UMAMI_PASSWORD || "",
    apiKey,
  };
}
