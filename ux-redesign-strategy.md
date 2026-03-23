# UX Redesign Strategy

## Goal

Redesign Marqq so the product feels like one guided marketing operating system, not a collection of adjacent AI tools.

The user should not need to understand module boundaries before they can act. The system should:

- know their business context
- surface the highest-priority opportunity or risk
- recommend the next best step
- carry context and artifacts between workflows
- reduce repeated input and repeated decisions

## The Core UX Problem

Across the audit, the same pattern repeats:

- too many entry points for the same job
- too many overlapping modules with unclear ownership
- too many prompt-first surfaces instead of workflow-first surfaces
- too many screens that generate output but do not guide the next action
- too much ambiguity about what is real, what is simulated, and what is canonical

The redesign should solve those five problems first.

## Product Model

The future product should be organized around user jobs, not module inventory.

The user journey should be:

1. Set up my business once
2. Understand what matters right now
3. Choose a goal
4. Follow a guided workflow
5. Execute
6. Measure impact
7. Know what to do next

## New Primary Navigation

Recommended primary navigation:

- `Home`
- `Setup`
- `Plan`
- `Execute`
- `Measure`
- `Customers`
- `Library`

### Home

Purpose:

- daily command center
- priorities, risks, opportunities, next actions

Contents:

- Today’s priority stack
- Alerts and blockers
- Recommended next action
- In-flight workflows
- Recent results

### Setup

Purpose:

- one-time and occasional configuration

Contents:

- Workspace
- Integrations
- Company context
- Brand and voice
- Offers
- Team and permissions

### Plan

Purpose:

- strategy and upstream thinking

Contents:

- Market Intelligence
- Audience Profiles
- Positioning
- Offer Design
- Launch Strategy

### Execute

Purpose:

- action and deployment

Contents:

- Lead Engine
- Paid Ads
- Content Studio
- Outreach
- Voice Campaigns
- Referral Programs

### Measure

Purpose:

- understand what is working and what to change

Contents:

- Performance
- Budget Optimization
- CRO
- Experiments

### Customers

Purpose:

- customer intelligence and lifecycle action

Contents:

- Customer View
- Lifecycle Journeys
- Churn Prevention

### Library

Purpose:

- reusable outputs and saved artifacts

Contents:

- Segments
- Briefs
- Campaigns
- Journeys
- Copy packs
- Tests
- Reports

## Home / Command Center

Home should stop being a mixed chat-plus-onboarding-plus-command surface.

It should answer four questions:

1. What needs attention?
2. What is the biggest opportunity?
3. What is already in motion?
4. What should I do next?

### Recommended Home Layout

#### Section 1: Recommended Next Step

Top hero card:

- `Recommended next step`
- one-line rationale
- expected outcome
- estimated effort
- one CTA

Example:

`Recommended next step: Launch outreach to 142 high-fit leads`

Why:

- ICP matches are ready
- routing is complete
- no active outbound sequence is running

CTA:

- `Open Lead Engine`

#### Section 2: Priority Stack

3 cards only:

- `Biggest Risk`
- `Biggest Opportunity`
- `Most Important In-Flight Workflow`

Examples:

- Risk: 3,892 at-risk customers need retention action
- Opportunity: Paid search is outperforming Meta by 28% ROAS
- In flight: Launch Q2 campaign awaiting final messaging

#### Section 3: Active Workflows

Show workflows as persistent objects:

- status
- owner agent(s)
- current stage
- next required input
- resume CTA

#### Section 4: Outcome Shortcuts

Goal-first buttons:

- `Get More Leads`
- `Improve Conversion`
- `Launch a Campaign`
- `Retain Customers`
- `Create Content`
- `Understand Performance`

These should replace generic quick actions and reduce reliance on slash commands.

## Guided Workflow Model

Every major workflow should follow the same structure:

1. Goal selection
2. Context preload
3. Missing inputs only
4. Plan or diagnose
5. Draft or configure
6. Launch or apply
7. Measure
8. Recommend next step

Each workflow should always show:

