const API_BASE = "https://sh-site.xeraze-official.workers.dev";
const TOKEN_KEY = "sh_token";

export interface RoleLabel {
  role: string;
  label: string;
  icon: string;
}

export interface PublicUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  patronymic: string | null;
  gender: string | null;
  age: number | null;
  avatar: string | null;
  roles: string[];
  roleLabels: RoleLabel[];
  needsProfile: boolean;
  emailNotifications: boolean;
  hasPassword: boolean;
}

export interface ApplicationItem {
  id: string;
  formId: string;
  formTitle: string;
  answers: { label: string; value: string }[];
  status: string;
  statusLabel: string;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  author?: { id: string; name: string; email: string | null };
}

export interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  type: "short" | "regular";
  title: string | null;
  summary: string | null;
  text: string;
  tags: string[];
  visibility: string;
  active: number;
  createdAt: string;
  images: string[];
  videoLinks: string[];
  bannerImage: string | null;
  bannerVideo: string | null;
}

export interface PublicAnnouncement {
  id: string;
  type: string;
  title: string | null;
  summary: string | null;
  text: string;
  tags: string[];
  visibility: string;
  images: string[];
  videoLinks: string[];
  bannerImage: string | null;
  bannerVideo: string | null;
  createdAt: string;
  likes: number;
  liked: boolean;
  category?: string;
}

export interface AppointmentItem {
  id: string;
  body: string;
  wantDate: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  author?: { id: string; name: string; email: string | null };
}

export interface DialogueMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  senderName: string;
  isReviewer: boolean;
}

export interface InviteItem {
  token: string;
  role: string;
  roleLabel: string;
  email: string | null;
  expiresAt: string;
  link: string;
}

export interface InvitesResult {
  invites: InviteItem[];
  assignable: string[];
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function loginUrl(extra?: string): string {
  const redirect = extra ? `/kabinet${extra}` : "/kabinet";
  return `${API_BASE}/auth/google?redirect=${encodeURIComponent(redirect)}`;
}

async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; data: Partial<T> }
> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data.error ?? "Помилка сервера",
        data,
      };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, error: "Сервер недоступний", data: {} as Partial<T> };
  }
}

export async function fetchMe(): Promise<PublicUser | null> {
  const res = await apiFetch<{ user: PublicUser | null }>("/api/me");
  if (!res.ok) return null;
  return res.data.user;
}

