// JavaScript for handling login and signup form submissions

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the signup page
    const signupForm = document.querySelector('.signup-form-container');
    if (signupForm) {
        setupSignupForm();
    }

    // Check if we're on the login page
    const loginForm = document.querySelector('.login-form-container');
    if (loginForm) {
        setupLoginForm();
    }
    
    // Ensure cityfix_user._id is always set using the profile API if needed
    const cityfixUserStr = localStorage.getItem('cityfix_user');
    let cityfixUser = null;
    try {
        cityfixUser = cityfixUserStr ? JSON.parse(cityfixUserStr) : null;
    } catch (e) {}

    // If _id is missing or invalid but userId is present, fetch from profile API
    if (cityfixUser && (!cityfixUser._id || !/^[a-f\d]{24}$/i.test(cityfixUser._id)) && cityfixUser.userId && cityfixUser.userId !== 'unknown') {
        fetch(`https://city-fix-backend.onrender.com/api/users/profile/${cityfixUser.userId}`)
            .then(res => res.json())
            .then(profileData => {
                if (profileData && profileData.user && profileData.user._id) {
                    cityfixUser._id = profileData.user._id;
                    localStorage.setItem('cityfix_user', JSON.stringify(cityfixUser));
                }
                updateUIForAuthState();
            })
            .catch(() => {
                updateUIForAuthState();
            });
    } else {
        updateUIForAuthState();
    }
});

