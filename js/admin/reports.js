// CityFix Reports Management - Backend Ready

// 🔧 API Configuration - Change this to your server URL
const API_CONFIG = {
    BASE_URL: 'https://city-fix-backend.onrender.com/api',
    ENDPOINTS: {
        REPORTS: '/reports/getAllreports',
        DELETE_REPORT: '/reports/:id',
        DISTRICTS: '/districts',
        REPORT_TYPES: '/report-types'
    }
};

// Global Variables
let reportsData = [];
let filteredReports = [];
let currentPage = 1;
const itemsPerPage = 10;
let isLoading = false;

// DOM Elements
const reportsTableBody = document.querySelector('.reports-table tbody');
const searchInput = document.getElementById('searchInput');
const issueTypeFilter = document.getElementById('issueTypeFilter');
const districtFilter = document.getElementById('districtFilter');
const statusFilter = document.getElementById('statusFilter');
const dateFromInput = document.getElementById('dateFromInput');
const exportBtn = document.querySelector('.export-btn');
const filterBtn = document.querySelector('.filter-btn');
const paginationInfo = document.querySelector('.pagination-info span');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// 🔄 API Functions
async function makeApiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            // Add Authentication token if required
            // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    };

    const config = { ...defaultOptions, ...options };

    try {
        console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ API Response:', data);
        
        return data;
    } catch (error) {
        console.error('❌ API Error:', error);
        handleApiError(error);
        throw error;
    }
}

function handleApiError(error) {
    let message = 'An unexpected error occurred';
    
    if (error.message.includes('Failed to fetch')) {
        message = 'Failed to connect to server. Make sure the server is running.';
    } else if (error.message.includes('404')) {
        message = 'Requested data not found.';
    } else if (error.message.includes('401')) {
        message = 'Unauthorized access. Please login again.';
    } else if (error.message.includes('500')) {
        message = 'Server error. Please try again later.';
    }
    
    showNotification(message, 'error');
}

