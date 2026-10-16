import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fmtTime, fmtPace } from './utils';
import { colors } from './theme';

/* 뛴/걸은 구분 (v1.3.0 이후 기록만 해당) */
export default function RunWalkRow({ record }) {
  if (record.runKm == null && record.walkKm == null) return null;
  const rk = record.runKm || 0, wk = record.walkKm || 0;
  const rs = record.runSec || 0, ws = record.walkSec || 0;
  const total = rk + wk || 1;
  const pace = (sec, km) => (km > 0.02 ? fmtPace(sec / km) : '-');
  return (
    <View style={rwStyles.box}>
      <View style={rwStyles.bar}>
        <View style={{ flex: Math.max(rk, 0.0001), backgroundColor: colors.trail }} />
        <View style={{ flex: Math.max(wk, 0.0001), backgroundColor: colors.amber }} />
      </View>
      <View style={rwStyles.cols}>
        <View style={rwStyles.col}>
          <Text style={[rwStyles.head, { color: colors.trail }]}>🏃 뛴 구간 {Math.round((rk / total) * 100)}%</Text>
          <Text style={rwStyles.big}>{rk.toFixed(2)}<Text style={rwStyles.unit}> km</Text></Text>
          <Text style={rwStyles.sub}>{fmtTime(rs)} · {pace(rs, rk)}</Text>
        </View>
        <View style={rwStyles.col}>
          <Text style={[rwStyles.head, { color: '#8A5A1E' }]}>🚶 걸은 구간 {Math.round((wk / total) * 100)}%</Text>
          <Text style={rwStyles.big}>{wk.toFixed(2)}<Text style={rwStyles.unit}> km</Text></Text>
          <Text style={rwStyles.sub}>{fmtTime(ws)} · {pace(ws, wk)}</Text>
        </View>
      </View>
    </View>
  );
}
const rwStyles = StyleSheet.create({
  box: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, marginTop: 10 },
  bar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  cols: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  head: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  big: { fontSize: 18, fontWeight: '600', color: colors.ink },
  unit: { fontSize: 11, fontWeight: '400', color: colors.muted },
  sub: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
