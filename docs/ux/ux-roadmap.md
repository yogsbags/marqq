# Marqq UX Roadmap

## Purpose

This roadmap translates the redesign strategy into phased product work.

It is designed to:

- reduce user confusion quickly
- create clearer product ownership per workflow
- avoid large-bang redesign risk
- improve trust before adding more capability

## North Star

Marqq should feel like one guided marketing operating system where:

- the user starts from goals, not modules
- the system recommends the next best action
- workflows carry context and artifacts forward
- agents reduce decisions instead of increasing them

## Success Metrics

Track these across the redesign:

- time to first meaningful action
- percentage of users starting from goal shortcuts vs raw module navigation
- repeated data entry per workflow
- workflow completion rate
- number of dead-end sessions
- percentage of sessions with next-step CTA clicked
- reduction in navigation backtracking
- trust signals: fewer failed expectations from placeholder or simulated UI

## Phase 0: Trust and Naming Cleanup

## Goal

Fix the most visible trust and clarity issues before restructuring the product.

## Why first

The audit shows repeated false affordances, naming drift, and promise gaps. If those remain, a broader redesign will still feel unreliable.

## Work

- remove or clearly label non-functional controls in Settings and Help
- label simulated workflows and demo data explicitly
- normalize naming across dashboard, sidebar, chat, and module headers
- add “last updated” / “data freshness” where analytics or live data is implied
- add explicit “source of truth” labeling on overlapping lifecycle and analytics screens

## Target modules

- Settings
- Help & Support
- Home
- AI Video
- AI Voice Bot
- Customer View
- User Engagement
- Channel Health

## Exit criteria

- no major placeholder actions look live
- no major workflow looks live without clear labeling
- naming is consistent across the product

## Phase 1: Home as Command Center

## Goal

Replace the current overloaded Home with a clear daily operating surface.

## Work

- redesign Home around:
  - recommended next step
  - priority stack
  - active workflows
  - outcome shortcuts
  - recent results
- demote slash commands and agent mentions from primary interaction to advanced mode
- separate onboarding from daily operations
- make setup progress visible but not dominant once complete

## Product decision

Home becomes the primary start point for every user.

## Pain points solved

- “I don’t know where to start”
- “There is too much on the screen”
- “I don’t know which module to use”

## Exit criteria

- Home can be understood in under 10 seconds
- every major user state has one obvious CTA
- goal-first entry is more prominent than command-driven entry

## Phase 2: Navigation Simplification

## Goal

Collapse the top-level IA into a small number of job-based categories.

## Work

- move to top-level navigation:
  - Home
  - Setup
  - Plan
  - Execute
  - Measure
  - Customers
  - Library
- reduce flat peer-item overload
- move thin or duplicate tools down into subflows or advanced tools

## Consolidation changes

- `Customer View` lives under `Customers`
- `User Engagement` becomes `Lifecycle Journeys`
- `Churn Prevention` becomes `Retention`
- `A/B Tests` becomes `Experiments`
- `Channel Health` moves under Home or Measure as a brief

## Pain points solved

- “These module names are too similar”
- “I have too many top-level choices”
- “I can’t tell which area owns what”

## Exit criteria

- top-level nav contains categories, not tool inventory
- overlapping modules are no longer peers at the top level

## Phase 3: Canonical Workflow Definition

## Goal

Establish one primary workflow per major user job.

## Canonical workflows

- Lead Engine
- Paid Ads
- Conversion
- Customer Lifecycle
- Content
- Launch

## Work

- define source of truth for each workflow
- define shared artifact model
- define stages and handoffs
- define “next best action” behavior at each stage

## Required product rules

- one source of truth per domain
- no repasting data between stages
- all major workflows expose progress and stage state

## Exit criteria

- every major job has one canonical path
- duplicate modules are either merged or clearly secondary

## Phase 4: Lead Workflow Consolidation

## Goal

Make lead generation and outreach feel like one continuous system.

## Merge into Lead Engine

- Lead Intelligence
- Lead Outreach
- routing parts of Revenue Ops

## Stages

1. Target
2. Fetch
3. Enrich
4. Score
5. Route
6. Outreach
7. Monitor

## Work

- persist fetched leads across stages
- remove manual repaste steps
- unify routing and outreach artifacts
- make launch state visible
- add monitoring and reply outcomes

## Pain points solved

- repeated data entry
- duplicate outreach surfaces
- weak handoff from lead discovery to action

## Exit criteria

- one lead workflow is clearly canonical
- users can go from fetch to outreach without leaving the flow

## Phase 5: Conversion System Consolidation

## Goal

Connect diagnosis and testing into one conversion loop.

## Merge into Conversion

- CRO
- A/B Tests / Experiments

## Work

- turn CRO outputs into structured hypotheses
- let users convert findings directly into experiments
- add experiment objects:
  - hypothesis
  - control
  - variant
  - metric
  - sample target
  - status
  - winner

## Pain points solved

- CRO dead-ends
- isolated A/B test prompts
- lack of testing follow-through

## Exit criteria

- every major CRO recommendation can become an experiment in one click
- experiments have real workflow state, not just interpretation prompts

## Phase 6: Customer Lifecycle Definition

## Goal

