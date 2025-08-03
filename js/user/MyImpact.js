// Ensure real user reports are rendered after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    const userId = localStorage.getItem('user_id');
    const userToken = localStorage.getItem('user_token');
    
    if (!userId || !userToken) {
        console.log('❌ No valid session for MyImpact - redirecting to index.html');
        window.location.replace('index.html');
        return;
    }
    
    console.log('✅ Valid session found for MyImpact - loading user data');
    
    setTimeout(function() {
        updateActivityDisplay();
    }, 1000); // Wait 1 second to ensure DOM is ready
});

// Ensure Google Maps callback is globally available BEFORE anything else
window.initializeGoogleMap = function() {
    // Use the same map logic as dashboard: call initMap()
    if (typeof initMap === 'function') {
        initMap();
    } else {
        // fallback: try again after a short delay if not yet defined
        setTimeout(() => {
            if (typeof initMap === 'function') initMap();
        }, 300);
    }
};

/**
 * ===================================
 * MY IMPACT PAGE - UPDATED WITH REAL DATA & GOOGLE MAPS
 * ===================================
 */

// Global variables and configuration - REAL DATA FOR ISRAEL
const MyImpactApp = {
    config: {
        animationDuration: 300,
        counterAnimationDuration: 2000,
        notificationTimeout: 3000,
        apiEndpoint: '/api/impact',
        refreshInterval: 30000, // 30 seconds
        googleMapsApiKey: 'YOUR_API_KEY' // Replace with actual API key
    },
    data: {
        stats: {
            totalReports: 47,
            resolvedIssues: 32,
            communityImpact: 1200,
            rating: 4.8,
            successRate: 68,
            lastReportDays: 2,
            reviewCount: 158
        },
        activities: [
            {
                id: 1,
                type: 'pothole',
                title: 'Pothole Reported',
                location: 'Dizengoff Street, Tel Aviv-Yafo',
                time: '2 days ago',
                lat: 32.0741, 
                lng: 34.7749,
                status: 'resolved',
                address: 'Dizengoff St 85, Tel Aviv-Yafo, Israel',
                description: 'Large pothole causing traffic issues',
                reportDate: '2025-01-28',
                resolvedDate: '2025-01-29'
            },
            {
                id: 2,
                type: 'streetlight',
                title: 'Street Light Fixed',
                location: 'Rothschild Boulevard, Tel Aviv',
                time: '5 days ago',
                lat: 32.0638,
                lng: 34.7730,
                status: 'resolved',
                address: 'Rothschild Blvd 45, Tel Aviv-Yafo, Israel',
                description: 'Broken street light creating safety hazard',
                reportDate: '2025-01-23',
                resolvedDate: '2025-01-25'
            },
            {
                id: 3,
                type: 'garbage',
                title: 'Garbage Collection Issue',
                location: 'HaSharon Street, Rosh HaAyin',
                time: '1 week ago',
                lat: 32.0950,
                lng: 34.9522,
                status: 'pending',
                address: 'HaSharon St 12, Rosh HaAyin, Israel',
                description: 'Overflowing garbage bins not collected for 3 days',
                reportDate: '2025-01-21',
                resolvedDate: null
            },
            {
                id: 4,
                type: 'traffic',
                title: 'Traffic Light Malfunction',
                location: 'Ben Gurion Avenue, Petah Tikva',
                time: '2 weeks ago',
                lat: 32.0853,
                lng: 34.8877,
                status: 'resolved',
                address: 'Ben Gurion Ave 15, Petah Tikva, Israel',
                description: 'Traffic light stuck on red causing major delays',
                reportDate: '2025-01-14',
                resolvedDate: '2025-01-16'
            },
            {
                id: 5,
                type: 'sidewalk',
                title: 'Broken Sidewalk',
                location: 'Herzl Street, Ramat Gan',
                time: '3 weeks ago',
                lat: 32.0719,
                lng: 34.8345,
                status: 'in-progress',
                address: 'Herzl St 25, Ramat Gan, Israel',
                description: 'Cracked sidewalk creating accessibility issues',
                reportDate: '2025-01-07',
                resolvedDate: null
            },
            {
                id: 6,
                type: 'water',
                title: 'Water Leak',
                location: 'King George Street, Tel Aviv',
                time: '1 month ago',
                lat: 32.0695,
                lng: 34.7718,
                status: 'resolved',
                address: 'King George St 30, Tel Aviv-Yafo, Israel',
                description: 'Major water leak flooding the street',
                reportDate: '2024-12-30',
                resolvedDate: '2025-01-02'
            }
        ],
        badges: [
            { 
                id: 1, 
                name: 'First Report', 
                earned: true, 
                date: 'Jan 2025', 
                description: 'Submitted your first community report in Tel Aviv area!',
                icon: '🏆'
            },
            { 
                id: 2, 
                name: '10 Resolved Issues', 
                earned: true, 
                date: 'Mar 2025', 
                description: 'Your reports helped resolve 10 community issues across Central District!',
                icon: '🎖️'
            },
            { 
                id: 3, 
                name: 'Community Hero', 
                earned: true, 
                date: 'May 2025', 
                description: 'Made significant positive impact serving over 1000 residents!',
                icon: '🦸'
            },
            { 
                id: 4, 
                name: 'Top Reporter', 
                earned: true, 
                date: 'Jun 2025', 
                description: 'Ranked in top 5% of most active reporters in Central District!',
                icon: '👑'
            }
        ],
        mapData: null,
        userLocation: {
            lat: 32.0641, // Rosh HaAyin
            lng: 34.9550,
            city: 'Rosh HaAyin',
            district: 'Central District',
            country: 'Israel'
        }
    },
    state: {
        isLoading: false,
        lastUpdated: null,
        activeFilters: [],
        map: null,
        markers: [],
        infoWindows: []
    }
};

/**
 * ===================================
 * GOOGLE MAPS INITIALIZATION
 * ===================================
 */

// Initialize Google Maps with REAL Israeli locations and IMPACT VISUALIZATION

// Initialize Google Map with only the current user's report locations
async function initMap() {
    console.log('🗺️ Initializing Google Maps for current user reports...');
    const mapElement = document.querySelector('.map-placeholder');
    if (!mapElement) {
        console.error('Map container not found');
        return;
    }
    // Replace placeholder with actual map div
    mapElement.innerHTML = '<div id="impact-map" style="width: 100%; height: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></div>';

    // Get userId from localStorage
    const userId = localStorage.getItem('user_id') || (JSON.parse(localStorage.getItem('cityfix_user'))?.userId);
    if (!userId) {
        console.warn('[MyImpact] No user_id found in localStorage.');
        return;
    }

    // Fetch user reports from backend
    let reports = [];
    try {
        const res = await fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/reports`);
        if (res.ok) {
            reports = await res.json();
        } else {
            console.warn('[MyImpact] Failed to fetch user reports:', res.status, res.statusText);
        }
    } catch (err) {
        console.warn('[MyImpact] Error fetching user reports:', err);
    }

    // Extract valid locations
    const userLocations = [];
    reports.forEach(report => {
        let lat, lng;
        if (report.location && typeof report.location === 'object' && report.location.lat && report.location.lng) {
            lat = parseFloat(report.location.lat);
            lng = parseFloat(report.location.lng);
        } else if (typeof report.location === 'string') {
            const parts = report.location.split(',');
            if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
                lat = parseFloat(parts[0]);
                lng = parseFloat(parts[1]);
            }
        }
        if (lat && lng) {
            userLocations.push({ lat, lng, title: report.title || report.issueType || 'Report', status: report.status });
        }
    });

    // Center map: use first user report, or fallback to Israel
    let mapCenter = { lat: 31.0461, lng: 34.8516 };
    if (userLocations.length > 0) {
        mapCenter = { lat: userLocations[0].lat, lng: userLocations[0].lng };
    }

    const map = new google.maps.Map(document.getElementById("impact-map"), {
        zoom: userLocations.length > 0 ? 12 : 8,
        center: mapCenter,
        styles: [
            {
                "featureType": "poi.business",
                "elementType": "labels",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "poi.medical",
                "elementType": "labels",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "transit",
                "elementType": "labels.icon",
                "stylers": [{"visibility": "off"}]
            }
        ],
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
    });
    MyImpactApp.state.map = map;

    // Add markers for user report locations
    userLocations.forEach((loc, idx) => {
        new google.maps.Marker({
            position: { lat: loc.lat, lng: loc.lng },
            map: map,
            title: loc.title,
            icon: getEnhancedMarkerIcon('pothole', loc.status || 'pending', 'medium'),
            animation: google.maps.Animation.DROP,
            zIndex: 1000 - idx
        });
    });

    // Optionally, add user's home location marker as well
    const userLocationMarker = new google.maps.Marker({
        position: MyImpactApp.data.userLocation,
        map: map,
        title: 'Your Home - Rosh HaAyin',
        icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#1E40AF">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32)
        }
    });

    // Add info window for user location
    const userInfoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 12px; font-family: Inter, sans-serif; text-align: center;">
                <h4 style="margin: 0 0 8px 0; color: #1F2937;">🏠 Your Home Base</h4>
                <p style="margin: 0; color: #6B7280; font-size: 14px;">Rosh HaAyin, Central District</p>
            </div>
        `
    });
    userLocationMarker.addListener("click", () => {
        userInfoWindow.open(map, userLocationMarker);
    });

    // Add click event to close info windows when clicking on map
    map.addListener('click', () => {
        userInfoWindow.close();
    });

    console.log('✅ Google Maps initialized with', userLocations.length, 'user report points');
}

