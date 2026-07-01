import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, Linking } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, font } from '../theme';
import { CarInputs, DEFAULT_INPUTS, DepreciationPreset, TaxRate, SavedComparison } from '../types';
import { calcAll, getBikRate } from '../engine/financeEngine';
import { InputField, TextInputField, SliderField, IncludedToggle } from '../components/InputField';
import { DepreciationSlider } from '../components/DepreciationSlider';

function fmt(n: number, dec = 0) { return n.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
function gbp(n: number) { return `£${fmt(Math.abs(n))}`; }
function pence(n: number) { return `£${fmt(n, 2)}`; }

const TERMS = ['1', '2', '3', '4', '5'];
const TAX_RATES: TaxRate[] = ['20', '40', '45'];

const OPTION_LABELS: { key: keyof Pick<CarInputs, 'enablePcp' | 'enableHp' | 'enablePch' | 'enableLoan' | 'enableSalary'>; label: string }[] = [
  { key: 'enablePcp', label: 'PCP' },
  { key: 'enableHp', label: 'HP' },
  { key: 'enablePch', label: 'Lease / PCH' },
  { key: 'enableLoan', label: 'Bank Loan' },
  { key: 'enableSalary', label: 'Salary Sacrifice' },
];

interface Props { onSaved: () => void; initialInputs?: CarInputs; editingId?: string; onReset?: () => void; }

export function CalculatorScreen({ onSaved, initialInputs, editingId, onReset }: Props) {
  const [inputs, setInputs] = useState<CarInputs>(initialInputs ?? DEFAULT_INPUTS);
  const [showYearly, setShowYearly] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(k: keyof CarInputs) { return (v: string) => setInputs(p => ({ ...p, [k]: v })); }
  function setB(k: keyof CarInputs) { return (v: boolean) => setInputs(p => ({ ...p, [k]: v })); }
  function toggle(k: keyof CarInputs) { return () => setInputs(p => ({ ...p, [k]: !p[k] })); }

  const results = useMemo(() => {
    if (!inputs.carPrice || parseFloat(inputs.carPrice) <= 0) return [];
    return calcAll(inputs);
  }, [inputs]);

  const cheapest = results.length > 0 ? results.reduce((a, b) => a.grandTotal < b.grandTotal ? a : b) : null;

  const bikRate = useMemo(() => getBikRate(parseInt(inputs.ssCo2) || 0), [inputs.ssCo2]);

  async function saveComparison() {
    if (results.length === 0) return;
    setSaving(true);
    try {
      const existing = JSON.parse(await AsyncStorage.getItem('saved_comparisons') || '[]') as SavedComparison[];
      const entry: SavedComparison = {
        id: editingId ?? Date.now().toString(),
        savedAt: new Date().toISOString(),
        carName: inputs.carName || 'Unnamed Car',
        carPrice: parseFloat(inputs.carPrice),
        termYears: parseInt(inputs.termYears),
        results,
        inputs,
      };
      const updated = editingId
        ? existing.map(e => e.id === editingId ? entry : e)
        : [entry, ...existing].slice(0, 20);
      await AsyncStorage.setItem('saved_comparisons', JSON.stringify(updated));
      Alert.alert(editingId ? 'Updated' : 'Saved', editingId ? 'Comparison updated.' : 'Comparison saved successfully.');
      onSaved();
    } catch {
      Alert.alert('Error', 'Could not save comparison.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSharePDF() {
    if (results.length === 0) return;
    const carLabel = inputs.carName ? inputs.carName : 'Car';
    const term = inputs.termYears;

    const summaryRows = results.map(r => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${r.label}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${gbp(r.costPerMonth)}/mo</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${gbp(r.grandTotal)}</td>
      </tr>`).join('');

    const detailSections = results.map(r => {
      const rows: string[] = [
        `<tr><td>Monthly payment</td><td>${gbp(r.monthlyPayment)}</td></tr>`,
        `<tr><td>All-in per month</td><td><strong>${gbp(r.costPerMonth)}</strong></td></tr>`,
        `<tr><td>Finance cost</td><td>${gbp(r.totalFinanceCost)}</td></tr>`,
      ];
      if (r.type !== 'pch' && r.type !== 'salary') rows.push(`<tr><td>Depreciation</td><td>${gbp(r.totalDepreciation)}</td></tr>`);
      rows.push(`<tr><td>Running costs</td><td>${gbp(r.totalRunningCosts)}</td></tr>`);
      if (r.sellingCost > 0) rows.push(`<tr><td>Selling cost</td><td>${gbp(r.sellingCost)}</td></tr>`);
      if ((r.excessMileageCost ?? 0) > 0) rows.push(`<tr><td>Excess mileage</td><td>${gbp(r.excessMileageCost!)}</td></tr>`);
      if (r.type === 'salary' && r.bikRate !== undefined) {
        rows.push(`<tr><td>BIK rate</td><td>${r.bikRate}%</td></tr>`);
        rows.push(`<tr><td>Monthly BIK tax</td><td>${gbp(r.monthlyBikTax!)}</td></tr>`);
      }
      rows.push(`<tr style="background:#f0f0f0"><td><strong>Grand Total</strong></td><td><strong>${gbp(r.grandTotal)}</strong></td></tr>`);

      const yearlyRows = r.yearlyBreakdown.map(y => `
        <tr>
          <td style="padding:4px 8px;border:1px solid #eee">${y.year}</td>
          ${r.type !== 'pch' && r.type !== 'salary' ? `<td style="padding:4px 8px;border:1px solid #eee">${gbp(y.carValue)}</td>` : ''}
          <td style="padding:4px 8px;border:1px solid #eee">${gbp(y.financePayments)}</td>
          <td style="padding:4px 8px;border:1px solid #eee">${gbp(y.runningCosts)}</td>
          <td style="padding:4px 8px;border:1px solid #eee"><strong>${gbp(y.cumulativeTotal)}</strong></td>
        </tr>`).join('');

      const yearlyHead = r.type !== 'pch' && r.type !== 'salary'
        ? '<th>Yr</th><th>Value</th><th>Finance</th><th>Running</th><th>Cumulative</th>'
        : '<th>Yr</th><th>Finance</th><th>Running</th><th>Cumulative</th>';

      return `
        <h2 style="margin-top:24px;border-bottom:2px solid #333;padding-bottom:4px">${r.label}</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:13px">
          ${rows.map(row => row.replace(/<tr>/, '<tr style="border-bottom:1px solid #eee">').replace(/<td>/g, '<td style="padding:6px 8px">').replace(/<\/td>/g, '</td>')).join('')}
        </table>
        <h3 style="font-size:13px;color:#555">Year-by-year breakdown</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#333;color:#fff">${yearlyHead.replace(/<th>/g, '<th style="padding:6px 8px;text-align:left">').replace(/<\/th>/g, '</th>')}</tr></thead>
          <tbody>${yearlyRows}</tbody>
        </table>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Car Finance Comparison — ${carLabel}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #000; background: #fff; font-size: 14px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .meta { color: #555; font-size: 13px; margin-bottom: 20px; }
  table { border-collapse: collapse; width: 100%; }
  @media print { body { padding: 0; } }
</style>
</head><body>
<h1>Car Finance Comparison</h1>
<p class="meta">Car: <strong>${carLabel}</strong> &nbsp;|&nbsp; Term: <strong>${term} year${term !== '1' ? 's' : ''}</strong></p>

<h2 style="font-size:15px;margin-bottom:8px">Summary</h2>
<table style="margin-bottom:24px;font-size:13px">
  <thead>
    <tr style="background:#333;color:#fff">
      <th style="padding:8px;text-align:left">Option</th>
      <th style="padding:8px;text-align:right">All-in / month</th>
      <th style="padding:8px;text-align:right">Grand Total</th>
    </tr>
  </thead>
  <tbody>${summaryRows}</tbody>
</table>

${detailSections}

<p style="margin-top:32px;font-size:11px;color:#999">Generated by Car Finance Calculator</p>
</body></html>`;

    try {
      if (Platform.OS !== 'web') {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Car Finance Comparison' });
      } else {
        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); w.print(); }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not generate PDF.');
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        <View style={s.titleRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={s.title}>Car Finance Calculator</Text>
            <Text style={s.subtitle}>Compare PCP · HP · Lease/PCH · Bank Loan · Salary Sacrifice</Text>
          </View>
          <TouchableOpacity style={s.resetBtn} onPress={() => { setInputs(DEFAULT_INPUTS); onReset?.(); }}>
            <Text style={s.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Car Details */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Car Details</Text>
          <TextInputField label="Car Name / Model" value={inputs.carName} onChangeText={set('carName')} placeholder="e.g. Audi A4 1.4 TDI" />
          <InputField label="Purchase Price (OTR)" value={inputs.carPrice} onChangeText={set('carPrice')} prefix="£" placeholder="26918" />
          <SliderField
            label="Expected Yearly Mileage"
            value={inputs.annualMileage}
            onChange={set('annualMileage')}
            min={1000} max={50000} step={1000}
            format={v => `${v.toLocaleString('en-GB')} mi/yr`}
          />
        </View>

        {/* Options to Compare */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Compare Options</Text>
          <View style={s.pills}>
            {OPTION_LABELS.map(({ key, label }) => {
              const active = inputs[key] as boolean;
              return (
                <TouchableOpacity key={key} style={[s.pill, active && s.pillActive]} onPress={toggle(key)}>
                  <Text style={[s.pillText, active && s.pillTextActive]}>{active ? '✓ ' : ''}{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Finance Term */}
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
        {(inputs.enablePcp || inputs.enableHp || inputs.enableLoan) && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Depreciation</Text>
            <DepreciationSlider
              value={inputs.depreciationPreset}
              onChange={v => setInputs(p => ({ ...p, depreciationPreset: v }))}
              customY1={inputs.customDepreciationY1}
              customPA={inputs.customDepreciationPA}
              onCustomY1={set('customDepreciationY1')}
              onCustomPA={set('customDepreciationPA')}
              customResidual={inputs.customResidualValue ?? ''}
              onCustomResidual={set('customResidualValue')}
            />
          </View>
        )}

        {/* PCP */}
        {inputs.enablePcp && (
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <View style={[s.typeDot, { backgroundColor: colors.pcp }]} />
              <Text style={s.sectionTitle}>PCP (Personal Contract Purchase)</Text>
            </View>
            <InputField label="Deposit" value={inputs.pcpDeposit} onChangeText={set('pcpDeposit')} prefix="£" />
            <InputField label="APR" value={inputs.pcpApr} onChangeText={set('pcpApr')} suffix="%" hint="Representative APR from dealer/lender" />
            <InputField label="Balloon Payment (GMFV)" value={inputs.balloon} onChangeText={set('balloon')} prefix="£" hint="Guaranteed minimum future value at end of term" />
            <InputField label="Mileage included per year" value={inputs.pcpMileageIncluded} onChangeText={set('pcpMileageIncluded')} suffix="mi" hint="Agreement annual mileage allowance" />
            <InputField label="Excess mileage rate" value={inputs.pcpExcessPpm} onChangeText={set('pcpExcessPpm')} suffix="p/mi" hint="Pence per excess mile charged at end of term" />
            <IncludedToggle label="Insurance" value={inputs.pcpInsuranceIncluded} onChange={setB('pcpInsuranceIncluded')} />
            <IncludedToggle label="Road Tax" value={inputs.pcpRoadTaxIncluded} onChange={setB('pcpRoadTaxIncluded')} />
            <IncludedToggle label="Service & Maintenance" value={inputs.pcpServiceIncluded} onChange={setB('pcpServiceIncluded')} />
            <IncludedToggle label="Tyres" value={inputs.pcpTyresIncluded} onChange={setB('pcpTyresIncluded')} />
            <TextInputField label="Provider (optional)" value={inputs.pcpProvider} onChangeText={set('pcpProvider')} placeholder="e.g. Volkswagen Financial Services" />
            <TextInputField label="Provider URL (optional)" value={inputs.pcpProviderUrl} onChangeText={set('pcpProviderUrl')} placeholder="https://..." />
          </View>
        )}

        {/* HP */}
        {inputs.enableHp && (
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <View style={[s.typeDot, { backgroundColor: colors.hp }]} />
              <Text style={s.sectionTitle}>HP (Hire Purchase)</Text>
            </View>
            <InputField label="Deposit" value={inputs.hpDeposit} onChangeText={set('hpDeposit')} prefix="£" />
            <InputField label="APR" value={inputs.hpApr} onChangeText={set('hpApr')} suffix="%" hint="Representative APR from dealer/lender" />
            <Text style={s.cardNote}>No balloon — you own the car at end of term. No mileage restrictions.</Text>
            <IncludedToggle label="Insurance" value={inputs.hpInsuranceIncluded} onChange={setB('hpInsuranceIncluded')} />
            <IncludedToggle label="Road Tax" value={inputs.hpRoadTaxIncluded} onChange={setB('hpRoadTaxIncluded')} />
            <IncludedToggle label="Service & Maintenance" value={inputs.hpServiceIncluded} onChange={setB('hpServiceIncluded')} />
            <IncludedToggle label="Tyres" value={inputs.hpTyresIncluded} onChange={setB('hpTyresIncluded')} />
            <TextInputField label="Provider (optional)" value={inputs.hpProvider} onChangeText={set('hpProvider')} placeholder="e.g. Black Horse Finance" />
            <TextInputField label="Provider URL (optional)" value={inputs.hpProviderUrl} onChangeText={set('hpProviderUrl')} placeholder="https://..." />
          </View>
        )}

        {/* PCH */}
        {inputs.enablePch && (
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <View style={[s.typeDot, { backgroundColor: colors.pch }]} />
              <Text style={s.sectionTitle}>Lease / Contract Hire (PCH)</Text>
            </View>
            <InputField label="Initial Rental (deposit)" value={inputs.pchDeposit} onChangeText={set('pchDeposit')} prefix="£" hint="Typically 3–9 months upfront" />
            <InputField label="Monthly Payment" value={inputs.pchMonthly} onChangeText={set('pchMonthly')} prefix="£" hint="Monthly inc. VAT" />
            <InputField label="Mileage included per year" value={inputs.pchMileageIncluded} onChangeText={set('pchMileageIncluded')} suffix="mi" hint="Agreement annual mileage allowance" />
            <InputField label="Excess mileage rate" value={inputs.pchExcessPpm} onChangeText={set('pchExcessPpm')} suffix="p/mi" hint="Pence per excess mile charged at end of term" />
            <IncludedToggle label="Insurance" value={inputs.pchInsuranceIncluded} onChange={setB('pchInsuranceIncluded')} />
            <IncludedToggle label="Road Tax" value={inputs.pchRoadTaxIncluded} onChange={setB('pchRoadTaxIncluded')} />
            <IncludedToggle label="Service & Maintenance" value={inputs.pchServiceIncluded} onChange={setB('pchServiceIncluded')} />
            <IncludedToggle label="Tyres" value={inputs.pchTyresIncluded} onChange={setB('pchTyresIncluded')} />
            <TextInputField label="Provider (optional)" value={inputs.pchProvider} onChangeText={set('pchProvider')} placeholder="e.g. Leaseplan" />
            <TextInputField label="Provider URL (optional)" value={inputs.pchProviderUrl} onChangeText={set('pchProviderUrl')} placeholder="https://..." />
          </View>
        )}

        {/* Bank Loan */}
        {inputs.enableLoan && (
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <View style={[s.typeDot, { backgroundColor: colors.loan }]} />
              <Text style={s.sectionTitle}>Bank Loan</Text>
            </View>
            <Text style={s.cardNote}>Borrow from your bank, own the car outright from day one. No mileage limits.</Text>
            <SliderField
              label="Deposit"
              value={String(inputs.loanDepositPct ?? 10)}
              onChange={v => setInputs(p => ({ ...p, loanDepositPct: parseInt(v) || 0 }))}
              min={0} max={100} step={1}
              format={v => `${v}%`}
            />
            {(() => {
              const price = parseFloat(inputs.carPrice) || 0;
              const dep = Math.round(price * (inputs.loanDepositPct ?? 10) / 100);
              return (
                <>
                  <View style={s.labelRow}>
                    <Text style={s.fieldLabel}>Deposit</Text>
                    <Text style={s.fieldLabel}>£{dep.toLocaleString('en-GB')}</Text>
                  </View>
                  <View style={s.labelRow}>
                    <Text style={s.fieldLabel}>Loan amount</Text>
                    <Text style={s.fieldLabel}>£{(price - dep).toLocaleString('en-GB')}</Text>
                  </View>
                </>
              );
            })()}
            <InputField label="APR" value={inputs.loanApr} onChangeText={set('loanApr')} suffix="%" hint="Personal loan APR from your bank" />
            <TextInputField label="Provider (optional)" value={inputs.loanProvider} onChangeText={set('loanProvider')} placeholder="e.g. Barclays Personal Loan" />
            <TextInputField label="Provider URL (optional)" value={inputs.loanProviderUrl} onChangeText={set('loanProviderUrl')} placeholder="https://..." />
          </View>
        )}

        {/* Salary Sacrifice */}
        {inputs.enableSalary && (
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <View style={[s.typeDot, { backgroundColor: colors.salary }]} />
              <Text style={s.sectionTitle}>Salary Sacrifice</Text>
            </View>
            <Text style={s.cardNote}>
              Your employer leases the car; you give up gross salary to cover the cost. Tax + NI savings reduce your real monthly outlay.
            </Text>
            <InputField label="Deposit" value={inputs.ssDeposit} onChangeText={set('ssDeposit')} prefix="£" hint="Upfront contribution (often £0)" />
            <InputField label="Monthly gross sacrifice" value={inputs.ssMonthly} onChangeText={set('ssMonthly')} prefix="£" hint="Amount deducted from gross salary each month" />
            <InputField label="P11D value" value={inputs.ssP11d} onChangeText={set('ssP11d')} prefix="£" hint="List price inc. options and delivery (excl. first-year VED)" />
            <InputField label="CO₂ emissions" value={inputs.ssCo2} onChangeText={set('ssCo2')} suffix="g/km" hint={`BIK rate: ${bikRate}% (2025/26)`} />
            <View style={s.labelRow}>
              <Text style={s.fieldLabel}>Income tax rate</Text>
            </View>
            <View style={[s.pills, { marginBottom: spacing.sm }]}>
              {TAX_RATES.map(r => (
                <TouchableOpacity key={r} style={[s.pill, inputs.ssTaxRate === r && s.pillActive]} onPress={() => setInputs(p => ({ ...p, ssTaxRate: r }))}>
                  <Text style={[s.pillText, inputs.ssTaxRate === r && s.pillTextActive]}>{r}%</Text>
                </TouchableOpacity>
              ))}
            </View>
            <IncludedToggle label="Insurance" value={inputs.ssInsuranceIncluded} onChange={setB('ssInsuranceIncluded')} />
            <IncludedToggle label="Road Tax" value={inputs.ssRoadTaxIncluded} onChange={setB('ssRoadTaxIncluded')} />
            <IncludedToggle label="Service & Maintenance" value={inputs.ssServiceIncluded} onChange={setB('ssServiceIncluded')} />
            <IncludedToggle label="Tyres" value={inputs.ssTyresIncluded} onChange={setB('ssTyresIncluded')} />
            <TextInputField label="Provider (optional)" value={inputs.ssProvider} onChangeText={set('ssProvider')} placeholder="e.g. Octopus EV" />
            <TextInputField label="Provider URL (optional)" value={inputs.ssProviderUrl} onChangeText={set('ssProviderUrl')} placeholder="https://..." />
          </View>
        )}

        {/* Running Costs */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Annual Running Costs</Text>
          <InputField label="Insurance (annual)" value={inputs.insurance} onChangeText={set('insurance')} prefix="£"
            hint={inputs.enableSalary && inputs.ssInsuranceIncluded ? 'Excluded from Salary Sacrifice total (included in scheme)' : undefined} />
          <InputField label="Road Tax (annual)" value={inputs.roadTax} onChangeText={set('roadTax')} prefix="£"
            hint={inputs.enableSalary && inputs.ssRoadTaxIncluded ? 'Excluded from Salary Sacrifice total (included in scheme)' : undefined} />
          <InputField label="Servicing & Maintenance (annual)" value={inputs.maintenance} onChangeText={set('maintenance')} prefix="£"
            hint={inputs.enableSalary && inputs.ssServiceIncluded ? 'Excluded from Salary Sacrifice total (included in scheme)' : undefined} />
          <InputField label="Tyres (annual allowance)" value={inputs.tyresPerYear} onChangeText={set('tyresPerYear')} prefix="£"
            hint={inputs.enableSalary && inputs.ssTyresIncluded ? 'Excluded from Salary Sacrifice total (included in scheme)' : undefined} />
          {(inputs.enablePcp || inputs.enableHp || inputs.enableLoan) && (
            <InputField label="Selling Cost (PCP/HP/Loan only)" value={inputs.sellingCost} onChangeText={set('sellingCost')} prefix="£" hint="Dealer/broker commission when you sell at end of term" />
          )}
        </View>

        {/* Results */}
        {results.length > 0 && (
          <View style={s.results}>
            <View style={s.resultsHeader}>
              <Text style={s.resultsTitle}>Results — {inputs.termYears} year{inputs.termYears !== '1' ? 's' : ''}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <TouchableOpacity style={s.saveBtn} onPress={handleSharePDF}>
                  <Text style={s.saveBtnText}>↗ PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={saveComparison} disabled={saving}>
                  <Text style={s.saveBtnText}>{saving ? (editingId ? 'Updating…' : 'Saving…') : editingId ? '💾 Update' : '💾 Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {cheapest && results.length > 1 && (
              <View style={s.winnerBanner}>
                <Text style={s.winnerText}>
                  Cheapest overall: <Text style={{ color: cheapest.color, fontWeight: '700' }}>{cheapest.label}</Text>
                  {' — saves '}{gbp(results.filter(r => r.type !== cheapest.type).reduce((a, b) => Math.min(a, b.grandTotal), Infinity) - cheapest.grandTotal)} vs next option
                </Text>
              </View>
            )}

            {results.map(r => (
              <View key={r.type} style={[s.resultCard, { borderLeftColor: r.color }]}>
                <View style={s.resultHeader}>
                  <View>
                    <Text style={[s.resultType, { color: r.color }]}>{r.label}</Text>
                    {r.provider ? (
                      <TouchableOpacity onPress={() => r.providerUrl ? Linking.openURL(r.providerUrl) : undefined} activeOpacity={r.providerUrl ? 0.7 : 1}>
                        <Text style={[s.providerText, r.providerUrl && s.providerLink]}>{r.provider}{r.providerUrl ? ' ↗' : ''}</Text>
                      </TouchableOpacity>
                    ) : null}
                    {r.depositRequired !== undefined && r.depositRequired >= 0 && (
                      <Text style={s.depositNote}>Deposit required: {gbp(r.depositRequired)}</Text>
                    )}
                  </View>
                  <Text style={s.resultTotal}>{gbp(r.grandTotal)}<Text style={s.resultTotalLabel}> total</Text></Text>
                </View>

                <View style={s.resultGrid}>
                  <ResultCell label="Monthly payment" value={gbp(r.monthlyPayment)} />
                  <ResultCell label="All-in per month" value={gbp(r.costPerMonth)} highlight />
                  <ResultCell label="Cost per mile" value={pence(r.costPerMile)} />
                  <ResultCell label="Finance cost" value={gbp(r.totalFinanceCost)} />
                  {r.type !== 'pch' && r.type !== 'salary' && <ResultCell label="Depreciation" value={gbp(r.totalDepreciation)} />}
                  <ResultCell label="Running costs" value={gbp(r.totalRunningCosts)} />
                  {r.sellingCost > 0 && <ResultCell label="Selling cost" value={gbp(r.sellingCost)} />}
                  {(r.excessMileageCost ?? 0) > 0 && <ResultCell label="Excess mileage" value={gbp(r.excessMileageCost!)} />}
                  {r.type === 'salary' && r.bikRate !== undefined && (
                    <>
                      <ResultCell label={`BIK rate (CO₂)`} value={`${r.bikRate}%`} />
                      <ResultCell label="Monthly BIK tax" value={gbp(r.monthlyBikTax!)} />
                    </>
                  )}
                </View>

                {r.type === 'loan' && r.loanResidualValue !== undefined && r.loanResidualValue > 0 && (
                  <Text style={s.residualNote}>You own the car outright — estimated value at end of term: {gbp(r.loanResidualValue)}</Text>
                )}

                <TouchableOpacity style={s.yearlyToggle} onPress={() => setShowYearly(showYearly === r.type ? null : r.type)}>
                  <Text style={s.yearlyToggleText}>Year-by-year breakdown {showYearly === r.type ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showYearly === r.type && (
                  <View style={s.yearlyTable}>
                    <View style={s.yearlyHeader}>
                      <Text style={[s.yearlyCell, s.yearlyHeadText, { flex: 0.5 }]}>Yr</Text>
                      {r.type !== 'pch' && r.type !== 'salary' && <Text style={[s.yearlyCell, s.yearlyHeadText]}>Value</Text>}
                      <Text style={[s.yearlyCell, s.yearlyHeadText]}>Finance</Text>
                      <Text style={[s.yearlyCell, s.yearlyHeadText]}>Running</Text>
                      <Text style={[s.yearlyCell, s.yearlyHeadText]}>Cumulative</Text>
                    </View>
                    {r.yearlyBreakdown.map(y => (
                      <View key={y.year} style={s.yearlyRow}>
                        <Text style={[s.yearlyCell, { flex: 0.5 }]}>{y.year}</Text>
                        {r.type !== 'pch' && r.type !== 'salary' && <Text style={s.yearlyCell}>{gbp(y.carValue)}</Text>}
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  title: { color: colors.text, fontSize: font.sizes.xl, fontWeight: '700', marginBottom: 2 },
  subtitle: { color: colors.textSecondary, fontSize: font.sizes.sm },
  resetBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, marginTop: 4 },
  resetBtnText: { color: colors.textSecondary, fontSize: font.sizes.sm, fontWeight: '600' },

  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  typeDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8, marginTop: 1 },
  sectionTitle: { color: colors.text, fontSize: font.sizes.md, fontWeight: '700', marginBottom: spacing.sm },
  cardNote: { color: colors.textMuted, fontSize: font.sizes.sm, fontStyle: 'italic', marginBottom: spacing.sm },

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

  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  fieldLabel: { color: colors.textSecondary, fontSize: font.sizes.sm },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2 },
  toggleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  toggleBtnText: { color: colors.textSecondary, fontSize: font.sizes.xs, fontWeight: '600' },
  toggleBtnTextActive: { color: colors.primary },

  results: { marginTop: spacing.xs },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  resultsTitle: { color: colors.text, fontSize: font.sizes.lg, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  saveBtnText: { color: colors.primary, fontSize: font.sizes.sm, fontWeight: '600' },

  winnerBanner: { backgroundColor: colors.primaryMuted, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.primary },
  winnerText: { color: colors.text, fontSize: font.sizes.sm },

  resultCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 4, borderWidth: 1, borderColor: colors.border },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  resultType: { fontSize: font.sizes.lg, fontWeight: '700' },
  providerText: { color: colors.textMuted, fontSize: font.sizes.xs, marginTop: 2 },
  providerLink: { color: colors.primary, textDecorationLine: 'underline' },
  depositNote: { color: colors.textMuted, fontSize: font.sizes.xs, marginTop: 2 },
  residualNote: { color: colors.textMuted, fontSize: font.sizes.xs, fontStyle: 'italic', marginBottom: spacing.sm },
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
