# SAHJONY Catalog Activation Runbook

## Objective
Move a candidate from HOLD to sellable without exposing sourcing strategy or allowing unverified inventory into checkout.

## Activation gates
A candidate may become a product only after all gates pass:

1. Commercial source evidence exists and is current.
2. Verification method is one of: `brand_direct_account`, `authorized_distributor_account`, `authorized_wholesale_invoice`, `owned_inventory_receipt`.
3. Exact manufacturer/wholesale SKU is known.
4. Product name and brand are confirmed from permitted commercial materials.
5. SAHJONY retail price is approved internally.
6. Available inventory is confirmed and entered as an integer >= 1.
7. Product imagery is owned, licensed, brand-authorized, or otherwise permitted for commercial use.
8. Returns/fulfillment constraints for the SKU are known.

## Required sequence

- Candidate: `HOLD`
- Evidence reviewed: keep `isActive=false`, `sourceVerified=false`
- Evidence accepted: set verification method; API stamps `sourceVerifiedAt`
- Inventory confirmed: enter quantity
- Final merchandising review: set `isActive=true`
- Readiness must report verified sellable inventory before live sales can be enabled

## Prohibited shortcuts

- Do not scrape or copy retailer product catalogs into SAHJONY.
- Do not mark a product verified based only on a supplier marketing claim.
- Do not use editorial placeholder products as live inventory.
- Do not expose supplier identity, acquisition cost, margin, invoice, or sourcing notes in public APIs.
- Do not enable live sales until payment, database, inventory reservation, fulfillment, and readiness gates pass.

## Success metrics

- 100% sellable SKUs have qualifying source evidence.
- 100% sellable SKUs have current inventory.
- 0 placeholder/editorial SKUs are sellable.
- 0 negative inventory.
- 0 unresolved expired reservations before launch.
