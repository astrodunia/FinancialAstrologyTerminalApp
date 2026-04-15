import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Activity,
  BadgeCheck,
  BellRing,
  Briefcase,
  Building2,
  FileText,
  Gauge,
  Globe,
  Landmark,
  Mail,
  Newspaper,
  Orbit,
  Phone,
  Radar,
  Radio,
  ShieldAlert,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import BackButtonHeader from '../../components/BackButtonHeader';
import BottomTabs from '../../components/BottomTabs';
import { getProductById } from '../Products/productCatalog';

const ICON_MAP = {
  'file-text': FileText,
  radio: Radio,
  newspaper: Newspaper,
  globe: Globe,
  briefcase: Briefcase,
  building: Building2,
  landmark: Landmark,
  'trending-up': TrendingUp,
};

const PRODUCT_ACCENTS = {
  'annual-letter': { primary: '#3867F2', soft: '#E9EFFF' },
  'live-signals': { primary: '#0A8F7A', soft: '#DCF8F1' },
  'daily-newsletter': { primary: '#2472F4', soft: '#E5EEFF' },
  'global-commodities': { primary: '#CA6B2A', soft: '#FFF1E8' },
  'two-stocks-pick': { primary: '#6B4AF2', soft: '#EFE9FF' },
  'institutional-market-timing': { primary: '#007E88', soft: '#E1FBFE' },
  'us-bond-market': { primary: '#3252C8', soft: '#E8EDFF' },
  'futures-market': { primary: '#B4572E', soft: '#FFF0E8' },
};

const PRODUCT_HERO_IMAGES = {
  'annual-letter': 'https://rajeevprakash.com/wp-content/uploads/2026/01/AstroDunia-Annual-Letter-2026-cover.png',
  'live-signals': 'https://rajeevprakash.com/wp-content/uploads/2025/11/Live-signals-scaled.jpg',
  'daily-newsletter': 'https://rajeevprakash.com/wp-content/uploads/2026/01/Professional-Traders.webp',
  'global-commodities': 'https://rajeevprakash.com/wp-content/uploads/2026/01/global-health-spending.webp',
  'two-stocks-pick': 'https://rajeevprakash.com/wp-content/uploads/2026/02/SGX-Dividend-Stocks-.webp',
  'institutional-market-timing': 'https://rajeevprakash.com/wp-content/uploads/2026/01/InstitutionalMarket-1.webp',
  'us-bond-market': 'https://rajeevprakash.com/wp-content/uploads/2025/11/Intraday-Reversal-Zones-For-U.S.-Index-Futures-2-1.png',
  'futures-market':
    'https://rajeevprakash.com/wp-content/uploads/2024/10/DALL%C2%B7E-2024-10-14-09.48.41-A-simple-and-attractive-digital-chart-representing-stock-market-index-futures-with-minimalistic-upward-and-downward-trend-lines.-The-design-features-a.webp',
};

const PRODUCT_CTA_URLS = {
  'annual-letter': 'https://finance.rajeevprakash.com/products/annual-letter-2026/',
  'live-signals': 'https://finance.rajeevprakash.com/products/live-signals/',
  'daily-newsletter': 'https://finance.rajeevprakash.com/products/daily-newsletter/',
  'global-commodities': 'https://finance.rajeevprakash.com/products/global-commodities/',
  'two-stocks-pick': 'https://finance.rajeevprakash.com/products/two-stocks-pick/',
  'institutional-market-timing': 'https://finance.rajeevprakash.com/products/institutional-market-timing/',
  'us-bond-market': 'https://finance.rajeevprakash.com/financial-forecast/us-bond-market/',
  'futures-market': 'https://finance.rajeevprakash.com/markets/futures/',
};

const RESEARCHERS = [
  {
    id: 'rajeev',
    name: 'Mr. Rajeev Prakash',
    role: 'Founder · Financial and Personal Astrology',
    bio: '20+ years applying Vedic astrology to timing across metals, energy, FX, and equities.',
    image: 'https://finance.rajeevprakash.com/images/rajeev-prakash-agarwal.png',
  },
  {
    id: 'shashi',
    name: 'Mr. Shashi Prakash Agarwal',
    role: 'Technical Head · Platforms and Data',
    bio: 'B.Tech (CS) and MBA (Finance, NMIMS). Leads platforms, data pipelines, and delivery.',
    image: 'https://finance.rajeevprakash.com/images/shashi-prakash-agarwal.png',
  },
];

