#!/usr/bin/env python3
"""설치 페이지용 QR 코드(SVG) 생성기.

사용:
    pip install segno
    python3 make-qr.py "https://intra.ii.re.kr/apps/oimarket/"

인자로 준 URL(대개 설치 페이지 또는 APK 주소)을 인코딩해 qr.svg 로 저장한다.
install.html 은 같은 폴더의 ./qr.svg 를 참조하므로, 배포 주소가 정해지면
이 스크립트로 qr.svg 만 다시 생성하면 된다.
"""
import sys
import segno

DEFAULT_URL = "https://intra.ii.re.kr/apps/oimarket/"


def main() -> None:
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    out = sys.argv[2] if len(sys.argv) > 2 else "qr.svg"
    qr = segno.make(url, error="m")
    # 브랜드 그린으로, 배경 투명하게 저장
    qr.save(out, kind="svg", scale=6, border=2, dark="#1e7a34", light=None)
    print(f"wrote {out}  ({url})")


if __name__ == "__main__":
    main()
