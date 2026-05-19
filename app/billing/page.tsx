"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "Professional",
    tagline: "For individuals",
    popular: false,
    standard: { annual: 18, monthly: 24, credits: 140, billed: 216 },
    premium:  { annual: 74, monthly: 99, credits: 700, billed: 891 },
    features: [
      "Full access to all 15 products",
      "Standard AI Pass per seat",
      "Advanced analytics & reporting",
    ],
    inherit: "Everything in Starter, plus:",
  },
  {
    name: "Organization",
    tagline: "For teams of any size",
    popular: true,
    standard: { annual: 37, monthly: 49, credits: 290,  billed: 441  },
    premium:  { annual: 149, monthly: 199, credits: 1450, billed: 1791 },
    features: [
      "Unlimited teams & projects",
      "Round-robin & delegation",
      "AI coaching & admin controls",
      "Team productivity insights",
    ],
    inherit: "Everything in Professional, plus:",
  },
  {
    name: "Enterprise",
    tagline: "For scaling organizations",
    popular: false,
    standard: { annual: 74,  monthly: 99,  credits: 590,  billed: 891  },
    premium:  { annual: 299, monthly: 399, credits: 2950, billed: 3591 },
    features: [
      "SSO & SCIM",
      "HubSpot CRM sync",
      "Audit logs & compliance",
      "Dedicated support & SLA",
    ],
    inherit: "Everything in Organization, plus:",
  },
];

export default function BillingPage() {
  const [annual, setAnnual] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleDecideLater() {
    setLoading(true);
    setTimeout(() => router.push("/"), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--brand-white)" }}>
        <div className="relative flex items-center justify-center w-24 h-24">
          {/* Spinning ring around logo */}
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              border: "3px solid #0080FF22",
              borderTopColor: "#0080FF",
            }}
          />
          <Image src="/logo.png" alt="Intempt" width={52} height={52} priority />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6" style={{ background: "var(--brand-white)" }}>
      <div className="animate-card-in max-w-5xl mx-auto flex flex-col items-center">

        {/* Logo */}
        <Image
          src="/logo.png"
          alt="Intempt"
          width={56}
          height={56}
          priority
          className="animate-pop-in mb-4"
        />

        {/* Heading */}
        <div className="animate-fade-up text-center mb-8" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
            Pick your plan, choose your seats
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            One platform for Marketing and Sales. Pay a small base fee, then scale with usage.
          </p>
        </div>

        {/* Toggle */}
        <div
          className="animate-fade-up flex items-center p-1 rounded-xl mb-10"
          style={{ background: "#030A190A", animationDelay: "0.12s" }}
        >
          <button
            onClick={() => setAnnual(true)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-lg transition-all"
            style={{
              background: annual ? "var(--brand-white)" : "transparent",
              color: "var(--brand-black)",
              boxShadow: annual ? "0 1px 4px rgba(3,10,25,0.08)" : "none",
            }}
          >
            Annual
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: "#0080FF", color: "#fff" }}
            >
              25% off
            </span>
          </button>
          <button
            onClick={() => setAnnual(false)}
            className="text-sm font-medium px-4 py-1.5 rounded-lg transition-all"
            style={{
              background: !annual ? "var(--brand-white)" : "transparent",
              color: "var(--brand-black)",
              opacity: annual ? 0.5 : 1,
              boxShadow: !annual ? "0 1px 4px rgba(3,10,25,0.08)" : "none",
            }}
          >
            Monthly
          </button>
        </div>

        {/* Plan cards */}
        <div className="animate-fade-up w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-4" style={{ animationDelay: "0.16s" }}>
          {plans.map((plan) => {
            const stdPrice = annual ? plan.standard.annual : plan.standard.monthly;
            const premPrice = annual ? plan.premium.annual : plan.premium.monthly;

            return (
              <div
                key={plan.name}
                className="relative flex flex-col rounded-2xl p-5"
                style={{
                  border: plan.popular ? "2px solid #0080FF" : "1.5px solid #030A191A",
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full text-white"
                    style={{ background: "#0080FF" }}
                  >
                    Most popular
                  </div>
                )}

                {/* Plan name */}
                <div className="mb-4">
                  <p className="text-base font-bold" style={{ color: "var(--brand-black)" }}>{plan.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--brand-black)", opacity: 0.45 }}>{plan.tagline}</p>
                </div>

                {/* Standard seat */}
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--brand-black)", opacity: 0.35 }}>
                  Standard seat
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold" style={{ color: "var(--brand-black)" }}>${stdPrice}</span>
                  <span className="text-sm" style={{ color: "var(--brand-black)", opacity: 0.4 }}>/mo</span>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
                  {plan.standard.credits} credits/mo
                  {annual && <> · ${plan.standard.billed} billed annually</>}
                </p>

                {/* Premium seat */}
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--brand-black)", opacity: 0.35 }}>
                  Premium seat
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold" style={{ color: "var(--brand-black)" }}>${premPrice}</span>
                  <span className="text-sm" style={{ color: "var(--brand-black)", opacity: 0.4 }}>/mo</span>
                </div>
                <p className="text-xs mb-1" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
                  {plan.premium.credits} credits/mo
                  {annual && <> · ${plan.premium.billed} billed annually</>}
                </p>
                <p className="text-xs font-medium mb-5" style={{ color: "#0080FF" }}>5× credits for power users</p>

                {/* Features */}
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--brand-black)" }}>{plan.inherit}</p>
                <ul className="flex flex-col gap-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={13} style={{ color: "#0080FF", marginTop: 2 }} className="shrink-0" />
                      <span className="text-xs leading-relaxed" style={{ color: "var(--brand-black)", opacity: 0.7 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-auto">
                  <button
                    className="w-full h-10 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                    style={{
                      background: plan.popular ? "#0080FF" : "transparent",
                      color: plan.popular ? "#fff" : "var(--brand-black)",
                      border: plan.popular ? "none" : "1.5px solid #030A191F",
                    }}
                  >
                    Continue to checkout
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="animate-fade-up flex items-center gap-6 mt-6"
          style={{ animationDelay: "0.24s" }}
        >
          <button
            onClick={handleDecideLater}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--brand-black)", opacity: 0.4 }}
          >
            I'll decide later
          </button>
          <span style={{ color: "var(--brand-black)", opacity: 0.2 }}>·</span>
          <Link
            href="#"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "#0080FF" }}
          >
            Schedule a call
          </Link>
        </div>

      </div>
    </div>
  );
}
