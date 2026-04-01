import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useUser } from '../store/UserContext';

const FONT = {
  regular: 'NotoSans-Regular',
  semiBold: 'NotoSans-SemiBold',
};

const getDangerSurface = (theme) =>
  theme === 'dark' ? 'rgba(240, 140, 140, 0.16)' : 'rgba(207, 63, 88, 0.10)';

const getDangerBorder = (theme) =>
  theme === 'dark' ? 'rgba(240, 140, 140, 0.22)' : 'rgba(207, 63, 88, 0.18)';

export default function DialogX({
  visible,
  title,
  message,
  actions = [],
  onRequestClose,
  tone = 'default',
  icon: Icon,
}) {
  const { theme, themeColors } = useUser();
  const styles = useMemo(() => createStyles(themeColors, theme), [themeColors, theme]);

  const accentColor = tone === 'danger' ? themeColors.negative : themeColors.accent;
  const iconSurface = tone === 'danger' ? getDangerSurface(theme) : themeColors.surfaceAlt;
  const iconBorder = tone === 'danger' ? getDangerBorder(theme) : themeColors.border;
  const primaryTextColor = theme === 'dark' ? '#0B0B0C' : '#FFFFFF';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onRequestClose} />

        <View style={styles.dialogCard}>
          {(Icon || title || message) && (
            <View style={styles.header}>
              {Icon ? (
                <View style={[styles.iconWrap, { backgroundColor: iconSurface, borderColor: iconBorder }]}>
                  <Icon size={18} color={accentColor} />
                </View>
              ) : null}
              {!!title && <Text style={styles.title}>{title}</Text>}
              {!!message && <Text style={styles.message}>{message}</Text>}
            </View>
          )}

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
                  ? [styles.actionButtonText, { color: primaryTextColor }]
                  : variant === 'danger'
                  ? [styles.actionButtonText, { color: themeColors.negative }]
                  : [styles.actionButtonText, { color: themeColors.textPrimary }];

              return (
                <Pressable
                  key={`${action.label}-${index}`}
                  style={({ pressed }) => [buttonStyle, pressed && styles.actionButtonPressed]}
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

const createStyles = (colors, theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme === 'dark' ? 'rgba(3, 6, 12, 0.64)' : 'rgba(10, 18, 32, 0.34)',
    },
    dialogCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOpacity: theme === 'dark' ? 0.28 : 0.14,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 12,
    },
    header: {
      paddingHorizontal: 22,
      paddingTop: 22,
      paddingBottom: 18,
      gap: 10,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    title: {
      fontFamily: FONT.semiBold,
      color: colors.textPrimary,
      fontSize: 18,
      lineHeight: 24,
      includeFontPadding: false,
    },
    message: {
      fontFamily: FONT.regular,
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
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
      minHeight: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderWidth: 1,
    },
    actionButtonPrimary: {
      borderColor: 'transparent',
    },
    actionButtonGhost: {
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    actionButtonDanger: {
      borderColor: getDangerBorder(theme),
      backgroundColor: getDangerSurface(theme),
    },
    actionButtonPressed: {
      opacity: 0.88,
    },
    actionButtonText: {
      fontFamily: FONT.semiBold,
      fontSize: 14,
      includeFontPadding: false,
    },
  });
