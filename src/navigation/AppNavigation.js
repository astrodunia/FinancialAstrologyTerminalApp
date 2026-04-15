import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Home from '../screens/Home/Home.js';
import LoginScreen from '../screens/LoginScreen';
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
import UpgradeOnWebsite from '../screens/UpgradeOnWebsite/UpgradeOnWebsite';
import PrivacyPolicy from '../screens/PrivacyPolicy/PrivacyPolicy';
import Support from '../screens/Support/Support';
import ForgotPassword from '../screens/ForgotPassword/ForgotPassword';
import Calculators from '../screens/Calculators/Calculators';
import CalculatorTool from '../screens/Calculators/CalculatorTool';
import CalculatorCategoryList from '../screens/Calculators/CalculatorCategoryList';
import StockDetailScreen from '../screens/StockDetail/StockDetailScreen';
import IndexDetailScreen from '../screens/IndexDetail/IndexDetailScreen';
import AppText from '../components/AppText';
import { useUser } from '../store/UserContext';
import SectorDetailScreen from '../screens/SectorDetail/SectorDetailScreen';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();
const BACK_BUTTON_HIDDEN_ROUTES = new Set([
  'Home',
  'Watchlist',
  'Sectors',
  'Portfolio',
  'Overview',
  'GlobalIndices',
  'Plans',
  'Products',
  'ProductDetail',
  'Calculators',
  'CalculatorCategoryList',
  'CalculatorTool',
  'Profile',
  'AboutTerminal',
  'PrivacyPolicy',
  'Support',
  'SectorDetail',
  'StockDetail',
  'IndexDetail',
  'UpgradeOnWebsite',
  'Register',
  'Login',
]);
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
      UpgradeOnWebsite: 'upgrade',
      PrivacyPolicy: 'privacy-policy',
      Support: 'support',
      StockDetail: 's/:symbol/:tab?/:tf?',
    },
  },
};

