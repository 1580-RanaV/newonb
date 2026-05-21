"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Globe, Users } from "lucide-react";

// TODO(api): replace with GET /api/onboarding/existing-team — returns team info if another member from the same email domain has already signed up, or null
const EXISTING_TEAM = {
  name: "Acme Corp",
  domain: "acme.co",
  memberCount: 142,
  members: [
    { initial: "D", name: "Dana" },
    { initial: "T", name: "Theo" },
    { initial: "R", name: "Riya" },
  ],
};

const URL_RE = /^(https?:\/\/|www\.)/;

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-xs font-medium mt-1.5" style={{ color: "#EF4444" }}>
      {msg}
    </p>
  );
}

function inputWrapperStyle(hasError: boolean) {
  return {
    border: `1.5px solid ${hasError ? "#EF4444" : "#030A191F"}`,
    background: "var(--brand-white)",
  };
}

export default function OrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("onboarding_name") || "" : ""
  );
  const firstName = userName.split(" ")[0];
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [touched, setTouched] = useState({ company: false, website: false });
  const [submitted, setSubmitted] = useState(false);

  function companyError() {
    if (!company.trim()) return "Company name is required.";
    return "";
  }

  function websiteError() {
    if (!website.trim()) return "Website is required.";
    if (!URL_RE.test(website.trim())) return "Enter a valid website (e.g. www.yourcompany.com)";
    return "";
  }

  const companyErr = (touched.company || submitted) ? companyError() : "";
  const websiteErr = (touched.website || submitted) ? websiteError() : "";

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!companyError() && !websiteError()) {
      localStorage.setItem("onboarding_company", company.trim());
      localStorage.setItem("onboarding_website", website.trim());
      setLoading(true);
      setTimeout(() => router.push("/connect-email"), 2000);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--brand-white)" }}
      >
        <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-logo-pulse" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--brand-white)" }}
    >
      <div className="animate-card-in w-full max-w-100 flex flex-col items-center">

        <Image
          src="/logo.png"
          alt="Intempt"
          width={56}
          height={56}
          priority
          className="animate-pop-in mb-4"
        />

        <div className="animate-fade-up text-center mb-8" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
            {firstName ? `Welcome, ${firstName}!` : "Set up your workspace"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            {firstName ? "Let's get your workspace ready." : "Join your team or start fresh."}
          </p>
        </div>

        <div
          className="animate-fade-up w-full flex flex-col gap-3"
          style={{ animationDelay: "0.16s" }}
        >
          {/* Existing team notice */}
          <div className="flex items-center gap-2 mb-0.5">
            <Users size={14} style={{ color: "#0080FF" }} className="shrink-0" />
            <span className="text-sm font-semibold" style={{ color: "#0080FF" }}>
              Your team is already on Intempt
            </span>
          </div>

          {/* Team card */}
          <div className="w-full rounded-2xl p-4 flex flex-col gap-4" style={{ border: "1.5px solid #030A191A" }}>
            {/* Org identity */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: "var(--brand-black)" }}
              >
                {EXISTING_TEAM.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--brand-black)" }}>
                  {EXISTING_TEAM.name}
                </p>
                <p className="text-xs" style={{ color: "var(--brand-black)", opacity: 0.45 }}>
                  {EXISTING_TEAM.domain} · {EXISTING_TEAM.memberCount} members
                </p>
              </div>
            </div>

            {/* Member avatars */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center">
                {EXISTING_TEAM.members.map((member, i) => (
                  <div
                    key={member.initial}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ring-2 ring-white"
                    style={{
                      background: "var(--brand-black)",
                      color: "#fff",
                      marginLeft: i > 0 ? "-8px" : 0,
                      zIndex: EXISTING_TEAM.members.length - i,
                      position: "relative",
                    }}
                  >
                    {member.initial}
                  </div>
                ))}
              </div>
              <span className="text-sm" style={{ color: "var(--brand-black)", opacity: 0.55 }}>
                {EXISTING_TEAM.members.map((m) => m.name).join(", ")}
                <span className="ml-1.5" style={{ opacity: 0.45 }}>
                  +{EXISTING_TEAM.memberCount - EXISTING_TEAM.members.length}
                </span>
              </span>
            </div>

            {/* Request to join */}
            <button
              className="w-full text-white text-sm font-semibold rounded-xl h-11 transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: "#0080FF" }}
            >
              Request to join {EXISTING_TEAM.name}
            </button>

          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: "#030A191A" }} />
            <span className="text-xs font-medium" style={{ color: "var(--brand-black)", opacity: 0.4 }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#030A191A" }} />
          </div>

          {/* Create new org header */}
          <div className="mb-0.5 text-center">
            <p className="text-base font-bold" style={{ color: "var(--brand-black)" }}>
              Create a new organization
            </p>
          </div>

          <form onSubmit={handleContinue} noValidate className="flex flex-col gap-3">
            {/* Find your company */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>
                Find your company
              </label>
              <div
                className={`flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:border-transparent ${companyErr ? "focus-within:ring-[#EF4444]" : "focus-within:ring-[#0080FF]"}`}
                style={inputWrapperStyle(!!companyErr)}
              >
                <Search
                  size={15}
                  className="shrink-0"
                  style={{ color: companyErr ? "#EF4444" : "var(--brand-black)", opacity: companyErr ? 0.7 : 0.35 }}
                />
                <input
                  type="text"
                  placeholder="Search company name..."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, company: true }))}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--brand-black)" }}
                />
              </div>
              {companyErr && <FieldError msg={companyErr} />}
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>
                Website
              </label>
              <div
                className={`flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:border-transparent ${websiteErr ? "focus-within:ring-[#EF4444]" : "focus-within:ring-[#0080FF]"}`}
                style={inputWrapperStyle(!!websiteErr)}
              >
                <Globe
                  size={15}
                  className="shrink-0"
                  style={{ color: websiteErr ? "#EF4444" : "var(--brand-black)", opacity: websiteErr ? 0.7 : 0.35 }}
                />
                <input
                  type="url"
                  placeholder="www.yourcompany.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, website: true }))}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--brand-black)" }}
                />
              </div>
              {websiteErr && <FieldError msg={websiteErr} />}
            </div>

            <button
              type="submit"
              className="w-full text-white text-sm font-semibold rounded-xl h-11 transition-all hover:brightness-110 active:scale-[0.98] mt-1"
              style={{ background: "#0080FF" }}
            >
              Continue
            </button>
          </form>
        </div>

        <p
          className="animate-fade-up text-sm mt-6"
          style={{ color: "var(--brand-black)", opacity: 0.55, animationDelay: "0.28s" }}
        >
          Already have an account?{" "}
          <a href="/" className="font-semibold underline" style={{ color: "#0080FF" }}>
            Sign in
          </a>
        </p>

      </div>
    </div>
  );
}
