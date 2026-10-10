import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors, spacing, radius, font } from '../theme';
import { SavedComparison, FinanceResult, CarInputs, DEPRECIATION_PRESETS } from '../types';
import { CarLogo } from '../components/CarLogo';

function gbp(n: number) { return `£${Math.round(Math.abs(n)).toLocaleString('en-GB')}`; }
function gbpFull(n: number | string) {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (!v || isNaN(v)) return '—';
  return `£${Math.round(Math.abs(v)).toLocaleString('en-GB')}`;
}
function pct(n: string) { return n ? `${n}%` : '—'; }
function mi(n: string) { return n ? `${parseInt(n).toLocaleString('en-GB')} mi` : '—'; }
function dateFmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function inc(val: boolean) { return val ? '✓ Included' : 'Not included'; }

function buildShareHtml(item: SavedComparison): string {
  const inp = item.inputs;
  const cheapest = item.results.reduce<FinanceResult | null>((a, b) => !a || b.grandTotal < a.grandTotal ? b : a, null);
  const mileage = parseInt(inp?.annualMileage || '10000').toLocaleString('en-GB');
  const depPreset = inp ? DEPRECIATION_PRESETS[inp.depreciationPreset] : null;

  const resultRows = item.results.map(r => {
    const isWinner = cheapest?.type === r.type;
    const cls = isWinner ? ' class="winner"' : '';
    const badge = isWinner ? '<span class="badge-best">Best</span>' : '';
    const depCell = (r.type !== 'pch' && r.type !== 'salary')
      ? `<td>${gbp(r.totalDepreciation)}</td>` : `<td>—</td>`;
    const excess = (r.excessMileageCost ?? 0) > 0 ? `<br><small>+${gbp(r.excessMileageCost!)} excess mileage</small>` : '';
    return `<tr${cls}>
      <td><strong>${r.label}</strong>${badge}${r.provider ? `<br><small style="color:#666">${r.provider}</small>` : ''}</td>
      <td>${gbp(r.monthlyPayment)}</td>
      <td><strong>${gbp(r.costPerMonth)}</strong></td>
      <td>${gbp(r.totalFinanceCost)}</td>
      ${depCell}
      <td>${gbp(r.totalRunningCosts)}${excess}</td>
      <td><strong>${gbp(r.grandTotal)}</strong></td>
    </tr>`;
  }).join('\n');

  const pcpSection = (inp?.enablePcp) ? `
    <div class="section-title">PCP — Personal Contract Purchase</div>
    <div class="grid">
      <div class="kv"><div class="kv-label">Deposit</div><div class="kv-value">${gbpFull(inp.pcpDeposit)}</div></div>
      <div class="kv"><div class="kv-label">APR</div><div class="kv-value">${pct(inp.pcpApr)}</div></div>
      <div class="kv"><div class="kv-label">Balloon (GMFV)</div><div class="kv-value">${gbpFull(inp.balloon)}</div></div>
      <div class="kv"><div class="kv-label">Mileage allowance</div><div class="kv-value">${mi(inp.pcpMileageIncluded)}/yr</div></div>
      <div class="kv"><div class="kv-label">Excess mileage rate</div><div class="kv-value">${inp.pcpExcessPpm || '—'}p/mi</div></div>
      <div class="kv"><div class="kv-label">Insurance</div><div class="kv-value">${inc(inp.pcpInsuranceIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Road tax</div><div class="kv-value">${inc(inp.pcpRoadTaxIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Service &amp; maintenance</div><div class="kv-value">${inc(inp.pcpServiceIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Tyres</div><div class="kv-value">${inc(inp.pcpTyresIncluded)}</div></div>
      ${inp.pcpProvider ? `<div class="kv"><div class="kv-label">Provider</div><div class="kv-value">${inp.pcpProvider}</div></div>` : ''}
    </div>` : '';

  const hpSection = (inp?.enableHp) ? `
    <div class="section-title">HP — Hire Purchase</div>
    <div class="grid">
      <div class="kv"><div class="kv-label">Deposit</div><div class="kv-value">${gbpFull(inp.hpDeposit)}</div></div>
      <div class="kv"><div class="kv-label">APR</div><div class="kv-value">${pct(inp.hpApr)}</div></div>
      <div class="kv"><div class="kv-label">Insurance</div><div class="kv-value">${inc(inp.hpInsuranceIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Road tax</div><div class="kv-value">${inc(inp.hpRoadTaxIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Service &amp; maintenance</div><div class="kv-value">${inc(inp.hpServiceIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Tyres</div><div class="kv-value">${inc(inp.hpTyresIncluded)}</div></div>
      ${inp.hpProvider ? `<div class="kv"><div class="kv-label">Provider</div><div class="kv-value">${inp.hpProvider}</div></div>` : ''}
    </div>` : '';

  const pchSection = (inp?.enablePch) ? `
    <div class="section-title">Lease / PCH — Personal Contract Hire</div>
    <div class="grid">
      <div class="kv"><div class="kv-label">Initial rental</div><div class="kv-value">${gbpFull(inp.pchDeposit)}</div></div>
      <div class="kv"><div class="kv-label">Monthly payment</div><div class="kv-value">${gbpFull(inp.pchMonthly)}</div></div>
      <div class="kv"><div class="kv-label">Mileage allowance</div><div class="kv-value">${mi(inp.pchMileageIncluded)}/yr</div></div>
      <div class="kv"><div class="kv-label">Excess mileage rate</div><div class="kv-value">${inp.pchExcessPpm || '—'}p/mi</div></div>
      <div class="kv"><div class="kv-label">Insurance</div><div class="kv-value">${inc(inp.pchInsuranceIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Road tax</div><div class="kv-value">${inc(inp.pchRoadTaxIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Service &amp; maintenance</div><div class="kv-value">${inc(inp.pchServiceIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Tyres</div><div class="kv-value">${inc(inp.pchTyresIncluded)}</div></div>
      ${inp.pchProvider ? `<div class="kv"><div class="kv-label">Provider</div><div class="kv-value">${inp.pchProvider}</div></div>` : ''}
    </div>` : '';

  const loanSection = (inp?.enableLoan) ? `
    <div class="section-title">Bank Loan</div>
    <div class="grid">
      <div class="kv"><div class="kv-label">Loan amount</div><div class="kv-value">${gbpFull(inp.loanAmount)}</div></div>
      <div class="kv"><div class="kv-label">APR</div><div class="kv-value">${pct(inp.loanApr)}</div></div>
      ${inp.loanProvider ? `<div class="kv"><div class="kv-label">Provider</div><div class="kv-value">${inp.loanProvider}</div></div>` : ''}
    </div>` : '';

  const ssSection = (inp?.enableSalary) ? `
    <div class="section-title">Salary Sacrifice</div>
    <div class="grid">
      <div class="kv"><div class="kv-label">Monthly gross sacrifice</div><div class="kv-value">${gbpFull(inp.ssMonthly)}</div></div>
      <div class="kv"><div class="kv-label">Deposit</div><div class="kv-value">${gbpFull(inp.ssDeposit)}</div></div>
      <div class="kv"><div class="kv-label">P11D value</div><div class="kv-value">${gbpFull(inp.ssP11d)}</div></div>
      <div class="kv"><div class="kv-label">CO₂ emissions</div><div class="kv-value">${inp.ssCo2 || '—'} g/km</div></div>
      <div class="kv"><div class="kv-label">Income tax rate</div><div class="kv-value">${inp.ssTaxRate}%</div></div>
      <div class="kv"><div class="kv-label">Insurance</div><div class="kv-value">${inc(inp.ssInsuranceIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Road tax</div><div class="kv-value">${inc(inp.ssRoadTaxIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Service &amp; maintenance</div><div class="kv-value">${inc(inp.ssServiceIncluded)}</div></div>
      <div class="kv"><div class="kv-label">Tyres</div><div class="kv-value">${inc(inp.ssTyresIncluded)}</div></div>
      ${inp.ssProvider ? `<div class="kv"><div class="kv-label">Provider</div><div class="kv-value">${inp.ssProvider}</div></div>` : ''}
    </div>` : '';

  const depSection = depPreset ? `
    <div class="section-title">Depreciation</div>
    <div class="grid">
      <div class="kv"><div class="kv-label">Preset</div><div class="kv-value">${depPreset.label}</div></div>
      <div class="kv"><div class="kv-label">Year 1 drop</div><div class="kv-value">${inp!.depreciationPreset === 'custom' ? inp!.customDepreciationY1 : depPreset.y1}%</div></div>
      <div class="kv"><div class="kv-label">Per annum thereafter</div><div class="kv-value">${inp!.depreciationPreset === 'custom' ? inp!.customDepreciationPA : depPreset.pa}%</div></div>
    </div>` : '';

  const runningSection = inp ? `
    <div class="section-title">Annual Running Costs</div>
    <div class="grid">
      <div class="kv"><div class="kv-label">Insurance</div><div class="kv-value">${gbpFull(inp.insurance)}</div></div>
      <div class="kv"><div class="kv-label">Road tax</div><div class="kv-value">${gbpFull(inp.roadTax)}</div></div>
      <div class="kv"><div class="kv-label">Servicing &amp; maintenance</div><div class="kv-value">${gbpFull(inp.maintenance)}</div></div>
      <div class="kv"><div class="kv-label">Tyres (annual allowance)</div><div class="kv-value">${gbpFull(inp.tyresPerYear)}</div></div>
      ${parseFloat(inp.sellingCost) > 0 ? `<div class="kv"><div class="kv-label">Selling cost</div><div class="kv-value">${gbpFull(inp.sellingCost)}</div></div>` : ''}
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
         font-size: 13px; color: #1a1a1a; background: #fff; padding: 28px 32px; }
  h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 2px; }
  .subtitle { font-size: 12px; color: #777; margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 700; color: #1a1a1a; margin: 20px 0 10px;
                   padding-bottom: 5px; border-bottom: 2px solid #7db800; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 12px; }
  thead th { background: #f7f7f7; padding: 7px 10px; text-align: left; font-size: 11px;
              font-weight: 600; color: #555; border-bottom: 2px solid #ddd; white-space: nowrap; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  .winner { background: #f5ffe0; }
  .winner td { font-weight: 600; }
  .badge-best { display: inline-block; background: #7db800; color: #fff; border-radius: 3px;
                padding: 1px 5px; font-size: 10px; font-weight: 700; margin-left: 5px;
                vertical-align: middle; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 4px; }
  .kv-label { font-size: 11px; color: #777; margin-bottom: 1px; }
  .kv-value { font-size: 12px; font-weight: 600; color: #1a1a1a; }
  small { font-size: 10px; color: #888; font-weight: 400; }
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #eee;
             font-size: 11px; color: #aaa; text-align: center; line-height: 1.6; }
  .footer a { color: #7db800; text-decoration: none; }
  @media print {
    body { padding: 16px; }
    .section-title { page-break-after: avoid; }
    table { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>&#x1F697; ${(inp?.carName || item.carName || 'Unnamed Car').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h1>
  <div class="subtitle">
    Car Finance Comparison &nbsp;·&nbsp; OTR ${gbp(item.carPrice)}
    &nbsp;·&nbsp; Saved ${dateFmt(item.savedAt)}
  </div>

  <div class="section-title">Results — ${item.termYears} Year${item.termYears !== 1 ? 's' : ''} &nbsp;|&nbsp; ${mileage} mi/yr</div>
  <table>
    <thead>
      <tr>
        <th>Option</th>
        <th>Monthly payment</th>
        <th>All-in / month</th>
        <th>Finance cost</th>
        <th>Depreciation</th>
        <th>Running costs</th>
        <th>Grand total</th>
      </tr>
    </thead>
    <tbody>
      ${resultRows}
    </tbody>
  </table>

  ${pcpSection}
  ${hpSection}
  ${pchSection}
  ${loanSection}
  ${ssSection}
  ${depSection}
  ${runningSection}

  <div class="footer">
    Generated by Car Finance Calculator<br>
    <a href="https://lukecode99.github.io/car-finance-calculator/">https://lukecode99.github.io/car-finance-calculator/</a>
  </div>
</body>
</html>`;
}

