import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { fmtTime, fmtPace } from '../utils';
import { colors } from '../theme';

export default function SummaryScreen({ route, navigation }) {
  const { record } = route.params;
  const date = new Date(record.date);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.title}>러닝 완료 🎉</Text>
      <Text style={styles.date}>
        {date.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
      </Text>

      <View style={styles.hero}>
        <Text style={styles.heroNum}>{record.distance.toFixed(2)}</Text>
        <Text style={styles.heroLabel}>킬로미터</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>총 시간</Text>
          <Text style={styles.cellValue}>{fmtTime(record.duration)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>평균 페이스</Text>
          <Text style={styles.cellValue}>{fmtPace(record.avgPace)}</Text>
        </View>
        <View style={[styles.cell, styles.kcalCell, { width: '100%' }]}>
          <Text style={[styles.cellLabel, { color: colors.trail }]}>소모 칼로리</Text>
          <Text style={[styles.cellValue, { color: colors.trail }]}>{Math.round(record.kcal)} kcal</Text>
        </View>
      </View>

      <Pressable style={styles.doneBtn} onPress={() => navigation.navigate('홈')}>
        <Text style={styles.doneBtnText}>기록 저장 완료 · 홈으로</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  title: { fontSize: 20, fontWeight: '600', color: colors.ink },
  date: { fontSize: 12, color: colors.muted, marginBottom: 18, marginTop: 4 },
  hero: { alignItems: 'center', marginVertical: 20 },
  heroNum: { fontSize: 52, fontWeight: '600', color: colors.ink },
  heroLabel: { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  cell: { width: '47%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, alignItems: 'center' },
  kcalCell: { backgroundColor: colors.trailLight, borderWidth: 0 },
  cellLabel: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  cellValue: { fontSize: 20, fontWeight: '600', color: colors.ink },
  doneBtn: { backgroundColor: colors.ink, borderRadius: 14, padding: 16, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
