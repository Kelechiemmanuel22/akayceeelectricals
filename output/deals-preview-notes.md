# Combo deals — local concept preview

Built as a local concept preview on 20 October 2026. The user subsequently approved pushing this preview implementation to GitHub. Deal configuration remains browser-local; no Supabase migration, deal database write, or external customer enquiry was performed. A GitHub push does not add shared production persistence.

## Try it

- Homepage section: http://localhost:5173/#deals
- All collections: http://localhost:5173/deals
- Student Deals: http://localhost:5173/deals/student-deals
- Odogwu Deals: http://localhost:5173/deals/odogwu-deals
- Example package: http://localhost:5173/deals/student-deals/campus-comfort
- Signed-in admin: Combo deals → Deal collections / Combo packages.

## Scope and limitations

- This is a browser-only concept preview. Deal configuration is stored in `akaycee_deals_local_preview_v1` in local storage, scoped to the current origin and browser. Changes synchronize across tabs on that same origin. They do not appear on other devices, other browsers, the production domain, or a different localhost hostname.
- Existing Supabase authentication still protects the admin portal; no authentication bypass was added. No deal database tables or policies were created.
- Collections support visibility, homepage featuring, display order and optional start/end timestamps. The preview checks time every 30 seconds and on focus. Homepage shows up to three featured collections that have an available package.
- Homepage presentation was revised to a full-width rotating banner instead of a card section. Each active featured collection gets a banner with its cover, name, short description and collection link. Banners move vertically every 5.5 seconds while in view, loop, and include manual previous/next, collection indicators and pause/resume controls. Rotation pauses on hover, keyboard focus, touch and hidden tabs; reduced-motion users get manual controls without automatic movement. Collection cards remain on the dedicated deals pages.
- The banner was then slimmed to 180px on desktop and 190px on mobile (brand strip measured 134px). It now shows just the short headline, collection name and link, with controls integrated into the same compact height. The paragraph and separate top/bottom bars were removed. Verified content fit and no horizontal overflow at 320px, 390px and 1440px. Updated screenshot: `output/home-deals-banner-compact-preview.png`.
- Latest revision supersedes the rotating-banner presentation above: a continuous horizontal marquee like the existing brand strip, ordered Combo Deals introduction → Student Deals → Odogwu Deals → any other featured active collection. Equal-width groups duplicate for seamless looping; duplicate links are inert and hidden from assistive technology. It keeps the compact 180px desktop / 190px mobile tiles. Normal speed is 10 seconds per tile, with gentler 60-second loops under reduced-motion settings to match the existing brand-strip convention. Hover, keyboard focus, touch, offscreen and background tabs pause the animation; the explicit scrolling pause button remains available. Verified horizontal transforms change over time and stop when paused.
- Admin has one-click Pause/Resume for both individual packages and complete collections. Collection pause hides its homepage banner and blocks direct package URLs. Individual pause hides just that combo; if no packages remain available, the collection also leaves the public list/banner. Resuming a collection preserves individually paused packages. These flows were verified across the admin and customer tabs, then all test changes were restored. This remains browser-only configuration, not live Supabase publishing.
- Added a master “Show combo deals on website” switch to Admin → Combo deals. Off suppresses all public deal collections and packages, the homepage strip, customer sidebar navigation and footer link. Direct deal URLs show a paused message without package contents. The admin section stays accessible so the owner can re-enable it. Individual pause settings, prices and collection data are preserved. Existing previews without this setting default to on. Verified off survives refresh, the actual sidebar `/deals` link detaches while off and returns when on, and previously paused packages remain paused after re-enabling. Test changes were restored to master on.
- Deal collection-card headings, taglines and package-count text are now white, with a dark overlay/badge for contrast and a gold “Explore deals” link. Matching collection tiles in the homepage strip also use white headings/taglines and gold links. Computed styles verified as white (`rgb(255,255,255)`) and gold (`rgb(255,193,92)`). Screenshot: `output/deal-card-white-text-preview.png`.
- Combos link existing catalogue product slugs and quantities. Missing products hide the whole affected combo rather than silently offering an incomplete bundle. Hidden, expired and scheduled-future collections are not publicly available, including direct URLs.
- Sample names, contents and prices are proposals, not owner-approved offers. At the user's request, the four original sample bundles now have explicitly labelled preview estimates based on the existing catalogue estimates researched on 13 October 2026: Campus comfort ₦245,000; First space, sorted ₦340,000; The Odogwu lounge ₦2,390,000; The home upgrade ₦1,600,000. These are component-estimate totals, not freshly verified market prices or discounted offers. No savings claims are made. The admin can change the price and its estimated label, or leave the price blank for enquiry. Existing numeric prices and changed bundle contents are not overwritten when upgrading old blank-price sample data.
- Adding to a quote keeps the combo together as one package. The quote includes constituent product names and per-package quantities. Changing package quantity multiplies complete packages, not individual contents. Existing quote contents are snapshots and remain subject to the store's confirmation.
- Delivery and installation are not included automatically. Enquiry buttons prepare WhatsApp messages; testing did not send any messages.
- Festive Deals is provided as an inactive collection with no packages. It is not advertised on the homepage. Its image is a reusable placeholder until an actual seasonal campaign is designed.
- Before public launch: persist collections/combos in a shared database, enforce owner/admin write access with RLS, validate authoritative prices and schedules server-side, integrate uploads and review all contents with the owner. Browser local storage is not a production publishing or authorization mechanism.

