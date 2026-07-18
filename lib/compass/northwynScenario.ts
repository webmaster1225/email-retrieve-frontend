export type AccountId = "edge" | "northwyn" | "galaxy" | "careers";

export type ContactDecision = "include" | "pass" | "unsure" | null;
export type FactDecision = "use" | "background" | "dont_use" | null;
export type DraftStatus = "pending" | "approved" | "edited";

export interface AccountFixture {
  id: AccountId;
  name: string;
  email: string;
  blurb: string;
  synced: string;
  defaultIncluded: boolean;
  recruiting?: boolean;
  badge: string;
}

export interface EvidenceItem {
  date: string;
  mailbox: "NW" | "EI";
  direction: string;
  subject: string;
  summary: string;
}

export interface CandidateFixture {
  id: string;
  name: string;
  title: string;
  org: string;
  email: string | null;
  mailboxes: string;
  likelyRole: string;
  roleGroup:
    | "investor"
    | "introducer"
    | "advisor"
    | "banker"
    | "healthcare";
  confidence: "High" | "Medium" | "Low";
  whyHer: string;
  strength: number;
  lastTouch: string;
  freq: string;
  warnings: string[];
  evidence: EvidenceItem[];
  whyHerDetail?: string;
  callBetter?: boolean;
  missingEmail?: boolean;
  recentContact?: boolean;
  hasResearch: boolean;
}

export interface ResearchFact {
  claim: string;
  source: string;
  confidence: "High" | "Medium" | "Low";
}

export interface ResearchFixture {
  personId: string;
  identityConfirmed: boolean;
  identityNote: string;
  facts: ResearchFact[];
  recommendedUse: string;
  special?: "identity_uncertain" | "conflict";
  specialMessage?: string;
}

export interface DraftFixture {
  personId: string;
  subject: string;
  body: string;
  personalization: { kind: "private" | "public"; label: string; href?: string }[];
  ask: string;
}

export interface PlanFixture {
  objective: string;
  search: string;
  searchDetail: string;
  lookFor: string;
  prioritize: string;
  exclude: string;
  later: string;
  assumption: string;
}

export interface ChatMessage {
  id: string;
  role: "agent" | "user";
  text: string;
}

export const OBJECTIVE_CHIPS = [
  "Fundraising help",
  "Customer intros",
  "Reconnect",
  "Find an expert",
  "Find partners",
  "Neglected VIPs",
] as const;

export const NORTHWYN_OBJECTIVE = "Help with Northwyn's capital raise";

export const ACCOUNTS: AccountFixture[] = [
  {
    id: "edge",
    name: "Edge Investing",
    email: "dbains@edgeinvesting.ca",
    blurb: "Best for investor, capital-markets, and deal relationships",
    synced: "today 8:02 AM",
    defaultIncluded: true,
    badge: "EI",
  },
  {
    id: "northwyn",
    name: "Northwyn",
    email: "dbains@northwyn.com",
    blurb: "Best for Northwyn investors, lenders, acquisition partners, and advisors",
    synced: "today 7:55 AM",
    defaultIncluded: true,
    badge: "NW",
  },
  {
    id: "galaxy",
    name: "Galaxy Pharmaceuticals",
    email: "dalbir.bains@galaxypharma.net",
    blurb: "Best for pharma operating partners, vendors, and industry contacts",
    synced: "today 8:01 AM",
    defaultIncluded: false,
    badge: "GP",
  },
  {
    id: "careers",
    name: "Galaxy Careers",
    email: "careers@galaxypharma.net",
    blurb: "Recruiting mailbox - candidates and agencies, rarely personal relationships",
    synced: "today 7:50 AM",
    defaultIncluded: false,
    recruiting: true,
    badge: "GC",
  },
];

export const ACTIVE_CAMPAIGNS = [
  {
    id: "northwyn-fund",
    title: "Northwyn fundraising",
    status: "12 approved · drafts in review",
  },
  {
    id: "nkbr",
    title: "NKBR reconnect wave",
    status: "awaiting your send authorization",
  },
];

