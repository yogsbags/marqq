# UX Audit

## Settings

### Findings

1. High: workspace switching can show and save the wrong “AI Team Context.” In [GeneralTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/GeneralTab.tsx#L27) the fetch effect depends only on `user?.id`, but it reads `activeWorkspace?.id` and posts with `workspaceId` on save at [GeneralTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/GeneralTab.tsx#L66). If a user switches workspaces, the form can keep stale values from the prior workspace and then overwrite the newly active workspace with the wrong context.

2. High: much of Settings presents as real controls but has no behavior, which is a trust-breaking UX pattern. The profile save button has no handler at [GeneralTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/GeneralTab.tsx#L118), notification toggles are uncontrolled-only at [GeneralTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/GeneralTab.tsx#L173), security actions are inert at [GeneralTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/GeneralTab.tsx#L203), data-management buttons are inert at [GeneralTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/GeneralTab.tsx#L343), and billing is a placeholder with an active-looking CTA at [BillingTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/BillingTab.tsx#L11). Users will assume these settings are saved or available when they are not.

3. High: onboarding step 2 breaks the workspace mental model. The checklist checks integrations by `userId` at [GettingStartedChecklist.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/dashboard/GettingStartedChecklist.tsx#L136), while the Accounts tab loads and connects integrations by active workspace `companyId` at [AccountsTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/AccountsTab.tsx#L139) and [AccountsTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/AccountsTab.tsx#L186). A connection in one workspace can therefore make another workspace look ready, and the user still has to click “Mark done” manually at [GettingStartedChecklist.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/dashboard/GettingStartedChecklist.tsx#L388) instead of the system recognizing completion.

4. High: the member invite flow claims success even though no email is sent. The UI toasts “Invite sent” at [MembersTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/MembersTab.tsx#L45), but the backend route explicitly has `TODO: send invite email` and only logs the token at [backend-server.js](/Users/yogs87/Documents/New%20project/marqq/platform/content-engine/backend-server.js#L7593). From a UX standpoint this is a false-success state.

5. Medium: the Accounts tab has a dead-end empty state. If loading fails or the backend returns no connectors, users only see “No integrations available” at [AccountsTab.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/settings/tabs/AccountsTab.tsx#L247), with no retry, explanation, or fallback catalog, even though onboarding sends them here as a required setup step.

### Open Questions

- Should Settings only show shipped capabilities, with placeholders moved behind “Coming soon” treatment?
- Is the intended model truly workspace-scoped for integrations and agent context everywhere? The current UX suggests yes, but the checklist logic still behaves partly account-scoped.

### Summary

The main UX problem is not visual polish; it is trust and state integrity. Settings currently mixes real controls with placeholders, and the workspace/onboarding logic is inconsistent enough that users can believe the wrong workspace is configured.

## Help & Support

### Findings

1. High: the Help & Support screen has almost no working support actions, so it looks actionable without actually helping users complete a task. The search field has no state or handler at [HelpPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/help/HelpPanel.tsx#L74), quick-action buttons have no links or click behavior at [HelpPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/help/HelpPanel.tsx#L96), article buttons are inert at [HelpPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/help/HelpPanel.tsx#L163), and the contact form has no submit logic at [HelpPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/help/HelpPanel.tsx#L181). This is the main UX failure: the screen promises support but provides no usable resolution path.

2. High: the contact options are presented as live channels without any actual interaction affordance. Email support is plain text only at [HelpPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/help/HelpPanel.tsx#L124), the phone number is a hard-coded placeholder at [HelpPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/help/HelpPanel.tsx#L131), and “Live Chat” shows “Available 24/7” plus an “Online” badge at [HelpPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/help/HelpPanel.tsx#L138) but offers no way to open chat. That creates false confidence at the exact moment a user needs trust.

3. Medium: the product’s help model is fragmented and inconsistent. The dedicated Help screen is static content in [HelpPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/help/HelpPanel.tsx#L20), while `/help` in chat returns a separate slash-command reference in [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L675) and [ChatPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatPanel.tsx#L589). A user entering “Help & Support” from the sidebar at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L175) would reasonably expect the same operational help they can get in chat, but the screen does not expose that pathway.

4. Medium: the IA is too generic for a product with many specific modules and workflows. The help topics stop at four broad buckets in [HelpPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/help/HelpPanel.tsx#L21), which omits many major product areas shown elsewhere in the navigation. Users troubleshooting Budget Optimization, Company Intelligence, onboarding, workspaces, agents, or integrations have no obvious entry point, so topic recognition is weak.

5. Medium: the “Send us a Message” form lacks basic UX signals needed for support intake. There is no expectation-setting for response time, no confirmation state, no required-field guidance, no attachment path, and no indication whether the message includes workspace/module context. All inputs are standalone primitives with no validation or submission flow at [HelpPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/help/HelpPanel.tsx#L189). For support forms, ambiguity increases abandonment and duplicate outreach.

### Open Questions

- Is the intended primary support channel chat-first, email-first, or docs-first?
- Should Help & Support be a true support center, or should it redirect users into the chat assistant with structured support prompts?

### Summary

The main issue is not layout quality; it is that the screen is largely representational. From a UX standpoint, Help & Support should reduce user effort during a blocked moment, but this implementation mostly presents static affordances and placeholder channels.

## Home

### Findings

1. High: the Home screen mixes too many interaction models at once for a first-touch surface. In one view users are asked to understand onboarding checklist state, freeform AI chat, slash commands, `@agent` task routing, file upload, quick-action cards, and a separate GTM wizard entry at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L1094). For a new user this creates high cognitive load before they have a clear answer to “what should I do first?”

2. High: the trash/reset affordance is dangerously ambiguous relative to its consequences. The top bar shows a small trash icon with no label or confirmation at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L1118), but `handleDeleteConversation` does far more than delete chat: it removes the current conversation, clears onboarding checklist state, clears the workspace website URL, resets company-intel autorun, and effectively resets the home setup flow at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L510). That is a severe mismatch between signifier and outcome.

3. High: quick actions disappear after the first message, which removes key navigation help exactly when users may need it most. The four starter actions only render when `messages.length === 1` at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L1237). Once the user sends anything, the interface becomes command-driven and far less discoverable, even though the product has many modules and complex capabilities.

4. Medium: several navigation outcomes rely on internal module IDs and inconsistent naming, which weakens the mental model. For example, inferred shortcuts may route to `'social-media'` or `'company-intel'` at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L229), while explicit slash-command routing uses `'company-intelligence'`, `'ai-content'`, `'unified-customer-view'`, etc. at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L614). Users do not see IDs, but these inconsistencies usually surface as “why did this take me there?” moments.

5. Medium: the input model is powerful but under-explained. Users are expected to know they can use `/commands`, `@mentions`, attach files, or trigger guided workflows based on phrasing. The only inline help is the generic footer text at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L1405). There is no visible explanation of when to use chat versus quick actions versus module navigation versus agent assignment.

6. Medium: backend failure states leak implementation detail instead of user-centered recovery guidance. When agent execution fails, the home screen tells users the backend may be offline and references `npm run dev:backend` and `GROQ_API_KEY` at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L769). That is acceptable for internal tooling, but poor UX if this screen is meant for end users or non-technical operators.

### Open Questions

- Is Home primarily meant to be a chat workspace for internal/power users, or a guided launchpad for first-time marketers?
- Should onboarding and daily-use chat share the same surface, or should setup live in a more explicitly guided mode?

### Summary

The Home screen is feature-rich, but its main UX issue is mode overload. It tries to be setup wizard, assistant chat, command palette, and workflow launcher in a single surface, which makes both onboarding and ongoing use less clear than they should be.

## Company Intelligence End-to-End

### Findings

1. High: the end-to-end entry into Company Intelligence is fragmented and easy to misunderstand because there are multiple competing entry models. Users can arrive from the onboarding checklist auto-run, from Home goal flows, from slash commands, from the sidebar, or from deep links/hashes in `ci=` or `company-intel:` format across [GettingStartedChecklist.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/dashboard/GettingStartedChecklist.tsx#L178), [HomePanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/home/HomePanel.tsx#L13), [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L81), and [CompanyIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CompanyIntelligenceFlow.tsx#L41). That flexibility is powerful, but it weakens orientation because the module does not clearly tell users how they got here, what state is already prepared, or what the recommended next step is.

2. High: page navigation is too broad and flat for the size of the workflow. Company Intelligence exposes 18 pages in one button row at [pages.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages.ts#L20) and renders them as a single wrapping list of equal-weight buttons in [CompanyIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CompanyIntelligenceFlow.tsx#L485). For an end-to-end experience this creates strong information-architecture overload: users must choose among many similar-sounding destinations without a clear sequence, progress model, or distinction between foundational pages and downstream action pages.

3. High: the overview is missing the key bridge from “scan completed” to “what should I do next.” The overview shows company list, snapshot metrics, and scan progress in [OverviewPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/OverviewPage.tsx#L41), but it does not surface the recommended pages, even though `quickStartPages` are computed and passed in at [CompanyIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CompanyIntelligenceFlow.tsx#L531). That means the module knows which pages are most relevant for a guided goal, but the overview does not help users move through them.

4. High: the artifact pages optimize for raw output breadth over decision clarity. `GenericArtifactPage` renders every section of the artifact data structure as editable cards at [GenericArtifactPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/GenericArtifactPage.tsx#L823), including nested structures and arrays via generic field rendering at [GenericArtifactPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/GenericArtifactPage.tsx#L442). This is flexible, but from a UX perspective it reads like a JSON-to-UI dump with actions attached, rather than a curated analysis flow that helps a user understand “insight, implication, next action.”

5. Medium: editing and deletion are unusually powerful for analysis artifacts, but the interface does not communicate the consequences clearly enough. Generic artifact sections and items can be edited or deleted inline at [GenericArtifactPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/GenericArtifactPage.tsx#L869) and [GenericArtifactPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/GenericArtifactPage.tsx#L394), with persistence back to the saved artifact at [GenericArtifactPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/GenericArtifactPage.tsx#L590). That gives users control, but it also blurs the line between generated intelligence and user-edited truth, which can create trust and provenance problems later.

6. Medium: the module repeatedly uses internal-agent deployment as the action layer, but the UX framing assumes users understand taskboard/scheduling concepts already. Shared actions in [CompanyIntelActionButton.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/ui/CompanyIntelActionButton.tsx#L74) and specialized competitor monitoring in [CompetitorIntelligencePage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/CompetitorIntelligencePage.tsx#L113) are powerful, but many action labels like “Deploy,” “Create Playbook,” “Activate ICP,” or “Deploy & Schedule” do not explain enough about where the output will appear, what will run now versus later, and how the user should validate the result.

7. Medium: the overview metrics communicate confidence more strongly than they justify it. `CompanySnapshotCard` computes “Profile Completeness,” “Offer Clarity,” and “Market Readiness” from presence heuristics in [CompanySnapshotCard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/ui/CompanySnapshotCard.tsx#L58) and presents them as large scores at [CompanySnapshotCard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/ui/CompanySnapshotCard.tsx#L87). These are useful directional signals, but they can easily be interpreted as validated analysis quality rather than lightweight completeness proxies.

8. Medium: loading and generation states are informative but not always task-oriented. The module has background-generation status and “starting scan” placeholders in [CompanyIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CompanyIntelligenceFlow.tsx#L541) and [OverviewPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/OverviewPage.tsx#L99), but the messaging stays system-centric: “Veena is generating…” or “This screen will populate automatically.” What is missing is user guidance like which sections will be ready first, whether the user should wait or continue elsewhere, and what partial results are already safe to act on.

### Open Questions

- Should Company Intelligence behave like a guided strategic workflow with a defined sequence, or like a flexible intelligence workspace for advanced users?
- Should generated artifacts remain editable in place, or should user edits be separated into annotations/overrides so generated output keeps provenance?

### Summary

The module is strong on coverage and capability, but the end-to-end UX is too system-shaped. Users can ingest, scan, browse, edit, and deploy actions, but the product does not consistently guide them from company snapshot to prioritized decisions to confident execution.

## Marketing Blueprint

### Findings

1. High: “Marketing Blueprint” is presented as a distinct navigation area, but it is not a clearly differentiated workflow. In the sidebar it appears as its own submenu at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L84), yet it is still just a subset of Company Intelligence pages. That weakens orientation because users are not given a clear blueprint overview, progress model, or explicit sequence across Opportunities, Strategy, Positioning, Pricing, and Channel Strategy.

2. High: the blueprint pages use inconsistent interaction models, so the overall experience does not feel like one product flow. `MarketingStrategyPage` and `ChannelStrategyPage` are mostly read-only analysis views at [MarketingStrategyPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/MarketingStrategyPage.tsx#L72) and [ChannelStrategyPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/ChannelStrategyPage.tsx#L44), while `PositioningMessagingPage` and `PricingIntelligencePage` behave like editable workbenches with local autosave and manual generation controls at [PositioningMessagingPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/PositioningMessagingPage.tsx#L76) and [PricingIntelligencePage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/PricingIntelligencePage.tsx#L84). Users have to keep relearning whether a page is something to review, edit, regenerate, or operationalize.

3. High: at least two blueprint generation flows appear to be using hard-coded product context instead of the selected company, which breaks trust in the output. `PositioningMessagingPage` posts generation requests with `companyName: 'Marqq AI'`, `industry: 'B2B Marketing Technology'`, and a hard-coded audience at [PositioningMessagingPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/PositioningMessagingPage.tsx#L181). `PricingIntelligencePage` does the same for competitive matrix generation at [PricingIntelligencePage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/PricingIntelligencePage.tsx#L178). From a UX standpoint this is a severe credibility issue: users will assume the blueprint is company-specific.

4. Medium: the blueprint lacks a strong narrative bridge between strategy and execution. `OpportunitiesPage` does a better job than the other pages by offering concrete actions like `Run Now`, `Create Playbook`, and `Schedule` at [OpportunitiesPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/OpportunitiesPage.tsx#L85), but the rest of the blueprint largely stops at displaying artifacts. Users are not guided from Marketing Strategy to Positioning to Pricing to Channel Strategy as connected decisions.

5. Medium: GTM context handling is inconsistent across blueprint pages. `MarketingStrategyPage` conditionally shows the GTM banner only when `isFromGtm` is true at [MarketingStrategyPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/MarketingStrategyPage.tsx#L33), `ChannelStrategyPage` shows it whenever context exists at [ChannelStrategyPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/ChannelStrategyPage.tsx#L46), and `PositioningMessagingPage` reads the `company_intel_marketing_strategy` GTM context key rather than a positioning-specific one at [PositioningMessagingPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/PositioningMessagingPage.tsx#L42). That inconsistency makes the blueprint feel stitched together rather than intentionally sequenced.

6. Medium: the scorecards across pages look authoritative, but they are mostly heuristic completeness scores rather than validated quality measures. This pattern appears in Strategy at [MarketingStrategyPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/MarketingStrategyPage.tsx#L61), Opportunities at [OpportunitiesPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/OpportunitiesPage.tsx#L57), and Channel Strategy at [ChannelStrategyPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/ChannelStrategyPage.tsx#L33). The UX risk is overconfidence: users may read these as decision reliability signals rather than rough proxies.

### Open Questions

- Should Marketing Blueprint become a true orchestrated flow with an overview and recommended order, or remain a loose cluster of pages?
- Should all blueprint generation/editing pages use the same interaction model: review-only, editable, or review-plus-approve?

### Summary

The core issue is coherence. Marketing Blueprint has strong ingredients, but today it behaves more like a bundle of related pages than a unified planning workflow, and the hard-coded company context in some generators is the most serious credibility problem.

## Market Intelligence

### Findings

1. High: the module’s naming model is internally inconsistent, so users have to decode whether “Market Intelligence,” “Market Signals,” “Live Signals,” and “Industry Trends” are different things or the same thing in different states. The sidebar entry is `Market Intelligence` at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L115), the page title becomes `Market Signals` at [MarketSignalsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MarketSignalsFlow.tsx#L20), the first tab is `Live Signals` at [MarketSignalsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MarketSignalsFlow.tsx#L13), and the second tab is `Industry Trends` at [MarketSignalsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MarketSignalsFlow.tsx#L14). That creates a weak mental model before users even start.

2. High: the two tabs are built as two different products with no clear bridge between them. `Live Signals` is an agent-run workspace with prompts, chaining, and execution panels at [MarketSignalsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MarketSignalsFlow.tsx#L17) and [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L302), while `Industry Trends` is a simple fetch-and-read brief view at [IndustryIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/IndustryIntelligenceFlow.tsx#L68). The product knows the brief is “injected into every agent run” at [IndustryIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/IndustryIntelligenceFlow.tsx#L60), but the UI does not explain when a user should read trends first, refresh them, or just run the agents.

3. Medium: the `Add Market Signals` button inside the Market Intelligence workflow is misleading. In the agent shell, that button actually refreshes shared industry-intel context at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L280), but the label reads `Add Market Signals` or `Market Signals` at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L291). Since the user is already in the Market Signals module, this reads like duplicate navigation rather than “refresh the background market brief.”

4. Medium: the primary interaction favors raw prompt editing over guided analysis, which raises cognitive load. The Isha and especially Priya defaults are long, system-shaped prompts at [MarketSignalsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MarketSignalsFlow.tsx#L27) and [MarketSignalsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MarketSignalsFlow.tsx#L34), and users are asked to edit them directly in a large textarea at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L135). Once a run starts, that input collapses into a small read-only summary at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L141), so the system is both verbose before execution and opaque during review.

5. Medium: the Industry Trends tab is informative but not very actionable. It produces one `Industry Brief` card with source, query, timestamp, and a large block of prose at [IndustryIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/IndustryIntelligenceFlow.tsx#L92). There is no extraction of top signals, urgency, confidence, implications, or next actions, so users have to translate the brief into decisions themselves.

6. Medium: blocked states explain the problem but not the recovery path. Both surfaces require a workspace and show warning text when one is missing at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L267) and [IndustryIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/IndustryIntelligenceFlow.tsx#L64), but neither offers an inline CTA to switch workspaces or jump to the relevant settings flow.

### Summary

The main UX issue is coherence. Market Intelligence contains useful capabilities, but today it reads as overlapping labels plus two disconnected interaction modes: a power-user agent console and a static trend brief. Users are not clearly told what this module is for, which part to use first, or how the brief and live scans work together.

## Audience Profiles

### Findings

1. High: Audience Profiles is not a distinct product workflow; it is effectively a thin wrapper around one generic agent prompt. The entire module is just one `AgentModuleShell` with a single Isha config at [AudienceProfilesFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AudienceProfilesFlow.tsx#L5). There is no profile overview, no segment comparison UI, no saved audience model, and no module-specific artifact rendering, even though the dashboard promises `ICP cards` as the output at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L137).

2. High: the IA duplicates the ICP concept without clarifying which surface is canonical. Audience Profiles exists as its own top-level module, but Company Intelligence already has a more structured ICP experience with scorecards, cohorts, and activation actions at [IcpsPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/IcpsPage.tsx#L48). From the user’s perspective, it is unclear why they should use [AudienceProfilesFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AudienceProfilesFlow.tsx#L3) instead of the richer ICP page at [IcpsPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/IcpsPage.tsx#L61), or whether results between the two are shared at all.

3. Medium: the main interaction is raw prompt editing instead of guided audience definition. Users are dropped into a long default instruction at [AudienceProfilesFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AudienceProfilesFlow.tsx#L14) and asked to work in the generic textarea at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L135). For a module about audience strategy, that is a weak UX model: there are no structured fields for firmographics, buying triggers, exclusions, or known segments.

4. Medium: the shared shell introduces controls that make the screen feel like a generic agent console rather than an audience tool. Audience Profiles inherits the workspace badge, offer selector, and `Add Market Signals` button at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L261). Those may be technically useful, but the page does not explain how offer selection or refreshed market signals change the generated profiles, so the interaction model feels stitched together.

5. Medium: the output-to-next-step path is weak for this module. After Isha runs, the shared next actions for `isha` route users to Positioning, Messaging, and AI Content at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L345). There is no audience-specific follow-through like validate segments, compare cohorts, activate in lead targeting, or push into outreach, which makes Audience Profiles feel like a dead-end insight screen.

6. Medium: blocked states explain the dependency but do not help users recover. If no workspace is active, the module only shows “Select or create a workspace in Settings to run agents” at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L267), with no inline action to switch workspace or continue setup.

### Open Questions

- Is Audience Profiles intended to be the fast standalone ICP generator, with Company Intelligence as the deeper canonical workspace?
- Should this module persist profiles into the structured ICP artifact model so users are not creating separate audience definitions in parallel?

### Summary

The core UX issue is duplication without differentiation. Audience Profiles promises a dedicated ICP surface, but today it behaves like a generic single-agent prompt screen beside a much richer ICP experience elsewhere in the product.

## Positioning & GTM

### Findings

1. High: the module’s identity is inconsistent across surfaces, which weakens orientation before the user starts. The sidebar calls it `Positioning & GTM` at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L122), while the dashboard card calls it `Positioning & Strategy` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L143), and the first in-module tab is also titled `Positioning & Strategy` at [PositioningFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PositioningFlow.tsx#L9). For a planning surface, that naming drift makes it unclear whether this is a strategic brief, a GTM planner, or both.

2. High: Positioning & GTM is a shallow prompt console sitting next to a much richer GTM planning workflow elsewhere in the product. This module is just three `AgentModuleShell` tabs at [PositioningFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PositioningFlow.tsx#L58), while the Home GTM assistant runs a multi-step interview with persistence, question flow, and generated strategy output at [GtmStrategyAssistant.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/home/GtmStrategyAssistant.tsx#L157), and `GTMWizard` supports section review, approval, saving, and deployment at [GTMWizard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/gtm/GTMWizard.tsx#L315). Users are effectively given two different ways to create GTM strategy, with no explanation of which one is primary.

3. High: the three tabs do not behave like one connected workflow even though they imply a sequence. `Positioning`, `Action Plan`, and `Budget Split` are rendered as separate shells with separate module IDs at [PositioningFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PositioningFlow.tsx#L67). There is no visible carry-forward of the positioning output into the action plan, or the action plan into the budget split, so users must either trust hidden context or keep restating the same strategy inputs manually.

4. Medium: the interaction model relies on editing long prompts instead of collecting GTM inputs in a structured way. The first tab asks for a detailed 90-day strategy via one dense default query at [PositioningFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PositioningFlow.tsx#L16), and the shell exposes that directly in a generic textarea at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L135). That is flexible for power users, but weak UX for a planning module that should probably gather goals, audience, timeframe, channels, and budget in clearer scaffolding.

5. Medium: the tab taxonomy is too coarse for the actual planning work. `Action Plan` and `Budget Split` sound outcome-focused, but both are still just one-agent prompt surfaces at [PositioningFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PositioningFlow.tsx#L22) and [PositioningFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PositioningFlow.tsx#L37). There is no review layer, scenario comparison, approval step, or visibility into assumptions before execution, even though GTM planning is one of the highest-stakes workflows in the product.

6. Medium: the next-step model jumps out of GTM too early. After Neel runs, users are routed to Messaging, Landing Pages, and Sales Enablement at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L351). Those are valid downstream surfaces, but there is no strong prompt to validate the plan, refine the audience, or pressure-test budget assumptions first, which makes the flow feel eager to produce assets before the strategy is fully settled.

### Open Questions

- Should `Positioning & GTM` become the canonical planning workflow, with the Home GTM assistant folded into it?
- Or should this module become a lightweight “expert mode” surface while the interview-based GTM flow becomes the default?

### Summary

The main UX issue is workflow duplication without a clear primary path. Positioning & GTM sounds like a core planning module, but today it behaves more like a thin agent prompt layer beside a much more intentional GTM strategy builder elsewhere in the product.

## Offer Design

### Findings

1. High: Offer Design is not a real design workspace; it is a single generic audit prompt wrapped in the shared agent shell. The whole module is one `AgentModuleShell` config at [OfferDesignFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/OfferDesignFlow.tsx#L5), even though the product positions it as a distinct planning surface in navigation and dashboard metadata at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L123) and [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L152). There is no offer architecture UI, no package comparison, no pricing ladder view, and no structured artifact for users to refine.

2. High: the module’s scope is conceptually muddled because one prompt is expected to solve offer statement, friction diagnosis, pricing architecture, CTA rewriting, and blocker remediation all at once. That entire job is packed into the default query at [OfferDesignFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/OfferDesignFlow.tsx#L14). For users, this makes Offer Design feel less like a deliberate workflow and more like a catch-all audit bucket between positioning, pricing, and landing-page CRO.

3. Medium: the primary interaction is raw prompt editing instead of guided offer design. Users are dropped straight into a long instruction inside the generic textarea at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L135). There are no structured inputs for ICP, outcome, timeframe, offer tiers, proof points, objections, or CTA target, even though those are the actual variables that shape an offer.

4. Medium: the only domain-specific control is the shared offer selector, but it is under-explained and only partially integrated. The selector can focus the run on one product or service at [OfferSelector.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/OfferSelector.tsx#L83), and if no offers exist it tells users to run Setup first at [OfferSelector.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/OfferSelector.tsx#L152). That is useful, but the page does not explain how changing the selected offer affects Tara’s audit, or whether the resulting recommendations are saved back to any canonical offer model.

5. Medium: Offer Design overlaps heavily with nearby modules without clarifying boundaries. Pricing architecture is part of this module’s prompt at [OfferDesignFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/OfferDesignFlow.tsx#L15), but Pricing Intelligence exists elsewhere in Company Intelligence, and landing-page offer clarity is also handled in `LandingPagesFlow` using the same `offer_friction_review` task type at [LandingPagesFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LandingPagesFlow.tsx#L13). Users are likely to wonder which screen they should use for offer problems versus pricing problems versus page-conversion problems.

6. Medium: the downstream path is weakly defined. There is no Tara-specific next-action model in the shared next-action map near [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L350), so the module lacks a strong guided handoff into pricing, messaging, landing pages, or experiments after the audit is generated. That makes the output feel advisory rather than operational.

### Open Questions

- Should Offer Design be the canonical place to shape the offer itself, with pricing and landing pages consuming that output downstream?
- Or is it meant to be a lightweight CRO audit, in which case the current “Offer Design” label is too broad?

### Summary

The core UX issue is that Offer Design promises a focused strategic tool but currently behaves like a single broad audit prompt. It needs either a narrower promise or a more structured workflow that actually helps users construct and iterate offers.

## Messaging & Copy

### Findings

1. High: Messaging & Copy is not a real copy workspace; it is a single generic review prompt in the shared agent shell. The entire module is one `AgentModuleShell` with one Sam config at [MessagingFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MessagingFlow.tsx#L5), while the dashboard frames it as a distinct output surface at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L162). There is no message hierarchy, no channel matrix, no variant comparison, and no structured copy artifact users can refine.

2. High: the product duplicates messaging work across multiple surfaces without clarifying which one is canonical. This module offers a generic copy audit at [MessagingFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MessagingFlow.tsx#L14), but Company Intelligence already has a richer `Positioning & Messaging` workspace with value proposition, messaging pillars, differentiators, and editable voice elements at [PositioningMessagingPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/PositioningMessagingPage.tsx#L350). Users are left to infer whether Messaging & Copy is meant for refinement after strategy, or whether it is a separate source of truth.

3. Medium: the interaction model relies on raw prompt editing instead of guided copy decisions. Users are dropped into a long audit instruction at [MessagingFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MessagingFlow.tsx#L15) inside the generic textarea at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L135). There are no structured inputs for audience, channel, stage, tone, proof points, or existing copy, even though those are the variables that determine whether messaging guidance is actually usable.

4. Medium: the scope of the module is too broad and underspecified. The description promises `outbound copy`, `nurture language`, and `campaign messaging` together at [MessagingFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MessagingFlow.tsx#L8), but other modules already own email sequences, landing pages, ad copy, launch copy, and referral copy. That makes Messaging & Copy feel like a generic rewrite layer rather than a clearly bounded workflow.

5. Medium: the downstream path pushes users into production surfaces before clarifying whether the messaging system itself is complete. After Sam runs, the next actions go to AI Content, Email Sequences, and Landing Pages at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L356). Those are sensible outputs, but there is no strong step for consolidating approved messaging, validating consistency across channels, or syncing changes back into the richer positioning/messaging source.

6. Medium: nearby modules overlap heavily with this one, which weakens confidence in where to do copy work. `LandingPagesFlow` uses Sam for full landing-page copy at [LandingPagesFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LandingPagesFlow.tsx#L20), `PaidAdsFlow` has its own ad-copy tab at [PaidAdsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PaidAdsFlow.tsx#L718), and CRO modules also generate rewrites. Without clearer boundaries, users can easily end up rewriting the same messaging in multiple places.

### Open Questions

- Should Messaging & Copy be the canonical cross-channel message system, with execution modules consuming approved copy from it?
- Or should it become a lighter “copy QA” layer, with structured messaging ownership staying in Positioning & Messaging?

### Summary

The main UX issue is overlap without hierarchy. Messaging & Copy promises a core communication layer, but today it behaves like a thin generic rewrite screen beside richer, more structured messaging surfaces elsewhere in the product.

## Launch Strategy

### Findings

1. High: Launch Strategy promises an end-to-end launch workflow, but the actual UX is still just two generic agent cards. The module description says it will plan GTM phases, channel sequencing, messaging hierarchy, success metrics, and launch-ready copy “in one flow” at [LaunchStrategyFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LaunchStrategyFlow.tsx#L8), and the dashboard reinforces that promise with `GTM plan + launch copy` across `Pre · Launch · Post` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L287). In practice, the experience is only a two-agent `AgentModuleShell` at [LaunchStrategyFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LaunchStrategyFlow.tsx#L5), with no launch calendar, milestone view, approval flow, or channel plan UI.

2. High: there is another richer GTM planning flow elsewhere, so Launch Strategy does not feel like the canonical place to plan a launch. The Home GTM assistant starts with a conversational intake and asks a series of follow-up questions before building strategy at [GtmStrategyAssistant.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/home/GtmStrategyAssistant.tsx#L157). Compared with that, Launch Strategy drops the user into two prompt boxes, which creates the same ambiguity seen in Positioning & GTM: users are given multiple strategy-building paths without guidance on which one to trust.

3. Medium: the two-step chain is technically connected, but the handoff is still too opaque for a high-stakes launch workflow. Sam receives Neel’s output through the shared “Context injected” mechanism at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L99), but users do not get a clear review checkpoint between “plan the launch” and “generate the copy.” That means launch copy can be produced from a strategy draft that has not been explicitly validated.

4. Medium: the launch plan input is under-scaffolded. Neel’s prompt asks for pre-launch, launch day, post-launch, channels, messaging, timing, and metrics at [LaunchStrategyFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LaunchStrategyFlow.tsx#L15), but the only structured help is a simple placeholder asking what is launching, who the audience is, and the launch date at [LaunchStrategyFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LaunchStrategyFlow.tsx#L16). Important launch inputs like objective, owned assets, dependencies, approval constraints, and budget are not collected in a guided way.

5. Medium: the output model jumps quickly from strategy to copy without a clear operational layer. After Neel runs, the shared next actions route users to Messaging, Landing Pages, and Sales Enablement at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L351), and after Sam runs, they route to AI Content, Email Sequences, and Landing Pages at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L356). There is no explicit launch-specific handoff into sequencing, approvals, scheduling, or measurement, which makes the module feel more like “strategy plus copy generation” than actual launch orchestration.

6. Medium: the module collapses multiple launch types into one generic pattern. The prompt treats `product / feature / campaign` launch as interchangeable at [LaunchStrategyFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LaunchStrategyFlow.tsx#L15), but those are meaningfully different workflows with different assets, stakeholders, and success metrics. The UX does not help users tailor the plan type before the agent run.

### Open Questions

- Should Launch Strategy become a true launch workspace with phases, checklisting, and sequencing, rather than a two-agent generation flow?
- Should product launch, feature launch, and campaign launch be separate entry modes with different guided inputs?

### Summary

The main UX issue is promise versus structure. Launch Strategy is positioned like a coordinated launch planning surface, but today it behaves more like a chained strategy prompt plus copy prompt, without enough workflow scaffolding to support real launch execution.

## Revenue Ops

### Findings

1. High: Revenue Ops is positioned like a serious RevOps workflow, but the actual experience is still just a two-agent generic shell. The module promises lead lifecycle mapping, scoring thresholds, SLAs, handoffs, and pipeline health at [RevenueOpsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/RevenueOpsFlow.tsx#L8), and the dashboard frames it as covering `Scoring · SLAs · Forecast` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L297). In practice, it is only two `AgentModuleShell` cards at [RevenueOpsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/RevenueOpsFlow.tsx#L5), with no funnel model, stage editor, SLA matrix, forecast board, or pipeline view.

2. High: the module combines system design and live pipeline review in one surface without a clear bridge between them. Dev is asked to define lifecycle stages, scoring, and handoff rules at [RevenueOpsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/RevenueOpsFlow.tsx#L15), while Arjun is asked to review coverage, forecast risk, and at-risk deals at [RevenueOpsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/RevenueOpsFlow.tsx#L23). Those are related but different jobs, and the UX does not tell users whether they should design the system first, review the pipeline first, or how one output should update the other.

3. Medium: the primary interaction model is still raw prompt editing instead of RevOps configuration. Users are expected to enter lifecycle logic and pipeline context through generic textareas at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L134). There are no structured fields for stages, fit signals, intent signals, routing rules, quotas, conversion assumptions, or current pipeline numbers, even though RevOps work depends on that structure.

4. Medium: the two-agent flow lacks a meaningful operational artifact. The module promises outputs like lifecycle definitions and pipeline review, but it does not render a stage map, SLA table, scoring rubric, or prioritized deal board. Because `RevenueOpsFlow` only passes agent configs into the shared shell at [RevenueOpsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/RevenueOpsFlow.tsx#L5), the result is a text-first experience rather than a usable RevOps system surface.

5. Medium: shared controls make the module feel generic instead of RevOps-specific. Revenue Ops inherits the workspace badge, offer selector, and market-signals button from the common shell at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L261). Those may be technically reusable, but the page does not explain why offer-level filtering or refreshed market signals meaningfully affect lifecycle design or pipeline review, so the screen feels assembled from generic agent parts.

6. Medium: the downstream path is weak and partly misaligned with RevOps outcomes. Dev’s next actions route to Budget Optimization, CRO, and Channel Health at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L399), and Arjun’s route to Budget Optimization, Performance, and CRO at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L388). Those are valid adjacent modules, but there is no strong handoff into lead routing, outreach sequencing, CRM operations, or sales process adoption, which are the more direct outcomes of RevOps work.

### Open Questions

- Should Revenue Ops be primarily a system-design tool for lifecycle and handoff rules, or a pipeline-triage tool for weekly revenue review?
- Should this module generate structured artifacts that downstream lead and sales modules can consume, instead of only text outputs?

### Summary

The main UX issue is that Revenue Ops promises operational rigor but delivers a generic agent surface. It combines two important RevOps jobs in one module without enough structure, visual modeling, or workflow guidance to make the outputs feel actionable.

## AI Content

### Findings

1. High: AI Content is positioned like a production workspace, but the actual interaction is mostly a lightweight prompt switcher. The dashboard sells `AI Content Generation` with metrics like `1.2K` items created and `120hrs` saved at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L72), yet the module itself is just a content-type toggle feeding one generic `AgentModuleShell` at [AIContentFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIContentFlow.tsx#L67). There is no production queue, asset library, review state, publishing workflow, or campaign grouping.

2. High: the product has at least three overlapping content surfaces without a clear hierarchy. `AIContentFlow` is a lightweight multimodal generator at [AIContentFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIContentFlow.tsx#L6), Company Intelligence has a richer `ContentStrategyPage` with pillars, formats, distribution rules, and “Generate Briefs” actions at [ContentStrategyPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/ContentStrategyPage.tsx#L51), and `EnhancedBulkGenerator` is a much deeper staged content pipeline with research, validation, and publication at [EnhancedBulkGenerator.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EnhancedBulkGenerator.tsx#L51). Users are not told which surface is for quick asset generation, which is for strategy, and which is for scaled editorial operations.

3. Medium: the content-type selector is simple, but it collapses very different workflows into one uniform interaction model. Social posts, images, faceless videos, avatar videos, and email newsletters are all treated as the same pattern in [AIContentFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIContentFlow.tsx#L12). That keeps the UI tidy, but it under-serves the user because each format has different requirements, review needs, and outputs.

4. Medium: the main UX remains raw prompt entry rather than guided content creation. Every mode ultimately drops the user into the same generic textarea in [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L134), with only placeholder examples changing per content type at [AIContentFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIContentFlow.tsx#L18). There are no structured fields for audience, platform, objective, CTA, brand voice, dimensions, or asset constraints, which are especially important for multimodal content work.

5. Medium: the module’s action flow is asset-first rather than strategy-first, even though the product already has a content strategy layer. Riya’s outputs route users onward to SEO / LLMO, Paid Ads, and Email Sequences at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L361), but there is no strong prompt back to content strategy, editorial governance, or campaign grouping. That makes it easy to generate content fragments without a clear plan tying them together.

6. Medium: the module lacks visible distinctions between “quick draft” and “ready to publish.” The descriptions promise things like “ready to publish” posts, brand-consistent images, and HTML newsletters at [AIContentFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIContentFlow.tsx#L55), but the UI does not provide any review, approval, metadata, or publishing handoff layer. The result is a credibility gap between the promise of production-ready assets and the lightweight generation surface.

### Open Questions

- Should AI Content be explicitly the quick-creation surface, with strategy and scaled publication handled elsewhere?
- Should the product unify AI Content and Enhanced Bulk Generator under one clearer “quick create vs pipeline” content model?

### Summary

The main UX issue is hierarchy. AI Content is useful as a fast asset generator, but today it is framed too broadly relative to the richer strategy and automation content systems elsewhere in the product.

## Email Sequences

### Findings

1. High: Email Sequences is presented like a complete lifecycle email workspace, but the actual UX is still just two generic agent cards. The module promises sequences for onboarding, nurture, and outreach at [EmailSequenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EmailSequenceFlow.tsx#L8), and the dashboard reinforces `Nurture · Cold · Onboarding` plus `Full sequence` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L225). In practice, the module is only a two-agent `AgentModuleShell` at [EmailSequenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EmailSequenceFlow.tsx#L5), with no sequence map, cadence builder, audience selector, or send/readiness workflow.

2. High: the module mixes two different email jobs without clearly distinguishing them. Sam is used for nurture/onboarding-style sequence writing at [EmailSequenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EmailSequenceFlow.tsx#L11), while Maya is used for cold outreach sequence writing at [EmailSequenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EmailSequenceFlow.tsx#L18). Those are meaningfully different workflows with different goals, personalization depth, and compliance expectations, but the UI presents them as equal cards in the same screen with no guidance on when to use which.

3. Medium: the interaction model is prompt-first instead of sequence-first. Users are dropped into long default prompts inside generic textareas at [EmailSequenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EmailSequenceFlow.tsx#L14) and [EmailSequenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EmailSequenceFlow.tsx#L21), rendered through the shared shell at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L134). There are no structured controls for audience, trigger, cadence, email count, personalization tokens, brand voice, or CTA type, even though those are the core design variables of an email sequence.

4. Medium: the product already has overlapping email-generation surfaces, which weakens this module’s boundaries. AI Content can generate newsletter-style emails at [AIContentFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIContentFlow.tsx#L46), Launch Strategy includes launch emails at [LaunchStrategyFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LaunchStrategyFlow.tsx#L24), CRO includes onboarding and upgrade emails at [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L69), and churn/prevention modules include win-back sequences. Without clearer boundaries, users can end up generating email copy in several places with no clear source of truth.

5. Medium: the downstream path is partly misaligned with how email work is actually operationalized. Priya’s next actions route to Lead Intelligence, CRO, and Paid Ads at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L377), and Maya’s route to Lead Outreach, Email Sequences, and Sales Enablement at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L383). Those may be useful adjacencies, but the module lacks a stronger handoff into audience selection, segmentation, deliverability, approval, or actual campaign execution.

6. Medium: the UX does not distinguish “copy drafted” from “sequence ready.” The module promises full sequences, but there is no review state, no sequence visualization, no send logic, and no performance or testing setup. As implemented, the output is closer to text generation than to an email-program workflow.

### Open Questions

- Should Email Sequences be the canonical place for all email lifecycle work, with other modules delegating here instead of generating email assets themselves?
- Or should it be split into separate entry modes for nurture/onboarding versus cold outbound, since those are different user tasks?

### Summary

The main UX issue is scope without structure. Email Sequences promises a full-funnel email workflow, but today it behaves like two adjacent prompt cards for different types of email writing, without enough scaffolding to feel like a true sequence builder.

## Social Calendar

### Findings

1. High: the top-level Social Calendar module and the Company Intelligence Social Calendar page are two different products with the same name. The top-level module is a thin single-agent shell at [SocialMediaFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SocialMediaFlow.tsx#L79), while Company Intelligence has a more structured calendar artifact with filters, scorecards, export, and summary at [SocialCalendarPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SocialCalendarPage.tsx#L106). Users are not told which surface is the canonical place to build, review, or manage a social calendar.

2. High: the top-level Social Calendar module promises a `30-day calendar` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L176), but the actual prompt asks for a `2-week social content calendar` bundled together with retention and nurture-loop analysis at [SocialMediaFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SocialMediaFlow.tsx#L90). That is a direct promise mismatch: the product framing suggests a focused content-planning tool, while the implementation behaves like a generic lifecycle review plus short-horizon content suggestion.

3. Medium: the module’s scope is conceptually muddled because it mixes lifecycle ops, engagement analysis, and content planning in one agent prompt. Kiran is labeled `Lifecycle & Social` at [SocialMediaFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SocialMediaFlow.tsx#L88), and the query asks for retention signals, social trends, nurture performance, touchpoint adjustments, and a calendar at [SocialMediaFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SocialMediaFlow.tsx#L90). For users, that weakens the mental model of what Social Calendar is actually for.

4. Medium: the top-level interaction is still just a prompt box, not a calendar-building workflow. Because the module is only an `AgentModuleShell`, users work through the shared textarea/run pattern rather than through structured controls for channels, cadence, weeks, themes, approval state, or post ownership. The richer artifact page in Company Intelligence shows what a more usable calendar representation looks like at [SocialCalendarPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SocialCalendarPage.tsx#L117), which makes the thinness of the main module more obvious.

5. Medium: the Company Intelligence Social Calendar page is useful, but it still stops short of real calendar management. It provides filters, CSV export, and item cards at [SocialCalendarPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SocialCalendarPage.tsx#L124), but there is no scheduling UI, no drag/drop planning, no publish state, and even the quick search control is visibly disabled at [SocialCalendarPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SocialCalendarPage.tsx#L157). That makes the artifact readable, but not strongly operational.

6. Medium: the downstream path is narrow relative to what social planning usually requires. Kiran’s next actions go to AI Content, Landing Pages, and Performance at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L372). Those are adjacent surfaces, but there is no stronger handoff into asset production, review/approval, social publishing, or platform-specific scheduling, which are the more natural next steps for a social calendar.

### Open Questions

- Should Social Calendar be the canonical operational calendar, with Company Intelligence only feeding it strategic context?
- Or should the top-level module be renamed and narrowed if it is really a quick “social/lifecycle recommendations” agent rather than a calendar manager?

### Summary

The main UX issue is duplication plus promise mismatch. Social Calendar is represented as a dedicated planning surface, but the primary module behaves like a generic agent prompt while the richer calendar representation lives elsewhere in Company Intelligence.

## SEO/LLMO

### Findings

1. High: SEO/LLMO is framed as a full optimization workflow, but the named module is only a thin single-agent prompt surface. The dashboard promises `3.2K` keywords optimized, `Top 3` ranking, and `+67%` organic traffic at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L82), and chat routing describes a multi-step workflow with upload, analysis, keyword research, optimization, deployment, and monitoring at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L673). In reality, the actual module is just one `AgentModuleShell` with Maya at [SEOLLMOFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SEOLLMOFlow.tsx#L5), with no visible workflow stages, data sources, or monitoring layer.

2. High: there are two very different SEO/LLMO products in the codebase without a clear hierarchy. `SEOLLMOFlow` is a lightweight prompt surface for ad hoc SEO questions at [SEOLLMOFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SEOLLMOFlow.tsx#L7), while `EnhancedBulkGenerator` is a much deeper staged SEO/LLMO system with workflow control, stage approvals, and publication steps at [EnhancedBulkGenerator.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EnhancedBulkGenerator.tsx#L447). Users are not told when to use the quick SEO module versus the heavy SEO pipeline, even though the interaction models are completely different.

3. Medium: the module’s scope is broad but under-scaffolded. The description combines search visibility audits, content gap analysis, and answer-engine positioning at [SEOLLMOFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SEOLLMOFlow.tsx#L8), and the placeholder spans segment SEO audits, competitor gap analysis, content ideation, and homepage LLM visibility at [SEOLLMOFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SEOLLMOFlow.tsx#L15). That breadth is useful for power users, but without structured task modes it creates a “type anything” experience rather than a coherent SEO workflow.

4. Medium: the main interaction remains raw prompt entry rather than guided SEO analysis. Users work through the generic textarea/run pattern in [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L134), with no dedicated inputs for site, pages, competitor set, target segment, keywords, or LLM visibility goals. For an optimization surface, that means too much important setup context is implicit.

5. Medium: shared shell controls make the module feel generic rather than SEO-specific. SEO/LLMO inherits the workspace badge, offer selector, and `Add Market Signals` button at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L261). Some of that context may help, but the page does not explain how offer-level filtering or market-signal injection affects SEO and LLM visibility recommendations, so the UI reads more like a general agent console than a dedicated SEO tool.

6. Medium: the downstream path is partly sensible but still too lightweight for SEO operations. Maya routes users to Lead Outreach, Email Sequences, and Sales Enablement at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L383), while Kiran routes to AI Content, Landing Pages, and Performance at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L372). Those cover content production and measurement, but the module still lacks a clearer bridge into implementation, page updates, technical fixes, or ongoing search monitoring.

### Open Questions

- Should `SEO / LLMO` be explicitly positioned as the quick advisory layer, with `EnhancedBulkGenerator` as the execution pipeline?
- Should the module offer explicit modes such as `Audit`, `Keyword Gaps`, `Content Opportunities`, and `LLM Visibility` instead of a single open prompt?

### Summary

The main UX issue is hierarchy and expectation-setting. SEO/LLMO is currently presented like a full optimization system, but the user-facing module behaves more like an open-ended advisory prompt while the real workflow-like SEO engine lives elsewhere in the product.

## Lead Magnets

### Findings

1. High: Lead Magnets is positioned like a complete acquisition asset workflow, but the actual top-level UX is still just two generic agent cards. The dashboard promises `Magnet + opt-in CRO` across `Content · Distribution` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L308), yet the module itself is only a two-agent `AgentModuleShell` at [LeadMagnetsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadMagnetsFlow.tsx#L5). There is no asset builder, no opt-in page editor, no funnel visualization, and no handoff into form capture or delivery setup.

2. High: the product duplicates lead-magnet work across two different surfaces without clarifying which one is canonical. The top-level module is a thin agent flow at [LeadMagnetsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadMagnetsFlow.tsx#L5), while Company Intelligence has a richer `LeadMagnetsPage` that shows lead magnet ideas, landing-page copy, follow-up sequence, and readiness scores at [LeadMagnetsPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/LeadMagnetsPage.tsx#L43). Users are not told whether the top-level module generates new magnets while Company Intelligence stores the strategic source of truth, or whether they are parallel paths.

3. Medium: the two-step chain is useful but too implicit. Sam creates the lead magnet concept and Tara audits the opt-in page at [LeadMagnetsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadMagnetsFlow.tsx#L11), with handoff happening through the shared “Context injected” pattern in [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L99). That technically works, but the UX does not clearly stage the process as “concept first, then landing-page conversion review,” so the flow still feels like two adjacent prompt cards rather than one guided lead-magnet build.

4. Medium: the primary interaction model is prompt editing instead of lead-magnet design. Users are asked to define title, hook, outline, takeaways, and distribution plan through a generic textarea at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L134), based on the long default query at [LeadMagnetsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadMagnetsFlow.tsx#L14). There are no structured inputs for ICP, pain point, format, funnel stage, or offer type, even though those are the key choices in lead-magnet design.

5. Medium: the richer Company Intelligence artifact is informative, but it still lacks operational actions. `LeadMagnetsPage` surfaces the magnet concept, landing-page copy, and follow-up sequence at [LeadMagnetsPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/LeadMagnetsPage.tsx#L53), but unlike other Company Intelligence pages it does not expose direct deployment or task-creation actions. That makes the artifact readable, but not very actionable once users decide which magnet to pursue.

6. Medium: the downstream path is incomplete for an acquisition asset workflow. Tara’s next actions go to Budget Optimization, Positioning, and AI Content at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L394), but there is no stronger handoff into email follow-up, landing page publishing, form capture, or campaign distribution, which are the more natural next steps after a lead magnet is created and CRO-reviewed.

### Open Questions

- Should Lead Magnets be the canonical build-and-launch surface, with Company Intelligence only housing the strategic recommendations?
- Should the Company Intelligence lead-magnet artifact gain deployment actions so it can drive the same downstream workflows as other strategy pages?

### Summary

The main UX issue is duplication plus weak execution bridging. Lead Magnets has the beginnings of a sensible concept-to-opt-in flow, but today the top-level module is too thin and the richer artifact view does not carry users far enough into launch.

## Sales Enablement

### Findings

1. High: the top-level Sales Enablement module is a thin two-agent shell, while the richer and more credible sales-enablement workspace lives elsewhere in Company Intelligence. The top-level module is only an `AgentModuleShell` with Sam and Arjun at [SalesEnablementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SalesEnablementFlow.tsx#L5), but `SalesEnablementPage` provides structured battlecards, demo scripts, objection handlers, pricing guidance, scorecards, and kit export at [SalesEnablementPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SalesEnablementPage.tsx#L435). Users are not told which surface is the canonical place to build sales collateral versus review and operationalize it.

2. High: the top-level module bundles two different jobs without enough flow clarity. Sam creates collateral and battle cards at [SalesEnablementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SalesEnablementFlow.tsx#L11), while Arjun writes outreach sequences at [SalesEnablementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SalesEnablementFlow.tsx#L20). Those are related but distinct workflows, and the UI does not clarify whether the intended path is “create collateral first, then personalize outreach,” or whether they are separate entry points.

3. Medium: the richer Company Intelligence Sales Enablement page is substantially better, but it still feels like a toolkit of generators more than a coherent sales workflow. It has separate sections for battlecards, demo scripts, objection handlers, and pricing guidance at [SalesEnablementPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SalesEnablementPage.tsx#L465), [SalesEnablementPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SalesEnablementPage.tsx#L623), [SalesEnablementPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SalesEnablementPage.tsx#L692), and [SalesEnablementPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SalesEnablementPage.tsx#L788), but users are not strongly guided through a recommended order or shown how these assets connect in an actual sales motion.

4. Medium: the top-level interaction is still prompt-first instead of asset-first. In the main Sales Enablement module, users are dropped into generic textareas via the shared shell rather than into structured forms for buyer role, segment, competitor, objection themes, meeting type, or sales stage. That weakens usability because sales collateral is usually easier to build from structured inputs than from broad prompts.

5. Medium: the Sales Enablement page emphasizes generation and editing, but not adoption or distribution. Users can generate, edit, copy, remove, and download assets at [SalesEnablementPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SalesEnablementPage.tsx#L516), [SalesEnablementPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SalesEnablementPage.tsx#L665), and [SalesEnablementPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/SalesEnablementPage.tsx#L455), but there is no clear path to assign these assets to reps, attach them to deal stages, or connect them to live sales workflows.

6. Medium: downstream handoffs are only partially aligned with sales-enablement outcomes. Sam’s next actions go to AI Content, Email Sequences, and Landing Pages at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L356), and Maya’s include Sales Enablement at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L383), but there is no stronger bridge into CRM usage, outbound sequencing by rep/team, or deal support workflows after the assets are created.

### Open Questions

- Should Sales Enablement live primarily in the richer Company Intelligence page, with the top-level module reduced to a shortcut into that workflow?
- Should outreach sequences remain part of Sales Enablement, or move more clearly under Lead Outreach / Email Sequences so this module stays focused on collateral?

### Summary

The main UX issue is duplication plus weak workflow framing. Sales Enablement contains some of the product’s stronger structured asset-generation UI, but the top-level module is too thin and the overall system still does not clearly guide users from sales strategy to usable, adopted collateral.

## AI Video

### Findings

1. High: the product’s naming and promise for this module are internally inconsistent. The dashboard calls it `AI Video Bot & Digital Avatar` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L32), the sidebar shortens it to `AI Video` at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L138), and the rendered page title becomes `AI Video Bot` at [AIVideoBotFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIVideoBotFlow.tsx#L12). Meanwhile chat describes a larger workflow with avatar creation, deployment, and analytics, but the actual screen is mainly a video generator UI. That weakens the user’s understanding of what this module actually does.

2. High: the module promise and the implemented workflow do not match. Chat describes a six-step operational flow with content upload, digital avatar creation, script generation, production, deployment, and analytics at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L655), but `AIVideoBotFlow` simply renders a header plus `VideoGenFlow` at [AIVideoBotFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIVideoBotFlow.tsx#L7). Users are promised an end-to-end video-bot system, but they actually land in a production tool.

3. Medium: the module is more coherent as a video generator than as a “video bot,” but the UX does not make that repositioning explicit. `VideoGenFlow` is a reasonably structured creation UI with company selector, model selection, strategy selection, prompt refinement, media inputs, generation, and preview at [VideoGenFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/VideoGenFlow.tsx#L352). The problem is not that the tool is empty; it is that the surrounding framing still suggests autonomous campaign-like orchestration rather than handcrafted generation.

4. Medium: the workflow order is somewhat fragmented. Users can run a Riya script brief first at [VideoGenFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/VideoGenFlow.tsx#L354), but that sits beside the generation controls rather than clearly feeding them into a guided script-to-video sequence. The relationship between “brief,” “prompt,” “image/audio inputs,” and “final generation” is functional but not especially clear for non-technical users.

5. Medium: avatar-video and faceless-video creation are merged into one interface without enough mode-specific guidance. The screen supports multiple models and behaviors, including avatar and non-avatar flows, but the UX mainly exposes this through model/strategy selection and conditional controls at [VideoGenFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/VideoGenFlow.tsx#L371). Users who arrive expecting a “digital avatar” workflow are not clearly guided through avatar-specific setup, constraints, or expected outputs.

6. Medium: there is some real status handling for background renders, but the overall workflow still lacks operational follow-through. `AgentRunPanel` has a `VideoStatusCard` with polling and inline preview for generated videos at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L35), yet the module still does not surface stronger notions of asset library, publish destinations, campaign grouping, or performance tracking. That leaves the product halfway between a generation tool and a video-ops platform.

### Open Questions

- Should this module be repositioned explicitly as `AI Video Generation`, with “video bot” language removed unless the broader workflow is actually implemented?
- Should avatar creation become its own clearer subflow instead of being one option inside a broader generator?

### Summary

The main UX issue is expectation mismatch. The implemented screen is a real video-generation tool, but the product language around `AI Video Bot & Digital Avatar` suggests a broader autonomous workflow than users actually receive.

## Lead Outreach

### Findings

1. High: Lead Outreach promises a full execution workflow, but the actual module is only a single generic prompt card. The description says Arjun “fetches, scores, and enrolls leads in personalised outreach sequences” at [LeadOutreachFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadOutreachFlow.tsx#L9), but the implementation is just one `AgentModuleShell` agent with one prompt at [LeadOutreachFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadOutreachFlow.tsx#L5). There is no lead source selection, no scoring UI, no campaign setup, and no launch layer.

2. High: the product duplicates Lead Outreach inside Lead Intelligence, and the richer workflow is actually there. Lead Intelligence already includes `ICP Fetch`, `Enrich`, `Route`, `Outreach`, and `AI Agents` tabs at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L1229), while the `Outreach` tab supports channel selection, lead loading, campaign configuration, and launch actions at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L595). Users are not told why they should use the thin top-level Lead Outreach module instead of the more operational outreach flow already embedded in Lead Intelligence.

3. High: the module description is behaviorally inaccurate. The top-level Lead Outreach flow says Arjun will “fetch” and “score” leads at [LeadOutreachFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadOutreachFlow.tsx#L9), but its default query only asks him to find leads and write personalized messages at [LeadOutreachFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadOutreachFlow.tsx#L15). Actual scoring and routing logic live elsewhere, including the routing model and channel sequencing in [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L899).

4. Medium: Lead Outreach overlaps with two other outreach-copy surfaces without clear boundaries. `Email Sequences` already includes Maya writing cold outreach sequences at [EmailSequenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EmailSequenceFlow.tsx#L18), and `Sales Enablement` includes Arjun writing a 5-touch outreach sequence at [SalesEnablementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/SalesEnablementFlow.tsx#L20). That leaves users guessing whether Lead Outreach is for prospecting copy, campaign launch, or sales-sequence execution.

5. Medium: the primary interaction is raw prompt editing rather than outreach setup. The module inherits the generic textarea/run pattern from [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L134), but does not add structured inputs for target cohort, channel mix, personalization fields, sender identity, volume, or launch destination. By contrast, Lead Intelligence’s outreach tab already exposes campaign configuration and channel-specific launch controls at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L741).

6. Medium: the downstream path is weakly aligned with outreach execution. Because this module uses `arjun`, its next actions route to Budget Optimisation, Performance, and CRO at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L388). Those are not the most natural next steps after drafting lead outreach; users would more likely need lead qualification, launch, reply handling, or sales follow-through.

### Open Questions

- Should Lead Outreach remain a separate top-level module, or should it collapse into Lead Intelligence as the canonical place to fetch, route, and launch outbound campaigns?
- If it stays separate, should it become the true campaign-execution surface rather than a prompt-only drafting screen?

### Summary

The main UX issue is duplication with a weaker standalone experience. Lead Outreach is framed like an execution module, but the real operational outreach workflow already lives inside Lead Intelligence, while the top-level module is only a thin message-generation wrapper.

## Lead Intelligence

### Findings

1. High: Lead Intelligence promises a continuous end-to-end pipeline, but the actual flow breaks state between stages and makes users manually repaste data. `ICPFetchTab` keeps fetched leads in local tab state at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L229), while `RoutingTab` tells users to “Paste leads fetched from ICP tab” at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L1011), and `OutreachTab` separately asks them to “Paste JSON or CSV from the Fetch tab” at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L721). For a workflow with fetch, enrich, route, and outreach in one module, that handoff model is too manual.

2. High: the module over-promises relative to what is actually present in the UI. Chat frames Lead Intelligence as a six-step automated workflow including `Build Lookalike Audience` and `Monitor Results` at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L649), but the real module only exposes `ICP Fetch`, `Enrich`, `Route`, `Outreach`, and `AI Agents` tabs at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L1229). That creates an expectation gap before users even begin.

3. High: the Enrich tab advertises file upload, but the primary enrichment action ignores the uploaded file and only processes pasted text. The UI supports drag/drop and file selection at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L515), but `handleEnrich` reads only `pastedData` and errors if it is empty at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L457). That is a major UX trust issue because users can successfully “load” a file and still be unable to enrich anything.

4. Medium: Lead Intelligence overlaps heavily with the separate Lead Outreach module, which weakens information architecture. Lead Intelligence already contains a full `Outreach` tab with channel selection, config, and launch at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L595), while the sidebar also exposes a separate top-level `Lead Outreach` entry at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L144). Users are not told which surface is canonical for outbound execution.

5. Medium: the routing model is more sophisticated than the execution layer that follows it. Routing explains multichannel logic including WhatsApp, phone, and spam suppression at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L1027), and `CHANNEL_META` includes LinkedIn, Email, WhatsApp, Voicebot, and Phone at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L920). But direct launch buttons in the routing results only appear for LinkedIn and Email at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L1096). The system suggests broader orchestration than it can visibly execute from that screen.

6. Medium: the module is powerful but cognitively dense because it mixes database search, enrichment, routing logic, campaign launch, and agent assistance inside one flat tab set with little guidance on sequence. The tabs are peer-level at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L1229), and the `AI Agents` tab adds three more specialist runs for scoring, competitor context, and proposals at [LeadIntelligenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/LeadIntelligenceFlow.tsx#L825). For advanced users this is flexible; for most users it is unclear what the recommended path is and which tabs are optional versus required.

### Open Questions

- Should Lead Intelligence become the single canonical lead-to-outreach workflow, with Lead Outreach folded into it?
- Should fetched and enriched lead sets become persistent shared artifacts across tabs so users never need to repaste data?

### Summary

The main UX issue is workflow continuity. Lead Intelligence contains some of the product’s more operational lead tooling, but the experience still feels like several strong sub-tools stitched together rather than one coherent lead acquisition and activation flow.

## Paid Ads

### Findings

1. High: Paid Ads combines three different product modes in one flat tab bar without a clear hierarchy: live monitoring, campaign creation/optimization, and AI planning. The module places `Live Performance`, `Create Campaign`, `ROAS Optimizer`, `Campaign Strategy`, `Ad Copy`, and `Creative Brief` as peer tabs at [PaidAdsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PaidAdsFlow.tsx#L759). That is powerful, but it makes the module feel like three separate products stitched together rather than one coherent paid acquisition workflow.

2. High: platform coverage is inconsistent across the module, which creates a misleading mental model. `Live Performance` reads Meta and Google data at [PaidAdsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PaidAdsFlow.tsx#L101), the AI copy and creative tabs promise Meta, Google, and LinkedIn outputs at [PaidAdsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PaidAdsFlow.tsx#L718) and [PaidAdsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PaidAdsFlow.tsx#L735), but `Create Campaign` and `ROAS Optimizer` are explicitly Meta-only at [PaidAdsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PaidAdsFlow.tsx#L318) and [PaidAdsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PaidAdsFlow.tsx#L536). Users are not clearly told which capabilities are cross-platform and which only work for Meta.

3. Medium: Paid Ads overlaps heavily with both Budget Optimization and Company Intelligence Ads Intel without clear role boundaries. Budget Optimization already handles cross-channel spend analysis and recommendations at [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L170), while `AdsIntelPage` provides competitor ad intelligence, channel gaps, and recommended ad angles at [AdsIntelPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/AdsIntelPage.tsx#L67). Paid Ads also includes live performance and AI strategy/copy/creative generation, so users are left to infer where campaign planning should happen versus where optimization and competitor intelligence belong.

4. Medium: the Create Campaign flow is operationally useful, but too narrow to feel like a full paid-media build surface. It only supports a single Meta campaign with one ad set and one creative through a compact form at [PaidAdsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PaidAdsFlow.tsx#L261). There is no audience builder, placement control, bidding setup, conversion event selection, multiple creative variants, or review of the campaign structure before submission, which makes the “Create Campaign” tab feel more like a backend launcher than a marketer-facing workflow.

5. Medium: Live Performance shows campaign metrics, but it is thin as an analysis surface. The table exposes campaign-level spend, CTR, CPC, and ROAS at [PaidAdsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PaidAdsFlow.tsx#L178), but there is no drill-down by ad set or creative, no trend visualization, no anomaly detection, and no inline bridge from a weak campaign into draft fixes. For an execution module, the analysis layer is still mostly a read-only table.

6. Medium: the agent-based planning tabs are useful, but they still behave like generic prompt cards rather than integrated paid-media scaffolding. `Campaign Strategy`, `Ad Copy`, and `Creative Brief` are each one-agent `AgentModuleShell` experiences at [PaidAdsFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PaidAdsFlow.tsx#L811). That means strategic decisions, copy, and creative concepts are generated separately from the operational campaign builder instead of feeding directly into it, so the workflow continuity is weaker than it could be.

### Open Questions

- Should Paid Ads become the canonical execution workspace, with Budget Optimization and Ads Intel acting as supporting insight layers feeding into it?
- Should the module explicitly split into `Analyze`, `Build`, and `Optimize` modes so users understand the intended workflow order?

### Summary

The main UX issue is coherence, not lack of capability. Paid Ads is one of the more functional modules in the product, but it mixes analysis, campaign operations, and AI planning in a way that makes the overall workflow harder to understand than it should be.

## Referral Program

### Findings

1. High: Referral Program is positioned like a real growth loop, but the actual implementation is only two generic agent cards. The module promises to “design a referral loop that turns users into advocates” at [ReferralProgramFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ReferralProgramFlow.tsx#L8), and the dashboard frames the outcome as `Mechanics + full copy set` with a `K-factor > 1` target at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L336). In practice, it is just a two-agent `AgentModuleShell` at [ReferralProgramFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ReferralProgramFlow.tsx#L5), with no referral funnel, reward logic UI, invite-state management, or tracking layer.

2. High: the module does not distinguish referral growth from adjacent partner or retention motions, which weakens the mental model. Referral Program sits as a top-level execution module in the sidebar at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L147), while Company Intelligence has a richer `Partner Profiling` artifact with partner types, value exchange, and activation playbooks at [PartnerProfilingPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/PartnerProfilingPage.tsx#L16), and Churn Prevention uses a nearly identical two-agent pattern for retention interventions at [ChurnPreventionFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChurnPreventionFlow.tsx#L8). Users are not guided on whether referrals are meant to be customer invites, affiliate/partner channels, or loyalty-driven reactivation loops.

3. Medium: the main interaction is raw prompt editing rather than referral-program design. Tara’s brief asks for incentive structure, trigger moment, mechanics, viral coefficient target, and implementation steps all in one open prompt at [ReferralProgramFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ReferralProgramFlow.tsx#L15). There are no structured fields for referrer type, reward budget, eligibility rules, abuse controls, invite channel, conversion event, or payout logic, even though those are the core variables of referral design.

4. Medium: Sam’s copy surface is broad but not operationally connected. The module generates invite prompts, referral emails, landing-page copy, reward confirmation, and social share variations at [ReferralProgramFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ReferralProgramFlow.tsx#L23), but those outputs are not tied to any actual referral artifact, campaign state, or implementation flow. It reads more like a copy pack than a program workspace.

5. Medium: the downstream next-step model is generic rather than referral-specific. Tara’s next actions route to Budget Optimisation, Positioning, and AI Content at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L394), and Sam’s route to AI Content, Email Sequences, and Landing Pages at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L356). Those are adjacent tools, but there is no stronger bridge into referral activation, reward fulfillment, advocate segmentation, or program tracking.

6. Medium: the module’s success framing is ambitious, but there is no visible measurement or governance to support it. The dashboard target of `K-factor > 1` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L342) implies an instrumented viral loop, yet the module itself has no referral metrics, fraud safeguards, invite performance view, or reward economics model. That creates a credibility gap between the growth promise and the UI.

### Open Questions

- Should Referral Program be a true advocate-growth workspace with invite triggers, rewards, tracking, and abuse controls?
- Or should it be reframed more narrowly as a referral strategy and copy planner, with partner and execution ownership handled elsewhere?

### Summary

The main UX issue is specificity. Referral Program names a concrete growth system, but today it behaves like a high-level planning and copy prompt surface without enough structure to feel like a real referral program builder.

## Channel Health

### Findings

1. High: Channel Health is not actually a channel-health workspace; it is a single generic prompt card with a mislabeled job. The whole module is one `AgentModuleShell` with Zara at [ChannelHealthFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChannelHealthFlow.tsx#L5), while the dashboard frames it as a daily `Distribution mix` surface at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L182). There is no channel scorecard, no per-channel breakdown, no trend view, and no operational audit UI.

2. High: the default prompt does not match the module title. Instead of auditing channel performance, the prompt asks Zara to produce a “morning synthesis and priority brief” covering active agents, market signals, daily priorities, and channels to activate this week at [ChannelHealthFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChannelHealthFlow.tsx#L15). That reads more like an executive daily brief than a channel-health analysis tool.

3. High: Channel Health overlaps heavily with stronger existing analytics modules that already own adjacent jobs. `PerformanceScorecard` provides KPI analysis, scoring, benchmarking, and forecasts at [PerformanceScorecard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PerformanceScorecard.tsx#L104), while Budget Optimization already lets Dev diagnose KPI movement and Arjun recommend reallocations at [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L252). Users are not told why they should open Channel Health instead of either of those richer surfaces.

4. Medium: the module is too thin for the ambition implied by its name and placement. In the sidebar it sits beside execution modules like Paid Ads and Referral Program at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L146), which suggests an operational monitoring tool. But unlike those modules, it has no data source selection, no metrics, no channel comparison, and no audit framework beyond one text prompt.

5. Medium: Zara is a weak fit for the module’s implied purpose because the follow-through is content-oriented rather than performance-oriented. Zara’s next actions route to Social Calendar, Email Sequences, and SEO / LLMO at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L367). That makes Channel Health feel more like a channel activation ideation surface than a health diagnosis tool.

6. Medium: the daily-cadence framing lacks visible evidence, measurement, or recency signals. The dashboard labels the cadence as `Daily` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L187), but the module itself does not show when the brief was last generated, what data it used, or how “health” is being assessed. That reduces trust in the output and makes the title feel aspirational.

### Open Questions

- Should Channel Health become a real monitoring layer with per-channel scores, trend signals, and channel-specific actions?
- Or should it be renamed to something like `Daily Distribution Brief` if the intended output is a prioritization memo rather than a health audit?

### Summary

The main UX issue is semantic mismatch. Channel Health sounds like an analytics and monitoring tool, but the implemented experience behaves more like a generic daily strategy brief with no real health model behind it.

## AI Voice Bot

### Findings

1. High: AI Voice Bot is one of the richer modules in the product, but it still overstates how operational the end-to-end workflow is. Chat frames it as a six-step deployment flow with contact upload, script generation, configuration, test call, campaign launch, and monitoring at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L652), and the module mirrors that step model at [AIVoiceBotFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIVoiceBotFlow.tsx#L69). The problem is that several later-stage surfaces are mostly static UI or simulated progress rather than clearly connected production operations.

2. High: the workflow mixes real integrations and mock/demo states without making that distinction clear enough. `VoicebotSimulator` actually calls STT, dialogue, and TTS endpoints at [VoicebotSimulator.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/voicebot/VoicebotSimulator.tsx#L76), and `LiveKitVoiceSession` mints tokens and dispatches agents at [LiveKitVoiceSession.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/voicebot/LiveKitVoiceSession.tsx#L52). But the broader deployment flow still relies on simulated step progression in `deployVoiceBot()` at [AIVoiceBotFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIVoiceBotFlow.tsx#L135), which makes it hard for users to know what is truly live versus illustrative.

3. Medium: the module’s naming is slightly inconsistent, which weakens orientation. The dashboard calls it `AI Voice Bot Automation` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L22), the sidebar shortens it to `AI Voice Bot` at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L149), and the page header calls the experience `Voice Bot Workflow` at [AIVoiceBotFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIVoiceBotFlow.tsx#L316). The differences are not severe, but they do reinforce the sense that this is a prototype workflow rather than a tightly defined product surface.

4. Medium: the scripted setup experience is detailed, but much of it is not strongly interactive. The `Script` tab presents configuration controls and a polished sample script preview at [AIVoiceBotFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIVoiceBotFlow.tsx#L499), yet actions like `Customize Script` and `Preview Audio` in that area are not clearly tied to a real editable artifact at [AIVoiceBotFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIVoiceBotFlow.tsx#L618). That can make the workflow feel more like a storyboard than a build surface.

5. Medium: the campaign and monitoring tabs look production-like, but they appear to rely on static example data rather than actual campaign state. The campaign section includes settings, targets, schedule, and a `Launch Campaign` button at [AIVoiceBotFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIVoiceBotFlow.tsx#L879), while the monitor tab shows calls made, connect rate, meetings scheduled, and live activity at [AIVoiceBotFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIVoiceBotFlow.tsx#L983). Without clearer live-data indicators, this risks overstating system readiness.

6. Medium: the module’s strongest unique capability, realtime voice testing, is slightly buried inside a broader linear deployment narrative. The LiveKit preview and knowledge-base upload are nested deep in the `Voice` tab at [AIVoiceBotFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/AIVoiceBotFlow.tsx#L757), even though those are among the most credible parts of the implementation. Users may spend more time in visually polished but less-real surfaces before reaching the parts that are actually most valuable.

### Open Questions

- Should AI Voice Bot be repositioned more explicitly as a `build + simulate + realtime preview` product until full campaign orchestration is live?
- Should the module separate `production-ready` features from `demo/prototype` features more visibly so users know what they can trust operationally?

### Summary

The main UX issue is readiness signaling. AI Voice Bot is materially more implemented than many other modules, but the experience still blends real voice infrastructure with simulated campaign workflow in a way that makes product maturity hard to judge.

## Marketing Audit

### Findings

1. High: Marketing Audit is conceptually broad, but the implemented screen is still mostly a thin agent wrapper plus a small page checker. The main module is just `PageAnalysisPanel` plus a two-agent `AgentModuleShell` at [MarketingAuditFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MarketingAuditFlow.tsx#L135). That is not enough structure for a screen that promises a composite 6-dimension audit and a 30-60-90 day roadmap.

2. High: the “optional” page analysis creates a misleading mental model because it only audits one page on four technical/conversion dimensions, while the module promise is much broader. The page tool scores `SEO`, `CTA`, `Trust`, and `Tracking` for a single URL at [MarketingAuditFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MarketingAuditFlow.tsx#L101), but the agent copy promises scoring across `content, conversion, SEO, competitive, brand, and growth` at [MarketingAuditFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MarketingAuditFlow.tsx#L27). Users are likely to assume the URL analysis powers the full audit when it does not visibly cover most of those dimensions.

3. High: Marketing Audit overlaps heavily with stronger specialized audit surfaces, without clarifying when to use this summary layer instead of those deeper tools. CRO already has dedicated audit modes for pages, signup, onboarding, forms, popups, and paywalls at [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L5), and Company Intelligence has a richer `WebsiteAuditPage` artifact with section-by-section findings, recommendations, experiments, and task creation at [WebsiteAuditPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/WebsiteAuditPage.tsx#L33). Users are not told whether Marketing Audit is the front door, the executive summary, or a separate parallel audit path.

4. Medium: the module’s output model is generic and not strongly operationalized. Tara runs a `marketing_audit` prompt and Neel runs a `marketing_report` prompt at [MarketingAuditFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/MarketingAuditFlow.tsx#L22), but there is no module-specific artifact renderer for score breakdown, quick wins, or roadmap. Compared with Website Audit’s structured artifact and task deployment actions at [WebsiteAuditPage.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/company-intelligence/pages/WebsiteAuditPage.tsx#L178), Marketing Audit feels text-heavy and less actionable.

5. Medium: the IA placement suggests an analytics product, but the interaction model is closer to a strategy brief generator. In the sidebar, Marketing Audit sits under `Analytics` beside `Performance` at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L153). But the actual experience is mostly agent prompting rather than measured analytics or scored benchmarking, which can confuse users expecting a dashboard-like audit screen.

6. Medium: there is legacy naming drift around CRO audit that increases ambiguity about what “audit” means in the product. `ModuleDetail` routes `cro-audit` into `CROFlow` with a note that it was merged at [ModuleDetail.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ModuleDetail.tsx#L212), while Marketing Audit remains a separate top-level audit surface at [ModuleDetail.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ModuleDetail.tsx#L215). That makes the audit layer feel historically accreted rather than intentionally segmented.

### Open Questions

- Should Marketing Audit become the executive-summary entry point that routes users into deeper audit modules like CRO, Website Audit, SEO, and Performance?
- Or should it be narrowed to a true website-plus-channel scorecard with a structured artifact instead of two open-ended agent outputs?

### Summary

The main UX issue is role clarity. Marketing Audit sounds like the product’s top-level diagnostic layer, but today it sits awkwardly between a lightweight single-page checker and broader specialized audit modules that are often more structured and actionable.

## Performance

### Findings

1. High: the Performance screen duplicates a large portion of Budget Optimization’s workflow and output model, which makes the distinction between the two screens unclear. Performance includes connector selection, data upload/paste, timeframe/currency controls, agent-led KPI diagnosis, and tabbed results for analysis, forecasts, and dashboards at [PerformanceScorecard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PerformanceScorecard.tsx#L245). Budget Optimization already covers similar connector-driven input and analysis with KPI summaries, RCA, recommendations, and budget plans at [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L350). Users are not clearly told when they should use Performance versus Budget Optimization.

2. High: the screen is framed as a “scorecard,” but the primary interaction is still an upload-and-generate pipeline rather than a persistent performance dashboard. The dashboard metadata promises `KPIs Tracked`, `Score Improvement`, and `Forecasts` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L62), and the sidebar simplifies the label to `Performance` at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L156). In practice, the screen behaves more like a report generator that produces a scorecard after manual input, not a continuously useful performance home.

3. Medium: the workflow is thorough, but cognitively heavy because it exposes process, inputs, outputs, and agent diagnostics all at once. The screen starts with Dev and Arjun analysis actions at [PerformanceScorecard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PerformanceScorecard.tsx#L247), then a six-step “Scorecard Workflow” progress tracker at [PerformanceScorecard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PerformanceScorecard.tsx#L286), then six result tabs at [PerformanceScorecard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PerformanceScorecard.tsx#L321). That makes the module feel serious, but also dense and slightly over-instrumented for first-time users.

4. Medium: the “Dashboard” concept is underpowered relative to the name. The available chart data is only a lightweight distribution of channel scores when no timeseries is returned at [PerformanceScorecard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PerformanceScorecard.tsx#L239). This means the experience leans more on cards, tables, and generated prose than on real dashboard behavior like trend exploration, live filters, or time-based comparisons.

5. Medium: the module’s unique value proposition is not strongly differentiated from Channel Health or the Dev portions of Budget Optimization. Channel Health already claims to audit channels and recommend reallocation at [ChannelHealthFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChannelHealthFlow.tsx#L8), and Dev’s next actions from the performance analysis route directly to Budget Optimization, CRO, and Channel Health at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L399). That makes Performance feel like one of several overlapping “analyze what’s working” surfaces.

6. Medium: the upload-first model is practical, but it weakens continuity for ongoing performance management. The user is still asked to upload a CSV/JSON export or paste raw data at [PerformanceScorecard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PerformanceScorecard.tsx#L374), even though connector selection is available on the same screen at [PerformanceScorecard.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/PerformanceScorecard.tsx#L333). This makes the product feel more like a periodic analysis tool than a live performance layer.

### Open Questions

- Should Performance become the canonical ongoing measurement dashboard, with Budget Optimization focused only on “what to change next” decisions?
- Or should Performance be reframed more explicitly as a generated scorecard/report, not a live dashboard?

### Summary

The main UX issue is differentiation. Performance is a capable report-generation screen, but it overlaps too much with Budget Optimization and adjacent analytics surfaces, so its exact job in the product is not yet clear enough.

## Budget Optimization

### Findings

1. High: Budget Optimization is one of the more functional analytics modules, but its role overlaps too heavily with Performance. It has connector selection, uploads, agent diagnosis, natural-language analysis, and tabbed outputs for overview, RCA, recommendations, creative insights, and an HTML report at [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L114). Performance already offers a similar input-and-generate flow with KPI analysis, benchmarking, forecasting, and dashboard views, so the product does not clearly separate “measurement” from “decisioning.”

2. High: the screen is framed like a live optimization system, but much of the actual interaction still depends on manual data preparation. Chat promises a workflow with `Deploy Optimization` and `Performance Tracking` at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L661), and the dashboard calls it `Campaign Budget Optimization` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L52). In practice, the user is still expected to upload files or paste exports, then ask a question in natural language at [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L350). That makes the module feel more like an analysis workbench than an actively optimizing system.

3. Medium: the module mixes several mental models in one screen: agent monitoring, connector setup, ad hoc question answering, precision gating, and generated report consumption. Dev and Arjun agent panels appear first at [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L251), then connector and upload controls, then the main question-answer workflow, then result tabs, then a production-precision gate at [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L435). That breadth is useful, but it makes the screen feel operationally dense.

4. Medium: the “Ask Anything” interaction is flexible, but it weakens guided optimization. The primary question box supports broad prompts like “Why did ROAS dip?” and “Which creatives are fatiguing?” at [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L352). That is powerful for advanced users, but there is little structured guidance for the most common optimization tasks like channel reallocation, creative fatigue analysis, or spend efficiency triage.

5. Medium: the module includes strong output categories, but they are still mostly report-like rather than action-like. Recommendations, budget plans, creative insights, and HTML report preview are all well organized at [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L590), [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L494), and [BudgetOptimizationFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/BudgetOptimizationFlow.tsx#L632). But there is no strong inline step from a recommendation into a concrete execution action inside the module itself.

6. Medium: naming is slightly inconsistent across surfaces, which affects orientation. The dashboard uses `Campaign Budget Optimization` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L53), while the sidebar shortens it to `Budget Optimization` at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L157). The difference is small, but in a product with many overlapping analytics surfaces, narrower naming precision matters.

### Open Questions

- Should Budget Optimization become the canonical “what should we change next?” decision screen, with Performance owning only monitoring and benchmarking?
- Should the module introduce guided optimization modes like `Reallocate Budget`, `Investigate ROAS Drop`, and `Creative Fatigue` instead of relying so heavily on one open question box?

### Summary

The main UX issue is product-role clarity. Budget Optimization is a capable analysis surface, but it still feels like a powerful report generator/workbench rather than a clearly bounded optimization product with a distinct place beside Performance.

## CRO

### Findings

1. High: CRO is one of the clearer modules in the product because it is segmented by real conversion jobs, but each tab is still only a specialized prompt surface rather than a true CRO workflow. The screen breaks work into `Page`, `Signup Flow`, `Onboarding`, `Forms`, `Popups`, and `Paywall` at [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L5), but every tab ultimately renders the same `AgentModuleShell` pattern at [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L152). There is no hypothesis backlog, experiment plan, prioritization layer, or implementation handoff.

2. High: the module still has naming drift that makes the IA feel historically merged rather than intentionally designed. The dashboard calls it `CRO Audit` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L242), the sidebar calls it `CRO` at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L156), and `ModuleDetail` maps both `cro-audit` and `cro` to the same screen at [ModuleDetail.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ModuleDetail.tsx#L212). That does not block usage, but it weakens confidence in the product model.

3. Medium: the tab taxonomy is strong, but the tabs are siloed from each other. `Page`, `Signup Flow`, `Onboarding`, `Forms`, `Popups`, and `Paywall` each act like separate mini-tools at [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L5), yet there is no shared CRO artifact connecting them into one conversion program. Users cannot carry a diagnosis from page audit into signup changes, or track whether multiple fixes belong to the same funnel.

4. Medium: output depth is inconsistent across tabs, and the screen does not explain why. `Page`, `Onboarding`, and `Paywall` use both Tara and Sam at [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L11), [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L55), and [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L115), while `Signup Flow` and `Forms` only use Tara at [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L38) and [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L81), and `Popups` only uses Sam at [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L98). That makes the module feel uneven even when the underlying use cases are equally important.

5. Medium: CRO inherits generic shell controls that are not clearly grounded in conversion work. The shared shell adds workspace status, offer selection, and market-signal refresh controls at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L251). Those controls may be technically useful, but on a CRO screen they make the tool feel more like a general agent console than a focused experimentation workspace.

6. Medium: the downstream path is weak for a module that should naturally lead into testing and implementation. Tara’s next actions route to Budget Optimisation, Positioning, and AI Content at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L394). Those are adjacent surfaces, but they are not the strongest next steps after a CRO diagnosis; users would more naturally expect an A/B test handoff, experiment queue, or implementation checklist.

### Open Questions

- Should CRO become the canonical hypothesis and experiment-design hub, with A/B Tests as the execution and measurement layer?
- Should each tab generate a persistent CRO artifact so users can move from diagnosis to rewrite to test plan without losing continuity?

### Summary

The main UX issue is workflow maturity, not taxonomy. CRO is better structured than many modules because the tabs reflect real conversion problems, but the screen still behaves mostly like a collection of specialized prompt cards rather than a full CRO operating surface.

## A/B Tests

### Findings

1. High: A/B Tests is framed like a real experimentation workspace, but the implementation is only two generic agent cards. The full module is a single `AgentModuleShell` at [ABTestFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ABTestFlow.tsx#L3), even though the description promises users can “design, track, and interpret A/B tests” at [ABTestFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ABTestFlow.tsx#L8). There is no experiment setup, status tracking, metrics table, or results history.

2. High: the screen over-promises statistical rigor relative to what the UI actually supports. The dashboard says the module “Declares winners at 95% CI” at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L255), and Dev’s prompt asks users to paste raw metrics so he can declare a winner or estimate run time at [ABTestFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ABTestFlow.tsx#L15). But there is no visible calculator, experiment guardrail, sample-size planner UI, or metric validation layer behind that claim.

3. Medium: the module lacks a clear relationship to CRO, even though it should be the natural continuation of CRO work. CRO already audits pages, signup flows, onboarding, forms, popups, and paywalls at [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L5), while A/B Tests lives as a separate peer analytics module in the sidebar at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L159). Users are not shown a concrete bridge from “diagnose a problem” to “launch a test.”

4. Medium: the module is too narrow for the breadth implied by its title. Sam can generate hypotheses and variants at [ABTestFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ABTestFlow.tsx#L19), and Dev can interpret results at [ABTestFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ABTestFlow.tsx#L12), but there is nothing for targeting, traffic split, test quality checks, stopping rules, or post-test rollout decisions. It behaves more like an experiment-planning prompt and a stats-interpretation prompt than an A/B testing product.

5. Medium: the module inherits generic shell controls that dilute the testing mental model. Like other prompt-based modules, it includes workspace status, offer selection, and market-signal refresh inside `AgentModuleShell` at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L251). Those may be useful context inputs, but they make the screen feel like a general agent console instead of a focused experimentation surface.

6. Medium: the downstream handoffs are indirect. There is a weak implied connection from Priya’s email work into CRO for subject-line testing at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L379), but A/B Tests itself is not strongly wired into implementation, rollout, or monitoring flows. That makes the experimentation layer feel conceptually important but operationally isolated.

### Open Questions

- Should A/B Tests become the canonical execution layer fed by CRO findings and connected to Performance for readout?
- Or should it be reframed more narrowly as an experiment planner and result interpreter, not a full testing workspace?

### Summary

The main UX issue is operational depth. A/B Tests names a concrete experimentation system, but today it behaves mostly like a pair of smart prompts without the workflow structure users expect from a real testing module.

## Churn Prevention

### Findings

1. High: Churn Prevention is named like a real retention workspace, but the implementation is only a two-agent prompt shell. The full module is just `AgentModuleShell` at [ChurnPreventionFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChurnPreventionFlow.tsx#L3), while the description promises users can identify churn signals, segment at-risk users, and build save flows at [ChurnPreventionFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChurnPreventionFlow.tsx#L8). There is no cancellation funnel, at-risk cohort view, intervention tracker, or retention playbook UI.

2. High: the module overlaps with stronger churn-signal surfaces elsewhere in the product, but does not explain its role relative to them. Unified Customer View already shows an `At-Risk Customers` segment and a churn-risk alert at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L512) and [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L583). Churn Prevention, meanwhile, asks users to paste churn survey data or cohort metrics into a prompt at [ChurnPreventionFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChurnPreventionFlow.tsx#L16). Users are not told whether Customer View is the source of truth and Churn Prevention is the action layer, or whether these are separate retention tools.

3. High: the module collapses diagnosis and intervention into generic free-text prompts instead of structured retention decisions. Tara is asked to infer cancellation reasons, segment churned users, and recommend interventions from pasted context at [ChurnPreventionFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChurnPreventionFlow.tsx#L15), while Sam writes cancel-flow intercepts, pause offers, win-back emails, and subject lines at [ChurnPreventionFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChurnPreventionFlow.tsx#L24). There are no structured inputs for churn reason taxonomy, plan tier, usage threshold, downgrade path, offer economics, or trigger timing.

4. Medium: Churn Prevention overlaps with both onboarding retention work and lifecycle email tooling without clear boundaries. CRO’s onboarding tab already targets Day-7 retention and activation at [CROFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/CROFlow.tsx#L53), and Email Sequences already supports churned-user sequences at [EmailSequenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EmailSequenceFlow.tsx#L15). That leaves users guessing whether Churn Prevention is for diagnosing churn, designing save offers, writing win-back copy, or all of the above.

5. Medium: the module inherits generic shell controls that make the experience feel less like a retention system and more like a general agent console. The shared shell includes workspace status, offer selection, and market-signal refresh at [AgentModuleShell.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentModuleShell.tsx#L251). Those controls are not inherently wrong, but they do not add much clarity to a churn-specific workflow.

6. Medium: the downstream path is weak for retention work. Sam’s next actions route to AI Content, Email Sequences, and Landing Pages at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L356), and Tara’s route to Budget Optimisation, Positioning, and AI Content at [AgentRunPanel.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/agent/AgentRunPanel.tsx#L394). Those are adjacent tools, but there is no stronger bridge into customer segmentation, save-offer rollout, cancellation-flow implementation, or retention monitoring.

### Open Questions

- Should Churn Prevention become the action layer that consumes at-risk cohorts from Customer View and turns them into save flows and interventions?
- Or should it be reframed more narrowly as a churn analysis and copy-planning tool instead of a full retention workspace?

### Summary

The main UX issue is role definition. Churn Prevention names a concrete retention system, but today it behaves mostly like a two-prompt strategy and copy surface, while stronger churn signals and adjacent retention jobs already exist elsewhere in the product.

## User Engagement

### Findings

1. High: User Engagement is one of the more fully visualized workflow modules, but much of the experience is still simulated rather than clearly tied to real customer data and campaigns. The screen presents a six-step lifecycle flow from upload through tracking at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L40), yet `deployEngagementFlow()` generates synthetic customer records with random values and then advances the UI through timed progress updates at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L94). That makes the workflow look operationally mature while hiding how much is still demo state.

2. High: the module over-promises end-to-end lifecycle execution relative to the actual interaction depth in each stage. Chat frames it as a workflow that will identify segments, create journey templates, and deploy campaigns automatically at [ChatHome.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/chat/ChatHome.tsx#L657), and the dashboard shows concrete metrics like `Active Journeys`, `Engagement Rate`, and `Conversions` at [dashboardData.ts](/Users/yogs87/Documents/New%20project/marqq/app/src/data/dashboardData.ts#L42). But most tabs are static summary cards, including journey maps at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L404), content at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L427), launch at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L447), and tracking at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L466).

3. High: User Engagement overlaps heavily with Unified Customer View, but the relationship between the two is not explained. Unified Customer View already exposes meaningful segmentation and churn-risk insights, including `High-Value Customers`, `Growth Potential`, and `At-Risk Customers`, at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L500). User Engagement then asks users to upload customer data again and creates its own segmentation layer at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L297) and [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L376). Users are not told whether Customer View is the insight source and User Engagement is the execution layer, or whether both are parallel customer lifecycle tools.

4. Medium: the module bundles segmentation, journey design, content generation, campaign launch, and analytics into one linear flow, but the individual stages are too thin to support that breadth. The steps and tabs are laid out clearly at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L244), but each stage mostly reduces to a few summary cards or a single input. This makes the screen feel like a product storyboard rather than a working lifecycle marketing workspace.

5. Medium: the module overlaps with Email Sequences and Churn Prevention without clear scope boundaries. Email Sequences already handles lifecycle email flows including nurture and churned-user messaging at [EmailSequenceFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/EmailSequenceFlow.tsx#L8), while Churn Prevention already owns retention interventions and win-back copy at [ChurnPreventionFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChurnPreventionFlow.tsx#L8). User Engagement also claims to create personalized journeys and launch multi-channel campaigns at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L238), so the ownership split between lifecycle orchestration, email execution, and retention action is unclear.

6. Medium: the launch and tracking stages do not provide enough operational trust signals. The launch step is only a campaign-name field and a `Launch Multi-Channel Campaign` button at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L447), while tracking is a set of headline metrics at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L466). There is no channel breakdown, journey-level status, trigger logic, audience preview, or evidence that anything launched from this screen.

### Open Questions

- Should User Engagement become the canonical lifecycle execution layer fed by Customer View segments and connected to Email Sequences and Churn Prevention?
- Or should it be repositioned as a guided lifecycle planner until the launch and measurement layers are truly operational?

### Summary

The main UX issue is readiness signaling and product overlap. User Engagement has a stronger workflow shell than many modules, but too much of the experience is still staged or static, and its role beside Customer View, Email Sequences, and Churn Prevention is not clearly defined.

## Customer View

### Findings

1. High: Customer View is one of the more substantial analytics screens, but much of its operational realism is still simulated. The workflow presents six stages from upload through dashboard deployment at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L40), yet `deployCustomerView()` fabricates 45,000 customer records with random LTV and engagement scores and then advances progress on timers at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L84). That creates a strong “live CDP” impression without showing a real data pipeline behind it.

2. High: the module over-promises unified data operations relative to what the screen actually supports. The UI says it will create a 360-degree customer view from all touchpoints at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L217), and the integration tab shows Salesforce, HubSpot, Zendesk, and Google Analytics as connected at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L354). But the actual input model is still a single uploaded file at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L307), so the product promise is much broader than the interaction model.

3. High: Customer View overlaps too heavily with User Engagement, and the handoff between “understand customers” and “act on segments” is not explicit. Customer View already contains segmentation, churn-risk identification, and recommendations at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L485) and [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L532). User Engagement then asks users to upload customer data again and build journeys from its own segmentation layer at [UserEngagementFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UserEngagementFlow.tsx#L40). Users are not told whether Customer View is the canonical source of truth and User Engagement is the action layer, or whether both are parallel lifecycle products.

4. Medium: the screen is broad, but the middle layers are still mostly static showcase content rather than explorable customer intelligence. The profile example, segment cards, and insight cards at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L392), [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L485), and [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L532) look polished, but users cannot drill into a segment, inspect profile history, validate a prediction, or trigger follow-up work from those surfaces.

5. Medium: Customer View overlaps with Churn Prevention without a clear ownership split. This module already surfaces `At-Risk Customers` and an urgent retention recommendation at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L500) and [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L554), while Churn Prevention separately asks users to paste churn data and define interventions in a prompt shell at [ChurnPreventionFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/ChurnPreventionFlow.tsx#L8). The product does not make it clear whether churn diagnosis starts here and action continues there.

6. Medium: naming and placement are mostly better here than in some other modules, but there is still a subtle promise gap between `Customer View` and `Unified Customer View`. The sidebar shortens the module to `Customer View` at [Sidebar.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/layout/Sidebar.tsx#L162), while the screen title is `Unified Customer View` at [UnifiedCustomerViewFlow.tsx](/Users/yogs87/Documents/New%20project/marqq/app/src/components/modules/UnifiedCustomerViewFlow.tsx#L215). The shorter label is fine, but in a product with many overlapping lifecycle modules, tighter naming precision would help reinforce that this is the core customer-data layer rather than another campaign screen.

### Open Questions

- Should Customer View become the single customer-data and segmentation source that feeds User Engagement and Churn Prevention?
- Or should it be narrowed into a true analytical customer-intelligence dashboard rather than a staged end-to-end workflow?

### Summary

The main UX issue is source-of-truth clarity. Customer View is one of the product’s stronger lifecycle screens, but it still mixes simulated CDP workflow, static showcase content, and overlapping retention/engagement jobs in a way that makes its exact role less clear than it should be.
