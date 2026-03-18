import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';

const N = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const F = (v, d = 2) => Number.isFinite(v)
  ? v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  : '--';

const shortMoney = (v) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${Math.round(v)}`;
};

const chartBox = () => {
  const w = Math.min(Dimensions.get('window').width - 72, 360);
  const h = 196;
  return { w, h, l: 58, r: 12, t: 10, b: 44 };
};
const TAX_LIMITS = {
  '2025': { base: 23500, catch50: 7500, catch60to63: 11250 },
  '2026': { base: 24500, catch50: 8000, catch60to63: 11250 },
};

const FIRE_STEPS = [
  { key: 'goals', label: 'Create Financial Goals', w: 1.1, group: 'Essentials' },
  { key: 'budget', label: 'Optimize Your Budget', w: 1.2, group: 'Essentials' },
  { key: 'debt', label: 'Tackle Debt', w: 1.25, group: 'Discipline' },
  { key: 'invest', label: 'Prioritize Investing', w: 1.2, group: 'Growth' },
  { key: 'income', label: 'Increase Income', w: 1.05, group: 'Growth' },
  { key: 'automation', label: 'Automate Systems', w: 1.0, group: 'Essentials' },
  { key: 'protection', label: 'Protect Against Risks', w: 0.95, group: 'Essentials' },
  { key: 'bigbuy', label: 'Plan Big Buys', w: 0.95, group: 'Discipline' },
  { key: 'learn', label: 'Learn & Improve', w: 0.9, group: 'Growth' },
];

function Chart({
  series,
  xMax,
  yMin = 0,
  yMax,
  color = '#17a9ff',
  styles,
  themeColors,
  extraLines = null,
  xLabel = 'Time',
  yLabel = 'Value',
  xTickLabel,
  yTickLabel,
}) {
  const { w, h, l, r, t, b } = chartBox();
  const plotW = w - l - r;
  const plotH = h - t - b;
  const span = Math.max(yMax - yMin, 1);

  const X = (v) => l + (v / Math.max(xMax, 1)) * plotW;
  const Y = (v) => h - b - ((v - yMin) / span) * plotH;

  const points = series.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ');
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((k) => yMin + span * k);
  const xTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((k) => xMax * k);

  return (
    <View style={styles.subCard}>
      <Svg width={w} height={h}>
        {yTicks.map((v, i) => (
          <Line key={`gy-${i}`} x1={l} y1={Y(v)} x2={w - r} y2={Y(v)} stroke={themeColors.border} strokeWidth="1" opacity={0.5} />
        ))}
        {xTicks.map((v, i) => (
          <Line key={`gx-${i}`} x1={X(v)} y1={t} x2={X(v)} y2={h - b} stroke={themeColors.border} strokeWidth="1" opacity={0.25} />
        ))}

        <Line x1={l} y1={h - b} x2={w - r} y2={h - b} stroke={themeColors.border} strokeWidth="1.1" />
        <Line x1={l} y1={t} x2={l} y2={h - b} stroke={themeColors.border} strokeWidth="1.1" />

        {extraLines}
        <Polyline points={points} fill="none" stroke={color} strokeWidth="2" />

        {yTicks.map((v, i) => (
          <SvgText key={`yl-${i}`} x={l - 4} y={Y(v) + 3} fill={themeColors.textMuted} fontSize="9" textAnchor="end">
            {yTickLabel ? yTickLabel(v) : shortMoney(v)}
          </SvgText>
        ))}
        {xTicks.map((v, i) => (
          <SvgText key={`xl-${i}`} x={X(v)} y={h - 20} fill={themeColors.textMuted} fontSize="9" textAnchor="middle">
            {xTickLabel ? xTickLabel(v) : `${Math.round(v)}`}
          </SvgText>
        ))}

        <SvgText x={(l + (w - r)) / 2} y={h - 4} fill={themeColors.textMuted} fontSize="10" textAnchor="middle">{xLabel}</SvgText>
        <SvgText x={18} y={(t + (h - b)) / 2} fill={themeColors.textMuted} fontSize="10" textAnchor="middle" transform={`rotate(-90, 18, ${(t + (h - b)) / 2})`}>{yLabel}</SvgText>
      </Svg>
    </View>
  );
}

export function SaveMoneyGoalTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [pv, setPv] = useState('0');
  const [rate, setRate] = useState('6');
  const [goal, setGoal] = useState('100000');
  const [years, setYears] = useState('5');
  const [months, setMonths] = useState('0');

  const out = useMemo(() => {
    const n = Math.max(0, Math.floor(N(years)) * 12 + Math.floor(N(months)));
    const i = Math.max(0, N(rate)) / 1200;
    const p = Math.max(0, N(pv));
    const g = Math.max(0, N(goal));
    const growth = Math.pow(1 + i, n);
    const req = n <= 0 ? 0 : i === 0 ? Math.max(0, (g - p) / n) : Math.max(0, (g - p * growth) / ((growth - 1) / i));
    let bal = p;
    const points = [{ x: 0, y: bal }];
    for (let m = 1; m <= n; m += 1) {
      bal = bal * (1 + i) + req;
      points.push({ x: m, y: bal });
    }
    return { n, req, points, yMax: Math.max(g, ...points.map((s) => s.y), 1) };
  }, [goal, months, pv, rate, years]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Save Money Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Current savings</AppText><AppTextInput value={pv} onChangeText={setPv} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Interest rate (%)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Savings goal</AppText><AppTextInput value={goal} onChangeText={setGoal} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Years</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Months</AppText><AppTextInput value={months} onChangeText={setMonths} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Monthly amount needed</AppText>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.bigMetric}>{`$${F(out.req, 2)}`}</AppText><AppText style={styles.tipText}>{`${out.n} months`}</AppText></View>
            <Chart
              series={out.points}
              xMax={out.n}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              xLabel="Horizontal axis: Months"
              yLabel="Vertical axis: Savings ($)"
              xTickLabel={(v) => `${Math.round(v)}`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>Horizontal axis = month number. Vertical axis = projected savings balance in dollars.</AppText>
          </View>
        </View>
        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function NetWorthTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [a1, sa1] = useState('0'); const [a2, sa2] = useState('0'); const [a3, sa3] = useState('0'); const [a4, sa4] = useState('0'); const [a5, sa5] = useState('0');
  const [l1, sl1] = useState('0'); const [l2, sl2] = useState('0'); const [l3, sl3] = useState('0'); const [l4, sl4] = useState('0'); const [l5, sl5] = useState('0');
  const [ga, sga] = useState('7'); const [gl, sgl] = useState('5');

  const out = useMemo(() => {
    const A = N(a1) + N(a2) + N(a3) + N(a4) + N(a5);
    const L = N(l1) + N(l2) + N(l3) + N(l4) + N(l5);
    const gA = N(ga) / 100;
    const gL = N(gl) / 100;
    const series = Array.from({ length: 11 }, (_, y) => ({ x: y, a: A * Math.pow(1 + gA, y), l: L * Math.pow(1 + gL, y) }));
    const net = series.map((p) => ({ x: p.x, y: p.a - p.l }));
    const all = series.flatMap((p) => [p.a, p.l, p.a - p.l]);
    return {
      A,
      L,
      netNow: A - L,
      net10: net[10].y,
      a: series.map((p) => ({ x: p.x, y: p.a })),
      l: series.map((p) => ({ x: p.x, y: p.l })),
      n: net,
      yMin: Math.min(...all, 0),
      yMax: Math.max(...all, 1),
    };
  }, [a1, a2, a3, a4, a5, ga, gl, l1, l2, l3, l4, l5]);

  const { w, h, l, r, t, b } = chartBox();
  const plotW = w - l - r;
  const plotH = h - t - b;
  const span = Math.max(out.yMax - out.yMin, 1);
  const X = (v) => l + (v / 10) * plotW;
  const Y = (v) => h - b - ((v - out.yMin) / span) * plotH;

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Net Worth Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Home</AppText><AppTextInput value={a1} onChangeText={sa1} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Automobiles</AppText><AppTextInput value={a2} onChangeText={sa2} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Checking</AppText><AppTextInput value={a3} onChangeText={sa3} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Retirement</AppText><AppTextInput value={a4} onChangeText={sa4} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Other assets</AppText><AppTextInput value={a5} onChangeText={sa5} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Mortgage</AppText><AppTextInput value={l1} onChangeText={sl1} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Student loans</AppText><AppTextInput value={l2} onChangeText={sl2} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Auto loans</AppText><AppTextInput value={l3} onChangeText={sl3} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Credit card</AppText><AppTextInput value={l4} onChangeText={sl4} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Other liabilities</AppText><AppTextInput value={l5} onChangeText={sl5} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Asset growth %</AppText><AppTextInput value={ga} onChangeText={sga} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Liability growth %</AppText><AppTextInput value={gl} onChangeText={sgl} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Current Net Worth</AppText>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.bigMetric}>{`$${F(out.netNow, 0)}`}</AppText></View>
            <View style={styles.resultRow}><View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Assets</AppText><AppText style={styles.levelValue}>{`$${F(out.A, 0)}`}</AppText></View><View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Liabilities</AppText><AppText style={styles.levelValue}>{`$${F(out.L, 0)}`}</AppText></View></View>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Projected Year 10</AppText><AppText style={styles.levelValue}>{`$${F(out.net10, 0)}`}</AppText></View>
            <View style={styles.subCard}>
              <Svg width={w} height={h}>
                {[0, 0.25, 0.5, 0.75, 1].map((k, i) => <Line key={i} x1={l} y1={Y(out.yMin + span * k)} x2={w - r} y2={Y(out.yMin + span * k)} stroke={themeColors.border} strokeWidth="1" opacity={0.5} />)}
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((k, i) => <Line key={`x-${i}`} x1={X(10 * k)} y1={t} x2={X(10 * k)} y2={h - b} stroke={themeColors.border} strokeWidth="1" opacity={0.25} />)}
                <Line x1={l} y1={h - b} x2={w - r} y2={h - b} stroke={themeColors.border} strokeWidth="1.1" /><Line x1={l} y1={t} x2={l} y2={h - b} stroke={themeColors.border} strokeWidth="1.1" />
                <Line x1={l} y1={Y(0)} x2={w - r} y2={Y(0)} stroke={themeColors.textMuted} strokeWidth="1" opacity={0.5} />
                <Polyline points={out.a.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke="#ef4444" strokeWidth="2" />
                <Polyline points={out.l.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke="#10b981" strokeWidth="2" />
                <Polyline points={out.n.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke="#22a6f2" strokeWidth="2" />
                {[0, 0.25, 0.5, 0.75, 1].map((k, i) => (
                  <SvgText key={`yl-${i}`} x={l - 4} y={Y(out.yMin + span * k) + 3} fill={themeColors.textMuted} fontSize="9" textAnchor="end">{`$${shortMoney(out.yMin + span * k)}`}</SvgText>
                ))}
                {[0, 2, 4, 6, 8, 10].map((yr) => (
                  <SvgText key={`xl-${yr}`} x={X(yr)} y={h - 20} fill={themeColors.textMuted} fontSize="9" textAnchor="middle">{yr}</SvgText>
                ))}
                <SvgText x={(l + (w - r)) / 2} y={h - 4} fill={themeColors.textMuted} fontSize="10" textAnchor="middle">X axis: Years</SvgText>
                <SvgText x={8} y={(t + (h - b)) / 2} fill={themeColors.textMuted} fontSize="10" textAnchor="middle" transform={`rotate(-90, 8, ${(t + (h - b)) / 2})`}>Y axis: Net worth ($)</SvgText>
              </Svg>
            </View>
            <AppText style={styles.tipText}>Red = assets, green = liabilities, blue = net worth. Horizontal axis = years, vertical axis = dollar values.</AppText>
          </View>
        </View>
        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function CollegeCalculatorsTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [income, setIncome] = useState('2500'); const [tuition, setTuition] = useState('800'); const [housing, setHousing] = useState('700'); const [food, setFood] = useState('350'); const [transport, setTransport] = useState('120'); const [books, setBooks] = useState('100'); const [misc, setMisc] = useState('130');
  const [loan, setLoan] = useState('25000'); const [rate, setRate] = useState('6.5'); const [term, setTerm] = useState('10');

  const budget = useMemo(() => {
    const e = N(tuition) + N(housing) + N(food) + N(transport) + N(books) + N(misc);
    return { i: N(income), e, s: N(income) - e };
  }, [books, food, housing, income, misc, transport, tuition]);

  const L = useMemo(() => {
    const p = Math.max(0, N(loan));
    const n = Math.max(1, Math.floor(N(term)) * 12);
    const r = Math.max(0, N(rate)) / 1200;
    const emi = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    let bal = p;
    const points = [{ x: 0, y: bal }];
    for (let i = 1; i <= n; i += 1) {
      const interest = bal * r;
      bal = Math.max(0, bal - (emi - interest));
      points.push({ x: i, y: bal });
    }
    return { n, emi, total: emi * n, int: emi * n - p, points, yMax: Math.max(p, 1) };
  }, [loan, rate, term]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Student Budget Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Monthly income</AppText><AppTextInput value={income} onChangeText={setIncome} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Tuition</AppText><AppTextInput value={tuition} onChangeText={setTuition} keyboardType="numeric" style={styles.input} /></View><View style={styles.field}><AppText style={styles.label}>Housing</AppText><AppTextInput value={housing} onChangeText={setHousing} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Food</AppText><AppTextInput value={food} onChangeText={setFood} keyboardType="numeric" style={styles.input} /></View><View style={styles.field}><AppText style={styles.label}>Transport</AppText><AppTextInput value={transport} onChangeText={setTransport} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Books</AppText><AppTextInput value={books} onChangeText={setBooks} keyboardType="numeric" style={styles.input} /></View><View style={styles.field}><AppText style={styles.label}>Misc</AppText><AppTextInput value={misc} onChangeText={setMisc} keyboardType="numeric" style={styles.input} /></View>
            </View>
            <View style={styles.resultRow}><View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Income</AppText><AppText style={styles.levelValue}>{`$${F(budget.i, 0)}`}</AppText></View><View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Expenses</AppText><AppText style={styles.levelValue}>{`$${F(budget.e, 0)}`}</AppText></View><View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Surplus</AppText><AppText style={styles.levelValue}>{`$${F(budget.s, 0)}`}</AppText></View></View>
          </View>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Student Loan Calculator</AppText>
            <View style={styles.grid}><View style={styles.field}><AppText style={styles.label}>Loan amount</AppText><AppTextInput value={loan} onChangeText={setLoan} keyboardType="numeric" style={styles.input} /></View><View style={styles.field}><AppText style={styles.label}>Interest (%)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View><View style={styles.fieldFull}><AppText style={styles.label}>Term (years)</AppText><AppTextInput value={term} onChangeText={setTerm} keyboardType="numeric" style={styles.input} /></View></View>
            <View style={styles.resultRow}><View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Monthly payment</AppText><AppText style={styles.levelValue}>{`$${F(L.emi, 2)}`}</AppText></View><View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Total paid</AppText><AppText style={styles.levelValue}>{`$${F(L.total, 2)}`}</AppText></View><View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Interest paid</AppText><AppText style={styles.levelValue}>{`$${F(L.int, 2)}`}</AppText></View></View>
            <Chart
              series={L.points}
              xMax={L.n}
              yMax={L.yMax}
              styles={styles}
              themeColors={themeColors}
              xLabel="Horizontal axis: Months"
              yLabel="Vertical axis: Loan balance ($)"
              xTickLabel={(v) => `${Math.round(v)}`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>Horizontal axis = month number. Vertical axis = remaining loan balance.</AppText>
          </View>
        </View>
        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function HighYieldSavingsTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [initial, setInitial] = useState('5000'); const [monthly, setMonthly] = useState('300'); const [apy, setApy] = useState('5'); const [years, setYears] = useState('3');

  const out = useMemo(() => {
    const p0 = Math.max(0, N(initial));
    const m = Math.max(0, N(monthly));
    const n = Math.max(1, Math.floor(N(years)) * 12);
    const r = Math.max(0, N(apy)) / 1200;
    let bal = p0;
    const points = [{ x: 0, y: bal }];
    for (let i = 1; i <= n; i += 1) {
      bal = bal * (1 + r) + m;
      points.push({ x: i, y: bal });
    }
    const contributions = p0 + m * n;
    return { n, points, ending: bal, contributions, interest: bal - contributions, yMax: Math.max(bal, 1) };
  }, [apy, initial, monthly, years]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>High-Yield Savings Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Initial deposit</AppText><AppTextInput value={initial} onChangeText={setInitial} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Monthly deposit</AppText><AppTextInput value={monthly} onChangeText={setMonthly} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>APY (%)</AppText><AppTextInput value={apy} onChangeText={setApy} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Years</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Projected growth</AppText>
            <View style={styles.resultRow}><View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Ending balance</AppText><AppText style={styles.levelValue}>{`$${F(out.ending, 2)}`}</AppText></View><View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Contributions</AppText><AppText style={styles.levelValue}>{`$${F(out.contributions, 2)}`}</AppText></View><View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Interest earned</AppText><AppText style={styles.levelValue}>{`$${F(out.interest, 2)}`}</AppText></View></View>
            <Chart
              series={out.points}
              xMax={out.n}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              xLabel="Horizontal axis: Months"
              yLabel="Vertical axis: Balance ($)"
              xTickLabel={(v) => `${Math.round(v)}`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>Horizontal axis = months invested. Vertical axis = projected account balance.</AppText>
          </View>
        </View>
        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function RetirementSavingsPFTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [age, setAge] = useState('30'); const [retAge, setRetAge] = useState('65'); const [pv, setPv] = useState('15000'); const [monthly, setMonthly] = useState('500'); const [rate, setRate] = useState('7'); const [target, setTarget] = useState('1000000');

  const out = useMemo(() => {
    const a = Math.max(0, Math.floor(N(age)));
    const ra = Math.max(a + 1, Math.floor(N(retAge)));
    const p = Math.max(0, N(pv));
    const m = Math.max(0, N(monthly));
    const t = Math.max(0, N(target));
    const n = (ra - a) * 12;
    const r = Math.max(0, N(rate)) / 1200;

    let bal = p;
    const series = [{ x: a, y: bal }];
    for (let i = 1; i <= n; i += 1) {
      bal = bal * (1 + r) + m;
      if (i % 12 === 0 || i === n) series.push({ x: a + (i / 12), y: bal });
    }

    const g = Math.pow(1 + r, n);
    const needed = n <= 0 ? 0 : r === 0 ? Math.max(0, (t - p) / n) : Math.max(0, (t - p * g) / ((g - 1) / r));

    return { a, ra, t, projected: bal, gap: Math.max(0, t - bal), needed, series, yMax: Math.max(t, bal, 1) };
  }, [age, monthly, pv, rate, retAge, target]);

  const seriesNorm = out.series.map((p) => ({ x: p.x - out.a, y: p.y }));
  const targetLine = ((vMax) => {
    const { w, h, l, r, t, b } = chartBox();
    const y = h - b - ((out.t / Math.max(vMax, 1)) * (h - t - b));
    return <Line x1={l} y1={y} x2={w - r} y2={y} stroke="#ef4444" strokeWidth="1.2" opacity={0.85} />;
  })(out.yMax);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Retirement Savings Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Current age</AppText><AppTextInput value={age} onChangeText={setAge} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Retirement age</AppText><AppTextInput value={retAge} onChangeText={setRetAge} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Current savings</AppText><AppTextInput value={pv} onChangeText={setPv} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Monthly contribution</AppText><AppTextInput value={monthly} onChangeText={setMonthly} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Expected return (%)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Target corpus</AppText><AppTextInput value={target} onChangeText={setTarget} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Retirement projection</AppText>
            <View style={styles.resultRow}><View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Projected corpus</AppText><AppText style={styles.levelValue}>{`$${F(out.projected, 2)}`}</AppText></View><View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Target corpus</AppText><AppText style={styles.levelValue}>{`$${F(out.t, 2)}`}</AppText></View></View>
            <View style={styles.resultRow}><View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Gap</AppText><AppText style={styles.levelValue}>{`$${F(out.gap, 2)}`}</AppText></View><View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Monthly needed</AppText><AppText style={styles.levelValue}>{`$${F(out.needed, 2)}`}</AppText></View></View>
            <Chart
              series={seriesNorm}
              xMax={Math.max(out.ra - out.a, 1)}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              extraLines={targetLine}
              xLabel="Horizontal axis: Age progression (years)"
              yLabel="Vertical axis: Corpus ($)"
              xTickLabel={(v) => `${Math.round(out.a + v)}`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>Horizontal axis = age. Vertical axis = retirement corpus value. Red line is your target corpus.</AppText>
          </View>
        </View>
        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}


export function SIPTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [sip, setSip] = useState('25000');
  const [annualReturn, setAnnualReturn] = useState('12');
  const [years, setYears] = useState('10');

  const out = useMemo(() => {
    const pmt = Math.max(0, N(sip));
    const r = Math.max(0, N(annualReturn)) / 1200;
    const y = Math.max(1, Math.floor(N(years)));
    const n = y * 12;
    let bal = 0;
    const points = [{ x: 0, y: 0, invested: 0 }];
    for (let m = 1; m <= n; m += 1) {
      bal = (bal + pmt) * (1 + r);
      if (m % 12 === 0 || m === n) points.push({ x: m / 12, y: bal, invested: pmt * m });
    }
    const invested = pmt * n;
    const returns = Math.max(0, bal - invested);
    return { y, n, points, invested, returns, total: bal, yMax: Math.max(bal, invested, 1), monthlyRatePct: r * 100 };
  }, [annualReturn, sip, years]);

  const donutSize = 128;
  const radius = 44;
  const c = 2 * Math.PI * radius;
  const investedPct = out.total > 0 ? out.invested / out.total : 0;
  const investedLen = c * investedPct;
  const returnLen = Math.max(0, c - investedLen);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>SIP Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Monthly SIP</AppText><AppTextInput value={sip} onChangeText={setSip} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Expected annual return (%)</AppText><AppTextInput value={annualReturn} onChangeText={setAnnualReturn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Investment duration (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>SIP Summary</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Invested amount</AppText><AppText style={styles.levelValue}>{`$${F(out.invested, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Estimated returns</AppText><AppText style={styles.levelValue}>{`$${F(out.returns, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Total value</AppText><AppText style={styles.levelValue}>{`$${F(out.total, 0)}`}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Monthly rate</AppText><AppText style={styles.levelValue}>{`${F(out.monthlyRatePct, 2)}%`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Time in market</AppText><AppText style={styles.levelValue}>{`${out.n} months`}</AppText></View>
            </View>
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Projected SIP Growth</AppText>
            <Chart
              series={out.points.map((p) => ({ x: p.x, y: p.y }))}
              xMax={out.y}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              xLabel="Horizontal axis: Years"
              yLabel="Vertical axis: Portfolio value ($)"
              xTickLabel={(v) => `${Math.round(v)}y`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>Horizontal axis = years. Vertical axis = projected SIP portfolio value.</AppText>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Invested vs Returns</AppText>
            <View style={[styles.subCard, { alignItems: 'center' }]}>
              <Svg width={donutSize} height={donutSize}>
                <Circle cx={donutSize / 2} cy={donutSize / 2} r={radius} stroke={themeColors.border} strokeWidth="16" fill="none" />
                <Circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  stroke="#17a9ff"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${investedLen} ${Math.max(0, c - investedLen)}`}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}
                />
                <Circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  stroke="#d946ef"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${returnLen} ${Math.max(0, c - returnLen)}`}
                  strokeDashoffset={-investedLen}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}
                />
              </Svg>
              <View style={styles.resultRow}>
                <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Invested</AppText><AppText style={styles.levelValue}>{`$${F(out.invested, 0)}`}</AppText></View>
                <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Returns</AppText><AppText style={styles.levelValue}>{`$${F(out.returns, 0)}`}</AppText></View>
              </View>
            </View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function LumpsumTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [amount, setAmount] = useState('25000');
  const [annualReturn, setAnnualReturn] = useState('12');
  const [years, setYears] = useState('10');
  const [freq, setFreq] = useState('yearly');

  const out = useMemo(() => {
    const p = Math.max(0, N(amount));
    const r = Math.max(0, N(annualReturn)) / 100;
    const y = Math.max(1, Math.floor(N(years)));
    const m = freq === 'monthly' ? 12 : freq === 'quarterly' ? 4 : freq === 'half-yearly' ? 2 : 1;
    const totalPeriods = y * m;
    const periodic = r / m;
    const fv = p * Math.pow(1 + periodic, totalPeriods);
    const points = Array.from({ length: y + 1 }, (_, k) => ({ x: k, y: p * Math.pow(1 + periodic, k * m) }));
    return { y, fv, invested: p, returns: Math.max(0, fv - p), points, yMax: Math.max(fv, p, 1) };
  }, [amount, annualReturn, years, freq]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Lumpsum Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Investment amount</AppText><AppTextInput value={amount} onChangeText={setAmount} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Expected annual return (%)</AppText><AppTextInput value={annualReturn} onChangeText={setAnnualReturn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Time period (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
            </View>
            <View style={styles.btnRow}>
              {['yearly', 'half-yearly', 'quarterly', 'monthly'].map((k) => (
                <View key={k} style={{ flex: 1 }}>
                  <AppText style={styles.label}>{k === freq ? 'Selected' : ''}</AppText>
                  <View style={k === freq ? styles.primaryBtn : styles.ghostBtn}><AppText style={k === freq ? styles.primaryBtnText : styles.ghostBtnText} onPress={() => setFreq(k)}>{k}</AppText></View>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Lumpsum Summary</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Invested amount</AppText><AppText style={styles.levelValue}>{`$${F(out.invested, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Estimated returns</AppText><AppText style={styles.levelValue}>{`$${F(out.returns, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Total value</AppText><AppText style={styles.levelValue}>{`$${F(out.fv, 0)}`}</AppText></View>
            </View>
            <Chart
              series={out.points}
              xMax={out.y}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              color="#10b981"
              xLabel="Horizontal axis: Years"
              yLabel="Vertical axis: Future value ($)"
              xTickLabel={(v) => `${Math.round(v)}y`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>Horizontal axis = years. Vertical axis = projected lumpsum value.</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function SWPTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [initial, setInitial] = useState('500000');
  const [withdrawal, setWithdrawal] = useState('10000');
  const [annualReturn, setAnnualReturn] = useState('8');
  const [years, setYears] = useState('5');

  const out = useMemo(() => {
    const p = Math.max(0, N(initial));
    const w = Math.max(0, N(withdrawal));
    const r = Math.max(0, N(annualReturn)) / 1200;
    const y = Math.max(1, Math.floor(N(years)));
    const n = y * 12;
    let bal = p;
    const points = [{ x: 0, y: bal }];
    const schedule = [];
    let depletedAt = null;
    for (let m = 1; m <= n; m += 1) {
      const opening = bal;
      const interest = opening * r;
      bal = opening + interest - w;
      if (bal < 0 && depletedAt == null) depletedAt = m;
      bal = Math.max(0, bal);
      points.push({ x: m, y: bal });
      if (m <= 12) schedule.push({ m, opening, interest, withdrawal: w, closing: bal });
    }
    return {
      n,
      points,
      schedule,
      invested: p,
      withdrawn: w * n,
      final: bal,
      growth: Math.max(0, bal + (w * n) - p),
      depletedAt,
      yMax: Math.max(p, ...points.map((pt) => pt.y), 1),
      withdrawRate: p > 0 ? ((w * 12) / p) * 100 : 0,
      monthlyPct: r * 100,
    };
  }, [annualReturn, initial, withdrawal, years]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>SWP Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Initial investment</AppText><AppTextInput value={initial} onChangeText={setInitial} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Monthly withdrawal</AppText><AppTextInput value={withdrawal} onChangeText={setWithdrawal} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Expected annual return (%)</AppText><AppTextInput value={annualReturn} onChangeText={setAnnualReturn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Duration (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>SWP Summary</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Initial investment</AppText><AppText style={styles.levelValue}>{`$${F(out.invested, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Total withdrawn</AppText><AppText style={styles.levelValue}>{`$${F(out.withdrawn, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Final balance</AppText><AppText style={styles.levelValue}>{`$${F(out.final, 0)}`}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Withdrawal rate</AppText><AppText style={styles.levelValue}>{`${F(out.withdrawRate, 2)}% / year`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Monthly return</AppText><AppText style={styles.levelValue}>{`${F(out.monthlyPct, 3)}%`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Corpus depletion</AppText><AppText style={styles.levelValue}>{out.depletedAt ? `Month ${out.depletedAt}` : 'Not depleted'}</AppText></View>
            </View>
            <Chart
              series={out.points}
              xMax={out.n}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              color="#f59e0b"
              xLabel="Horizontal axis: Months"
              yLabel="Vertical axis: Remaining corpus ($)"
              xTickLabel={(v) => `${Math.round(v / 12)}y`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>Horizontal axis = elapsed months. Vertical axis = remaining corpus after withdrawals.</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>SWP Schedule (first 12 months)</AppText>
          {out.schedule.map((row) => (
            <View key={`swp-${row.m}`} style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>{`Month ${row.m}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>{`Open $${F(row.opening, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>{`Interest $${F(row.interest, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>{`Close $${F(row.closing, 0)}`}</AppText></View>
            </View>
          ))}
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function FDTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('6.5');
  const [years, setYears] = useState('5');
  const [mode, setMode] = useState('compound');
  const [freq, setFreq] = useState('quarterly');

  const out = useMemo(() => {
    const p = Math.max(0, N(principal));
    const r = Math.max(0, N(rate)) / 100;
    const y = Math.max(1, Math.floor(N(years)));
    const m = freq === 'monthly' ? 12 : freq === 'quarterly' ? 4 : freq === 'half-yearly' ? 2 : 1;
    const points = [];
    for (let k = 0; k <= y; k += 1) {
      const val = mode === 'simple' ? p * (1 + r * k) : p * Math.pow(1 + (r / m), k * m);
      points.push({ x: k, y: val });
    }
    const maturity = points[points.length - 1].y;
    return { y, points, invested: p, returns: Math.max(0, maturity - p), maturity, yMax: Math.max(maturity, p, 1), growthPct: p > 0 ? ((maturity - p) / p) * 100 : 0 };
  }, [principal, rate, years, mode, freq]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>FD Calculator</AppText>
            <View style={styles.btnRow}>
              <View style={{ flex: 1 }}><View style={mode === 'compound' ? styles.primaryBtn : styles.ghostBtn}><AppText style={mode === 'compound' ? styles.primaryBtnText : styles.ghostBtnText} onPress={() => setMode('compound')}>Compound FD</AppText></View></View>
              <View style={{ flex: 1 }}><View style={mode === 'simple' ? styles.primaryBtn : styles.ghostBtn}><AppText style={mode === 'simple' ? styles.primaryBtnText : styles.ghostBtnText} onPress={() => setMode('simple')}>Simple FD</AppText></View></View>
            </View>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Deposit amount</AppText><AppTextInput value={principal} onChangeText={setPrincipal} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Interest rate (p.a.)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Tenure (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
            </View>
            <View style={styles.btnRow}>
              {['yearly', 'half-yearly', 'quarterly', 'monthly'].map((k) => (
                <View key={`fd-${k}`} style={{ flex: 1 }}><View style={k === freq ? styles.primaryBtn : styles.ghostBtn}><AppText style={k === freq ? styles.primaryBtnText : styles.ghostBtnText} onPress={() => setFreq(k)}>{k}</AppText></View></View>
              ))}
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>FD Summary</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Invested amount</AppText><AppText style={styles.levelValue}>{`$${F(out.invested, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Estimated returns</AppText><AppText style={styles.levelValue}>{`$${F(out.returns, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Maturity amount</AppText><AppText style={styles.levelValue}>{`$${F(out.maturity, 0)}`}</AppText></View>
            </View>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Total growth</AppText><AppText style={styles.levelValue}>{`${F(out.growthPct, 2)}%`}</AppText></View>
            <Chart
              series={out.points}
              xMax={out.y}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              color="#22d3ee"
              xLabel="Horizontal axis: Years"
              yLabel="Vertical axis: FD value ($)"
              xTickLabel={(v) => `${Math.round(v)}y`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>Horizontal axis = years. Vertical axis = maturity value progression.</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function SimpleInterestTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('6');
  const [years, setYears] = useState('5');

  const out = useMemo(() => {
    const p = Math.max(0, N(principal));
    const r = Math.max(0, N(rate)) / 100;
    const y = Math.max(1, Math.floor(N(years)));
    const points = Array.from({ length: y + 1 }, (_, k) => ({ x: k, y: p * (1 + r * k) }));
    const maturity = points[points.length - 1].y;
    const interest = maturity - p;
    return { y, points, p, interest, maturity, yMax: Math.max(maturity, p, 1) };
  }, [principal, rate, years]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Simple Interest Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Principal amount</AppText><AppTextInput value={principal} onChangeText={setPrincipal} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Rate of interest (p.a.)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Time period (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Simple Interest Summary</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Principal</AppText><AppText style={styles.levelValue}>{`$${F(out.p, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Interest earned</AppText><AppText style={styles.levelValue}>{`$${F(out.interest, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Maturity amount</AppText><AppText style={styles.levelValue}>{`$${F(out.maturity, 0)}`}</AppText></View>
            </View>
            <Chart
              series={out.points}
              xMax={out.y}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              color="#22d3ee"
              xLabel="Horizontal axis: Years"
              yLabel="Vertical axis: Total value ($)"
              xTickLabel={(v) => `${Math.round(v)}y`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>Horizontal axis = years. Vertical axis = principal + linear interest value.</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Simple Interest Formula</AppText>
          <AppText style={styles.tipText}>A = P * (1 + r * t)</AppText>
          <AppText style={styles.tipText}>SI = P * r * t</AppText>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}



export function CompoundInterestTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('6');
  const [tenure, setTenure] = useState('5');
  const [freq, setFreq] = useState('yearly');

  const out = useMemo(() => {
    const p = Math.max(0, N(principal));
    const r = Math.max(0, N(rate)) / 100;
    const t = Math.max(1, Math.floor(N(tenure)));
    const n = freq === 'monthly' ? 12 : freq === 'quarterly' ? 4 : freq === 'half-yearly' ? 2 : 1;
    const maturity = p * Math.pow(1 + r / n, n * t);
    const interest = maturity - p;
    const growthPct = p > 0 ? (interest / p) * 100 : 0;
    const points = Array.from({ length: t + 1 }, (_, k) => ({ x: k, y: p * Math.pow(1 + r / n, n * k) }));
    return { p, t, maturity, interest, growthPct, points, yMax: Math.max(maturity, p, 1) };
  }, [freq, principal, rate, tenure]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Compound Interest Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Principal amount</AppText><AppTextInput value={principal} onChangeText={setPrincipal} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Rate of interest (p.a.)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Tenure (years)</AppText><AppTextInput value={tenure} onChangeText={setTenure} keyboardType="numeric" style={styles.input} /></View>
            </View>
            <View style={styles.btnRow}>
              {['yearly', 'half-yearly', 'quarterly', 'monthly'].map((k) => (
                <Pressable key={`ci-${k}`} style={k === freq ? styles.primaryBtn : styles.ghostBtn} onPress={() => setFreq(k)}>
                  <AppText style={k === freq ? styles.primaryBtnText : styles.ghostBtnText}>{k}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Compound Summary</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Principal</AppText><AppText style={styles.levelValue}>{`$${F(out.p, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Interest earned</AppText><AppText style={styles.levelValue}>{`$${F(out.interest, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Maturity amount</AppText><AppText style={styles.levelValue}>{`$${F(out.maturity, 0)}`}</AppText></View>
            </View>
            <Chart
              series={out.points}
              xMax={out.t}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              color="#6366f1"
              xLabel="Horizontal axis: Years"
              yLabel="Vertical axis: Maturity value ($)"
              xTickLabel={(v) => `${Math.round(v)}y`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>{`Total growth: ${F(out.growthPct, 2)}%. Horizontal axis = years, vertical axis = maturity value.`}</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>How to Calculate Compound Interest</AppText>
          <AppText style={styles.tipText}>A = P * (1 + r / n)^(n * t)</AppText>
          <AppText style={styles.tipText}>A = maturity amount, P = principal, r = annual rate, n = compounding frequency, t = years.</AppText>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function RDTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [monthlyDeposit, setMonthlyDeposit] = useState('500');
  const [rate, setRate] = useState('8.5');
  const [tenure, setTenure] = useState('4');

  const out = useMemo(() => {
    const pmt = Math.max(0, N(monthlyDeposit));
    const r = Math.max(0, N(rate)) / 1200;
    const y = Math.max(1, Math.floor(N(tenure)));
    const n = y * 12;
    let bal = 0;
    const points = [{ x: 0, y: 0, invested: 0 }];
    for (let m = 1; m <= n; m += 1) {
      bal = (bal + pmt) * (1 + r);
      if (m % 3 === 0 || m === n) points.push({ x: m / 12, y: bal, invested: pmt * m });
    }
    const invested = pmt * n;
    return { y, n, invested, maturity: bal, returns: Math.max(0, bal - invested), points, monthlyPct: r * 100, yMax: Math.max(bal, invested, 1) };
  }, [monthlyDeposit, rate, tenure]);

  const investedLine = out.points.map((p) => ({ x: p.x, y: p.invested }));
  const { w, h, l, r, t, b } = chartBox();
  const plotW = w - l - r;
  const plotH = h - t - b;
  const X = (v) => l + (v / Math.max(out.y, 1)) * plotW;
  const Y = (v) => h - b - (v / Math.max(out.yMax, 1)) * plotH;
  const baseline = <Polyline points={investedLine.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke="#94a3b8" strokeWidth="1.3" opacity={0.8} />;

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>RD Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Monthly deposit</AppText><AppTextInput value={monthlyDeposit} onChangeText={setMonthlyDeposit} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Interest rate (p.a.)</AppText><AppTextInput value={rate} onChangeText={setRate} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Tenure (years)</AppText><AppTextInput value={tenure} onChangeText={setTenure} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>RD Summary</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Total invested</AppText><AppText style={styles.levelValue}>{`$${F(out.invested, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Estimated returns</AppText><AppText style={styles.levelValue}>{`$${F(out.returns, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Maturity amount</AppText><AppText style={styles.levelValue}>{`$${F(out.maturity, 0)}`}</AppText></View>
            </View>
            <Chart
              series={out.points.map((p) => ({ x: p.x, y: p.y }))}
              xMax={out.y}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              color="#06b6d4"
              extraLines={baseline}
              xLabel="Horizontal axis: Years"
              yLabel="Vertical axis: RD value ($)"
              xTickLabel={(v) => `${Math.round(v)}y`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
            <AppText style={styles.tipText}>{`Effective monthly rate: ${F(out.monthlyPct, 3)}%. Cyan = maturity path, grey = invested baseline.`}</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function SpendingTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const defaultRows = [
    { id: 1, category: 'Housing (rent/mortgage, utilities)', group: 'Needs', amount: '0' },
    { id: 2, category: 'Transportation', group: 'Needs', amount: '0' },
    { id: 3, category: 'Food & Groceries', group: 'Wants', amount: '0' },
    { id: 4, category: 'Insurance', group: 'Needs', amount: '0' },
    { id: 5, category: 'Savings & Investing', group: 'Savings/Debt', amount: '0' },
    { id: 6, category: 'Extra Debt Paydown', group: 'Savings/Debt', amount: '0' },
  ];

  const [income, setIncome] = useState('5000');
  const [notes, setNotes] = useState('');
  const [useRule, setUseRule] = useState(true);
  const [rows, setRows] = useState(defaultRows);

  const groups = ['Needs', 'Wants', 'Savings/Debt', 'Other'];
  const targets = useRule ? { 'Needs': 50, 'Wants': 30, 'Savings/Debt': 20, 'Other': 0 } : { 'Needs': 40, 'Wants': 30, 'Savings/Debt': 20, 'Other': 10 };

  const calc = useMemo(() => {
    const takeHome = Math.max(0, N(income));
    const totals = { 'Needs': 0, 'Wants': 0, 'Savings/Debt': 0, 'Other': 0 };
    rows.forEach((r) => { totals[r.group] += Math.max(0, N(r.amount)); });
    const planned = totals.Needs + totals.Wants + totals['Savings/Debt'] + totals.Other;
    const left = takeHome - planned;
    const actualPct = {
      'Needs': takeHome > 0 ? (totals.Needs / takeHome) * 100 : 0,
      'Wants': takeHome > 0 ? (totals.Wants / takeHome) * 100 : 0,
      'Savings/Debt': takeHome > 0 ? (totals['Savings/Debt'] / takeHome) * 100 : 0,
      'Other': takeHome > 0 ? (totals.Other / takeHome) * 100 : 0,
    };
    return { takeHome, totals, planned, left, actualPct };
  }, [income, rows]);

  const setAmount = (id, v) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, amount: v } : r)));
  const clearAmount = (id) => setAmount(id, '0');
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));
  const addRow = () => setRows((prev) => [...prev, { id: Date.now(), category: 'New Category', group: 'Other', amount: '0' }]);
  const resetAll = () => setRows(defaultRows);
  const cycleGroup = (id) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const idx = groups.indexOf(r.group);
      return { ...r, group: groups[(idx + 1) % groups.length] };
    }));
  };

  const compW = Math.min(Dimensions.get('window').width - 84, 330);
  const barH = 26;
  const compTotal = Math.max(calc.planned, 1);
  const seg = [
    { key: 'Needs', c: '#3b82f6', v: calc.totals.Needs },
    { key: 'Wants', c: '#d946ef', v: calc.totals.Wants },
    { key: 'Savings/Debt', c: '#22c55e', v: calc.totals['Savings/Debt'] },
    { key: 'Other', c: '#94a3b8', v: calc.totals.Other },
  ];
  let cursor = 0;

  const actW = Math.min(Dimensions.get('window').width - 84, 330);
  const actH = 208;
  const l = 44; const rr = 10; const t = 10; const b = 54;
  const pw = actW - l - rr; const ph = actH - t - b;
  const groups3 = ['Needs', 'Wants', 'Savings/Debt'];
  const groups3Count = Math.max(1, groups3.length);
  const AX = (i) => l + ((i + 0.5) / groups3Count) * pw;
  const AY = (v) => actH - b - (Math.max(0, Math.min(v, 100)) / 100) * ph;
  const barW = Math.min(24, (pw / groups3Count) * 0.32);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Spending Calculator</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Monthly take-home</AppText><AppTextInput value={income} onChangeText={setIncome} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Notes</AppText><AppTextInput value={notes} onChangeText={setNotes} style={styles.input} /></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Planned total</AppText><AppText style={styles.levelValue}>{`$${F(calc.planned, 2)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Left after spend</AppText><AppText style={styles.levelValue}>{`$${F(calc.left, 2)}`}</AppText></View>
            </View>
            <Pressable style={useRule ? styles.primaryBtn : styles.ghostBtn} onPress={() => setUseRule((v) => !v)}>
              <AppText style={useRule ? styles.primaryBtnText : styles.ghostBtnText}>{useRule ? 'Use 50/30/20 targets: On' : 'Use 50/30/20 targets: Off'}</AppText>
            </Pressable>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Monthly Total</AppText>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.bigMetric}>{`$${F(calc.planned, 2)}`}</AppText></View>
            <View style={styles.subCard}>
              <AppText style={styles.label}>Composition by group</AppText>
              <Svg width={compW} height={64}>
                <Rect x="0" y="10" width={compW} height={barH} rx="8" fill={themeColors.surfaceGlass} />
                {seg.map((s) => {
                  const w = (s.v / compTotal) * compW;
                  const node = <Rect key={`seg-${s.key}`} x={cursor} y="10" width={Math.max(0, w)} height={barH} rx="8" fill={s.c} opacity={0.95} />;
                  cursor += w;
                  return node;
                })}
              </Svg>
              <View style={styles.heroTagRow}>
                {seg.map((s) => <AppText key={`legend-${s.key}`} style={styles.tipText}>{`${s.key}: $${F(s.v, 0)}`}</AppText>)}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Category Table</AppText>
            {rows.map((r) => (
              <View key={`sp-${r.id}`} style={styles.resultRow}>
                <View style={[styles.levelBox, styles.levelPivot, { flex: 2 }]}><AppText style={styles.levelLabel}>{r.category}</AppText></View>
                <Pressable style={[styles.levelBox, styles.levelRes, { flex: 1 }]} onPress={() => cycleGroup(r.id)}><AppText style={styles.levelLabel}>{r.group}</AppText></Pressable>
                <View style={[styles.levelBox, styles.levelSup, { flex: 1 }]}><AppTextInput value={r.amount} onChangeText={(v) => setAmount(r.id, v)} keyboardType="numeric" style={styles.input} /></View>
                <Pressable style={styles.ghostBtn} onPress={() => clearAmount(r.id)}><AppText style={styles.ghostBtnText}>Clear</AppText></Pressable>
                <Pressable style={styles.ghostBtn} onPress={() => removeRow(r.id)}><AppText style={styles.ghostBtnText}>Remove</AppText></Pressable>
              </View>
            ))}
            <View style={styles.btnRow}>
              <Pressable style={styles.ghostBtn} onPress={addRow}><AppText style={styles.ghostBtnText}>Add Category</AppText></Pressable>
              <Pressable style={styles.ghostBtn} onPress={() => setRows((prev) => prev.map((r) => ({ ...r, amount: '0' })))}><AppText style={styles.ghostBtnText}>Clear Amounts</AppText></Pressable>
              <Pressable style={styles.ghostBtn} onPress={resetAll}><AppText style={styles.ghostBtnText}>Reset All</AppText></Pressable>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Actual vs target</AppText>
            <View style={styles.subCard}>
              <Svg width={actW} height={actH}>
                {[0, 25, 50, 75, 100].map((v) => <Line key={`sp-g-${v}`} x1={l} y1={AY(v)} x2={actW - rr} y2={AY(v)} stroke={themeColors.border} strokeWidth="1" opacity={0.5} />)}
                <Line x1={l} y1={actH - b} x2={actW - rr} y2={actH - b} stroke={themeColors.border} strokeWidth="1.1" />
                <Line x1={l} y1={t} x2={l} y2={actH - b} stroke={themeColors.border} strokeWidth="1.1" />
                {groups3.map((g, i) => (
                  <Rect key={`target-${g}`} x={AX(i) - barW - 3} y={AY(targets[g])} width={barW} height={(actH - b) - AY(targets[g])} fill="#64748b" opacity={0.35} rx="2" />
                ))}
                {groups3.map((g, i) => (
                  <Rect key={`actual-${g}`} x={AX(i) + 3} y={AY(calc.actualPct[g])} width={barW} height={(actH - b) - AY(calc.actualPct[g])} fill={g === 'Needs' ? '#3b82f6' : g === 'Wants' ? '#d946ef' : '#22c55e'} opacity={0.9} rx="2" />
                ))}
                {groups3.map((g, i) => <SvgText key={`lbl-${g}`} x={AX(i)} y={actH - 30} fill={themeColors.textMuted} fontSize="9" textAnchor="middle">{g.replace('/Debt', '')}</SvgText>)}
                {[0, 25, 50, 75, 100].map((v) => <SvgText key={`yl-${v}`} x={l - 4} y={AY(v) + 3} fill={themeColors.textMuted} fontSize="9" textAnchor="end">{v}</SvgText>)}
                <SvgText x={14} y={(t + (actH - b)) / 2} fill={themeColors.textMuted} fontSize="10" textAnchor="middle" transform={`rotate(-90, 14, ${(t + (actH - b)) / 2})`}>Y axis: % of income</SvgText>
              </Svg>
            </View>
            <AppText style={styles.tipText}>X axis: Categories (Needs/Wants/Savings). Dark bars = target, bright bars = actual.</AppText>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function LifeInsuranceTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [income, setIncome] = useState('120000');
  const [yearsToReplace, setYearsToReplace] = useState('20');
  const [debts, setDebts] = useState('25000');
  const [mortgage, setMortgage] = useState('300000');
  const [education, setEducation] = useState('120000');
  const [finalExp, setFinalExp] = useState('15000');
  const [savings, setSavings] = useState('50000');
  const [existingCover, setExistingCover] = useState('150000');
  const [mult, setMult] = useState('12');
  const [showAdv, setShowAdv] = useState(false);
  const [discount, setDiscount] = useState('6');
  const [growth, setGrowth] = useState('3');

  const out = useMemo(() => {
    const inc = Math.max(0, N(income));
    const yrs = Math.max(1, Math.floor(N(yearsToReplace)));
    const debtBlock = Math.max(0, N(debts)) + Math.max(0, N(mortgage)) + Math.max(0, N(education)) + Math.max(0, N(finalExp));
    const existing = Math.max(0, N(savings)) + Math.max(0, N(existingCover));

    const rule = Math.max(0, inc * Math.max(1, N(mult)) + debtBlock - existing);
    const dime = Math.max(0, debtBlock + (inc * yrs) - existing);

    const d = Math.max(0, N(discount)) / 100;
    const g = Math.max(0, N(growth)) / 100;
    let pvIncome = 0;
    if (Math.abs(d - g) < 1e-6) pvIncome = inc * yrs / (1 + d);
    else pvIncome = inc * ((1 - Math.pow((1 + g) / (1 + d), yrs)) / Math.max(d - g, 1e-6));
    const hlv = Math.max(0, pvIncome + debtBlock - existing);

    const target = Math.max(rule, dime, hlv);
    const tiers = [250000, 500000, 750000, 1000000, 1250000, 1500000, 1750000, 2000000, 2500000, 3000000, 4000000, 5000000];
    const nearest = tiers.find((v) => v >= target) || Math.ceil(target / 250000) * 250000;

    return { rule, dime, hlv, target, nearest };
  }, [debts, discount, education, existingCover, finalExp, growth, income, mortgage, mult, savings, yearsToReplace]);

  const maxVal = Math.max(out.rule, out.dime, out.hlv, 1);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Quick presets</AppText>
            <View style={styles.btnRow}>
              {[10, 12, 15].map((m) => <Pressable key={`mul-${m}`} style={styles.ghostBtn} onPress={() => setMult(String(m))}><AppText style={styles.ghostBtnText}>{`${m}x income`}</AppText></Pressable>)}
            </View>

            <AppText style={styles.sectionTitle}>Inputs</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Annual income</AppText><AppTextInput value={income} onChangeText={setIncome} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Years to replace income</AppText><AppTextInput value={yearsToReplace} onChangeText={setYearsToReplace} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Debts (non-mortgage)</AppText><AppTextInput value={debts} onChangeText={setDebts} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Mortgage balance</AppText><AppTextInput value={mortgage} onChangeText={setMortgage} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Education goal</AppText><AppTextInput value={education} onChangeText={setEducation} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Final expenses</AppText><AppTextInput value={finalExp} onChangeText={setFinalExp} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Existing savings / investments</AppText><AppTextInput value={savings} onChangeText={setSavings} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Existing life insurance</AppText><AppTextInput value={existingCover} onChangeText={setExistingCover} keyboardType="numeric" style={styles.input} /></View>
            </View>
            <Pressable style={showAdv ? styles.primaryBtn : styles.ghostBtn} onPress={() => setShowAdv((v) => !v)}><AppText style={showAdv ? styles.primaryBtnText : styles.ghostBtnText}>Show advanced assumptions</AppText></Pressable>
            {showAdv && (
              <View style={styles.grid}>
                <View style={styles.field}><AppText style={styles.label}>Discount rate (%)</AppText><AppTextInput value={discount} onChangeText={setDiscount} keyboardType="numeric" style={styles.input} /></View>
                <View style={styles.field}><AppText style={styles.label}>Income growth (%)</AppText><AppTextInput value={growth} onChangeText={setGrowth} keyboardType="numeric" style={styles.input} /></View>
                <View style={styles.fieldFull}><AppText style={styles.label}>Rule-of-thumb multiple (x)</AppText><AppTextInput value={mult} onChangeText={setMult} keyboardType="numeric" style={styles.input} /></View>
              </View>
            )}
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Suggested coverage</AppText>
            <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Target amount (max across methods)</AppText><AppText style={styles.bigMetric}>{`$${F(out.target, 2)}`}</AppText><AppText style={styles.tipText}>{`Nearest policy tier: $${F(out.nearest, 0)}`}</AppText></View>

            {[
              { label: 'Rule of Thumb', value: out.rule, color: '#22d3ee' },
              { label: 'DIME', value: out.dime, color: '#d946ef' },
              { label: 'Human Life Value', value: out.hlv, color: '#34d399' },
            ].map((m) => (
              <View key={m.label} style={[styles.levelBox, styles.levelRes]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText style={styles.levelLabel}>{m.label}</AppText>
                  <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: m.color }} />
                </View>
                <AppText style={styles.levelValue}>{`$${F(m.value, 2)}`}</AppText>
                <View style={{ height: 8, borderRadius: 999, backgroundColor: themeColors.surfaceAlt, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.max(2, (m.value / maxVal) * 100)}%`, height: '100%', backgroundColor: m.color }} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function PropertyValuationTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [tab, setTab] = useState('income');
  const [units, setUnits] = useState('1');
  const [rent, setRent] = useState('2500');
  const [vacancy, setVacancy] = useState('5');
  const [otherIncome, setOtherIncome] = useState('0');
  const [opexRatio, setOpexRatio] = useState('35');
  const [capexMonthly, setCapexMonthly] = useState('100');
  const [capRate, setCapRate] = useState('6');
  const [annualDebtService, setAnnualDebtService] = useState('0');

  const [subjectSqft, setSubjectSqft] = useState('1500');
  const [comp1Ppsf, setComp1Ppsf] = useState('280');
  const [comp2Ppsf, setComp2Ppsf] = useState('300');
  const [comp3Ppsf, setComp3Ppsf] = useState('290');

  const [grmAnnualRent, setGrmAnnualRent] = useState('30000');
  const [grmMultiple, setGrmMultiple] = useState('9.5');

  const incomeOut = useMemo(() => {
    const u = Math.max(0, N(units));
    const gpr = u * Math.max(0, N(rent)) * 12;
    const vac = -(gpr * Math.max(0, N(vacancy)) / 100);
    const oth = Math.max(0, N(otherIncome)) * 12;
    const egi = gpr + vac + oth;
    const opex = -(egi * Math.max(0, N(opexRatio)) / 100);
    const capex = -(Math.max(0, N(capexMonthly)) * 12);
    const noi = egi + opex + capex;
    const rate = Math.max(0.1, N(capRate));
    const value = noi / (rate / 100);
    const ds = Math.max(0, N(annualDebtService));
    return { gpr, vac, oth, egi, opex, capex, noi, value, perUnit: u > 0 ? value / u : 0, dscr: ds > 0 ? noi / ds : null };
  }, [annualDebtService, capRate, capexMonthly, opexRatio, otherIncome, rent, units, vacancy]);

  const salesOut = useMemo(() => {
    const avg = (Math.max(0, N(comp1Ppsf)) + Math.max(0, N(comp2Ppsf)) + Math.max(0, N(comp3Ppsf))) / 3;
    const sqft = Math.max(0, N(subjectSqft));
    return { avgPpsf: avg, value: avg * sqft };
  }, [comp1Ppsf, comp2Ppsf, comp3Ppsf, subjectSqft]);

  const grmOut = useMemo(() => {
    const rentAnnual = Math.max(0, N(grmAnnualRent));
    const mult = Math.max(0, N(grmMultiple));
    return { value: rentAnnual * mult };
  }, [grmAnnualRent, grmMultiple]);

  const selectedValue = tab === 'income' ? incomeOut.value : tab === 'sales' ? salesOut.value : grmOut.value;
  const breakdown = [
    { key: 'GPR', value: incomeOut.gpr, color: '#38bdf8' },
    { key: 'Vacancy', value: incomeOut.vac, color: '#fb7185' },
    { key: 'Other', value: incomeOut.oth, color: '#a78bfa' },
    { key: 'OpEx', value: incomeOut.opex, color: '#818cf8' },
    { key: 'CapEx', value: incomeOut.capex, color: '#fbbf24' },
    { key: 'NOI', value: incomeOut.noi, color: '#34d399' },
  ];
  const maxAbs = Math.max(...breakdown.map((b) => Math.abs(b.value)), 1);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Inputs</AppText>
            <View style={styles.btnRow}>
              <Pressable style={tab === 'income' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setTab('income')}><AppText style={tab === 'income' ? styles.primaryBtnText : styles.ghostBtnText}>Income (Cap-Rate)</AppText></Pressable>
              <Pressable style={tab === 'sales' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setTab('sales')}><AppText style={tab === 'sales' ? styles.primaryBtnText : styles.ghostBtnText}>Sales Comps</AppText></Pressable>
              <Pressable style={tab === 'grm' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setTab('grm')}><AppText style={tab === 'grm' ? styles.primaryBtnText : styles.ghostBtnText}>GRM</AppText></Pressable>
            </View>

            {tab === 'income' && (<View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Units</AppText><AppTextInput value={units} onChangeText={setUnits} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Gross monthly rent</AppText><AppTextInput value={rent} onChangeText={setRent} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Vacancy (%)</AppText><AppTextInput value={vacancy} onChangeText={setVacancy} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Other income (monthly)</AppText><AppTextInput value={otherIncome} onChangeText={setOtherIncome} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>OpEx ratio (%)</AppText><AppTextInput value={opexRatio} onChangeText={setOpexRatio} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>CapEx reserve (monthly)</AppText><AppTextInput value={capexMonthly} onChangeText={setCapexMonthly} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Cap rate (%)</AppText><AppTextInput value={capRate} onChangeText={setCapRate} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Annual debt service</AppText><AppTextInput value={annualDebtService} onChangeText={setAnnualDebtService} keyboardType="numeric" style={styles.input} /></View>
            </View>)}

            {tab === 'sales' && (<View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Subject size (sqft)</AppText><AppTextInput value={subjectSqft} onChangeText={setSubjectSqft} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Comp 1 ($/sqft)</AppText><AppTextInput value={comp1Ppsf} onChangeText={setComp1Ppsf} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Comp 2 ($/sqft)</AppText><AppTextInput value={comp2Ppsf} onChangeText={setComp2Ppsf} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Comp 3 ($/sqft)</AppText><AppTextInput value={comp3Ppsf} onChangeText={setComp3Ppsf} keyboardType="numeric" style={styles.input} /></View>
            </View>)}

            {tab === 'grm' && (<View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Gross rent (annual)</AppText><AppTextInput value={grmAnnualRent} onChangeText={setGrmAnnualRent} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>GRM multiple</AppText><AppTextInput value={grmMultiple} onChangeText={setGrmMultiple} keyboardType="numeric" style={styles.input} /></View>
            </View>)}
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Results</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>NOI (annual)</AppText><AppText style={styles.levelValue}>{`$${F(incomeOut.noi, 2)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Estimated value</AppText><AppText style={styles.levelValue}>{`$${F(selectedValue, 2)}`}</AppText></View>
            </View>

            <View style={styles.subCard}>
              <AppText style={styles.label}>Income & expenses (annual)</AppText>
              {breakdown.map((b) => (
                <View key={`br-${b.key}`} style={{ marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><AppText style={styles.tipText}>{b.key}</AppText><AppText style={styles.tipText}>{`$${F(b.value, 0)}`}</AppText></View>
                  <View style={{ height: 8, borderRadius: 999, backgroundColor: themeColors.surfaceGlass, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.max(2, (Math.abs(b.value) / maxAbs) * 100)}%`, height: '100%', backgroundColor: b.color, opacity: 0.9 }} />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Per-unit (if units &gt; 0)</AppText><AppText style={styles.levelValue}>{`$${F(incomeOut.perUnit, 2)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>DSCR (optional)</AppText><AppText style={styles.levelValue}>{incomeOut.dscr == null ? '--' : F(incomeOut.dscr, 2)}</AppText></View>
            </View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}



export function MutualFundReturnsTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [initial, setInitial] = useState('25000');
  const [monthly, setMonthly] = useState('500');
  const [annualReturn, setAnnualReturn] = useState('8.5');
  const [years, setYears] = useState('10');

  const presets = {
    Conservative: { r: 6.5, m: 300 },
    Balanced: { r: 8.5, m: 500 },
    Growth: { r: 11, m: 700 },
  };

  const out = useMemo(() => {
    const p0 = Math.max(0, N(initial));
    const m = Math.max(0, N(monthly));
    const y = Math.max(1, Math.floor(N(years)));
    const n = y * 12;
    const r = Math.max(0, N(annualReturn)) / 1200;

    let bal = p0;
    const points = [{ x: 0, y: bal, invested: p0 }];
    for (let k = 1; k <= n; k += 1) {
      bal = (bal + m) * (1 + r);
      if (k % 12 === 0 || k === n) points.push({ x: k / 12, y: bal, invested: p0 + (m * k) });
    }

    const invested = p0 + (m * n);
    const returns = Math.max(0, bal - invested);
    const wealth = invested > 0 ? bal / invested : 0;

    return {
      y,
      n,
      points,
      invested,
      returns,
      total: bal,
      wealth,
      monthlyRatePct: r * 100,
      yMax: Math.max(bal, invested, 1),
    };
  }, [annualReturn, initial, monthly, years]);

  const investedLine = out.points.map((p) => ({ x: p.x, y: p.invested }));
  const { w, h, l, r, t, b } = chartBox();
  const plotW = w - l - r;
  const plotH = h - t - b;
  const X = (v) => l + (v / Math.max(out.y, 1)) * plotW;
  const Y = (v) => h - b - (v / Math.max(out.yMax, 1)) * plotH;
  const baseline = <Polyline points={investedLine.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke="#94a3b8" strokeWidth="1.3" opacity={0.75} />;

  const donutSize = 128;
  const radius = 44;
  const c = 2 * Math.PI * radius;
  const investedPct = out.total > 0 ? out.invested / out.total : 0;
  const investedLen = c * investedPct;
  const returnLen = Math.max(0, c - investedLen);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Mutual Fund Returns Calculator</AppText>
            <View style={styles.btnRow}>
              {Object.keys(presets).map((k) => (
                <Pressable key={`mf-${k}`} style={styles.ghostBtn} onPress={() => { setAnnualReturn(String(presets[k].r)); setMonthly(String(presets[k].m)); }}>
                  <AppText style={styles.ghostBtnText}>{k}</AppText>
                </Pressable>
              ))}
            </View>
            <View style={styles.grid}>
              <View style={styles.fieldFull}><AppText style={styles.label}>Initial investment</AppText><AppTextInput value={initial} onChangeText={setInitial} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Monthly contribution</AppText><AppTextInput value={monthly} onChangeText={setMonthly} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Expected annual return (%)</AppText><AppTextInput value={annualReturn} onChangeText={setAnnualReturn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Investment duration (years)</AppText><AppTextInput value={years} onChangeText={setYears} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Summary</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Total invested</AppText><AppText style={styles.levelValue}>{`$${F(out.invested, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Estimated returns</AppText><AppText style={styles.levelValue}>{`$${F(out.returns, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Future value</AppText><AppText style={styles.levelValue}>{`$${F(out.total, 0)}`}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Wealth multiple</AppText><AppText style={styles.levelValue}>{`${F(out.wealth, 2)}x`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Monthly rate</AppText><AppText style={styles.levelValue}>{`${F(out.monthlyRatePct, 2)}%`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Time in market</AppText><AppText style={styles.levelValue}>{`${out.n} months`}</AppText></View>
            </View>
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Projected Growth</AppText>
            <Chart
              series={out.points.map((p) => ({ x: p.x, y: p.y }))}
              xMax={out.y}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              color="#17a9ff"
              extraLines={baseline}
              xLabel="X axis: Years"
              yLabel="Y axis: Portfolio value ($)"
              xTickLabel={(v) => `${Math.round(v)}y`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
          </View>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Invested vs Returns</AppText>
            <View style={[styles.subCard, { alignItems: 'center' }]}>
              <Svg width={donutSize} height={donutSize}>
                <Circle cx={donutSize / 2} cy={donutSize / 2} r={radius} stroke={themeColors.border} strokeWidth="16" fill="none" />
                <Circle cx={donutSize / 2} cy={donutSize / 2} r={radius} stroke="#17a9ff" strokeWidth="16" fill="none" strokeDasharray={`${investedLen} ${Math.max(0, c - investedLen)}`} transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`} />
                <Circle cx={donutSize / 2} cy={donutSize / 2} r={radius} stroke="#22c55e" strokeWidth="16" fill="none" strokeDasharray={`${returnLen} ${Math.max(0, c - returnLen)}`} strokeDashoffset={-investedLen} transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`} />
              </Svg>
              <View style={styles.resultRow}>
                <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Invested</AppText><AppText style={styles.levelValue}>{`$${F(out.invested, 0)}`}</AppText></View>
                <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Returns</AppText><AppText style={styles.levelValue}>{`$${F(out.returns, 0)}`}</AppText></View>
              </View>
            </View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function CarpetTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [lengthFt, setLengthFt] = useState('0');
  const [lengthIn, setLengthIn] = useState('0');
  const [widthFt, setWidthFt] = useState('0');
  const [widthIn, setWidthIn] = useState('0');

  const [riseIn, setRiseIn] = useState('0');
  const [runIn, setRunIn] = useState('0');
  const [stairsCount, setStairsCount] = useState('0');
  const [stairWidthFt, setStairWidthFt] = useState('0');
  const [stairWidthIn, setStairWidthIn] = useState('0');

  const [landingLenFt, setLandingLenFt] = useState('0');
  const [landingLenIn, setLandingLenIn] = useState('0');
  const [landingWidFt, setLandingWidFt] = useState('0');
  const [landingWidIn, setLandingWidIn] = useState('0');

  const toFeet = (ft, inch) => Math.max(0, N(ft)) + (Math.max(0, N(inch)) / 12);

  const room = useMemo(() => {
    const L = toFeet(lengthFt, lengthIn);
    const W = toFeet(widthFt, widthIn);
    const sqft = L * W;
    return { sqft, sqyd: sqft / 9 };
  }, [lengthFt, lengthIn, widthFt, widthIn]);

  const stairs = useMemo(() => {
    const rise = Math.max(0, N(riseIn));
    const run = Math.max(0, N(runIn));
    const count = Math.max(0, Math.floor(N(stairsCount)));
    const w = toFeet(stairWidthFt, stairWidthIn);
    const treadFt = run / 12;
    const riserFt = rise / 12;
    const oneStepArea = w * (treadFt + riserFt);
    const stairSqft = oneStepArea * count;

    const landingL = toFeet(landingLenFt, landingLenIn);
    const landingW = toFeet(landingWidFt, landingWidIn);
    const landingSqft = landingL * landingW;

    return { stairSqft, landingSqft, totalSqft: stairSqft + landingSqft, sqyd: (stairSqft + landingSqft) / 9 };
  }, [landingLenFt, landingLenIn, landingWidFt, landingWidIn, riseIn, runIn, stairWidthFt, stairWidthIn, stairsCount]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>How Much Carpet Will You Need?</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Length (feet)</AppText><AppTextInput value={lengthFt} onChangeText={setLengthFt} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Length (inches)</AppText><AppTextInput value={lengthIn} onChangeText={setLengthIn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Width (feet)</AppText><AppTextInput value={widthFt} onChangeText={setWidthFt} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Width (inches)</AppText><AppTextInput value={widthIn} onChangeText={setWidthIn} keyboardType="numeric" style={styles.input} /></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Square yards</AppText><AppText style={styles.levelValue}>{F(room.sqyd, 1)}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Square feet</AppText><AppText style={styles.levelValue}>{F(room.sqft, 1)}</AppText></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>How to Measure Stairs for Carpet</AppText>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Rise per stair (inches)</AppText><AppTextInput value={riseIn} onChangeText={setRiseIn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Run per stair (inches)</AppText><AppTextInput value={runIn} onChangeText={setRunIn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Number of stairs</AppText><AppTextInput value={stairsCount} onChangeText={setStairsCount} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Stair width (feet)</AppText><AppTextInput value={stairWidthFt} onChangeText={setStairWidthFt} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Stair width (inches)</AppText><AppTextInput value={stairWidthIn} onChangeText={setStairWidthIn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Landing length (feet)</AppText><AppTextInput value={landingLenFt} onChangeText={setLandingLenFt} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Landing length (inches)</AppText><AppTextInput value={landingLenIn} onChangeText={setLandingLenIn} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Landing width (feet)</AppText><AppTextInput value={landingWidFt} onChangeText={setLandingWidFt} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Landing width (inches)</AppText><AppTextInput value={landingWidIn} onChangeText={setLandingWidIn} keyboardType="numeric" style={styles.input} /></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Stairs sqft</AppText><AppText style={styles.levelValue}>{F(stairs.stairSqft, 1)}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Landing sqft</AppText><AppText style={styles.levelValue}>{F(stairs.landingSqft, 1)}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Total stairs+landing sqft</AppText><AppText style={styles.levelValue}>{F(stairs.totalSqft, 1)}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Square yards</AppText><AppText style={styles.levelValue}>{F(stairs.sqyd, 1)}</AppText></View>
            </View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function K401RetirementTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {
  const [taxYear, setTaxYear] = useState('2026');
  const [salary, setSalary] = useState('100000');
  const [contribPct, setContribPct] = useState('10');
  const [salaryRise, setSalaryRise] = useState('3');
  const [age, setAge] = useState('35');
  const [retAge, setRetAge] = useState('65');
  const [retRate, setRetRate] = useState('7');
  const [balance, setBalance] = useState('0');
  const [matchPct, setMatchPct] = useState('50');
  const [matchLimitPct, setMatchLimitPct] = useState('6');

  const out = useMemo(() => {
    const y0 = Math.max(0, N(age));
    const yR = Math.max(y0 + 1, N(retAge));
    const years = Math.max(1, Math.floor(yR - y0));
    const s0 = Math.max(0, N(salary));
    const cPct = Math.max(0, N(contribPct)) / 100;
    const sRise = Math.max(0, N(salaryRise)) / 100;
    const r = Math.max(0, N(retRate)) / 100;
    const mPct = Math.max(0, N(matchPct)) / 100;
    const mLim = Math.max(0, N(matchLimitPct)) / 100;

    let bal = Math.max(0, N(balance));
    let sal = s0;
    let empTotal = 0;
    let erTotal = 0;
    const points = [{ x: 0, y: bal }];

    const lim = TAX_LIMITS[taxYear];

    for (let i = 0; i < years; i += 1) {
      const currentAge = y0 + i;
      let maxEmp = lim.base;
      if (currentAge >= 60 && currentAge <= 63) maxEmp += lim.catch60to63;
      else if (currentAge >= 50) maxEmp += lim.catch50;

      const plannedEmp = sal * cPct;
      const emp = Math.min(maxEmp, plannedEmp);
      const matchBase = Math.min(emp, sal * mLim);
      const er = matchBase * mPct;

      empTotal += emp;
      erTotal += er;

      bal = (bal + emp + er) * (1 + r);
      points.push({ x: i + 1, y: bal });
      sal *= (1 + sRise);
    }

    const totalContrib = empTotal + erTotal;
    const growth = Math.max(0, bal - (Math.max(0, N(balance)) + totalContrib));
    return { years, points, finalBal: bal, empTotal, erTotal, totalContrib, growth, yMax: Math.max(bal, 1) };
  }, [age, balance, contribPct, matchLimitPct, matchPct, retAge, retRate, salary, salaryRise, taxYear]);

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>401(k) Retirement Calculator</AppText>
            <View style={styles.btnRow}>
              <Pressable style={taxYear === '2026' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setTaxYear('2026')}><AppText style={taxYear === '2026' ? styles.primaryBtnText : styles.ghostBtnText}>Tax Year 2026</AppText></Pressable>
              <Pressable style={taxYear === '2025' ? styles.primaryBtn : styles.ghostBtn} onPress={() => setTaxYear('2025')}><AppText style={taxYear === '2025' ? styles.primaryBtnText : styles.ghostBtnText}>Tax Year 2025</AppText></Pressable>
            </View>
            <View style={styles.grid}>
              <View style={styles.field}><AppText style={styles.label}>Annual salary ($)</AppText><AppTextInput value={salary} onChangeText={setSalary} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Contribution each year (%)</AppText><AppTextInput value={contribPct} onChangeText={setContribPct} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Annual salary rise (%)</AppText><AppTextInput value={salaryRise} onChangeText={setSalaryRise} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Current age</AppText><AppTextInput value={age} onChangeText={setAge} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Retirement age</AppText><AppTextInput value={retAge} onChangeText={setRetAge} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Expected return (%)</AppText><AppTextInput value={retRate} onChangeText={setRetRate} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Current 401(k) balance ($)</AppText><AppTextInput value={balance} onChangeText={setBalance} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.field}><AppText style={styles.label}>Employer match (%)</AppText><AppTextInput value={matchPct} onChangeText={setMatchPct} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.fieldFull}><AppText style={styles.label}>Salary limit for employer match (%)</AppText><AppTextInput value={matchLimitPct} onChangeText={setMatchLimitPct} keyboardType="numeric" style={styles.input} /></View>
            </View>
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Results</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Final balance</AppText><AppText style={styles.levelValue}>{`$${F(out.finalBal, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelRes]}><AppText style={styles.levelLabel}>Employee contributions</AppText><AppText style={styles.levelValue}>{`$${F(out.empTotal, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Employer contributions</AppText><AppText style={styles.levelValue}>{`$${F(out.erTotal, 0)}`}</AppText></View>
            </View>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Total contributions</AppText><AppText style={styles.levelValue}>{`$${F(out.totalContrib, 0)}`}</AppText></View>
              <View style={[styles.levelBox, styles.levelSup]}><AppText style={styles.levelLabel}>Growth earned</AppText><AppText style={styles.levelValue}>{`$${F(out.growth, 0)}`}</AppText></View>
            </View>
            <Chart
              series={out.points}
              xMax={out.years}
              yMax={out.yMax}
              styles={styles}
              themeColors={themeColors}
              color="#17a9ff"
              xLabel="X axis: Years to retirement"
              yLabel="Y axis: 401(k) balance ($)"
              xTickLabel={(v) => `${Math.round(v)}`}
              yTickLabel={(v) => `$${shortMoney(v)}`}
            />
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}

export function FinancialFreedomTool({ navigation, calculator, styles, themeColors, PageHeader, FooterCTAContact, openSite }) {

  const starter = { goals: 5, budget: 5, debt: 4, invest: 5, income: 4, automation: 4, protection: 3, bigbuy: 3, learn: 5 };
  const [vals, setVals] = useState(starter);

  const setPreset = (preset) => {
    if (preset === 'starter') setVals(starter);
    if (preset === 'starting') setVals({ goals: 4, budget: 4, debt: 3, invest: 3, income: 3, automation: 3, protection: 3, bigbuy: 2, learn: 4 });
    if (preset === 'advanced') setVals({ goals: 8, budget: 8, debt: 8, invest: 8, income: 7, automation: 8, protection: 7, bigbuy: 7, learn: 8 });
    if (preset === 'reset') setVals({ goals: 0, budget: 0, debt: 0, invest: 0, income: 0, automation: 0, protection: 0, bigbuy: 0, learn: 0 });
  };

  const score = useMemo(() => {
    const totalW = FIRE_STEPS.reduce((a, s) => a + s.w, 0);
    const weighted = FIRE_STEPS.reduce((a, s) => a + ((Math.max(0, Math.min(10, N(vals[s.key])))) * s.w), 0);
    const overall = totalW > 0 ? (weighted / (10 * totalW)) * 100 : 0;

    const groupMap = { Essentials: { v: 0, w: 0 }, Growth: { v: 0, w: 0 }, Discipline: { v: 0, w: 0 } };
    FIRE_STEPS.forEach((s) => {
      groupMap[s.group].v += Math.max(0, Math.min(10, N(vals[s.key]))) * s.w;
      groupMap[s.group].w += 10 * s.w;
    });
    const gp = {
      Essentials: groupMap.Essentials.w > 0 ? (groupMap.Essentials.v / groupMap.Essentials.w) * 100 : 0,
      Growth: groupMap.Growth.w > 0 ? (groupMap.Growth.v / groupMap.Growth.w) * 100 : 0,
      Discipline: groupMap.Discipline.w > 0 ? (groupMap.Discipline.v / groupMap.Discipline.w) * 100 : 0,
    };
    return { overall, gp };
  }, [vals]);

  const barW = Math.min(Dimensions.get('window').width - 84, 330);
  const barH = 190;
  const l = 72; const rr = 10; const t = 10; const b = 18;
  const pw = barW - l - rr; const ph = barH - t - b;
  const rowH = ph / FIRE_STEPS.length;
  const X = (v) => l + (Math.max(0, Math.min(10, v)) / 10) * pw;

  return (
    <>
      <PageHeader navigation={navigation} styles={styles} themeColors={themeColors} title={calculator.title} subtitle={calculator.description} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>9-Step Scorecard</AppText>
          <View style={styles.btnRow}>
            <Pressable style={styles.ghostBtn} onPress={() => setPreset('starter')}><AppText style={styles.ghostBtnText}>Starter preset</AppText></Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => setPreset('starting')}><AppText style={styles.ghostBtnText}>Starting preset</AppText></Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => setPreset('advanced')}><AppText style={styles.ghostBtnText}>Advanced preset</AppText></Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => setPreset('reset')}><AppText style={styles.ghostBtnText}>Reset</AppText></Pressable>
          </View>
        </View>

        <View style={styles.twoColRow}>
          <View style={[styles.card, styles.colCard]}>
            {FIRE_STEPS.map((s) => (
              <View key={`fire-${s.key}`} style={styles.subCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText style={styles.label}>{s.label}</AppText>
                  <AppText style={styles.tipText}>{`${Math.max(0, Math.min(10, N(vals[s.key])))}/10`}</AppText>
                </View>
                <View style={styles.resultRow}>
                  <Pressable style={styles.ghostBtn} onPress={() => setVals((p) => ({ ...p, [s.key]: Math.max(0, Math.min(10, N(p[s.key]) - 1)) }))}><AppText style={styles.ghostBtnText}>-</AppText></Pressable>
                  <View style={[styles.levelBox, styles.levelPivot, { flex: 1 }]}><AppTextInput value={String(vals[s.key])} onChangeText={(v) => setVals((p) => ({ ...p, [s.key]: Math.max(0, Math.min(10, N(v))) }))} keyboardType="numeric" style={styles.input} /></View>
                  <Pressable style={styles.ghostBtn} onPress={() => setVals((p) => ({ ...p, [s.key]: Math.max(0, Math.min(10, N(p[s.key]) + 1)) }))}><AppText style={styles.ghostBtnText}>+</AppText></Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.card, styles.colCard]}>
            <AppText style={styles.sectionTitle}>Score & Insights</AppText>
            <View style={styles.resultRow}>
              <View style={[styles.levelBox, styles.levelPivot]}><AppText style={styles.levelLabel}>Overall score (weighted)</AppText><AppText style={styles.bigMetric}>{F(score.overall, 0)}</AppText></View>
            </View>
            <View style={styles.subCard}>
              <AppText style={styles.label}>Progress distribution</AppText>
              {['Essentials', 'Growth', 'Discipline'].map((g) => (
                <View key={`grp-${g}`} style={{ marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><AppText style={styles.tipText}>{g}</AppText><AppText style={styles.tipText}>{`${F(score.gp[g], 0)}%`}</AppText></View>
                  <View style={{ height: 8, borderRadius: 999, backgroundColor: themeColors.surfaceGlass, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.max(2, score.gp[g])}%`, height: '100%', backgroundColor: '#22a6f2' }} />
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.subCard}>
              <AppText style={styles.label}>Step score chart (0-10)</AppText>
              <Svg width={barW} height={barH}>
                {[0, 2, 4, 6, 8, 10].map((v) => <Line key={`g-${v}`} x1={X(v)} y1={t} x2={X(v)} y2={barH - b} stroke={themeColors.border} strokeWidth="1" opacity={0.45} />)}
                {FIRE_STEPS.map((s, i) => {
                  const y = t + (i * rowH) + 2;
                  const hRow = Math.max(8, rowH - 4);
                  return (
                    <React.Fragment key={`bar-${s.key}`}>
                      <SvgText x={l - 6} y={y + hRow / 2 + 3} fill={themeColors.textMuted} fontSize="8" textAnchor="end">{s.label.split(' ')[0]}</SvgText>
                      <Rect x={l} y={y} width={Math.max(2, X(vals[s.key]) - l)} height={hRow} fill="#1ea7ff" opacity={0.9} rx="2" />
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>
          </View>
        </View>

        <FooterCTAContact styles={styles} openSite={openSite} />
      </ScrollView>
    </>
  );
}








