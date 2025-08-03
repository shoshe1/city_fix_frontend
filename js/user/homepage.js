// CityFix Homepage - Backend Ready with Google Maps Integration

// ==========================================
// BACKEND DATA REQUIREMENTS DOCUMENTATION
// ==========================================

/*
REQUIRED BACKEND ENDPOINTS AND RESPONSE FORMATS:

1. GET /api/health
   Response: { "status": "ok", "timestamp": "2025-01-15T10:30:00Z" }

2. GET /api/dashboard/stats
   Response: {
     "success": true,
     "data": {
       "totalReports": 15234,
       "resolved": 12847,
       "inProgress": 2387,
       "resolutionRate": 84,
       "avgResponseTime": "4.2h",
       "weeklyTrend": "+12%"
     }
   }

3. GET /api/reports/markers?startDate=01/01/2025&endDate=01/15/2025&district=downtown&issueTypes=potholes,lighting
   Response: {
     "success": true,
     "data": [
       {
         "id": 1,
         "lat": 32.0853,
         "lng": 34.7818,
         "title": "Broken Streetlight",
         "description": "Street light not working on main road",
         "type": "lighting",
         "status": "new", // new, in-progress, pending, resolved
         "createdAt": "2025-01-15T10:30:00Z",
         "address": "Main St & 5th Ave"
       }
     ]
   }

4. GET /api/districts/stats
   Response: {
     "success": true,
     "data": {
       "downtown": { "name": "Downtown", "reports": 4521, "resolved": 3846, "pending": 675 },
       "north": { "name": "North District", "reports": 2834, "resolved": 2456, "pending": 378 }
     }
   }

5. GET /api/issues/stats
   Response: {
     "success": true,
     "data": {
       "potholes": { "name": "Potholes", "count": 5423, "resolved": 4230, "pending": 1193 },
       "lighting": { "name": "Street Lighting", "count": 3891, "resolved": 3579, "pending": 312 }
     }
   }

ALL ENDPOINTS MUST RETURN REAL DATA - NO FALLBACK DATA IS USED.
IF BACKEND IS NOT AVAILABLE, ERROR MESSAGES WILL BE SHOWN.
*/
const API_CONFIG = {
    BASE_URL: 'https://city-fix-backend.onrender.com/api', // Updated to match your backend
    ENDPOINTS: {
        DASHBOARD_STATS: '/dashboard/stats',
        RECENT_REPORTS: '/reports/recent',
        REPORTS: '/reports',
        REPORTS_BY_LOCATION: '/reports/location',
        DISTRICT_STATS: '/districts/stats',
        ISSUE_TYPE_STATS: '/issues/stats',
        MAP_MARKERS: '/reports/markers',
        ALL_REPORTS: '/reports/getAllreports', // Your specific endpoint
        SUBMIT_REPORT: '/reports',
        HEALTH: '/health'
    }
};

// 🗺️ Google Maps Configuration
const GOOGLE_MAPS_CONFIG = {
    API_KEY: 'AIzaSyC6jZx_eYnWWpBMMGEIVdNwmlNgWbfDqtM', // Your API key
    DEFAULT_CENTER: { lat: 32.0853, lng: 34.7818 }, // Rosh HaAyin coordinates
    DEFAULT_ZOOM: 13,
    MAP_STYLES: [
        {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [{"visibility": "off"}]
        },
        {
            "featureType": "transit",
            "elementType": "labels",
            "stylers": [{"visibility": "off"}]
        }
    ]
};

// 🌍 Global State Management
const AppState = {
    currentUser: null,
    dashboardStats: {
        totalReports: 15234,
        resolved: 12847,
        inProgress: 2387
    },
    recentReports: [],
    mapMarkers: [],
    isLoading: false,
    notifications: [],
    lastUpdate: null,
    googleMap: null,
    markersArray: [],
    backendAvailable: false
};

// Global variables for filters
let isFilterApplied = false;
let currentFilters = {
    startDate: '',
    endDate: '',
    district: '',
    issueTypes: ['potholes', 'lighting', 'drainage']
};

