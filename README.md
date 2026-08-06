# 러닝 트래커 (Expo 앱)

브라우저가 아닌 진짜 네이티브 앱으로 실행하기 위한 React Native(Expo) 프로젝트예요.
실제 GPS(expo-location)로 거리를 측정하고, 프로필 체중을 기반으로 칼로리를 계산해요.

## 0. 준비물
- 컴퓨터에 Node.js 설치 (https://nodejs.org, LTS 버전)
- 폰에 **Expo Go** 앱 설치 (App Store / Play Store에서 "Expo Go" 검색)

## 1. 프로젝트 실행 (제일 먼저 이걸로 확인하세요)
압축을 풀고 터미널(명령 프롬프트)에서 이 폴더로 이동한 뒤:

```
npm install
npx expo install --fix
```

`npx expo install --fix`는 지금 설치된 Expo Go 앱 버전에 맞춰 모든 패키지 버전을 자동으로 정확히 맞춰주는 명령어예요.
Expo SDK는 몇 달마다 새 버전이 나오기 때문에, 버전을 직접 하나하나 맞추는 것보다 이 명령어를 쓰는 게 훨씬 안전해요.

그다음:
```
npx expo start
```

터미널에 QR코드가 뜨면:
- **안드로이드**: Expo Go 앱을 열고 "Scan QR Code"로 스캔
- **아이폰**: 기본 카메라 앱으로 QR코드를 스캔하면 Expo Go로 연결

몇 초 후 폰에서 앱이 실행돼요. 이 상태는 이미 브라우저 주소창이 전혀 없는 **진짜 네이티브 앱 실행 화면**이에요.
(단, Expo Go 안에서 도는 상태라 앱 아이콘은 아직 Expo Go로 보여요.)

## 2. 진짜 설치 파일(apk) 만들기 — Expo Go 없이 독립 실행

```
npm install -g eas-cli
eas login
```
(Expo 계정이 없으면 로그인 화면에서 무료로 바로 가입돼요.)

```
eas build --platform android --profile preview
```

- 처음 실행하면 앱 아이콘/패키지 이름 관련 몇 가지 질문에 Enter로 기본값을 진행하면 돼요.
- 빌드는 Expo 클라우드 서버에서 진행돼요 (컴퓨터 사양과 무관, 보통 5~15분 소요).
- 끝나면 터미널에 `https://expo.dev/artifacts/...` 같은 apk 다운로드 링크가 떠요. 그 링크를 폰 브라우저로 열어서 다운로드하면 바로 설치 파일이 받아져요.
- 폰에서 설치할 때 "출처를 알 수 없는 앱" 허용 팝업이 뜰 수 있어요 → 허용하면 설치 진행돼요.

이 apk는 Expo Go 앱 없이 독립적으로 실행되고, 실제 앱 아이콘(초록 배경 러닝 코스 아이콘)으로 홈 화면에 설치돼요.

아이폰(.ipa)은 애플 개발자 계정(연 $99)이 있어야 실제 기기 설치가 가능해요:
```
eas build --platform ios --profile preview
```
계정이 없다면 우선 1번 Expo Go 방식으로 테스트하면 돼요.

## 거리·시간이 실제보다 적게 측정되는 문제 (수정됨)
이전 버전은 화면이 꺼지거나 앱이 백그라운드로 가면 GPS와 타이머가 멈춰서 실제보다 거리가 적게 잡히는 문제가 있었어요.
지금 버전은 화면이 꺼져 있어도 계속 기록되도록 백그라운드 위치 추적을 켰어요. 러닝을 시작하면:
- 위치 권한을 두 번 물어봐요: 먼저 "앱 사용 중" 허용 → 그다음 "항상 허용"(백그라운드) 허용. 둘 다 허용해야 화면이 꺼져도 계속 측정돼요.
- 안드로이드는 상태 표시줄에 "러닝 측정 중" 알림이 계속 떠 있어요 — 이건 정상이고, 이게 있어야 화면이 꺼져도 시스템이 앱을 안 죽여요.
- 이 기능은 `eas build`로 만든 실제 앱(apk)에서만 정상 동작해요. Expo Go 안에서는 백그라운드 추적이 제한적이라 화면을 켜둔 상태로 테스트해주세요.

**중요:** app.json에 새 권한이 추가됐기 때문에, 기존에 만든 apk가 아니라 **다시 빌드**해야 반영돼요:
```
eas build --platform android --profile preview
```

## 걸음 수 기능 추가
app.json에 걸음 수 측정 권한(NSMotionUsageDescription, ACTIVITY_RECOGNITION)이 새로 추가됐기 때문에,
반드시 **다시 빌드**해야 반영돼요:
```
eas build --platform android --profile preview
```
앱을 처음 열면 동작 및 피트니스 활동 권한을 물어봐요 — 허용해야 걸음 수가 표시돼요.
안드로이드 기기에 따라 앱이 꺼져 있는 동안의 걸음까지는 못 세고, 앱을 켠 이후부터의 걸음만 정확히 세는 경우가 있어요 (기기 하드웨어 걸음 센서 지원 여부에 따라 달라요).

## 3. app.json에서 바꿔야 할 것
`com.yourname.runningtracker` 부분을 원하는 고유 패키지 이름으로 바꿔주세요 (예: `com.jisoo.runtracker`).
이름과 아이콘은 이미 채워져 있어요.

## 폴더 구조
```
App.js                 앱 진입점 (탭 네비게이션)
src/screens/           홈 / 러닝 / 완료 / 기록 / 프로필 화면
src/storage.js         AsyncStorage 기반 저장 (프로필, 러닝 기록)
src/utils.js           거리 계산(GPS), 페이스/칼로리 계산
src/theme.js           색상 토큰
assets/                앱 아이콘, 스플래시 이미지
```
