# NAS 서버에 수정사항 적용하기

## 🎯 수정 내용

**문제:** 발행내역 페이지에서 총 325건이 아닌 10건만 표시  
**원인:** `history.js` 파일에서 `totalCount` 변수가 현재 페이지 데이터로 덮어써짐  
**해결:** 검색 시에만 `totalCount`를 업데이트하도록 수정

---

## 🚀 NAS SSH 접속 후 실행할 명령어

### 단계 1: 프로젝트 디렉토리로 이동

```bash
cd /volume1/web/certificate
```

### 단계 2: 현재 Git 상태 확인

```bash
git status
```

**예상 출력:**
```
On branch main
Your branch is behind 'origin/main' by 2 commits.
```

### 단계 3: 최신 코드 가져오기

```bash
# 원격 저장소에서 최신 코드 pull
git pull origin main
```

**성공 메시지:**
```
Updating 62f45f6..f6ba9a1
Fast-forward
 js/history.js            | 3 ++-
 NAS_DEPLOYMENT_GUIDE.md  | 399 +++++++++++++++++++++++++++++++++++
 2 files changed, 401 insertions(+), 1 deletion(-)
 create mode 100644 NAS_DEPLOYMENT_GUIDE.md
```

### 단계 4: 수정된 파일 확인

```bash
# history.js 파일의 115-117번 라인 확인
sed -n '115,117p' js/history.js
```

**예상 출력:**
```javascript
            // 검색 시에만 totalCount를 검색 결과 개수로 업데이트
            totalCount = filteredData.length;
        }
```

### 단계 5: 웹 브라우저에서 테스트

1. **강력 새로고침** (캐시 무시)
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **발행내역 페이지 접속**
   ```
   http://192.168.0.109:3003/history.html
   ```

3. **통계 카드 확인**
   - "총 발행 건수"가 **325**로 표시되는지 확인
   - "오늘 발행"과 "이번 주 발행" 숫자도 확인

---

## ✅ 테스트 시나리오

### 테스트 1: 초기 로드
- **기대값:** 총 발행 건수 = 325
- **현재 페이지:** 10개 항목 표시
- **페이지네이션:** 33페이지 (325 ÷ 10 = 32.5)

### 테스트 2: 검색 기능
1. 검색창에 특정 업체명 입력 (예: "테스트")
2. 검색 버튼 클릭
3. **기대값:** 총 발행 건수 = 검색 결과 수 (예: 5건)

### 테스트 3: 검색 초기화
1. 검색창 비우기
2. 새로고침 버튼 클릭
3. **기대값:** 총 발행 건수 = 325 (원래 값으로 복귀)

---

## 🐛 문제 발생 시

### 문제 1: Git pull 실패 - 권한 오류

**증상:**
```
error: cannot open .git/FETCH_HEAD: Permission denied
```

**해결방법:**
```bash
# 프로젝트 디렉토리 소유권 확인
ls -la /volume1/web/certificate/.git

# 소유권 변경 (필요시)
sudo chown -R admin:users /volume1/web/certificate

# 다시 pull
git pull origin main
```

### 문제 2: Git pull 실패 - 로컬 변경사항 충돌

**증상:**
```
error: Your local changes to the following files would be overwritten by merge:
    js/history.js
```

**해결방법:**

**옵션 A: 로컬 변경사항 백업 후 덮어쓰기 (추천)**
```bash
# 로컬 변경사항 임시 저장
git stash

# 최신 코드 가져오기
git pull origin main

# 임시 저장한 변경사항 보기 (필요시)
git stash list
```

**옵션 B: 로컬 변경사항 완전히 버리고 최신 코드로 교체**
```bash
# ⚠️ 경고: 로컬 변경사항이 완전히 삭제됩니다!
git reset --hard origin/main
```

### 문제 3: 브라우저에 여전히 10건으로 표시됨

**원인:** 브라우저 캐시

**해결방법:**

1. **강력 새로고침 (Hard Refresh)**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **개발자 도구로 캐시 완전 삭제**
   - `F12` 눌러서 개발자 도구 열기
   - `Application` (또는 `애플리케이션`) 탭
   - 좌측 메뉴에서 `Storage` → `Clear site data`
   - 페이지 새로고침

3. **버전 파라미터 확인**
   - 주소창에 다음과 같이 입력:
   ```
   http://192.168.0.109:3003/history.html?v=20260207
   ```

### 문제 4: API가 여전히 10건만 반환

**증상:**
```javascript
console.log('📊 result.total:', result.total);
// 출력: 10 (예상: 325)
```

**해결방법:**
```bash
# API 직접 테스트
curl http://192.168.0.109:3003/api/certificates.php?page=1&limit=10

# JSON 결과에서 total 값 확인
# "total":325 여야 함

# total이 10이면 PHP 파일 확인
cat api/certificates.php | grep -A 5 "total"
```

---

## 📊 변경 이력

| 날짜 | 커밋 | 변경 내용 |
|------|------|-----------|
| 2026-02-07 | `4051d24` | `history.js` 총 발행 건수 버그 수정 |
| 2026-02-07 | `f6ba9a1` | NAS 배포 가이드 문서 추가 |

---

## 🔗 참고 링크

- **GitHub 저장소:** https://github.com/bawoo9800-ctrl/certificate
- **최신 커밋:** https://github.com/bawoo9800-ctrl/certificate/commits/main
- **수정 파일 보기:** https://github.com/bawoo9800-ctrl/certificate/blob/main/certificate/js/history.js

---

## 💡 빠른 실행 (한 줄 명령어)

```bash
cd /volume1/web/certificate && git pull origin main && echo "✅ 업데이트 완료! 브라우저에서 Ctrl+Shift+R로 새로고침하세요."
```

---

**작성일:** 2026-02-07  
**작성자:** Claude AI Assistant
