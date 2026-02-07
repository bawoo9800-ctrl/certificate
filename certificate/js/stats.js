// 전역 변수
let allData = [];
let monthlyChart = null;
let dailyChart = null;
let companyChart = null;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // 사용자 정보 표시
    const username = sessionStorage.getItem('username') || localStorage.getItem('username') || '관리자';
    document.getElementById('usernameDisplay').textContent = username;
    
    // 기간 필터 이벤트
    document.getElementById('periodFilter').addEventListener('change', function() {
        const value = this.value;
        const customStartDate = document.getElementById('customStartDate');
        const customEndDate = document.getElementById('customEndDate');
        const applyBtn = document.getElementById('applyCustomDate');
        
        if (value === 'custom') {
            customStartDate.style.display = 'inline-block';
            customEndDate.style.display = 'inline-block';
            applyBtn.style.display = 'inline-block';
        } else {
            customStartDate.style.display = 'none';
            customEndDate.style.display = 'none';
            applyBtn.style.display = 'none';
            loadStats();
        }
    });
    
    // 통계 로드
    loadStats();
});

// 로그아웃
function logout() {
    sessionStorage.clear();
    localStorage.removeItem('rememberMe');
    window.location.href = 'login.html';
}

// 통계 데이터 로드
async function loadStats() {
    try {
        console.log('📊 통계 데이터 조회 중...');
        
        // 전체 데이터 조회
        const response = await fetch('api/certificates.php?page=1&limit=10000&sort=-created_at');
        if (!response.ok) {
            throw new Error(`조회 실패: ${response.status}`);
        }
        
        const result = await response.json();
        
        // API 응답 구조 확인 및 처리
        if (Array.isArray(result)) {
            allData = result;
        } else if (result.data) {
            allData = result.data;
        } else if (result.rows) {
            allData = result.rows;
        } else {
            console.error('❌ 알 수 없는 응답 구조:', result);
            allData = [];
        }
        
        console.log('✅ 통계 데이터 조회 완료:', allData.length, '건');
        
        // 기간 필터 적용
        const filteredData = filterDataByPeriod(allData);
        
        // 통계 계산
        calculateStats(filteredData);
        
        // 차트 렌더링
        renderMonthlyChart(allData);
        renderDailyChart(allData);
        renderCompanyChart(filteredData);
        renderSiteRanking(filteredData);
        
    } catch (error) {
        console.error('❌ 통계 데이터 조회 오류:', error);
        
        // API 연결 오류 체크
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showEnvironmentError();
        } else {
            showNotification('통계 데이터를 불러오는데 실패했습니다.', 'error');
        }
    }
}

