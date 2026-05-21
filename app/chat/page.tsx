"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, X, Globe, Check } from "lucide-react";

const BF = (domain: string) => `https://cdn.brandfetch.io/${domain}/icon?c=1idhE0Bg4BXpFRYkYnt`;

function BrandLogo({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "#0080FF" }}>
        {name[0]}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={28} height={28} className="object-contain" onError={() => setFailed(true)} />
  );
}

interface SuggestedTool {
  name: string;
  type: string;
  src: string;
}

interface CompanyProfile {
  name: string;
  domain: string;
  fields: { label: string; value: string }[];
}

type Role = "blu" | "user";
interface Message {
  id: number;
  role: Role;
  text: string;
  chips?: string[];
  tools?: SuggestedTool[];
  profile?: CompanyProfile;
}

// TODO(api): replace with GET /api/onboarding/company-profile — returns CompanyProfile for the authenticated user's domain
const COMPANY_PROFILE: CompanyProfile = {
  name: "Intempt",
  domain: "intempt.com",
  fields: [
    { label: "Target audience",     value: "Growth and revenue teams at B2B SaaS companies seeking to streamline customer lifecycle management and reduce churn." },
    { label: "Brand identity",      value: "Modern, data-driven, and intelligent. Positioned as the AI-powered revenue layer that bridges marketing, sales, and customer success." },
    { label: "Business model",      value: "B2B SaaS" },
    { label: "Products & services", value: "AI-driven lifecycle orchestration platform with pipeline qualification, conversion automation, and customer engagement tools." },
  ],
};

