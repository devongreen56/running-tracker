import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHistory } from '../storage';
import { colors } from '../theme';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const h = await getHistory();
        setHistory(h);
      })();
    }, [])
  );

  const totalDist = history.reduce((a, r) => a + r.distance, 0);
  const totalKcal = history.reduce((a, r) => a + r.kcal, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.eyebrow}>기록</Text>
      <Text style={styles.title}>러닝 히스토리</Text>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.label}>누적 거리</Text>
          <Text style={styles.value}>{totalDist.toFixed(1)} <Text style={styles.small}>km</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.label}>누적 칼로리</Text>
          <Text style={styles.value}>{Math.round(totalKcal)} <Text style={styles.small}>kcal</Text></Text>
        </View>
      </View>

      <Text style={styles.section}>최근 러닝</Text>
      {history.length === 0 ? (
        <Text style={styles.empty}>아직 러닝 기록이 없어요. 첫 러닝을 시작해보세요.</Text>
      ) : (
        [...history].reverse().map((r, i) => {
          const d = new Date(r.date);
          return (
            <View key={i} style={styles.item}>
              <View>
                <Text style={styles.itemTitle}>
                  {d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 러닝
                </Text>
                <Text style={styles.itemSub}>
                  {r.distance.toFixed(2)} km · {Math.round(r.kcal)} kcal
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.faint, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4, marginBottom: 16 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  label: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  value: { fontSize: 22, color: colors.ink, fontWeight: '600' },
  small: { fontSize: 13, color: colors.muted, fontWeight: '400' },
  section: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: colors.ink },
  empty: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 20 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, marginBottom: 8 },
  itemTitle: { fontWeight: '600', fontSize: 13, marginBottom: 3, color: colors.ink },
  itemSub: { fontSize: 12, color: colors.muted },
  arrow: { color: colors.faint, fontSize: 18 },
});
