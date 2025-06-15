import { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default async function onBackgroundEvent({ type, detail }: any) {
    if (type === EventType.PRESS && detail.notification?.id) {
        // console.log('📥 Headless Task Çalıştı! Bildirim ID:', detail.notification);
        await AsyncStorage.setItem('last_msg_id', detail.notification.data.msgId);
    }
}
