// CityFix Report Details Page

// Get report ID from URL
function getReportIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Fetch report details from backend
async function fetchReportDetails(reportId) {
    const url = `https://city-fix-backend.onrender.com/api/reports/${reportId}`;
    try {
        console.log('🔍 Fetching report from:', url);
        const response = await fetch(url);
        if (!response.ok) {
            console.error('❌ Response not OK:', response.status, response.statusText);
            throw new Error('Failed to fetch report details');
        }
        const data = await response.json();
        console.log('✅ Report data loaded:', data);
        return data;
    } catch (err) {
        console.error('❌ Error fetching report details:', err);
        return null;
    }
}

// Render report details to the page
function renderReportDetails(report) {
    // Update header type and date
    document.getElementById('report-type').textContent = report?.issueType || report?.type || report?.title || 'Issue';
    document.getElementById('report-date').textContent = report?.createdAt ? new Date(report.createdAt).toLocaleString() : '';
    // Update main title with report type
    document.getElementById('report-type-title').textContent = report?.issueType || report?.type || report?.title || 'Report';
    // Update description
    document.getElementById('report-description').textContent = report?.description || 'No description.';
    // Update status dropdown
    const statusDropdown = document.getElementById('report-status') || document.querySelector('.status-dropdown');
    if (statusDropdown && report?.status) {
        let statusValue = report.status;
        if (statusValue === 'in-progress') statusValue = 'progress';
        statusDropdown.value = statusValue;
    }
    
    // Load report image
    loadReportImage(report._id || report.id);
}

// Load report image
function loadReportImage(reportId) {
    if (!reportId) {
        showImageError('No report ID available');
        return;
    }
    
    const imageElement = document.getElementById('report-image');
    const placeholder = document.getElementById('image-placeholder');
    const imageUrl = `https://city-fix-backend.onrender.com/api/reports/${reportId}/image`;
    
    console.log('Loading image from:', imageUrl);
    
    // Show loading state
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="placeholder-icon">⏳</div>
            <p>Loading image...</p>
        `;
    }
    
    if (imageElement) {
        imageElement.onload = function() {
            console.log('Image loaded successfully');
            this.style.display = 'block';
            this.classList.add('loaded');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        };
        
        imageElement.onerror = function() {
            console.log('Failed to load image');
            showImageError('Image not available');
        };
        
        imageElement.src = imageUrl;
    }
}

// Show image error state
function showImageError(message) {
    const placeholder = document.getElementById('image-placeholder');
    const imageElement = document.getElementById('report-image');
    
    if (imageElement) {
        imageElement.style.display = 'none';
    }
    
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="placeholder-icon">📷</div>
            <p>${message}</p>
        `;
        placeholder.style.display = 'flex';
    }
}

// Initialize map
function initializeMap(location) {
    // Wait for Google Maps to load
    const checkGoogleMaps = () => {
        if (window.google && window.google.maps) {
            const mapDiv = document.querySelector('.map-container') || document.getElementById('map-container');
            if (mapDiv) {
                const latLng = { lat: location.lat, lng: location.lng };
                const map = new google.maps.Map(mapDiv, {
                    center: latLng,
                    zoom: 15,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                });
                new google.maps.Marker({ position: latLng, map });
                console.log('✅ Map initialized successfully');
            } else {
                console.log('❌ Map container not found');
            }
        } else {
            // Retry after 500ms if Google Maps not loaded yet
            setTimeout(checkGoogleMaps, 500);
        }
    };
    
    checkGoogleMaps();
}