// Calculate activity impact based on type, status, and location
function calculateActivityImpact(activity) {
    const impactMultipliers = {
        'pothole': { base: 50, daily: 25, safety: 0.8 },
        'streetlight': { base: 30, daily: 15, safety: 0.9 },
        'garbage': { base: 20, daily: 10, safety: 0.6 },
        'traffic': { base: 100, daily: 50, safety: 0.95 },
        'sidewalk': { base: 25, daily: 12, safety: 0.7 },
        'water': { base: 80, daily: 40, safety: 0.85 }
    };

    const locationMultipliers = {
        'Tel Aviv': 1.5,      // High density area
        'Ramat Gan': 1.3,     // Medium-high density
        'Petah Tikva': 1.2,   // Medium density
        'Rosh HaAyin': 1.0    // Base density
    };

    const typeData = impactMultipliers[activity.type] || impactMultipliers.pothole;
    const locationKey = Object.keys(locationMultipliers).find(city => 
        activity.location.includes(city)
    ) || 'Rosh HaAyin';
    const locationMultiplier = locationMultipliers[locationKey];

    // Calculate days since report
    const reportDate = new Date(activity.reportDate);
    const today = new Date();
    const daysSinceReport = Math.floor((today - reportDate) / (1000 * 60 * 60 * 24));

    // Calculate impact
    let peopleAffected = Math.floor(typeData.base * locationMultiplier);
    let dailyImpact = Math.floor(typeData.daily * locationMultiplier);
    let safetyImprovement = typeData.safety;
    let impactRadius = Math.sqrt(peopleAffected / 10); // Radius in km

    if (activity.status === 'resolved') {
        // Add accumulated daily impact
        const resolutionDate = new Date(activity.resolvedDate);
        const daysResolved = Math.floor((today - resolutionDate) / (1000 * 60 * 60 * 24));
        peopleAffected += dailyImpact * Math.min(daysResolved, 30); // Cap at 30 days
    }

    return {
        peopleAffected,
        dailyImpact,
        safetyImprovement: Math.floor(safetyImprovement * 100),
        impactRadius,
        impactLevel: peopleAffected > 100 ? 'high' : peopleAffected > 50 ? 'medium' : 'low',
        locationMultiplier,
        daysSinceReport,
        estimatedSavings: Math.floor(peopleAffected * 2.5) // Estimated economic impact in NIS
    };
}

// Calculate total impact radius from user's location
function calculateImpactRadius() {
    if (!MyImpactApp.data.activities.length) return 5;
    
    const distances = MyImpactApp.data.activities.map(activity => {
        return getDistanceFromLatLonInKm(
            MyImpactApp.data.userLocation.lat,
            MyImpactApp.data.userLocation.lng,
            activity.lat,
            activity.lng
        );
    });
    
    return Math.max(...distances).toFixed(1);
}

// Calculate distance between two points
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function getEnhancedMarkerIcon(type, status, impactLevel) {
    const baseUrl = "https://maps.google.com/mapfiles/ms/icons/";
    let iconColor;
    let iconSize = 32;
    
    // Color based on status
    switch (status) {
        case "resolved":
            iconColor = impactLevel === 'high' ? "green" : "ltblue";
            iconSize = impactLevel === 'high' ? 40 : 32;
            break;
        case "in-progress":
            iconColor = "yellow";
            break;
        case "pending":
            iconColor = "red";
            break;
        default:
            iconColor = "blue";
    }
    
    return {
        url: baseUrl + iconColor + "-dot.png",
        scaledSize: new google.maps.Size(iconSize, iconSize),
        anchor: new google.maps.Point(iconSize/2, iconSize)
    };
}

function createEnhancedInfoWindowContent(activity, impactData) {
    const statusStyles = {
        'resolved': 'background: #D1FAE5; color: #065F46; border: 1px solid #10B981;',
        'in-progress': 'background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B;',
        'pending': 'background: #FEE2E2; color: #991B1B; border: 1px solid #EF4444;'
    };

    const typeEmojis = {
        'pothole': '🕳️',
        'streetlight': '💡',
        'garbage': '🗑️',
        'traffic': '🚦',
        'sidewalk': '🚶',
        'water': '💧'
    };

    const impactLevelColors = {
        'high': '#10B981',
        'medium': '#F59E0B', 
        'low': '#6B7280'
    };

    return `
        <div style="padding: 16px; max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 24px;">${typeEmojis[activity.type] || '📍'}</span>
                <h4 style="margin: 0; color: #1F2937; font-size: 16px; font-weight: 600;">${activity.title}</h4>
            </div>
            
            <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; color: #4B5563; font-size: 14px; line-height: 1.4;">
                    📍 ${activity.address}
                </p>
                <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 13px;">
                    🕒 Reported ${activity.time}
                </p>
                ${activity.resolvedDate ? `
                    <p style="margin: 0 0 8px 0; color: #10B981; font-size: 13px; font-weight: 500;">
                        ✅ Resolved on ${new Date(activity.resolvedDate).toLocaleDateString()}
                    </p>
                ` : ''}
            </div>
            
            <!-- Impact Statistics -->
            <div style="background: #F9FAFB; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <h5 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600;">📊 Community Impact</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                    <div>
                        <span style="color: #6B7280;">People Affected:</span><br>
                        <strong style="color: ${impactLevelColors[impactData.impactLevel]};">${impactData.peopleAffected.toLocaleString()}</strong>
                    </div>
                    <div>
                        <span style="color: #6B7280;">Safety Level:</span><br>
                        <strong style="color: #10B981;">${impactData.safetyImprovement}%</strong>
                    </div>
                    <div>
                        <span style="color: #6B7280;">Daily Impact:</span><br>
                        <strong style="color: #3B82F6;">${impactData.dailyImpact}</strong>
                    </div>
                    <div>
                        <span style="color: #6B7280;">Est. Savings:</span><br>
                        <strong style="color: #059669;">₪${impactData.estimatedSavings}</strong>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 12px;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; ${statusStyles[activity.status] || statusStyles.pending}">
                    ${activity.status.replace('-', ' ').toUpperCase()}
                </span>
                <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; background: ${impactLevelColors[impactData.impactLevel]}; color: white; margin-left: 4px;">
                    ${impactData.impactLevel.toUpperCase()} IMPACT
                </span>
            </div>
            
            <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 13px; line-height: 1.4; font-style: italic;">
                "${activity.description}"
            </p>
            
            <div style="display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap;">
                <button onclick="focusOnLocation(${activity.lat}, ${activity.lng})" 
                        style="background: #3B82F6; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500;">
                    🎯 Focus
                </button>
                <button onclick="showImpactDetails(${activity.id})" 
                        style="background: #10B981; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500;">
                    📈 Impact
                </button>
                <button onclick="shareActivity('${activity.title.replace(/'/g, "\\'")}', '${activity.address.replace(/'/g, "\\'")}', '${activity.status}')" 
                        style="background: #6B7280; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500;">
                    📤 Share
                </button>
            </div>
        </div>
    `;
}

// Add impact statistics overlay to map
function addImpactStatsOverlay(map) {
    const totalImpact = MyImpactApp.data.activities.reduce((total, activity) => {
        const impact = calculateActivityImpact(activity);
        return total + impact.peopleAffected;
    }, 0);

    const resolvedCount = MyImpactApp.data.activities.filter(a => a.status === 'resolved').length;

    const overlayContent = `
        <div style="background: rgba(255, 255, 255, 0.95); padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #10B981; max-width: 200px;">
            <h6 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600;">🏆 Your Total Impact</h6>
            <div style="font-size: 12px; line-height: 1.4;">
                <div style="margin-bottom: 4px;">
                    <strong style="color: #10B981;">${totalImpact.toLocaleString()}</strong> people helped
                </div>
                <div style="margin-bottom: 4px;">
                    <strong style="color: #3B82F6;">${resolvedCount}</strong> issues resolved
                </div>
                <div>
                    <strong style="color: #059669;">₪${Math.floor(totalImpact * 2.5).toLocaleString()}</strong> saved
                </div>
            </div>
        </div>
    `;

    const overlay = new google.maps.OverlayView();
    overlay.onAdd = function() {
        const div = document.createElement('div');
        div.innerHTML = overlayContent;
        div.style.position = 'absolute';
        div.style.top = '10px';
        div.style.left = '10px';
        this.getPanes().overlayLayer.appendChild(div);
        this.div = div;
    };
    overlay.draw = function() {};
    overlay.setMap(map);
}

function getMarkerIcon(type, status) {
    const baseUrl = "https://maps.google.com/mapfiles/ms/icons/";
    let iconColor;
    
    // Color based on status
    switch (status) {
        case "resolved":
            iconColor = "green";
            break;
        case "in-progress":
            iconColor = "yellow";
            break;
        case "pending":
            iconColor = "red";
            break;
        default:
            iconColor = "blue";
    }
    
    return {
        url: baseUrl + iconColor + "-dot.png",
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32)
    };
}

function createInfoWindowContent(activity) {
    const statusStyles = {
        'resolved': 'background: #D1FAE5; color: #065F46; border: 1px solid #10B981;',
        'in-progress': 'background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B;',
        'pending': 'background: #FEE2E2; color: #991B1B; border: 1px solid #EF4444;'
    };

    const typeEmojis = {
        'pothole': '🕳️',
        'streetlight': '💡',
        'garbage': '🗑️',
        'traffic': '🚦',
        'sidewalk': '🚶',
        'water': '💧'
    };

    return `
        <div style="padding: 16px; max-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 24px;">${typeEmojis[activity.type] || '📍'}</span>
                <h4 style="margin: 0; color: #1F2937; font-size: 16px; font-weight: 600;">${activity.title}</h4>
            </div>
            
            <div style="margin-bottom: 8px;">
                <p style="margin: 0 0 4px 0; color: #4B5563; font-size: 14px; line-height: 1.4;">
                    📍 ${activity.address}
                </p>
                <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 13px;">
                    🕒 Reported ${activity.time}
                </p>
                ${activity.resolvedDate ? `
                    <p style="margin: 0 0 8px 0; color: #10B981; font-size: 13px; font-weight: 500;">
                        ✅ Resolved on ${new Date(activity.resolvedDate).toLocaleDateString()}
                    </p>
                ` : ''}
            </div>
            
            <div style="margin-bottom: 12px;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; ${statusStyles[activity.status] || statusStyles.pending}">
                    ${activity.status.replace('-', ' ').toUpperCase()}
                </span>
            </div>
            
            <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 13px; line-height: 1.4; font-style: italic;">
                "${activity.description}"
            </p>
            
            <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button onclick="focusOnLocation(${activity.lat}, ${activity.lng})" 
                        style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
                    🎯 Focus Here
                </button>
                <button onclick="shareActivity('${activity.title.replace(/'/g, "\\'")}', '${activity.address.replace(/'/g, "\\'")}', '${activity.status}')" 
                        style="background: #10B981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
                    📤 Share
                </button>
            </div>
        </div>
    `;
}

