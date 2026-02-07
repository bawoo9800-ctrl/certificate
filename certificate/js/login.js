document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    const validUsers = {
        'admin': '1234',
        'user': 'password'
    };
    
    if (validUsers[username] && validUsers[username] === password) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('username', username);
        }
        
        window.location.href = 'index.html';
    } else {
        showNotification('아이디 또는 비밀번호가 올바르지 않습니다.', 'error');
    }
});

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification ' + type + ' show';
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function logout() {
    sessionStorage.clear();
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}
