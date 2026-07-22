export interface Env {
  // KV namespace для зберігання кодів, сесій та списку допущеного персоналу
  AUTH_KV: KVNamespace;
  // Секретний URL вебхука Discord-каналу для надсилання кодів
  DISCORD_WEBHOOK_URL: string;
  // Дозволений origin для CORS (адреса вашого сайту на GitHub Pages)
  ALLOWED_ORIGIN: string;
}

export interface DoctorRecord {
  discordId: string;
  name: string;
  role: string;
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
}