const LANDING_TESTIMONIALS = [
  {
    id: 'tm-1',
    quote: 'Time-stamped calls with clear risk levels help our desk execute with confidence.',
    by: 'Portfolio Manager, London',
  },
  {
    id: 'tm-2',
    quote: 'Planetary windows with breadth filters are surprisingly effective.',
    by: 'Proprietary Trader, New York',
  },
  {
    id: 'tm-3',
    quote: 'Management updates, partial booking, and trail rules keep discipline intact.',
    by: 'HNI Client, Mumbai',
  },
];

const INQUIRY_CONTACT = {
  phoneLabel: '+91-96699-19000',
  phoneLink: 'tel:+919669919000',
  emailLabel: 'pr@rajeevprakash.com',
  emailLink: 'mailto:pr@rajeevprakash.com',
};

const HOW_IT_WORKS = [
  {
    id: 'step-1',
    title: 'Track market cycles',
    description: 'Follow cycle overlays for indices, sectors, rates, and key risk assets.',
  },
  {
    id: 'step-2',
    title: 'Identify timing windows',
    description: 'Filter noise and focus on moments where setup quality and timing align.',
  },
  {
    id: 'step-3',
    title: 'Act with better confidence',
    description: 'Execute with clearer structure using signal strength, risk context, and timing bias.',
  },
];

const DEFAULT_LANDING = {
  heroTitle: 'Financial Astrology Terminal for smarter timing decisions',
  heroSubtitle:
    'Understand cycle structure, macro turning points, and risk windows with a premium workflow built for market professionals.',
  trustLine: 'Structured market timing intelligence for serious participants',
  cycleConfidenceText: 'Cycle confidence index +14%',
  primaryCta: 'Explore signals',
  secondaryCta: 'View market timing',
  valueCards: [
    { id: 'timing', title: 'Market timing insights', description: 'Identify high-sensitivity trend windows.', icon: Gauge },
    { id: 'cycles', title: 'Planetary cycle analysis', description: 'Use cycle rhythm with macro context.', icon: Orbit },
    { id: 'risk', title: 'Event risk signals', description: 'Track volatility clusters before major events.', icon: ShieldAlert },
    { id: 'rotation', title: 'Sector rotation tracking', description: 'Spot leadership shifts early.', icon: Activity },
    { id: 'macro', title: 'Macro cycle dashboard', description: 'Read regime transitions clearly.', icon: Radar },
    { id: 'personalized', title: 'Personalized guidance', description: 'Adapt signals to your style.', icon: Sparkles },
  ],
  loveLead: 'The experience feels clear, disciplined, and professional. Users gain timing structure without complexity overload.',
  lovePoints: [
    'Clarity: users stop second-guessing every short-term market move.',
    'Confidence: timing frameworks help reduce impulsive decisions.',
    'Structure: every market view is tied to measurable cycle context.',
    'Advantage: users feel prepared before major turning points develop.',
  ],
  finalCtaTitle: 'Unlock smarter market timing with premium cycle intelligence',
  finalCtaText: 'Build conviction with cleaner signals, better event awareness, and a disciplined decision framework.',
  finalCtaButton: 'Explore the terminal',
};

