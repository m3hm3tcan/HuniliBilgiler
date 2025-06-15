import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

enableScreens(); // Performans için önerilir

import React, { useEffect, useState } from 'react';
import notifee, { EventType } from '@notifee/react-native';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './src/types/types';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { kaydetGosterilenMesaj, setupNotificationListeners } from './src/services/notification';
import { Messages } from './src/data/messages';


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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<typeof Messages[0] | null>(null);


  useEffect(() => {
    async function requestPermissionHere() {

      await notifee.requestPermission();
    }
    requestPermissionHere();
    setupNotificationListeners();

    // Foreground tıklamaları için
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      // console.log('detail.notification', detail.notification)
      if (type === EventType.PRESS && detail.notification?.id) {
        // console.log('📱 Bildirim tıklandı, notification.id:', detail.notification.id);
        // AsyncStorage'a kaydedelim
        await AsyncStorage.setItem('last_msg_id', String(detail.notification.data?.msgId || ''));
      }
    });

    // Uygulama açıldığında kaydedilmiş mesaj id'si varsa logla
    (async () => {
      const lastMsgId = await AsyncStorage.getItem('last_msg_id');
      if (lastMsgId) {
        console.log('Uygulama açıldı, son okunan mesaj id:', lastMsgId);


        const message = Messages.find(m => m.id === lastMsgId);
        if (message) {
          setSelectedMessage(message);
          setModalVisible(true);
        }

        // Burada modal açabilir veya kullanıcıyı yönlendirebilirsin
        await kaydetGosterilenMesaj(lastMsgId);
        // Sonrasında temizlemek için:
        await AsyncStorage.removeItem('last_msg_id');
      }
    })();

    return () => unsubscribe();
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
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {selectedMessage && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Kategori: {selectedMessage.category}</Text>
              <Text style={styles.modalText}>{selectedMessage.tr}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
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
