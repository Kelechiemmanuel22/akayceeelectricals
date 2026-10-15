# Newsletter activation

Deployment record (15 October 2026): migration `newsletter_delivery` applied to
`hzqkoovmqkfoxsoqpegx`; `send-newsletter` version 3 deployed with JWT verification
enabled and its shared template dependency. Database smoke tests passed for
signup, token unsubscribe/rotation, suppression and anonymous RLS. All synthetic
test rows were rolled back. Inbox delivery still requires the owner-only test
below; settings detection alone is not proof of delivery.

Frontend controls are included in the owner portal. They stay disabled when the required schema or sending settings are missing. Supabase Auth SMTP configuration is independent of these Edge Function secrets.

1. Run `supabase/migrations/008_newsletter_delivery.sql` in the existing project's SQL Editor. This requires migration 002. It adds campaign audiences/status details, token-based unsubscribe and owner-RLS-protected audience lookup. Existing subscriber rows and campaigns are preserved. Old email-address-only unsubscribe links are intentionally disabled; new campaigns use token links. No newsletter is sent by the migration.
2. Deploy the updated `send-newsletter` function **with its `_shared/newsletter.ts` dependency**. Use the CLI from the repository when authorised: `supabase functions deploy send-newsletter --project-ref hzqkoovmqkfoxsoqpegx`. The Deno editor must include the shared file if deploying through the dashboard. Do not deploy the old single-file implementation. Keep JWT verification enabled and the function's owner check in place.
3. In Supabase → Edge Functions → Secrets, set:
   - `RESEND_API_KEY`: a private Resend Sending-access key restricted to `akayceeelectricals.com`. Prefer a separate key named Newsletter; paste it directly into Supabase, never chat, Git, browser code or `VITE_*` variables.
   - `NEWSLETTER_FROM_EMAIL`: `A Kaycee Electricals <updates@akayceeelectricals.com>`
   - `PUBLIC_SITE_URL`: `https://akayceeelectricals.com`
   - Optional `NEWSLETTER_REPLY_TO_EMAIL`: defaults to the business's supplied `kelechiemmanuel999@gmail.com`. Newsletter replies go here; setting up the sending domain does not itself create a mailbox for `updates@akayceeelectricals.com`.
4. Open owner portal → Newsletter and Refresh. A settings-detected indicator is not a delivery test. Choose subscribers, compose and Save draft. No email is sent on Save. Click Test to my email: it targets only the authenticated owner's email, not a caller-supplied address. This requires explicit confirmation. Check Resend logs and the owner's inbox before using Send campaign.
5. Send campaign always asks for confirmation. Only saved unsent drafts and currently subscribed selected addresses are allowed. An atomic claim prevents concurrent sends. Each recipient gets an individual message, not a shared To/CC list. Resend receives batches of up to 100; this initial implementation supports up to 1,000 selected recipients per campaign and displays the first 1,000 subscriber records and latest 50 campaigns. Account quotas still apply.
6. Sent/accepted means Resend accepted the request, not inbox delivery, opens, clicks or sales. There are no delivery webhooks yet. Failed or interrupted sends cannot be blindly retried: review Resend logs and accepted count first. A killed function may leave Sending status. No automatic reset of Sending/Failed is provided because that could duplicate messages. Resend idempotency lasts 24 hours and is an additional safeguard, not indefinite exactly-once delivery.
7. Unsubscribe links open a confirmation screen; visiting a link does not itself change consent. The random subscriber token authorizes its own subscription only. Suppressed rows are excluded and cannot be reactivated by the public signup RPC. A legitimate resubscription rotates a previously unsubscribed token. Signup is explicit-consent single opt-in; the database's legacy Confirmed status does not prove mailbox ownership. Double opt-in and CAPTCHA/rate-limiting remain future hardening tasks before broad promotion.

Verify with `node scripts/check-newsletter.mjs` and `npm run build`. These tests use fake clients and send no email. Backend deployment and a human-approved owner test are separate steps. Do not claim activation based solely on a successful frontend build.
