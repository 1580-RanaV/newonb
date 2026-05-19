"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Send, Sparkles, X } from "lucide-react";

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

type Role = "blu" | "user";
interface Message {
  id: number;
  role: Role;
  text: string;
  chips?: string[];
  tools?: SuggestedTool[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: "blu",
    text: "Your company profile looks great! I've saved everything. 🎉",
  },
  {
    id: 2,
    role: "blu",
    text: "I'm Blu, your onboarding assistant. I'll help you get Intempt set up so it starts working for your team from day one.\n\nWhat's the main thing you want to achieve first?",
    chips: ["Qualify my pipeline", "Nurture leads", "Track conversions", "All of the above"],
  },
];

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

const REPLIES: Record<string, string> = {
  "Qualify my pipeline":
    "Perfect. Pipeline qualification is where Intempt shines. Here are the integrations I'd suggest to get you started:",
  "Nurture leads":
    "Great choice. I'll set up lifecycle sequences so no lead falls through the cracks. These tools will power your nurture flows:",
  "Track conversions":
    "On it. I'll connect your conversion events and build a funnel report. You'll want these connected first:",
  "All of the above":
    "Love the ambition! Here are the top integrations to unlock full lifecycle visibility from day one:",
};

const FALLBACK =
  "Got it! I'm making a note of that. Once we finish setup you'll be able to configure this in detail from your dashboard.";

let nextId = 10;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function sendMessage(text: string) {
    if (!text.trim() || thinking) return;

    const userMsg: Message = { id: nextId++, role: "user", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const replyText = REPLIES[text.trim()] ?? FALLBACK;
      const tools = TOOL_SUGGESTIONS[text.trim()];
      setMessages((m) => [...m, { id: nextId++, role: "blu", text: replyText, tools }]);
      setThinking(false);
    }, 1000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 gap-0"
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
                href="/integrations"
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

      {/* Branding — consistent with all other screens */}
      <div className="w-full max-w-xl flex flex-col items-center mb-6 relative">
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
      <div className="animate-card-in w-full max-w-xl flex flex-col" style={{ height: "460px" }}>

        {/* Messages with blur masks */}
        <div className="relative flex-1 overflow-hidden">
          {/* Top fade */}
          <div
            className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, var(--brand-white), transparent)" }}
          />
          {/* Bottom fade */}
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
                <div className="flex flex-col gap-2 max-w-[82%]">
                  <div
                    className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
                    style={{ background: "#030A190A", color: "var(--brand-black)", whiteSpace: "pre-line" }}
                  >
                    {msg.text}
                  </div>

                  {/* Tool suggestion cards */}
                  {msg.tools && (
                    <div className="flex flex-col gap-1.5">
                      {msg.tools.map((tool) => (
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
                          <button
                            className="text-xs font-semibold text-white px-3 h-7 rounded-lg shrink-0 transition-all hover:brightness-110"
                            style={{ background: "#0080FF" }}
                          >
                            Connect
                          </button>
                        </div>
                      ))}
                      <Link
                        href="/integrations"
                        className="text-xs font-medium mt-1 flex items-center gap-1 transition-opacity hover:opacity-70"
                        style={{ color: "#0080FF" }}
                      >
                        See all integrations
                      </Link>
                    </div>
                  )}

                  {/* Quick-reply chips */}
                  {msg.chips && (
                    <div className="flex flex-wrap gap-2">
                      {msg.chips.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => sendMessage(chip)}
                          disabled={thinking}
                          className="text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:brightness-110 disabled:opacity-40"
                          style={{ border: "1.5px solid #0080FF", color: "#0080FF", background: "#0080FF0D" }}
                        >
                          {chip}
                        </button>
                      ))}
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
            <div className="flex items-center gap-3 animate-fade-up">
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