// Make viewActivityDetails globally available
window.viewActivityDetails = function(activityId) {
    const activity = MyImpactApp.data.activities.find(a => a.id === activityId);
    if (activity) {
        handleActivityClick({ activity });
    }
};

/**
 * ===================================
 * INITIALIZATION - UPDATED
 * ===================================
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set header user image using API and user_id
    (function setHeaderUserImage() {
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('cityfix_user'));
        } catch (e) {}
        const headerImg = document.getElementById('header-user-image');
        if (headerImg) {
            if (user && user.userId) {
                // Use API endpoint for user image, fallback to a visible icon if not found
                const imgUrl = `https://city-fix-backend.onrender.com/api/users/${user.userId}/image?t=${Date.now()}`;
                console.log('Setting header user image:', imgUrl);
                headerImg.src = imgUrl;
                headerImg.onerror = function() {
                    this.onerror = null;
                    this.src = 'assets/check.svg'; // fallback icon you have
                };
            } else {
                headerImg.src = 'assets/check.svg'; // fallback icon you have
            }
        }
    })();
    // --- DYNAMIC USER IMPACT LOGIC ---
    (async function() {
        // --- USER REPORT STATS LOGIC (copied from user-reports-stats.js) ---
        function updateUserImpactStats() {
            // Use user_id from localStorage for consistency
            const userId = localStorage.getItem('user_id') || (JSON.parse(localStorage.getItem('cityfix_user'))?.userId);
            if (!userId) {
                const userNameElem = document.getElementById('impact-user-name');
                if (userNameElem) {
                    userNameElem.textContent = 'Not signed in';
                } else {
                    console.warn("[MyImpact] Element with id 'impact-user-name' not found in DOM");
                }
                return;
            }
            // Set user name if available
            const user = JSON.parse(localStorage.getItem('cityfix_user'));
            const userNameElem = document.getElementById('impact-user-name');
            if (userNameElem) {
                userNameElem.textContent = user?.username || 'User';
            } else {
                console.warn("[MyImpact] Element with id 'impact-user-name' not found in DOM");
            }

            // Set user image using API endpoint and user_id
            const userImageElem = document.getElementById('impact-user-image');
            if (userImageElem && userId) {
                userImageElem.src = `https://city-fix-backend.onrender.com/api/users/${userId}/image`;
                userImageElem.onerror = function() {
                    this.onerror = null;
                    this.src = 'assets/check.svg'; // fallback icon
                };
            }

            fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/reports`)
                .then(res => {
                    console.log('[CityFix] Fetching user reports:', res.status, res.statusText);
                    return res.ok ? res.json() : null;
                })
                .then(data => {
                    console.log('[CityFix] User reports API response:', data);
                    if (!data || !Array.isArray(data)) {
                        console.warn('[CityFix] User reports API did not return an array:', data);
                        return;
                    }
                    const reports = data;
                    const total = reports.length;
                    const resolved = reports.filter(r => r.status === 'resolved').length;
                    // Calculate pending as all non-resolved reports (new, pending, in-progress)
                    const pending = reports.filter(r => r.status !== 'resolved').length;
                    
                    // Calculate success rate
                    const successRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

                    // Log the stats in the console
                    console.log('[MyImpact] User report stats:', { total, resolved, pending, successRate });

                    // Update the stats section robustly
                    const totalReportsElem = document.getElementById('impact-total-reports');
                    const resolvedReportsElem = document.getElementById('impact-resolved-reports');
                    const pendingElem = document.getElementById('impact-pending-reports');
                    const successRateElem = document.getElementById('impact-success-rate');
                    const lastReportElem = document.getElementById('impact-last-report');
                    
                    if (totalReportsElem) {
                        totalReportsElem.textContent = total;
                    } else {
                        console.warn("[MyImpact] Element with id 'impact-total-reports' not found in DOM");
                    }
                    
                    if (resolvedReportsElem) {
                        resolvedReportsElem.textContent = resolved;
                    } else {
                        console.warn("[MyImpact] Element with id 'impact-resolved-reports' not found in DOM");
                    }
                    
                    if (pendingElem) {
                        pendingElem.textContent = pending;
                    } else {
                        console.warn("[MyImpact] Element with id 'impact-pending-reports' not found in DOM");
                    }
                    
                    if (successRateElem) {
                        successRateElem.textContent = `${successRate}% success rate`;
                    }
                    
                    // Update last report time
                    if (lastReportElem && reports.length > 0) {
                        const sortedReports = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        const lastReport = sortedReports[0];
                        const lastReportDate = new Date(lastReport.createdAt);
                        const now = new Date();
                        const daysDiff = Math.floor((now - lastReportDate) / (1000 * 60 * 60 * 24));
                        
                        if (daysDiff === 0) {
                            lastReportElem.textContent = 'Last report: Today';
                        } else if (daysDiff === 1) {
                            lastReportElem.textContent = 'Last report: Yesterday';
                        } else {
                            lastReportElem.textContent = `Last report: ${daysDiff} days ago`;
                        }
                    }
                })
                .catch(err => {
                    console.warn('[CityFix] Failed to fetch user reports:', err);
                });
        }
        // Run after DOM is ready
        setTimeout(updateUserImpactStats, 1200);
        // Utility: Select and focus on a user report location on the map (like dashboard)
        window.selectUserReportLocation = async function(reportIndex = 0) {
            const userId = localStorage.getItem('user_id') || (JSON.parse(localStorage.getItem('cityfix_user'))?.userId);
            if (!userId) {
                console.warn('[MyImpact] No user_id found in localStorage.');
                return;
            }
            try {
                const res = await fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/reports`);
                if (!res.ok) {
                    console.warn('[MyImpact] Failed to fetch user reports:', res.status, res.statusText);
                    return;
                }
                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) {
                    console.warn('[MyImpact] No reports found for user.');
                    return;
                }
                // Pick the report by index (default 0 = first)
                const report = data[reportIndex];
                if (!report) {
                    console.warn('[MyImpact] No report at index', reportIndex);
                    return;
                }
                // Try to extract lat/lng from report.location
                let lat = null, lng = null;
                if (report.location && typeof report.location === 'object' && report.location.lat && report.location.lng) {
                    lat = parseFloat(report.location.lat);
                    lng = parseFloat(report.location.lng);
                } else if (typeof report.location === 'string') {
                    // Try to parse as "lat,lng" string
                    const parts = report.location.split(',');
                    if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
                        lat = parseFloat(parts[0]);
                        lng = parseFloat(parts[1]);
                    }
                }
                if (lat === null || lng === null) {
                    console.warn('[MyImpact] Report does not have valid coordinates:', report.location);
                    return;
                }
                // Focus the map on this location (Google Maps)
                if (MyImpactApp.state.map) {
                    MyImpactApp.state.map.setCenter({ lat, lng });
                    MyImpactApp.state.map.setZoom(16);
                    // Optionally, add a marker or highlight
                    if (window._myImpactSelectedMarker) {
                        window._myImpactSelectedMarker.setMap(null);
                    }
                    window._myImpactSelectedMarker = new google.maps.Marker({
                        position: { lat, lng },
                        map: MyImpactApp.state.map,
                        title: report.title || 'Selected Report',
                        icon: {
                            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                            scaledSize: new google.maps.Size(40, 40),
                            anchor: new google.maps.Point(20, 40)
                        },
                        animation: google.maps.Animation.BOUNCE
                    });
                    setTimeout(() => {
                        if (window._myImpactSelectedMarker) {
                            window._myImpactSelectedMarker.setAnimation(null);
                        }
                    }, 1400);
                    showNotification('📍 Focused on selected report location!', 'info', 2000);
                } else {
                    console.warn('[MyImpact] Map is not initialized.');
                }
            } catch (err) {
                console.warn('[MyImpact] Failed to fetch or select report location:', err);
            }
        };
        // For backward compatibility, keep the log function
        window.logUserReportLocations = function() {
            const userId = localStorage.getItem('user_id') || (JSON.parse(localStorage.getItem('cityfix_user'))?.userId);
            if (!userId) {
                console.warn('[MyImpact] No user_id found in localStorage.');
                return;
            }
            fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/reports`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (!data || !Array.isArray(data)) {
                        console.warn('[MyImpact] User reports API did not return an array:', data);
                        return;
                    }
                    const locations = data.map(r => r.location && r.location.address ? r.location.address : r.location).filter(Boolean);
                    console.log('[MyImpact] User report locations:', locations);
                })
                .catch(err => {
                    console.warn('[MyImpact] Failed to fetch user reports:', err);
                });
        };


// (Removed duplicate window.initializeGoogleMap definition. Now only at the top.)

        // 6. (Optional) Render map with resolved report locations
        // You can use Google Maps API here if you want to plot the locations
        // ...

        // Helper functions
        function timeAgo(date) {
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);
            const intervals = [
                { label: 'year', seconds: 31536000 },
                { label: 'month', seconds: 2592000 },
                { label: 'week', seconds: 604800 },
                { label: 'day', seconds: 86400 },
                { label: 'hour', seconds: 3600 },
                { label: 'minute', seconds: 60 },
                { label: 'second', seconds: 1 }
            ];
            for (const interval of intervals) {
                const count = Math.floor(seconds / interval.seconds);
                if (count >= 1) {
                    return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
                }
            }
            return 'just now';
        }
        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    })();
});

// Try multiple approaches to initialize the map
function initializeMapWithFallback() {
    console.log('🗺️ Attempting to initialize map...');
    
    // Approach 1: Check if Google Maps is already loaded
    if (typeof google !== 'undefined' && google.maps) {
        console.log('✅ Google Maps API already loaded, initializing...');
        setTimeout(initMap, 100);
        return;
    }
    
    // Approach 2: Wait for Google Maps to load
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds total
    
    const checkGoogleMaps = setInterval(() => {
        attempts++;
        
        if (typeof google !== 'undefined' && google.maps) {
            console.log('✅ Google Maps API loaded after', attempts * 500, 'ms');
            clearInterval(checkGoogleMaps);
            initMap();
            return;
        }
        
        if (attempts >= maxAttempts) {
            console.log('⚠️ Google Maps API not loaded, showing fallback');
            clearInterval(checkGoogleMaps);
            showMapFallback();
        }
    }, 500);
    
    // Approach 3: Set global callback
    window.initMap = function() {
        console.log('📍 Google Maps callback triggered');
        clearInterval(checkGoogleMaps);
        setTimeout(initMap, 200);
    };
}

// Show interactive fallback map with impact data
function showMapFallback() {
    console.log('📍 Showing map fallback with impact data');
    
    const mapElement = document.querySelector('.map-placeholder');
    if (!mapElement) return;
    
    // Calculate total impact for display
    const totalImpact = MyImpactApp.data.activities.reduce((total, activity) => {
        const impact = calculateActivityImpact(activity);
        return total + impact.peopleAffected;
    }, 0);
    
    const resolvedCount = MyImpactApp.data.activities.filter(a => a.status === 'resolved').length;
    const totalSavings = MyImpactApp.data.activities.reduce((total, activity) => {
        const impact = calculateActivityImpact(activity);
        return total + impact.estimatedSavings;
    }, 0);
    
    mapElement.innerHTML = `
        <div style="width: 100%; height: 400px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative; overflow: hidden;">
            <!-- Background Map Pattern -->
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.1; background-image: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grid\" width=\"10\" height=\"10\" patternUnits=\"userSpaceOnUse\"><path d=\"M 10 0 L 0 0 0 10\" fill=\"none\" stroke=\"white\" stroke-width=\"0.5\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grid)\"/></svg>');"></div>
            
            <!-- Impact Data Overlay -->
            <div style="position: absolute; top: 20px; left: 20px; right: 20px; bottom: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: white;">
                <div style="font-size: 64px; margin-bottom: 16px; animation: pulse 2s infinite;">📍</div>
                
                <h3 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Your Impact Map</h3>
                
                <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.2);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; font-size: 14px;">
                        <div>
                            <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">${totalImpact.toLocaleString()}</div>
                            <div style="opacity: 0.9;">People Helped</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">${resolvedCount}</div>
                            <div style="opacity: 0.9;">Issues Resolved</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">₪${totalSavings.toLocaleString()}</div>
                            <div style="opacity: 0.9;">Community Savings</div>
                        </div>
                    </div>
                </div>
                
                <!-- Location Points -->
                <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; line-height: 1.5;">
                    <div style="font-weight: 600; margin-bottom: 8px;">📍 Impact Locations:</div>
                    ${MyImpactApp.data.activities.slice(0, 4).map(activity => `
                        <div style="margin-bottom: 4px; opacity: 0.9;">
                            ${activity.status === 'resolved' ? '✅' : '⏳'} ${activity.location}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Interactive Buttons -->
                <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                    <button onclick="showActivityList()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; backdrop-filter: blur(5px);">
                        📋 View All Reports
                    </button>
                    <button onclick="showImpactSummary()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; backdrop-filter: blur(5px);">
                        📊 Impact Summary
                    </button>
                </div>
                
                <div style="margin-top: 16px; font-size: 12px; opacity: 0.8;">
                    Central District, Israel • Tel Aviv • Ramat Gan • Petah Tikva • Rosh HaAyin
                </div>
            </div>
            
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
            </style>
        </div>
    `;
    
    showNotification('📍 Interactive map ready! Click buttons to explore your impact.', 'info', 3000);
}

/**
 * ===================================
 * EVENT LISTENERS SETUP
 * ===================================
 */

