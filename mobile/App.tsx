import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DrawerProvider } from './src/contexts/DrawerContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import { api } from './src/services/api';
import { simStore } from './src/services/simStore';

type AppState = 'onboarding' | 'auth' | 'register' | 'otp-verify' | 'main';

const AppContent: React.FC = () => {
  const { colors, mode } = useTheme();
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [userProfile, setUserProfile] = useState<{ phone?: string; whatsapp_number?: string } | undefined>();

  useEffect(() => {
    simStore.loadSims();
    const unsubscribe = api.onLogout(() => {
      setAppState('auth');
      setUserProfile(undefined);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (appState === 'main') {
      api.getProfile()
        .then((profile) => setUserProfile(profile))
        .catch(() => {});
    }
  }, [appState]);

  const renderScreen = () => {
    switch (appState) {
      case 'onboarding':
        return <OnboardingScreen onComplete={() => setAppState('auth')} />;
      case 'register':
        return (
          <RegisterScreen
            onBack={() => setAppState('auth')}
            onSuccess={() => setAppState('auth')}
            onWhatsappRegister={(number: string) => {
              setWhatsappNumber(number);
              setAppState('otp-verify');
            }}
          />
        );
      case 'otp-verify':
        return (
          <OTPVerificationScreen
            whatsappNumber={whatsappNumber}
            onBack={() => setAppState('register')}
            onVerified={() => setAppState('main')}
          />
        );
      case 'auth':
        return (
          <AuthScreen
            onLogin={() => setAppState('main')}
            onRegister={() => setAppState('register')}
          />
        );
      case 'main':
        return (
          <DrawerProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </DrawerProvider>
        );
    }
  };

  return (
    <>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {renderScreen()}
    </>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
