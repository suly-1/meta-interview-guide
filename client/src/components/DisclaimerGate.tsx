/**
 * DisclaimerGate — Full-screen overlay that blocks ALL guide content
 * until the user explicitly checks the acknowledgement checkbox and
 * clicks "I Acknowledge — Enter Guide".
 *
 * Acknowledgement is persisted in localStorage so returning users
 * are not blocked again on subsequent visits.
 */

import { useState } from "react";

const STORAGE_KEY = "meta-guide-disclaimer-acknowledged";

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
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: "absolute",
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
          maxWidth: "680px",
          width: "100%",
          padding: "40px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Meta logo area */}
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
              CONFIDENTIAL DOCUMENT
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
            marginBottom: "24px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }}>⚠️</span>
          <div>
            <p style={{ color: "#fbbf24", fontWeight: 700, fontSize: "14px", margin: "0 0 4px" }}>
              Important Disclaimer
            </p>
            <p style={{ color: "#fcd34d", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
              This guide is provided as <strong>supplementary preparation material only</strong> and is
              intended to offer additional support as you prepare for your upcoming interviews. It does
              not replace any official communication or preparation resources.
            </p>
          </div>
        </div>

        {/* Disclaimer bullets */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <ul style={{ margin: 0, padding: "0 0 0 18px", listStyle: "none" }}>
            {[
              "Your official interview preparation materials will be sent to you directly via email — please follow those guidelines closely.",
              "For the most up-to-date and comprehensive guidance on Meta's interview process, please visit metacareers.com.",
              "If there is any discrepancy between this guide and the official materials, always defer to the official resources.",
            ].map((item, i) => (
              <li
                key={i}
                style={{
                  color: "#cbd5e1",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  marginBottom: i < 2 ? "12px" : 0,
                  paddingLeft: "8px",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "-14px",
                    color: "#60a5fa",
                    fontWeight: 700,
                  }}
                >
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Confidentiality notice */}
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "28px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "16px" }}>🔐</span>
          <p style={{ color: "#fca5a5", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
            This document is shared in confidence to support your preparation.{" "}
            <strong>Please do not distribute, copy, or share its contents externally.</strong>
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
          <span style={{ color: "#e2e8f0", fontSize: "14px", lineHeight: 1.5 }}>
            I have read and understood the disclaimer above. I acknowledge that this is supplementary
            material only, I will not distribute it externally, and I will defer to official Meta
            resources for authoritative guidance.
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
          {checked ? "✓ I Acknowledge — Enter Guide" : "Please check the box above to continue"}
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
