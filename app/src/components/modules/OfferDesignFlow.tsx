import { AgentModuleShell } from '@/components/agent/AgentModuleShell'

export function OfferDesignFlow() {
  return (
    <AgentModuleShell
      title="Offer Design"
      description="Offer clarity audit, CTA friction analysis, and conversion blocker removal from tara."
      agents={[
        {
          name: 'tara',
          label: 'Tara — Offer & Conversion',
          taskType: 'offer_friction_review',
          defaultQuery:
            "Design a complete lead magnet and 3-email nurture sequence for our primary ICP using MKG context. For the lead magnet: provide a specific title (with a proof point or time frame), the format (PDF/checklist/template/etc.), a one-sentence hook that creates urgency, a full table of contents with descriptive section titles, a landing page headline, CTA button text, and delivery method. For the email sequence: write subject line, purpose, and key message for each of 3 emails — email 1 delivers the asset, email 2 provides an insight or self-diagnostic, email 3 pushes to a demo or audit with social proof. End with a conversion hypothesis stating the expected opt-in rate and email-to-demo conversion rate with reasoning. Do not return empty fields.",
        },
      ]}
    />
  )
}
