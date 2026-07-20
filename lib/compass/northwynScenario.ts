/** UI copy and defaults for Compass — no fake contacts, mailboxes, or campaign data. */

export const OBJECTIVE_CHIPS = [
  "Fundraising help",
  "Customer intros",
  "Reconnect",
  "Find an expert",
  "Find partners",
  "Neglected VIPs",
] as const;

export const NORTHWYN_OBJECTIVE = "Help with Northwyn's capital raise";

export const COPY = {
  mailboxSelection:
    "This looks like a Northwyn fundraising objective. I'd search **Northwyn** and **Edge Investing** - investor and advisory relationships likely live in both. Galaxy Pharma looks less relevant and Galaxy Careers is a recruiting mailbox, so I'd leave both out. Want to include either?",
  clarification:
    "I'll look for potential investors, family-office and PE/VC contacts, founders who've raised, and trusted people who could make introductions - prioritizing relationship strength first, fundraising relevance second, over the last five years. Anyone to exclude, or shall I start?",
  planIntro: "Here's my plan. Nothing runs until you approve it.",
  progress:
    "Reviewing your Northwyn relationship history now… I've found 62 potentially relevant people and I'm narrowing to the strongest candidates. A couple of minutes.",
  contactRec:
    "Here are 12 strong candidates, strongest first. For each one I'll tell you exactly why they're here. Approve, pass, or just tell me - e.g. 'drop anyone I haven't spoken to since 2023.'",
  whySarah:
    "You exchanged 18 emails over two years, met three times - most recently March - and she introduced you to two investors in 2024. The evidence list below links every thread.",
  contactBatch:
    "You approved {approved} and passed on {passed}. Two of the included - David and Priya - are close enough that a call may land better than an email; want me to prepare call notes for them instead?",
  campaignConfirm:
    "{count} approved: {breakdown}. Shall I research these people and draft your messages?",
  messageInstructions:
    "What would you like the messages to say? Rough notes are fine - I'll shape them. Two things I'll need: how much you're raising and what I'm allowed to disclose.",
  researchReturn:
    "I verified all {count} identities. For {researchCount} people I found something recent worth mentioning - each with sources for your review. For the others, nothing public would improve the message, so I'll personalize from your history alone.",
  sourceReview:
    "The fund close is from Meridian's own press release, event date May 2026, retrieved today. I'm confident it's the same Sarah Chen - firm, title, and email domain all match.",
  draftReview:
    "Drafts ready, grouped by role. Each shows exactly what I used and what I'm asking for. Edits can apply to one draft or all of them - 'make them all shorter and warmer' works.",
  sendAcct:
    "These concern Northwyn, so I suggest drafting from **<dbains@northwyn.com>**. Confirm, or pick a different account - I won't create drafts until you do.",
  finalAuth:
    "Ready: drafts from <dbains@northwyn.com>. Saving to your Outlook Drafts is one step; sending is a separate authorization I'll always ask for explicitly. Two flags first: Priya has no verified address, and two people were messaged in the last 30 days.",
  sendRestate:
    "Sending {count} messages now from <dbains@northwyn.com> to: {names}. Type or click **Send** to authorize - this is the step that actually emails people.",
  saved:
    "Saved drafts to Outlook (prototype). Tracking comes in a later phase — Day 0 for now.",
  sent:
    "Prototype only — nothing was emailed. In production this would be the irreversible Gate 8 send.",
  vagueObjective:
    "Happy to help. To point me in the right direction: is this about raising capital, finding customers, or reconnecting generally? A sentence is plenty.",
  excludeBankers: "Exclude investment bankers.",
  useDefaults: "Use your defaults — start.",
  confirmResearch: "Yes — research and draft.",
  messageNotes:
    "Raising a growth round for Northwyn's next phase. OK to mention healthcare-platform focus. Soft ask: 15-min call for feedback and relevant intros.",
  confirmNorthwyn: "Confirm <dbains@northwyn.com>",
};
