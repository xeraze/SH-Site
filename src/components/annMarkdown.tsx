import type { ReactNode } from "react";

export function stripShortFormatting(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .trim();
}

function findClose(text: string, from: number, delim: string): number {
  const lineEnd = text.indexOf("\n", from);
  const limit = lineEnd === -1 ? text.length : lineEnd;
  let i = from;
  while (i < limit) {
    if (text.startsWith(delim, i)) {
      const before = i > 0 ? text[i - 1] : "";
      const after = text[i + delim.length] ?? "";
      const loneStar = delim === "*" && before !== "*" && after !== "*";
      const loneDouble = delim !== "*" && before !== delim[0];
      if ((delim === "*" && loneStar) || (delim !== "*" && loneDouble)) {
        return i;
      }
      i += delim.length;
      continue;
    }
    i++;
  }
  return -1;
}

export function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let plain = "";
  let i = 0;
  let key = 0;

  const flush = () => {
    if (plain !== "") {
      nodes.push(plain);
      plain = "";
    }
  };

  while (i < text.length) {
    let delim: string | null = null;
    if (text.startsWith("***", i)) delim = "***";
    else if (text.startsWith("**", i)) delim = "**";
    else if (text.startsWith("__", i)) delim = "__";
    else if (text[i] === "*" && text[i + 1] !== "*") delim = "*";

    if (delim) {
      const contentStart = i + delim.length;
      const close = findClose(text, contentStart, delim);
      if (close > contentStart) {
        const inner = text.slice(contentStart, close);
        flush();
        const key2 = `${keyPrefix}-${key++}`;
        const content = renderInline(inner, key2);
        if (delim === "***") {
          nodes.push(<strong key={key2}><em>{content}</em></strong>);
        } else if (delim === "**") nodes.push(<strong key={key2}>{content}</strong>);
        else if (delim === "__") nodes.push(<u key={key2}>{content}</u>);
        else nodes.push(<em key={key2}>{content}</em>);
        i = close + delim.length;
        continue;
      }
    }
    plain += text[i];
    i++;
  }
  flush();
  return nodes;
}

export function renderMiniMarkdown(text: string): ReactNode[] {
  const lines = text.split(/\r?\n/);
  const out: ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length > 0) {
      out.push(
        <ul key={key}>
          {listBuffer.map((li, i) => (
            <li key={i}>{renderInline(li, `${key}-${i}`)}</li>
          ))}
        </ul>,
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushList(`l-${idx}`);
      const level = h[1].length;
      const content = renderInline(h[2], `h-${idx}`);
      if (level === 1) out.push(<h3 key={`h-${idx}`}>{content}</h3>);
      else if (level === 2) out.push(<h4 key={`h-${idx}`}>{content}</h4>);
      else out.push(<h5 key={`h-${idx}`}>{content}</h5>);
      return;
    }
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      listBuffer.push(li[1]);
      return;
    }
    flushList(`l-${idx}`);
    if (line.trim() === "") {
      out.push(<br key={`b-${idx}`} />);
    } else {
      out.push(<p key={`p-${idx}`}>{renderInline(line, `p-${idx}`)}</p>);
    }
  });
  flushList("l-end");
  return out;
}
