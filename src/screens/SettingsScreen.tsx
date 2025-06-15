import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Switch,
    Button,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { Categories } from '../data/categories';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/types';
import { uygulamaAcildi } from '../services/notification';

const STORAGE_KEY = 'user_settings_v1';

type SettingsType = {
    language: 'tr' | 'en';
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
    categories: string[];
};

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
    /* ---------- STATE ---------- */
    const [language, setLanguage] = useState<'tr' | 'en'>('tr');

    // Saatleri Date objesi olarak saklıyoruz
    const [startTime, setStartTime] = useState<Date>(() => {
        const d = new Date();
        d.setHours(9, 0, 0, 0);
        return d;
    });
    const [endTime, setEndTime] = useState<Date>(() => {
        const d = new Date();
        d.setHours(18, 0, 0, 0);
        return d;
    });

    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);

    const [categories, setCategories] = useState<string[]>([]);

    /* ---------- LOAD SETTINGS ---------- */
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const settings: SettingsType = JSON.parse(raw);
                    setLanguage(settings.language);

                    // "HH:mm" -> Date
                    const [sH, sM] = settings.startTime.split(':').map(Number);
                    const [eH, eM] = settings.endTime.split(':').map(Number);
                    const d1 = new Date(); d1.setHours(sH, sM, 0, 0);
                    const d2 = new Date(); d2.setHours(eH, eM, 0, 0);
                    setStartTime(d1);
                    setEndTime(d2);

                    setCategories(settings.categories);
                }
            } catch (e) {
                console.warn('Settings load error', e);
            }
        })();
    }, []);

    /* ---------- HELPERS ---------- */
    const formatTime = (d: Date) =>
        d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');

    const toggleCategory = (id: string) => {
        setCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const saveSettings = async () => {
        const newSettings: SettingsType = {
            language,
            startTime: formatTime(startTime),
            endTime: formatTime(endTime),
            categories,
        };

        if (newSettings.startTime >= newSettings.endTime) {
            Alert.alert('Hata', 'Başlangıç saati, bitiş saatinden küçük olmalıdır.');
            return;
        }

        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
            await uygulamaAcildi();            // Bildirimleri iptal + yeniden planla
            Alert.alert('Başarılı', 'Ayarlar kaydedildi.');
            navigation.goBack();
        } catch {
            Alert.alert('Hata', 'Ayarlar kaydedilemedi.');
        }
    };

    /* ---------- RENDER ---------- */
    return (
        <View style={{ flex: 1 }}>
            {/* Geri barı */}
            <View style={styles.backContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container}>

                {/* Dil seçimi */}
                <Text style={styles.title}>Dil Seçimi</Text>
                <View style={styles.row}>
                    <LangBtn label="Türkçe" active={language === 'tr'} onPress={() => setLanguage('tr')} />
                    <LangBtn label="English" active={language === 'en'} onPress={() => setLanguage('en')} />
                </View>

                {/* Saat seçimi */}
                <Text style={styles.title}>Bildirim Saatleri</Text>
                <TimeRow
                    label="Başlangıç"
                    time={formatTime(startTime)}
                    onPress={() => setStartPickerVisible(true)}
                />
                <TimeRow
                    label="Bitiş"
                    time={formatTime(endTime)}
                    onPress={() => setEndPickerVisible(true)}
                />

                <DateTimePickerModal
                    isVisible={isStartPickerVisible}
                    mode="time"
                    is24Hour
                    date={startTime}
                    onConfirm={(d) => { setStartTime(d); setStartPickerVisible(false); }}
                    onCancel={() => setStartPickerVisible(false)}
                />
                <DateTimePickerModal
                    isVisible={isEndPickerVisible}
                    mode="time"
                    is24Hour
                    date={endTime}
                    onConfirm={(d) => { setEndTime(d); setEndPickerVisible(false); }}
                    onCancel={() => setEndPickerVisible(false)}
                />

                {/* Kategoriler */}
                <Text style={styles.title}>Kategoriler</Text>
                {Categories.map(cat => (
                    <View key={cat.id} style={styles.row}>
                        <Text>{cat.tr}</Text>
                        <Switch
                            value={categories.includes(cat.id)}
                            onValueChange={() => toggleCategory(cat.id)}
                        />
                    </View>
                ))}

                {/* Kaydet */}
                <View style={{ marginTop: 40 }}>
                    <Button title="Kaydet" onPress={saveSettings} />
                </View>
            </ScrollView>
        </View>
    );
}

/* ---------- SMALL COMPONENTS ---------- */
const LangBtn = ({ label, active, onPress }:
    { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[styles.langButton, active && styles.langButtonSelected]}>
        <Text style={active ? styles.langTextSelected : styles.langText}>{label}</Text>
    </TouchableOpacity>
);

const TimeRow = ({ label, time, onPress }:
    { label: string; time: string; onPress: () => void }) => (
    <View style={styles.row}>
        <Text>{label}:</Text>
        <TouchableOpacity onPress={onPress}>
            <Text style={styles.timeText}>{time}</Text>
        </TouchableOpacity>
    </View>
);

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
    backContainer: {
        width: '100%',
        backgroundColor: '#eee',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 40,
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    backButton: { alignSelf: 'flex-start', paddingVertical: 4 },
    backText: { fontSize: 20, fontWeight: 'bold' },

    container: { padding: 20 },
    title: { fontWeight: 'bold', fontSize: 20, marginVertical: 8 },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },

    langButton: {
        borderWidth: 1,
        borderColor: '#aaa',
        borderRadius: 6,
        padding: 10,
        marginHorizontal: 6,
        minWidth: 100,
        alignItems: 'center',
    },
    langButtonSelected: { backgroundColor: '#007AFF' },
    langText: { color: '#333' },
    langTextSelected: { color: 'white' },

    timeText: { fontWeight: 'bold', color: '#007AFF' },
});
