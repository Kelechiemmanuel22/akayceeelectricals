# Activate optional catalogue prices

Run `migrations/004_product_prices.sql` in the project's Supabase SQL editor. This only adds a nullable, non-negative NGN price column; it does not assign prices or overwrite products. Migration 004 can be applied independently of the administrator-team migration 003, provided the products table from 001 exists.

After frontend deployment, sign in at `/ak-owner-portal`, open Products and edit a product. Enter an optional **Price (NGN)**, then save. Leave it blank to hide the amount. Before the migration, the field is disabled and other product edits remain available.

Amounts appear only on category product cards and product-detail pages (including related products). Homepage highlights, general search results, saved/comparison views and all other shared product-card locations default to hiding amounts. No checkout or payment flow is added.

Verify with a real owner-supplied amount: save, reload the category/product pages, check the homepage has no amount, clear the field and confirm it disappears. Build/unit checks do not validate live Supabase writes.
