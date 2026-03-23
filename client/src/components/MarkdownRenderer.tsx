/**
 * MarkdownRenderer — lightweight markdown + syntax highlighting
 *
 * Uses `marked` for markdown parsing and `highlight.js` for code highlighting.
 * Only the languages relevant to interview prep are registered (JS, TS, Python,
 * Java, SQL, Go, C++, Bash) keeping the bundle to ~200 KB instead of the
 * 7 MB that streamdown/shiki requires for all 134 language grammars.
 *
 * Drop-in replacement for <Streamdown>{content}</Streamdown>:
 *   <MarkdownRenderer>{content}</MarkdownRenderer>
 */

import React from "react";
import { marked } from "marked";
import hljs from "highlight.js/lib/core";

// Register only the languages needed for interview prep
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import sql from "highlight.js/lib/languages/sql";
import go from "highlight.js/lib/languages/go";
import cpp from "highlight.js/lib/languages/cpp";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("go", go);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("text", plaintext);

// Configure marked with GFM + line breaks
marked.setOptions({ breaks: true, gfm: true });

const renderer = new marked.Renderer();
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre class="hljs-pre not-prose"><code class="hljs language-${language} text-sm leading-relaxed">${highlighted}</code></pre>`;
};
marked.use({ renderer });

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export default function MarkdownRenderer({ children, className = "" }: MarkdownRendererProps) {
  const html = React.useMemo(() => {
    try {
      return marked.parse(children ?? "") as string;
    } catch {
      return `<p>${children}</p>`;
    }
  }, [children]);

  return (
    <div
      className={`markdown-body prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
