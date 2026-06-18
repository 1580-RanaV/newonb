"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function emailError() {
    if (!email.trim()) return "Email address is required.";
    if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
    return "";
  }

  const emailErr = (touched || submitted) ? emailError() : "";

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!emailError()) {
      // TODO(api): POST /api/auth/signin { email }
      localStorage.setItem("onboarding_email", email.trim());
      router.push("/verify-email");
    }
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

        <div className="animate-fade-up text-center mb-6" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
            Welcome back
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            Sign in to your account
          </p>
        </div>

        <form
          onSubmit={handleContinue}
          noValidate
          className="animate-fade-up w-full flex flex-col gap-3"
          style={{ animationDelay: "0.16s" }}
        >
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>
              Email address
            </label>
            <div
              className={`flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:border-transparent ${emailErr ? "focus-within:ring-[#EF4444]" : "focus-within:ring-[#0080FF]"}`}
              style={inputWrapperStyle(!!emailErr)}
            >
              <Mail
                size={15}
                className="shrink-0"
                style={{ color: emailErr ? "#EF4444" : "var(--brand-black)", opacity: emailErr ? 0.7 : 0.35 }}
              />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--brand-black)" }}
              />
            </div>
            {emailErr && <FieldError msg={emailErr} />}
          </div>

          {/* Sign in */}
          <button
            type="submit"
            className="w-full flex items-center justify-center text-white text-sm font-semibold rounded-xl h-11 transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: "#0080FF" }}
          >
            Sign in
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: "#030A191A" }} />
            <span className="text-xs font-medium" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
              or
            </span>
            <div className="flex-1 h-px" style={{ background: "#030A191A" }} />
          </div>

          {/* Google */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 text-sm font-medium rounded-xl h-11 transition-all hover:bg-[#030A190A]"
            style={{ border: "1.5px solid #030A191F", color: "var(--brand-black)" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.211 17.64 11.903 17.64 9.205Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        {/* New to Intempt */}
        <p
          className="animate-fade-up text-sm mt-6"
          style={{ color: "var(--brand-black)", opacity: 0.55, animationDelay: "0.28s" }}
        >
          New to Intempt?{" "}
          <a href="/" className="font-semibold underline" style={{ color: "#0080FF", opacity: 1 }}>
            Create an account
          </a>
        </p>

      </div>
    </div>
  );
}
