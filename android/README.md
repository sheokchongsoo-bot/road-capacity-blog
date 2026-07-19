# 오이마켓 — Android 앱

인천연구원 **오이마켓** 프로토타입(PWA)을 그대로 내장한 **네이티브 Android 앱**입니다.
WebView 컨테이너 방식으로, `../app`의 화면·로직을 100% 재사용하며 **완전 오프라인**으로 동작합니다.

## 방식

- 단일 `MainActivity` + `WebView`
- `../app`의 런타임 자산을 빌드 시 `app/src/main/assets/www`로 **자동 동기화**(Gradle `syncWebAssets` 태스크)
- `WebViewAssetLoader`로 `https://appassets.androidplatform.net/assets/www/…`에 매핑
  → `localStorage`(앱 데이터), 서비스워커, 상대경로가 정상 동작
- **인터넷 권한 없음**(모든 자산 내장) · 글쓰기 사진 첨부는 시스템 파일 선택기 사용

## 요구 사항

- Android Studio (Ladybug 이상 권장) 또는 커맨드라인 빌드
- JDK 17+ · Android SDK Platform 35 · Build-Tools 35 · minSdk 26(Android 8.0)

## 빌드 (커맨드라인)

```bash
cd android
# 최초 1회 SDK 경로 지정 (Android Studio는 자동 생성)
echo "sdk.dir=$ANDROID_HOME" > local.properties

# 디버그 APK
./gradlew :app:assembleDebug
# 결과: app/build/outputs/apk/debug/app-debug.apk

# 릴리스(서명 설정 후)
./gradlew :app:assembleRelease
```

Android Studio에서는 `android/` 폴더를 열고 ▶ Run 하면 됩니다.

## 구조

```
android/
  settings.gradle.kts, build.gradle.kts, gradle.properties
  app/
    build.gradle.kts            # syncWebAssets 태스크 포함
    src/main/
      AndroidManifest.xml
      java/kr/re/ii/oimarket/MainActivity.kt
      res/                      # 테마·색상·적응형 아이콘(벡터)
      assets/www/               # (빌드 시 ../app 에서 자동 복사, git 제외)
```

## 프로토타입과의 관계

`../app`이 **단일 소스**입니다. 웹 프로토타입을 수정하면 다음 빌드에서 자동 반영됩니다.
데이터·인증·채팅은 프로토타입과 동일하게 브라우저(WebView) 로컬 저장이며,
실서비스 전환 시 백엔드 연동(제안서 §5)으로 교체합니다.

## 실서비스 배포 옵션

- 지금 방식(자산 내장)은 사내 배포·오프라인에 적합합니다.
- 추후 서버 호스팅이 생기면 동일 코드로 **TWA(Trusted Web Activity)** 또는
  원격 URL 로딩 방식으로 전환할 수 있습니다.