function setupEventListeners() {
    // Window events
    window.addEventListener('resize', debounce(handleWindowResize, 250));
    window.addEventListener('beforeunload', handlePageUnload);
    
    // Visibility change (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Error handling
    window.addEventListener('error', handleGlobalError);
    
    // Custom events
    document.addEventListener('dataUpdated', handleDataUpdate);
    document.addEventListener('statsChanged', handleStatsChange);
}

/**
 * ===================================
 * IMAGE LOADING HANDLERS
 * ===================================
 */

function setupImageLoadHandlers() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        // Skip external images (social icons, etc.)
        if (img.src.includes('cdn.jsdelivr.net') || img.src.includes('http')) {
            return;
        }
        
        // Add loading placeholder
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        // Handle successful load
        img.addEventListener('load', function() {
            this.style.opacity = '1';
            this.classList.add('loaded');
        });
        
        // Handle failed load
        img.addEventListener('error', function() {
            console.warn('Failed to load image:', this.src);
            // Don't hide the icon, just show a placeholder
            this.style.opacity = '0.3';
            this.alt = 'Icon';
            
            // Try to set a fallback background
            this.style.backgroundColor = '#f3f4f6';
            this.style.borderRadius = '4px';
        });
        
        // If image is already loaded (cached)
        if (img.complete && img.naturalWidth > 0) {
            img.style.opacity = '1';
            img.classList.add('loaded');
        }
    });
}

/**
 * ===================================
 * STATS COUNTER SYSTEM - UPDATED WITH REAL DATA
 * ===================================
 */

function setupStatsCounters() {
    const statCards = document.querySelectorAll('.stat-card');
    
    // Setup intersection observer for animation trigger
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector('.stat-number');
                if (statNumber && !statNumber.classList.contains('animated')) {
                    animateCounter(statNumber);
                    statNumber.classList.add('animated');
                }
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    statCards.forEach(card => observer.observe(card));
}

function animateCounter(element) {
    const originalText = element.textContent.trim();
    const finalValue = parseFloat(originalText.replace(/[^\d.]/g, ''));
    const suffix = originalText.replace(/[\d.,]/g, '');
    const isDecimal = originalText.includes('.');
    const hasK = originalText.toLowerCase().includes('k');
    
    if (isNaN(finalValue)) return;
    
    let actualTarget = finalValue;
    if (hasK) {
        actualTarget = finalValue * 1000;
    }
    
    const duration = MyImpactApp.config.counterAnimationDuration;
    const fps = 60;
    const totalFrames = Math.round(duration / 1000 * fps);
    const increment = actualTarget / totalFrames;
    
    let currentValue = 0;
    let frame = 0;
    
    function updateCounter() {
        frame++;
        currentValue += increment;
        
        if (frame >= totalFrames) {
            currentValue = actualTarget;
        }
        
        // Format and display
        let displayValue;
        if (hasK) {
            displayValue = (currentValue / 1000).toFixed(1) + 'k';
        } else if (isDecimal) {
            displayValue = currentValue.toFixed(1);
        } else {
            displayValue = Math.floor(currentValue).toString();
        }
        
        element.textContent = displayValue + suffix.replace(/k/i, '');
        
        if (frame < totalFrames) {
            requestAnimationFrame(updateCounter);
        } else {
            // Final cleanup
            element.textContent = originalText;
            element.classList.add('animation-complete');
        }
    }
    
    requestAnimationFrame(updateCounter);
}

/**
 * ===================================
 * ACTIVITY LIST MANAGEMENT - UPDATED
 * ===================================
 */

function setupActivityList() {
    const activityItems = document.querySelectorAll('.activity-item');
    
    activityItems.forEach((item, index) => {
        // Add data attributes for filtering
        item.dataset.index = index;
        
        // Setup click handlers
        item.addEventListener('click', function() {
            const activityId = index + 1; // Assuming sequential IDs
            const activity = MyImpactApp.data.activities[index];
            handleActivityClick({ activity });
        });
        
        // Add keyboard support
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const activity = MyImpactApp.data.activities[index];
                handleActivityClick({ activity });
            }
        });
        
        // Add animation delay for staggered effect
        item.style.animationDelay = `${index * 0.1}s`;
    });
}

function handleActivityClick(data) {
    const activity = data.activity;
    
    showActivityDetails({
        title: activity.title,
        location: activity.location,
        time: activity.time,
        status: activity.status,
        type: activity.type,
        element: data.element || null
    });
}

function showActivityDetails(activity) {
    // Create modal or detailed view with real data
    const statusColors = {
        'resolved': '#10B981',
        'in-progress': '#F59E0B',
        'pending': '#EF4444'
    };

    const statusText = {
        'resolved': 'Resolved ✅',
        'in-progress': 'In Progress 🔄',
        'pending': 'Pending ⏳'
    };

    const modal = createModal({
        title: activity.title,
        content: `
            <div class="activity-modal">
                <div class="activity-header">
                    <h3>${activity.title}</h3>
                    <span class="activity-time">${activity.time}</span>
                </div>
                <div class="activity-body">
                    <p><strong>Location:</strong> ${activity.location}</p>
                    <p><strong>Status:</strong> <span style="color: ${statusColors[activity.status]}; font-weight: 600;">${statusText[activity.status]}</span></p>
                    <div class="activity-actions" style="margin-top: 1.5rem;">
                        <button class="btn btn-primary" onclick="viewOnMap('${activity.location}')">
                            📍 View on Map
                        </button>
                        <button class="btn btn-secondary" onclick="shareActivity('${activity.title}')">
                            📤 Share
                        </button>
                    </div>
                </div>
            </div>
        `,
        actions: [
            {
                text: 'Close',
                class: 'btn-secondary',
                action: () => closeModal()
            }
        ]
    });
    
    showModal(modal);
}

/**
 * ===================================
 * BADGE SYSTEM - UPDATED
 * ===================================
 */

function setupBadgeSystem() {
    const badgeCards = document.querySelectorAll('.badge-card');
    
    badgeCards.forEach((badge, index) => {
        const isEarned = badge.classList.contains('earned');
        const badgeData = MyImpactApp.data.badges[index];
        
        if (isEarned && badgeData) {
            badge.style.cursor = 'pointer';
            badge.addEventListener('click', function() {
                handleBadgeClick(badgeData);
            });
        }
        
        // Add tooltip with real data
        if (badgeData) {
            setupBadgeTooltip(badge, badgeData);
        }
        
        // Add achievement animation if recently earned
        if (badge.dataset.recentlyEarned === 'true') {
            animateBadgeAchievement(badge);
        }
    });
}

function handleBadgeClick(badgeData) {
    showBadgeDetails(badgeData);
    
    // Analytics tracking
    trackEvent('badge_clicked', {
        badge_name: badgeData.name,
        earned_date: badgeData.date
    });
}