const TOPIC_LANDING = {
  'annual-letter': {
    heroTitle: 'Annual cycle roadmap for investors and traders',
    heroSubtitle: 'Get a high-conviction yearly map of macro shifts, turning points, and risk windows before the year unfolds.',
    trustLine: 'Year-ahead cycle planning with institutional clarity',
    primaryCta: 'Get annual letter',
    secondaryCta: 'View yearly cycle map',
    finalCtaButton: 'Unlock annual letter',
    valueCards: [
      { id: 'yr-map', title: 'Yearly market map', description: 'See quarter-by-quarter cycle pressure zones.', icon: Radar },
      { id: 'regime', title: 'Regime transition watch', description: 'Track when market behavior is likely to change.', icon: Activity },
      { id: 'allocation', title: 'Allocation rhythm', description: 'Plan risk-on and defensive phases with structure.', icon: Gauge },
      { id: 'calendar', title: 'Turning point calendar', description: 'Focus on dates where macro pivots often cluster.', icon: BellRing },
    ],
  },
  'live-signals': {
    heroTitle: 'Live timing signals for active market sessions',
    heroSubtitle: 'Receive real-time cycle-sensitive alerts to improve entry timing, exits, and intraday risk control.',
    cycleConfidenceText: 'Live timing confidence +18%',
    trustLine: 'Fast tactical alerts for timing-sensitive desks',
    primaryCta: 'Start live signals',
    secondaryCta: 'View live timing',
    finalCtaButton: 'Unlock live signals',
    valueCards: [
      { id: 'live-flow', title: 'Live signal flow', description: 'Monitor intraday timing cues as conditions evolve.', icon: Radio },
      { id: 'risk-switch', title: 'Risk-on and risk-off shifts', description: 'See quick transitions before volatility expands.', icon: ShieldAlert },
      { id: 'entry-zones', title: 'Entry and exit windows', description: 'Get cleaner execution zones during active sessions.', icon: TrendingUp },
      { id: 'alert-discipline', title: 'Discipline alerts', description: 'Reduce overtrading with context-led prompts.', icon: BellRing },
    ],
  },
  'daily-newsletter': {
    heroTitle: 'Daily market timing brief with actionable clarity',
    heroSubtitle: 'Start every session with a concise timing narrative, risk checklist, and top watch zones.',
    trustLine: 'Daily decision support in a concise premium brief',
    primaryCta: 'Subscribe daily newsletter',
    secondaryCta: 'View today briefing',
    finalCtaButton: 'Unlock daily brief',
    valueCards: [
      { id: 'daily-map', title: 'Session map', description: 'Know what matters before the opening bell.', icon: Newspaper },
      { id: 'priority-list', title: 'Priority watchlist', description: 'Focus on the most timing-sensitive assets first.', icon: Gauge },
      { id: 'risk-notes', title: 'Risk checkpoints', description: 'Avoid low-quality zones with clear caution flags.', icon: ShieldAlert },
      { id: 'setup-flow', title: 'Setup narrative', description: 'Translate cycle context into practical actions.', icon: Sparkles },
    ],
  },
  'global-commodities': {
    heroTitle: 'Commodity cycle intelligence across global markets',
    heroSubtitle: 'Track metals, energy, and agri timing windows with cycle structure and macro linkages in one view.',
    trustLine: 'Cross-commodity timing intelligence for macro desks',
    primaryCta: 'Explore commodities signals',
    secondaryCta: 'View commodity timing',
    finalCtaButton: 'Unlock commodities edge',
    valueCards: [
      { id: 'metal-cycles', title: 'Metals cycle windows', description: 'Track momentum and exhaustion phases in metals.', icon: Globe },
      { id: 'energy-zones', title: 'Energy pressure zones', description: 'Read event-driven timing shifts in energy markets.', icon: Activity },
      { id: 'agri-rhythm', title: 'Agri timing rhythm', description: 'Monitor seasonal and macro cycle interaction.', icon: BellRing },
      { id: 'spillover', title: 'Cross-asset spillover', description: 'Understand commodities impact on broader markets.', icon: Radar },
    ],
  },
  'two-stocks-pick': {
    heroTitle: 'Focused stock picks with timing-backed conviction',
    heroSubtitle: 'Follow concentrated equity setups where cycle alignment, trend structure, and risk are clearly defined.',
    trustLine: 'Concentrated equity ideas with timing discipline',
    primaryCta: 'Get two stocks pick',
    secondaryCta: 'View current picks',
    finalCtaButton: 'Unlock stock picks',
    valueCards: [
      { id: 'conviction', title: 'Two high-conviction picks', description: 'Stay focused on quality setups, not long lists.', icon: Briefcase },
      { id: 'entry-framework', title: 'Entry framework', description: 'Each pick includes timing window and setup logic.', icon: Gauge },
      { id: 'risk-framework', title: 'Risk and invalidation', description: 'Protect capital with clear risk boundaries.', icon: ShieldAlert },
      { id: 'follow-up', title: 'Follow-up updates', description: 'Track setup evolution after selection.', icon: Activity },
    ],
  },
  'institutional-market-timing': {
    heroTitle: 'Institution-grade market timing framework',
    heroSubtitle: 'Designed for process-driven teams that need robust cycle overlays, scenario views, and risk governance.',
    trustLine: 'Institution-level timing model for disciplined teams',
    primaryCta: 'Access institutional timing',
    secondaryCta: 'View institutional framework',
    finalCtaButton: 'Unlock institutional access',
    valueCards: [
      { id: 'overlay', title: 'Cycle overlay model', description: 'Apply timing layers across multi-asset portfolios.', icon: Building2 },
      { id: 'scenario', title: 'Scenario planning', description: 'Prepare for alternate market paths with confidence.', icon: Radar },
      { id: 'governance', title: 'Risk governance view', description: 'Use clear triggers for exposure control.', icon: ShieldAlert },
      { id: 'desk-sync', title: 'Desk-wide alignment', description: 'Improve strategy communication across teams.', icon: Activity },
    ],
  },
  'us-bond-market': {
    heroTitle: 'U.S. bond timing intelligence for rate-sensitive decisions',
    heroSubtitle: 'Read yield-cycle pressure zones and duration opportunities with a disciplined macro timing layer.',
    trustLine: 'Treasury and yield-cycle timing for fixed-income decisions',
    primaryCta: 'Explore U.S. bond market',
    secondaryCta: 'View bond timing',
    finalCtaButton: 'Unlock bond timing',
    valueCards: [
      { id: 'yield-curve', title: 'Yield curve timing', description: 'Track steepening and flattening pressure windows.', icon: Landmark },
      { id: 'duration', title: 'Duration decision zones', description: 'Time extension and reduction with better context.', icon: Gauge },
      { id: 'policy-risk', title: 'Policy event risk', description: 'Prepare for high-impact rate announcements.', icon: ShieldAlert },
      { id: 'bond-alerts', title: 'Bond market alerts', description: 'Get notified when timing bias changes quickly.', icon: BellRing },
    ],
  },
  'futures-market': {
    heroTitle: 'Execution-ready futures timing support',
    heroSubtitle: 'Plan entries, exits, and position scaling using cycle windows built for volatile contract behavior.',
    trustLine: 'High-speed timing framework for futures execution',
    primaryCta: 'Explore futures market',
    secondaryCta: 'View futures timing',
    finalCtaButton: 'Unlock futures edge',
    valueCards: [
      { id: 'contract-windows', title: 'Contract timing windows', description: 'Monitor key futures contracts with cycle bias.', icon: TrendingUp },
      { id: 'volatility-zones', title: 'Volatility escalation zones', description: 'Detect when risk expands ahead of moves.', icon: ShieldAlert },
      { id: 'scaling-model', title: 'Position scaling model', description: 'Stage entries and exits with discipline.', icon: Gauge },
      { id: 'intra-alerts', title: 'Intraday alert layer', description: 'Stay synced with fast session transitions.', icon: BellRing },
    ],
  },
};

