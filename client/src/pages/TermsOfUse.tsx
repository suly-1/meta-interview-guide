import { Link } from "wouter";
import { ArrowLeft, BookOpen, Users, Shield, ExternalLink } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d1b2a]/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/90 hover:text-white text-sm transition-colors">
              <ArrowLeft size={15} />
              Back to Guide
            </button>
          </Link>
          <span className="text-white/20">·</span>
          <span className="text-white/80 text-sm">Terms of Use</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded-full mb-4">
            <Shield size={11} />
            Terms of Use
          </div>
          <h1
            className="text-3xl md:text-4xl font-extrabold mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Independent Study Guide
            <br />
            <span className="text-white/80 text-2xl font-semibold">Terms of Use &amp; Community Guidelines</span>
          </h1>
          <p className="text-white/85 text-sm">Last updated: March 2026</p>
        </div>

        {/* Section 1 — What this guide is */}
        <section className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-blue-400" />
            <h2 className="font-bold text-white text-base">What this guide is</h2>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            This is a free, community-sourced study resource for software engineers preparing for L4–L7 software engineering interviews. It was built by synthesizing publicly available candidate experiences, community forums, YouTube channels, and published interview resources. It is not affiliated with, endorsed by, or connected to any company.
          </p>
        </section>

        {/* Section 2 — Community Contributors */}
        <section className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-emerald-400" />
            <h2 className="font-bold text-white text-base">Who made this</h2>
          </div>
          <p className="text-white/70 text-sm leading-relaxed mb-3">
            This guide was created and is maintained by <strong className="text-white">Community Contributors</strong> — a group of software engineers who went through the L4–L7 interview process and wanted to share what they learned. No individual author is named. No company is responsible for this content.
          </p>
          <p className="text-white/85 text-xs italic">
            Content is synthesized from publicly available sources including NeetCode, Coditioning, HelloInterview, igotanoffer, Taro, Glassdoor, and community forums. All trademarks belong to their respective owners.
          </p>
        </section>

        {/* Section 3 — For recruiters and hiring managers */}
        <section className="mb-8 p-6 rounded-2xl bg-amber-400/5 border border-amber-400/20">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-amber-900" />
            <h2 className="font-bold text-white text-base">A note for recruiters and hiring managers</h2>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            This is a community guide for self-directed learners. If you're a recruiter or hiring manager thinking about sharing it — totally your call, but it's worth checking your company's guidelines on external resources first. This guide works best when candidates discover it on their own anyway.
          </p>
          <div className="mt-4 p-3 rounded-xl bg-amber-400/10 border border-amber-400/20">
            <p className="text-amber-800 text-xs font-semibold mb-1">Always refer first to official materials</p>
            <p className="text-white/90 text-xs mb-2">Candidates should always use the official preparation materials provided by their recruiter or hiring manager, including:</p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.metacareers.com/swe-prep-techscreen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#4d9fff] hover:text-blue-300 text-xs font-semibold underline underline-offset-2 transition-colors"
              >
                Meta Technical Screen Guide <ExternalLink size={10} />
              </a>
              <a
                href="https://www.metacareers.com/swe-prep-onsite"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#4d9fff] hover:text-blue-300 text-xs font-semibold underline underline-offset-2 transition-colors"
              >
                Meta Full Loop Interview Guide <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </section>

        {/* Section 4 — No warranty */}
        <section className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="font-bold text-white text-base mb-3">Accuracy & no warranty</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            This guide is provided "as is" without any warranty of accuracy, completeness, or fitness for a particular purpose. Interview processes change frequently. Always verify information against the most current official sources. The community contributors are not responsible for any outcomes related to the use of this guide.
          </p>
        </section>

        {/* Section 5 — Personal use */}
        <section className="mb-10 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="font-bold text-white text-base mb-3">Personal use only</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            This guide is provided for personal, self-directed educational use. It is free to access and share as a link. Please do not reproduce or redistribute the full content on other platforms without attribution to the community source.
          </p>
        </section>

        {/* Back link */}
        <div className="text-center">
          <Link href="/">
            <button className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">
              <ArrowLeft size={14} />
              Back to the Guide
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