- current stage
- what is already known
- what is missing
- who is doing what
- what happens next

## Canonical Workflows

## 1. Lead Engine

Purpose:

- acquire and activate pipeline

Should consolidate:

- Lead Intelligence
- Lead Outreach
- parts of Revenue Ops related to routing and handoff

Flow:

1. Define target segment
2. Fetch leads
3. Enrich and dedupe
4. Score and route
5. Configure sequence
6. Launch outreach
7. Monitor replies and conversion

Artifacts:

- lead set
- routing rule
- outreach sequence
- launch record
- reply and conversion report

What the user sees next:

- `142 leads are ready for LinkedIn + Email outreach`
- `Recommended next step: approve sequence and launch`

## 2. Paid Ads Workspace

Purpose:

- plan, launch, and optimize paid acquisition

Should absorb:

- Paid Ads as canonical execution surface

Should consume:

- Budget Optimization insights
- Company Intelligence ads intel

Flow:

1. Review account health
2. Identify opportunity or issue
3. Build or adjust campaign
4. Generate creative and copy
5. Launch
6. Monitor and optimize

Submodes:

- `Analyze`
- `Build`
- `Optimize`

This removes the current flat-tab overload.

## 3. CRO + Experiments

Purpose:

- improve conversion with explicit testing

Should define:

- CRO = diagnosis and prioritization
- Experiments = test design, launch, readout

Flow:

1. Audit page or funnel
2. Prioritize highest-impact fix
3. Turn fix into test
4. Configure success metric
5. Monitor results
6. Declare winner
7. Roll out or iterate

Artifacts:

- hypothesis
- control and variant
- success metric
- sample target
- winner decision

This solves the current break between CRO and A/B Tests.

## 4. Customer Lifecycle

Purpose:

- understand customers, activate journeys, prevent churn

Should define:

- Customer View = source of truth
- Lifecycle Journeys = action layer
- Churn Prevention = save / win-back layer

Flow:

1. Build unified profiles
2. Create segments
3. Identify risk and opportunity cohorts
4. Launch lifecycle journey
5. Trigger churn interventions for at-risk cohorts
6. Monitor engagement and retention

This removes duplicate customer-data upload and duplicate segmentation logic.

## 5. Content System

Purpose:

- create content without confusing quick draft vs pipeline

Should define:

- Content Strategy = what to create
- Content Studio = quick creation
- Content Pipeline = scaled research-to-publish workflow

Flow:

1. Choose campaign or objective
2. Select format
3. Generate draft
4. Review
5. Approve
6. Publish or hand off

The user should always know whether they are in:

- `Quick draft`
- `Campaign asset`
- `Publishing pipeline`

## 6. Launch Workspace

Purpose:

- run product, feature, or campaign launches

Should define launch types up front:

- Product launch
- Feature launch
- Campaign launch

Flow:

1. Define launch type and date
2. Collect audience, objective, assets, channels
3. Build launch plan
4. Generate launch assets
5. Review approvals
6. Execute sequence
7. Track launch performance

This fixes the current strategy-plus-copy-only model.

## How Agents Should Work

The user should not need to manually pick agents most of the time.

Agents should behave as orchestration behind the workflow.

### Agent Responsibilities

- `Planner agent`
Understands the goal, loads context, chooses the workflow

- `Specialist agents`
Do the domain work inside the workflow

- `Coordinator agent`
Hands off outputs between stages and updates next steps

### What the User Should Experience

Instead of:

- pick a module
- pick an agent
- edit a prompt
- guess the next module

The user should experience:

- state goal
- review suggested workflow
- confirm missing inputs
- approve output
- follow recommended next step

### Agent UI Principles

- default to system-selected agents
- only reveal agent identities secondarily
- show what each agent is doing in plain language
- show when context has been carried forward
- always present the next recommended action

## Friction-Reduction Rules

These should become product-wide rules.

### Rule 1: One Source of Truth Per Domain

