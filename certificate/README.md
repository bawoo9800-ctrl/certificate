# 품질인정서 발급 시스템

(주) 정일방화문 품질인정서 및 단열성적서 발급 시스템

## 📋 프로젝트 개요

이 시스템은 품질인정서와 단열성적서를 온라인으로 발급하고 관리하는 웹 기반 애플리케이션입니다.

### 주요 기능
- ✅ 품질인정서 / 단열성적서 발급
- ✅ 발행 내역 조회 및 관리
- ✅ 통계 및 분석
- ✅ PDF 생성 및 다운로드
- ✅ 엑셀 데이터 가져오기/내보내기
- ✅ 견적 계산기 (calculator.html)

## 🗂️ 프로젝트 구조

```
certificate/
├── api/                      # 백엔드 API
│   ├── certificates.php      # 인증서 CRUD API
│   └── config.php            # 데이터베이스 설정
├── css/                      # 스타일시트
│   ├── style.css
│   ├── history.css
│   ├── login.css
│   └── ...
├── js/                       # JavaScript 파일
│   ├── script.js             # 메인 스크립트
│   ├── history.js            # 발행내역 관리
│   └── stats.js              # 통계 기능
├── images/                   # 이미지 리소스
├── web_images/               # 웹 이미지
├── index.html                # 메인 페이지
├── login.html                # 로그인 페이지
├── history.html              # 발행내역 페이지
├── stats.html                # 통계 페이지
├── calculator.html           # 견적 계산기
├── import-to-nas.html        # 데이터 가져오기
└── README.md                 # 프로젝트 문서 (본 파일)
```

## 🚀 설치 및 배포

### 1. 시놀로지 NAS 배포 경로

**이전 경로:** `/volume1/web/`  
**현재 경로:** `/volume1/web/certificate/`

### 2. 데이터베이스 설정

MySQL/MariaDB 데이터베이스가 필요합니다.

```php
// api/config.php 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'quality_system');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 3. 웹 서버 설정

#### Apache 설정 예시

```apache
<VirtualHost *:80>
    DocumentRoot "/volume1/web/certificate"
    
    <Directory "/volume1/web/certificate">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    root /volume1/web/certificate;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

## 🔧 경로 변경 사항 (2026-02-07)

### 변경된 파일들

프로젝트 경로를 `/volume1/web/`에서 `/volume1/web/certificate/`로 이동하면서 다음 파일들의 API 경로를 **절대 경로에서 상대 경로로** 변경했습니다:

1. **js/history.js** - 발행내역 API 호출
2. **js/script.js** - 메인 API 호출
3. **js/stats.js** - 통계 API 호출
4. **import-to-nas.html** - 데이터 가져오기 API 호출
5. **calculator.html** - 견적 계산기 API 호출

### 변경 내용

```javascript
// 이전 (절대 경로)
fetch('/api/certificates.php')

// 변경 후 (상대 경로)
fetch('api/certificates.php')
```

이렇게 변경함으로써:
- ✅ 프로젝트를 어느 경로에 배포하든 상관없이 작동
- ✅ 유지보수 용이
- ✅ 개발 환경과 운영 환경 간 차이 최소화

## 📝 사용 방법

### 로그인

1. `login.html`에서 로그인
2. 기본 계정 정보는 데이터베이스 참조

### 인증서 발급

1. `index.html`에서 서류 타입 선택 (품질인정서/단열성적서)
2. 필요한 정보 입력
3. PDF 업로드 또는 미리보기 생성
4. 다운로드 또는 저장

### 발행 내역 조회

1. `history.html`에서 발행 내역 확인
2. 검색, 정렬, 필터링 기능 사용
3. 재발행 또는 삭제 가능

### 통계 확인

1. `stats.html`에서 다양한 통계 확인
2. 기간별, 회사별 통계 제공
3. 엑셀 내보내기 기능

## 🔒 보안 설정

### 중요: config.php 보안

`api/config.php` 파일에는 민감한 데이터베이스 정보가 포함되어 있습니다.

```bash
# 파일 권한 설정
chmod 600 /volume1/web/certificate/api/config.php
```

### .htaccess 설정 (Apache)

```apache
# api/config.php 직접 접근 차단
<Files "config.php">
    Require all denied
</Files>
```

## 🛠️ 개발 환경

- **프론트엔드:** HTML5, CSS3, JavaScript (ES6+)
- **백엔드:** PHP 7.4+
- **데이터베이스:** MySQL 5.7+ / MariaDB 10.3+
- **라이브러리:**
  - PDF.js (PDF 렌더링)
  - html2pdf.js (PDF 생성)
  - SheetJS (엑셀 처리)
  - Font Awesome (아이콘)

## 📦 백업 및 복원

### 백업

```bash
# 프로젝트 전체 백업
cd /volume1/web
tar -czf certificate_backup_$(date +%Y-%m-%d).tar.gz certificate/

# 데이터베이스 백업
mysqldump -u root -p quality_system > quality_system_backup_$(date +%Y-%m-%d).sql
```

### 복원

```bash
# 프로젝트 복원
cd /volume1/web
tar -xzf certificate_backup_2026-02-07.tar.gz

# 데이터베이스 복원
mysql -u root -p quality_system < quality_system_backup_2026-02-07.sql
```

## 🐛 문제 해결

### API 연결 오류

1. `api/config.php` 데이터베이스 설정 확인
2. PHP 오류 로그 확인: `/var/log/php_errors.log`
3. 웹 서버 오류 로그 확인

### PDF 생성 오류

1. 브라우저 콘솔에서 오류 메시지 확인
2. PDF 파일 크기 제한 확인 (현재: 10MB)
3. 브라우저 캐시 삭제 후 재시도

## 📄 라이선스

© 2024 (주) 정일방화문. All rights reserved.

---

## 📞 문의

문제가 발생하거나 문의사항이 있으시면 시스템 관리자에게 연락해주세요.

**최종 업데이트:** 2026-02-07  
**버전:** 7.3
