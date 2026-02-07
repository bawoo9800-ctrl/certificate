// ===== script.js v6.6 로드 확인 =====
console.log('🚀 script.js v6.6 로드됨 (PDF 크기 제한 + 에러 처리 강화)');

// ===== 서류 타입 관리 =====
let currentDocumentType = 'quality'; // 'quality' 또는 'insulation'
window.currentDocumentType = currentDocumentType; // 전역 노출

function updateDocumentType() {
    const selectedType = document.querySelector('input[name="documentType"]:checked').value;
    currentDocumentType = selectedType;
    window.currentDocumentType = selectedType; // 전역 업데이트
    
    const isQuality = selectedType === 'quality';
    const docName = isQuality ? '품질인정서' : '단열성적서';
    
    // 폼 제목 변경
    const formTitle = document.getElementById('formTitle');
    if (formTitle) {
        formTitle.textContent = `${docName} 정보 입력`;
    }
    
    // 품질관리서 행 표시/숨김
    const quality1Row = document.getElementById('quality1Row');
    if (quality1Row) {
        quality1Row.style.display = isQuality ? '' : 'none';
    }
    
    // 메인 서류 레이블 변경 (품질인정서 → 단열성적서)
    const mainDocLabel = document.getElementById('mainDocumentLabel');
    if (mainDocLabel) {
        mainDocLabel.textContent = docName;
    }
    
    // 미리보기 placeholder 텍스트 변경
    const previewPlaceholder = document.getElementById('previewPlaceholderText');
    if (previewPlaceholder) {
        previewPlaceholder.innerHTML = `${docName} PDF를 업로드하거나<br>좌측 폼을 작성하고 "미리보기 생성" 버튼을 클릭하세요`;
    }
    
    // 다운로드 버튼 텍스트 변경
    const downloadBtnText = document.getElementById('downloadButtonText');
    if (downloadBtnText) {
        downloadBtnText.textContent = `${docName}만 다운로드`;
    }
    
    console.log('📄 서류 타입 변경:', docName);
    console.log('  - 품질관리서 표시:', isQuality);
    console.log('  - 다운로드 버튼:', `${docName}만 다운로드`);
}

// ===== 로그인 관련 함수 =====
// 페이지 로드 시 사용자 정보 표시 및 재발행 데이터 확인
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOMContentLoaded 이벤트 발생');
    displayUserInfo();
    loadReissueData();
    
    // 문서 타입 초기 설정
    updateDocumentType();
    
    // 문서 타입 라디오 버튼 이벤트 리스너
    const docTypeRadios = document.querySelectorAll('input[name="documentType"]');
    docTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateDocumentType);
    });
});

// 사용자 정보 표시
function displayUserInfo() {
    const username = sessionStorage.getItem('username') || localStorage.getItem('username');
    const usernameDisplay = document.getElementById('usernameDisplay');
    
    if (username && usernameDisplay) {
        usernameDisplay.textContent = username;
    }
}

// 재발행 데이터 자동 입력
function loadReissueData() {
    const reissueDataStr = sessionStorage.getItem('reissueData');
    
    if (reissueDataStr) {
        try {
            const reissueData = JSON.parse(reissueDataStr);
            console.log('🔄 재발행 데이터 발견:', reissueData);
            
            // 폼에 데이터 자동 입력
            if (document.getElementById('issueNo')) {
                document.getElementById('issueNo').value = reissueData.issueNo || '';
                document.getElementById('companyName').value = reissueData.companyName || '';
                document.getElementById('issueDate').value = reissueData.issueDate || '';
                document.getElementById('siteName').value = reissueData.siteName || '';
                if (document.getElementById('siteAddress')) {
                    document.getElementById('siteAddress').value = reissueData.siteAddress || '';
                }
                document.getElementById('deliveryDate').value = reissueData.deliveryDate || '';
                
                console.log('✓ 재발행 데이터 자동 입력 완료');
                
                // 알림 표시
                showNotification('재발행 데이터가 자동으로 입력되었습니다. 필요시 수정 후 미리보기를 생성하세요.', 'success');
                
                // 재발행 데이터 삭제 (한 번만 사용)
                sessionStorage.removeItem('reissueData');
                
                // 폼으로 스크롤
                setTimeout(() => {
                    document.getElementById('issueNo').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 500);
            }
        } catch (error) {
            console.error('❌ 재발행 데이터 로드 오류:', error);
            sessionStorage.removeItem('reissueData');
        }
    }
}

// 로그아웃 함수
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        // 세션 스토리지 클리어
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('loginTime');
        
        // 로컬 스토리지의 "로그인 상태 유지" 제거
        localStorage.removeItem('rememberMe');
        
        showNotification('로그아웃 되었습니다.', 'success');
        
        // 0.5초 후 로그인 페이지로 이동
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
}

