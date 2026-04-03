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
import Products from '../screens/Products/Products';
import ProductDetail from '../screens/ProductDetail/ProductDetail';
import AboutTerminal from '../screens/AboutTerminal/AboutTerminal';
import Plans from '../screens/Plans/Plans';
import PrivacyPolicy from '../screens/PrivacyPolicy/PrivacyPolicy';
import Support from '../screens/Support/Support';
import ForgotPassword from '../screens/ForgotPassword/ForgotPassword';
import Calculators from '../screens/Calculators/Calculators';
import CalculatorTool from '../screens/Calculators/CalculatorTool';
import StockDetailScreen from '../screens/StockDetail/StockDetailScreen';
import IndexDetailScreen from '../screens/IndexDetail/IndexDetailScreen';
import AppText from '../components/AppText';
import { useUser } from '../store/UserContext';
import SectorDetailScreen from '../screens/SectorDetail/SectorDetailScreen';

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
      IndexDetail: 'i/:symbol/:tf?',
      Profile: 'profile',
      Products: 'products',
      ProductDetail: 'products/:productId',
      AboutTerminal: 'about-terminal',
      Plans: 'plans',
      PrivacyPolicy: 'privacy-policy',
      Support: 'support',
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
            screenOptions={{ headerShown: false, animation: 'none' }}
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
                <Stack.Screen name="Products" component={Products} />
                <Stack.Screen name="ProductDetail" component={ProductDetail} />
                <Stack.Screen name="AboutTerminal" component={AboutTerminal} />
                <Stack.Screen name="Plans" component={Plans} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
                <Stack.Screen name="Support" component={Support} />

                <Stack.Screen name="SectorDetail" component={SectorDetailScreen} />
                <Stack.Screen name="StockDetail" component={StockDetailScreen} />
                <Stack.Screen name="IndexDetail" component={IndexDetailScreen} />
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
