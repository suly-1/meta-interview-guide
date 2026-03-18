import { useState, useEffect, useMemo } from "react";

const STORAGE_KEY = "meta-guide-interview-date";

export function useInterviewCountdown() {
  const [dateStr, setDateStr] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      if (dateStr) {
        localStorage.setItem(STORAGE_KEY, dateStr);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [dateStr]);

  const { daysLeft, activeWeekIndex } = useMemo(() => {
    if (!dateStr) return { daysLeft: null, activeWeekIndex: -1 };

    const today      = new Date();
    today.setHours(0, 0, 0, 0);
    const interview  = new Date(dateStr + "T00:00:00");
    const diffMs     = interview.getTime() - today.getTime();
    const daysLeft   = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Map days remaining to the 10-week plan
    // Week boundaries (days before interview):
    // Week 10 (final): 0–7 days left
    // Week 9:          8–14
    // Week 8:          15–21
    // Week 7:          22–28
    // Week 6:          29–35
    // Weeks 3–5:       36–63
    // Weeks 1–2:       64–70+
    let activeWeekIndex = -1;
    if (daysLeft <= 0) {
      activeWeekIndex = 5; // Week 10 — final review
    } else if (daysLeft <= 7) {
      activeWeekIndex = 5; // Week 10
    } else if (daysLeft <= 14) {
      activeWeekIndex = 4; // Weeks 8–9
    } else if (daysLeft <= 21) {
      activeWeekIndex = 4; // Weeks 8–9
    } else if (daysLeft <= 28) {
      activeWeekIndex = 3; // Week 7
    } else if (daysLeft <= 35) {
      activeWeekIndex = 2; // Week 6
    } else if (daysLeft <= 63) {
      activeWeekIndex = 1; // Weeks 3–5
    } else {
      activeWeekIndex = 0; // Weeks 1–2
    }

    return { daysLeft, activeWeekIndex };
  }, [dateStr]);

  return { dateStr, setDateStr, daysLeft, activeWeekIndex };
}
