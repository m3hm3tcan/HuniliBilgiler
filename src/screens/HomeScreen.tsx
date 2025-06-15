import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
    return (
        <View style={styles.homeContainer}>
            <Text style={styles.homeTitle}>Hunili Bilgiler</Text>
            <Text style={styles.homeSubtitle}>Hunili arkadasim hoş geldin!</Text>

            <TouchableOpacity
                style={[styles.homeButton, styles.historyButton]}
                onPress={() => navigation.navigate('History')}
            >
                <Text style={styles.homeButtonText}>Geçmiş</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.homeButton, styles.settingsButton]}
                onPress={() => navigation.navigate('Settings')}
            >
                <Text style={styles.homeButtonText}>Ayarlar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    homeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    homeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    homeSubtitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 32,
    },
    homeButton: {
        backgroundColor: '#6366f1',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 28,
        marginBottom: 16,
        width: 200,
        alignItems: 'center',
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    historyButton: {
        backgroundColor: '#10b981',
    },
    settingsButton: {
        backgroundColor: '#3b82f6',
    },
});
