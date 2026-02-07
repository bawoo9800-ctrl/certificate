// 전역 변수
let currentPage = 1;
let currentData = [];
let totalRecords = 0;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // 사용자 정보 표시
    const username = sessionStorage.getItem('username') || localStorage.getItem('username') || '관리자';
    document.getElementById('usernameDisplay').textContent = username;
    
    // 발행 내역 로드
    loadHistory();
    
    // 검색 입력 시 엔터키 처리
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchHistory();
        }
    });
});

// 로그아웃
function logout() {
    sessionStorage.clear();
    localStorage.removeItem('rememberMe');
    window.location.href = 'login.html';
}

// 발행 내역 로드
async function loadHistory(page = 1) {
    try {
        const limit = parseInt(document.getElementById('pageLimit').value) || 10;
        const sortOrder = document.getElementById('sortOrder').value || '-created_at';
        const searchQuery = document.getElementById('searchInput').value.trim();
        
        console.log('🔍 검색 조건:', {
            page: page,
            limit: limit,
            sortOrder: sortOrder,
            searchQuery: searchQuery
        });
        
        // 검색어가 있으면 전체 데이터를 가져와서 클라이언트 측에서 필터링
        const fetchLimit = searchQuery ? 1000 : limit;
        let url = `api/certificates.php?page=1&limit=${fetchLimit}&sort=${sortOrder}`;
        
        console.log('📡 발행 내역 조회 중...', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`조회 실패: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ 발행 내역 조회 완료:', result);
        console.log('📊 응답 전체 구조:', Object.keys(result));
        console.log('📊 result.total:', result.total);
        console.log('📊 result.data:', result.data);
        console.log('📊 result.rows:', result.rows);
        
        // API 응답 구조 확인 및 처리
        let dataArray = [];
        let totalCount = 0;
        
        if (Array.isArray(result)) {
            // 응답이 직접 배열인 경우
            console.log('🔄 응답이 배열 형식입니다');
            dataArray = result;
            totalCount = result.length;
        } else if (result.data) {
            // {data: [...], total: n} 구조
            console.log('🔄 result.data 구조 사용');
            dataArray = result.data;
            totalCount = result.total || result.data.length;
        } else if (result.rows) {
            // {rows: [...], count: n} 구조
            console.log('🔄 result.rows 구조 사용');
            dataArray = result.rows;
            totalCount = result.count || result.total || result.rows.length;
        } else {
            console.error('❌ 알 수 없는 응답 구조:', result);
            dataArray = [];
            totalCount = 0;
        }
        
        console.log('📊 API에서 받은 데이터 길이:', dataArray.length);
        console.log('📊 API에서 받은 총 건수:', totalCount);
        
        // 서류 타입 필터링
        let filteredData = dataArray;
        const documentTypeFilter = document.getElementById('documentTypeFilter')?.value || 'all';
        if (documentTypeFilter !== 'all') {
            console.log('📄 서류 타입 필터:', documentTypeFilter);
            filteredData = filteredData.filter(item => item.documentType === documentTypeFilter);
            console.log('📄 필터 후 결과:', filteredData.length + '건');
        }
        
        // 검색어가 있으면 클라이언트 측에서 필터링
        if (searchQuery) {
            console.log('🔍 클라이언트 측 검색 시작:', searchQuery);
            filteredData = filteredData.filter(item => {
                const searchLower = searchQuery.toLowerCase();
                return (
                    (item.issueNo && item.issueNo.toLowerCase().includes(searchLower)) ||
                    (item.companyName && item.companyName.toLowerCase().includes(searchLower)) ||
                    (item.siteName && item.siteName.toLowerCase().includes(searchLower)) ||
                    (item.quantity && item.quantity.toString().includes(searchLower)) ||
                    (item.issueDate && item.issueDate.includes(searchQuery)) ||
                    (item.deliveryDate && item.deliveryDate.includes(searchQuery)) ||
                    (item.issuer && item.issuer.toLowerCase().includes(searchLower))
                );
            });
            console.log('🔍 검색 결과:', filteredData.length + '건');
            // 검색 시에만 totalCount를 검색 결과 개수로 업데이트
            totalCount = filteredData.length;
        }
        
        // 페이지네이션 처리
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = searchQuery ? filteredData.slice(startIndex, endIndex) : filteredData;
        
        console.log('📊 페이지 처리 후 데이터:', {
            시작인덱스: startIndex,
            끝인덱스: endIndex,
            페이지데이터길이: paginatedData.length,
            전체건수: totalCount
        });
        
        currentPage = page;
        currentData = paginatedData;
        totalRecords = totalCount;
        
        console.log('🔄 상태 업데이트:');
        console.log('  - currentPage:', currentPage);
        console.log('  - currentData 길이:', currentData.length);
        console.log('  - totalRecords:', totalRecords);
        
        // UI 업데이트
        updateStatsCards(filteredData, totalCount);
        renderTable(currentData);
        renderPagination(currentPage, limit, totalRecords);
        
        console.log('✅ UI 업데이트 완료:', {
            통계카드데이터: filteredData.length,
            테이블데이터: currentData.length,
            페이지: currentPage,
            전체건수: totalRecords
        });
        
    } catch (error) {
        console.error('❌ 발행 내역 조회 오류:', error);
        
        // API 연결 오류 체크
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showEnvironmentError();
        } else {
            showNotification('발행 내역을 불러오는데 실패했습니다.', 'error');
        }
        
        // 빈 테이블 표시
        renderTable([]);
    }
}

// 환경 오류 메시지 표시
function showEnvironmentError() {
    const tbody = document.getElementById('historyTableBody');
    const currentUrl = window.location.origin;
    const isLocal = currentUrl.includes('127.0.0.1') || currentUrl.includes('localhost');
    
    if (isLocal) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 60px 40px;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #f59e0b; margin-bottom: 20px;"></i>
                        <h3 style="color: #ef4444; margin-bottom: 15px; font-size: 20px;">
                            ⚠️ 로컬 환경에서는 발행내역 기능을 사용할 수 없습니다
                        </h3>
                        <p style="color: #666; line-height: 1.8; margin-bottom: 20px;">
                            이 시스템은 <strong>GenSpark 클라우드 환경</strong>에서 실행되어야 
                            발행내역 및 통계 기능을 사용할 수 있습니다.<br>
                            로컬 환경에서는 품질인정서 작성 및 PDF 다운로드 기능만 사용 가능합니다.
                        </p>
                        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin-top: 20px; text-align: left;">
                            <strong style="color: #92400e; display: block; margin-bottom: 10px;">
                                💡 해결 방법:
                            </strong>
                            <ol style="color: #78350f; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                                <li>GenSpark 프로젝트로 이동하여 배포</li>
                                <li>배포된 URL로 접속 (https://xxxxx.genspark.ai/)</li>
                                <li>또는 <code style="background: #fbbf24; padding: 2px 6px; border-radius: 3px;">TROUBLESHOOTING_API.md</code> 파일 참조</li>
                            </ol>
                        </div>
                        <div style="margin-top: 20px;">
                            <a href="index.html" class="btn btn-primary" style="display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                                <i class="fas fa-arrow-left"></i> 품질인정서 작성 화면으로 돌아가기
                            </a>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 60px 40px;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <i class="fas fa-exclamation-circle" style="font-size: 64px; color: #ef4444; margin-bottom: 20px;"></i>
                        <h3 style="color: #ef4444; margin-bottom: 15px; font-size: 20px;">
                            API 연결 오류
                        </h3>
                        <p style="color: #666; line-height: 1.8; margin-bottom: 20px;">
                            서버와 연결할 수 없습니다.<br>
                            잠시 후 다시 시도해주세요.
                        </p>
                        <div style="margin-top: 20px;">
                            <button onclick="loadHistory()" class="btn btn-primary" style="padding: 12px 24px;">
                                <i class="fas fa-sync-alt"></i> 다시 시도
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }
    
    showNotification('API 서버에 연결할 수 없습니다', 'error');
}

// 통계 카드 업데이트
function updateStatsCards(dataArray, totalCount) {
    try {
        console.log('📊 통계 카드 업데이트 시작');
        console.log('  - 전체 데이터 수:', totalCount);
        console.log('  - 데이터 배열 길이:', dataArray.length);
        
        const totalCountEl = document.getElementById('totalCount');
        const todayCountEl = document.getElementById('todayCount');
        const weekCountEl = document.getElementById('weekCount');
        
        if (!totalCountEl || !todayCountEl || !weekCountEl) {
            console.error('❌ 통계 카드 요소를 찾을 수 없습니다');
            console.error('  - totalCount:', totalCountEl);
            console.error('  - todayCount:', todayCountEl);
            console.error('  - weekCount:', weekCountEl);
            return;
        }
        
        // 총 발행 건수
        totalCountEl.textContent = totalCount || 0;
        console.log('  ✅ 총 발행 건수:', totalCount);
        
        // 오늘 발행 건수 계산
        const today = new Date().toISOString().split('T')[0];
        const todayCount = dataArray.filter(item => {
            if (!item.created_at) return false;
            const itemDate = new Date(item.created_at).toISOString().split('T')[0];
            return itemDate === today;
        }).length;
        todayCountEl.textContent = todayCount;
        console.log('  ✅ 오늘 발행:', todayCount);
        
        // 이번 주 발행 건수 계산
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // 일요일 시작
        startOfWeek.setHours(0, 0, 0, 0);
        
        const weekCount = dataArray.filter(item => {
            if (!item.created_at) return false;
            const itemDate = new Date(item.created_at);
            return itemDate >= startOfWeek;
        }).length;
        weekCountEl.textContent = weekCount;
        console.log('  ✅ 이번 주 발행:', weekCount);
        
        console.log('✅ 통계 카드 업데이트 완료');
    } catch (error) {
        console.error('❌ 통계 카드 업데이트 오류:', error);
        console.error('  - 에러 상세:', error.message);
        console.error('  - 스택:', error.stack);
    }
}

// 테이블 렌더링
function renderTable(data) {
    const tbody = document.getElementById('historyTableBody');
    
    console.log('📋 renderTable 호출됨');
    console.log('📊 전달받은 데이터:', data);
    console.log('📊 데이터 길이:', data ? data.length : 'null/undefined');
    
    if (!data || data.length === 0) {
        console.warn('⚠️ 데이터가 없습니다');
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <i class="fas fa-inbox" style="font-size: 48px; color: #ccc; margin-bottom: 10px;"></i>
                    <p style="color: #999;">발행 내역이 없습니다.</p>
                    <p style="color: #999; font-size: 12px;">총 ${totalRecords}건의 데이터가 있지만 현재 페이지에는 표시할 데이터가 없습니다.</p>
                    <button onclick="loadHistory(1)" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-sync-alt"></i> 첫 페이지로 이동
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    console.log('✅ 테이블 렌더링 시작:', data.length, '건');
    
    try {
        const pageLimit = document.getElementById('pageLimit');
        if (!pageLimit) {
            console.error('❌ pageLimit 요소를 찾을 수 없습니다');
            return;
        }
        
        const limitValue = parseInt(pageLimit.value) || 10;
        console.log('📊 페이지 크기:', limitValue);
        console.log('📊 현재 페이지:', currentPage);
        
        const rows = data.map((item, index) => {
            const rowNumber = (currentPage - 1) * limitValue + index + 1;
            console.log(`  - 행 ${rowNumber} 생성:`, item.issueNo);
            
            const docTypeLabel = item.documentType === 'insulation' ? '<span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">단열성적서</span>' : '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">품질인정서</span>';
            
            return `
                <tr>
                    <td>${rowNumber}</td>
                    <td>${docTypeLabel}</td>
                    <td>${escapeHtml(item.issueNo || '-')}</td>
                    <td>${escapeHtml(item.companyName || '-')}</td>
                    <td>${escapeHtml(item.issueDate || '-')}</td>
                    <td class="text-truncate" title="${escapeHtml(item.siteName || '-')}">${escapeHtml(item.siteName || '-')}</td>
                    <td>${escapeHtml(item.deliveryDate || '-')}</td>
                    <td>${formatDateTime(item.created_at)}</td>
                    <td class="action-cell">
                        <button class="btn-action btn-view" onclick="viewDetail('${item.id}')" title="상세보기">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-reissue" onclick="reissueRecord('${item.id}')" title="재발행">
                            <i class="fas fa-redo"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteRecord('${item.id}')" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        const html = rows.join('');
        console.log('✅ HTML 생성 완료, 길이:', html.length);
        
        tbody.innerHTML = html;
        console.log('✅ tbody.innerHTML 설정 완료');
        console.log('✅ tbody.children.length:', tbody.children.length);
    } catch (error) {
        console.error('❌ renderTable 오류:', error);
        console.error('오류 스택:', error.stack);
    }
}

// 페이지네이션 렌더링
function renderPagination(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // 이전 버튼
    html += `
        <button class="page-btn" ${page === 1 ? 'disabled' : ''} onclick="loadHistory(${page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // 페이지 번호
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    if (startPage > 1) {
        html += `<button class="page-btn" onclick="loadHistory(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="page-ellipsis">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="page-btn ${i === page ? 'active' : ''}" onclick="loadHistory(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="page-ellipsis">...</span>`;
        }
        html += `<button class="page-btn" onclick="loadHistory(${totalPages})">${totalPages}</button>`;
    }
    
    // 다음 버튼
    html += `
        <button class="page-btn" ${page === totalPages ? 'disabled' : ''} onclick="loadHistory(${page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = html;
}

// 검색
function searchHistory() {
    console.log('🔍 검색 시작');
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value.trim() : '';
    console.log('🔍 검색어:', searchQuery);
    
    currentPage = 1;
    loadHistory(1);
}

// 새로고침
function refreshHistory() {
    document.getElementById('searchInput').value = '';
    currentPage = 1;
    loadHistory(1);
}

// ===== 상세보기/수정 통합 버전 v3.0 (업체/현장 모달 제거) =====
// 상세보기 및 수정
async function viewDetail(id) {
    try {
        console.log('📋 상세보기/수정 모달 열기, ID:', id);
        
        const response = await fetch(`api/certificates.php?id=${id}`);
        if (!response.ok) {
            throw new Error(`조회 실패: ${response.status}`);
        }
        
        const item = await response.json();
        console.log('✓ 데이터 조회 완료:', item);
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <form id="detailEditForm">
                <input type="hidden" id="detailRecordId" value="${id}">
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="detailIssueNo"><i class="fas fa-hashtag"></i> 발급 NO *</label>
                        <input type="text" id="detailIssueNo" class="form-control" required value="${escapeHtml(item.issueNo || '')}">
                    </div>
                    
                    <div class="form-group">
                        <label for="detailIssueDate"><i class="fas fa-calendar"></i> 발급일자 *</label>
                        <input type="date" id="detailIssueDate" class="form-control" required value="${item.issueDate || ''}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="detailCompanyName"><i class="fas fa-building"></i> 업체명 *</label>
                    <input type="text" id="detailCompanyName" class="form-control" required value="${escapeHtml(item.companyName || '')}">
                </div>
                
                <div class="form-group">
                    <label for="detailSiteName"><i class="fas fa-map-marker-alt"></i> 현장명 *</label>
                    <input type="text" id="detailSiteName" class="form-control" required value="${escapeHtml(item.siteName || '')}">
                </div>
                
                <div class="form-group">
                    <label for="detailSiteAddress"><i class="fas fa-map-marked-alt"></i> 현장주소</label>
                    <input type="text" id="detailSiteAddress" class="form-control" value="${escapeHtml(item.siteAddress || '')}">
                </div>
                
                <div class="form-group">
                    <label for="detailDeliveryDate"><i class="fas fa-truck"></i> 납품일자 *</label>
                    <input type="date" id="detailDeliveryDate" class="form-control" required value="${item.deliveryDate || ''}">
                </div>
                
                <div class="form-group">
                    <label for="detailNotes"><i class="fas fa-sticky-note"></i> 특이사항 메모</label>
                    <textarea id="detailNotes" class="form-control" rows="5" placeholder="특이사항이나 메모할 내용을 입력하세요...">${escapeHtml(item.notes || '')}</textarea>
                </div>
                
                <div class="info-section">
                    <div class="info-item">
                        <strong>발급자:</strong> ${escapeHtml(item.issuer || '-')}
                    </div>
                    <div class="info-item">
                        <strong>발급일시:</strong> ${formatDateTime(item.created_at)}
                    </div>
                    ${item.updated_at ? `<div class="info-item"><strong>최종 수정:</strong> ${formatDateTime(item.updated_at)}</div>` : ''}
                </div>
                
                <!-- PDF 문서 미리보기/다운로드 섹션 -->
                ${(item.deliveryPdfData || item.qualityPdfData) ? `
                <div class="pdf-section">
                    <h3><i class="fas fa-file-pdf"></i> 저장된 문서</h3>
                    <div class="pdf-buttons">
                        ${item.deliveryPdfData ? `
                        <div class="pdf-item">
                            <div class="pdf-item-header">
                                <i class="fas fa-truck"></i>
                                <span>납품확인서</span>
                                <span class="pdf-size">(${formatFileSize(item.deliveryPdfData.length)})</span>
                            </div>
                            <div class="pdf-item-actions">
                                <button type="button" class="btn btn-sm btn-info" onclick="previewPDF('${item.id}', 'delivery'); return false;">
                                    <i class="fas fa-eye"></i> 미리보기
                                </button>
                                <button type="button" class="btn btn-sm btn-success" onclick="downloadPDF('${item.id}', 'delivery'); return false;">
                                    <i class="fas fa-download"></i> 다운로드
                                </button>
                            </div>
                        </div>` : ''}
                        ${item.qualityPdfData ? `
                        <div class="pdf-item">
                            <div class="pdf-item-header">
                                <i class="fas fa-clipboard-check"></i>
                                <span>품질관리서</span>
                                <span class="pdf-size">(${formatFileSize(item.qualityPdfData.length)})</span>
                            </div>
                            <div class="pdf-item-actions">
                                <button type="button" class="btn btn-sm btn-info" onclick="previewPDF('${item.id}', 'quality1'); return false;">
                                    <i class="fas fa-eye"></i> 미리보기
                                </button>
                                <button type="button" class="btn btn-sm btn-success" onclick="downloadPDF('${item.id}', 'quality1'); return false;">
                                    <i class="fas fa-download"></i> 다운로드
                                </button>
                            </div>
                        </div>` : ''}
                    </div>
                </div>` : ''}
                
                <!-- PDF 미리보기 컨테이너 -->
                <div id="pdfPreviewContainer" class="pdf-preview-container" style="display: none;">
                    <div class="pdf-preview-header">
                        <h4 id="pdfPreviewTitle">PDF 미리보기</h4>
                        <button type="button" class="btn-close-preview" onclick="closePDFPreview(); return false;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="pdf-preview-content">
                        <iframe id="pdfPreviewIframe" style="width: 100%; height: 600px; border: none;"></iframe>
                    </div>
                </div>
            </form>
        `;
        
        // 모달 footer 버튼 변경
        const modalFooter = document.querySelector('#detailModal .modal-footer');
        modalFooter.innerHTML = `
            <button class="btn btn-secondary" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" onclick="saveDetailEdit()">
                <i class="fas fa-save"></i> 저장
            </button>
        `;
        
        document.getElementById('detailModal').style.display = 'flex';
    } catch (error) {
        console.error('❌ 상세 조회 오류:', error);
        showNotification('상세 정보를 불러오는데 실패했습니다.', 'error');
    }
}

// 상세보기 모달에서 수정 저장
async function saveDetailEdit() {
    const id = document.getElementById('detailRecordId').value;
    
    // 폼 데이터 수집
    const data = {
        issueNo: document.getElementById('detailIssueNo').value.trim(),
        companyName: document.getElementById('detailCompanyName').value.trim(),
        issueDate: document.getElementById('detailIssueDate').value,
        siteName: document.getElementById('detailSiteName').value.trim(),
        siteAddress: document.getElementById('detailSiteAddress')?.value.trim() || '',
        deliveryDate: document.getElementById('detailDeliveryDate').value,
        notes: document.getElementById('detailNotes').value.trim()
    };
    
    // 유효성 검사
    if (!data.issueNo || !data.companyName || !data.siteName || !data.issueDate || !data.deliveryDate) {
        showNotification('필수 항목을 모두 입력해주세요.', 'error');
        return;
    }
    
    try {
        console.log('💾 수정 저장 중, ID:', id, 'Data:', data);
        
        const response = await fetch(`api/certificates.php?id=${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`수정 실패: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✓ 수정 완료:', result);
        
        showNotification('저장되었습니다.', 'success');
        closeModal();
        loadHistory(currentPage);
        
    } catch (error) {
        console.error('❌ 수정 저장 오류:', error);
        showNotification('저장에 실패했습니다.', 'error');
    }
}

// 재발행 기능 - 데이터를 메인 페이지로 가져가기
async function reissueRecord(id) {
    try {
        console.log('🔄 재발행 시작, ID:', id);
        
        // 데이터 가져오기
        const response = await fetch(`api/certificates.php?id=${id}`);
        if (!response.ok) {
            throw new Error(`데이터 조회 실패: ${response.status}`);
        }
        
        const record = await response.json();
        console.log('✓ 재발행 데이터 조회 완료:', record);
        
        // 재발행 데이터를 sessionStorage에 저장
        const reissueData = {
            issueNo: record.issueNo || '',
            companyName: record.companyName || '',
            issueDate: record.issueDate || '',
            siteName: record.siteName || '',
            siteAddress: record.siteAddress || '',
            deliveryDate: record.deliveryDate || ''
        };
        
        sessionStorage.setItem('reissueData', JSON.stringify(reissueData));
        console.log('✓ 재발행 데이터 저장 완료:', reissueData);
        
        // 메인 페이지로 이동
        showNotification('재발행을 위해 메인 페이지로 이동합니다...', 'info');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ 재발행 오류:', error);
        showNotification('재발행에 실패했습니다.', 'error');
    }
}

// 삭제
async function deleteRecord(id) {
    if (!confirm('정말 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await fetch(`api/certificates.php?id=${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`삭제 실패: ${response.status}`);
        }
        
        showNotification('삭제되었습니다.', 'success');
        loadHistory(currentPage);
    } catch (error) {
        console.error('❌ 삭제 오류:', error);
        showNotification('삭제에 실패했습니다.', 'error');
    }
}

// 모달 닫기
function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// 날짜 범위 모달 열기
function showDateRangeModal() {
    // 기본값: 최근 30일
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    document.getElementById('dateRangeModal').style.display = 'flex';
}

// 날짜 범위 모달 닫기
function closeDateRangeModal() {
    document.getElementById('dateRangeModal').style.display = 'none';
}

// 전체 엑셀 다운로드
async function downloadExcelAll() {
    try {
        console.log('📥 전체 엑셀 다운로드 시작');
        showNotification('엑셀 파일을 생성하고 있습니다...', 'info');
        
        // XLSX 라이브러리 확인
        if (typeof XLSX === 'undefined') {
            console.error('❌ XLSX 라이브러리가 로드되지 않았습니다!');
            showNotification('엑셀 라이브러리 로드 오류. 페이지를 새로고침해주세요.', 'error');
            return;
        }
        
        // 전체 데이터 조회 (limit=1000)
        console.log('📡 데이터 조회 중...');
        const response = await fetch('api/certificates.php?page=1&limit=1000&sort=-created_at');
        if (!response.ok) {
            console.error('❌ API 응답 오류:', response.status, response.statusText);
            throw new Error(`조회 실패: ${response.status}`);
        }
        console.log('✅ API 응답 성공');
        
        const result = await response.json();
        console.log('📊 API 응답 데이터:', result);
        
        // API 응답 구조 처리
        let data = [];
        if (Array.isArray(result)) {
            console.log('📋 응답이 배열 형식입니다');
            data = result;
        } else if (result.data) {
            console.log('📋 result.data 구조 사용');
            data = result.data;
        } else if (result.rows) {
            console.log('📋 result.rows 구조 사용');
            data = result.rows;
        } else {
            console.error('❌ 알 수 없는 응답 구조:', result);
            data = [];
        }
        
        console.log('📊 엑셀 데이터 추출 완료:', data.length + '건');
        
        if (data.length === 0) {
            console.warn('⚠️ 다운로드할 데이터가 없습니다');
            showNotification('다운로드할 데이터가 없습니다.', 'warning');
            return;
        }
        
        // 엑셀 데이터 생성
        const excelData = data.map((item, index) => ({
            '번호': index + 1,
            '발급 NO': item.issueNo || '',
            '업체명': item.companyName || '',
            '현장명': item.siteName || '',
            '수량': item.quantity || '',
            '발급일자': item.issueDate || '',
            '납품일자': item.deliveryDate || '',
            '발급자': item.issuer || '',
            '발급일시': formatDateTime(item.created_at)
        }));
        
        // 워크북 생성
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // 컬럼 너비 설정
        ws['!cols'] = [
            { wch: 8 },  // 번호
            { wch: 15 }, // 발급 NO
            { wch: 20 }, // 업체명
            { wch: 40 }, // 현장명
            { wch: 10 }, // 수량
            { wch: 15 }, // 발급일자
            { wch: 15 }, // 납품일자
            { wch: 12 }, // 발급자
            { wch: 20 }  // 발급일시
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, '발행내역');
        
        // 파일명 생성
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const filename = `품질인정서_발행내역_전체_${today}.xlsx`;
        
        // 다운로드
        console.log('💾 엑셀 파일 생성 중:', filename);
        XLSX.writeFile(wb, filename);
        console.log('✅ 엑셀 파일 다운로드 완료!');
        
        showNotification(`엑셀 파일 다운로드 완료! (총 ${data.length}건)`, 'success');
    } catch (error) {
        console.error('❌ 엑셀 다운로드 오류:', error);
        console.error('❌ 오류 상세:', error.message);
        showNotification('엑셀 다운로드에 실패했습니다.', 'error');
    }
}

// 날짜 범위별 엑셀 다운로드
async function downloadExcelByDateRange() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            showNotification('시작일과 종료일을 선택해주세요.', 'warning');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            showNotification('시작일이 종료일보다 늦을 수 없습니다.', 'warning');
            return;
        }
        
        closeDateRangeModal();
        showNotification('엑셀 파일을 생성하고 있습니다...', 'info');
        
        // 전체 데이터 조회 후 필터링
        const response = await fetch('api/certificates.php?page=1&limit=10000&sort=-created_at');
        if (!response.ok) {
            throw new Error(`조회 실패: ${response.status}`);
        }
        
        const result = await response.json();
        
        // 날짜 범위 필터링
        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime() + 86400000; // 종료일 23:59:59까지 포함
        
        const filteredData = (result.data || []).filter(item => {
            const itemTimestamp = new Date(item.created_at).getTime();
            return itemTimestamp >= startTimestamp && itemTimestamp < endTimestamp;
        });
        
        if (filteredData.length === 0) {
            showNotification('선택한 기간에 데이터가 없습니다.', 'warning');
            return;
        }
        
        // 엑셀 데이터 생성
        const excelData = filteredData.map((item, index) => ({
            '번호': index + 1,
            '발급 NO': item.issueNo || '',
            '업체명': item.companyName || '',
            '현장명': item.siteName || '',
            '수량': item.quantity || '',
            '발급일자': item.issueDate || '',
            '납품일자': item.deliveryDate || '',
            '발급자': item.issuer || '',
            '발급일시': formatDateTime(item.created_at)
        }));
        
        // 워크북 생성
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // 컬럼 너비 설정
        ws['!cols'] = [
            { wch: 8 },  // 번호
            { wch: 15 }, // 발급 NO
            { wch: 20 }, // 업체명
            { wch: 40 }, // 현장명
            { wch: 10 }, // 수량
            { wch: 15 }, // 발급일자
            { wch: 15 }, // 납품일자
            { wch: 12 }, // 발급자
            { wch: 20 }  // 발급일시
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, '발행내역');
        
        // 파일명 생성
        const filename = `품질인정서_발행내역_${startDate}_${endDate}.xlsx`;
        
        // 다운로드
        XLSX.writeFile(wb, filename);
        
        showNotification(`엑셀 파일 다운로드 완료! (총 ${filteredData.length}건)`, 'success');
    } catch (error) {
        console.error('❌ 엑셀 다운로드 오류:', error);
        showNotification('엑셀 다운로드에 실패했습니다.', 'error');
    }
}

