import { AgentData, OnboardingStep, PrimaryGoal } from './types';

export const GOALS: { value: PrimaryGoal; label: string; sub: string; emoji: string }[] = [
  { value: 'leads',      label: 'Get more qualified leads',          sub: 'Build pipeline from the right accounts',     emoji: '🎯' },
  { value: 'conversion', label: 'Improve conversion & sales',        sub: 'Fix offers, copy, and landing pages',         emoji: '📈' },
  { value: 'content',    label: 'Build a content strategy',          sub: 'Social, SEO, and editorial at scale',         emoji: '✍️' },
  { value: 'market',     label: 'Understand my market & competitors', sub: 'Map the landscape before making moves',      emoji: '🔭' },
  { value: 'budget',     label: 'Optimize marketing spend',          sub: 'Cut waste, improve ROI across channels',      emoji: '💰' },
];

export const AGENTS: AgentData[] = [
  { id: 'veena', name: 'Veena', role: 'Company Intel',  specialty: 'Account Research',    task: 'Building company profiles',    color: '#2DD4BF', glow: 'rgba(45,212,191,0.4)' },
  { id: 'isha',  name: 'Isha',  role: 'Market Research', specialty: 'ICP & Audience',     task: 'Mapping audience segments',    color: '#F59E0B', glow: 'rgba(245,158,11,0.4)' },
  { id: 'neel',  name: 'Neel',  role: 'Strategy',        specialty: 'Positioning & GTM',  task: 'Drafting strategy brief',      color: '#60A5FA', glow: 'rgba(96,165,250,0.4)' },
  { id: 'tara',  name: 'Tara',  role: 'CRO & Offers',    specialty: 'Conversion Design',  task: 'Auditing offer friction',      color: '#C084FC', glow: 'rgba(192,132,252,0.4)' },
  { id: 'sam',   name: 'Sam',   role: 'Copy',            specialty: 'Messaging & Voice',  task: 'Reviewing messaging copy',     color: '#86EFAC', glow: 'rgba(134,239,172,0.4)' },
  { id: 'kiran', name: 'Kiran', role: 'Social',          specialty: 'Content Calendar',   task: 'Building 30-day calendar',     color: '#F9A8D4', glow: 'rgba(249,168,212,0.4)' },
  { id: 'zara',  name: 'Zara',  role: 'Channels',        specialty: 'Campaign Strategy',  task: 'Synthesising morning brief',   color: '#FF6521', glow: 'rgba(255,101,33,0.4)' },
  { id: 'maya',  name: 'Maya',  role: 'SEO',             specialty: 'Search Intelligence', task: 'Loading keyword database',    color: '#22D3EE', glow: 'rgba(34,211,238,0.4)' },
  { id: 'riya',  name: 'Riya',  role: 'Content',         specialty: 'Editorial Pipeline',  task: 'Building content calendar',   color: '#A78BFA', glow: 'rgba(167,139,250,0.4)' },
  { id: 'arjun', name: 'Arjun', role: 'Leads',           specialty: 'B2B Prospecting',    task: 'Scanning ICP signals',         color: '#4ADE80', glow: 'rgba(74,222,128,0.4)' },
  { id: 'dev',   name: 'Dev',   role: 'Performance',     specialty: 'Paid Media ROI',     task: 'Reviewing spend data',         color: '#FCD34D', glow: 'rgba(252,211,77,0.4)' },
  { id: 'priya', name: 'Priya', role: 'Intel',           specialty: 'Competitive Watch',  task: 'Tracking competitor moves',    color: '#FB7185', glow: 'rgba(251,113,133,0.4)' },
];

export const STEPS: OnboardingStep[] = [
  {
    num: '01', label: 'Your Company',
    question: 'Tell us about\nyour company.',
    sub: 'Veena reads this before your first run — it anchors every analysis, brief, and campaign your agents produce.',
    fields: [
      { key: 'company',    label: 'Company Name',   placeholder: 'e.g. PL Capital',    type: 'input' },
      { key: 'websiteUrl', label: 'Website URL',     placeholder: 'e.g. plcapital.in — agents read this automatically', type: 'input', optional: true },
    ],
  },
  {
    num: '02', label: 'Your Market',
    question: 'Who are you\nselling to?',
    sub: 'Your industry and ICP shape every brief Riya writes and every prospect Arjun surfaces.',
    fields: [
      { key: 'industry', label: 'Industry / Niche',        placeholder: 'e.g. WealthTech, India',                               type: 'input' },
      { key: 'icp',      label: 'Ideal Customer Profile',  placeholder: 'e.g. HNI investors, 35–55, Tier 1 cities, ₹10L+ portfolio', type: 'input' },
    ],
  },
  {
    num: '03', label: 'Your Competition',
    question: 'Who are you\nup against?',
    sub: 'Priya tracks these daily. Neel uses them to sharpen your positioning every week.',
    fields: [
      { key: 'competitors', label: 'Top Competitors', placeholder: 'e.g. Groww, Zerodha, ETMoney  —  skip if pre-launch', type: 'input', optional: true },
    ],
  },
  {
    num: '04', label: 'Your Goal',
    question: 'What do you\nwant to achieve?',
    sub: 'Pick your primary goal. Your agents will prioritise their work around it.',
    fields: [
      { key: 'primaryGoal', label: 'Primary Goal', placeholder: '', type: 'goal-picker' },
      { key: 'goals',       label: 'Anything else? (optional)', placeholder: 'e.g. Launch by Q2, enter the SMB segment…', type: 'textarea', optional: true },
    ],
  },
];
