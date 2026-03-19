import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  color: string;
  size?: 'small' | 'large';
  style?: StyleProp<ViewStyle>;
};

export default function CardLoadingOverlay({ color, size = 'small', style }: Props) {
  return (
    <View pointerEvents="none" style={[styles.overlay, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
