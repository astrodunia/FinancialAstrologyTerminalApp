import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Globe, Search, Sparkles, UserCircle2 } from 'lucide-react-native';
import AppText from './AppText';
import AppTextInput from './AppTextInput';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const createStyles = (colors) =>
  StyleSheet.create({
    header: {
      marginTop: 0,
      marginHorizontal: 0,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 16,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass || colors.surface,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
      gap: 12,
    },

    glowTop: {
      position: 'absolute',
      top: -24,
      right: -10,
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.accent,
      opacity: 0.07,
    },

    glowBottom: {
      position: 'absolute',
      bottom: -28,
      left: -18,
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.positive,
      opacity: 0.04,
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },

    leftBlock: {
      flex: 1,
      minWidth: 0,
      gap: 6,
    },

    topLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: 'flex-start',
    },

    badgeText: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.textMuted,
      fontFamily: FONT.medium,
    },

    name: {
      fontSize: 20,
      lineHeight: 24,
      color: colors.textPrimary,
      fontFamily: FONT.extraBold,
    },

    meta: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },

    profileButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchBar: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 0,
      fontSize: 12,
      color: colors.textPrimary,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    secondaryButtonText: {
      fontSize: 11,
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },
  });

export default function HomeHeader({
  themeColors,
  profileName,
  searchQuery,
  onChangeSearchQuery,
  onPressProfile,
  onPressGlobalIndices,
}) {
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const displayName = profileName || 'Trader';

  return (
    <View style={styles.header}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.topRow}>
        <View style={styles.leftBlock}>
          <View style={styles.topLine}>
            <View style={styles.badge}>
              <Sparkles size={11} color={themeColors.accent} />
            </View>
          </View>

          <AppText numberOfLines={1} style={styles.name}>
            Hi, {displayName}
          </AppText>

          <AppText numberOfLines={1} style={styles.meta}>Live market overview</AppText>
        </View>

        <Pressable style={styles.profileButton} onPress={onPressProfile}>
          <UserCircle2 size={18} color={themeColors.background} />
        </Pressable>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.searchBar}>
          <Search size={15} color={themeColors.textMuted} />
          <AppTextInput
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
            placeholder="Search top 20 stocks"
            placeholderTextColor={themeColors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <Pressable style={styles.secondaryButton} onPress={onPressGlobalIndices}>
          <Globe size={15} color={themeColors.textPrimary} />
          <AppText style={styles.secondaryButtonText}>Indices</AppText>
        </Pressable>
      </View>
    </View>
  );
}
