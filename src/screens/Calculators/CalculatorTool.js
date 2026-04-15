import React, { useMemo, useState } from 'react';
import { Alert, Dimensions, Linking, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import BackButtonHeader from '../../components/BackButtonHeader';
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';
import { DividendPEToolScreen, EfficientFrontierToolScreen, CorrelationCovarianceToolScreen, SharpeSortinoToolScreen, AstrologyLongevityToolScreen, EmergencyFundToolScreen, MortgageToolScreen, EMIToolScreen, CarLoanEMIToolScreen, HomeLoanEMIToolScreen, HouseAffordabilityToolScreen, SavingsRunwayToolScreen, SavingGrowthToolScreen } from './PortfolioAdvancedTools';
import { SaveMoneyGoalTool, NetWorthTool, CollegeCalculatorsTool, HighYieldSavingsTool, RetirementSavingsPFTool, SIPTool, LumpsumTool, SWPTool, FDTool, SimpleInterestTool, CompoundInterestTool, RDTool, SpendingTool, LifeInsuranceTool, PropertyValuationTool, MutualFundReturnsTool, CarpetTool, K401RetirementTool, FinancialFreedomTool } from './PersonalFinanceCustomTools';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const toNum = (v) => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmt = (v, d = 2) => {
  if (v == null || !Number.isFinite(v)) return '--';
  return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};

const normPdf = (x) => Math.exp((-0.5 * x * x)) / Math.sqrt(2 * Math.PI);

const erfApprox = (x) => {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-ax * ax);
  return sign * y;
};

const normCdf = (x) => 0.5 * (1 + erfApprox(x / Math.sqrt(2)));

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

function PageHeader({ navigation, styles, themeColors, title, subtitle }) {
  return (
    <BackButtonHeader colors={themeColors} onPress={() => navigation.goBack()} containerStyle={styles.header}>
      <View style={styles.headerCenter}><AppText style={styles.title}>{title}</AppText><AppText style={styles.subtitle}>{subtitle}</AppText></View>
    </BackButtonHeader>
  );
}

