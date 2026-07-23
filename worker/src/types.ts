export interface Env {
  AUTH_KV: KVNamespace;
  DISCORD_WEBHOOK_URL: string;
  ALLOWED_ORIGIN: string;
}

export interface DoctorRecord {
  discordId: string;
  name: string;
  role: string;
  isAdmin?: boolean;
}

export interface CodeRecord {
  code: string;
  discordId: string;
  createdAt: number;
}

export interface SessionRecord {
  discordId: string;
  name: string;
  role: string;
  createdAt: number;
  isAdmin?: boolean;
}