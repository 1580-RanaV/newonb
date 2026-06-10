# Backend Checklist — Domain Matching & Request to Join

---

## 1. Signup

- [ ] **Verify the email address before trusting the domain**
  Send a confirmation link on signup. No domain-based logic (org discovery, join requests) should run until the email is verified. Store `email_verified: boolean` on the user record.
  _Why: without this, anyone can sign up as `fake@acme.com` without owning that inbox and immediately request to join Acme's org. This is the most critical gate in the entire flow._

- [ ] **Extract and store the email domain on account creation**
  Store `domain = email.split("@")[1].toLowerCase()` on the user record.
  _Why: every domain-based decision downstream depends on this. Storing it once at source avoids recomputing it everywhere._

- [ ] **Detect and flag consumer email domains**
  Maintain a blocklist (gmail.com, yahoo.com, hotmail.com, outlook.com, icloud.com, protonmail.com, etc.). Set `is_personal_email: true` on the user record if matched.
  _Why: personal emails have no meaningful domain — `gmail.com` would match millions of users. These users must be routed to the "create new org" path, never to domain-based org discovery._

- [ ] **Expose the email type to the frontend**
  The `/api/auth/me` or session response should include `is_personal_email` so the UI can fork the flow without a separate call.
  _Why: the frontend conditionally hides/shows the search field based on this — it needs a reliable server-side signal, not a client-side guess._

- [ ] **Email change triggers full re-verification**
  If a user updates their email address, immediately set `email_verified: false`, send a new confirmation link to the new address, and re-evaluate `domain` and `is_personal_email`. Revoke all active sessions until re-verified.
  _Why: without this, an attacker who compromises an account could change the email to `@targetcompany.com` and silently gain access to that org's domain matching. This is a real escalation path._

---

## 2. Org Creation

- [ ] **Register the founder's email domain as the org's claimed domain**
  When an org is created, set `org.claimed_domain = founder.domain`.
  _Why: this is the basis for all future domain matching. The first person to create an org with `@acme.com` claims `acme.co` for that org._

- [ ] **Personal email orgs have no claimed domain — invite-only**
  If the founder's `is_personal_email: true`, set `org.claimed_domain = null`. These orgs are invisible to domain-based search and can only grow via direct invites.
  _Why: a `@gmail.com` user creating an org should not be discoverable by other Gmail users. There is no meaningful "all gmail.com people belong to this org" concept._

- [ ] **Prevent duplicate domain claims**
  If an org with `claimed_domain = X` already exists, a second user with the same domain cannot create another org — they must request to join the existing one.
  _Why: prevents domain squatting where a rogue employee or bad actor creates a parallel org and intercepts teammates._

- [ ] **Mark new orgs as `verified: false` by default**
  Set `org.domain_verified: false` on creation.
  _Why: claiming a domain by signing up is not proof of ownership. Verification is a separate step (see section 3)._

---

## 3. Domain Verification (DNS)

- [ ] **Generate a unique DNS TXT token per org**
  e.g. `intempt-verification=abc123xyz` — store this against the org with a generated timestamp.
  _Why: the org admin adds this to their DNS records to prove they actually control the domain, not just an email address on it._

- [ ] **DNS tokens expire after 30 days — provide a regenerate endpoint**
  `POST /api/orgs/:id/verify-domain/regenerate` — invalidates the old token and issues a new one.
  _Why: a stale token sitting in DNS records forever is a minor security smell. Expiry forces periodic re-confirmation that the right team controls the domain._

- [ ] **Poll or provide a verify endpoint**
  `POST /api/orgs/:id/verify-domain` — look up the DNS TXT record and if the token matches and is not expired, set `org.domain_verified: true`.
  _Why: until this is done, any join request carries more risk — the org may have been created by someone who doesn't actually represent the company._

- [ ] **Verified orgs get an admin-controlled auto-join toggle**
  Add `org.auto_join_enabled: boolean`, only togglable by org admins, only available once `domain_verified: true`. When on, any user whose verified email domain matches the org's domain is admitted automatically without an approval step.
  _Why: removes friction for fast-growing teams once trust is established. Linear and Slack both expose this. Gated behind verification so it can't be abused._

