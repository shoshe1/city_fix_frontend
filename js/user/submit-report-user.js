// Enhance SubmitReport page: attach user info to report and show user image in header

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Check authentication first
        const userId = localStorage.getItem('user_id');
        const userToken = localStorage.getItem('user_token');
        
        if (!userId || !userToken) {
            console.log('❌ No valid session for submit report - redirecting to index.html');
            window.location.replace('index.html');
            return;
        }
        
        // 1. Show user image in header
        const userData = localStorage.getItem('cityfix_user');
        let userImgUrl = 'assets/profile.svg';
        if (userId) {
            fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/image`)
                .then(res => res.ok ? res.blob() : null)
                .then(blob => {
                    if (blob) {
                        userImgUrl = URL.createObjectURL(blob);
                        const imgEl = document.querySelector('.profile-icon img');
                        if (imgEl) imgEl.src = userImgUrl;
                    }
                })
                .catch(err => {
                    console.log('Could not load user image:', err);
                });
        }

        // 2. Attach user info to report submission
        const form = document.getElementById('reportForm');
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            // Double-check authentication before submitting
            const currentUserId = localStorage.getItem('user_id');
            const currentUserToken = localStorage.getItem('user_token');
            
            if (!currentUserId || !currentUserToken) {
                e.preventDefault();
                alert('Session expired. Please log in again.');
                window.location.replace('index.html');
                return false;
            }
            
            // Find user info
            let user_id = currentUserId;
            let user_name = '';
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    user_name = parsed.username || parsed.name || '';
                } catch {}
            }
            
            // Attach to form as hidden fields (if not already present)
            let userIdInput = form.querySelector('input[name="user"]');
            if (!userIdInput) {
                userIdInput = document.createElement('input');
                userIdInput.type = 'hidden';
                userIdInput.name = 'user';
                form.appendChild(userIdInput);
            }
            userIdInput.value = user_id || '';

            let userNameInput = form.querySelector('input[name="user_name"]');
            if (!userNameInput) {
                userNameInput = document.createElement('input');
                userNameInput.type = 'hidden';
                userNameInput.name = 'user_name';
                form.appendChild(userNameInput);
            }
            userNameInput.value = user_name;
        });
    });
})();