export const PLAN: PlanFixture = {
  objective: "Help with Northwyn's capital raise",
  search: "Northwyn + Edge Investing · last 5 years",
  searchDetail: "email, calendar, contacts, attachments",
  lookFor:
    "investors · introducers · advisors · family-office & PE/VC contacts · founders who've raised",
  prioritize: "relationship strength, then fundraising relevance",
  exclude: "investment bankers (your instruction)",
  later: "public web research on approved people only, with your review of every fact",
  assumption: "Canada + US focus - say the word to widen",
};

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

export const CANDIDATES: CandidateFixture[] = [
  {
    id: "sarah",
    name: "Sarah Chen",
    title: "Managing Partner",
    org: "Meridian Family Office",
    email: "sarah@meridianfo.com",
    mailboxes: "from Northwyn + Edge Investing",
    likelyRole: "Investor introducer",
    roleGroup: "introducer",
    confidence: "High",
    whyHer:
      "18 emails over two years, met three times, and you discussed her family-office network last June. She introduced you to two investors in 2024 and replied positively to your last note.",
    strength: 4,
    lastTouch: "Mar 2026",
    freq: "~monthly",
    warnings: [],
    evidence: [
      {
        date: "Mar 2026",
        mailbox: "NW",
        direction: "Reply",
        subject: "Re: Quick catch-up",
        summary: "Positive reply; open to reconnecting on healthcare deals.",
      },
      {
        date: "Jun 2025",
        mailbox: "EI",
        direction: "Sent",
        subject: "Healthcare investing notes",
        summary: "You shared notes after her family-office network discussion.",
      },
      {
        date: "Nov 2024",
        mailbox: "NW",
        direction: "Intro",
        subject: "Introducing Raj Kapoor",
        summary: "She introduced you to an investor (one of two in 2024).",
      },
      {
        date: "Sep 2024",
        mailbox: "EI",
        direction: "Meeting",
        subject: "Coffee — Meridian FO",
        summary: "In-person meeting; discussed platform thesis.",
      },
      {
        date: "Apr 2024",
        mailbox: "NW",
        direction: "Intro",
        subject: "Connecting you with Elena",
        summary: "Second investor introduction in 2024.",
      },
      {
        date: "Jan 2024",
        mailbox: "EI",
        direction: "Sent",
        subject: "Happy New Year",
        summary: "Warm year-start note; she replied same week.",
      },
    ],
    whyHerDetail:
      "You exchanged 18 emails over two years, met three times - most recently March - and she introduced you to two investors in 2024. The evidence list below links every thread.",
    hasResearch: true,
  },
  {
    id: "raj",
    name: "Raj Kapoor",
    title: "Partner",
    org: "Summit Capital Partners",
    email: "raj@summitcp.com",
    mailboxes: "from Northwyn",
    likelyRole: "Potential investor",
    roleGroup: "investor",
    confidence: "High",
    whyHer:
      "Met twice after Sarah's intro; he asked for Northwyn's memo and stayed responsive through Q1.",
    strength: 3,
    lastTouch: "Feb 2026",
    freq: "~quarterly",
    warnings: [],
    evidence: [
      {
        date: "Feb 2026",
        mailbox: "NW",
        direction: "Reply",
        subject: "Re: Northwyn update",
        summary: "Asked when the next fund memo would be ready.",
      },
    ],
    hasResearch: true,
  },
  {
    id: "elena",
    name: "Elena Vargas",
    title: "Principal",
    org: "Harbourview Partners",
    email: "elena@harbourview.co",
    mailboxes: "from Edge Investing",
    likelyRole: "Potential investor",
    roleGroup: "investor",
    confidence: "Medium",
    whyHer:
      "Strong thread on healthcare platforms in 2025; she asked thoughtful questions about Northwyn's model.",
    strength: 3,
    lastTouch: "Jan 2026",
    freq: "~quarterly",
    warnings: ["Public sources disagree on current firm — confirm address before sending"],
    evidence: [
      {
        date: "Jan 2026",
        mailbox: "EI",
        direction: "Sent",
        subject: "Harbourview + healthcare platforms",
        summary: "You shared a short thesis note; she engaged.",
      },
    ],
    hasResearch: true,
    recentContact: false,
  },
  {
    id: "michael",
    name: "Michael Torres",
    title: "Managing Director",
    org: "Lakeview Advisors",
    email: "mtorres@lakeviewadv.com",
    mailboxes: "from Northwyn + Edge Investing",
    likelyRole: "Advisor",
    roleGroup: "advisor",
    confidence: "High",
    whyHer:
      "Long-running advisory relationship; he reviewed term sheets with you twice last year.",
    strength: 4,
    lastTouch: "Apr 2026",
    freq: "~monthly",
    warnings: [],
    evidence: [
      {
        date: "Apr 2026",
        mailbox: "NW",
        direction: "Meeting",
        subject: "Term sheet review",
        summary: "Call to walk through structure options.",
      },
    ],
    hasResearch: true,
    recentContact: true,
  },
  {
    id: "priya",
    name: "Priya Sharma",
    title: "Founder",
    org: "Clearpath Health",
    email: null,
    mailboxes: "from Northwyn",
    likelyRole: "Healthcare executive / introducer",
    roleGroup: "healthcare",
    confidence: "Medium",
    whyHer:
      "Close relationship from a prior raise; last known address bounced in May. Strong intro potential if you can reach her.",
    strength: 4,
    lastTouch: "May 2025",
    freq: "sporadic",
    warnings: ["No verified email — last known address bounced in May"],
    evidence: [
      {
        date: "May 2025",
        mailbox: "NW",
        direction: "Bounce",
        subject: "Reconnecting",
        summary: "Outbound bounced; no newer address on file.",
      },
    ],
    callBetter: true,
    missingEmail: true,
    hasResearch: false,
  },
  {
    id: "david",
    name: "David Okonkwo",
    title: "Family Office Principal",
    org: "Okonkwo Family Office",
    email: "david@okonkwofo.com",
    mailboxes: "from Northwyn",
    likelyRole: "Investor introducer",
    roleGroup: "introducer",
    confidence: "High",
    whyHer:
      "You speak often; he prefers calls over email and has offered intros into two FO networks.",
    strength: 5,
    lastTouch: "Jun 2026",
    freq: "~biweekly",
    warnings: ["Flagged better for a personal call"],
    evidence: [
      {
        date: "Jun 2026",
        mailbox: "NW",
        direction: "Call",
        subject: "Catch-up",
        summary: "30-min call; offered to open two FO doors when you're ready.",
      },
    ],
    callBetter: true,
    recentContact: true,
    hasResearch: false,
  },
  {
    id: "james",
    name: "James Whitfield",
    title: "Partner",
    org: "Whitfield & Co.",
    email: "jwhitfield@whitfield.co",
    mailboxes: "from Edge Investing",
    likelyRole: "Advisor",
    roleGroup: "advisor",
    confidence: "Medium",
    whyHer:
      "Trusted counsel on prior deals; light but consistent contact over three years.",
    strength: 3,
    lastTouch: "Dec 2025",
    freq: "~semi-annual",
    warnings: [],
    evidence: [
      {
        date: "Dec 2025",
        mailbox: "EI",
        direction: "Sent",
        subject: "Year-end note",
        summary: "Warm year-end; he replied with holiday wishes.",
      },
    ],
    hasResearch: true,
  },
  {
    id: "nina",
    name: "Nina Patel",
    title: "GP",
    org: "Atlas Ventures",
    email: "nina@atlas.vc",
    mailboxes: "from Northwyn",
    likelyRole: "Potential investor",
    roleGroup: "investor",
    confidence: "Medium",
    whyHer:
      "Met at a conference; follow-up thread on physician-led platforms was substantive.",
    strength: 2,
    lastTouch: "Oct 2025",
    freq: "rare",
    warnings: [],
    evidence: [
      {
        date: "Oct 2025",
        mailbox: "NW",
        direction: "Sent",
        subject: "Great meeting you in Toronto",
        summary: "Post-conference follow-up; she engaged on thesis.",
      },
    ],
    hasResearch: true,
  },
  {
    id: "tom",
    name: "Tom Bradley",
    title: "Managing Director",
    org: "Pacific Rim Capital",
    email: "tbradley@pacificrim.cap",
    mailboxes: "from Edge Investing",
    likelyRole: "Investor introducer",
    roleGroup: "introducer",
    confidence: "Medium",
    whyHer:
      "Introduced you to a lender in 2023; relationship cooled but still cordial.",
    strength: 2,
    lastTouch: "Aug 2024",
    freq: "rare",
    warnings: [],
    evidence: [
      {
        date: "Aug 2024",
        mailbox: "EI",
        direction: "Reply",
        subject: "Re: Checking in",
        summary: "Brief but friendly reply.",
      },
    ],
    hasResearch: false,
  },
  {
    id: "lisa",
    name: "Lisa Nguyen",
    title: "Operating Partner",
    org: "Beacon Health Group",
    email: "lisa@beaconhealth.com",
    mailboxes: "from Northwyn",
    likelyRole: "Healthcare executive",
    roleGroup: "healthcare",
    confidence: "Medium",
    whyHer:
      "Operator perspective you value; she connected you with two clinic roll-up founders.",
    strength: 3,
    lastTouch: "Nov 2025",
    freq: "~semi-annual",
    warnings: [],
    evidence: [
      {
        date: "Nov 2025",
        mailbox: "NW",
        direction: "Intro",
        subject: "Two founders you should meet",
        summary: "Warm intros into clinic consolidation.",
      },
    ],
    hasResearch: true,
  },
  {
    id: "mark",
    name: "Mark Sullivan",
    title: "Director",
    org: "First Atlantic Bank",
    email: "msullivan@fabank.com",
    mailboxes: "from Edge Investing",
    likelyRole: "Banker (lender contact)",
    roleGroup: "banker",
    confidence: "Low",
    whyHer:
      "Worked a debt facility together; useful for lender perspective even if not a classic investor.",
    strength: 2,
    lastTouch: "Mar 2025",
    freq: "rare",
    warnings: [],
    evidence: [
      {
        date: "Mar 2025",
        mailbox: "EI",
        direction: "Sent",
        subject: "Facility check-in",
        summary: "Routine relationship maintenance.",
      },
    ],
    hasResearch: false,
  },
  {
    id: "amy",
    name: "Amy Rostova",
    title: "Head of Network",
    org: "Meridian Family Office",
    email: "amy@meridianfo.com",
    mailboxes: "from Northwyn",
    likelyRole: "Investor introducer",
    roleGroup: "introducer",
    confidence: "Medium",
    whyHer:
      "Sarah's colleague; helped coordinate two of the intros you received in 2024.",
    strength: 3,
    lastTouch: "Jul 2025",
    freq: "~semi-annual",
    warnings: [],
    evidence: [
      {
        date: "Jul 2025",
        mailbox: "NW",
        direction: "Reply",
        subject: "Re: Scheduling with Sarah",
        summary: "Coordinated logistics for Meridian meetings.",
      },
    ],
    hasResearch: false,
  },
];

