import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme';

export function CarLogo({ width = 40, height = 24 }: { width?: number; height?: number }) {
  return (
    <View style={{ width, height, borderRadius: 4, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: height * 0.65, lineHeight: height * 0.8 }}>🚗</Text>
    </View>
  );
}
