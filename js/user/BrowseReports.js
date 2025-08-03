// Check authentication first
document.addEventListener('DOMContentLoaded', function() {
    const userId = localStorage.getItem('user_id');
    const userToken = localStorage.getItem('user_token');
    
    if (!userId || !userToken) {
        console.log('❌ No valid session for BrowseReports - redirecting to index.html');
        window.location.replace('index.html');
        return;
    }
    
    console.log('✅ Valid session found for BrowseReports - loading reports');
    
    // Load user profile image
    loadUserProfileImage(userId);
    
    // Wait a bit to ensure DOM is fully ready
    setTimeout(() => {
        console.log('🔧 Starting initialization...');
        initializeFilters();
        loadAndRenderReports();
    }, 100);
});

// Load user profile image
function loadUserProfileImage(userId) {
    if (userId) {
        fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/image`)
            .then(res => res.ok ? res.blob() : null)
            .then(blob => {
                if (blob) {
                    const imgUrl = URL.createObjectURL(blob);
                    const imgEl = document.getElementById('userProfileImage');
                    if (imgEl) {
                        imgEl.src = imgUrl;
                        console.log('✅ Profile image loaded successfully');
                    }
                }
            })
            .catch(error => {
                console.log('📷 Profile image not available, using default');
            });
    }
}

// Global variables for filtering
let allReports = [];
let currentFilters = {
    type: 'all',
    status: 'all',
    sort: 'newest'
};

// Initialize filter functionality
function initializeFilters() {
    console.log('🔧 Initializing filters...');
    
    // Setup dropdown toggles
    setupDropdownToggles();
    
    // Setup filter item clicks
    setupFilterItemClicks();
    
    // Setup sort button clicks
    setupSortButtons();
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.filter-dropdown')) {
            closeAllDropdowns();
        }
    });
}

function setupDropdownToggles() {
    const dropdowns = document.querySelectorAll('.filter-dropdown');
    
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.filter-btn');
        const content = dropdown.querySelector('.dropdown-content');
        
        if (button && content) {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Close other dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.querySelector('.dropdown-content').classList.remove('show');
                    }
                });
                
                // Toggle current dropdown
                content.classList.toggle('show');
            });
        }
    });
}

function setupFilterItemClicks() {
    // Type filter
    const typeItems = document.querySelectorAll('#typeFilter .dropdown-item');
    typeItems.forEach(item => {
        item.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const text = this.textContent;
            
            // Update button text
            const button = document.querySelector('#typeFilter .filter-btn span');
            button.textContent = text;
            
            // Update filter state
            currentFilters.type = value;
            
            // Apply filters
            applyFilters();
            
            // Close dropdown
            this.closest('.dropdown-content').classList.remove('show');
            
            console.log('🔍 Type filter changed to:', value);
        });
    });
    
    // Status filter  
    const statusItems = document.querySelectorAll('#districtFilter .dropdown-item');
    statusItems.forEach(item => {
        item.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const text = this.textContent;
            
            // Update button text
            const button = document.querySelector('#districtFilter .filter-btn span');
            button.textContent = text;
            
            // Update filter state
            currentFilters.status = value;
            
            // Apply filters
            applyFilters();
            
            // Close dropdown
            this.closest('.dropdown-content').classList.remove('show');
            
            console.log('🔍 Status filter changed to:', value);
        });
    });
}

function setupSortButtons() {
    console.log('🔧 Setting up sort buttons...');
    const sortButtons = document.querySelectorAll('.sort-btn');
    console.log('📍 Found sort buttons:', sortButtons.length);
    
    if (sortButtons.length === 0) {
        console.error('❌ No sort buttons found! Retrying in 500ms...');
        setTimeout(setupSortButtons, 500);
        return;
    }
    
    sortButtons.forEach((button, index) => {
        console.log(`📍 Setting up sort button ${index + 1}: ${button.textContent.trim()}`);
        
        // Remove any existing listeners
        button.replaceWith(button.cloneNode(true));
        const newButton = document.querySelectorAll('.sort-btn')[index];
        
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔍 Sort button clicked:', this.textContent.trim());
            
            const sortValue = this.getAttribute('data-sort');
            console.log('🔍 Sort value:', sortValue);
            
            // Remove active class from all buttons
            document.querySelectorAll('.sort-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            console.log('✅ Added active to:', this.textContent.trim());
            
            // Update filter state
            currentFilters.sort = sortValue;
            console.log('🔍 Updated currentFilters.sort to:', sortValue);
            
            // Apply filters
            applyFilters();
        });
    });
    
    console.log('✅ Sort buttons setup complete');
}

function closeAllDropdowns() {
    const dropdownContents = document.querySelectorAll('.dropdown-content');
    dropdownContents.forEach(content => {
        content.classList.remove('show');
    });
}

function applyFilters() {
    console.log('🔍 Applying filters:', currentFilters);
    
    let filteredReports = [...allReports];
    
    // Filter by type
    if (currentFilters.type !== 'all') {
        filteredReports = filteredReports.filter(report => {
            const reportType = (report.issueType || report.type || '').toLowerCase();
            const filterType = currentFilters.type.toLowerCase();
            return reportType.includes(filterType) || filterType.includes(reportType);
        });
    }
    
    // Filter by status
    if (currentFilters.status !== 'all') {
        filteredReports = filteredReports.filter(report => {
            const reportStatus = (report.status || '').toLowerCase();
            const filterStatus = currentFilters.status.toLowerCase();
            
            // Handle different status mappings
            if (filterStatus === 'not-started') {
                return reportStatus === 'pending' || reportStatus === 'new' || reportStatus === 'not-started';
            }
            
            return reportStatus === filterStatus;
        });
    }
    
    // Sort reports
    console.log('🔄 Sorting reports by:', currentFilters.sort);
    
    if (currentFilters.sort === 'newest') {
        console.log('📅 Sorting by newest first...');
        filteredReports.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });
    } else if (currentFilters.sort === 'most-reported') {
        console.log('📊 Sorting by most reported...');
        filteredReports.sort((a, b) => (b.reportCount || b.count || 0) - (a.reportCount || a.count || 0));
    } else if (currentFilters.sort === 'resolved-first') {
        console.log('✔️ Sorting by resolved first...');
        filteredReports.sort((a, b) => {
            const aResolved = (a.status || '').toLowerCase() === 'resolved' ? 1 : 0;
            const bResolved = (b.status || '').toLowerCase() === 'resolved' ? 1 : 0;
            return bResolved - aResolved;
        });
    }
    
    console.log(`📊 Filtered ${filteredReports.length} reports from ${allReports.length} total`);
    
    renderReports(filteredReports);
}

function renderReports(reports) {
    const reportsList = document.getElementById('reportsList');
    if (!reportsList) return;
    
    if (reports.length === 0) {
        reportsList.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No reports found</h3>
                <p>Try adjusting your filters or search criteria</p>
            </div>
        `;
        return;
    }
    
    reportsList.innerHTML = reports.map(report => {
        const issueType = report.issueType || report.type || report.title || 'Issue';
        const status = report.status || 'new';
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        const location = report.district || report.address || 'Unknown location';
        const timeAgo = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '';
        const imageUrl = `https://city-fix-backend.onrender.com/api/reports/${report._id || report.id}/image`;
        
        return `
        <div class="report-card" data-type="${issueType}" data-district="${location}" data-status="${status}">
            <div class="report-image">
                <img src="${imageUrl}" alt="${issueType}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" onerror="this.src='assets/reports-icon.svg'">
            </div>
            <div class="report-content">
                <div class="report-header">
                    <h3>${issueType}</h3>
                    <div class="report-priority status-${status}">${statusText}</div>
                </div>
                <p class="location">${report.description || ''}</p>
                <div class="status-section">
                    <p class="time">${timeAgo}</p>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Fetch and render all reports in BrowseReports.html
async function loadAndRenderReports() {
    const API_URL = 'https://city-fix-backend.onrender.com/api/reports/getAllreports';
    const reportsList = document.getElementById('reportsList');
    if (!reportsList) return;
    
    // Show loading state
    reportsList.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading reports...</p>
        </div>
    `;
    
    try {
        console.log('🔄 Fetching reports from API...');
        const response = await fetch(API_URL);
        const result = await response.json();
        const reports = result.data || result;
        
        if (!Array.isArray(reports)) {
            console.error('❌ Invalid data format received');
            reportsList.innerHTML = '<div style="color:red; text-align:center;">Invalid data format received.</div>';
            return;
        }
        
        console.log(`✅ Loaded ${reports.length} reports successfully`);
        
        // Store all reports globally for filtering
        allReports = reports;
        
        // Apply initial filters
        applyFilters();
        
    } catch (err) {
        console.error('❌ Failed to load reports:', err);
        reportsList.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Failed to load reports</h3>
                <p>Please check your connection and try again</p>
                <button onclick="loadAndRenderReports()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
            </div>
        `;
    }
}// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://city-fix-backend.onrender.com', // Changed to match backend API
    ENDPOINTS: {
        REPORTS: '/getAllreports', // Use the correct endpoint from your backend
        REPORT_BY_ID: '/getAllreports' // Use the same endpoint, filter by ID in frontend
        // Removed DISTRICTS and REPORT_TYPES as they don't exist in your backend
    }
};

// API Service Class
class ApiService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error: ${error.message}`);
            throw error;
        }
    }

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Browse Reports Class
class BrowseReports {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.currentFilters = {
            type: 'all',
            district: 'all',
            sort: 'newest',
            search: ''
        };
        
        this.apiService = new ApiService();
        this.reports = [];
        this.totalReports = 0;
        this.districts = [];
        this.reportTypes = [];
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        try {
            this.createReportModal();
            this.setupEventListeners();
            this.showLoading();
            
            // Load initial data from backend
            await this.loadInitialData();
            await this.loadReports();
            
            this.updatePagination();
            this.setupMobileMenu();
            this.updateResponsiveLayout();
            
            window.addEventListener('resize', () => {
                this.updateResponsiveLayout();
            });
        } catch (error) {
            this.showError('Unable to initialize the application. Please refresh the page.');
            console.error('Initialization error:', error);
        }
    }

    async loadInitialData() {
        try {
            // Since districts and report-types endpoints don't exist in your backend,
            // we'll use hardcoded values that match your frontend filters
            this.districts = []; // No districts endpoint available
            this.reportTypes = [
                'pothole', 'streetlight', 'drainage', 'garbage', 'traffic', 
                'sidewalk', 'graffiti', 'noise', 'abandoned_vehicle', 
                'water_leak', 'park_maintenance'
            ];
            
            this.populateFilterDropdowns();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showWarning('Some filter options may not be available');
        }
    }

    populateFilterDropdowns() {
        // Populate districts dropdown
        const districtFilter = document.getElementById('districtFilter');
        if (districtFilter && this.districts.length > 0) {
            const dropdownContent = districtFilter.querySelector('.dropdown-content');
            if (dropdownContent) {
                const districtsHTML = this.districts.map(district => 
                    `<div class="dropdown-item" data-value="${district.id || district.value}">${district.name || district.label}</div>`
                ).join('');
                
                dropdownContent.innerHTML = `
                    <div class="dropdown-item" data-value="all">All Districts</div>
                    ${districtsHTML}
                `;
                
                this.setupDropdownEvents(districtFilter, 'district');
            }
        }
        
        // Populate types dropdown
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter && this.reportTypes.length > 0) {
            const dropdownContent = typeFilter.querySelector('.dropdown-content');
            if (dropdownContent) {
                const typesHTML = this.reportTypes.map(type => 
                    `<div class="dropdown-item" data-value="${type.id || type.value}">${type.name || type.label}</div>`
                ).join('');
                
                dropdownContent.innerHTML = `
                    <div class="dropdown-item" data-value="all">All Types</div>
                    ${typesHTML}
                `;
                
                this.setupDropdownEvents(typeFilter, 'type');
            }
        }
    }

    setupDropdownEvents(dropdown, filterType) {
        const items = dropdown.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = item.dataset.value;
                const text = item.textContent;
                
                const btn = dropdown.querySelector('.filter-btn span');
                if (btn) btn.textContent = text;
                
                this.currentFilters[filterType] = value;
                
                dropdown.classList.remove('active');
                this.filterAndSortReports();
            });
        });
    }

    
    // Client-side filtering since backend doesn't support advanced filtering
    applyClientSideFiltering(allReports) {
        let filtered = [...allReports];
        
        // Filter by type
        if (this.currentFilters.type && this.currentFilters.type !== 'all') {
            filtered = filtered.filter(report => 
                report.reportType === this.currentFilters.type
            );
        }
        
        // Filter by status
        if (this.currentFilters.status && this.currentFilters.status !== 'all') {
            let statusToMatch = this.currentFilters.status;
            if (statusToMatch === 'in-progress') {
                statusToMatch = 'progress'; // Match backend status format
            }
            if (statusToMatch === 'not-started') {
                statusToMatch = 'pending'; // Match backend status format
            }
            
            filtered = filtered.filter(report => 
                report.status === statusToMatch
            );
        }
        
        // Sort the filtered results
        return this.sortReports(filtered);
    }
    
    // Sort reports based on current sort option
    sortReports(reports) {
        const sortOption = this.currentFilters.sort || 'newest';
        
        switch (sortOption) {
            case 'newest':
                return reports.sort((a, b) => new Date(b.createdAt || b.dateReported) - new Date(a.createdAt || a.dateReported));
            case 'oldest':
                return reports.sort((a, b) => new Date(a.createdAt || a.dateReported) - new Date(b.createdAt || b.dateReported));
            case 'resolved-first':
                return reports.sort((a, b) => {
                    if (a.status === 'resolved' && b.status !== 'resolved') return -1;
                    if (a.status !== 'resolved' && b.status === 'resolved') return 1;
                    return new Date(b.createdAt || b.dateReported) - new Date(a.createdAt || a.dateReported);
                });
            default:
                return reports;
        }
    }

    async loadReports() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Prepare API parameters
            const params = {
                page: this.currentPage,
                limit: this.itemsPerPage,
                sort: this.currentFilters.sort
            };

            // Add filters if not 'all'
            if (this.currentFilters.type !== 'all') {
                params.type = this.currentFilters.type;
            }

            if (this.currentFilters.district !== 'all') {
                params.district = this.currentFilters.district;
            }

            if (this.currentFilters.search) {
                params.search = this.currentFilters.search;
            }
            
            // Call backend API
            const response = await this.apiService.get(API_CONFIG.ENDPOINTS.REPORTS);
            
            // Handle the response format from /getAllreports endpoint
            if (Array.isArray(response)) {
                this.allReports = response; // Store all reports for filtering
                this.reports = this.applyClientSideFiltering(response);
                this.totalReports = this.reports.length;
                this.currentPage = 1; // Reset to first page when filtering
            } else {
                console.error('Unexpected response format:', response);
                this.reports = [];
                this.totalReports = 0;
            }
            
            this.renderReports();
            
        } catch (error) {
            this.showError('Unable to connect to server. Please check your connection and try again.');
            console.error('Load reports error:', error);
            this.renderReportsError();
        } finally {
            this.isLoading = false;
        }
    }

    showLoading() {
        const reportsList = document.getElementById('reportsList');
        if (reportsList) {
            reportsList.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Loading reports...</p>
                </div>
            `;
        }
    }

    showError(message, type = 'error') {
        this.showNotification(message, type);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'error') {
        // Remove existing notifications of the same type
        const existingNotifications = document.querySelectorAll(`.notification-${type}`);
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
        };

        const titles = {
            error: 'Error',
            success: 'Success',
            warning: 'Warning',
            info: 'Information'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${icons[type]}
                </div>
                <div class="notification-text">
                    <div class="notification-title">${titles[type]}</div>
                    <div class="notification-message">${message}</div>
                </div>
                <button class="notification-close" aria-label="Close notification">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            <div class="notification-progress"></div>
        `;
        
        // Add notification styles if not already added
        this.addNotificationStyles();
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Progress bar animation
        const progressBar = notification.querySelector('.notification-progress');
        progressBar.style.animation = 'progress 5s linear';
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                this.hideNotification(notification);
            }
        }, 5000);

        // Add click to dismiss
        notification.addEventListener('click', (e) => {
            if (e.target === notification || e.target.classList.contains('notification-content')) {
                this.hideNotification(notification);
            }
        });
    }

    hideNotification(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    addNotificationStyles() {
        if (document.querySelector('#notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                min-width: 320px;
                max-width: 400px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                z-index: 10000;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                overflow: hidden;
                cursor: pointer;
            }

            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }

            .notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }

            .notification-error {
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                color: white;
            }

            .notification-success {
                background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
                color: white;
            }

            .notification-warning {
                background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%);
                color: #333;
            }

            .notification-info {
                background: linear-gradient(135deg, #74c0fc 0%, #339af0 100%);
                color: white;
            }

            .notification-content {
                display: flex;
                align-items: flex-start;
                padding: 16px 20px;
                gap: 12px;
            }

            .notification-icon {
                flex-shrink: 0;
                margin-top: 2px;
                opacity: 0.9;
            }

            .notification-text {
                flex: 1;
                min-width: 0;
            }

            .notification-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
                line-height: 1.2;
            }

            .notification-message {
                font-size: 13px;
                line-height: 1.4;
                opacity: 0.95;
                word-wrap: break-word;
            }

            .notification-close {
                background: none;
                border: none;
                padding: 4px;
                cursor: pointer;
                border-radius: 4px;
                color: currentColor;
                opacity: 0.7;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .notification-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }

            .notification-progress {
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                position: relative;
                overflow: hidden;
            }

            .notification-progress::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
                background: rgba(255, 255, 255, 0.6);
                transform: translateX(-100%);
            }

            @keyframes progress {
                from {
                    transform: translateX(-100%);
                }
                to {
                    transform: translateX(0);
                }
            }

            .notification-progress {
                animation: progress 5s linear;
            }

            .notification-progress::after {
                animation: progress 5s linear;
            }

            /* Stack multiple notifications */
            .notification:nth-child(n+2) {
                margin-top: 8px;
            }

            /* Mobile responsive */
            @media (max-width: 480px) {
                .notification {
                    left: 16px;
                    right: 16px;
                    min-width: auto;
                    max-width: none;
                    transform: translateY(-100%);
                }

                .notification.show {
                    transform: translateY(0);
                }

                .notification.hide {
                    transform: translateY(-100%);
                }
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .notification {
                    border-color: rgba(255, 255, 255, 0.1);
                }
                
                .notification-warning {
                    color: #1a1a1a;
                }
            }

            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .notification {
                    transition: opacity 0.2s;
                }
                
                .notification-progress::after {
                    animation: none;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    renderReportsError() {
        const reportsList = document.getElementById('reportsList');
        if (!reportsList) return;
        
        reportsList.innerHTML = `
            <div class="error-state">
                <div class="error-icon">🔌</div>
                <h3>Connection Error</h3>
                <p>Unable to connect to the server. Please check your internet connection.</p>
                <button class="retry-btn" onclick="window.browseReports.loadReports()">
                    Try Again
                </button>
            </div>
        `;
    }

    async filterAndSortReports() {
        this.currentPage = 1;
        await this.loadReports();
        this.updatePagination();
        this.updateURL();
    }

    async viewReportDetails(reportId) {
        try {
            this.showModalLoading();
            
            // Get report details from backend
            const response = await this.apiService.get(`${API_CONFIG.ENDPOINTS.REPORT_BY_ID}/${reportId}`);
            const report = response.data || response;
            
            if (!report) {
                this.showWarning('Report not found or may have been removed');
                return;
            }
            
            this.showReportModal(report);
            
        } catch (error) {
            this.showError('Unable to load report details. Please try again.');
            console.error('Load report details error:', error);
        }
    }

    showModalLoading() {
        const modal = document.getElementById('reportModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div class="modal-loading">
                <div class="spinner"></div>
                <p>Loading details...</p>
            </div>
        `;
        
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    showReportModal(report) {
        const modal = document.getElementById('reportModal');
        const modalBody = document.getElementById('modalBody');
        
        const detailsHTML = `
            <div class="report-detail-grid">
                <div class="detail-item">
                    <div class="detail-icon">📋</div>
                    <div class="detail-content">
                        <div class="detail-label">Report Title</div>
                        <div class="detail-value">${report.title || 'N/A'}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">📍</div>
                    <div class="detail-content">
                        <div class="detail-label">Location</div>
                        <div class="detail-value">${report.location || 'N/A'}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">⚡</div>
                    <div class="detail-content">
                        <div class="detail-label">Status</div>
                        <div class="detail-value">
                            <span class="status-badge status-${report.status || 'unknown'}">${this.getStatusText(report.status)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">🔔</div>
                    <div class="detail-content">
                        <div class="detail-label">Priority</div>
                        <div class="detail-value">
                            <span class="priority-badge priority-${report.priority || 'medium'}">${this.capitalize(report.priority || 'medium')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">🏘️</div>
                    <div class="detail-content">
                        <div class="detail-label">District</div>
                        <div class="detail-value">${report.district?.name || report.districtName || 'Unknown'}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">🔧</div>
                    <div class="detail-content">
                        <div class="detail-label">Type</div>
                        <div class="detail-value">${report.type?.name || report.typeName || 'Unknown'}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">📅</div>
                    <div class="detail-content">
                        <div class="detail-label">Reported Date</div>
                        <div class="detail-value">${this.formatDate(report.createdAt || report.reportedDate || report.date)}</div>
                    </div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-icon">👥</div>
                    <div class="detail-content">
                        <div class="detail-label">Similar Reports</div>
                        <div class="detail-value">${report.similarCount || 0} similar reports</div>
                    </div>
                </div>
            </div>
        `;
        
        modalBody.innerHTML = detailsHTML;
        
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        let timeAgo;
        if (diffInHours < 1) {
            timeAgo = 'just now';
        } else if (diffInHours < 24) {
            timeAgo = diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
        } else {
            timeAgo = diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
        }
        
        const formattedDate = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
        
        return `Reported ${timeAgo} - ${formattedDate}`;
    }

    renderReports() {
        const reportsList = document.getElementById('reportsList');
        if (!reportsList) {
            console.error('Element with ID "reportsList" not found!');
            return;
        }
        
        if (this.reports.length === 0) {
            reportsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>No reports found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;
            return;
        }
        
        reportsList.innerHTML = this.reports.map(report => this.createReportCard(report)).join('');
    }

    createReportCard(report) {
        const timeAgo = this.formatDate(report.createdAt || report.reportedDate || report.date);
        const statusText = this.getStatusText(report.status);
        
        // Use backend image endpoint if available
        const imageUrl = `https://city-fix-backend.onrender.com/api/reports/${report._id || report.id}/image`;
        return `
            <div class="report-card" data-type="${report.type?.id || report.typeId || ''}" data-district="${report.district?.id || report.districtId || ''}" data-status="${report.status}" data-id="${report.id}">
                <div class="report-image">
                    <img src="${imageUrl}" alt="${report.title}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" loading="lazy" onerror="this.src='assets/reports-icon.svg'">
                </div>
                <div class="report-content">
                    <div class="report-header">
                        <h3>${report.title || 'Untitled Report'}</h3>
                        <div class="report-priority ${report.priority || 'medium'}">${statusText}</div>
                    </div>
                    <p class="location">${report.location || 'Unknown location'}</p>
                    <div class="status-section">
                        <p class="time">${timeAgo}</p>
                        <span class="similar-count">${report.similarCount || 0} similar reports</span>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'in-progress': 'In Progress',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'pending': 'Pending',
            'open': 'Open',
            'closed': 'Closed'
        };
        return statusMap[status] || status || 'Unknown';
    }

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Modal and event handling (unchanged)
    createReportModal() {
        const modalHTML = `
            <div id="reportModal" class="report-modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Report Details</h2>
                        <button class="modal-close" id="closeModal">&times;</button>
                    </div>
                    <div class="modal-body" id="modalBody"></div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="closeModalBtn">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addModalStyles();
        this.setupModalEventListeners();
    }

    addModalStyles() {
        const styles = `
            <style>
                .report-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(5px);
                }
                
                .modal-content {
                    position: relative;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow: hidden;
                    transform: scale(0.9);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                
                .report-modal.show .modal-content {
                    transform: scale(1);
                    opacity: 1;
                }
                
                .modal-header {
                    padding: 20px 25px 15px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .modal-header h2 {
                    margin: 0;
                    font-size: 1.4rem;
                    font-weight: 600;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: white;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                
                .modal-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .modal-body {
                    padding: 25px;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                
                .modal-loading {
                    text-align: center;
                    padding: 40px 20px;
                }
                
                .report-detail-grid {
                    display: grid;
                    gap: 20px;
                }
                
                .detail-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                }
                
                .detail-icon {
                    width: 24px;
                    height: 24px;
                    background: #667eea;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                
                .detail-content {
                    flex: 1;
                }
                
                .detail-label {
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 4px;
                    font-size: 0.9rem;
                }
                
                .detail-value {
                    color: #666;
                    line-height: 1.4;
                }
                
                .status-badge, .priority-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .status-pending {
                    background: #fff3cd;
                    color: #856404;
                }
                
                .status-in-progress {
                    background: #d1ecf1;
                    color: #0c5460;
                }
                
                .status-resolved {
                    background: #d4edda;
                    color: #155724;
                }
                
                .priority-high {
                    background: #f8d7da;
                    color: #721c24;
                }
                
                .priority-medium {
                    background: #fff3cd;
                    color: #856404;
                }
                
                .priority-low {
                    background: #d1ecf1;
                    color: #0c5460;
                }
                
                .modal-footer {
                    padding: 15px 25px;
                    border-top: 1px solid #eee;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    background: #f8f9fa;
                }
                
                .btn-secondary {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                    background: #6c757d;
                    color: white;
                }
                
                .btn-secondary:hover {
                    background: #5a6268;
                }
                
                .loading-container, .error-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                    grid-column: 1 / -1;
                }
                
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .retry-btn {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-top: 16px;
                    font-weight: 600;
                }
                
                .retry-btn:hover {
                    background: #5a6fd8;
                }
                
                .error-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    display: block;
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @media (max-width: 768px) {
                    .modal-content {
                        width: 95%;
                        margin: 10px;
                    }
                    
                    .modal-header, .modal-body, .modal-footer {
                        padding: 15px 20px;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupModalEventListeners() {
        const modal = document.getElementById('reportModal');
        const closeBtn = document.getElementById('closeModal');
        const closeBtnFooter = document.getElementById('closeModalBtn');
        const overlay = modal.querySelector('.modal-overlay');
        
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        closeBtnFooter.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                closeModal();
            }
        });
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const reportCard = e.target.closest('.report-card');
            if (reportCard && !e.target.closest('.report-priority')) {
                const reportId = parseInt(reportCard.dataset.id);
                this.viewReportDetails(reportId);
            }
        });

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.filterAndSortReports();
                }, 500);
            });
        }

        const sortButtons = document.querySelectorAll('.sort-btn');
        sortButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sortButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentFilters.sort = btn.dataset.sort;
                this.filterAndSortReports();
            });
        });

        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', async () => {
                if (this.currentPage > 1 && !this.isLoading) {
                    this.currentPage--;
                    await this.loadReports();
                    this.updatePagination();
                    this.scrollToTop();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', async () => {
                const maxPages = Math.ceil(this.totalReports / this.itemsPerPage);
                if (this.currentPage < maxPages && !this.isLoading) {
                    this.currentPage++;
                    await this.loadReports();
                    this.updatePagination();
                    this.scrollToTop();
                }
            });
        }

        const dropdowns = document.querySelectorAll('.filter-dropdown');
        dropdowns.forEach(dropdown => {
            const btn = dropdown.querySelector('.filter-btn');
            
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.closeAllDropdowns();
                    dropdown.classList.toggle('active');
                });
            }
        });

        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });
    }

    closeAllDropdowns() {
        document.querySelectorAll('.filter-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }

    updatePagination() {
        const maxPages = Math.ceil(this.totalReports / this.itemsPerPage);
        
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageLinks = document.querySelectorAll('[data-page]');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
            prevBtn.style.opacity = this.currentPage === 1 ? '0.5' : '1';
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === maxPages || maxPages === 0;
            nextBtn.style.opacity = (this.currentPage === maxPages || maxPages === 0) ? '0.5' : '1';
        }
        
        pageLinks.forEach(link => {
            const page = parseInt(link.dataset.page);
            link.classList.toggle('active', page === this.currentPage);
            link.style.display = page <= maxPages ? 'flex' : 'none';
        });
        
        this.updateURL();
    }

    updateURL() {
        const params = new URLSearchParams();
        
        if (this.currentFilters.type !== 'all') params.set('type', this.currentFilters.type);
        if (this.currentFilters.district !== 'all') params.set('district', this.currentFilters.district);
        if (this.currentFilters.sort !== 'newest') params.set('sort', this.currentFilters.sort);
        if (this.currentFilters.search) params.set('search', this.currentFilters.search);
        if (this.currentPage > 1) params.set('page', this.currentPage);
        
        const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', newURL);
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        this.currentFilters.type = params.get('type') || 'all';
        this.currentFilters.district = params.get('district') || 'all';
        this.currentFilters.sort = params.get('sort') || 'newest';
        this.currentFilters.search = params.get('search') || '';
        this.currentPage = parseInt(params.get('page')) || 1;
    }

    setupMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navSection = document.querySelector('.nav-section');
        
        if (mobileMenuBtn && navSection) {
            mobileMenuBtn.addEventListener('click', () => {
                navSection.classList.toggle('active');
                mobileMenuBtn.classList.toggle('active');
            });
        }
    }
    
    updateResponsiveLayout() {
        const width = window.innerWidth;
        
        if (width <= 480) {
            this.itemsPerPage = 3;
        } else if (width <= 768) {
            this.itemsPerPage = 4;
        } else if (width <= 1024) {
            this.itemsPerPage = 6;
        } else {
            this.itemsPerPage = 6;
        }
    }
    
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    window.browseReports = new BrowseReports();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrowseReports, ApiService };
}

// Global test function for sort buttons (for debugging)
window.testSortButtons = function() {
    console.log('🧪 Testing sort buttons...');
    const buttons = document.querySelectorAll('.sort-btn');
    console.log('Found buttons:', buttons.length);
    
    buttons.forEach((btn, i) => {
        console.log(`Button ${i + 1}: "${btn.textContent.trim()}" with data-sort="${btn.getAttribute('data-sort')}"`);
    });
    
    if (buttons.length > 0) {
        console.log('🔍 Testing click on first button...');
        buttons[0].click();
    }
};