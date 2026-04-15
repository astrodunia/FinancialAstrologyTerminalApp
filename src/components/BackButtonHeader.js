import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import AppText from './AppText';

const BUTTON_SIZE = 44;

const BackButtonHeader = ({
  onPress,
  colors,
  containerStyle,
  buttonStyle,
  children,
  accessibilityLabel = 'Go back',
  iconSize = 22,
  topOffset = 4,
  showLabel = false,
  label = 'Back',
  labelStyle,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + topOffset,
        },
        containerStyle,
      ]}
    >
      <Pressable
        style={[
          styles.button,
          {
            borderColor: colors.border,
            backgroundColor: colors.surfaceGlass,
          },
          showLabel ? styles.buttonWithLabel : null,
          buttonStyle,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <ArrowLeft size={iconSize} color={colors.textPrimary} />
        {showLabel ? <AppText style={[styles.label, { color: colors.textPrimary }, labelStyle]}>{label}</AppText> : null}
      </Pressable>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    alignSelf: 'flex-start',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWithLabel: {
    width: 'auto',
    minWidth: BUTTON_SIZE,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontSize: 12,
  },
});

export default BackButtonHeader;
