# Deployment notes

## What can be deployed now

The public website is a static React catalogue and lead-generation site. It needs no backend to run: product enquiries open WhatsApp, and contact, directions, email and Instagram links work directly from the browser.

Build it with:

```bash
npm install
npm run build
```

Upload the generated `dist` folder to a static host such as Netlify, Vercel or Cloudflare Pages. Configure the host to serve `index.html` for unknown paths so direct visits to `/products`, `/about`, and product URLs work correctly.

For local production preview:

```bash
npm run preview
```

## Admin decision

The previous browser-only admin prototype has been intentionally excluded from the public release. A hard-coded PIN and browser `localStorage` are not secure, and any edits would exist only on the device that made them.

Use a backend before bringing back a real admin area. It should provide:

- authenticated, role-based admin access;
- a shared product, category and brand database;
- secure image storage and upload handling;
- server-side validation, backups and an audit trail.

Supabase or Firebase would be a good lightweight fit for this project. That is a separate implementation phase because it requires the business owner’s chosen hosting account, admin users and data-management workflow.

## Before publishing

- Replace demo catalogue items with the exact products and specifications currently sold.
- Confirm every contact detail, social link and location with the business owner.
- Confirm pricing, delivery, installation and warranty information directly with the business before adding those claims to the site.
- Add the production domain to the Open Graph metadata once it is known.
