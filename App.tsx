import React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';

export default function App() {
  async function onDisplayNotification() {
    await notifee.requestPermission();

    await notifee.displayNotification({
      title: 'Test Bildirimi',
      body: 'Buna tıklarsan headless task çalışmalı!',
      android: {
        channelId: await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
        }),
        pressAction: {
          id: 'default',
        },
      },
    });
  }

  return (
    <View style={styles.container}>
      <Button title="Bildirimi Göster" onPress={onDisplayNotification} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