- [ ] **Unverified orgs: all join requests require manual admin approval regardless of auto-join setting**
  Ignore `auto_join_enabled` if `domain_verified: false`. Always route to admin review.
  _Why: without DNS proof you can't be confident the org admin legitimately represents that domain._

- [ ] **Domain reclaim: a verified org can challenge an unverified squatter**
  If org A holds `claimed_domain = acme.com` but is unverified, and org B completes DNS verification for `acme.com`, transfer the domain claim to org B and notify org A's admin.
  _Why: the most realistic squatting scenario is a rogue ex-employee or early tester creating an org before the real company joins. DNS verification is proof of legitimate ownership and should always win._

---

## 4. Company Search

- [ ] **Block search for unverified or personal email users — return empty always**
  If `user.email_verified === false` OR `user.is_personal_email === true`, return `[]` regardless of query. Do not return an error — just an empty list.
  _Why: returning an error would confirm whether an org exists. An empty list gives nothing away. Unverified email users shouldn't be able to discover orgs before they've confirmed their inbox._

- [ ] **Search only returns orgs whose `claimed_domain` matches the requester's email domain**
  `GET /api/onboarding/search-company?q=acme` must filter results to orgs where `org.claimed_domain === request.user.domain`.
  _Why: a user with `@stockinvest.com` should never see or be able to request to join `@acme.com`'s org. Enforced server-side — never trust the UI alone._

- [ ] **Rate limit the search endpoint**
  Max ~20 requests per minute per authenticated user. Return `429` beyond that.
  _Why: without this, the search API can be used to enumerate all orgs on the platform._

- [ ] **Return `verified` status in the search result**
  Each result should include `verified: boolean` so the frontend can show the correct badge and copy.

- [ ] **Only return active orgs**
  Exclude orgs that are deleted, suspended, or have `claimed_domain = null`.

---

## 5. Request to Join

- [ ] **Validate domain match server-side on every join request**
  `POST /api/onboarding/request-join` must check `user.domain === org.claimed_domain` and return `404` (not `403`) if they don't match.
  _Why: returning `403` confirms the org exists. Returning `404` gives nothing away to an attacker probing org IDs directly._

- [ ] **Reject join requests from personal email or unverified email users**
  If `user.is_personal_email === true` or `user.email_verified === false`, return `403`.
  _Why: closes the gate before any domain check is even needed._

- [ ] **Store the request with status `pending` and an expiry**
  Table: `join_requests(id, org_id, user_id, status: pending|approved|rejected|expired, created_at, expires_at)`.
  Set `expires_at = created_at + 7 days`. A cron job marks stale pending requests as `expired`.
  _Why: approving someone's join request weeks or months later is a security risk — their circumstances may have changed (left the company, became adversarial). Short expiry forces timely decisions._

- [ ] **Notify the org admin**
  Send an email/in-app notification when a new request comes in. Include the requester's name, email, and domain.
  _Why: admins can't approve what they don't know about._

- [ ] **Notify the user when their request is resolved**
  Send an email when the request is approved or rejected, not just when the admin acts in the dashboard.
  _Why: the user is waiting. Without a notification, they won't know they've been approved and may never return._

- [ ] **Prevent duplicate pending requests**
  If a `pending` request already exists for `(user_id, org_id)`, return it instead of creating a new one.
  _Why: prevents request spam and admin notification flooding._

- [ ] **Rate limit the join request endpoint**
  Max ~5 requests per hour per user across all orgs.
  _Why: prevents a bad actor flooding multiple org admins with fake requests._

---

## 6. Admin Approval Flow

- [ ] **Approve endpoint: `POST /api/orgs/:id/join-requests/:requestId/approve`**
  Sets request `status = approved`, creates org membership for the user with default role `member`, sends confirmation email to the user. Handle concurrent approvals idempotently — if membership already exists, return success without creating a duplicate.
  _Why: concurrent admin actions or retried requests should never produce duplicate memberships._

- [ ] **Default role on join is always `member`, never `admin`**
  Hardcode this — do not accept a role in the request body for this endpoint.
  _Why: privilege escalation. An attacker manipulating the approve request should never be able to self-assign admin._

- [ ] **Reject endpoint: `POST /api/orgs/:id/join-requests/:requestId/reject`**
  Sets request `status = rejected`, sends a polite rejection email to the user.

- [ ] **Only org admins can approve, reject, or invite**
  Check `membership.role === admin` for the acting user on every request.
  _Why: a regular member should not be able to let strangers into the org or revoke invites._

