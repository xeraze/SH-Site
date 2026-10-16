const BASE = import.meta.env.BASE_URL;

export function hrefFor(to: string): string {
  const base = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
  if (to === "/") return base || "/";
  return base + (to.startsWith("/") ? to : `/${to}`);
}
