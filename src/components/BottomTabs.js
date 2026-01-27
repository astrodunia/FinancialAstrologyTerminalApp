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

const COLORS = {
  background: '#0B0B0C',
  surfaceAlt: '#1A1B20',
  textPrimary: '#FFFFFF',
  textMuted: '#B7BDC8',
  border: 'rgba(255, 255, 255, 0.08)',
};

const TABS = [
  { label: 'Home', route: 'Home', icon: HomeIcon },
  { label: 'Watchlist', route: 'Watchlist', icon: ClipboardList },
  { label: 'Sectors', route: 'Sectors', icon: LayoutGrid },
  { label: 'Portfolio', route: 'Portfolio', icon: Briefcase },
  { label: 'Overview', route: 'Overview', icon: Globe },
];

const BottomTabs = ({ activeRoute, navigation }) => {
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
            <Icon size={18} color={active ? COLORS.textPrimary : COLORS.textMuted} />
            <AppText style={active ? styles.footerLabelActive : styles.footerLabel}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    height: 68,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: 'rgba(12, 14, 20, 0.85)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerItem: {
    alignItems: 'center',
    gap: 4,
  },
  footerLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  footerLabelActive: {
    color: COLORS.textPrimary,
    fontSize: 10,
  },
});

export default BottomTabs;
