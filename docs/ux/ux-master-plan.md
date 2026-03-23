# Marqq UX Master Plan

## Purpose

This is the master UX recommendation for Marqq.

It combines:

- the audit synthesis
- the target user journey
- the future navigation model
- the workflow redesign
- the agentic UX model
- the wireframe direction
- the roadmap
- the module consolidation decisions

This should be treated as the single narrative document for product, design, and UX planning.

## Executive Summary

Marqq’s current UX problem is not a lack of capability. It is a lack of orchestration clarity.

The product currently feels like a large collection of AI-powered modules that the user has to interpret, compare, and stitch together manually. That creates five consistent breakdowns:

- too many top-level choices
- too many overlapping modules for the same job
- too many prompt-first screens instead of guided workflows
- too many outputs without a clear next action
- too much ambiguity about what is live, what is simulated, and what is canonical

The redesign goal is to make Marqq feel like one guided marketing operating system where the user:

1. sets up the business once
2. lands in a command center
3. picks a goal, not a module
4. follows a guided workflow
5. executes with minimal friction
6. measures impact
7. always knows what to do next

## What the User Should Feel

The future product should make the user feel:

- “This product understands my business.”
- “I always know what matters most.”
- “I do not need to guess where to go.”
- “The system carries my context for me.”
- “The agents are helping me move forward, not asking me to manage them.”
- “Every screen ends with a clear next step.”

## The Core UX Diagnosis

From the full audit, the recurring issues can be grouped into six themes.

## 1. Navigation Overload

The current IA exposes too many peer-level modules. Users are forced to infer distinctions between similar-sounding surfaces such as:

- Lead Intelligence vs Lead Outreach
- CRO vs A/B Tests
- Customer View vs User Engagement vs Churn Prevention
- Paid Ads vs Budget Optimization vs Performance
- AI Content vs Email Sequences vs Social Calendar vs Lead Magnets

This increases decision cost before work even begins.

## 2. Workflow Fragmentation

Many modules cover only one slice of a larger job. The user has to carry state manually between them.

Examples:

- lead acquisition breaks between fetch, enrich, route, and outreach
- customer analytics breaks from customer view into lifecycle and retention action
- CRO diagnosis breaks away from experiment execution

## 3. Prompt-First Interaction

Too many screens begin with a long generic prompt. This is flexible for power users but poor for most users. It means:

- the user must structure the job themselves
- the system does not scaffold the right inputs
- the product feels like a smart textarea instead of an operating workflow

## 4. Weak Next-Step Guidance

Many screens generate outputs but do not tell the user:

- whether the output is complete
- what to do with it
- what the recommended follow-up action is
- which system or workflow should consume it next

## 5. Source-of-Truth Ambiguity

There is no consistently visible answer to:

- where customer truth lives
- where lead truth lives
- where message truth lives
- where conversion truth lives

This causes duplication and hesitancy.

## 6. Trust Gaps

Multiple screens look live even when they are:

- placeholders
- simulated
- prompt-only
- using generated demo data

This weakens confidence in the product.

## Design Principle

The product should be organized around user jobs, not tool inventory.

The right model is:

```text
Understand
-> Decide
-> Execute
-> Measure
-> Improve
```

The UI, navigation, workflows, and agentic layer should all reinforce that loop.

## Target User Journey

The ideal Marqq journey should be:

1. Set up my business once
2. Understand what matters right now
3. Choose a goal
4. Follow a guided workflow
5. Execute
6. Measure impact
7. Know what to do next

This is the product story the UX should communicate everywhere.

## Future Navigation

The top-level navigation should move from module-first to job-first.

Recommended top-level navigation:

- `Home`
- `Setup`
- `Plan`
- `Execute`
- `Measure`
- `Customers`
- `Library`

## Home

Purpose:

- daily command center

Should answer:

- what needs attention
- what is the biggest opportunity
- what is already in motion
- what should I do next

## Setup

Purpose:

- one-time and occasional configuration

Should contain:

- workspace
- integrations
- company context
- brand and voice
- offers and ICP
- team and permissions

## Plan

Purpose:

- strategy and upstream decisions

Should contain:

- Market Intelligence
- Audience
- Positioning
- Offer
- Launch Plan

## Execute

Purpose:

- growth and campaign execution

Should contain:

- Lead Engine
- Paid Ads
- Content Studio
- Voice Campaigns
- Referral Programs

## Measure

Purpose:

- understand what is working and what to change

Should contain:

- Performance
- Budget Optimization
- Conversion
- Daily Brief

## Customers

Purpose:

- customer intelligence and lifecycle action

Should contain:

- Customer View
- Lifecycle Journeys
- Retention

## Library

Purpose:

- persistent reusable outputs

Should contain:

- Segments
- Lead Sets
- Briefs
- Campaigns
- Journeys
- Copy Packs
- Experiments
- Reports

## Home / Command Center

Home should become the single best default entry point.

It should stop trying to be:

- onboarding hub
- command palette
- chat shell
- setup checklist
- workflow launcher

all at once.

Instead, it should be a clean command center.

