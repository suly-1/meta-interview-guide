/**
 * CTCIExport — Export solved CTCI problems as CSV, Markdown checklist, or Notes Cheat Sheet
 * Feature: Export solved list + Notes Cheat Sheet
 */
import { useState } from "react";
import { Download, Copy, Check, FileText, Table2, BookOpen } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { useCTCIProgress } from "@/hooks/useCTCIProgress";

export default function CTCIExport() {
  const { progress } = useCTCIProgress();
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

  const solved = CTCI_PROBLEMS.filter(p => progress[p.id]?.solved);
  const starred = CTCI_PROBLEMS.filter(p => progress[p.id]?.starred);
  const withNotes = CTCI_PROBLEMS.filter(p => progress[p.id]?.notes?.trim());

  const generateMarkdown = () => {
    const lines = [
      `# CTCI Solved Problems (${solved.length}/${CTCI_PROBLEMS.length})`,
      `_Generated: ${new Date().toLocaleDateString()}_`,
      "",
      "## Solved",
      ...solved.map(p => {
        const prog = progress[p.id];
        const date = prog?.solvedAt ? ` _(${new Date(prog.solvedAt).toLocaleDateString()})_` : "";
        const star = prog?.starred ? " ⭐" : "";
        const notes = prog?.notes ? `\n  > ${prog.notes}` : "";
        return `- [x] [${p.name}](${p.url}) · ${p.difficulty}${star}${date}${notes}`;
      }),
      "",
      "## Starred (Not Yet Solved)",
      ...starred.filter(p => !progress[p.id]?.solved).map(p =>
        `- [ ] [${p.name}](${p.url}) · ${p.difficulty} ⭐`
      ),
    ];
    return lines.join("\n");
  };

  const generateCSV = () => {
    const header = "ID,Name,URL,Difficulty,Topic,Solved,Starred,SolvedAt,Notes";
    const rows = CTCI_PROBLEMS.filter(p => progress[p.id]?.solved || progress[p.id]?.starred).map(p => {
      const prog = progress[p.id] ?? { solved: false, starred: false, notes: "", solvedAt: undefined };
      const escape = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
      return [
        p.id,
        escape(p.name),
        escape(p.url),
        p.difficulty,
        escape(p.topic),
        prog.solved ? "Yes" : "No",
        prog.starred ? "Yes" : "No",
        prog.solvedAt ? prog.solvedAt.split("T")[0] : "",
        escape(prog.notes ?? ""),
      ].join(",");
    });
    return [header, ...rows].join("\n");
  };

  const generateNotesCheatSheet = () => {
    // Group problems with notes by topic
    const byTopic: Record<string, typeof withNotes> = {};
    for (const p of withNotes) {
      if (!byTopic[p.topic]) byTopic[p.topic] = [];
      byTopic[p.topic].push(p);
    }

    const lines = [
      `# CTCI Problem Notes — Cheat Sheet`,
      `_Generated: ${new Date().toLocaleDateString()} · ${withNotes.length} problems with notes_`,
      "",
    ];

    for (const [topic, problems] of Object.entries(byTopic).sort()) {
      lines.push(`## ${topic}`);
      lines.push("");
      for (const p of problems) {
        const prog = progress[p.id];
        const solved = prog?.solved ? "✅" : "⬜";
        const starred = prog?.starred ? " ⭐" : "";
        lines.push(`### ${solved} [${p.name}](${p.url})${starred}`);
        lines.push(`**Difficulty:** ${p.difficulty} · **Topic:** ${p.topic}`);
        lines.push("");
        // Format notes: indent multi-line notes as blockquote
        const noteLines = (prog?.notes ?? "").trim().split("\n");
        for (const line of noteLines) {
          lines.push(`> ${line}`);
        }
        lines.push("");
        if (prog?.solvedAt) {
          lines.push(`_Solved: ${new Date(prog.solvedAt).toLocaleDateString()}_`);
          lines.push("");
        }
      }
    }

    return lines.join("\n");
  };

  const handleCopyMd = () => {
    navigator.clipboard.writeText(generateMarkdown()).then(() => {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    });
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(generateCSV()).then(() => {
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2000);
    });
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(generateNotesCheatSheet()).then(() => {
      setCopiedNotes(true);
      setTimeout(() => setCopiedNotes(false), 2000);
    });
  };

  const handleDownloadMd = () => {
    const blob = new Blob([generateMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ctci-solved-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([generateCSV()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ctci-progress-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadNotes = () => {
    const blob = new Blob([generateNotesCheatSheet()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ctci-notes-cheatsheet-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Download size={14} className="text-gray-700" />
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Export Progress
        </span>
        <span className="text-xs text-gray-600">
          {solved.length} solved · {starred.length} starred · {withNotes.length} with notes
        </span>
      </div>

      {solved.length === 0 && withNotes.length === 0 ? (
        <p className="text-xs text-gray-600 italic">Solve some problems or add notes first to enable export.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Markdown export */}
          <div className={`border rounded-lg p-3 ${solved.length === 0 ? 'opacity-50' : 'border-gray-200 dark:border-gray-600'}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText size={13} className="text-indigo-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Solved Checklist</span>
            </div>
            <p className="text-[11px] text-gray-600 mb-3">Markdown checklist — paste into Notion, GitHub, or Obsidian</p>
            <div className="flex gap-2">
              <button
                onClick={handleCopyMd}
                disabled={solved.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold border border-gray-200 dark:border-gray-600 rounded-lg hover:border-indigo-300 transition-colors bg-white dark:bg-gray-700 dark:text-gray-200 disabled:opacity-40"
              >
                {copiedMd ? <><Check size={11} className="text-emerald-500" /> Copied!</> : <><Copy size={11} /> Copy</>}
              </button>
              <button
                onClick={handleDownloadMd}
                disabled={solved.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"
              >
                <Download size={11} /> .md
              </button>
            </div>
          </div>

          {/* CSV export */}
          <div className={`border rounded-lg p-3 ${solved.length === 0 ? 'opacity-50' : 'border-gray-200 dark:border-gray-600'}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Table2 size={13} className="text-emerald-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">CSV Spreadsheet</span>
            </div>
            <p className="text-[11px] text-gray-600 mb-3">Full progress data — open in Excel, Sheets, or Airtable</p>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCsv}
                disabled={solved.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold border border-gray-200 dark:border-gray-600 rounded-lg hover:border-emerald-300 transition-colors bg-white dark:bg-gray-700 dark:text-gray-200 disabled:opacity-40"
              >
                {copiedCsv ? <><Check size={11} className="text-emerald-500" /> Copied!</> : <><Copy size={11} /> Copy</>}
              </button>
              <button
                onClick={handleDownloadCsv}
                disabled={solved.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40"
              >
                <Download size={11} /> .csv
              </button>
            </div>
          </div>

          {/* Notes Cheat Sheet export */}
          <div className={`border rounded-lg p-3 ${withNotes.length === 0 ? 'opacity-50' : 'border-amber-200 dark:border-amber-700 bg-amber-100/80 dark:bg-amber-900/10'}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={13} className="text-amber-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Notes Cheat Sheet</span>
            </div>
            <p className="text-[11px] text-gray-600 mb-3">
              {withNotes.length > 0
                ? `${withNotes.length} problems with notes — grouped by topic, with complexity & approach`
                : "Add notes to problems to generate a cheat sheet"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCopyNotes}
                disabled={withNotes.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold border border-amber-200 dark:border-amber-600 rounded-lg hover:border-amber-400 transition-colors bg-white dark:bg-gray-700 dark:text-gray-200 disabled:opacity-40"
              >
                {copiedNotes ? <><Check size={11} className="text-emerald-500" /> Copied!</> : <><Copy size={11} /> Copy</>}
              </button>
              <button
                onClick={handleDownloadNotes}
                disabled={withNotes.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-40"
              >
                <Download size={11} /> .md
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
