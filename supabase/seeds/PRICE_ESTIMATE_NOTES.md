# Market guide prices — 13 October 2026

The user authorised researched estimates, not actual store quotations. The JSON records the amount, source URL, variant/quantity basis and reasoning for all 26 existing active products. Amounts are rounded editorial estimates based on Nigerian listings; source crawl dates can lag behind live retailer changes. New, not used, comparisons were preferred. Shipping, installation and accessories are not included.

Exact model matches were found for the Bruhm four-door refrigerator and Midea Breezeless split; several other items use different regional codes or comparable capacities. The 9kg dryer, bottom-freezer fridge, portable AC and cassette AC are rough comparable-product inferences, explicitly identified to customers, not verified exact-model prices. The mini-fridge comparison uses a retailer market roundup and has lower confidence. Do not imply current store stock, dealer status or retailer warranty terms.

Generic products require a stated basis: cable is per 100m roll of 1.5mm² only (not all listed sizes); panel light is per 24W unit (source was a two-pack); microwave is 20L; washing machine comparison is 7kg; fan comparison is 16–18 inch non-rechargeable. Other variants may cost more or less.

Conflicting/outlier sources were not treated as verified quotes: the Bruhm manufacturer aggregator showed 499,000 while the directly linked retailer showed 1,299,990; the latter informed the 1,300,000 guide. A 123,000 LG 306L listing was considered unreliable compared with the broader market. Owner review is still required.

Deploy the estimate-labelled frontend before running `estimated_prices.sql`. Migration 005 adds the estimate flag and price note; no role/access changes are required. The seed updates only active products whose price is still null. Owner-entered prices are preserved, and re-running does not overwrite estimates already reviewed or modified. Owners can edit amounts, price notes and the estimate checkbox; clearing a price also clears the note and flag.
