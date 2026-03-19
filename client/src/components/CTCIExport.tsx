/**
 * CTCIExport — Export solved CTCI problems as CSV or Markdown checklist
 * Feature: Export solved list
 */
import { useState } from "react";
import { Download, Copy, Check, FileText, Table2 } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { useCTCIProgress } from "@/hooks/useCTCIProgress";

export default function CTCIExport() {
  const { progress } = useCTCIProgress();
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);

  const solved = CTCI_PROBLEMS.filter(p => progress[p.id]?.solved);
  const starred = CTCI_PROBLEMS.filter(p => progress[p.id]?.starred);

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

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Download size={14} className="text-gray-500" />
        <span className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Export Progress</span>
        <span className="text-xs text-gray-400">{solved.length} solved · {starred.length} starred</span>
      </div>

      {solved.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Solve some problems first to enable export.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Markdown export */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText size={13} className="text-indigo-500" />
              <span className="text-xs font-bold text-gray-700">Markdown</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Checklist format — paste into Notion, GitHub, or Obsidian</p>
            <div className="flex gap-2">
              <button onClick={handleCopyMd} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors bg-white">
                {copiedMd ? <><Check size={11} className="text-emerald-500" /> Copied!</> : <><Copy size={11} /> Copy</>}
              </button>
              <button onClick={handleDownloadMd} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Download size={11} /> .md
              </button>
            </div>
          </div>

          {/* CSV export */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Table2 size={13} className="text-emerald-500" />
              <span className="text-xs font-bold text-gray-700">CSV Spreadsheet</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Full progress data — open in Excel, Sheets, or Airtable</p>
            <div className="flex gap-2">
              <button onClick={handleCopyCsv} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors bg-white">
                {copiedCsv ? <><Check size={11} className="text-emerald-500" /> Copied!</> : <><Copy size={11} /> Copy</>}
              </button>
              <button onClick={handleDownloadCsv} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                <Download size={11} /> .csv
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
