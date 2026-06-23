import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, font } from '../theme';

interface Section { title: string; color: string; paras: string[]; bullets?: string[]; }

const SECTIONS: Section[] = [
  {
    title: 'PCP — Personal Contract Purchase',
    color: '#4FC3F7',
    paras: [
      'You finance a portion of the car\'s value — the difference between the purchase price and the Balloon Payment (GMFV). Monthly payments are lower because you\'re not paying off the whole car.',
      'At the end of the term you have three options: pay the balloon to keep it, hand it back with nothing more to pay (if under mileage), or use any equity as a deposit on your next PCP.',
    ],
    bullets: [
      'Lower monthly payments than HP',
      'You don\'t own it until the balloon is paid',
      'Mileage limits apply — excess charged per mile at end of term',
      'Best if you like changing car every 2–4 years',
    ],
  },
  {
    title: 'HP — Hire Purchase',
    color: '#CE93D8',
    paras: [
      'You finance the full purchase price (minus deposit) and own the car outright when the final payment is made. Monthly payments are higher than PCP because you\'re paying off everything.',
      'No mileage limits, no balloon, no surprises at the end. Great if you plan to keep the car long-term.',
    ],
    bullets: [
      'Higher monthly payments than PCP',
      'You own it at the end — no balloon needed',
      'No mileage restrictions',
      'Best for long-term owners or high-mileage drivers',
    ],
  },
  {
    title: 'Lease / Contract Hire (PCH)',
    color: '#FFB74D',
    paras: [
      'You rent the car for a fixed period and return it at the end. You never own it. Typically the cheapest monthly option because you\'re only paying for depreciation during your term.',
      'Maintenance packages can often be added. VAT-registered businesses can reclaim 50% of VAT on cars used partly for business.',
    ],
    bullets: [
      'Often the lowest monthly cost',
      'No depreciation risk — return and walk away',
      'Strict mileage limits and condition checks on return — excess charged per mile',
      'No ownership — nothing to sell',
    ],
  },
  {
    title: 'Bank Loan',
    color: '#69F0AE',
    paras: [
      'You borrow a fixed sum from your bank (or another lender) and buy the car outright. The loan is unsecured — the lender has no claim on the car if you can\'t pay, unlike HP or PCP where the finance company owns the car during the term.',
      'Interest rates on personal loans can be competitive, especially for good credit scores. The car is yours from day one with zero mileage restrictions.',
    ],
    bullets: [
      'You own the car immediately — sell it whenever you like',
      'No mileage limits or condition penalties',
      'Can\'t hand the car back if circumstances change (unlike PCH)',
      'Loan amount = car price minus any cash deposit you put in',
      'Compare the total interest cost carefully against PCP — PCP looks cheaper monthly but the balloon obscures the true cost',
    ],
  },
  {
    title: 'Salary Sacrifice',
    color: '#F48FB1',
    paras: [
      'Your employer leases a car and you give up a portion of your gross salary to cover the cost. Because the sacrifice comes out of pre-tax pay, you save Income Tax and National Insurance on the sacrificed amount — significantly reducing your true monthly outlay.',
      'The Benefit in Kind (BIK) tax is the catch: HMRC charges you tax on the P11D value of the car at a rate based on its CO₂ emissions. Electric and low-emission vehicles attract very low BIK rates (3% for EVs in 2025/26), making salary sacrifice most attractive for those cars.',
    ],
    bullets: [
      'BIK rate 2025/26: 3% for EVs, 15–37% for petrol/diesel',
      'Tax saving: Income Tax + NI on sacrificed amount (8% NI for basic rate, 2% for higher)',
      'Monthly BIK tax = P11D × BIK% × your tax rate ÷ 12',
      'True monthly cost = gross sacrifice × (1 − tax − NI) + monthly BIK tax',
      'Most beneficial for EVs at higher tax rates (40%+ taxpayers save most)',
      'Insurance may or may not be included — check your employer\'s scheme',
      'You don\'t own the car — it returns to the leasing company at the end',
    ],
  },
  {
    title: 'Depreciation Explained',
    color: '#BAFF29',
    paras: [
      'Depreciation is the largest hidden cost of car ownership — often bigger than the finance interest. A new car typically loses 15–35% of its value in the first year alone.',
      'The presets in this app are based on UK market data. German premium brands (Audi, BMW, Mercedes) depreciate fastest in cash terms. Japanese brands (Toyota, Honda) and popular models (VW Golf, Mini) hold value much better.',
    ],
    bullets: [
      'High (32% yr1, 16%/yr): Audi, BMW, Mercedes',
      'Medium (22% yr1, 12%/yr): Ford, Vauxhall, Kia',
      'Low (14% yr1, 8%/yr): Toyota, VW Golf, Mini',
      'Contract Hire / Salary Sacrifice: you bear zero depreciation risk',
    ],
  },
  {
    title: 'What This Calculator Shows',
    color: colors.textSecondary,
    paras: [
      'The "Grand Total" is what you truly spend — finance cost (interest, deposits), depreciation of the asset, running costs (insurance, tax, servicing, tyres), selling costs, and any excess mileage charges.',
      '"All-in per month" divides the grand total by the number of months, giving a true apples-to-apples comparison across all options.',
      'For Salary Sacrifice, the grand total shows your after-tax net cost including the BIK tax charge — this is what it actually costs you from take-home pay.',
      'Contract Hire and Salary Sacrifice totals show actual cash out. PCP/HP/Loan totals show your net loss (they don\'t include the car\'s residual value, because that value only materialises when you sell).',
    ],
  },
];

export function HelpScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>Finance Guide</Text>
        <Text style={s.intro}>Understanding PCP, HP, Lease / Contract Hire, Bank Loan and Salary Sacrifice — and which one wins for you.</Text>

        {SECTIONS.map(sec => (
          <View key={sec.title} style={s.section}>
            <View style={[s.accent, { backgroundColor: sec.color }]} />
            <Text style={[s.sectionTitle, { color: sec.color }]}>{sec.title}</Text>
            {sec.paras.map((p, i) => <Text key={i} style={s.para}>{p}</Text>)}
            {sec.bullets && (
              <View style={s.bullets}>
                {sec.bullets.map((b, i) => (
                  <View key={i} style={s.bulletRow}>
                    <Text style={[s.bulletDot, { color: sec.color }]}>•</Text>
                    <Text style={s.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  pageTitle: { color: colors.text, fontSize: font.sizes.xl, fontWeight: '700', marginBottom: 4 },
  intro: { color: colors.textSecondary, fontSize: font.sizes.sm, marginBottom: spacing.lg },
  section: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  accent: { height: 3, borderRadius: 2, marginBottom: spacing.sm, width: 40 },
  sectionTitle: { fontSize: font.sizes.md, fontWeight: '700', marginBottom: spacing.sm },
  para: { color: colors.textSecondary, fontSize: font.sizes.sm, lineHeight: 20, marginBottom: spacing.sm },
  bullets: { marginTop: 2 },
  bulletRow: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { fontWeight: '700', marginRight: 6, fontSize: font.sizes.sm },
  bulletText: { color: colors.textSecondary, fontSize: font.sizes.sm, flex: 1 },
});
