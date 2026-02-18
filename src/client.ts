import { UmamiConfig } from "./config.js";

export class UmamiClient {
  private config: UmamiConfig;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: UmamiConfig) {
    this.config = config;
  }

  private ensureConfigured(): void {
    if (!this.config.baseUrl) {
      throw new Error(
        "UMAMI_URL is not configured. Set it in your environment variables."
      );
    }
    if (!this.config.apiKey && (!this.config.username || !this.config.password)) {
      throw new Error(
        "Authentication not configured. Set UMAMI_API_KEY or both UMAMI_USERNAME and UMAMI_PASSWORD."
      );
    }
  }

  private async getToken(): Promise<string> {
    // API Key auth (Umami Cloud)
    if (this.config.apiKey) {
      return this.config.apiKey;
    }

    // JWT auth — return cached if still valid (5 min buffer)
    if (this.token && Date.now() < this.tokenExpiresAt - 300_000) {
      return this.token;
    }

    const res = await fetch(`${this.config.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Umami login failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    this.token = data.token;

    // Decode JWT expiry (payload is base64url between first and second dots)
    try {
      const payload = JSON.parse(
        Buffer.from(data.token.split(".")[1], "base64url").toString()
      );
      this.tokenExpiresAt = (payload.exp || 0) * 1000;
    } catch {
      // Fallback: assume 24h validity
      this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    }

    return this.token!;
  }

  async call(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<unknown> {
    this.ensureConfigured();

    const token = await this.getToken();

    let url = `${this.config.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") {
          params.set(k, String(v));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Umami API error ${method} ${path} (${res.status}): ${text}`);
    }

    // Some endpoints return 200 with no body (e.g. DELETE)
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    const text = await res.text();
    return text || { success: true };
  }
}
