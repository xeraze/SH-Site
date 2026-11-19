const MUTED_KEY = "sh.sound.muted";

let audio: HTMLAudioElement | null = null;
let unlocked = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(`${import.meta.env.BASE_URL}notification-sound.mp3`);
    audio.volume = 0.9;
  }
  return audio;
}

export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    if (muted) localStorage.setItem(MUTED_KEY, "1");
    else localStorage.removeItem(MUTED_KEY);
  } catch {
    return;
  }
}

function unlock(): void {
  if (unlocked) return;
  const el = getAudio();
  el.muted = true;
  el.play()
    .then(() => {
      el.pause();
      el.currentTime = 0;
      el.muted = false;
      unlocked = true;
    })
    .catch(() => {});
}

export function installSoundUnlock(): void {
  const handler = () => {
    unlock();
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("pointerdown", handler);
  window.addEventListener("keydown", handler);
}

export function playNotificationSound(): void {
  if (isSoundMuted()) return;
  const el = getAudio();
  el.currentTime = 0;
  void el.play().catch(() => {});
}