const getTopicLandingConfig = (productId) => {
  const topic = TOPIC_LANDING[productId] || {};
  return {
    ...DEFAULT_LANDING,
    ...topic,
  };
};

const BUTTON_TEXT_OVERRIDES = {
  'Explore futures market': 'Explore futures',
  'Explore commodities signals': 'Explore commodities',
  'View commodity timing': 'Commodity timing',
  'Access institutional timing': 'Institutional timing',
  'View institutional framework': 'Institutional view',
  'Subscribe daily newsletter': 'Daily newsletter',
  'Explore U.S. bond market': 'Explore U.S. bonds',
  'Get two stocks pick': 'Two stocks pick',
};

const shortenLabel = (value, max = 24) => {
  const text = String(value || '').trim();
  if (BUTTON_TEXT_OVERRIDES[text]) {
    return BUTTON_TEXT_OVERRIDES[text];
  }

  if (text.length <= max) {
    return text;
  }

  const cut = text.slice(0, Math.max(0, max - 1)).trimEnd();
  const safeCut = cut.includes(' ') ? cut.slice(0, cut.lastIndexOf(' ')).trimEnd() : cut;
  return `${safeCut || cut}…`;
};

const ProductDetail = ({ navigation, route }) => {
  const product = getProductById(route?.params?.productId);
  const accent = PRODUCT_ACCENTS[product?.id] || PRODUCT_ACCENTS['annual-letter'];
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const styles = useMemo(() => createStyles(isCompact, accent), [isCompact, accent]);
  const ProductIcon = ICON_MAP[product?.iconKey] || FileText;
  const heroImage = PRODUCT_HERO_IMAGES[product?.id];
  const landing = getTopicLandingConfig(product?.id);
  const topicCtaUrl = PRODUCT_CTA_URLS[product?.id];
  const primaryCtaLabel = shortenLabel(landing.primaryCta, 24);
  const secondaryCtaLabel = shortenLabel(landing.secondaryCta, 24);
  const finalCtaLabel = shortenLabel(landing.finalCtaButton, 24);

  const reveal = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: -1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [reveal, floatAnim]);

  const floatingY = floatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [5, -5],
  });

  const parallaxY = scrollY.interpolate({
    inputRange: [0, 220],
    outputRange: [0, -22],
    extrapolate: 'clamp',
  });
  const heroVisualMotionStyle = heroImage ? null : { transform: [{ translateY: parallaxY }, { translateY: floatingY }] };

  const entrance = (index) => {
    const start = Math.min(index * 0.1, 0.86);
    const end = Math.min(start + 0.22, 1);
    return {
      opacity: reveal.interpolate({
        inputRange: [start, end],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          translateY: reveal.interpolate({
            inputRange: [start, end],
            outputRange: [24, 0],
            extrapolate: 'clamp',
          }),
        },
      ],
    };
  };

  const openTopicCta = async () => {
    if (!topicCtaUrl) {
      navigation.navigate('Plans');
      return;
    }

    try {
      await Linking.openURL(topicCtaUrl);
    } catch (error) {
      navigation.navigate('Plans');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <BackButtonHeader
        colors={{ border: '#D9E4F2', surfaceGlass: 'rgba(255,255,255,0.86)', textPrimary: '#1F2937' }}
        onPress={() => navigation.goBack()}
        containerStyle={styles.header}
      />

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.pageHeading, entrance(0)]}>
          <AppText style={styles.pageHeadingTitle}>Explore Product</AppText>
          <AppText style={styles.pageHeadingSubtitle}>{product.title}</AppText>
        </Animated.View>

        <Animated.View style={[styles.heroCard, entrance(1)]}>
          <Animated.View style={[styles.heroVisual, heroVisualMotionStyle]}>
            {heroImage ? (
              <View style={styles.heroImageFrame}>
                <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="contain" fadeDuration={0} />
              </View>
            ) : null}
            {!heroImage ? <View style={styles.heroOrbPrimary} /> : null}
            {!heroImage ? <View style={styles.heroOrbSecondary} /> : null}
            {!heroImage ? <View style={styles.heroOrbTertiary} /> : null}

            <View style={styles.heroVisualLabel}>
              <ProductIcon size={14} color={accent.primary} />
              <AppText style={styles.heroVisualLabelText}>{product.title}</AppText>
            </View>
            <View style={styles.heroVisualTrend}>
              <TrendingUp size={13} color="#0F766E" />
              <AppText style={styles.heroVisualTrendText}>{landing.cycleConfidenceText}</AppText>
            </View>
          </Animated.View>

          <View style={styles.trustPill}>
            <BadgeCheck size={13} color="#2451D0" />
            <AppText style={styles.trustText}>{landing.trustLine}</AppText>
          </View>

          <AppText style={styles.heroTitle}>{landing.heroTitle}</AppText>
          <AppText style={styles.heroSubtitle}>{landing.heroSubtitle}</AppText>

          <View style={styles.ctaRow}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={openTopicCta}
            >
              <AppText numberOfLines={1} ellipsizeMode="tail" style={styles.primaryButtonText}>
                {primaryCtaLabel}
              </AppText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('Overview')}
            >
              <AppText numberOfLines={1} ellipsizeMode="tail" style={styles.secondaryButtonText}>
                {secondaryCtaLabel}
              </AppText>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={[styles.sectionCard, entrance(2)]}>
          <AppText style={styles.sectionTitle}>Key value</AppText>
          <View style={styles.valueGrid}>
            {landing.valueCards.map((item) => {
              const Icon = item.icon;
              return (
                <View key={item.id} style={styles.valueCard}>
                  <View style={styles.valueIconWrap}>
                    <Icon size={15} color={accent.primary} />
                  </View>
                  <AppText style={styles.valueTitle}>{item.title}</AppText>
                  <AppText style={styles.valueDesc}>{item.description}</AppText>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View style={[styles.sectionCard, entrance(3)]}>
          <AppText style={styles.sectionTitle}>How it works</AppText>
          {HOW_IT_WORKS.map((step, index) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepIndexWrap}>
                <AppText style={styles.stepIndex}>{index + 1}</AppText>
              </View>
              <View style={styles.stepBody}>
                <AppText style={styles.stepTitle}>{step.title}</AppText>
                <AppText style={styles.stepDesc}>{step.description}</AppText>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.sectionCard, entrance(4)]}>
          <AppText style={styles.sectionTitle}>Why users love it</AppText>
          <AppText style={styles.sectionLead}>{landing.loveLead}</AppText>
          {landing.lovePoints.map((point) => (
            <View key={point} style={styles.loveRow}>
              <View style={styles.loveDot} />
              <AppText style={styles.loveText}>{point}</AppText>
            </View>
          ))}
          <View style={styles.topicHighlight}>
            <AppText style={styles.topicHighlightTitle}>Topic focus: {product.title}</AppText>
            <AppText style={styles.topicHighlightText}>{product.intro}</AppText>
          </View>
        </Animated.View>

        <Animated.View style={[styles.sectionCard, entrance(5)]}>
          <AppText style={styles.sectionTitle}>Meet our researchers</AppText>
          <View style={styles.researchersGrid}>
            {RESEARCHERS.map((person) => (
              <View key={person.id} style={styles.researcherCard}>
                <View style={styles.researcherImageWrap}>
                  <Image source={{ uri: person.image }} style={styles.researcherImage} resizeMode="cover" />
                </View>
                <AppText style={styles.researcherName}>{person.name}</AppText>
                <AppText style={styles.researcherRole}>{person.role}</AppText>
                <AppText style={styles.researcherBio}>{person.bio}</AppText>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.sectionCard, entrance(6)]}>
          <View style={styles.centerHead}>
            <View style={styles.centerChip}>
              <AppText numberOfLines={1} style={styles.centerChipText}>
                What clients say
              </AppText>
            </View>
            <AppText style={styles.sectionTitleCenter}>Testimonials</AppText>
          </View>
          <View style={styles.testimonialGrid}>
            {LANDING_TESTIMONIALS.map((item) => (
              <View key={item.id} style={styles.testimonialCard}>
                <AppText style={styles.testimonialQuote}>"{item.quote}"</AppText>
                <View style={styles.testimonialByRow}>
                  <Star size={14} color="#6B7280" />
                  <AppText style={styles.testimonialBy}>{item.by}</AppText>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.sectionCard, entrance(7)]}>
          <View style={styles.centerHead}>
            <View style={styles.centerChip}>
              <AppText style={styles.centerChipText}>Inquiries</AppText>
            </View>
            <AppText style={styles.sectionTitleCenter}>Talk to our team</AppText>
          </View>

          <View style={styles.inquiryCard}>
            <AppText style={styles.inquiryTitle}>Product and subscription inquiries</AppText>
            <AppText style={styles.inquirySub}>
              For pricing, enterprise access, or integration questions, reach us directly.
            </AppText>

            <View style={styles.contactRow}>
              <Pressable style={({ pressed }) => [styles.contactButton, pressed && styles.buttonPressed]} onPress={() => Linking.openURL(INQUIRY_CONTACT.phoneLink).catch(() => {})}>
                <Phone size={16} color="#111827" />
                <AppText style={styles.contactButtonText}>{INQUIRY_CONTACT.phoneLabel}</AppText>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.contactButton, pressed && styles.buttonPressed]} onPress={() => Linking.openURL(INQUIRY_CONTACT.emailLink).catch(() => {})}>
                <Mail size={16} color="#111827" />
                <AppText style={styles.contactButtonText}>{INQUIRY_CONTACT.emailLabel}</AppText>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.finalCta, entrance(8)]}>
          <AppText style={styles.finalCtaTitle}>{landing.finalCtaTitle}</AppText>
          <AppText style={styles.finalCtaText}>{landing.finalCtaText}</AppText>
          <Pressable
            style={({ pressed }) => [styles.finalCtaButton, pressed && styles.buttonPressed]}
            onPress={openTopicCta}
          >
            <AppText numberOfLines={1} ellipsizeMode="tail" style={styles.finalCtaButtonText}>{finalCtaLabel}</AppText>
          </Pressable>
        </Animated.View>
      </Animated.ScrollView>

      <BottomTabs navigation={navigation} />
    </View>
  );
};

