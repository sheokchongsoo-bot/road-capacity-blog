#!/usr/bin/env python3
"""릴리스 APK 하나로 사내 배포 자료를 완성한다.

- APK의 SHA-256·용량을 계산해 install.html 의 CONFIG(version/apk/size/updated/sha256)를 갱신
- version.json 을 갱신(versionCode/versionName/apkUrl/notes) → 인앱 업데이트 확인용
- 배포 주소로 qr.svg 재생성(segno 설치 시)

사용:
    python3 finalize-release.py <APK경로> \
        --version 0.2.0 --code 2 \
        --base-url https://intra.ii.re.kr/apps/oimarket/ \
        [--notes "버그 수정 및 개선"] [--date 2026-08-01]

메모:
- --code(정수 versionCode)는 앱 build.gradle.kts 의 versionCode 와 반드시 일치해야 한다.
- APK 파일명은 base-url 뒤에 그대로 붙는다(예: base-url + oimarket-0.2.0.apk).
"""
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))


def human_size(n: int) -> str:
    mb = n / (1024 * 1024)
    if mb >= 1:
        return f"약 {mb:.1f} MB"
    return f"약 {n / 1024:.0f} KB"


def sha256_of(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def set_config_value(html: str, key: str, value: str) -> str:
    # var CONFIG 의 `key: "..."` 값을 교체
    pattern = re.compile(r'(' + re.escape(key) + r'\s*:\s*")[^"]*(")')
    new, count = pattern.subn(lambda m: m.group(1) + value + m.group(2), html, count=1)
    if count == 0:
        print(f"  ! install.html 에서 '{key}' 를 찾지 못했습니다(건너뜀)")
    return new


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("apk", help="release APK 경로")
    ap.add_argument("--version", required=True, help="versionName 예: 0.2.0")
    ap.add_argument("--code", required=True, type=int, help="versionCode 정수 예: 2")
    ap.add_argument("--base-url", required=True, help="배포 폴더 URL(끝에 / 포함)")
    ap.add_argument("--notes", default="", help="업데이트 설명")
    ap.add_argument("--date", default=date.today().isoformat(), help="업데이트 날짜(기본: 오늘)")
    args = ap.parse_args()

    if not os.path.isfile(args.apk):
        sys.exit(f"APK 를 찾을 수 없습니다: {args.apk}")

    apk_name = f"oimarket-{args.version}.apk"
    base = args.base_url if args.base_url.endswith("/") else args.base_url + "/"
    apk_url = base + apk_name

    size = os.path.getsize(args.apk)
    digest = sha256_of(args.apk)

    # 배포 폴더에 표준 이름으로 복사
    dst = os.path.join(HERE, apk_name)
    if os.path.abspath(args.apk) != os.path.abspath(dst):
        with open(args.apk, "rb") as s, open(dst, "wb") as d:
            d.write(s.read())
    print(f"APK      : {apk_name}  ({human_size(size)})")
    print(f"SHA-256  : {digest}")
    print(f"APK URL  : {apk_url}")

    # install.html 갱신
    ih = os.path.join(HERE, "install.html")
    html = open(ih, encoding="utf-8").read()
    html = set_config_value(html, "version", args.version)
    html = set_config_value(html, "apk", apk_name)
    html = set_config_value(html, "size", human_size(size))
    html = set_config_value(html, "updated", args.date)
    html = set_config_value(html, "sha256", digest)
    open(ih, "w", encoding="utf-8").write(html)
    print("install.html 갱신 완료")

    # version.json 갱신
    vj = {
        "versionCode": args.code,
        "versionName": args.version,
        "apkUrl": apk_url,
        "notes": args.notes or f"v{args.version} 업데이트",
    }
    open(os.path.join(HERE, "version.json"), "w", encoding="utf-8").write(
        json.dumps(vj, ensure_ascii=False, indent=2) + "\n"
    )
    print("version.json 갱신 완료")

    # QR 재생성(가능하면)
    try:
        subprocess.run([sys.executable, os.path.join(HERE, "make-qr.py"), base,
                        os.path.join(HERE, "qr.svg")], check=True)
    except Exception as e:
        print(f"  ! QR 재생성 건너뜀({e}). 필요 시: python3 make-qr.py \"{base}\"")

    print("\n완료. 업로드할 파일: install.html, qr.svg, version.json, " + apk_name)


if __name__ == "__main__":
    main()
