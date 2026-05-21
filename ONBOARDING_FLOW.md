# Intempt Onboarding Flow — Complete Specification

This document contains everything needed to rebuild the full onboarding flow from scratch: the design system, the screen-by-screen flow, all React component code, and the data/state contracts between screens.

---

## 1. Design System

### Brand Palette
| Variable | Hex | Usage |
|---|---|---|
| `--brand-black` | `#030A19` | All body text, headings, icons |
| `--brand-white` | `#FFFFFF` | Page background, card backgrounds |
| `--brand-blue` | `#0080FF` | CTAs, links, active states, chips |
| `--brand-jeans` | `#00AAFF` | Accent (reserved) |
| `--brand-pop` | `#C495F0` | "Destination" integration badge |

**Semantic opacity tokens** (applied inline on `--brand-black`):
- `opacity: 0.5` — subtitles, helper text
- `opacity: 0.45` — secondary meta (domain, member count)
- `opacity: 0.4` — divider labels, placeholder icons
- `opacity: 0.35` — muted actions (set up manually)
- `opacity: 0.55` — sign-in footer text

**Error colour**: `#EF4444` (red) — borders, icons, field error messages  
**Warning colour**: `#F59E0B` (amber) — character counter at 450+ chars  
**Border default**: `1.5px solid #030A191F` (brand-black at 12% opacity)  
**Border subtle**: `1.5px solid #030A191A` (brand-black at 10% opacity) — cards  
**Hover surface**: `#030A190A` (brand-black at 4%)

### Typography
- Font: **Inter** (Google Fonts), variable `--font-inter`
- Base size: `text-sm` (14px) for body/inputs
- Headings: `text-2xl font-bold tracking-tight`
- Labels: `text-sm font-medium`
- Meta/helper: `text-xs`
- Chip labels: `text-xs font-medium`

### Border Radius
- Buttons, inputs, cards: `rounded-xl` (12px)
- Large cards: `rounded-2xl` (16px)
- Avatar circles: `rounded-full`
- Small badges: `rounded-full` or `rounded-lg`
- Chat bubbles: `rounded-2xl` with one corner flattened

### Logo
- Source: `/logo.png`
- Size on all screens: 56×56px via `next/image`
- Loading state: pulsing animation (see below)

### Animations
All defined in `globals.css`:

```css
@keyframes pop-in {
  0%   { opacity: 0; transform: scale(0.3); }
  65%  { transform: scale(1.12); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(12px) scale(0.985); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes logo-pulse {
  0%, 100% { transform: scale(1);    opacity: 1;    }
  50%       { transform: scale(1.1); opacity: 0.82; }
}

.animate-pop-in   { animation: pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
.animate-fade-up  { animation: fade-up 0.35s ease-out both; opacity: 0; }
.animate-card-in  { animation: card-in 0.42s cubic-bezier(0.22,1,0.36,1) both; }
.animate-logo-pulse { animation: logo-pulse 1.6s ease-in-out infinite; }

/* Chat scrollbar — hidden cross-browser */
.chat-scroll { -ms-overflow-style: none; scrollbar-width: none; }
.chat-scroll::-webkit-scrollbar { display: none; }
```

**Stagger pattern** used across all screens:
- Logo: `animate-pop-in` (no delay)
- Heading block: `animate-fade-up` at `animationDelay: "0.08s"`
- Main content: `animate-fade-up` at `animationDelay: "0.16s"`
- Footer text: `animate-fade-up` at `animationDelay: "0.28s"`
- Whole card/container: `animate-card-in` (no delay)

### Input Field Pattern
All text inputs share this wrapper pattern:
```tsx
<div
  className={`flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:border-transparent
    ${hasError ? "focus-within:ring-[#EF4444]" : "focus-within:ring-[#0080FF]"}`}
  style={{ border: `1.5px solid ${hasError ? "#EF4444" : "#030A191F"}`, background: "var(--brand-white)" }}
>
  <Icon size={15} style={{ color: hasError ? "#EF4444" : "var(--brand-black)", opacity: hasError ? 0.7 : 0.35 }} />
  <input className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--brand-black)" }} />
</div>
{hasError && <p className="text-xs font-medium mt-1.5" style={{ color: "#EF4444" }}>{errorMsg}</p>}
```

### Primary Button
```tsx
<button
  className="w-full flex items-center justify-center text-white text-sm font-semibold rounded-xl h-11 transition-all hover:brightness-110 active:scale-[0.98]"
  style={{ background: "#0080FF" }}
>
  Label
</button>
```

### Outline Button
```tsx
<button
  className="w-full text-sm font-medium rounded-xl h-11 transition-all hover:bg-[#030A190A]"
  style={{ border: "1.5px solid #030A191F", color: "var(--brand-black)" }}
>
  Label
</button>
```

### Loading Screen (between routes)
Replace the full page with a centred pulsing logo:
```tsx
<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--brand-white)" }}>
  <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-logo-pulse" />
</div>
```

---

## 2. Screen Flow

```
/  (Sign Up)
  └─► /organization  (Workspace Setup)
        └─► /connect-email  (Connect Email)
              └─► /chat  (Blu Onboarding Assistant)
                    ├─► /integrations  (All Integrations — optional detour)
                    └─► /billing  (Pick Your Plan)
```

