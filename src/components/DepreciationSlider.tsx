import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors, spacing, radius, font } from '../theme';
import { DepreciationPreset, DEPRECIATION_PRESETS } from '../types';
import { InputField } from './InputField';

const ORDER: DepreciationPreset[] = ['high', 'medium', 'low', 'custom'];

interface Props {
  value: DepreciationPreset;
  onChange: (v: DepreciationPreset) => void;
  customY1: string;
  customPA: string;
  onCustomY1: (v: string) => void;
  onCustomPA: (v: string) => void;
}

export function DepreciationSlider({ value, onChange, customY1, customPA, onCustomY1, onCustomPA }: Props) {
  const idx = ORDER.indexOf(value);
  const info = DEPRECIATION_PRESETS[value];

  function decrement() { if (idx > 0) onChange(ORDER[idx - 1]); }
  function increment() { if (idx < ORDER.length - 1) onChange(ORDER[idx + 1]); }

  return (
    <View>
      {/* Slider track */}
      {Platform.OS === 'web' ? (
        <input
          type="range"
          min={0}
          max={ORDER.length - 1}
          step={1}
          value={idx}
          onChange={(e: any) => onChange(ORDER[parseInt(e.target.value)])}
          style={{ width: '100%', accentColor: colors.primary, height: 28, cursor: 'pointer', marginTop: 4, marginBottom: 2 }}
        />
      ) : (
        <View style={s.stepRow}>
          <TouchableOpacity style={[s.stepBtn, idx === 0 && s.stepBtnDisabled]} onPress={decrement} disabled={idx === 0}>
            <Text style={s.stepBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={s.track}>
            <View style={[s.fill, { width: `${(idx / (ORDER.length - 1)) * 100}%` as any }]} />
          </View>
          <TouchableOpacity style={[s.stepBtn, idx === ORDER.length - 1 && s.stepBtnDisabled]} onPress={increment} disabled={idx === ORDER.length - 1}>
            <Text style={s.stepBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tick labels */}
      <View style={s.ticks}>
        {ORDER.map((p, i) => (
          <TouchableOpacity key={p} style={s.tick} onPress={() => onChange(p)}>
            <Text style={[s.tickLabel, i === idx && s.tickLabelActive]}>
              {DEPRECIATION_PRESETS[p].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected info */}
      <View style={[s.infoBox, { borderColor: colors.primary }]}>
        <Text style={s.infoTitle}>
          {info.label}{value !== 'custom' ? ` — Yr1: ${info.y1}%, then ${info.pa}%/yr` : ''}
        </Text>
        <Text style={s.infoDesc}>{info.desc}</Text>
      </View>

      {/* Custom inputs */}
      {value === 'custom' && (
        <View style={{ marginTop: spacing.sm }}>
          <InputField label="Year 1 depreciation" value={customY1} onChangeText={onCustomY1} suffix="%" />
          <InputField label="Year 2+ per year" value={customPA} onChangeText={onCustomPA} suffix="%" />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  stepRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 2, gap: spacing.sm },
  stepBtn: {
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.35 },
  stepBtnText: { color: colors.text, fontSize: 22, fontWeight: '700', lineHeight: 26 },
  track: { flex: 1, height: 6, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  ticks: { flexDirection: 'row', marginBottom: spacing.sm },
  tick: { flex: 1, alignItems: 'center' },
  tickLabel: { color: colors.textMuted, fontSize: font.sizes.xs, fontWeight: '600' },
  tickLabelActive: { color: colors.primary },
  infoBox: {
    backgroundColor: colors.surface2, borderRadius: radius.sm, padding: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  infoTitle: { color: colors.text, fontSize: font.sizes.sm, fontWeight: '600', marginBottom: 2 },
  infoDesc: { color: colors.textMuted, fontSize: font.sizes.xs },
});
