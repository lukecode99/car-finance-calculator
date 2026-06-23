import React from 'react';
import { Image, Platform, View, Text } from 'react-native';
import { colors } from '../theme';

const SVG_STRING = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 28">',
  '<rect x="2" y="14" width="44" height="10" rx="3" fill="#BAFF29"/>',
  '<path d="M12 14 L16 6 Q18 4 22 4 L30 4 Q34 4 36 6 L40 14 Z" fill="#BAFF29"/>',
  '<path d="M18 13 L20 7 Q21 5.5 23 5.5 L29 5.5 Q31 5.5 32 7 L34 13 Z" fill="#1a1a1a" opacity="0.35"/>',
  '<circle cx="10" cy="24" r="4.5" fill="#111" stroke="#BAFF29" stroke-width="1.5"/>',
  '<circle cx="10" cy="24" r="2" fill="#333"/>',
  '<circle cx="38" cy="24" r="4.5" fill="#111" stroke="#BAFF29" stroke-width="1.5"/>',
  '<circle cx="38" cy="24" r="2" fill="#333"/>',
  '<rect x="43" y="16" width="3" height="2" rx="1" fill="#fffbe6" opacity="0.9"/>',
  '<rect x="2" y="16" width="3" height="2" rx="1" fill="#ff4444" opacity="0.8"/>',
  '</svg>',
].join('');

const SVG_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG_STRING)}`;

export function CarLogo({ width = 40, height = 24 }: { width?: number; height?: number }) {
  if (Platform.OS !== 'web') {
    // iOS doesn't support SVG data URIs — use a green-badged emoji
    return (
      <View style={{ width, height, borderRadius: 4, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: height * 0.65, lineHeight: height * 0.8 }}>🚗</Text>
      </View>
    );
  }
  return <Image source={{ uri: SVG_URI }} style={{ width, height }} resizeMode="contain" />;
}
