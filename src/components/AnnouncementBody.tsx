import { renderMiniMarkdown } from "./annMarkdown";

export function AnnouncementBody({ text }: { text: string }) {
  return <div className="ann-md">{renderMiniMarkdown(text)}</div>;
}