// ===== 기존 함수들 =====
// 날짜 포맷 함수 (YYYY. MM. DD 형식)
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}. ${month}. ${day}`;
}

// 오늘 날짜를 기본값으로 설정
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('issueDate').value = today;
    document.getElementById('deliveryDate').value = today;
}

// 폼 초기화
function resetForm() {
    document.getElementById('certificationForm').reset();
    setDefaultDates();
    
    // 업로드 초기화 (업로드된 파일이 있는 경우에만)
    if (uploadedFile) {
        resetUpload();
        return; // resetUpload()가 미리보기도 초기화하므로 여기서 종료
    }
    
    // 미리보기 영역 초기화
    const previewArea = document.getElementById('previewArea');
    previewArea.classList.remove('active');
    previewArea.innerHTML = `
        <div class="preview-placeholder">
            <i class="fas fa-image"></i>
            <p>원본 PDF를 업로드하거나<br>좌측 폼을 작성하고 "미리보기 생성" 버튼을 클릭하세요</p>
        </div>
    `;
    
    // 미리보기 액션 버튼 숨기기
    document.getElementById('previewActions').style.display = 'none';
}

// 엑셀 파일 다운로드
function downloadExcel() {
    try {
        // 폼 데이터 수집
        const formData = {
            issueNo: document.getElementById('issueNo').value || '-',
            companyName: document.getElementById('companyName').value || '-',
            issueDate: document.getElementById('issueDate').value || '-',
            siteName: document.getElementById('siteName').value || '-',
            siteAddress: document.getElementById('siteAddress')?.value || '-',
            deliveryDate: document.getElementById('deliveryDate').value || '-'
        };
        
        // 엑셀 데이터 구조 생성
        const data = [
            ['품질인정서 정보'],
            [],
            ['항목', '내용'],
            ['발급 NO', formData.issueNo],
            ['업체명', formData.companyName],
            ['발급일자', formData.issueDate],
            ['현장명', formData.siteName],
            ['현장주소', formData.siteAddress],
            ['납품일자', formData.deliveryDate],
            [],
            ['발급일시', new Date().toLocaleString('ko-KR')],
            ['발급자', '(주) 정일방화문']
        ];
        
        // 워크북 생성
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // 열 너비 설정
        ws['!cols'] = [
            { wch: 15 },  // A열 (항목)
            { wch: 50 }   // B열 (내용)
        ];
        
        // 스타일 설정 (헤더)
        ws['A1'].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center' }
        };
        
        // 워크시트를 워크북에 추가
        XLSX.utils.book_append_sheet(wb, ws, '품질인정서');
        
        // 파일명 생성 (발급NO_날짜)
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const issueNoClean = formData.issueNo.replace(/[^a-zA-Z0-9]/g, '-');
        const filename = `품질인정서_${issueNoClean}_${timestamp}.xlsx`;
        
        // 엑셀 파일 다운로드
        XLSX.writeFile(wb, filename);
        
        showNotification('엑셀 파일이 다운로드되었습니다.', 'success');
        console.log('✅ 엑셀 다운로드 완료:', filename);
        
    } catch (error) {
        console.error('❌ 엑셀 다운로드 오류:', error);
        showNotification('엑셀 다운로드 중 오류가 발생했습니다.', 'error');
    }
}

// 품질인정서 데이터 업데이트
function updateCertificateData(formData) {
    // 기본 템플릿 업데이트
    const certIssueNo = document.getElementById('cert-issueNo');
    if (certIssueNo) certIssueNo.textContent = formData.issueNo;
    
    const certCompanyName = document.getElementById('cert-companyName');
    if (certCompanyName) certCompanyName.textContent = formData.companyName;
    
    const certQuantity = document.getElementById('cert-quantity');
    if (certQuantity) certQuantity.textContent = formData.quantity;
    
    const certIssueDate = document.getElementById('cert-issueDate');
    if (certIssueDate) certIssueDate.textContent = formatDate(formData.issueDate);
    
    const certSiteName = document.getElementById('cert-siteName');
    if (certSiteName) certSiteName.textContent = formData.siteName;
    
    const certDeliveryDate = document.getElementById('cert-deliveryDate');
    if (certDeliveryDate) certDeliveryDate.textContent = formatDate(formData.deliveryDate);
    
    // 오버레이 업데이트 (PDF 업로드 시)
    const overlayIssueNo = document.getElementById('overlay-issueNo');
    if (overlayIssueNo) overlayIssueNo.textContent = formData.issueNo;
    
    const overlayCompanyName = document.getElementById('overlay-companyName');
    if (overlayCompanyName) overlayCompanyName.textContent = formData.companyName;
    
    const overlaySiteName = document.getElementById('overlay-siteName');
    if (overlaySiteName) overlaySiteName.textContent = formData.siteName;
    
    const overlayQuantity = document.getElementById('overlay-quantity');
    if (overlayQuantity) overlayQuantity.textContent = formData.quantity;
    
    const overlayIssueDate = document.getElementById('overlay-issueDate');
    if (overlayIssueDate) overlayIssueDate.textContent = formatDate(formData.issueDate);
    
    const overlayDeliveryDate = document.getElementById('overlay-deliveryDate');
    if (overlayDeliveryDate) overlayDeliveryDate.textContent = formatDate(formData.deliveryDate);
}

// 미리보기 생성
function generatePreview(formData) {
    console.log('미리보기 생성 시작:', formData);
    
    // 업로드된 파일이 있으면 확인
    if (uploadedFile) {
        if (!confirm('업로드된 파일이 있습니다. 새로운 미리보기로 교체하시겠습니까?')) {
            return;
        }
        // 업로드 초기화
        uploadedFile = null;
        if (uploadedFileURL) {
            URL.revokeObjectURL(uploadedFileURL);
            uploadedFileURL = null;
        }
    }
    
    try {
        // 데이터 업데이트
        updateCertificateData(formData);
        
        // 템플릿 복사
        const template = document.getElementById('certificateTemplate');
        if (!template) {
            console.error('certificateTemplate를 찾을 수 없습니다');
            showNotification('템플릿을 찾을 수 없습니다.', 'error');
            return;
        }
        
        const templateClone = template.cloneNode(true);
        templateClone.id = 'previewTemplate';
        templateClone.style.display = 'block';
        
        // 미리보기 영역 업데이트
        const previewArea = document.getElementById('previewArea');
        if (!previewArea) {
            console.error('previewArea를 찾을 수 없습니다');
            showNotification('미리보기 영역을 찾을 수 없습니다.', 'error');
            return;
        }
        
        previewArea.innerHTML = '';
        previewArea.classList.add('active');
        previewArea.appendChild(templateClone);
        
        // 미리보기 액션 버튼 표시
        const previewActions = document.getElementById('previewActions');
        if (previewActions) {
            previewActions.style.display = 'flex';
        }
        
        // 미리보기 영역으로 스크롤
        previewArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        console.log('미리보기 생성 완료');
        showNotification('미리보기가 생성되었습니다!', 'success');
    } catch (error) {
        console.error('미리보기 생성 오류:', error);
        showNotification('미리보기 생성 중 오류가 발생했습니다.', 'error');
    }
}



// 이미지 사전 로드 함수
function preloadImages() {
    return new Promise((resolve) => {
        const images = [
            'https://www.genspark.ai/api/files/s/A6oatRNK',
            'https://www.genspark.ai/api/files/s/MCcTK7jR'
        ];
        
        let loadedCount = 0;
        const totalImages = images.length;
        
        console.log('📷 이미지 사전 로드 시작...');
        
        images.forEach(src => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                loadedCount++;
                console.log(`✓ 이미지 로드 성공 (${loadedCount}/${totalImages})`);
                if (loadedCount === totalImages) {
                    console.log('✅ 모든 이미지 로드 완료');
                    resolve();
                }
            };
            
            img.onerror = () => {
                loadedCount++;
                console.warn(`⚠️ 이미지 로드 실패 - 무시하고 계속 진행 (${loadedCount}/${totalImages})`);
                if (loadedCount === totalImages) {
                    console.log('⚠️ 이미지 로드 완료 (일부 실패)');
                    resolve(); // 에러가 있어도 계속 진행
                }
            };
            
            img.src = src;
        });
        
        // 3초 타임아웃
        setTimeout(() => {
            if (loadedCount < totalImages) {
                console.warn('⏱️ 이미지 로드 타임아웃 - 계속 진행');
                resolve();
            }
        }, 3000);
    });
}

// 업로드된 PDF 전체 페이지를 오버레이와 함께 다운로드
async function downloadPDFWithOverlay(formData) {
    try {
        console.log('🚀 downloadPDFWithOverlay v5.4 시작 (5행 표 직접 그리기 방식)');
        console.log('📝 입력된 폼 데이터:', formData);
        console.log('PDF 다운로드 시작...');
        
        // 1단계: 원본 PDF 로드
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const { PDFDocument, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = pdfDoc.getPageCount();
        
        console.log(`총 페이지 수: ${totalPages}`);
        
        // 2단계: 첫 페이지 가져오기
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        console.log(`첫 페이지 크기: ${width} x ${height}`);
        
        // 3단계: 한글 폰트 로드 (선택적)
        let font = null;
        const fontUrls = [
            'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumSquare.woff',
            'https://fonts.gstatic.com/s/notosanskr/v27/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.woff2'
        ];
        
        for (let i = 0; i < fontUrls.length; i++) {
            try {
                console.log(`🔤 한글 폰트 로드 시도 (${i+1}/${fontUrls.length}):`, fontUrls[i]);
                const response = await fetch(fontUrls[i], { mode: 'cors', cache: 'force-cache' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const fontBytes = await response.arrayBuffer();
                font = await pdfDoc.embedFont(fontBytes);
                console.log('✅ 한글 폰트 임베드 성공!');
                break;
            } catch (fontError) {
                console.warn(`❌ 폰트 로드 실패 (${i+1}/${fontUrls.length}):`, fontError.message);
                if (i === fontUrls.length - 1) {
                    console.error('⚠️ 모든 한글 폰트 로드 실패! Canvas 텍스트 방식 사용');
                    font = null;
                }
            }
        }
        
        // Canvas로 텍스트 이미지 생성 헬퍼 함수
        async function createTextImage(text, fontSize, color, fontFamily = 'Noto Sans KR, sans-serif') {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.font = `${fontSize}px ${fontFamily}`;
            const metrics = ctx.measureText(text);
            const textWidth = metrics.width;
            const textHeight = fontSize * 1.5;
            canvas.width = textWidth + 20;
            canvas.height = textHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.fillStyle = color;
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 10, canvas.height / 2);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const arrayBuffer = await blob.arrayBuffer();
            return { imageBytes: arrayBuffer, width: canvas.width, height: canvas.height };
        }
        
        // 4단계: 5행 표 그리기 (PDF-lib 직접 그리기)
        console.log('🎨 5행 표 그리기 시작 (downloadPDFWithOverlay)');
        
        const tableX = width * 0.55;
        const tableY = height * 0.65;
        const tableWidth = width * 0.38;
        const rowHeight = 25;
        const crimson = rgb(220/255, 20/255, 60/255);
        const black = rgb(0, 0, 0);
        const labelFontSize = 11;
        const valueFontSize = 11;
        const labelWidth = tableWidth * 0.25;
        const valueWidth = tableWidth * 0.25;
        
        // 표 외곽 테두리 (5행)
        firstPage.drawRectangle({
            x: tableX, y: tableY, width: tableWidth, height: rowHeight * 5,
            borderColor: crimson, borderWidth: 1.5
        });
        
        // 1행: 발급 NO, 발급일자
        firstPage.drawRectangle({ x: tableX, y: tableY + rowHeight * 4, width: labelWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        if (font) firstPage.drawText('발급 NO', { x: tableX + (labelWidth - 40) / 2, y: tableY + rowHeight * 4 + 8, size: labelFontSize, font: font, color: crimson });
        
        firstPage.drawRectangle({ x: tableX + labelWidth, y: tableY + rowHeight * 4, width: valueWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        if (font) {
            firstPage.drawText(formData.issueNo || '', { x: tableX + labelWidth + 8, y: tableY + rowHeight * 4 + 8, size: valueFontSize, font: font, color: black });
        } else {
            const issueNoImg = await createTextImage(formData.issueNo || '', valueFontSize, '#000000');
            const issueNoImage = await pdfDoc.embedPng(issueNoImg.imageBytes);
            firstPage.drawImage(issueNoImage, { x: tableX + labelWidth + 8, y: tableY + rowHeight * 4 + 6, width: issueNoImg.width, height: issueNoImg.height });
        }
        
        firstPage.drawRectangle({ x: tableX + labelWidth + valueWidth, y: tableY + rowHeight * 4, width: labelWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        if (font) firstPage.drawText('발급일자', { x: tableX + labelWidth + valueWidth + (labelWidth - 40) / 2, y: tableY + rowHeight * 4 + 8, size: labelFontSize, font: font, color: crimson });
        
        firstPage.drawRectangle({ x: tableX + labelWidth * 2 + valueWidth, y: tableY + rowHeight * 4, width: valueWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        const formatDate = (dateStr) => { if (!dateStr) return ''; const d = new Date(dateStr); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
        if (font) {
            firstPage.drawText(formatDate(formData.issueDate) || '', { x: tableX + labelWidth * 2 + valueWidth + 8, y: tableY + rowHeight * 4 + 8, size: valueFontSize, font: font, color: black });
        } else {
            const issueDateImg = await createTextImage(formatDate(formData.issueDate) || '', valueFontSize, '#000000');
            const issueDateImage = await pdfDoc.embedPng(issueDateImg.imageBytes);
            firstPage.drawImage(issueDateImage, { x: tableX + labelWidth * 2 + valueWidth + 8, y: tableY + rowHeight * 4 + 6, width: issueDateImg.width, height: issueDateImg.height });
        }
        
        // 2행: 현장명 (전체폭)
        firstPage.drawRectangle({ x: tableX, y: tableY + rowHeight * 3, width: labelWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        if (font) firstPage.drawText('현장명', { x: tableX + (labelWidth - 40) / 2, y: tableY + rowHeight * 3 + 8, size: labelFontSize, font: font, color: crimson });
        
        firstPage.drawRectangle({ x: tableX + labelWidth, y: tableY + rowHeight * 3, width: tableWidth - labelWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        const siteNameText = formData.siteName || '';
        if (font) {
            if (siteNameText.length > 40) {
                firstPage.drawText(siteNameText.substring(0, 40), { x: tableX + labelWidth + 8, y: tableY + rowHeight * 3 + 14, size: 9, font: font, color: black });
                firstPage.drawText(siteNameText.substring(40), { x: tableX + labelWidth + 8, y: tableY + rowHeight * 3 + 4, size: 9, font: font, color: black });
            } else {
                firstPage.drawText(siteNameText, { x: tableX + labelWidth + 8, y: tableY + rowHeight * 3 + 8, size: valueFontSize, font: font, color: black });
            }
        } else {
            const siteNameImg = await createTextImage(siteNameText, valueFontSize, '#000000');
            const siteNameImage = await pdfDoc.embedPng(siteNameImg.imageBytes);
            firstPage.drawImage(siteNameImage, { x: tableX + labelWidth + 8, y: tableY + rowHeight * 3 + 6, width: siteNameImg.width, height: siteNameImg.height });
        }
        
        // 3행: 현장주소 (전체폭)
        firstPage.drawRectangle({ x: tableX, y: tableY + rowHeight * 2, width: labelWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        if (font) firstPage.drawText('현장주소', { x: tableX + (labelWidth - 40) / 2, y: tableY + rowHeight * 2 + 8, size: labelFontSize, font: font, color: crimson });
        
        firstPage.drawRectangle({ x: tableX + labelWidth, y: tableY + rowHeight * 2, width: tableWidth - labelWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        const siteAddressText = formData.siteAddress || '';
        if (font) {
            if (siteAddressText.length > 40) {
                firstPage.drawText(siteAddressText.substring(0, 40), { x: tableX + labelWidth + 8, y: tableY + rowHeight * 2 + 14, size: 9, font: font, color: black });
                firstPage.drawText(siteAddressText.substring(40), { x: tableX + labelWidth + 8, y: tableY + rowHeight * 2 + 4, size: 9, font: font, color: black });
            } else {
                firstPage.drawText(siteAddressText, { x: tableX + labelWidth + 8, y: tableY + rowHeight * 2 + 8, size: valueFontSize, font: font, color: black });
            }
        } else {
            const siteAddressImg = await createTextImage(siteAddressText, valueFontSize, '#000000');
            const siteAddressImage = await pdfDoc.embedPng(siteAddressImg.imageBytes);
            firstPage.drawImage(siteAddressImage, { x: tableX + labelWidth + 8, y: tableY + rowHeight * 2 + 6, width: siteAddressImg.width, height: siteAddressImg.height });
        }
        
        // 4행: 납품일자 (전체폭)
        firstPage.drawRectangle({ x: tableX, y: tableY + rowHeight, width: labelWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        if (font) firstPage.drawText('납품일자', { x: tableX + (labelWidth - 40) / 2, y: tableY + rowHeight + 8, size: labelFontSize, font: font, color: crimson });
        
        firstPage.drawRectangle({ x: tableX + labelWidth, y: tableY + rowHeight, width: tableWidth - labelWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        if (font) {
            firstPage.drawText(formatDate(formData.deliveryDate) || '', { x: tableX + labelWidth + 8, y: tableY + rowHeight + 8, size: valueFontSize, font: font, color: black });
        } else {
            const deliveryDateImg = await createTextImage(formatDate(formData.deliveryDate) || '', valueFontSize, '#000000');
            const deliveryDateImage = await pdfDoc.embedPng(deliveryDateImg.imageBytes);
            firstPage.drawImage(deliveryDateImage, { x: tableX + labelWidth + 8, y: tableY + rowHeight + 6, width: deliveryDateImg.width, height: deliveryDateImg.height });
        }
        
        // 5행: 경고문 (전체폭)
        firstPage.drawRectangle({ x: tableX, y: tableY, width: tableWidth, height: rowHeight, borderColor: crimson, borderWidth: 1 });
        if (font) firstPage.drawText('본문서에 표기된 현장외 사용할수 없음', { x: tableX + (tableWidth - 200) / 2, y: tableY + 8, size: 10, font: font, color: crimson });
        
        console.log('✅ 5행 표 그리기 완료! (v5.4 - downloadPDFWithOverlay)');
        console.log('📊 오버레이된 데이터:', {
            issueNo: formData.issueNo,
            issueDate: formatDate(formData.issueDate),
            siteName: formData.siteName,
            siteAddress: formData.siteAddress,
            deliveryDate: formatDate(formData.deliveryDate)
        });
        
        // 5단계: Canvas로 대각선 워터마크 이미지 생성 (현장명 표시)
        console.log('대각선 워터마크 이미지 생성 시작...');
        
        // 현장명을 워터마크로 사용 (입력되지 않은 경우 워터마크 생성 안 함)
        const watermarkText = (formData.siteName || '').toString().trim();
        
        // 현장명이 있을 때만 워터마크 생성
        if (watermarkText) {
            try {
                console.log('현장명 워터마크 생성: "' + watermarkText + '"');
                
                // 폰트 로드 대기 (타임아웃 추가)
                try {
                    await Promise.race([
                        document.fonts.ready,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Font load timeout')), 5000))
                    ]);
                    console.log('폰트 로드 완료');
                } catch (fontError) {
                    console.warn('폰트 로드 경고 (무시하고 계속):', fontError);
                }
            
            // Canvas 생성 (A4 용지 비율로 충분히 크게)
            const wmCanvas = document.createElement('canvas');
            const wmCtx = wmCanvas.getContext('2d');
            
            // 캔버스 크기 설정 (더 크게 - 대각선 길이 고려)
            wmCanvas.width = 2800;
            wmCanvas.height = 2800;
            
            // 투명 배경
            wmCtx.clearRect(0, 0, wmCanvas.width, wmCanvas.height);
            
            // 중앙으로 이동 후 45도 회전 (좌측 상단 → 우측 하단)
            wmCtx.save();
            wmCtx.translate(wmCanvas.width / 2, wmCanvas.height / 2);
            wmCtx.rotate(45 * Math.PI / 180);
            
            // 📏 자동 폰트 크기 조정 (텍스트 길이에 따라)
            let fontSize = 75; // 기본 폰트 크기
            const maxWidth = wmCanvas.width * 0.8; // 캔버스 너비의 80%까지만 사용
            
            // 폰트 크기를 점진적으로 줄이면서 적절한 크기 찾기
            wmCtx.font = `bold ${fontSize}px "Noto Sans KR", sans-serif`;
            let textWidth = wmCtx.measureText(watermarkText).width;
            
            while (textWidth > maxWidth && fontSize > 20) {
                fontSize -= 5;
                wmCtx.font = `bold ${fontSize}px "Noto Sans KR", sans-serif`;
                textWidth = wmCtx.measureText(watermarkText).width;
            }
            
            console.log(`워터마크 자동 조정: 텍스트="${watermarkText}", 길이=${watermarkText.length}자, 폰트=${fontSize}px`);
            
            // 텍스트 스타일 설정 (현장명 워터마크)
            wmCtx.fillStyle = 'rgba(128, 128, 128, 0.3)'; // 회색 70% 투명도 (0.3 = 30% 불투명 = 70% 투명)
            wmCtx.textAlign = 'center';
            wmCtx.textBaseline = 'middle';
            
            // 현장명 텍스트를 중앙에 그리기
            wmCtx.fillText(watermarkText, 0, 0);
            
            wmCtx.restore();
            
            console.log('워터마크 Canvas 생성 완료 (현장명: "' + watermarkText + '", 크기:', wmCanvas.width, 'x', wmCanvas.height, ')');
            
            // Canvas를 PNG Blob으로 변환
            const watermarkBlob = await new Promise(resolve => {
                wmCanvas.toBlob(resolve, 'image/png', 1.0);
            });
            
            if (!watermarkBlob) {
                console.error('워터마크 Blob 생성 실패');
                throw new Error('워터마크 생성 실패');
            }
            
            console.log(`워터마크 Blob 생성 완료: ${(watermarkBlob.size / 1024).toFixed(2)} KB`);
            
            // PDF에 워터마크 이미지 임베드
            const watermarkBytes = await watermarkBlob.arrayBuffer();
            const watermarkImage = await pdfDoc.embedPng(watermarkBytes);
            
            console.log('워터마크 이미지 PDF 임베드 완료');
            
            // 6단계: 모든 페이지에 워터마크 이미지 추가
            for (let i = 0; i < totalPages; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();
                
                // 워터마크를 페이지 전체 크기로 설정
                const wmSize = Math.max(width, height) * 1.2; // 대각선 길이 고려하여 1.2배
                
                // 중앙 배치
                const x = (width - wmSize) / 2;
                const y = (height - wmSize) / 2;
                
                page.drawImage(watermarkImage, {
                    x: x,
                    y: y,
                    width: wmSize,
                    height: wmSize,
                });
                
                console.log(`✅ 페이지 ${i + 1}/${totalPages} 워터마크 추가 완료 (크기: ${wmSize.toFixed(0)}x${wmSize.toFixed(0)})`);
            }
            
                console.log('모든 페이지 워터마크 추가 완료');
            } catch (watermarkError) {
                console.error('❌ 워터마크 생성 중 오류 발생:', watermarkError);
                console.error('오류 상세:', watermarkError.message, watermarkError.stack);
                
                // 워터마크 생성 실패해도 PDF는 계속 진행
                showNotification('워터마크 생성에 실패했지만 PDF는 정상적으로 다운로드됩니다.', 'warning');
            }
        } else {
            console.log('현장명이 입력되지 않아 워터마크를 생성하지 않습니다.');
        }
        
        // 🔒 PDF 메타데이터에 보안 정보 추가
        pdfDoc.setTitle('품질인정서 원본 - 편집금지');
        pdfDoc.setSubject('본 문서는 공식 품질인정서 원본으로 무단 편집, 복사, 변조를 금지합니다.');
        pdfDoc.setKeywords(['품질인정서', '원본', '편집금지', '보안문서', '공식문서']);
        pdfDoc.setProducer('품질인정서 발급 시스템 (보안 적용)');
        pdfDoc.setCreator('품질인정서 발급 시스템');
        pdfDoc.setAuthor('(주) 정일방화문');
        pdfDoc.setCreationDate(new Date());
        pdfDoc.setModificationDate(new Date());
        
        // 7단계: PDF 저장
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        console.log(`최종 PDF 크기: ${(blob.size / 1024).toFixed(2)} KB`);
        console.log('🔒 보안 메타데이터 적용: 편집금지 표시 | 원본 인증');
        
        // 다운로드
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `품질인정서_${formData.issueNo.replace(/\//g, '-')}_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('PDF 다운로드 완료!');
        
        // PDF 바이트 데이터 반환 (서버 저장용)
        return pdfBytes;
        
    } catch (error) {
        console.error('PDF 생성 오류:', error);
        throw error;
    }
}

