# 사내 배포 (인트라넷)

직원들이 사내망에서 내려받아 개인 안드로이드폰에 설치하도록 하는 배포 자료입니다.

## 구성
- `install.html` — 직원용 설치 안내 페이지(다운로드·설치법·QR·체크섬)
- `version.json` — 인앱 업데이트 확인용 버전 매니페스트
- `qr.svg` — 설치 페이지 QR (배포 주소로 재생성)
- `make-qr.py` — QR 생성기
- `finalize-release.py` — **APK 하나로 install.html·version.json·qr.svg 를 자동 완성**

## 배포 절차

1. **릴리스 APK 빌드** (서명 키 설정은 `../keystore.properties.example` 참고)
   ```bash
   cd ..
   ./gradlew :app:assembleRelease
   # → app/build/outputs/apk/release/app-release.apk
   ```
2. **배포 자료 자동 완성** (체크섬·용량·버전·QR 한 번에)
   ```bash
   cd distribution
   python3 finalize-release.py ../app/build/outputs/apk/release/app-release.apk \
     --version 0.1.0 --code 1 \
     --base-url "https://intra.ii.re.kr/apps/oimarket/" \
     --notes "최초 배포"
   ```
   → `install.html`(버전·용량·SHA-256·날짜), `version.json`, `qr.svg`, `oimarket-0.1.0.apk` 생성/갱신.
   `--code` 는 앱 `build.gradle.kts` 의 `versionCode` 와 반드시 일치시킬 것.
3. **인트라넷 업로드** — 위 4개 파일을 같은 폴더에.
   - HTTPS 권장, APK MIME 타입 `application/vnd.android.package-archive`, 사내망 접근제어(원내 한정)
   - 담당자·문의는 `install.html` 하단 `CONFIG.contact` 에서 수정

## 인앱 업데이트 확인 (#3)

앱이 실행될 때 `version.json` 을 조회해, `versionCode` 가 더 크면 **“새 버전 있어요” 알림 →
[업데이트]** 로 최신 APK 주소를 열어 설치로 이어줍니다.

- **켜는 법**: 앱의 `res/values/config.xml` → `update_manifest_url` 에 `version.json` 주소를 넣고 빌드.
  (비워두면 업데이트 확인·네트워크 사용 안 함 = 완전 오프라인)
- **업데이트 낼 때**: 앱 `versionCode`(정수)·`versionName` 을 올려 재빌드 → `finalize-release.py` 로
  `--code`·`--version` 을 새 값으로 실행 → 업로드. **반드시 같은 키스토어로 서명**.

### version.json 형식
```json
{
  "versionCode": 2,
  "versionName": "0.2.0",
  "apkUrl": "https://intra.ii.re.kr/apps/oimarket/oimarket-0.2.0.apk",
  "notes": "버그 수정 및 개선"
}
```

## 주의
- 키스토어(`*.jks`)·`keystore.properties`·빌드 APK 는 git 커밋 금지(.gitignore 처리됨).
- 키 분실 시 기존 설치본 업데이트 불가 → 안전 백업 필수.
