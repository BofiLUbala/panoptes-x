import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';

const App: React.FC = () => {
  const [appState, setAppState] = useState<
    'onboarding' | 'auth' | 'register' | 'otp-verify' | 'main'
  >('onboarding');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  if (appState === 'onboarding') {
    return <OnboardingScreen onComplete={() => setAppState('auth')} />;
  }

  if (appState === 'register') {
    return (
      <RegisterScreen
        onBack={() => setAppState('auth')}
        onSuccess={() => setAppState('auth')}
        onWhatsappRegister={(number) => {
          setWhatsappNumber(number);
          setAppState('otp-verify');
        }}
      />
    );
  }

  if (appState === 'otp-verify') {
    return (
      <OTPVerificationScreen
        whatsappNumber={whatsappNumber}
        onBack={() => setAppState('register')}
        onVerified={() => setAppState('main')}
      />
    );
  }

  if (appState === 'auth') {
    return (
      <AuthScreen
        onLogin={() => setAppState('main')}
        onRegister={() => setAppState('register')}
      />
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;
