"use client";

import React from "react";

interface Props {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown:
 * - Bold + Italic: ***text***
 * - Bold: **text**
 * - Italic: *text*
 * - Inline Code: `code`
 * - Links: [label](url)
 * - Math: $math$
 */
export function formatInlineMarkdown(text: string): React.ReactNode[] {
  // Regex tokenizing inline patterns:
  // 1. Bold+Italic: \*\*\*(.+?)\*\*\*
  // 2. Bold: \*\*(.+?)\*\*
  // 3. Italic: \*(.+?)\*
  // 4. Inline code: `([^`]+)`
  // 5. Links: \[([^\]]+)\]\(([^)]+)\)
  // 6. Math: \$([^$]+)\$
  const tokenRegex =
    /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\$[^$]+\$)/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("***") && part.endsWith("***")) {
      return (
        <strong key={idx} className="font-extrabold italic text-slate-900">
          {part.slice(3, -3)}
        </strong>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={idx} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      return (
        <span
          key={idx}
          className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-xs font-bold text-sgx-blue border border-blue-200/60"
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        return (
          <a
            key={idx}
            href={match[2]}
            target="_blank"
            rel="noreferrer"
            className="text-sgx-blue underline font-semibold hover:text-blue-700"
          >
            {match[1]}
          </a>
        );
      }
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Full Block Markdown Renderer
 * Parses:
 * - Code fences (``` ... ```)
 * - Headings (###, ##, #)
 * - Blockquotes (> ...)
 * - Numbered lists (1. , 2. )
 * - Bullet lists (- , * )
 * - Paragraphs
 */
export default function MarkdownRenderer({ content, className = "" }: Props) {
  if (!content) return null;

  // Normalize line endings
  const cleanContent = content.replace(/\r\n/g, "\n");

  // Split into raw blocks by double newlines or code fences
  const rawBlocks = splitIntoMarkdownBlocks(cleanContent);

  return (
    <div className={`space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-700 ${className}`}>
      {rawBlocks.map((block, bIdx) => renderBlock(block, bIdx))}
    </div>
  );
}

interface MarkdownBlock {
  type:
    | "heading"
    | "code"
    | "bullet-list"
    | "ordered-list"
    | "blockquote"
    | "paragraph";
  level?: number;
  text?: string;
  items?: string[];
  code?: string;
  lang?: string;
}

function splitIntoMarkdownBlocks(rawText: string): MarkdownBlock[] {
  const lines = rawText.split("\n");
  const blocks: MarkdownBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Code Fence (```)
    if (trimmed.startsWith("```")) {
      const lang = trimmed.replace("```", "").trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: "code",
        code: codeLines.join("\n"),
        lang,
      });
      continue;
    }

    // 2. Headings (#, ##, ###, ####)
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        blocks.push({
          type: "heading",
          level: match[1].length,
          text: match[2],
        });
        i++;
        continue;
      }
    }

    // 3. Blockquotes (> ...)
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join(" "),
      });
      continue;
    }

    // 4. Bullet list (- or * )
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "bullet-list",
        items,
      });
      continue;
    }

    // 5. Ordered list (1. 2. 3.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "ordered-list",
        items,
      });
      continue;
    }

    // 6. Regular Paragraph (accumulate lines until blank line or new block)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: paraLines.join(" "),
      });
    }
  }

  return blocks;
}

function renderBlock(block: MarkdownBlock, idx: number): React.ReactNode {
  switch (block.type) {
    case "heading": {
      const level = block.level || 3;
      const text = block.text || "";
      if (level === 1) {
        return (
          <h2
            key={idx}
            className="font-display text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-2 border-b border-slate-200 pb-2"
          >
            {formatInlineMarkdown(text)}
          </h2>
        );
      }
      if (level === 2) {
        return (
          <h3
            key={idx}
            className="font-display text-lg sm:text-xl font-extrabold text-slate-900 mt-5 mb-2"
          >
            {formatInlineMarkdown(text)}
          </h3>
        );
      }
      return (
        <h4
          key={idx}
          className="font-display text-sm sm:text-base font-extrabold text-slate-900 mt-4 mb-1.5 flex items-center gap-1.5"
        >
          {formatInlineMarkdown(text)}
        </h4>
      );
    }

    case "code":
      return (
        <pre
          key={idx}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs text-slate-800 overflow-x-auto shadow-2xs my-2.5"
        >
          <code>{block.code}</code>
        </pre>
      );

    case "blockquote":
      return (
        <blockquote
          key={idx}
          className="rounded-r-xl border-l-4 border-sgx-blue bg-blue-50/50 p-3 text-xs italic text-slate-700 my-2"
        >
          {formatInlineMarkdown(block.text || "")}
        </blockquote>
      );

    case "bullet-list":
      return (
        <ul key={idx} className="list-disc pl-5 space-y-1.5 my-2">
          {block.items?.map((item, itemIdx) => (
            <li key={itemIdx} className="leading-relaxed pl-1">
              {formatInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );

    case "ordered-list":
      return (
        <ol key={idx} className="list-decimal pl-5 space-y-1.5 my-2">
          {block.items?.map((item, itemIdx) => (
            <li key={itemIdx} className="leading-relaxed pl-1">
              {formatInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      );

    case "paragraph":
    default:
      return (
        <p key={idx} className="leading-relaxed text-slate-700">
          {formatInlineMarkdown(block.text || "")}
        </p>
      );
  }
}
