import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.hero}>
        <Text style={styles.kicker}>HOME</Text>
        <Text style={styles.title}>Financial Astrology Terminal</Text>
        <Text style={styles.subtitle}>
          Market rhythms, cosmic timing, and clean signals in one place.
        </Text>
      </View>
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today’s Alignment</Text>
          <Text style={styles.cardBody}>
            Track planetary aspects that may influence volatility.
          </Text>
        </View>
        <View style={styles.cardAccent}>
          <Text style={styles.cardTitle}>Signal Console</Text>
          <Text style={styles.cardBody}>
            Blend price action with celestial cycles.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0E1116',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  hero: {
    marginTop: 16,
  },
  kicker: {
    color: '#8FA3B8',
    letterSpacing: 2,
    fontSize: 12,
    fontFamily: 'AvenirNext-DemiBold',
  },
  title: {
    color: '#F7F3EE',
    fontSize: 36,
    lineHeight: 42,
    marginTop: 12,
    fontFamily: 'AvenirNext-Bold',
  },
  subtitle: {
    color: '#C3CBD6',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 320,
    fontFamily: 'AvenirNext-Regular',
  },
  cardRow: {
    marginTop: 36,
    gap: 16,
  },
  card: {
    backgroundColor: '#171C24',
    borderRadius: 16,
    padding: 18,
  },
  cardAccent: {
    backgroundColor: '#1E2C36',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2C3E4E',
  },
  cardTitle: {
    color: '#F7F3EE',
    fontSize: 18,
    marginBottom: 6,
    fontFamily: 'AvenirNext-DemiBold',
  },
  cardBody: {
    color: '#B8C2CF',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'AvenirNext-Regular',
  },
});

export default App;
