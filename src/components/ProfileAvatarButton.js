import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { UserCircle2 } from 'lucide-react-native';
import AppText from './AppText';
import { useUser } from '../store/UserContext';

const makeInitials = (name = '', email = '') => {
  const source = (name || email || 'U').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function ProfileAvatarButton({
  onPress,
  size = 38,
  variant = 'surface',
  style,
}) {
  const { themeColors, user, profileImageUrl } = useUser();
  const styles = useMemo(() => createStyles(themeColors, size, variant), [themeColors, size, variant]);
  const initials = makeInitials(user?.displayName || user?.name, user?.email);
  const iconColor = variant === 'accent' ? themeColors.background : themeColors.textPrimary;

  return (
    <Pressable style={[styles.button, style]} onPress={onPress}>
      {profileImageUrl ? (
        <Image source={{ uri: profileImageUrl }} style={styles.image} />
      ) : variant === 'accent' ? (
        <View style={styles.initialsWrap}>
          <AppText style={styles.initialsAccent}>{initials}</AppText>
        </View>
      ) : (
        <View style={styles.fallbackWrap}>
          <UserCircle2 size={Math.max(16, Math.round(size * 0.46))} color={iconColor} />
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (colors, size, variant) =>
  StyleSheet.create({
    button: {
      width: size,
      height: size,
      borderRadius: Math.round(size / 2),
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: variant === 'accent' ? colors.accent : colors.border,
      backgroundColor: variant === 'accent' ? colors.accent : colors.surfaceAlt,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    fallbackWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsAccent: {
      color: colors.background,
      fontSize: Math.max(12, Math.round(size * 0.28)),
    },
  });
