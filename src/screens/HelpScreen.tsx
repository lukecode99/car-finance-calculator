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
      'Mileage limits apply (excess charged per mile)',
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
    title: 'Contract Hire (PCH)',
    color: '#FFB74D',
    paras: [
      'You rent the car for a fixed period and return it at the end. You never own it. Typically the cheapest monthly option because you\'re only paying for depreciation during your term.',
      'Maintenance packages can often be added. VAT-registered businesses can reclaim 50% of VAT on cars used partly for business.',
    ],
    bullets: [
      'Often the lowest monthly cost',
      'No depreciation risk — return and walk away',
      'Strict mileage limits and condition checks on return',
      'No ownership — nothing to sell',
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
      'Contract Hire: you bear zero depreciation risk',
    ],
  },
  {
    title: 'What This Calculator Shows',
    color: colors.textSecondary,
    paras: [
      'The "Grand Total" is what you truly spend — finance cost (interest, deposit, balloon), depreciation of the asset, running costs (insurance, tax, servicing, tyres), and selling costs.',
      '"All-in per month" divides the grand total by the number of months, giving a true apples-to-apples comparison across all three options.',
      'Contract Hire totals show your actual cash out. PCP/HP totals show your net loss — they don\'t include the car\'s residual value, because that value only materialises when you sell.',
    ],
  },
];

export function HelpScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.pageTitle}>Finance Guide</Text>
        <Text style={s.intro}>Understanding PCP, HP and Contract Hire — and which one wins for you.</Text>

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
