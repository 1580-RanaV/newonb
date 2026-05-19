"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Globe } from "lucide-react";

export default function OrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleContinue() {
    setLoading(true);
    setTimeout(() => router.push("/connect-email"), 2000);
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--brand-white)" }}
      >
        <div className="relative flex items-center justify-center w-24 h-24">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{ border: "3px solid #0080FF22", borderTopColor: "#0080FF" }}
          />
          <Image src="/logo.png" alt="Intempt" width={52} height={52} priority />
        </div>
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
            Create your organization
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            Search your company to auto-fill organization details.
          </p>
        </div>

        <div
          className="animate-fade-up w-full flex flex-col gap-3"
          style={{ animationDelay: "0.16s" }}
        >
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>
              Find your company
            </label>
            <div
              className="flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:ring-[#0080FF] focus-within:border-transparent"
              style={{ border: "1.5px solid #030A191F", background: "var(--brand-white)" }}
            >
              <Search size={15} style={{ color: "var(--brand-black)", opacity: 0.35 }} className="shrink-0" />
              <input
                type="text"
                placeholder="Search company name..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--brand-black)" }}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>
              Website
            </label>
            <div
              className="flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:ring-[#0080FF] focus-within:border-transparent"
              style={{ border: "1.5px solid #030A191F", background: "var(--brand-white)" }}
            >
              <Globe size={15} style={{ color: "var(--brand-black)", opacity: 0.35 }} className="shrink-0" />
              <input
                type="url"
                placeholder="https://yourcompany.com"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--brand-black)" }}
              />
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full text-white text-sm font-semibold rounded-xl h-11 transition-all hover:brightness-110 active:scale-[0.98] mt-1"
            style={{ background: "#0080FF" }}
          >
            Continue
          </button>
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
