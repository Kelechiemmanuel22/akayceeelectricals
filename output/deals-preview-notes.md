# Combo deals — shared store publishing

The original browser-local concept has been replaced by shared Supabase publishing on 20 October 2026. GitHub contains the application and migrations; deal content and visibility are stored in the database, not Git or local storage.

## Published configuration

- Existing local deals were explicitly imported through the signed-in owner portal: three collections, four packages, eleven product links. Student and Odogwu are active; Festive stays paused. The master switch is on.
- Existing prices and estimate labels are preserved. Estimates are not confirmed discounted offers: Campus comfort ₦245,000; First space ₦340,000; Odogwu lounge ₦2,390,000; Home upgrade ₦1,600,000. The owner must confirm contents, availability and final prices. No savings claims are made.
- Old browser data is offered for one-time import only when the database is empty. It never overrides an existing shared catalogue and is never used as a public fallback.

## Behaviour

- Owner/admin saves publish to Supabase atomically: collections, package contents, quantities, prices and the master switch update together. Errors keep editors open; success is shown only after database confirmation.
- A revision check rejects stale editors instead of overwriting another administrator’s changes. Close and reopen a conflicted editor to review the latest version.
- Public RLS hides paused, future and expired collections, paused packages and their contents. Turning the master off hides all public deals, the homepage strip, customer sidebar and footer link. Saved content and individual pause states are retained.
- Visitors load an RLS-filtered snapshot. Open tabs refresh through Realtime, focus/visibility changes and a 15-second fallback poll. Loading and connection failures are distinct from a deliberately paused store. There is no browser-preview fallback if the database is unavailable.
- Only approved profiles with owner/admin roles can publish. Anonymous and unapproved signed-in accounts cannot change settings or deals. No service-role key is shipped to the browser.
- Product links are foreign-key checked; deleting a product used in a package is blocked with an explanation. Hidden/missing products make the entire package unavailable rather than silently removing an advertised item.
- Collection images use an existing /assets/ path or an image URL. Individual packages now support a separate uploaded promotional cover (see below). Homepage marquee, pause controls, white collection text and gold links are preserved.
- Quote requests keep the package together and remain subject to store confirmation. No test enquiries were sent.

## Database deployment

Applied to project hzqkoovmqkfoxsoqpegx:

- 20261020145535_shared_combo_deals.sql: four RLS-enabled tables, explicit grants, invoker read/save RPCs, revision checks and Realtime settings updates. The initial database is empty and disabled until the owner publishes.
- 20261020150823_optimize_deal_read_policies.sql: one read policy per role/table, preserving public filtering and staff access to paused records.
- 20261020152931_combo_cover_images.sql: optional per-package cover URL/description, a public marketing-image bucket with approved-staff uploads only, and backwards-compatible read/save RPCs. Old clients that omit cover fields do not erase existing artwork.

Do not rerun historical catalogue migrations blindly against the live project; older local migrations and live function names have drifted. These new migrations do not replace existing authentication helpers or grant access to additional people.

## Verification

- npm run build; node scripts/check-deals.mjs.
- node scripts/check-shared-deals.mjs --expect-on --price=campus-comfort:245000: independent anonymous API reads, private row filtering, denied anonymous RPC/table writes.
- Signed-in UI: existing-deals import, master off/on, collection pause/resume, individual pause/resume, package price edit and restoration. Anonymous API checks confirmed each change independently. Temporary test changes were restored.
- SQL transaction checks: unapproved authenticated account denied; stale save rejected; invalid quantities and missing product links rejected without partial writes; owner can read paused collections. Additional transaction tests live in supabase/tests/shared_combo_deals.sql and roll back all changes.
- Supabase advisors: no new security warnings on deal functions/tables. The new foreign-key indexes may be reported as unused until traffic accumulates; keep them. Existing unrelated warnings remain: [mutable trigger search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [public SECURITY DEFINER functions](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [signed-in SECURITY DEFINER functions](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), and [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Newsletter RPCs intentionally allow public subscription/unsubscription; these findings are not a claim that every function is vulnerable. Existing unrelated RLS/index performance warnings were not changed.

## Individual combo promotional covers

- Admin → Combo deals → Combo packages → Edit a package → Promotional cover. Upload JPG, PNG, WebP or AVIF up to 5 MB, or paste an image URL. Save changes to publish it. Uploading a file alone does not attach it to the saved package.
- Each cover belongs to one package (for example, Campus comfort), not the whole Student Deals collection. It replaces the product collage on its card, appears uncropped on its detail page and is used as its quote thumbnail. Without a cover, existing catalogue images remain available. Broken cover links fall back to the actual product images.
- Download cover saves the original bytes for reuse on Instagram; Open original provides the image link. There is no automatic Instagram publishing or automatic poster generation. Actual products, quantities and prices remain managed separately from the artwork. Replace artwork containing old printed prices or product details after changing a package.
- These are public marketing images in the deal-covers bucket. Direct file links remain public even if a package is paused or its cover is removed. Replacing/removing a cover does not delete the old file or break previously shared social images. No private documents should be uploaded.
- Covers are optional; none were assigned automatically to existing offers. A copy of the existing student lifestyle image was used temporarily for the upload/download/save/fallback tests, then the package’s original empty-cover state was restored. The test download is in the local Downloads folder; no social post was sent.
- Verified: node scripts/check-deal-cover-files.mjs; cover URL/type/alt/quote tests in check-deals.mjs; anonymous persisted-cover GET check; SQL cover persistence, old-client preservation, removal and denied non-admin/anonymous Storage inserts in supabase/tests/combo_cover_images.sql (transaction rolled back); signed-in upload, download byte-for-byte hash match, public card/detail, mobile overflow and broken-image fallback.
- New cover functions and policies introduced no new security-advisor findings. The pre-existing warnings linked above remain unchanged.

## Original collection image generation

Built-in image generation tool, two separate prompts. Generated originals retained; project JPEG copies created for smaller downloads.

Saved assets:

- `public/assets/deals/student-life-v1.jpg` (1536 × 1024)
- `public/assets/deals/odogwu-home-v1.jpg` (1536 × 1024)

### Student prompt

Use case: photorealistic-natural. Asset type: wide lifestyle photograph for an appliance-store Student Deals collection, landscape 3:2. A thoughtfully arranged compact student studio apartment in Lagos, warm pale sage walls, oak desk with closed notebooks, simple bed, a small silver single-door refrigerator and black standing fan visible on the RIGHT HALF, electric kettle safely on a small counter. Aspirational but affordable, tidy and lived-in, realistic product scale and natural Nigerian afternoon window light. LEFT HALF is calm muted wall with generous negative space for dark website typography. Architectural editorial photography, premium natural textures, no people, no logos, no text, no watermark. Not an advert collage.

### Odogwu prompt

Use case: photorealistic-natural. Asset type: wide lifestyle photograph for Nigerian appliance-store Odogwu Deals premium collection, landscape 3:2. A sophisticated modern Lagos apartment living and dining space, deep midnight navy wall and rich walnut wood, warm brass lighting. Large slim TV and low media console on the RIGHT with a discreet wall mounted split AC above and a glimpse of stainless side-by-side fridge in adjoining kitchen, no other appliances. Refined quiet luxury, warm evening sunlight, realistic architecture and appliance proportions. LEFT HALF clean dark wall with ample negative space for white website typography. Photorealistic architectural editorial photograph, no people, no logos, no text, no watermark, not an advert collage.
