import { SpotlightTour, type SpotlightTourStep } from '@/components/tour/SpotlightTour'

const STEPS: SpotlightTourStep[] = [
  {
    target: null,
    title: 'Welcome to Marqq AI',
    description: 'Your AI-powered marketing intelligence platform is ready. Let us show you the key areas in 4 quick steps.',
    placement: 'center',
  },
  {
    target: 'chat-input',
    title: 'Your AI Command Center',
    description: 'Type any marketing task here — "create a LinkedIn post", "analyze our SEO" — or use /commands like /leads, /content, /seo. Open the chat from "Ask AI" in the header if the drawer is closed.',
    placement: 'top',
  },
  {
    target: 'nav-company-intel',
    title: 'Company Intelligence',
    description: 'Analyze your company, benchmark competitors, and generate your full GTM strategy with one click.',
    placement: 'right',
  },
  {
    target: 'nav-dashboard',
    title: 'AI Team Dashboard',
    description: 'Monitor your 12 autonomous agents — Veena, Isha, Neel, Tara, Sam, Kiran, Zara, Maya, Riya, Arjun, Dev, and Priya.',
    placement: 'right',
  },
  {
    target: 'nav-settings',
    title: 'Settings & Workspace',
    description: 'Invite teammates, connect integrations, and manage billing. Your workspace was auto-provisioned when you signed up.',
    placement: 'right',
  },
]

interface Props {
  onDone: () => void
}

/** Sidebar + chat spotlight tour (after home tour or for users who skipped home). */
export function ProductTour({ onDone }: Props) {
  return (
    <SpotlightTour
      steps={STEPS}
      storageKey="marqq_tour_done"
      onDone={onDone}
      tourLabel="App tour"
    />
  )
}
