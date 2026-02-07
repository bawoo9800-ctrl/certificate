# ⚡ 빠른 해결 가이드

## 🚨 현재 상황

**문제:** 발행내역 페이지에서 JavaScript 오류 발생
```
history.js?v=10.13:153 Uncaught SyntaxError: Unexpected token 'catch'
```

**원인:** NAS 서버에 이전의 잘못된 코드가 캐시됨

**해결:** 최신 코드로 강제 업데이트 필요

---

## 🚀 NAS SSH에서 실행 (1분 안에 해결)

### ✨ 한 줄 명령어 (복사 → 붙여넣기)

```bash
cd /volume1/web/certificate && git fetch origin main && git reset --hard origin/main && echo "✅ 완료!"
```

### 실행 후 확인

```bash
# 최신 커밋 확인 (8ef74c2 또는 그 이후여야 함)
git log --oneline -1
```

**예상 출력:**
```
c012a1d docs: 발행내역 JavaScript 오류 긴급 수정 가이드 추가
```

또는

```
8ef74c2 fix: history.js 버전을 10.14로 업데이트 (브라우저 캐시 우회)
```

---

## 🌐 브라우저 테스트

### 1단계: 강력 새로고침

```
주소: http://192.168.0.109:3003/history.html
키보드: Ctrl + Shift + R (Windows/Linux)
        Cmd + Shift + R (Mac)
```

### 2단계: 확인 사항

- [ ] JavaScript 오류 없음
- [ ] "총 발행 건수: 325" 표시
- [ ] 테이블에 데이터 10개 표시
- [ ] 페이지네이션 정상 (1, 2, 3 ... 33)

---

## 🐛 여전히 안 되면

### 방법 1: Apache 재시작

```bash
sudo /usr/local/bin/apachectl restart
```

### 방법 2: 시크릿 모드로 테스트

- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`

새 창에서 `http://192.168.0.109:3003/history.html` 접속

### 방법 3: 브라우저 캐시 삭제

1. `F12` → `Application` 탭
2. `Storage` → `Clear site data`
3. 페이지 새로고침

---

## 📚 상세 문서

자세한 설명이 필요하면:

1. **EMERGENCY_FIX.md** - 상세 해결 가이드
2. **NAS_DEPLOYMENT_GUIDE.md** - 전체 배포 가이드
3. **APPLY_FIX_ON_NAS.md** - 일반 업데이트 가이드

---

## ✅ 성공 확인

콘솔에서 (`F12` → `Console`):

```javascript
✅ 발행 내역 조회 완료
📊 API에서 받은 총 건수: 325
✅ 총 발행 건수: 325
```

화면에서:
- "총 발행 건수: **325**" ← 이렇게 표시되면 성공!

---

## 🔗 GitHub

**최신 코드:** https://github.com/bawoo9800-ctrl/certificate/commit/c012a1d

---

**작성일:** 2026-02-07  
**작성자:** Claude AI