interface Props { onLoad?: (inputs: CarInputs, savedId: string) => void; }

export function SavedScreen({ onLoad }: Props) {
  const [saved, setSaved] = useState<SavedComparison[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('saved_comparisons').then(raw => {
      setSaved(raw ? JSON.parse(raw) : []);
    });
  }, []);

  async function deleteItem(id: string) {
    const updated = saved.filter(s => s.id !== id);
    await AsyncStorage.setItem('saved_comparisons', JSON.stringify(updated));
    setSaved(updated);
  }

  async function clearAll() {
    Alert.alert('Clear All', 'Delete all saved comparisons?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('saved_comparisons');
          setSaved([]);
        },
      },
    ]);
  }

  async function shareAsPdf(item: SavedComparison) {
    try {
      const html = buildShareHtml(item);
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share comparison' });
      }
    } catch {
      // share cancelled or unsupported
    }
  }

  function openResult(r: FinanceResult) {
    if (r.providerUrl) Linking.openURL(r.providerUrl);
  }

  if (saved.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📊</Text>
          <Text style={s.emptyTitle}>No saved comparisons</Text>
          <Text style={s.emptyText}>Fill in your car details and tap Save to store a comparison here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.title}>Saved Comparisons</Text>
          <TouchableOpacity onPress={clearAll}>
            <Text style={s.clearAll}>Clear all</Text>
          </TouchableOpacity>
        </View>

        {saved.map(item => {
          const cheapest = item.results.reduce<FinanceResult | null>((a, b) => !a || b.grandTotal < a.grandTotal ? b : a, null);
          return (
            <View key={item.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.cardTitleBlock}>
                  <View style={s.carNameRow}>
                    <CarLogo width={36} height={21} />
                    <Text style={s.carName}>{item.carName || 'Unnamed Car'}</Text>
                  </View>
                  {cheapest && (
                    <Text style={s.totalCostLine}>
                      Total cost over {item.termYears} yr{item.termYears !== 1 ? 's' : ''}: {gbp(cheapest.grandTotal)}
                    </Text>
                  )}
                  <Text style={s.meta}>{dateFmt(item.savedAt)}</Text>
                </View>
              </View>

              {item.results.map(r => (
                <TouchableOpacity
                  key={r.type}
                  style={[s.resultRow, cheapest?.type === r.type && s.resultRowWinner]}
                  onPress={() => openResult(r)}
                  activeOpacity={r.providerUrl ? 0.6 : 1}
                >
                  <View style={[s.typeDot, { backgroundColor: r.color }]} />
                  <Text style={[s.resultLabel, { color: r.color }]}>{r.label}{r.providerUrl ? ' ↗' : ''}</Text>
                  {cheapest?.type === r.type && <Text style={s.crown}>👑</Text>}
                  <View style={s.resultFlex} />
                  <View style={s.resultNums}>
                    <Text style={s.resultTotal}>{gbp(r.grandTotal)}</Text>
                    <Text style={s.resultSub}>{gbp(r.costPerMonth)}/mo all-in</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <View style={s.cardActions}>
                {item.inputs && onLoad ? (
                  <TouchableOpacity style={s.actionBtn} onPress={() => onLoad(item.inputs!, item.id)}>
                    <Text style={s.actionBtnText}>Edit / View</Text>
                  </TouchableOpacity>
                ) : <View />}
                <TouchableOpacity style={s.actionBtn} onPress={() => shareAsPdf(item)}>
                  <Text style={s.actionBtnText}>Share PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, s.actionBtnDelete]} onPress={() => deleteItem(item.id)}>
                  <Text style={s.actionBtnDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { color: colors.text, fontSize: font.sizes.xl, fontWeight: '700' },
  clearAll: { color: colors.negative, fontSize: font.sizes.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: font.sizes.lg, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: font.sizes.sm, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardTitleBlock: { flex: 1 },
  carNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  carName: { color: colors.text, fontSize: font.sizes.md, fontWeight: '700', flex: 1 },
  totalCostLine: { color: colors.primary, fontSize: font.sizes.sm, fontWeight: '600', marginTop: 2 },
  meta: { color: colors.textMuted, fontSize: font.sizes.xs, marginTop: 2 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  actionBtn: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
  actionBtnText: { color: colors.textSecondary, fontSize: font.sizes.sm, fontWeight: '600' },
  actionBtnDelete: { borderColor: colors.negative, backgroundColor: 'transparent' },
  actionBtnDeleteText: { color: colors.negative, fontSize: font.sizes.sm, fontWeight: '600' },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  resultRowWinner: { backgroundColor: colors.primaryMuted, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  resultLabel: { fontSize: font.sizes.sm, fontWeight: '600', width: 110 },
  crown: { fontSize: 14, marginLeft: 2 },
  resultFlex: { flex: 1 },
  resultNums: { alignItems: 'flex-end' },
  resultTotal: { color: colors.text, fontSize: font.sizes.md, fontWeight: '700' },
  resultSub: { color: colors.textMuted, fontSize: font.sizes.xs },
});
