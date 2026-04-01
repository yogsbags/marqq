# Helena / EnrichLabs UX Notes
*Live observation from agent.enrichlabs.ai — account: yogamazoning@gmail.com / site: productverse.in*
*Captured: April 1, 2026*

---

## 1. OVERALL LAYOUT — `marketing-app`

```
┌─────────────────────────────────────────────────────────────────────┐
│  marketing-app  (display:flex, flex-direction:row, 1728×937)       │
│                                                                     │
│  ┌──────────┐  ┌─────────────────────────────┐  ┌───────────────┐  │
│  │ SIDEBAR  │  │     CENTER (home-chat)       │  │  RIGHT PANEL  │  │
│  │  280px   │  │         965px               │  │    483px      │  │
│  │          │  │                             │  │               │  │
│  └──────────┘  └─────────────────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Key classes:**
- `marketing-app` — root flex row container
- `marketing-app__sidebar` — 280px left sidebar
- `marketing-app__main` — 1448px right (contains center + right panel)
- `home-layout` — wraps both center + right panel
- `home-chat` — center chat column (965px)
- `home-assets-panel` — right context panel (483px)

---

## 2. SIDEBAR — `marketing-app__sidebar`

**Dimensions:** 280px wide × 937px tall
**Background:** `rgb(255, 255, 255)` — WHITE (light mode default)
**Border:** `1px solid rgba(0,0,0,0.06)` right border
**Font:** TikTok Sans, system-ui
**Active channel bg:** `rgba(20, 131, 243, 0.06)` — soft blue tint (NOT orange)
**Active channel text:** `rgb(10,10,10)`
**Inactive text:** `rgb(85,85,85)`

**Sidebar sections (top to bottom):**

```
[Company Logo] Productverse Technologies

CHANNELS
  # main          ← active (blue tint bg)
  # performance
  # calendar

DIRECT MESSAGES
  [Avatar] Helena
           AI Digital Marketer
           [+ New] button

CHAT HISTORY
  Weekly Automation Suggestions
  I just signed up. Our website is https://produc...
  See all conversations

[Files]
[Your Profile]
[Integrations]
[Share & Earn]
[Contact Us]

[Y avatar] yogesh@productverse.co.in  ← bottom user section
```

**Key UX patterns:**
- CHANNELS uses `#` icon prefix — Slack-style
- DM section shows agent avatar + name + role + "+ New" button
- Chat history shows last 2 convos with truncated preview text
- "See all conversations" link to `/marketing/chat-sessions`
- Bottom: utility links (Files, Profile, Integrations, Share & Earn, Contact Us)
- Very bottom: user avatar initial + email

---

## 3. CENTER PANE — `home-chat` (965px)

**Structure (top to bottom):**

```
┌─────────────────────────────────────────────┐
│  #main                          (33px, h1)  │ ← channel name header
├─────────────────────────────────────────────┤
│  Tuesday, March 31              (23px)      │ ← date separator
├─────────────────────────────────────────────┤
│  [chat scroll area]             (677px)     │ ← .last-chat-scroll
│                                             │
│  [Y] You                                    │
│  Our website is https://productverse.in...  │
│                                             │
│  [Helena avatar]                            │
│  "Let me dive into your website..."        │
│  Working on getWebsiteContent              │ ← tool use shown inline
│  [📄 business-profile.md — File Saved]     │ ← file artifact card
│                                             │
├─────────────────────────────────────────────┤
│  [Hire Helena CTA banner]       (114px)     │ ← bottom upgrade prompt
│  "Hire your first autonomous AI marketer"   │
│  [Hire Helena] [3-day free trial]           │
│  Works while you sleep.                     │
├─────────────────────────────────────────────┤
│  [📎] [Message Helena...     ] [→ send]     │ ← input bar (51px)
└─────────────────────────────────────────────┘
```

**Channel header (33px row):**
- Just `#main` text — very minimal, NO credits/notifications in this bar
- Date separator line below it: "Tuesday, March 31"

**Chat messages:**
- User messages: `[Y] You` with avatar initial
- Helena messages: Agent name + avatar + prose response
- Tool use shown inline: `Working on getWebsiteContent` (loading state)
- File artifacts shown as cards: `📄 filename.md | File | Saved`
- Collapsible sections for long content (Collapse/Copy buttons)

**Input bar (bottom, 51px):**
- Paperclip icon for file attachment
- `textarea` with placeholder `"Message Helena..."`
- Send arrow button
- Below bar: hint text `"Plain language works best. Type '/' to jump somewhere or '@name' to reach a specialist."`

