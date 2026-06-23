import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing, radius, font } from '../theme';
import { DepreciationPreset, DEPRECIATION_PRESETS } from '../types';
import { InputField } from './InputField';

const ORDER: DepreciationPreset[] = ['low', 'medium', 'high', 'custom'];

interface Props {
  value: DepreciationPreset;
  onChange: (v: DepreciationPreset) => void;
  customY1: string;
  customPA: string;
  onCustomY1: (v: string) => void;
  onCustomPA: (v: string) => void;
  customResidualValue: string;
  onCustomResidualValue: (v: string) => void;
}

export function DepreciationSlider({ value, onChange, customY1, customPA, onCustomY1, onCustomPA, customResidualValue, onCustomResidualValue }: Props) {
  const idx = ORDER.indexOf(value);
  const info = DEPRECIATION_PRESETS[value];

  return (
    <View>
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
        <Slider
          style={{ width: '100%', height: 40, marginTop: 4, marginBottom: 2 }}
          minimumValue={0}
          maximumValue={ORDER.length - 1}
          step={1}
          value={idx}
          onSlidingComplete={(val) => onChange(ORDER[Math.round(val)])}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.surface2}
          thumbTintColor={colors.primary}
        />
      )}

      <View style={s.ticks}>
        {ORDER.map((p, i) => (
          <TouchableOpacity key={p} style={s.tick} onPress={() => onChange(p)}>
            <Text style={[s.tickLabel, i === idx && s.tickLabelActive]}>
              {DEPRECIATION_PRESETS[p].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.infoBox}>
        <Text style={s.infoTitle}>
          {info.label}{value !== 'custom' ? ` — Yr1: ${info.y1}%, then ${info.pa}%/yr` : ''}
        </Text>
        <Text style={s.infoDesc}>{info.desc}</Text>
      </View>

      {value === 'custom' && (
        <View style={{ marginTop: spacing.sm }}>
          <InputField label="Estimated value at end of term (£)" value={customResidualValue} onChangeText={onCustomResidualValue} prefix="£" hint="Back-calculates annual depreciation from residual value" />
          <InputField label="Year 1 depreciation (%)" value={customY1} onChangeText={onCustomY1} suffix="%" hint="Used if no residual value entered above" />
          <InputField label="Year 2+ per year (%)" value={customPA} onChangeText={onCustomPA} suffix="%" hint="Used if no residual value entered above" />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
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