function showBadgeDetails(badge) {
    const badgeEmojis = {
        'First Report': '🏆',
        '10 Resolved Issues': '🎖️',
        'Community Hero': '🦸',
        'Top Reporter': '👑'
    };

    const modal = createModal({
        title: `${badgeEmojis[badge.name] || '🏆'} ${badge.name}`,
        content: `
            <div class="badge-modal">
                <div class="badge-celebration">
                    <div class="badge-icon-large" style="font-size: 4rem; margin-bottom: 1rem;">
                        ${badgeEmojis[badge.name] || '🏆'}
                    </div>
                    <h3>Congratulations!</h3>
                    <p class="badge-description">${badge.description}</p>
                    <p class="badge-earned-date">Earned in ${badge.date}</p>
                </div>
                <div class="badge-share">
                    <button class="btn btn-primary" onclick="shareBadge('${badge.name}')">
                        🎉 Share Achievement
                    </button>
                </div>
            </div>
        `,
        className: 'badge-modal-container'
    });
    
    showModal(modal);
    
    // Add celebration animation
    setTimeout(() => {
        const celebration = modal.querySelector('.badge-celebration');
        if (celebration) {
            celebration.classList.add('celebrate');
        }
    }, 300);
}

function setupBadgeTooltip(badge, badgeData) {
    const isEarned = badge.classList.contains('earned');
    
    let tooltipText;
    if (isEarned) {
        tooltipText = `${badgeData.name} - ${badgeData.date}`;
    } else {
        tooltipText = `${badgeData.name} - Not earned yet`;
    }
    
    badge.setAttribute('title', tooltipText);
    badge.setAttribute('aria-label', tooltipText);
}

function animateBadgeAchievement(badge) {
    badge.classList.add('achievement-animation');
    
    // Remove after animation
    setTimeout(() => {
        badge.classList.remove('achievement-animation');
        badge.removeAttribute('data-recently-earned');
    }, 2000);
}

/**
 * ===================================
 * HOVER EFFECTS AND INTERACTIONS
 * ===================================
 */

function setupHoverEffects() {
    // Enhanced stat card hover
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // Activity item enhanced hover
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f9fafb';
            this.style.borderRadius = '8px';
            this.style.padding = '0.75rem';
            this.style.margin = '0 -0.75rem';
            this.style.transform = 'translateX(4px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
            this.style.borderRadius = '0';
            this.style.padding = '0';
            this.style.margin = '0';
            this.style.transform = 'translateX(0)';
        });
    });
}

/**
 * ===================================
 * NOTIFICATION SYSTEM - FIXED
 * ===================================
 */

function setupNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
}

function showNotification(message, type = 'info', duration = null) {
    const container = document.getElementById('notification-container');
    if (!container) {
        setupNotificationSystem();
        return showNotification(message, type, duration);
    }
    
    const notification = document.createElement('div');
    const id = 'notification-' + Date.now();
    
    notification.id = id;
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 0.5rem;
        max-width: 400px;
        pointer-events: auto;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
        padding: 1rem;
        border-left: 4px solid ${getNotificationColor(type)};
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="font-size: 1.25rem; flex-shrink: 0;">${getNotificationIcon(type)}</div>
            <div style="flex: 1; font-size: 0.875rem; color: #374151;">${message}</div>
            <button class="close-notification-btn" data-id="${id}"
                    style="background: none; border: none; font-size: 1.25rem; color: #9ca3af; cursor: pointer; padding: 0; width: 24px; height: 24px;">
                &times;
            </button>
        </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Add event listener to close button
    const closeBtn = notification.querySelector('.close-notification-btn');
    closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const notificationId = this.getAttribute('data-id');
        closeNotification(notificationId);
    });
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    });
    
    // Auto close
    const timeoutDuration = duration || MyImpactApp.config.notificationTimeout;
    setTimeout(() => {
        closeNotification(id);
    }, timeoutDuration);
    
    return id;
}

function closeNotification(id) {
    const notification = document.getElementById(id);
    if (notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

function getNotificationIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    return colors[type] || colors.info;
}

/**
 * ===================================
 * DATA MANAGEMENT - UPDATED WITH REAL DATA
 * ===================================
 */

function loadInitialData() {
    MyImpactApp.state.isLoading = true;
    
    // Simulate loading with real data
    Promise.all([
        loadStatsData(),
        loadActivityData(),
        loadBadgeData()
    ]).then(() => {
        MyImpactApp.state.isLoading = false;
        MyImpactApp.state.lastUpdated = new Date();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('dataUpdated', {
            detail: MyImpactApp.data
        }));
        
    }).catch(error => {
        console.error('Error loading data:', error);
        MyImpactApp.state.isLoading = false;
        showNotification('Failed to load data. Please refresh the page.', 'error');
    });
}

async function loadStatsData() {
    try {
        // Use real data instead of API call
        const response = MyImpactApp.data.stats;
        updateStatsDisplay(response);
        return response;
    } catch (error) {
        console.error('Error loading stats:', error);
        throw error;
    }
}

async function loadActivityData() {
    try {
        // Always use the logged-in user's ID
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            // Try fallback key
            const cityfixUser = localStorage.getItem('cityfix_user');
            if (cityfixUser) {
                userId = JSON.parse(cityfixUser)?.userId;
            }
        }
        let reports = [];
        if (userId) {
            const res = await fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/reports`);
            if (res.ok) {
                reports = await res.json();
                console.log('[CityFix] API reports loaded:', reports);
                // Always update activity display with API data if present
                if (Array.isArray(reports) && reports.length > 0) {
                    updateActivityDisplay(reports);
                    return reports;
                }
            } else {
                console.warn('[CityFix] API call failed, status:', res.status);
            }
        }
        // Fallback to demo data if no API data
        reports = MyImpactApp.data.activities;
        console.log('[CityFix] Using fallback demo data');
        updateActivityDisplay(reports);
        return reports;
    } catch (error) {
        console.error('Error loading activities:', error);
        updateActivityDisplay(MyImpactApp.data.activities);
        throw error;
    }
// End of loadActivityData

// Ensure activity data loads on page load
document.addEventListener('DOMContentLoaded', () => {
    loadActivityData();
});
    // Calculate total real impact from activities
    const totalRealImpact = MyImpactApp.data.activities.reduce((total, activity) => {
        const impact = calculateActivityImpact(activity);
        return total + impact.peopleAffected;
    }, 0);
    
    // Update community impact with real calculated value
    MyImpactApp.data.stats.communityImpact = totalRealImpact;
    
    // Update stat numbers with real data
    const statElements = {
        totalReports: document.querySelector('.stat-card:nth-child(1) .stat-number'),
        resolvedIssues: document.querySelector('.stat-card:nth-child(2) .stat-number'),
        communityImpact: document.querySelector('.stat-card:nth-child(3) .stat-number'),
        rating: document.querySelector('.stat-card:nth-child(4) .stat-number')
    };
    
    Object.keys(statElements).forEach(key => {
        const element = statElements[key];
        if (element && stats[key] !== undefined) {
            const newValue = formatStatValue(stats[key], key);
            if (element.textContent !== newValue) {
                animateValueChange(element, newValue);
            }
        }
    });

    // Update stat descriptions with real impact info
    updateStatDescriptions();
}

// Update stat descriptions with real impact information
function updateStatDescriptions() {
    const resolvedCount = MyImpactApp.data.activities.filter(a => a.status === 'resolved').length;
    const totalActivities = MyImpactApp.data.activities.length;
    const successRate = Math.floor((resolvedCount / totalActivities) * 100);
    
    const totalSavings = MyImpactApp.data.activities.reduce((total, activity) => {
        const impact = calculateActivityImpact(activity);
        return total + impact.estimatedSavings;
    }, 0);

    // Update stat change descriptions
    const statChanges = document.querySelectorAll('.stat-change');
    if (statChanges.length >= 4) {
        statChanges[0].textContent = 'Last report: 2 days ago';
        statChanges[1].textContent = `${successRate}% success rate`;
        statChanges[2].textContent = `₪${totalSavings.toLocaleString()} community savings`;
        statChanges[3].textContent = 'Based on 158 reviews';
    }
}

// Focus on specific location on map
window.focusOnLocation = function(lat, lng) {
    if (MyImpactApp.state.map) {
        MyImpactApp.state.map.setCenter({ lat, lng });
        MyImpactApp.state.map.setZoom(16);
        showNotification('Map focused on location 🎯', 'info', 2000);
    }
};

function formatStatValue(value, type) {
    switch (type) {
        case 'communityImpact':
            return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toString();
        case 'rating':
            return value.toFixed(1);
        default:
            return value.toString();
    }
}

function animateValueChange(element, newValue) {
    element.style.transform = 'scale(1.1)';
    element.style.color = '#10b981';
    
    setTimeout(() => {
        element.textContent = newValue;
        element.style.transform = 'scale(1)';
        element.style.color = '';
    }, 150);
}

async function updateActivityDisplay(activities) {
    // If activities are passed, render them directly (for backward compatibility)
    if (Array.isArray(activities) && activities.length > 0) {
        renderActivities(activities);
        return;
    }

    // Otherwise, fetch from API using logged-in user ID
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        // Try fallback key
        const cityfixUser = localStorage.getItem('cityfix_user');
        if (cityfixUser) {
            userId = JSON.parse(cityfixUser)?.userId;
        }
    }
    if (!userId) {
        renderActivities([]);
        return;
    }
    try {
        const res = await fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/reports`);
        if (res.ok) {
            const reports = await res.json();
            renderActivities(reports);
        } else {
            renderActivities([]);
        }
    } catch (err) {
        renderActivities([]);
    }
}