// 모든 PDF 병합 및 다운로드 (품질인정서에만 정보 오버레이)
async function downloadMergedPDF(formData) {
    try {
        console.log('===== PDF 병합 시작 =====');
        
        // PDF-lib 로드
        const { PDFDocument, rgb } = window.PDFLib;
        
        // 최종 병합될 PDF 생성
        const mergedPdf = await PDFDocument.create();
        
        // 1. 고정 서류 추가 (있는 경우)
        if (uploadedFiles.fixed) {
            console.log('1. 고정 서류 추가 중...');
            const fixedBytes = await uploadedFiles.fixed.arrayBuffer();
            const fixedPdf = await PDFDocument.load(fixedBytes);
            const fixedPages = await mergedPdf.copyPages(fixedPdf, fixedPdf.getPageIndices());
            fixedPages.forEach(page => mergedPdf.addPage(page));
            console.log(`✓ 고정 서류 ${fixedPdf.getPageCount()}페이지 추가 완료`);
        }
        
        // 2. 품질관리서 추가 (있는 경우)
        if (uploadedFiles.quality1) {
            console.log('2. 품질관리서 추가 중...');
            const quality1Bytes = await uploadedFiles.quality1.arrayBuffer();
            const quality1Pdf = await PDFDocument.load(quality1Bytes);
            const quality1Pages = await mergedPdf.copyPages(quality1Pdf, quality1Pdf.getPageIndices());
            quality1Pages.forEach(page => mergedPdf.addPage(page));
            console.log(`✓ 품질관리서 ${quality1Pdf.getPageCount()}페이지 추가 완료`);
        }
        
        // 3. 납품확인서 추가 (있는 경우)
        if (uploadedFiles.delivery) {
            console.log('3. 납품확인서 추가 중...');
            const deliveryBytes = await uploadedFiles.delivery.arrayBuffer();
            const deliveryPdf = await PDFDocument.load(deliveryBytes);
            const deliveryPages = await mergedPdf.copyPages(deliveryPdf, deliveryPdf.getPageIndices());
            deliveryPages.forEach(page => mergedPdf.addPage(page));
            console.log(`✓ 납품확인서 ${deliveryPdf.getPageCount()}페이지 추가 완료`);
        }
        
        // 4. 품질인정서 추가 (정보 오버레이) - 필수
        console.log('4. 품질인정서 추가 중 (정보 오버레이)...');
        const quality2Bytes = await uploadedFiles.quality2.arrayBuffer();
        const quality2Pdf = await PDFDocument.load(quality2Bytes);
        
        // 품질인정서 페이지 복사
        const quality2Pages = await mergedPdf.copyPages(quality2Pdf, quality2Pdf.getPageIndices());
        
        // 첫 페이지에만 정보 오버레이
        const firstPage = quality2Pages[0];
        
        // 한글 폰트 임베드 (외부 CDN 차단으로 비활성화)
        let font = null;
        console.log('⚠️ 외부 폰트 CDN 차단 환경: 표 테두리만 표시됩니다.');
        console.log('💡 텍스트가 필요하면 "품질인정서만 다운로드" 버튼을 사용하세요.');
        
        /*
        // 폰트 URL 목록 (모두 404 오류 발생으로 비활성화)
        const fontUrls = [
            'https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff2',
            'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumGothic.woff',
            'https://unpkg.com/@openfonts/noto-sans-kr_korean@1.44.0/files/noto-sans-kr-korean-400-normal.woff'
        ];
        
        // 폰트 로드 코드 (비활성화)
        for (let i = 0; i < fontUrls.length; i++) {
            ...
        }
        */
        
        for (let i = 0; i < fontUrls.length; i++) {
            try {
                console.log(`🔤 한글 폰트 로드 시도 (${i+1}/${fontUrls.length}):`, fontUrls[i]);
                
                const response = await fetch(fontUrls[i], {
                    mode: 'cors',
                    cache: 'force-cache'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const fontBytes = await response.arrayBuffer();
                console.log(`✓ 폰트 다운로드 완료: ${(fontBytes.byteLength / 1024).toFixed(2)} KB`);
                
                // 폰트 임베드 시도
                try {
                    font = await mergedPdf.embedFont(fontBytes);
                    console.log('✅ 한글 폰트 임베드 성공!');
                } catch (embedError) {
                    console.log('⚠️ 기본 임베드 실패, subset 옵션 시도...');
                    font = await mergedPdf.embedFont(fontBytes, { subset: true });
                    console.log('✅ 한글 폰트 임베드 성공! (subset)');
                }
                
                break;
            } catch (fontError) {
                console.warn(`❌ 폰트 로드 실패 (${i+1}/${fontUrls.length}):`, fontError.message);
                if (i === fontUrls.length - 1) {
                    // 모든 폰트 로드 실패 시 표만 그리고 텍스트는 건너뛰기
                    console.error('⚠️ 모든 한��� 폰트 로드 실패! 표 테두리만 그립니다.');
                    font = null;
                }
            }
        }
        
        // Canvas로 텍스트 이미지 생성 헬퍼 함수
        async function createTextImage(text, fontSize, color, fontFamily = 'Noto Sans KR, sans-serif') {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 캔버스 크기 설정 (텍스트 길이에 따라)
            ctx.font = `${fontSize}px ${fontFamily}`;
            const metrics = ctx.measureText(text);
            const textWidth = metrics.width;
            const textHeight = fontSize * 1.5;
            
            canvas.width = textWidth + 20;
            canvas.height = textHeight;
            
            // 투명 배경
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 텍스트 그리기
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.fillStyle = color;
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 10, canvas.height / 2);
            
            // PNG로 변환
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const arrayBuffer = await blob.arrayBuffer();
            
            return {
                imageBytes: arrayBuffer,
                width: canvas.width,
                height: canvas.height
            };
        }
        
        // 페이지 크기 가져오기
        const { width, height } = firstPage.getSize();
        
        console.log('📐 페이지 크기:', width, 'x', height);
        
        // ========================================
        // 🎨 빨간 테두리 표 그리기 (우측 상단)
        // ========================================
        
        const tableX = width * 0.55;  // 우측 (페이지 폭의 55% 위치)
        const tableY = height * 0.65; // 상단 (페이지 높이의 65% 위치)
        const tableWidth = width * 0.38;  // 표 폭 (페이지 폭의 38%)
        const rowHeight = 25;
        const crimson = rgb(220/255, 20/255, 60/255);  // #dc143c (빨간색)
        const black = rgb(0, 0, 0);
        const labelFontSize = 11;
        const valueFontSize = 11;
        const labelWidth = tableWidth * 0.25;
        const valueWidth = tableWidth * 0.25;
        
        console.log('🎨 표 그리기 시작:', { tableX, tableY, tableWidth });
        
        // 폰트 로드 실패 시 Canvas 이미지 방식 사용
        const useCanvasText = !font;
        if (useCanvasText) {
            console.warn('⚠️ 한글 폰트 로드 실패!');
            console.log('🎨 대안: Canvas로 텍스트 이미지를 생성하여 PDF에 삽입합니다.');
            showNotification('한글 폰트 로드 실패. 텍스트를 이미지로 변환하여 표시합니다.', 'warning');
        }
        
        // 표 외곽 테두리 (빨간색) - 5행으로 변경
        firstPage.drawRectangle({
            x: tableX,
            y: tableY,
            width: tableWidth,
            height: rowHeight * 5,
            borderColor: crimson,
            borderWidth: 1.5,
            color: rgb(1, 1, 1),  // 흰색 배경
            opacity: 1
        });
        
        // 1행: 발급 NO, 발급일자
        // 라벨: 발급 NO
        firstPage.drawRectangle({
            x: tableX,
            y: tableY + rowHeight * 4,
            width: labelWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        if (font) {
            firstPage.drawText('발급 NO', {
                x: tableX + (labelWidth - 40) / 2,
                y: tableY + rowHeight * 4 + 8,
                size: labelFontSize,
                font: font,
                color: crimson
            });
        }
        
        // 값: 발급 NO
        firstPage.drawRectangle({
            x: tableX + labelWidth,
            y: tableY + rowHeight * 4,
            width: valueWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        if (font) {
            firstPage.drawText(formData.issueNo || '', {
                x: tableX + labelWidth + 8,
                y: tableY + rowHeight * 4 + 8,
                size: valueFontSize,
                font: font,
                color: black
            });
        }
        
        // 라벨: 발급일자
        firstPage.drawRectangle({
            x: tableX + labelWidth + valueWidth,
            y: tableY + rowHeight * 4,
            width: labelWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        if (font) {
            firstPage.drawText('발급일자', {
                x: tableX + labelWidth + valueWidth + (labelWidth - 40) / 2,
                y: tableY + rowHeight * 4 + 8,
                size: labelFontSize,
                font: font,
                color: crimson
            });
        }
        
        // 값: 발급일자
        firstPage.drawRectangle({
            x: tableX + labelWidth * 2 + valueWidth,
            y: tableY + rowHeight * 4,
            width: valueWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        if (font) {
            firstPage.drawText(formatDate(formData.issueDate) || '', {
                x: tableX + labelWidth * 2 + valueWidth + 8,
                y: tableY + rowHeight * 4 + 8,
                size: valueFontSize,
                font: font,
                color: black
            });
        }
        
        // 2행: 현장명 (colspan=3)
        // 라벨: 현장명
        firstPage.drawRectangle({
            x: tableX,
            y: tableY + rowHeight * 3,
            width: labelWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        if (font) {
            firstPage.drawText('현장명', {
                x: tableX + (labelWidth - 35) / 2,
                y: tableY + rowHeight * 3 + 8,
                size: labelFontSize,
                font: font,
                color: crimson
            });
        }
        
        // 값: 현장명 (3칸 차지)
        firstPage.drawRectangle({
            x: tableX + labelWidth,
            y: tableY + rowHeight * 3,
            width: tableWidth - labelWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        
        // 현장명 텍스트가 길 경우 줄바꿈 (간단한 처리)
        if (font) {
            const siteNameText = formData.siteName || '';
            const maxSiteNameLength = 40;
            if (siteNameText.length > maxSiteNameLength) {
                const line1 = siteNameText.substring(0, maxSiteNameLength);
                const line2 = siteNameText.substring(maxSiteNameLength);
                firstPage.drawText(line1, {
                    x: tableX + labelWidth + 8,
                    y: tableY + rowHeight * 3 + 14,
                    size: 9,
                    font: font,
                    color: black
                });
                firstPage.drawText(line2, {
                    x: tableX + labelWidth + 8,
                    y: tableY + rowHeight * 3 + 4,
                    size: 9,
                    font: font,
                    color: black
                });
            } else {
                firstPage.drawText(siteNameText, {
                    x: tableX + labelWidth + 8,
                    y: tableY + rowHeight * 3 + 8,
                    size: valueFontSize,
                    font: font,
                    color: black
                });
            }
        }
        
        // 3행: 현장주소 (colspan=3)
        // 라벨: 현장주소
        firstPage.drawRectangle({
            x: tableX,
            y: tableY + rowHeight * 2,
            width: labelWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        if (font) {
            firstPage.drawText('현장주소', {
                x: tableX + (labelWidth - 40) / 2,
                y: tableY + rowHeight * 2 + 8,
                size: labelFontSize,
                font: font,
                color: crimson
            });
        }
        
        // 값: 현장주소 (3칸 차지)
        firstPage.drawRectangle({
            x: tableX + labelWidth,
            y: tableY + rowHeight * 2,
            width: tableWidth - labelWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        
        // 현장주소 텍스트가 길 경우 줄바꿈
        if (font) {
            const siteAddressText = formData.siteAddress || '';
            const maxAddressLength = 40;
            if (siteAddressText.length > maxAddressLength) {
                const line1 = siteAddressText.substring(0, maxAddressLength);
                const line2 = siteAddressText.substring(maxAddressLength);
                firstPage.drawText(line1, {
                    x: tableX + labelWidth + 8,
                    y: tableY + rowHeight * 2 + 14,
                    size: 9,
                    font: font,
                    color: black
                });
                firstPage.drawText(line2, {
                    x: tableX + labelWidth + 8,
                    y: tableY + rowHeight * 2 + 4,
                    size: 9,
                    font: font,
                    color: black
                });
            } else {
                firstPage.drawText(siteAddressText, {
                    x: tableX + labelWidth + 8,
                    y: tableY + rowHeight * 2 + 8,
                    size: valueFontSize,
                    font: font,
                    color: black
                });
            }
        }
        
        // 4행: 납품일자 (전체 너비)
        // 라벨: 납품일자
        firstPage.drawRectangle({
            x: tableX,
            y: tableY + rowHeight,
            width: labelWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        if (font) {
            firstPage.drawText('납품일자', {
                x: tableX + (labelWidth - 40) / 2,
                y: tableY + rowHeight + 8,
                size: labelFontSize,
                font: font,
                color: crimson
            });
        }
        
        // 값: 납품일자 (3칸 차지)
        firstPage.drawRectangle({
            x: tableX + labelWidth,
            y: tableY + rowHeight,
            width: tableWidth - labelWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        if (font) {
            firstPage.drawText(formatDate(formData.deliveryDate) || '', {
                x: tableX + labelWidth + 8,
                y: tableY + rowHeight + 8,
                size: valueFontSize,
                font: font,
                color: black
            });
        }
        
        // 4행: "본문서에 표기된 현장외 사용할수 없음" (colspan=4)
        firstPage.drawRectangle({
            x: tableX,
            y: tableY,
            width: tableWidth,
            height: rowHeight,
            borderColor: crimson,
            borderWidth: 1,
            color: rgb(1, 1, 1)
        });
        if (font) {
            firstPage.drawText('본문서에 표기된 현장외 사용할수 없음', {
                x: tableX + (tableWidth - 200) / 2,
                y: tableY + 8,
                size: 10,
                font: font,
                color: crimson
            });
        }
        
        console.log('✅ 빨간 테두리 표 그리기 완료! (v5.4 - 5행 구조: 발급NO/발급일자, 현장명, 현장주소, 납품일자, 경고문)');
        
        // 직인 이미지 추가
        try {
            const stampUrl = 'https://www.genspark.ai/api/files/s/MCcTK7jR';
            const stampBytes = await fetch(stampUrl).then(res => res.arrayBuffer());
            const stampImage = await mergedPdf.embedPng(stampBytes);
            
            const stampDims = stampImage.scale(0.15);
            firstPage.drawImage(stampImage, {
                x: width - stampDims.width - 100,
                y: height - 400,
                width: stampDims.width,
                height: stampDims.height,
                opacity: 0.9
            });
            console.log('✓ 직인 이미지 추가 완료');
        } catch (stampError) {
            console.warn('직인 이미지 로드 실패:', stampError);
        }
        
        // 품질인정서 모든 페이지 추가
        quality2Pages.forEach(page => mergedPdf.addPage(page));
        console.log(`✓ 품질인정서 ${quality2Pdf.getPageCount()}페이지 추가 완료`);
        
        // 최종 PDF 저장
        console.log('5. 최종 PDF 생성 중...');
        const finalPdfBytes = await mergedPdf.save();
        const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
        
        console.log(`✓ 최종 PDF 크기: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`✓ 총 페이지 수: ${mergedPdf.getPageCount()}`);
        
        // 다운로드
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `품질인정서_전체_${formData.issueNo.replace(/\//g, '-')}_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('===== PDF 병합 완료 =====');
        
    } catch (error) {
        console.error('PDF 병합 오류:', error);
        throw error;
    }
}

// PDF 다운로드 (품질인정서 단독)
async function downloadPDF() {
    console.log('=== PDF 단독 다운로드 시작 ===');
    
    // 폼 데이터 수집
    const formData = {
        documentType: currentDocumentType,
        issueNo: document.getElementById('issueNo')?.value || '',
        companyName: document.getElementById('companyName')?.value || '',
        quantity: document.getElementById('quantity')?.value || '-',
        issueDate: document.getElementById('issueDate')?.value || '',
        siteName: document.getElementById('siteName')?.value || '',
        siteAddress: document.getElementById('siteAddress')?.value || '',
        deliveryDate: document.getElementById('deliveryDate')?.value || ''
    };
    
    // 서류 타입 이름 결정 (함수 전체에서 사용)
    const docTypeName = formData.documentType === 'quality' ? '품질인정서' : '단열성적서';
    
    console.log('폼 데이터:', formData);
    console.log('📄 서류 타입:', docTypeName);
    
    // PDF가 업로드된 경우
    if (!uploadedFiles.quality2) {
        console.warn(`${docTypeName} PDF가 업로드되지 않음`);
        showNotification(`${docTypeName} PDF를 먼저 업로드해주세요.`, 'error');
        return;
    }
    
    // uploadedFile 전역 변수 설정 (downloadPDFWithOverlay가 사용)
    window.uploadedFile = uploadedFiles.quality2;
    
    try {
        console.log('✓ 품질인정서 단독 다운로드 (Canvas 캡처 방식)');
        
        // 미리보기가 없으면 자동 생성
        let pdfCanvas = document.getElementById('pdfCanvas');
        let overlayLayer = document.querySelector('.cert-overlay-layer');
        
        if (!pdfCanvas || !overlayLayer) {
            console.log('📋 미리보기 자동 생성 중...');
            
            // 폼 데이터를 화면에 반영
            document.getElementById('issueNo').value = formData.issueNo;
            document.getElementById('companyName').value = formData.companyName;
            document.getElementById('quantity').value = formData.quantity;
            document.getElementById('issueDate').value = formData.issueDate;
            document.getElementById('siteName').value = formData.siteName;
            document.getElementById('siteAddress').value = formData.siteAddress;
            document.getElementById('deliveryDate').value = formData.deliveryDate;
            
            // 미리보기 생성 (generatePreview 함수 호출)
            await generatePreview();
            
            // 미리보기 생성 대기 (1.5초)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 미리보기 요소 다시 가져오기
            pdfCanvas = document.getElementById('pdfCanvas');
            overlayLayer = document.querySelector('.cert-overlay-layer');
            
            console.log('✅ 미리보기 자동 생성 완료');
        }
        
        if (!pdfCanvas || !overlayLayer) {
            throw new Error('미리보기 생성에 실패했습니다. 다시 시도해주세요.');
        }
        
        console.log('품질인정서 PDF 생성 시작 (Canvas 캡처 방식)...');
        console.log('📝 formData 확인:', formData);
        
        // 중요: Canvas 캡처 직전에 오버레이 데이터 강제 업데이트
        console.log('🔄 오버레이 데이터 강제 업데이트 시작...');
        document.getElementById('overlay-issueNo').textContent = formData.issueNo || '-';
        document.getElementById('overlay-issueDate').textContent = formatDate(formData.issueDate) || '-';
        document.getElementById('overlay-siteName').textContent = formData.siteName || '-';
        document.getElementById('overlay-siteAddress').textContent = formData.siteAddress || '-';
        document.getElementById('overlay-deliveryDate').textContent = formatDate(formData.deliveryDate) || '-';
        console.log('✅ 오버레이 데이터 강제 업데이트 완료');
        
        // 1단계: 원본 PDF 로드
        const arrayBuffer = await uploadedFiles.quality2.arrayBuffer();
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // 2단계: Canvas와 오버레이를 합성한 임시 캔버스 생성
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        // 원본 PDF 캔버스 크기 가져오기
        tempCanvas.width = pdfCanvas.width;
        tempCanvas.height = pdfCanvas.height;
        
        // 원본 PDF 그리기
        ctx.drawImage(pdfCanvas, 0, 0);
        
        // 오버레이를 html2canvas로 캡처하여 합성
        const overlayCanvas = await html2canvas(overlayLayer, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
            logging: false,
            width: pdfCanvas.width,
            height: pdfCanvas.height
        });
        
        // 오버레이를 tempCanvas에 그리기
        ctx.drawImage(overlayCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        console.log('품질인정서 오버레이 캡처 완료');
        
        // 3단계: 합성된 이미지를 PNG로 변환
        const overlayBlob = await new Promise(resolve => {
            tempCanvas.toBlob(resolve, 'image/png', 0.95);
        });
        
        // 4단계: 오버레이 이미지를 PDF에 삽입
        const overlayImageBytes = await overlayBlob.arrayBuffer();
        const overlayImage = await pdfDoc.embedPng(overlayImageBytes);
        
        // 5단계: 첫 페이지 교체
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        
        // 기존 내용 위에 오버레이 이미지 덮어쓰기
        firstPage.drawImage(overlayImage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
        });
        
        console.log('품질인정서 첫 페이지 오버레이 적용 완료');
        
        // 6단계: 워터마크 추가 (현장명)
        const watermarkText = (formData.siteName || '').toString().trim();
        
        if (watermarkText) {
            console.log('워터마크 추가 중:', watermarkText);
            
            try {
                await Promise.race([
                    document.fonts.ready,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Font timeout')), 3000))
                ]);
            } catch (e) {
                console.warn('폰트 로드 경고 (무시)');
            }
            
            // Canvas로 워터마크 생성
            const wmCanvas = document.createElement('canvas');
            const wmCtx = wmCanvas.getContext('2d');
            wmCanvas.width = 2800;
            wmCanvas.height = 2800;
            
            wmCtx.clearRect(0, 0, wmCanvas.width, wmCanvas.height);
            wmCtx.save();
            wmCtx.translate(wmCanvas.width / 2, wmCanvas.height / 2);
            wmCtx.rotate(45 * Math.PI / 180);
            
            // 📏 자동 폰트 크기 조정 (텍스트 길이에 따라)
            let fontSize = 180; // 기본 폰트 크기
            const maxWidth = wmCanvas.width * 0.8; // 캔버스 너비의 80%까지만 사용
            
            // 폰트 크기를 점진적으로 줄이면서 적절한 크기 찾기
            wmCtx.font = `bold ${fontSize}px "Noto Sans KR", sans-serif`;
            let textWidth = wmCtx.measureText(watermarkText).width;
            
            while (textWidth > maxWidth && fontSize > 30) {
                fontSize -= 10;
                wmCtx.font = `bold ${fontSize}px "Noto Sans KR", sans-serif`;
                textWidth = wmCtx.measureText(watermarkText).width;
            }
            
            console.log(`워터마크 자동 조정: 텍스트="${watermarkText}", 길이=${watermarkText.length}자, 폰트=${fontSize}px`);
            
            wmCtx.fillStyle = 'rgba(128, 128, 128, 0.3)';  // 회색 70% 투명도 (0.3 = 30% 불투명 = 70% 투명)
            wmCtx.textAlign = 'center';
            wmCtx.textBaseline = 'middle';
            wmCtx.fillText(watermarkText, 0, 0);
            wmCtx.restore();
            
            // 워터마크를 PNG로 변환
            const wmBlob = await new Promise(resolve => {
                wmCanvas.toBlob(resolve, 'image/png', 0.9);
            });
            
            const wmBytes = await wmBlob.arrayBuffer();
            const wmImage = await pdfDoc.embedPng(wmBytes);
            
            // 모든 페이지에 워터마크 추가
            const pages = pdfDoc.getPages();
            pages.forEach(page => {
                const { width, height } = page.getSize();
                page.drawImage(wmImage, {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                    opacity: 1
                });
            });
            
            console.log('✓ 워터마크 추가 완료');
        }
        
        // 7단계: 직인 이미지 추가
        try {
            const stampUrl = 'https://www.genspark.ai/api/files/s/MCcTK7jR';
            const stampResponse = await fetch(stampUrl);
            const stampBytes = await stampResponse.arrayBuffer();
            const stampImage = await pdfDoc.embedPng(stampBytes);
            
            const stampWidth = width * 0.12;
            const stampHeight = stampWidth;
            const stampX = width * 0.75;
            const stampY = height * 0.05;
            
            firstPage.drawImage(stampImage, {
                x: stampX,
                y: stampY,
                width: stampWidth,
                height: stampHeight,
                opacity: 1
            });
            
            console.log('직인 이미지 추가 완료');
        } catch (stampError) {
            console.warn('직인 이미지 로드 실패:', stampError);
        }
        
        // 8단계: 최종 PDF 저장 및 다운로드
        const pdfBytes = await pdfDoc.save();
        
        // PDF 파일 다운로드
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${docTypeName}_${formData.companyName || '회사명'}_${formData.issueNo || 'NO'}_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`✅ PDF 다운로드 완료: ${(pdfBytes.length / 1024).toFixed(2)} KB`);
        
        // 발행내역에 자동 저장 (PDF 포함)
        await saveCertificateHistory(formData, pdfBytes);
        
        showNotification(`${docTypeName} PDF 다운로드 및 저장이 완료되었습니다!`, 'success');
        console.log('=== PDF 단독 다운로드 완료 ===');
        
    } catch (error) {
        console.error('❌ PDF 다운로드 오류:', error);
        showNotification('PDF 다운로드 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// 인쇄하기
function printCertificate() {
    console.log('=== 인쇄하기 시작 ===');
    
    // 미리보기가 있는지 확인
    const previewArea = document.querySelector('.preview-area');
    const pdfCanvas = document.getElementById('pdfCanvas');
    
    if (!previewArea || !previewArea.classList.contains('active') || !pdfCanvas) {
        showNotification('먼저 "미리보기 생성" 버튼을 클릭해주세요.', 'error');
        return;
    }
    
    // 브라우저 인쇄 대화상자 열기
    console.log('🖨️ 인쇄 대화상자 열기...');
    window.print();
    console.log('=== 인쇄하기 완료 ===');
}

// 알림 메시지 표시
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 스타일 적용
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00d97e' : '#e63757'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
        font-size: 0.95rem;
    `;
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 애니메이션 스타일 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 파일 업로드 처리
let uploadedFile = null;
let uploadedFileURL = null;
let pdfDoc = null;
let currentPageNum = 1;
let totalPagesNum = 0;

// PDF.js 워커 설정
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    console.log('✓ PDF.js 라이브러리 로드 완료');
} else {
    console.error('❌ PDF.js 라이브러리를 찾을 수 없습니다!');
}

// PDF 렌더링 함수
async function renderPDF(file) {
    try {
        console.log('📄 PDF 렌더링 시작:', file.name, file.size, 'bytes');
        
        if (typeof pdfjsLib === 'undefined') {
            console.error('❌ pdfjsLib가 정의되지 않았습니다!');
            showNotification('PDF 라이브러리를 불러올 수 없습니다.', 'error');
            return;
        }
        
        const fileReader = new FileReader();
        
        fileReader.onerror = function(error) {
            console.error('❌ 파일 읽기 오류:', error);
            showNotification('파일을 읽을 수 없습니다.', 'error');
        };
        
        fileReader.onload = async function() {
            console.log('✓ 파일 읽기 완료');
            const typedArray = new Uint8Array(this.result);
            console.log('✓ TypedArray 생성 완료:', typedArray.length, 'bytes');
            
            try {
                console.log('📥 PDF 문서 로딩 중...');
                pdfDoc = await pdfjsLib.getDocument(typedArray).promise;
                totalPagesNum = pdfDoc.numPages;
                
                console.log('✅ PDF 로드 완료! 총 페이지:', totalPagesNum);
                
                document.getElementById('totalPages').textContent = totalPagesNum;
                
                // 첫 페이지 렌더링
                console.log('🎨 첫 페이지 렌더링 시작...');
                await renderPage(1);
            } catch (error) {
                console.error('❌ PDF 로드 오류:', error);
                console.error('오류 상세:', error.message, error.stack);
                showNotification('PDF를 불러올 수 없습니다: ' + error.message, 'error');
            }
        };
        
        fileReader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('❌ PDF 렌더링 오류:', error);
        showNotification('PDF 렌더링 중 오류가 발생했습니다.', 'error');
    }
}

// PDF 페이지 렌더링
async function renderPage(pageNum) {
    try {
        console.log(`🎨 페이지 ${pageNum} 렌더링 시작...`);
        
        const page = await pdfDoc.getPage(pageNum);
        console.log(`✓ 페이지 ${pageNum} 객체 획득 완료`);
        
        const canvas = document.getElementById('pdfCanvas');
        if (!canvas) {
            console.error('❌ pdfCanvas 요소를 찾을 수 없습니다!');
            showNotification('Canvas를 찾을 수 없습니다.', 'error');
            return;
        }
        console.log('✓ Canvas 요소 찾기 완료');
        
        const ctx = canvas.getContext('2d');
        
        // 뷰포트 설정 (적절한 크기로 조정)
        const viewport = page.getViewport({ scale: 1.5 });
        console.log(`✓ 뷰포트 크기: ${viewport.width} x ${viewport.height}`);
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        console.log('🖌️ Canvas에 렌더링 중...');
        await page.render(renderContext).promise;
        console.log('✅ Canvas 렌더링 완료!');
        
        currentPageNum = pageNum;
        document.getElementById('currentPage').textContent = currentPageNum;
        
        // 버튼 활성화/비활성화
        document.getElementById('prevPage').disabled = (currentPageNum <= 1);
        document.getElementById('nextPage').disabled = (currentPageNum >= totalPagesNum);
        
        // 오버레이는 1페이지에만 표시
        const overlayLayer = document.querySelector('.cert-overlay-layer');
        if (overlayLayer) {
            if (currentPageNum === 1) {
                overlayLayer.style.display = 'block';
                console.log('✓ 오버레이 레이어 표시 (1페이지)');
            } else {
                overlayLayer.style.display = 'none';
                console.log('✓ 오버레이 레이어 숨김 (2페이지 이상)');
            }
        } else {
            console.warn('⚠️ 오버레이 레이어를 찾을 수 없습니다');
        }
        
        console.log(`✅ 페이지 ${pageNum} 렌더링 완료!`);
    } catch (error) {
        console.error(`❌ 페이지 ${pageNum} 렌더링 오류:`, error);
        console.error('오류 상세:', error.message, error.stack);
        showNotification('페이지 렌더링 중 오류가 발생했습니다.', 'error');
    }
}

// PDF 페이지 변경
function changePDFPage(delta) {
    const newPage = currentPageNum + delta;
    if (newPage >= 1 && newPage <= totalPagesNum) {
        renderPage(newPage);
    }
}

// 중복 함수 삭제됨 - handleFileUpload(event, tabName) 함수를 대신 사용

function previewUploadedFile(file, docType) {
    console.log('파일 미리보기 시작:', file.name, file.type, 'docType:', docType);
    
    const previewArea = document.getElementById('previewArea');
    previewArea.innerHTML = '<div class="preview-loading"><i class="fas fa-spinner fa-spin"></i><p>파일 로딩 중...</p></div>';
    previewArea.classList.add('active');
    
    if (uploadedFileURL) {
        URL.revokeObjectURL(uploadedFileURL);
    }
    
    uploadedFileURL = URL.createObjectURL(file);
    console.log('File URL 생성:', uploadedFileURL);
    
    // 품질인정서(quality2)일 때만 오버레이 표시
    const showOverlay = (docType === 'quality2');
    console.log('=== 오버레이 표시 여부 확인 ===');
    console.log('docType:', docType);
    console.log('docType === "quality2":', docType === 'quality2');
    console.log('showOverlay:', showOverlay);
    
    // 약간의 지연을 주어 로딩 표시 후 미리보기 렌더링
    setTimeout(() => {
        if (file.type === 'application/pdf') {
            // PDF 미리보기
            console.log('PDF 미리보기 렌더링', showOverlay ? 'with 오버레이' : 'without 오버레이');
            
            let overlayHTML = '';
            if (showOverlay) {
                console.log('✅ 오버레이 HTML 생성 시작 (품질인정서)');
                overlayHTML = `
                    <!-- 오버레이 레이어 -->
                    <div class="cert-overlay-layer">
                        <!-- 발급 정보 테이블 -->
                        <div class="issue-info-table">
                            <table class="info-table">
                                <tr>
                                    <td class="label-cell">발급 NO</td>
                                    <td class="value-cell" id="overlay-issueNo">-</td>
                                    <td class="label-cell">발급일자</td>
                                    <td class="value-cell" id="overlay-issueDate">-</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">현장명</td>
                                    <td class="value-cell" colspan="3" id="overlay-siteName">-</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">현장주소</td>
                                    <td class="value-cell" colspan="3" id="overlay-siteAddress">-</td>
                                </tr>
                                <tr>
                                    <td class="label-cell">납품일자</td>
                                    <td class="value-cell" colspan="3" id="overlay-deliveryDate">-</td>
                                </tr>
                                <tr>
                                    <td class="label-cell stamp-label" colspan="4">
                                        <div class="stamp-text">본문서에 표기된 현장외 사용할수 없음</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="label-cell company-label" colspan="4">
                                        <div class="company-text">(주) 정일방화문</div>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                `;
                console.log('✅ 오버레이 HTML 생성 완료, 길이:', overlayHTML.length);
            } else {
                console.log('❌ 오버레이 미생성 (품질인정서가 아님)');
            }
            
            previewArea.innerHTML = `
                <div class="pdf-with-overlay-container">
                    <div class="pdf-toolbar">
                        <span class="pdf-filename"><i class="fas fa-file-pdf"></i> ${file.name}</span>
                        <div class="pdf-controls">
                            <button onclick="changePDFPage(-1)" class="btn-pdf-nav" id="prevPage">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span class="pdf-page-info">
                                <span id="currentPage">1</span> / <span id="totalPages">1</span>
                            </span>
                            <button onclick="changePDFPage(1)" class="btn-pdf-nav" id="nextPage">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <div class="pdf-canvas-container">
                        <div class="pdf-wrapper">
                            <canvas id="pdfCanvas" class="pdf-canvas"></canvas>
                            ${overlayHTML}
                        </div>
                    </div>
                </div>
            `;
            
            // PDF.js로 렌더링
            console.log('🚀 renderPDF 함수 호출 시작');
            renderPDF(file);
            
            // 폼 데이터를 오버레이에 자동 업데이트
            setTimeout(() => {
                console.log('📝 오버레이 데이터 업데이트 시작');
                
                // 오버레이 요소 존재 확인
                const overlayLayer = document.querySelector('.cert-overlay-layer');
                const issueInfoTable = document.querySelector('.issue-info-table');
                console.log('cert-overlay-layer 존재:', !!overlayLayer);
                console.log('issue-info-table 존재:', !!issueInfoTable);
                
                if (overlayLayer) {
                    console.log('✅ 오버레이 요소 발견!');
                    console.log('오버레이 display:', overlayLayer.style.display || 'not set');
                } else {
                    console.error('❌ 오버레이 요소가 DOM에 없습니다!');
                }
                
                updateOverlayData();
                
                // 투명 배경 이미지이므로 배경 제거 불필요
                console.log('✅ 투명 배경 이미지 사용 - 배경 제거 스킵');
            }, 1000); // PDF 렌더링 후 업데이트
            
            // 미리보기 액션 버튼 표시
            document.getElementById('previewActions').style.display = 'flex';
        }
        
        showNotification('PDF 파일이 업로드되었습니다!', 'success');
        console.log('✅ 파일 미리보기 완료');
    }, 500); // 로딩 표시 시간 증가
}

// 오버레이 데이터 업데이트 함수
function updateOverlayData() {
    const formData = {
        issueNo: document.getElementById('issueNo').value || '-',
        companyName: document.getElementById('companyName').value || '-',
        issueDate: document.getElementById('issueDate').value || '-',
        siteName: document.getElementById('siteName').value || '-',
        siteAddress: document.getElementById('siteAddress')?.value || '-',
        deliveryDate: document.getElementById('deliveryDate').value || '-'
    };
    
    console.log('오버레이 데이터 업데이트:', formData);
    
    // 오버레이 요소 업데이트
    const overlayIssueNo = document.getElementById('overlay-issueNo');
    if (overlayIssueNo) overlayIssueNo.textContent = formData.issueNo;
    
    const overlayCompanyName = document.getElementById('overlay-companyName');
    if (overlayCompanyName) overlayCompanyName.textContent = formData.companyName;
    
    const overlayIssueDate = document.getElementById('overlay-issueDate');
    if (overlayIssueDate) overlayIssueDate.textContent = formatDate(formData.issueDate);
    
    const overlaySiteName = document.getElementById('overlay-siteName');
    if (overlaySiteName) overlaySiteName.textContent = formData.siteName;
    
    const overlaySiteAddress = document.getElementById('overlay-siteAddress');
    if (overlaySiteAddress) overlaySiteAddress.textContent = formData.siteAddress;
    
    const overlayDeliveryDate = document.getElementById('overlay-deliveryDate');
    if (overlayDeliveryDate) overlayDeliveryDate.textContent = formatDate(formData.deliveryDate);
}

// 원본대조필 이미지 배경 제거 처리 (흰색/검은색)
function processStampImageWhite() {
    const stampImg = document.querySelector('.stamp-pdf-full');
    if (!stampImg) {
        console.log('⚠️ 원본대조필 이미지 요소를 찾을 수 없습니다');
        return;
    }
    
    // 이미지가 로드되었는지 확인
    if (!stampImg.complete) {
        stampImg.onload = () => processStampImageWhite();
        return;
    }
    
    try {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = stampImg.naturalWidth || 400;
        canvas.height = stampImg.naturalHeight || 150;
        
        // 이미지 그리기
        ctx.drawImage(stampImg, 0, 0);
        
        // 픽셀 데이터 가져오기
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 흰색/검은색 배경 제거
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 밝은 픽셀 (흰색 배경)을 투명하게
            if (r > 200 && g > 200 && b > 200) {
                data[i + 3] = 0;
            }
            // 어두운 픽셀 (검은색 배경)을 투명하게
            if (r < 50 && g < 50 && b < 50) {
                data[i + 3] = 0;
            }
        }
        
        // 수정된 이미지 데이터 적용
        ctx.putImageData(imageData, 0, 0);
        
        // Canvas를 이미지로 변환하여 교체
        stampImg.src = canvas.toDataURL('image/png');
        
        console.log('✅ 원본대조필 이미지 흰색 배경 제거 완료');
    } catch (error) {
        console.error('❌ 원본대조필 이미지 처리 오류:', error);
    }
}

// 중복 함수 삭제됨 - resetUpload(tabName) 함수를 대신 사용

// PDF를 Base64로 변환하는 함수
async function pdfToBase64(pdfBytes) {
    try {
        // Uint8Array를 Base64 문자열로 변환
        let binary = '';
        const bytes = new Uint8Array(pdfBytes);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch (error) {
        console.error('❌ Base64 변환 오류:', error);
        return null;
    }
}

// 발행내역 저장 함수 (납품확인서, 품질관리서만 저장)
async function saveCertificateHistory(formData, pdfBytes = null, additionalPdfs = {}) {
    try {
        const currentUser = sessionStorage.getItem('username') || 'admin';
        
        const historyData = {
            issueNo: formData.issueNo || '',
            companyName: formData.companyName || '(주) 정일방화문',
            issueDate: formData.issueDate || '',
            siteName: formData.siteName || '',
            siteAddress: formData.siteAddress || '',
            deliveryDate: formData.deliveryDate || '',
            documentType: formData.documentType || 'quality', // 서류 타입 (quality/insulation)
            issuer: currentUser
        };
        
        let savedCount = 0;
        
        // 납품확인서 PDF 저장 (임시 비활성화 - GenSpark API 오류 대응)
        if (additionalPdfs.delivery) {
            const deliverySizeKB = (additionalPdfs.delivery.length / 1024).toFixed(2);
            console.log('💾 납품확인서 PDF 크기:', deliverySizeKB, 'KB');
            console.warn('⚠️ 납품확인서 PDF 저장 비활성화 (GenSpark API 오류 대응)');
            // PDF 저장 기능 임시 비활성화
            // if (additionalPdfs.delivery.length <= 2 * 1024 * 1024) {
            //     const deliveryBase64 = await pdfToBase64(additionalPdfs.delivery);
            //     if (deliveryBase64) {
            //         historyData.deliveryPdfData = deliveryBase64;
            //         historyData.deliveryPdfFileName = `납품확인서_${formData.issueNo}_${formData.companyName}.pdf`;
            //         historyData.deliveryPdfFileSize = additionalPdfs.delivery.length;
            //         console.log('   ✅ 납품확인서 저장:', deliverySizeKB, 'KB');
            //         savedCount++;
            //     }
            // }
        }
        
        // 품질관리서 PDF 저장 (임시 비활성화 - GenSpark API 오류 대응)
        if (additionalPdfs.quality1) {
            const quality1SizeKB = (additionalPdfs.quality1.length / 1024).toFixed(2);
            console.log('💾 품질관리서 PDF 크기:', quality1SizeKB, 'KB');
            console.warn('⚠️ 품질관리서 PDF 저장 비활성화 (GenSpark API 오류 대응)');
            // PDF 저장 기능 임시 비활성화
            // if (additionalPdfs.quality1.length <= 2 * 1024 * 1024) {
            //     const quality1Base64 = await pdfToBase64(additionalPdfs.quality1);
            //     if (quality1Base64) {
            //         historyData.qualityPdfData = quality1Base64;
            //         historyData.qualityPdfFileName = `품질관리서_${formData.issueNo}_${formData.companyName}.pdf`;
            //         historyData.qualityPdfFileSize = additionalPdfs.quality1.length;
            //         console.log('   ✅ 품질관리서 저장:', quality1SizeKB, 'KB');
            //         savedCount++;
            //     }
            // }
        }
        
        // 품질인정서는 용량이 커서 저장하지 않음 (주석으로 설명)
        // pdfBytes 파라미터는 호환성을 위해 남겨둠
        if (pdfBytes) {
            console.log('ℹ️ 품질인정서는 용량이 커서 서버에 저장하지 않습니다.');
        }
        
        // 요청 데이터 크기 확인
        const requestSize = new Blob([JSON.stringify(historyData)]).size;
        console.log('📝 발행내역 저장 중...', {
            issueNo: historyData.issueNo,
            documentType: historyData.documentType,
            requestSize: `${(requestSize / 1024).toFixed(2)} KB`,
            hasPDF: {
                delivery: !!historyData.deliveryPdfData,
                quality1: !!historyData.qualityPdfData
            }
        });
        
        // 요청 크기 제한 (5MB)
        if (requestSize > 5 * 1024 * 1024) {
            console.error('❌ 요청 데이터가 너무 큼:', (requestSize / 1024 / 1024).toFixed(2), 'MB');
            showNotification('데이터 크기가 너무 큽니다. PDF 파일 크기를 줄여주세요.', 'error');
            return;
        }
        
        const response = await fetch('api/certificates.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(historyData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API 오류 응답:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`저장 실패: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ 발행내역 저장 완료:', result);
        
        if (savedCount > 0) {
            const savedFiles = [];
            if (additionalPdfs.delivery) savedFiles.push('납품확인서');
            if (additionalPdfs.quality1) savedFiles.push('품질관리서');
            
            showNotification(`발행내역과 PDF 파일이 저장되었습니다! (${savedFiles.join(', ')})`, 'success');
            console.log(`✅ 총 ${savedCount}개 파일 저장 완료`);
        } else {
            console.log('ℹ️ 저장할 PDF 파일이 없습니다.');
        }
        
        return result;
    } catch (error) {
        console.error('❌ 발행내역 저장 오류:', error);
        showNotification('발행내역 저장 실패: ' + error.message, 'error');
        // 저장 실패해도 PDF 다운로드는 정상 진행
    }
}

// 드래그 앤 드롭 기능
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.querySelector('.upload-area');
    
    if (uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.style.borderColor = 'var(--primary-color)';
                uploadArea.style.background = '#f0f4ff';
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.style.borderColor = 'var(--border-color)';
                uploadArea.style.background = 'var(--light-color)';
            }, false);
        });
        
        uploadArea.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                const file = files[0];
                // PDF 파일만 허용
                if (file.type === 'application/pdf') {
                    document.getElementById('pdfUpload').files = files;
                    handleFileUpload({ target: { files: files } });
                } else {
                    showNotification('PDF 파일만 업로드 가능합니다.', 'error');
                }
            }
        }, false);
    }
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDates();
    
    // 폼 제출 이벤트 등록
    const certForm = document.getElementById('certificationForm');
    if (certForm) {
        certForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 폼 데이터 수집
            const formData = {
                issueNo: document.getElementById('issueNo').value,
                companyName: document.getElementById('companyName').value,
                quantity: document.getElementById('quantity').value,
                issueDate: document.getElementById('issueDate').value,
                siteName: document.getElementById('siteName').value,
                deliveryDate: document.getElementById('deliveryDate').value
            };
            
            // 업로드된 PDF가 있으면 오버레이만 업데이트
            if (uploadedFile && uploadedFile.type === 'application/pdf') {
                updateCertificateData(formData);
                showNotification('입력 정보가 업데이트되었습니다!', 'success');
            } else {
                // 미리보기 생성
                generatePreview(formData);
            }
        });
    }
    
    // 폼 필드 변경 시 오버레이 자동 업데이트
    const formFields = ['issueNo', 'companyName', 'quantity', 'issueDate', 'siteName', 'deliveryDate'];
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                // 업로드된 PDF가 있고 오버레이가 표시중일 때만 업데이트
                if (uploadedFile && document.getElementById('overlay-issueNo')) {
                    updateOverlayData();
                }
            });
            
            // 날짜 필드는 change 이벤트도 추가
            if (fieldId.includes('Date')) {
                field.addEventListener('change', function() {
                    if (uploadedFile && document.getElementById('overlay-issueNo')) {
                        updateOverlayData();
                    }
                });
            }
        }
    });
    
    // 샘플 데이터 자동 입력 (테스트용)
    if (window.location.search.includes('demo=true')) {
        document.getElementById('issueNo').value = '25-1204-7';
        document.getElementById('companyName').value = '(주)동신모바일 신월단공장 신록공사';
        document.getElementById('quantity').value = '1 SET';
        document.getElementById('siteName').value = '(주)동일 제2공단 704';
    }
});

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // Ctrl + P: 인쇄
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (document.getElementById('previewActions').style.display !== 'none') {
            printCertificate();
        }
    }
    
    // Ctrl + S: PDF 저장
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (document.getElementById('previewActions').style.display !== 'none') {
            downloadPDF();
        }
    }
    
    // ESC: 폼 초기화
    if (e.key === 'Escape') {
        resetForm();
    }
});

// ===== 파일 업로드 관련 변수 =====
let uploadedFiles = {
    fixed: null,      // 고정 서류 (사업자등록증/공장등록증/KS인증서)
    quality1: null,   // 품질관리서
    delivery: null,   // 납품확인서
    quality2: null    // 품질인정서
};

// 디버그: 함수 존재 확인
console.log('=== 파일 업로드 함수 체크 ===');
console.log('handleFileUpload:', typeof handleFileUpload);
console.log('handleTableFileUpload:', typeof handleTableFileUpload);
console.log('resetUpload:', typeof resetUpload);
console.log('resetTableUpload:', typeof resetTableUpload);
console.log('uploadedFiles 초기화:', uploadedFiles);

// 오버레이 표시 상태 확인 함수 (디버깅용)
window.checkOverlay = function() {
    const overlay = document.querySelector('.cert-overlay-layer');
    const issueInfoTable = document.querySelector('.issue-info-table');
    
    console.log('=== 오버레이 상태 확인 ===');
    console.log('cert-overlay-layer 존재:', !!overlay);
    console.log('cert-overlay-layer display:', overlay?.style.display || 'not set');
    console.log('issue-info-table 존재:', !!issueInfoTable);
    console.log('현재 페이지:', currentPageNum);
    console.log('총 페이지:', totalPagesNum);
    console.log('window.currentDocType:', window.currentDocType);
    
    if (overlay) {
        console.log('오버레이 HTML:', overlay.innerHTML.substring(0, 200));
    }
    
    return {
        overlayExists: !!overlay,
        overlayDisplay: overlay?.style.display,
        tableExists: !!issueInfoTable,
        currentPage: currentPageNum,
        docType: window.currentDocType
    };
};



// 고정 서류 (사업자등록증/공장등록증/KS인증서) 파일 업로드 처리 함수
function handleFileUpload(event, tabName) {
    console.log('handleFileUpload 호출:', event, tabName);
    
    if (!event || !event.target) {
        console.error('잘못된 이벤트 객체:', event);
        showNotification('파일 업로드 오류가 발생했습니다.', 'error');
        return;
    }
    
    const file = event.target.files[0];
    console.log(`${tabName} 파일 업로드:`, file);
    
    if (!file) {
        console.log('파일이 선택되지 않았습니다');
        return;
    }
    
    // 파일 타입 체크 (PDF만 허용)
    if (file.type !== 'application/pdf') {
        showNotification('PDF 파일만 업로드 가능합니다.', 'error');
        return;
    }
    
    // 파일 크기 체크 (20MB)
    if (file.size > 20 * 1024 * 1024) {
        showNotification('파일 크기는 20MB 이하여야 합니다.', 'error');
        return;
    }
    
    // 파일 저장
    uploadedFiles[tabName] = file;
    uploadedFile = file; // 전역 변수에도 저장
    
    // ⭐ 고정 서류인 경우 LocalStorage에 저장
    if (tabName === 'fixed') {
        saveFixedDocsToLocalStorage(file);
    }
    
    try {
        // 고정 서류 단일 업로드 UI 업데이트
        const uploadArea = document.getElementById('uploadArea-fixed');
        const fileUploaded = document.getElementById('fileUploaded-fixed');
        const fileName = document.getElementById('filename-fixed');
        const fileSize = document.getElementById('filesize-fixed');
        
        if (!uploadArea || !fileUploaded || !fileName || !fileSize) {
            console.error('고정 서류 UI 요소를 찾을 수 없습니다');
            throw new Error('UI 요소 누락');
        }
        
        const fileSizeKB = (file.size / 1024).toFixed(2);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const displaySize = file.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
        
        uploadArea.style.display = 'none';
        fileName.textContent = file.name;
        fileSize.textContent = displaySize;
        fileUploaded.style.display = 'flex';
        
        // 파일 미리보기 (고정 서류는 오버레이 없음)
        previewUploadedFile(file, tabName);
        
        showNotification(`${getTabLabel(tabName)} 업로드 완료!`, 'success');
    } catch (error) {
        console.error('파일 업로드 처리 오류:', error);
        showNotification('파일 업로드 중 오류가 발생했습니다.', 'error');
    }
}

// 고정 서류 업로드 초기화
function resetUpload(tabName) {
    console.log(`${tabName} 업로드 초기화`);
    
    if (!tabName) {
        // 전체 초기화
        uploadedFile = null;
        uploadedFiles = {
            fixed: null,
            quality1: null,
            delivery: null,
            quality2: null
        };
        
        if (uploadedFileURL) {
            URL.revokeObjectURL(uploadedFileURL);
            uploadedFileURL = null;
        }
        
        // 고정 서류 초기화
        const fixedInput = document.getElementById('pdfUpload-fixed');
        const uploadArea = document.getElementById('uploadArea-fixed');
        const fileUploaded = document.getElementById('fileUploaded-fixed');
        
        if (fixedInput) fixedInput.value = '';
        if (uploadArea) uploadArea.style.display = 'flex';
        if (fileUploaded) fileUploaded.style.display = 'none';
        
        // 품질 서류 테이블 초기화
        ['quality1', 'delivery', 'quality2'].forEach(doc => {
            const input = document.getElementById(`pdfUpload-${doc}`);
            const uploadBtn = document.getElementById(`uploadBtn-${doc}`);
            const fileInfo = document.getElementById(`fileInfo-${doc}`);
            
            if (input) input.value = '';
            if (uploadBtn) uploadBtn.style.display = 'inline-flex';
            if (fileInfo) fileInfo.style.display = 'none';
        });
        
        showNotification('모든 업로드가 초기화되었습니다.', 'info');
    } else if (tabName === 'fixed') {
        // 고정 서류만 초기화
        uploadedFiles[tabName] = null;
        
        // ⭐ LocalStorage에서 고정 서류 삭제
        clearFixedDocsFromLocalStorage();
        
        const input = document.getElementById('pdfUpload-fixed');
        const uploadArea = document.getElementById('uploadArea-fixed');
        const fileUploaded = document.getElementById('fileUploaded-fixed');
        
        if (input) input.value = '';
        if (uploadArea) uploadArea.style.display = 'flex';
        if (fileUploaded) fileUploaded.style.display = 'none';
        
        if (uploadedFile === uploadedFiles[tabName]) {
            uploadedFile = null;
        }
        
        showNotification(`${getTabLabel(tabName)} 업로드가 초기화되었습니다.`, 'info');
    }
    
    // 미리보기 영역 초기화
    const previewArea = document.getElementById('previewArea');
    previewArea.classList.remove('active');
    previewArea.innerHTML = `
        <div class="preview-placeholder">
            <i class="fas fa-image"></i>
            <p>서류를 업로드하거나<br>좌측 폼을 작성하고 "미리보기 생성" 버튼을 클릭하세요</p>
        </div>
    `;
    
    document.getElementById('previewActions').style.display = 'none';
}

// 서류 이름을 한글로 변환
function getTabLabel(tabName) {
    const labels = {
        fixed: '고정 서류 (사업자등록증/공장등록증/KS인증서)',
        quality1: '품질관리서',
        delivery: '납품확인서',
        quality2: '품질인정서'
    };
    return labels[tabName] || tabName;
}

// ===== LocalStorage 고정 서류 관리 =====

// 고정 서류를 LocalStorage에 저장
function saveFixedDocsToLocalStorage(file) {
    console.log('💾 고정 서류를 LocalStorage에 저장 중...', file.name);
    
    try {
        // 파일을 Base64로 변환
        const reader = new FileReader();
        
        reader.onload = function() {
            try {
                // LocalStorage에 저장
                localStorage.setItem('fixedDocs_base64', reader.result);
                localStorage.setItem('fixedDocs_name', file.name);
                localStorage.setItem('fixedDocs_size', file.size);
                localStorage.setItem('fixedDocs_savedAt', new Date().toISOString());
                
                console.log('✅ 고정 서류 저장 완료!');
                console.log('   - 파일명:', file.name);
                console.log('   - 크기:', (file.size / (1024 * 1024)).toFixed(2), 'MB');
                
                // 사용자에게 알림
                showNotification('고정 서류가 저장되었습니다. 다음 방문 시 자동으로 불러옵니다.', 'success');
            } catch (storageError) {
                console.error('❌ LocalStorage 저장 실패:', storageError);
                
                if (storageError.name === 'QuotaExceededError') {
                    showNotification('파일 크기가 너무 커서 저장할 수 없습니다. (최대 5-10MB)', 'warning');
                } else {
                    showNotification('파일 저장 중 오류가 발생했습니다.', 'warning');
                }
            }
        };
        
        reader.onerror = function(error) {
            console.error('❌ 파일 읽기 실패:', error);
            showNotification('파일을 읽을 수 없습니다.', 'error');
        };
        
        // Base64로 변환 시작
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('❌ 고정 서류 저장 오류:', error);
        showNotification('파일 저장 중 오류가 발생했습니다.', 'error');
    }
}

// LocalStorage에서 고정 서류 불러오기
function loadFixedDocsFromLocalStorage() {
    console.log('💾 LocalStorage에서 고정 서류 확인 중...');
    
    try {
        const savedBase64 = localStorage.getItem('fixedDocs_base64');
        const savedName = localStorage.getItem('fixedDocs_name');
        const savedSize = localStorage.getItem('fixedDocs_size');
        const savedAt = localStorage.getItem('fixedDocs_savedAt');
        
        if (!savedBase64 || !savedName) {
            console.log('ℹ️ 저장된 고정 서류가 없습니다');
            return false;
        }
        
        console.log('✅ 저장된 고정 서류 발견!');
        console.log('   - 파일명:', savedName);
        console.log('   - 크기:', (savedSize / (1024 * 1024)).toFixed(2), 'MB');
        console.log('   - 저장일:', new Date(savedAt).toLocaleString('ko-KR'));
        
        // Base64를 Blob으로 변환
        fetch(savedBase64)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], savedName, { type: 'application/pdf' });
                
                // uploadedFiles에 설정
                uploadedFiles.fixed = file;
                uploadedFile = file;
                
                // UI 업데이트
                const uploadArea = document.getElementById('uploadArea-fixed');
                const fileUploaded = document.getElementById('fileUploaded-fixed');
                const fileName = document.getElementById('filename-fixed');
                const fileSize = document.getElementById('filesize-fixed');
                
                if (uploadArea && fileUploaded && fileName && fileSize) {
                    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    const fileSizeKB = (file.size / 1024).toFixed(2);
                    const displaySize = file.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
                    
                    uploadArea.style.display = 'none';
                    fileName.textContent = savedName + ' ✨ (자동 로드)';
                    fileSize.textContent = displaySize;
                    fileUploaded.style.display = 'flex';
                    
                    console.log('✅ 고정 서류 자동 로드 완료!');
                    showNotification('이전에 저장된 고정 서류를 자동으로 불러왔습니다.', 'info');
                } else {
                    console.warn('⚠️ UI 요소를 찾을 수 없습니다');
                }
            })
            .catch(error => {
                console.error('❌ 고정 서류 복원 실패:', error);
                
                // 손상된 데이터 삭제
                clearFixedDocsFromLocalStorage();
                showNotification('저장된 파일을 불러올 수 없습니다. 다시 업로드해주세요.', 'warning');
            });
        
        return true;
    } catch (error) {
        console.error('❌ 고정 서류 로드 오류:', error);
        return false;
    }
}