function getProfile(): CompanyProfile {
  if (typeof window === "undefined") return COMPANY_PROFILE;
  const name = localStorage.getItem("onboarding_company") || COMPANY_PROFILE.name;
  const raw = localStorage.getItem("onboarding_website") || "";
  const domain = raw ? raw.replace(/^https?:\/\//, "").replace(/\/$/, "") : COMPANY_PROFILE.domain;
  return { ...COMPANY_PROFILE, name, domain };
}

const GOAL_CHIPS = ["Qualify my pipeline", "Nurture leads", "Track conversions", "All of the above"];


// TODO(api): replace with GET /api/onboarding/tool-suggestions?goal=<goal> — returns recommended integrations per onboarding goal
const TOOL_SUGGESTIONS: Record<string, SuggestedTool[]> = {
  "Qualify my pipeline": [
    { name: "HubSpot", type: "Source",      src: BF("hubspot.com") },
    { name: "Stripe",  type: "Source",      src: BF("stripe.com") },
    { name: "Slack",   type: "Destination", src: BF("slack.com") },
  ],
  "Nurture leads": [
    { name: "HubSpot", type: "Source",      src: BF("hubspot.com") },
    { name: "Twilio",  type: "Destination", src: BF("twilio.com") },
    { name: "Slack",   type: "Destination", src: BF("slack.com") },
  ],
  "Track conversions": [
    { name: "Stripe",  type: "Source", src: BF("stripe.com") },
    { name: "Shopify", type: "Source", src: BF("shopify.com") },
    { name: "Node.JS", type: "Source", src: BF("nodejs.org") },
  ],
  "All of the above": [
    { name: "HubSpot", type: "Source",      src: BF("hubspot.com") },
    { name: "Stripe",  type: "Source",      src: BF("stripe.com") },
    { name: "Slack",   type: "Destination", src: BF("slack.com") },
  ],
};

const REPLY_MESSAGES: Record<string, { text: string; chips?: string[]; tools?: SuggestedTool[] }> = {
  "Looks good": {
    text: "I'm Blu, your onboarding assistant. I'll help you get Intempt set up so it starts working for your team from day one.\n\nWhat's the main thing you want to achieve first?",
    chips: GOAL_CHIPS,
  },
  "Qualify my pipeline": {
    text: "Perfect. Pipeline qualification is where Intempt shines. Here are the integrations I'd suggest to get you started:",
    tools: TOOL_SUGGESTIONS["Qualify my pipeline"],
  },
  "Nurture leads": {
    text: "Great choice. I'll set up lifecycle sequences so no lead falls through the cracks. These tools will power your nurture flows:",
    tools: TOOL_SUGGESTIONS["Nurture leads"],
  },
  "Track conversions": {
    text: "On it. I'll connect your conversion events and build a funnel report. You'll want these connected first:",
    tools: TOOL_SUGGESTIONS["Track conversions"],
  },
  "All of the above": {
    text: "Love the ambition! Here are the top integrations to unlock full lifecycle visibility from day one:",
    tools: TOOL_SUGGESTIONS["All of the above"],
  },
};

const FALLBACK = { text: "Got it! I'm making a note of that. Once we finish setup you'll be able to configure this in detail from your dashboard." };

const DIVE_IN_MESSAGE = {
  id: -1,
  role: "blu" as Role,
  text: "Do you wish to dive into Intempt?",
  chips: ["Yes, let's go!", "Maybe later"],
};

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("onboarding_name") || "" : "";
    const firstName = stored.split(" ")[0];
    return [
      {
        id: 1,
        role: "blu",
        text: firstName
          ? `Hey ${firstName}! Here's what I found about your company. Does everything look right?`
          : "Here's what I found about your company. Does everything look right?",
        profile: getProfile(),
        chips: ["Looks good", "Edit details"],
      },
    ];
  });
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileFields, setProfileFields] = useState(() => getProfile().fields);
  const [profileDraft, setProfileDraft] = useState(() => getProfile().fields);
  const [connectingTool, setConnectingTool] = useState<string | null>(null);
  const [connectedTools, setConnectedTools] = useState<string[]>([]);
  const [selectedChips, setSelectedChips] = useState<Record<number, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(10);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, thinking]);

  function sendMessage(text: string) {
    if (!text.trim() || thinking) return;

    const userMsg: Message = { id: nextId.current++, role: "user", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const reply = REPLY_MESSAGES[text.trim()] ?? FALLBACK;
      setMessages((m) => [...m, { id: nextId.current++, role: "blu", ...reply }]);
      setThinking(false);
    }, 1000);
  }

  function handleChip(chip: string, msgId: number) {
    setSelectedChips((prev) => ({ ...prev, [msgId]: chip }));

    if (chip === "Edit details") {
      setProfileDraft(profileFields);
      setProfileEditing(true);
    } else if (chip === "Yes, let's go!" || chip === "Dive into Intempt") {
      const userMsg: Message = { id: nextId.current++, role: "user", text: chip };
      setMessages((m) => [...m, userMsg]);
      setTimeout(() => router.push("/billing"), 800);
    } else if (chip === "Maybe later") {
      const userMsg: Message = { id: nextId.current++, role: "user", text: chip };
      setMessages((m) => [...m, userMsg]);
      setThinking(true);
      setTimeout(() => {
        setMessages((m) => [...m, { id: nextId.current++, role: "blu", text: "No worries! You can connect more tools from your dashboard anytime." }]);
        setThinking(false);
        setTimeout(() => {
          setMessages((m) => [...m, { id: nextId.current++, role: "blu", text: "What would you like to know about Intempt?", chips: ["How does it work?", "What can I automate?", "Dive into Intempt"] }]);
        }, 700);
      }, 1000);
    } else {
      sendMessage(chip);
    }
  }

  function handleConnect(tool: SuggestedTool, msgTools: SuggestedTool[]) {
    if (connectingTool) return;
    setConnectingTool(tool.name);

    setTimeout(() => {
      const updated = [...connectedTools, tool.name];
      const remaining = msgTools.filter((t) => !updated.includes(t.name));

      const successMsg: Message = {
        id: nextId.current++,
        role: "blu",
        text: `${tool.name} connected successfully!${remaining.length > 0 ? " Do you want to connect the rest as well?" : ""}`,
        tools: remaining.length > 0 ? remaining : undefined,
      };

      setConnectingTool(null);
      setConnectedTools(updated);
      setMessages((m) => [...m, successMsg]);

      setTimeout(() => {
        setMessages((m) => [...m, { ...DIVE_IN_MESSAGE, id: nextId.current++ }]);
      }, 700);
    }, 2000);
  }

  const CHAR_LIMIT = 500;

  function saveProfile(msgId: number) {
    if (profileDraft.some((f) => f.value.length > CHAR_LIMIT)) return;
    setProfileFields(profileDraft);
    setProfileEditing(false);
    setSelectedChips((prev) => { const next = { ...prev }; delete next[msgId]; return next; });
  }

  function cancelEdit(msgId: number) {
    setProfileDraft(profileFields);
    setProfileEditing(false);
    setSelectedChips((prev) => { const next = { ...prev }; delete next[msgId]; return next; });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div
      className="h-screen flex flex-col items-center p-6"
      style={{ background: "var(--brand-white)" }}
    >
      {/* Skip modal */}
      {showSkipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(3,10,25,0.4)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="animate-card-in w-full max-w-xl rounded-2xl p-6"
            style={{ background: "var(--brand-white)", boxShadow: "0 8px 40px 0 rgba(3,10,25,0.18)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-base font-bold" style={{ color: "var(--brand-black)" }}>
                Skip guided setup?
              </h2>
              <button
                onClick={() => setShowSkipModal(false)}
                aria-label="Close"
                className="rounded-lg p-1 transition-all hover:bg-[#030A190A] -mt-0.5 -mr-1"
                style={{ color: "var(--brand-black)", opacity: 0.4 }}
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--brand-black)", opacity: 0.55 }}>
              This setup uses your answers to tailor tools and recommendations to your goals. If you skip it, your portal will be less personalised and require more manual setup.
            </p>
            <div className="flex items-center gap-2.5">
              <Link
                href="/billing"
                className="flex-1 flex items-center justify-center text-white text-sm font-semibold rounded-xl h-10 transition-all hover:brightness-110"
                style={{ background: "#0080FF" }}
              >
                Skip setup
              </Link>
              <button
                onClick={() => setShowSkipModal(false)}
                className="flex-1 text-sm font-medium rounded-xl h-10 transition-all hover:bg-[#030A190A]"
                style={{ border: "1.5px solid #030A191F", color: "var(--brand-black)" }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branding */}
      <div className="w-full max-w-xl flex flex-col items-center mb-6 pt-4">
        <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-pop-in mb-4" />
        <div className="animate-fade-up text-center" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
            Blu Onboarding Assistant
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            Powered by Intempt
          </p>
        </div>
      </div>

      {/* Chat container */}
      <div className="animate-card-in w-full max-w-xl flex flex-col flex-1 min-h-0">

        {/* Messages with blur masks */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, var(--brand-white), transparent)" }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to top, var(--brand-white), transparent)" }}
          />
          <div className="chat-scroll h-full overflow-y-auto px-1 py-5 flex flex-col gap-4">
            {messages.map((msg) =>
              msg.role === "blu" ? (
                <div key={msg.id} className="flex items-start gap-3 animate-fade-up">
                  <Image
                    src="/logo.png"
                    alt="Blu"
                    width={28}
                    height={28}
                    className="rounded-full shrink-0 mt-0.5"
                  />
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {/* Text bubble */}
                    <div
                      className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed self-start max-w-[82%]"
                      style={{ background: "#030A190A", color: "var(--brand-black)", whiteSpace: "pre-line" }}
                    >
                      {msg.text}
                    </div>

                    {/* Company profile card */}
                    {msg.profile && (
                      <div className="rounded-2xl p-4" style={{ border: "1.5px solid #030A191A" }}>
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-sm font-bold" style={{ color: "var(--brand-black)" }}>
                            {msg.profile.name}
                          </span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
                            <Globe size={11} />
                            {msg.profile.domain}
                          </span>
                        </div>

                        {profileEditing ? (
                          /* Edit mode */
                          <div className="flex flex-col gap-3">
                            {profileDraft.map(({ label, value }, i) => {
                              const len = value.length;
                              const overLimit = len > CHAR_LIMIT;
                              const showCounter = len > 400;
                              const counterColor = overLimit ? "#EF4444" : len >= 450 ? "#F59E0B" : "var(--brand-black)";
                              return (
                                <div key={label}>
                                  <p className="text-xs font-semibold mb-1" style={{ color: "#0080FF" }}>
                                    {label}
                                  </p>
                                  <textarea
                                    rows={label === "Business model" ? 1 : 2}
                                    value={value}
                                    maxLength={CHAR_LIMIT}
                                    onChange={(e) => {
                                      const next = [...profileDraft];
                                      next[i] = { label, value: e.target.value };
                                      setProfileDraft(next);
                                    }}
                                    className={`w-full text-xs rounded-xl px-3 py-2.5 outline-none resize-none focus:ring-2 focus:border-transparent ${overLimit ? "focus:ring-[#EF4444]" : "focus:ring-[#0080FF]"}`}
                                    style={{
                                      border: `1.5px solid ${overLimit ? "#EF4444" : "#030A191F"}`,
                                      background: "#030A190A",
                                      color: "var(--brand-black)",
                                      lineHeight: "1.65",
                                    }}
                                  />
                                  {showCounter && (
                                    <p className="text-xs text-right mt-1 font-medium" style={{ color: counterColor, opacity: overLimit ? 1 : 0.7 }}>
                                      {len}/{CHAR_LIMIT}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => cancelEdit(msg.id)}
                                className="flex-1 text-xs font-medium rounded-xl h-9 transition-all hover:bg-[#030A190A]"
                                style={{ border: "1.5px solid #030A191F", color: "var(--brand-black)" }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveProfile(msg.id)}
                                disabled={profileDraft.some((f) => f.value.length > CHAR_LIMIT)}
                                className="flex-1 text-xs font-semibold rounded-xl h-9 text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: "#0080FF" }}
                              >
                                Save changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View mode — 2×2 grid */
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            {profileFields.map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-xs font-semibold mb-1" style={{ color: "#0080FF" }}>
                                  {label}
                                </p>
                                <p className="text-xs leading-relaxed" style={{ color: "var(--brand-black)", opacity: 0.75 }}>
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tool suggestion cards */}
                    {msg.tools && (
                      <div className="flex flex-col gap-1.5 max-w-[82%]">
                        {msg.tools.map((tool) => {
                          const isConnected = connectedTools.includes(tool.name);
                          const isConnecting = connectingTool === tool.name;
                          return (
                            <div
                              key={tool.name}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                              style={{ border: "1.5px solid #030A191A" }}
                            >
                              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                <BrandLogo src={tool.src} name={tool.name} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold" style={{ color: "var(--brand-black)" }}>
                                  {tool.name}
                                </span>
                                <span
                                  className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: tool.type === "Source" ? "#0080FF14" : "#C495F014",
                                    color: tool.type === "Source" ? "#0080FF" : "#8B5CF6",
                                  }}
                                >
                                  {tool.type}
                                </span>
                              </div>
                              {isConnected ? (
                                <div className="inline-flex items-center gap-1 text-xs font-semibold px-3 h-7 rounded-lg shrink-0" style={{ background: "#0080FF14", color: "#0080FF" }}>
                                  <Check size={11} />
                                  Connected
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleConnect(tool, msg.tools!)}
                                  disabled={connectingTool !== null}
                                  className="inline-flex items-center justify-center text-xs font-semibold text-white px-3 h-7 rounded-lg shrink-0 transition-all hover:brightness-110 disabled:opacity-50"
                                  style={{ background: "#0080FF", minWidth: "64px" }}
                                >
                                  {isConnecting ? (
                                    <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                  ) : "Connect"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                        <Link
                          href="/integrations"
                          className="text-xs font-medium mt-1 flex items-center gap-1 transition-opacity hover:opacity-70"
                          style={{ color: "#0080FF" }}
                        >
                          See all integrations
                        </Link>
                      </div>
                    )}

                    {/* Quick-reply chips — hidden while editing profile */}
                    {msg.chips && !profileEditing && (
                      <div className="flex flex-wrap gap-2">
                        {msg.chips.map((chip) => {
                          const isSelected = selectedChips[msg.id] === chip;
                          const hasSelection = selectedChips[msg.id] !== undefined;
                          return (
                            <button
                              key={chip}
                              onClick={() => handleChip(chip, msg.id)}
                              disabled={thinking || hasSelection}
                              className="inline-flex items-center h-7 px-3.5 text-xs font-medium rounded-full transition-all whitespace-nowrap"
                              style={{
                                border: "1.5px solid #0080FF",
                                background: isSelected ? "#0080FF" : "#0080FF0D",
                                color: isSelected ? "#fff" : "#0080FF",
                                opacity: hasSelection && !isSelected ? 0.35 : 1,
                              }}
                            >
                              {chip}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-end animate-fade-up">
                  <div
                    className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[72%]"
                    style={{ background: "#0080FF", color: "#fff" }}
                  >
                    {msg.text}
                  </div>
                </div>
              )
            )}

            {/* Typing indicator */}
            {thinking && (
              <div className="flex items-center gap-3 animate-fade-up" role="status" aria-label="Blu is typing">
                <Image src="/logo.png" alt="Blu" width={28} height={28} className="rounded-full shrink-0" />
                <div
                  className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ background: "#030A190A" }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: "var(--brand-black)", opacity: 0.35, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 pt-3">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-xl px-4 h-11 transition-all focus-within:ring-2 focus-within:ring-[#0080FF]"
            style={{ border: "1.5px solid #030A191F" }}
          >
            <input
              type="text"
              placeholder="Reply to Blu…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--brand-black)" }}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || thinking}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 hover:brightness-110"
              style={{ background: "#0080FF" }}
            >
              <Send size={13} color="#fff" />
            </button>
          </form>
        </div>

        {/* Bottom action */}
        <div className="flex justify-center pt-3 pb-1">
          <button
            onClick={() => setShowSkipModal(true)}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--brand-black)", opacity: 0.35 }}
          >
            Set up manually
          </button>
        </div>
      </div>
    </div>
  );
}
