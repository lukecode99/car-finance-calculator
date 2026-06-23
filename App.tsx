import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, font } from './src/theme';
import { CarInputs } from './src/types';
import { CalculatorScreen } from './src/screens/CalculatorScreen';
import { SavedScreen } from './src/screens/SavedScreen';
import { HelpScreen } from './src/screens/HelpScreen';

type Tab = 'calc' | 'saved' | 'help';

export default function App() {
  const [tab, setTab] = React.useState<Tab>('calc');
  const [loadedInputs, setLoadedInputs] = React.useState<{ inputs: CarInputs; key: number; savedId?: string } | null>(null);

  function handleLoad(inputs: CarInputs, savedId?: string) {
    setLoadedInputs(prev => ({ inputs, key: (prev?.key ?? 0) + 1, savedId }));
    setTab('calc');
  }

  return (
    <SafeAreaProvider>
      <View style={s.root}>
        <View style={s.screen}>
          {tab === 'calc' && (
            <CalculatorScreen
              key={loadedInputs?.key ?? 0}
              onSaved={() => {}}
              initialInputs={loadedInputs?.inputs}
              editingId={loadedInputs?.savedId}
            />
          )}
          {tab === 'saved' && <SavedScreen onLoad={handleLoad} />}
          {tab === 'help' && <HelpScreen />}
        </View>
        <View style={s.tabBar}>
          {([['calc', '⚡', 'Calculator'], ['saved', '📋', 'Saved'], ['help', '📖', 'Guide']] as [Tab, string, string][]).map(([t, icon, label]) => (
            <TouchableOpacity key={t} style={s.tab} onPress={() => setTab(t)}>
              <Text style={[s.tabIcon, tab === t && s.tabActive]}>{icon}</Text>
              <Text style={[s.tabLabel, tab === t && s.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: colors.tabBar, borderTopWidth: 1, borderTopColor: colors.tabBarBorder, paddingBottom: 20, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 22, color: colors.tabBarInactive },
  tabLabel: { fontSize: font.sizes.xs, color: colors.tabBarInactive, marginTop: 2 },
  tabActive: { color: colors.tabBarActive },
  tabLabelActive: { color: colors.tabBarActive },
});