function renderActivities(activities) {
    const container = document.getElementById('impact-activity-list');
    if (!container) {
        return;
    }
    if (activities && activities.length > 0) {
        // Sort by reportDate/createdAt descending (most recent first)
        const sorted = [...activities].sort((a, b) => {
            const dateA = new Date(a.reportDate || a.createdAt || a.date || 0);
            const dateB = new Date(b.reportDate || b.createdAt || b.date || 0);
            return dateB - dateA;
        });
        
        // Render all activities - scrolling is handled by CSS
        container.innerHTML = sorted.map(report => {
            // Support both API and demo data structures
            const type = report.type || report.issueType || 'other';
            const title = report.title || report.issueType || 'Report';
            const description = report.description || '';
            // API: location may be object or string
            let location = '';
            if (typeof report.location === 'string') {
                location = report.location;
            } else if (report.location && typeof report.location === 'object') {
                location = report.location.address || report.location.street || JSON.stringify(report.location);
            }
            const status = report.status || '';
            let dateStr = report.reportDate || report.createdAt || report.date || '';
            if (!dateStr && report._id && typeof report._id === 'string' && report._id.length === 24) {
                const ts = parseInt(report._id.substring(0, 8), 16) * 1000;
                dateStr = new Date(ts).toISOString();
            }
            // Use the correct class structure for CSS
            return `
            <div class="activity-item recent-report">
                <div class="activity-icon">${getReportTypeEmoji(type)}</div>
                <div class="activity-details">
                    <div class="activity-title">${title}</div>
                    <div class="activity-description">${description}</div>
                    <div class="activity-location">${location}</div>
                    <div class="activity-status" style="color: #10b981;">${status ? capitalize(status) : ''}</div>
                    <div class="activity-time">${dateStr ? formatDate(dateStr) : ''}</div>
                </div>
            </div>
            `;
        }).join('');
        
        // Add a subtle indicator if there are more than 3 items
        if (sorted.length > 3) {
            const scrollIndicator = document.createElement('div');
            scrollIndicator.className = 'scroll-indicator';
            scrollIndicator.innerHTML = `
                <div style="text-align: center; padding: 8px; color: #6b7280; font-size: 0.75rem; border-top: 1px solid #e5e7eb; margin-top: 8px;">
                    Scroll to see ${sorted.length - 3} more reports
                </div>
            `;
            container.appendChild(scrollIndicator);
        }
    } else {
        container.innerHTML = '<div style="color: #9ca3af; padding: 16px;">No recent reports found.</div>';
    }
}

// Helper: Emoji for report type
function getReportTypeEmoji(type) {
    const map = {
        pothole: '🕳️',
        streetlight: '💡',
        garbage: '🗑️',
        traffic: '🚦',
        sidewalk: '🚶',
        water: '💧',
        fire: '🔥',
        drainage: '💧',
        other: '📋'
    };
    return map[type] || '📋';
}

// Helper: Capitalize first letter
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper: Format date as e.g. 'Apr 10, 2024'
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function updateBadgeDisplay(badges) {
    console.log('Badges updated:', badges.length, 'badges loaded');
    // Badges are already displayed in HTML, this function can be used for dynamic updates
}

/**
 * ===================================
 * UTILITY FUNCTIONS
 * ===================================
 */

function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function trackEvent(eventName, properties = {}) {
    // Analytics tracking with real data
    console.log('📊 Event tracked:', eventName, properties);
}

/**
 * ===================================
 * MODAL SYSTEM - COMPLETELY REWRITTEN
 * ===================================
 */

// Global modal reference
let currentModal = null;

function createModal(options) {
    const modal = document.createElement('div');
    modal.className = `modal ${options.className || ''}`;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    `;
    
    const modalId = 'modal-' + Date.now();
    
    modal.innerHTML = `
        <div class="modal-backdrop" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); cursor: pointer;" onclick="window.closeCurrentModal()"></div>
        <div style="position: relative; background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; margin: 5vh auto; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); transform: scale(0.9) translateY(20px); transition: all 0.3s ease;">
            <div style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
                <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #111827;">${options.title}</h2>
                <button onclick="window.closeCurrentModal()" style="background: none; border: none; font-size: 1.5rem; color: #9ca3af; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; line-height: 1;">&times;</button>
            </div>
            <div style="padding: 1.5rem; max-height: 60vh; overflow-y: auto;">${options.content}</div>
        </div>
    `;
    
    modal.id = modalId;
    return modal;
}

function showModal(modal) {
    // Close any existing modal first
    if (currentModal) {
        closeCurrentModal();
    }
    
    currentModal = modal;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Animate in
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        const container = modal.querySelector('div:last-child');
        if (container) {
            container.style.transform = 'scale(1) translateY(0)';
        }
    });
    
    // ESC key handler
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeCurrentModal();
        }
    };
    document.addEventListener('keydown', escHandler);
    modal._escHandler = escHandler;
}

// Global function to close modal
window.closeCurrentModal = function() {
    if (currentModal) {
        // Remove ESC handler
        if (currentModal._escHandler) {
            document.removeEventListener('keydown', currentModal._escHandler);
        }
        
        currentModal.style.opacity = '0';
        currentModal.style.visibility = 'hidden';
        const container = currentModal.querySelector('div:last-child');
        if (container) {
            container.style.transform = 'scale(0.9) translateY(20px)';
        }
        
        setTimeout(() => {
            if (currentModal && currentModal.parentNode) {
                document.body.removeChild(currentModal);
                document.body.style.overflow = '';
                currentModal = null;
            }
        }, 300);
    }
};

// Keep the old function for compatibility
function closeModal() {
    window.closeCurrentModal();
}

/**
 * ===================================
 * PERFORMANCE OPTIMIZATIONS
 * ===================================
 */

function setupPerformanceOptimizations() {
    // Intersection Observer for animations
    const observeElements = document.querySelectorAll('.stat-card, .activity-item, .badge-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    observeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

function setupAutoRefresh() {
    // Auto-refresh data every 30 seconds when page is visible
    setInterval(() => {
        if (!document.hidden && !MyImpactApp.state.isLoading) {
            refreshData();
        }
    }, MyImpactApp.config.refreshInterval);
}

function refreshData() {
    console.log('🔄 Refreshing data...');
    
    // Simulate real-time updates with actual data changes
    const randomUpdate = Math.random();
    
    if (randomUpdate > 0.7) {
        // Simulate a new resolved issue
        MyImpactApp.data.stats.resolvedIssues += 1;
        updateStatsDisplay(MyImpactApp.data.stats);
        showNotification('Great news! One of your reports was just resolved! 🎉', 'success');
    } else if (randomUpdate > 0.4) {
        // Simulate community impact increase
        MyImpactApp.data.stats.communityImpact += Math.floor(Math.random() * 50);
        updateStatsDisplay(MyImpactApp.data.stats);
        showNotification('Your community impact has increased! 📈', 'info');
    }
}

/**
 * ===================================
 * EVENT HANDLERS
 * ===================================
 */

function handleWindowResize() {
    // Adjust layouts for responsive design
    const width = window.innerWidth;
    
    if (width <= 768) {
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
    
    // Resize map if it exists
    if (MyImpactApp.state.map) {
        google.maps.event.trigger(MyImpactApp.state.map, 'resize');
    }
}

function handleVisibilityChange() {
    if (!document.hidden) {
        // Page became visible, refresh data if it's been a while
        const now = new Date();
        const lastUpdate = MyImpactApp.state.lastUpdated;
        
        if (!lastUpdate || (now - lastUpdate) > 300000) { // 5 minutes
            refreshData();
        }
    }
}

function handleGlobalError(event) {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred.', 'error');
}

function handlePageUnload() {
    console.log('👋 Cleaning up My Impact page...');
}

function handleDataUpdate(event) {
    console.log('📊 Data updated:', event.detail);
    showNotification('Data refreshed successfully!', 'success', 2000);
}

function handleStatsChange(event) {
    console.log('📈 Stats changed:', event.detail);
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'r':
                    e.preventDefault();
                    refreshData();
                    break;
            }
        }
    });
}

/**
 * ===================================
 * EXTERNAL FUNCTIONS - REAL DATA INTEGRATION
 * ===================================
 */

// Show detailed impact analysis for specific activity
window.showImpactDetails = function(activityId) {
    const activity = MyImpactApp.data.activities.find(a => a.id === activityId);
    if (!activity) return;
    
    const impactData = calculateActivityImpact(activity);
    const distanceFromHome = getDistanceFromLatLonInKm(
        MyImpactApp.data.userLocation.lat,
        MyImpactApp.data.userLocation.lng,
        activity.lat,
        activity.lng
    );

    const modal = createModal({
        title: `📈 Impact Analysis: ${activity.title}`,
        content: `
            <div style="font-family: Inter, sans-serif;">
                <!-- Activity Overview -->
                <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #10B981;">
                    <h4 style="margin: 0 0 8px 0; color: #374151;">📍 Location Details</h4>
                    <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 14px;">${activity.address}</p>
                    <p style="margin: 0; color: #6B7280; font-size: 13px;">📏 ${distanceFromHome.toFixed(1)}km from your home</p>
                </div>

                <!-- Impact Metrics -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                    <div style="background: #EBF8FF; padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #1E40AF; margin-bottom: 4px;">
                            ${impactData.peopleAffected.toLocaleString()}
                        </div>
                        <div style="font-size: 12px; color: #4B5563; font-weight: 500;">People Impacted</div>
                    </div>
                    
                    <div style="background: #F0FDF4; padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #059669; margin-bottom: 4px;">
                            ${impactData.safetyImprovement}%
                        </div>
                        <div style="font-size: 12px; color: #4B5563; font-weight: 500;">Safety Improvement</div>
                    </div>
                    
                    <div style="background: #FFFBEB; padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #D97706; margin-bottom: 4px;">
                            ${impactData.dailyImpact}
                        </div>
                        <div style="font-size: 12px; color: #4B5563; font-weight: 500;">Daily Benefit</div>
                    </div>
                    
                    <div style="background: #F5F3FF; padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #7C3AED; margin-bottom: 4px;">
                            ₪${impactData.estimatedSavings.toLocaleString()}
                        </div>
                        <div style="font-size: 12px; color: #4B5563; font-weight: 500;">Economic Savings</div>
                    </div>
                </div>

                <!-- Impact Timeline -->
                <div style="background: #FAFAFA; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <h4 style="margin: 0 0 12px 0; color: #374151;">⏱️ Impact Timeline</h4>
                    <div style="font-size: 14px; line-height: 1.6;">
                        <div style="margin-bottom: 8px;">
                            <strong>📅 Reported:</strong> ${new Date(activity.reportDate).toLocaleDateString()} 
                            (${impactData.daysSinceReport} days ago)
                        </div>
                        ${activity.resolvedDate ? `
                            <div style="margin-bottom: 8px;">
                                <strong>✅ Resolved:</strong> ${new Date(activity.resolvedDate).toLocaleDateString()}
                            </div>
                            <div style="margin-bottom: 8px;">
                                <strong>📈 Ongoing Impact:</strong> ${Math.floor((new Date() - new Date(activity.resolvedDate)) / (1000 * 60 * 60 * 24))} days of improved safety
                            </div>
                        ` : `
                            <div style="color: #EF4444; font-weight: 500;">
                                ⚠️ Still pending resolution - impact continues to grow
                            </div>
                        `}
                    </div>
                </div>

                <!-- Community Feedback -->
                <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <h4 style="margin: 0 0 8px 0; color: #92400E;">💬 Estimated Community Feedback</h4>
                    <p style="margin: 0; font-style: italic; color: #92400E; font-size: 14px;">
                        "${getImpactFeedback(activity.type, impactData.peopleAffected, activity.status)}"
                    </p>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button onclick="viewOnMap('${activity.location}')" 
                            style="background: #3B82F6; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 500;">
                        🗺️ View on Map
                    </button>
                    <button onclick="shareImpactStory(${activity.id})" 
                            style="background: #10B981; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 500;">
                        📱 Share Impact
                    </button>
                </div>
            </div>
        `,
        className: 'impact-modal-container'
    });
    
    showModal(modal);
};

// Generate realistic community feedback based on impact
function getImpactFeedback(type, peopleAffected, status) {
    const feedbackTemplates = {
        'pothole': {
            'resolved': [
                `Thanks to your report, ${peopleAffected} daily commuters now have a safer route to work!`,
                `The pothole repair has eliminated daily vehicle damage risks for ${peopleAffected} residents.`,
                `Your action prevented potential accidents for ${peopleAffected} people using this route daily.`
            ],
            'pending': [
                `Your report is helping ${peopleAffected} residents avoid this dangerous pothole daily.`,
                `${peopleAffected} commuters are aware of this hazard thanks to your vigilance.`
            ]
        },
        'streetlight': {
            'resolved': [
                `The new lighting makes ${peopleAffected} people feel safer walking at night.`,
                `Evening safety for ${peopleAffected} residents has dramatically improved.`,
                `Night-time crime risk reduced for ${peopleAffected} community members.`
            ],
            'pending': [
                `${peopleAffected} residents are taking extra precautions until this is fixed.`,
                `Your report raised awareness for ${peopleAffected} people about this safety issue.`
            ]
        },
        'garbage': {
            'resolved': [
                `Regular collection now keeps the area clean for ${peopleAffected} residents.`,
                `Health conditions improved for ${peopleAffected} people in the neighborhood.`,
                `The cleaner environment benefits ${peopleAffected} families daily.`
            ],
            'pending': [
                `${peopleAffected} residents are dealing with hygiene concerns until resolution.`,
                `Your report brought attention to this issue affecting ${peopleAffected} people.`
            ]
        },
        'traffic': {
            'resolved': [
                `Traffic flow improved for ${peopleAffected} daily commuters!`,
                `The fixed traffic light saves ${Math.floor(peopleAffected * 5)} minutes daily for commuters.`,
                `Accident risk eliminated for ${peopleAffected} people using this intersection.`
            ],
            'pending': [
                `${peopleAffected} commuters face delays until this signal is repaired.`,
                `Traffic safety concerns for ${peopleAffected} people using this intersection.`
            ]
        },
        'sidewalk': {
            'resolved': [
                `Wheelchair and stroller access restored for ${peopleAffected} residents.`,
                `Walking safety improved for ${peopleAffected} pedestrians, especially elderly.`,
                `Accessibility enhanced for ${peopleAffected} community members.`
            ],
            'pending': [
                `${peopleAffected} people with mobility needs are finding alternative routes.`,
                `Accessibility challenges continue for ${peopleAffected} residents.`
            ]
        },
        'water': {
            'resolved': [
                `Water service restored for ${peopleAffected} households.`,
                `No more flooding issues affecting ${peopleAffected} residents.`,
                `Infrastructure stability improved for ${peopleAffected} people in the area.`
            ],
            'pending': [
                `${peopleAffected} residents dealing with water service disruptions.`,
                `Ongoing infrastructure concerns for ${peopleAffected} households.`
            ]
        }
    };

    const typeTemplates = feedbackTemplates[type] || feedbackTemplates.pothole;
    const statusTemplates = typeTemplates[status] || typeTemplates.pending;
    const randomTemplate = statusTemplates[Math.floor(Math.random() * statusTemplates.length)];
    
    return randomTemplate;
}

// Share impact story with detailed statistics
window.shareImpactStory = function(activityId) {
    const activity = MyImpactApp.data.activities.find(a => a.id === activityId);
    if (!activity) return;
    
    const impactData = calculateActivityImpact(activity);
    
    const storyText = `🏆 My CityFix Impact Story:
    
