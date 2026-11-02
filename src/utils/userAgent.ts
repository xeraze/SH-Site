export interface ParsedUa {
  browser: string;
  os: string;
  device: string;
}

const BROWSERS: [RegExp, string][] = [
  [/\bEdg(?:e|A|iOS)?\/[\d.]+/i, "Edge"],
  [/\bOPR\/[\d.]+|\bOpera\//i, "Opera"],
  [/\bSamsungBrowser\/[\d.]+/i, "Samsung Internet"],
  [/\bYaBrowser\/[\d.]+/i, "Yandex"],
  [/\bVivaldi\/[\d.]+/i, "Vivaldi"],
  [/\bBrave\/[\d.]+/i, "Brave"],
  [/\bFirefox\/[\d.]+|\bFxiOS\/[\d.]+/i, "Firefox"],
  [/\bChrome\/[\d.]+|\bCriOS\/[\d.]+/i, "Chrome"],
  [/\bSafari\/[\d.]+|\bVersion\/[\d.]+.*Safari/i, "Safari"],
  [/\bMSIE\b|\bTrident\//i, "Internet Explorer"],
  [/\bcurl\/[\d.]+/i, "curl"],
  [/\bPostmanRuntime/i, "Postman"],
];

const SYSTEMS: [RegExp, string][] = [
  [/Windows NT 10\.0/i, "Windows 10/11"],
  [/Windows NT 6\.3/i, "Windows 8.1"],
  [/Windows NT 6\.2/i, "Windows 8"],
  [/Windows NT 6\.1/i, "Windows 7"],
  [/Windows/i, "Windows"],
  [/Android/i, "Android"],
  [/iPhone|iPad|iPod/i, "iOS"],
  [/Mac OS X|Macintosh/i, "macOS"],
  [/CrOS/i, "ChromeOS"],
  [/Ubuntu/i, "Ubuntu"],
  [/Linux/i, "Linux"],
];

const DEVICES: [RegExp, string][] = [
  [/iPad|Tablet/i, "Планшет"],
  [/iPhone|iPod|Mobile|Android.*Mobile/i, "Смартфон"],
  [/Android/i, "Планшет"],
  [/bot|crawler|spider|curl|wget/i, "Бот"],
];

export function parseUserAgent(ua: string | null | undefined): ParsedUa {
  if (!ua) return { browser: "—", os: "—", device: "—" };
  let browser = "Невідомий";
  for (const [re, name] of BROWSERS) {
    if (re.test(ua)) {
      browser = name;
      break;
    }
  }
  let os = "Невідома";
  for (const [re, name] of SYSTEMS) {
    if (re.test(ua)) {
      os = name;
      break;
    }
  }
  let device = "Десктоп";
  for (const [re, name] of DEVICES) {
    if (re.test(ua)) {
      device = name;
      break;
    }
  }
  return { browser, os, device };
}

export function formatUa(ua: string | null | undefined): string {
  if (!ua) return "—";
  const p = parseUserAgent(ua);
  return `${p.browser} · ${p.os} · ${p.device}`;
}
