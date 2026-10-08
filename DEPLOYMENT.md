# Deployment notes

## Vercel setup

Import `Kelechiemmanuel22/akayceeelectricals` into Vercel. The repository already includes the SPA rewrite configuration. Use `npm run build` and the `dist` output directory.

Add these variables to the Vercel project for Production, Preview and Development:

```text
VITE_SUPABASE_URL=https://hzqkoovmqkfoxsoqpegx.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-Supabase-publishable-key
VITE_IMAGE_UPLOAD_PROVIDER=cloudinary
```

The real values already exist in `.env.local`, which is intentionally ignored by Git. Copy them into Vercel’s Environment Variables screen; do not upload `.env.local`.

Cloudinary and Resend secret keys remain in Supabase Edge Function Secrets. Never add those secrets to Vercel or expose them through a `VITE_` variable.

## Before publishing

- Replace demo catalogue items with the exact products and specifications currently sold.
- Confirm every contact detail, social link and location with the business owner.
- Confirm pricing, delivery, installation and warranty information directly with the business before adding those claims to the site.
- Add the production domain to the Open Graph metadata once it is known.
- Add the deployed URL to Supabase Authentication URL Configuration.
- Verify the final domain with Resend before enabling newsletter sends.
