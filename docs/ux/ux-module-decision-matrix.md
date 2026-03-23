# Marqq Module Decision Matrix

## Purpose

This document lists the current modules and recommends whether each should be:

- kept
- merged
- renamed
- reframed
- deprecated from top-level navigation

This is the practical translation layer from current IA to future IA.

## Decision Categories

- `Keep`
Keep as a core destination and strengthen it.

- `Merge`
Absorb into another canonical workflow.

- `Rename`
Keep the capability but improve clarity through naming.

- `Reframe`
Keep the surface, but narrow or redefine its role.

- `Demote`
Remove from top-level nav and keep as a subflow or advanced tool.

## Decision Matrix

| Current Module | Decision | Future Home | Why |
|---|---|---|---|
| Settings | Keep | Setup | Needed as core configuration surface |
| Help & Support | Reframe | Home / Setup support layer | Should become real support and contextual help, not static page |
| Home | Keep | Home | Must become command center |
| Company Intelligence | Reframe | Plan support layer | Rich insights, but too broad as a flat parallel system |
| Marketing Blueprint | Reframe | Plan summary | Best as strategic summary / generated brief |
| Market Intelligence | Keep | Plan | Strong upstream strategy job |
| Audience Profiles | Keep | Plan | Clear strategic value |
| Positioning & GTM | Rename | Plan / Positioning | Should become canonical positioning workspace |
| Offer Design | Conditional Keep | Plan / Offer | Keep only if structured; otherwise demote |
| Messaging & Copy | Reframe | Plan support or Copy QA | Too overlapping to remain standalone without clear ownership |
| Launch Strategy | Keep | Plan / Launch Plan | Needs workflow depth, but should remain core |
| Revenue Ops | Reframe | Execute support or Lead Engine support | Too broad; routing pieces belong with lead flow |
| AI Content | Rename | Execute / Content Studio | Best as quick-create surface |
| Email Sequences | Reframe | Execute / Content Studio or Customers | Should be a downstream execution mode, not isolated peer |
| Social Calendar | Reframe | Execute / Content Studio | Better as content scheduling subflow |
| SEO / LLMO | Keep | Plan or Execute support | Clear function, but should connect to content system |
| Lead Magnets | Reframe | Execute / Content Studio | Better as campaign asset type |
| Sales Enablement | Reframe | Plan or Library / Collateral | Strong artifacts, but not top-level if thin |
| AI Video | Rename | Execute / Content Studio or Voice/Video | Should be positioned as video generation, not “video bot” unless broader workflow is real |
| Lead Outreach | Merge | Execute / Lead Engine | Too overlapping with Lead Intelligence |
| Lead Intelligence | Rename | Execute / Lead Engine | Should become canonical lead workflow |
| Paid Ads | Keep | Execute | Strongest canonical paid workspace candidate |
| Referral Program | Conditional Keep | Execute / Referral Programs | Keep only if it becomes operational, not prompt-only |
| Channel Health | Rename + Demote | Measure / Daily Brief | Current job is a brief, not a true standalone module |
| AI Voice Bot | Keep | Execute / Voice Campaigns | Has enough unique capability to stay core |
| Marketing Audit | Reframe | Plan summary / diagnostic entry | Better as executive summary layer |
| Performance | Keep | Measure | Should own monitoring and benchmarking |
| Budget Optimization | Keep | Measure | Should own spend-change decisions |
| CRO | Rename | Measure / Conversion | Canonical conversion diagnosis layer |
| A/B Tests | Merge | Measure / Conversion / Experiments | Should be downstream from CRO |
| Churn Prevention | Rename | Customers / Retention | Better as retention action layer |
| User Engagement | Rename | Customers / Lifecycle Journeys | Better as lifecycle execution layer |
| Customer View | Rename | Customers / Customer View | Canonical customer-data layer |

## Exact Future Naming

### Top-Level Names

| Current | Future |
|---|---|
| Home | Home |
| Settings | Setup |
| Positioning & GTM | Positioning |
| Lead Intelligence | Lead Engine |
| AI Content | Content Studio |
| AI Voice Bot | Voice Campaigns |
| CRO | Conversion |
| A/B Tests | Experiments |
| Churn Prevention | Retention |
| User Engagement | Lifecycle Journeys |
| Unified Customer View / Customer View | Customer View |
| Channel Health | Daily Brief |

## Modules to Merge Immediately

These are the highest-priority merges because they solve repeated confusion directly.

### Merge 1

- `Lead Outreach` into `Lead Engine`

Reason:

- one lead acquisition and activation workflow is easier to understand than two overlapping ones

### Merge 2

- `A/B Tests` into `Conversion`

Reason:

- diagnosis and testing should be one flow

### Merge 3

- `User Engagement` and `Churn Prevention` under `Customers`

Reason:

- Customer View should feed both lifecycle and retention action

## Modules to Demote from Top-Level Nav

These may still exist, but should not remain peer-level destinations.

- Lead Outreach
- A/B Tests
- Channel Health
- Social Calendar
- Email Sequences
- Lead Magnets
- Messaging & Copy

## Modules That Need Stronger Product Decisions

### Offer Design

Decision rule:

- keep top-level only if it becomes structured and strategic
- otherwise demote into Plan support

### Referral Program

Decision rule:

- keep only if it becomes a real activation and tracking workflow
- otherwise demote into campaign planning

### Revenue Ops

Decision rule:

- if focus is routing and lifecycle logic, merge into Lead Engine
- if focus is operating model design, keep as a specialist planning subflow

### Marketing Audit

Decision rule:

- should become an executive diagnostic summary, not a parallel audit ecosystem

## Proposed Deprecation Logic

When a module is demoted or merged:

- do not hard-remove it immediately
- redirect users to the canonical workflow
- show a banner:
  - `This workflow now lives inside Lead Engine`
  - `Open canonical workflow`

This reduces migration shock.

## Priority Order for Module Decisions

1. Lead Intelligence + Lead Outreach
2. CRO + A/B Tests
3. Customer View + User Engagement + Churn Prevention
4. Paid Ads + Budget Optimization boundaries
5. Content system boundaries
6. Launch Strategy depth
7. Marketing Audit / Channel Health / Messaging & Copy reframing

## Final Principle

A module should remain top-level only if all three are true:

1. it owns a distinct user job
2. it has a clear source-of-truth role
3. it gives the user an actionable workflow, not just generated text

If it fails those tests, it should be merged, reframed, or demoted.
