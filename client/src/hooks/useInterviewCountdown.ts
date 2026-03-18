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

    // Map days remaining to the 4-week plan
    // Week boundaries (days before interview):
    // Week 4 (final): 0–7 days left
    // Week 3:         8–14
    // Week 2:         15–21
    // Week 1:         22–28+
    let activeWeekIndex = -1;
    if (daysLeft <= 0) {
      activeWeekIndex = 3; // Week 4 — final review
    } else if (daysLeft <= 7) {
      activeWeekIndex = 3; // Week 4
    } else if (daysLeft <= 14) {
      activeWeekIndex = 2; // Week 3
    } else if (daysLeft <= 21) {
      activeWeekIndex = 1; // Week 2
    } else {
      activeWeekIndex = 0; // Week 1
    }

    return { daysLeft, activeWeekIndex };
  }, [dateStr]);

  return { dateStr, setDateStr, daysLeft, activeWeekIndex };
}
