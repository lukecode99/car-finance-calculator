import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, font } from '../theme';
import { SavedComparison, FinanceResult, CarInputs } from '../types';
import { CarLogo } from '../components/CarLogo';

function gbp(n: number) { return `£${Math.round(Math.abs(n)).toLocaleString('en-GB')}`; }
function dateFmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Props { onLoad?: (inputs: CarInputs) => void; }

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
                  <TouchableOpacity style={s.actionBtn} onPress={() => onLoad(item.inputs!)}>
                    <Text style={s.actionBtnText}>Edit / View</Text>
                  </TouchableOpacity>
                ) : <View />}
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
