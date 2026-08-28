import { UmamiConfig } from "./config.js";

export type UmamiAuthPolicy = "required" | "none" | "optional";
export type UmamiApiTarget = "api" | "collector";

const DEFAULT_COLLECTOR_USER_AGENT = "Mozilla/5.0 (compatible; UmamiMCP/2.0)";

export interface UmamiCallOptions {
  auth?: UmamiAuthPolicy;
  target?: UmamiApiTarget;
  headers?: Record<string, string>;
}

interface LoginResponse {
  token?: string;
  requiresTwoFactor?: boolean;
  partialToken?: string;
}

export class UmamiTwoFactorRequiredError extends Error {
  constructor() {
    super(
      "Umami account requires two-factor authentication. Call complete_two_factor_login with a current TOTP or backup code, then retry the original tool.",
    );
    this.name = "UmamiTwoFactorRequiredError";
  }
}

export class UmamiClient {
  private config: UmamiConfig;
  private token: string | null = null;
  private tokenExpiresAt = 0;
  private partialToken: string | null = null;

  constructor(config: UmamiConfig) {
    this.config = config;
  }

  get isCloud(): boolean {
    return Boolean(this.config.apiKey);
  }

  private ensureEndpoint(target: UmamiApiTarget): void {
    const endpoint = target === "collector" ? this.config.collectorUrl : this.config.baseUrl;
    if (!endpoint) {
      throw new Error(
        target === "collector"
          ? "Umami collector is not configured. Set UMAMI_URL or UMAMI_COLLECTOR_URL."
          : "Umami API is not configured. Set UMAMI_URL for self-hosted Umami or UMAMI_API_KEY for Umami Cloud.",
      );
    }
  }

  private ensureAuthenticationConfigured(): void {
    if (!this.config.apiKey && (!this.config.username || !this.config.password)) {
      throw new Error(
        "Authentication not configured. Set UMAMI_API_KEY or both UMAMI_USERNAME and UMAMI_PASSWORD.",
      );
    }
  }

  private resolveUrl(path: string, target: UmamiApiTarget): string {
    this.ensureEndpoint(target);
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    if (target === "collector") {
      const collectorPath = normalizedPath.startsWith("/api/")
        ? normalizedPath
        : `/api${normalizedPath}`;
      if (this.config.collectorUrl.endsWith("/api")) {
        return `${this.config.collectorUrl}${collectorPath.slice(4)}`;
      }
      return `${this.config.collectorUrl}${collectorPath}`;
    }

    if (this.isCloud) {
      const cloudPath = normalizedPath.startsWith("/api/")
        ? normalizedPath.slice(4)
        : normalizedPath;
      return `${this.config.baseUrl}${cloudPath}`;
    }

    if (this.config.baseUrl.endsWith("/api") && normalizedPath.startsWith("/api/")) {
      return `${this.config.baseUrl}${normalizedPath.slice(4)}`;
    }

    return `${this.config.baseUrl}${normalizedPath}`;
  }

  private cacheToken(token: string): void {
    this.token = token;
    this.partialToken = null;

    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString(),
      );
      this.tokenExpiresAt = (payload.exp || 0) * 1000;
    } catch {
      this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    }
  }

  private async readJsonResponse(res: Response, context: string): Promise<unknown> {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${context} (${res.status}): ${text}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return res.json();
    const text = await res.text();
    return text || { success: true };
  }

  private async getToken(): Promise<string> {
    if (this.config.apiKey) return this.config.apiKey;
    this.ensureAuthenticationConfigured();

    if (this.token && Date.now() < this.tokenExpiresAt - 300_000) {
      return this.token;
    }

    const res = await fetch(this.resolveUrl("/api/auth/login", "api"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = (await this.readJsonResponse(
      res,
      "Umami login failed",
    )) as LoginResponse;

    if (data.requiresTwoFactor) {
      if (!data.partialToken) {
        throw new Error("Umami login requested 2FA without returning a partial token.");
      }
      this.partialToken = data.partialToken;
      throw new UmamiTwoFactorRequiredError();
    }

    if (!data.token) {
      throw new Error("Umami login response did not include a token.");
    }
    this.cacheToken(data.token);
    return data.token;
  }

  async completeTwoFactorLogin(input: {
    token?: string;
    backupCode?: string;
  }): Promise<unknown> {
    if (this.isCloud) {
      throw new Error("Two-factor login completion applies only to self-hosted Umami.");
    }
    if (!this.partialToken) {
      try {
        await this.getToken();
      } catch (error) {
        if (!(error instanceof UmamiTwoFactorRequiredError)) throw error;
      }
    }
    if (!this.partialToken) {
      throw new Error("Umami login did not request two-factor authentication.");
    }

    const res = await fetch(this.resolveUrl("/api/2fa/verify", "api"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.partialToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input.token ? { token: input.token } : { backupCode: input.backupCode }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = (await this.readJsonResponse(
      res,
      "Umami two-factor verification failed",
    )) as LoginResponse;
    if (!data.token) {
      throw new Error("Umami 2FA verification response did not include a token.");
    }
    this.cacheToken(data.token);
    return data;
  }

  async call(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
    options: UmamiCallOptions = {},
  ): Promise<unknown> {
    const auth = options.auth || "required";
    const target = options.target || "api";
    const url = new URL(this.resolveUrl(path, target));

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = { ...options.headers };
    if (target === "collector" && !headers["User-Agent"] && !headers["user-agent"]) {
      // Umami's collection API rejects or ignores requests without a usable
      // User-Agent. Node's implementation-specific default is not a stable API.
      headers["User-Agent"] = DEFAULT_COLLECTOR_USER_AGENT;
    }
    if (auth !== "none") {
      if (auth === "required") this.ensureAuthenticationConfigured();
      if (this.config.apiKey || (this.config.username && this.config.password)) {
        headers.Authorization = `Bearer ${await this.getToken()}`;
      }
    }
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });

    return this.readJsonResponse(res, `Umami API error ${method} ${path}`);
  }
}