const AppNavigation = () => {
    const { isHydrating, token, themeColors, entryRoute } = useUser();
    const insets = useSafeAreaInsets();
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [canGoBack, setCanGoBack] = useState(false);
    const [activeRouteName, setActiveRouteName] = useState(entryRoute || (token ? 'Home' : 'Login'));
    const activeRouteNameRef = useRef(null);
    const hideLoadingTimerRef = useRef(null);
    const styles = useMemo(() => createStyles(themeColors), [themeColors]);
    const stopRouteLoading = useCallback((delayMs = 140) => {
      if (hideLoadingTimerRef.current) {
        clearTimeout(hideLoadingTimerRef.current);
      }

      hideLoadingTimerRef.current = setTimeout(() => {
        setIsRouteLoading(false);
      }, delayMs);
    }, []);

    const startRouteLoading = useCallback(() => {
      if (hideLoadingTimerRef.current) {
        clearTimeout(hideLoadingTimerRef.current);
      }

      setIsRouteLoading(true);
    }, []);

    const getActiveRouteName = useCallback((state) => {
      let currentRoute = state?.routes?.[state.index ?? 0];

      while (currentRoute?.state?.routes?.length) {
        const nextState = currentRoute.state;
        currentRoute = nextState.routes[nextState.index ?? 0];
      }

      return currentRoute?.name || null;
    }, []);

    const handleNavigationStateChange = useCallback(
      (state) => {
        const nextRouteName = getActiveRouteName(state);

        if (activeRouteNameRef.current && nextRouteName && nextRouteName !== activeRouteNameRef.current) {
          startRouteLoading();
          stopRouteLoading(260);
        }

        activeRouteNameRef.current = nextRouteName;
        setActiveRouteName(nextRouteName);
        setCanGoBack(navigationRef.canGoBack());
      },
      [getActiveRouteName, startRouteLoading, stopRouteLoading],
    );

    const stackScreenListeners = useMemo(
      () => ({
        transitionStart: () => {
          startRouteLoading();
          stopRouteLoading(900);
        },
        transitionEnd: () => stopRouteLoading(120),
      }),
      [startRouteLoading, stopRouteLoading],
    );

    useEffect(() => {
      return () => {
        if (hideLoadingTimerRef.current) {
          clearTimeout(hideLoadingTimerRef.current);
        }
      };
    }, []);

    if (isHydrating) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={themeColors.textPrimary} />
          <AppText style={styles.loaderText}>Restoring session...</AppText>
        </View>
      );
    }

    return (
       <View style={styles.appRoot}>
       <NavigationContainer
         ref={navigationRef}
         linking={linking}
         onReady={() => {
           const initialRouteName = entryRoute || (token ? 'Home' : 'Login');
           activeRouteNameRef.current = initialRouteName;
           setActiveRouteName(initialRouteName);
           setIsRouteLoading(false);
           setCanGoBack(navigationRef.canGoBack());
         }}
        onStateChange={handleNavigationStateChange}
      >
          <Stack.Navigator
            key={token ? 'app-stack' : 'auth-stack'}
            initialRouteName={token ? (entryRoute === 'Plans' ? 'Plans' : 'Home') : 'Login'}
            screenOptions={{ headerShown: false, animation: 'none' }}
            screenListeners={stackScreenListeners}
          >
            {token ? (
              <>
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="Plans" component={Plans} />
                <Stack.Screen name="UpgradeOnWebsite" component={UpgradeOnWebsite} />
                <Stack.Screen name="Watchlist" component={Watchlist} />
                <Stack.Screen name="Sectors" component={Sectors} />
                <Stack.Screen name="Portfolio" component={Portfolio} />
                <Stack.Screen name="Overview" component={Overview} />
                <Stack.Screen name="Calculators" component={Calculators} />
                <Stack.Screen name="CalculatorTool" component={CalculatorTool} />
                <Stack.Screen name="CalculatorCategoryList" component={CalculatorCategoryList} />
                <Stack.Screen name="GlobalIndices" component={GlobalIndices} />
                <Stack.Screen name="Profile" component={Profile} />
                <Stack.Screen name="Products" component={Products} />
                <Stack.Screen name="ProductDetail" component={ProductDetail} />
                <Stack.Screen name="AboutTerminal" component={AboutTerminal} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
                <Stack.Screen name="Support" component={Support} />

                <Stack.Screen name="SectorDetail" component={SectorDetailScreen} />
                <Stack.Screen name="StockDetail" component={StockDetailScreen} />
                <Stack.Screen name="IndexDetail" component={IndexDetailScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={Register} />
                <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
              </>
            )}
          </Stack.Navigator>
       </NavigationContainer>
       {canGoBack && !BACK_BUTTON_HIDDEN_ROUTES.has(activeRouteName) ? (
         <View style={[styles.backButtonWrap, { top: insets.top + 4 }]} pointerEvents="box-none">
          <Pressable
            style={styles.backButton}
            onPress={() => navigationRef.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color={themeColors.textPrimary} />
          </Pressable>
        </View>
      ) : null}
       {isRouteLoading ? (
         <View style={styles.routeLoaderOverlay} pointerEvents="auto">
           <View style={styles.routeLoaderCard}>
             <ActivityIndicator size="small" color={themeColors.textPrimary} />
             <AppText style={styles.routeLoaderText}>Loading page...</AppText>
           </View>
         </View>
       ) : null}
       </View>
    );
};

const createStyles = (colors) =>
  StyleSheet.create({
    appRoot: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
    routeLoaderOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      elevation: 9999,
    },
    backButtonWrap: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 9000,
      elevation: 9000,
      pointerEvents: 'box-none',
    },
    backButton: {
      alignSelf: 'flex-start',
      width: 44,
      height: 44,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      alignItems: 'center',
      justifyContent: 'center',
    },
    routeLoaderCard: {
      minWidth: 132,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      alignItems: 'center',
      gap: 10,
    },
    routeLoaderText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
  });

export default AppNavigation;
