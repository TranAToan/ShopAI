import React from 'react';
import { StatusBar, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <Text style={styles.brand}>ShopAI</Text>
        <Text style={styles.subtitle}>Environment is ready</Text>
        <Text style={styles.hint}>
          Edit this text, save the file, and check Fast Refresh.
        </Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    padding: 24,
  },
  brand: { color: '#FF4D4F', fontSize: 36, fontWeight: '800' },
  hint: { color: '#95A5A6', fontSize: 12, marginTop: 24, textAlign: 'center' },
  subtitle: { color: '#7F8C8D', fontSize: 16, marginTop: 8 },
});

export default App;
