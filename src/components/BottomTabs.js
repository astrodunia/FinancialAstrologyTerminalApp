import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Briefcase,
  ClipboardList,
  Globe,
  Home as HomeIcon,
  LayoutGrid,
} from 'lucide-react-native';
import AppText from './AppText';
import { useUser } from '../store/UserContext';

const TABS = [
  { label: 'Home', route: 'Home', icon: HomeIcon },
  { label: 'Watchlist', route: 'Watchlist', icon: ClipboardList },
  { label: 'Sectors', route: 'Sectors', icon: LayoutGrid },
  { label: 'Portfolio', route: 'Portfolio', icon: Briefcase },
  { label: 'Overview', route: 'Overview', icon: Globe },
];

const BottomTabs = ({ activeRoute, navigation }) => {
  const { themeColors } = useUser();
  const styles = createStyles(themeColors);

  return (
    <View style={styles.footer}>
      {TABS.map((item) => {
        const Icon = item.icon;
        const active = activeRoute === item.route;
        return (
          <Pressable
            key={item.route}
            style={styles.footerItem}
            onPress={() => navigation.navigate(item.route)}
          >
            <Icon size={18} color={active ? themeColors.textPrimary : themeColors.textMuted} />
            <AppText style={active ? styles.footerLabelActive : styles.footerLabel}>{item.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    footer: {
      height: 68,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.tabBarBg,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    footerItem: {
      alignItems: 'center',
      gap: 4,
    },
    footerLabel: {
      color: colors.textMuted,
      fontSize: 10,
    },
    footerLabelActive: {
      color: colors.textPrimary,
      fontSize: 10,
    },
  });

export default BottomTabs;
