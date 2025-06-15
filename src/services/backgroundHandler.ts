import { EventType } from '@notifee/react-native';

export default async function onBackgroundEvent({ type, detail }: any) {
    console.log('detail.notification?.id', detail.notification?.id);
    if (type === EventType.PRESS && detail.notification?.id) {
        console.log('📥 Headless Task Çalıştı! Bildirim ID:', detail.notification.id);
    }
}