### localStorage Keys (cross-screen state)
| Key | Set on | Read on | Value |
|---|---|---|---|
| `onboarding_name` | `/` sign-up | `/organization`, `/chat` | Full name string |
| `onboarding_company` | `/organization` | `/chat` | Company name string |
| `onboarding_website` | `/organization` | `/chat` | Website URL string (e.g. `www.acme.com`) |

---

## 3. Screen 1 — Sign Up (`/`)

### Purpose
Account creation entry point. Collects full name and email with validation, and offers Google SSO. On success, saves the name to localStorage and navigates to `/organization`.

### Validation Rules
- **Full name**: required, min 2 characters
- **Email**: required, regex `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`
- Errors show on field blur **or** on submit attempt
- No errors shown while the user is actively typing (before first blur)

### Full Component Code

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Mail } from "lucide-react";

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

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false });
  const [submitted, setSubmitted] = useState(false);

  function nameError() {
    if (!name.trim()) return "Full name is required.";
    if (name.trim().length < 2) return "Name must be at least 2 characters.";
    return "";
  }

  function emailError() {
    if (!email.trim()) return "Email address is required.";
    if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
    return "";
  }

  const nameErr = (touched.name || submitted) ? nameError() : "";
  const emailErr = (touched.email || submitted) ? emailError() : "";

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!nameError() && !emailError()) {
      localStorage.setItem("onboarding_name", name.trim());
      router.push("/organization");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--brand-white)" }}>
      <div className="animate-card-in w-full max-w-100 flex flex-col items-center">

        <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-pop-in mb-4" />

        <div className="animate-fade-up text-center mb-6" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
            Create your account
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            Get started in seconds
          </p>
        </div>

        <form onSubmit={handleContinue} noValidate className="animate-fade-up w-full flex flex-col gap-3" style={{ animationDelay: "0.16s" }}>

          {/* Google SSO */}
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: "#030A191A" }} />
            <span className="text-xs font-medium" style={{ color: "var(--brand-black)", opacity: 0.4 }}>or sign up with email</span>
            <div className="flex-1 h-px" style={{ background: "#030A191A" }} />
          </div>

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>Full name</label>
            <div
              className={`flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:border-transparent ${nameErr ? "focus-within:ring-[#EF4444]" : "focus-within:ring-[#0080FF]"}`}
              style={inputWrapperStyle(!!nameErr)}
            >
              <User size={15} className="shrink-0" style={{ color: nameErr ? "#EF4444" : "var(--brand-black)", opacity: nameErr ? 0.7 : 0.35 }} />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--brand-black)" }}
              />
            </div>
            {nameErr && <FieldError msg={nameErr} />}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>Email address</label>
            <div
              className={`flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:border-transparent ${emailErr ? "focus-within:ring-[#EF4444]" : "focus-within:ring-[#0080FF]"}`}
              style={inputWrapperStyle(!!emailErr)}
            >
              <Mail size={15} className="shrink-0" style={{ color: emailErr ? "#EF4444" : "var(--brand-black)", opacity: emailErr ? 0.7 : 0.35 }} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--brand-black)" }}
              />
            </div>
            {emailErr && <FieldError msg={emailErr} />}
          </div>

          {/* ToS */}
          <p className="text-xs text-center" style={{ color: "var(--brand-black)", opacity: 0.45 }}>
            By signing up, you agree to our{" "}
            <a href="#" className="underline font-medium" style={{ color: "#0080FF", opacity: 1 }}>Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="underline font-medium" style={{ color: "#0080FF", opacity: 1 }}>Privacy Policy</a>
          </p>

          {/* CTA */}
          <button
            type="submit"
            className="w-full flex items-center justify-center text-white text-sm font-semibold rounded-xl h-11 transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: "#0080FF" }}
          >
            Continue
          </button>
        </form>

        <p className="animate-fade-up text-sm mt-6" style={{ color: "var(--brand-black)", opacity: 0.55, animationDelay: "0.28s" }}>
          Already have an account?{" "}
          <a href="#" className="font-semibold underline" style={{ color: "#0080FF", opacity: 1 }}>Sign in</a>
        </p>

      </div>
    </div>
  );
}
```

---

## 4. Screen 2 — Workspace Setup (`/organization`)

### Purpose
Two-path screen: the user can request to join an existing team detected by email domain, **or** create a new organisation by entering a company name and website. On success, saves company + website to localStorage and shows a loading screen before navigating to `/connect-email`.

### Layout
- Top half: "Your team is already on Intempt" banner with team card (logo, name, domain, member count, overlapping avatars, "Request to join" CTA)
- Horizontal "or" divider
- Bottom half: "Create a new organisation" form with company search field + website field + Continue button

### Validation Rules
- **Company name**: required
- **Website**: required, must start with `https://`, `http://`, or `www.`
- Same blur-or-submit pattern as Screen 1

### Full Component Code

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Globe, Users } from "lucide-react";

// TODO(api): replace with GET /api/onboarding/existing-team
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
  return <p className="text-xs font-medium mt-1.5" style={{ color: "#EF4444" }}>{msg}</p>;
}

