/**
 * CTCITrackerBanner — Reusable "MUST DO" banner linking to the Dinesh Varyani
 * CTCI Progression Tracker spreadsheet. Each tab passes its own contextual
 * message and CTA text so the banner feels relevant everywhere it appears.
 */
import { ExternalLink } from "lucide-react";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1pnI8HmSMPcfwrCCu7wYETCXaKDig4VucZDpcjVRuYrE/edit?gid=237636947#gid=237636947";

interface CTCITrackerBannerProps {
  /** Short headline shown after the emoji icon */
  headline?: string;
  /** One-sentence description explaining why this matters in context */
  description: string;
  /** Text on the bottom CTA bar */
  ctaText: string;
  /** 2–4 emoji feature tags shown as pills */
  tags?: string[];
}

export default function CTCITrackerBanner({
  headline = "🎯 Dinesh Varyani — CRACK THE CODING INTERVIEW 💎🚀",
  description,
  ctaText,
  tags = ["✅ Mark problems solved", "📈 Track confidence", "🔍 Spot weak areas", "🏆 Stay accountable"],
}: CTCITrackerBannerProps) {
  return (
    <a
      href={SHEET_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="relative overflow-hidden rounded-2xl border-4 border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.25)] bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 p-0.5">
        <div className="bg-white rounded-xl px-5 py-4">
          {/* Top badges */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm animate-pulse">
                🚨 MUST DO ‼️
              </span>
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-900 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-300">
                ⚡ HIGH PRIORITY
              </span>
            </div>
            <span className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors font-medium">
              Click to open in Google Sheets →
            </span>
          </div>

          {/* Main content */}
          <div className="mt-3 flex items-start gap-4">
            <div className="text-4xl select-none flex-shrink-0">📊</div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-lg font-extrabold text-gray-900 leading-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {headline}
              </h3>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                <strong className="text-red-700">Track every problem you solve.</strong>{" "}
                {description}
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-semibold border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA bar */}
          <div className="mt-4 flex items-center gap-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl px-4 py-3 group-hover:from-red-100 group-hover:to-orange-100 transition-colors">
            <span className="text-xl">👉</span>
            <span className="text-sm font-bold text-red-700 flex-1">{ctaText}</span>
            <span className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-white bg-red-600 group-hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">
              <ExternalLink size={11} /> Open Sheet
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
