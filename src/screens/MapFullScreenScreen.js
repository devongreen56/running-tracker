import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { getRegion } from './RunDetailScreen';
import { haversineKm } from '../utils';
import { colors } from '../theme';

export default function MapFullScreenScreen({ route, navigation }) {
  const { path } = route.params;
  const [measuring, setMeasuring] = useState(false);
  const [points, setPoints] = useState([]);

  const totalDist = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    return sum + haversineKm(prev.latitude, prev.longitude, p.latitude, p.longitude);
  }, 0);

  function handleMapPress(e) {
    if (!measuring) return;
    setPoints((prev) => [...prev, e.nativeEvent.coordinate]);
  }

  function toggleMeasuring() {
    setMeasuring((m) => !m);
    setPoints([]);
  }

  return (
    <View style={styles.screen}>
      <MapView style={styles.map} initialRegion={getRegion(path)} onPress={handleMapPress}>
        <Polyline coordinates={path} strokeColor={colors.trail} strokeWidth={4} />
        <Marker coordinate={path[0]} pinColor="#2F6B4F" title="출발" />
        <Marker coordinate={path[path.length - 1]} pinColor="#C1543C" title="도착" />

        {points.length > 1 && (
          <Polyline coordinates={points} strokeColor={colors.amber} strokeWidth={3} lineDashPattern={[6, 6]} />
        )}
        {points.map((p, i) => (
          <Marker key={i} coordinate={p} pinColor={colors.amber} />
        ))}
      </MapView>

      <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </Pressable>

      <Pressable style={[styles.rulerBtn, measuring && styles.rulerBtnActive]} onPress={toggleMeasuring}>
        <Text style={[styles.rulerBtnText, measuring && styles.rulerBtnTextActive]}>
          {measuring ? '측정 종료' : '📏 거리 측정'}
        </Text>
      </Pressable>

      {measuring && (
        <View style={styles.measurePanel}>
          <Text style={styles.measureHint}>
            {points.length === 0 ? '지도를 탭해서 지점을 찍어보세요' : `지점 ${points.length}개 찍음 · 계속 탭해서 이어가세요`}
          </Text>
          {points.length > 1 && (
            <Text style={styles.measureDist}>{totalDist < 1 ? `${Math.round(totalDist * 1000)}m` : `${totalDist.toFixed(2)}km`}</Text>
          )}
          {points.length > 0 && (
            <Pressable style={styles.clearBtn} onPress={() => setPoints([])}>
              <Text style={styles.clearBtnText}>지점 초기화</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  rulerBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  rulerBtnActive: { backgroundColor: colors.amber },
  rulerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  rulerBtnTextActive: { color: '#1C2B22' },
  measurePanel: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  measureHint: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  measureDist: { fontSize: 28, fontWeight: '600', color: colors.ink, marginBottom: 8 },
  clearBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  clearBtnText: { fontSize: 12, color: colors.alert, fontWeight: '600' },
});
