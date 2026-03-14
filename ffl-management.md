# FFL Management System — Feasibility & Implementation Plan

**Date:** March 14, 2026
**Repo:** DamageLabs/armory-core

---

## Overview

Armory Core already has the architectural foundation for FFL (Federal Firearms License) management. This document outlines what's needed to extend the platform into a compliance-grade FFL management system, including the ATF Acquisition & Disposition (A&D) bound book, NICS background check tracking, and regulatory reporting.

---

## What Armory Core Already Has

- ✅ Serial number tracking per item
- ✅ Multi-user with role-based access
- ✅ Audit logging
- ✅ Photo/attachment storage
- ✅ Reports and CSV/PDF export
- ✅ Barcode/QR scanning
- ✅ Category and custom field system
- ✅ Maintenance/service log per item
- ✅ Cost tracking and valuation

---

## Implementation Tiers

### Tier 1 — A&D Bound Book (Core FFL Requirement)

**Estimated effort:** 1-2 weeks

The A&D book is the single most critical FFL compliance requirement. Every firearm received or disposed of must be logged.

**Acquisition Record (receiving a firearm):**
- Date of acquisition
- Manufacturer and/or importer
- Model
- Serial number
- Type (pistol, revolver, rifle, shotgun, receiver/frame)
- Caliber or gauge
- Acquired from: name, address, FFL number (if dealer) or government ID (if individual)

**Disposition Record (selling/transferring a firearm):**
- Date of disposition
- Disposed to: name, address
- FFL number (if dealer-to-dealer) or NICS transaction number (if to individual)
- ATF Form 4473 reference number
- Method of disposition (sale, transfer, return to manufacturer, theft/loss, destroyed)

**Data model (new tables):**

```
ad_book_entries
├── id (PK)
├── item_id (FK → items)
├── entry_type (acquisition | disposition)
├── transaction_date
├── counterparty_name
├── counterparty_address
├── counterparty_city
├── counterparty_state
├── counterparty_zip
├── counterparty_ffl_number (nullable — for dealer transactions)
├── counterparty_id_type (nullable — drivers_license, passport, etc.)
├── counterparty_id_number (nullable — for individual transactions)
├── counterparty_id_state (nullable)
├── nics_transaction_number (nullable — for dispositions to individuals)
├── form_4473_number (nullable)
├── disposition_method (nullable — sale, transfer, return, theft_loss, destroyed)
├── notes
├── created_by (FK → users)
├── created_at
├── updated_at
└── is_voided (boolean, soft delete — ATF requires 20-year retention)
```

**Key requirements:**
- Entries are append-only — mistakes are corrected with new entries, originals are never deleted
- 20-year retention minimum (soft delete only, no hard delete ever)
- A&D book must be printable/exportable on demand for ATF inspections
- Serial number must be exact — no abbreviations or partial numbers
- Bound book page numbering for printed format

**API endpoints:**
- `POST /api/items/:id/ad-entries` — create acquisition or disposition entry
- `GET /api/items/:id/ad-entries` — history for a specific firearm
- `GET /api/ad-book` — full bound book (paginated, filterable by date range)
- `GET /api/ad-book/export` — PDF/CSV export in ATF-compliant format
- `POST /api/ad-entries/:id/void` — void an entry (with reason, never delete)

### Tier 2 — NICS/Background Check Tracking

**Estimated effort:** 1-2 weeks (on top of Tier 1)

The actual NICS check is performed via phone (1-888-324-6427) or the FBI's NICS E-Check web portal. The software records the result — it doesn't integrate with NICS directly.

**Data model (new table):**

```
nics_checks
├── id (PK)
├── ad_entry_id (FK → ad_book_entries, disposition entry)
├── nics_transaction_number
├── check_date
├── check_method (phone | e-check)
├── result (proceed | delayed | denied | cancelled | no_result)
├── delayed_proceed_date (nullable — if initially delayed, then proceeded)
├── buyer_first_name
├── buyer_last_name
├── buyer_dob
├── buyer_ssn_last4 (nullable, encrypted)
├── buyer_race
├── buyer_ethnicity
├── form_4473_questions (JSON — responses to 21a-21k)
├── notes
├── created_by (FK → users)
├── created_at
└── updated_at
```

**Form 4473 question tracking (21a through 21k):**
- Store as structured JSON with question ID and yes/no response
- Any "yes" answer (except 21a) is a disqualifying condition — flag in UI
- Do NOT make automated proceed/deny decisions — that's the NICS examiner's job

**Key requirements:**
- NICS transaction numbers must be recorded for every individual disposition
- Delayed transactions must be tracked — dealer may transfer after 3 business days if no final determination
- Denied transactions must be recorded and the disposition must not proceed
- Buyer PII (SSN, DOB) should be AES-256 encrypted at rest

### Tier 3 — Compliance & Regulatory Reporting

**Estimated effort:** 2-3 weeks (on top of Tiers 1-2)

