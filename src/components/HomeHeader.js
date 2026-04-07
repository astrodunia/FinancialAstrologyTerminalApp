import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Globe, Search, Sparkles } from 'lucide-react-native';
import AppText from './AppText';
import AppTextInput from './AppTextInput';
import ProfileAvatarButton from './ProfileAvatarButton';

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

    searchResultsCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },

    searchResultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },

    searchResultRowFirst: {
      borderTopWidth: 0,
    },

    searchResultMain: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },

    searchResultSymbol: {
      fontSize: 15,
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },

    searchResultName: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },

    searchResultMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      flexShrink: 0,
    },

    searchMetaChip: {
      minWidth: 34,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },

    searchMetaChipText: {
      fontSize: 10,
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },

    searchStateRow: {
      paddingHorizontal: 12,
      paddingVertical: 12,
    },

    searchStateText: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: FONT.medium,
    },

    searchErrorText: {
      fontSize: 11,
      color: colors.negative,
      fontFamily: FONT.medium,
    },
  });

export default function HomeHeader({
  themeColors,
  profileName,
  searchQuery,
  onChangeSearchQuery,
  onPressProfile,
  onPressGlobalIndices,
  searchResults = [],
  searchLoading = false,
  searchError = '',
  showSearchResults = false,
  onPressSearchResult,
  onSubmitSearch,
  searchPlaceholder = 'Search stocks or companies',
}) {
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const displayName = profileName || 'Trader';
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const shouldShowSearchPanel = isSearchFocused && showSearchResults;

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

          <AppText numberOfLines={1} style={styles.name}>{`Hi, ${displayName}`}</AppText>

          <AppText numberOfLines={1} style={styles.meta}>Live market overview</AppText>
        </View>

        <ProfileAvatarButton onPress={onPressProfile} size={38} variant="accent" style={styles.profileButton} />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.searchBar}>
          <Search size={15} color={themeColors.textMuted} />
          <AppTextInput
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
            onFocus={() => {
              if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
              }
              setIsSearchFocused(true);
            }}
            onBlur={() => {
              blurTimeoutRef.current = setTimeout(() => {
                setIsSearchFocused(false);
              }, 120);
            }}
            onSubmitEditing={() => onSubmitSearch?.()}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={searchPlaceholder}
            placeholderTextColor={themeColors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <Pressable style={styles.secondaryButton} onPress={onPressGlobalIndices}>
          <Globe size={15} color={themeColors.textPrimary} />
          <AppText style={styles.secondaryButtonText}>Indices</AppText>
        </Pressable>
      </View>

      {shouldShowSearchPanel ? (
        <View style={styles.searchResultsCard}>
          {searchLoading ? (
            <View style={styles.searchStateRow}>
              <AppText style={styles.searchStateText}>Loading...</AppText>
            </View>
          ) : null}

          {!searchLoading && searchError ? (
            <View style={styles.searchStateRow}>
              <AppText style={styles.searchErrorText}>{searchError}</AppText>
            </View>
          ) : null}

          {!searchLoading && !searchError && !searchResults.length ? (
            <View style={styles.searchStateRow}>
              <AppText style={styles.searchStateText}>No matches found</AppText>
            </View>
          ) : null}

          {!searchLoading && !searchError
            ? searchResults.map((item, index) => (
                <Pressable
                  key={`${item.symbol}-${index}`}
                  style={[styles.searchResultRow, index === 0 && styles.searchResultRowFirst]}
                  onPress={() => {
                    setIsSearchFocused(false);
                    onPressSearchResult?.(item);
                  }}
                >
                  <View style={styles.searchResultMain}>
                    <AppText style={styles.searchResultSymbol}>{item.symbol}</AppText>
                    <AppText style={styles.searchResultName} numberOfLines={1}>
                      {item.name || item.exchange || item.type || 'Open ticker'}
                    </AppText>
                  </View>

                  <View style={styles.searchResultMeta}>
                    {item.type ? (
                      <View style={styles.searchMetaChip}>
                        <AppText style={styles.searchMetaChipText}>{item.type}</AppText>
                      </View>
                    ) : null}
                    {item.exchange ? (
                      <View style={styles.searchMetaChip}>
                        <AppText style={styles.searchMetaChipText}>{item.exchange}</AppText>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}
