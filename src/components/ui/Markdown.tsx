"use client";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

/** Renders tutor text and lesson notes: Markdown + LaTeX maths ($…$ / $$…$$). No raw HTML. */
export function Markdown({ children, className = "prose-chat" }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
