import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { getProfile, getHistory, addRun, clearInProgress } from '../storage';
import { fmtTime, calcKcal } from '../utils';
import { LOCATION_TASK_NAME, runData, resetRunData, getElapsedSeconds } from '../locationTask';
import { colors } from '../theme';

export default function RunScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pastTotals, setPastTotals] = useState({ distance: 0, duration: 0 });
  const [photoCount, setPhotoCount] = useState(0);
  const [takingPhoto, setTakingPhoto] = useState(false);

  const tickRef = useRef(null);

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);

      const history = await getHistory();
      setPastTotals({
        distance: history.reduce((a, r) => a + r.distance, 0),
        duration: history.reduce((a, r) => a + r.duration, 0),
      });

      const fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status !== 'granted') {
        Alert.alert('위치 권한 필요', '거리를 측정하려면 위치 권한이 필요해요.');
        navigation.goBack();
        return;
      }
      // Ask for "always allow" so tracking keeps running with the screen off.
      // If denied, the run still works but only while the screen is on.
      await Location.requestBackgroundPermissionsAsync();

      resetRunData();

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 4,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: '러닝 측정 중',
          notificationBody: '화면이 꺼져 있어도 거리와 시간을 계속 기록하고 있어요.',
          notificationColor: '#2F6B4F',
        },
        pausesUpdatesAutomatically: false,
      });

      tickRef.current = setInterval(() => {
        setDistance(runData.distanceKm);
        setElapsed(getElapsedSeconds());
      }, 1000);
    })();

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
      runData.active = false;
    };
  }, []);

  function togglePause() {
    if (paused) {
      runData.pausedTotalMs += Date.now() - runData.pausedAt;
      runData.pausedAt = null;
      setPaused(false);
    } else {
      runData.pausedAt = Date.now();
      setPaused(true);
    }
  }

  async function takePhoto() {
    if (takingPhoto) return;
    setTakingPhoto(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('카메라 권한 필요', '사진을 찍으려면 카메라 권한이 필요해요.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      if (result.canceled || !result.assets || !result.assets[0]) return;

      const asset = result.assets[0];

      // Use the run's last known GPS fix; fall back to a fresh reading if we
      // don't have one yet (e.g. photo taken in the first second of the run).
      let coord = runData.lastCoord;
      if (!coord) {
        try {
          const current = await Location.getCurrentPositionAsync({});
          coord = { lat: current.coords.latitude, lon: current.coords.longitude };
        } catch (e) {
          coord = null;
        }
      }
      if (!coord) {
        Alert.alert('위치를 찾을 수 없어요', '위치 정보 없이는 지도에 사진을 표시할 수 없어요.');
        return;
      }

      // Copy out of the picker's temp cache so the photo survives after the run.
      const fileName = `run_photo_${Date.now()}.jpg`;
      const dest = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({ from: asset.uri, to: dest });

      runData.photos.push({
        uri: dest,
        latitude: coord.lat,
        longitude: coord.lon,
        timestamp: Date.now(),
      });
      setPhotoCount(runData.photos.length);
    } catch (e) {
      Alert.alert('사진 저장 실패', '사진을 저장하는 중 문제가 발생했어요.');
    } finally {
      setTakingPhoto(false);
    }
  }

  async function stopRun() {
    if (tickRef.current) clearInterval(tickRef.current);
    runData.active = false;
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});

    const finalDistance = runData.distanceKm;
    const finalElapsed = getElapsedSeconds();

    if (finalDistance < 0.01) {
      await clearInProgress();
      navigation.navigate('홈');
      return;
    }

    const kcal = calcKcal(profile.weight, finalDistance);
    const avgPaceSec = finalElapsed / finalDistance;
    const record = {
      date: new Date().toISOString(),
      distance: finalDistance,
      duration: finalElapsed,
      kcal,
      avgPace: avgPaceSec,
      splits: runData.splits,
      path: runData.path,
      photos: runData.photos,
    };
    await addRun(record);
    await clearInProgress();
    navigation.replace('완료', { record });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.statusPillWrap}>
        <View style={styles.statusPill}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>{paused ? '일시정지됨' : '러닝 중 (백그라운드 추적 켜짐)'}</Text>
        </View>
      </View>

      <View style={styles.distanceWrap}>
        <Text style={styles.distanceNum}>{distance.toFixed(2)}</Text>
        <Text style={styles.distanceUnit}>킬로미터</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>시간</Text>
          <Text style={styles.cellValue}>{fmtTime(elapsed)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>누적 운동시간</Text>
          <Text style={styles.cellValue}>{fmtTime(pastTotals.duration + elapsed)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>소모 칼로리</Text>
          <Text style={styles.cellValue}>{profile ? Math.round(calcKcal(profile.weight, distance)) : 0}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.cellLabel}>누적 거리</Text>
          <Text style={styles.cellValue}>{(pastTotals.distance + distance).toFixed(1)} km</Text>
        </View>
      </View>

      <Pressable style={styles.photoBtn} onPress={takePhoto} disabled={takingPhoto}>
        <Text style={styles.photoBtnText}>
          {takingPhoto ? '처리 중...' : `📷 사진 찍기${photoCount > 0 ? ` (${photoCount}장)` : ''}`}
        </Text>
      </Pressable>

      <View style={styles.controls}>
        <Pressable style={styles.secondaryBtn} onPress={togglePause}>
          <Text style={styles.secondaryBtnText}>{paused ? '재개' : '일시정지'}</Text>
        </Pressable>
        <Pressable style={styles.stopBtn} onPress={stopRun}>
          <Text style={styles.stopBtnText}>종료</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper, padding: 20, justifyContent: 'center' },
  statusPillWrap: { alignItems: 'center', marginBottom: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.amberLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber },
  statusText: { fontSize: 12, color: '#8A5A1E' },
  distanceWrap: { alignItems: 'center', marginVertical: 24 },
  distanceNum: { fontSize: 64, fontWeight: '600', color: colors.ink },
  distanceUnit: { fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  cell: { width: '47%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, alignItems: 'center' },
  cellLabel: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  cellValue: { fontSize: 20, fontWeight: '600', color: colors.ink },
  photoBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13, alignItems: 'center', marginBottom: 16 },
  photoBtnText: { fontWeight: '600', color: colors.ink, fontSize: 14 },
  controls: { flexDirection: 'row', gap: 10 },
  secondaryBtn: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 15, alignItems: 'center' },
  secondaryBtnText: { fontWeight: '600', color: colors.ink },
  stopBtn: { flex: 1, backgroundColor: colors.alert, borderRadius: 14, padding: 15, alignItems: 'center' },
  stopBtnText: { fontWeight: '600', color: '#fff' },
});
