import React, { useMemo, useState } from 'react';
import { Alert, Dimensions, Linking, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, UserCircle } from 'lucide-react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';

const fmt = (v, d = 2) => {
  if (v == null || !Number.isFinite(v)) return '--';
  return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};


const toNum = (v) => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};


const ASTRO_SCORE_MAP = {
  ascVitality: { weak: -8, neutral: 0, strong: 8 },
  eighthHouse: { weak: -6, neutral: 0, strong: 6 },
  sixthHouse: { weak: -5, neutral: 0, strong: 5 },
  twelfthHouse: { weak: -4, neutral: 0, strong: 4 },
  saturnTone: { weak: -4, neutral: 0, strong: 4 },
  marsRisk: { low: 4, moderate: 0, high: -6 },
  moonStability: { stable: 4, variable: -2 },
  dashaFlavor: { benefic: 5, neutral: 0, challenging: -5 },
};

function PageHeader({ navigation, styles, themeColors, title, subtitle }) {
  return (
    <View style={styles.header}>
      <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}><ArrowLeft size={16} color={themeColors.textPrimary} /></Pressable>
      <View style={styles.headerCenter}><AppText style={styles.title}>{title}</AppText><AppText style={styles.subtitle}>{subtitle}</AppText></View>
      <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}><UserCircle size={18} color={themeColors.textPrimary} /></Pressable>
    </View>
  );
}

function FooterCTAContact({ styles, openSite }) {
  const openContact = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Open failed', 'Unable to open link right now.');
    }
  };

  return (
    <>
      <View style={styles.banner}>
        <View>
          <AppText style={styles.bannerTitle}>Trade gold with discipline, not emotion</AppText>
          <AppText style={styles.bannerSub}>Get real-time entries, exits, and risk levels with daily context and timing.</AppText>
        </View>
        <View style={styles.bannerBtns}>
          <Pressable style={styles.bannerPrimary} onPress={() => openSite('https://finance.rajeevprakash.com/products/live-signals/')}><AppText style={styles.bannerPrimaryText}>Join Live Signals</AppText></Pressable>
          <Pressable style={styles.bannerGhost} onPress={() => openSite('https://finance.rajeevprakash.com/products/daily-newsletter/')}><AppText style={styles.bannerGhostText}>Daily Outlook</AppText></Pressable>
        </View>
      </View>

      <View style={styles.contactWrap}>
        <View style={styles.contactTag}><AppText style={styles.contactTagText}>Inquiries</AppText></View>
        <AppText style={styles.contactTitle}>Talk to our team</AppText>
        <View style={styles.contactCard}>
          <AppText style={styles.contactHead}>Product & Subscription Inquiries</AppText>
          <AppText style={styles.contactSub}>For pricing, enterprise access, or integration questions, reach us directly.</AppText>
          <View style={styles.contactRow}>
            <Pressable style={styles.contactItem} onPress={() => openContact('tel:+919669919000')}><AppText style={styles.contactItemText}>+91-96699-19000</AppText></Pressable>
            <Pressable style={styles.contactItem} onPress={() => openContact('mailto:pr@rajeevprakash.com')}><AppText style={styles.contactItemText}>pr@rajeevprakash.com</AppText></Pressable>
          </View>
        </View>
      </View>
    </>
  );
}

