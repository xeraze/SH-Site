const stripZeros = (g: string): string => g.replace(/^0+(?=.)/, "");

export function formatIp(ip: string | null | undefined): string {
  if (!ip) return "";
  if (!ip.includes(":")) return ip;
  if (ip.includes("::")) return ip;
  const groups = ip.split(":");
  if (groups.length !== 8) return ip;

  const clean = groups.map(stripZeros);

  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  clean.forEach((g, i) => {
    if (g === "0") {
      if (curStart === -1) {
        curStart = i;
        curLen = 0;
      }
      curLen += 1;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  });

  if (bestLen < 2) return clean.join(":");

  const head = clean.slice(0, bestStart).join(":");
  const tail = clean.slice(bestStart + bestLen).join(":");
  return `${head}::${tail}`;
}