// 🔃 Loading Functions
function showLoading() {
    if (isLoading) return;
    isLoading = true;
    
    // Show loading in table
    if (reportsTableBody) {
        reportsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div class="loading-container">
                        <div class="spinner"></div>
                        <div style="margin-top: 15px; color: #666;">Loading reports...</div>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hideLoading() {
    isLoading = false;
}

// 📡 Load Reports from Backend
async function loadReports() {
    try {
        showLoading();
        console.log('🔄 Loading reports with filters...');

        // Collect filter parameters
        const filters = {
            search: searchInput?.value?.trim() || '',
            type: issueTypeFilter?.value || '',
            district: districtFilter?.value || '',
            status: statusFilter?.value || '',
            dateFrom: dateFromInput?.value || '',
            page: currentPage,
            limit: itemsPerPage
        };

        console.log('🔍 Active filters:', filters);

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key] || filters[key] === '') delete filters[key];
        });

        // Build query string
        const queryParams = new URLSearchParams(filters);
        const endpoint = `${API_CONFIG.ENDPOINTS.REPORTS}?${queryParams.toString()}`;
        console.log('📡 API endpoint:', endpoint);

        // Make API call
        const response = await makeApiRequest(endpoint);
        reportsData = response.data || response.reports || response;
        console.log('📦 Received reports:', reportsData.length);

        // Apply frontend filters as backup
        filteredReports = [...reportsData];

        // --- Search filter on frontend ---
        const searchTerm = searchInput?.value?.trim().toLowerCase() || '';
        if (searchTerm) {
            console.log('🔍 Applying search filter for:', searchTerm);
            filteredReports = filteredReports.filter(report => {
                // Enhanced search including report ID as primary search target
                const reportId = (report._id || report.id || '').toLowerCase();
                const issueType = (report.issueType || report.type || '').toLowerCase();
                const description = (report.description || '').toLowerCase();
                const title = (report.title || '').toLowerCase();
                const address = (report.location?.address || '').toLowerCase();
                
                // Check if search term matches report ID exactly (priority)
                if (reportId.includes(searchTerm)) {
                    console.log('🎯 Found exact ID match:', reportId);
                    return true;
                }
                
                // Check other fields
                const searchableText = [issueType, description, title, address].join(' ');
                const matches = searchableText.includes(searchTerm);
                
                if (matches) {
                    console.log('📝 Found text match in:', { reportId, matchedText: searchableText });
                }
                
                return matches;
            });
            console.log('📊 Search results:', filteredReports.length);
        }

        // --- Issue type filter on frontend ---
        let issueTypeFilterValue = issueTypeFilter?.value || '';
        if (issueTypeFilterValue) {
            console.log('🏷️ Applying issue type filter:', issueTypeFilterValue);
            filteredReports = filteredReports.filter(r => {
                // Normalize possible field names
                let type = r.issueType || r.type || r.category || '';
                const match = type.toLowerCase() === issueTypeFilterValue.toLowerCase();
                return match;
            });
            console.log('📊 Issue type filter results:', filteredReports.length);
        }

        // --- Status filter on frontend ---
        let statusFilterValue = statusFilter?.value || '';
        if (statusFilterValue) {
            console.log('📋 Applying status filter:', statusFilterValue);
            filteredReports = filteredReports.filter(r => {
                let status = r.status;
                if (status === 'progress') status = 'in-progress';
                const match = status === statusFilterValue;
                return match;
            });
            console.log('📊 Status filter results:', filteredReports.length);
        }

        // --- Date filter on frontend ---
        let dateFromValue = dateFromInput?.value || '';
        if (dateFromValue) {
            console.log('📅 Applying date filter for exact date:', dateFromValue);
            console.log('📅 Before date filter - total reports:', filteredReports.length);
            
            filteredReports = filteredReports.filter(r => {
                if (!r.createdAt) {
                    console.log('⚠️ Report missing createdAt:', r._id);
                    return false;
                }
                
                const reportDate = new Date(r.createdAt);
                const filterDate = new Date(dateFromValue);
                
                // Get dates without time (set to midnight for comparison)
                const reportDateOnly = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
                const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
                
                // Show only reports from the EXACT selected date
                const match = reportDateOnly.getTime() === filterDateOnly.getTime();
                
                if (match) {
                    console.log('📅 Exact date match found:', {
                        reportId: r._id,
                        reportDate: reportDateOnly.toISOString().split('T')[0],
                        filterDate: filterDateOnly.toISOString().split('T')[0]
                    });
                }
                
                return match;
            });
            console.log('📊 Exact date filter results:', filteredReports.length);
        } else {
            console.log('📅 No date filter applied');
        }

        console.log('✅ Final filtered results:', filteredReports.length);

        // Update pagination if backend provides it
        if (response.pagination) {
            updatePaginationFromBackend(response.pagination);
        }

        // Hide filter status when done
        if (!hasActiveFilters()) {
            hideFilterStatus();
        }

        // Render table
        renderReportsTable();

    } catch (error) {
        console.error('❌ Error loading reports:', error);
        showErrorInTable('Failed to load reports');
        hideFilterStatus();
    } finally {
        hideLoading();
    }
}

// 📊 Load Dropdown Options from Backend
async function loadDropdownOptions() {
    try {
        // Load report types for filter
        // Use static options to match SubmitReport.html
        const staticReportTypes = [
            { id: 'pothole', name: 'Pothole' },
            { id: 'streetlight', name: 'Street Light' },
            { id: 'drainage', name: 'Drainage Issue' },
            { id: 'garbage', name: 'Garbage Collection' },
            { id: 'traffic', name: 'Traffic Signal' },
            { id: 'sidewalk', name: 'Sidewalk Damage' },
            { id: 'graffiti', name: 'Graffiti' },
            { id: 'noise', name: 'Noise Complaint' },
            { id: 'abandoned_vehicle', name: 'Abandoned Vehicle' },
            { id: 'water_leak', name: 'Water Leak' },
            { id: 'park_maintenance', name: 'Park Maintenance' },
            { id: 'other', name: 'Other' }
        ];
        populateDropdown(issueTypeFilter, staticReportTypes, 'id', 'name', 'All Issue Types');

    } catch (error) {
        console.error('Error loading dropdown options:', error);
        // Continue with default options if API fails
    }
}

function populateDropdown(selectElement, options, valueField, textField, defaultText) {
    if (!selectElement || !options) return;

    // Clear existing options except the default one
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;

    // Add options from backend
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option[valueField];
        optionElement.textContent = option[textField];
        selectElement.appendChild(optionElement);
    });
}

// 🎨 Render Reports Table
function renderReportsTable() {
    if (!reportsTableBody) return;

    reportsTableBody.innerHTML = '';

    if (!filteredReports || filteredReports.length === 0) {
        showEmptyState();
        return;
    }

    filteredReports.forEach(report => {
        const row = createReportRow(report);
        reportsTableBody.appendChild(row);
    });

    updatePaginationInfo();
}

