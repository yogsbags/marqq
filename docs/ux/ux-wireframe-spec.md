# Marqq UX Wireframe Spec

## Purpose

This document translates the redesign strategy into screen-level structure.

It is not a visual design system. It is a product-wireframe specification that defines:

- page purpose
- information hierarchy
- primary actions
- interaction states
- next-step guidance

The goal is to remove cognitive overload, make workflows legible, and let the agentic layer reduce user effort instead of adding decisions.

## Global UX Rules

These rules apply to every major screen.

### Rule 1: Every screen must answer four questions

- Where am I?
- What is this for?
- What should I do now?
- What happens next?

### Rule 2: Every screen must have one primary action

Secondary actions can exist, but the user should always know the main intended move.

### Rule 3: “Next Best Action” is persistent

Every core screen should contain a persistent panel with:

- recommended next step
- why it matters
- what is ready
- what is missing
- CTA

### Rule 4: Prompting is advanced mode

Default interaction should be:

- guided selection
- structured input
- artifact-based review

Freeform prompting can exist behind `Advanced`.

### Rule 5: Demo and live must be visibly distinct

Any simulated state should be labeled:

- `Demo data`
- `Simulated`
- `Preview only`

### Rule 6: Artifacts persist across flows

The user should be able to reuse:

- lead sets
- customer segments
- briefs
- campaigns
- copy variants
- tests
- reports

## Primary Navigation

Top-level navigation:

- `Home`
- `Setup`
- `Plan`
- `Execute`
- `Measure`
- `Customers`
- `Library`

### Left Navigation Pattern

Structure:

- category label
- 3-6 child items max
- current section highlighted
- current workflow stage shown when applicable

Avoid:

- 20+ flat peer items
- mixed naming conventions
- modules that differ only slightly in meaning

## Screen 1: Home / Command Center

## Purpose

Be the default daily destination.

The user should open Home and immediately understand:

- the biggest risk
- the biggest opportunity
- what is already in motion
- what to do next

## Layout

### Block A: Header

Content:

- workspace switcher
- page title: `Command Center`
- short date / freshness indicator
- optional “data last synced” state

### Block B: Recommended Next Step

Hero panel with:

- title: `Recommended Next Step`
- one-sentence rationale
- expected outcome
- estimated effort
- primary CTA
- secondary CTA: `Why this?`

Example:

- Recommendation: `Launch outreach to 142 high-fit leads`
- Why: `Lead scoring and routing are complete`
- Effort: `10 min review`
- CTA: `Open Lead Engine`

### Block C: Priority Stack

Three horizontally aligned cards:

- `Biggest Risk`
- `Biggest Opportunity`
- `Most Important In-Flight Workflow`

Each card contains:

- concise label
- metric or impact statement
- one CTA

### Block D: In-Flight Workflows

List of workflow objects showing:

- workflow name
- current stage
- owner agent(s)
- status
- next required input
- resume CTA

### Block E: Goal Shortcuts

Six goal buttons:

- `Get More Leads`
- `Improve Conversion`
- `Launch a Campaign`
- `Retain Customers`
- `Create Content`
- `Understand Performance`

Each button should route into a guided workflow, not a generic module landing.

### Block F: Recent Outcomes

List of recent completed work:

- what changed
- measured result
- linked artifact
- recommended follow-up

## Empty State

For new users:

- show setup progress
- explain value in plain language
- replace metrics with setup checklist
- primary CTA: `Complete Setup`

## Screen 2: Setup

## Purpose

Centralize all configuration needed for the product to work.

## Layout

### Step rail

Five setup steps:

1. Workspace
2. Integrations
3. Company Context
4. Offers and ICP
5. Team Access

### Main content

Each step should include:

- what this step unlocks
- required inputs
- optional inputs
- completion criteria
- status

### Right rail

Persistent:

- setup completeness
- blockers
- recommended next setup action

## Key Interaction Requirements

- setup must be workspace-scoped everywhere
- completion should be system-detected, not manually “marked done”
- placeholders should not look live

## Screen 3: Plan

## Purpose

Help the user define strategy before making assets.

## Child items

- Market Intelligence
- Audience
- Positioning
- Offer
- Launch Plan

## Shared layout

### Top bar

- page title
- short description
- linked source artifacts

### Main canvas

Three sections:

- `Inputs`
- `Draft Strategy`
- `Recommended Next Step`

### Example: Positioning

Inputs:

- ICP
- competitors
- category
- proof points

Draft Strategy:

- positioning statement
- differentiators
- message pillars

Next:

- `Turn this into messaging`
- `Pressure-test with Offer Design`

## Screen 4: Execute

## Purpose

Run core growth and campaign workflows.

## Child items

- Lead Engine
- Paid Ads
- Content Studio
- Outreach
- Voice Campaigns
- Referral Programs

Each of these should follow the same workflow shell.

## Shared Workflow Shell

### Stage Header

Content:

- workflow name
- current stage
- progress
- source artifacts in use

### Main Area

Split into:

- `What we know`
- `What we need`
- `Configuration / Review`

### Right Rail

- active agents
- agent tasks in plain language
- risks / validation notes
- next best action

## Screen 4A: Lead Engine

## Purpose

Be the canonical place to acquire, score, route, and activate outbound leads.

## Stages

1. Target
2. Fetch
3. Enrich
4. Score
5. Route
6. Outreach
7. Monitor

## Wireframe

### Top Summary Row

- target segment
- fetched leads count
- qualified leads count
- ready-to-launch count

