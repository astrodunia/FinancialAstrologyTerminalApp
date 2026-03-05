import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { useUser } from '../store/UserContext';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

function AppText({ style, weight = 'regular', ...props }) {
  const { themeColors } = useUser();
  return <Text {...props} style={[styles.base, styles[weight], { color: themeColors.textPrimary }, style]} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FONT.regular,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  regular: {
    fontFamily: FONT.regular,
    ...Platform.select({ android: { fontWeight: '400' }, ios: { fontWeight: '400' } }),
  },
  medium: {
    fontFamily: FONT.medium,
    ...Platform.select({ android: { fontWeight: '500' }, ios: { fontWeight: '500' } }),
  },
  semiBold: {
    fontFamily: FONT.semiBold,
    ...Platform.select({ android: { fontWeight: '600' }, ios: { fontWeight: '600' } }),
  },
  extraBold: {
    fontFamily: FONT.extraBold,
    ...Platform.select({ android: { fontWeight: '800' }, ios: { fontWeight: '800' } }),
  },
});

export default AppText;
