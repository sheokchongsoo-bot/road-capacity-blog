# 사내 배포 (인트라넷)

직원들이 사내망에서 내려받아 개인 안드로이드폰에 설치하도록 하는 배포 자료입니다.

## 구성
- `install.html` — 직원용 설치 안내 페이지(다운로드 버튼·설치법·QR)
- `qr.svg` — 설치 페이지 QR (배포 주소로 재생성)
- `make-qr.py` — QR 생성기

## 배포 절차

1. **APK 서명·빌드** (키 설정은 `../keystore.properties.example` 참고)
   ```bash
   cd ..
   ./gradlew :app:assembleRelease
   # → app/build/outputs/apk/release/app-release.apk
   ```
2. **APK 이름 정리·체크섬 확인**
   ```bash
   cp ../app/build/outputs/apk/release/app-release.apk distribution/oimarket-0.1.0.apk
   sha256sum distribution/oimarket-0.1.0.apk
   ```
3. **install.html 값 수정** — 파일 하단 `CONFIG`의 `version`·`apk`·`size`·`updated`·`sha256`·`contact` 를 실제 값으로.
4. **QR 재생성** — 실제 배포 주소로:
   ```bash
   python3 make-qr.py "https://intra.ii.re.kr/apps/oimarket/"
   ```
5. **인트라넷 웹서버에 업로드** — `install.html`, `qr.svg`, `oimarket-<버전>.apk` 를 같은 폴더에.
   - HTTPS 권장, APK MIME 타입 `application/vnd.android.package-archive`
   - 사내망 접근제어(원내 한정)

## 업데이트 배포
- `versionCode`(정수)와 `versionName` 을 올려 재빌드 → 새 APK·페이지 값 교체 → 사내 공지.
- **반드시 같은 키스토어로 서명**해야 기존 설치본이 업데이트됩니다.

## 주의
- 키스토어(`*.jks`)와 `keystore.properties` 는 git 에 커밋 금지(이미 .gitignore 처리).
- 키 분실 시 기존 설치본 업데이트 불가 → 안전 백업 필수.
