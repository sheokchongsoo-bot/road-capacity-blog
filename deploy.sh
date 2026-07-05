#!/bin/sh
# 빌드 후 dist/를 gh-pages 브랜치로 강제 푸시해 GitHub Pages에 배포한다.
set -e
npm run build
REMOTE=$(git remote get-url origin)
cd dist
rm -rf .git
git init -q
git checkout -qb gh-pages
git add -A
git -c user.name="sheokchongsoo" -c user.email="sheokchongsoo@gmail.com" commit -qm "deploy $(date '+%Y-%m-%d %H:%M')"
git push -f "$REMOTE" gh-pages
rm -rf .git
echo "✓ gh-pages 배포 완료"
