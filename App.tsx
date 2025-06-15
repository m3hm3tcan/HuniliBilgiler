import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

enableScreens(); // Performans için önerilir

import React, { useEffect, useState } from 'react';
import notifee from '@notifee/react-native';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './src/types/types';
// import SettingsScreen from './src/screens/SettingsScreen';
// import HistoryScreen from './src/screens/HistoryScreen';
import { setupNotificationListeners } from './src/services/notification';


const STORAGE_KEY = 'user_settings_v1';

type SettingsType = {
  language: 'tr' | 'en';
  startTime: string;
  endTime: string;
  categories: string[];
} | null;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [settings, setSettings] = useState<SettingsType | undefined>(undefined);

  useEffect(() => {
    async function requestPermissionHere() {
      await notifee.requestPermission();
    }
    requestPermissionHere();
    setupNotificationListeners();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setSettings(JSON.parse(raw));
        else setSettings(null);
      } catch (e) {
        console.warn('Settings load error', e);
        setSettings(null);
      }
    };

    loadSettings();
  }, []);

  if (settings === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Yükleniyor…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={settings ? 'Home' : 'Onboarding'} // Burada dinamik
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          {/* <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="History" component={HistoryScreen} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});




// import React from 'react';
// import { Button, View, StyleSheet } from 'react-native';
// import notifee, { EventType } from '@notifee/react-native';

// export default function App() {
//   async function onDisplayNotification() {
//     await notifee.requestPermission();


//     await notifee.displayNotification({
//       title: 'Test Bildirimi',
//       body: 'Buna tıklarsan headless task çalışmalı!',
//       android: {
//         channelId: await notifee.createChannel({
//           id: 'default',
//           name: 'Default Channel',
//         }),
//         pressAction: {
//           id: 'default',
//         },
//       },
//     });
//   }

//   return (
//     <View style={styles.container}>
//       <Button title="Bildirimi Göster" onPress={onDisplayNotification} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
// });