- customer data -> Customer View
- lead data -> Lead Engine
- experiments -> Experiments
- performance data -> Performance
- lifecycle segments -> Customer View
- launch plans -> Launch Workspace

### Rule 2: No Re-Pasting Data

If the user fetched a lead list, defined a segment, or uploaded a customer file once, that artifact should be reusable across workflows.

### Rule 3: No Prompt-Only First Screens

The first step should always be:

- structured intake
- guided choice
- artifact selection

Prompt editing can exist later as an advanced mode.

### Rule 4: Every Screen Must End With “What Next”

No workflow should end with output only.

Every flow should end with:

- `Recommended next step`
- `Why`
- `What you need to provide`
- `Expected outcome`

### Rule 5: Real vs Demo Must Be Explicit

If a workflow is simulated, label it clearly.

Examples:

- `Demo data`
- `Simulated launch`
- `Preview only`
- `Live connector required`

### Rule 6: Fewer Top-Level Choices

Top-level navigation should contain categories, not 20+ peer tools.

## Recommended “Next Best Action” Pattern

Each workflow should include a persistent panel:

### Next Best Action

- `Recommended next step`
- `Why this matters now`
- `What is already ready`
- `What is still missing`
- primary CTA

Example after CRO:

- Recommended next step: `Create an A/B test for the headline and CTA rewrite`
- Why: `This is the highest-impact fix from the audit`
- Ready: `Variant copy and success metric`
- Missing: `Traffic allocation and test duration`

Example after Customer View:

- Recommended next step: `Launch a lifecycle journey for Growth Potential customers`
- Why: `This segment has the highest expansion upside`
- Ready: `Segment definition and engagement signals`
- Missing: `Channel mix approval`

## Current-to-Future Consolidation Map

### Keep as Canonical

- `Setup`
- `Market Intelligence`
- `Audience Profiles`
- `Positioning`
- `Offer Design`
- `Paid Ads`
- `Performance`
- `Customer View`

### Merge / Reframe

- `Lead Intelligence` + `Lead Outreach` -> `Lead Engine`
- `CRO` + `A/B Tests` -> `Conversion`
- `User Engagement` -> `Lifecycle Journeys`
- `Churn Prevention` -> `Retention`
- `AI Content` + `Enhanced Bulk Generator` -> `Content Studio` + `Content Pipeline`
- `Launch Strategy` remains, but becomes a real workflow
- `Marketing Audit` becomes an executive summary entry point, not a parallel audit system

### Reduce or Rename

- `Channel Health` -> `Daily Brief` or merge into Home
- `Referral Program` -> keep only if it becomes a real execution surface
- `Revenue Ops` -> narrow to operating model design, or merge routing pieces into Lead Engine
- `Messaging & Copy` -> either become canonical message system or reduce to copy QA

### Remove From Top-Level Nav

These should not be first-level destinations if they remain thin:

- Lead Outreach
- A/B Tests
- Channel Health
- Messaging & Copy
- Offer Design, if still prompt-only

They can still exist as subflows or advanced tools.

## What the User Should Feel

The future experience should feel like:

- “This product understands my business.”
- “I always know what matters most.”
- “I never have to guess where to go.”
- “I do not need to re-enter the same context.”
- “The agents are helping me move forward, not asking me to manage them.”
- “Every screen leaves me with a clear next action.”

## Implementation Priorities

### Phase 1

- redesign Home into command center
- simplify navigation into 6-7 categories
- add persistent `Next Best Action` pattern
- label demo vs live states clearly

### Phase 2

- create canonical Lead Engine
- connect CRO to Experiments
- define Customer View as lifecycle source of truth
- remove duplicated top-level routes

### Phase 3

- unify content model into strategy / quick create / pipeline
- make Launch Strategy a real execution workflow
- turn Library into persistent artifact system

## Success Criteria

The redesign is working if:

- new users can start from Home without asking where to go
- users choose goals more often than modules
- repeated data entry drops sharply
- cross-module handoff becomes artifact-based
- fewer workflows end in dead-end text output
- users can explain the product as one system, not a tool collection
