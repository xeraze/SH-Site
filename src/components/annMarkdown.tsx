import type { ReactNode } from "react";

export function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|__[^_\n]+__)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("__")) {
      nodes.push(<u key={key}>{token.slice(2, -2)}</u>);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
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
