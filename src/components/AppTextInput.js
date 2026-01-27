import React from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

function AppTextInput({ style, ...props }) {
  return <TextInput {...props} style={[styles.base, style]} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FONT.regular,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
    ...Platform.select({ android: { fontWeight: '400' }, ios: { fontWeight: '400' } }),
  },
});

export default AppTextInput;
