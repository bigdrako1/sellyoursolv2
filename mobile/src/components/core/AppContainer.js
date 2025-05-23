/**
 * App Container Component
 * 
 * This component serves as the main container for the mobile app.
 */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';

import AppNavigator from '../../navigation/AppNavigator';
import AuthNavigator from '../../navigation/AuthNavigator';
import { loadToken } from '../../store/actions/authActions';
import { useColorScheme } from 'react-native';
import { colors } from '../../styles/colors';

const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    error: colors.error,
  },
};

const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primaryDark,
    accent: colors.accentDark,
    background: colors.backgroundDark,
    surface: colors.surfaceDark,
    text: colors.textDark,
    error: colors.errorDark,
  },
};

const AppContainer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useSelector(state => state.auth.token !== null);
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    // Load token from secure storage
    const loadTokenAsync = async () => {
      try {
        await dispatch(loadToken());
      } catch (error) {
        console.error('Failed to load token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTokenAsync();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar
          barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <NavigationContainer theme={theme}>
          {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppContainer;