export async function saveProfile(input: {
  firstName: string;
  lastName: string;
  patronymic: string;
  gender: string;
  age: number;
  avatar?: string | null;
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const res = await apiFetch<{ user: PublicUser }>("/api/profile", {
    method: "POST",
    body: input,
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, user: res.data.user };
}

export interface AuthChallengeStart {
  challengeId: string;
  email: string;
}

export interface AuthVerifyResult {
  token: string;
  user: PublicUser;
}

export async function registerStart(input: {
  email: string;
  firstName: string;
  lastName: string;
  patronymic: string;
  gender: string;
  age: number;
}): Promise<{ ok: true; challengeId: string } | { ok: false; error: string }> {
  const res = await apiFetch<AuthChallengeStart>("/api/auth/register/start", {
    method: "POST",
    body: input,
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, challengeId: res.data.challengeId };
}

export async function registerVerify(
  challengeId: string,
  code: string,
): Promise<{ ok: true; token: string; user: PublicUser } | { ok: false; error: string }> {
  const res = await apiFetch<AuthVerifyResult>("/api/auth/register/verify", {
    method: "POST",
    body: { challengeId, code },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, token: res.data.token, user: res.data.user };
}

export async function loginPassword(
  email: string,
  password: string,
): Promise<{ ok: true; token: string; user: PublicUser } | { ok: false; error: string }> {
  const res = await apiFetch<AuthVerifyResult>("/api/auth/login/password", {
    method: "POST",
    body: { email, password },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, token: res.data.token, user: res.data.user };
}

export async function setPassword(
  newPassword: string,
  currentPassword?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch<{ ok: boolean }>("/api/auth/set-password", {
    method: "POST",
    body: { newPassword, currentPassword },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

export async function emailChangeStart(
  email: string,
): Promise<{ ok: true; challengeId: string } | { ok: false; error: string }> {
  const res = await apiFetch<AuthChallengeStart>("/api/auth/email-change/start", {
    method: "POST",
    body: { email },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, challengeId: res.data.challengeId };
}

export async function emailChangeVerify(
  challengeId: string,
  code: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const res = await apiFetch<{ ok: boolean; email: string }>(
    "/api/auth/email-change/verify",
    { method: "POST", body: { challengeId, code } },
  );
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, email: res.data.email };
}

export interface AdminUserItem {
  id: string;
  email: string | null;
  name: string;
  roles: string[];
  banned: boolean;
  bannedReason: string | null;
  bannedAt: string | null;
  lastIp: string | null;
  createdAt: string;
}

export async function fetchAdminUsers(): Promise<AdminUserItem[]> {
  const res = await apiFetch<{ users: AdminUserItem[] }>("/api/admin/users");
  if (!res.ok) return [];
  return res.data.users;
}

export async function adminSetBan(
  id: string,
  banned: boolean,
  reason?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch<{ ok: boolean }>(`/api/admin/users/${id}/ban`, {
    method: "POST",
    body: { banned, reason },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

export function announcementLink(id: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}oholoshennya/${id}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export async function fetchSettings(): Promise<boolean> {  const res = await apiFetch<{ emailNotifications: boolean }>("/api/settings");
  if (!res.ok) return true;
  return res.data.emailNotifications;
}

export async function saveSettings(emailNotifications: boolean): Promise<boolean> {
  const res = await apiFetch<{ emailNotifications: boolean }>("/api/settings", {
    method: "POST",
    body: { emailNotifications },
  });
  if (!res.ok) return false;
  return res.data.emailNotifications;
}

export async function submitApplication(
  formId: string,
  answers: { label: string; value: string }[],
  renderedAt: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch("/api/applications", {
    method: "POST",
    body: { formId, answers, renderedAt },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

export async function fetchApplications(): Promise<ApplicationItem[]> {
  const res = await apiFetch<{ applications: ApplicationItem[] }>("/api/applications");
  if (!res.ok) return [];
  return res.data.applications;
}

export async function fetchApplicationsReview(): Promise<ApplicationItem[]> {
  const res = await apiFetch<{ applications: ApplicationItem[] }>("/api/applications/review");
  if (!res.ok) return [];
  return res.data.applications;
}

export async function setApplicationStatus(
  id: string,
  status: string,
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch(`/api/applications/${id}/status`, {
    method: "POST",
    body: { status, note },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

export async function fetchMessages(
  id: string,
): Promise<{ messages: DialogueMessage[]; status: string }> {
  const res = await apiFetch<{ messages: DialogueMessage[]; status: string }>(
    `/api/applications/${id}/messages`,
  );
  if (!res.ok) return { messages: [], status: "" };
  return res.data;
}

export async function sendMessage(
  id: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch(`/api/applications/${id}/messages`, {
    method: "POST",
    body: { body },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await apiFetch<{ notifications: NotificationItem[] }>("/api/notifications");
  if (!res.ok) return [];
  return res.data.notifications;
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch<{ unread: number }>("/api/notifications");
  if (!res.ok) return 0;
  return res.data.unread;
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  await apiFetch("/api/notifications", {
    method: "POST",
    body: ids ? { ids } : {},
  });
}

export async function logout(): Promise<void> {
  await apiFetch("/api/logout", { method: "POST" });
  setToken(null);
}

export async function fetchAnnouncement(
  id: string,
): Promise<{ ok: true; announcement: PublicAnnouncement } | { ok: false; error: string }> {
  const res = await apiFetch<{ announcement: PublicAnnouncement }>(
    `/api/announcements/${encodeURIComponent(id)}`,
  );
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, announcement: res.data.announcement };
}

export async function fetchAnnouncements(): Promise<PublicAnnouncement[]> {
  const res = await apiFetch<{ announcements: PublicAnnouncement[] }>("/api/announcements");
  if (!res.ok) return [];
  return res.data.announcements;
}

export async function toggleAnnouncementLike(
  id: string,
): Promise<
  | { ok: true; liked: boolean; likes: number }
  | { ok: false; error: string; status: number }
> {
  const res = await apiFetch<{ liked: boolean; likes: number }>(
    `/api/announcements/${id}/like`,
    { method: "POST" },
  );
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return { ok: true, liked: res.data.liked, likes: res.data.likes };
}

export async function fetchAnnouncementsManage(): Promise<AnnouncementItem[]> {
  const res = await apiFetch<{ announcements: AnnouncementItem[] }>(
    "/api/announcements/manage",
  );
  if (!res.ok) return [];
  return res.data.announcements;
}

export async function saveAnnouncement(input: {
  type: "short" | "regular";
  title?: string;
  summary?: string;
  text: string;
  tags?: string[];
  visibility?: string;
  images?: string[];
  videoLinks?: string[];
  bannerImage?: string;
  bannerVideo?: string;
  id?: string;
  active?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string; freeAt?: string }> {
  const res = await apiFetch<{ freeAt?: string }>("/api/announcements/manage", {
    method: "POST",
    body: input,
  });
  if (!res.ok) return { ok: false, error: res.error, freeAt: res.data.freeAt };
  return { ok: true };
}

export async function deleteAnnouncement(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch(`/api/announcements/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

export async function assignRole(
  email: string,
  role: string,
): Promise<
  | { ok: true; assigned: boolean; link?: string; emailed?: boolean }
  | { ok: false; error: string }
> {
  const res = await apiFetch<{ assigned: boolean; link?: string; emailed?: boolean }>(
    "/api/roles/assign",
    { method: "POST", body: { email, role } },
  );
  if (!res.ok) return { ok: false, error: res.error };
  return {
    ok: true,
    assigned: res.data.assigned,
    link: res.data.link,
    emailed: res.data.emailed,
  };
}

export async function fetchInvites(): Promise<InvitesResult> {
  const res = await apiFetch<InvitesResult>("/api/invites");
  if (!res.ok) return { invites: [], assignable: [] };
  return res.data;
}

export async function acceptInvite(
  token: string,
): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const res = await apiFetch<{ user: PublicUser }>("/api/invites/accept", {
    method: "POST",
    body: { token },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, user: res.data.user };
}

export async function deleteInvite(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch(`/api/invites/${token}`, { method: "DELETE" });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

export async function fetchArchive(): Promise<PublicAnnouncement[]> {
  const res = await apiFetch<{ announcements: PublicAnnouncement[] }>("/api/archive");
  if (!res.ok) return [];
  return res.data.announcements;
}

export async function createArchiveCode(
  id: string,
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const res = await apiFetch<{ code: string }>(`/api/announcements/${id}/archive-code`, {
    method: "POST",
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, code: res.data.code };
}

export async function redeemArchiveCode(
  code: string,
): Promise<
  { ok: true; announcement: PublicAnnouncement } | { ok: false; error: string }
> {
  const res = await apiFetch<{ announcement: PublicAnnouncement }>(
    "/api/archive/redeem",
    { method: "POST", body: { code } },
  );
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, announcement: res.data.announcement };
}

export async function createAppointment(
  body: string,
  wantDate: string,
  renderedAt: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch("/api/appointments", {
    method: "POST",
    body: { body, wantDate, renderedAt },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

export async function fetchAppointments(): Promise<AppointmentItem[]> {
  const res = await apiFetch<{ appointments: AppointmentItem[] }>("/api/appointments");
  if (!res.ok) return [];
  return res.data.appointments;
}

export async function fetchAppointmentsQueue(): Promise<AppointmentItem[]> {
  const res = await apiFetch<{ appointments: AppointmentItem[] }>("/api/appointments/queue");
  if (!res.ok) return [];
  return res.data.appointments;
}

export async function setAppointmentStatus(
  id: string,
  status: string,
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch(`/api/appointments/${id}/status`, {
    method: "POST",
    body: { status, note },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}
