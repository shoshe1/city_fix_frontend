// CityFix User Notification System
// This handles displaying notifications for users

console.log(`🔔 CityFix Notification System Loaded
Available debug functions:
- checkCurrentUserId() - See what user ID is being used
- testWithKnownUserId() - Test with the known working user ID
- forceSetUserId() - Force set the correct user ID
- debugAllNotifications() - Check all notifications in database
`);

let userNotifications = [];
let currentUserId = null;

// Initialize notification system when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔔 Initializing notification system...');
    initializeNotifications();
});

// Initialize the notification system
function initializeNotifications() {
    // Get user ID from localStorage
    getCurrentUserId();
    
    if (currentUserId) {
        console.log('✅ User found:', currentUserId);
        loadNotifications();
        
        // Check for new notifications every 30 seconds
        setInterval(loadNotifications, 30000);
    } else {
        console.log('❌ No user ID found');
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notification-dropdown');
        const container = document.getElementById('notificationContainer');
        
        if (dropdown && container && !container.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// Get current user ID from localStorage
function getCurrentUserId() {
    try {
        console.log('🔍 Searching for user ID in localStorage...');
        
        // Debug: Log all localStorage contents
        console.log('📋 All localStorage keys:', Object.keys(localStorage));
        
        // Try different possible storage keys
        const user = JSON.parse(localStorage.getItem('cityfix_user') || '{}');
        console.log('📦 cityfix_user data:', user);
        
        // PRIORITY ORDER: _id (MongoDB) FIRST, then numeric userId
        currentUserId = user._id || user.userId || user.user_id || user.id;
        
        if (!currentUserId) {
            // Try other storage keys
            currentUserId = localStorage.getItem('user_id') || 
                           localStorage.getItem('userId') ||
                           localStorage.getItem('currentUserId');
        }
        
        if (!currentUserId && user.user) {
            // Sometimes user data is nested
            currentUserId = user.user._id || user.user.userId || user.user.id;
        }
        
        // Try cityfix_admin as fallback (for testing with admin)
        if (!currentUserId) {
            const adminUser = JSON.parse(localStorage.getItem('cityfix_admin') || '{}');
            console.log('📦 cityfix_admin data:', adminUser);
            currentUserId = adminUser._id || adminUser.userId || adminUser.user_id || adminUser.id;
        }
        
        console.log('🔍 Final user ID found:', currentUserId);
        console.log('🔍 User ID type:', typeof currentUserId);
        console.log('🔍 Is MongoDB _id format?', currentUserId?.toString().match(/^[0-9a-fA-F]{24}$/) ? 'YES' : 'NO');
        
        // If we found a numeric userId, try to convert it to MongoDB _id
        if (currentUserId && !currentUserId.toString().match(/^[0-9a-fA-F]{24}$/)) {
            console.log('⚠️ User ID is numeric, attempting to fetch MongoDB _id...');
            fetchUserMongoId(currentUserId);
        }
        
    } catch (error) {
        console.error('❌ Error getting user ID:', error);
    }
}

// Fetch MongoDB _id from numeric userId
async function fetchUserMongoId(numericUserId) {
    console.log(`🔍 Converting numeric userId ${numericUserId} to MongoDB _id...`);
    
    const endpoints = [
        `https://city-fix-backend.onrender.com/api/users/by-userid/${numericUserId}`,
        `https://city-fix-backend.onrender.com/api/users?userId=${numericUserId}`,
        `https://city-fix-backend.onrender.com/api/users/${numericUserId}`,
        `https://city-fix-backend.onrender.com/users/${numericUserId}`
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Trying: ${endpoint}`);
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                console.log(`📦 User data from ${endpoint}:`, data);
                
                // Handle different response formats
                let user = data;
                if (Array.isArray(data) && data.length > 0) {
                    user = data[0];
                }
                
                const mongoId = user._id || user.id;
                if (mongoId && mongoId.toString().match(/^[0-9a-fA-F]{24}$/)) {
                    console.log(`✅ Found MongoDB _id: ${mongoId}`);
                    currentUserId = mongoId;
                    
                    // Reload notifications with the new MongoDB _id
                    loadNotifications();
                    return mongoId;
                }
            }
        } catch (error) {
            console.log(`❌ Error with ${endpoint}:`, error.message);
        }
    }
    
    console.log('❌ Could not convert to MongoDB _id, keeping original:', numericUserId);
    return numericUserId;
}

// Load notifications from backend
async function loadNotifications() {
    if (!currentUserId) {
        console.log('❌ No user ID available for loading notifications');
        showEmptyNotifications();
        return;
    }
    
    try {
        console.log('📥 Loading notifications for user:', currentUserId);
        
        const url = `https://city-fix-backend.onrender.com/api/notifications/user/${currentUserId}`;
        console.log('🌐 Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (response.ok) {
            const notifications = await response.json();
            console.log('📦 Raw response data:', notifications);
            
            userNotifications = Array.isArray(notifications) ? notifications : [];
            console.log(`✅ Processed ${userNotifications.length} notifications:`, userNotifications);
            
            updateNotificationBadge();
            updateNotificationDropdown();
        } else {
            console.log('⚠️ Failed to load notifications:', response.status);
            const errorText = await response.text();
            console.log('📄 Error response:', errorText);
            showEmptyNotifications();
        }
    } catch (error) {
        console.error('❌ Error loading notifications:', error);
        showEmptyNotifications();
    }
}

// Update notification badge
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    console.log('🔔 Updating badge, element found:', !!badge);
    
    if (!badge) {
        console.log('❌ Badge element not found!');
        return;
    }
    
    const unreadCount = userNotifications.filter(n => !n.read).length;
    console.log('📊 Unread count:', unreadCount, 'from', userNotifications.length, 'total notifications');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount.toString();
        badge.style.display = 'flex';
        console.log('✅ Badge updated to show:', badge.textContent);
    } else {
        badge.style.display = 'none';
        console.log('➖ Badge hidden (no unread notifications)');
    }
}

// Update notification dropdown content
function updateNotificationDropdown() {
    const list = document.getElementById('notification-list');
    const markAllBtn = document.getElementById('mark-all-read');
    
    if (!list) return;
    
    if (userNotifications.length === 0) {
        showEmptyNotifications();
        if (markAllBtn) markAllBtn.style.display = 'none';
        return;
    }
    
    const unreadCount = userNotifications.filter(n => !n.read).length;
    if (markAllBtn) {
        markAllBtn.style.display = unreadCount > 0 ? 'block' : 'none';
    }
    
    list.innerHTML = userNotifications.map(notification => createNotificationHTML(notification)).join('');
}

// Create HTML for a single notification
function createNotificationHTML(notification) {
    const isRead = notification.read;
    const timeAgo = getTimeAgo(new Date(notification.createdAt));
    
    return `
        <div class="notification-item ${isRead ? 'read' : 'unread'}" data-notification-id="${notification._id}">
            <div class="notification-content">
                <div class="notification-text">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <div class="notification-actions">
                    ${!isRead ? `<button class="mark-read-btn" onclick="markAsRead('${notification._id}')">Mark read</button>` : ''}
                    <button class="delete-btn" onclick="deleteNotification('${notification._id}')" title="Delete">×</button>
                </div>
            </div>
        </div>
    `;
}

// Show empty notifications state
function showEmptyNotifications() {
    const list = document.getElementById('notification-list');
    const markAllBtn = document.getElementById('mark-all-read');
    
    if (list) {
        list.innerHTML = `
            <div class="notification-empty">
                <div class="notification-icon">🔔</div>
                <p>No notifications yet</p>
            </div>
        `;
    }
    
    if (markAllBtn) {
        markAllBtn.style.display = 'none';
    }
}

// Toggle notification dropdown
function toggleNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;
    
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        // Refresh notifications when opening
        loadNotifications();
    }
}

