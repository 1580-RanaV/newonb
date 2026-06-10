"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Globe, Check, Building2 } from "lucide-react";

const INTEMPT_ORGS: Record<string, {
  name: string; domain: string; memberCount: number;
  members: { initial: string; name: string }[];
}> = {
  "acme corp": {
    name: "Acme Corp",
    domain: "acme.co",
    memberCount: 142,
    members: [
      { initial: "D", name: "Dana" },
      { initial: "T", name: "Theo" },
      { initial: "R", name: "Riya" },
    ],
  },
  "globex": {
    name: "Globex",
    domain: "globex.io",
    memberCount: 8,
    members: [
      { initial: "S", name: "Sara" },
      { initial: "K", name: "Kai" },
    ],
  },
};

const SUGGESTIONS = [
  { name: "Acme Corp", domain: "acme.co",  inIntempt: true  },
  { name: "Slack",     domain: "slack.com", inIntempt: false },
];

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

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    setUserName(localStorage.getItem("onboarding_name") || "");
    setUserEmail(localStorage.getItem("onboarding_email") || "");
  }, []);

  const firstName = userName.split(" ")[0];

  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [requestSentTo, setRequestSentTo] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgNameTouched, setOrgNameTouched] = useState(false);
  const [website, setWebsite] = useState("");
  const [websiteTouched, setWebsiteTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const searchResult = query.trim() ? INTEMPT_ORGS[query.toLowerCase()] ?? null : null;

  function handleSelectSuggestion(s: typeof SUGGESTIONS[number]) {
    setQuery(s.name);
    setShowSuggestions(false);
    if (!s.inIntempt) setWebsite(s.domain);
  }

  function orgNameError() {
    if (!orgName.trim()) return "Organization name is required.";
    return "";
  }

  function websiteError() {
    if (!website.trim()) return "Website is required.";
    if (!URL_RE.test(website.trim())) return "Enter a valid website (e.g. www.yourcompany.com)";
    return "";
  }

  const orgNameErr = (orgNameTouched || submitted) ? orgNameError() : "";
  const websiteErr = (websiteTouched || submitted) ? websiteError() : "";

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!orgNameError() && !websiteError()) {
      localStorage.setItem("onboarding_company", orgName.trim());
      localStorage.setItem("onboarding_website", website.trim());
      setLoading(true);
      setTimeout(() => router.push("/connect-email"), 2000);
    }
  }

  function handleRequestJoin() {
    // TODO(api): POST /api/onboarding/request-join { orgId: searchResult.id }
    if (searchResult) setRequestSentTo(searchResult.name);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--brand-white)" }}>
        <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-logo-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--brand-white)" }}>
      <div className="animate-card-in w-full max-w-100 flex flex-col items-center">

        <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-pop-in mb-4" />

        <div className="animate-fade-up text-center mb-8" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
            {firstName ? `Welcome, ${firstName}!` : "Set up your workspace"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            Find your company or create a new organization.
          </p>
        </div>

        <div className="animate-fade-up w-full flex flex-col gap-3" style={{ animationDelay: "0.16s" }}>

          {/* Request sent — success state */}
          {requestSentTo && (
            <div
              className="animate-fade-up w-full rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
              style={{ border: "1.5px solid #030A191A" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#0080FF14" }}
              >
                <Check size={18} style={{ color: "#0080FF" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--brand-black)" }}>
                  Request sent to {requestSentTo}
                </p>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
                  The admin will review it shortly. We'll email you
                  {userEmail ? ` at ${userEmail}` : ""} when you're approved.
                </p>
              </div>
            </div>
          )}

          {/* Search — always shown unless request already sent */}
          {!requestSentTo && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>
                Find your company
              </label>
              <div className="relative">
                <div
                  className="flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:ring-[#0080FF] focus-within:border-transparent"
                  style={{ border: "1.5px solid #030A191F", background: "var(--brand-white)" }}
                >
                  <Search size={15} className="shrink-0" style={{ color: "var(--brand-black)", opacity: 0.35 }} />
                  <input
                    type="text"
                    placeholder="Search by company name or domain..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "var(--brand-black)" }}
                  />
                </div>

                {showSuggestions && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-20"
                    style={{ border: "1.5px solid #030A191F", background: "var(--brand-white)", boxShadow: "0 4px 16px rgba(3,10,25,0.08)" }}
                  >
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={s.name}
                        onMouseDown={() => handleSelectSuggestion(s)}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#030A190A]"
                        style={{ borderTop: i > 0 ? "1px solid #030A190A" : "none" }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: "var(--brand-black)" }}
                        >
                          {s.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "var(--brand-black)" }}>{s.name}</p>
                          <p className="text-xs" style={{ color: "var(--brand-black)", opacity: 0.4 }}>{s.domain}</p>
                        </div>
                        {s.inIntempt && (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: "#0080FF14", color: "#0080FF" }}
                          >
                            On Intempt
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Request to join card — shown when an existing org is matched */}
          {!requestSentTo && searchResult && (
            <div
              className="animate-fade-up w-full rounded-2xl p-4 flex flex-col gap-4"
              style={{ border: "1.5px solid #030A191A" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: "var(--brand-black)" }}
                >
                  {searchResult.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "var(--brand-black)" }}>
                    {searchResult.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--brand-black)", opacity: 0.45 }}>
                    {searchResult.domain} · {searchResult.memberCount} members
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center">
                  {searchResult.members.map((member, i) => (
                    <div
                      key={member.initial}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ring-2 ring-white"
                      style={{
                        background: "var(--brand-black)", color: "#fff",
                        marginLeft: i > 0 ? "-8px" : 0,
                        zIndex: searchResult.members.length - i,
                        position: "relative",
                      }}
                    >
                      {member.initial}
                    </div>
                  ))}
                </div>
                <span className="text-sm" style={{ color: "var(--brand-black)", opacity: 0.55 }}>
                  {searchResult.members.map((m) => m.name).join(", ")}
                  <span className="ml-1.5" style={{ opacity: 0.45 }}>
                    +{searchResult.memberCount - searchResult.members.length}
                  </span>
                </span>
              </div>

              <button
                onClick={handleRequestJoin}
                className="w-full text-white text-sm font-semibold rounded-xl h-11 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "#0080FF" }}
              >
                Request to join {searchResult.name}
              </button>
            </div>
          )}

          {/* OR divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: "#030A191A" }} />
            <span className="text-xs font-medium" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
              {requestSentTo ? "create a new organization" : "or create a new organization"}
            </span>
            <div className="flex-1 h-px" style={{ background: "#030A191A" }} />
          </div>

          {/* Create new org */}
          <form onSubmit={handleContinue} noValidate className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>
                Your organization name
              </label>
              <div
                className={`flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:border-transparent ${orgNameErr ? "focus-within:ring-[#EF4444]" : "focus-within:ring-[#0080FF]"}`}
                style={inputWrapperStyle(!!orgNameErr)}
              >
                <Building2
                  size={15}
                  className="shrink-0"
                  style={{ color: orgNameErr ? "#EF4444" : "var(--brand-black)", opacity: orgNameErr ? 0.7 : 0.35 }}
                />
                <input
                  type="text"
                  placeholder="Acme Inc."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  onBlur={() => setOrgNameTouched(true)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--brand-black)" }}
                />
              </div>
              {orgNameErr && <FieldError msg={orgNameErr} />}
            </div>

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
                  onBlur={() => setWebsiteTouched(true)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--brand-black)" }}
                />
              </div>
              {websiteErr && <FieldError msg={websiteErr} />}
            </div>

            <button
              type="submit"
              className="w-full text-white text-sm font-semibold rounded-xl h-11 transition-all hover:brightness-110 active:scale-[0.98]"
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
