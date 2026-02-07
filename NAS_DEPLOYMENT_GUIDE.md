# Synology NAS Deployment Guide
## 품질인정서 시스템 배포 가이드

배포 일자: 2026-02-07  
Synology NAS IP: 192.168.0.109  
도메인: https://ce.doorlife.synology.me  
Apache 포트: 3003

---

## 📋 목차

1. [프로젝트 경로 이동](#1-프로젝트-경로-이동)
2. [Apache 설정](#2-apache-설정)
3. [PHP-FPM 설정](#3-php-fpm-설정)
4. [데이터베이스 확인](#4-데이터베이스-확인)
5. [리버스 프록시 설정](#5-리버스-프록시-설정)
6. [최근 수정 사항](#6-최근-수정-사항)

---

## 1. 프로젝트 경로 이동

### 이전 경로 → 새 경로

```bash
# 이전: /volume1/web/
# 현재: /volume1/web/certificate/

# 파일 이동 (이미 완료됨)
cd /volume1/web
mv * certificate/  # 또는 cp -r * certificate/
```

### 파일 권한 설정

```bash
cd /volume1/web/certificate
chown -R http:http .
chmod -R 755 .
chmod -R 775 api/
```

---

## 2. Apache 설정

### 2.1 Virtual Host 설정 파일 생성

경로: `/usr/local/etc/apache24/sites-enabled/certificate-3003.conf`

```apache
<VirtualHost *:3003>
    ServerName 192.168.0.109
    ServerAlias localhost ce.doorlife.synology.me
    DocumentRoot "/volume1/web/certificate"
    
    <Directory "/volume1/web/certificate">
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
        AddDefaultCharset UTF-8
        DirectoryIndex index.html index.php login.html
    </Directory>
    
    # PHP-FPM 설정
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/run/php-fpm/php-182b445b-6caf-469f-acaa-a763582ba8db.sock|fcgi://localhost/"
    </FilesMatch>
</VirtualHost>
```

### 2.2 메인 Apache 설정에 포트 추가

파일: `/var/packages/Apache2.4/target/usr/local/etc/apache24/conf/httpd24.conf`

파일 끝에 추가:

```apache
# Certificate System on Port 3003
Listen 3003
Include /usr/local/etc/apache24/sites-enabled/certificate-3003.conf
```

### 2.3 Apache 재시작

```bash
# 설정 테스트
/usr/local/bin/apachectl configtest

# Apache 재시작
/usr/local/bin/apachectl restart

# 또는 DSM 웹 UI에서
# 패키지 센터 → Apache HTTP Server 2.4 → 중지 → 시작
```

### 2.4 포트 확인

```bash
# Apache가 3003 포트를 리스닝하는지 확인
netstat -tuln | grep 3003

# 프로세스 확인
ps aux | grep httpd
```

---

## 3. PHP-FPM 설정

### 3.1 PHP-FPM 소켓 경로 확인

```bash
# PHP-FPM 소켓 파일 찾기
find /run -name "php*.sock" 2>/dev/null

# 현재 사용 중인 소켓
# /run/php-fpm/php-182b445b-6caf-469f-acaa-a763582ba8db.sock
```

### 3.2 PHP 버전 확인

```bash
php -v
# PHP 8.2.x

# PHP-FPM 프로세스 확인
ps aux | grep php-fpm
```

---

## 4. 데이터베이스 확인

### 4.1 데이터베이스 정보

```
Host: localhost
Database: quality_system
User: root
Password: Choi9808@@
Table: certificates
```

### 4.2 데이터 통계

```bash
# MariaDB 접속
mysql -u root -p

# 데이터베이스 선택
USE quality_system;

# 통계 확인
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) as deleted
FROM certificates;

# 결과:
# total: 538
# active: 325  ← 현재 활성 레코드
# deleted: 213
```

### 4.3 API 응답 구조

```json
{
  "data": [...],
  "total": 325,
  "page": 1,
  "limit": 10,
  "table": "certificates"
}
```

---

## 5. 리버스 프록시 설정

### 5.1 DSM 설정 경로

```
DSM 제어판 → 로그인 포털 → 고급 → 리버스 프록시
```

### 5.2 리버스 프록시 규칙 생성

**설정 내용:**

| 항목 | 값 |
|------|-----|
| 설명 | Certificate System |
| 소스 프로토콜 | HTTPS |
| 소스 호스트명 | ce.doorlife.synology.me |
| 소스 포트 | 443 |
| 대상 프로토콜 | HTTP |
| 대상 호스트명 | localhost |
| 대상 포트 | 3003 |

**사용자 지정 헤더 (선택사항):**

```
# 헤더 생성
WebSocket 지원: 예
```

### 5.3 SSL 인증서 설정

```
DSM 제어판 → 보안 → 인증서
→ ce.doorlife.synology.me 인증서 확인/갱신
```

---

## 6. 최근 수정 사항

### 6.1 JavaScript 총 발행 건수 버그 수정 (2026-02-07)

**문제:**
- 발행내역 페이지에서 총 325건이 아닌 10건만 표시됨
- `history.js` 라인 116에서 `totalCount`가 현재 페이지 데이터 길이로 덮어써짐

**수정 내용:**

```javascript
// 이전 코드 (버그)
totalCount = filteredData.length;  // 항상 10으로 덮어씀

// 수정 코드 (정상)
if (searchQuery) {
    totalCount = filteredData.length;  // 검색 시에만 업데이트
}
```

**파일 위치:** `/volume1/web/certificate/js/history.js`

**커밋 정보:**
```
Commit: 4051d24
Message: fix: 총 발행 건수 표시 오류 수정 - 검색 시에만 totalCount 업데이트하도록 변경
Date: 2026-02-07
```

### 6.2 로그인 인증 추가 (이전)

**파일:** `js/login.js`

**하드코딩된 사용자 계정:**
```javascript
const validUsers = {
    'admin': '1234',
    'user': 'password'
};
```

---

## 🧪 테스트 방법

### 1. 로컬 접속 테스트

```bash
# 브라우저에서 접속
http://192.168.0.109:3003/

# 또는 curl로 테스트
curl -I http://192.168.0.109:3003/
```

### 2. 도메인 접속 테스트 (리버스 프록시 설정 후)

```bash
# HTTPS 접속
https://ce.doorlife.synology.me/

# 로그인 페이지
https://ce.doorlife.synology.me/login.html

# 발행내역 페이지
https://ce.doorlife.synology.me/history.html
```

### 3. API 테스트

```bash
# API 응답 확인
curl http://192.168.0.109:3003/api/certificates.php?page=1&limit=10

# 전체 건수 확인
curl http://192.168.0.109:3003/api/certificates.php?page=1&limit=10 | jq '.total'
# 예상 결과: 325
```

### 4. PHP 동작 확인

```bash
# PHP 정보 페이지 생성
echo "<?php phpinfo(); ?>" > /volume1/web/certificate/test.php

# 브라우저에서 확인
http://192.168.0.109:3003/test.php

# 확인 후 삭제
rm /volume1/web/certificate/test.php
```

---

## 🐛 트러블슈팅

### 문제 1: Apache가 3003 포트를 리스닝하지 않음

**해결방법:**
```bash
# httpd24.conf에 Listen 3003이 추가되었는지 확인
grep "Listen 3003" /var/packages/Apache2.4/target/usr/local/etc/apache24/conf/httpd24.conf

# 없으면 추가
echo "Listen 3003" >> /var/packages/Apache2.4/target/usr/local/etc/apache24/conf/httpd24.conf

# Apache 재시작
/usr/local/bin/apachectl restart
```

### 문제 2: PHP 파일이 다운로드됨 (실행되지 않음)

**해결방법:**
```bash
# PHP-FPM이 실행 중인지 확인
ps aux | grep php-fpm

# 소켓 파일이 존재하는지 확인
ls -la /run/php-fpm/php-182b445b-6caf-469f-acaa-a763582ba8db.sock

# Apache 설정에서 FilesMatch 블록 확인
grep -A 2 "FilesMatch" /usr/local/etc/apache24/sites-enabled/certificate-3003.conf
```

### 문제 3: 발행내역이 10건만 표시됨

**해결방법:**
```bash
# 최신 코드로 업데이트
cd /volume1/web
git pull origin main

# 또는 수동으로 파일 업데이트
# history.js 파일 수정 (위 6.1 참조)

# 브라우저 캐시 강력 새로고침
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R
```

### 문제 4: 데이터베이스 연결 실패

**해결방법:**
```bash
# MariaDB 서비스 확인
systemctl status mariadb

# 또는 DSM 패키지 센터에서 MariaDB 10 확인

# 데이터베이스 접속 테스트
mysql -u root -p -e "USE quality_system; SELECT COUNT(*) FROM certificates;"
```

---

## 📞 연락처 및 참고자료

- **GitHub Repository:** https://github.com/bawoo9800-ctrl/certificate
- **최근 커밋:** https://github.com/bawoo9800-ctrl/certificate/commit/4051d24

---

## ✅ 체크리스트

배포 완료 확인:

- [x] 프로젝트가 `/volume1/web/certificate/`에 위치
- [x] Apache가 3003 포트에서 실행 중
- [x] PHP-FPM과 Apache 연동 완료
- [x] 데이터베이스 연결 정상 (325건 활성 레코드)
- [x] 로컬 접속 가능 (http://192.168.0.109:3003/)
- [ ] 리버스 프록시 설정 (DSM 제어판)
- [ ] HTTPS 도메인 접속 가능 (https://ce.doorlife.synology.me/)
- [x] 발행내역 총 건수 정상 표시 (325건)
- [x] GitHub 저장소 동기화 완료

---

**마지막 업데이트:** 2026-02-07  
**작성자:** Claude (AI Assistant)
