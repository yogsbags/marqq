# Marqq Consolidated IA Sitemap

## Purpose

This is the proposed future information architecture for Marqq after module consolidation.

It is designed to:

- reduce top-level choice overload
- organize the product by user jobs
- create one canonical place for each major workflow
- make downstream actions predictable

## Top-Level Navigation

```text
Home
Setup
Plan
Execute
Measure
Customers
Library
```

## 1. Home

```text
Home
├── Recommended Next Step
├── Priority Stack
├── Active Workflows
├── Goal Shortcuts
└── Recent Outcomes
```

## 2. Setup

```text
Setup
├── Workspace
├── Integrations
├── Company Context
├── Brand & Voice
├── Offers & ICP
└── Team & Permissions
```

## 3. Plan

```text
Plan
├── Market Intelligence
├── Audience
├── Positioning
├── Offer
└── Launch Plan
```

### Plan Flow

```text
Market Intelligence
  -> Audience
  -> Positioning
  -> Offer
  -> Launch Plan
```

## 4. Execute

```text
Execute
├── Lead Engine
│   ├── Target
│   ├── Fetch
│   ├── Enrich
│   ├── Score
│   ├── Route
│   ├── Outreach
│   └── Monitor
├── Paid Ads
│   ├── Analyze
│   ├── Build
│   └── Optimize
├── Content Studio
│   ├── Quick Draft
│   ├── Campaign Asset
│   └── Publishing Pipeline
├── Voice Campaigns
│   ├── Contacts
│   ├── Script
│   ├── Configure
│   ├── Test
│   ├── Launch
│   └── Monitor
└── Referral Programs
    ├── Strategy
    ├── Rewards
    ├── Copy
    ├── Launch
    └── Performance
```

## 5. Measure

```text
Measure
├── Performance
├── Budget Optimization
├── Conversion
│   ├── CRO
│   └── Experiments
└── Daily Brief
```

### Conversion Flow

```text
CRO
  -> Hypothesis
  -> Experiment
  -> Readout
  -> Winner / Rollout
```

## 6. Customers

```text
Customers
├── Customer View
│   ├── Profiles
│   ├── Segments
│   ├── Insights
│   └── Risk / Opportunity Cohorts
├── Lifecycle Journeys
│   ├── Onboarding
│   ├── Nurture
│   ├── Expansion
│   └── Re-engagement
└── Retention
    ├── At-Risk Cohorts
    ├── Churn Reasons
    ├── Save Offers
    ├── Win-Back
    └── Monitoring
```

### Customer Flow

```text
Customer View
  -> Lifecycle Journeys
  -> Retention
```

## 7. Library

```text
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

## Canonical Cross-Workflow Handoffs

```text
Audience -> Positioning -> Offer -> Launch Plan

Customer View -> Lifecycle Journeys -> Retention

Lead Engine -> Outreach -> Performance

Performance -> Budget Optimization -> Paid Ads

CRO -> Experiments -> Performance

Content Strategy -> Content Studio / Publishing Pipeline
```

## What Leaves Top-Level Navigation

These should no longer be top-level peer destinations:

- Lead Outreach
- A/B Tests
- Channel Health
- User Engagement
- Churn Prevention
- Messaging & Copy
- Marketing Audit

They should either become subflows, supporting tools, or summary layers.

## UX Principle Behind the Sitemap

The user should move through the product like this:

```text
Understand
  -> Decide
  -> Execute
  -> Measure
  -> Improve
```

The sitemap should reinforce that progression everywhere.