// 🔄 API Service Class
class ApiService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.backendAvailable = false;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // Add Authentication token if required
                // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            // Add mode for CORS
            mode: 'cors'
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
            
            this.backendAvailable = true;
            AppState.backendAvailable = true;
            
            return data;
        } catch (error) {
            console.error('❌ Backend connection failed:', error.message);
            this.backendAvailable = false;
            AppState.backendAvailable = false;
            
            // Don't return fallback data - let the caller handle the error
            throw error;
        }
    }

    getFallbackData(endpoint) {
        console.log('📊 Using fallback data for:', endpoint);
        
        // Enhanced fallback data
        const fallbackData = {
            '/dashboard/stats': {
                success: true,
                data: {
                    totalReports: 15234,
                    resolved: 12847,
                    inProgress: 2387,
                    resolutionRate: 84,
                    avgResponseTime: '4.2h',
                    weeklyTrend: '+12%'
                }
            },
            '/reports/markers': {
                success: true,
                data: [
                    {
                        id: 1,
                        lat: 32.0853,
                        lng: 34.7818,
                        title: 'Broken Streetlight',
                        description: 'Street light not working on main road',
                        type: 'lighting',
                        status: 'new',
                        createdAt: '2025-01-15T10:30:00Z',
                        address: 'Main St & 5th Ave'
                    },
                    {
                        id: 2,
                        lat: 32.0863,
                        lng: 34.7828,
                        title: 'Large Pothole',
                        description: 'Dangerous pothole affecting traffic',
                        type: 'potholes',
                        status: 'in-progress',
                        createdAt: '2025-01-15T09:15:00Z',
                        address: 'West End Road'
                    },
                    {
                        id: 3,
                        lat: 32.0843,
                        lng: 34.7808,
                        title: 'Blocked Drain',
                        description: 'Storm drain blocked causing flooding',
                        type: 'drainage',
                        status: 'resolved',
                        createdAt: '2025-01-14T16:45:00Z',
                        address: 'Central Park Area'
                    },
                    {
                        id: 4,
                        lat: 32.0833,
                        lng: 34.7798,
                        title: 'Traffic Light Issue',
                        description: 'Traffic light stuck on red',
                        type: 'lighting',
                        status: 'new',
                        createdAt: '2025-01-15T14:20:00Z',
                        address: 'Downtown Junction'
                    },
                    {
                        id: 5,
                        lat: 32.0873,
                        lng: 34.7838,
                        title: 'Road Surface Damage',
                        description: 'Multiple potholes in residential area',
                        type: 'potholes',
                        status: 'pending',
                        createdAt: '2025-01-15T11:00:00Z',
                        address: 'North District'
                    }
                ]
            },
            '/districts/stats': {
                success: true,
                data: {
                    'downtown': { name: 'Downtown', reports: 4521, resolved: 3846, pending: 675 },
                    'north': { name: 'North District', reports: 2834, resolved: 2456, pending: 378 },
                    'south': { name: 'South District', reports: 3456, resolved: 2987, pending: 469 },
                    'east': { name: 'East District', reports: 2187, resolved: 1834, pending: 353 },
                    'west': { name: 'West District', reports: 2236, resolved: 1724, pending: 512 }
                }
            },
            '/issues/stats': {
                success: true,
                data: {
                    'potholes': { name: 'Potholes', count: 5423, resolved: 4230, pending: 1193 },
                    'lighting': { name: 'Street Lighting', count: 3891, resolved: 3579, pending: 312 },
                    'drainage': { name: 'Drainage Issues', count: 2156, resolved: 1833, pending: 323 },
                    'traffic': { name: 'Traffic Signals', count: 1876, resolved: 1654, pending: 222 },
                    'sidewalk': { name: 'Sidewalk Issues', count: 1888, resolved: 1551, pending: 337 }
                }
            }
        };

        // Check for exact matches first, then try to match patterns
        if (fallbackData[endpoint]) {
            return fallbackData[endpoint];
        }

        // Handle query parameters
        const baseEndpoint = endpoint.split('?')[0];
        if (fallbackData[baseEndpoint]) {
            return fallbackData[baseEndpoint];
        }

        // Default empty response
        return { success: false, data: {}, message: 'No fallback data available' };
    }

    // API Methods
    async getDashboardStats() {
        // Calculate stats from getAllreports endpoint instead of using /dashboard/stats
        try {
            console.log('📊 Calculating stats from all reports...');
            const reportsResponse = await this.request(API_CONFIG.ENDPOINTS.ALL_REPORTS);
            
            // Handle the response (could be direct array or wrapped in data)
            const reports = Array.isArray(reportsResponse) ? reportsResponse : (reportsResponse.data || []);
            
            if (!Array.isArray(reports)) {
                throw new Error('Invalid reports data format');
            }
            
            console.log('📊 Calculating stats from', reports.length, 'reports');
            
            // Calculate stats from reports
            const totalReports = reports.length;
            const resolved = reports.filter(r => r.status === 'resolved').length;
            const inProgress = reports.filter(r => r.status === 'in-progress' || r.status === 'pending').length;
            
            // Calculate average response time for resolved reports
            let avgResponseTime = '0h';
            const resolvedReports = reports.filter(r => r.status === 'resolved' && r.createdAt);
            if (resolvedReports.length > 0) {
                const totalResponseMs = resolvedReports.reduce((sum, r) => {
                    const created = new Date(r.createdAt);
                    const resolved = new Date(r.resolvedAt || r.updatedAt || r.createdAt);
                    return sum + Math.max(0, resolved - created);
                }, 0);
                const avgResponseHours = Math.round(totalResponseMs / (resolvedReports.length * 1000 * 60 * 60));
                avgResponseTime = avgResponseHours + 'h';
            }
            
            const calculatedStats = {
                totalReports,
                resolved,
                inProgress,
                resolutionRate: totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0,
                avgResponseTime,
                weeklyTrend: '+0%' // Could be calculated if you have date filtering
            };
            
            console.log('✅ Calculated stats:', calculatedStats);
            
            return {
                success: true,
                data: calculatedStats
            };
            
        } catch (error) {
            console.error('❌ Error calculating dashboard stats:', error);
            throw error;
        }
    }

    async getMapMarkers(filters = {}) {
        // Use the getAllreports endpoint to fetch all reports
        try {
            console.log('🗺️ Fetching all reports for map markers...');
            const response = await this.request(API_CONFIG.ENDPOINTS.ALL_REPORTS);
            
            // Debug: Log the complete response structure
            console.log('🔍 Full API response structure:', response);
            console.log('🔍 Response type:', typeof response);
            console.log('🔍 Is array?', Array.isArray(response));
            if (response && response.data) {
                console.log('🔍 Response.data type:', typeof response.data);
                console.log('🔍 Response.data is array?', Array.isArray(response.data));
                console.log('🔍 Sample report structure:', response.data[0]);
            }
            if (Array.isArray(response) && response.length > 0) {
                console.log('🔍 Direct array - Sample report structure:', response[0]);
                console.log('🔍 Available fields in first report:', Object.keys(response[0]));
                console.log('🔍 Coordinate fields check:', {
                    latitude: response[0].latitude,
                    longitude: response[0].longitude,
                    lat: response[0].lat,
                    lng: response[0].lng,
                    coords: response[0].coords,
                    location: response[0].location,
                    address: response[0].address,
                    position: response[0].position
                });
            }
            
            // Transform the response to include map marker data
            if (Array.isArray(response)) {
                // Handle direct array response (most likely your case)
                console.log('🔍 Processing direct array response...');
                const markers = response
                    .filter(report => {
                        // Check for coordinates in location object (your DB structure)
                        let lat, lng;
                        
                        if (report.location && typeof report.location === 'object' && 
                            report.location.lat !== undefined && report.location.lng !== undefined) {
                            lat = report.location.lat;
                            lng = report.location.lng;
                        } else {
                            // Fallback to other possible coordinate formats
                            lat = report.latitude || report.lat || report.coords?.lat;
                            lng = report.longitude || report.lng || report.lon || report.coords?.lng;
                        }
                        
                        const hasCoords = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
                        if (!hasCoords) {
                            console.log('⚠️ Report missing coords:', report._id || report.id, {
                                lat, lng, 
                                location: report.location,
                                hasLocationObject: !!report.location,
                                locationLat: report.location?.lat,
                                locationLng: report.location?.lng
                            });
                        }
                        return hasCoords;
                    })
                    .map(report => {
                        // Extract coordinates from location object or fallback
                        let lat, lng;
                        
                        if (report.location && typeof report.location === 'object' && 
                            report.location.lat !== undefined && report.location.lng !== undefined) {
                            lat = parseFloat(report.location.lat);
                            lng = parseFloat(report.location.lng);
                        } else {
                            lat = parseFloat(report.latitude || report.lat || report.coords?.lat);
                            lng = parseFloat(report.longitude || report.lng || report.lon || report.coords?.lng);
                        }
                        
                        return {
                            id: report._id || report.id,
                            lat: lat,
                            lng: lng,
                            title: report.issueType || report.type || report.title || 'City Issue Report',
                            description: report.description || 'No description available',
                            status: report.status || 'new',
                            type: (report.issueType || report.type || 'issue').toLowerCase().replace(/\s+/g, '-'),
                            address: report.location?.address || report.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                            createdAt: report.createdAt || report.date || new Date().toISOString(),
                            district: report.district || 'Unknown District'
                        };
                    });
                
                console.log(`📍 Transformed ${markers.length} reports into map markers`);
                return { data: markers };
            } else if (response && response.data && Array.isArray(response.data)) {
                // Handle response with data wrapper
                console.log('🔍 Processing response.data array...');
                const reports = response.data;
                
                // Convert reports to map marker format
                const markers = reports
                    .filter(report => {
                        // Check for coordinates in location object (your DB structure)
                        let lat, lng;
                        
                        if (report.location && typeof report.location === 'object' && 
                            report.location.lat !== undefined && report.location.lng !== undefined) {
                            lat = report.location.lat;
                            lng = report.location.lng;
                        } else {
                            // Fallback to other possible coordinate formats
                            lat = report.latitude || report.lat || report.coords?.lat;
                            lng = report.longitude || report.lng || report.lon || report.coords?.lng;
                        }
                        
                        return lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
                    })
                    .map(report => {
                        // Extract coordinates from location object or fallback
                        let lat, lng;
                        
                        if (report.location && typeof report.location === 'object' && 
                            report.location.lat !== undefined && report.location.lng !== undefined) {
                            lat = parseFloat(report.location.lat);
                            lng = parseFloat(report.location.lng);
                        } else {
                            lat = parseFloat(report.latitude || report.lat || report.coords?.lat);
                            lng = parseFloat(report.longitude || report.lng || report.lon || report.coords?.lng);
                        }
                        
                        return {
                            id: report._id || report.id,
                            lat: lat,
                            lng: lng,
                            title: report.issueType || report.type || report.title || 'City Issue Report',
                            description: report.description || 'No description available',
                            status: report.status || 'new',
                            type: (report.issueType || report.type || 'issue').toLowerCase().replace(/\s+/g, '-'),
                            address: report.location?.address || report.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                            createdAt: report.createdAt || report.date || new Date().toISOString(),
                            district: report.district || 'Unknown District'
                        };
                    });
                
                console.log(`📍 Transformed ${markers.length} reports into map markers`);
                return { data: markers };
            } else {
                console.warn('⚠️ Unexpected response format from getAllreports endpoint');
                return { data: [] };
            }
        } catch (error) {
            console.error('❌ Failed to fetch reports for map:', error);
            throw error;
        }
    }

    async getAllReports() {
        // Direct access to all reports
        return await this.request(API_CONFIG.ENDPOINTS.ALL_REPORTS);
    }

    async getDistrictStats() {
        return await this.request(API_CONFIG.ENDPOINTS.DISTRICT_STATS);
    }

    async getIssueTypeStats() {
        return await this.request(API_CONFIG.ENDPOINTS.ISSUE_TYPE_STATS);
    }

    async submitReport(reportData) {
        return await this.request(API_CONFIG.ENDPOINTS.SUBMIT_REPORT, {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
    }

    // Check backend availability
    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.HEALTH}`, { 
                method: 'GET',
                timeout: 5000 
            });
            this.backendAvailable = response.ok;
            AppState.backendAvailable = response.ok;
            return response.ok;
        } catch (error) {
            this.backendAvailable = false;
            AppState.backendAvailable = false;
            return false;
        }
    }
}

// Initialize API service
const apiService = new ApiService();

// 🗺️ Google Maps Integration
class GoogleMapsController {
    constructor() {
        this.map = null;
        this.markers = [];
        this.infoWindow = null;
        this.isInitialized = false;
    }

    async initializeMap() {
        try {
            // Wait for Google Maps to be available
            if (typeof google === 'undefined' || !google.maps) {
                console.warn('Google Maps API not loaded yet, retrying...');
                setTimeout(() => this.initializeMap(), 1000);
                return;
            }

            const mapContainer = document.querySelector('.map-container');
            if (!mapContainer) {
                console.warn('Map container not found');
                return;
            }

            console.log('🗺️ Initializing Google Maps...');

            // Replace placeholder image with Google Maps
            mapContainer.innerHTML = '';
            mapContainer.style.height = '320px';
            mapContainer.style.width = '100%';

            // Initialize Google Map
            const mapOptions = {
                center: GOOGLE_MAPS_CONFIG.DEFAULT_CENTER,
                zoom: GOOGLE_MAPS_CONFIG.DEFAULT_ZOOM,
                styles: GOOGLE_MAPS_CONFIG.MAP_STYLES,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
                scrollwheel: true,
                disableDoubleClickZoom: false
            };

            this.map = new google.maps.Map(mapContainer, mapOptions);
            this.infoWindow = new google.maps.InfoWindow();

            AppState.googleMap = this.map;
            this.isInitialized = true;

            // Load markers
            await this.loadMapMarkers();

            console.log('✅ Google Maps initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing Google Maps:', error);
            this.showMapFallback();
        }
    }

    async loadMapMarkers() {
        try {
            console.log('📍 Loading map markers from backend...');
            const response = await apiService.getMapMarkers(currentFilters);
            
            if (response && response.data && Array.isArray(response.data)) {
                const markersData = response.data;
                console.log(`📍 Received ${markersData.length} markers from backend`);

                // Extract original reports data (before transformation to marker format)
                // We need to get the raw reports for filtering
                console.log('📍 Fetching raw reports data for filtering...');
                const rawReportsResponse = await fetch('https://city-fix-backend.onrender.com/api/reports/getAllreports');
                const rawReports = await rawReportsResponse.json();
                
                console.log(`📍 Got ${rawReports.length} raw reports for filtering`);

                // Store all reports data in the filter system
                if (window.mapFilters) {
                    console.log('📍 Setting up filter system with reports data...');
                    window.mapFilters.setReportsData(rawReports);
                    window.mapFilters.setMapController(this);
                    console.log('📍 Filter system configured');
                } else {
                    console.warn('📍 MapFilters not available yet');
                }

                // Clear existing markers
                this.clearMarkers();

                // Add new markers
                markersData.forEach(markerData => {
                    this.addMarker(markerData);
                });

                AppState.mapMarkers = markersData;
                console.log(`📍 Loaded ${markersData.length} markers from backend`);

                // Fit map to markers if we have any
                if (markersData.length > 0 && this.map) {
                    this.fitMapToMarkers();
                }
            } else {
                throw new Error('Invalid markers response from backend');
            }

        } catch (error) {
            console.error('❌ Failed to load map markers from backend:', error);
            // Clear markers and show error state
            this.clearMarkers();
            this.showMapError();
        }
    }

    addMarker(markerData) {
        if (!this.map) return;

        const marker = new google.maps.Marker({
            position: { lat: markerData.lat, lng: markerData.lng },
            map: this.map,
            title: markerData.title,
            icon: this.getMarkerIcon(markerData.type, markerData.status),
            animation: google.maps.Animation.DROP
        });

        // Add click listener to show info
        marker.addListener('click', () => {
            this.showMarkerInfo(marker, markerData);
        });

        this.markers.push(marker);
    }

    getMarkerIcon(type, status) {
        const colors = {
            'potholes': '#ff6b35',
            'lighting': '#ffd23f',
            'drainage': '#4dabf7',
            'traffic': '#28a745',
            'sidewalk': '#6f42c1',
            'default': '#868e96'
        };

        const statusSizes = {
            'new': 12,
            'in-progress': 10,
            'pending': 10,
            'resolved': 8
        };

        const color = colors[type] || colors.default;
        const size = statusSizes[status] || 10;

        // Use location pin shape instead of circle
        return {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: size / 8, // Scale down the path
            anchor: new google.maps.Point(12, 24) // Anchor at the bottom point of the pin
        };
    }

    showMarkerInfo(marker, data) {
        const statusColor = {
            'new': '#dc3545',
            'in-progress': '#ffc107',
            'pending': '#fd7e14',
            'resolved': '#28a745'
        };

        const timeAgo = this.formatTimeAgo(data.createdAt);

        const content = `
            <div style="max-width: 300px; font-family: Arial, sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${data.title}</h4>
                <p style="margin: 0 0 6px 0; color: #666; font-size: 14px;">${data.description || ''}</p>
                <div style="margin: 8px 0;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; 
                                 background: ${statusColor[data.status] || '#6c757d'}; color: white; 
                                 font-size: 12px; font-weight: bold; text-transform: uppercase;">
                        ${data.status}
                    </span>
                </div>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">
                    <strong>Type:</strong> ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}
                </p>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">
                    <strong>Location:</strong> ${data.address || `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`}
                </p>
                <p style="margin: 4px 0 0 0; color: #999; font-size: 12px;">
                    <strong>Reported:</strong> ${timeAgo}
                </p>
            </div>
        `;

        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
    }

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        }
    }

    fitMapToMarkers() {
        if (this.markers.length === 0 || !this.map) return;

        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });

        this.map.fitBounds(bounds);

        // Don't zoom in too much for a single marker
        google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
            if (this.map.getZoom() > 15) {
                this.map.setZoom(15);
            }
        });
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    // Add markers from reports data (for filtering)
    addMarkersFromReports(reports) {
        // Clear existing markers first
        this.clearMarkers();
        
        if (!this.map || !reports || !Array.isArray(reports)) {
            console.warn('Cannot add markers: map not initialized or invalid reports data');
            return;
        }

        console.log(`📍 Adding ${reports.length} markers to map`);

        reports.forEach(report => {
            // Check if report has valid coordinates
            let lat, lng;
            
            if (report.location && typeof report.location === 'object' && 
                report.location.lat !== undefined && report.location.lng !== undefined) {
                lat = parseFloat(report.location.lat);
                lng = parseFloat(report.location.lng);
            } else {
                lat = parseFloat(report.latitude || report.lat || report.coords?.lat);
                lng = parseFloat(report.longitude || report.lng || report.lon || report.coords?.lng);
            }

            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                console.warn('⚠️ Skipping report with invalid coordinates:', report._id);
                return;
            }

            const markerData = {
                id: report._id || report.id,
                lat: lat,
                lng: lng,
                title: report.issueType || report.type || report.title || 'City Issue Report',
                description: report.description || 'No description available',
                status: report.status || 'new',
                type: (report.issueType || report.type || 'issue').toLowerCase().replace(/\s+/g, '-'),
                address: report.location?.address || report.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                createdAt: report.createdAt || report.date || new Date().toISOString(),
                district: report.district || 'Unknown District'
            };

            this.addMarker(markerData);
        });

        // Fit map to markers if we have any
        if (this.markers.length > 0) {
            this.fitMapToMarkers();
        }

        console.log(`✅ Added ${this.markers.length} markers to map`);
    }

    showMapFallback() {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; 
                           height: 320px; background: #f8f9fa; border-radius: 8px; 
                           border: 2px dashed #dee2e6;">
                    <div style="text-align: center; color: #6c757d;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
                        <h3 style="margin: 0 0 8px 0;">Google Maps Loading...</h3>
                        <p style="margin: 0;">Please wait for the map to initialize</p>
                        <button onclick="mapsController.retryMapInitialization()" 
                                style="margin-top: 12px; padding: 8px 16px; background: #007bff; 
                                       color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }

    retryMapInitialization() {
        console.log('🔄 Retrying Google Maps initialization...');
        setTimeout(() => {
            this.initializeMap();
        }, 1000);
    }

    updateMapWithFilters() {
        if (this.map && this.isInitialized) {
            this.loadMapMarkers();
        }
    }

    showMapError() {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'map-error-overlay';
            errorOverlay.innerHTML = `
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                           background: rgba(220, 53, 69, 0.9); color: white; padding: 12px 20px;
                           border-radius: 8px; text-align: center; z-index: 1000;">
                    <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
                    <div>Failed to load markers from backend</div>
                </div>
            `;
            
            // Remove existing error overlay if any
            const existingOverlay = mapContainer.querySelector('.map-error-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            
            mapContainer.appendChild(errorOverlay);
            
            // Remove overlay after 5 seconds
            setTimeout(() => {
                if (errorOverlay.parentNode) {
                    errorOverlay.remove();
                }
            }, 5000);
        }
    }
}

// Initialize Maps Controller
const mapsController = new GoogleMapsController();

// Make it globally accessible
window.mapsController = mapsController;

// 🎛️ Homepage Controller
class HomepageController {
    constructor() {
        this.isInitialized = false;
        this.refreshInterval = null;
    }

    async initialize() {
        console.log('🚀 Initializing CityFix Homepage');
        
        try {
            // Setup UI interactions first
            this.setupInteractions();
            
            // Check backend availability first
            const backendHealthy = await apiService.checkBackendHealth();
            
            if (!backendHealthy) {
                throw new Error('Backend health check failed');
            }
            
            console.log('✅ Backend is healthy');
            
            // Load data from backend only
            await this.loadDashboardData();
            
            // Initialize Google Maps
            this.initializeGoogleMapsWithRetry();
            
            // Setup auto-refresh since backend is available
            this.setupAutoRefresh();
            
            this.isInitialized = true;
            console.log('✅ Homepage initialized successfully with backend data');
            
        } catch (error) {
            console.error('❌ Homepage initialization failed:', error);
            this.showBackendError();
            
            // Still try to initialize maps without data
            this.initializeGoogleMapsWithRetry();
        }
    }

    async initializeGoogleMapsWithRetry() {
        let retries = 0;
        const maxRetries = 10;
        
        const tryInitialize = async () => {
            if (typeof google !== 'undefined' && google.maps) {
                await mapsController.initializeMap();
                return;
            }
            
            retries++;
            if (retries < maxRetries) {
                console.log(`⏳ Waiting for Google Maps API... (${retries}/${maxRetries})`);
                setTimeout(tryInitialize, 1000);
            } else {
                console.warn('❌ Google Maps API failed to load, showing fallback');
                mapsController.showMapFallback();
            }
        };
        
        tryInitialize();
    }

    async loadDashboardData() {
        try {
            console.log('📊 Loading data from backend...');
            
            // Load map stats from backend (but don't update main stats - let user-reports-stats.js handle that)
            await this.loadMapStats();

            AppState.lastUpdate = new Date();
            console.log('✅ Dashboard data loaded from backend');

        } catch (error) {
            console.error('❌ Failed to load data from backend:', error);
            this.showBackendError();
        }
    }

    showBackendError() {
        // Show backend connection error message only
        this.showNotificationOLD('⚠️ Backend connection failed. Please ensure the server is running.', 'error');
    }

    clearMapStats() {
        // Clear map stats to show loading state
        const mapStatCards = document.querySelectorAll('.map-stat-card .map-stat-content');
        mapStatCards.forEach(card => {
            card.innerHTML = '<div class="resolution-percentage">--</div>';
        });
    }

    updateStatsDisplay() {
        const stats = AppState.dashboardStats;
        
        if (!stats) {
            console.warn('No stats data available');
            return;
        }
        
        // Update stat numbers with animation - only if data exists
        if (stats.totalReports !== undefined) {
            this.animateCounter('.stat-card:nth-child(1) .stat-number', stats.totalReports);
        }
        if (stats.resolved !== undefined) {
            this.animateCounter('.stat-card:nth-child(2) .stat-number', stats.resolved);
        }
        if (stats.inProgress !== undefined) {
            this.animateCounter('.stat-card:nth-child(3) .stat-number', stats.inProgress);
        }
        
        console.log('📊 Stats display updated with backend data');
    }

    async loadMapStats() {
        try {
            console.log('📊 Loading map stats from backend...');
            
            const [districtStats, issueStats] = await Promise.all([
                apiService.getDistrictStats(),
                apiService.getIssueTypeStats()
            ]);

            if (districtStats && districtStats.data && issueStats && issueStats.data) {
                this.updateMapStatsDisplay(districtStats.data, issueStats.data);
                console.log('✅ Map stats loaded from backend');
            } else {
                throw new Error('Invalid map stats response from backend');
            }
            
        } catch (error) {
            console.error('❌ Failed to load map stats from backend:', error);
            // Clear map stats to show loading state
            this.clearMapStats();
        }
    }

    updateMapStatsDisplay(districtData, issueData) {
        const mapStatCards = document.querySelectorAll('.map-stat-card .map-stat-content');
        
        if (mapStatCards.length >= 4 && districtData && issueData) {
            // Active district - only show if data exists
            const activeDistrict = currentFilters.district || 'downtown';
            if (districtData[activeDistrict]) {
                const districtName = districtData[activeDistrict].name;
                mapStatCards[0].innerHTML = `<div class="resolution-percentage">${districtName}</div>`;
            }

            // Top issue type - calculate from real data
            let topIssue = '';
            let maxCount = 0;
            Object.keys(issueData).forEach(issueType => {
                if (currentFilters.issueTypes.includes(issueType) && issueData[issueType].count > maxCount) {
                    maxCount = issueData[issueType].count;
                    topIssue = issueData[issueType].name;
                }
            });
            
            if (topIssue) {
                mapStatCards[1].innerHTML = `<div class="resolution-percentage">${topIssue}</div>`;
            }

            // Calculate real resolution rate from data
            let totalCount = 0;
            let totalResolved = 0;
            Object.keys(issueData).forEach(issueType => {
                if (currentFilters.issueTypes.includes(issueType)) {
                    totalCount += issueData[issueType].count || 0;
                    totalResolved += issueData[issueType].resolved || 0;
                }
            });
            
            if (totalCount > 0) {
                const resolutionRate = Math.round((totalResolved / totalCount) * 100);
                mapStatCards[2].innerHTML = `<div class="resolution-percentage">${resolutionRate}%</div>`;
            }

            // Weekly trend - use backend data if available
            if (AppState.dashboardStats && AppState.dashboardStats.weeklyTrend) {
                mapStatCards[3].innerHTML = `<div class="resolution-percentage">${AppState.dashboardStats.weeklyTrend}</div>`;
            }
        }
        
        console.log('📊 Map stats updated with backend data');
    }

    updateMapStats() {
        // Default map stats update
        const mapStatCards = document.querySelectorAll('.map-stat-card .map-stat-content');
        
        if (mapStatCards.length >= 4) {
            mapStatCards[0].innerHTML = '<div class="resolution-percentage">Downtown</div>';
            mapStatCards[1].innerHTML = '<div class="resolution-percentage">Potholes</div>';
            mapStatCards[2].innerHTML = '<div class="resolution-percentage">84%</div>';
            mapStatCards[3].innerHTML = '<div class="resolution-percentage">↗️ +12%</div>';
        }
    }

    setupInteractions() {
        this.initializeDateValidation();
        this.initializeFilters();
        this.initializeMobileMenu();
        this.initializeIssueCards();
        this.initializeMapActions();
        this.initializeCounterAnimations();
    }

    initializeDateValidation() {
        const dateInputs = document.querySelectorAll('.date-input');
        dateInputs.forEach((input, index) => {
            input.type = 'text';
            input.maxLength = 10;
            input.placeholder = index === 0 ? 'Start Date (mm/dd/yyyy)' : 'End Date (mm/dd/yyyy)';
            
            input.addEventListener('input', this.handleDateInput.bind(this));
            input.addEventListener('blur', this.handleDateBlur.bind(this));
        });
    }

    handleDateInput(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        
        // Format as mm/dd/yyyy
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        if (value.length >= 5) {
            value = value.substring(0, 5) + '/' + value.substring(5, 9);
        }
        
        input.value = value;
        
        // Validate if complete
        if (value.length === 10) {
            this.validateDate(input);
        }
    }

    handleDateBlur(event) {
        const input = event.target;
        if (input.value && input.value.length === 10) {
            if (this.validateDate(input)) {
                this.updateFilters();
            }
        }
    }

    validateDate(input) {
        const value = input.value;
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
        
        if (!dateRegex.test(value)) {
            this.showValidationError(input, 'Invalid date format');
            return false;
        }

        const [month, day, year] = value.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (date > today) {
            this.showValidationError(input, 'Date cannot be in the future');
            return false;
        }

        this.clearValidationError(input);
        return true;
    }

    showValidationError(input, message) {
        this.clearValidationError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'date-validation error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '4px';
        
        input.style.borderColor = '#ef4444';
        input.parentNode.appendChild(errorDiv);
    }

    clearValidationError(input) {
        const error = input.parentNode.querySelector('.date-validation');
        if (error) error.remove();
        input.style.borderColor = '';
    }

    initializeFilters() {
        const districtSelect = document.querySelector('.district-select');
        const checkboxes = document.querySelectorAll('input[name="issue-type"]');
        
        if (districtSelect) {
            districtSelect.addEventListener('change', () => this.updateFilters());
        }
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateFilters());
        });
    }

    updateFilters() {
        // Update current filters
        const dateInputs = document.querySelectorAll('.date-input');
        const districtSelect = document.querySelector('.district-select');
        const checkedBoxes = document.querySelectorAll('input[name="issue-type"]:checked');
        
        currentFilters.startDate = dateInputs[0]?.value || '';
        currentFilters.endDate = dateInputs[1]?.value || '';
        currentFilters.district = districtSelect?.value || '';
        currentFilters.issueTypes = Array.from(checkedBoxes).map(cb => cb.value);

        // Update map and stats
        if (mapsController.map && mapsController.isInitialized) {
            mapsController.updateMapWithFilters();
        }
        
        this.loadMapStats();
        
        console.log('🔄 Filters updated:', currentFilters);
    }

    initializeMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');
        
        if (mobileMenuBtn && mobileNav) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileNav.classList.toggle('active');
                mobileMenuBtn.classList.toggle('active');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (event) => {
                if (!mobileMenuBtn.contains(event.target) && !mobileNav.contains(event.target)) {
                    mobileNav.classList.remove('active');
                    mobileMenuBtn.classList.remove('active');
                }
            });
        }
    }

 
    initializeMapActions() {
        const shareBtn = document.querySelector('.share-report-btn');
        const exportBtn = document.querySelector('.export-pdf-btn');
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.handleShareReport());
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExportPDF());
        }
    }

    handleShareReport() {
        const shareUrl = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: 'CityFix Community Report',
                text: 'Check out this community report on CityFix!',
                url: shareUrl
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showNotificationOLD('Report link copied to clipboard!', 'success');
            }).catch(() => {
                this.showNotificationOLD('Unable to copy link', 'error');
            });
        }
    }

    handleExportPDF() {
        this.showNotificationOLD('Preparing PDF export...', 'info');
        
        // Simulate PDF generation
        setTimeout(() => {
            this.showNotificationOLD('PDF export completed!', 'success');
            // In real implementation, trigger backend PDF generation
        }, 2000);
    }

    

    // OLD NOTIFICATION METHOD - DISABLED TO AVOID CONFLICTS WITH NEW SYSTEM
    showNotificationOLD(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 12px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white; border-radius: 8px; z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Initialize Homepage Controller
const homepage = new HomepageController();

// Google Maps callback function
window.initMap = function() {
    console.log('📍 Google Maps API loaded successfully');
    // Maps will be initialized in homepage.initialize()
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    const userId = localStorage.getItem('user_id');
    const userToken = localStorage.getItem('user_token');
    
    if (!userId || !userToken) {
        console.log('❌ No valid session for homepage - redirecting to index.html');
        window.location.replace('index.html');
        return;
    }
    
    console.log('✅ Valid session found for homepage - loading dashboard');
    console.log('🚀 CityFix Homepage Loading...');
    homepage.initialize();
});

// Global access for debugging and HTML compatibility
window.homepage = homepage;
window.mapsController = mapsController;
window.apiService = apiService;

// Legacy functions for compatibility
window.retryMapInitialization = function() {
    mapsController.retryMapInitialization();
};

// ==========================================
// USER PROFILE AND WELCOME MESSAGE FUNCTIONS
// ==========================================

// Initialize user profile and welcome message on page load
function initializeUserProfile() {
    // Replace profile icon with user image if signed in
    let userId = null;
    
    // Try to get user_id from cityfix_user first (prefer numeric user_id)
    try {
        const cityfixUser = JSON.parse(localStorage.getItem('cityfix_user') || '{}');
        console.log('[CityFix] cityfix_user data:', cityfixUser);
        
        // Use numeric user_id (which works with backend API)
        if (cityfixUser.user_id || cityfixUser.userId) {
            userId = cityfixUser.user_id || cityfixUser.userId;
            console.log('[CityFix] Using numeric user_id:', userId);
        } else if (cityfixUser._id && cityfixUser._id !== 'unknown') {
            // Fallback to MongoDB _id if needed
            userId = cityfixUser._id;
            console.log('[CityFix] Using MongoDB _id as fallback:', userId);
        } else {
            console.log('[CityFix] ⚠️ No valid user ID found in cityfix_user:', cityfixUser);
        }
    } catch (e) {
        console.log('[CityFix] Error parsing cityfix_user:', e);
    }
    
    // Fallback to localStorage user_id 
    if (!userId) {
        const legacyUserId = localStorage.getItem('user_id');
        if (legacyUserId && legacyUserId !== 'unknown') {
            userId = legacyUserId;
            console.log('[CityFix] Using legacy user_id from localStorage:', userId);
        } else {
            console.log('[CityFix] ⚠️ No valid user ID found anywhere');
        }
    }
    
    const imgEl = document.getElementById('userProfileImage');
    if (userId && imgEl) {
        console.log('[CityFix] 🔍 Attempting to load profile image for user:', userId);
        console.log('[CityFix] 🌐 Using backend URL:', `https://city-fix-backend.onrender.com/api/users/${userId}/image`);
        
        fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/image`)
            .then(res => {
                console.log('[CityFix] 📡 Image API response status:', res.status);
                console.log('[CityFix] 📡 Image API response headers:', res.headers);
                
                if (res.ok) {
                    return res.blob();
                } else if (res.status === 404) {
                    // User doesn't have a profile image uploaded to Render backend
                    console.log('[CityFix] 📷 User has no profile image on Render backend (404)');
                    console.log('[CityFix] 💡 This user may exist locally but not on Render deployment');
                    console.log('[CityFix] 💡 Try registering again on the deployed site to upload image to Render');
                    throw new Error('No profile image found on Render backend');
                } else if (res.status === 500) {
                    // Server error - might be a backend issue
                    console.log('[CityFix] ⚠️ Backend server error (500) - image service might be down');
                    throw new Error('Backend image service error');
                } else {
                    // Log the error response
                    return res.text().then(errorText => {
                        console.log('[CityFix] ❌ Image API error response:', errorText);
                        throw new Error(`HTTP ${res.status}: ${errorText}`);
                    });
                }
            })
            .then(blob => {
                if (blob) {
                    const imgUrl = URL.createObjectURL(blob);
                    imgEl.src = imgUrl;
                    console.log('[CityFix] ✅ Profile image loaded successfully from Render backend');
                } else {
                    imgEl.src = 'assets/profile.svg';
                    console.log('[CityFix] 📷 No profile image blob, using default');
                }
            })
            .catch(error => {
                console.log('[CityFix] ❌ Error loading profile image:', error.message);
                console.log('[CityFix] 🔄 Using default profile image instead');
                imgEl.src = 'assets/profile.svg';
            });
    } else if (imgEl) {
        imgEl.src = 'assets/profile.svg';
        console.log('[CityFix] 📷 No user ID found, using default profile image');
    }
    
    // Display personalized welcome message with real user data
    displayUserWelcomeMessage();
    
    // Display user information in console for debugging
    displayUserDebugInfo();
}

function displayUserWelcomeMessage() {
    // Get user data from localStorage
    const userName = localStorage.getItem('user_name');
    const userEmail = localStorage.getItem('user_email');
    const userId = localStorage.getItem('user_id');
    const userType = localStorage.getItem('user_type');
    
    console.log('🔍 User data from localStorage:', {
        userName,
        userEmail,
        userId,
        userType
    });
    
    // Display welcome message if user data exists
    if (userName && userEmail) {
        const welcomeMessage = document.getElementById('welcomeMessage');
        const userNameDisplay = document.getElementById('userNameDisplay');
        
        if (welcomeMessage && userNameDisplay) {
            userNameDisplay.textContent = userName;
            welcomeMessage.style.display = 'block';
            
            // Add smooth fade-in animation
            welcomeMessage.style.opacity = '0';
            welcomeMessage.style.transform = 'translateY(-10px)';
            welcomeMessage.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                welcomeMessage.style.opacity = '1';
                welcomeMessage.style.transform = 'translateY(0)';
            }, 100);
            
            console.log(`✅ Welcome message displayed for: ${userName}`);
        }
    } else {
        console.log('❌ User data incomplete - welcome message not shown');
    }
}

function displayUserDebugInfo() {
    // Get all user session data
    const userToken = localStorage.getItem('user_token');
    const cityfixUser = localStorage.getItem('cityfix_user');
    
    let parsedUserData = null;
    try {
        parsedUserData = cityfixUser ? JSON.parse(cityfixUser) : null;
    } catch (e) {
        console.error('Error parsing cityfix_user data:', e);
    }
    
    console.log('🔐 Complete User Session Data:');
    console.log('- User ID:', localStorage.getItem('user_id'));
    console.log('- User Name:', localStorage.getItem('user_name'));
    console.log('- User Type:', localStorage.getItem('user_type'));
    console.log('- User Email:', localStorage.getItem('user_email'));
    console.log('- Has Token:', !!userToken);
    console.log('- Token Preview:', userToken ? userToken.substring(0, 20) + '...' : 'None');
    console.log('- Full User Object:', parsedUserData);
    
    // Optional: Create a user info container for debugging (add ?debug=true to URL)
    if (parsedUserData && window.location.search.includes('debug=true')) {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            const debugContainer = document.createElement('div');
            debugContainer.className = 'user-info-container';
            debugContainer.innerHTML = `
                <div class="user-details">
                    <h3>User Session Debug Info</h3>
                    <p><strong>User ID:</strong> ${parsedUserData.user_id}</p>
                    <p><strong>Username:</strong> ${parsedUserData.username}</p>
                    <p><strong>Email:</strong> ${parsedUserData.user_email}</p>
                    <p><strong>Account Type:</strong> ${parsedUserData.user_type}</p>
                    <p><strong>Login Time:</strong> ${parsedUserData.loginTime || 'Unknown'}</p>
                    <p><strong>Token Status:</strong> ${parsedUserData.token ? 'Active' : 'Missing'}</p>
                </div>
            `;
            heroContent.appendChild(debugContainer);
        }
    }
}

// Add user profile initialization to DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initializeUserProfile();
});

// Debug function to test profile image API
function testProfileImageAPI() {
    const cityfixUser = JSON.parse(localStorage.getItem('cityfix_user') || '{}');
    const userId = cityfixUser.user_id || cityfixUser.userId || cityfixUser._id;
    
    if (!userId) {
        console.log('[CityFix] ❌ No user ID found for testing');
        return;
    }
    
    console.log('[CityFix] 🧪 Testing profile image API for user:', userId);
    console.log('[CityFix] 🌐 Testing on Render backend...');
    
    // Test if user profile exists first
    fetch(`https://city-fix-backend.onrender.com/api/users/profile/${userId}`)
        .then(res => {
            console.log('[CityFix] 🧪 Profile API Test - Status:', res.status);
            if (res.ok) {
                return res.json();
            } else {
                throw new Error(`Profile not found: HTTP ${res.status}`);
            }
        })
        .then(profileData => {
            console.log('[CityFix] ✅ User profile exists on Render backend:', profileData.user);
            
            // Now test image API
            return fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/image`);
        })
        .then(res => {
            console.log('[CityFix] 🧪 Image API Test - Status:', res.status);
            console.log('[CityFix] 🧪 Image API Test - Headers:', Object.fromEntries(res.headers.entries()));
            
            if (res.ok) {
                return res.blob().then(blob => {
                    console.log('[CityFix] 🧪 Image API Test - Blob size:', blob.size, 'bytes');
                    console.log('[CityFix] 🧪 Image API Test - Blob type:', blob.type);
                    return blob;
                });
            } else {
                return res.text().then(text => {
                    console.log('[CityFix] 🧪 Image API Test - Error response:', text);
                    throw new Error(`HTTP ${res.status}: ${text}`);
                });
            }
        })
        .then(blob => {
            console.log('[CityFix] ✅ Profile image exists and is accessible on Render backend');
        })
        .catch(error => {
            console.log('[CityFix] ❌ Test failed:', error.message);
            console.log('[CityFix] 💡 This user may not exist on the Render backend');
            console.log('[CityFix] 💡 Try registering again on the deployed site');
        });
}

// Make test function globally available
window.testProfileImageAPI = testProfileImageAPI;

// Global initMap function for Google Maps API callback
window.initMap = function() {
    console.log('🗺️ Google Maps API loaded - initializing maps...');
    if (window.mapsController) {
        mapsController.initializeMap();
    }
};

console.log('✨ CityFix Homepage - Backend Ready with Google Maps!');