// LocalStorage에서 고정 서류 삭제
function clearFixedDocsFromLocalStorage() {
    console.log('🗑️ LocalStorage에서 고정 서류 삭제 중...');
    
    try {
        localStorage.removeItem('fixedDocs_base64');
        localStorage.removeItem('fixedDocs_name');
        localStorage.removeItem('fixedDocs_size');
        localStorage.removeItem('fixedDocs_savedAt');
        
        console.log('✅ 고정 서류 삭제 완료!');
    } catch (error) {
        console.error('❌ 고정 서류 삭제 오류:', error);
    }
}

// LocalStorage 저장 정보 확인 (디버깅용)
window.checkFixedDocsStorage = function() {
    const savedName = localStorage.getItem('fixedDocs_name');
    const savedSize = localStorage.getItem('fixedDocs_size');
    const savedAt = localStorage.getItem('fixedDocs_savedAt');
    const hasData = localStorage.getItem('fixedDocs_base64') !== null;
    
    console.log('=== 고정 서류 저장 정보 ===');
    console.log('저장 여부:', hasData ? '✅ 있음' : '❌ 없음');
    
    if (hasData) {
        console.log('파일명:', savedName);
        console.log('크기:', (savedSize / (1024 * 1024)).toFixed(2), 'MB');
        console.log('저장일:', new Date(savedAt).toLocaleString('ko-KR'));
    }
    
    return {
        hasSavedFile: hasData,
        fileName: savedName,
        fileSize: savedSize ? `${(savedSize / (1024 * 1024)).toFixed(2)} MB` : null,
        savedAt: savedAt ? new Date(savedAt).toLocaleString('ko-KR') : null
    };
};

