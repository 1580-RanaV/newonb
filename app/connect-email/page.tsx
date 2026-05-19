import Image from "next/image";
import Link from "next/link";

export default function ConnectEmailPage() {
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
            Connect your email
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            See all your contacts and conversations in one place.
          </p>
        </div>

        <div
          className="animate-fade-up w-full flex flex-col gap-3"
          style={{ animationDelay: "0.16s" }}
        >
          {/* Gmail */}
          <Link
            href="/assistant"
            className="w-full flex items-center justify-center gap-3 text-sm font-medium rounded-xl h-11 transition-all hover:bg-[#030A190A]"
            style={{
              border: "1.5px solid #030A191F",
              color: "var(--brand-black)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.211 17.64 11.903 17.64 9.205Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Link>

          {/* Outlook — faded + coming soon badge */}
          <div className="relative">
            <button
              disabled
              className="w-full flex items-center justify-center gap-3 text-sm font-medium rounded-xl h-11 cursor-not-allowed"
              style={{
                border: "1.5px solid #030A191F",
                color: "var(--brand-black)",
                opacity: 0.35,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0" fill="none">
                <rect width="18" height="18" rx="3" fill="#0078D4"/>
                <path d="M9 4.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM5.5 9a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z" fill="white"/>
                <circle cx="9" cy="9" r="2" fill="white"/>
              </svg>
              Continue with Outlook
            </button>
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-0.5 rounded-full pointer-events-none"
              style={{ background: "#0080FF14", color: "#0080FF" }}
            >
              Coming soon
            </span>
          </div>
        </div>

        {/* Skip */}
        <Link
          href="/assistant"
          className="animate-fade-up text-sm font-medium mt-8 transition-opacity hover:opacity-70"
          style={{ color: "var(--brand-black)", opacity: 0.4, animationDelay: "0.28s" }}
        >
          Skip for now
        </Link>

      </div>
    </div>
  );
}