// Mark notification as read
async function markAsRead(notificationId) {
    try {
        // Update local state immediately for better UX
        const notification = userNotifications.find(n => n._id === notificationId);
        if (notification) {
            notification.read = true;
        }
        
        // Update UI
        updateNotificationBadge();
        updateNotificationDropdown();
        
        // Update backend (optional - depends on your backend implementation)
        // You may need to add this endpoint to your backend
        console.log('✅ Marked notification as read locally:', notificationId);
        
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
    }
}

// Mark all notifications as read
async function markAllAsRead() {
    try {
        // Update local state
        userNotifications.forEach(notification => {
            notification.read = true;
        });
        
        // Update UI
        updateNotificationBadge();
        updateNotificationDropdown();
        
        console.log('✅ Marked all notifications as read locally');
        
    } catch (error) {
        console.error('❌ Error marking all notifications as read:', error);
    }
}

// Delete notification
async function deleteNotification(notificationId) {
    try {
        // Remove from local state
        userNotifications = userNotifications.filter(n => n._id !== notificationId);
        
        // Update UI
        updateNotificationBadge();
        updateNotificationDropdown();
        
        console.log('✅ Deleted notification locally:', notificationId);
        
    } catch (error) {
        console.error('❌ Error deleting notification:', error);
    }
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Global functions for HTML onclick handlers
window.toggleNotifications = toggleNotifications;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.deleteNotification = deleteNotification;

// Test function to manually test notifications
window.testNotifications = function() {
    console.log('🧪 === NOTIFICATION DEBUGGING START ===');
    
    // Test user ID detection
    console.log('🔍 Current user ID:', currentUserId);
    getCurrentUserId();
    console.log('🔍 After re-check, user ID:', currentUserId);
    
    // Test all possible user IDs
    const testUserIds = [];
    
    // Get all possible user IDs from localStorage
    try {
        const cityFixUser = JSON.parse(localStorage.getItem('cityfix_user') || '{}');
        console.log('🔍 cityfix_user object:', cityFixUser);
        if (cityFixUser._id) testUserIds.push(cityFixUser._id);
        if (cityFixUser.userId) testUserIds.push(cityFixUser.userId);
        if (cityFixUser.user_id) testUserIds.push(cityFixUser.user_id);
        if (cityFixUser.id) testUserIds.push(cityFixUser.id);
    } catch (e) {}
    
    console.log('🔍 All possible user IDs to test:', testUserIds);
    
    // Test each possible user ID
    testUserIds.forEach(async (userId, index) => {
        if (userId) {
            console.log(`🧪 [${index + 1}] Testing notifications for user ID: ${userId}`);
            console.log(`🧪 [${index + 1}] ID format: ${userId.toString().match(/^[0-9a-fA-F]{24}$/) ? 'MongoDB _id' : 'Numeric/Other'}`);
            
            try {
                const response = await fetch(`https://city-fix-backend.onrender.com/api/notifications/user/${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`📦 [${index + 1}] Notifications for ${userId}:`, data);
                    
                    if (data && data.length > 0) {
                        console.log(`🎉 [${index + 1}] FOUND NOTIFICATIONS! This is the correct user ID: ${userId}`);
                        currentUserId = userId;
                        userNotifications = data;
                        updateNotificationBadge();
                        updateNotificationDropdown();
                        return;
                    }
                } else {
                    console.log(`⚠️ [${index + 1}] Failed to fetch for ${userId}:`, response.status);
                }
            } catch (error) {
                console.error(`❌ [${index + 1}] Error testing ${userId}:`, error);
            }
        }
    });
    
    // Show test notifications in UI if no real ones found
    setTimeout(() => {
        if (!userNotifications || userNotifications.length === 0) {
            console.log('🧪 No real notifications found, showing test notifications...');
            userNotifications = [
                {
                    _id: 'test1',
                    message: 'Test notification 1 - Your report has been updated',
                    read: false,
                    createdAt: new Date().toISOString()
                }
            ];
            
            console.log('📦 Setting test notifications:', userNotifications);
            updateNotificationBadge();
            updateNotificationDropdown();
        }
        console.log('✅ Test complete - check the notification icon!');
    }, 3000);
    
    console.log('🧪 === NOTIFICATION DEBUGGING END ===');
};

// Debug function to check all notifications in database
window.debugAllNotifications = async function() {
    console.log('🔍 === CHECKING ALL NOTIFICATIONS IN DATABASE ===');
    
    // Try to fetch all notifications to see what exists
    const endpoints = [
        'https://city-fix-backend.onrender.com/api/notifications',
        'https://city-fix-backend.onrender.com/api/notifications/all',
        'https://city-fix-backend.onrender.com/notifications'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Trying to fetch all notifications from: ${endpoint}`);
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ All notifications from ${endpoint}:`, data);
                
                if (Array.isArray(data) && data.length > 0) {
                    console.log(`📊 Found ${data.length} total notifications in database:`);
                    data.forEach((notification, index) => {
                        console.log(`📋 [${index + 1}] Notification:`, {
                            _id: notification._id,
                            recipient: notification.recipient,
                            message: notification.message,
                            read: notification.read,
                            createdAt: notification.createdAt
                        });
                    });
                    return data;
                }
            } else {
                console.log(`❌ ${endpoint}: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error with ${endpoint}:`, error.message);
        }
    }
    
    console.log('❌ Could not fetch all notifications');
};

// Debug function to manually test with the known working user ID
window.testWithKnownUserId = async function() {
    console.log('🔍 === TESTING WITH KNOWN USER ID ===');
    console.log('🔍 Testing with known user ID: 68862ccb486e772264f89dad');
    
    try {
        const url = 'https://city-fix-backend.onrender.com/api/notifications/user/68862ccb486e772264f89dad';
        console.log('🌐 Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (response.ok) {
            const notifications = await response.json();
            console.log('📦 Notifications found:', notifications);
            console.log(`✅ Found ${notifications.length} notifications for this user!`);
            
            // Temporarily display these notifications
            userNotifications = notifications;
            updateNotificationBadge();
            updateNotificationDropdown();
            
            return notifications;
        } else {
            console.log('⚠️ Failed to load notifications:', response.status);
            const errorText = await response.text();
            console.log('📄 Error response:', errorText);
        }
    } catch (error) {
        console.error('❌ Error testing notifications:', error);
    }
};

// Force set the correct user ID for testing
window.forceSetUserId = function() {
    console.log('🔧 === FORCING USER ID ===');
    console.log('🔧 Setting user ID to: 68862ccb486e772264f89dad');
    currentUserId = '68862ccb486e772264f89dad';
    
    // Also save it to localStorage for persistence
    const userData = { _id: '68862ccb486e772264f89dad', userId: '68862ccb486e772264f89dad' };
    localStorage.setItem('cityfix_user', JSON.stringify(userData));
    
    console.log('✅ User ID forced, reloading notifications...');
    loadNotifications();
};

// Check what user ID is currently being used
window.checkCurrentUserId = function() {
    console.log('🔍 === CURRENT USER ID CHECK ===');
    console.log('📋 Current user ID:', currentUserId);
    console.log('📋 localStorage contents:');
    
    Object.keys(localStorage).forEach(key => {
        try {
            const value = localStorage.getItem(key);
            console.log(`  ${key}:`, JSON.parse(value));
        } catch {
            console.log(`  ${key}:`, value);
        }
    });
    
    // Try to get user ID again
    getCurrentUserId();
    console.log('📋 User ID after refresh:', currentUserId);
};
