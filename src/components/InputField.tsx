import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { colors, spacing, radius, font } from '../theme';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  hint?: string;
}

export function InputField({ label, value, onChangeText, prefix, suffix, placeholder, hint }: InputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.row}>
        {prefix ? <View style={styles.affix}><Text style={styles.affixText}>{prefix}</Text></View> : null}
        <TextInput
          style={[styles.input, prefix && styles.noLeftRadius, suffix && styles.noRightRadius]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder={placeholder ?? '0'}
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
        />
        {suffix ? <View style={styles.affixRight}><Text style={styles.affixText}>{suffix}</Text></View> : null}
      </View>
    </View>
  );
}

export function TextInputField({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

interface SliderProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
}

export function SliderField({ label, value, onChange, min, max, step, format }: SliderProps) {
  const numValue = Math.min(max, Math.max(min, parseInt(value) || min));
  const displayValue = format ? format(numValue) : numValue.toLocaleString('en-GB');

  const decrement = () => onChange(String(Math.max(min, numValue - step)));
  const increment = () => onChange(String(Math.min(max, numValue + step)));

  return (
    <View style={styles.wrapper}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sliderValue}>{displayValue}</Text>
      </View>
      {Platform.OS === 'web' ? (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numValue}
          onChange={(e: any) => onChange(String(e.target.value))}
          style={{ width: '100%', accentColor: colors.primary, height: 28, cursor: 'pointer', marginTop: 4 }}
        />
      ) : (
        <View style={styles.stepRow}>
          <TouchableOpacity style={styles.stepBtn} onPress={decrement}>
            <Text style={styles.stepBtnText}>–</Text>
          </TouchableOpacity>
          <View style={styles.stepProgress}>
            <View style={[styles.stepFill, { width: `${((numValue - min) / (max - min)) * 100}%` as any }]} />
          </View>
          <TouchableOpacity style={styles.stepBtn} onPress={increment}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.sliderMinMax}>
        <Text style={styles.minMaxText}>{format ? format(min) : min.toLocaleString('en-GB')}</Text>
        <Text style={styles.minMaxText}>{format ? format(max) : max.toLocaleString('en-GB')}</Text>
      </View>
    </View>
  );
}

interface IncludedToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function IncludedToggle({ label, value, onChange }: IncludedToggleProps) {
  return (
    <View style={itStyles.row}>
      <Text style={itStyles.label}>{label}</Text>
      <View style={itStyles.pills}>
        <TouchableOpacity
          style={[itStyles.pill, itStyles.pillLeft, value && itStyles.pillActive]}
          onPress={() => onChange(true)}
        >
          <Text style={[itStyles.pillText, value && itStyles.pillTextActive]}>Included</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[itStyles.pill, itStyles.pillRight, !value && itStyles.pillActive]}
          onPress={() => onChange(false)}
        >
          <Text style={[itStyles.pillText, !value && itStyles.pillTextActive]}>Paid separately</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const itStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, minHeight: 36 },
  label: { color: colors.textSecondary, fontSize: font.sizes.sm, flex: 1, marginRight: spacing.sm },
  pills: { flexDirection: 'row' },
  pill: {
    paddingVertical: 7, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.inputBg,
  },
  pillLeft: { borderTopLeftRadius: radius.sm, borderBottomLeftRadius: radius.sm, borderRightWidth: 0 },
  pillRight: { borderTopRightRadius: radius.sm, borderBottomRightRadius: radius.sm },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.textSecondary, fontSize: font.sizes.xs, fontWeight: '600' },
  pillTextActive: { color: '#000' },
});

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.sm },
  label: { color: colors.textSecondary, fontSize: font.sizes.sm, marginBottom: 4 },
  hint: { color: colors.textMuted, fontSize: font.sizes.xs, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: colors.inputBg, color: colors.text,
    fontSize: font.sizes.md, paddingVertical: 10, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
  },
  noLeftRadius: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  noRightRadius: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  affix: {
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    borderRightWidth: 0, borderTopLeftRadius: radius.sm, borderBottomLeftRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 10,
  },
  affixRight: {
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 0, borderTopRightRadius: radius.sm, borderBottomRightRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 10,
  },
  affixText: { color: colors.textSecondary, fontSize: font.sizes.md },

  sliderLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  sliderValue: { color: colors.primary, fontSize: font.sizes.md, fontWeight: '700' },
  sliderMinMax: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  minMaxText: { color: colors.textMuted, fontSize: font.sizes.xs },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: spacing.sm },
  stepBtn: {
    backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { color: colors.text, fontSize: font.sizes.lg, fontWeight: '700', lineHeight: 20 },
  stepProgress: { flex: 1, height: 6, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden' },
  stepFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
});