- [ ] **Invite by email — bypasses domain matching entirely**
  `POST /api/orgs/:id/invite` accepts an email address, creates a signed single-use invite token (HMAC or JWT), and emails a link valid for 48 hours. When the recipient clicks it and signs up (any domain, including gmail), they are admitted directly with role `member`. After use, the token is immediately invalidated.
  _Why: domain matching only covers people who share the company's email domain. Contractors and personal-email users can only join via direct invite. The token must be single-use to prevent link forwarding attacks._

- [ ] **Invite revocation**
  `DELETE /api/orgs/:id/invites/:inviteId` — admin can cancel a pending invite before it is used. Invalidate the token immediately.
  _Why: employees change, hiring falls through, invites get sent to the wrong address._

- [ ] **Audit log for all membership events**
  Log every action: domain claimed, domain verified, join request created/approved/rejected/expired, member invited, invite revoked, member removed, role changed. Include `actor_id`, `target_id`, `org_id`, `action`, `timestamp`.
  _Why: security review, compliance, and debugging. If an org is compromised you need to know exactly how someone got in._

---

## 7. Google / OAuth Signups

- [ ] **Extract the hosted domain from Google's token**
  Google returns `hd` in the ID token for Google Workspace accounts. Use this as the user's domain. Consumer Gmail accounts have no `hd` — treat them as `is_personal_email: true`.
  _Why: a Google Workspace user at `john@acme.com` should go through the work email path, not the personal email path._

- [ ] **OAuth users are considered email-verified by default**
  Skip the confirmation email for OAuth signups. Google has already verified ownership.
  _Why: redundant verification adds friction for no security gain._

- [ ] **Apply the same rules for other OAuth providers (Microsoft, GitHub)**
  Microsoft Azure AD tokens include `tid` (tenant ID) and a work email domain. GitHub does not provide a verified work domain — treat GitHub OAuth users as unverified for domain matching unless they also add a work email separately.
  _Why: the domain matching rules are provider-agnostic. Each provider needs a mapping to the same `domain` and `is_personal_email` fields._

---

## 8. Security Hardening

- [ ] **CSRF protection on all state-changing endpoints**
  Use CSRF tokens (or SameSite=Strict cookies + token-in-header pattern) on: signup, invite, approve, reject, verify-domain, toggle auto-join, email change.
  _Why: without this, a malicious page can trigger requests on behalf of a logged-in admin._

- [ ] **Authenticate every endpoint — no anonymous access**
  Auth middleware must run before domain/org logic on all routes. Return `401` for unauthenticated requests.
  _Why: obvious but worth stating explicitly so it doesn't get skipped during rapid development._

- [ ] **Sanitize the search query input**
  Strip or escape special characters in the `q` param before using it in any DB query.
  _Why: prevents SQL injection or NoSQL injection on the search endpoint._

- [ ] **Do not leak org existence to unauthorized users**
  Any endpoint that accesses an org by ID must return `404` (not `403`) when the requesting user has no relation to that org, so that org IDs cannot be confirmed by probing.
  _Why: `403` says "this exists but you can't access it." `404` says nothing. Consistent 404s prevent org enumeration by ID._

- [ ] **Invalidate all sessions on email change**
  When a user changes their email, revoke all existing sessions and tokens immediately, forcing re-login after the new email is verified.
  _Why: an attacker who hijacks an account and changes the email to a target domain would otherwise retain access while gaining new domain privileges._

---

## Summary — The one rule that prevents domain stealing

> A user can only see, search for, or request to join an org whose `claimed_domain` exactly matches their own **verified** email domain. This is checked server-side on every request. The frontend reflects this but does not enforce it.

---

## What's intentionally out of scope for now

These are real features competitors offer but are enterprise-tier and not needed at launch:

| Feature | When to add it |
|---|---|
| Multiple email domains per org (`@acme.com` + `@acmecorp.com`) | When a customer asks for it |
| SAML / SSO | First enterprise deal |
| SCIM auto-provisioning / deprovisioning | First enterprise deal |
| Subdomain matching (`@us.acme.com` → `acme.com`) | When a customer asks for it |
| Approved workspace list / MDM / EMM | Large enterprise rollout |
| IP allowlisting | Regulated industry customer |