// 테이블 형식 파일 업로드 처리
function handleTableFileUpload(event, docType) {
    console.log('handleTableFileUpload 호출:', event, docType);
    
    if (!event || !event.target) {
        console.error('잘못된 이벤트 객체:', event);
        showNotification('파일 업로드 오류가 발생했습니다.', 'error');
        return;
    }
    
    const file = event.target.files[0];
    console.log(`${docType} 파일 업로드:`, file);
    
    if (!file) {
        console.log('파일이 선택되지 않았습니다');
        return;
    }
    
    // 파일 타입 체크 (PDF만 허용)
    if (file.type !== 'application/pdf') {
        showNotification('PDF 파일만 업로드 가능합니다.', 'error');
        return;
    }
    
    // 파일 크기 체크 (20MB)
    if (file.size > 20 * 1024 * 1024) {
        showNotification('파일 크기는 20MB 이하여야 합니다.', 'error');
        return;
    }
    
    // 파일 저장
    uploadedFiles[docType] = file;
    uploadedFile = file; // 전역 변수에도 저장
    window.currentDocType = docType; // 현재 문서 타입 저장
    
    try {
        // UI 업데이트
        const uploadBtn = document.getElementById(`uploadBtn-${docType}`);
        const fileInfo = document.getElementById(`fileInfo-${docType}`);
        const fileNameSpan = fileInfo?.querySelector('.table-filename');
        
        if (uploadBtn) uploadBtn.style.display = 'none';
        if (fileNameSpan) fileNameSpan.textContent = file.name;
        if (fileInfo) fileInfo.style.display = 'inline-flex';
        
        // 파일 미리보기
        previewUploadedFile(file, docType);
        
        showNotification(`${getTabLabel(docType)} 업로드 완료!`, 'success');
    } catch (error) {
        console.error('파일 업로드 처리 오류:', error);
        showNotification('파일 업로드 중 오류가 발생했습니다.', 'error');
    }
}