// 유틸리티 함수
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Base64를 PDF 파일로 다운로드
async function downloadPDF(id, type = 'quality') {
    try {
        const typeNames = {
            quality: '품질인정서',
            delivery: '납품확인서',
            quality1: '품질관리서'
        };
        const typeName = typeNames[type] || '파일';
        
        console.log(`📥 ${typeName} 다운로드 시작, ID:`, id);
        showNotification(`${typeName}를 불러오는 중...`, 'info');
        
        // 레코드 조회
        const response = await fetch(`api/certificates.php?id=${id}`);
        if (!response.ok) {
            throw new Error(`조회 실패: ${response.status}`);
        }
        
        const item = await response.json();
        console.log('✓ 레코드 조회 완료:', item);
        
        // PDF 데이터 확인
        let base64Data, fileName;
        
        if (type === 'quality') {
            base64Data = item.pdfData;
            fileName = item.pdfFileName || `품질인정서_${item.issueNo || 'unknown'}.pdf`;
        } else if (type === 'delivery') {
            base64Data = item.deliveryPdfData;
            fileName = item.deliveryPdfFileName || `납품확인서_${item.issueNo || 'unknown'}.pdf`;
        } else if (type === 'quality1') {
            base64Data = item.qualityPdfData;
            fileName = item.qualityPdfFileName || `품질관리서_${item.issueNo || 'unknown'}.pdf`;
        }
        
        if (!base64Data) {
            showNotification(`저장된 ${typeName} 파일이 없습니다.`, 'error');
            return;
        }
        
        console.log(`📄 ${typeName} 데이터 크기:`, (base64Data.length / 1024).toFixed(2), 'KB (Base64)');
        
        // Base64를 Blob으로 변환
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        
        console.log(`✓ ${typeName} 변환 완료, 크기:`, (blob.size / 1024).toFixed(2), 'KB');
        
        // 다운로드
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`✅ ${typeName} 다운로드 완료:`, fileName);
        showNotification(`${typeName} 다운로드 완료!`, 'success');
        
    } catch (error) {
        console.error('❌ PDF 다운로드 오류:', error);
        showNotification('PDF 다운로드 실패: ' + error.message, 'error');
    }
}

