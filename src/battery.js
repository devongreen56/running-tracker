import { Platform, Linking, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';

const PKG = (Constants.expoConfig && Constants.expoConfig.android && Constants.expoConfig.android.package) || 'com.yourname.runningtracker';

// 1) 시스템 "배터리 최적화 제외" 요청 팝업 (한 번 탭으로 허용 가능)
export async function requestIgnoreBatteryOptimization() {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync('android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS', {
      data: 'package:' + PKG,
    });
  } catch (e) {
    await openBatteryList();
  }
}

// 2) 배터리 최적화 목록 화면
export async function openBatteryList() {
  try {
    await IntentLauncher.startActivityAsync('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
  } catch (e) {
    openAppSettings();
  }
}

// 3) 앱 정보 화면 (삼성 등: 배터리 → "제한 없음" 설정)
export function openAppSettings() {
  Linking.openSettings().catch(() => {});
}

export function showBatteryGuide() {
  Alert.alert(
    '절전 모드 설정',
    '절전 모드에서도 러닝 측정이 끊기지 않으려면 아래 설정이 필요해요.\n\n' +
      '1) "배터리 최적화 제외" 허용\n' +
      '2) 삼성 폰: 설정 → 앱 → 운동 → 배터리 → "제한 없음"\n' +
      '3) 절전 모드를 켜도 측정이 끊기면 러닝 중에는 절전 모드를 꺼 주세요.',
    [
      { text: '배터리 최적화 제외', onPress: requestIgnoreBatteryOptimization },
      { text: '앱 설정 열기', onPress: openAppSettings },
      { text: '닫기', style: 'cancel' },
    ]
  );
}