function createReportRow(report) {
    const row = document.createElement('tr');
    row.classList.add('report-row');
    row.setAttribute('data-report-id', report._id);

    row.innerHTML = `
        <td class="report-id">${report._id}</td>
        <td class="report-title">
            <img src="http://localhost:5000/api/reports/${report._id}/image" alt="Report Image" style="width:32px;height:32px;border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:8px;">
            ${report.title || ''}
        </td>
        <td class="report-location">${report.location ? (report.location.lat + ', ' + report.location.lng) : ''}</td>
        <td class="report-type">${report.issueType || ''}</td>
        <td>
            <span class="status-badge ${getStatusBadgeClass(report.status)}">
                ${getStatusDisplayText(report.status)}
            </span>
        </td>
        <td class="report-date">${formatDate(report.createdAt)}</td>
        <td class="actions-cell">
            <button class="action-menu-btn" onclick="showActionMenu(event, '${report._id}')">
                <span class="dots-icon">⋮</span>
            </button>
        </td>
    `;

    // Add click event to navigate to details (except actions cell)
    row.addEventListener('click', (e) => {
        if (!e.target.closest('.actions-cell')) {
            navigateToReportDetails(report);
        }
    });

    // Add hover effects
    row.addEventListener('mouseenter', () => {
        row.style.backgroundColor = '#f8f9fa';
        row.style.cursor = 'pointer';
    });

    row.addEventListener('mouseleave', () => {
        row.style.backgroundColor = '';
    });

    return row;
}

// 🗺️ Navigate to Report Details
function navigateToReportDetails(report) {
    // Always use _id for navigation
    const reportId = report._id;
    window.location.href = `ReportsDetails.html?id=${reportId}`;
}

// 🎯 Status Helper Functions
function getStatusBadgeClass(status) {
    // Normalize status
    if (status === 'progress') status = 'in-progress';
    const statusClasses = {
        'new': 'status-new',
        'in-progress': 'status-progress',
        'pending': 'status-pending',
        'resolved': 'status-resolved',
        'closed': 'status-closed'
    };
    return statusClasses[status] || 'status-new';
}

function getStatusDisplayText(status) {
    // Normalize status
    if (status === 'progress') status = 'in-progress';
    const statusTexts = {
        'new': 'New',
        'in-progress': 'In Progress',
        'pending': 'Pending',
        'resolved': 'Resolved',
        'closed': 'Closed'
    };
    return statusTexts[status] || 'New';
}

// 📅 Date Formatting
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
}

// 🗑️ Delete Report
async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
        showLoading();
        
        const endpoint = API_CONFIG.ENDPOINTS.DELETE_REPORT.replace(':id', reportId);
        await makeApiRequest(endpoint, { method: 'DELETE' });
        
        // Reload reports after successful deletion
        await loadReports();
        
        showNotification('Report deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting report:', error);
        // Error already handled in handleApiError
    } finally {
        hideLoading();
    }
}

// 📤 Export Reports
async function exportReports() {
    try {
        showLoading();
        
        // Get all reports for export (without pagination)
        const filters = {
            search: searchInput?.value || '',
            type: issueTypeFilter?.value || '',
            district: districtFilter?.value || '',
            status: statusFilter?.value || '',
            dateFrom: dateFromInput?.value || '',
            export: true // Flag for backend to return all results
        };

        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        const queryParams = new URLSearchParams(filters);
        const endpoint = `${API_CONFIG.ENDPOINTS.REPORTS}?${queryParams.toString()}`;
        
        const response = await makeApiRequest(endpoint);
        const reports = response.data || response.reports || response;

        downloadCsvFile(reports);
        showNotification('Reports exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting reports:', error);
        // Error already handled in handleApiError
    } finally {
        hideLoading();
    }
}

