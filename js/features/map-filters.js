// Map filter functionality for homepage
// Handles filtering of map markers by date range and issue type

class MapFilters {
    constructor() {
        this.googleMapsController = null;
        this.allReports = [];
        this.filteredReports = [];
        this.isInitialized = false;
        
        // Wait a bit longer for everything to load
        setTimeout(() => this.initializeFilters(), 2000);
    }

    initializeFilters() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        console.log('[MapFilters] Setting up event listeners...');
        
        // Apply filters button
        const applyBtn = document.getElementById('applyFiltersBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                console.log('[MapFilters] Apply filters button clicked');
                this.applyFilters();
            });
            console.log('[MapFilters] Apply button listener added');
        } else {
            console.warn('[MapFilters] Apply button not found');
        }

        // Clear filters button
        const clearBtn = document.getElementById('clearFiltersBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                console.log('[MapFilters] Clear filters button clicked');
                this.clearFilters();
            });
            console.log('[MapFilters] Clear button listener added');
        } else {
            console.warn('[MapFilters] Clear button not found');
        }

        // Auto-apply filters on checkbox change
        const checkboxes = document.querySelectorAll('input[name="issue-type"]');
        console.log(`[MapFilters] Found ${checkboxes.length} checkboxes`);
        checkboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', () => {
                console.log(`[MapFilters] Checkbox ${checkbox.value} changed to ${checkbox.checked}`);
                setTimeout(() => this.applyFilters(), 100);
            });
        });

        // Auto-apply filters on date change
        const dateInputs = document.querySelectorAll('.date-input');
        console.log(`[MapFilters] Found ${dateInputs.length} date inputs`);
        dateInputs.forEach((input, index) => {
            input.addEventListener('change', () => {
                console.log(`[MapFilters] Date input ${input.id} changed to ${input.value}`);
                setTimeout(() => this.applyFilters(), 100);
            });
        });

        console.log('[MapFilters] Event listeners set up successfully');
    }

    // Set reference to Google Maps controller
    setMapController(controller) {
        this.googleMapsController = controller;
        this.isInitialized = true;
        console.log('[MapFilters] Map controller reference set');
    }

    // Store all reports data
    setReportsData(reports) {
        this.allReports = reports;
        this.filteredReports = [...reports]; // Initially show all
        console.log(`[MapFilters] Reports data set: ${reports.length} reports`);
    }

    // Get current filter values
    getFilterValues() {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        
        const selectedTypes = [];
        const checkboxes = document.querySelectorAll('input[name="issue-type"]:checked');
        checkboxes.forEach(checkbox => {
            selectedTypes.push(checkbox.value);
        });

        console.log('[MapFilters] Current filter values:', {
            startDate,
            endDate,
            selectedTypes,
            totalCheckboxes: document.querySelectorAll('input[name="issue-type"]').length,
            checkedCheckboxes: checkboxes.length
        });

        return {
            startDate: startDate || null,
            endDate: endDate || null,
            issueTypes: selectedTypes
        };
    }

    // Apply filters to reports
    applyFilters() {
        console.log('[MapFilters] === APPLYING FILTERS ===');
        
        if (!this.isInitialized || !this.googleMapsController) {
            console.warn('[MapFilters] Map controller not available yet, retrying in 1 second...');
            setTimeout(() => this.applyFilters(), 1000);
            return;
        }

        if (this.allReports.length === 0) {
            console.warn('[MapFilters] No reports data available yet');
            return;
        }

        const filters = this.getFilterValues();
        console.log('[MapFilters] Applying filters:', filters);

        // Filter reports based on criteria
        this.filteredReports = this.allReports.filter(report => {
            let passed = true;
            
            // Date filtering
            if (filters.startDate || filters.endDate) {
                const reportDate = new Date(report.createdAt);
                console.log(`[MapFilters] Checking date for report ${report._id}: ${reportDate}`);
                
                if (filters.startDate) {
                    const startDate = new Date(filters.startDate);
                    if (reportDate < startDate) {
                        console.log(`[MapFilters] Report ${report._id} filtered out by start date`);
                        passed = false;
                    }
                }
                
                if (filters.endDate && passed) {
                    const endDate = new Date(filters.endDate);
                    endDate.setHours(23, 59, 59, 999); // Include the entire end date
                    if (reportDate > endDate) {
                        console.log(`[MapFilters] Report ${report._id} filtered out by end date`);
                        passed = false;
                    }
                }
            }

            // Issue type filtering
            if (filters.issueTypes.length > 0 && passed) {
                const reportType = (report.issueType || '').toLowerCase();
                const matchesType = filters.issueTypes.some(type => 
                    type.toLowerCase() === reportType
                );
                if (!matchesType) {
                    console.log(`[MapFilters] Report ${report._id} filtered out by issue type: ${reportType} not in [${filters.issueTypes.join(', ')}]`);
                    passed = false;
                }
            }

            return passed;
        });

        console.log(`[MapFilters] Filtered ${this.allReports.length} reports down to ${this.filteredReports.length}`);

        // Update map with filtered results
        this.updateMapMarkers();
    }

    // Clear all filters and show all reports
    clearFilters() {
        console.log('[MapFilters] === CLEARING ALL FILTERS ===');

        // Clear date inputs
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate) {
            startDate.value = '';
            console.log('[MapFilters] Cleared start date');
        }
        if (endDate) {
            endDate.value = '';
            console.log('[MapFilters] Cleared end date');
        }

        // Check all issue type checkboxes
        const checkboxes = document.querySelectorAll('input[name="issue-type"]');
        console.log(`[MapFilters] Checking all ${checkboxes.length} checkboxes`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });

        // Show all reports
        this.filteredReports = [...this.allReports];
        console.log(`[MapFilters] Reset to show all ${this.filteredReports.length} reports`);
        this.updateMapMarkers();
    }

    // Update map markers with filtered data
    updateMapMarkers() {
        if (!this.googleMapsController) {
            console.warn('[MapFilters] Map controller not available');
            return;
        }

        console.log(`[MapFilters] === UPDATING MAP MARKERS ===`);
        console.log(`[MapFilters] Updating map with ${this.filteredReports.length} filtered reports`);

        // Clear existing markers
        this.googleMapsController.clearMarkers();
        console.log('[MapFilters] Cleared existing markers');

        // Add filtered markers
        if (this.filteredReports.length > 0) {
            this.googleMapsController.addMarkersFromReports(this.filteredReports);
            console.log(`[MapFilters] Added ${this.filteredReports.length} markers to map`);
        } else {
            console.log('[MapFilters] No reports match current filters');
        }
    }
}

// Initialize map filters
console.log('[MapFilters] Creating MapFilters instance...');
window.mapFilters = new MapFilters();

// Add debugging functions to window for testing
window.testFilters = function() {
    console.log('[DEBUG] Testing filters manually...');
    if (window.mapFilters) {
        console.log('[DEBUG] All reports:', window.mapFilters.allReports.length);
        console.log('[DEBUG] Filter values:', window.mapFilters.getFilterValues());
        window.mapFilters.applyFilters();
    }
};

window.testClearFilters = function() {
    console.log('[DEBUG] Testing clear filters manually...');
    if (window.mapFilters) {
        window.mapFilters.clearFilters();
    }
};

// Export for use by other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapFilters;
}
