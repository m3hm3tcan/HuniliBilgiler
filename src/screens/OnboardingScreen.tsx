import React, { useState, useMemo, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { Categories } from '../data/categories';
import { planla30GunlukBildirimler } from '../services/notification';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/types';
import {
    isNotificationPermissionGranted,
    requestNotificationPermission,
} from '../services/permissions';

const STORAGE_KEY = 'user_settings_v1';

export default function OnboardingScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    /* ---------- izin durumu ---------- */
    const [permChecked, setPermChecked] = useState(false);
    const [permGranted, setPermGranted] = useState<boolean | null>(null);

    useEffect(() => {
        (async () => {
            const granted = await isNotificationPermissionGranted();
            setPermGranted(granted);
            setPermChecked(true);
        })();
    }, []);

    const askPermission = async () => {
        const granted = await requestNotificationPermission();
        setPermGranted(granted);
    };

    /* ---------- onboarding state ---------- */
    const [language, setLanguage] = useState<'tr' | 'en'>('tr');
    const categoryIds = useMemo(() => Categories.map((c) => c.id), []);
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [startTime, setStartTime] = useState(() => {
        const d = new Date(); d.setHours(9, 0, 0, 0); return d;
    });
    const [endTime, setEndTime] = useState(() => {
        const d = new Date(); d.setHours(18, 0, 0, 0); return d;
    });
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);

    const toggleCat = (id: string) =>
        setSelectedCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

    const saveAndGoHome = async () => {
        const fmt = (d: Date) =>
            d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');

        const settings = {
            language,
            startTime: fmt(startTime),
            endTime: fmt(endTime),
            categories: selectedCats.length ? selectedCats : categoryIds,
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        await planla30GunlukBildirimler(settings);
        navigation.replace('Home');
    };

    /* ---------- EKRAN SEÇİMİ ---------- */
    if (!permChecked) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 12 }}>İzin durumu kontrol ediliyor…</Text>
            </View>
        );
    }

    if (!permGranted) {
        return (
            <View style={styles.centered}>
                <Text style={styles.h1}>Bildirim İzni Gerekli</Text>
                <Text style={{ textAlign: 'center', marginVertical: 12 }}>
                    Hunili Bilgiler size günlük eğlenceli mesajlar gönderebilmek için bildirim iznine ihtiyaç duyuyor.
                </Text>
                <TouchableOpacity style={styles.saveBtn} onPress={askPermission}>
                    <Text style={styles.saveBtnText}>İzin Ver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    /* ---------- Normál onboarding ---------- */
    return (
        <PagerView style={styles.pager} initialPage={0}>
            {/* SLIDE 1 */}
            <View key="1" style={styles.page}>
                <Text style={styles.h1}>Dil Seçimi</Text>
                <View style={styles.rowCenter}>
                    <LangButton label="Türkçe" active={language === 'tr'} onPress={() => setLanguage('tr')} />
                    <LangButton label="English" active={language === 'en'} onPress={() => setLanguage('en')} />
                </View>
                <Text style={styles.swipeHint}>→ Kaydır →</Text>
            </View>

            {/* SLIDE 2 */}
            <View key="2" style={styles.page}>
                <Text style={styles.h1}>Saat Aralığı</Text>

                <Text>Başlangıç</Text>
                <TouchableOpacity style={styles.timeButton} onPress={() => setStartPickerVisible(true)}>
                    <Text style={styles.timeText}>
                        {startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </TouchableOpacity>

                <Text>Bitiş</Text>
                <TouchableOpacity style={styles.timeButton} onPress={() => setEndPickerVisible(true)}>
                    <Text style={styles.timeText}>
                        {endTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </TouchableOpacity>

                <DateTimePickerModal
                    isVisible={isStartPickerVisible}
                    mode="time"
                    is24Hour
                    onConfirm={(d) => { setStartTime(d); setStartPickerVisible(false); }}
                    onCancel={() => setStartPickerVisible(false)}
                />
                <DateTimePickerModal
                    isVisible={isEndPickerVisible}
                    mode="time"
                    is24Hour
                    onConfirm={(d) => { setEndTime(d); setEndPickerVisible(false); }}
                    onCancel={() => setEndPickerVisible(false)}
                />

                <Text style={styles.swipeHint}>→ Kaydır →</Text>
            </View>

            {/* SLIDE 3 */}
            <View key="3" style={styles.page}>
                <Text style={styles.h1}>İlgilendiğin Kategoriler</Text>
                <View style={styles.tagWrap}>
                    {categoryIds.map((id) => (
                        <Tag
                            key={id}
                            label={id}
                            active={selectedCats.includes(id)}
                            onPress={() => toggleCat(id)}
                        />
                    ))}
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={saveAndGoHome}>
                    <Text style={styles.saveBtnText}>Kaydet ve Başla</Text>
                </TouchableOpacity>
            </View>
        </PagerView>
    );
}

/* ---------- Küçük bileşenler ---------- */
const LangButton = ({ label, active, onPress }:
    { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[styles.langBtn, active && styles.langBtnActive]}
        activeOpacity={0.7}>
        <Text style={[styles.langBtnText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
);

const Tag = ({ label, active, onPress }:
    { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[styles.tag, active && styles.tagActive]}
        activeOpacity={0.7}>
        <Text style={[styles.tagText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
);

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

    pager: { flex: 1 },
    page: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    h1: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
    rowCenter: { flexDirection: 'row', justifyContent: 'center' },
    swipeHint: { position: 'absolute', bottom: 32, fontSize: 12, opacity: 0.5 },

    langBtn: {
        paddingVertical: 12, paddingHorizontal: 20,
        borderRadius: 12, borderWidth: 1, borderColor: '#999', marginHorizontal: 8,
    },
    langBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    langBtnText: { fontSize: 16 },

    timeButton: {
        borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
        paddingVertical: 12, paddingHorizontal: 20, marginVertical: 8,
        minWidth: 140, alignItems: 'center',
    },
    timeText: { fontSize: 18 },

    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    tag: {
        borderWidth: 1, borderColor: '#999', borderRadius: 16,
        paddingVertical: 6, paddingHorizontal: 12, margin: 4,
    },
    tagActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    tagText: { fontSize: 14 },

    saveBtn: {
        marginTop: 32,
        backgroundColor: '#6366f1',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 28,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