function inputWrapperStyle(hasError: boolean) {
  return { border: `1.5px solid ${hasError ? "#EF4444" : "#030A191F"}`, background: "var(--brand-white)" };
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
            {firstName ? "Let's get your workspace ready." : "Join your team or start fresh."}
          </p>
        </div>

        <div className="animate-fade-up w-full flex flex-col gap-3" style={{ animationDelay: "0.16s" }}>

          {/* Existing team notice */}
          <div className="flex items-center gap-2 mb-0.5">
            <Users size={14} style={{ color: "#0080FF" }} className="shrink-0" />
            <span className="text-sm font-semibold" style={{ color: "#0080FF" }}>Your team is already on Intempt</span>
          </div>

          {/* Team card */}
          <div className="w-full rounded-2xl p-4 flex flex-col gap-4" style={{ border: "1.5px solid #030A191A" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "var(--brand-black)" }}>
                {EXISTING_TEAM.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--brand-black)" }}>{EXISTING_TEAM.name}</p>
                <p className="text-xs" style={{ color: "var(--brand-black)", opacity: 0.45 }}>
                  {EXISTING_TEAM.domain} · {EXISTING_TEAM.memberCount} members
                </p>
              </div>
            </div>

            {/* Overlapping member avatars */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center">
                {EXISTING_TEAM.members.map((member, i) => (
                  <div
                    key={member.initial}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ring-2 ring-white"
                    style={{
                      background: "var(--brand-black)", color: "#fff",
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

          <div className="mb-0.5 text-center">
            <p className="text-base font-bold" style={{ color: "var(--brand-black)" }}>Create a new organization</p>
          </div>

          <form onSubmit={handleContinue} noValidate className="flex flex-col gap-3">
            {/* Company name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>Find your company</label>
              <div
                className={`flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:border-transparent ${companyErr ? "focus-within:ring-[#EF4444]" : "focus-within:ring-[#0080FF]"}`}
                style={inputWrapperStyle(!!companyErr)}
              >
                <Search size={15} className="shrink-0" style={{ color: companyErr ? "#EF4444" : "var(--brand-black)", opacity: companyErr ? 0.7 : 0.35 }} />
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--brand-black)" }}>Website</label>
              <div
                className={`flex items-center gap-2.5 rounded-xl px-3.5 h-11 transition-all focus-within:ring-2 focus-within:border-transparent ${websiteErr ? "focus-within:ring-[#EF4444]" : "focus-within:ring-[#0080FF]"}`}
                style={inputWrapperStyle(!!websiteErr)}
              >
                <Globe size={15} className="shrink-0" style={{ color: websiteErr ? "#EF4444" : "var(--brand-black)", opacity: websiteErr ? 0.7 : 0.35 }} />
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

        <p className="animate-fade-up text-sm mt-6" style={{ color: "var(--brand-black)", opacity: 0.55, animationDelay: "0.28s" }}>
          Already have an account?{" "}
          <a href="/" className="font-semibold underline" style={{ color: "#0080FF" }}>Sign in</a>
        </p>

      </div>
    </div>
  );
}
```

---

## 5. Screen 3 — Connect Email (`/connect-email`)

### Purpose
Optional step to connect the user's email provider. Gmail links to `/chat`. Outlook is disabled with a "Coming soon" badge. "Skip for now" also goes to `/chat`.

### Notes
- Outlook logo is loaded from Brandfetch CDN with an SVG fallback if the image fails
- Both actions (Gmail + Skip) navigate to `/chat`

### Full Component Code

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function OutlookLogo() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0" fill="none">
        <rect width="18" height="18" rx="3" fill="#0078D4"/>
        <path d="M9 4.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM5.5 9a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z" fill="white"/>
        <circle cx="9" cy="9" r="2" fill="white"/>
      </svg>
    );
  }
  return (
    <img
      src="https://cdn.brandfetch.io/microsoft.com/icon?c=1idhE0Bg4BXpFRYkYnt"
      alt="Outlook"
      width={18}
      height={18}
      className="shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export default function ConnectEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--brand-white)" }}>
      <div className="animate-card-in w-full max-w-100 flex flex-col items-center">

        <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-pop-in mb-4" />

        <div className="animate-fade-up text-center mb-8" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
            Connect your email
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            See all your contacts and conversations in one place.
          </p>
        </div>

        <div className="animate-fade-up w-full flex flex-col gap-3" style={{ animationDelay: "0.16s" }}>

          {/* Gmail */}
          <Link
            href="/chat"
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
          </Link>

          {/* Outlook — coming soon */}
          <div className="relative">
            <button
              disabled
              className="w-full flex items-center justify-center gap-3 text-sm font-medium rounded-xl h-11 cursor-not-allowed"
              style={{ border: "1.5px solid #030A191F", color: "var(--brand-black)", opacity: 0.35 }}
            >
              <OutlookLogo />
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

        <Link
          href="/chat"
          className="animate-fade-up text-sm font-medium mt-8 transition-opacity hover:opacity-70"
          style={{ color: "var(--brand-black)", opacity: 0.4, animationDelay: "0.28s" }}
        >
          Skip for now
        </Link>

      </div>
    </div>
  );
}
```

---

## 6. Screen 4 — Blu Onboarding Assistant (`/chat`)

### Purpose
The core onboarding experience. Blu (AI assistant) greets the user by first name, shows a company profile card pre-filled from localStorage, then guides the user through goal selection and integration recommendations via a chat interface.

### Chat Flow
```
Blu: "Hey [Name]! Here's what I found about [Company]. Does everything look right?"
  → Profile card (name, domain, 2×2 grid of fields)
  → Chips: [Looks good] [Edit details]

If "Edit details":
  → Profile card switches to edit mode (textareas, 500 char limit, Save / Cancel)
  → After Save or Cancel, chips reappear — user can click "Looks good"

If "Looks good":
  Blu: "I'm Blu... What's the main thing you want to achieve first?"
  → Chips: [Qualify my pipeline] [Nurture leads] [Track conversions] [All of the above]

On goal selection:
  Blu: "[Goal-specific message]"
  → Tool suggestion cards (logo, name, type badge, Connect button)
  → "See all integrations" link → /integrations

On clicking Connect (any tool):
  → 2s spinner on that button
  → Blu: "[Tool] connected successfully! Do you want to connect the rest?"
  → Remaining tools shown (connected one removed)
  → 700ms later: Blu: "Do you wish to dive into Intempt?" + [Yes, let's go!] [Maybe later]

"Yes, let's go!" or "Dive into Intempt":
  → User message appears → navigate to /billing after 800ms

"Maybe later":
  → Blu: "No worries! You can connect more tools from your dashboard anytime."
  → 700ms later: Blu: "What would you like to know?" + [How does it work?] [What can I automate?] [Dive into Intempt]
```

### Profile Card — Edit Mode
- Each field becomes a textarea (rows=2, rows=1 for "Business model")
- `maxLength={500}`
- Counter appears when length > 400 (`{len}/500`)
- Counter colour: neutral → amber (#F59E0B) at 450+ → red (#EF4444) at 500
- Save disabled if any field is at 500 chars
- Cancel/Save clears chip selection so "Looks good" is clickable again

### Skip Modal
"Set up manually" button at the bottom opens a modal:
- "Skip setup" → `/billing` immediately
- "Continue" → dismiss modal

### Tool Type Badges
- `Source` type: background `#0080FF14`, text `#0080FF`
- `Destination` type: background `#C495F014`, text `#8B5CF6`

### localStorage Read
```ts
const name = localStorage.getItem("onboarding_name");   // → greet by first name
const company = localStorage.getItem("onboarding_company"); // → profile card name
const website = localStorage.getItem("onboarding_website"); // → domain (strip https://)
```

### Brandfetch CDN (tool logos)
```ts
const BF = (domain: string) =>
  `https://cdn.brandfetch.io/${domain}/icon?c=1idhE0Bg4BXpFRYkYnt`;
```

### Full Component Code

```tsx
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
  return <img src={src} alt={name} width={28} height={28} className="object-contain" onError={() => setFailed(true)} />;
}

interface SuggestedTool { name: string; type: string; src: string; }
interface CompanyProfile { name: string; domain: string; fields: { label: string; value: string }[]; }
type Role = "blu" | "user";
interface Message { id: number; role: Role; text: string; chips?: string[]; tools?: SuggestedTool[]; profile?: CompanyProfile; }

// TODO(api): replace with GET /api/onboarding/company-profile
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

// TODO(api): replace with GET /api/onboarding/tool-suggestions?goal=<goal>
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
  "Qualify my pipeline": { text: "Perfect. Pipeline qualification is where Intempt shines. Here are the integrations I'd suggest to get you started:", tools: TOOL_SUGGESTIONS["Qualify my pipeline"] },
  "Nurture leads":        { text: "Great choice. I'll set up lifecycle sequences so no lead falls through the cracks. These tools will power your nurture flows:", tools: TOOL_SUGGESTIONS["Nurture leads"] },
  "Track conversions":    { text: "On it. I'll connect your conversion events and build a funnel report. You'll want these connected first:", tools: TOOL_SUGGESTIONS["Track conversions"] },
  "All of the above":     { text: "Love the ambition! Here are the top integrations to unlock full lifecycle visibility from day one:", tools: TOOL_SUGGESTIONS["All of the above"] },
};

const FALLBACK = { text: "Got it! I'm making a note of that. Once we finish setup you'll be able to configure this in detail from your dashboard." };

const DIVE_IN_MESSAGE = {
  id: -1, role: "blu" as Role,
  text: "Do you wish to dive into Intempt?",
  chips: ["Yes, let's go!", "Maybe later"],
};

export default function ChatPage() {
  const router = useRouter();
  const CHAR_LIMIT = 500;

  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("onboarding_name") || "" : "";
    const firstName = stored.split(" ")[0];
    return [{
      id: 1, role: "blu",
      text: firstName
        ? `Hey ${firstName}! Here's what I found about your company. Does everything look right?`
        : "Here's what I found about your company. Does everything look right?",
      profile: getProfile(),
      chips: ["Looks good", "Edit details"],
    }];
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
      setMessages((m) => [...m, { id: nextId.current++, role: "user", text: chip }]);
      setTimeout(() => router.push("/billing"), 800);
    } else if (chip === "Maybe later") {
      setMessages((m) => [...m, { id: nextId.current++, role: "user", text: chip }]);
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
        id: nextId.current++, role: "blu",
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

  return (
    <div className="h-screen flex flex-col items-center p-6" style={{ background: "var(--brand-white)" }}>

      {/* Skip modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(3,10,25,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="animate-card-in w-full max-w-xl rounded-2xl p-6" style={{ background: "var(--brand-white)", boxShadow: "0 8px 40px 0 rgba(3,10,25,0.18)" }}>
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-base font-bold" style={{ color: "var(--brand-black)" }}>Skip guided setup?</h2>
              <button onClick={() => setShowSkipModal(false)} aria-label="Close" className="rounded-lg p-1 transition-all hover:bg-[#030A190A] -mt-0.5 -mr-1" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
                <X size={16} />
              </button>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--brand-black)", opacity: 0.55 }}>
              This setup uses your answers to tailor tools and recommendations to your goals. If you skip it, your portal will be less personalised and require more manual setup.
            </p>
            <div className="flex items-center gap-2.5">
              <Link href="/billing" className="flex-1 flex items-center justify-center text-white text-sm font-semibold rounded-xl h-10 transition-all hover:brightness-110" style={{ background: "#0080FF" }}>
                Skip setup
              </Link>
              <button onClick={() => setShowSkipModal(false)} className="flex-1 text-sm font-medium rounded-xl h-10 transition-all hover:bg-[#030A190A]" style={{ border: "1.5px solid #030A191F", color: "var(--brand-black)" }}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-xl flex flex-col items-center mb-6 pt-4">
        <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-pop-in mb-4" />
        <div className="animate-fade-up text-center" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>Blu Onboarding Assistant</h1>
          <p className="text-sm mt-2" style={{ color: "var(--brand-black)", opacity: 0.5 }}>Powered by Intempt</p>
        </div>
      </div>

      {/* Chat container */}
      <div className="animate-card-in w-full max-w-xl flex flex-col flex-1 min-h-0">
        <div className="relative flex-1 overflow-hidden">
          {/* Fade masks */}
          <div className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none" style={{ background: "linear-gradient(to bottom, var(--brand-white), transparent)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none" style={{ background: "linear-gradient(to top, var(--brand-white), transparent)" }} />

          <div className="chat-scroll h-full overflow-y-auto px-1 py-5 flex flex-col gap-4">
            {messages.map((msg) =>
              msg.role === "blu" ? (
                <div key={msg.id} className="flex items-start gap-3 animate-fade-up">
                  <Image src="/logo.png" alt="Blu" width={28} height={28} className="rounded-full shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {/* Text bubble */}
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed self-start max-w-[82%]" style={{ background: "#030A190A", color: "var(--brand-black)", whiteSpace: "pre-line" }}>
                      {msg.text}
                    </div>

                    {/* Company profile card */}
                    {msg.profile && (
                      <div className="rounded-2xl p-4" style={{ border: "1.5px solid #030A191A" }}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-sm font-bold" style={{ color: "var(--brand-black)" }}>{msg.profile.name}</span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
                            <Globe size={11} />{msg.profile.domain}
                          </span>
                        </div>
                        {profileEditing ? (
                          <div className="flex flex-col gap-3">
                            {profileDraft.map(({ label, value }, i) => {
                              const len = value.length;
                              const overLimit = len > CHAR_LIMIT;
                              const showCounter = len > 400;
                              const counterColor = overLimit ? "#EF4444" : len >= 450 ? "#F59E0B" : "var(--brand-black)";
                              return (
                                <div key={label}>
                                  <p className="text-xs font-semibold mb-1" style={{ color: "#0080FF" }}>{label}</p>
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
                                    style={{ border: `1.5px solid ${overLimit ? "#EF4444" : "#030A191F"}`, background: "#030A190A", color: "var(--brand-black)", lineHeight: "1.65" }}
                                  />
                                  {showCounter && (
                                    <p className="text-xs text-right mt-1 font-medium" style={{ color: counterColor, opacity: overLimit ? 1 : 0.7 }}>{len}/{CHAR_LIMIT}</p>
                                  )}
                                </div>
                              );
                            })}
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => cancelEdit(msg.id)} className="flex-1 text-xs font-medium rounded-xl h-9 transition-all hover:bg-[#030A190A]" style={{ border: "1.5px solid #030A191F", color: "var(--brand-black)" }}>Cancel</button>
                              <button onClick={() => saveProfile(msg.id)} disabled={profileDraft.some((f) => f.value.length > CHAR_LIMIT)} className="flex-1 text-xs font-semibold rounded-xl h-9 text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: "#0080FF" }}>Save changes</button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            {profileFields.map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-xs font-semibold mb-1" style={{ color: "#0080FF" }}>{label}</p>
                                <p className="text-xs leading-relaxed" style={{ color: "var(--brand-black)", opacity: 0.75 }}>{value}</p>
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
                            <div key={tool.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ border: "1.5px solid #030A191A" }}>
                              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                <BrandLogo src={tool.src} name={tool.name} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold" style={{ color: "var(--brand-black)" }}>{tool.name}</span>
                                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: tool.type === "Source" ? "#0080FF14" : "#C495F014", color: tool.type === "Source" ? "#0080FF" : "#8B5CF6" }}>
                                  {tool.type}
                                </span>
                              </div>
                              {isConnected ? (
                                <div className="inline-flex items-center gap-1 text-xs font-semibold px-3 h-7 rounded-lg shrink-0" style={{ background: "#0080FF14", color: "#0080FF" }}>
                                  <Check size={11} />Connected
                                </div>
                              ) : (
                                <button onClick={() => handleConnect(tool, msg.tools!)} disabled={connectingTool !== null} className="inline-flex items-center justify-center text-xs font-semibold text-white px-3 h-7 rounded-lg shrink-0 transition-all hover:brightness-110 disabled:opacity-50" style={{ background: "#0080FF", minWidth: "64px" }}>
                                  {isConnecting ? <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : "Connect"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                        <Link href="/integrations" className="text-xs font-medium mt-1 flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: "#0080FF" }}>
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
                              style={{ border: "1.5px solid #0080FF", background: isSelected ? "#0080FF" : "#0080FF0D", color: isSelected ? "#fff" : "#0080FF", opacity: hasSelection && !isSelected ? 0.35 : 1 }}
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
                  <div className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed max-w-[72%]" style={{ background: "#0080FF", color: "#fff" }}>
                    {msg.text}
                  </div>
                </div>
              )
            )}

            {/* Typing indicator */}
            {thinking && (
              <div className="flex items-center gap-3 animate-fade-up" role="status" aria-label="Blu is typing">
                <Image src="/logo.png" alt="Blu" width={28} height={28} className="rounded-full shrink-0" />
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "#030A190A" }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--brand-black)", opacity: 0.35, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="shrink-0 pt-3">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex items-center gap-2 rounded-xl px-4 h-11 transition-all focus-within:ring-2 focus-within:ring-[#0080FF]" style={{ border: "1.5px solid #030A191F" }}>
            <input type="text" placeholder="Reply to Blu…" value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--brand-black)" }} />
            <button type="submit" aria-label="Send message" disabled={!input.trim() || thinking} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 hover:brightness-110" style={{ background: "#0080FF" }}>
              <Send size={13} color="#fff" />
            </button>
          </form>
        </div>

        {/* Set up manually */}
        <div className="flex justify-center pt-3 pb-1">
          <button onClick={() => setShowSkipModal(true)} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "var(--brand-black)", opacity: 0.35 }}>
            Set up manually
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Screen 5 — All Integrations (`/integrations`)

### Purpose
Full catalogue of available connectors and SDKs. Accessible via "See all integrations" link in the chat. Cards have hover tooltips with descriptions. "Skip for now" → `/billing`.

### Layout
- 5-column grid of **Connector** cards (HubSpot, Shopify, Stripe, Twilio, Slack)
- 5-column grid of **SDK** cards (Web/JS, iOS, Android, Node.JS, API)
- Each card: logo, name, type badge (Source blue / Destination purple)
- Hover: dark tooltip above the card with a CSS triangle arrow

### Animation
Cards are staggered individually: `animationDelay: \`${0.16 + index * 0.04}s\``  
SDK cards continue the stagger from connector count: `index={connectors.length + i}`

### Logo Fallback
If Brandfetch fails, show a coloured div with initials or a short label. JS shows `"JS"` on yellow `#F7DF1E` (dark text). API shows `"</>"` on blue `#0080FF`.

### Full Component Code

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const API_KEY = "1idhE0Bg4BXpFRYkYnt";
const logo = (domain: string) => `https://cdn.brandfetch.io/${domain}/icon?c=${API_KEY}`;

function BrandLogo({ src, name, bg, label, dark }: { src?: string | null; name: string; bg?: string | null; label?: string; dark?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt={name} width={44} height={44} className="object-contain" onError={() => setFailed(true)} />;
  }
  if (label) {
    return <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: bg ?? "#f4f4f5", color: dark ? "#030A19" : "#fff" }}>{label}</div>;
  }
  return <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: "#0080FF", color: "#fff" }}>{name[0]}</div>;
}

// TODO(api): replace with GET /api/integrations/connectors
const connectors = [
  { name: "HubSpot",  type: "Source",      description: "Sync contacts, companies, and deals from HubSpot CRM.",   src: logo("hubspot.com") },
  { name: "Shopify",  type: "Source",      description: "Import products, orders, and customer data from Shopify.", src: logo("shopify.com") },
  { name: "Stripe",   type: "Source",      description: "Track payments, subscriptions, and revenue metrics.",      src: logo("stripe.com") },
  { name: "Twilio",   type: "Destination", description: "Enable SMS and voice communication channels.",             src: logo("twilio.com") },
  { name: "Slack",    type: "Destination", description: "Get real-time notifications in your Slack workspace.",     src: logo("slack.com") },
];

// TODO(api): replace with GET /api/integrations/sdks
const sdks = [
  { name: "Web",     type: "Source", description: "Add website tracking with our JavaScript SDK.",      src: logo("js.org"),      bg: "#F7DF1E", label: "JS",  dark: true  },
  { name: "iOS",     type: "Source", description: "Track events from your iOS mobile application.",     src: logo("apple.com"),   bg: null },
  { name: "Android", type: "Source", description: "Track events from your Android mobile application.", src: logo("android.com"), bg: null },
  { name: "Node.JS", type: "Source", description: "Server-side event tracking with Node.js SDK.",       src: logo("nodejs.org"),  bg: null },
  { name: "API",     type: "Source", description: "Direct API integration for custom implementations.", src: null,                bg: "#0080FF", label: "</>", dark: false },
];

function ToolCard({ name, type, description, src, bg, label, dark, index }: {
  name: string; type: string; description: string;
  src?: string | null; bg?: string | null; label?: string; dark?: boolean; index?: number;
}) {
  return (
    <div className="group relative flex flex-col items-center gap-1.5 p-3 cursor-pointer rounded-xl transition-colors hover:bg-[#030A190A] animate-fade-up" style={{ animationDelay: `${0.16 + (index ?? 0) * 0.04}s` }}>
      <div className="w-12 h-12 flex items-center justify-center">
        <BrandLogo src={src} name={name} bg={bg} label={label} dark={dark} />
      </div>
      <p className="text-sm font-semibold text-center" style={{ color: "var(--brand-black)" }}>{name}</p>
      <span className="text-xs font-medium" style={{ color: type === "Source" ? "#0080FF" : "#8B5CF6" }}>{type}</span>
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-xl px-3 py-2.5 text-xs leading-relaxed text-white opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ background: "var(--brand-black)" }}>
        {description}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: "var(--brand-black)" }} />
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: "var(--brand-white)" }}>
      <div className="animate-card-in w-full max-w-2xl">
        <div className="text-center mb-10">
          <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-pop-in mx-auto mb-4" />
          <div className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>
              Which tools would you like to integrate?
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
              Select the tools you want to connect to power your marketing automation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-8">
          {connectors.map((t, i) => <ToolCard key={t.name} {...t} index={i} />)}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {sdks.map((t, i) => <ToolCard key={t.name} {...t} index={connectors.length + i} />)}
        </div>

        <div className="animate-fade-up flex justify-center mt-10" style={{ animationDelay: "0.24s" }}>
          <Link href="/billing" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. Screen 6 — Billing (`/billing`)

