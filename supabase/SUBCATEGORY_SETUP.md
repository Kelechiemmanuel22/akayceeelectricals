# Product subcategory placement

Migration 006 adds `products.subcategory_id` and validates each category/subcategory pair in the database. It does not change account roles, product prices or images. The backfill seed assigns recognised existing products only when their assignment is null and their main category is unchanged.

The admin product editor now asks for **Main category**, then **Subcategory**. Changing the main category clears the selection. New products must have a valid subcategory once the migration is active. Legacy Cooling and Entertainment category IDs are grouped in the editor while valid database IDs are preserved.

- Kitchen: Cookers & burners; Kitchen essentials.
- Cooling: standard/other ACs, inverter split, portable, floor-standing, cassette, fans.
- Entertainment: televisions; speakers & soundbars.
- Laundry: front load, top load, semi-automatic, dryers, washer-dryers. Public large loading cards remain Front load / Top load; detailed filters remain available.
- Refrigeration: refrigerator layouts, mini fridges, dispenser models and standalone freezers.
- Lighting: indoor; outdoor & decorative.
- Electrical materials: wires & cables; switches & fittings.
- Custom main categories: create their groups in the Subcategories admin tab first.

Public filtering honours the stored selection even for product names without category keywords. Layout/feature relationships are supported: semi-automatic belongs under Top load, washer-dryers/dryers under Front load, mini fridges under Single door, and top/bottom freezer under Two door. Water-dispenser specifications remain an additional filter feature.

## Managed subcategories

Apply `007_managed_subcategories.sql` after 006. It seeds the existing groups without changing product assignments, then makes `product_subcategories` authoritative. The public website reads that table and listens for its realtime changes. An empty list stays empty; deleted definitions are not restored from shipped defaults.

In admin, open **Subcategories → Add subcategory**, choose a main category first, enter a name and save. These saved groups immediately become choices in the product editor and filters on that category's website page. Display order controls the list order. Renaming keeps existing products assigned; deleting a group with assigned products is blocked by both the UI and database. Move those products first, including hidden ones. Subcategory keys and their parents cannot be changed in place.

Only existing authorised catalogue managers can write these definitions. Migration 007 reuses team permissions if migration 003 has already been installed; the updated 003 also covers subcategories when team access is enabled afterwards. Neither migration automatically creates an administrator account.

The large Front load / Top load laundry cards remain unchanged. New custom groups appear in the detailed collection filters without adding extra large loading cards.

## Automatic group-card images

Every established category keeps two broad cards (for example Cooling: Air conditioners / Fans; Laundry: Front load / Top load). No separate subcategory image field is needed. Both cards use the oldest published matching product's image, based on `products.created_at`, independently of product display order. Products created in the same timestamp use a stable slug tie-break; legacy demo rows without timestamps retain their listed order. Updating that product's image updates the card through the existing catalogue refresh/realtime flow.

Empty groups, first products without image URLs and failed image loads show a neutral placeholder rather than an unrelated photo. Hiding/deleting the first product lets the next published matching product provide the image. New departments show up to two saved groups in subcategory display order; all their additional groups remain available as collection filters. Known departments preserve their broad group pairs while more detailed product types remain filters underneath.

Run `node scripts/check-category-groups.mjs` alongside the existing subcategory checks.