function downloadCsvFile(reports) {
    const headers = ['ID', 'Title', 'Location', 'Type', 'Status', 'Date'];
    const csvContent = [
        headers.join(','),
        ...reports.map(report => [
            report.id || report.reportId,
            `"${report.title}"`,
            `"${report.location || report.address}"`,
            report.type || report.category,
            report.status,
            formatDate(report.createdAt || report.date)
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cityfix-reports-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// 🔍 Search and Filter Functions
function applyFilters() {
    // Show filter status indicator
    showFilterStatus();
    
    // Reset to first page when filtering
    currentPage = 1;
    // Load from backend with new filters
    loadReports();
}

// Clear all filters
function clearAllFilters() {
    console.log('🧹 Clearing all filters...');
    
    // Clear all filter inputs
    if (searchInput) searchInput.value = '';
    if (issueTypeFilter) issueTypeFilter.value = '';
    if (districtFilter) districtFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (dateFromInput) dateFromInput.value = '';
    
    // Hide filter status
    hideFilterStatus();
    
    // Reset to first page and reload
    currentPage = 1;
    loadReports();
    
    showNotification('All filters cleared!', 'info');
}

// Show filter status indicator
function showFilterStatus() {
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.style.display = 'block';
        filterStatus.innerHTML = '<span class="filter-status-text">🔍 Filtering results...</span>';
    }
}

// Hide filter status indicator
function hideFilterStatus() {
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.style.display = 'none';
    }
}

// Check if any filters are active
function hasActiveFilters() {
    return (searchInput?.value?.trim() || '') !== '' ||
           (issueTypeFilter?.value || '') !== '' ||
           (districtFilter?.value || '') !== '' ||
           (statusFilter?.value || '') !== '' ||
           (dateFromInput?.value || '') !== '';
}

// Debounce function to avoid too many API calls while typing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 📄 Pagination Functions
function updatePaginationInfo() {
    if (!paginationInfo) return;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredReports.length);
    const totalItems = filteredReports.length;

    paginationInfo.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} entries`;

    // Update pagination buttons
    updatePaginationButtons();
}

function updatePaginationFromBackend(pagination) {
    if (pagination.total) {
        const totalItems = pagination.total;
        const startItem = ((pagination.page || currentPage) - 1) * itemsPerPage + 1;
        const endItem = Math.min((pagination.page || currentPage) * itemsPerPage, totalItems);
        
        if (paginationInfo) {
            paginationInfo.textContent = `Showing ${startItem} to ${endItem} of ${totalItems} entries`;
        }
    }
    updatePaginationButtons();
}

function updatePaginationButtons() {
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
    }
    
    if (nextBtn) {
        const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.style.opacity = currentPage >= totalPages ? '0.5' : '1';
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadReports();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        loadReports();
    }
}

// 📱 UI Helper Functions
function showEmptyState() {
    reportsTableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: #6c757d;">
                <div>
                    <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">No reports found</div>
                    <div style="font-size: 14px;">Try adjusting your filters or search terms</div>
                </div>
            </td>
        </tr>
    `;
}

function showErrorInTable(message) {
    reportsTableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: #dc3545;">
                <div>
                    <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">${message}</div>
                    <button onclick="loadReports()" 
                            style="background: #007bff; color: white; border: none; 
                                   padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function showNotification(message, type = 'info') {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#007bff',
        warning: '#ffc107'
    };

    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="background: ${colors[type]}; color: white; padding: 12px 20px; 
                    border-radius: 8px; position: fixed; top: 20px; right: 20px; 
                    z-index: 1001; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease;">
            <span style="margin-right: 10px;">${type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
            ${message}
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; 
                           float: right; cursor: pointer; font-size: 18px; margin-left: 10px;">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// 🎭 Action Menu Functions
function showActionMenu(event, reportId) {
    event.stopPropagation();
    
    const existingMenu = document.querySelector('.action-menu');
    if (existingMenu) existingMenu.remove();
    
    const actionMenu = document.createElement('div');
    actionMenu.className = 'action-menu';
    actionMenu.innerHTML = `
        <div class="action-menu-item" onclick="viewReport('${reportId}')">View Details</div>
        <div class="action-menu-item" onclick="deleteReport('${reportId}')">Delete</div>
    `;
    
    const rect = event.target.getBoundingClientRect();
    actionMenu.style.position = 'fixed';
    actionMenu.style.top = `${rect.bottom + 5}px`;
    actionMenu.style.left = `${rect.left - 100}px`;
    actionMenu.style.background = 'white';
    actionMenu.style.border = '1px solid #ddd';
    actionMenu.style.borderRadius = '4px';
    actionMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    actionMenu.style.zIndex = '1000';
    actionMenu.style.minWidth = '120px';
    
    document.body.appendChild(actionMenu);
    
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            actionMenu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

function viewReport(reportId) {
    window.location.href = `ReportsDetails.html?id=${reportId}`;
}

function editReport(reportId) {
    // Implement edit functionality
    console.log('Edit report:', reportId);
}

function assignReport(reportId) {
    // Implement assign functionality
    console.log('Assign report:', reportId);
}

// 🔧 Sidebar Functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

function setActive(element) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    element.classList.add('active');
    
    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}

// 🚀 Initialize Application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing CityFix Reports Management');

    // Add CSS for loading spinner and notifications
    addRequiredStyles();
    
    // Load dropdown options from backend
    await loadDropdownOptions();
    
    // Load initial reports
    await loadReports();

    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Application initialized successfully');
});