function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Base64 파일 크기를 읽기 쉬운 형식으로 변환
function formatFileSize(base64Length) {
    // Base64는 원본 크기의 약 1.33배
    const bytes = (base64Length * 3) / 4;
    if (bytes < 1024) {
        return bytes.toFixed(0) + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
    } else {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// PDF 미리보기
async function previewPDF(id, type = 'delivery') {
    try {
        const typeNames = {
            delivery: '납품확인서',
            quality1: '품질관리서'
        };
        const typeName = typeNames[type] || '파일';
        
        console.log(`👁️ ${typeName} 미리보기 시작, ID:`, id);
        showNotification(`${typeName} 미리보기를 불러오는 중...`, 'info');
        
        // 레코드 조회
        const response = await fetch(`api/certificates.php?id=${id}`);
        if (!response.ok) {
            throw new Error(`조회 실패: ${response.status}`);
        }
        
        const item = await response.json();
        console.log('✓ 레코드 조회 완료:', item);
        
        // PDF 데이터 확인
        let base64Data;
        
        if (type === 'delivery') {
            base64Data = item.deliveryPdfData;
        } else if (type === 'quality1') {
            base64Data = item.qualityPdfData;
        }
        
        if (!base64Data) {
            showNotification(`저장된 ${typeName} 파일이 없습니다.`, 'error');
            return;
        }
        
        console.log(`📄 ${typeName} 데이터 크기:`, (base64Data.length / 1024).toFixed(2), 'KB (Base64)');
        
        // Base64를 Blob으로 변환
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        
        // Blob URL 생성
        const blobUrl = URL.createObjectURL(blob);
        
        // 미리보기 표시
        const previewContainer = document.getElementById('pdfPreviewContainer');
        const previewTitle = document.getElementById('pdfPreviewTitle');
        const previewIframe = document.getElementById('pdfPreviewIframe');
        
        previewTitle.innerHTML = `<i class="fas fa-file-pdf"></i> ${typeName} 미리보기`;
        previewIframe.src = blobUrl;
        previewContainer.style.display = 'block';
        
        console.log(`✅ ${typeName} 미리보기 표시 완료`);
        showNotification(`${typeName} 미리보기 준비 완료!`, 'success');
        
    } catch (error) {
        console.error('❌ PDF 미리보기 오류:', error);
        showNotification('PDF 미리보기 실패: ' + error.message, 'error');
    }
}

// PDF 미리보기 닫기
function closePDFPreview() {
    const previewContainer = document.getElementById('pdfPreviewContainer');
    const previewIframe = document.getElementById('pdfPreviewIframe');
    
    // iframe URL 정리
    if (previewIframe.src) {
        URL.revokeObjectURL(previewIframe.src);
        previewIframe.src = '';
    }
    
    previewContainer.style.display = 'none';
    console.log('✅ PDF 미리보기 닫힘');
}

function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // 애니메이션
    setTimeout(() => notification.classList.add('show'), 10);
    
    // 자동 제거
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    const detailModal = document.getElementById('detailModal');
    const dateRangeModal = document.getElementById('dateRangeModal');
    
    if (event.target === detailModal) {
        closeModal();
    }
    if (event.target === dateRangeModal) {
        closeDateRangeModal();
    }
};
