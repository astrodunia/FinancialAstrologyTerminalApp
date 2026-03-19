import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/Home/Home.js';
import Login from '../screens/Login/Login';
import Register from '../screens/Register/Register';
import Watchlist from '../screens/Watchlist/Watchlist';
import Sectors from '../screens/Sectors/Sectors';
import Portfolio from '../screens/Portfolio/Portfolio';
import Overview from '../screens/Overview/Overview';
import GlobalIndices from '../screens/GlobalIndices/GlobalIndices';
import Profile from '../screens/Profile/Profile';
import ForgotPassword from '../screens/ForgotPassword/ForgotPassword';
import Calculators from '../screens/Calculators/Calculators';
import CalculatorTool from '../screens/Calculators/CalculatorTool';
import StockDetailScreen from '../screens/StockDetail/StockDetailScreen';
import AppText from '../components/AppText';
import { useUser } from '../store/UserContext';

const Stack = createNativeStackNavigator();
const linking = {
  prefixes: ['financialastrology://', 'https://financialastrology.app'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      Home: '',
      Watchlist: 'watchlist',
      Sectors: 'sectors',
      Portfolio: 'portfolio',
      Overview: 'overview',
      GlobalIndices: 'global-indices',
      Profile: 'profile',
      StockDetail: 's/:symbol/:tab?/:tf?',
    },
  },
};

const AppNavigation = () => {
    const { isHydrating, token, themeColors } = useUser();
    const styles = createStyles(themeColors);

    if (isHydrating) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={themeColors.textPrimary} />
          <AppText style={styles.loaderText}>Restoring session...</AppText>
        </View>
      );
    }

    return (
       <NavigationContainer linking={linking}>
          <Stack.Navigator
            key={token ? 'app-stack' : 'auth-stack'}
            screenOptions={{ headerShown: false }}
          >
            {token ? (
              <>
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="Watchlist" component={Watchlist} />
                <Stack.Screen name="Sectors" component={Sectors} />
                <Stack.Screen name="Portfolio" component={Portfolio} />
                <Stack.Screen name="Overview" component={Overview} />
                <Stack.Screen name="Calculators" component={Calculators} />
                <Stack.Screen name="CalculatorTool" component={CalculatorTool} />
                <Stack.Screen name="GlobalIndices" component={GlobalIndices} />
                <Stack.Screen name="Profile" component={Profile} />
                <Stack.Screen name="StockDetail" component={StockDetailScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Register" component={Register} />
                <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
              </>
            )}
          </Stack.Navigator>
       </NavigationContainer>
    );
};

const createStyles = (colors) =>
  StyleSheet.create({
    loaderContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    loaderText: {
      color: colors.textMuted,
      fontSize: 12,
    },
  });

export default AppNavigation;