// 환경 오류 메시지 표시
function showEnvironmentError() {
    const currentUrl = window.location.origin;
    const isLocal = currentUrl.includes('127.0.0.1') || currentUrl.includes('localhost');
    
    const container = document.querySelector('.history-wrapper');
    
    if (isLocal) {
        container.innerHTML = `
            <div style="text-align: center; padding: 80px 40px;">
                <div style="max-width: 700px; margin: 0 auto;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 80px; color: #f59e0b; margin-bottom: 30px;"></i>
                    <h2 style="color: #ef4444; margin-bottom: 20px; font-size: 28px;">
                        ⚠️ 로컬 환경에서는 통계 기능을 사용할 수 없습니다
                    </h2>
                    <p style="color: #666; line-height: 2; font-size: 16px; margin-bottom: 30px;">
                        이 시스템은 <strong style="color: #2563eb;">GenSpark 클라우드 환경</strong>에서 실행되어야 
                        통계 대시보드 및 발행내역 기능을 사용할 수 있습니다.<br>
                        로컬 환경에서는 품질인정서 작성 및 PDF 다운로드 기능만 사용 가능합니다.
                    </p>
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
                                border: 2px solid #f59e0b; border-radius: 12px; 
                                padding: 30px; margin: 30px 0; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <strong style="color: #92400e; display: block; margin-bottom: 15px; font-size: 18px;">
                            💡 해결 방법:
                        </strong>
                        <ol style="color: #78350f; margin: 15px 0; padding-left: 25px; line-height: 2; font-size: 15px;">
                            <li style="margin-bottom: 10px;">
                                <strong>GenSpark 프로젝트</strong>로 이동하여 배포
                            </li>
                            <li style="margin-bottom: 10px;">
                                배포된 URL로 접속: 
                                <code style="background: #fbbf24; padding: 4px 8px; border-radius: 4px; font-family: monospace;">
                                    https://xxxxx.genspark.ai/
                                </code>
                            </li>
                            <li>
                                자세한 내용은 
                                <code style="background: #fbbf24; padding: 4px 8px; border-radius: 4px; font-family: monospace;">
                                    TROUBLESHOOTING_API.md
                                </code> 파일 참조
                            </li>
                        </ol>
                    </div>
                    <div style="margin-top: 30px;">
                        <a href="index.html" class="btn btn-primary" 
                           style="display: inline-block; padding: 15px 30px; text-decoration: none; 
                                  border-radius: 8px; font-size: 16px; background: #3b82f6; color: white;">
                            <i class="fas fa-arrow-left"></i> 품질인정서 작성 화면으로 돌아가기
                        </a>
                    </div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="text-align: center; padding: 80px 40px;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <i class="fas fa-exclamation-circle" style="font-size: 80px; color: #ef4444; margin-bottom: 30px;"></i>
                    <h2 style="color: #ef4444; margin-bottom: 20px; font-size: 28px;">
                        API 연결 오류
                    </h2>
                    <p style="color: #666; line-height: 2; font-size: 16px; margin-bottom: 30px;">
                        서버와 연결할 수 없습니다.<br>
                        잠시 후 다시 시도해주세요.
                    </p>
                    <div style="margin-top: 30px;">
                        <button onclick="window.location.reload()" class="btn btn-primary" 
                                style="padding: 15px 30px; font-size: 16px;">
                            <i class="fas fa-sync-alt"></i> 다시 시도
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    showNotification('API 서버에 연결할 수 없습니다', 'error');
}

// 기간별 데이터 필터링
function filterDataByPeriod(data) {
    const period = document.getElementById('periodFilter').value;
    const now = new Date();
    
    if (period === 'all') {
        return data;
    }
    
    let startDate;
    
    switch(period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'custom':
            const customStart = document.getElementById('customStartDate').value;
            const customEnd = document.getElementById('customEndDate').value;
            if (!customStart || !customEnd) {
                return data;
            }
            startDate = new Date(customStart);
            const endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
            return data.filter(item => {
                const itemDate = new Date(item.created_at);
                return itemDate >= startDate && itemDate <= endDate;
            });
    }
    
    return data.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= startDate;
    });
}

// 통계 계산
function calculateStats(data) {
    // 총 발행 건수
    document.getElementById('statTotalCount').textContent = data.length;
    
    // 업체 수
    const companies = new Set(data.map(item => item.companyName).filter(Boolean));
    document.getElementById('statCompanyCount').textContent = companies.size;
    
    // 현장 수
    const sites = new Set(data.map(item => item.siteName).filter(Boolean));
    document.getElementById('statSiteCount').textContent = sites.size;
}

// 월별 발행 추이 차트
function renderMonthlyChart(data) {
    const ctx = document.getElementById('monthlyChart');
    
    // 최근 12개월 데이터
    const months = [];
    const counts = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        months.push(`${year}.${String(month).padStart(2, '0')}`);
        
        const count = data.filter(item => {
            const itemDate = new Date(item.created_at);
            return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        }).length;
        
        counts.push(count);
    }
    
    // 기존 차트 삭제
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    // 차트 생성
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: '발행 건수',
                data: counts,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '건';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 일별 발행 추이 차트 (최근 30일)
function renderDailyChart(data) {
    const ctx = document.getElementById('dailyChart');
    
    // 최근 30일 데이터
    const days = [];
    const counts = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        days.push(`${date.getMonth() + 1}/${date.getDate()}`);
        
        const count = data.filter(item => {
            const itemDateStr = new Date(item.created_at).toISOString().split('T')[0];
            return itemDateStr === dateStr;
        }).length;
        
        counts.push(count);
    }
    
    // 기존 차트 삭제
    if (dailyChart) {
        dailyChart.destroy();
    }
    
    // 차트 생성
    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: '발행 건수',
                data: counts,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: '#3b82f6',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '건';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 업체별 발행 건수 차트
function renderCompanyChart(data) {
    const ctx = document.getElementById('companyChart');
    
    // 업체별 집계
    const companyMap = {};
    data.forEach(item => {
        if (item.companyName) {
            companyMap[item.companyName] = (companyMap[item.companyName] || 0) + 1;
        }
    });
    
    // TOP 10 정렬
    const sortedCompanies = Object.entries(companyMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const labels = sortedCompanies.map(item => item[0]);
    const counts = sortedCompanies.map(item => item[1]);
    
    // 기존 차트 삭제
    if (companyChart) {
        companyChart.destroy();
    }
    
    // 차트 생성
    companyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: [
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899',
                    '#f59e0b',
                    '#10b981',
                    '#06b6d4',
                    '#6366f1',
                    '#f97316',
                    '#14b8a6',
                    '#84cc16'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value}건 (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 현장별 발행 건수 랭킹
function renderSiteRanking(data) {
    // 현장별 집계
    const siteMap = {};
    data.forEach(item => {
        if (item.siteName) {
            siteMap[item.siteName] = (siteMap[item.siteName] || 0) + 1;
        }
    });
    
    // TOP 10 정렬
    const sortedSites = Object.entries(siteMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const listElement = document.getElementById('siteRankingList');
    
    if (sortedSites.length === 0) {
        listElement.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>데이터가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    listElement.innerHTML = sortedSites.map((item, index) => `
        <div class="site-item">
            <span style="font-weight: 600; color: #666; margin-right: 10px; min-width: 30px;">
                ${index + 1}.
            </span>
            <span class="site-name" title="${escapeHtml(item[0])}">${escapeHtml(item[0])}</span>
            <span class="site-count">${item[1]}건</span>
        </div>
    `).join('');
}

// 새로고침
function refreshStats() {
    document.getElementById('periodFilter').value = 'month';
    document.getElementById('customStartDate').style.display = 'none';
    document.getElementById('customEndDate').style.display = 'none';
    document.getElementById('applyCustomDate').style.display = 'none';
    loadStats();
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
