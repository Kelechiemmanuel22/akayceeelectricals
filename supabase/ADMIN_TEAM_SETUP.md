# Activate administrator team access

The existing owner account is retained. Do not create a shared admin password.

1. Back up the database and run `migrations/003_admin_team.sql` after migrations 001 and 002 in the Supabase SQL editor. It adds the admin role, enforces at most one owner, and protects profile role changes. If there are multiple owners, the transaction fails without demoting anyone; choose the real owner before retrying.
2. Deploy Edge Functions `admin-team` and the updated `cloudinary-upload`. Both verify the caller server-side. The service role key is used only inside admin-team, never in Vercel/browser variables. Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to functions.
3. Set the Supabase function secret `PUBLIC_SITE_URL=https://akayceeelectricals.vercel.app` (update if the domain changes).
4. In Authentication URL Configuration, allow `https://akayceeelectricals.vercel.app/ak-owner-portal?setup=1` as a redirect and set the production Site URL. Configure production SMTP so invitation emails are reliably delivered. Use the Supabase invitation template's confirmation URL, not a hard-coded homepage link. Disable public sign-ups if not needed; creating an ordinary account never grants administrator access.
5. Push the frontend changes to the Vercel-connected repository and redeploy.
6. Sign in at `/ak-owner-portal`, select **Team & access**, and enter an email. New users receive an email invitation; existing users receive admin access and use their existing credentials. Only invited admins can manage content. Remove access to revoke database permissions without deleting the account.

After signing into the Supabase CLI, deploy with:

```powershell
npx supabase functions deploy admin-team --project-ref hzqkoovmqkfoxsoqpegx --no-verify-jwt
npx supabase functions deploy cloudinary-upload --project-ref hzqkoovmqkfoxsoqpegx --no-verify-jwt
npx supabase secrets set PUBLIC_SITE_URL=https://akayceeelectricals.vercel.app --project-ref hzqkoovmqkfoxsoqpegx
```

These functions verify the user JWT themselves with Auth before permitting writes; the gateway flag does not bypass the function's owner/admin checks. Run only the new migration in SQL Editor, not the original catalogue seed, which updates existing examples. Keep service credentials out of source control.

References: [Supabase invitations](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail), [allowed redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Permissions

Owner: all existing catalogue, image, business-detail, growth, newsletter and customer-request tools, plus team management.

Admin: products, categories, brands, images and business details. No team management or access to newsletter subscribers, customer records or analytics. Database policies enforce these limits even if someone modifies the frontend.

Staff/unapproved/anonymous: no management access. Public active catalogue reads remain unchanged.

## Verify before launch

- Owner can invite and remove an admin but cannot remove or demote themselves.
- Invited user can set their own password, sign in and manage a test product.
- Admin cannot call admin-team or directly update profiles; those operations return permission errors.
- Public users cannot mutate products or read profile/customer/subscriber records.
- Removing an admin blocks mutations using their existing session, not just their next login.
- Hidden/deleted products disappear from public views, including when the catalogue is empty.

Local production build validation does not apply migrations or deploy functions. Live invitation, SMTP, role and RLS checks must be completed after backend activation.