**ATF inspection readiness:**
- Generate complete A&D book in ATF-required format on demand
- Inventory reconciliation report (physical count vs book count)
- Missing/unresolved disposition report (acquisitions without matching dispositions)
- Quick search by serial number, date range, counterparty

**Theft/loss reporting (ATF Form 3310.11):**
- Date of discovery
- Firearm details (from item record)
- Circumstances
- Law enforcement report number
- Generate pre-filled Form 3310.11 data for manual submission

**Multiple sale reporting (ATF Form 3310.4):**
- Automatically flag when 2+ handguns are disposed to the same individual within 5 consecutive business days
- Generate pre-filled Form 3310.4 data
- Must be reported to ATF and local law enforcement within 1 business day

**Annual manufacturing report (ATF Form 5300.11):**
- If the FFL includes a manufacturing SOT, track manufactured firearms
- Annual report of production by type, caliber, and quantity

**Dashboard widgets:**
- Firearms awaiting disposition (received but not yet sold/transferred)
- Pending NICS checks (delayed, awaiting resolution)
- Upcoming compliance deadlines
- Inventory discrepancy alerts

### Tier 4 — Multi-Location & Transfers

**Estimated effort:** 2-3 weeks (on top of Tiers 1-3)

**FFL-to-FFL transfers:**
- Track inbound/outbound transfers between FFLs
- Record shipping carrier, tracking number, date shipped/received
- ATF Form 3310.12 for interstate transfers
- Verify receiving FFL number against ATF EZ Check

**Consignment tracking:**
- Firearm received on consignment (not owned by the FFL)
- Track consignment terms, owner info, sale proceeds split
- Must still be logged in A&D book

**Multi-store support:**
- Separate A&D books per FFL number/location
- Consolidated reporting across locations
- Transfer between own locations

---

## Competitive Landscape

| Product | Price | Notes |
|---------|-------|-------|
| FastBound | $49-149/mo | Market leader, cloud-based, ATF-approved electronic A&D |
| Orchid (EasyBound) | $75-200/mo | POS integration, enterprise-focused |
| AcquirePoS | $69-149/mo | Full POS + FFL compliance |
| Gun Store Master | $50-100/mo | Legacy desktop app, aging |
| Armory Core | Free (open source) | Would be first open-source FFL management system |

**Market size:** ~50,000 active FFLs in the US. Even 1% market capture at $75/month = **$450K ARR**.

**Differentiator:** First open-source option. Self-hosted = dealer owns their data. No vendor lock-in. Lower cost for small FFLs (home-based, kitchen-table dealers) who can't justify $100+/month.

---

## Risks & Considerations

### Legal/Compliance Risk
- **ATF compliance is unforgiving.** Errors in the A&D book can result in license revocation, fines, or criminal charges.
- Software must include clear disclaimers that it does not constitute legal compliance advice.
- Data model and reporting formats should be reviewed by an attorney familiar with ATF regulations (27 CFR Part 478).
- Consider ATF's electronic bound book requirements (ATF Ruling 2016-1) if pursuing electronic A&D book approval.

### Data Security
- Buyer PII (SSN, DOB, government ID numbers) requires encryption at rest (AES-256-GCM)
- NICS transaction data is sensitive and federally regulated
- Backup/disaster recovery is critical — losing the A&D book has federal consequences
- Consider FIPS 140-2 compliance for encryption modules if pursuing government/LE customers

### Regulatory Changes
- ATF rules change periodically — the software must be updatable when regulations shift
- The "enhanced background check" provisions and any new reporting requirements should be monitored
- State-level requirements vary significantly (CA DROS, NY requirements, etc.)

---

## Recommended Path

1. **Start with Tier 1 only** — the A&D book is the foundation everything else builds on
2. **Get a legal review** before shipping — have an FFL holder and/or attorney validate the data model
3. **Beta test with 2-3 friendly FFL holders** who currently use spreadsheets or paper
4. **Do NOT auto-submit anything to ATF** — generate data for manual submission only
5. **Add tiers incrementally** based on user feedback
6. **Consider ATF electronic bound book approval** (Ruling 2016-1) as a v2 milestone — this would be a significant competitive advantage

---

## Level of Effort Summary

| Tier | Scope | Estimate | Dependencies |
|------|-------|----------|-------------|
| Tier 1 | A&D Bound Book | 1-2 weeks | None — can start immediately |
| Tier 2 | NICS Tracking | 1-2 weeks | Tier 1 |
| Tier 3 | Compliance Reports | 2-3 weeks | Tiers 1-2 |
| Tier 4 | Multi-Location & Transfers | 2-3 weeks | Tiers 1-3 |
| **Total** | **Full FFL System** | **6-8 weeks** | |

All estimates assume the existing armory-core architecture and patterns. The work is primarily data modeling, CRUD endpoints, and report generation — all patterns that already exist in the codebase.