### Stage Panels

#### Target

- choose ICP
- filters
- source selection

Primary CTA:

- `Find Leads`

#### Fetch / Enrich

- progress state
- source coverage
- dedupe count
- missing-field warnings

Primary CTA:

- `Approve Enriched Lead Set`

#### Score / Route

- score distribution
- routing logic summary
- recommended channel by segment

Primary CTA:

- `Approve Routing`

#### Outreach

- sequence preview
- personalization fields
- sender identity
- channel mix

Primary CTA:

- `Launch Outreach`

#### Monitor

- replies
- meetings
- bounce / failure
- next optimization

Primary CTA:

- `Improve Sequence`

## Screen 4B: Paid Ads

## Purpose

Be the canonical paid acquisition workspace.

## Submodes

- `Analyze`
- `Build`
- `Optimize`

## Analyze Mode

Show:

- account health
- channel comparison
- top issues
- top opportunities

Primary CTA:

- `Open Opportunity`

## Build Mode

Show:

- campaign objective
- audience
- budget
- creative set
- copy variants
- review summary

Primary CTA:

- `Launch Campaign`

## Optimize Mode

Show:

- underperformers
- budget shifts
- creative fatigue
- recommendations

Primary CTA:

- `Apply Optimization`

## Screen 5: Measure

## Purpose

Turn results into decisions.

## Child items

- Performance
- Budget Optimization
- CRO
- Experiments

## Screen 5A: Performance

Purpose:

- monitoring and benchmarking

Layout:

- KPI header
- trend charts
- anomalies
- benchmark summary
- next best action

Primary CTA:

- `Investigate Issue`

## Screen 5B: Budget Optimization

Purpose:

- decide what spend to change next

Layout:

- recommended spend shifts
- why each shift is recommended
- confidence level
- expected impact
- apply / export actions

Primary CTA:

- `Apply Budget Shift`

## Screen 5C: CRO

Purpose:

- diagnose conversion problems and prioritize fixes

## Modes

- Page
- Signup
- Onboarding
- Forms
- Popups
- Paywall

## Layout

### Left

- audit findings
- severity
- impact estimate

### Middle

- recommended fixes
- copy variants
- UX changes

### Right

- next best action
- suggested experiment
- effort estimate

Primary CTA:

- `Create Experiment`

## Screen 5D: Experiments

Purpose:

- be the operational layer for testing

## Stages

1. Hypothesis
2. Variants
3. Metric
4. Sample target
5. Launch
6. Readout

## Layout

- hypothesis summary
- control and variant preview
- guardrails
- results table
- winner recommendation

Primary CTA:

- `Launch Test` or `Declare Winner`

## Screen 6: Customers

## Purpose

Help the user understand customer state and act on it.

## Child items

- Customer View
- Lifecycle Journeys
- Retention

## Screen 6A: Customer View

Purpose:

- source of truth for customer profiles and segments

## Layout

### Header metrics

- total profiles
- data freshness
- at-risk count
- high-opportunity count

### Main body

- segments list
- profile explorer
- key insights
- recommended actions

### Important behavior

- user can click a segment and immediately send it into Lifecycle or Retention

Primary CTA:

- `Use Segment`

## Screen 6B: Lifecycle Journeys

Purpose:

- activate segments through multi-step engagement flows

## Stages

1. Choose segment
2. Choose objective
3. Choose channels
4. Review content
5. Launch
6. Monitor

## Layout

- selected segment summary
- journey map
- content assets
- launch settings
- live metrics

Primary CTA:

- `Launch Journey`

## Screen 6C: Retention

Purpose:

- prevent churn and recover at-risk customers

## Layout

- risk cohorts
- churn reason breakdown
- intervention playbooks
- save offers
- win-back assets

Primary CTA:

- `Launch Retention Intervention`

## Screen 7: Library

## Purpose

Give the user persistent memory across workflows.

## Tabs

- Segments
- Briefs
- Campaigns
- Journeys
- Copy
- Tests
- Reports

## Item layout

Each artifact card should show:

- name
- type
- source workflow
- last updated
- status
- connected downstream actions

Primary CTA:

- `Reuse`

## Global Components

## Component: Next Best Action

Required fields:

- title
- why this matters
- what is ready
- what is missing
- CTA

## Component: Agent Activity Panel

Show:

- active agent name
- what the agent is doing in plain English
- whether the work is using live or uploaded context
- handoff status

Do not show:

- unnecessary internal agent jargon
- raw orchestration complexity

## Component: Artifact Picker

Use whenever the user can choose existing work instead of re-entering data.

Examples:

- choose saved segment
- choose launch brief
- choose lead set
- choose approved messaging pack

## Component: Live vs Demo Banner

If any screen is using sample or simulated data, show a prominent banner:

- `This workflow is currently using demo data`
- `Connect live sources to make this operational`

## Key User States

The UI should explicitly support:

- first-time user
- partially configured user
- active operator
- blocked user
- reviewing results

Each state should have different defaults.

## First-Time User

- fewer choices
- more guidance
- stronger setup nudges

## Active Operator

- faster workflow resume
- direct action shortcuts
- less explanation

## Blocked User

- issue diagnosis
- why blocked
- unblock CTA

## Reviewing Results

- outcomes
- confidence
- recommended next step

## Summary

The wireframe goal is simple:

- Home tells me what matters
- navigation is organized by jobs
- workflows are guided
- context persists
- agents coordinate in the background
- every screen tells me what to do next