function setupSignupForm() {
    const signupBtn = document.querySelector('.signup-btn');
    
    signupBtn.addEventListener('click', function(event) {
        event.preventDefault();
        
        // Get form values
        const username = document.querySelector('input[name="username"]').value;
        const userEmail = document.querySelector('input[name="user_email"]').value;
        const password = document.querySelector('input[name="password"]').value;
        const userId = document.querySelector('input[name="user_id"]').value;
        const userType = document.querySelector('input[name="userType"]:checked').value;
        const photoInput = document.querySelector('input[name="user_photo"]');
        
        // Basic validation
        if (!username || !userEmail || !password || !userId) {
            showError("Please fill in all required fields");
            return;
        }
        
        // Add minimum length validations to prevent backend errors
        if (username.trim().length < 3) {
            showError("Username must be at least 3 characters long");
            return;
        }
        
        if (password.length < 4) {
            showError("Password must be at least 4 characters long");
            return;
        }
        
        // User ID validation - ensure it's a number
        if (isNaN(userId) || userId.trim() === '') {
            showError("Please enter a valid user ID (numbers only)");
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            showError("Please enter a valid email address");
            return;
        }
        
        // Prepare form data for file upload
        const formData = new FormData();
        formData.append('username', username);
        formData.append('user_email', userEmail);
        formData.append('password', password);
        formData.append('user_id', userId);
        formData.append('user_type', userType);
        
        // Add photo if one was selected
        if (photoInput.files.length > 0) {
            formData.append('user_photo', photoInput.files[0]);
            console.log('� Profile photo selected:', photoInput.files[0].name, photoInput.files[0].size, 'bytes');
        } else {
            console.log('📷 No profile photo selected - user will have default image');
        }
        
        // Debug: Log the form data being sent
        console.log('📤 Form data being sent:');
        console.log('- Username:', username);
        console.log('- Email:', userEmail);
        console.log('- Password length:', password.length);
        console.log('- User type:', userType);
        console.log('- Has photo:', photoInput.files.length > 0);
        
        // Debug: Log all form data entries
        console.log('📋 FormData entries:');
        for (let [key, value] of formData.entries()) {
            if (key === 'user_photo') {
                console.log(`- ${key}:`, value.name, value.size, 'bytes');
            } else {
                console.log(`- ${key}:`, value);
            }
        }
        
        // Show loading state
        signupBtn.disabled = true;
        signupBtn.querySelector('.signup-btn-text').textContent = 'Signing Up...';
        
        // Test basic server connectivity first
        console.log('🔌 Testing basic server connectivity...');
        fetch('https://city-fix-backend.onrender.com/', { method: 'GET' })
            .then(response => {
                console.log('🔌 Server root response:', response.status);
                return response.text();
            })
            .then(text => {
                console.log('🔌 Server root content:', text.substring(0, 100));
            })
            .catch(error => {
                console.log('🔌 Server root test failed:', error.message);
            });

        // Test if login endpoint works (just to see if server responds to different endpoints)
        console.log('🔌 Testing login endpoint...');
        fetch('https://city-fix-backend.onrender.com/api/users/login', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'test' })
        })
            .then(response => {
                console.log('🔌 Login endpoint response:', response.status);
            })
            .catch(error => {
                console.log('🔌 Login endpoint test failed:', error.message);
            });
        
        // Send registration request
        console.log('🔄 Sending registration request to backend...');
        fetch('https://city-fix-backend.onrender.com/api/users/register', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', response.headers);
            
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('❌ Raw server response:', text);
                    
                    // Try to parse as JSON, fallback to text
                    try {
                        const data = JSON.parse(text);
                        console.error('❌ Registration failed with parsed data:', data);
                        
                        // Extract specific error message from backend
                        let errorMessage = data.message || `Server error: ${response.status}`;
                        
                        // Check for specific validation errors
                        if (data.errors) {
                            errorMessage = Object.values(data.errors).join(', ');
                        } else if (data.error) {
                            errorMessage = data.error;
                        }
                        
                        throw new Error(errorMessage);
                    } catch (parseError) {
                        console.error('❌ Could not parse server response as JSON:', parseError);
                        throw new Error(`Server error ${response.status}: ${text || 'Unknown error'}`);
                    }
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('✅ Registration successful:', data);
            
            // Store user info in localStorage
            const mongoId = data.user._id;
            const numericUserId = data.user.user_id;
            const userType = (data.user.user_type || '').toLowerCase().trim();
            
            console.log('📋 Storing user data:');
            console.log('- MongoDB _id:', mongoId);
            console.log('- Numeric user_id:', numericUserId);
            console.log('- User type:', userType);
            
            // Store complete user session data
            const userSessionData = {
                _id: mongoId,        // MongoDB ObjectId for API calls
                userId: numericUserId, // Numeric ID for legacy compatibility
                user_id: numericUserId, // Also store as user_id for compatibility
                username: data.user.username,
                user_email: data.user.user_email,
                user_type: data.user.user_type,
                token: data.token,
                isLoggedIn: true,
                registrationTime: new Date().toISOString()
            };
            
            localStorage.setItem('cityfix_user', JSON.stringify(userSessionData));
            
            // Store individual values for compatibility
            localStorage.setItem('user_token', data.token);
            localStorage.setItem('user_name', data.user.username);
            localStorage.setItem('user_email', data.user.user_email);
            localStorage.setItem('user_type', data.user.user_type);
            
            // IMPORTANT: Store the numeric user_id for profile images (backend accepts numeric IDs)
            localStorage.setItem('user_id', numericUserId);
            
            console.log('✅ User session stored with numeric user_id for profile images');
            
            // Show success message
            showSuccess('Registration successful! Redirecting...');
            
            // Redirect to index.html after successful signup
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        })
        .catch(error => {
            console.error('💥 Error during registration:', error);
            
            // Show more specific error messages
            if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
                showError("Cannot connect to server. Please check if the backend is running on port 5000.");
            } else if (error.message.includes('500')) {
                showError("Server error occurred. This might be due to: duplicate email/username, database connection issue, or server configuration problem. Please check the backend logs and try again.");
            } else if (error.message.includes('email')) {
                showError("Email is already registered. Please use a different email.");
            } else if (error.message.includes('username')) {
                showError("Username is already taken. Please choose a different username.");
            } else if (error.message.includes('validation')) {
                showError("Please check your input data. Make sure all fields are filled correctly.");
            } else {
                showError(`Registration failed: ${error.message}. Please check your input and try again.`);
            }
        })
        .finally(() => {
            // Restore button state
            signupBtn.disabled = false;
            signupBtn.querySelector('.signup-btn-text').textContent = 'Sign Up';
        });
    });
}

