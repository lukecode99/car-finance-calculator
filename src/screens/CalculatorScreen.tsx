import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, font } from '../theme';
import { CarInputs, DEFAULT_INPUTS, DEPRECIATION_PRESETS, DepreciationPreset, SavedComparison } from '../types';
import { calcAll } from '../engine/financeEngine';
import { InputField, TextInputField } from '../components/InputField';

function fmt(n: number, dec = 0) { return n.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
function gbp(n: number) { return `£${fmt(Math.abs(n))}`; }
function pence(n: number) { return `£${fmt(n, 2)}`; }

const TERMS = ['1', '2', '3', '4', '5'];
const DEP_PRESETS: DepreciationPreset[] = ['high', 'medium', 'low', 'custom'];

interface Props { onSaved: () => void; }

export function CalculatorScreen({ onSaved }: Props) {
  const [inputs, setInputs] = useState<CarInputs>(DEFAULT_INPUTS);
  const [showYearly, setShowYearly] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(k: keyof CarInputs) { return (v: string) => setInputs(p => ({ ...p, [k]: v })); }

  const results = useMemo(() => {
    if (!inputs.carPrice || parseFloat(inputs.carPrice) <= 0) return [];
    return calcAll(inputs);
  }, [inputs]);

  const cheapest = results.length > 0 ? results.reduce((a, b) => a.grandTotal < b.grandTotal ? a : b) : null;

  async function saveComparison() {
    if (results.length === 0) return;
    setSaving(true);
    try {
      const existing = JSON.parse(await AsyncStorage.getItem('saved_comparisons') || '[]') as SavedComparison[];
      const entry: SavedComparison = {
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
        carName: inputs.carName || 'Unnamed Car',
        carPrice: parseFloat(inputs.carPrice),
        termYears: parseInt(inputs.termYears),
        results,
      };
      existing.unshift(entry);
      await AsyncStorage.setItem('saved_comparisons', JSON.stringify(existing.slice(0, 20)));
      Alert.alert('Saved', 'Comparison saved successfully.');
      onSaved();
    } catch {
      Alert.alert('Error', 'Could not save comparison.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        <Text style={s.title}>Car Finance Calculator</Text>
        <Text style={s.subtitle}>Compare PCP · HP · Contract Hire</Text>

        {/* Car Details */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Car Details</Text>
          <TextInputField label="Car Name / Model" value={inputs.carName} onChangeText={set('carName')} placeholder="e.g. Audi A4 1.4 TDI" />
          <InputField label="Purchase Price (OTR)" value={inputs.carPrice} onChangeText={set('carPrice')} prefix="£" placeholder="26918" />
        </View>

        {/* Term */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Finance Term</Text>
          <View style={s.pills}>
            {TERMS.map(t => (
              <TouchableOpacity key={t} style={[s.pill, inputs.termYears === t && s.pillActive]} onPress={() => setInputs(p => ({ ...p, termYears: t }))}>
                <Text style={[s.pillText, inputs.termYears === t && s.pillTextActive]}>{t} yr{t !== '1' ? 's' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Depreciation */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Depreciation</Text>
          {DEP_PRESETS.map(p => {
            const info = DEPRECIATION_PRESETS[p];
            return (
              <TouchableOpacity key={p} style={[s.depRow, inputs.depreciationPreset === p && s.depRowActive]} onPress={() => setInputs(prev => ({ ...prev, depreciationPreset: p }))}>
                <View style={[s.radio, inputs.depreciationPreset === p && s.radioActive]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.depLabel, inputs.depreciationPreset === p && s.depLabelActive]}>
                    {info.label}{p !== 'custom' ? ` — Yr1: ${info.y1}%, then ${info.pa}%/yr` : ''}
                  </Text>
                  <Text style={s.depDesc}>{info.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {inputs.depreciationPreset === 'custom' && (
            <View style={{ marginTop: spacing.sm }}>
              <InputField label="Year 1 depreciation" value={inputs.customDepreciationY1} onChangeText={set('customDepreciationY1')} suffix="%" />
              <InputField label="Year 2+ per year" value={inputs.customDepreciationPA} onChangeText={set('customDepreciationPA')} suffix="%" />
            </View>
          )}
        </View>

        {/* PCP Finance */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={[s.typeDot, { backgroundColor: colors.pcp }]} />
            <Text style={s.sectionTitle}>PCP (Personal Contract Purchase)</Text>
          </View>
          <InputField label="Deposit" value={inputs.deposit} onChangeText={set('deposit')} prefix="£" />
          <InputField label="APR" value={inputs.apr} onChangeText={set('apr')} suffix="%" hint="Representative APR from dealer/lender" />
          <InputField label="Balloon Payment (GMFV)" value={inputs.balloon} onChangeText={set('balloon')} prefix="£" hint="Guaranteed minimum future value at end of term" />
        </View>

        {/* HP Finance */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={[s.typeDot, { backgroundColor: colors.hp }]} />
            <Text style={s.sectionTitle}>HP (Hire Purchase)</Text>
          </View>
          <Text style={s.cardNote}>Uses same deposit &amp; APR as PCP above. No balloon — you own the car at end.</Text>
        </View>

        {/* PCH / Contract Hire */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={[s.typeDot, { backgroundColor: colors.pch }]} />
            <Text style={s.sectionTitle}>Contract Hire (PCH)</Text>
          </View>
          <InputField label="Initial Rental (deposit)" value={inputs.pchDeposit} onChangeText={set('pchDeposit')} prefix="£" hint="Typically 3–9 months upfront" />
          <InputField label="Monthly Payment" value={inputs.pchMonthly} onChangeText={set('pchMonthly')} prefix="£" hint="Monthly inc. VAT (you can reclaim 50% if business use)" />
        </View>

        {/* Running Costs */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Annual Running Costs</Text>
          <InputField label="Annual Mileage" value={inputs.annualMileage} onChangeText={set('annualMileage')} suffix="mi" />
          <InputField label="Insurance (annual)" value={inputs.insurance} onChangeText={set('insurance')} prefix="£" />
          <InputField label="Road Tax (annual)" value={inputs.roadTax} onChangeText={set('roadTax')} prefix="£" />
          <InputField label="Servicing & Maintenance (annual)" value={inputs.maintenance} onChangeText={set('maintenance')} prefix="£" />
          <InputField label="Tyres (annual allowance)" value={inputs.tyresPerYear} onChangeText={set('tyresPerYear')} prefix="£" />
          <InputField label="Selling Cost (PCP/HP only)" value={inputs.sellingCost} onChangeText={set('sellingCost')} prefix="£" hint="Dealer/broker commission when you sell at end of term" />
        </View>

        {/* Results */}
        {results.length > 0 && (
          <View style={s.results}>
            <View style={s.resultsHeader}>
              <Text style={s.resultsTitle}>Results — {inputs.termYears} year{inputs.termYears !== '1' ? 's' : ''}</Text>
              <TouchableOpacity style={s.saveBtn} onPress={saveComparison} disabled={saving}>
                <Text style={s.saveBtnText}>{saving ? 'Saving…' : '💾 Save'}</Text>
              </TouchableOpacity>
            </View>

            {cheapest && (
              <View style={s.winnerBanner}>
                <Text style={s.winnerText}>Cheapest overall: <Text style={{ color: cheapest.color, fontWeight: '700' }}>{cheapest.label}</Text> — saves {gbp(results.filter(r => r.type !== cheapest.type).reduce((a, b) => Math.min(a, b.grandTotal), Infinity) - cheapest.grandTotal)} vs next option</Text>
              </View>
            )}

            {results.map(r => (
              <View key={r.type} style={[s.resultCard, { borderLeftColor: r.color }]}>
                <View style={s.resultHeader}>
                  <Text style={[s.resultType, { color: r.color }]}>{r.label}</Text>
                  <Text style={s.resultTotal}>{gbp(r.grandTotal)}<Text style={s.resultTotalLabel}> total</Text></Text>
                </View>

                <View style={s.resultGrid}>
                  <ResultCell label="Monthly payment" value={gbp(r.monthlyPayment)} />
                  <ResultCell label="All-in per month" value={gbp(r.costPerMonth)} highlight />
                  <ResultCell label="Cost per mile" value={pence(r.costPerMile)} />
                  <ResultCell label="Finance cost" value={gbp(r.totalFinanceCost)} />
                  {r.type !== 'pch' && <ResultCell label="Depreciation" value={gbp(r.totalDepreciation)} />}
                  <ResultCell label="Running costs" value={gbp(r.totalRunningCosts)} />
                  {r.sellingCost > 0 && <ResultCell label="Selling cost" value={gbp(r.sellingCost)} />}
                </View>

                <TouchableOpacity style={s.yearlyToggle} onPress={() => setShowYearly(showYearly === r.type ? null : r.type)}>
                  <Text style={s.yearlyToggleText}>Year-by-year breakdown {showYearly === r.type ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showYearly === r.type && (
                  <View style={s.yearlyTable}>
                    <View style={s.yearlyHeader}>
                      <Text style={[s.yearlyCell, s.yearlyHeadText, { flex: 0.5 }]}>Yr</Text>
                      {r.type !== 'pch' && <Text style={[s.yearlyCell, s.yearlyHeadText]}>Value</Text>}
                      <Text style={[s.yearlyCell, s.yearlyHeadText]}>Finance</Text>
                      <Text style={[s.yearlyCell, s.yearlyHeadText]}>Running</Text>
                      <Text style={[s.yearlyCell, s.yearlyHeadText]}>Cumulative</Text>
                    </View>
                    {r.yearlyBreakdown.map(y => (
                      <View key={y.year} style={s.yearlyRow}>
                        <Text style={[s.yearlyCell, { flex: 0.5 }]}>{y.year}</Text>
                        {r.type !== 'pch' && <Text style={s.yearlyCell}>{gbp(y.carValue)}</Text>}
                        <Text style={s.yearlyCell}>{gbp(y.financePayments)}</Text>
                        <Text style={s.yearlyCell}>{gbp(y.runningCosts)}</Text>
                        <Text style={[s.yearlyCell, { color: colors.primary }]}>{gbp(y.cumulativeTotal)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={s.cell}>
      <Text style={s.cellLabel}>{label}</Text>
      <Text style={[s.cellValue, highlight && s.cellHighlight]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  title: { color: colors.text, fontSize: font.sizes.xl, fontWeight: '700', marginBottom: 2 },
  subtitle: { color: colors.textSecondary, fontSize: font.sizes.sm, marginBottom: spacing.md },

  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  typeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8, marginTop: 1 },
  sectionTitle: { color: colors.text, fontSize: font.sizes.md, fontWeight: '700', marginBottom: spacing.sm },
  cardNote: { color: colors.textMuted, fontSize: font.sizes.sm, fontStyle: 'italic' },

  pills: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
  pillActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  pillText: { color: colors.textSecondary, fontSize: font.sizes.sm, fontWeight: '600' },
  pillTextActive: { color: colors.primary },

  depRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, paddingHorizontal: 8, borderRadius: radius.sm, marginBottom: 4 },
  depRowActive: { backgroundColor: colors.primaryMuted },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.border, marginRight: 10, marginTop: 2 },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  depLabel: { color: colors.textSecondary, fontSize: font.sizes.sm, fontWeight: '600' },
  depLabelActive: { color: colors.primary },
  depDesc: { color: colors.textMuted, fontSize: font.sizes.xs, marginTop: 1 },

  results: { marginTop: spacing.xs },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  resultsTitle: { color: colors.text, fontSize: font.sizes.lg, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  saveBtnText: { color: colors.primary, fontSize: font.sizes.sm, fontWeight: '600' },

  winnerBanner: { backgroundColor: colors.primaryMuted, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.primary },
  winnerText: { color: colors.text, fontSize: font.sizes.sm },

  resultCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 4, borderWidth: 1, borderColor: colors.border },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm },
  resultType: { fontSize: font.sizes.lg, fontWeight: '700' },
  resultTotal: { color: colors.text, fontSize: font.sizes.xl, fontWeight: '700' },
  resultTotalLabel: { color: colors.textSecondary, fontSize: font.sizes.sm, fontWeight: '400' },

  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  cell: { width: '48%', backgroundColor: colors.surface2, borderRadius: radius.sm, padding: spacing.sm },
  cellLabel: { color: colors.textMuted, fontSize: font.sizes.xs, marginBottom: 2 },
  cellValue: { color: colors.text, fontSize: font.sizes.sm, fontWeight: '600' },
  cellHighlight: { color: colors.primary, fontSize: font.sizes.md },

  yearlyToggle: { paddingVertical: 6 },
  yearlyToggleText: { color: colors.textSecondary, fontSize: font.sizes.sm },
  yearlyTable: { marginTop: spacing.xs },
  yearlyHeader: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.sm, padding: spacing.xs, marginBottom: 2 },
  yearlyHeadText: { color: colors.textMuted, fontWeight: '700' },
  yearlyRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.border },
  yearlyCell: { flex: 1, color: colors.textSecondary, fontSize: font.sizes.xs, textAlign: 'right', paddingRight: 4 },
});
