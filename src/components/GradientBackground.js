import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useUser } from '../store/UserContext';

function GradientBackground({ children }) {
  const { theme, themeColors } = useUser();
  const [bg0, bg1, bg2, bg3] = themeColors.gradientStops;
  const [left0, left1] = themeColors.glowLeft;
  const [right0, right1] = themeColors.glowRight;

  return (
    <View style={styles.container}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={bg0} />
            <Stop offset="35%" stopColor={bg1} />
            <Stop offset="70%" stopColor={bg2} />
            <Stop offset="100%" stopColor={bg3} />
          </LinearGradient>
          <LinearGradient id="glowLeft" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={left0} stopOpacity={theme === 'dark' ? '0.55' : '0.38'} />
            <Stop offset="55%" stopColor={left1} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="glowRight" x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={right0} stopOpacity={theme === 'dark' ? '0.45' : '0.32'} />
            <Stop offset="60%" stopColor={right1} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={theme === 'dark' ? '#FFFFFF' : '#0B1F3F'} stopOpacity={theme === 'dark' ? '0.05' : '0.03'} />
            <Stop offset="35%" stopColor={theme === 'dark' ? '#FFFFFF' : '#0B1F3F'} stopOpacity={theme === 'dark' ? '0.02' : '0.015'} />
            <Stop offset="100%" stopColor={theme === 'dark' ? '#FFFFFF' : '#0B1F3F'} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bg)" />
        <Rect width="100%" height="100%" fill="url(#glowLeft)" />
        <Rect width="100%" height="100%" fill="url(#glowRight)" />
        <Rect width="100%" height="100%" fill="url(#mist)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientBackground;