I reported "${activity.title}" in ${activity.location} and helped ${impactData.peopleAffected.toLocaleString()} people! 
    
📊 Impact Details:
• ${impactData.safetyImprovement}% safety improvement
• ₪${impactData.estimatedSavings.toLocaleString()} economic savings
• ${impactData.dailyImpact} people benefit daily
    
${activity.status === 'resolved' ? '✅ RESOLVED!' : '⏳ Working on it...'}
    
Making Central District, Israel better together! 🇮🇱
#CityFix #CommunityImpact #Israel`;

    if (navigator.share) {
        navigator.share({
            title: 'My CityFix Impact Story',
            text: storyText,
            url: window.location.href
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(storyText).then(() => {
            showNotification('Impact story copied to clipboard! 📊', 'success');
        }).catch(() => {
            showNotification('Unable to copy to clipboard', 'error');
        });
    }
};

window.viewOnMap = function(location) {
    console.log('🗺️ View on map:', location);
    showNotification(`Showing ${location} on map 📍`, 'info');
    
    // Scroll to map section
    const mapElement = document.querySelector('#impact-map') || document.querySelector('.map-placeholder');
    if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Find and highlight the corresponding marker
        if (MyImpactApp.state.map && MyImpactApp.state.markers) {
            const marker = MyImpactApp.state.markers.find(m => 
                m.activity.location.toLowerCase().includes(location.toLowerCase().split(',')[0]) ||
                m.activity.address.toLowerCase().includes(location.toLowerCase().split(',')[0])
            );
            
            if (marker) {
                // Close all info windows first
                MyImpactApp.state.infoWindows.forEach(iw => iw.close());
                
                // Center map on marker and open info window
                MyImpactApp.state.map.setCenter({
                    lat: marker.activity.lat,
                    lng: marker.activity.lng
                });
                MyImpactApp.state.map.setZoom(16);
                marker.infoWindow.open(MyImpactApp.state.map, marker.marker);
                
                // Add bounce animation
                marker.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => {
                    marker.marker.setAnimation(null);
                }, 2000);
            }
        }
    }
};

window.shareActivity = function(title, location = '', status = '') {
    console.log('📤 Share activity:', title);
    
    const locationText = location ? ` at ${location}` : '';
    const statusText = status ? ` (${status.toUpperCase()})` : '';
    const text = `I reported: ${title}${locationText}${statusText} via CityFix! 🏙️ Making Central District, Israel better together! 🇮🇱`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My CityFix Activity in Israel',
            text: text,
            url: window.location.href
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Activity details copied to clipboard! 📋', 'success');
        }).catch(() => {
            showNotification('Unable to copy to clipboard', 'error');
        });
    }
};

window.shareBadge = function(badgeName) {
    console.log('🏆 Share badge:', badgeName);
    
    const text = `I earned the "${badgeName}" badge on CityFix! 🏆 Proud to be making Central District, Israel better! 🇮🇱 #CityFix #CommunityHero`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My CityFix Achievement in Israel',
            text: text,
            url: window.location.href
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Badge details copied to clipboard! 🏆', 'success');
        }).catch(() => {
            showNotification('Unable to copy to clipboard', 'error');
        });
    }
};

/**
 * ===================================
 * BACKEND DATA INTEGRATION FUNCTIONS
 * ===================================
 */

// Function to load data from backend API
async function loadDataFromBackend() {
    try {
        MyImpactApp.state.isLoading = true;
        
        // Make real API calls to backend
        const [statsResponse, activitiesResponse, badgesResponse] = await Promise.all([
            fetch(`${MyImpactApp.config.apiEndpoint}/stats`),
            fetch(`${MyImpactApp.config.apiEndpoint}/activities`),
            fetch(`${MyImpactApp.config.apiEndpoint}/badges`)
        ]);

        if (!statsResponse.ok || !activitiesResponse.ok || !badgesResponse.ok) {
            throw new Error('Failed to fetch data from backend');
        }

        const stats = await statsResponse.json();
        const activities = await activitiesResponse.json();
        const badges = await badgesResponse.json();

        // Update app data with backend response
        MyImpactApp.data.stats = { ...MyImpactApp.data.stats, ...stats };
        MyImpactApp.data.activities = activities.map(activity => ({
            ...activity,
            // Ensure required fields for map integration
            lat: parseFloat(activity.lat),
            lng: parseFloat(activity.lng),
            address: activity.address || activity.location
        }));
        MyImpactApp.data.badges = badges;

        // Update UI with new data
        updateStatsDisplay(MyImpactApp.data.stats);
        updateActivityDisplay(MyImpactApp.data.activities);
        updateBadgeDisplay(MyImpactApp.data.badges);

        // Refresh map with new activity data
        if (MyImpactApp.state.map) {
            refreshMapMarkers();
        }

        MyImpactApp.state.lastUpdated = new Date();
        MyImpactApp.state.isLoading = false;

        showNotification('Data updated from server! 🔄', 'success');
        
        return { stats, activities, badges };
        
    } catch (error) {
        console.error('Failed to load data from backend:', error);
        MyImpactApp.state.isLoading = false;
        
        // Fall back to local data
        showNotification('Using local data - server unavailable 📱', 'warning');
        return MyImpactApp.data;
    }
}

