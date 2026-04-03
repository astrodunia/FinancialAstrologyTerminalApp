export const PRODUCT_CATALOG = [
  {
    id: 'annual-letter',
    title: 'Annual Letter',
    iconKey: 'file-text',
    intro: 'A high-level yearly outlook on macro cycles, risk zones, and strategic positioning windows.',
    about:
      'Annual Letter gives you the yearly cycle map in plain language. It combines cross-asset timing context with directional bias so you can plan allocation, hedges, and risk posture before major shifts begin.',
    highlights: [
      'Yearly cycle map for major global markets',
      'Quarter-wise risk and opportunity zones',
      'Regime change watchlist and key inflection dates',
    ],
    audience: [
      'Portfolio managers',
      'Swing traders',
      'Macro allocators',
    ],
  },
  {
    id: 'live-signals',
    title: 'Live Signals',
    iconKey: 'radio',
    intro: 'Live tactical signal layer for timing-sensitive market windows.',
    about:
      'Live Signals focuses on short-horizon timing windows where volatility, breakout risk, or reversal probability is elevated. The feed is designed for users who need faster context updates during active sessions.',
    highlights: [
      'Real-time timing windows and alerts',
      'Risk-on and risk-off transition cues',
      'Practical guidance for execution discipline',
    ],
    audience: [
      'Intraday traders',
      'Short-term futures traders',
      'Active desk teams',
    ],
  },
  {
    id: 'daily-newsletter',
    title: 'Daily Newsletter',
    iconKey: 'newspaper',
    intro: 'A daily briefing with market timing notes, risk cues, and key watch points.',
    about:
      'Daily Newsletter translates timing research into concise daily actions. It helps you start each day with a clear market map: what matters, what to avoid, and where timing sensitivity is rising.',
    highlights: [
      'Morning market brief with timing focus',
      'Priority watchlist for the session',
      'Clear do-not-chase and caution notes',
    ],
    audience: [
      'Retail traders',
      'Advisory analysts',
      'Part-time market participants',
    ],
  },
  {
    id: 'global-commodities',
    title: 'Global Commodities',
    iconKey: 'globe',
    intro: 'Dedicated commodity-cycle research for metals, energy, and agricultural trends.',
    about:
      'Global Commodities tracks cyclical timing in hard and soft commodities, highlighting periods where trend acceleration, exhaustion, or sharp mean-reversion historically clusters.',
    highlights: [
      'Commodity-specific cycle windows',
      'Volatility and correlation behavior notes',
      'Cross-market spillover monitoring',
    ],
    audience: [
      'Commodity traders',
      'Macro strategists',
      'Hedging desks',
    ],
  },
  {
    id: 'two-stocks-pick',
    title: 'Two Stocks Pick',
    iconKey: 'briefcase',
    intro: 'A focused stock selection stream with timing-backed conviction picks.',
    about:
      'Two Stocks Pick delivers concentrated ideas instead of broad lists. Each pick is tied to timing context and risk structure to keep decisions clear and execution focused.',
    highlights: [
      'Two high-conviction setups per cycle window',
      'Entry, risk, and invalidation framework',
      'Follow-up notes for management decisions',
    ],
    audience: [
      'Focused equity traders',
      'Swing investors',
      'Concentrated portfolio builders',
    ],
  },
  {
    id: 'institutional-market-timing',
    title: 'Institutional Market Timing',
    iconKey: 'building',
    intro: 'Institution-grade timing research for disciplined exposure and risk management.',
    about:
      'Institutional Market Timing is built for process-driven teams that need robust cycle overlays. It emphasizes risk governance, scenario planning, and clear timing frameworks usable across desks.',
    highlights: [
      'Institutional timing framework and templates',
      'Scenario-based market path notes',
      'Allocation rhythm and exposure controls',
    ],
    audience: [
      'Fund managers',
      'Family offices',
      'Institutional risk teams',
    ],
  },
  {
    id: 'us-bond-market',
    title: 'U.S. Bond Market',
    iconKey: 'landmark',
    intro: 'Timing intelligence for treasury moves, yield structure, and rate-sensitive shifts.',
    about:
      'U.S. Bond Market product tracks yield-cycle behavior and timing pressure zones that influence duration decisions, portfolio hedge overlays, and defensive positioning.',
    highlights: [
      'Yield curve timing and stress periods',
      'Duration management windows',
      'Macro event sensitivity map',
    ],
    audience: [
      'Fixed-income desks',
      'Macro PMs',
      'Risk managers',
    ],
  },
  {
    id: 'futures-market',
    title: 'Futures Market',
    iconKey: 'trending-up',
    intro: 'Execution-oriented timing support for futures traders across major contracts.',
    about:
      'Futures Market provides a high-clarity structure for timing entries, exits, and position scaling in volatile contracts. It is optimized for speed, risk control, and consistent process.',
    highlights: [
      'Contract-wise timing windows',
      'Momentum and reversal watch zones',
      'Execution risk guardrails',
    ],
    audience: [
      'Index futures traders',
      'Commodity futures traders',
      'Active derivatives desks',
    ],
  },
];

export const getProductById = (productId) => PRODUCT_CATALOG.find((item) => item.id === productId) || PRODUCT_CATALOG[0];
