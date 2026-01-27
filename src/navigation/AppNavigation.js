import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/Home/Home';
import Login from '../screens/Login/Login';
import Register from '../screens/Register/Register';
import Watchlist from '../screens/Watchlist/Watchlist';
import Sectors from '../screens/Sectors/Sectors';
import Portfolio from '../screens/Portfolio/Portfolio';
import Overview from '../screens/Overview/Overview';
import GlobalIndices from '../screens/GlobalIndices/GlobalIndices';
import Profile from '../screens/Profile/Profile';
import ForgotPassword from '../screens/ForgotPassword/ForgotPassword';

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
    return (
       <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Watchlist" component={Watchlist} />
          <Stack.Screen name="Sectors" component={Sectors} />
          <Stack.Screen name="Portfolio" component={Portfolio} />
          <Stack.Screen name="Overview" component={Overview} />
          <Stack.Screen name="GlobalIndices" component={GlobalIndices} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </Stack.Navigator>
       </NavigationContainer>
    );
};

export default AppNavigation;