// 테이블 업로드 초기화
function resetTableUpload(docType) {
    console.log(`${docType} 업로드 초기화`);
    
    uploadedFiles[docType] = null;
    
    const input = document.getElementById(`pdfUpload-${docType}`);
    const uploadBtn = document.getElementById(`uploadBtn-${docType}`);
    const fileInfo = document.getElementById(`fileInfo-${docType}`);
    
    if (input) input.value = '';
    if (uploadBtn) uploadBtn.style.display = 'inline-flex';
    if (fileInfo) fileInfo.style.display = 'none';
    
    // 전역 uploadedFile도 업데이트
    if (uploadedFile === uploadedFiles[docType]) {
        uploadedFile = null;
    }
    
    showNotification(`${getTabLabel(docType)} 업로드가 초기화되었습니다.`, 'info');
}

// 드래그 앤 드롭 업데이트 (고정 서류만)
document.addEventListener('DOMContentLoaded', function() {
    // ⭐ LocalStorage에서 고정 서류 자동 로드
    console.log('🚀 페이지 로드 완료, 고정 서류 자동 로드 확인...');
    setTimeout(() => {
        loadFixedDocsFromLocalStorage();
    }, 500); // 페이지가 완전히 로드된 후 실행
    
    // 고정 서류 드래그 앤 드롭
    const fixedUploadArea = document.getElementById('uploadArea-fixed');
    
    if (fixedUploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fixedUploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            fixedUploadArea.addEventListener(eventName, () => {
                fixedUploadArea.style.borderColor = 'var(--primary-color)';
                fixedUploadArea.style.background = '#f0f4ff';
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            fixedUploadArea.addEventListener(eventName, () => {
                fixedUploadArea.style.borderColor = 'var(--border-color)';
                fixedUploadArea.style.background = 'white';
            }, false);
        });
        
        fixedUploadArea.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                const file = files[0];
                if (file.type === 'application/pdf') {
                    const input = document.getElementById('pdfUpload-fixed');
                    if (input) {
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        input.files = dataTransfer.files;
                        
                        handleFileUpload({ target: { files: files } }, 'fixed');
                    }
                } else {
                    showNotification('PDF 파일만 업로드 가능합니다.', 'error');
                }
            }
        }, false);
    }
    
    // ⭐ 페이지 로드 후 자동 진단 실행
    setTimeout(() => {
        console.log('\n=================================');
        console.log('🔍 품질인정서 오버레이 시스템 자동 진단');
        console.log('=================================');
        console.log('✓ script.js 로드 완료');
        console.log('✓ 함수 확인:');
        console.log('  - handleTableFileUpload:', typeof handleTableFileUpload);
        console.log('  - previewUploadedFile:', typeof previewUploadedFile);
        console.log('  - updateOverlayData:', typeof updateOverlayData);
        console.log('  - renderPDF:', typeof renderPDF);
        console.log('\n📝 사용 방법:');
        console.log('  1. 품질인정서(quality2) PDF 업로드');
        console.log('  2. 발급 정보 입력 (발급NO, 업체명, 수량 등)');
        console.log('  3. PDF 첫 페이지 우측 상단에 빨간 테두리 표 확인');
        console.log('\n🔧 디버깅 명령어:');
        console.log('  - checkQuality2Overlay() : 오버레이 상태 확인');
        console.log('  - window.currentDocType : 현재 문서 타입');
        console.log('  - uploadedFiles : 업로드된 파일 목록');
        console.log('=================================\n');
    }, 1000);
});

