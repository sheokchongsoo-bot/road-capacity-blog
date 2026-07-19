#!/usr/bin/env bash
# 오이마켓 release APK 빌드 + 배포 자료 완성 (한 방).
#
# ⚠️ 구글 호스트(dl.google.com, maven.google.com)에 접근 가능한 환경에서만 동작합니다.
#    (Android SDK·AGP·AndroidX 를 그곳에서 받기 때문)
#
# 사용:
#   bash android/build-release.sh \
#     --version 0.1.0 --code 1 \
#     --base-url https://intra.ii.re.kr/apps/oimarket/ \
#     [--notes "최초 배포"] [--test-keystore]
#
#   --test-keystore : 운영 키가 아직 없을 때 검증용 임시 키스토어를 생성해 서명(배포용 아님).
#                     실제 배포는 android/keystore.properties 에 운영 키를 설정하세요.
set -euo pipefail
cd "$(dirname "$0")"

VERSION=""; CODE=""; BASE_URL=""; NOTES=""; TEST_KS=0
while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="$2"; shift 2;;
    --code) CODE="$2"; shift 2;;
    --base-url) BASE_URL="$2"; shift 2;;
    --notes) NOTES="$2"; shift 2;;
    --test-keystore) TEST_KS=1; shift;;
    *) echo "알 수 없는 인자: $1"; exit 1;;
  esac
done
[ -n "$VERSION" ] && [ -n "$CODE" ] && [ -n "$BASE_URL" ] || {
  echo "필요 인자: --version <이름> --code <정수> --base-url <URL>"; exit 1; }

export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
SDKM="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"

if [ ! -x "$SDKM" ]; then
  echo "▶ Android command-line tools 설치..."
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  TMPZIP="$(mktemp).zip"
  curl -fSL -o "$TMPZIP" \
    "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
  unzip -q "$TMPZIP" -d "$ANDROID_HOME/cmdline-tools"
  mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
  rm -f "$TMPZIP"
fi

echo "▶ SDK 구성요소 설치(platform-35, build-tools;35.0.0)..."
yes | "$SDKM" --licenses >/dev/null 2>&1 || true
"$SDKM" "platform-tools" "platforms;android-35" "build-tools;35.0.0" >/dev/null

echo "sdk.dir=$ANDROID_HOME" > local.properties

if [ "$TEST_KS" = "1" ] && [ ! -f keystore.properties ]; then
  echo "▶ 검증용 임시 키스토어 생성(운영 배포용 아님)..."
  keytool -genkeypair -v -keystore oimarket-test.jks \
    -storepass oimarket -keypass oimarket -alias oimarket \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=OiMarket, OU=II, O=Incheon Institute, L=Incheon, C=KR" >/dev/null
  cat > keystore.properties <<EOF
storeFile=$(pwd)/oimarket-test.jks
storePassword=oimarket
keyAlias=oimarket
keyPassword=oimarket
EOF
fi

echo "▶ 릴리스 빌드..."
chmod +x ./gradlew
./gradlew :app:assembleRelease

APK="app/build/outputs/apk/release/app-release.apk"
[ -f "$APK" ] || { echo "APK 생성 실패"; exit 1; }

echo "▶ 배포 자료 완성(install.html·version.json·qr.svg)..."
python3 distribution/finalize-release.py "$APK" \
  --version "$VERSION" --code "$CODE" --base-url "$BASE_URL" ${NOTES:+--notes "$NOTES"}

echo "✅ 완료 → android/distribution/ (install.html, version.json, qr.svg, oimarket-$VERSION.apk)"