export const RESEARCH: ResearchFixture[] = [
  {
    personId: "sarah",
    identityConfirmed: true,
    identityNote: "matched on firm, title, prior employer, email domain",
    facts: [
      {
        claim: "Closed a new healthcare fund - May 2026",
        source: "Meridian press release · event May 2026 · retrieved Jul 17 · confidence High",
        confidence: "High",
      },
      {
        claim: "Spoke on physician-led consolidation - Jun 2026 panel",
        source: "conference bio + recording page",
        confidence: "High",
      },
    ],
    recommendedUse:
      "Congratulate her on the fund; tie Northwyn to her healthcare-platform focus. One sentence.",
  },
  {
    personId: "raj",
    identityConfirmed: true,
    identityNote: "matched on firm, title, email domain",
    facts: [
      {
        claim: "Summit closed Fund IV first close - Mar 2026",
        source: "firm announcement · event Mar 2026 · retrieved Jul 17",
        confidence: "High",
      },
    ],
    recommendedUse: "Acknowledge Fund IV momentum in one sentence; keep ask soft.",
  },
  {
    personId: "elena",
    identityConfirmed: true,
    identityNote: "name and prior Harbourview match; current firm uncertain",
    facts: [
      {
        claim: "June profile still lists Harbourview; July registry suggests a move",
        source: "conflicting secondary sources — quarantined",
        confidence: "Low",
      },
    ],
    recommendedUse: "Do not reference firm. Draft from relationship history only.",
    special: "conflict",
    specialMessage:
      "Two credible sources disagree on whether Elena is still at Harbourview - a June profile says yes, a July registry filing suggests she moved. I've drafted without referencing her firm and flagged it; you may want to confirm her address before sending.",
  },
  {
    personId: "michael",
    identityConfirmed: false,
    identityNote: "board appointment for a different Michael Torres could not be confirmed",
    facts: [],
    recommendedUse: "Personalize from relationship history only — no public fact used.",
    special: "identity_uncertain",
    specialMessage:
      "I found a board appointment for a 'Michael Torres' but couldn't confirm it's your Michael Torres - different firm, no overlapping details. I did **not** use it. His draft relies on your relationship history.",
  },
  {
    personId: "james",
    identityConfirmed: true,
    identityNote: "matched on firm and email domain",
    facts: [
      {
        claim: "Quoted in a deal commentary on mid-market healthcare - Feb 2026",
        source: "business press · event Feb 2026",
        confidence: "Medium",
      },
    ],
    recommendedUse: "Optional one-line nod to his commentary; keep focus on ask.",
  },
  {
    personId: "nina",
    identityConfirmed: true,
    identityNote: "matched on firm bio and conference attendance",
    facts: [
      {
        claim: "Atlas announced a healthcare thesis refresh - Apr 2026",
        source: "Atlas blog · event Apr 2026",
        confidence: "High",
      },
    ],
    recommendedUse: "Tie Northwyn briefly to Atlas's healthcare thesis.",
  },
  {
    personId: "lisa",
    identityConfirmed: true,
    identityNote: "matched on company site and email domain",
    facts: [
      {
        claim: "Beacon opened two new clinic sites - Jan 2026",
        source: "Beacon press page · event Jan 2026",
        confidence: "High",
      },
    ],
    recommendedUse: "Congratulate on clinic expansion; ask for operator perspective.",
  },
];

