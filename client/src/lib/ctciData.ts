// ctciData.ts — extended CTCI questions with fields expected by OverviewTab and DayOfMode
import { CTCI_PROBLEMS, type CTCIProblem } from "./ctciProblems";

// Extended type with num alias, metaFreq, and topics for OverviewTab compatibility
export interface CTCIQuestion extends CTCIProblem {
  num: number;       // alias for id
  metaFreq: "High" | "Medium" | "Low" | "None";
  topics: string[];  // topic split by comma
}

// Map CTCI_PROBLEMS to extended shape
export const CTCI_QUESTIONS: CTCIQuestion[] = CTCI_PROBLEMS.map(p => ({
  ...p,
  num: p.id,
  metaFreq: p.id <= 50 ? "High" : p.id <= 150 ? "Medium" : p.id <= 300 ? "Low" : "None",
  topics: p.topic.split(", "),
}));

export type { CTCIProblem };

export const CTCI_ALL_TOPICS = Array.from(
  new Set(CTCI_QUESTIONS.flatMap(q => q.topics))
).sort();
