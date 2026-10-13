# Owner workspace

The `/ak-owner-portal` route uses the approved navy/blue/orange dashboard design. The sidebar separates Overview, Products, Categories, Subcategories, Brands, Analytics, Customer requests, Newsletter, Media library, Team & access and Settings. The admin bundle and styles are lazy-loaded; the storefront does not download this workspace's code upfront.

## Data and access

- Existing Supabase authentication and catalogue policies are unchanged. Analytics, requests, subscribers and team controls stay owner-only. Other approved admins get a catalogue-only overview.
- The overview uses real database counts. Visits mean tracked public page views, not unique people or sales. Admin page views are excluded. A client-side metadata refresh no longer records a duplicate page view.
- Date ranges are 7, 30 and 90 days. Daily chart buckets use UTC. Percentage comparisons are omitted when the previous count is zero or unavailable.
- Headline event totals use exact database counts. Chart/ranking queries page through up to 20,000 events; a visible note discloses that cap if reached.
- Product rankings count product-view events only. WhatsApp attribution uses a stored product slug or an exact product-name enquiry subject. Neither proves a completed conversation or purchase.
- The checklist identifies empty image URLs, missing/estimated prices and hidden products. Hidden products are not presented as a new draft workflow.
- Media library shows catalogue-linked images; it is not a browser for every Cloudinary account asset. Its edit buttons use the existing product/category/brand image editors.
- Newsletters still use the existing draft workflow. This redesign does not enable email delivery or bypass domain verification.

## Verification

Catalogue editor drafts and the selected workspace section resume on the same browser/origin for ten minutes after the last change. Drafts are stored locally per signed-in user, never published automatically, and never contain credentials. Cancel and successful Save discard the relevant editor draft; explicit sign-out clears the user's draft storage. Browser-tab auth refreshes no longer unmount the dashboard. Expired drafts are discarded on the next portal visit; an already-open form is not forcibly erased mid-edit. Completed upload URLs can resume, but an unuploaded file selection cannot. Localhost and production have separate browser storage.

Run `node scripts/check-admin-drafts.mjs` to check expiry, isolation, corruption handling and storage failures. Browser verification should leave and return to a partially filled category form, reload it, then Cancel and confirm the next form starts blank. Do not publish test catalogue records.

Run `npm run build`, `node scripts/check-admin-insights.mjs`, and the existing pricing, model-filter and subcategory checks. Preview as a signed-in owner; verify navigation/search, date-range changes, dependent category selections and responsive mobile drawer behaviour. During UI verification, avoid submitting real catalogue changes or sending campaigns merely to test the design.

Dialog and mobile-navigation focus is constrained to the active surface, with Escape dismissal and focus restoration. Closed mobile navigation is inert. Reduced-motion preferences and visible keyboard focus are respected.
