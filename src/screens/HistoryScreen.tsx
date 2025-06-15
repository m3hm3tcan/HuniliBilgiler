// @ts-ignore
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Messages } from '../data/messages';
import { Categories } from '../data/categories';
import { RootStackParamList } from '../types/types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


const OKUNANLAR_KEY = 'shown_message_ids_v1';

// type SeenMessage = {
//     id: string;
//     seenAt: string;
// };

export default function HistoryScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    // const [readMessages, setReadMessages] = useState<(typeof Messages[0] & { seenAt: string })[]>([]);
    const [readMessages, setReadMessages] = useState<typeof Messages>([]);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    useEffect(() => {
        const loadReadMessages = async () => {
            try {
                const raw = await AsyncStorage.getItem(OKUNANLAR_KEY);
                const ids: string[] = raw ? JSON.parse(raw) : [];
                console.log('seenMessages history page', ids);

                const msgs = ids
                    .map(id => Messages.find(m => m.id === id))
                    .filter(Boolean) as typeof Messages;

                setReadMessages(msgs);
            } catch (e) {
                console.error('Okunmuş mesajlar yüklenemedi', e);
            }
        };

        loadReadMessages();
    }, []);

    // Kategoriye göre grupla
    const groupedByCategory = readMessages.reduce<Record<string, typeof Messages>>((acc, msg) => {
        const catName = Categories.find(c => c.id === msg.categoryId)?.tr || msg.categoryId || 'Diğer';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(msg);
        return acc;
    }, {});

    // Accordion toggle
    const toggleCategory = (category: string) => {
        setExpandedCategory(prev => (prev === category ? null : category));
    };

    return (
        <View style={styles.container}>

            <View style={styles.backContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backText}>← Geri</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer}>
                <Text style={styles.title}>Geçmiş Mesajlar</Text>

                {Object.entries(groupedByCategory).length === 0 ? (
                    <View style={{ padding: 24, alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontStyle: 'italic', color: '#777' }}>
                            Henüz hiç Hunili mesaj görmedin, sabırlı ol dostum! 😄
                        </Text>
                    </View>
                ) : (
                    Object.entries(groupedByCategory).map(([category, msgs]) => (
                        <View key={category} style={styles.accordionSection}>
                            <TouchableOpacity onPress={() => toggleCategory(category)} style={styles.accordionHeader}>
                                <Text style={styles.accordionTitle}>
                                    {expandedCategory === category ? '▼' : '►'} {category} ({msgs.length})
                                </Text>
                            </TouchableOpacity>
                            {expandedCategory === category && (
                                <View style={styles.accordionContent}>
                                    {msgs.map((msg, index) => (
                                        <View
                                            key={msg.id}
                                            style={[
                                                styles.messageItem,
                                                { backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }, // Alternatif renkler
                                            ]}
                                        >
                                            <Text style={styles.messageText}>{msg.tr || msg.en || 'Mesaj yok'}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    backContainer: {
        width: '100%',
        backgroundColor: '#eee',
        paddingTop: StatusBar.currentHeight || 20,
        paddingBottom: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
    },
    backText: {
        fontSize: 20,
        color: '#000',
        fontWeight: 'bold',
    },
    scrollContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 16,
    },
    accordionSection: {
        marginBottom: 12,
    },
    accordionHeader: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
    },
    accordionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    accordionContent: {
        padding: 12,
    },
    messageItem: {
        paddingVertical: 4,
    },
    messageText: {
        fontSize: 16,
    },
});