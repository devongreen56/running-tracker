import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHistory } from '../storage';
import { colors } from '../theme';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function monthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function sumRuns(runs) {
  return {
    distance: runs.reduce((a, r) => a + r.distance, 0),
    duration: runs.reduce((a, r) => a + r.duration, 0),
    kcal: runs.reduce((a, r) => a + r.kcal, 0),
    count: runs.length,
  };
}

export default function StatsScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [cursor, setCursor] = useState(new Date()); // which month the calendar shows
  const [selectedDate, setSelectedDate] = useState(null);

  useFocusEffect(
    useCallback(() => {
      (async () => setHistory(await getHistory()))();
    }, [])
  );

  const runsByDay = {};
  history.forEach((r) => {
    const d = new Date(r.date);
    const key = d.toDateString();
    if (!runsByDay[key]) runsByDay[key] = [];
    runsByDay[key].push(r);
  });

  const thisMonthRuns = history.filter((r) => monthKey(new Date(r.date)) === monthKey(cursor));
  const lastMonthDate = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  const lastMonthRuns = history.filter((r) => monthKey(new Date(r.date)) === monthKey(lastMonthDate));
  const thisMonthStats = sumRuns(thisMonthRuns);
  const lastMonthStats = sumRuns(lastMonthRuns);

  const thisYearRuns = history.filter((r) => new Date(r.date).getFullYear() === cursor.getFullYear());
  const thisYearStats = sumRuns(thisYearRuns);

  const maxDist = Math.max(thisMonthStats.distance, lastMonthStats.distance, 0.01);

  // Build calendar grid for the cursor month
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = new Date().toDateString();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.eyebrow}>통계</Text>
      <Text style={styles.title}>월별·연간 통계</Text>

      <View style={styles.monthNav}>
        <Pressable onPress={() => { setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)); setSelectedDate(null); }}>
          <Text style={styles.monthNavArrow}>‹</Text>
        </Pressable>
        <Text style={styles.monthNavLabel}>
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </Text>
        <Pressable onPress={() => { setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)); setSelectedDate(null); }}>
          <Text style={styles.monthNavArrow}>›</Text>
        </Pressable>
      </View>

      {/* Calendar */}
      <View style={styles.calendarCard}>
        <View style={styles.weekHeader}>
          {WEEKDAY_LABELS.map((l) => (
            <Text key={l} style={styles.weekHeaderText}>{l}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {cells.map((d, i) => {
            if (d === null) return <View key={i} style={styles.dayCell} />;
            const dateObj = new Date(cursor.getFullYear(), cursor.getMonth(), d);
            const runs = runsByDay[dateObj.toDateString()];
            const isToday = dateObj.toDateString() === todayStr;
            return (
              <Pressable key={i} style={styles.dayCell} onPress={() => setSelectedDate(dateObj)}>
                <View
                  style={[
                    styles.dayCircle,
                    runs && styles.dayCircleActive,
                    isToday && styles.dayCircleToday,
                    selectedDate && selectedDate.toDateString() === dateObj.toDateString() && styles.dayCircleSelected,
                  ]}
                >
                  <Text style={[styles.dayNum, runs && styles.dayNumActive]}>{d}</Text>
                </View>
                {runs && <Text style={styles.dayDist}>{runs.reduce((a, r) => a + r.distance, 0).toFixed(1)}</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>

      {selectedDate && (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedTitle}>
            {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
          </Text>
          {(runsByDay[selectedDate.toDateString()] || []).length === 0 ? (
            <Text style={styles.selectedEmpty}>이 날은 러닝 기록이 없어요.</Text>
          ) : (
            runsByDay[selectedDate.toDateString()].map((r, i) => (
              <Pressable
                key={i}
                style={styles.selectedItem}
                onPress={() => navigation.navigate('기록', { screen: 'RunDetail', params: { record: r } })}
              >
                <View>
                  <Text style={styles.selectedItemTitle}>
                    {new Date(r.date).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })} 러닝
                  </Text>
                  <Text style={styles.selectedItemSub}>
                    {r.distance.toFixed(2)} km · {Math.round(r.kcal)} kcal · {Math.round(r.duration / 60)}분
                  </Text>
                </View>
                <Text style={styles.selectedItemArrow}>›</Text>
              </Pressable>
            ))
          )}
        </View>
      )}
      <Text style={styles.section}>이번 달 vs 지난달</Text>
      <View style={styles.compareCard}>
        <View style={styles.compareRow}>
          <Text style={styles.compareLabel}>이번 달</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(thisMonthStats.distance / maxDist) * 100}%` }]} />
          </View>
          <Text style={styles.compareValue}>{thisMonthStats.distance.toFixed(1)}km</Text>
        </View>
        <View style={styles.compareRow}>
          <Text style={styles.compareLabel}>지난달</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, styles.barFillMuted, { width: `${(lastMonthStats.distance / maxDist) * 100}%` }]} />
          </View>
          <Text style={styles.compareValue}>{lastMonthStats.distance.toFixed(1)}km</Text>
        </View>

        <View style={styles.compareGrid}>
          <View style={styles.compareStat}>
            <Text style={styles.compareStatLabel}>횟수</Text>
            <Text style={styles.compareStatValue}>{thisMonthStats.count}회 <Text style={styles.compareStatPrev}>({lastMonthStats.count}회)</Text></Text>
          </View>
          <View style={styles.compareStat}>
            <Text style={styles.compareStatLabel}>시간</Text>
            <Text style={styles.compareStatValue}>{Math.round(thisMonthStats.duration / 60)}분 <Text style={styles.compareStatPrev}>({Math.round(lastMonthStats.duration / 60)}분)</Text></Text>
          </View>
          <View style={styles.compareStat}>
            <Text style={styles.compareStatLabel}>칼로리</Text>
            <Text style={styles.compareStatValue}>{Math.round(thisMonthStats.kcal)} <Text style={styles.compareStatPrev}>({Math.round(lastMonthStats.kcal)})</Text></Text>
          </View>
        </View>
      </View>

      {/* Year summary */}
      <Text style={styles.section}>{cursor.getFullYear()}년 전체</Text>
      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.label}>총 거리</Text>
          <Text style={styles.value}>{thisYearStats.distance.toFixed(1)} <Text style={styles.small}>km</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.label}>총 러닝</Text>
          <Text style={styles.value}>{thisYearStats.count} <Text style={styles.small}>회</Text></Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.faint, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4, marginBottom: 16 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 12 },
  monthNavArrow: { fontSize: 22, color: colors.muted, paddingHorizontal: 8 },
  monthNavLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  calendarCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 12, marginBottom: 22 },
  weekHeader: { flexDirection: 'row', marginBottom: 4 },
  weekHeaderText: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.faint, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 4 },
  dayCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { backgroundColor: colors.trail },
  dayCircleToday: { borderWidth: 1.5, borderColor: colors.amber },
  dayCircleSelected: { borderWidth: 2, borderColor: colors.ink },
  dayNum: { fontSize: 12, color: colors.ink },
  dayNumActive: { color: '#fff', fontWeight: '600' },
  dayDist: { fontSize: 8, color: colors.trail, marginTop: 1, fontWeight: '600' },
  selectedCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, marginBottom: 22 },
  selectedTitle: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 10 },
  selectedEmpty: { fontSize: 12, color: colors.muted },
  selectedItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  selectedItemTitle: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 2 },
  selectedItemSub: { fontSize: 11, color: colors.muted },
  selectedItemArrow: { color: colors.faint, fontSize: 16 },
  section: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: colors.ink },
  compareCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, marginBottom: 22 },
  compareRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  compareLabel: { width: 48, fontSize: 12, color: colors.muted },
  barTrack: { flex: 1, height: 14, backgroundColor: colors.paper, borderRadius: 7, overflow: 'hidden', marginHorizontal: 8 },
  barFill: { height: '100%', backgroundColor: colors.trail, borderRadius: 7 },
  barFillMuted: { backgroundColor: colors.faint },
  compareValue: { width: 56, fontSize: 12, fontWeight: '600', color: colors.ink, textAlign: 'right' },
  compareGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.line },
  compareStat: { alignItems: 'center' },
  compareStatLabel: { fontSize: 10, color: colors.muted, marginBottom: 4 },
  compareStatValue: { fontSize: 13, fontWeight: '600', color: colors.ink },
  compareStatPrev: { fontSize: 10, color: colors.muted, fontWeight: '400' },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  label: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  value: { fontSize: 22, color: colors.ink, fontWeight: '600' },
  small: { fontSize: 13, color: colors.muted, fontWeight: '400' },
});