### Purpose
Plan selection with annual/monthly toggle. Three tiers (Professional, Organization, Enterprise), each showing Standard and Premium seat pricing. "I'll decide later" shows the pulsing logo loader for 3s then returns to `/`. "Schedule a call" is a placeholder link.

### Layout
- Annual/Monthly pill toggle (annual selected by default, shows "25% off" badge)
- 3-column card grid
  - "Organization" card has `border: 2px solid #0080FF` and a "Most popular" badge
  - Other cards: `border: 1.5px solid #030A191A`
- Each card: plan name, tagline, Standard seat price + credits, Premium seat price + credits + "5× credits" note, inherited features list with `<Check>` icons, CTA button
- Footer: "I'll decide later" text button + dot separator + "Schedule a call" blue link

### Full Component Code

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

// TODO(api): replace with GET /api/billing/plans
const plans = [
  {
    name: "Professional", tagline: "For individuals", popular: false,
    standard: { annual: 18, monthly: 24, credits: 140,  billed: 216  },
    premium:  { annual: 74, monthly: 99, credits: 700,  billed: 891  },
    features: ["Full access to all 15 products", "Standard AI Pass per seat", "Advanced analytics & reporting"],
    inherit: "Everything in Starter, plus:",
  },
  {
    name: "Organization", tagline: "For teams of any size", popular: true,
    standard: { annual: 37,  monthly: 49,  credits: 290,  billed: 441  },
    premium:  { annual: 149, monthly: 199, credits: 1450, billed: 1791 },
    features: ["Unlimited teams & projects", "Round-robin & delegation", "AI coaching & admin controls", "Team productivity insights"],
    inherit: "Everything in Professional, plus:",
  },
  {
    name: "Enterprise", tagline: "For scaling organizations", popular: false,
    standard: { annual: 74,  monthly: 99,  credits: 590,  billed: 891  },
    premium:  { annual: 299, monthly: 399, credits: 2950, billed: 3591 },
    features: ["SSO & SCIM", "HubSpot CRM sync", "Audit logs & compliance", "Dedicated support & SLA"],
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
        <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-logo-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6" style={{ background: "var(--brand-white)" }}>
      <div className="animate-card-in max-w-5xl mx-auto flex flex-col items-center">

        <Image src="/logo.png" alt="Intempt" width={56} height={56} priority className="animate-pop-in mb-4" />

        <div className="animate-fade-up text-center mb-8" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--brand-black)" }}>Pick your plan, choose your seats</h1>
          <p className="text-sm mt-2" style={{ color: "var(--brand-black)", opacity: 0.5 }}>
            One platform for Marketing and Sales. Pay a small base fee, then scale with usage.
          </p>
        </div>

        {/* Toggle */}
        <div className="animate-fade-up flex items-center p-1 rounded-xl mb-10" style={{ background: "#030A190A", animationDelay: "0.12s" }}>
          <button
            onClick={() => setAnnual(true)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-lg transition-all"
            style={{ background: annual ? "var(--brand-white)" : "transparent", color: "var(--brand-black)", boxShadow: annual ? "0 1px 4px rgba(3,10,25,0.08)" : "none" }}
          >
            Annual
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#0080FF", color: "#fff" }}>25% off</span>
          </button>
          <button
            onClick={() => setAnnual(false)}
            className="text-sm font-medium px-4 py-1.5 rounded-lg transition-all"
            style={{ background: !annual ? "var(--brand-white)" : "transparent", color: "var(--brand-black)", opacity: annual ? 0.5 : 1, boxShadow: !annual ? "0 1px 4px rgba(3,10,25,0.08)" : "none" }}
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
              <div key={plan.name} className="relative flex flex-col rounded-2xl p-5" style={{ border: plan.popular ? "2px solid #0080FF" : "1.5px solid #030A191A" }}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ background: "#0080FF" }}>
                    Most popular
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-base font-bold" style={{ color: "var(--brand-black)" }}>{plan.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--brand-black)", opacity: 0.45 }}>{plan.tagline}</p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--brand-black)", opacity: 0.35 }}>Standard seat</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold" style={{ color: "var(--brand-black)" }}>${stdPrice}</span>
                  <span className="text-sm" style={{ color: "var(--brand-black)", opacity: 0.4 }}>/mo</span>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
                  {plan.standard.credits} credits/mo{annual && <> · ${plan.standard.billed} billed annually</>}
                </p>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--brand-black)", opacity: 0.35 }}>Premium seat</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold" style={{ color: "var(--brand-black)" }}>${premPrice}</span>
                  <span className="text-sm" style={{ color: "var(--brand-black)", opacity: 0.4 }}>/mo</span>
                </div>
                <p className="text-xs mb-1" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
                  {plan.premium.credits} credits/mo{annual && <> · ${plan.premium.billed} billed annually</>}
                </p>
                <p className="text-xs font-medium mb-5" style={{ color: "#0080FF" }}>5× credits for power users</p>
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--brand-black)" }}>{plan.inherit}</p>
                <ul className="flex flex-col gap-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={13} style={{ color: "#0080FF", marginTop: 2 }} className="shrink-0" />
                      <span className="text-xs leading-relaxed" style={{ color: "var(--brand-black)", opacity: 0.7 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <button
                    className="w-full h-10 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                    style={{ background: plan.popular ? "#0080FF" : "transparent", color: plan.popular ? "#fff" : "var(--brand-black)", border: plan.popular ? "none" : "1.5px solid #030A191F" }}
                  >
                    Continue to checkout
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="animate-fade-up flex items-center gap-6 mt-6" style={{ animationDelay: "0.24s" }}>
          <button onClick={handleDecideLater} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "var(--brand-black)", opacity: 0.4 }}>
            I'll decide later
          </button>
          <span style={{ color: "var(--brand-black)", opacity: 0.2 }}>·</span>
          <Link href="#" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "#0080FF" }}>
            Schedule a call
          </Link>
        </div>

      </div>
    </div>
  );
}
```

---

## 9. Root Layout & globals.css

### `app/layout.tsx`
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Intempt",
  description: "Qualify pipeline, orchestrate lifecycle, lift conversion.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

### `app/globals.css`
```css
@import "tailwindcss";

