import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';
import AppHeader from '../components/AppHeader';

const MonitoringScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <AppHeader title="Surveillance" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});

export default MonitoringScreen;