function draftBody(name: string, firstLine: string): string {
  return `${name.split(" ")[0]} —

${firstLine}

We're entering Northwyn's next phase and I'd value your read — and, if it feels natural, intros to investors who care about healthcare platforms.

Would you have 15 minutes for a call in the next couple of weeks?

Best,
Dalbir`;
}

export const DRAFTS: DraftFixture[] = [
  {
    personId: "sarah",
    subject: "Northwyn's next phase - and a small ask",
    body: draftBody(
      "Sarah Chen",
      "Congratulations on the new healthcare fund — and thank you again for the intros in 2024 and our conversations on your family-office network. Your perspective on physician-led platforms has stayed with me.",
    ),
    personalization: [
      { kind: "private", label: "June 2025 healthcare-investing thread" },
      { kind: "private", label: "her 2024 intros" },
      {
        kind: "public",
        label: "May 2026 fund close",
        href: "https://example.com/meridian-fund-close",
      },
    ],
    ask: "15-min call · feedback · intros to relevant investors",
  },
  {
    personId: "raj",
    subject: "Northwyn update — and a question",
    body: draftBody(
      "Raj Kapoor",
      "Hope Fund IV is going well. Since Sarah connected us you've been generous with time — I'm circling back as Northwyn moves into its next phase.",
    ),
    personalization: [
      { kind: "private", label: "Feb 2026 memo thread" },
      { kind: "public", label: "Summit Fund IV first close" },
    ],
    ask: "15-min call · feedback on memo",
  },
  {
    personId: "elena",
    subject: "Reconnecting on healthcare platforms",
    body: draftBody(
      "Elena Vargas",
      "Our 2025 thread on healthcare platforms was one of the sharper conversations I've had — I'm back with a Northwyn update and would value your read.",
    ),
    personalization: [{ kind: "private", label: "2025 healthcare-platform thread" }],
    ask: "15-min call · feedback",
  },
  {
    personId: "michael",
    subject: "Northwyn — quick advisory check-in",
    body: draftBody(
      "Michael Torres",
      "You've been a steady advisor on structure — I'm lining up Northwyn's next phase and would appreciate a short call before we go wider.",
    ),
    personalization: [{ kind: "private", label: "Apr 2026 term-sheet review" }],
    ask: "15-min call · structural feedback",
  },
  {
    personId: "david",
    subject: "Call instead of email?",
    body: draftBody(
      "David Okonkwo",
      "Given how we usually work, a short call may be better than a long email. I'd love your thoughts on Northwyn's next phase and those FO intros you mentioned.",
    ),
    personalization: [{ kind: "private", label: "Jun 2026 catch-up call" }],
    ask: "Personal call · FO intros",
  },
  {
    personId: "james",
    subject: "Northwyn next phase — counsel welcome",
    body: draftBody(
      "James Whitfield",
      "You've been trusted counsel on prior deals. I'm preparing Northwyn's next phase and would value a brief read from you.",
    ),
    personalization: [
      { kind: "private", label: "multi-year advisory thread" },
      { kind: "public", label: "Feb 2026 deal commentary" },
    ],
    ask: "15-min call · counsel",
  },
  {
    personId: "nina",
    subject: "Atlas thesis × Northwyn",
    body: draftBody(
      "Nina Patel",
      "Great meeting you in Toronto — your questions on physician-led platforms stuck with me. Atlas's healthcare thesis refresh feels aligned with where Northwyn is headed.",
    ),
    personalization: [
      { kind: "private", label: "Toronto conference follow-up" },
      { kind: "public", label: "Atlas healthcare thesis refresh" },
    ],
    ask: "15-min call · feedback",
  },
  {
    personId: "tom",
    subject: "Checking in — Northwyn",
    body: draftBody(
      "Tom Bradley",
      "It's been a while since the lender intro — hoping you're well. I'm circling back as Northwyn enters its next phase.",
    ),
    personalization: [{ kind: "private", label: "2023 lender introduction" }],
    ask: "Brief reconnect · optional intro",
  },
  {
    personId: "lisa",
    subject: "Operator perspective on Northwyn",
    body: draftBody(
      "Lisa Nguyen",
      "Congratulations on Beacon's new clinic sites. Your operator lens — and those founder intros — have been invaluable; I'd love your take on Northwyn's next phase.",
    ),
    personalization: [
      { kind: "private", label: "clinic founder intros" },
      { kind: "public", label: "Beacon clinic expansion" },
    ],
    ask: "15-min call · operator feedback",
  },
  {
    personId: "mark",
    subject: "Northwyn — lender perspective welcome",
    body: draftBody(
      "Mark Sullivan",
      "Our facility work gave you a clear view of how we operate. I'm raising for Northwyn's next phase and would value a lender's read — even informally.",
    ),
    personalization: [{ kind: "private", label: "prior facility relationship" }],
    ask: "Brief call · lender perspective",
  },
  {
    personId: "amy",
    subject: "Meridian network — small ask",
    body: draftBody(
      "Amy Rostova",
      "You helped make those 2024 intros land smoothly. I'm back with a Northwyn update and would appreciate any guidance on who in the Meridian network might care.",
    ),
    personalization: [{ kind: "private", label: "2024 intro coordination" }],
    ask: "Guidance · possible intros",
  },
];