## Home Structure

### 1. Recommended Next Step

This is the most important block in the product.

It should show:

- recommendation
- rationale
- expected outcome
- estimated effort
- primary CTA

Example:

- Recommended next step: `Launch outreach to 142 high-fit leads`
- Why: `Lead scoring and routing are complete`
- Outcome: `Start pipeline generation this week`
- Effort: `10 min review`

### 2. Priority Stack

Three cards only:

- Biggest Risk
- Biggest Opportunity
- Most Important In-Flight Workflow

### 3. Active Workflows

Persistent workflow objects showing:

- current stage
- owner agents
- required next input
- resume CTA

### 4. Goal Shortcuts

Primary goal-first actions:

- Get More Leads
- Improve Conversion
- Launch a Campaign
- Retain Customers
- Create Content
- Understand Performance

### 5. Recent Outcomes

Completed work with:

- measured result
- linked artifact
- recommended follow-up

## Canonical Workflow Model

Every major workflow should follow the same interaction pattern:

1. Goal selection
2. Context preload
3. Missing inputs only
4. Plan or diagnose
5. Draft or configure
6. Launch or apply
7. Measure
8. Recommend next step

This should be the UX skeleton used across the product.

## Canonical Workflows

## 1. Lead Engine

Purpose:

- acquire and activate pipeline

Should consolidate:

- Lead Intelligence
- Lead Outreach
- routing parts of Revenue Ops

Stages:

1. Target
2. Fetch
3. Enrich
4. Score
5. Route
6. Outreach
7. Monitor

This gives the user one clear lead workflow instead of several overlapping ones.

## 2. Paid Ads

Purpose:

- canonical paid acquisition workspace

Submodes:

- Analyze
- Build
- Optimize

Supporting tools:

- Budget Optimization feeds decisioning
- Ads intel feeds creative and strategy
- Performance feeds measurement

## 3. Conversion

Purpose:

- diagnose and improve conversion with explicit testing

Should combine:

- CRO
- Experiments

Flow:

- audit
- prioritize
- create hypothesis
- launch test
- read out winner
- roll out

## 4. Customer Lifecycle

Purpose:

- understand customers and act on segments

Ownership:

- Customer View = source of truth
- Lifecycle Journeys = action layer
- Retention = churn/save layer

This removes the current overlap across Customer View, User Engagement, and Churn Prevention.

## 5. Content System

Purpose:

- separate strategy from quick creation and scaled publishing

Future model:

- Content Strategy
- Content Studio
- Content Pipeline

This removes current confusion between AI Content, content strategy surfaces, and the bulk generator.

## 6. Launch Workflow

Purpose:

- take launch work beyond strategy and copy

Must support:

- product launch
- feature launch
- campaign launch

And include:

- planning
- asset generation
- approvals
- sequence execution
- launch review

## How the Agentic Framework Should Work

The agents should become orchestration infrastructure, not another navigation layer.

The user should not have to ask:

- which agent should I use
- which module should I open
- where does this output go next

Instead, the system should:

- understand the goal
- select the right workflow
- load existing context
- ask only for missing critical inputs
- route work across agents invisibly
- present outputs as artifacts
- recommend the next action

## Recommended Agent Model

### Planner Agent

- interprets the user goal
- picks the correct workflow
- loads context

### Specialist Agents

- perform domain work within the workflow

### Coordinator Agent

- manages handoffs
- updates status
- recommends next best action

## What the User Should See

The user should see:

- what the system knows
- what it still needs
- what each agent is doing in plain language
- what happens next

The user should not need to manage orchestration complexity directly.

## How to Prevent Cognitive Overload

The redesign should follow these rules.

## 1. Fewer Top-Level Choices

Use categories, not tool inventory.

## 2. One Source of Truth Per Domain

- customer data -> Customer View
- lead data -> Lead Engine
- conversion experiments -> Conversion
- performance monitoring -> Performance
- spend changes -> Budget Optimization
- launch plans -> Launch Plan

## 3. Progressive Disclosure

Only show the next required decision unless the user explicitly opens advanced controls.

## 4. Structured Intake Before Prompting

The system should gather:

- objective
- segment
- channel
- asset type
- metric

before exposing open-ended prompts.

## 5. Persistent Artifacts

Do not make users re-enter:

- segments
- lead lists
- launch briefs
- messaging packs
- test hypotheses
- reports

## 6. Clear Real vs Demo Signaling

If a workflow is not live, label it visibly.

## 7. Every Screen Ends With a Next Action

No dead-end outputs.

## The “Next Best Action” Pattern

Every major screen should contain a persistent panel:

- Recommended next step
- Why this matters
- What is ready
- What is missing
- CTA

Examples:

- After CRO: `Create experiment`
- After Customer View: `Launch lifecycle journey`
- After Lead Engine routing: `Approve and launch outreach`
- After Budget Optimization: `Apply spend shift`

This is the main mechanism for reducing user uncertainty.

## Wireframe Direction

The future UI should use a consistent shell across major workflows.

## Shared Workflow Shell

### Top