function setupLoginForm() {
    // We have two login buttons, one for admin and one for user
    const adminLoginBtn = document.querySelector('.admin-login-btn');
    const userLoginBtn = document.querySelector('.user-login-btn');
    
    // Common login logic function
    function handleLogin(userType) {
        // Get form values
        const email = document.querySelector('.email-input').value;
        const password = document.querySelector('.password-input').value;
        
        // Basic validation
        if (!email || !password) {
            showError("Please enter both email and password");
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError("Please enter a valid email address");
            return;
        }
        
        // Show loading state on the button that was clicked
        const btnText = userType === 'admin' ? 
            adminLoginBtn.querySelector('.admin-btn-text') : 
            userLoginBtn.querySelector('.user-btn-text');
        const originalText = btnText.textContent;
        
        adminLoginBtn.disabled = true;
        userLoginBtn.disabled = true;
        btnText.textContent = 'Logging In...';
        
        // Send login request to backend API
        fetch('https://city-fix-backend.onrender.com/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_email: email,
                password: password,
                user_type: userType
            }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Invalid credentials');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('🔐 Login successful:', data);
            handleLoginSuccess(data, userType, email);
        })
        .catch(error => {
            console.error('🔐 Login error:', error);
            showError(error.message || "Login failed. Please check your credentials and try again.");
        })
        .finally(() => {
            // Restore button states
            adminLoginBtn.disabled = false;
            userLoginBtn.disabled = false;
            btnText.textContent = originalText;
        });
    }
    
    // Handle successful login with real API response
    function handleLoginSuccess(data, userType, email) {
        console.log('🔐 Processing login response:', data);
        
        // Extract user data from API response structure
        const apiUser = data.user;
        const jwtToken = data.token;
        const userTypeFromAPI = apiUser.user_type.toLowerCase().trim();
        
        console.log('🔐 User data received:', {
            user_id: apiUser.user_id,
            username: apiUser.username,
            email: apiUser.user_email,
            type: apiUser.user_type,
            hasToken: !!jwtToken
        });
        
        // Validate that the user type matches the login button clicked
        if (userTypeFromAPI !== userType.toLowerCase()) {
            showError(`Authentication failed. This account is registered as "${apiUser.user_type}". Please use the correct login button.`);
            return;
        }
        
        // Fetch MongoDB ObjectId from profile API
        console.log('🔍 Fetching MongoDB ObjectId from profile API...');
        fetch(`https://city-fix-backend.onrender.com/api/users/profile/${apiUser.user_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(profileData => {
            console.log('📋 Profile data received:', profileData);
            
            // Store complete user session data with MongoDB ObjectId
            const userSessionData = {
                _id: profileData.user?._id || 'unknown', // MongoDB ObjectId
                user_id: apiUser.user_id, // Numeric ID
                userId: apiUser.user_id, // Alternative key for compatibility
                username: apiUser.username,
                user_email: apiUser.user_email,
                user_type: apiUser.user_type,
                token: jwtToken,
                isLoggedIn: true,
                loginTime: new Date().toISOString()
            };
            
            // Store in localStorage for session management
            // IMPORTANT: Store numeric user_id for profile image compatibility  
            localStorage.setItem('user_id', apiUser.user_id);
            localStorage.setItem('user_token', jwtToken);
            localStorage.setItem('user_name', apiUser.username);
            localStorage.setItem('user_email', apiUser.user_email);
            localStorage.setItem('user_type', apiUser.user_type);
            localStorage.setItem('cityfix_user', JSON.stringify(userSessionData));
            
            console.log('✅ User session stored successfully with MongoDB ObjectId:', profileData.user?._id);
            
            // Redirect based on user type
            if (userTypeFromAPI === 'admin') {
                // Store admin-specific data
                const adminData = {
                    _id: profileData.user?._id,
                    userId: apiUser.user_id,
                    username: apiUser.username,
                    email: apiUser.user_email,
                    token: jwtToken
                };
                localStorage.setItem('cityfix_admin', JSON.stringify(adminData));
                
                console.log('🔐 Admin login - redirecting to dashboard.html');
                window.location.href = 'dashboard.html';
            } else {
                // Citizen/user login
                console.log('🔐 Citizen login - redirecting to citizenhompage.html');
                window.location.href = 'citizenhompage.html';
            }
        })
        .catch(error => {
            console.error('⚠️ Could not fetch MongoDB ObjectId:', error);
            showError('Login successful, but could not retrieve complete user data. Please try refreshing the page.');
            
            // Store basic user data without MongoDB ObjectId as fallback
            const basicUserSessionData = {
                _id: 'unknown',
                user_id: apiUser.user_id,
                userId: apiUser.user_id,
                username: apiUser.username,
                user_email: apiUser.user_email,
                user_type: apiUser.user_type,
                token: jwtToken,
                isLoggedIn: true,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('user_id', apiUser.user_id.toString());
            localStorage.setItem('user_token', jwtToken);
            localStorage.setItem('user_name', apiUser.username);
            localStorage.setItem('user_email', apiUser.user_email);
            localStorage.setItem('user_type', apiUser.user_type);
            localStorage.setItem('cityfix_user', JSON.stringify(basicUserSessionData));
        });
    }
    
    // Add event listeners to buttons
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(event) {
            event.preventDefault();
            handleLogin('admin');
        });
    }
    
    if (userLoginBtn) {
        userLoginBtn.addEventListener('click', function(event) {
            event.preventDefault();
            handleLogin('citizen');
        });
    }
}

function showError(message) {
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = '#e53e3e';
    errorElement.style.backgroundColor = '#fed7d7';
    errorElement.style.padding = '10px';
    errorElement.style.borderRadius = '8px';
    errorElement.style.marginBottom = '16px';
    errorElement.style.textAlign = 'center';
    errorElement.textContent = message;
    
    // Find where to insert the error
    const formContainer = document.querySelector('.signup-form-container') || 
                          document.querySelector('.login-form-container');
    
    // Insert at the top of the form container
    if (formContainer) {
        // Remove any existing error messages
        const existingError = formContainer.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        formContainer.insertBefore(errorElement, formContainer.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    } else {
        // Fallback if no form container found
        alert(message);
    }
}

function showSuccess(message) {
    // Create success message element
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.style.color = '#38a169';
    successElement.style.backgroundColor = '#c6f6d5';
    successElement.style.padding = '10px';
    successElement.style.borderRadius = '8px';
    successElement.style.marginBottom = '16px';
    successElement.style.textAlign = 'center';
    successElement.style.fontWeight = '500';
    successElement.textContent = message;
    
    // Find where to insert the success message
    const formContainer = document.querySelector('.signup-form-container') || 
                          document.querySelector('.login-form-container');
    
    // Insert at the top of the form container
    if (formContainer) {
        // Remove any existing messages
        const existingError = formContainer.querySelector('.error-message');
        const existingSuccess = formContainer.querySelector('.success-message');
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();
        
        formContainer.insertBefore(successElement, formContainer.firstChild);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            successElement.remove();
        }, 3000);
    } else {
        // Fallback if no form container found
        alert(message);
    }
}

// Function to check if user is logged in
function isUserLoggedIn() {
    const userData = localStorage.getItem('cityfix_user');
    if (!userData) return false;
    
    try {
        const user = JSON.parse(userData);
        return user.isLoggedIn === true && user.token;
    } catch (e) {
        return false;
    }
}

// Function to log out user
function logoutUser() {
    localStorage.removeItem('cityfix_user');
    window.location.href = 'login.html';
}

// Update UI based on login state
function updateUIForAuthState() {
    const isLoggedIn = isUserLoggedIn();
    
    // Get elements that change based on auth state
    const loginLinks = document.querySelectorAll('.login');
    const signupButtons = document.querySelectorAll('.signup');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (isLoggedIn) {
        // Get user data
        const userData = JSON.parse(localStorage.getItem('cityfix_user'));
        
        // User is logged in, update UI
        loginLinks.forEach(link => {
            link.textContent = 'Logout';
            link.href = '#';
            link.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        });
        
        signupButtons.forEach(button => {
            button.style.display = 'none';
        });
        
        // Add user info display
        if (authButtons) {
            // Clear existing content
            authButtons.innerHTML = '';
            
            // Create user profile element
            const userProfile = document.createElement('div');
            userProfile.className = 'user-profile';
            userProfile.innerHTML = `
                <span class="welcome-user">Welcome, ${userData.username || userData.email || 'User'}</span>
                <button class="logout-btn">Logout</button>
            `;
            
            authButtons.appendChild(userProfile);
            
            // Add event listener to logout button
            const logoutBtn = userProfile.querySelector('.logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logoutUser);
            }
        }
    } else {
        // User is not logged in, ensure normal login/signup display
        loginLinks.forEach(link => {
            link.textContent = 'Login';
            link.href = 'login.html';
        });
        
        signupButtons.forEach(button => {
            button.style.display = 'block';
        });
        
        // Restore original auth buttons if needed
        if (authButtons && !authButtons.querySelector('a.login')) {
            authButtons.innerHTML = `
                <a href="login.html" class="login">Login</a>
                <button class="signup">Sign Up</button>
            `;
            
            // Add click event for new signup button
            const newSignupBtn = authButtons.querySelector('button.signup');
            if (newSignupBtn) {
                newSignupBtn.addEventListener('click', function() {
                    window.location.href = 'signup.html';
                });
            }
        }
    }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', function() {
    updateUIForAuthState();
});
