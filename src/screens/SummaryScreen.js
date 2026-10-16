import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { fmtTime, fmtPace } from '../utils';
import RunWalkRow from '../RunWalkRow';
import { colors } from '../theme';

export default function SummaryScreen({ route, navigation }) {
  const { record } = route.params;
  const date = new Date(record.date);
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('공유 불가', '이 기기에서는 공유 기능을 사용할 수 없어요.');
        return;
      }
      const uri = await cardRef.current.capture();
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '러닝 기록 공유하기' });
    } catch (e) {
      Alert.alert('공유 실패', '카드를 만드는 중 문제가 발생했어요.');
    } finally {
      setSharing(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
        <View style={styles.card}>
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

          <RunWalkRow record={record} />

          <Text style={styles.watermark}>🏃 운동</Text>
        </View>
      </ViewShot>

      <Pressable style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
        <Text style={styles.shareBtnText}>{sharing ? '카드 만드는 중...' : '📤 공유 카드로 내보내기'}</Text>
      </Pressable>

      <Pressable style={styles.doneBtn} onPress={() => navigation.navigate('홈')}>
        <Text style={styles.doneBtnText}>기록 저장 완료 · 홈으로</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  card: { backgroundColor: colors.paper, padding: 4 },
  title: { fontSize: 20, fontWeight: '600', color: colors.ink },
  date: { fontSize: 12, color: colors.muted, marginBottom: 18, marginTop: 4 },
  hero: { alignItems: 'center', marginVertical: 20 },
  heroNum: { fontSize: 52, fontWeight: '600', color: colors.ink },
  heroLabel: { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  cell: { width: '47%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, alignItems: 'center' },
  kcalCell: { backgroundColor: colors.trailLight, borderWidth: 0 },
  cellLabel: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  cellValue: { fontSize: 20, fontWeight: '600', color: colors.ink },
  watermark: { textAlign: 'center', fontSize: 12, color: colors.faint, marginTop: 16, fontWeight: '600' },
  shareBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 16, marginBottom: 10 },
  shareBtnText: { fontWeight: '600', color: colors.ink, fontSize: 14 },
  doneBtn: { backgroundColor: colors.ink, borderRadius: 14, padding: 16, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