- workflow title
- current stage
- source artifacts
- progress

### Main body

- What we know
- What we need
- Configuration / Review

### Right rail

- agent activity
- risks
- validations
- next best action

## Key Screen Patterns

### Home

- command center

### Setup

- step-based completion

### Plan pages

- strategy inputs, outputs, next action

### Execute pages

- staged operational flows

### Measure pages

- insight, recommendation, action

### Customers pages

- segment source of truth plus action handoff

### Library

- persistent artifacts for reuse

## Future IA Sitemap

```text
Home
Setup
Plan
  ├── Market Intelligence
  ├── Audience
  ├── Positioning
  ├── Offer
  └── Launch Plan
Execute
  ├── Lead Engine
  ├── Paid Ads
  ├── Content Studio
  ├── Voice Campaigns
  └── Referral Programs
Measure
  ├── Performance
  ├── Budget Optimization
  ├── Conversion
  │   ├── CRO
  │   └── Experiments
  └── Daily Brief
Customers
  ├── Customer View
  ├── Lifecycle Journeys
  └── Retention
Library
  ├── Segments
  ├── Lead Sets
  ├── Briefs
  ├── Campaigns
  ├── Journeys
  ├── Copy Packs
  ├── Experiments
  └── Reports
```

## Module Decisions

The following are the key decisions from the consolidation work.

## Keep and Strengthen

- Setup
- Home
- Market Intelligence
- Audience Profiles
- Positioning
- Paid Ads
- Performance
- Customer View
- AI Voice Bot, reframed as Voice Campaigns

## Merge

- Lead Outreach -> Lead Engine
- A/B Tests -> Conversion / Experiments
- User Engagement -> Lifecycle Journeys
- Churn Prevention -> Retention

## Rename

- Positioning & GTM -> Positioning
- Lead Intelligence -> Lead Engine
- AI Content -> Content Studio
- CRO -> Conversion
- Channel Health -> Daily Brief
- Customer View / Unified Customer View -> Customer View

## Reframe

- Marketing Audit -> executive summary / diagnostic entry
- Revenue Ops -> support layer or lead-workflow support
- Messaging & Copy -> message system or copy QA
- Sales Enablement -> collateral layer or library-backed support

## Conditional Keep

- Offer Design, only if it becomes structured
- Referral Program, only if it becomes operational

## Demote from Top-Level Navigation

- Lead Outreach
- A/B Tests
- Channel Health
- Social Calendar
- Email Sequences
- Lead Magnets
- Messaging & Copy

## Roadmap

The redesign should be rolled out in phases.

## Phase 0: Trust and Naming Cleanup

- remove false affordances
- label simulated states
- normalize naming
- add source-of-truth hints

## Phase 1: Home as Command Center

- redesign Home
- separate onboarding from daily operation
- elevate goal shortcuts

## Phase 2: Navigation Simplification

- move to job-based top-level navigation
- remove duplicate peer destinations

## Phase 3: Canonical Workflow Definition

- define source of truth per domain
- define stage models
- define artifact system

## Phase 4: Lead Workflow Consolidation

- create Lead Engine
- remove repaste behavior
- unify outreach execution

## Phase 5: Conversion Consolidation

- connect CRO to experiments
- create experiment objects and lifecycle

## Phase 6: Customer Lifecycle Definition

- connect Customer View, Lifecycle Journeys, and Retention

## Phase 7: Paid Media Clarification

- clarify Paid Ads vs Budget Optimization vs Performance

## Phase 8: Content Clarification

- split strategy, quick creation, and pipeline publishing

## Phase 9: Launch Workflow Upgrade

- turn Launch Plan into a true execution workspace

## Phase 10: Library System

- persistent artifact storage and reuse

## What Pain Points This Plan Solves

This redesign directly solves:

- “I don’t know where to start”
- “These modules sound too similar”
- “I have to paste the same data again”
- “I got output, but I don’t know what to do next”
- “I’m not sure what is real vs simulated”
- “I don’t know which screen owns this job”
- “The product feels powerful but mentally heavy”

## Final Product Definition

The future Marqq should be explainable in one sentence:

`Marqq helps you understand what matters, choose the right growth action, execute it with AI support, and always know what to do next.`

That is the correct UX bar for an agentic product.

## Companion Docs

For deeper detail, see:

- [ux-audit.md](/Users/yogs87/Documents/New%20project/marqq/ux-audit.md)
- [ux-redesign-strategy.md](/Users/yogs87/Documents/New%20project/marqq/ux-redesign-strategy.md)
- [ux-wireframe-spec.md](/Users/yogs87/Documents/New%20project/marqq/docs/ux/ux-wireframe-spec.md)
- [ux-roadmap.md](/Users/yogs87/Documents/New%20project/marqq/docs/ux/ux-roadmap.md)
- [ux-ia-sitemap.md](/Users/yogs87/Documents/New%20project/marqq/docs/ux/ux-ia-sitemap.md)
- [ux-module-decision-matrix.md](/Users/yogs87/Documents/New%20project/marqq/docs/ux/ux-module-decision-matrix.md)