export function DividendPEToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [price, setPrice] = useState('100');
  const [dividend, setDividend] = useState('3');
  const [epsTTM, setEpsTTM] = useState('5');
  const [epsForward, setEpsForward] = useState('');

  const result = useMemo(() => {
    const p = toNum(price);
    const d = toNum(dividend);
    const eT = toNum(epsTTM);
    const eF = toNum(epsForward);
    if (p == null || d == null || p <= 0) return null;
    return {
      p,
      d,
      eT,
      peTTM: eT != null && eT > 0 ? p / eT : null,
      peForward: eF != null && eF > 0 ? p / eF : null,
      dividendYield: (d / p) * 100,
      earningsYield: eT != null && eT > 0 ? (eT / p) * 100 : null,
      payoutRatio: eT != null && eT > 0 ? (d / eT) * 100 : null,
      incomePer100: (100 / p) * d,
    };
  }, [price, dividend, epsTTM, epsForward]);

  const sensitivity = useMemo(() => {
    if (!result) return [];
    return Array.from({ length: 13 }, (_, i) => {
      const p = result.p * (0.7 + i * 0.05);
      return { p, y: (result.d / p) * 100 };
    });
  }, [result]);

  const chartW = Math.min(Dimensions.get('window').width - 72, 360);
  const chartH = 120;
  const yMax = Math.max(...sensitivity.map((s) => s.y), 1);
  const polyline = sensitivity
    .map((s, idx) => {
      const x = 10 + (idx / Math.max(sensitivity.length - 1, 1)) * (chartW - 20);
      const y = chartH - 10 - (s.y / yMax) * (chartH - 20);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Valuation</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Income</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Forward & TTM</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Dividend and P-E calculator</AppText>
          <AppText style={styles.sectionBody}>Enter price, annual dividend and EPS to compare dividend yield and valuation together.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Inputs</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Price per share</AppText><AppTextInput value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Annual dividend</AppText><AppTextInput value={dividend} onChangeText={setDividend} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>EPS (TTM)</AppText><AppTextInput value={epsTTM} onChangeText={setEpsTTM} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>EPS (Forward)</AppText><AppTextInput value={epsForward} onChangeText={setEpsForward} keyboardType="numeric" style={styles.input} placeholder="Optional" placeholderTextColor={themeColors.textMuted} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Results</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Dividend Yield</AppText><AppText style={styles.levelValue}>{result ? `${fmt(result.dividendYield)}%` : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>P/E (TTM)</AppText><AppText style={styles.levelValue}>{result?.peTTM == null ? '--' : fmt(result.peTTM)}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Earnings Yield</AppText><AppText style={styles.levelValue}>{result?.earningsYield == null ? '--' : `${fmt(result.earningsYield)}%`}</AppText></View>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>P/E (Forward)</AppText><AppText style={styles.levelValue}>{result?.peForward == null ? '--' : fmt(result.peForward)}</AppText></View>
            </View>
            <View style={styles.subCard}>
              <AppText style={styles.label}>Yield sensitivity vs price</AppText>
              <Svg width={chartW} height={chartH}>
                <Line x1="10" y1={chartH - 10} x2={chartW - 10} y2={chartH - 10} stroke={themeColors.border} strokeWidth="1" />
                <Line x1="10" y1="10" x2="10" y2={chartH - 10} stroke={themeColors.border} strokeWidth="1" />
                {polyline ? <Polyline points={polyline} fill="none" stroke="#1dc7a0" strokeWidth="2" /> : null}
              </Svg>
            </View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Payout ratio</AppText><AppText style={styles.levelValue}>{result?.payoutRatio == null ? '--' : `${fmt(result.payoutRatio)}%`}</AppText></View>
            <AppText style={styles.tipText}>{`Income per 100 invested: ${result ? fmt(result.incomePer100, 2) : '--'}`}</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function EfficientFrontierToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [ra, setRa] = useState('12');
  const [sa, setSa] = useState('20');
  const [rb, setRb] = useState('8');
  const [sb, setSb] = useState('15');
  const [corr, setCorr] = useState('0.3');

  const model = useMemo(() => {
    const aR = toNum(ra);
    const aS = toNum(sa);
    const bR = toNum(rb);
    const bS = toNum(sb);
    const c = toNum(corr);
    if (aR == null || aS == null || bR == null || bS == null || c == null) return null;
    if (aS <= 0 || bS <= 0 || c < -1 || c > 1) return null;

    const points = [];
    for (let w = 0; w <= 1.0001; w += 0.05) {
      const ret = (w * aR) + ((1 - w) * bR);
      const variance = (w * w * aS * aS) + (((1 - w) * (1 - w)) * bS * bS) + (2 * w * (1 - w) * aS * bS * c);
      const risk = Math.sqrt(Math.max(variance, 0));
      const sharpe = risk > 0 ? ret / risk : 0;
      points.push({ wA: w, wB: 1 - w, ret, risk, sharpe });
    }
    const optimal = points.reduce((best, p) => (p.sharpe > best.sharpe ? p : best), points[0]);
    return { aR, aS, bR, bS, points, optimal };
  }, [ra, sa, rb, sb, corr]);

  const w = Math.min(Dimensions.get('window').width - 72, 360);
  const h = 180;
  const xMin = Math.min(...(model?.points.map((p) => p.risk) || [0]));
  const xMax = Math.max(...(model?.points.map((p) => p.risk) || [1]));
  const yMin = Math.min(...(model?.points.map((p) => p.ret) || [0]));
  const yMax = Math.max(...(model?.points.map((p) => p.ret) || [1]));
  const px = (x) => 12 + ((x - xMin) / Math.max(xMax - xMin, 1e-9)) * (w - 24);
  const py = (y) => h - 12 - ((y - yMin) / Math.max(yMax - yMin, 1e-9)) * (h - 24);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Efficient Frontier</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Portfolio Optimization</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Modern Portfolio Theory</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Efficient Frontier calculator</AppText>
          <AppText style={styles.sectionBody}>Enter expected returns, volatility and correlation for two assets.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Asset Parameters</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Asset A return (%)</AppText><AppTextInput value={ra} onChangeText={setRa} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Asset A std dev (%)</AppText><AppTextInput value={sa} onChangeText={setSa} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Asset B return (%)</AppText><AppTextInput value={rb} onChangeText={setRb} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Asset B std dev (%)</AppText><AppTextInput value={sb} onChangeText={setSb} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Correlation</AppText><AppTextInput value={corr} onChangeText={setCorr} keyboardType="numeric" style={styles.input} /></View>
            </View>
            {!model && <AppText style={styles.warnText}>Use numeric values and keep correlation from -1 to 1.</AppText>}
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Efficient Frontier</AppText>
            <View style={styles.subCard}>
              <Svg width={w} height={h}>
                <Line x1="12" y1={h - 12} x2={w - 12} y2={h - 12} stroke={themeColors.border} strokeWidth="1" />
                <Line x1="12" y1="12" x2="12" y2={h - 12} stroke={themeColors.border} strokeWidth="1" />
                {model?.points.map((p, i) => <Circle key={`ef-${i}`} cx={px(p.risk)} cy={py(p.ret)} r="3.2" fill="#3b82f6" />)}
                {model && <Circle cx={px(model.aS)} cy={py(model.aR)} r="4.5" fill="#ff6b6b" />}
                {model && <Circle cx={px(model.bS)} cy={py(model.bR)} r="4.5" fill="#34d399" />}
                {model && <Circle cx={px(model.optimal.risk)} cy={py(model.optimal.ret)} r="5" fill="#f59e0b" />}
              </Svg>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Portfolio Optimization Results</AppText>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Expected return</AppText><AppText style={styles.levelValue}>{model ? `${fmt(model.optimal.ret)}%` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Portfolio risk</AppText><AppText style={styles.levelValue}>{model ? `${fmt(model.optimal.risk)}%` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Sharpe ratio</AppText><AppText style={styles.levelValue}>{model ? fmt(model.optimal.sharpe) : '--'}</AppText></View>
          </View>
          <AppText style={styles.tipText}>{model ? `Optimal allocation: ${fmt(model.optimal.wA * 100, 0)}% in Asset A, ${fmt(model.optimal.wB * 100, 0)}% in Asset B` : 'Optimal allocation: --'}</AppText>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function CorrelationCovarianceToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [nameA, setNameA] = useState('Asset A');
  const [nameB, setNameB] = useState('Asset B');
  const [periods, setPeriods] = useState([
    { a: '0.05', b: '0.04' },
    { a: '0.03', b: '0.02' },
    { a: '-0.02', b: '-0.01' },
    { a: '0.08', b: '0.06' },
    { a: '0.01', b: '0.02' },
  ]);
  const [submitted, setSubmitted] = useState(0);

  const updatePeriod = (idx, key, value) => {
    setPeriods((prev) => prev.map((row, i) => (i === idx ? { ...row, [key]: value } : row)));
  };

  const stats = useMemo(() => {
    if (submitted === 0) return null;
    const xs = periods.map((p) => toNum(p.a));
    const ys = periods.map((p) => toNum(p.b));
    if (xs.some((v) => v == null) || ys.some((v) => v == null) || xs.length < 2) return null;
    const n = xs.length;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    const centered = xs.map((x, i) => ({ x: x - meanX, y: ys[i] - meanY }));
    const cov = centered.reduce((acc, p) => acc + (p.x * p.y), 0) / (n - 1);
    const varX = centered.reduce((acc, p) => acc + (p.x * p.x), 0) / (n - 1);
    const varY = centered.reduce((acc, p) => acc + (p.y * p.y), 0) / (n - 1);
    const corr = (varX > 0 && varY > 0) ? cov / Math.sqrt(varX * varY) : null;
    let interpretation = 'Insufficient variance to infer relationship.';
    if (corr != null) {
      if (corr >= 0.7) interpretation = 'Strong positive correlation - assets move together.';
      else if (corr >= 0.3) interpretation = 'Moderate positive correlation.';
      else if (corr > -0.3) interpretation = 'Low correlation - diversification potential.';
      else if (corr > -0.7) interpretation = 'Moderate negative correlation.';
      else interpretation = 'Strong negative correlation - assets move opposite.';
    }
    return { xs, ys, cov, varX, varY, corr, interpretation };
  }, [periods, submitted]);

  const w = Math.min(Dimensions.get('window').width - 72, 360);
  const h = 180;
  const xMin = Math.min(...(stats?.xs || [0]), -0.03);
  const xMax = Math.max(...(stats?.xs || [0.09]), 0.09);
  const yMin = Math.min(...(stats?.ys || [-0.02]), -0.02);
  const yMax = Math.max(...(stats?.ys || [0.06]), 0.06);
  const px = (x) => 12 + ((x - xMin) / Math.max(xMax - xMin, 1e-9)) * (w - 24);
  const py = (y) => h - 12 - ((y - yMin) / Math.max(yMax - yMin, 1e-9)) * (h - 24);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Correlation</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Covariance</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Asset Relationships</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Correlation and Covariance calculator</AppText>
          <AppText style={styles.sectionBody}>Enter return series for both assets across matching periods and calculate.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Asset Returns</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Asset 1 name</AppText><AppTextInput value={nameA} onChangeText={setNameA} style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Asset 2 name</AppText><AppTextInput value={nameB} onChangeText={setNameB} style={styles.input} /></View>
            </View>
            {periods.map((row, idx) => (
              <View key={`p-${idx}`} style={styles.resultRow}>
                <AppText style={[styles.tipText, { width: 62 }]}>{`Period ${idx + 1}`}</AppText>
                <View style={{ flex: 1 }}><AppTextInput value={row.a} onChangeText={(v) => updatePeriod(idx, 'a', v)} keyboardType="numeric" style={styles.input} /></View>
                <View style={{ flex: 1 }}><AppTextInput value={row.b} onChangeText={(v) => updatePeriod(idx, 'b', v)} keyboardType="numeric" style={styles.input} /></View>
              </View>
            ))}
            <View style={styles.btnRow}>
              <Pressable style={styles.ghostBtn} onPress={() => setPeriods((prev) => [...prev, { a: '', b: '' }])}><AppText style={styles.ghostBtnText}>+ Add Period</AppText></Pressable>
              <Pressable style={styles.primaryBtn} onPress={() => setSubmitted((v) => v + 1)}><AppText style={styles.primaryBtnText}>Calculate</AppText></Pressable>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Results & Analysis</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Correlation</AppText><AppText style={styles.levelValue}>{stats?.corr == null ? '--' : fmt(stats.corr, 4)}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Covariance</AppText><AppText style={styles.levelValue}>{stats?.cov == null ? '--' : fmt(stats.cov, 4)}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>{`${nameA} variance`}</AppText><AppText style={styles.levelValue}>{stats ? fmt(stats.varX, 4) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>{`${nameB} variance`}</AppText><AppText style={styles.levelValue}>{stats ? fmt(stats.varY, 4) : '--'}</AppText></View>
            </View>
            <View style={styles.tipCard}><AppText style={styles.tipTitle}>Interpretation</AppText><AppText style={styles.tipText}>{stats ? stats.interpretation : 'Tap Calculate to compute metrics.'}</AppText></View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Asset Returns Scatter Plot</AppText>
          <View style={styles.subCard}>
            <Svg width={w} height={h}>
              <Line x1="12" y1={h - 12} x2={w - 12} y2={h - 12} stroke={themeColors.border} strokeWidth="1" />
              <Line x1="12" y1="12" x2="12" y2={h - 12} stroke={themeColors.border} strokeWidth="1" />
              {stats?.xs.map((x, idx) => <Circle key={`s-${idx}`} cx={px(x)} cy={py(stats.ys[idx])} r="3.5" fill="#3b82f6" />)}
            </Svg>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function SharpeSortinoToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [portfolioReturn, setPortfolioReturn] = useState('12');
  const [riskFreeRate, setRiskFreeRate] = useState('3');
  const [stdDev, setStdDev] = useState('15');
  const [downsideDev, setDownsideDev] = useState('10');

  const out = useMemo(() => {
    const rp = toNum(portfolioReturn);
    const rf = toNum(riskFreeRate);
    const sd = toNum(stdDev);
    const dd = toNum(downsideDev);
    if (rp == null || rf == null || sd == null || dd == null || sd <= 0 || dd <= 0) return null;

    const excess = rp - rf;
    const sharpe = excess / sd;
    const sortino = excess / dd;
    const sharpeScore = Math.max(0, Math.min(100, ((sharpe + 0.5) / 2.5) * 100));
    const sortinoScore = Math.max(0, Math.min(100, ((sortino + 0.5) / 2.5) * 100));

    let sharpeNote = 'Below average - limited compensation for risk.';
    if (sharpe >= 1.5) sharpeNote = 'Strong - favorable risk-adjusted return.';
    else if (sharpe >= 1) sharpeNote = 'Good - acceptable risk-adjusted performance.';
    else if (sharpe >= 0.5) sharpeNote = 'Average - can be improved with better risk control.';

    let sortinoNote = 'Below average - downside control can improve.';
    if (sortino >= 2) sortinoNote = 'Excellent downside-adjusted performance.';
    else if (sortino >= 1.2) sortinoNote = 'Strong downside-adjusted return.';
    else if (sortino >= 0.8) sortinoNote = 'Average downside-adjusted profile.';

    return { rp, rf, sd, dd, excess, sharpe, sortino, sharpeScore, sortinoScore, sharpeNote, sortinoNote };
  }, [portfolioReturn, riskFreeRate, stdDev, downsideDev]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Sharpe Ratio</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Sortino Ratio</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Risk-Adjusted Returns</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Portfolio Analysis</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Sharpe and Sortino calculator</AppText>
          <AppText style={styles.sectionBody}>Enter portfolio return, risk-free rate, volatility and downside deviation to compare risk-adjusted quality.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Portfolio Parameters</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Portfolio Return (%)</AppText><AppTextInput value={portfolioReturn} onChangeText={setPortfolioReturn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Risk-Free Rate (%)</AppText><AppTextInput value={riskFreeRate} onChangeText={setRiskFreeRate} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Standard Deviation (%)</AppText><AppTextInput value={stdDev} onChangeText={setStdDev} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Downside Deviation (%)</AppText><AppTextInput value={downsideDev} onChangeText={setDownsideDev} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Risk-Adjusted Performance</AppText>
            <View style={styles.subCard}>
              <View style={styles.resultRow}>
                <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <View style={{ width: '80%', height: 110, justifyContent: 'flex-end' }}>
                    <View style={{ height: `${out ? out.sharpeScore : 0}%`, backgroundColor: '#1dbb8b', borderRadius: 8 }} />
                  </View>
                  <AppText style={styles.tipText}>Sharpe Ratio</AppText>
                </View>
                <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <View style={{ width: '80%', height: 110, justifyContent: 'flex-end' }}>
                    <View style={{ height: `${out ? out.sortinoScore : 0}%`, backgroundColor: '#3b82f6', borderRadius: 8 }} />
                  </View>
                  <AppText style={styles.tipText}>Sortino Ratio</AppText>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Risk-Adjusted Return Analysis</AppText>
          <View style={[styles.levelBox, styles.levelRes]}>
            <AppText style={styles.levelLabel}>Sharpe Ratio</AppText>
            <AppText style={styles.levelValue}>{out ? fmt(out.sharpe, 2) : '--'}</AppText>
            <AppText style={styles.tipText}>{out ? out.sharpeNote : 'Provide valid inputs to compute.'}</AppText>
            <AppText style={styles.tipText}>{out ? `Excess Return: ${fmt(out.excess, 2)}% | Std Dev: ${fmt(out.sd, 2)}%` : ''}</AppText>
          </View>
          <View style={[styles.levelBox, styles.levelPivot]}>
            <AppText style={styles.levelLabel}>Sortino Ratio</AppText>
            <AppText style={styles.levelValue}>{out ? fmt(out.sortino, 2) : '--'}</AppText>
            <AppText style={styles.tipText}>{out ? out.sortinoNote : 'Provide valid inputs to compute.'}</AppText>
            <AppText style={styles.tipText}>{out ? `Excess Return: ${fmt(out.excess, 2)}% | Downside Dev: ${fmt(out.dd, 2)}%` : ''}</AppText>
          </View>
          <View style={styles.tipCard}>
            <AppText style={styles.tipTitle}>Ratio Comparison</AppText>
            <AppText style={styles.tipText}>
              {!out
                ? 'Compute both ratios to compare total-risk and downside-risk performance.'
                : out.sortino > out.sharpe
                  ? 'Sortino ratio is higher, suggesting better downside risk protection.'
                  : out.sortino < out.sharpe
                    ? 'Sharpe ratio is higher, indicating more balanced volatility profile.'
                    : 'Sharpe and Sortino are equal for the current input profile.'}
            </AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Sharpe & Sortino Ratio Calculator FAQ</AppText>
          <View style={styles.resultRow}>
            <View style={[styles.faqCard, { flex: 1 }]}>
              <AppText style={styles.tipTitle}>What is the Sharpe Ratio?</AppText>
              <AppText style={styles.tipText}>It measures excess return per unit of total volatility.</AppText>
            </View>
            <View style={[styles.faqCard, { flex: 1 }]}>
              <AppText style={styles.tipTitle}>What is the Sortino Ratio?</AppText>
              <AppText style={styles.tipText}>It measures excess return per unit of downside volatility only.</AppText>
            </View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.faqCard, { flex: 1 }]}>
              <AppText style={styles.tipTitle}>Which should I use?</AppText>
              <AppText style={styles.tipText}>Use both: Sharpe for overall risk, Sortino for downside sensitivity.</AppText>
            </View>
            <View style={[styles.faqCard, { flex: 1 }]}>
              <AppText style={styles.tipTitle}>Risk-free rate input</AppText>
              <AppText style={styles.tipText}>Use a short-term sovereign yield aligned with your return horizon.</AppText>
            </View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function AstrologyLongevityToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [name, setName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [nakshatra, setNakshatra] = useState('');

  const [ascVitality, setAscVitality] = useState('neutral');
  const [eighthHouse, setEighthHouse] = useState('neutral');
  const [sixthHouse, setSixthHouse] = useState('neutral');
  const [twelfthHouse, setTwelfthHouse] = useState('neutral');
  const [saturnTone, setSaturnTone] = useState('neutral');
  const [marsRisk, setMarsRisk] = useState('moderate');
  const [moonStability, setMoonStability] = useState('variable');
  const [dashaFlavor, setDashaFlavor] = useState('neutral');
  const [computed, setComputed] = useState(false);

  const out = useMemo(() => {
    const base = 48;
    const contributions = [
      { key: 'Ascendant vitality', value: ASTRO_SCORE_MAP.ascVitality[ascVitality] ?? 0 },
      { key: '8th house', value: ASTRO_SCORE_MAP.eighthHouse[eighthHouse] ?? 0 },
      { key: '6th (illness)', value: ASTRO_SCORE_MAP.sixthHouse[sixthHouse] ?? 0 },
      { key: '12th (loss/retreat)', value: ASTRO_SCORE_MAP.twelfthHouse[twelfthHouse] ?? 0 },
      { key: 'Saturn tone', value: ASTRO_SCORE_MAP.saturnTone[saturnTone] ?? 0 },
      { key: 'Mars risk', value: ASTRO_SCORE_MAP.marsRisk[marsRisk] ?? 0 },
      { key: 'Moon stability', value: ASTRO_SCORE_MAP.moonStability[moonStability] ?? 0 },
      { key: 'Dasa flavor', value: ASTRO_SCORE_MAP.dashaFlavor[dashaFlavor] ?? 0 },
    ];

    const inputBonus =
      (name.trim() ? 2 : 0) +
      (birthPlace.trim() ? 2 : 0) +
      (birthDate.trim() ? 3 : 0) +
      (birthTime.trim() ? 3 : 0) +
      (nakshatra.trim() ? 2 : 0);

    const scoreRaw = base + contributions.reduce((sum, c) => sum + c.value, 0) + inputBonus;
    const composite = Math.max(0, Math.min(100, Math.round(scoreRaw)));

    const summary =
      composite >= 70
        ? 'Higher composite score reflects steadier vitality indicators in this educational framework.'
        : composite >= 45
          ? 'Balanced profile. Improve input accuracy before interpretation.'
          : 'Lower composite score indicates mixed or stress-sensitive signals in this educational model.';

    return { composite, inputBonus, contributions, summary, tip: 'Educational tool only. Not medical advice.' };
  }, [ascVitality, birthDate, birthPlace, birthTime, dashaFlavor, eighthHouse, marsRisk, moonStability, nakshatra, name, saturnTone, sixthHouse, twelfthHouse]);

  const display = computed ? out : null;
  const ringRadius = 50;
  const ringStroke = 12;
  const c = 2 * Math.PI * ringRadius;
  const dashOffset = c * (1 - ((display?.composite || 0) / 100));

  const optBtn = (active, columns = 3) => ([
    active ? styles.primaryBtn : styles.ghostBtn,
    {
      flexBasis: columns === 2 ? '48.5%' : '31.5%',
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      paddingVertical: 10,
      minHeight: 40,
    },
  ]);
  const optTxt = (active) => (active ? styles.primaryBtnText : styles.ghostBtnText);
  const optionWrap = { flexDirection: 'row', flexWrap: 'wrap', gap: 6 };
  const renderTri = (label, value, setter, a, b, cOpt) => (
    <View style={styles.fieldFull}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={optionWrap}>
        <Pressable style={optBtn(value === a, 3)} onPress={() => setter(a)}><AppText numberOfLines={1} style={[optTxt(value === a), { textAlign: 'center', fontSize: 11 }]}>{a[0].toUpperCase() + a.slice(1)}</AppText></Pressable>
        <Pressable style={optBtn(value === b, 3)} onPress={() => setter(b)}><AppText numberOfLines={1} style={[optTxt(value === b), { textAlign: 'center', fontSize: 11 }]}>{b[0].toUpperCase() + b.slice(1)}</AppText></Pressable>
        <Pressable style={optBtn(value === cOpt, 3)} onPress={() => setter(cOpt)}><AppText numberOfLines={1} style={[optTxt(value === cOpt), { textAlign: 'center', fontSize: 11 }]}>{cOpt[0].toUpperCase() + cOpt.slice(1)}</AppText></Pressable>
      </View>
    </View>
  );

  const resetAll = () => {
    setName('');
    setBirthPlace('');
    setBirthDate('');
    setBirthTime('');
    setNakshatra('');
    setAscVitality('neutral');
    setEighthHouse('neutral');
    setSixthHouse('neutral');
    setTwelfthHouse('neutral');
    setSaturnTone('neutral');
    setMarsRisk('moderate');
    setMoonStability('variable');
    setDashaFlavor('neutral');
    setComputed(false);
  };

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Astrology</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Educational</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Not medical advice</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Astrology Longevity calculator</AppText>
          <AppText style={styles.sectionBody}>This mobile layout is optimized for single-hand input. Enter details, select conditions, then compute educational insights.</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Inputs (Educational, not medical)</AppText>
          <View style={styles.fieldFull}><AppText style={styles.label}>Name (optional)</AppText><AppTextInput value={name} onChangeText={setName} style={styles.input} placeholder="e.g. A Sharma" placeholderTextColor={themeColors.textMuted} /></View>
          <View style={styles.fieldFull}><AppText style={styles.label}>Birth Place (city)</AppText><AppTextInput value={birthPlace} onChangeText={setBirthPlace} style={styles.input} placeholder="e.g. Jaipur" placeholderTextColor={themeColors.textMuted} /></View>
          <View style={styles.resultRow}>
            <View style={{ flex: 1 }}><AppText style={styles.label}>Birth Date</AppText><AppTextInput value={birthDate} onChangeText={setBirthDate} style={styles.input} placeholder="dd-mm-yyyy" placeholderTextColor={themeColors.textMuted} /></View>
            <View style={{ flex: 1 }}><AppText style={styles.label}>Birth Time</AppText><AppTextInput value={birthTime} onChangeText={setBirthTime} style={styles.input} placeholder="--:--" placeholderTextColor={themeColors.textMuted} /></View>
          </View>
          <View style={styles.fieldFull}><AppText style={styles.label}>Nakshatra hint (optional)</AppText><AppTextInput value={nakshatra} onChangeText={setNakshatra} style={styles.input} placeholder="e.g. Ashwini / Moola" placeholderTextColor={themeColors.textMuted} /></View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>House Conditions</AppText>
          {renderTri('Ascendant vitality', ascVitality, setAscVitality, 'weak', 'neutral', 'strong')}
          {renderTri('8th house (longevity)', eighthHouse, setEighthHouse, 'weak', 'neutral', 'strong')}
          {renderTri('6th house (illness)', sixthHouse, setSixthHouse, 'weak', 'neutral', 'strong')}
          {renderTri('12th house (loss/retreat)', twelfthHouse, setTwelfthHouse, 'weak', 'neutral', 'strong')}
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Planetary Motifs & Timing</AppText>
          {renderTri('Saturn tone (endurance)', saturnTone, setSaturnTone, 'weak', 'neutral', 'strong')}
          {renderTri('Mars risk (heat/accident)', marsRisk, setMarsRisk, 'low', 'moderate', 'high')}
          <View style={styles.fieldFull}>
            <AppText style={styles.label}>Moon stability (moods/fluids)</AppText>
            <View style={optionWrap}>
              <Pressable style={optBtn(moonStability === 'stable', 2)} onPress={() => setMoonStability('stable')}><AppText style={optTxt(moonStability === 'stable')}>Stable</AppText></Pressable>
              <Pressable style={optBtn(moonStability === 'variable', 2)} onPress={() => setMoonStability('variable')}><AppText style={optTxt(moonStability === 'variable')}>Variable</AppText></Pressable>
            </View>
          </View>
          {renderTri('Dasa flavor', dashaFlavor, setDashaFlavor, 'benefic', 'neutral', 'challenging')}
          <View style={optionWrap}>
            <Pressable style={[styles.primaryBtn, { flexBasis: '64%', flexGrow: 1, alignItems: 'center', paddingVertical: 10 }]} onPress={() => setComputed(true)}><AppText style={styles.primaryBtnText}>Compute (Educational)</AppText></Pressable>
            <Pressable style={[styles.ghostBtn, { flexBasis: '34%', flexGrow: 1, alignItems: 'center', paddingVertical: 10 }]} onPress={resetAll}><AppText style={styles.ghostBtnText}>Reset</AppText></Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Longevity Learning Profile</AppText>
          <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 6 }}>
            <Svg width={150} height={150}>
              <Circle cx="75" cy="75" r={ringRadius} stroke={themeColors.border} strokeWidth={ringStroke} fill="none" />
              <Circle cx="75" cy="75" r={ringRadius} stroke="#f5b028" strokeWidth={ringStroke} fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={dashOffset} strokeLinecap="round" transform="rotate(-90 75 75)" />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <AppText style={styles.bigMetric}>{display ? `${display.composite}` : '--'}</AppText>
              <AppText style={styles.tipText}>Composite</AppText>
            </View>
          </View>

          <View style={styles.levelBox}>
            <AppText style={styles.levelLabel}>Composite score</AppText>
            <AppText style={styles.levelValue}>{display ? `${display.composite}/100` : '--/100'}</AppText>
            <AppText style={styles.tipText}>{display ? display.summary : 'Tap Compute to evaluate selected conditions.'}</AppText>
            <AppText style={styles.tipText}>{display ? display.tip : ''}</AppText>
          </View>

          <AppText style={styles.sectionTitle}>What moved your score</AppText>
          {(display?.contributions || []).map((item) => (
            <View key={item.key} style={styles.resultRow}>
              <AppText style={[styles.tipText, { flex: 1 }]}>{item.key}</AppText>
              <AppText style={[styles.tipText, { color: item.value >= 0 ? '#21c084' : '#ef4e4e' }]}>{item.value >= 0 ? `+${item.value}` : `${item.value}`}</AppText>
            </View>
          ))}
          <View style={styles.resultRow}>
            <AppText style={[styles.tipText, { flex: 1 }]}>Input completeness</AppText>
            <AppText style={[styles.tipText, { color: '#21c084' }]}>{display ? `+${display.inputBonus}` : '+0'}</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}






const computeEMI = (principal, annualRate, years) => {
  if (!Number.isFinite(principal) || !Number.isFinite(annualRate) || !Number.isFinite(years) || principal <= 0 || years <= 0) return null;
  const n = Math.round(years * 12);
  const r = (annualRate / 100) / 12;
  if (r === 0) {
    const emi = principal / n;
    return { emi, n, totalPayment: emi * n, totalInterest: 0 };
  }
  const emi = principal * r * (Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
  const totalPayment = emi * n;
  const totalInterest = totalPayment - principal;
  return { emi, n, totalPayment, totalInterest };
};

const yearlyAmortization = (principal, annualRate, years) => {
  const out = computeEMI(principal, annualRate, years);
  if (!out) return [];
  const rows = [];
  let bal = principal;
  const r = (annualRate / 100) / 12;
  for (let y = 1; y <= Math.ceil(years); y += 1) {
    let yPrincipal = 0;
    let yInterest = 0;
    let yPayment = 0;
    for (let m = 0; m < 12; m += 1) {
      if (bal <= 0) break;
      const interest = r === 0 ? 0 : bal * r;
      const principalPart = Math.min(out.emi - interest, bal);
      const pay = principalPart + interest;
      bal -= principalPart;
      yPrincipal += principalPart;
      yInterest += interest;
      yPayment += pay;
    }
    rows.push({ year: y, payment: yPayment, principal: yPrincipal, interest: yInterest, balance: Math.max(0, bal) });
    if (bal <= 0) break;
  }
  return rows;
};

export function EmergencyFundToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [rent, setRent] = useState('1200');
  const [food, setFood] = useState('450');
  const [utilities, setUtilities] = useState('220');
  const [debt, setDebt] = useState('150');
  const [insurance, setInsurance] = useState('180');
  const [transport, setTransport] = useState('200');
  const [misc, setMisc] = useState('150');
  const [months, setMonths] = useState('6');
  const [current, setCurrent] = useState('2000');
  const [buildMonths, setBuildMonths] = useState('12');

  const out = useMemo(() => {
    const vals = {
      rent: toNum(rent) || 0,
      food: toNum(food) || 0,
      utilities: toNum(utilities) || 0,
      debt: toNum(debt) || 0,
      insurance: toNum(insurance) || 0,
      transport: toNum(transport) || 0,
      misc: toNum(misc) || 0,
    };
    const monthly = Object.values(vals).reduce((a, b) => a + b, 0);
    const m = Math.max(1, toNum(months) || 6);
    const now = Math.max(0, toNum(current) || 0);
    const build = Math.max(1, toNum(buildMonths) || 12);
    const target = monthly * m;
    const shortfall = Math.max(0, target - now);
    const coveredNow = monthly > 0 ? now / monthly : 0;
    const requiredMonthly = shortfall / build;
    const progress = target > 0 ? Math.min(100, (now / target) * 100) : 0;
    return { vals, monthly, target, shortfall, coveredNow, requiredMonthly, progress, build };
  }, [rent, food, utilities, debt, insurance, transport, misc, months, current, buildMonths]);

  const circleR = 44;
  const C = 2 * Math.PI * circleR;
  const off = C * (1 - (out.progress / 100));

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Personal finance</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Liquidity</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Safety</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Emergency Fund calculator</AppText>
          <AppText style={styles.sectionBody}>Add monthly essentials, choose coverage months, and compare current savings vs target.</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Monthly essentials</AppText>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Rent / Mortgage ($)</AppText><AppTextInput value={rent} onChangeText={setRent} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Food & groceries ($)</AppText><AppTextInput value={food} onChangeText={setFood} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Utilities ($)</AppText><AppTextInput value={utilities} onChangeText={setUtilities} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Debt minimums ($)</AppText><AppTextInput value={debt} onChangeText={setDebt} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Insurance ($)</AppText><AppTextInput value={insurance} onChangeText={setInsurance} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Transportation ($)</AppText><AppTextInput value={transport} onChangeText={setTransport} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Miscellaneous ($)</AppText><AppTextInput value={misc} onChangeText={setMisc} keyboardType="numeric" style={styles.input} /></View>
          </View>
          <View style={styles.levelBox}><AppText style={styles.levelLabel}>Total monthly essentials</AppText><AppText style={styles.levelValue}>{`$${fmt(out.monthly, 2)}`}</AppText></View>
          <View style={styles.resultRow}>
            <View style={styles.field}><AppText style={styles.label}>Months of coverage</AppText><AppTextInput value={months} onChangeText={setMonths} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Current emergency savings ($)</AppText><AppTextInput value={current} onChangeText={setCurrent} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Months to build goal</AppText><AppTextInput value={buildMonths} onChangeText={setBuildMonths} keyboardType="numeric" style={styles.input} /></View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Target fund</AppText><AppText style={styles.levelValue}>{`$${fmt(out.target, 2)}`}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Shortfall</AppText><AppText style={styles.levelValue}>{`$${fmt(out.shortfall, 2)}`}</AppText></View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Monthly contribution</AppText><AppText style={styles.levelValue}>{`$${fmt(out.requiredMonthly, 2)}`}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Months covered now</AppText><AppText style={styles.levelValue}>{`${fmt(out.coveredNow, 1)} mo`}</AppText></View>
          </View>
          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <Svg width={130} height={130}>
              <Circle cx="65" cy="65" r={circleR} stroke={themeColors.border} strokeWidth="12" fill="none" />
              <Circle cx="65" cy="65" r={circleR} stroke="#1dc7a0" strokeWidth="12" fill="none" strokeDasharray={`${C} ${C}`} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 65 65)" />
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center', top: 48 }}>
              <AppText style={styles.levelValue}>{`${fmt(out.progress, 1)}%`}</AppText>
              <AppText style={styles.tipText}>Coverage progress</AppText>
            </View>
          </View>
          <AppText style={styles.tipText}>{`Savings timeline to goal: ${out.build} months`}</AppText>
        </View>
        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function MortgageToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [loan, setLoan] = useState('300000');
  const [rate, setRate] = useState('6');
  const [years, setYears] = useState('30');
  const [taxes, setTaxes] = useState('3600');
  const [ins, setIns] = useState('1200');
  const [pmiPct, setPmiPct] = useState('0');
  const [hoa, setHoa] = useState('0');

  const out = useMemo(() => {
    const p = toNum(loan);
    const r = toNum(rate);
    const y = toNum(years);
    const t = (toNum(taxes) || 0) / 12;
    const i = (toNum(ins) || 0) / 12;
    const pmi = p && toNum(pmiPct) ? (p * (toNum(pmiPct) / 100)) / 12 : 0;
    const h = toNum(hoa) || 0;
    const emi = computeEMI(p, r, y);
    if (!emi) return null;
    const totalMonthly = emi.emi + t + i + pmi + h;
    return { ...emi, pi: emi.emi, taxM: t, insM: i, pmiM: pmi, hoaM: h, totalMonthly };
  }, [loan, rate, years, taxes, ins, pmiPct, hoa]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}><AppText style={styles.sectionTitle}>How to use the Mortgage calculator</AppText><AppText style={styles.sectionBody}>Enter loan and cost components (tax, insurance, PMI, HOA) to get a realistic monthly estimate.</AppText></View>
        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Inputs</AppText>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Loan amount ($)</AppText><AppTextInput value={loan} onChangeText={setLoan} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Annual interest rate (%)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Loan term (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Annual property taxes ($)</AppText><AppTextInput value={taxes} onChangeText={setTaxes} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Annual homeowners insurance ($)</AppText><AppTextInput value={ins} onChangeText={setIns} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>PMI (% loan/year)</AppText><AppTextInput value={pmiPct} onChangeText={setPmiPct} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>HOA monthly ($)</AppText><AppTextInput value={hoa} onChangeText={setHoa} keyboardType="numeric" style={styles.input} /></View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Results</AppText>
          <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Total monthly payment</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.totalMonthly, 2)}` : '--'}</AppText></View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Principal & interest</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.pi, 2)}` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Property tax</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.taxM, 2)}` : '--'}</AppText></View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Insurance</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.insM, 2)}` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>PMI + HOA</AppText><AppText style={styles.levelValue}>{out ? `$${fmt((out.pmiM + out.hoaM), 2)}` : '--'}</AppText></View>
          </View>
          <AppText style={styles.tipText}>{out ? `Total interest over loan life: $${fmt(out.totalInterest, 2)}` : ''}</AppText>
        </View>
        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function LoanSummaryCard({ title, principal, rate, years, styles }) {
  const out = useMemo(() => computeEMI(principal, rate, years), [principal, rate, years]);
  const rows = useMemo(() => yearlyAmortization(principal, rate, years), [principal, rate, years]);
  return (
    <View style={styles.card}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <View style={styles.resultRow}>
        <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>EMI / month</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.emi, 0)}` : '--'}</AppText></View>
        <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Total interest</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.totalInterest, 0)}` : '--'}</AppText></View>
      </View>
      <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Total payment</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.totalPayment, 0)}` : '--'}</AppText></View>
      <AppText style={styles.tipTitle}>Amortization (Yearly)</AppText>
      {rows.slice(0, 8).map((r) => (
        <View key={`${title}-${r.year}`} style={styles.resultRow}>
          <AppText style={[styles.tipText, { flex: 1 }]}>{`Y${r.year}`}</AppText>
          <AppText style={[styles.tipText, { flex: 1 }]}>{`P: $${fmt(r.payment, 0)}`}</AppText>
          <AppText style={[styles.tipText, { flex: 1 }]}>{`Bal: $${fmt(r.balance, 0)}`}</AppText>
        </View>
      ))}
    </View>
  );
}

export function EMIToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [loan, setLoan] = useState('550000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('5');
  const p = toNum(loan) || 0;
  const r = toNum(rate) || 0;
  const y = toNum(years) || 0;
  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}><AppText style={styles.sectionTitle}>EMI Calculator</AppText><AppText style={styles.sectionBody}>Enter loan amount, annual rate, and tenure. Use yearly amortization to compare options.</AppText></View>
        <View style={styles.card}>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Loan amount</AppText><AppTextInput value={loan} onChangeText={setLoan} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Interest rate (p.a.)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Tenure (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
          </View>
        </View>
        <LoanSummaryCard title="EMI Engine" principal={p} rate={r} years={y} styles={styles} />
        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function CarLoanEMIToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [carPrice, setCarPrice] = useState('45000');
  const [down, setDown] = useState('5000');
  const [rate, setRate] = useState('7.5');
  const [years, setYears] = useState('5');
  const principal = Math.max(0, (toNum(carPrice) || 0) - (toNum(down) || 0));
  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}><AppText style={styles.sectionTitle}>Car Loan EMI Calculator</AppText><AppText style={styles.sectionBody}>Estimate monthly car loan EMI, interest burden, and yearly repayment breakdown.</AppText></View>
        <View style={styles.card}>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Car price</AppText><AppTextInput value={carPrice} onChangeText={setCarPrice} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Down payment</AppText><AppTextInput value={down} onChangeText={setDown} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Interest rate (p.a.)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Tenure (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
          </View>
          <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Loan amount</AppText><AppText style={styles.levelValue}>{`$${fmt(principal, 0)}`}</AppText></View>
        </View>
        <LoanSummaryCard title="Car Loan Amortization" principal={principal} rate={toNum(rate) || 0} years={toNum(years) || 0} styles={styles} />
        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function HomeLoanEMIToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [homePrice, setHomePrice] = useState('650000');
  const [down, setDown] = useState('130000');
  const [rate, setRate] = useState('6.75');
  const [years, setYears] = useState('25');
  const price = toNum(homePrice) || 0;
  const downAmt = toNum(down) || 0;
  const principal = Math.max(0, price - downAmt);
  const ltv = price > 0 ? (principal / price) * 100 : 0;
  const downPct = price > 0 ? (downAmt / price) * 100 : 0;

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}><AppText style={styles.sectionTitle}>Home Loan EMI Calculator</AppText><AppText style={styles.sectionBody}>Plan long-term home loan repayment with affordability indicators and amortization.</AppText></View>
        <View style={styles.card}>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Home price</AppText><AppTextInput value={homePrice} onChangeText={setHomePrice} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Down payment</AppText><AppTextInput value={down} onChangeText={setDown} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Interest rate (p.a.)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Tenure (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Down payment %</AppText><AppText style={styles.levelValue}>{`${fmt(downPct, 2)}%`}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>LTV</AppText><AppText style={styles.levelValue}>{`${fmt(ltv, 2)}%`}</AppText></View>
          </View>
        </View>
        <LoanSummaryCard title="Home Loan Amortization" principal={principal} rate={toNum(rate) || 0} years={toNum(years) || 0} styles={styles} />
        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function HouseAffordabilityToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [income, setIncome] = useState('150000');
  const [debts, setDebts] = useState('500');
  const [rate, setRate] = useState('6.75');
  const [years, setYears] = useState('30');
  const [down, setDown] = useState('60000');
  const [taxesM, setTaxesM] = useState('600');
  const [insuranceM, setInsuranceM] = useState('120');
  const [hoaM, setHoaM] = useState('75');
  const [pmiAnnual, setPmiAnnual] = useState('0.7');
  const [backendCap, setBackendCap] = useState('36');
  const [frontCapOn, setFrontCapOn] = useState(true);

  const out = useMemo(() => {
    const grossY = toNum(income) || 0;
    const grossM = grossY / 12;
    const debtM = toNum(debts) || 0;
    const r = toNum(rate) || 0;
    const y = Math.max(1, toNum(years) || 30);
    const dp = Math.max(0, toNum(down) || 0);
    const t = Math.max(0, toNum(taxesM) || 0);
    const i = Math.max(0, toNum(insuranceM) || 0);
    const h = Math.max(0, toNum(hoaM) || 0);
    const pmiPct = Math.max(0, toNum(pmiAnnual) || 0);
    const backCap = Math.max(1, toNum(backendCap) || 36);

    const frontCap = frontCapOn ? 28 : 100;
    const frontAllowed = grossM * (frontCap / 100);
    const backAllowed = Math.max(0, (grossM * (backCap / 100)) - debtM);
    const pitiaCap = Math.min(frontAllowed, backAllowed);

    let loanLow = 0;
    let loanHigh = 5_000_000;
    for (let k = 0; k < 40; k += 1) {
      const mid = (loanLow + loanHigh) / 2;
      const emi = computeEMI(mid, r, y);
      if (!emi) break;
      const pmi = (mid * (pmiPct / 100)) / 12;
      const pitia = emi.emi + t + i + h + pmi;
      if (pitia > pitiaCap) loanHigh = mid;
      else loanLow = mid;
    }

    const loan = loanLow;
    const home = loan + dp;
    const emi = computeEMI(loan, r, y);
    const pmi = (loan * (pmiPct / 100)) / 12;
    const pitia = (emi?.emi || 0) + t + i + h + pmi;
    const dtiBack = grossM > 0 ? ((debtM + pitia) / grossM) * 100 : 0;
    const ltv = home > 0 ? (loan / home) * 100 : 0;

    return {
      grossM, loan, home, pitia, frontAllowed, backAllowed, dtiBack, ltv,
      pAndI: emi?.emi || 0, taxes: t, insurance: i, hoa: h, pmi,
    };
  }, [income, debts, rate, years, down, taxesM, insuranceM, hoaM, pmiAnnual, backendCap, frontCapOn]);

  const presets = {
    '30-year': () => setYears('30'),
    '15-year': () => setYears('15'),
    'rate -0.25': () => setRate(String((toNum(rate) || 0) - 0.25)),
    'rate +0.25': () => setRate(String((toNum(rate) || 0) + 0.25)),
    'Disable 28% cap': () => setFrontCapOn(false),
  };

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}><AppText style={styles.sectionTitle}>How to use the House Affordability calculator</AppText><AppText style={styles.sectionBody}>Estimate a safe home budget based on income, debts, policy caps, and monthly housing costs.</AppText></View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Quick presets</AppText>
          <View style={styles.heroTagRow}>
            {Object.keys(presets).map((k) => (
              <Pressable key={k} style={styles.ghostBtn} onPress={presets[k]}><AppText style={styles.ghostBtnText}>{k}</AppText></Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Income & Debts</AppText>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Annual gross income</AppText><AppTextInput value={income} onChangeText={setIncome} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Monthly debts</AppText><AppTextInput value={debts} onChangeText={setDebts} keyboardType="numeric" style={styles.input} /></View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Loan & Down Payment</AppText>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Rate % APR</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Term (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Down payment ($)</AppText><AppTextInput value={down} onChangeText={setDown} keyboardType="numeric" style={styles.input} /></View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Monthly Costs & Policy Caps</AppText>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Property tax (monthly)</AppText><AppTextInput value={taxesM} onChangeText={setTaxesM} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Insurance (monthly)</AppText><AppTextInput value={insuranceM} onChangeText={setInsuranceM} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>HOA (monthly)</AppText><AppTextInput value={hoaM} onChangeText={setHoaM} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>PMI annual %</AppText><AppTextInput value={pmiAnnual} onChangeText={setPmiAnnual} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Back-end DTI cap %</AppText><AppTextInput value={backendCap} onChangeText={setBackendCap} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}>
              <AppText style={styles.label}>Front-end 28% cap</AppText>
              <Pressable style={frontCapOn ? styles.primaryBtn : styles.ghostBtn} onPress={() => setFrontCapOn((v) => !v)}><AppText style={frontCapOn ? styles.primaryBtnText : styles.ghostBtnText}>{frontCapOn ? 'On' : 'Off'}</AppText></Pressable>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Results</AppText>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Maximum home price</AppText><AppText style={styles.levelValue}>{`$${fmt(out.home, 2)}`}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Estimated loan amount</AppText><AppText style={styles.levelValue}>{`$${fmt(out.loan, 2)}`}</AppText></View>
          </View>
          <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Monthly PITIA</AppText><AppText style={styles.levelValue}>{`$${fmt(out.pitia, 2)}`}</AppText></View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Front-end cap</AppText><AppText style={styles.levelValue}>{`$${fmt(out.frontAllowed, 2)}`}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Back-end cap</AppText><AppText style={styles.levelValue}>{`$${fmt(out.backAllowed, 2)}`}</AppText></View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Back-end DTI</AppText><AppText style={styles.levelValue}>{`${fmt(out.dtiBack, 2)}%`}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>LTV</AppText><AppText style={styles.levelValue}>{`${fmt(out.ltv, 2)}%`}</AppText></View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function SavingsRunwayToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [balance, setBalance] = useState('300000');
  const [withdrawal, setWithdrawal] = useState('2000');
  const [otherIncome, setOtherIncome] = useState('0');
  const [retAnnual, setRetAnnual] = useState('5');
  const [inflation, setInflation] = useState('3');
  const [fee, setFee] = useState('0.4');
  const [horizon, setHorizon] = useState('40');
  const [inflAdj, setInflAdj] = useState(true);

  const out = useMemo(() => {
    let bal = Math.max(0, toNum(balance) || 0);
    const wd = Math.max(0, toNum(withdrawal) || 0);
    const inc = Math.max(0, toNum(otherIncome) || 0);
    const yrs = Math.max(1, toNum(horizon) || 40);
    const n = yrs * 12;
    const rNom = (toNum(retAnnual) || 0) / 100;
    const inf = (toNum(inflation) || 0) / 100;
    const fees = (toNum(fee) || 0) / 100;
    const rReal = inflAdj ? (((1 + rNom) / (1 + inf)) - 1) : rNom;
    const rMonth = (rReal - fees) / 12;

    const points = [{ m: 0, v: bal }];
    let depletion = null;
    for (let m = 1; m <= n; m += 1) {
      bal = (bal * (1 + rMonth)) - wd + inc;
      if (bal < 0 && depletion == null) depletion = m;
      bal = Math.max(0, bal);
      if (m % 12 === 0) points.push({ m, v: bal });
      if (bal <= 0 && depletion != null) {
        for (let k = m + 1; k <= n; k += 12) points.push({ m: k, v: 0 });
        break;
      }
    }

    return { points, ending: bal, depletion, n };
  }, [balance, withdrawal, otherIncome, retAnnual, inflation, fee, horizon, inflAdj]);

  const w = Math.min(Dimensions.get('window').width - 72, 360);
  const h = 190;
  const horizonYears = Math.max(1, toNum(horizon) || 40);
  const leftPad = 34;
  const rightPad = 10;
  const topPad = 10;
  const bottomPad = 24;
  const plotW = w - leftPad - rightPad;
  const plotH = h - topPad - bottomPad;
  const ymax = Math.max(...out.points.map((p) => p.v), 1);

  const toX = (year) => leftPad + (year / horizonYears) * plotW;
  const toY = (value) => h - bottomPad - (value / ymax) * plotH;
  const line = out.points.map((p) => `${toX(p.m / 12)},${toY(p.v)}`).join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((k) => ({ value: ymax * k, y: toY(ymax * k) }));
  const xStep = horizonYears <= 10 ? 1 : horizonYears <= 20 ? 2 : 5;
  const xTicks = [];
  for (let x = 0; x <= horizonYears; x += xStep) xTicks.push(x);
  const depYear = out.depletion ? out.depletion / 12 : null;
  const depPoint = depYear != null ? { x: toX(depYear), y: toY(0) } : null;

  const status = out.depletion ? `Depletes in ${Math.floor(out.depletion / 12)}y ${out.depletion % 12}m` : 'Sustains through horizon';

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}><AppText style={styles.sectionTitle}>How to use the Savings Runway calculator</AppText><AppText style={styles.sectionBody}>Estimate how long savings can support withdrawals using return, inflation, fees, and other income assumptions.</AppText></View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Inputs</AppText>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Starting balance</AppText><AppTextInput value={balance} onChangeText={setBalance} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Monthly withdrawal</AppText><AppTextInput value={withdrawal} onChangeText={setWithdrawal} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Other income (monthly)</AppText><AppTextInput value={otherIncome} onChangeText={setOtherIncome} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Annual return %</AppText><AppTextInput value={retAnnual} onChangeText={setRetAnnual} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Inflation %</AppText><AppTextInput value={inflation} onChangeText={setInflation} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Annual fee %</AppText><AppTextInput value={fee} onChangeText={setFee} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Chart horizon (years)</AppText><AppTextInput value={horizon} onChangeText={setHorizon} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Inflation-adjust</AppText><Pressable style={inflAdj ? styles.primaryBtn : styles.ghostBtn} onPress={() => setInflAdj((v) => !v)}><AppText style={inflAdj ? styles.primaryBtnText : styles.ghostBtnText}>{inflAdj ? 'On' : 'Off'}</AppText></Pressable></View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Status</AppText><AppText style={styles.levelValue}>{status}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Ending balance</AppText><AppText style={styles.levelValue}>{`$${fmt(out.ending, 2)}`}</AppText></View>
          </View>
          <View style={styles.subCard}>
            <Svg width={w} height={h}>
              <Rect x={leftPad} y={topPad} width={plotW} height={plotH} fill={themeColors.surfaceGlass} />
              {yTicks.map((t, idx) => (
                <Line key={`rgy-${idx}`} x1={leftPad} y1={t.y} x2={w - rightPad} y2={t.y} stroke={themeColors.border} strokeWidth="1" opacity={0.6} />
              ))}
              {xTicks.map((x) => (
                <Line key={`rgx-${x}`} x1={toX(x)} y1={topPad} x2={toX(x)} y2={h - bottomPad} stroke={themeColors.border} strokeWidth="1" opacity={0.35} />
              ))}
              <Line x1={leftPad} y1={h - bottomPad} x2={w - rightPad} y2={h - bottomPad} stroke={themeColors.border} strokeWidth="1.1" />
              <Line x1={leftPad} y1={topPad} x2={leftPad} y2={h - bottomPad} stroke={themeColors.border} strokeWidth="1.1" />
              <Polyline points={line} fill="none" stroke="#22b8cf" strokeWidth="2" />
              {depPoint && <Circle cx={depPoint.x} cy={depPoint.y} r="3.2" fill="#8b5cf6" />}
              {yTicks.map((t, idx) => (
                <SvgText key={`ryl-${idx}`} x={leftPad - 4} y={t.y + 3} fill={themeColors.textMuted} fontSize="9" textAnchor="end">
                  {`${Math.round(t.value / 1000)}K`}
                </SvgText>
              ))}
              {xTicks.map((x) => (
                <SvgText key={`rxl-${x}`} x={toX(x)} y={h - 7} fill={themeColors.textMuted} fontSize="9" textAnchor="middle">
                  {`${x}y`}
                </SvgText>
              ))}
            </Svg>
            <View style={styles.resultRow}>
              <View style={styles.heroTagRow}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22b8cf', marginTop: 4 }} /><AppText style={styles.tipText}>Balance</AppText></View>
              <View style={styles.heroTagRow}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8b5cf6', marginTop: 4 }} /><AppText style={styles.tipText}>Depletion point</AppText></View>
            </View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function SavingGrowthToolScreen({ navigation, calculator, styles, themeColors, openSite }) {
  const [start, setStart] = useState('10000');
  const [monthly, setMonthly] = useState('500');
  const [years, setYears] = useState('20');
  const [retAnnual, setRetAnnual] = useState('8');
  const [inflation, setInflation] = useState('3');
  const [stepUp, setStepUp] = useState('2');
  const [annuityDue, setAnnuityDue] = useState(false);

  const out = useMemo(() => {
    const s = Math.max(0, toNum(start) || 0);
    const m0 = Math.max(0, toNum(monthly) || 0);
    const y = Math.max(1, toNum(years) || 20);
    const ra = (toNum(retAnnual) || 0) / 100;
    const inf = (toNum(inflation) || 0) / 100;
    const su = (toNum(stepUp) || 0) / 100;

    let bal = s;
    let contrib = 0;
    const nom = [{ x: 0, v: bal }];
    const real = [{ x: 0, v: bal }];
    for (let yr = 1; yr <= y; yr += 1) {
      const m = m0 * Math.pow(1 + su, yr - 1);
      const rm = ra / 12;
      for (let k = 0; k < 12; k += 1) {
        if (annuityDue) {
          bal += m;
          contrib += m;
          bal *= (1 + rm);
        } else {
          bal *= (1 + rm);
          bal += m;
          contrib += m;
        }
      }
      nom.push({ x: yr, v: bal });
      real.push({ x: yr, v: bal / Math.pow(1 + inf, yr) });
    }
    return { nominal: bal, real: real[real.length - 1].v, contrib, earnings: bal - (s + contrib), nom, realSeries: real };
  }, [start, monthly, years, retAnnual, inflation, stepUp, annuityDue]);

  const w = Math.min(Dimensions.get('window').width - 72, 360);
  const h = 190;
  const yearsNum = Math.max(1, toNum(years) || 20);
  const leftPad = 34;
  const rightPad = 10;
  const topPad = 10;
  const bottomPad = 24;
  const plotW = w - leftPad - rightPad;
  const plotH = h - topPad - bottomPad;
  const yMax = Math.max(...out.nom.map((p) => p.v), 1);

  const toX = (x) => leftPad + (x / yearsNum) * plotW;
  const toY = (v) => h - bottomPad - (v / yMax) * plotH;
  const lineN = out.nom.map((p) => `${toX(p.x)},${toY(p.v)}`).join(' ');
  const lineR = out.realSeries.map((p) => `${toX(p.x)},${toY(p.v)}`).join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((k) => ({ value: yMax * k, y: toY(yMax * k) }));
  const xStep = yearsNum <= 10 ? 1 : yearsNum <= 20 ? 2 : 5;
  const xTicks = [];
  for (let x = 0; x <= yearsNum; x += xStep) xTicks.push(x);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}><AppText style={styles.sectionTitle}>How to use the Saving Growth calculator</AppText><AppText style={styles.sectionBody}>Model regular contributions and compounding with inflation-adjusted real value.</AppText></View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Inputs</AppText>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Starting balance</AppText><AppTextInput value={start} onChangeText={setStart} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Monthly contribution</AppText><AppTextInput value={monthly} onChangeText={setMonthly} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Years</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Annual return %</AppText><AppTextInput value={retAnnual} onChangeText={setRetAnnual} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Inflation %</AppText><AppTextInput value={inflation} onChangeText={setInflation} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Step-up % yearly</AppText><AppTextInput value={stepUp} onChangeText={setStepUp} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Contribute at beginning of period</AppText><Pressable style={annuityDue ? styles.primaryBtn : styles.ghostBtn} onPress={() => setAnnuityDue((v) => !v)}><AppText style={annuityDue ? styles.primaryBtnText : styles.ghostBtnText}>{annuityDue ? 'Annuity Due' : 'Ordinary'}</AppText></Pressable></View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Results</AppText>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Nominal future value</AppText><AppText style={styles.levelValue}>{`$${fmt(out.nominal, 2)}`}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Real value</AppText><AppText style={styles.levelValue}>{`$${fmt(out.real, 2)}`}</AppText></View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Total contributions</AppText><AppText style={styles.levelValue}>{`$${fmt(out.contrib, 2)}`}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Total earnings</AppText><AppText style={styles.levelValue}>{`$${fmt(out.earnings, 2)}`}</AppText></View>
          </View>
          <View style={styles.subCard}>
            <Svg width={w} height={h}>
              <Rect x={leftPad} y={topPad} width={plotW} height={plotH} fill={themeColors.surfaceGlass} />
              {yTicks.map((t, idx) => (
                <Line key={`gy-${idx}`} x1={leftPad} y1={t.y} x2={w - rightPad} y2={t.y} stroke={themeColors.border} strokeWidth="1" opacity={0.6} />
              ))}
              {xTicks.map((x) => (
                <Line key={`gx-${x}`} x1={toX(x)} y1={topPad} x2={toX(x)} y2={h - bottomPad} stroke={themeColors.border} strokeWidth="1" opacity={0.35} />
              ))}
              <Line x1={leftPad} y1={h - bottomPad} x2={w - rightPad} y2={h - bottomPad} stroke={themeColors.border} strokeWidth="1.1" />
              <Line x1={leftPad} y1={topPad} x2={leftPad} y2={h - bottomPad} stroke={themeColors.border} strokeWidth="1.1" />
              <Polyline points={lineN} fill="none" stroke="#22a6f2" strokeWidth="2" />
              <Polyline points={lineR} fill="none" stroke="#8b5cf6" strokeWidth="2" />
              {yTicks.map((t, idx) => (
                <SvgText key={`yl-${idx}`} x={leftPad - 4} y={t.y + 3} fill={themeColors.textMuted} fontSize="9" textAnchor="end">
                  {`${Math.round(t.value / 1000)}K`}
                </SvgText>
              ))}
              {xTicks.map((x) => (
                <SvgText key={`xl-${x}`} x={toX(x)} y={h - 7} fill={themeColors.textMuted} fontSize="9" textAnchor="middle">
                  {`${x}`}
                </SvgText>
              ))}
            </Svg>
            <View style={styles.resultRow}>
              <View style={styles.heroTagRow}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22a6f2', marginTop: 4 }} /><AppText style={styles.tipText}>Nominal</AppText></View>
              <View style={styles.heroTagRow}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8b5cf6', marginTop: 4 }} /><AppText style={styles.tipText}>Real (inflation-adjusted)</AppText></View>
            </View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}






