import { renderInline, renderMiniMarkdown, stripShortFormatting } from "./annMarkdown";

export function AnnouncementBody({ text, short }: { text: string; short?: boolean }) {
  if (short) {
    return (
      <div className="ann-md">
        <p>{renderInline(stripShortFormatting(text), "short-body")}</p>
      </div>
    );
  }
  return <div className="ann-md">{renderMiniMarkdown(text)}</div>;
}
