/**
 * MarkdownRenderer — lazy wrapper around Streamdown.
 *
 * Streamdown bundles the full Shiki syntax highlighter (~800KB raw) with
 * 100+ language grammars. By wrapping it in React.lazy we ensure that
 * shiki is only loaded when AI-generated markdown content is first rendered,
 * keeping it out of the initial bundle and out of tab chunks that don't
 * need it immediately.
 *
 * Usage (drop-in replacement for <Streamdown>):
 *   import MarkdownRenderer from "@/components/MarkdownRenderer";
 *   <MarkdownRenderer>{content}</MarkdownRenderer>
 */
import { lazy, Suspense } from "react";

// Lazy-load the Streamdown component — defers shiki grammar loading
const LazyStreamdown = lazy(() =>
  import("streamdown").then((m) => ({ default: m.Streamdown }))
);

interface Props {
  children: string;
  className?: string;
}

export default function MarkdownRenderer({ children, className }: Props) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-1.5">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        </div>
      }
    >
      <span className={className}>
        <LazyStreamdown>{children}</LazyStreamdown>
      </span>
    </Suspense>
  );
}