## Verification

- `npm run build` — TypeScript and Vite build.
- `node scripts/check-deals.mjs` — live/hidden/future/expired collections, malformed dates, missing products, quantities, quote details, initial festive visibility.
- Browser: desktop and 390px mobile homepage, full-height collection hero, package lists/details, linked WhatsApp contents, add/remove test combo in quote drawer, signed-in admin package save and cross-tab quantity sync (restored afterwards), seasonal editor, mobile admin overflow.
- Banner revision: verified a timed automatic Student → Odogwu change with normal motion, pause control state, collection indicator selection, inactive links excluded from keyboard navigation, desktop/mobile overflow checks and restoration of the browser's original reduced-motion preference and viewport. Screenshot: `output/home-deals-banner-preview.png`.

## Image generation

Built-in image generation tool, two separate prompts. Generated originals retained; project JPEG copies created for smaller downloads.

Saved assets:

- `public/assets/deals/student-life-v1.jpg` (1536 × 1024)
- `public/assets/deals/odogwu-home-v1.jpg` (1536 × 1024)

### Student prompt

Use case: photorealistic-natural. Asset type: wide lifestyle photograph for an appliance-store Student Deals collection, landscape 3:2. A thoughtfully arranged compact student studio apartment in Lagos, warm pale sage walls, oak desk with closed notebooks, simple bed, a small silver single-door refrigerator and black standing fan visible on the RIGHT HALF, electric kettle safely on a small counter. Aspirational but affordable, tidy and lived-in, realistic product scale and natural Nigerian afternoon window light. LEFT HALF is calm muted wall with generous negative space for dark website typography. Architectural editorial photography, premium natural textures, no people, no logos, no text, no watermark. Not an advert collage.

### Odogwu prompt

Use case: photorealistic-natural. Asset type: wide lifestyle photograph for Nigerian appliance-store Odogwu Deals premium collection, landscape 3:2. A sophisticated modern Lagos apartment living and dining space, deep midnight navy wall and rich walnut wood, warm brass lighting. Large slim TV and low media console on the RIGHT with a discreet wall mounted split AC above and a glimpse of stainless side-by-side fridge in adjoining kitchen, no other appliances. Refined quiet luxury, warm evening sunlight, realistic architecture and appliance proportions. LEFT HALF clean dark wall with ample negative space for white website typography. Photorealistic architectural editorial photograph, no people, no logos, no text, no watermark, not an advert collage.