export function roleBreakdown(ids: string[]): string {
  const counts: Record<string, number> = {
    investor: 0,
    introducer: 0,
    advisor: 0,
    banker: 0,
    healthcare: 0,
  };
  for (const id of ids) {
    const c = CANDIDATES.find((x) => x.id === id);
    if (c) counts[c.roleGroup] += 1;
  }
  const parts: string[] = [];
  if (counts.investor) parts.push(`${counts.investor} potential investor${counts.investor > 1 ? "s" : ""}`);
  if (counts.introducer) parts.push(`${counts.introducer} introducer${counts.introducer > 1 ? "s" : ""}`);
  if (counts.advisor) parts.push(`${counts.advisor} advisor${counts.advisor > 1 ? "s" : ""}`);
  if (counts.banker) parts.push(`${counts.banker} banker${counts.banker > 1 ? "s" : ""}`);
  if (counts.healthcare)
    parts.push(`${counts.healthcare} healthcare executive${counts.healthcare > 1 ? "s" : ""}`);
  return parts.join(", ");
}

export function formatRoleSummary(ids: string[]): string {
  const counts: Record<string, number> = {
    investor: 0,
    introducer: 0,
    advisor: 0,
    banker: 0,
    healthcare: 0,
  };
  for (const id of ids) {
    const c = CANDIDATES.find((x) => x.id === id);
    if (c) counts[c.roleGroup] += 1;
  }
  return `${ids.length} recipients (${counts.investor} investors · ${counts.introducer} introducers · ${counts.advisor} advisors · ${counts.banker} banker · ${counts.healthcare} healthcare exec)`;
}