// 품질인정서 오버레이 진단 함수
window.checkQuality2Overlay = function() {
    console.log('\n=== 품질인정서 오버레이 진단 결과 ===');
    
    // 1. 현재 문서 타입 확인
    const docType = window.currentDocType;
    console.log('1. 현재 문서 타입:', docType);
    console.log('   → quality2인가?', docType === 'quality2' ? '✅ Yes' : '❌ No');
    
    // 2. 오버레이 요소 확인
    const overlayLayer = document.querySelector('.cert-overlay-layer');
    console.log('2. 오버레이 레이어 존재:', overlayLayer ? '✅ Yes' : '❌ No');
    
    if (overlayLayer) {
        console.log('   → display:', overlayLayer.style.display || 'default');
        console.log('   → HTML 길이:', overlayLayer.innerHTML.length, 'characters');
    }
    
    // 3. 테이블 요소 확인
    const issueInfoTable = document.querySelector('.issue-info-table');
    console.log('3. 발급 정보 테이블 존재:', issueInfoTable ? '✅ Yes' : '❌ No');
    
    // 4. 개별 필드 확인
    const fields = ['overlay-issueNo', 'overlay-companyName', 'overlay-quantity', 
                    'overlay-issueDate', 'overlay-siteName', 'overlay-deliveryDate'];
    console.log('4. 오버레이 필드 확인:');
    fields.forEach(id => {
        const elem = document.getElementById(id);
        const value = elem ? elem.textContent : null;
        console.log(`   → ${id}:`, elem ? '✅' : '❌', value ? `"${value}"` : '(empty)');
    });
    
    // 5. 업로드된 파일 확인
    console.log('5. 업로드된 파일:');
    if (uploadedFiles) {
        console.log('   → quality1:', uploadedFiles.quality1 ? '✅' : '❌');
        console.log('   → delivery:', uploadedFiles.delivery ? '✅' : '❌');
        console.log('   → quality2:', uploadedFiles.quality2 ? '✅' : '❌');
        console.log('   → fixed:', uploadedFiles.fixed ? '✅' : '❌');
    }
    
    // 6. 현재 페이지 번호 확인
    const currentPageElem = document.getElementById('currentPage');
    if (currentPageElem) {
        const pageNum = parseInt(currentPageElem.textContent);
        console.log('6. 현재 PDF 페이지:', pageNum);
        console.log('   → 1페이지인가?', pageNum === 1 ? '✅ Yes' : '❌ No');
    }
    
    // 7. 결론
    console.log('\n=== 진단 결과 요약 ===');
    const isQuality2 = docType === 'quality2';
    const hasOverlay = !!overlayLayer;
    const hasTable = !!issueInfoTable;
    
    if (isQuality2 && hasOverlay && hasTable) {
        console.log('✅ 정상: 모든 요소가 정상적으로 생성되었습니다!');
        console.log('   표가 보이지 않는다면 CSS 로드 문제일 수 있습니다.');
        console.log('   → 브라우저 캐시 삭제 후 재시도 (Ctrl + Shift + Delete)');
    } else if (!isQuality2) {
        console.log('⚠️ 품질인정서(quality2)가 아닌 다른 문서가 업로드되었습니다.');
        console.log('   → 품질인정서 PDF를 업로드해주세요.');
    } else {
        console.log('❌ 오류: 오버레이 요소가 생성되지 않았습니다!');
        console.log('   → 브라우저 캐시 삭제 후 재시도 (Ctrl + Shift + Delete)');
        console.log('   → 또는 시크릿 모드에서 테스트 (Ctrl + Shift + N)');
    }
    console.log('=================================\n');
    
    return {
        docType: docType,
        isQuality2: isQuality2,
        overlayExists: hasOverlay,
        tableExists: hasTable,
        overlayDisplay: overlayLayer?.style.display || 'not set',
        currentPage: currentPageElem ? parseInt(currentPageElem.textContent) : null
    };
};
