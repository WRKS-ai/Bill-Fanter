// Masterclass FAQs + course facts. Single source of truth so the visible
// accordion (MasterclassContent.astro) and the FAQPage / Course JSON-LD
// (masterclass/index.astro) always match. Google requires FAQ schema text to
// match the on-page text, so both render from this one array.
//
// FAQ copy is VERBATIM from the production masterclass page (no rewrites).

export const MASTERCLASS_FAQS: { q: string; a: string }[] = [
  {
    q: "What's your risk to reward per trade?",
    a: "I only take trades that have a 1:1 or 2:1 payout, meaning the potential reward is one to two times the risk I define before I enter.",
  },
  {
    q: "How much do you risk per trade?",
    a: "My average trade is 10 to 30 contracts, sized to a small, fixed share of my capital.",
  },
  {
    q: "If you're only risking a small amount, how do the returns add up?",
    a: "Options are leveraged. One contract controls 100 shares of stock, so a move in the underlying stock can produce a much larger percentage move in the option. That leverage works in both directions, up and down, which is why defined risk matters on every trade.",
  },
  {
    q: "Your returns look too good to be true, so what's the catch?",
    a: "The catch is risk. The same leverage that can move an option sharply in your favor can move just as sharply against you. An option can lose value fast, and you can lose the full premium on a trade. That is why the class focuses on defined risk and position sizing.",
  },
  {
    q: "How do you minimize losses?",
    a: "I use a stop loss of 20%-30% to stop out of a trade once it invalidates from my entry point.",
  },
  {
    q: "How much can I make?",
    a: "No one can promise a number. Trading options carries real risk and results vary. What the class gives you is the skill and discipline to trade with a plan. Your results depend on you and the market.",
  },
  {
    q: "How long did it take you to learn this?",
    a: "It took time and a lot of screen hours. That is why students start in a simulator with practice money, so they build skill with no capital at risk until they know what they are doing.",
  },
  {
    q: "What will I learn in your class?",
    a: "A lot. It is 12 hours of training across 6 sessions, covering options basics, reading charts, building a trading plan, and risk management, so you understand how the strategies work from the start.",
  },
  {
    q: "How do I know what to buy and when?",
    a: "The Masterclass comes with access to a Discord Community with buy/sell signals which are called out live while the market is open.",
  },
  {
    q: "What happens after the class ends?",
    a: 'With the "Learn on your own" or Foundations Masterclass, you can reach out to me any time via email and I will be there for you every step of the way. For students in the Masterclass Pro (Mastery), I am here for you in perpetuity for 1:1 coaching.',
  },
  {
    q: "Do I need prior experience?",
    a: "No! In fact, I'd prefer you didn't. That way I don't have to break any bad habits you might already have.",
  },
  {
    q: "How much time is required to be successful?",
    a: "At a minimum, you need to invest a couple of hours a week to become proficient in learning this new skill.",
  },
  {
    q: "How much do I need to get started?",
    a: "You'll need a brokerage account and $100-$200 a month for the software and indicators.",
  },
  {
    q: "How long does your Masterclass take to complete?",
    a: "It's 6 individual sessions which last approximately 2 hours a piece. All sessions are recorded for you to replay.",
  },
];

// Course facts for the Course JSON-LD node.
export const MASTERCLASS_COURSE = {
  name: 'Options Trading Masterclass',
  description:
    'Learn options trading with Bill Fanter across 6 live sessions. The Masterclass covers options basics, reading charts, building a trading plan, and risk management, with daily live trading sessions and lifetime access to the recordings.',
  url: '/masterclass',
  workload: 'PT12H', // 6 sessions, about 2 hours each
};
