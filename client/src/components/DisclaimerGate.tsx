/**
 * DisclaimerGate — Full-screen overlay that blocks ALL guide content
 * until the user explicitly checks the acknowledgement checkbox and
 * clicks "I Acknowledge — Enter Guide".
 *
 * Acknowledgement is persisted in localStorage so returning users
 * are not blocked again on subsequent visits.
 */

import { useState } from "react";

const STORAGE_KEY = "meta-guide-disclaimer-acknowledged-v2";

interface DisclaimerGateProps {
  children: React.ReactNode;
}

export function useDisclaimerAcknowledged() {
  const [acknowledged, setAcknowledged] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setAcknowledged(true);
  };

  const resetAcknowledgement = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setAcknowledged(false);
  };

  return { acknowledged, acknowledge, resetAcknowledgement };
}

export default function DisclaimerGate({ children }: DisclaimerGateProps) {
  const { acknowledged, acknowledge } = useDisclaimerAcknowledged();
  const [checked, setChecked] = useState(false);
  const [shake, setShake] = useState(false);

  const handleEnter = () => {
    if (!checked) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    acknowledge();
  };

  if (acknowledged) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        overflowY: "auto",
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(29,78,216,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(29,78,216,0.1) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          maxWidth: "700px",
          width: "100%",
          padding: "40px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          margin: "auto",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(29,78,216,0.2)",
              border: "1px solid rgba(29,78,216,0.4)",
              borderRadius: "40px",
              padding: "8px 20px",
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "18px" }}>🔒</span>
            <span style={{ color: "#93c5fd", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em" }}>
              INDEPENDENT STUDY RESOURCE
            </span>
          </div>
          <h1
            style={{
              color: "white",
              fontSize: "clamp(22px, 4vw, 30px)",
              fontWeight: 800,
              margin: "0 0 8px",
              lineHeight: 1.2,
            }}
          >
            Meta IC6/IC7 Interview Guide
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
            Behavioral &amp; Coding Preparation — 2026
          </p>
        </div>

        {/* Warning banner */}
        <div
          style={{
            background: "rgba(217,119,6,0.15)",
            border: "1px solid rgba(217,119,6,0.4)",
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }}>⚠️</span>
          <div>
            <p style={{ color: "#fbbf24", fontWeight: 700, fontSize: "14px", margin: "0 0 2px" }}>
              Disclaimer
            </p>
            <p style={{ color: "#fcd34d", fontSize: "12px", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>
              Please read carefully before proceeding
            </p>
          </div>
        </div>

        {/* Main disclaimer body */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
            maxHeight: "340px",
            overflowY: "auto",
          }}
        >
          {/* Independence */}
          <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 700, margin: "0 0 6px" }}>
            Independence &amp; Non-Affiliation
          </p>
          <p style={{ color: "#cbd5e1", fontSize: "12px", lineHeight: 1.7, margin: "0 0 14px" }}>
            This is an <strong style={{ color: "#e2e8f0" }}>independent study resource</strong> for software engineering interview preparation. It is{" "}
            <strong style={{ color: "#fbbf24" }}>not affiliated with, endorsed by, or connected to Meta Platforms, Inc.</strong>{" "}in any way. All trademarks are property of their respective owners, used here for identification only under nominative fair use.
          </p>

          {/* Accuracy */}
          <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 700, margin: "0 0 6px" }}>
            Accuracy &amp; Currency of Information
          </p>
          <p style={{ color: "#cbd5e1", fontSize: "12px", lineHeight: 1.7, margin: "0 0 14px" }}>
            All content is based on publicly available information and may be <strong style={{ color: "#fbbf24" }}>outdated, incomplete, or inaccurate</strong>. This is not professional or career advice. Always verify details with your recruiter or hiring manager.
          </p>

          {/* Warranty & Liability */}
          <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 700, margin: "0 0 6px" }}>
            No Warranty &amp; Limitation of Liability
          </p>
          <p style={{ color: "#cbd5e1", fontSize: "12px", lineHeight: 1.7, margin: "0 0 14px" }}>
            This guide is provided <strong style={{ color: "#e2e8f0" }}>"AS IS"</strong> without warranty of any kind, express or implied. The author(s) shall not be liable for any damages — direct, indirect, incidental, or consequential — arising from your use of or reliance on this guide. <strong style={{ color: "#fbbf24" }}>No outcome is guaranteed.</strong>
          </p>

          {/* Assumption of Risk */}
          <p style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: 700, margin: "0 0 6px" }}>
            Assumption of Risk &amp; Indemnification
          </p>
          <p style={{ color: "#cbd5e1", fontSize: "12px", lineHeight: 1.7, margin: "0 0 14px" }}>
            By using this guide, you assume all risk, agree you are solely responsible for any decisions made based on its content, and agree to <strong style={{ color: "#e2e8f0" }}>indemnify and hold harmless</strong> the author(s) from any claims arising from your use.
          </p>

          {/* Severability */}
          <p style={{ color: "#94a3b8", fontSize: "11px", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
            If any provision of this disclaimer is unenforceable, the remainder shall remain in effect.
          </p>
        </div>

        {/* Acknowledgement checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            cursor: "pointer",
            marginBottom: "24px",
            padding: "16px",
            background: checked ? "rgba(29,78,216,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${checked ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "10px",
            transition: "all 0.2s",
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{
              width: "18px",
              height: "18px",
              flexShrink: 0,
              marginTop: "2px",
              accentColor: "#3b82f6",
              cursor: "pointer",
            }}
          />
          <span style={{ color: "#e2e8f0", fontSize: "13px", lineHeight: 1.6 }}>
            <strong style={{ color: checked ? "#93c5fd" : "#e2e8f0" }}>☑️ I acknowledge</strong> this guide is independent, not affiliated with Meta, provided without warranty, and that I assume all risk of use.
          </span>
        </label>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          style={{
            width: "100%",
            padding: "16px",
            background: checked
              ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)"
              : "rgba(255,255,255,0.08)",
            border: checked ? "none" : "1px solid rgba(255,255,255,0.15)",
            borderRadius: "10px",
            color: checked ? "white" : "#64748b",
            fontSize: "15px",
            fontWeight: 700,
            cursor: checked ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "0.02em",
            animation: shake ? "shake 0.5s ease" : "none",
            boxShadow: checked ? "0 4px 20px rgba(29,78,216,0.4)" : "none",
          }}
        >
          {checked ? "✓ I Acknowledge — Enter Guide" : "Check the box above to continue"}
        </button>

        {!checked && (
          <p
            style={{
              textAlign: "center",
              color: "#475569",
              fontSize: "12px",
              marginTop: "12px",
              marginBottom: 0,
            }}
          >
            You must acknowledge the disclaimer to access this guide.
          </p>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