Define clear ownership across customer analytics, lifecycle action, and retention.

## Roles

- Customer View = customer-data source of truth
- Lifecycle Journeys = engagement action layer
- Retention = churn/save action layer

## Work

- remove duplicate customer-data upload and segmentation logic
- allow segments from Customer View to flow directly into Journeys and Retention
- define separate journey types:
  - onboarding
  - nurture
  - expansion
  - churn prevention
- create retention playbooks tied to risk cohorts

## Pain points solved

- overlap between Customer View, User Engagement, and Churn Prevention
- unclear handoff from insight to action
- duplicate lifecycle logic

## Exit criteria

- lifecycle ownership is explicit
- segments are reusable across lifecycle products

## Phase 7: Paid Media Clarification

## Goal

Make Paid Ads the canonical paid execution surface and move supporting tools into feeder roles.

## Canonical

- Paid Ads

## Supporting

- Budget Optimization feeds paid decisions
- Ads intel feeds creative and strategy
- Performance feeds measurement

## Work

- restructure Paid Ads into:
  - Analyze
  - Build
  - Optimize
- clarify cross-platform vs Meta-only capabilities
- connect recommendations to execution actions

## Pain points solved

- flat-tab overload
- unclear ownership between Paid Ads and Budget Optimization
- weak strategy-to-launch continuity

## Exit criteria

- users can explain the role of Paid Ads vs Budget Optimization in one sentence

## Phase 8: Content Model Clarification

## Goal

Separate quick creation from strategic planning and scaled publishing.

## Future model

- Content Strategy
- Content Studio
- Content Pipeline

## Mapping

- Company Intelligence content strategy work -> Content Strategy
- AI Content -> Content Studio
- Enhanced Bulk Generator -> Content Pipeline

## Work

- introduce explicit mode switch:
  - Quick Draft
  - Campaign Asset
  - Publishing Pipeline
- align downstream publishing and asset reuse

## Pain points solved

- content overlap
- confusion between quick generation and true pipeline workflows

## Exit criteria

- users know when to use Studio vs Pipeline

## Phase 9: Launch Workflow Upgrade

## Goal

Turn Launch Strategy into a real execution workspace.

## Work

- define launch type upfront:
  - product
  - feature
  - campaign
- add structured launch inputs
- add milestone view
- add approvals and handoffs
- add post-launch review

## Pain points solved

- strategy-plus-copy only
- missing launch operations
- no clear sequence after planning

## Exit criteria

- launch workflow includes planning, asset generation, execution, and review

## Phase 10: Library and Artifact System

## Goal

Make the product remember work so workflows compound instead of restarting.

## Artifacts to persist

- segments
- lead sets
- briefs
- campaigns
- journeys
- copy packs
- experiments
- reports

## Work

- create Library as product-wide reuse layer
- allow save / reuse / fork behavior
- show downstream dependencies

## Pain points solved

- repeated input
- repeated generation of the same outputs
- weak continuity across workflows

## Exit criteria

- key artifacts can be reused across workflows
- users no longer need to re-create context manually

## Module-by-Module Decisions

## Keep and strengthen

- Setup
- Market Intelligence
- Audience Profiles
- Positioning
- Paid Ads
- Performance
- Customer View

## Merge or absorb

- Lead Outreach -> Lead Engine
- A/B Tests -> Conversion / Experiments
- User Engagement -> Lifecycle Journeys
- Churn Prevention -> Retention

## Reframe

- Marketing Audit -> executive summary / diagnostic entry point
- Revenue Ops -> routing / operating model design, or merge parts into Lead Engine
- Channel Health -> daily brief, not standalone analytics product
- Messaging & Copy -> either canonical message system or supporting copy QA

## Conditional

- Referral Program stays only if it becomes an operational surface
- Offer Design stays top-level only if it becomes structured and strategic, not prompt-only

## Delivery Sequence Recommendation

Most efficient rollout order:

1. Trust cleanup
2. Home redesign
3. Navigation simplification
4. Canonical workflow definitions
5. Lead Engine consolidation
6. Conversion consolidation
7. Customer lifecycle definition
8. Paid media clarification
9. Content clarification
10. Launch upgrade
11. Library system

## Why this order

- it improves clarity before deep implementation
- it removes the most user-visible friction quickly
- it creates canonical paths before redesigning every screen
- it avoids rebuilding duplicate modules that should be merged

## Risks

### Risk 1: Keeping old and new IA in parallel too long

Mitigation:

- create redirects
- clearly mark deprecated routes
- collapse duplicates early

### Risk 2: Improving visuals before fixing workflow ownership

Mitigation:

- make source-of-truth decisions before UI polish

### Risk 3: Agents remain too visible as complexity

Mitigation:

- default to guided orchestration
- reveal agent detail only when useful

### Risk 4: Demo workflows still look real

Mitigation:

- explicit live/demo labeling in Phase 0

## Final Definition of Success

The redesign is successful when a user can:

- open Home
- understand what matters
- choose a goal
- enter a guided flow
- complete the next step without repasting context
- receive a clear follow-up action

And when the user can describe Marqq as:

“one system that helps me decide, execute, and improve”

not:

“a lot of AI modules I have to figure out.”
