import React from "react";

/**
 * TabSkeleton — content-shaped loading skeletons for each tab.
 * Replaces the generic spinner while lazy chunks are loading.
 * Each skeleton mirrors the real tab's visual structure so the
 * layout shift is minimal when the real content appears.
 */

interface SkeletonBoxProps {
  className?: string;
}

function Bone({ className = "" }: SkeletonBoxProps) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
    />
  );
}

/** Generic card-shaped row used across multiple tabs */
function CardRow({ cols = 3 }: { cols?: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <Bone className="h-4 w-3/4" />
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-5/6" />
          <Bone className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/** Table-like rows used for CTCI tracker, leaderboard, etc. */
function TableRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <Bone className="h-3 w-8" />
        <Bone className="h-3 flex-1" />
        <Bone className="h-3 w-16" />
        <Bone className="h-3 w-12" />
        <Bone className="h-3 w-10" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-1">
          <Bone className="h-3 w-8" />
          <Bone className="h-3 flex-1" />
          <Bone className="h-5 w-16 rounded-full" />
          <Bone className="h-3 w-12" />
          <Bone className="h-5 w-5 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Coding tab skeleton: pattern cards + quick drill section */
function CodingTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <Bone className="h-6 w-48" />
        <Bone className="h-8 w-28 rounded-lg" />
      </div>
      {/* Pattern cards grid */}
      <CardRow cols={3} />
      <CardRow cols={3} />
      {/* Quick drill section */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
        <Bone className="h-5 w-40" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-5/6" />
        <div className="flex gap-3 pt-2">
          <Bone className="h-9 w-28 rounded-lg" />
          <Bone className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Behavioral tab skeleton: question list + STAR builder */
function BehavioralTabSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Bone className="h-6 w-52" />
        <Bone className="h-8 w-32 rounded-lg" />
      </div>
      {/* Question rows */}
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <div className="flex items-start gap-3">
            <Bone className="h-5 w-5 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-full" />
              <Bone className="h-3 w-4/5" />
            </div>
            <Bone className="h-6 w-16 rounded-full flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** System Design tab skeleton: pattern cards + mock section */
function SystemDesignTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Bone className="h-6 w-44" />
        <div className="flex gap-2">
          <Bone className="h-8 w-24 rounded-lg" />
          <Bone className="h-8 w-24 rounded-lg" />
        </div>
      </div>
      <CardRow cols={2} />
      <CardRow cols={2} />
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
        <Bone className="h-5 w-36" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-3/4" />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Bone className="h-24 rounded-lg" />
          <Bone className="h-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** CTCI tracker skeleton: search bar + table */
function CTCITrackerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Bone className="h-9 flex-1 rounded-lg" />
        <Bone className="h-9 w-28 rounded-lg" />
        <Bone className="h-9 w-28 rounded-lg" />
      </div>
      {/* Progress bars */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 space-y-2">
            <Bone className="h-3 w-16" />
            <Bone className="h-6 w-12" />
            <Bone className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
      <TableRows rows={8} />
    </div>
  );
}

/** Readiness tab skeleton: score bars + radar chart placeholder */
function ReadinessTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-6">
        <Bone className="h-20 w-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Bone className="h-5 w-40" />
          <Bone className="h-3 w-full rounded-full" />
          <Bone className="h-3 w-3/4 rounded-full" />
        </div>
      </div>
      {/* Score breakdown bars */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Bone className="h-3 w-32 flex-shrink-0" />
            <Bone className="h-3 flex-1 rounded-full" />
            <Bone className="h-3 w-10 flex-shrink-0" />
          </div>
        ))}
      </div>
      {/* Radar chart placeholder */}
      <Bone className="h-48 w-full rounded-xl" />
    </div>
  );
}

/** Timeline tab skeleton: calendar grid + checklist */
function TimelineTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Bone className="h-6 w-44" />
        <Bone className="h-8 w-32 rounded-lg" />
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Bone key={i} className="h-3 w-full" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Bone key={i + 7} className="h-8 rounded" />
        ))}
      </div>
      {/* Checklist items */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Bone className="h-4 w-4 rounded flex-shrink-0" />
            <Bone className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mock interview skeleton: problem header + answer panel */
function MockInterviewSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Bone className="h-6 w-52" />
        <Bone className="h-8 w-28 rounded-lg" />
      </div>
      {/* Problem card */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
        <Bone className="h-5 w-2/3" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-4/5" />
      </div>
      {/* Answer area */}
      <Bone className="h-40 w-full rounded-xl" />
      <div className="flex gap-3">
        <Bone className="h-9 w-28 rounded-lg" />
        <Bone className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/** Code practice skeleton: problem list + editor */
function CodePracticeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Bone className="h-9 flex-1 rounded-lg" />
        <Bone className="h-9 w-24 rounded-lg" />
        <Bone className="h-9 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-5 gap-4 h-96">
        {/* Problem list */}
        <div className="col-span-2 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Bone className="h-4 w-4 rounded flex-shrink-0" />
              <Bone className="h-3 flex-1" />
              <Bone className="h-5 w-14 rounded-full flex-shrink-0" />
            </div>
          ))}
        </div>
        {/* Editor */}
        <Bone className="col-span-3 rounded-xl" />
      </div>
    </div>
  );
}

/** AI tools tab skeleton: tool cards */
function AIToolsTabSkeleton() {
  return (
    <div className="space-y-5">
      <Bone className="h-6 w-40" />
      <CardRow cols={2} />
      <CardRow cols={2} />
    </div>
  );
}

/** Overview / leaderboard skeleton: stats cards + table */
function OverviewTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-8 w-16" />
          </div>
        ))}
      </div>
      <TableRows rows={5} />
    </div>
  );
}

/** AI Round skeleton */
function AIRoundTabSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Bone className="h-6 w-48" />
        <Bone className="h-8 w-28 rounded-lg" />
      </div>
      <CardRow cols={2} />
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
        <Bone className="h-5 w-44" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-4/5" />
        <Bone className="h-40 w-full rounded-lg" />
      </div>
    </div>
  );
}

/** Map tab ID → skeleton component */
const SKELETONS: Record<string, () => React.ReactElement> = {
  coding:      CodingTabSkeleton,
  practice:    CodePracticeSkeleton,
  mock:        MockInterviewSkeleton,
  behavioral:  BehavioralTabSkeleton,
  ctci:        CTCITrackerSkeleton,
  "ai-round":  AIRoundTabSkeleton,
  timeline:    TimelineTabSkeleton,
  readiness:   ReadinessTabSkeleton,
  sysdesign:   SystemDesignTabSkeleton,
  "ai-tools":  AIToolsTabSkeleton,
  overview:    OverviewTabSkeleton,
  leaderboard: OverviewTabSkeleton,
};

interface TabSkeletonProps {
  tabId: string;
}

export default function TabSkeleton({ tabId }: TabSkeletonProps) {
  const SkeletonComponent = SKELETONS[tabId] ?? CodingTabSkeleton;
  return (
    <div className="py-2 animate-in fade-in duration-200">
      <SkeletonComponent />
    </div>
  );
}