:root {
  --brand-black: #030A19;
  --brand-blue:  #0080FF;
  --brand-jeans: #00AAFF;
  --brand-pop:   #C495F0;
  --brand-white: #FFFFFF;
  --background:  var(--brand-white);
  --foreground:  var(--brand-black);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-inter), system-ui, sans-serif;
}

@keyframes pop-in {
  0%   { opacity: 0; transform: scale(0.3); }
  65%  { transform: scale(1.12); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(12px) scale(0.985); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes logo-pulse {
  0%, 100% { transform: scale(1);    opacity: 1;    }
  50%       { transform: scale(1.1); opacity: 0.82; }
}

.animate-pop-in     { animation: pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
.animate-fade-up    { animation: fade-up 0.35s ease-out both; opacity: 0; }
.animate-card-in    { animation: card-in 0.42s cubic-bezier(0.22,1,0.36,1) both; }
.animate-logo-pulse { animation: logo-pulse 1.6s ease-in-out infinite; }

.chat-scroll { -ms-overflow-style: none; scrollbar-width: none; }
.chat-scroll::-webkit-scrollbar { display: none; }
```

---

## 10. Backend Integration Points

All data in this flow is currently mocked. Replace each constant/function with the noted API call when wiring to a real backend.

| Location | Current mock | Replace with |
|---|---|---|
| `organization/page.tsx` — `EXISTING_TEAM` | Hardcoded | `GET /api/onboarding/existing-team` — returns team info if another member from the same email domain already signed up, or `null` |
| `chat/page.tsx` — `COMPANY_PROFILE` | Hardcoded Intempt profile | `GET /api/onboarding/company-profile` — returns `CompanyProfile` for the authenticated user's domain |
| `chat/page.tsx` — `TOOL_SUGGESTIONS` | Hardcoded per-goal lists | `GET /api/onboarding/tool-suggestions?goal=<goal>` |
| `integrations/page.tsx` — `connectors` | Hardcoded array | `GET /api/integrations/connectors` |
| `integrations/page.tsx` — `sdks` | Hardcoded array | `GET /api/integrations/sdks` |
| `billing/page.tsx` — `plans` | Hardcoded tiers | `GET /api/billing/plans` |
| `chat/page.tsx` — `handleConnect` | 2s `setTimeout` | `POST /api/integrations/connect` with `{ toolName }` |
| `organization/page.tsx` — "Request to join" | No-op button | `POST /api/onboarding/request-join` with `{ teamId }` |