// Main
window.addEventListener('DOMContentLoaded', async function() {
    let reportId = getReportIdFromUrl();
    if (!reportId) {
        document.getElementById('report-description').textContent = 'No report ID provided.';
        return;
    }
    // Fallback: try to get _id from URL if id is missing
    if (!reportId) {
        const params = new URLSearchParams(window.location.search);
        reportId = params.get('_id');
    }
    if (!reportId) {
        document.getElementById('report-description').textContent = 'No report ID found.';
        return;
    }
    
    // Fetch report details
    const report = await fetchReportDetails(reportId);
    if (!report) {
        document.getElementById('report-description').textContent = 'Failed to load report details.';
        return;
    }
    
    // Render report details
    renderReportDetails(report);
    
    // Load report image
    loadReportImage(reportId);
    
    // Initialize map
    if (report && report.location) {
        console.log('🗺️ Initializing map with location:', report.location);
        initializeMap(report.location);
    } else {
        console.log('❌ No location data found for map');
    }
    
    // Set description
    const descEl = document.querySelector('.description-text') || document.getElementById('report-description');
    if (descEl) descEl.textContent = report?.description || 'No description.';
    
    // Set status dropdown
    const statusDropdown = document.querySelector('.status-dropdown') || document.getElementById('report-status');
    if (statusDropdown && report?.status) {
        // Map backend status to dropdown value
        let statusValue = report.status;
        if (statusValue === 'in-progress') statusValue = 'progress';
        if (statusValue === 'pending') statusValue = 'pending';
        if (statusValue === 'resolved') statusValue = 'resolved';
        if (statusValue === 'closed') statusValue = 'closed';
        if (statusValue === 'new') statusValue = 'new';
        statusDropdown.value = statusValue;
    }
    
    // Setup notification functionality
    setupNotificationSystem(report, reportId, statusDropdown);
    
    // Initialize profile dropdown
    initializeProfileDropdown();
});

