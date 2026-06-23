import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme';

export function CarLogo({ width = 40, height = 24 }: { width?: number; height?: number }) {
  return (
    <View style={{ width, height, borderRadius: 4, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Text style={{ fontSize: Math.floor(height * 0.6), lineHeight: height }}>🚗</Text>
    </View>
  );
}