function setupEventListeners() {
    console.log('🔧 Setting up filter event listeners...');
    
    // Check which filter elements exist
    console.log('🔍 Filter elements found:', {
        searchInput: !!searchInput,
        issueTypeFilter: !!issueTypeFilter,
        districtFilter: !!districtFilter,
        statusFilter: !!statusFilter,
        dateFromInput: !!dateFromInput,
        exportBtn: !!exportBtn,
        filterBtn: !!filterBtn,
        clearFiltersBtn: !!document.getElementById('clearFiltersBtn')
    });
    
    // Search with debounce to avoid too many API calls
    if (searchInput) {
        console.log('✅ Setting up search input listener');
        searchInput.addEventListener('input', debounce(() => {
            console.log('🔍 Search input changed:', searchInput.value);
            applyFilters();
        }, 500));
    } else {
        console.warn('⚠️ Search input element not found');
    }
    
    // Filter changes
    [issueTypeFilter, districtFilter, statusFilter, dateFromInput].forEach((filter, index) => {
        const filterNames = ['issueType', 'district', 'status', 'dateFrom'];
        if (filter) {
            console.log(`✅ Setting up ${filterNames[index]} filter listener`);
            filter.addEventListener('change', () => {
                console.log(`🎯 ${filterNames[index]} filter changed:`, filter.value);
                applyFilters();
            });
        } else {
            console.warn(`⚠️ ${filterNames[index]} filter element not found`);
        }
    });
    
    // Export button
    if (exportBtn) {
        console.log('✅ Setting up export button listener');
        exportBtn.addEventListener('click', exportReports);
    }
    
    // Filter button
    if (filterBtn) {
        console.log('✅ Setting up filter button listener');
        filterBtn.addEventListener('click', function() {
            console.log('🎯 Filter button clicked');
            applyFilters();
        });
    }
    
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        console.log('✅ Setting up clear filters button listener');
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    // Pagination buttons
    if (prevBtn) {
        console.log('✅ Setting up previous button listener');
        prevBtn.addEventListener('click', previousPage);
    }
    if (nextBtn) {
        console.log('✅ Setting up next button listener');
        nextBtn.addEventListener('click', nextPage);
    }
    
    // Navigation items - Only handle visual feedback for current page
    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href');
        
        // Only add click handler for items without real hrefs (like settings)
        if (!href || href === '#') {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                setActive(this);
            });
        }
        // For real navigation links, let the browser handle naturally
    });
    
    console.log('🎉 All event listeners setup complete!');
    
    // Mobile responsive
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.querySelector('.hamburger-btn');
        
        if (sidebar && !sidebar.contains(e.target) && !hamburger?.contains(e.target)) {
            closeSidebar();
        }
    });
}

function addRequiredStyles() {
    const styles = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        .action-menu {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            z-index: 1000;
        }
        
        .action-menu-item {
            padding: 12px 16px;
            cursor: pointer;
            font-size: 14px;
            color: #495057;
            border-bottom: 1px solid #f1f3f4;
            transition: background-color 0.2s ease;
        }
        
        .action-menu-item:last-child {
            border-bottom: none;
        }
        
        .action-menu-item:hover {
            background-color: #f8f9fa;
            color: #2c3e50;
        }
        
        .report-row {
            transition: background-color 0.2s ease;
        }
        
        .report-row:hover {
            background-color: #f8f9fa !important;
            cursor: pointer;
        }
        
        .action-menu-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            color: #6c757d;
            font-size: 16px;
            line-height: 1;
        }
        
        .action-menu-btn:hover {
            background-color: #f8f9fa;
            color: #495057;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

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

// Initialize profile dropdown when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeProfileDropdown();
});