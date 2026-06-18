"use client";

import { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";

const OTP_LENGTH = 6;

type Mode = "choice" | "otp";
type MagicState = "idle" | "sending" | "sent";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choice");
  const [magicState, setMagicState] = useState<MagicState>("idle");

  // OTP state
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [submitted, setSubmitted] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [email, setEmail] = useState("");
  useEffect(() => {
    setEmail(localStorage.getItem("onboarding_email") || "");
  }, []);

  const otp = digits.join("");
  const isComplete = otp.length === OTP_LENGTH;
  const hasError = submitted && !isComplete;

  function handleSendMagicLink() {
    if (magicState === "sending") return;
    // TODO(api): POST /api/auth/send-magic-link { email }
    setMagicState("sending");
    setTimeout(() => setMagicState("sent"), 1500);
  }

  function handleChange(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleResend() {
    // TODO(api): POST /api/auth/resend-verification
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (isComplete) {
      // TODO(api): POST /api/auth/verify-otp { otp }
      router.push("/organization");
    }
  }

  function boxStyle(index: number) {
    const isFocused = focusedIndex === index;
    const hasDigit = !!digits[index];
    let borderColor = "#030A191F";
    let boxShadow = "none";

    if (hasError) {
      borderColor = "#EF4444";
    } else if (isFocused) {
      borderColor = "transparent";
      boxShadow = "0 0 0 2px #0080FF";
    } else if (hasDigit) {
      borderColor = "#0080FF40";
    }

    return {
      border: `1.5px solid ${borderColor}`,
      boxShadow,
      background: "var(--brand-white)",
      color: "var(--brand-black)",
    };
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

        {mode === "choice" ? (
          <>
            <div className="animate-fade-up text-center mb-8" style={{ animationDelay: "0.08s" }}>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
                Verify your email
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
                How would you like to confirm your address?
              </p>
            </div>

            <div
              className="animate-fade-up w-full flex flex-col gap-3"
              style={{ animationDelay: "0.16s" }}
            >
              {/* Email display */}
              {email && (
                <p
                  className="text-sm font-semibold text-center mb-1"
                  style={{ color: "var(--brand-black)" }}
                >
                  {email}
                </p>
              )}

              {/* Magic link — primary */}
              <button
                onClick={handleSendMagicLink}
                disabled={magicState === "sending"}
                className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold rounded-xl h-11 transition-all active:scale-[0.98]"
                style={{
                  background: "#0080FF",
                  opacity: magicState === "sending" ? 0.65 : 1,
                }}
              >
                {magicState === "sending" && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                {magicState === "idle" && "Send magic link"}
                {magicState === "sending" && "Sending..."}
                {magicState === "sent" && "Resend"}
              </button>

              {/* Verification code — secondary */}
              <button
                onClick={() => setMode("otp")}
                className="w-full flex items-center justify-center text-sm font-semibold rounded-xl h-11 transition-all hover:bg-[#030A190A] active:scale-[0.98]"
                style={{ border: "1.5px solid #030A191F", color: "var(--brand-black)" }}
              >
                Use verification code instead
              </button>

              {/* Use a different email */}
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--brand-black)", opacity: 0.5 }}
              >
                <ArrowLeft size={14} />
                Use a different email
              </button>
            </div>

            {/* Already have an account */}
            <p
              className="animate-fade-up text-sm mt-8"
              style={{ color: "var(--brand-black)", opacity: 0.55, animationDelay: "0.28s" }}
            >
              Already have an account?{" "}
              <a href="/signin" className="font-semibold underline" style={{ color: "#0080FF", opacity: 1 }}>
                Sign in
              </a>
            </p>
          </>
        ) : (
          <>
            <div className="animate-fade-up text-center mb-8" style={{ animationDelay: "0.08s" }}>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
                Enter verification code
              </h1>
              <p className="text-sm mt-1.5" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
                We sent a 6-digit code to
              </p>
              {email && (
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--brand-black)" }}>
                  {email}
                </p>
              )}
            </div>

            <form
              onSubmit={handleVerify}
              noValidate
              className="animate-fade-up w-full flex flex-col gap-5"
              style={{ animationDelay: "0.16s" }}
            >
              <div className="flex gap-2.5 justify-center">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => { setFocusedIndex(i); e.target.select(); }}
                    onBlur={() => setFocusedIndex(null)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                    style={boxStyle(i)}
                  />
                ))}
              </div>

              {hasError && (
                <p className="text-xs font-medium text-center -mt-2" style={{ color: "#EF4444" }}>
                  Please enter the complete 6-digit code.
                </p>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center text-white text-sm font-semibold rounded-xl h-11 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: "#0080FF" }}
              >
                Verify email
              </button>

              <p className="text-xs text-center" style={{ color: "var(--brand-black)", opacity: 0.45 }}>
                Didn't get it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="underline font-medium transition-opacity hover:opacity-70"
                  style={{ color: "#0080FF" }}
                >
                  {resent ? "Sent!" : "Resend code"}
                </button>
              </p>
            </form>

            <p
              className="animate-fade-up text-sm mt-8"
              style={{ color: "var(--brand-black)", opacity: 0.55, animationDelay: "0.28s" }}
            >
              Already have an account?{" "}
              <a href="/signin" className="font-semibold underline" style={{ color: "#0080FF", opacity: 1 }}>
                Sign in
              </a>
            </p>
          </>
        )}

      </div>
    </div>
  );
}
