import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHistory, deleteRun, resetHistory } from '../storage';
import { colors } from '../theme';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  const load = useCallback(() => {
    (async () => {
      const h = await getHistory();
      setHistory(h);
    })();
  }, []);

  useFocusEffect(load);

  const totalDist = history.reduce((a, r) => a + r.distance, 0);
  const totalKcal = history.reduce((a, r) => a + r.kcal, 0);

  function confirmDelete(record) {
    const d = new Date(record.date);
    Alert.alert(
      '기록 삭제',
      `${d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 러닝 (${record.distance.toFixed(
        2
      )}km) 기록을 삭제할까요? 되돌릴 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteRun(record.date);
            setHistory(updated);
          },
        },
      ]
    );
  }

  function confirmReset(scope, label) {
    Alert.alert(
      '기록 초기화',
      `${label} 기록을 삭제할까요? 되돌릴 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            const updated = await resetHistory(scope);
            setHistory(updated);
          },
        },
      ]
    );
  }

  function openResetMenu() {
    Alert.alert('기록 초기화', '어느 범위를 초기화할까요?', [
      { text: '이번 주 기록', onPress: () => confirmReset('week', '이번 주') },
      { text: '이번 달 기록', onPress: () => confirmReset('month', '이번 달') },
      { text: '전체 기록', style: 'destructive', onPress: () => confirmReset('all', '전체') },
      { text: '취소', style: 'cancel' },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>기록</Text>
          <Text style={styles.title}>러닝 히스토리</Text>
        </View>
        <Pressable style={styles.resetBtn} onPress={openResetMenu}>
          <Text style={styles.resetBtnText}>초기화</Text>
        </Pressable>
      </View>

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
              <Pressable style={styles.itemMain} onPress={() => navigation.navigate('RunDetail', { record: r })}>
                <Text style={styles.itemTitle}>
                  {d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 러닝
                </Text>
                <Text style={styles.itemSub}>
                  {r.distance.toFixed(2)} km · {Math.round(r.kcal)} kcal
                </Text>
              </Pressable>
              <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(r)} hitSlop={8}>
                <Text style={styles.deleteBtnText}>삭제</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.faint, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4 },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.line },
  resetBtnText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  label: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  value: { fontSize: 22, color: colors.ink, fontWeight: '600' },
  small: { fontSize: 13, color: colors.muted, fontWeight: '400' },
  section: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: colors.ink },
  empty: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 20 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  itemMain: { flex: 1, padding: 14 },
  itemTitle: { fontWeight: '600', fontSize: 13, marginBottom: 3, color: colors.ink },
  itemSub: { fontSize: 12, color: colors.muted },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 14, borderLeftWidth: 1, borderLeftColor: colors.line },
  deleteBtnText: { fontSize: 12, color: colors.alert, fontWeight: '600' },
});
