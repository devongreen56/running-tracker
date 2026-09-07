import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProfile, getHistory, getInProgress, clearInProgress, addRun } from '../storage';
import { requestStepPermission, getTodaySteps, startLiveStepTracking, stopLiveStepTracking } from '../steps';
import { calcKcal } from '../utils';
import { colors } from '../theme';

export default function HomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [weekDist, setWeekDist] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState([]);
  const [steps, setSteps] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await getProfile();

        // If the app was force-closed mid-run, a snapshot may still be sitting
        // in storage — recover it into history instead of losing the run.
        const inProgress = await getInProgress();
        if (inProgress && inProgress.distanceKm > 0.01) {
          const pausedMs =
            (inProgress.pausedTotalMs || 0) +
            (inProgress.pausedAt ? inProgress.savedAt - inProgress.pausedAt : 0);
          const recoveredElapsed = Math.max(0, (inProgress.savedAt - inProgress.startTime - pausedMs) / 1000);
          const recoveredKcal = calcKcal(p.weight, inProgress.distanceKm);
          await addRun({
            date: new Date(inProgress.startTime).toISOString(),
            distance: inProgress.distanceKm,
            duration: recoveredElapsed,
            kcal: recoveredKcal,
            avgPace: recoveredElapsed / inProgress.distanceKm,
            splits: inProgress.splits || [],
            path: inProgress.path || [],
            photos: inProgress.photos || [],
          });
          await clearInProgress();
          Alert.alert(
            '이전 운동이 자동 저장됐어요',
            `앱이 비정상 종료됐지만 기록은 남아있었어요: ${inProgress.distanceKm.toFixed(2)}km, ${Math.round(
              recoveredElapsed / 60
            )}분. 기록 탭에서 확인할 수 있어요.`
          );
        }

        const h = await getHistory();
        setProfile(p);

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const runsThisWeek = h.filter((r) => new Date(r.date) >= startOfWeek);
        setWeekDist(runsThisWeek.reduce((a, r) => a + r.distance, 0));

        const runDates = new Set(h.map((r) => new Date(r.date).toDateString()));
        let s = 0;
        let day = new Date();
        day.setHours(0, 0, 0, 0);
        while (runDates.has(day.toDateString())) {
          s++;
          day.setDate(day.getDate() - 1);
        }
        setStreak(s);

        const labels = ['일', '월', '화', '수', '목', '금', '토'];
        const days = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          days.push({
            label: labels[i],
            done: runDates.has(d.toDateString()),
            today: d.toDateString() === new Date().toDateString(),
          });
        }
        setWeekDays(days);

        const granted = await requestStepPermission();
        if (granted) {
          setSteps(await getTodaySteps());
          startLiveStepTracking(setSteps);
        }
      })();

      return () => stopLiveStepTracking();
    }, [])
  );

  if (!profile) return null;

  const pct = Math.min(100, Math.round((weekDist / profile.goalDist) * 100) || 0);
  const remain = Math.max(0, profile.goalDist - weekDist);
  const today = new Date();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.eyebrow}>
        {today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
      </Text>
      <Text style={styles.hello}>안녕하세요 👋</Text>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.label}>연속 러닝</Text>
          <Text style={styles.value}>{streak} <Text style={styles.small}>일</Text></Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.label}>이번 주 거리</Text>
          <Text style={styles.value}>{weekDist.toFixed(1)} <Text style={styles.small}>km</Text></Text>
        </View>
      </View>

      <View style={[styles.statCard, styles.stepsCard]}>
        <Text style={styles.label}>오늘 걸음 수</Text>
        <Text style={styles.value}>{steps.toLocaleString()} <Text style={styles.small}>걸음</Text></Text>
      </View>

      <View style={styles.goalCard}>
        <View style={styles.goalTop}>
          <Text style={styles.goalTopText}>주간 목표 · {profile.goalDist}km</Text>
          <Text style={styles.goalTopText}>{pct}%</Text>
        </View>
        <View style={styles.goalBar}>
          <View style={[styles.goalFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.goalRemain}>
          {remain > 0 ? `목표까지 ${remain.toFixed(1)}km 남았어요` : '이번 주 목표 달성! 🎉'}
        </Text>
      </View>

      <Pressable style={styles.startBtn} onPress={() => navigation.navigate('러닝')}>
        <Text style={styles.startBtnText}>러닝 시작하기 →</Text>
      </Pressable>

      <Text style={styles.section}>이번 주 기록</Text>
      <View style={styles.weekStrip}>
        {weekDays.map((d, i) => (
          <View key={i} style={styles.weekDay}>
            <Text style={styles.weekLabel}>{d.label}</Text>
            <View
              style={[
                styles.weekBox,
                d.done && { backgroundColor: colors.trail },
                d.today && { borderWidth: 2, borderColor: colors.amber },
              ]}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: colors.faint, fontWeight: '600' },
  hello: { fontSize: 24, marginTop: 2, marginBottom: 18, fontWeight: '600', color: colors.ink },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 },
  stepsCard: { marginBottom: 20 },
  label: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  value: { fontSize: 24, color: colors.ink, fontWeight: '600' },
  small: { fontSize: 13, color: colors.muted, fontWeight: '400' },
  goalCard: { backgroundColor: colors.trail, borderRadius: 18, padding: 18, marginBottom: 20 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  goalTopText: { color: '#fff', fontSize: 12, opacity: 0.9 },
  goalBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 6, overflow: 'hidden', marginBottom: 10 },
  goalFill: { height: '100%', backgroundColor: '#fff', borderRadius: 6 },
  goalRemain: { color: '#fff', fontSize: 12, opacity: 0.9 },
  startBtn: { backgroundColor: colors.ink, borderRadius: 14, padding: 16, alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  section: { fontSize: 15, fontWeight: '600', marginTop: 24, marginBottom: 10, color: colors.ink },
  weekStrip: { flexDirection: 'row', gap: 6 },
  weekDay: { flex: 1, alignItems: 'center' },
  weekLabel: { fontSize: 10, color: colors.faint, marginBottom: 4 },
  weekBox: { width: '100%', height: 26, borderRadius: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
});