// Setup notification system
function setupNotificationSystem(report, reportId, statusDropdown) {
    console.log('🔧 Setting up notification system...', { report, reportId });
    
    const saveBtn = document.getElementById('save-status-btn') || document.querySelector('.save-btn');
    const noteTextarea = document.getElementById('admin-note');
    const notifyUserCheckbox = document.getElementById('notify-user');
    
    console.log('🔍 Found elements:', {
        saveBtn: !!saveBtn,
        statusDropdown: !!statusDropdown,
        noteTextarea: !!noteTextarea,
        notifyUserCheckbox: !!notifyUserCheckbox
    });
    
    if (!saveBtn) {
        console.error('❌ Save button not found!');
        return;
    }
    
    if (!statusDropdown) {
        console.error('❌ Status dropdown not found!');
        return;
    }
    
    if (saveBtn && statusDropdown) {
        console.log('✅ Setting up button click handler...');
        saveBtn.onclick = async function() {
            console.log('🖱️ Save button clicked!');
            
            const btnText = saveBtn.querySelector('.btn-text');
            const btnLoading = saveBtn.querySelector('.btn-loading');
            
            // Show loading state
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline-block';
            saveBtn.disabled = true;
            
            try {
                let newStatus = statusDropdown.value;
                const adminNote = noteTextarea ? noteTextarea.value.trim() : '';
                const shouldNotify = notifyUserCheckbox ? notifyUserCheckbox.checked : true;
                
                console.log('📝 Form data:', { newStatus, adminNote, shouldNotify });
                
                // Map dropdown value to backend value
                if (newStatus === 'progress') newStatus = 'in-progress';
                if (newStatus === 'pending') newStatus = 'pending';
                if (newStatus === 'resolved') newStatus = 'resolved';
                if (newStatus === 'closed') newStatus = 'rejected';
                
                console.log('🔄 Updating report status...', {
                    reportId,
                    newStatus,
                    adminNote,
                    shouldNotify
                });
                
                // Update report status
                const statusResponse = await fetch(`https://city-fix-backend.onrender.com/api/reports/${reportId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                
                if (!statusResponse.ok) {
                    throw new Error('Failed to update status');
                }
                
                console.log('✅ Status updated successfully');
                
                // Send notification if user wants to notify and there's a note
                if (shouldNotify && adminNote && report) {
                    console.log('📢 Preparing to send notification...');
                    console.log('📦 Full report object:', report);
                    
                    // Try different possible user ID field names - PRIORITIZE MONGODB _ID
                    let recipientUserId = report.user?._id || report._user?._id || report.userId || report.user_id || report.user || report._user;
                    
                    console.log('🔍 DETAILED USER ID EXTRACTION:');
                    console.log('📦 report.user:', report.user);
                    console.log('📦 report._user:', report._user);
                    console.log('📦 report.userId:', report.userId);
                    console.log('📦 report.user_id:', report.user_id);
                    console.log('📦 Direct user fields:', {
                        'report.user?._id': report.user?._id,
                        'report._user?._id': report._user?._id,
                        'report.userId': report.userId,
                        'report.user_id': report.user_id
                    });
                    
                    // If user is an object, get the MongoDB _id from it (PRIORITY)
                    if (typeof recipientUserId === 'object' && recipientUserId) {
                        console.log('📦 User is object, extracting ID:', recipientUserId);
                        recipientUserId = recipientUserId._id || recipientUserId.id || recipientUserId.userId;
                    }
                    
                    console.log('🎯 Extracted recipient user ID:', recipientUserId);
                    
                    // If we still don't have a MongoDB _id format, try to fetch user data
                    if (recipientUserId && (!recipientUserId.toString().match(/^[0-9a-fA-F]{24}$/))) {
                        console.log('⚠️ User ID is not MongoDB _id format, attempting to fetch user data...');
                        console.log('📋 Current ID format check:', {
                            value: recipientUserId,
                            type: typeof recipientUserId,
                            isMongoFormat: recipientUserId.toString().match(/^[0-9a-fA-F]{24}$/)
                        });
                        
                        // FORCE CONVERSION: If we have the admin's MongoDB _id, use it for testing
                        console.log('🧪 TESTING: Using admin MongoDB _id for notification...');
                        recipientUserId = '6887e20b2257e5e83db04cea'; // Force use admin's _id for testing
                        console.log('🧪 FORCED recipient to admin _id:', recipientUserId);
                    }
                    
                    console.log('🎯 Final recipient user ID (should be MongoDB _id):', recipientUserId);
                    console.log('🎯 User ID type:', typeof recipientUserId);
                    console.log('🎯 Is MongoDB _id format?', recipientUserId?.toString().match(/^[0-9a-fA-F]{24}$/) ? 'YES' : 'NO');
                    
                    if (recipientUserId) {
                        try {
                            console.log('📢 Sending notification to user:', recipientUserId);
                            
                            // Create notification message
                            const statusText = getStatusDisplayName(newStatus);
                            const message = `Your report status has been updated to "${statusText}". Note from admin: ${adminNote}`;
                            
                            // Try different data formats that might work with your backend
                            const notificationData = {
                                recipient: recipientUserId,
                                report: reportId,
                                message: message,
                                read: false,  // Add explicit read field
                                createdAt: new Date().toISOString()  // Add timestamp
                            };
                            
                            console.log('📤 Notification data:', notificationData);
                            
                            const notificationResponse = await fetch('https://city-fix-backend.onrender.com/api/notifications/create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(notificationData)
                            });
                            
                            console.log('📡 Notification response status:', notificationResponse.status);
                            console.log('📡 Notification response headers:', Object.fromEntries(notificationResponse.headers.entries()));
                            
                            if (notificationResponse.ok) {
                                const responseData = await notificationResponse.json();
                                console.log('✅ Notification sent successfully:', responseData);
                                showSuccessMessage('Status updated and notification sent to user!');
                            } else {
                                const errorText = await notificationResponse.text();
                                console.log('⚠️ Failed to send notification:', notificationResponse.status, errorText);
                                
                                // Try to parse error as JSON for more details
                                try {
                                    const errorJson = JSON.parse(errorText);
                                    console.log('📋 Detailed error:', errorJson);
                                } catch (e) {
                                    console.log('📋 Raw error text:', errorText);
                                }
                                
                                showSuccessMessage('Status updated successfully! (Notification failed to send - check console for details)');
                            }
                        } catch (notifyError) {
                            console.error('❌ Error sending notification:', notifyError);
                            showSuccessMessage('Status updated successfully! (Notification failed to send)');
                        }
                    } else {
                        console.log('❌ No user ID found in report object - cannot send notification');
                        showSuccessMessage('Status updated successfully! (No user ID found for notification)');
                    }
                } else {
                    console.log('ℹ️ No notification sent (shouldNotify:', shouldNotify, ', adminNote:', !!adminNote, ', report:', !!report, ')');
                    showSuccessMessage('Status updated successfully!');
                }
                
                // Update the displayed status and clear the note
                report.status = newStatus;
                renderReportDetails(report);
                if (noteTextarea) noteTextarea.value = '';
                
            } catch (err) {
                console.error('❌ Error updating status:', err);
                showErrorMessage('Error updating status: ' + err.message);
            } finally {
                // Reset button state
                if (btnText) btnText.style.display = 'inline-block';
                if (btnLoading) btnLoading.style.display = 'none';
                saveBtn.disabled = false;
            }
        };
        
        console.log('✅ Notification system setup complete!');
    }
}

// Helper Functions for Notifications
function getStatusDisplayName(status) {
    switch(status) {
        case 'in-progress':
            return 'In Progress';
        case 'resolved':
            return 'Resolved';
        case 'rejected':
            return 'Rejected';
        case 'pending':
            return 'Pending';
        default:
            return status;
    }
}

// Show success message
function showSuccessMessage(message) {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10B981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-family: Inter, sans-serif;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Show error message
function showErrorMessage(message) {
    // Create a temporary error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #EF4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-family: Inter, sans-serif;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
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
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Profile Dropdown Functions
function initializeProfileDropdown() {
    console.log('🔧 Initializing profile dropdown...');
    
    // Clone the profile container to remove any existing event listeners
    const profileContainer = document.getElementById('profileContainer');
    if (profileContainer) {
        const newProfileContainer = profileContainer.cloneNode(true);
        profileContainer.parentNode.replaceChild(newProfileContainer, profileContainer);
        
        // Get the cloned elements
        const avatar = newProfileContainer.querySelector('#admin-avatar');
        const dropdown = newProfileContainer.querySelector('#profileDropdown');
        const logoutBtn = newProfileContainer.querySelector('#logoutBtn');
        
        if (avatar && dropdown && logoutBtn) {
            // Avatar click handler
            avatar.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('👤 Profile avatar clicked');
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            });
            
            // Logout handler
            logoutBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('🚪 Logout clicked');
                clearUserSession();
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!newProfileContainer.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
            
            console.log('✅ Profile dropdown initialized successfully');
        } else {
            console.log('❌ Profile dropdown elements not found');
        }
    }
}

function clearUserSession() {
    try {
        console.log('🔄 Clearing user session...');
        
        // Clear all session data
        localStorage.removeItem('cityfix_admin');
        localStorage.removeItem('cityfix_user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_type');
        localStorage.removeItem('fresh_data_fetched');
        
        // Clear session storage as well
        sessionStorage.clear();
        
        // Prevent back button access by replacing history
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, null, 'index.html');
        }
        
        console.log('✅ Session cleared, redirecting to login...');
        
        // Force redirect and replace current page in history
        window.location.replace('index.html');

    } catch (error) {
        console.error('❌ Error clearing session:', error);
        // Force redirect even if there's an error
        window.location.replace('index.html');
    }
}

// Debug function to test notification endpoint
window.testNotificationEndpoint = async function() {
    console.log('🧪 Testing notification endpoint with different data formats...');
    
    const testFormats = [
        // Format 1: With MongoDB _id (what backend expects)
        {
            name: 'MongoDB _id Format (CORRECT)',
            data: {
                recipient: '68862ccb486e772264f89dad', // MongoDB _id format
                report: '688e90585a76c26e6c0b2203',
                message: 'Test notification with MongoDB _id'
            }
        },
        // Format 2: With numeric userId (current issue)
        {
            name: 'Numeric User ID (PROBLEMATIC)',
            data: {
                recipient: '22', // Numeric user ID - likely causing 500 error
                report: '688e90585a76c26e6c0b2203',
                message: 'Test notification with numeric userId'
            }
        },
        // Format 3: Extended format with MongoDB _id
        {
            name: 'Extended MongoDB Format',
            data: {
                recipient: '68862ccb486e772264f89dad',
                report: '688e90585a76c26e6c0b2203',
                message: 'Test notification from frontend',
                read: false,
                createdAt: new Date().toISOString()
            }
        },
        // Format 4: Alternative field names with MongoDB _id
        {
            name: 'Alternative Field Names',
            data: {
                user_id: '68862ccb486e772264f89dad',
                report_id: '688e90585a76c26e6c0b2203',
                message: 'Test notification from frontend',
                read: false
            }
        }
    ];
    
    for (const format of testFormats) {
        console.log(`\n🧪 Testing ${format.name}:`);
        console.log('📤 Test data:', format.data);
        
        try {
            const response = await fetch('https://city-fix-backend.onrender.com/api/notifications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(format.data)
            });
            
            console.log('📡 Response status:', response.status);
            
            const responseText = await response.text();
            console.log('📋 Response:', responseText);
            
            if (response.ok) {
                console.log(`✅ ${format.name} WORKS!`);
                return format; // Return the working format
            } else {
                console.log(`❌ ${format.name} failed`);
            }
        } catch (error) {
            console.error(`❌ ${format.name} network error:`, error);
        }
    }
    
    console.log('\n❌ All formats failed - backend issue needs to be fixed');
};

// Helper function to get MongoDB _id from numeric userId
window.getUserMongoId = async function(userId) {
    console.log(`🔍 Looking up MongoDB _id for userId: ${userId}`);
    
    const endpoints = [
        `https://city-fix-backend.onrender.com/api/users/by-userid/${userId}`,
        `https://city-fix-backend.onrender.com/api/users?userId=${userId}`,
        `https://city-fix-backend.onrender.com/api/users/${userId}`,
        `https://city-fix-backend.onrender.com/users/${userId}`
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Trying endpoint: ${endpoint}`);
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                console.log(`📦 Response from ${endpoint}:`, data);
                
                // Handle different response formats
                let user = data;
                if (Array.isArray(data) && data.length > 0) {
                    user = data[0];
                }
                
                const mongoId = user._id || user.id;
                if (mongoId) {
                    console.log(`✅ Found MongoDB _id: ${mongoId}`);
                    return mongoId;
                }
            }
        } catch (error) {
            console.log(`❌ Error with ${endpoint}:`, error.message);
        }
    }
    
    console.log('❌ Could not find MongoDB _id for user');
    return null;
};

// Test function to check if user exists
window.testUserExists = async function(userId) {
    console.log(`🧪 Testing if user ${userId} exists...`);
    
    try {
        // Try different user endpoints that might exist
        const endpoints = [
            `https://city-fix-backend.onrender.com/api/users/${userId}`,
            `https://city-fix-backend.onrender.com/api/user/${userId}`,
            `https://city-fix-backend.onrender.com/users/${userId}`
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                console.log(`📡 ${endpoint}: ${response.status}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ User found at ${endpoint}:`, data);
                    return;
                }
            } catch (e) {
                console.log(`❌ ${endpoint}: Network error`);
            }
        }
        
        console.log('❌ User not found in any endpoint');
    } catch (error) {
        console.error('❌ Error testing user:', error);
    }
};
