import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DrawerProvider } from './src/contexts/DrawerContext';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import { colors } from './src/constants/theme';
import { api } from './src/services/api';

const App: React.FC = () => {
  const [appState, setAppState] = useState<
    'onboarding' | 'auth' | 'register' | 'otp-verify' | 'main'
  >('onboarding');

  useEffect(() => {
    const unsubscribe = api.onLogout(() => {
      setAppState('auth');
    });
    return unsubscribe;
  }, []);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  if (appState === 'onboarding') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <OnboardingScreen onComplete={() => setAppState('auth')} />
      </>
    );
  }

  if (appState === 'register') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <RegisterScreen
          onBack={() => setAppState('auth')}
          onSuccess={() => setAppState('auth')}
          onWhatsappRegister={(number) => {
            setWhatsappNumber(number);
            setAppState('otp-verify');
          }}
        />
      </>
    );
  }

  if (appState === 'otp-verify') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <OTPVerificationScreen
          whatsappNumber={whatsappNumber}
          onBack={() => setAppState('register')}
          onVerified={() => setAppState('main')}
        />
      </>
    );
  }

  if (appState === 'auth') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <AuthScreen
          onLogin={() => setAppState('main')}
          onRegister={() => setAppState('register')}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <DrawerProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </DrawerProvider>
    </>
  );
};

export default App;
