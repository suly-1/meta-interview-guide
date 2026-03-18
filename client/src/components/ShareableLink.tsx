// ShareableLink — generates a URL hash encoding interview date + progress state
import { useState, useEffect } from "react";
import { Link2, Copy, Check, Info } from "lucide-react";
import { useShareableLink } from "@/hooks/useShareableLink";
import { decodeShareState, applyShareState } from "@/hooks/useShareableLink";

export default function ShareableLink() {
  const { generateLink } = useShareableLink();
  const [copied, setCopied]     = useState(false);
  const [link, setLink]         = useState("");
  const [applied, setApplied]   = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // On mount: check if URL contains a share hash and apply it
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#share=")) {
      const encoded = hash.slice("#share=".length);
      const state   = decodeShareState(encoded);
      if (state) {
        applyShareState(state);
        // Clean the hash from the URL without reload
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        setApplied(true);
        setTimeout(() => setApplied(false), 4000);
      }
    }
  }, []);

  const handleGenerate = () => {
    const url = generateLink();
    setLink(url);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="space-y-3">
      {/* Applied banner */}
      {applied && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-semibold">
          <Check size={15} className="text-emerald-500" />
          Shared prep state loaded — your interview date and progress have been restored.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-sm font-bold text-gray-800 mb-0.5">Generate Shareable Link</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Creates a URL that encodes your interview date and checklist progress. Open it on any device to restore your state — no account needed.
            </p>
          </div>
          <button onClick={() => setShowInfo((v) => !v)} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5">
            <Info size={15} />
          </button>
        </div>

        {showInfo && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 leading-relaxed">
            <strong>What is encoded:</strong> your interview date, which patterns you've checked off, and which stories you've marked as ready.
            <br /><br />
            <strong>What is NOT encoded:</strong> your Quick Drill ratings, Practice Mode ratings, or story notes — those stay local to your browser.
            <br /><br />
            <strong>Privacy:</strong> all data is encoded in the URL itself — nothing is sent to any server.
          </div>
        )}

        <button
          onClick={handleGenerate}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
            copied ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {copied ? <><Check size={14} /> Copied to clipboard!</> : <><Link2 size={14} /> Copy Shareable Link</>}
        </button>

        {link && !copied && (
          <div className="mt-3 flex items-center gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 truncate focus:outline-none"
            />
            <button
              onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 3000); }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Copy size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