function SupportResistanceTool({ navigation, calculator, styles, themeColors, openSite }) {
  const [high, setHigh] = useState('496.75');
  const [low, setLow] = useState('428.67');
  const [close, setClose] = useState('495.32');

  const h = toNum(high), l = toNum(low), c = toNum(close);
  const valid = h != null && l != null && c != null && h > l;

  const lv = useMemo(() => {
    if (!valid) return null;
    const p = (h + l + c) / 3;
    const r1 = 2 * p - l;
    const s1 = 2 * p - h;
    const r2 = p + (h - l);
    const s2 = p - (h - l);
    const r3 = h + 2 * (p - l);
    const s3 = l - 2 * (h - p);
    const range = h - l;
    const midpoint = (h + l) / 2;
    return { p, r1, s1, r2, s2, r3, s3, range, midpoint };
  }, [c, h, l, valid]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Price levels</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Pivot math</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Trade planning</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Support and Resistance calculator</AppText>
          <AppText style={styles.sectionBody}>
            Enter High, Low and Close values. Use Pivot, R1-R3 and S1-S3 to plan entries, exits and risk limits.
          </AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Inputs</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>High</AppText><AppTextInput value={high} onChangeText={setHigh} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Low</AppText><AppTextInput value={low} onChangeText={setLow} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Close</AppText><AppTextInput value={close} onChangeText={setClose} keyboardType="numeric" style={styles.input} /></View>
            </View>
            {!valid && <AppText style={styles.warnText}>Provide valid values where High is greater than Low.</AppText>}
            <View style={styles.tipCard}>
              <AppText style={styles.tipTitle}>Quick tips</AppText>
              <AppText style={styles.tipText}>Use daily timeframe for swing levels and combine with volume/price action confirmation.</AppText>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Results & visuals</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Pivot (P)</AppText><AppText style={styles.levelValue}>{lv ? fmt(lv.p) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>R1</AppText><AppText style={styles.levelValue}>{lv ? fmt(lv.r1) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>S1</AppText><AppText style={styles.levelValue}>{lv ? fmt(lv.s1) : '--'}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>R2</AppText><AppText style={styles.levelValue}>{lv ? fmt(lv.r2) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Range</AppText><AppText style={styles.levelValue}>{lv ? fmt(lv.range) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>S2</AppText><AppText style={styles.levelValue}>{lv ? fmt(lv.s2) : '--'}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>R3</AppText><AppText style={styles.levelValue}>{lv ? fmt(lv.r3) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Midpoint</AppText><AppText style={styles.levelValue}>{lv ? fmt(lv.midpoint) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>S3</AppText><AppText style={styles.levelValue}>{lv ? fmt(lv.s3) : '--'}</AppText></View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Support & Resistance quick guide</AppText>
          <AppText style={styles.sectionBody}>Formulas: P=(H+L+C)/3, R1=2P-L, S1=2P-H, R2=P+(H-L), S2=P-(H-L).</AppText>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}
function WinRateRiskRewardTool({ navigation, calculator, styles, themeColors, openSite }) {
  const [side, setSide] = useState('Long');
  const [entry, setEntry] = useState('120.5');
  const [stop, setStop] = useState('115');
  const [target, setTarget] = useState('132');
  const [account, setAccount] = useState('25000');
  const [riskPct, setRiskPct] = useState('1');
  const [riskOverride, setRiskOverride] = useState('');
  const [lotSize, setLotSize] = useState('1');
  const [fees, setFees] = useState('0');
  const [winRate, setWinRate] = useState('50');

  const m = useMemo(() => {
    const e = toNum(entry), s = toNum(stop), t = toNum(target), acc = toNum(account), rp = toNum(riskPct), ro = toNum(riskOverride), lot = toNum(lotSize) || 1, f = toNum(fees) || 0, w = toNum(winRate);
    if (e == null || s == null || t == null || acc == null || rp == null || w == null) return null;
    const risk = Math.abs(e - s), reward = Math.abs(t - e);
    if (risk <= 0) return null;
    const rr = reward / risk;
    const be = (1 / (1 + rr)) * 100;
    const budget = ro != null && ro > 0 ? ro : (acc * rp) / 100;
    const rawQty = Math.floor(budget / risk);
    const qty = Math.max(lot, Math.floor(rawQty / lot) * lot);
    const p = Math.max(0, Math.min(1, w / 100));
    const exp = (p * rr - (1 - p) - f / Math.max(risk, 1e-9)) * qty;
    return { risk, reward, rr, be, qty, exp, rrCap: Math.min(3, rr) };
  }, [account, entry, fees, lotSize, riskOverride, riskPct, stop, target, winRate]);

  const setTargetByR = (r) => {
    const e = toNum(entry), s = toNum(stop);
    if (e == null || s == null) return;
    const rk = Math.abs(e - s);
    if (rk <= 0) return;
    setTarget(String(side === 'Long' ? e + rk * r : e - rk * r));
  };

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>RR</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Expectancy</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Position sizing</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Win Rate and Risk-Reward calculator</AppText>
          <AppText style={styles.sectionBody}>Enter your setup, then compare RR with break-even and expectancy to filter low-quality trades.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Trade setup</AppText>
            <View style={styles.btnRow}>
              <Pressable style={side === 'Long' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setSide('Long')}><AppText style={side === 'Long' ? styles.primaryBtnText : styles.ghostBtnText}>Long</AppText></Pressable>
              <Pressable style={side === 'Short' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setSide('Short')}><AppText style={side === 'Short' ? styles.primaryBtnText : styles.ghostBtnText}>Short</AppText></Pressable>
              <Pressable style={styles.ghostBtn} onPress={() => setTargetByR(2)}><AppText style={styles.ghostBtnText}>2R</AppText></Pressable>
              <Pressable style={styles.ghostBtn} onPress={() => setTargetByR(3)}><AppText style={styles.ghostBtnText}>3R</AppText></Pressable>
            </View>

            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Entry</AppText><AppTextInput value={entry} onChangeText={setEntry} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Stop</AppText><AppTextInput value={stop} onChangeText={setStop} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Target</AppText><AppTextInput value={target} onChangeText={setTarget} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Account ($)</AppText><AppTextInput value={account} onChangeText={setAccount} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Risk %</AppText><AppTextInput value={riskPct} onChangeText={setRiskPct} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Risk $ override</AppText><AppTextInput value={riskOverride} onChangeText={setRiskOverride} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Lot size</AppText><AppTextInput value={lotSize} onChangeText={setLotSize} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Fees/slippage</AppText><AppTextInput value={fees} onChangeText={setFees} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Win-rate %</AppText><AppTextInput value={winRate} onChangeText={setWinRate} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Results & visuals</AppText>
            {!m && <AppText style={styles.warnText}>Enter valid values to compute.</AppText>}
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Risk / share</AppText><AppText style={styles.levelValue}>{m ? fmt(m.risk) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Reward / share</AppText><AppText style={styles.levelValue}>{m ? fmt(m.reward) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>R:R & BE</AppText><AppText style={styles.levelValue}>{m ? `${fmt(m.rr)} | ${fmt(m.be)}%` : '--'}</AppText></View>
            </View>
            <View style={styles.card}>
              <AppText style={styles.label}>R:R gauge (capped at 3)</AppText>
              <View style={styles.gaugeTrack}><View style={[styles.gaugeFill, { width: `${m ? (m.rrCap / 3) * 100 : 0}%` }]} /></View>
              <AppText style={styles.gaugeText}>{m ? `${fmt(m.rr)} / 3` : '-- / 3'}</AppText>
            </View>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Expected value / trade</AppText><AppText style={styles.levelValue}>{m ? `${fmt(m.exp)}` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Suggested quantity</AppText><AppText style={styles.levelValue}>{m ? fmt(m.qty, 0) : '--'}</AppText></View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Notes & limitations</AppText>
          <AppText style={styles.sectionBody}>Combine RR with market context. Fees, slippage and execution quality can materially change realized outcomes.</AppText>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}
function RiskRewardQuickTool({ navigation, styles, themeColors, openSite }) {
  const [mode, setMode] = useState('distance');
  const [riskDistance, setRiskDistance] = useState('1');
  const [rewardDistance, setRewardDistance] = useState('2');
  const [entry, setEntry] = useState('120');
  const [stop, setStop] = useState('115');
  const [target, setTarget] = useState('132');
  const [winRate, setWinRate] = useState('50');

  const r = useMemo(() => {
    const wr = toNum(winRate);
    let risk = null, reward = null;
    if (mode === 'distance') {
      risk = toNum(riskDistance); reward = toNum(rewardDistance);
    } else {
      const e = toNum(entry), s = toNum(stop), t = toNum(target);
      if (e != null && s != null && t != null) { risk = Math.abs(e - s); reward = Math.abs(t - e); }
    }
    if (risk == null || reward == null || wr == null || risk <= 0 || reward <= 0) return null;
    const rr = reward / risk;
    return { rr, be: (1 / (1 + rr)) * 100, expR: (wr / 100) * rr - (1 - wr / 100), rrCap: Math.min(3, rr) };
  }, [entry, mode, rewardDistance, riskDistance, stop, target, winRate]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Risk-Reward Ratio (Quick)" subtitle="Compute R:R, break-even win-rate and expectancy (R)." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Trade planning</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Expectancy basics</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Position sizing</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Risk-Reward Ratio calculator</AppText>
          <AppText style={styles.sectionBody}>Enter distances or prices and compare ratio with break-even before taking trades.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Inputs</AppText>
            <View style={styles.btnRow}>
              <Pressable style={mode === 'distance' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setMode('distance')}><AppText style={mode === 'distance' ? styles.primaryBtnText : styles.ghostBtnText}>By distances</AppText></Pressable>
              <Pressable style={mode === 'price' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setMode('price')}><AppText style={mode === 'price' ? styles.primaryBtnText : styles.ghostBtnText}>By prices</AppText></Pressable>
            </View>
            {mode === 'distance' ? (
              <View style={styles.grid}>
                <View style={styles.field}><AppText style={styles.label}>Risk distance</AppText><AppTextInput value={riskDistance} onChangeText={setRiskDistance} keyboardType="numeric" style={styles.input} /></View>
                <View style={styles.field}><AppText style={styles.label}>Reward distance</AppText><AppTextInput value={rewardDistance} onChangeText={setRewardDistance} keyboardType="numeric" style={styles.input} /></View>
              </View>
            ) : (
              <View style={styles.grid}>
                <View style={styles.field}><AppText style={styles.label}>Entry</AppText><AppTextInput value={entry} onChangeText={setEntry} keyboardType="numeric" style={styles.input} /></View>
                <View style={styles.field}><AppText style={styles.label}>Stop</AppText><AppTextInput value={stop} onChangeText={setStop} keyboardType="numeric" style={styles.input} /></View>
                <View style={styles.field}><AppText style={styles.label}>Target</AppText><AppTextInput value={target} onChangeText={setTarget} keyboardType="numeric" style={styles.input} /></View>
              </View>
            )}
            <View style={styles.fieldFull}><AppText style={styles.label}>Assumed win-rate (%)</AppText><AppTextInput value={winRate} onChangeText={setWinRate} keyboardType="numeric" style={styles.input} /></View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Results</AppText>
            {!r && <AppText style={styles.warnText}>Provide valid inputs to compute ratio.</AppText>}
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Risk : Reward</AppText><AppText style={styles.levelValue}>{r ? `${fmt(r.rr)} : 1` : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Break-even win-rate</AppText><AppText style={styles.levelValue}>{r ? `${fmt(r.be)}%` : '--'}</AppText></View>
            </View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Expectancy preview (R)</AppText><AppText style={styles.levelValue}>{r ? `${fmt(r.expR)} R` : '--'}</AppText></View>
            <View style={styles.card}>
              <AppText style={styles.label}>R:R gauge (capped at 3)</AppText>
              <View style={styles.gaugeTrack}><View style={[styles.gaugeFill, { width: `${r ? (r.rrCap / 3) * 100 : 0}%` }]} /></View>
              <AppText style={styles.gaugeText}>{r ? `${fmt(r.rr)} / 3` : '-- / 3'}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.card}><AppText style={styles.sectionTitle}>Why R:R & break-even matter</AppText><AppText style={styles.sectionBody}>RR = Reward/Risk, BE = 1/(1+RR), Expectancy(R)=p*RR-(1-p).</AppText></View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function RiskRewardIndiaTool({ navigation, styles, themeColors, openSite }) {
  const [entry, setEntry] = useState('100');
  const [stop, setStop] = useState('98.5');
  const [target, setTarget] = useState('103');
  const [qty, setQty] = useState('100');
  const [brokerage, setBrokerage] = useState('20');
  const [exchangePct, setExchangePct] = useState('0.0345');
  const [sebiPct, setSebiPct] = useState('0.0001');
  const [sttBuyPct, setSttBuyPct] = useState('0');
  const [sttSellPct, setSttSellPct] = useState('0.025');
  const [stampDutyPct, setStampDutyPct] = useState('0.003');
  const [gstPct, setGstPct] = useState('18');
  const [dpCharge, setDpCharge] = useState('0');

  const out = useMemo(() => {
    const e = toNum(entry), s = toNum(stop), t = toNum(target), q = toNum(qty);
    const bro = toNum(brokerage) || 0;
    const ex = (toNum(exchangePct) || 0) / 100;
    const sebi = (toNum(sebiPct) || 0) / 100;
    const sttB = (toNum(sttBuyPct) || 0) / 100;
    const sttS = (toNum(sttSellPct) || 0) / 100;
    const stamp = (toNum(stampDutyPct) || 0) / 100;
    const gst = (toNum(gstPct) || 0) / 100;
    const dp = toNum(dpCharge) || 0;
    if (e == null || s == null || t == null || q == null || q <= 0) return null;

    const buy = e * q;
    const sellT = t * q;
    const sellS = s * q;
    const riskShare = Math.abs(e - s);
    const rewardShare = Math.abs(t - e);
    if (riskShare <= 0) return null;
    const rr = rewardShare / riskShare;
    const beIgnore = (1 / (1 + rr)) * 100;

    const buyCharges = bro + buy * (ex + sebi + sttB + stamp) + bro * gst;
    const targetCharges = bro + sellT * (ex + sebi + sttS) + bro * gst + dp;
    const stopCharges = bro + sellS * (ex + sebi + sttS) + bro * gst + dp;

    const netTarget = sellT - buy - buyCharges - targetCharges;
    const netStop = sellS - buy - buyCharges - stopCharges;
    const feeAwareR = Math.abs(netStop) > 0 ? Math.abs(netTarget) / Math.abs(netStop) : null;
    const beFeeAware = feeAwareR ? (1 / (1 + feeAwareR)) * 100 : null;

    return { riskShare, rewardShare, rr, beIgnore, beFeeAware, netTarget, netStop };
  }, [brokerage, dpCharge, entry, exchangePct, gstPct, qty, sebiPct, stampDutyPct, stop, sttBuyPct, sttSellPct, target]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Risk-Reward (India)" subtitle="Fees-aware RR with brokerage, STT, stamp duty, exchange + SEBI and GST." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Fees-aware</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Presets</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Visual P&L</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>Trade setup</AppText>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Entry</AppText><AppTextInput value={entry} onChangeText={setEntry} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Stop</AppText><AppTextInput value={stop} onChangeText={setStop} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Target</AppText><AppTextInput value={target} onChangeText={setTarget} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Quantity</AppText><AppTextInput value={qty} onChangeText={setQty} keyboardType="numeric" style={styles.input} /></View>
          </View>

          <AppText style={styles.sectionTitle}>Charges</AppText>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>Brokerage / order</AppText><AppTextInput value={brokerage} onChangeText={setBrokerage} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Exchange + Clearing %</AppText><AppTextInput value={exchangePct} onChangeText={setExchangePct} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>SEBI turnover %</AppText><AppTextInput value={sebiPct} onChangeText={setSebiPct} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>STT buy %</AppText><AppTextInput value={sttBuyPct} onChangeText={setSttBuyPct} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>STT sell %</AppText><AppTextInput value={sttSellPct} onChangeText={setSttSellPct} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Stamp duty buy %</AppText><AppTextInput value={stampDutyPct} onChangeText={setStampDutyPct} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>GST %</AppText><AppTextInput value={gstPct} onChangeText={setGstPct} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>DP charge (sell)</AppText><AppTextInput value={dpCharge} onChangeText={setDpCharge} keyboardType="numeric" style={styles.input} /></View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Results</AppText>
          {!out && <AppText style={styles.warnText}>Provide valid inputs to compute.</AppText>}
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Risk/share</AppText><AppText style={styles.levelValue}>{out ? fmt(out.riskShare) : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Reward/share</AppText><AppText style={styles.levelValue}>{out ? fmt(out.rewardShare) : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>RR ratio</AppText><AppText style={styles.levelValue}>{out ? fmt(out.rr) : '--'}</AppText></View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Break-even (ignoring fees)</AppText><AppText style={styles.levelValue}>{out ? `${fmt(out.beIgnore)}%` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Break-even (fees-aware)</AppText><AppText style={styles.levelValue}>{out?.beFeeAware ? `${fmt(out.beFeeAware)}%` : '--'}</AppText></View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Target net P&L</AppText><AppText style={styles.levelValue}>{out ? `${out.netTarget >= 0 ? '+' : ''}${fmt(out.netTarget)}` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Stop net P&L</AppText><AppText style={styles.levelValue}>{out ? `${out.netStop >= 0 ? '+' : ''}${fmt(out.netStop)}` : '--'}</AppText></View>
          </View>
          <View style={styles.tipCard}><AppText style={styles.tipTitle}>Charges model notes</AppText><AppText style={styles.tipText}>STT differs by segment/side, GST applies on brokerage + exchange + SEBI. Verify with broker schedule.</AppText></View>
        </View>

        <View style={styles.card}><AppText style={styles.sectionTitle}>How to use the Risk-Reward India calculator</AppText><AppText style={styles.sectionBody}>Evaluate break-even and net P&L with Indian fee assumptions before execution.</AppText></View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function PositionSizeStockTool({ navigation, styles, themeColors, openSite }) {
  const [accountSize, setAccountSize] = useState('10000');
  const [riskPerTrade, setRiskPerTrade] = useState('1');
  const [entryPrice, setEntryPrice] = useState('100');
  const [stopDistance, setStopDistance] = useState('2');

  const out = useMemo(() => {
    const account = toNum(accountSize);
    const riskPct = toNum(riskPerTrade);
    const entry = toNum(entryPrice);
    const stop = toNum(stopDistance);
    if (account == null || riskPct == null || entry == null || stop == null || account <= 0 || stop <= 0) return null;

    const maxRisk = (account * riskPct) / 100;
    const qty = Math.max(0, Math.floor(maxRisk / stop));
    const positionValue = qty * entry;
    const stopPrice = entry - stop;
    const capitalUsed = account > 0 ? (positionValue / account) * 100 : 0;
    return { maxRisk, qty, positionValue, stopPrice, capitalUsed };
  }, [accountSize, entryPrice, riskPerTrade, stopDistance]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Position Size Calculator (Stock Trading)" subtitle="Decide share quantity using account risk and stop-loss distance." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Stock trading</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Risk management</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Position sizing</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Position Size Calculator</AppText>
          <AppText style={styles.sectionBody}>
            Enter account size, risk per trade, entry price and stop-loss distance. Use result as a planning baseline before execution.
          </AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Position Size Calculator (Stock Trading)</AppText>
            <View style={styles.heroTagRow}>
              <View style={styles.badgePill}><AppText style={styles.badgeText}>Day trading</AppText></View>
              <View style={styles.badgePill}><AppText style={styles.badgeText}>Swing trading</AppText></View>
              <View style={styles.badgePill}><AppText style={styles.badgeText}>Risk-first</AppText></View>
            </View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Account Size ($)</AppText><AppTextInput value={accountSize} onChangeText={setAccountSize} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Risk Per Trade (%)</AppText><AppTextInput value={riskPerTrade} onChangeText={setRiskPerTrade} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Entry Price ($)</AppText><AppTextInput value={entryPrice} onChangeText={setEntryPrice} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Stop Loss Distance ($ per share)</AppText><AppTextInput value={stopDistance} onChangeText={setStopDistance} keyboardType="numeric" style={styles.input} /></View>
            {!out && <AppText style={styles.warnText}>Use valid positive numbers to calculate.</AppText>}
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Position recommendation</AppText>
            <View style={[styles.levelBox, styles.levelPivot]}>
              <AppText style={styles.levelLabel}>Recommended quantity</AppText>
              <AppText style={styles.bigMetric}>{out ? `${fmt(out.qty, 0)} shares` : '-- shares'}</AppText>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Max risk</AppText><AppText style={styles.levelValue}>{out ? `${fmt(out.maxRisk)}` : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Position value</AppText><AppText style={styles.levelValue}>{out ? `${fmt(out.positionValue)}` : '--'}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Estimated stop price</AppText><AppText style={styles.levelValue}>{out ? `${fmt(out.stopPrice)}` : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Capital used</AppText><AppText style={styles.levelValue}>{out ? `${fmt(out.capitalUsed)}%` : '--'}</AppText></View>
            </View>
            <AppText style={styles.sectionBody}>Formula: Shares = (Account Size x Risk %) / Stop-loss distance</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function StockAverageTool({ navigation, styles, themeColors, openSite }) {
  const [rows, setRows] = useState([
    { id: 1, qty: '0', price: '0' },
    { id: 2, qty: '0', price: '0' },
  ]);

  const updateRow = (id, key, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { id: prev.length + 1, qty: '0', price: '0' }]);
  };

  const out = useMemo(() => {
    let totalShares = 0;
    let totalCost = 0;
    rows.forEach((row) => {
      const q = toNum(row.qty) || 0;
      const p = toNum(row.price) || 0;
      if (q > 0 && p >= 0) {
        totalShares += q;
        totalCost += q * p;
      }
    });
    const average = totalShares > 0 ? totalCost / totalShares : 0;
    return { totalShares, totalCost, average };
  }, [rows]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Stock Average Calculator" subtitle="Calculate weighted average buy price across multiple purchases." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Stock Average</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Weighted Price</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Stock Average Calculator</AppText>
          <AppText style={styles.sectionBody}>
            Enter quantity and buy price for each lot. Add more rows for additional purchases. We compute total shares, total cost and weighted average price.
          </AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Stock Average Calculator</AppText>
            {rows.map((row) => (
              <View key={row.id} style={styles.subCard}>
                <AppText style={styles.tipTitle}>Share {row.id}</AppText>
                <View style={styles.grid}>
                  <View style={styles.field}><AppText style={styles.label}>Quantity</AppText><AppTextInput value={row.qty} onChangeText={(v) => updateRow(row.id, 'qty', v)} keyboardType="numeric" style={styles.input} /></View>
                  <View style={styles.field}><AppText style={styles.label}>Price per share ($)</AppText><AppTextInput value={row.price} onChangeText={(v) => updateRow(row.id, 'price', v)} keyboardType="numeric" style={styles.input} /></View>
                </View>
              </View>
            ))}
            <Pressable style={styles.ghostBtn} onPress={addRow}><AppText style={styles.ghostBtnText}>+ Add More</AppText></Pressable>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Total shares</AppText><AppText style={styles.levelValue}>{fmt(out.totalShares, 0)}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Total cost</AppText><AppText style={styles.levelValue}>${fmt(out.totalCost)}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Average price</AppText><AppText style={styles.levelValue}>${fmt(out.average)}</AppText></View>
            </View>
            <View style={styles.tipCard}><AppText style={styles.tipText}>Formula: Average Price = Sum(Quantity x Price) / Sum(Quantity)</AppText></View>
            <View style={styles.tipCard}>
              <AppText style={styles.tipTitle}>Quick example</AppText>
              <AppText style={styles.tipText}>100 shares @ $250 and 200 shares @ $275 gives: ((100x250)+(200x275))/(100+200) = $266.67</AppText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>What is a Stock Average Calculator?</AppText>
          <AppText style={styles.sectionBody}>If you buy the same stock at different prices, your effective buy cost is the weighted average of all purchases.</AppText>
          <AppText style={styles.sectionTitle}>How to use this calculator</AppText>
          <AppText style={styles.sectionBody}>1. Enter quantity and price for each purchase.</AppText>
          <AppText style={styles.sectionBody}>2. Use Add More for additional buys.</AppText>
          <AppText style={styles.sectionBody}>3. Review total shares, total cost and average buy price.</AppText>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function StopLossTakeProfitTool({ navigation, styles, themeColors, openSite }) {
  const [side, setSide] = useState('Long');
  const [entry, setEntry] = useState('100');
  const [stopPct, setStopPct] = useState('2');
  const [rr, setRr] = useState('2');
  const [shares, setShares] = useState('100');

  const out = useMemo(() => {
    const e = toNum(entry);
    const sPct = toNum(stopPct);
    const rrNum = toNum(rr);
    const q = toNum(shares);
    if (e == null || sPct == null || rrNum == null || q == null || e <= 0 || sPct <= 0 || rrNum <= 0 || q <= 0) return null;

    const riskPerShare = e * (sPct / 100);
    const stopPrice = side === 'Long' ? e - riskPerShare : e + riskPerShare;
    const targetPrice = side === 'Long' ? e + riskPerShare * rrNum : e - riskPerShare * rrNum;
    const totalCapitalAtRisk = riskPerShare * q;

    return { stopPrice, targetPrice, riskPerShare, totalCapitalAtRisk };
  }, [entry, rr, shares, side, stopPct]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Stop Loss & Take Profit Calculator" subtitle="Calculate stop, target, risk/share and total capital at risk before execution." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Beginner</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Risk management</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Trading</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Stop Loss Take Profit Calculator</AppText>
          <AppText style={styles.sectionBody}>Enter entry, stop-loss percentage, risk-reward ratio and quantity. Use outputs for planning, not certainty.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Stop Loss & Take Profit Calculator</AppText>
            <View style={styles.btnRow}>
              <Pressable style={side === 'Long' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setSide('Long')}><AppText style={side === 'Long' ? styles.primaryBtnText : styles.ghostBtnText}>Long</AppText></Pressable>
              <Pressable style={side === 'Short' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setSide('Short')}><AppText style={side === 'Short' ? styles.primaryBtnText : styles.ghostBtnText}>Short</AppText></Pressable>
            </View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Entry Price ($)</AppText><AppTextInput value={entry} onChangeText={setEntry} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Stop Loss (%)</AppText><AppTextInput value={stopPct} onChangeText={setStopPct} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Risk:Reward Ratio</AppText><AppTextInput value={rr} onChangeText={setRr} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Number of Shares</AppText><AppTextInput value={shares} onChangeText={setShares} keyboardType="numeric" style={styles.input} /></View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Calculated values</AppText>
            {!out && <AppText style={styles.warnText}>Use valid positive values to calculate.</AppText>}
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Stop loss price</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.stopPrice)}` : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Target price</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.targetPrice)}` : '--'}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Risk per share</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.riskPerShare)}` : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Total capital at risk</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.totalCapitalAtRisk)}` : '--'}</AppText></View>
            </View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function FibonacciTool({ navigation, styles, themeColors, openSite }) {
  const [high, setHigh] = useState('100');
  const [low, setLow] = useState('50');
  const screenWidth = Dimensions.get('window').width;
  const isSmallPhone = screenWidth < 390;

  const out = useMemo(() => {
    const h = toNum(high), l = toNum(low);
    if (h == null || l == null || h <= l) return null;
    const range = h - l;
    const mk = (p) => h - (range * p) / 100;
    return {
      range,
      high: h,
      low: l,
      levels: [
        { key: '0%', p: 0, v: mk(0) },
        { key: '23.6%', p: 23.6, v: mk(23.6) },
        { key: '38.2%', p: 38.2, v: mk(38.2) },
        { key: '50%', p: 50, v: mk(50) },
        { key: '61.8%', p: 61.8, v: mk(61.8) },
        { key: '78.6%', p: 78.6, v: mk(78.6) },
        { key: '100%', p: 100, v: mk(100) },
      ],
    };
  }, [high, low]);

  const fibChart = useMemo(() => {
    if (!out) return null;

    const width = Math.max(236, Math.min(360, screenWidth - (isSmallPhone ? 34 : 44)));
    const height = 190;
    const left = isSmallPhone ? 22 : 26;
    const right = 10;
    const top = 10;
    const bottom = 30;
    const plotW = width - left - right;
    const plotH = height - top - bottom;
    const minY = out.low - out.range * 0.1;
    const maxY = out.high + out.range * 0.1;

    const xFor = (pct) => left + (pct / 100) * plotW;
    const yFor = (price) => top + (1 - (price - minY) / (maxY - minY)) * plotH;
    const linePoints = out.levels.map((lv) => `${xFor(lv.p)},${yFor(lv.v)}`).join(' ');
    const level50 = out.levels.find((lv) => lv.p === 50);
    const level618 = out.levels.find((lv) => lv.p === 61.8);

    return { width, height, left, top, plotW, plotH, xFor, yFor, linePoints, level50, level618 };
  }, [out]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Fibonacci Retracement Calculator" subtitle="Identify pullback zones and project targets in technical analysis." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Fibonacci Retracement Calculator</AppText>
          <View style={styles.grid}>
            <View style={styles.field}><AppText style={styles.label}>High Price</AppText><AppTextInput value={high} onChangeText={setHigh} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.field}><AppText style={styles.label}>Low Price</AppText><AppTextInput value={low} onChangeText={setLow} keyboardType="numeric" style={styles.input} /></View>
          </View>
          {!!out && (
            <View style={styles.tipCard}>
              <AppText style={styles.tipTitle}>Price Range</AppText>
              <AppText style={styles.bigMetric}>${fmt(out.range)}</AppText>
              <AppText style={styles.tipText}>{`From $${fmt(out.low)} to $${fmt(out.high)}`}</AppText>
            </View>
          )}
          {!out && <AppText style={styles.warnText}>Enter valid high and low where high is greater than low.</AppText>}
        </View>

        {!!fibChart && (
          <View style={styles.card}>
            <AppText style={styles.sectionTitle}>Fibonacci Levels Chart</AppText>
            <View style={styles.chartWrap}>
              <Svg width="100%" height={fibChart.height} viewBox={`0 0 ${fibChart.width} ${fibChart.height}`}>
                <Line x1={fibChart.left} x2={fibChart.left} y1={fibChart.top} y2={fibChart.top + fibChart.plotH} stroke={themeColors.textMuted} strokeWidth="1.2" />
                <Line x1={fibChart.left} x2={fibChart.left + fibChart.plotW} y1={fibChart.top + fibChart.plotH} y2={fibChart.top + fibChart.plotH} stroke={themeColors.textMuted} strokeWidth="1.2" />

                {[0, 23.6, 38.2, 50, 61.8, 78.6, 100].map((pct) => (
                  <Line key={`v-${pct}`} x1={fibChart.xFor(pct)} x2={fibChart.xFor(pct)} y1={fibChart.top} y2={fibChart.top + fibChart.plotH} stroke={themeColors.border} strokeWidth="1" strokeDasharray="4,4" />
                ))}

                <Line x1={fibChart.left} x2={fibChart.left + fibChart.plotW} y1={fibChart.yFor(fibChart.level50.v)} y2={fibChart.yFor(fibChart.level50.v)} stroke={themeColors.border} strokeWidth="1" strokeDasharray="4,4" />
                <Line x1={fibChart.left} x2={fibChart.left + fibChart.plotW} y1={fibChart.yFor(fibChart.level618.v)} y2={fibChart.yFor(fibChart.level618.v)} stroke={themeColors.border} strokeWidth="1" strokeDasharray="4,4" />

                <Polyline points={fibChart.linePoints} fill="none" stroke="#d9dde2" strokeWidth="2.8" />

                {out.levels.map((lv) => (
                  <Circle key={`fib-${lv.key}`} cx={fibChart.xFor(lv.p)} cy={fibChart.yFor(lv.v)} r="4.4" fill="#d9dde2" />
                ))}

                {out.levels.map((lv) => (
                  <SvgText key={`xlab-${lv.key}`} x={fibChart.xFor(lv.p)} y={fibChart.top + fibChart.plotH + 16} fontSize="9" fill={themeColors.textMuted} textAnchor="middle">
                    {lv.key}
                  </SvgText>
                ))}

                <SvgText x={fibChart.xFor(50)} y={fibChart.yFor(fibChart.level50.v) - 4} fontSize="10" fill={themeColors.textMuted} textAnchor="middle">50%</SvgText>
                <SvgText x={fibChart.xFor(61.8)} y={fibChart.yFor(fibChart.level618.v) - 4} fontSize="10" fill={themeColors.textMuted} textAnchor="middle">61.8%</SvgText>
              </Svg>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Retracement Levels</AppText>
          <View style={styles.fibRetraceGrid}>
            {(out?.levels || []).map((lv) => (
              <View
                key={lv.key}
                style={[
                  isSmallPhone ? styles.fibLevelItemFull : styles.fibLevelItem,
                  styles.fibLevelBox,
                  lv.p === 0 ? styles.fibLevelUpBox : lv.p === 100 ? styles.fibLevelDownBox : null,
                ]}
              >
                <View style={styles.fibLevelRow}>
                  <AppText style={[styles.fibLevelPct, lv.p === 0 ? styles.fibLevelUpText : lv.p === 100 ? styles.fibLevelDownText : null]}>
                    {lv.key}{lv.p === 0 ? '  UP' : lv.p === 100 ? '  DOWN' : ''}
                  </AppText>
                  <AppText style={styles.fibLevelPrice}>{out ? `$${fmt(lv.v)}` : '--'}</AppText>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.tipCard}>
            <AppText style={styles.tipTitle}>How to use</AppText>
            <AppText style={styles.tipText}>- 0% and 100% represent the swing high and swing low.</AppText>
            <AppText style={styles.tipText}>- 23.6%, 38.2%, 61.8%, 78.6% are key Fibonacci ratios.</AppText>
            <AppText style={styles.tipText}>- 50% is a common psychological pullback level.</AppText>
            <AppText style={styles.tipText}>- Use these zones with trend and price action confirmation.</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}
function ProfitLossTool({ navigation, styles, themeColors, openSite }) {
  const [entry, setEntry] = useState('100');
  const [quantity, setQuantity] = useState('1000');
  const [target, setTarget] = useState('110');
  const [stop, setStop] = useState('95');

  const out = useMemo(() => {
    const e = toNum(entry), q = toNum(quantity), t = toNum(target), s = toNum(stop);
    if (e == null || q == null || t == null || s == null || q <= 0 || e <= 0) return null;
    const positionValue = e * q;
    const profit = (t - e) * q;
    const loss = Math.max(0, (e - s) * q);
    const rr = loss > 0 ? profit / loss : null;
    const profitPct = positionValue > 0 ? (profit / positionValue) * 100 : 0;
    const lossPct = positionValue > 0 ? (loss / positionValue) * 100 : 0;
    const maxAbs = Math.max(Math.abs(profit), Math.abs(loss), 1);
    return { positionValue, profit, loss, rr, profitPct, lossPct, maxAbs };
  }, [entry, quantity, stop, target]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Profit & Loss (P&L) Calculator" subtitle="Calculate exact profit at target, max loss at stop, and risk-reward ratio." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>P&L Calculator</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Risk-Reward Ratio</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Trading Calculator</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Position sizing</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Profit and Loss calculator</AppText>
          <AppText style={styles.sectionBody}>Enter entry, position size, target and stop-loss price. Use this output for planning and scenario analysis.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Trade Parameters</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Entry Price</AppText><AppTextInput value={entry} onChangeText={setEntry} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Position Size</AppText><AppTextInput value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Target Price</AppText><AppTextInput value={target} onChangeText={setTarget} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Stop Loss Price</AppText><AppTextInput value={stop} onChangeText={setStop} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>P&L Visualization</AppText>
            <View style={styles.chartWrap}>
              <View style={styles.chartPlot}>
                <View style={styles.chartBars}>
                  <View style={styles.barCol}>
                    <View style={[styles.bar, styles.barGreen, { height: out ? `${Math.max(8, (Math.abs(out.profit) / out.maxAbs) * 100)}%` : '8%' }]} />
                  </View>
                  <View style={styles.barCol}>
                    <View style={[styles.bar, styles.barRed, { height: out ? `${Math.max(8, (Math.abs(out.loss) / out.maxAbs) * 100)}%` : '8%' }]} />
                  </View>
                </View>
              </View>
              <View style={styles.chartLegend}>
                <AppText style={styles.barLbl}>Profit @ Target</AppText>
                <AppText style={styles.barLbl}>Loss @ Stop Loss</AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>P&L Analysis</AppText>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelRes]}>
              <AppText style={styles.levelLabel}>Profit at Target</AppText>
              <AppText style={styles.levelValue}>{out ? `${fmt(out.profit)}` : '--'}</AppText>
              <AppText style={styles.label}>{out ? `${fmt(out.profitPct)}%` : '--'}</AppText>
            </View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelSup]}>
              <AppText style={styles.levelLabel}>Loss at Stop Loss</AppText>
              <AppText style={styles.levelValue}>{out ? `${fmt(out.loss)}` : '--'}</AppText>
              <AppText style={styles.label}>{out ? `${fmt(out.lossPct)}%` : '--'}</AppText>
            </View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}>
              <AppText style={styles.levelLabel}>Risk-Reward Ratio</AppText>
              <AppText style={styles.levelValue}>{out?.rr != null ? `1:${fmt(out.rr)}` : '--'}</AppText>
              <AppText style={styles.label}>{out ? `Profit: ${fmt(out.profit)} | Loss: ${fmt(out.loss)}` : '--'}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.faqTitle}>Profit & Loss Calculator FAQ</AppText>
          <View style={styles.faqGrid}>
            <View style={styles.faqCard}><AppText style={styles.tipTitle}>What is a Profit & Loss (P&L) Calculator?</AppText><AppText style={styles.tipText}>It estimates potential profit at target and possible loss at stop-loss from your trade inputs.</AppText></View>
            <View style={styles.faqCard}><AppText style={styles.tipTitle}>How to set Stop-Loss levels?</AppText><AppText style={styles.tipText}>Use technical levels, volatility or fixed risk percentage based on your risk tolerance.</AppText></View>
            <View style={styles.faqCard}><AppText style={styles.tipTitle}>How do I calculate Risk-Reward Ratio?</AppText><AppText style={styles.tipText}>Risk-Reward = potential profit / potential loss.</AppText></View>
            <View style={styles.faqCard}><AppText style={styles.tipTitle}>What is Position sizing?</AppText><AppText style={styles.tipText}>It controls how much capital you risk per trade, usually 1-2% of capital.</AppText></View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function DrawdownCapitalRecoveryTool({ navigation, styles, themeColors, openSite }) {
  const [initialCapital, setInitialCapital] = useState('10000');
  const [drawdownPct, setDrawdownPct] = useState('20');
  const screenWidth = Dimensions.get('window').width;
  const isSmallPhone = screenWidth < 390;

  const out = useMemo(() => {
    const capital = toNum(initialCapital);
    const dd = toNum(drawdownPct);
    if (capital == null || dd == null || capital <= 0 || dd < 0 || dd >= 100) return null;

    const remaining = capital * (1 - dd / 100);
    const loss = capital - remaining;
    const recoveryPct = remaining > 0 ? ((capital / remaining) - 1) * 100 : null;

    return { capital, dd, remaining, loss, recoveryPct };
  }, [drawdownPct, initialCapital]);

  const curve = useMemo(() => {
    return [10, 20, 30, 40, 50, 60, 70, 80, 90].map((dd) => ({
      dd,
      rec: (dd / (100 - dd)) * 100,
    }));
  }, []);

  const chart = useMemo(() => {
    const width = Math.max(236, Math.min(360, screenWidth - (isSmallPhone ? 34 : 44)));
    const height = 180;
    const left = isSmallPhone ? 30 : 34;
    const right = 8;
    const top = 10;
    const bottom = 26;
    const plotW = width - left - right;
    const plotH = height - top - bottom;
    const yMax = 1000;

    const xFor = (dd) => left + ((dd - 10) / 80) * plotW;
    const yFor = (rec) => top + (1 - Math.min(rec, yMax) / yMax) * plotH;

    const polyline = curve.map((p) => `${xFor(p.dd)},${yFor(p.rec)}`).join(' ');
    const ddRaw = toNum(drawdownPct);
    const currentDd = Number.isFinite(ddRaw) ? Math.max(10, Math.min(90, ddRaw)) : 20;
    const currentRec = (currentDd / (100 - currentDd)) * 100;

    return {
      width,
      height,
      left,
      top,
      plotW,
      plotH,
      xFor,
      yFor,
      yMax,
      polyline,
      currentDd,
      currentRec,
      xTicks: [10, 20, 30, 40, 50, 60, 70, 80, 90],
      yTicks: [0, 250, 500, 750, 1000],
    };
  }, [curve, drawdownPct, isSmallPhone, screenWidth]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Drawdown & Capital Recovery Calculator" subtitle="See how much gain you need to recover from losses and protect capital." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Drawdown Calculator</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Capital Recovery</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Risk Management</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Drawdown Recovery calculator</AppText>
          <AppText style={styles.sectionBody}>Enter starting capital and drawdown %. Larger drawdowns need disproportionately higher recovery.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Drawdown Parameters</AppText>
            <View style={styles.fieldFull}><AppText style={styles.label}>Initial Capital ($)</AppText><AppTextInput value={initialCapital} onChangeText={setInitialCapital} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Drawdown Percentage (%)</AppText><AppTextInput value={drawdownPct} onChangeText={setDrawdownPct} keyboardType="numeric" style={styles.input} /></View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Recovery Requirements Curve</AppText>
            <View style={styles.chartWrap}>
              <Svg width="100%" height={chart.height} viewBox={`0 0 ${chart.width} ${chart.height}`}>
                {chart.yTicks.map((tick) => {
                  const y = chart.yFor(tick);
                  return (
                    <Line key={`y-${tick}`} x1={chart.left} x2={chart.left + chart.plotW} y1={y} y2={y} stroke={themeColors.border} strokeWidth="1" strokeDasharray="4,4" />
                  );
                })}
                {chart.xTicks.map((tick) => {
                  const x = chart.xFor(tick);
                  return (
                    <Line key={`x-${tick}`} x1={x} x2={x} y1={chart.top} y2={chart.top + chart.plotH} stroke={themeColors.border} strokeWidth="1" strokeDasharray="4,4" />
                  );
                })}

                <Line x1={chart.left} x2={chart.left} y1={chart.top} y2={chart.top + chart.plotH} stroke={themeColors.textMuted} strokeWidth="1.2" />
                <Line x1={chart.left} x2={chart.left + chart.plotW} y1={chart.top + chart.plotH} y2={chart.top + chart.plotH} stroke={themeColors.textMuted} strokeWidth="1.2" />
                <Line x1={chart.xFor(chart.currentDd)} x2={chart.xFor(chart.currentDd)} y1={chart.top} y2={chart.top + chart.plotH} stroke={themeColors.accent} strokeWidth="1.5" strokeDasharray="6,4" />

                <Polyline points={chart.polyline} fill="none" stroke="#ff5656" strokeWidth="2.8" />
                {curve.map((p) => (
                  <Circle key={`p-${p.dd}`} cx={chart.xFor(p.dd)} cy={chart.yFor(p.rec)} r="3.6" fill="#ff5656" />
                ))}
                <Circle cx={chart.xFor(chart.currentDd)} cy={chart.yFor(chart.currentRec)} r="4.6" fill={themeColors.accent} />

                {chart.yTicks.map((tick) => (
                  <SvgText key={`ylab-${tick}`} x={chart.left - 6} y={chart.yFor(tick) + 4} fontSize="9" fill={themeColors.textMuted} textAnchor="end">{tick}</SvgText>
                ))}
                {chart.xTicks.map((tick) => (
                  <SvgText key={`xlab-${tick}`} x={chart.xFor(tick)} y={chart.top + chart.plotH + 14} fontSize="9" fill={themeColors.textMuted} textAnchor="middle">{tick}</SvgText>
                ))}
              </Svg>
            </View>
            <AppText style={styles.tipText}>{`Drawdown ${fmt(chart.currentDd, 0)}% requires ${fmt(chart.currentRec)}% recovery.`}</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Capital Recovery Analysis</AppText>
          {!out && <AppText style={styles.warnText}>Use capital 0 and drawdown between 0 and 99.</AppText>}
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Initial Capital</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.capital)}` : '--'}</AppText></View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>After Drawdown</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.remaining)}` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Loss Amount</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.loss)}` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Drawdown</AppText><AppText style={styles.levelValue}>{out ? `${fmt(out.dd)}%` : '--'}</AppText></View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Gain Required to Recover</AppText><AppText style={styles.levelValue}>{out?.recoveryPct != null ? `${fmt(out.recoveryPct)}%` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Dollar Amount Needed</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.loss)}` : '--'}</AppText></View>
          </View>
          <View style={styles.tipCard}><AppText style={styles.tipTitle}>Risk Management Insight</AppText><AppText style={styles.tipText}>Reducing deep drawdowns is usually more important than chasing high returns.</AppText></View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}
function OptionsPricingGreeksTool({ navigation, styles, themeColors, openSite }) {
  const [optionType, setOptionType] = useState('Call');
  const [spot, setSpot] = useState('100');
  const [strike, setStrike] = useState('100');
  const [days, setDays] = useState('30');
  const [ratePct, setRatePct] = useState('5');
  const [divPct, setDivPct] = useState('0');
  const [volPct, setVolPct] = useState('20');
  const [marketPrice, setMarketPrice] = useState('');

  const out = useMemo(() => {
    const S = toNum(spot);
    const K = toNum(strike);
    const d = toNum(days);
    const r = (toNum(ratePct) || 0) / 100;
    const q = (toNum(divPct) || 0) / 100;
    const sigmaInput = toNum(volPct);
    const premium = toNum(marketPrice);
    if (S == null || K == null || d == null || S <= 0 || K <= 0 || d <= 0) return null;

    const T = d / 365;
    const isCall = optionType === 'Call';

    const bsWithSigma = (sigma) => {
      if (sigma <= 0 || T <= 0) return null;
      const sqrtT = Math.sqrt(T);
      const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
      const d2 = d1 - sigma * sqrtT;
      const Nd1 = normCdf(d1);
      const Nd2 = normCdf(d2);
      const Nnd1 = normCdf(-d1);
      const Nnd2 = normCdf(-d2);
      const discQ = Math.exp(-q * T);
      const discR = Math.exp(-r * T);

      const price = isCall
        ? S * discQ * Nd1 - K * discR * Nd2
        : K * discR * Nnd2 - S * discQ * Nnd1;

      const delta = isCall ? discQ * Nd1 : discQ * (Nd1 - 1);
      const gamma = (discQ * normPdf(d1)) / (S * sigma * sqrtT);
      const vega = (S * discQ * normPdf(d1) * sqrtT) / 100;
      const theta = (
        (-(S * discQ * normPdf(d1) * sigma) / (2 * sqrtT))
        - (isCall ? r * K * discR * Nd2 : -r * K * discR * Nnd2)
        + (isCall ? q * S * discQ * Nd1 : -q * S * discQ * Nnd1)
      ) / 365;
      const rho = (isCall ? K * T * discR * Nd2 : -K * T * discR * Nnd2) / 100;

      return { price, delta, gamma, vega, theta, rho, d1, d2 };
    };

    let sigma = sigmaInput != null ? sigmaInput / 100 : null;
    let impliedVol = null;

    if ((sigma == null || sigma <= 0) && premium != null && premium > 0) {
      let lo = 0.0001;
      let hi = 5;
      for (let i = 0; i < 80; i += 1) {
        const mid = (lo + hi) / 2;
        const val = bsWithSigma(mid);
        if (!val) break;
        if (val.price > premium) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      sigma = (lo + hi) / 2;
      impliedVol = sigma * 100;
    }

    if (sigma == null || sigma <= 0) return null;

    const core = bsWithSigma(sigma);
    if (!core) return null;

    const breakEven = isCall ? K + core.price : K - core.price;

    return {
      ...core,
      sigmaPct: sigma * 100,
      impliedVol,
      breakEven,
    };
  }, [days, divPct, marketPrice, optionType, ratePct, spot, strike, volPct]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Options Pricing & Greeks (Black-Scholes)" subtitle="Get theoretical option price and key greeks with dividend-adjusted Black-Scholes." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>How to use the Black-Scholes calculator</AppText>
          <AppText style={styles.sectionBody}>Enter S, K, days, rate, dividend yield and volatility. Leave volatility blank and provide market price to estimate implied volatility.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Inputs</AppText>
            <View style={styles.btnRow}>
              <Pressable style={optionType === 'Call' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setOptionType('Call')}><AppText style={optionType === 'Call' ? styles.primaryBtnText : styles.ghostBtnText}>Call</AppText></Pressable>
              <Pressable style={optionType === 'Put' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setOptionType('Put')}><AppText style={optionType === 'Put' ? styles.primaryBtnText : styles.ghostBtnText}>Put</AppText></Pressable>
            </View>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Underlying Price (S)</AppText><AppTextInput value={spot} onChangeText={setSpot} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Strike Price (K)</AppText><AppTextInput value={strike} onChangeText={setStrike} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Days to Expiry</AppText><AppTextInput value={days} onChangeText={setDays} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Risk-Free Rate (%)</AppText><AppTextInput value={ratePct} onChangeText={setRatePct} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Dividend Yield (%)</AppText><AppTextInput value={divPct} onChangeText={setDivPct} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Volatility (%, sigma)</AppText><AppTextInput value={volPct} onChangeText={setVolPct} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Market Option Price (optional)</AppText><AppTextInput value={marketPrice} onChangeText={setMarketPrice} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Outputs</AppText>
            {!out && <AppText style={styles.warnText}>Use valid values to compute. If volatility is blank, add market option price.</AppText>}
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Theoretical Price</AppText><AppText style={styles.levelValue}>{out ? fmt(out.price) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Implied Volatility</AppText><AppText style={styles.levelValue}>{out?.impliedVol != null ? `${fmt(out.impliedVol)}%` : '--'}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Delta</AppText><AppText style={styles.levelValue}>{out ? fmt(out.delta, 4) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Gamma</AppText><AppText style={styles.levelValue}>{out ? fmt(out.gamma, 6) : '--'}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Theta (per day)</AppText><AppText style={styles.levelValue}>{out ? fmt(out.theta, 4) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Vega (per 1%)</AppText><AppText style={styles.levelValue}>{out ? fmt(out.vega, 4) : '--'}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Rho (per 1%)</AppText><AppText style={styles.levelValue}>{out ? fmt(out.rho, 4) : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Break-even @ expiry</AppText><AppText style={styles.levelValue}>{out ? fmt(out.breakEven) : '--'}</AppText></View>
            </View>
            <AppText style={styles.tipText}>Model assumptions apply. Use outputs as guidance with market context.</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}
function CAGRTool({ navigation, styles, themeColors, openSite }) {
  const { width: screenW } = useWindowDimensions();
  const isTinyScreen = screenW < 350;
  const isNarrowScreen = screenW < 430;
  const isSmallScreen = screenW < 380;
  const [beginValue, setBeginValue] = useState('10000');
  const [endValue, setEndValue] = useState('12100');
  const [years, setYears] = useState('2');
  const [inflation, setInflation] = useState('0');

  const out = useMemo(() => {
    const b = toNum(beginValue);
    const e = toNum(endValue);
    const y = toNum(years);
    const inf = (toNum(inflation) || 0) / 100;
    if (b == null || e == null || y == null || b <= 0 || e <= 0 || y <= 0) return null;

    const cagr = Math.pow(e / b, 1 / y) - 1;
    const total = (e / b - 1) * 100;
    const realCagr = ((1 + cagr) / (1 + inf) - 1);
    const doublingExact = cagr > 0 ? Math.log(2) / Math.log(1 + cagr) : null;
    const rule72 = cagr > 0 ? 72 / (cagr * 100) : null;

    const points = Array.from({ length: 9 }, (_, i) => {
      const t = (y * i) / 8;
      const nominal = b * Math.pow(1 + cagr, t);
      const real = b * Math.pow(1 + realCagr, t);
      return { t, nominal, real };
    });

    return { b, e, y, cagr, total, realCagr, doublingExact, rule72, points };
  }, [beginValue, endValue, years, inflation]);

  const chart = useMemo(() => {
    if (!out) return null;
    const width = Math.max(isTinyScreen ? 236 : 252, Math.min(360, screenW - (isTinyScreen ? 30 : 40)));
    const height = 190;
    const left = isTinyScreen ? 42 : isSmallScreen ? 46 : 50;
    const right = 12;
    const top = 12;
    const bottom = isSmallScreen ? 32 : 36;
    const plotW = width - left - right;
    const plotH = height - top - bottom;
    const maxY = Math.max(...out.points.map((p) => Math.max(p.nominal, p.real)));
    const minY = Math.min(...out.points.map((p) => Math.min(p.nominal, p.real)));

    const xFor = (t) => left + (t / out.y) * plotW;
    const yFor = (v) => top + (1 - (v - minY) / Math.max(maxY - minY, 1)) * plotH;

    return {
      width,
      height,
      left,
      top,
      plotW,
      plotH,
      minY,
      maxY,
      xFor,
      yFor,
      nominalLine: out.points.map((p) => `${xFor(p.t)},${yFor(p.nominal)}`).join(' '),
      realLine: out.points.map((p) => `${xFor(p.t)},${yFor(p.real)}`).join(' '),
      xTicks: isTinyScreen ? [0, out.y] : [0, out.y / 2, out.y],
      yTicks: isTinyScreen ? [minY, maxY] : [minY, (minY + maxY) / 2, maxY],
    };
  }, [isSmallScreen, isTinyScreen, out, screenW]);

  const yTickLabel = (v) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return `${Math.round(v)}`;
  };

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="CAGR - Compound Annual Growth Rate" subtitle="Annualized geometric return from starting value to ending value." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Geometric mean</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Real vs nominal</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Doubling time</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the CAGR calculator</AppText>
          <AppText style={styles.sectionBody}>Enter beginning value, ending value and years. Optionally add inflation for real CAGR.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Compound Annual Growth Rate</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Beginning Value</AppText><AppTextInput value={beginValue} onChangeText={setBeginValue} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Ending Value</AppText><AppTextInput value={endValue} onChangeText={setEndValue} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Years</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Inflation % (optional)</AppText><AppTextInput value={inflation} onChangeText={setInflation} keyboardType="numeric" style={styles.input} /></View>
            </View>
            {!out && <AppText style={styles.warnText}>Use valid positive values for beginning, ending and years.</AppText>}
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Results</AppText>
            <View style={styles.heroTagRow}>
              <View style={styles.badgePill}><AppText style={styles.badgeText}>{out ? `CAGR: ${fmt(out.cagr * 100)}%` : 'CAGR: --'}</AppText></View>
              <View style={styles.badgePill}><AppText style={styles.badgeText}>{out ? `Total: ${fmt(out.total)}%` : 'Total: --'}</AppText></View>
              <View style={styles.badgePill}><AppText style={styles.badgeText}>{out ? `Real CAGR: ${fmt(out.realCagr * 100)}%` : 'Real CAGR: --'}</AppText></View>
              <View style={styles.badgePill}><AppText style={styles.badgeText}>{out?.doublingExact ? `Doubling ~ ${fmt(out.doublingExact, 2)}y` : 'Doubling: --'}</AppText></View>
            </View>

            {!!chart && (
              <View style={styles.chartWrap}>
                <Svg width="100%" height={chart.height} viewBox={`0 0 ${chart.width} ${chart.height}`}>
                  {chart.yTicks.map((v, i) => (
                    <Line key={`cagr-gy-${i}`} x1={chart.left} x2={chart.left + chart.plotW} y1={chart.yFor(v)} y2={chart.yFor(v)} stroke={themeColors.border} strokeWidth="1" opacity={0.45} />
                  ))}
                  {chart.xTicks.map((t, i) => (
                    <Line key={`cagr-gx-${i}`} x1={chart.xFor(t)} x2={chart.xFor(t)} y1={chart.top} y2={chart.top + chart.plotH} stroke={themeColors.border} strokeWidth="1" opacity={0.3} />
                  ))}
                  <Line x1={chart.left} x2={chart.left} y1={chart.top} y2={chart.top + chart.plotH} stroke={themeColors.textPrimary} strokeWidth="1.8" />
                  <Line x1={chart.left} x2={chart.left + chart.plotW} y1={chart.top + chart.plotH} y2={chart.top + chart.plotH} stroke={themeColors.textMuted} strokeWidth="1.2" />
                  <Polyline points={chart.nominalLine} fill="none" stroke="#f3c33c" strokeWidth="2.2" />
                  <Polyline points={chart.realLine} fill="none" stroke="#2ec5ff" strokeWidth="2" strokeDasharray="5,4" />
                  {chart.yTicks.map((v, i) => (
                    <SvgText key={`cagr-yl-${i}`} x={chart.left - 6} y={chart.yFor(v) + 3} fill={themeColors.textMuted} fontSize={isSmallScreen ? '8' : '9'} textAnchor="end">
                      {yTickLabel(v)}
                    </SvgText>
                  ))}
                  {chart.xTicks.map((t, i) => (
                    <SvgText key={`cagr-xl-${i}`} x={chart.xFor(t)} y={chart.top + chart.plotH + 14} fill={themeColors.textMuted} fontSize={isSmallScreen ? '8' : '9'} textAnchor="middle">
                      {isNarrowScreen ? `${Math.round(t)}` : fmt(t, 1)}
                    </SvgText>
                  ))}
                  <SvgText x={(chart.left + chart.left + chart.plotW) / 2} y={chart.height - 4} fill={themeColors.textMuted} fontSize={isSmallScreen ? '9' : '10'} textAnchor="middle">
                    {isSmallScreen ? 'Years' : 'Years (X-axis)'}
                  </SvgText>
                </Svg>
              </View>
            )}
            <AppText style={styles.tipText}>{out ? `Rule-72 estimate: ${out.rule72 ? fmt(out.rule72, 2) : '--'} years` : 'Rule-72 estimate: --'}</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function RetirementCorpusTool({ navigation, styles, themeColors, openSite }) {
  const { width: screenW } = useWindowDimensions();
  const isTinyScreen = screenW < 350;
  const isNarrowScreen = screenW < 430;
  const isSmallScreen = screenW < 380;
  const [currentAge, setCurrentAge] = useState('35');
  const [retAge, setRetAge] = useState('60');
  const [currentPortfolio, setCurrentPortfolio] = useState('80000');
  const [monthlyContribution, setMonthlyContribution] = useState('1000');
  const [expectedReturn, setExpectedReturn] = useState('7');
  const [inflation, setInflation] = useState('3');
  const [withdrawalRate, setWithdrawalRate] = useState('4');
  const [targetSpend, setTargetSpend] = useState('48000');
  const [otherIncome, setOtherIncome] = useState('0');

  const out = useMemo(() => {
    const age = toNum(currentAge);
    const ra = toNum(retAge);
    const pv = toNum(currentPortfolio);
    const pm = toNum(monthlyContribution);
    const r = (toNum(expectedReturn) || 0) / 100;
    const inf = (toNum(inflation) || 0) / 100;
    const wr = (toNum(withdrawalRate) || 0) / 100;
    const spend = toNum(targetSpend);
    const income = toNum(otherIncome) || 0;
    if ([age, ra, pv, pm, spend].some((v) => v == null) || ra <= age || pv < 0 || pm < 0 || wr <= 0) return null;

    const years = ra - age;
    const months = Math.max(1, Math.round(years * 12));
    const rm = r / 12;
    const fvPv = pv * Math.pow(1 + rm, months);
    const fvContrib = rm > 0 ? pm * ((Math.pow(1 + rm, months) - 1) / rm) : pm * months;
    const projected = fvPv + fvContrib;

    const retirementSpend = spend * Math.pow(1 + inf, years);
    const netSpend = Math.max(0, retirementSpend - income);
    const requiredNest = wr > 0 ? netSpend / wr : 0;
    const fundedRatio = requiredNest > 0 ? Math.min(100, (projected / requiredNest) * 100) : 100;
    const shortfall = Math.max(0, requiredNest - projected);
    const neededMonthly = shortfall > 0
      ? (rm > 0 ? shortfall * rm / (Math.pow(1 + rm, months) - 1) : shortfall / months)
      : 0;

    const path = Array.from({ length: years + 1 }, (_, i) => {
      const m = i * 12;
      const val = pv * Math.pow(1 + rm, m) + (rm > 0 ? pm * ((Math.pow(1 + rm, m) - 1) / rm) : pm * m);
      const req = requiredNest * (i / Math.max(years, 1));
      return { x: i, val, req };
    });

    return { years, projected, requiredNest, fundedRatio, shortfall, neededMonthly, retirementSpend, path };
  }, [currentAge, retAge, currentPortfolio, monthlyContribution, expectedReturn, inflation, withdrawalRate, targetSpend, otherIncome]);

  const chart = useMemo(() => {
    if (!out) return null;
    const width = Math.max(isTinyScreen ? 236 : 252, Math.min(360, screenW - (isTinyScreen ? 30 : 40)));
    const height = 170;
    const left = isTinyScreen ? 34 : isSmallScreen ? 38 : 44;
    const right = 10;
    const top = 12;
    const bottom = isSmallScreen ? 30 : 34;
    const plotW = width - left - right;
    const plotH = height - top - bottom;
    const maxY = Math.max(...out.path.map((p) => Math.max(p.val, p.req)), 1);
    const xFor = (x) => left + (x / Math.max(out.years, 1)) * plotW;
    const yFor = (v) => top + (1 - v / maxY) * plotH;

    return {
      width,
      height,
      left,
      top,
      plotW,
      plotH,
      maxY,
      xFor,
      yFor,
      xTicks: isTinyScreen ? [0, out.years] : [0, out.years / 2, out.years],
      yTicks: isTinyScreen ? [0, maxY] : [0, maxY / 2, maxY],
      valLine: out.path.map((p) => `${xFor(p.x)},${yFor(p.val)}`).join(' '),
      reqLine: out.path.map((p) => `${xFor(p.x)},${yFor(p.req)}`).join(' '),
    };
  }, [isSmallScreen, isTinyScreen, out, screenW]);

  const yTickLabel = (v) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return `${Math.round(v)}`;
  };

  const ring = useMemo(() => {
    const ratio = out ? Math.max(0, Math.min(100, out.fundedRatio)) : 0;
    const r = 32;
    const c = 2 * Math.PI * r;
    return { ratio, r, c, offset: c - (ratio / 100) * c };
  }, [out]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Plan Your Retirement, Clearly" subtitle="Project your portfolio and compare with required nest egg." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Projection</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>4% withdrawal</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Contribution solver</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Retirement calculator</AppText>
          <AppText style={styles.sectionBody}>Enter age, current savings, monthly contribution, growth, inflation and target spending.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Inputs</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Current age</AppText><AppTextInput value={currentAge} onChangeText={setCurrentAge} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Retirement age</AppText><AppTextInput value={retAge} onChangeText={setRetAge} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Current portfolio ($)</AppText><AppTextInput value={currentPortfolio} onChangeText={setCurrentPortfolio} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Monthly contribution ($)</AppText><AppTextInput value={monthlyContribution} onChangeText={setMonthlyContribution} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Expected return (%)</AppText><AppTextInput value={expectedReturn} onChangeText={setExpectedReturn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Inflation (%)</AppText><AppTextInput value={inflation} onChangeText={setInflation} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Withdrawal rate (%)</AppText><AppTextInput value={withdrawalRate} onChangeText={setWithdrawalRate} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Other income (annual)</AppText><AppTextInput value={otherIncome} onChangeText={setOtherIncome} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Target annual spending (today)</AppText><AppTextInput value={targetSpend} onChangeText={setTargetSpend} keyboardType="numeric" style={styles.input} /></View>
            </View>
            {!out && <AppText style={styles.warnText}>Use valid values and set retirement age greater than current age.</AppText>}
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Results</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Projected portfolio</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.projected)}` : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Required nest egg</AppText><AppText style={styles.levelValue}>{out ? `$${fmt(out.requiredNest)}` : '--'}</AppText></View>
            </View>

            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelSup, { alignItems: 'center' }]}>
                <Svg width="90" height="90" viewBox="0 0 90 90">
                  <Circle cx="45" cy="45" r={ring.r} stroke={themeColors.border} strokeWidth="10" fill="none" />
                  <Circle cx="45" cy="45" r={ring.r} stroke="#ff5a5a" strokeWidth="10" fill="none" strokeDasharray={`${ring.c} ${ring.c}`} strokeDashoffset={ring.offset} strokeLinecap="round" transform="rotate(-90 45 45)" />
                </Svg>
                <AppText style={styles.tipText}>{out ? `Funded ratio: ${fmt(out.fundedRatio)}%` : 'Funded ratio: --'}</AppText>
              </View>
              <View style={[styles.levelBox, styles.levelPivot]}>
                <AppText style={styles.levelLabel}>Shortfall at retirement</AppText>
                <AppText style={styles.levelValue}>{out ? `$${fmt(out.shortfall)}` : '--'}</AppText>
                <AppText style={styles.tipText}>{out ? `Save +$${fmt(out.neededMonthly)}/month to close gap` : ''}</AppText>
              </View>
            </View>

            {!!chart && (
              <View style={styles.chartWrap}>
                <Svg width="100%" height={chart.height} viewBox={`0 0 ${chart.width} ${chart.height}`}>
                  {chart.yTicks.map((v, i) => (
                    <Line key={`ret-gy-${i}`} x1={chart.left} x2={chart.left + chart.plotW} y1={chart.yFor(v)} y2={chart.yFor(v)} stroke={themeColors.border} strokeWidth="1" opacity={0.45} />
                  ))}
                  {chart.xTicks.map((x, i) => (
                    <Line key={`ret-gx-${i}`} x1={chart.xFor(x)} x2={chart.xFor(x)} y1={chart.top} y2={chart.top + chart.plotH} stroke={themeColors.border} strokeWidth="1" opacity={0.3} />
                  ))}
                  <Line x1={chart.left} x2={chart.left} y1={chart.top} y2={chart.top + chart.plotH} stroke={themeColors.textMuted} strokeWidth="1" />
                  <Line x1={chart.left} x2={chart.left + chart.plotW} y1={chart.top + chart.plotH} y2={chart.top + chart.plotH} stroke={themeColors.textMuted} strokeWidth="1" />
                  <Polyline points={chart.valLine} fill="none" stroke="#40c4ff" strokeWidth="2.4" />
                  <Polyline points={chart.reqLine} fill="none" stroke="#a78bfa" strokeWidth="2.4" strokeDasharray="5,4" />
                  {chart.yTicks.map((v, i) => (
                    <SvgText key={`ret-yl-${i}`} x={chart.left - 5} y={chart.yFor(v) + 3} fill={themeColors.textMuted} fontSize={isSmallScreen ? '8' : '9'} textAnchor="end">
                      {yTickLabel(v)}
                    </SvgText>
                  ))}
                  {chart.xTicks.map((x, i) => (
                    <SvgText key={`ret-xl-${i}`} x={chart.xFor(x)} y={chart.top + chart.plotH + 14} fill={themeColors.textMuted} fontSize={isSmallScreen ? '8' : '9'} textAnchor="middle">
                      {isNarrowScreen ? `${Math.round(x)}` : fmt(x, 1)}
                    </SvgText>
                  ))}
                  <SvgText x={(chart.left + chart.left + chart.plotW) / 2} y={chart.height - 4} fill={themeColors.textMuted} fontSize={isSmallScreen ? '9' : '10'} textAnchor="middle">
                    {isSmallScreen ? 'Years' : 'Years (X-axis)'}
                  </SvgText>
                  {!isNarrowScreen && (
                    <SvgText x={14} y={chart.top + (chart.plotH / 2)} fill={themeColors.textMuted} fontSize="10" textAnchor="middle" transform={`rotate(-90, 14, ${chart.top + (chart.plotH / 2)})`}>
                      Value (Y-axis)
                    </SvgText>
                  )}
                </Svg>
              </View>
            )}
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function NPVTool({ navigation, styles, themeColors, openSite }) {
  const [initialInvestment, setInitialInvestment] = useState('10000');
  const [discountRate, setDiscountRate] = useState('10');
  const [cashFlows, setCashFlows] = useState(['2000', '3000', '4000', '5000']);

  const addPeriod = () => setCashFlows((prev) => [...prev, '0']);
  const removePeriod = (idx) => setCashFlows((prev) => prev.filter((_, i) => i !== idx));
  const updateFlow = (idx, value) => setCashFlows((prev) => prev.map((v, i) => (i === idx ? value : v)));

  const out = useMemo(() => {
    const inv = toNum(initialInvestment);
    const r = (toNum(discountRate) || 0) / 100;
    if (inv == null || inv < 0) return null;

    let npv = -inv;
    const rows = [];
    let cumulative = -inv;
    for (let i = 0; i < cashFlows.length; i += 1) {
      const cf = toNum(cashFlows[i]) || 0;
      const pv = cf / Math.pow(1 + r, i + 1);
      cumulative += pv;
      npv += pv;
      rows.push({ year: i + 1, cf, pv, cumulative });
    }
    return { inv, rate: r, npv, rows, profitable: npv >= 0 };
  }, [initialInvestment, discountRate, cashFlows]);

  const ring = useMemo(() => {
    const val = out ? Math.max(0, Math.min(100, Math.abs(out.npv) / Math.max(out.inv, 1) * 100)) : 0;
    const r = 24;
    const c = 2 * Math.PI * r;
    return { r, c, offset: c - (val / 100) * c };
  }, [out]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="NPV Calculator - Net Present Value" subtitle="Discount future cash flows to evaluate project value creation." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>NPV Calculator</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Present Value</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Cash Flow Discounting</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the NPV calculator</AppText>
          <AppText style={styles.sectionBody}>Enter initial investment, discount rate and yearly cash flows. Positive NPV suggests value creation.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Investment Parameters</AppText>
            <View style={styles.fieldFull}><AppText style={styles.label}>Initial Investment ($)</AppText><AppTextInput value={initialInvestment} onChangeText={setInitialInvestment} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Discount Rate (%)</AppText><AppTextInput value={discountRate} onChangeText={setDiscountRate} keyboardType="numeric" style={styles.input} /></View>
            <AppText style={styles.sectionTitle}>Cash Flows ($)</AppText>
            {cashFlows.map((v, idx) => (
              <View key={`cf-${idx}`} style={[styles.resultRow, styles.deleteRow]}>
                <View style={[styles.levelBox, styles.levelPivot]}>
                  <AppText style={styles.levelLabel}>{`Year ${idx + 1}`}</AppText>
                  <AppTextInput value={v} onChangeText={(next) => updateFlow(idx, next)} keyboardType="numeric" style={styles.input} />
                </View>
                <Pressable style={[styles.ghostBtn, styles.deleteIconBtn]} onPress={() => removePeriod(idx)}><Trash2 size={20} color={themeColors.textPrimary} /></Pressable>
              </View>
            ))}
            <Pressable style={styles.ghostBtn} onPress={addPeriod}><AppText style={styles.ghostBtnText}>+ Add Period</AppText></Pressable>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>NPV Visualization</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot, { alignItems: 'center' }]}>
                <Svg width="74" height="74" viewBox="0 0 74 74">
                  <Circle cx="37" cy="37" r={ring.r} stroke={themeColors.border} strokeWidth="8" fill="none" />
                  <Circle cx="37" cy="37" r={ring.r} stroke={out?.profitable ? '#35be8a' : '#ef4444'} strokeWidth="8" fill="none" strokeDasharray={`${ring.c} ${ring.c}`} strokeDashoffset={ring.offset} strokeLinecap="round" transform="rotate(-90 37 37)" />
                </Svg>
                <AppText style={styles.levelValue}>{out ? fmt(out.npv) : '--'}</AppText>
                <AppText style={styles.tipText}>{out ? (out.profitable ? 'Profitable' : 'Negative') : ''}</AppText>
              </View>
            </View>
            <View style={styles.card}>
              <AppText style={styles.sectionTitle}>NPV Breakdown by Year</AppText>
              {out?.rows.map((row) => (
                <View key={`row-${row.year}`} style={styles.resultRow}>
                  <AppText style={styles.label}>{`Year ${row.year}`}</AppText>
                  <AppText style={styles.tipText}>{`CF: ${fmt(row.cf)}  PV: ${fmt(row.pv)}  Cum: ${fmt(row.cumulative)}`}</AppText>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>NPV Analysis</AppText>
          <View style={[styles.levelBox, styles.levelPivot]}>
            <AppText style={styles.levelLabel}>Net Present Value</AppText>
            <AppText style={styles.bigMetric}>{out ? `$${fmt(out.npv)}` : '--'}</AppText>
            <AppText style={styles.tipText}>Present value of cash inflows minus initial investment</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function ROITool({ navigation, styles, themeColors, openSite }) {
  const [entryPrice, setEntryPrice] = useState('120.50');
  const [exitPrice, setExitPrice] = useState('132.00');
  const [transactionType, setTransactionType] = useState('Buy / Long');
  const [lotSize, setLotSize] = useState('1');
  const [fees, setFees] = useState('15');

  const [baseValue, setBaseValue] = useState('25000');
  const [newValue, setNewValue] = useState('30000');

  const [cagrBegin, setCagrBegin] = useState('300000');
  const [cagrEnd, setCagrEnd] = useState('500000');
  const [cagrYears, setCagrYears] = useState('5');

  const roiOut = useMemo(() => {
    const e = toNum(entryPrice);
    const x = toNum(exitPrice);
    const lot = toNum(lotSize);
    const f = toNum(fees) || 0;
    if (e == null || x == null || lot == null || e <= 0 || lot <= 0) return null;
    const dir = transactionType === 'Sell / Short' ? -1 : 1;
    const gross = (x - e) * lot * dir;
    const cost = Math.abs(e * lot);
    const net = gross - f;
    const roiPct = cost > 0 ? (net / cost) * 100 : null;
    return { gross, net, roiPct };
  }, [entryPrice, exitPrice, lotSize, fees, transactionType]);

  const changeOut = useMemo(() => {
    const b = toNum(baseValue);
    const n = toNum(newValue);
    if (b == null || n == null || b === 0) return null;
    const pct = ((n - b) / Math.abs(b)) * 100;
    return { pct };
  }, [baseValue, newValue]);

  const cagrOut = useMemo(() => {
    const b = toNum(cagrBegin);
    const e = toNum(cagrEnd);
    const y = toNum(cagrYears);
    if (b == null || e == null || y == null || b <= 0 || e <= 0 || y <= 0) return null;
    const cagr = (Math.pow(e / b, 1 / y) - 1) * 100;
    return { cagr };
  }, [cagrBegin, cagrEnd, cagrYears]);

  const cagrRing = useMemo(() => {
    const value = cagrOut ? Math.min(100, Math.abs(cagrOut.cagr) * 2) : 0;
    const r = 26;
    const c = 2 * Math.PI * r;
    return { r, c, offset: c - (value / 100) * c };
  }, [cagrOut]);

  const resetRoi = () => {
    setEntryPrice('120.50');
    setExitPrice('132.00');
    setTransactionType('Buy / Long');
    setLotSize('1');
    setFees('15');
  };

  const resetChange = () => {
    setBaseValue('25000');
    setNewValue('30000');
  };

  const resetCagr = () => {
    setCagrBegin('300000');
    setCagrEnd('500000');
    setCagrYears('5');
  };

  const changeBar = changeOut ? Math.max(0, Math.min(100, Math.abs(changeOut.pct))) : 0;

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="ROI, % Change & CAGR" subtitle="ROI Calculator and annualized return in one workspace." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>ROI Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Entry price</AppText><AppTextInput value={entryPrice} onChangeText={setEntryPrice} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Exit price</AppText><AppTextInput value={exitPrice} onChangeText={setExitPrice} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}>
                <AppText style={styles.label}>Transaction type</AppText>
                <View style={styles.btnRow}>
                  <Pressable style={transactionType === 'Buy / Long' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setTransactionType('Buy / Long')}><AppText style={transactionType === 'Buy / Long' ? styles.primaryBtnText : styles.ghostBtnText}>Buy / Long</AppText></Pressable>
                  <Pressable style={transactionType === 'Sell / Short' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setTransactionType('Sell / Short')}><AppText style={transactionType === 'Sell / Short' ? styles.primaryBtnText : styles.ghostBtnText}>Sell / Short</AppText></Pressable>
                </View>
              </View>
              <View style={styles.field}><AppText style={styles.label}>Lot size</AppText><AppTextInput value={lotSize} onChangeText={setLotSize} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Transaction fees (optional)</AppText><AppTextInput value={fees} onChangeText={setFees} keyboardType="numeric" style={styles.input} /></View>
            </View>
            <View style={styles.btnRow}>
              <Pressable style={styles.primaryBtn}><AppText style={styles.primaryBtnText}>Calculate</AppText></Pressable>
              <Pressable style={styles.ghostBtn} onPress={resetRoi}><AppText style={styles.ghostBtnText}>Reset</AppText></Pressable>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Gross P/L</AppText><AppText style={styles.levelValue}>{roiOut ? `${fmt(roiOut.gross)}` : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Net P/L</AppText><AppText style={styles.levelValue}>{roiOut ? `${fmt(roiOut.net)}` : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>ROI (%)</AppText><AppText style={styles.levelValue}>{roiOut?.roiPct != null ? `${fmt(roiOut.roiPct)}%` : '--'}</AppText></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Annualized Return (CAGR)</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Beginning balance</AppText><AppTextInput value={cagrBegin} onChangeText={setCagrBegin} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Ending balance</AppText><AppTextInput value={cagrEnd} onChangeText={setCagrEnd} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Years</AppText><AppTextInput value={cagrYears} onChangeText={setCagrYears} keyboardType="numeric" style={styles.input} /></View>
            </View>
            <View style={styles.btnRow}>
              <Pressable style={styles.primaryBtn}><AppText style={styles.primaryBtnText}>Calculate</AppText></Pressable>
              <Pressable style={styles.ghostBtn} onPress={resetCagr}><AppText style={styles.ghostBtnText}>Reset</AppText></Pressable>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}>
                <AppText style={styles.levelLabel}>Annualized return</AppText>
                <AppText style={styles.levelValue}>{cagrOut ? `${fmt(cagrOut.cagr)}%` : '--'}</AppText>
              </View>
              <View style={[styles.levelBox, styles.levelSup, styles.alignCenter]}>
                <AppText style={styles.levelLabel}>CAGR gauge</AppText>
                <Svg width="74" height="74" viewBox="0 0 74 74">
                  <Circle cx="37" cy="37" r={cagrRing.r} stroke={themeColors.border} strokeWidth="8" fill="none" />
                  <Circle cx="37" cy="37" r={cagrRing.r} stroke={cagrOut && cagrOut.cagr >= 0 ? '#35be8a' : '#ef476f'} strokeWidth="8" fill="none" strokeDasharray={`${cagrRing.c} ${cagrRing.c}`} strokeDashoffset={cagrRing.offset} strokeLinecap="round" transform="rotate(-90 37 37)" />
                </Svg>
                <AppText style={styles.tipText}>{cagrOut ? (cagrOut.cagr >= 0 ? 'Growth' : 'Shrink') : '--'}</AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Percentage Change</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Base value</AppText><AppTextInput value={baseValue} onChangeText={setBaseValue} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>New value</AppText><AppTextInput value={newValue} onChangeText={setNewValue} keyboardType="numeric" style={styles.input} /></View>
            </View>
            <View style={styles.btnRow}>
              <Pressable style={styles.primaryBtn}><AppText style={styles.primaryBtnText}>Calculate</AppText></Pressable>
              <Pressable style={styles.ghostBtn} onPress={resetChange}><AppText style={styles.ghostBtnText}>Reset</AppText></Pressable>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Change</AppText><AppText style={styles.levelValue}>{changeOut ? `${fmt(changeOut.pct)}%` : '--'}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}>
                <AppText style={styles.levelLabel}>Visualizer (-100% to +100%)</AppText>
                <View style={styles.gaugeTrack}><View style={[styles.gaugeFill, { width: `${changeBar}%`, backgroundColor: changeOut && changeOut.pct < 0 ? '#ef4444' : '#1dc7a0' }]} /></View>
              </View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Quick reference</AppText>
            <AppText style={styles.sectionBody}><AppText style={styles.boldMuted}>ROI</AppText> compares net profit to cost (including fees). Ignores time.</AppText>
            <AppText style={styles.sectionBody}><AppText style={styles.boldMuted}>% change</AppText> shows how far a value moved from its base.</AppText>
            <AppText style={styles.sectionBody}><AppText style={styles.boldMuted}>Annualized (CAGR)</AppText> normalizes return to a yearly rate for different holding periods.</AppText>
            <View style={styles.divider} />
            <AppText style={styles.tipText}>Formulas: ROI = (Net Profit / Cost) x 100. %Change = (New - Old) / Old x 100. CAGR = ((Ending / Beginning)^(1/Years) - 1) x 100.</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

const calcIRRFromFlows = (flows) => {
  const hasPos = flows.some((v) => v > 0);
  const hasNeg = flows.some((v) => v < 0);
  if (!hasPos || !hasNeg) return null;

  let rate = 0.1;
  for (let i = 0; i < 80; i += 1) {
    let f = 0;
    let df = 0;
    for (let t = 0; t < flows.length; t += 1) {
      const den = Math.pow(1 + rate, t);
      f += flows[t] / den;
      if (t > 0) df += (-t * flows[t]) / Math.pow(1 + rate, t + 1);
    }
    if (!Number.isFinite(f) || !Number.isFinite(df) || Math.abs(df) < 1e-10) break;
    const next = rate - f / df;
    if (Math.abs(next - rate) < 1e-8) return next;
    rate = next;
    if (rate <= -0.99 || rate > 20) break;
  }

  let lo = -0.99;
  let hi = 10;
  const npv = (r) => flows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0);
  let fLo = npv(lo);
  let fHi = npv(hi);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) return null;
  for (let i = 0; i < 120; i += 1) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-7) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
};

function IRRTool({ navigation, styles, themeColors, openSite }) {
  const [initialInvestment, setInitialInvestment] = useState('10000');
  const [cashFlows, setCashFlows] = useState(['2000', '3000', '4000', '5000']);

  const addPeriod = () => setCashFlows((prev) => [...prev, '0']);
  const removePeriod = (idx) => setCashFlows((prev) => prev.filter((_, i) => i !== idx));
  const updateFlow = (idx, value) => setCashFlows((prev) => prev.map((v, i) => (i === idx ? value : v)));

  const out = useMemo(() => {
    const inv = toNum(initialInvestment);
    if (inv == null || inv < 0) return null;
    const flows = [-inv, ...cashFlows.map((v) => toNum(v) || 0)];
    const irr = calcIRRFromFlows(flows);
    if (irr == null) return { irr: null, flows, inv, periods: cashFlows.length, npvAtIrr: null };
    const npvAtIrr = flows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + irr, t), 0);
    return { irr, flows, inv, periods: cashFlows.length, npvAtIrr };
  }, [initialInvestment, cashFlows]);

  const ring = useMemo(() => {
    const val = out?.irr != null ? Math.max(0, Math.min(100, Math.abs(out.irr) * 300)) : 0;
    const r = 24;
    const c = 2 * Math.PI * r;
    return { r, c, offset: c - (val / 100) * c };
  }, [out]);

  const maxFlow = useMemo(() => {
    const vals = cashFlows.map((v) => Math.abs(toNum(v) || 0));
    return Math.max(...vals, 1);
  }, [cashFlows]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="IRR Calculator" subtitle="Internal Rate of Return from initial outflow and periodic cash flows." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>IRR Calculator</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Investment Analysis</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Cash Flow Analysis</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the IRR calculator</AppText>
          <AppText style={styles.sectionBody}>Add initial investment and cash flows by period. IRR is the discount rate where NPV becomes zero.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Investment Parameters</AppText>
            <View style={styles.fieldFull}><AppText style={styles.label}>Initial Investment ($)</AppText><AppTextInput value={initialInvestment} onChangeText={setInitialInvestment} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.divider} />
            <AppText style={styles.sectionTitle}>Cash Flows ($)</AppText>
            {cashFlows.map((v, idx) => (
              <View key={`irr-${idx}`} style={[styles.resultRow, styles.deleteRow]}>
                <View style={[styles.levelBox, styles.levelPivot]}>
                  <AppText style={styles.levelLabel}>{`Year ${idx + 1}`}</AppText>
                  <AppTextInput value={v} onChangeText={(next) => updateFlow(idx, next)} keyboardType="numeric" style={styles.input} />
                </View>
                <Pressable style={[styles.ghostBtn, styles.deleteIconBtn]} onPress={() => removePeriod(idx)}><Trash2 size={20} color={themeColors.textPrimary} /></Pressable>
              </View>
            ))}
            <Pressable style={styles.ghostBtn} onPress={addPeriod}><AppText style={styles.ghostBtnText}>+ Add Period</AppText></Pressable>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>IRR Visualization</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelRes, styles.alignCenter]}>
                <Svg width="74" height="74" viewBox="0 0 74 74">
                  <Circle cx="37" cy="37" r={ring.r} stroke={themeColors.border} strokeWidth="8" fill="none" />
                  <Circle cx="37" cy="37" r={ring.r} stroke={out?.irr != null && out.irr >= 0 ? '#25c48b' : '#ef476f'} strokeWidth="8" fill="none" strokeDasharray={`${ring.c} ${ring.c}`} strokeDashoffset={ring.offset} strokeLinecap="round" transform="rotate(-90 37 37)" />
                </Svg>
                <AppText style={styles.levelValue}>{out?.irr != null ? `${fmt(out.irr * 100)}%` : '--'}</AppText>
                <AppText style={styles.tipText}>{out?.irr != null && out.irr >= 0 ? 'Positive return' : 'Check cash flow pattern'}</AppText>
              </View>
            </View>
            <View style={styles.chartWrap}>
              <AppText style={styles.label}>Cash Flow Timeline</AppText>
              <View style={styles.chartBars}>
                {cashFlows.map((v, idx) => {
                  const val = toNum(v) || 0;
                  const h = Math.max(10, (Math.abs(val) / maxFlow) * 100);
                  return (
                    <View key={`irrbar-${idx}`} style={styles.barCol}>
                      <View style={[styles.bar, val >= 0 ? styles.barGreen : styles.barRed, { height: `${h}%` }]} />
                      <AppText style={styles.barLbl}>{`Y${idx + 1}`}</AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>IRR Analysis</AppText>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}>
              <AppText style={styles.levelLabel}>Internal Rate of Return</AppText>
              <AppText style={styles.levelValue}>{out?.irr != null ? `${fmt(out.irr * 100)}%` : '--'}</AppText>
              <AppText style={styles.tipText}>Annualized return rate</AppText>
            </View>
            <View style={[styles.levelBox, styles.levelRes]}>
              <AppText style={styles.levelLabel}>NPV at IRR</AppText>
              <AppText style={styles.levelValue}>{out?.npvAtIrr != null ? `${fmt(out.npvAtIrr)}` : '--'}</AppText>
              <AppText style={styles.tipText}>Should be near zero</AppText>
            </View>
          </View>
          <View style={[styles.levelBox, styles.levelSup]}>
            <AppText style={styles.levelLabel}>Interpretation</AppText>
            <AppText style={styles.tipText}>{out?.irr == null ? 'IRR could not be solved. Ensure cash flows include both negative and positive values.' : out.irr >= 0 ? 'Positive IRR indicates potential profitability. Compare with required return hurdle.' : 'Negative IRR suggests value destruction under current assumptions.'}</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function DCFTool({ navigation, styles, themeColors, openSite }) {
  const [sharesOutstanding, setSharesOutstanding] = useState('100');
  const [discountRate, setDiscountRate] = useState('10');
  const [terminalGrowth, setTerminalGrowth] = useState('3');
  const [cashFlows, setCashFlows] = useState(['1000', '1200', '1400', '1600', '1800']);

  const addPeriod = () => setCashFlows((prev) => [...prev, '0']);
  const removePeriod = (idx) => setCashFlows((prev) => prev.filter((_, i) => i !== idx));
  const updateFlow = (idx, value) => setCashFlows((prev) => prev.map((v, i) => (i === idx ? value : v)));

  const out = useMemo(() => {
    const shares = toNum(sharesOutstanding);
    const r = (toNum(discountRate) || 0) / 100;
    const g = (toNum(terminalGrowth) || 0) / 100;
    if (shares == null || shares <= 0 || r <= 0) return null;

    const flows = cashFlows.map((v) => toNum(v) || 0);
    let explicitPv = 0;
    flows.forEach((cf, idx) => {
      explicitPv += cf / Math.pow(1 + r, idx + 1);
    });

    const last = flows[flows.length - 1] || 0;
    if (r <= g) {
      return { invalidSpread: true, shares, r, g, explicitPv, pvTerminal: 0, enterprise: explicitPv, perShare: explicitPv / shares, flows };
    }

    const terminalCf = last * (1 + g);
    const terminalValue = terminalCf / (r - g);
    const pvTerminal = terminalValue / Math.pow(1 + r, flows.length);
    const enterprise = explicitPv + pvTerminal;
    const perShare = enterprise / shares;

    return { invalidSpread: false, shares, r, g, explicitPv, pvTerminal, enterprise, perShare, flows };
  }, [sharesOutstanding, discountRate, terminalGrowth, cashFlows]);

  const maxFlow = useMemo(() => Math.max(...cashFlows.map((v) => Math.abs(toNum(v) || 0)), 1), [cashFlows]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="DCF Calculator" subtitle="Intrinsic value using discounted cash flow analysis." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Company Parameters</AppText>
            <View style={styles.fieldFull}><AppText style={styles.label}>Shares Outstanding</AppText><AppTextInput value={sharesOutstanding} onChangeText={setSharesOutstanding} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Discount Rate (%)</AppText><AppTextInput value={discountRate} onChangeText={setDiscountRate} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.fieldFull}><AppText style={styles.label}>Terminal Growth (%)</AppText><AppTextInput value={terminalGrowth} onChangeText={setTerminalGrowth} keyboardType="numeric" style={styles.input} /></View>
            <View style={styles.divider} />
            <AppText style={styles.sectionTitle}>Free Cash Flows ($)</AppText>
            {cashFlows.map((v, idx) => (
              <View key={`dcf-${idx}`} style={[styles.resultRow, styles.deleteRow]}>
                <View style={[styles.levelBox, styles.levelPivot]}>
                  <AppText style={styles.levelLabel}>{`Year ${idx + 1}`}</AppText>
                  <AppTextInput value={v} onChangeText={(next) => updateFlow(idx, next)} keyboardType="numeric" style={styles.input} />
                </View>
                <Pressable style={[styles.ghostBtn, styles.deleteIconBtn]} onPress={() => removePeriod(idx)}><Trash2 size={20} color={themeColors.textPrimary} /></Pressable>
              </View>
            ))}
            <Pressable style={styles.ghostBtn} onPress={addPeriod}><AppText style={styles.ghostBtnText}>+ Add Period</AppText></Pressable>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>DCF Valuation</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelRes]}>
                <AppText style={styles.levelLabel}>Intrinsic value per share</AppText>
                <AppText style={styles.levelValue}>{out ? `${fmt(out.perShare)}` : '--'}</AppText>
              </View>
              <View style={[styles.levelBox, styles.levelPivot]}>
                <AppText style={styles.levelLabel}>Enterprise value</AppText>
                <AppText style={styles.levelValue}>{out ? `${fmt(out.enterprise)}` : '--'}</AppText>
              </View>
            </View>
            <View style={styles.card}>
              <AppText style={styles.sectionTitle}>Value composition</AppText>
              <View style={styles.gaugeTrack}>
                <View style={[styles.gaugeFill, { width: out && out.enterprise > 0 ? `${Math.max(0, Math.min(100, (out.explicitPv / out.enterprise) * 100))}%` : '0%', backgroundColor: '#4e8cff' }]} />
              </View>
              <View style={styles.resultRow}>
                <AppText style={styles.tipText}>{out ? `Explicit CF: ${fmt(out.explicitPv)}` : 'Explicit CF: --'}</AppText>
                <AppText style={styles.tipText}>{out ? `Terminal: ${fmt(out.pvTerminal)}` : 'Terminal: --'}</AppText>
              </View>
              {out?.invalidSpread && <AppText style={styles.warnText}>Discount rate must be greater than terminal growth rate.</AppText>}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>DCF Analysis</AppText>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelPivot]}>
              <AppText style={styles.levelLabel}>Enterprise Value</AppText>
              <AppText style={styles.bigMetric}>{out ? `${fmt(out.enterprise)}` : '--'}</AppText>
            </View>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>PV of Cash Flows</AppText><AppText style={styles.levelValue}>{out ? `${fmt(out.explicitPv)}` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>PV of Terminal Value</AppText><AppText style={styles.levelValue}>{out ? `${fmt(out.pvTerminal)}` : '--'}</AppText></View>
            <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Terminal Growth</AppText><AppText style={styles.levelValue}>{out ? `${fmt(out.g * 100)}%` : '--'}</AppText></View>
          </View>
          <View style={styles.chartWrap}>
            <AppText style={styles.label}>Cash Flow Projection</AppText>
            <View style={styles.chartBars}>
              {cashFlows.map((v, idx) => {
                const val = toNum(v) || 0;
                const h = Math.max(10, (Math.abs(val) / maxFlow) * 100);
                return (
                  <View key={`dcfbar-${idx}`} style={styles.barCol}>
                    <View style={[styles.bar, styles.barGreen, { height: `${h}%` }]} />
                    <AppText style={styles.barLbl}>{`Y${idx + 1}`}</AppText>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

function PortfolioRiskStdTool({ navigation, styles, themeColors, openSite }) {
  const [assets, setAssets] = useState([
    { weight: '50', std: '20' },
    { weight: '50', std: '15' },
  ]);

  const addAsset = () => setAssets((prev) => [...prev, { weight: '0', std: '10' }]);
  const updateAsset = (idx, key, value) => setAssets((prev) => prev.map((a, i) => (i === idx ? { ...a, [key]: value } : a)));

  const out = useMemo(() => {
    const parsed = assets.map((a) => ({
      w: (toNum(a.weight) || 0) / 100,
      s: (toNum(a.std) || 0) / 100,
    }));
    const totalW = parsed.reduce((acc, p) => acc + p.w, 0);
    if (totalW <= 0) return null;

    const normalized = parsed.map((p) => ({ ...p, wn: p.w / totalW }));
    const variance = normalized.reduce((acc, p) => acc + Math.pow(p.wn * p.s, 2), 0);
    const std = Math.sqrt(variance);
    const contributions = normalized.map((p, i) => ({
      name: `Asset ${i + 1}`,
      risk: p.s * 100,
      weight: p.wn * 100,
    }));

    return { variance, std, contributions };
  }, [assets]);

  const maxStd = useMemo(() => {
    const vals = assets.map((a) => toNum(a.std) || 0);
    return Math.max(...vals, out ? out.std * 100 : 0, 1);
  }, [assets, out]);
  const yMax = useMemo(() => {
    const scaled = Math.ceil(maxStd / 5) * 5;
    return Math.max(5, scaled);
  }, [maxStd]);
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let v = 0; v <= yMax; v += 5) ticks.push(v);
    return ticks;
  }, [yMax]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title="Portfolio Risk (Std Dev) Calculator" subtitle="Estimate portfolio volatility from asset weights and standard deviations." />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Portfolio Risk</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Standard Deviation</AppText></View>
            <View style={styles.badgePill}><AppText style={styles.badgeText}>Risk Analysis</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>How to use the Portfolio Risk calculator</AppText>
          <AppText style={styles.sectionBody}>Enter each asset weight and expected volatility. This version assumes zero correlation among assets.</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Portfolio Assets</AppText>
            {assets.map((asset, idx) => (
              <View key={`asset-${idx}`} style={styles.subCard}>
                <AppText style={styles.label}>{`Asset ${idx + 1}`}</AppText>
                <View style={styles.grid}>
                  <View style={styles.field}><AppText style={styles.label}>Weight (%)</AppText><AppTextInput value={asset.weight} onChangeText={(v) => updateAsset(idx, 'weight', v)} keyboardType="numeric" style={styles.input} /></View>
                  <View style={styles.field}><AppText style={styles.label}>Std Dev (%)</AppText><AppTextInput value={asset.std} onChangeText={(v) => updateAsset(idx, 'std', v)} keyboardType="numeric" style={styles.input} /></View>
                </View>
              </View>
            ))}
            <Pressable style={styles.ghostBtn} onPress={addAsset}><AppText style={styles.ghostBtnText}>+ Add Asset</AppText></Pressable>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Risk Comparison</AppText>
            <View style={styles.chartWrap}>
              <View style={styles.riskChartRow}>
                <View style={styles.riskYAxisTitleWrap}>
                  <AppText numberOfLines={1} style={styles.riskYAxisTitle}>Std Dev (%)</AppText>
                </View>
                <View style={styles.riskChartMain}>
                  {yTicks.map((tick) => (
                    <View key={`risk-tick-${tick}`} style={[styles.riskTickRow, { bottom: `${(tick / yMax) * 100}%` }]}>
                      <AppText style={styles.riskTickText}>{tick}</AppText>
                      <View style={styles.riskGridLine} />
                    </View>
                  ))}
                  <View style={styles.riskBarsWrap}>
                    {assets.map((asset, idx) => {
                      const v = toNum(asset.std) || 0;
                      const h = Math.max(8, (v / yMax) * 100);
                      return (
                        <View key={`prisk-${idx}`} style={styles.barCol}>
                          <View style={[styles.bar, styles.levelPivot, { height: `${h}%`, borderWidth: 0, backgroundColor: '#4a8af0' }]} />
                          <AppText style={styles.barLbl}>{`Asset ${idx + 1}`}</AppText>
                        </View>
                      );
                    })}
                    <View style={styles.barCol}>
                      <View style={[styles.bar, styles.levelSup, { height: `${Math.max(8, out ? ((out.std * 100) / yMax) * 100 : 8)}%`, borderWidth: 0, backgroundColor: '#ef4444' }]} />
                      <AppText style={styles.barLbl}>Portfolio</AppText>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Portfolio Risk Analysis</AppText>
          <View style={[styles.levelBox, styles.levelPivot]}>
            <AppText style={styles.levelLabel}>Portfolio Standard Deviation</AppText>
            <AppText style={styles.levelValue}>{out ? `${fmt(out.std * 100)}%` : '--'}</AppText>
            <AppText style={styles.tipText}>Annual volatility</AppText>
          </View>
          <View style={[styles.levelBox, styles.levelSup]}>
            <AppText style={styles.levelLabel}>Portfolio Variance</AppText>
            <AppText style={styles.levelValue}>{out ? `${fmt(out.variance * 10000)}%^2` : '--'}</AppText>
          </View>
          <AppText style={styles.sectionTitle}>Asset Risk Contribution</AppText>
          <View style={styles.resultRow}>
            {out?.contributions.map((c) => (
              <View key={c.name} style={[styles.levelBox, styles.levelRes]}>
                <AppText style={styles.levelLabel}>{c.name}</AppText>
                <AppText style={styles.levelValue}>{fmt(c.risk)}%</AppText>
                <AppText style={styles.tipText}>{`Weight: ${fmt(c.weight)}%`}</AppText>
              </View>
            ))}
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

const getMobileTemplate = (calculator) => {
  const id = calculator?.id || '';
  const title = calculator?.title || 'Calculator';

  if (id.includes('loan') || id === 'emi' || id === 'mortgage' || id === 'house-affordability') {
    return {
      variant: 'loan',
      badges: ['Loan Planning', 'EMI', 'Affordability'],
      fields: [
        { key: 'principal', label: 'Loan amount', defaultValue: '2500000' },
        { key: 'rate', label: 'Interest rate (%)', defaultValue: '9.5' },
        { key: 'tenure', label: 'Tenure (years)', defaultValue: '20' },
        { key: 'income', label: 'Monthly income', defaultValue: '120000' },
      ],
      checklist: [
        'Compare EMI under 2 to 3 rate scenarios.',
        'Keep EMI near or below 35% of net monthly income.',
        'Preserve emergency fund before increasing tenure or amount.',
      ],
    };
  }

  if (id.includes('interest') || id === 'fd' || id === 'rd' || id === 'high-yield-savings') {
    return {
      variant: 'savings',
      badges: ['Interest', 'Savings', 'Compounding'],
      fields: [
        { key: 'principal', label: 'Starting amount', defaultValue: '100000' },
        { key: 'monthly', label: 'Monthly contribution', defaultValue: '5000' },
        { key: 'rate', label: 'Rate (%)', defaultValue: '7.5' },
        { key: 'years', label: 'Duration (years)', defaultValue: '10' },
      ],
      checklist: [
        'Use realistic post-tax rate assumptions.',
        'Track monthly contribution consistency.',
        'Increase contributions when income rises.',
      ],
    };
  }

  if (id in { 'sip': 1, 'lumpsum': 1, 'swp': 1, 'mutual-fund-return': 1, 'saving-growth': 1, 'save-money-goal': 1, 'retirement-savings-pf': 1, 'savings-last': 1, 'retirement-corpus': 1, '401k-retirement': 1, 'fire': 1 }) {
    return {
      variant: 'savings',
      badges: ['Goal Planning', 'Investing', 'Retirement'],
      fields: [
        { key: 'corpus', label: 'Current corpus', defaultValue: '500000' },
        { key: 'contribution', label: 'Monthly invest', defaultValue: '10000' },
        { key: 'return', label: 'Expected return (%)', defaultValue: '11' },
        { key: 'years', label: 'Time horizon (years)', defaultValue: '15' },
      ],
      checklist: [
        'Set a target and back-calculate required contribution.',
        'Review assumptions annually with inflation in mind.',
        'Increase SIP contribution over time (step-up).',
      ],
    };
  }

  if (id === 'sharpe-sortino' || id === 'correlation' || id === 'efficient-frontier' || id === 'portfolio-risk-std') {
    return {
      variant: 'portfolio',
      badges: ['Portfolio', 'Risk', 'Analytics'],
      fields: [
        { key: 'return', label: 'Portfolio return (%)', defaultValue: '12' },
        { key: 'rf', label: 'Risk-free rate (%)', defaultValue: '5' },
        { key: 'std', label: 'Std deviation (%)', defaultValue: '18' },
        { key: 'periods', label: 'Data periods', defaultValue: '60' },
      ],
      checklist: [
        'Use same timeframe for all assets.',
        'Check sample size before trusting ratio outputs.',
        'Validate outlier impact on volatility metrics.',
      ],
    };
  }

  if (id === 'dividend-pe' || id === 'property-valuation') {
    return {
      variant: 'portfolio',
      badges: ['Valuation', 'Income', 'Screening'],
      fields: [
        { key: 'price', label: 'Current price/value', defaultValue: '2500' },
        { key: 'earnings', label: 'EPS or annual income', defaultValue: '125' },
        { key: 'dividend', label: 'Dividend or rent', defaultValue: '40' },
        { key: 'growth', label: 'Growth rate (%)', defaultValue: '6' },
      ],
      checklist: [
        'Cross-check valuation with peer benchmarks.',
        'Avoid relying on a single ratio.',
        'Review quality and stability of cash flows.',
      ],
    };
  }

  if (id === 'net-worth' || id === 'spending' || id === 'emergency-fund' || id === 'life-insurance' || id === 'college-calculator') {
    return {
      variant: 'personal',
      badges: ['Personal Finance', 'Planning', 'Budget'],
      fields: [
        { key: 'income', label: 'Monthly income', defaultValue: '90000' },
        { key: 'expenses', label: 'Monthly expenses', defaultValue: '55000' },
        { key: 'assets', label: 'Total assets', defaultValue: '2500000' },
        { key: 'liabilities', label: 'Total liabilities', defaultValue: '800000' },
      ],
      checklist: [
        'Track cash flow before setting growth targets.',
        'Separate must-have vs optional expenses.',
        'Keep liabilities and insurance reviewed yearly.',
      ],
    };
  }

  if (id === 'carpet') {
    return {
      variant: 'personal',
      badges: ['Real Estate', 'Area', 'Planning'],
      fields: [
        { key: 'superArea', label: 'Super built-up area (sqft)', defaultValue: '1450' },
        { key: 'loading', label: 'Loading (%)', defaultValue: '28' },
        { key: 'rate', label: 'Rate per sqft', defaultValue: '6200' },
        { key: 'maintenance', label: 'Monthly maintenance', defaultValue: '3500' },
      ],
      checklist: [
        'Verify carpet area in official builder documents.',
        'Compare loading factor with nearby projects.',
        'Account for maintenance and parking costs.',
      ],
    };
  }

  if (id === 'astro-longevity') {
    return {
      variant: 'astro',
      badges: ['Astrology', 'Birth Data', 'Insights'],
      fields: [
        { key: 'year', label: 'Birth year', defaultValue: '1992' },
        { key: 'month', label: 'Birth month', defaultValue: '8' },
        { key: 'day', label: 'Birth day', defaultValue: '20' },
        { key: 'hour', label: 'Birth hour (24h)', defaultValue: '19' },
      ],
      checklist: [
        'Use accurate birth time and place for better output.',
        'Treat this as reflective guidance, not certainty.',
        'Combine with practical health and financial planning.',
      ],
    };
  }

  return {
    variant: 'default',
    badges: [calculator?.category || 'Calculator', 'Planning', 'Mobile'],
    fields: [
      { key: 'amount', label: 'Amount', defaultValue: '1000' },
      { key: 'rate', label: 'Rate (%)', defaultValue: '10' },
      { key: 'period', label: 'Time period', defaultValue: '5' },
      { key: 'extra', label: 'Additional input', defaultValue: '100' },
    ],
    checklist: [
      `Review assumptions for ${title}.`,
      'Validate inputs before relying on outputs.',
      'Use this as a planning aid, not financial advice.',
    ],
  };
};

function MobileReadyCalculatorTool({ navigation, calculator, styles, themeColors, openSite }) {
  const template = useMemo(() => getMobileTemplate(calculator), [calculator]);
  const variant = template.variant || 'default';
  const [values, setValues] = useState(() => template.fields.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultValue || '' }), {}));

  const filledCount = useMemo(() => template.fields.reduce((acc, f) => acc + (String(values[f.key] || '').trim() ? 1 : 0), 0), [template, values]);
  const completion = useMemo(() => Math.round((filledCount / Math.max(template.fields.length, 1)) * 100), [filledCount, template.fields.length]);
  const numericAvg = useMemo(() => {
    const nums = template.fields.map((f) => toNum(values[f.key])).filter((v) => v != null);
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }, [template, values]);

  const loanStats = useMemo(() => {
    if (variant !== 'loan') return null;
    const principal = toNum(values.principal);
    const rate = toNum(values.rate);
    const years = toNum(values.tenure);
    const income = toNum(values.income);
    if (principal == null || rate == null || years == null || rate <= 0 || years <= 0) return null;
    const r = rate / 1200;
    const n = years * 12;
    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const ratio = income && income > 0 ? (emi / income) * 100 : null;
    return { emi, ratio, n };
  }, [values, variant]);

  const savingsStats = useMemo(() => {
    if (variant !== 'savings') return null;
    const principal = toNum(values.principal) ?? toNum(values.corpus);
    const monthly = toNum(values.monthly) ?? toNum(values.contribution);
    const rate = toNum(values.rate) ?? toNum(values.return);
    const years = toNum(values.years);
    if (principal == null || monthly == null || rate == null || years == null || years <= 0) return null;
    const rm = rate / 1200;
    const n = years * 12;
    const futureLumpsum = principal * Math.pow(1 + rm, n);
    const futureSip = monthly * ((Math.pow(1 + rm, n) - 1) / Math.max(rm, 1e-9));
    const future = futureLumpsum + futureSip;
    const invested = principal + (monthly * n);
    return { future, invested, gain: future - invested };
  }, [values, variant]);

  const portfolioBars = useMemo(() => {
    if (variant !== 'portfolio') return [];
    const rows = template.fields.map((f) => ({ label: f.label, val: toNum(values[f.key]) || 0 }));
    const max = Math.max(...rows.map((r) => Math.abs(r.val)), 1);
    return rows.map((r) => ({ ...r, pct: Math.max(8, (Math.abs(r.val) / max) * 100) }));
  }, [template, values, variant]);

  const personalStats = useMemo(() => {
    if (variant !== 'personal') return null;
    const assets = toNum(values.assets) ?? toNum(values.superArea);
    const liabilities = toNum(values.liabilities) ?? toNum(values.loading);
    const income = toNum(values.income) ?? toNum(values.rate);
    const expenses = toNum(values.expenses) ?? toNum(values.maintenance);
    const net = assets != null && liabilities != null ? assets - liabilities : null;
    const cashFlow = income != null && expenses != null ? income - expenses : null;
    return { net, cashFlow };
  }, [values, variant]);

  const astroScore = useMemo(() => {
    if (variant !== 'astro') return null;
    return Math.min(100, completion + 10);
  }, [completion, variant]);

  const useSingleColumnInputs = variant === 'loan' || variant === 'astro';

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.heroTagRow}>
            {template.badges.map((badge) => (
              <View key={`${calculator.id}-${badge}`} style={styles.badgePill}><AppText style={styles.badgeText}>{badge}</AppText></View>
            ))}
            <View style={styles.badgePill}><AppText style={styles.badgeText}>{`${variant.toUpperCase()} Layout`}</AppText></View>
          </View>
          <AppText style={styles.sectionTitle}>{`${calculator.title} setup`}</AppText>
          <AppText style={styles.sectionBody}>{calculator.description || 'Enter values below to start analysis and scenario planning on mobile.'}</AppText>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Inputs</AppText>
            <View style={styles.grid}>
              {template.fields.map((field) => (
                <View key={`${calculator.id}-${field.key}`} style={useSingleColumnInputs ? styles.fieldFull : styles.field}>
                  <AppText style={styles.label}>{field.label}</AppText>
                  <AppTextInput
                    value={values[field.key] || ''}
                    onChangeText={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              ))}
            </View>
          </View>

          {variant === 'loan' && (
            <View style={[styles.card, styles.colCard]}>
              <AppText style={styles.sectionTitle}>EMI Snapshot</AppText>
              <View style={styles.resultRow}>
                <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Monthly EMI</AppText><AppText style={styles.levelValue}>{loanStats ? fmt(loanStats.emi) : '--'}</AppText></View>
                <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Months</AppText><AppText style={styles.levelValue}>{loanStats ? `${fmt(loanStats.n, 0)}` : '--'}</AppText></View>
                <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>EMI / Income</AppText><AppText style={styles.levelValue}>{loanStats?.ratio == null ? '--' : `${fmt(loanStats.ratio)}%`}</AppText></View>
              </View>
              <View style={styles.tipCard}><AppText style={styles.tipText}>Lower ratio keeps repayment stress manageable across cycles.</AppText></View>
            </View>
          )}

          {variant === 'savings' && (
            <View style={[styles.card, styles.colCard]}>
              <AppText style={styles.sectionTitle}>Growth Projection</AppText>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Projected value</AppText><AppText style={styles.bigMetric}>{savingsStats ? fmt(savingsStats.future, 0) : '--'}</AppText></View>
              <View style={styles.resultRow}>
                <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Total invested</AppText><AppText style={styles.levelValue}>{savingsStats ? fmt(savingsStats.invested, 0) : '--'}</AppText></View>
                <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Estimated gain</AppText><AppText style={styles.levelValue}>{savingsStats ? fmt(savingsStats.gain, 0) : '--'}</AppText></View>
              </View>
            </View>
          )}

          {variant === 'portfolio' && (
            <View style={[styles.card, styles.colCard]}>
              <AppText style={styles.sectionTitle}>Factor View</AppText>
              <View style={styles.chartWrap}>
                <View style={styles.chartBars}>
                  {portfolioBars.map((item) => (
                    <View key={`${calculator.id}-${item.label}`} style={styles.barCol}>
                      <View style={[styles.bar, styles.levelPivot, { height: `${item.pct}%`, borderWidth: 0, backgroundColor: '#4a8af0' }]} />
                      <AppText style={styles.barLbl}>{item.label.split(' ')[0]}</AppText>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.tipCard}><AppText style={styles.tipText}>Use this to visually compare input magnitude distribution.</AppText></View>
            </View>
          )}

          {variant === 'personal' && (
            <View style={[styles.card, styles.colCard]}>
              <AppText style={styles.sectionTitle}>Household Health</AppText>
              <View style={styles.resultRow}>
                <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Net position</AppText><AppText style={styles.levelValue}>{personalStats?.net == null ? '--' : fmt(personalStats.net, 0)}</AppText></View>
                <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Monthly surplus</AppText><AppText style={styles.levelValue}>{personalStats?.cashFlow == null ? '--' : fmt(personalStats.cashFlow, 0)}</AppText></View>
              </View>
              <View style={styles.gaugeTrack}><View style={[styles.gaugeFill, { width: `${Math.max(0, Math.min(100, completion))}%`, backgroundColor: '#1dc7a0' }]} /></View>
              <AppText style={styles.gaugeText}>{`${completion}% profile completion`}</AppText>
            </View>
          )}

          {variant === 'astro' && (
            <View style={[styles.card, styles.colCard]}>
              <AppText style={styles.sectionTitle}>Readiness Meter</AppText>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Input readiness</AppText><AppText style={styles.bigMetric}>{astroScore == null ? '--' : `${fmt(astroScore, 0)}%`}</AppText></View>
              {template.checklist.map((item, idx) => (
                <View key={`${calculator.id}-astro-step-${idx}`} style={styles.tipCard}><AppText style={styles.tipText}>{`${idx + 1}. ${item}`}</AppText></View>
              ))}
            </View>
          )}

          {variant === 'default' && (
            <View style={[styles.card, styles.colCard]}>
              <AppText style={styles.sectionTitle}>Quick Summary</AppText>
              <View style={styles.resultRow}>
                <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Input completion</AppText><AppText style={styles.levelValue}>{`${completion}%`}</AppText></View>
                <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Filled fields</AppText><AppText style={styles.levelValue}>{`${filledCount}/${template.fields.length}`}</AppText></View>
                <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Avg numeric input</AppText><AppText style={styles.levelValue}>{numericAvg == null ? '--' : fmt(numericAvg)}</AppText></View>
              </View>
            </View>
          )}
        </View>

        {variant !== 'astro' && (
          <View style={styles.card}>
            <AppText style={styles.tipTitle}>Planning notes</AppText>
            {template.checklist.map((item, idx) => (
              <AppText key={`${calculator.id}-note-${idx}`} style={styles.tipText}>{`- ${item}`}</AppText>
            ))}
          </View>
        )}

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}


const CalculatorTool = ({ navigation, route }) => {
  const { theme, themeColors } = useUser();
  const isLight = theme === 'light';
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const styles = useMemo(() => createStyles(themeColors, isLight, isCompact), [themeColors, isLight, isCompact]);
  const calculator = route?.params?.calculator || { id: 'calculator', title: 'Calculator', description: 'Tool' };

  const openSite = async (url = 'https://finance.rajeevprakash.com') => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Open failed', 'Unable to open link right now.');
    }
  };

  if (calculator.id === 'support-resistance') {
    return <View style={styles.safeArea}><GradientBackground><SupportResistanceTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'win-rate-risk-reward') {
    return <View style={styles.safeArea}><GradientBackground><WinRateRiskRewardTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (['rr-quick', 'risk-reward-break-even', 'trading-risk-reward', 'risk-to-reward', 'stock-risk-reward'].includes(calculator.id)) {
    return <View style={styles.safeArea}><GradientBackground><RiskRewardQuickTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'risk-reward-india') {
    return <View style={styles.safeArea}><GradientBackground><RiskRewardIndiaTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'position-size') {
    return <View style={styles.safeArea}><GradientBackground><PositionSizeStockTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'stock-dca') {
    return <View style={styles.safeArea}><GradientBackground><StockAverageTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'profit-loss') {
    return <View style={styles.safeArea}><GradientBackground><ProfitLossTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'fibonacci') {
    return <View style={styles.safeArea}><GradientBackground><FibonacciTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }

  if (calculator.id === 'stop-loss-take-profit') {
    return <View style={styles.safeArea}><GradientBackground><StopLossTakeProfitTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'drawdown-capital-recovery') {
    return <View style={styles.safeArea}><GradientBackground><DrawdownCapitalRecoveryTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'options-pricing-greeks') {
    return <View style={styles.safeArea}><GradientBackground><OptionsPricingGreeksTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'cagr') {
    return <View style={styles.safeArea}><GradientBackground><CAGRTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'retirement-corpus') {
    return <View style={styles.safeArea}><GradientBackground><RetirementCorpusTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'npv') {
    return <View style={styles.safeArea}><GradientBackground><NPVTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'roi') {
    return <View style={styles.safeArea}><GradientBackground><ROITool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'irr') {
    return <View style={styles.safeArea}><GradientBackground><IRRTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'dcf') {
    return <View style={styles.safeArea}><GradientBackground><DCFTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'portfolio-risk-std') {
    return <View style={styles.safeArea}><GradientBackground><PortfolioRiskStdTool navigation={navigation} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'sharpe-sortino') {
    return <View style={styles.safeArea}><GradientBackground><SharpeSortinoToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'dividend-pe') {
    return <View style={styles.safeArea}><GradientBackground><DividendPEToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'efficient-frontier') {
    return <View style={styles.safeArea}><GradientBackground><EfficientFrontierToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'correlation') {
    return <View style={styles.safeArea}><GradientBackground><CorrelationCovarianceToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'astro-longevity') {
    return <View style={styles.safeArea}><GradientBackground><AstrologyLongevityToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'emergency-fund') {
    return <View style={styles.safeArea}><GradientBackground><EmergencyFundToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'mortgage') {
    return <View style={styles.safeArea}><GradientBackground><MortgageToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'emi') {
    return <View style={styles.safeArea}><GradientBackground><EMIToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'car-loan') {
    return <View style={styles.safeArea}><GradientBackground><CarLoanEMIToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'home-loan-emi') {
    return <View style={styles.safeArea}><GradientBackground><HomeLoanEMIToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'house-affordability') {
    return <View style={styles.safeArea}><GradientBackground><HouseAffordabilityToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'savings-last') {
    return <View style={styles.safeArea}><GradientBackground><SavingsRunwayToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'saving-growth') {
    return <View style={styles.safeArea}><GradientBackground><SavingGrowthToolScreen navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'save-money-goal') {
    return <View style={styles.safeArea}><GradientBackground><SaveMoneyGoalTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'net-worth') {
    return <View style={styles.safeArea}><GradientBackground><NetWorthTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'college-calculator') {
    return <View style={styles.safeArea}><GradientBackground><CollegeCalculatorsTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'high-yield-savings') {
    return <View style={styles.safeArea}><GradientBackground><HighYieldSavingsTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'retirement-savings-pf') {
    return <View style={styles.safeArea}><GradientBackground><RetirementSavingsPFTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'sip') {
    return <View style={styles.safeArea}><GradientBackground><SIPTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'lumpsum') {
    return <View style={styles.safeArea}><GradientBackground><LumpsumTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'swp') {
    return <View style={styles.safeArea}><GradientBackground><SWPTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'fd') {
    return <View style={styles.safeArea}><GradientBackground><FDTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'simple-interest') {
    return <View style={styles.safeArea}><GradientBackground><SimpleInterestTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'compound-interest') {
    return <View style={styles.safeArea}><GradientBackground><CompoundInterestTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'rd') {
    return <View style={styles.safeArea}><GradientBackground><RDTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'spending') {
    return <View style={styles.safeArea}><GradientBackground><SpendingTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'life-insurance') {
    return <View style={styles.safeArea}><GradientBackground><LifeInsuranceTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'property-valuation') {
    return <View style={styles.safeArea}><GradientBackground><PropertyValuationTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'mutual-fund-return') {
    return <View style={styles.safeArea}><GradientBackground><MutualFundReturnsTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'carpet') {
    return <View style={styles.safeArea}><GradientBackground><CarpetTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === '401k-retirement') {
    return <View style={styles.safeArea}><GradientBackground><K401RetirementTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }
  if (calculator.id === 'fire') {
    return <View style={styles.safeArea}><GradientBackground><FinancialFreedomTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} PageHeader={PageHeader} FooterCTAContact={FooterCTAContact} openSite={openSite} /></GradientBackground></View>;
  }

  return <View style={styles.safeArea}><GradientBackground><MobileReadyCalculatorTool navigation={navigation} calculator={calculator} styles={styles} themeColors={themeColors} openSite={openSite} /></GradientBackground></View>;
};

const createStyles = (colors, isLight, isCompact) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { gap: 12 },
  headerCenter: { marginTop: 12 },
  title: { color: colors.textPrimary, fontSize: isCompact ? 16 : 18, fontFamily: FONT.semiBold },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  content: { paddingHorizontal: isCompact ? 10 : 12, paddingTop: 8, paddingBottom: 30, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, padding: isCompact ? 8 : 10, gap: 8 },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: FONT.semiBold },
  sectionBody: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  twoColRow: { gap: 10 },
  colCard: { flex: 1 },
  heroTagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badgePill: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: colors.textMuted, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { flexBasis: isCompact ? '100%' : '48%', flexGrow: 1, flexShrink: 1, minWidth: isCompact ? '100%' : 140, gap: 4 },
  fieldFull: { width: '100%', minWidth: '100%', gap: 4 },
  label: { color: colors.textMuted, fontSize: 12, flexShrink: 1 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: colors.textPrimary },
  btnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  primaryBtn: { borderRadius: 8, backgroundColor: isLight ? '#2f65dc' : '#1f78ff', paddingHorizontal: 10, paddingVertical: 8 },
  primaryBtnText: { color: '#fff', fontSize: 12, fontFamily: FONT.semiBold },
  ghostBtn: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 8 },
  ghostBtnText: { color: colors.textPrimary, fontSize: 12 },
  deleteIconBtn: { width: 40, minWidth: 40, height: 40, paddingHorizontal: 0, paddingVertical: 0, alignItems: 'center', justifyContent: 'center' },






  warnText: { color: colors.negative, fontSize: 12 },
  tipCard: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, padding: 8, gap: 3 },
  tipTitle: { color: colors.textPrimary, fontSize: 12, fontFamily: FONT.semiBold },
  tipText: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  boldMuted: { color: colors.textPrimary, fontFamily: FONT.semiBold },
  alignCenter: { alignItems: 'center' },
  resultRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  deleteRow: { alignItems: 'center' },
  levelBox: { flex: 1, minWidth: isCompact ? '100%' : 92, borderRadius: 10, borderWidth: 1, padding: 8, gap: 2 },
  levelPivot: { borderColor: isLight ? '#79a6ff' : '#2f90ff', backgroundColor: isLight ? 'rgba(80,128,255,0.08)' : 'rgba(33,96,189,0.2)' },
  levelRes: { borderColor: isLight ? '#71cfab' : '#35be8a', backgroundColor: isLight ? 'rgba(53,190,138,0.08)' : 'rgba(27,140,103,0.2)' },
  levelSup: { borderColor: isLight ? '#f28fb3' : '#ee6e9c', backgroundColor: isLight ? 'rgba(238,110,156,0.08)' : 'rgba(155,48,91,0.2)' },
  levelLabel: { color: colors.textMuted, fontSize: 11 },
  levelValue: { color: colors.textPrimary, fontSize: 15, fontFamily: FONT.semiBold },
  bigMetric: { color: colors.textPrimary, fontSize: isCompact ? 28 : 34, fontFamily: FONT.extraBold, lineHeight: isCompact ? 32 : 38 },
  gaugeTrack: { height: 10, borderRadius: 999, overflow: 'hidden', backgroundColor: isLight ? '#d8dfec' : '#2e3650' },
  gaugeFill: { height: '100%', backgroundColor: '#2d9dff' },
  gaugeText: { color: colors.textPrimary, fontSize: 14, fontFamily: FONT.semiBold, textAlign: 'center', marginTop: 6 },
  subCard: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, padding: 8, gap: 6 },
  chartWrap: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, padding: 10, minHeight: 170 },
  chartPlot: { height: 130, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, overflow: 'hidden', backgroundColor: colors.surfaceGlass },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 12, flex: 1 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '75%', borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 8 },
  barGreen: { backgroundColor: isLight ? '#19b384' : '#21b786' },
  barRed: { backgroundColor: isLight ? '#ea4e4e' : '#ef4444' },
  chartLegend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  barLbl: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  riskChartRow: { flexDirection: 'row', minHeight: 188 },
  riskYAxisTitleWrap: { width: 28, alignItems: 'center', justifyContent: 'center' },
  riskYAxisTitle: { color: colors.textMuted, fontSize: 12, width: 90, textAlign: 'center', transform: [{ rotate: '-90deg' }] },
  riskChartMain: { flex: 1, position: 'relative', paddingLeft: 22, paddingBottom: 22, paddingTop: 6 },
  riskTickRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center' },
  riskTickText: { width: 20, marginRight: 6, color: colors.textMuted, fontSize: 11, textAlign: 'right' },
  riskGridLine: { flex: 1, borderTopWidth: 1, borderColor: colors.border },
  riskBarsWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 12, flex: 1, marginLeft: 26 },
  faqTitle: { color: colors.textPrimary, fontSize: 26, fontFamily: FONT.semiBold, textAlign: 'center' },
  faqGrid: { gap: 8 },
  faqCard: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, padding: 10, gap: 4 },
  fibChart: { borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, padding: 8, gap: 8 },
  fibRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fibPct: { width: 38, color: colors.textMuted, fontSize: 11 },
  fibTrack: { flex: 1, height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: isLight ? '#d8dfec' : '#2e3650' },
  fibFill: { height: '100%', backgroundColor: isLight ? '#2f65dc' : '#2d9dff' },
  fibVal: { width: 64, color: colors.textPrimary, fontSize: 12, textAlign: 'right' },
  fibRetraceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  fibLevelItem: { width: isCompact ? '100%' : '48%' },
  fibLevelItemFull: { width: '100%' },
  fibLevelBox: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  fibLevelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fibLevelPct: { color: colors.textPrimary, fontSize: 13, fontFamily: FONT.semiBold },
  fibLevelPrice: { color: colors.textPrimary, fontSize: 13, fontFamily: FONT.semiBold },
  fibLevelUpBox: { borderColor: isLight ? '#71cfab' : '#35be8a', backgroundColor: isLight ? 'rgba(53,190,138,0.08)' : 'rgba(27,140,103,0.2)' },
  fibLevelDownBox: { borderColor: isLight ? '#f28fb3' : '#ee6e9c', backgroundColor: isLight ? 'rgba(238,110,156,0.08)' : 'rgba(155,48,91,0.2)' },
  fibLevelUpText: { color: isLight ? '#137248' : '#6ef0b0' },
  fibLevelDownText: { color: isLight ? '#a44168' : '#ff9dbf' },
  placeholderCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, padding: 16, gap: 6, alignItems: 'center' },
  placeholderTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: FONT.semiBold },
  placeholderBody: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  banner: { borderRadius: 12, borderWidth: 1, borderColor: isLight ? '#8fb2ff' : 'rgba(89,134,255,0.4)', backgroundColor: isLight ? '#d9e9ff' : '#1f59bd', padding: 12, gap: 10 },
  bannerTitle: { color: isLight ? '#0f2f66' : '#f2f8ff', fontSize: 16, fontFamily: FONT.semiBold },
  bannerSub: { color: isLight ? '#31578f' : '#dceafe', fontSize: 12, marginTop: 2 },
  bannerBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  bannerPrimary: { borderRadius: 999, backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 7 },
  bannerPrimaryText: { color: '#184ea7', fontSize: 12, fontFamily: FONT.semiBold },
  bannerGhost: { borderRadius: 999, borderWidth: 1, borderColor: isLight ? 'transparent' : 'rgba(255,255,255,0.7)', backgroundColor: isLight ? '#ffffff' : 'transparent', paddingHorizontal: 12, paddingVertical: 7 },
  bannerGhostText: { color: isLight ? '#2b5cab' : '#ffffff', fontSize: 12, fontFamily: FONT.semiBold },
  contactWrap: { alignItems: 'center', gap: 8, paddingBottom: 16 },
  contactTag: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 2 },
  contactTagText: { color: colors.textMuted, fontSize: 10, fontFamily: FONT.semiBold },
  contactTitle: { color: colors.textPrimary, fontSize: isCompact ? 22 : 30, fontFamily: FONT.semiBold, lineHeight: isCompact ? 26 : 34 },
  contactCard: { width: '100%', borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, padding: 10, gap: 5 },
  contactHead: { color: colors.textPrimary, fontSize: 13, fontFamily: FONT.semiBold },
  contactSub: { color: colors.textMuted, fontSize: 11 },
  contactRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  contactItem: { flex: 1, minWidth: isCompact ? '100%' : 120, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 8 },
  contactItemText: { color: colors.textPrimary, fontSize: 12 },
  fireStepCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, padding: isCompact ? 8 : 10, gap: 8 },
  fireStepHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  fireStepTitle: { flex: 1, color: colors.textPrimary, fontSize: isCompact ? 13 : 14, fontFamily: FONT.semiBold },
  fireGroupPill: { borderRadius: 999, borderWidth: 1, backgroundColor: colors.surfaceGlass, paddingHorizontal: 8, paddingVertical: 2 },
  fireGroupPillText: { fontSize: 10, fontFamily: FONT.semiBold },
  fireAdjustRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fireAdjustBtn: { width: isCompact ? 30 : 34, height: isCompact ? 30 : 34, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, alignItems: 'center', justifyContent: 'center' },
  fireAdjustBtnText: { color: colors.textPrimary, fontSize: 18, lineHeight: 20, fontFamily: FONT.semiBold },
  fireMeterWrap: { flex: 1, gap: 5 },
  fireMeterTrack: { height: 10, borderRadius: 999, backgroundColor: isLight ? '#d8dfec' : '#2f3750', overflow: 'hidden' },
  fireMeterFill: { height: '100%', borderRadius: 999 },
  fireMeterValue: { color: colors.textMuted, fontSize: 11, textAlign: 'right', fontFamily: FONT.medium },
  fireGroupRow: { marginBottom: 8, gap: 4 },
  fireGroupHead: { flexDirection: 'row', justifyContent: 'space-between' },
  fireGroupTrack: { height: 8, borderRadius: 999, backgroundColor: colors.surfaceGlass, overflow: 'hidden' },
  fireGroupFill: { height: '100%', borderRadius: 999 },
});

export default CalculatorTool;





























