---

## 4. RIGHT PANEL — `home-assets-panel` (483px)

**Dimensions:** 483px wide × 937px
**Background:** transparent (no separate bg)
**NO dedicated tab bar** — sections are stacked vertically with collapsible headers

**Section structure:**

```
┌─────────────────────────────────┐
│ Metrics                         │ ← collapsible section header
│   ACTIVE USERS  [Connect GA]    │
│                 [Connect now]   │
│   SESSIONS      [Connect GA]    │
│                 [Connect now]   │
├─────────────────────────────────┤
│ Channels                        │ ← collapsible section
│   [Autopilot toggle]            │
│   Connect all channels...       │
│   [Add channel] button          │
├─────────────────────────────────┤
│ Upcoming Tasks        [View all]│ ← collapsible section
│   📄 Weekly LinkedIn Brief      │
│      Helena · in 4d             │
│   📄 Weekly Automation Suggest. │
│      Helena · in 6d             │
├─────────────────────────────────┤
│ Brand Knowledge Base            │ ← collapsible section
│   marketing strategy  3/31/2026 │
│   market research     3/31/2026 │
│   [View all (3 more)]           │
└─────────────────────────────────┘
```

**Key UX patterns:**
- Sections have [Collapse] toggle button
- Metrics CTA: "Connect GA" label + "Connect now" link → `/marketing/integrations`
- Channels section has "Autopilot" toggle (disabled until channels connected)
- Tasks show agent name + relative due date ("in 4d")
- Brand KB shows filename + date, "View all (N more)" link

---

## 5. DEDICATED CHAT PAGE — `/marketing/chat?agent=helena`

**Layout class:** `chat-page-layout` (flex row, 1448×937)
**Sub-classes:** `chat-page-main` (1128px) + `chat-sidebar` (320px)

```
┌──────────────────────────────────┬──────────────────┐
│  chat-page-main  (1128px)        │ chat-sidebar     │
│                                  │ (320px)          │
│  "Helena"  (29px header)         │ Metrics          │
│  "Wednesday, April 1"  (23px)    │ Active Users     │
│                                  │ Sessions         │
│  Helena: "Hi! How can I help?"   │ Channels         │
│                                  │ Autopilot        │
│  [chat messages area]            │ Add channel      │
│                                  │ Upcoming Tasks   │
│  [input bar at bottom]           │ Brand KB         │
└──────────────────────────────────┴──────────────────┘
```

- Chat header: just agent name "Helena" (29px) — even simpler than home
- Input: `> Type your message...` placeholder (different from home!)
- Right sidebar: same `rsp-assets-body` with Metrics/Channels/Tasks/Brand KB

---

## 6. PERFORMANCE PAGE — `/marketing/performance`

**Title:** Performance Analytics

**Layout:**
- Full-width main area (no right panel)
- Top: "Connect Google Analytics" CTA banner — large card with Google Analytics logo
- Below: "Performance Analytics" header with date range picker (Last 24h / 7d / 30d / 60d / 90d / This year / Custom)
- "Performance Metrics" section with [Add Metric] button
- "Performance Trends" section with Show/Hide All toggle
- Line chart showing dates (Mar 24–30) with 0/1 activity values
- Keyboard shortcuts shown: `←/→ Navigate`, `T Today`, `V Toggle View`

---

## 7. CALENDAR PAGE — `/marketing/calendar`

**Title:** Calendar

**Layout:**
- Full-width, no right panel
- Header: "Marketing Calendar — Manage your content schedule across all channels"
- Keyboard shortcuts: `←/→`, `T Today`, `V Toggle View`
- Week view: Mar 29 – Apr 4, 2026 (Sun–Sat columns)
- Today (Apr 1 Wed): "No content scheduled for this day. [Add Content]"
- Month/Week toggle

---

## 8. INTEGRATIONS PAGE — `/marketing/integrations`

**Two sections:**

**Content Posting** (publish content):
X (Twitter), LinkedIn, YouTube, TikTok, Instagram, Pinterest, WordPress, WordPress Self-Hosted, Webflow, Ghost, Framer (Read Only)

**Channel Data & Setup** (analytics/ads):
Shopify, Google Analytics, Google Search Console, Google Ads, Meta Ads, TikTok Ads, Klaviyo, Mailchimp (truncated)

Each integration: Name + ℹ️ info icon + "Not Connected" status + [Connect] button

---

