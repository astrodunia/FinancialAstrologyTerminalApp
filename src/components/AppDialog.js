import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useUser } from '../store/UserContext';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

export default function AppDialog({
  visible,
  title,
  message,
  actions = [],
  onRequestClose,
  tone = 'default',
  icon: Icon,
}) {
  const { themeColors } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const accentColor = tone === 'danger' ? themeColors.negative : themeColors.accent;
  const iconSurface = tone === 'danger' ? 'rgba(207, 63, 88, 0.12)' : themeColors.surfaceAlt;
  const iconBorder = tone === 'danger' ? 'transparent' : themeColors.border;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.scrim} />

        <View style={[styles.dialogCard, { borderTopWidth: 4, borderTopColor: accentColor }]}>
          <View style={styles.header}>
            {Icon ? (
              <View style={[styles.iconWrap, { backgroundColor: iconSurface, borderColor: iconBorder }]}>
                <Icon size={18} color={accentColor} />
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
            {!!message && <Text style={styles.message}>{message}</Text>}
          </View>

          <View style={styles.actionsRow}>
            {actions.map((action, index) => {
              const variant = action.variant || (index === actions.length - 1 ? 'primary' : 'ghost');
              const buttonStyle =
                variant === 'primary'
                  ? [styles.actionButton, styles.actionButtonPrimary, { backgroundColor: accentColor }]
                  : variant === 'danger'
                  ? [styles.actionButton, styles.actionButtonDanger]
                  : [styles.actionButton, styles.actionButtonGhost];

              const textStyle =
                variant === 'primary'
                  ? styles.actionButtonTextPrimary
                  : variant === 'danger'
                  ? styles.actionButtonTextDanger
                  : styles.actionButtonTextGhost;

              return (
                <Pressable
                  key={`${action.label}-${index}`}
                  style={buttonStyle}
                  onPress={action.onPress}
                >
                  <Text style={textStyle}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 24,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(7, 10, 18, 0.58)',
    },
    dialogCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    },
    header: {
      paddingHorizontal: 22,
      paddingTop: 22,
      paddingBottom: 18,
      gap: 8,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    title: {
      fontFamily: FONT.semiBold,
      color: colors.textPrimary,
      fontSize: 21,
      lineHeight: 27,
      includeFontPadding: false,
    },
    message: {
      fontFamily: FONT.regular,
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
      includeFontPadding: false,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 22,
      paddingTop: 16,
      paddingBottom: 22,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    actionButtonPrimary: {},
    actionButtonGhost: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    actionButtonDanger: {
      borderWidth: 1,
      borderColor: 'rgba(207, 63, 88, 0.28)',
      backgroundColor: 'rgba(207, 63, 88, 0.10)',
    },
    actionButtonTextPrimary: {
      fontFamily: FONT.semiBold,
      color: '#FFFFFF',
      fontSize: 13,
      includeFontPadding: false,
    },
    actionButtonTextGhost: {
      fontFamily: FONT.semiBold,
      color: colors.textPrimary,
      fontSize: 13,
      includeFontPadding: false,
    },
    actionButtonTextDanger: {
      fontFamily: FONT.semiBold,
      color: colors.negative,
      fontSize: 13,
      includeFontPadding: false,
    },
  });
