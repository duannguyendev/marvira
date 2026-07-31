import { IMAGES } from '@/lib/site';

const en = {
  brandLine: 'City adventure, on foot.',
  nav: {
    how: 'How it works',
    explore: 'Explore',
    create: 'Create',
    download: 'Download',
    support: 'Support',
    press: 'Press',
  },
  home: {
    headline: 'Turn your city into a scavenger hunt.',
    support:
      'Walk real places, answer challenges, and climb the leaderboard with friends.',
    ctaAppStore: 'App Store',
    ctaPlayStore: 'Google Play',
    ctaDownload: 'Get the app',
    ctaHow: 'See how it works',
    heroAlt: 'People exploring a city street at golden hour',
    heroImageBrief:
      'Full-bleed photo of friends walking a city street / plaza at golden hour — real outdoor hunt energy, not UI mockups.',
  },
  how: {
    title: 'How Marvira works',
    intro: 'Four simple steps from finding a hunt to topping the board.',
    steps: [
      {
        title: 'Find a hunt',
        body: 'Browse events near you — downtown walks, park loops, and special city challenges.',
      },
      {
        title: 'Walk to places',
        body: 'Follow the map to real landmarks. GPS checks you in when you arrive.',
      },
      {
        title: 'Answer challenges',
        body: 'Solve quizzes and clues at each stop. No spoilers — discovery is the point.',
      },
      {
        title: 'Climb the leaderboard',
        body: 'Earn points for speed and accuracy. Share your finish with friends.',
      },
    ],
  },
  download: {
    title: 'Download Marvira',
    intro: 'Install on iOS or Android and start your first hunt.',
    qrLabel: 'Scan to install',
    storesSoon: 'Store links go live with the public release. Check back soon.',
    deepLinkNote:
      'Already have the app? Open a shared hunt link and Marvira will launch automatically.',
  },
  create: {
    title: 'Create hunts for your city',
    intro:
      'Design GPS scavenger hunts for events, teams, tourism, and schools — then invite players with one link.',
    props: [
      {
        title: 'Events & teams',
        body: 'Corporate offsites, birthdays, and group challenges that get people moving together.',
      },
      {
        title: 'Tourism & venues',
        body: 'Turn districts, museums, and campuses into playable discovery routes.',
      },
      {
        title: 'Schools & learning',
        body: 'Outdoor quizzes that reward curiosity, collaboration, and local knowledge.',
      },
    ],
    ctaDownload: 'Download to create',
  },
  explore: {
    title: 'Explore city hunts',
    intro: 'Discover scavenger hunts published by Marvira organizers near you.',
    difficulty: 'Difficulty',
    viewInvite: 'View invite',
    searchPlaceholder: 'Search by title or place…',
    empty: 'Nothing published yet. Check back soon.',
    noResults: 'No results match your search.',
    loadError: 'We could not load this right now. Please try again shortly.',
    readMore: 'Read more',
    backToExplore: 'Back to Explore',
    playCta: 'Play this hunt in the app',
    prevArticle: 'Previous',
    nextArticle: 'Next',
    pagination: {
      previous: 'Previous',
      next: 'Next',
      pageOf: 'Page {current} of {total}',
    },
    items: [
      {
        id: 'seed-event-downtown',
        title: 'Downtown Discovery Hunt',
        blurb:
          'Explore the historic downtown district and uncover hidden gems through interactive challenges.',
        city: 'San Francisco',
        difficulty: 'Medium',
        coverBrief:
          'Downtown plaza / ferry / skyline walk — lively street-level adventure.',
        coverImage: IMAGES.downtown,
      },
      {
        id: 'seed-event-golden-gate',
        title: 'Golden Gate Adventure',
        blurb: 'A scenic hunt along the iconic Golden Gate Bridge area.',
        city: 'San Francisco',
        difficulty: 'Hard',
        coverBrief:
          'Bridge overlook / coastal path — windy outdoor trail energy.',
        coverImage: IMAGES.goldenGate,
      },
    ],
  },
  press: {
    title: 'What is Marvira?',
    onePager:
      'Marvira is a GPS scavenger-hunt app for city exploration. Players walk to real places, answer location challenges, and compete on leaderboards. Organizers create hunts for events, tourism, venues, and schools — then share a single invite link.',
    audiences: [
      {
        title: 'Cities & tourism boards',
        body: 'Activate districts with walkable discovery routes that highlight local landmarks.',
      },
      {
        title: 'Venues & campuses',
        body: 'Offer self-guided experiences without building a custom app.',
      },
      {
        title: 'Schools',
        body: 'Turn local history and STEM into outdoor team challenges.',
      },
      {
        title: 'Organizers',
        body: 'Publish hunts, invite players, and celebrate results on a live leaderboard.',
      },
    ],
    boilerplate:
      'Marvira turns cities into playable scavenger hunts. Walk real places, solve challenges, and climb the leaderboard — or create hunts for your community.',
    pdfBrief:
      'Optional one-pager PDF: cover photo of a city walk, What is Marvira paragraph, four audience bullets, store/QR CTA, contact email.',
  },
  support: {
    title: 'Support & FAQ',
    intro: 'Common questions for players and organizers.',
    faqs: [
      {
        q: 'Do I need an account to play?',
        a: 'Yes — sign in on the app so your progress and leaderboard scores stay with you.',
      },
      {
        q: 'How does location checking work?',
        a: 'When you arrive near a place, Marvira uses GPS to check you in. Stay outdoors with location permission enabled.',
      },
      {
        q: 'Can I create my own hunt?',
        a: 'Yes. Free creators can draft freely and publish a limited number of events. Marvira Plus unlocks unlimited published hunts.',
      },
      {
        q: 'Will shared event links open the app?',
        a: 'When the apps are live, links like /e/{id} open Marvira if installed, or send you to the download page.',
      },
      {
        q: 'How do I contact support?',
        a: 'Use the feedback form below — we read every message. You can also email {{supportEmail}}.',
      },
    ],
    form: {
      title: 'Send us a message',
      intro: 'Share feedback, suggestions, or report a bug. No account needed.',
      nameLabel: 'Your name',
      emailLabel: 'Email address',
      categoryLabel: 'Category',
      subjectLabel: 'Subject (optional)',
      messageLabel: 'Message',
      submit: 'Send message',
      submitting: 'Sending…',
      success:
        'Thanks! Your message was sent. We’ll get back to you if needed.',
      error: 'Could not send your message. Please try again.',
      categories: {
        feedback: 'Feedback',
        suggestion: 'Suggestion',
        bug: 'Bug report',
        other: 'Other',
      },
    },
  },
  event: {
    joinCta: 'Join this hunt',
    downloadCta: 'Download Marvira',
    when: 'When',
    where: 'Where',
    how: 'How to join',
    howBody:
      'Install Marvira, open this invite link again, and start walking. Exact answers and GPS pins stay in the app — no spoilers here.',
    joinHint: 'Open in the app if installed, or download Marvira first.',
    leaderboardEmpty: 'Leaderboard opens when the hunt starts.',
    leaderboardLive: 'Scores update as players finish places.',
    leaderboardEnded: 'Final results — thanks for playing.',
    notFound: 'This hunt invite is unavailable.',
  },
  legal: {
    privacyTitle: 'Privacy Policy',
    termsTitle: 'Terms of Service',
    updated: 'Last updated: July 30, 2026',
    counselNote:
      'Draft for product and store readiness. Final legal review by counsel is required before go-live.',
  },
  footer: {
    brand: 'Marvira',
    line: 'GPS scavenger hunts for curious walkers.',
    privacy: 'Privacy',
    terms: 'Terms',
    support: 'Support',
  },
  seo: {
    homeTitle: 'Marvira — City scavenger hunts on foot',
    homeDesc:
      'Walk real places, answer challenges, and climb leaderboards. Marvira is a GPS scavenger-hunt app for players and organizers.',
    howTitle: 'How Marvira works',
    howDesc:
      'Find a hunt, walk to places, answer challenges, climb the leaderboard.',
    downloadTitle: 'Download Marvira',
    downloadDesc:
      'Get Marvira on the App Store or Google Play and start exploring.',
    createTitle: 'Create a scavenger hunt — Marvira',
    createDesc:
      'Design GPS hunts for events, tourism, venues, and schools. Download Marvira to create.',
    huntsTitle: 'Featured city hunts — Marvira',
    huntsDesc:
      'Explore sample scavenger hunts like Downtown Discovery and Golden Gate Adventure.',
    pressTitle: 'Press & partners — Marvira',
    pressDesc: 'What is Marvira for cities, venues, schools, and organizers.',
    supportTitle: 'Support & FAQ — Marvira',
    supportDesc: 'Help for players and organizers using Marvira.',
    privacyTitle: 'Privacy Policy — Marvira',
    privacyDesc: 'How Marvira collects, uses, and protects your information.',
    termsTitle: 'Terms of Service — Marvira',
    termsDesc: 'Terms governing use of the Marvira app and website.',
    keywords: [
      'scavenger hunt app',
      'GPS scavenger hunt',
      'city exploration game',
      'walking quiz',
      'outdoor team building',
      'San Francisco scavenger hunt',
      'create scavenger hunt',
    ],
  },
};

export type MarketingContent = typeof en;

export default en;
