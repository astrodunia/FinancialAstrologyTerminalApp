import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

function GradientBackground({ children }) {
  return (
    <View style={styles.container}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#07090F" />
            <Stop offset="35%" stopColor="#0F1420" />
            <Stop offset="70%" stopColor="#0A0D14" />
            <Stop offset="100%" stopColor="#050608" />
          </LinearGradient>
          <LinearGradient id="glowLeft" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#3A4E7A" stopOpacity="0.55" />
            <Stop offset="55%" stopColor="#1B253B" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="glowRight" x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#6B4D91" stopOpacity="0.45" />
            <Stop offset="60%" stopColor="#251A3B" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <Stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.02" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
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
