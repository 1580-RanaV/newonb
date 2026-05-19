"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

const initial = {
  targetAudience:
    "Growth and revenue teams at B2B SaaS companies seeking to streamline customer lifecycle management and reduce churn.",
  brandIdentity:
    "Modern, data-driven, and intelligent — positioned as the AI-powered revenue layer that bridges marketing, sales, and customer success.",
  businessModel: "B2B SaaS",
  productsServices:
    "AI-driven lifecycle orchestration platform with pipeline qualification, conversion automation, and customer engagement tools.",
};

type Field = keyof typeof initial;

const fields: { key: Field; label: string }[] = [
  { key: "targetAudience", label: "Target audience" },
  { key: "brandIdentity", label: "Brand identity" },
  { key: "businessModel", label: "Business model" },
  { key: "productsServices", label: "Products & services" },
];

export default function AssistantPage() {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState(initial);
  const [draft, setDraft] = useState(initial);

  function startEdit() {
    setDraft(data);
    setEditing(true);
  }

  function saveEdit() {
    setData(draft);
    setEditing(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--brand-white)" }}
    >
      <div className="animate-card-in w-full max-w-lg flex flex-col items-center">

        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Intempt"
          width={56}
          height={56}
          priority
          className="animate-pop-in mb-4"
        />

        {/* Header */}
        <div className="animate-fade-up text-center mb-8" style={{ animationDelay: "0.08s" }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={15} style={{ color: "#0080FF" }} />
            <span className="text-sm font-semibold" style={{ color: "#0080FF" }}>
              Blu Onboarding Assistant
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "#0080FF14", color: "#0080FF" }}
            >
              Beta
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
            Here's what we found
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            Review your company profile and confirm the details look right.
          </p>
        </div>

        {/* Card */}
        <div
          className="animate-fade-up w-full rounded-2xl p-6 mb-5"
          style={{ animationDelay: "0.16s" }}
        >
          {/* Company name row */}
          <div
            className="flex items-baseline gap-2 pb-4 mb-5"
            style={{ borderBottom: "1px solid #030A190F" }}
          >
            <span className="text-base font-bold" style={{ color: "var(--brand-black)" }}>
              Intempt
            </span>
            <span className="text-sm" style={{ color: "var(--brand-black)", opacity: 0.35 }}>
              · intempt.com
            </span>
          </div>

          {/* Fields */}
          <div className={editing ? "flex flex-col gap-4" : "grid grid-cols-2 gap-x-8 gap-y-6"}>
            {fields.map(({ key, label }) => (
              <div key={key}>
                <p
                  className="text-xs font-semibold mb-2 uppercase tracking-widest"
                  style={{ color: "var(--brand-black)", opacity: 0.35 }}
                >
                  {label}
                </p>
                {editing ? (
                  <textarea
                    rows={key === "businessModel" ? 2 : 3}
                    value={draft[key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    className="w-full text-sm rounded-xl px-4 py-3 outline-none resize-none transition-all focus-within:ring-2 focus:ring-2 focus:ring-[#0080FF] focus:border-transparent"
                    style={{
                      color: "var(--brand-black)",
                      border: "1.5px solid #030A191F",
                      background: "#030A190A",
                      lineHeight: "1.65",
                    }}
                  />
                ) : (
                  <p
                    className="text-sm"
                    style={{ color: "var(--brand-black)", opacity: 0.72, lineHeight: "1.65" }}
                  >
                    {data[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions — right-aligned */}
        <div
          className="animate-fade-up flex items-center justify-end gap-3 w-full"
          style={{ animationDelay: "0.24s" }}
        >
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="text-sm font-medium rounded-xl px-5 h-10 transition-all hover:bg-[#030A190A]"
                style={{ border: "1.5px solid #030A191F", color: "var(--brand-black)" }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="text-white text-sm font-semibold rounded-xl px-5 h-10 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "#0080FF" }}
              >
                Save changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="text-sm font-medium rounded-xl px-5 h-10 transition-all hover:bg-[#030A190A]"
                style={{ border: "1.5px solid #030A191F", color: "var(--brand-black)" }}
              >
                Edit
              </button>
              <Link
                href="/chat"
                className="text-white text-sm font-semibold rounded-xl px-5 h-10 transition-all hover:brightness-110 active:scale-[0.98] flex items-center"
                style={{ background: "#0080FF" }}
              >
                Looks good
              </Link>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
