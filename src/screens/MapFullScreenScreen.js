import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, Image, Modal } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { getRegion } from './RunDetailScreen';
import { haversineKm } from '../utils';
import { colors } from '../theme';

export default function MapFullScreenScreen({ route, navigation }) {
  const { path, photos = [] } = route.params;
  const [measuring, setMeasuring] = useState(false);
  const [points, setPoints] = useState([]);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const MAX_POINTS = 20;

  let totalDist = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    totalDist += haversineKm(prev.latitude, prev.longitude, cur.latitude, cur.longitude);
  }

  function handleMapPress(e) {
    if (!measuring) return;
    const coord = e?.nativeEvent?.coordinate;
    if (!coord) return;
    setPoints((prev) => (prev.length >= MAX_POINTS ? prev : [...prev, coord]));
  }

  function toggleMeasuring() {
    setMeasuring((m) => !m);
    setPoints([]);
  }

  return (
    <View style={styles.screen}>
      <MapView style={styles.map} initialRegion={getRegion(path)} onPress={handleMapPress}>
        {path.length > 1 && <Polyline coordinates={path} strokeColor={colors.trail} strokeWidth={4} />}
        {path.length > 0 && <Marker coordinate={path[0]} pinColor="#2F6B4F" title="출발" />}
        {path.length > 0 && <Marker coordinate={path[path.length - 1]} pinColor="#C1543C" title="도착" />}

        {photos.map((ph, i) => (
          <Marker
            key={`photo-${i}`}
            coordinate={{ latitude: ph.latitude, longitude: ph.longitude }}
            onPress={() => setPreviewPhoto(ph)}
          >
            <View style={styles.photoMarker}>
              <Image source={{ uri: ph.uri }} style={styles.photoThumb} />
            </View>
          </Marker>
        ))}

        {points.length > 1 && <Polyline coordinates={points} strokeColor={colors.amber} strokeWidth={3} />}
        {points.map((p, i) => (
          <Marker key={`pt-${i}-${p.latitude}-${p.longitude}`} coordinate={p} pinColor={colors.amber} />
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
            {points.length === 0
              ? '지도를 탭해서 지점을 찍어보세요'
              : `지점 ${points.length}개 찍음 · 계속 탭해서 이어가세요`}
          </Text>
          {points.length > 1 && (
            <Text style={styles.measureDist}>
              {totalDist < 1 ? `${Math.round(totalDist * 1000)}m` : `${totalDist.toFixed(2)}km`}
            </Text>
          )}
          {points.length > 0 && (
            <Pressable style={styles.clearBtn} onPress={() => setPoints([])}>
              <Text style={styles.clearBtnText}>지점 초기화</Text>
            </Pressable>
          )}
        </View>
      )}

      <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewPhoto(null)}>
          {previewPhoto && <Image source={{ uri: previewPhoto.uri }} style={styles.previewImage} resizeMode="contain" />}
        </Pressable>
      </Modal>
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
  photoMarker: { borderWidth: 2, borderColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 3 },
  photoThumb: { width: 40, height: 40 },
  previewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '80%' },
});
