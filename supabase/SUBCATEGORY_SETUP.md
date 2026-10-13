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
- Custom main categories without configured groups: General.

Public filtering honours the stored selection even for product names without category keywords. Layout/feature relationships are supported: semi-automatic belongs under Top load, washer-dryers/dryers under Front load, mini fridges under Single door, and top/bottom freezer under Two door. Water-dispenser specifications remain an additional filter feature.

Adding brand-new custom subcategory definitions requires updating the shared taxonomy and database validator together; this release adds product assignment controls for the existing site groups, not a separate custom subcategory builder.