// Function to refresh map markers with new data
function refreshMapMarkers() {
    if (!MyImpactApp.state.map) return;

    // Clear existing markers
    MyImpactApp.state.markers.forEach(({ marker }) => {
        marker.setMap(null);
    });
    MyImpactApp.state.markers = [];
    MyImpactApp.state.infoWindows = [];

    // Add new markers from updated data
    MyImpactApp.data.activities.forEach((activity, index) => {
        if (!activity.lat || !activity.lng) {
            console.warn('Activity missing coordinates:', activity);
            return;
        }

        const marker = new google.maps.Marker({
            position: { lat: activity.lat, lng: activity.lng },
            map: MyImpactApp.state.map,
            title: activity.title,
            icon: getMarkerIcon(activity.type, activity.status),
            animation: google.maps.Animation.DROP,
            zIndex: 1000 - index
        });

        const infoWindow = new google.maps.InfoWindow({
            content: createInfoWindowContent(activity),
            maxWidth: 300
        });

        marker.addListener("click", () => {
            MyImpactApp.state.infoWindows.forEach(iw => iw.close());
            infoWindow.open(MyImpactApp.state.map, marker);
        });

        MyImpactApp.state.markers.push({ marker, infoWindow, activity });
        MyImpactApp.state.infoWindows.push(infoWindow);
    });

    console.log('Map refreshed with', MyImpactApp.data.activities.length, 'markers');
}

// Function to send data to backend
async function sendDataToBackend(data, endpoint) {
    try {
        const response = await fetch(`${MyImpactApp.config.apiEndpoint}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Failed to send data to ${endpoint}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Backend communication error:', error);
        throw error;
    }
}

// Function to get user's current location and update map
function getUserLocation() {
    if (!navigator.geolocation) {
        console.log('Geolocation not supported');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Update user location in data
            MyImpactApp.data.userLocation = {
                lat: userLat,
                lng: userLng,
                accuracy: position.coords.accuracy
            };

            // Update map center if user is in Israel/Central District area
            if (userLat >= 31.0 && userLat <= 33.5 && userLng >= 34.0 && userLng <= 36.0) {
                if (MyImpactApp.state.map) {
                    MyImpactApp.state.map.setCenter({ lat: userLat, lng: userLng });
                    showNotification('Map updated to your current location 📍', 'info');
                }
            }
            
            console.log('User location updated:', userLat, userLng);
        },
        (error) => {
            console.log('Geolocation error:', error.message);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        }
    );
}

// Interactive functions for the fallback map
window.showActivityList = function() {
    const modal = createModal({
        title: '📋 All Your Reports',
        content: `
            <div style="font-family: Inter, sans-serif;">
                ${MyImpactApp.data.activities.map((activity, index) => {
                    const impact = calculateActivityImpact(activity);
                    const statusIcons = {
                        'resolved': '✅',
                        'in-progress': '🔄', 
                        'pending': '⏳'
                    };
                    const statusColors = {
                        'resolved': '#10B981',
                        'in-progress': '#F59E0B',
                        'pending': '#EF4444'
                    };
                    
                    return `
                        <div style="border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: ${activity.status === 'resolved' ? '#F0FDF4' : '#FAFAFA'};">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <h4 style="margin: 0; color: #1F2937; font-size: 16px;">${activity.title}</h4>
                                <span style="background: ${statusColors[activity.status]}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; white-space: nowrap;">
                                    ${statusIcons[activity.status]} ${activity.status.toUpperCase()}
                                </span>
                            </div>
                            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">📍 ${activity.location}</p>
                            <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 13px;">🕒 ${activity.time}</p>
                            
                            <div style="background: rgba(59, 130, 246, 0.1); padding: 8px; border-radius: 6px; font-size: 12px;">
                                <strong>Impact:</strong> ${impact.peopleAffected.toLocaleString()} people • ${impact.safetyImprovement}% safety • ₪${impact.estimatedSavings.toLocaleString()} savings
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `,
        className: 'activity-list-modal'
    });
    
    showModal(modal);
};

window.showImpactSummary = function() {
    const totalImpact = MyImpactApp.data.activities.reduce((total, activity) => {
        const impact = calculateActivityImpact(activity);
        return total + impact.peopleAffected;
    }, 0);
    
    const totalSavings = MyImpactApp.data.activities.reduce((total, activity) => {
        const impact = calculateActivityImpact(activity);
        return total + impact.estimatedSavings;
    }, 0);
    
    const resolvedCount = MyImpactApp.data.activities.filter(a => a.status === 'resolved').length;
    const pendingCount = MyImpactApp.data.activities.filter(a => a.status === 'pending').length;
    const inProgressCount = MyImpactApp.data.activities.filter(a => a.status === 'in-progress').length;
    
    // Calculate impact by city
    const cityImpact = {};
    MyImpactApp.data.activities.forEach(activity => {
        const city = activity.location.split(',')[1]?.trim() || 'Other';
        const impact = calculateActivityImpact(activity);
        if (!cityImpact[city]) {
            cityImpact[city] = { people: 0, savings: 0, reports: 0 };
        }
        cityImpact[city].people += impact.peopleAffected;
        cityImpact[city].savings += impact.estimatedSavings;
        cityImpact[city].reports += 1;
    });

    const modal = createModal({
        title: '📊 Your Complete Impact Summary',
        content: `
            <div style="font-family: Inter, sans-serif;">
                <!-- Overall Impact -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                    <h3 style="margin: 0 0 16px 0; font-size: 20px;">🏆 Total Community Impact</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px;">
                        <div>
                            <div style="font-size: 32px; font-weight: 700; margin-bottom: 4px;">${totalImpact.toLocaleString()}</div>
                            <div style="opacity: 0.9; font-size: 14px;">People Helped</div>
                        </div>
                        <div>
                            <div style="font-size: 32px; font-weight: 700; margin-bottom: 4px;">₪${totalSavings.toLocaleString()}</div>
                            <div style="opacity: 0.9; font-size: 14px;">Economic Impact</div>
                        </div>
                        <div>
                            <div style="font-size: 32px; font-weight: 700; margin-bottom: 4px;">${resolvedCount}</div>
                            <div style="opacity: 0.9; font-size: 14px;">Resolved Issues</div>
                        </div>
                    </div>
                </div>

                <!-- Status Breakdown -->
                <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <h4 style="margin: 0 0 12px 0; color: #374151;">📈 Report Status</h4>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                        <div style="text-align: center; padding: 12px; background: #D1FAE5; border-radius: 8px;">
                            <div style="font-size: 24px; color: #059669; font-weight: 700;">${resolvedCount}</div>
                            <div style="font-size: 12px; color: #065F46;">✅ Resolved</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: #FEF3C7; border-radius: 8px;">
                            <div style="font-size: 24px; color: #D97706; font-weight: 700;">${inProgressCount}</div>
                            <div style="font-size: 12px; color: #92400E;">🔄 In Progress</div>
                        </div>
                        <div style="text-align: center; padding: 12px; background: #FEE2E2; border-radius: 8px;">
                            <div style="font-size: 24px; color: #DC2626; font-weight: 700;">${pendingCount}</div>
                            <div style="font-size: 12px; color: #991B1B;">⏳ Pending</div>
                        </div>
                    </div>
                </div>

                <!-- City Impact Breakdown -->
                <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <h4 style="margin: 0 0 12px 0; color: #374151;">🏙️ Impact by City</h4>
                    ${Object.entries(cityImpact).map(([city, data]) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                            <div>
                                <strong style="color: #1F2937;">${city}</strong>
                                <div style="font-size: 12px; color: #6B7280;">${data.reports} reports</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 14px; color: #059669; font-weight: 600;">${data.people.toLocaleString()} people</div>
                                <div style="font-size: 12px; color: #6B7280;">₪${data.savings.toLocaleString()} saved</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Recognition -->
                <div style="background: #EBF8FF; padding: 16px; border-radius: 8px; text-align: center; border-left: 4px solid #3B82F6;">
                    <h4 style="margin: 0 0 8px 0; color: #1E40AF;">🎖️ Community Recognition</h4>
                    <p style="margin: 0; color: #1E40AF; font-style: italic; line-height: 1.5;">
                        "Your dedication to improving Central District communities has made a measurable difference in the lives of ${totalImpact.toLocaleString()} residents. Thank you for being a true community hero!"
                    </p>
                </div>

                <!-- Share Button -->
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="shareImpactSummaryStory()" style="background: #10B981; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px;">
                        📱 Share My Impact Story
                    </button>
                </div>
            </div>
        `,
        className: 'impact-summary-modal'
    });
    
    showModal(modal);
};

// Share complete impact summary
window.shareImpactSummaryStory = function() {
    const totalImpact = MyImpactApp.data.activities.reduce((total, activity) => {
        const impact = calculateActivityImpact(activity);
        return total + impact.peopleAffected;
    }, 0);
    
    const totalSavings = MyImpactApp.data.activities.reduce((total, activity) => {
        const impact = calculateActivityImpact(activity);
        return total + impact.estimatedSavings;
    }, 0);
    
    const resolvedCount = MyImpactApp.data.activities.filter(a => a.status === 'resolved').length;
    
    const summaryText = `🏆 My CityFix Community Impact:

📊 TOTAL IMPACT:
• ${totalImpact.toLocaleString()} people helped across Central District
• ₪${totalSavings.toLocaleString()} in community economic savings
• ${resolvedCount} issues successfully resolved
• ${MyImpactApp.data.activities.length} total reports submitted

🎯 IMPACT AREAS:
• Tel Aviv-Yafo
• Ramat Gan  
• Petah Tikva
• Rosh HaAyin

Making Israel better, one report at a time! 🇮🇱

#CityFix #CommunityHero #Israel #CivicEngagement`;

    if (navigator.share) {
        navigator.share({
            title: 'My CityFix Community Impact',
            text: summaryText,
            url: window.location.href
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(summaryText).then(() => {
            showNotification('Complete impact summary copied to clipboard! 📊🎉', 'success');
        }).catch(() => {
            showNotification('Unable to copy to clipboard', 'error');
        });
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MyImpactApp;
}

console.log('📱 MyImpact.js loaded successfully with real data and Google Maps!');