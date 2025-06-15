import notifee, {
  TimestampTrigger,
  TriggerType,
  EventType,
} from '@notifee/react-native';
import { Messages } from '../data/messages';
import { Categories } from '../data/categories';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SURE_GUN = 7;
const OKUNANLAR_KEY = 'shown_message_ids_v1';
const BILDIRIM_MAP_KEY = 'bildirim_id_map_v1';

export interface UserSettings {
  language: 'tr' | 'en';
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  categories: string[];
}

function getNotificationTimeForDay(dayOffset: number, start: string, end: string): Date {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  const rangeMinutes = endTotalMinutes >= startTotalMinutes
    ? endTotalMinutes - startTotalMinutes
    : (24 * 60 - startTotalMinutes) + endTotalMinutes;

  const randomOffset = Math.floor(Math.random() * (rangeMinutes + 1));

  let totalMinutes = startTotalMinutes + randomOffset;
  if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
  }

  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

  return date;
}

export async function getOkunmayanMesajlar(): Promise<typeof Messages> {
  try {
    const okunanRaw = await AsyncStorage.getItem(OKUNANLAR_KEY);
    const okunanIds: string[] = okunanRaw ? JSON.parse(okunanRaw) : [];

    return Messages.filter((msg) => msg.id && !okunanIds.includes(msg.id));
  } catch (error) {
    console.error('Okunmamış mesajlar alınamadı', error);
    return Messages;
  }
}

export async function kaydetGosterilenMesaj(id: string) {
  try {
    const mevcutRaw = await AsyncStorage.getItem(OKUNANLAR_KEY);
    const mevcut: string[] = mevcutRaw ? JSON.parse(mevcutRaw) : [];
    console.log('gosterline mesaj IDleri ', mevcut);
    if (!mevcut.includes(id)) {
      const guncel = [...mevcut, id];
      console.log('guncel mesaj IDleri ', guncel);
      await AsyncStorage.setItem(OKUNANLAR_KEY, JSON.stringify(guncel));
    }
  } catch (e) {
    console.error('Mesaj ID kaydedilemedi', e);
  }
}

// Bildirim id → mesaj id map'i kaydetmek için yardımcı fonksiyon
async function kaydetBildirimIdMap(map: Record<string, string>) {
  await AsyncStorage.setItem(BILDIRIM_MAP_KEY, JSON.stringify(map));
}

// Bildirim id’den mesaj id bulup kaydeden fonksiyon
export async function kaydetGosterilenMesajFromNotifId(notifId: string) {
  try {
    const rawMap = await AsyncStorage.getItem(BILDIRIM_MAP_KEY);
    if (!rawMap) return;
    const map: Record<string, string> = JSON.parse(rawMap);
    const mesajId = map[notifId];
    if (mesajId) {
      await kaydetGosterilenMesaj(mesajId);
    }
  } catch (e) {
    console.error('Bildirim ID’den mesaj ID bulunamadı', e);
  }
}

export async function planla30GunlukBildirimler(
  settings: UserSettings,
): Promise<void> {
  await notifee.requestPermission();

  const channelId = await notifee.createChannel({
    id: 'gunluk-mesajlar',
    name: 'Günlük Mesajlar',
  });

  const gosterilenRaw = await AsyncStorage.getItem(OKUNANLAR_KEY);
  const gosterilenIDs: string[] = gosterilenRaw ? JSON.parse(gosterilenRaw) : [];

  const filteredMessages = Messages.filter(msg =>
    msg.id !== undefined &&
    settings.categories.includes(msg.categoryId || '') &&
    !gosterilenIDs.includes(msg.id)
  );

  const messagesPool = filteredMessages.length > 0 ? filteredMessages : Messages;

  const usedIndices = new Set<number>();
  const bildirimMap: Record<string, string> = {};

  for (let i = 0; i < SURE_GUN; i++) {
    const date = getNotificationTimeForDay(i, settings.startTime, settings.endTime);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    if (usedIndices.size === messagesPool.length) {
      usedIndices.clear();
    }

    let msgIndex: number;
    do {
      msgIndex = Math.floor(Math.random() * messagesPool.length);
    } while (usedIndices.has(msgIndex));
    usedIndices.add(msgIndex);

    const mesaj = messagesPool[msgIndex];
    const categoryName =
      Categories.find((c) => c.id === mesaj.categoryId)?.tr || mesaj.categoryId;


    const body =
      i === SURE_GUN - 1
        ? settings.language === 'tr'
          ? 'Bildirim almaya devam etmek için lütfen uygulamayı aç!'
          : 'To continue receiving notifications, please open the app!'
        : mesaj[settings.language];

    const notifId = `gunluk-${i}`;
    bildirimMap[notifId] = mesaj.id!;

    console.log(`Planlanan mesaj ${notifId} - #${mesaj.id} - Kategori: ${categoryName} - Tarih: ${date.toLocaleString()}`);

    await notifee.createTriggerNotification(
      {
        id: notifId,
        title: `#${mesaj.id} • ${categoryName}`,
        body,
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
        },
        data: { msgId: mesaj.id! },     // ⭐ mesaj id’sini payload’a koy
      },
      trigger,
    );
  }

  await kaydetBildirimIdMap(bildirimMap);
}

/**
 * Uygulama açıldığında veya uygun yerde çağır,
 * Bildirim eventlerini dinleyerek tıklama veya gösterilme durumunda mesaj id kaydeder.
 */
let foregroundListenerSet = false;

export function setupNotificationListeners() {
  if (foregroundListenerSet) return;
  foregroundListenerSet = true;

  notifee.onForegroundEvent(async ({ type, detail }) => {
    if (!detail.notification?.id) return;
    if (type === EventType.PRESS) {
      console.log('📱 Ön planda tıklama', detail.notification.id);
      await kaydetGosterilenMesajFromNotifId(detail.notification.id);
    }
  });
}

export async function uygulamaAcildi(): Promise<void> {
  const ids = await notifee.getTriggerNotificationIds();
  for (const id of ids) {
    console.log('canceled ids', id);
    await notifee.cancelNotification(id);
  }

  const kayitliSettingsRaw = await AsyncStorage.getItem('user_settings_v1');
  const kayitliSettings: UserSettings = kayitliSettingsRaw
    ? JSON.parse(kayitliSettingsRaw)
    : {
      language: 'tr',
      startTime: '09:00',
      endTime: '18:00',
      categories: [],
    };

  await planla30GunlukBildirimler(kayitliSettings);
}

export async function temizleGosterilenMesajlar() {
  await AsyncStorage.removeItem(OKUNANLAR_KEY);
  await AsyncStorage.removeItem(BILDIRIM_MAP_KEY);
}