## 9. WORKSPACE FILES — `/marketing/workspace`

**Title:** "Workspace Files"
**Subtitle:** "Browse files created by the AI assistant during your conversations."

Files auto-generated by Helena after first chat:
- `brand-guidelines.md` — Mar 31, 2026 — [Download] [Delete]
- `business-profile.md` — Mar 31, 2026 — [Download] [Delete]
- `market-research.md` — Mar 31, 2026 — [Download] [Delete]
- `marketing-strategy.md` — Mar 31, 2026 — [Download] [Delete]
- `seo-strategy.md` — Mar 31, 2026 — [Download] [Delete]

---

## 10. PROFILE PAGE — `/marketing/profile`

**Key sections:**
- Subscription status: "Free Trial Plan" + [Start Subscription] CTA
- Email Preferences toggle
- Name / Business Name / Phone
- Social Media handles (LinkedIn, X/Twitter)
- Company Description (for AI keyword/SEO use)
- Target Customers
- Brand Voice
- Value Proposition
- SEO & Website Configuration section

---

## 11. TASKS PAGE — `/marketing/scheduled-jobs`

**Title:** "Tasks — Tasks that run automatically on a schedule."

**Recurring tasks shown:**
1. **Weekly LinkedIn Content Brief** — active — Every Monday at 9 AM (Asia/Kolkata) — Next run: 4/6/2026
2. **Weekly Automation Suggestions** — active — Every Tuesday at 4 PM (Los Angeles) — Last run: 4/1/2026, Next: 4/8/2026

Each task: [Edit] [Pause] [Delete] buttons

---

## 12. CHAT SESSIONS PAGE — `/marketing/chat-sessions`

**Title:** "Chat History — View and manage your conversation history"

**Tab bar:** Conversations (1) | Tasks (1)

**Conversations tab:**
- 1 conversation shown
- Preview text + timestamp + [Delete] button

---

## 13. KEY DESIGN TOKENS (Helena)

| Property | Value |
|----------|-------|
| Sidebar bg | `rgb(255,255,255)` — pure white |
| Sidebar width | 280px |
| Sidebar border | `1px solid rgba(0,0,0,0.06)` |
| Active channel bg | `rgba(20,131,243,0.06)` — blue tint |
| Active channel color | `rgb(10,10,10)` |
| Inactive text | `rgb(85,85,85)` |
| Body font | TikTok Sans, system-ui |
| Center chat width | 965px |
| Right panel width | 483px |
| Chat header height | ~33px (just channel name text) |
| Date separator | ~23px row |
| Input bar height | 51px |
| Viewport | 1728×937 |

---

## 14. KEY UX PATTERNS TO REPLICATE IN MARQQ

### ✅ Already done in Marqq:
- Dark sidebar with # channels (Marqq uses dark navy instead of white)
- 3-pane layout (sidebar + center + right panel)
- Chat-first home view
- Slim channel header (48px)
- Right panel with collapsible sections
- Agent in DM section (Marqq AI)

### ✅ All actionable gaps closed (2026-04-01):

1. ✅ **Right panel collapsible sections** — Rewritten to stacked collapsible Section components
2. ✅ **Channels section + Autopilot toggle** — ChannelsSection with interactive toggle + Add channel CTA
3. ✅ **Right panel width ~400px** — w-[380px] (compromise, Helena 483px)
4. ✅ **Input placeholder hint** — "Plain language works best. Type `/`..." already present
5. ✅ **Tool-use inline typing** — Typing indicator rotates through 7 "Working on..." labels
6. ✅ **File artifact cards** — FormattedMessage extracts .md/.pdf/.csv refs → orange artifact card chips with View → workspace-files
7. ✅ **Upgrade CTA strip** — Shows above input when credits < 20% remaining
8. ✅ **Chat History with previews** — Last 2 conversations + truncated last message in sidebar
9. ✅ **Scheduled Tasks real data** — TasksSection fetches agent-deployments API, falls back to mock
10. ⏭️ **Brand KB auto-generation** — Backend pipeline change; deferred
11. ⏭️ **Performance page GA CTA** — PerformanceScorecard module already covers this
12. ✅ **Calendar page** — MarketingCalendarPage: day picker, scheduled deployments, festival events
13. ✅ **Workspace Files in sidebar** — "Files" workspace item → LibraryView
14. ✅ **DM "+ New" button** — "+ New" button next to Veena in DM section
15. ✅ **Agent role subtitle** — "AI Marketing OS" shown under Veena name in expanded sidebar
