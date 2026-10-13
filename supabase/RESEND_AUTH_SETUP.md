# Password recovery and Resend

The owner login now includes Forgot password. Supabase creates and validates the recovery link; the browser never receives a Resend API key or a service-role key. Request feedback deliberately does not reveal whether an account exists. New passwords require 12 characters and matching confirmation. Passwords and recovery tokens are not stored in catalogue drafts.

## Redirect URLs

In Supabase Authentication → URL Configuration, set Site URL to `https://akayceeelectricals.vercel.app` and allow these exact URLs:

- `https://akayceeelectricals.vercel.app/ak-owner-portal?reset=1`
- `https://akayceeelectricals.vercel.app/ak-owner-portal?setup=1` (team invitations)
- `http://localhost:5173/ak-owner-portal?reset=1` (development only)

Preserve other legitimate existing redirects. The reset email template must use Supabase's `{{ .ConfirmationURL }}` so tokens are verified before returning to the website. Do not replace this with a plain website link.

## Delivery without a purchased domain

The owner's existing email can be a recipient, not a verified Resend sender if it is a Gmail/other third-party mailbox. The Vercel `vercel.app` hostname cannot be verified as an email sending domain without control of its DNS. Do not add organisation members merely to bypass default email delivery restrictions.

Supabase's default SMTP is restricted to project organisation team addresses, rate-limited and intended for testing, not production. Resend's `onboarding@resend.dev` sender can only send test mail to the email associated with the Resend account. Neither is suitable for general admin invitations or newsletters. Do not globally replace working auth delivery with a test-only sender without explicitly selecting that limitation.

## Production setup after domain purchase

1. Add and verify a sending domain/subdomain in Resend by adding its displayed DNS records at the domain provider.
2. Create an appropriately restricted Resend sending key and configure Supabase Authentication → Email → SMTP: host `smtp.resend.com`, port `465`, username `resend`, password the Resend API key, sender address on the verified domain and sender name A Kaycee Electricals. Follow current provider documentation if dashboard fields change.
3. Keep SMTP credentials in Supabase's SMTP configuration, never a frontend `VITE_*` variable, tracked file, or browser code.
4. For newsletters, configure the separate Supabase Edge Function secrets `RESEND_API_KEY`, `NEWSLETTER_FROM_EMAIL` and `PUBLIC_SITE_URL`. SMTP configuration does not automatically configure these secrets, and newsletter secrets do not automatically configure auth SMTP.
5. Test requesting and opening a real reset email, expired-link feedback, password confirmation, successful sign-in afterwards, and invitations. The human user must enter and submit any new password; do not test by changing their credentials automatically. Do not send a newsletter campaign just to test reset delivery.

Sources: https://supabase.com/docs/guides/auth/passwords, https://supabase.com/docs/guides/auth/auth-smtp, https://resend.com/docs/send-with-supabase-smtp, https://resend.com/docs/knowledge-base/403-error-resend-dev-domain.
