import notifee, { AuthorizationStatus } from '@notifee/react-native';

export async function isNotificationPermissionGranted(): Promise<boolean> {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
}

export async function requestNotificationPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
        console.log('Bildirim izni verildi');
    } else {
        console.log('Kullanıcı bildirime izin vermedi');
    }
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
}