const createStyles = (isCompact, accent) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#F4F7FF',
    },
    bgGlowTop: {
      position: 'absolute',
      top: -120,
      right: -80,
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: '#DCE8FF',
      opacity: 0.8,
    },
    bgGlowBottom: {
      position: 'absolute',
      bottom: 120,
      left: -100,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: '#E8F7FF',
      opacity: 0.72,
    },
    header: {
      gap: 16,
    },
    pageHeading: {
      marginTop: 0,
      marginBottom: 16,
    },
    pageHeadingTitle: {
      color: '#1E293B',
      fontSize: isCompact ? 20 : 22,
      lineHeight: isCompact ? 28 : 30,
      fontFamily: 'NotoSans-ExtraBold',
      letterSpacing: 0.2,
    },
    pageHeadingSubtitle: {
      color: '#5B6B84',
      fontSize: isCompact ? 13 : 14,
      lineHeight: isCompact ? 19 : 20,
      fontFamily: 'NotoSans-Medium',
      marginTop: 6,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 120,
      paddingTop: 0,
    },
    heroCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: '#DCE4F3',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: isCompact ? 14 : 16,
      marginBottom: 12,
      shadowColor: '#1E3A8A',
      shadowOpacity: 0.09,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    heroVisual: {
      height: isCompact ? 188 : 212,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#DFE8F8',
      overflow: 'hidden',
      backgroundColor: '#FDFEFF',
      marginBottom: 12,
      padding: 10,
      justifyContent: 'space-between',
    },
    heroImageFrame: {
      ...StyleSheet.absoluteFillObject,
      top: 8,
      right: 8,
      bottom: 8,
      left: 8,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E4EBF8',
    },
    heroImage: {
      width: '100%',
      height: '100%',
      backgroundColor: '#FFFFFF',
    },
    heroOrbPrimary: {
      position: 'absolute',
      width: 170,
      height: 170,
      borderRadius: 85,
      top: -44,
      right: -32,
      backgroundColor: accent.soft,
    },
    heroOrbSecondary: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      left: -24,
      bottom: -30,
      backgroundColor: '#E5F2FF',
    },
    heroOrbTertiary: {
      position: 'absolute',
      width: 68,
      height: 68,
      borderRadius: 34,
      right: 78,
      top: 24,
      backgroundColor: '#EAF5FF',
    },
    heroVisualLabel: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#DCE6F4',
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    heroVisualLabelText: {
      marginLeft: 6,
      color: '#1E2B46',
      fontSize: 11,
      lineHeight: 14,
      fontFamily: 'NotoSans-SemiBold',
    },
    heroVisualTrend: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3FAF7',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#CFEEDF',
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    heroVisualTrendText: {
      marginLeft: 6,
      color: '#1F5B4C',
      fontSize: 11,
      lineHeight: 14,
      fontFamily: 'NotoSans-Medium',
    },
    trustPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EDF3FF',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#D7E3FF',
      paddingHorizontal: 10,
      paddingVertical: 7,
      marginBottom: 10,
    },
    trustText: {
      marginLeft: 6,
      flex: 1,
      color: '#2A426B',
      fontSize: 11,
      lineHeight: 16,
      fontFamily: 'NotoSans-Medium',
    },
    heroTitle: {
      color: '#0F172A',
      fontSize: isCompact ? 22 : 24,
      lineHeight: isCompact ? 30 : 33,
      fontFamily: 'NotoSans-ExtraBold',
      marginBottom: 8,
    },
    heroSubtitle: {
      color: '#50607A',
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 21 : 23,
      fontFamily: 'NotoSans-Regular',
      marginBottom: 12,
    },
    ctaRow: {
      flexDirection: isCompact ? 'column' : 'row',
      alignItems: 'stretch',
      gap: 8,
    },
    primaryButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 14,
      backgroundColor: accent.primary,
      paddingHorizontal: 10,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isCompact ? 8 : 0,
    },
    secondaryButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D6E1F2',
      paddingHorizontal: 10,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.985 }],
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'NotoSans-SemiBold',
      textAlign: 'center',
      width: '100%',
    },
    secondaryButtonText: {
      color: '#21314D',
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'NotoSans-SemiBold',
      textAlign: 'center',
      width: '100%',
    },
    sectionCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#DCE4F3',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: isCompact ? 14 : 16,
      marginBottom: 12,
      shadowColor: '#1E3A8A',
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    sectionTitle: {
      color: '#111C30',
      fontSize: 18,
      lineHeight: 24,
      fontFamily: 'NotoSans-ExtraBold',
      marginBottom: 10,
    },
    valueGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    valueCard: {
      width: '48.3%',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#DFE8F7',
      backgroundColor: '#FBFDFF',
      padding: 11,
      marginBottom: 10,
    },
    valueIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#D9E5F8',
      backgroundColor: '#F1F6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    valueTitle: {
      color: '#1A2841',
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'NotoSans-SemiBold',
      marginBottom: 4,
    },
    valueDesc: {
      color: '#607088',
      fontSize: 11,
      lineHeight: 16,
      fontFamily: 'NotoSans-Regular',
    },
    stepRow: {
      flexDirection: 'row',
      marginBottom: 10,
      alignItems: 'flex-start',
    },
    stepIndexWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EDF3FF',
      borderWidth: 1,
      borderColor: '#D3E1FF',
      marginRight: 10,
      marginTop: 2,
    },
    stepIndex: {
      color: '#2952C8',
      fontSize: 13,
      lineHeight: 17,
      fontFamily: 'NotoSans-SemiBold',
    },
    stepBody: {
      flex: 1,
    },
    stepTitle: {
      color: '#15233B',
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'NotoSans-SemiBold',
      marginBottom: 3,
    },
    stepDesc: {
      color: '#5A6B83',
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    sectionLead: {
      color: '#5A6C86',
      fontSize: 12,
      lineHeight: 19,
      fontFamily: 'NotoSans-Regular',
      marginBottom: 8,
    },
    loveRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 7,
    },
    loveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: accent.primary,
      marginTop: 7,
      marginRight: 8,
    },
    loveText: {
      flex: 1,
      color: '#4F6078',
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    topicHighlight: {
      marginTop: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#DDE7FA',
      backgroundColor: '#F6F9FF',
      padding: 10,
    },
    topicHighlightTitle: {
      color: '#20304C',
      fontSize: 12,
      lineHeight: 17,
      fontFamily: 'NotoSans-SemiBold',
      marginBottom: 3,
    },
    topicHighlightText: {
      color: '#5B6E87',
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    researchersGrid: {
      gap: 10,
    },
    researcherCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#DCE5F7',
      backgroundColor: '#FBFDFF',
      padding: 12,
      alignItems: 'center',
    },
    researcherImageWrap: {
      width: isCompact ? 150 : 170,
      height: isCompact ? 150 : 170,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E1E8F8',
      backgroundColor: '#EEF3FF',
      marginBottom: 10,
    },
    researcherImage: {
      width: '100%',
      height: '100%',
    },
    researcherName: {
      color: '#14233B',
      fontSize: 16,
      lineHeight: 22,
      fontFamily: 'NotoSans-ExtraBold',
      textAlign: 'center',
      marginBottom: 3,
    },
    researcherRole: {
      color: '#4F6380',
      fontSize: 12,
      lineHeight: 17,
      fontFamily: 'NotoSans-Medium',
      textAlign: 'center',
      marginBottom: 8,
    },
    researcherBio: {
      color: '#3E5372',
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'NotoSans-Regular',
      textAlign: 'center',
    },
    centerHead: {
      alignItems: 'center',
      marginBottom: 10,
    },
    centerChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#D5DFEF',
      backgroundColor: '#F8FBFF',
      minWidth: 148,
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginBottom: 6,
      alignItems: 'center',
    },
    centerChipText: {
      color: '#4B5F7D',
      fontSize: 11,
      lineHeight: 15,
      fontFamily: 'NotoSans-Medium',
    },
    sectionTitleCenter: {
      color: '#111C30',
      fontSize: 18,
      lineHeight: 24,
      fontFamily: 'NotoSans-ExtraBold',
      textAlign: 'center',
    },
    testimonialGrid: {
      gap: 10,
    },
    testimonialCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#DCE5F7',
      backgroundColor: '#FBFDFF',
      padding: 12,
      gap: 10,
    },
    testimonialQuote: {
      color: '#111827',
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'NotoSans-SemiBold',
    },
    testimonialByRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    testimonialBy: {
      color: '#5B6D86',
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    inquiryCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#DCE5F7',
      backgroundColor: '#FBFDFF',
      padding: 12,
      gap: 8,
    },
    inquiryTitle: {
      color: '#111827',
      fontSize: 18,
      lineHeight: 24,
      fontFamily: 'NotoSans-ExtraBold',
    },
    inquirySub: {
      color: '#5B6D86',
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'NotoSans-Regular',
    },
    contactRow: {
      marginTop: 4,
      gap: 8,
    },
    contactButton: {
      minHeight: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#D3DEEF',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    contactButtonText: {
      color: '#111827',
      fontSize: 16,
      lineHeight: 21,
      fontFamily: 'NotoSans-SemiBold',
      flex: 1,
    },
    finalCta: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: '#D2DFF8',
      backgroundColor: '#EFF4FF',
      padding: 16,
      marginBottom: 8,
      shadowColor: '#1E3A8A',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 7 },
      elevation: 3,
    },
    finalCtaTitle: {
      color: '#0F1D33',
      fontSize: isCompact ? 19 : 21,
      lineHeight: isCompact ? 27 : 30,
      fontFamily: 'NotoSans-ExtraBold',
      marginBottom: 7,
    },
    finalCtaText: {
      color: '#4F6280',
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'NotoSans-Regular',
      marginBottom: 12,
    },
    finalCtaButton: {
      alignSelf: 'center',
      minWidth: '78%',
      borderRadius: 14,
      backgroundColor: '#1D4ED8',
      paddingHorizontal: 16,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#1E40AF',
      shadowColor: '#1E3A8A',
      shadowOpacity: 0.22,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 4,
    },
    finalCtaButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      lineHeight: 20,
      fontFamily: 'NotoSans-SemiBold',
      textAlign: 'center',
    },
  });

export default ProductDetail;
