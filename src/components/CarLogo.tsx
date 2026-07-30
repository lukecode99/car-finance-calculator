import React from 'react';
import { Image, StyleProp, ImageStyle } from 'react-native';

// The app mark — same car-with-a-£ as the launcher icon, minus its dark tile so
// it sits on whatever surface it's dropped onto. PNG rather than SVG on purpose:
// react-native-svg is a native dependency and this is the only vector in the app.
export function CarLogo({ width = 40, height = 24, style }: { width?: number; height?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={require('../../assets/logo-mark.png')}
      style={[{ width, height }, style]}
      resizeMode="contain"
      accessible={false}
    />
  );
}
