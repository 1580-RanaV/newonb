"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const API_KEY = "1idhE0Bg4BXpFRYkYnt";
const logo = (domain: string) => `https://cdn.brandfetch.io/${domain}/icon?c=${API_KEY}`;

function BrandLogo({ src, name, bg, label, dark }: {
  src?: string | null; name: string; bg?: string | null; label?: string; dark?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} width={44} height={44} className="object-contain" onError={() => setFailed(true)} />
    );
  }
  if (label) {
    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: bg ?? "#f4f4f5", color: dark ? "#030A19" : "#fff" }}>
        {label}
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: "#0080FF", color: "#fff" }}>
      {name[0]}
    </div>
  );
}

const connectors = [
  { name: "HubSpot",  type: "Source",      description: "Sync contacts, companies, and deals from HubSpot CRM.",   src: logo("hubspot.com") },
  { name: "Shopify",  type: "Source",      description: "Import products, orders, and customer data from Shopify.", src: logo("shopify.com") },
  { name: "Stripe",   type: "Source",      description: "Track payments, subscriptions, and revenue metrics.",      src: logo("stripe.com") },
  { name: "Twilio",   type: "Destination", description: "Enable SMS and voice communication channels.",             src: logo("twilio.com") },
  { name: "Slack",    type: "Destination", description: "Get real-time notifications in your Slack workspace.",     src: logo("slack.com") },
];

const sdks = [
  { name: "Web",     type: "Source", description: "Add website tracking with our JavaScript SDK.",      src: logo("js.org"),      bg: "#F7DF1E", label: "JS",  dark: true },
  { name: "iOS",     type: "Source", description: "Track events from your iOS mobile application.",     src: logo("apple.com"),   bg: null },
  { name: "Android", type: "Source", description: "Track events from your Android mobile application.", src: logo("android.com"), bg: null },
  { name: "Node.JS", type: "Source", description: "Server-side event tracking with Node.js SDK.",       src: logo("nodejs.org"),  bg: null },
  { name: "API",     type: "Source", description: "Direct API integration for custom implementations.", src: null,                bg: "#0080FF", label: "</>", dark: false },
];

function ToolCard({ name, type, description, src, bg, label, dark }: {
  name: string; type: string; description: string;
  src?: string | null; bg?: string | null; label?: string; dark?: boolean;
}) {
  return (
    <div className="group relative flex flex-col items-center gap-1.5 p-3 cursor-pointer rounded-xl transition-colors hover:bg-[#030A190A]">
      {/* Logo — no box */}
      <div className="w-12 h-12 flex items-center justify-center">
        <BrandLogo src={src} name={name} bg={bg} label={label} dark={dark} />
      </div>

      <p className="text-sm font-semibold text-center" style={{ color: "var(--brand-black)" }}>{name}</p>
      <span
        className="text-xs font-medium"
        style={{ color: type === "Source" ? "#0080FF" : "#8B5CF6" }}
      >
        {type}
      </span>

      {/* Tooltip */}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-xl px-3 py-2.5 text-xs leading-relaxed text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
        style={{ background: "var(--brand-black)" }}
      >
        {description}
        <span
          className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
          style={{ borderTopColor: "var(--brand-black)" }}
        />
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: "var(--brand-white)" }}>
      <div className="animate-card-in w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <Image
            src="/logo.png"
            alt="Intempt"
            width={56}
            height={56}
            priority
            className="animate-pop-in mx-auto mb-4"
          />
          <div className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
              Which tools would you like to integrate?
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
              Select the tools you want to connect to power your marketing automation.
            </p>
          </div>
        </div>

        {/* Connectors */}
        <div className="animate-fade-up grid grid-cols-5 gap-2 mb-8" style={{ animationDelay: "0.16s" }}>
          {connectors.map((t) => <ToolCard key={t.name} {...t} />)}
        </div>

        {/* SDKs */}
        <div className="animate-fade-up grid grid-cols-5 gap-2" style={{ animationDelay: "0.18s" }}>
          {sdks.map((t) => <ToolCard key={t.name} {...t} />)}
        </div>

        {/* Footer */}
        <div className="animate-fade-up flex justify-center mt-10" style={{ animationDelay: "0.24s" }}>
          <Link
            href="/billing"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--brand-black)", opacity: 0.4 }}
          >
            Skip for now
          </Link>
        </div>

      </div>
    </div>
  );
}
