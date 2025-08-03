// Map statistics functionality for homepage
// Calculates and displays today's reports and top issue type

(function() {
    function updateMapStats() {
        // Fetch all reports from the database
        fetch('https://city-fix-backend.onrender.com/api/reports/getAllreports')
            .then(res => {
                console.log('[CityFix] Fetching reports for map stats:', res.status, res.statusText);
                return res.ok ? res.json() : null;
            })
            .then(data => {
                console.log('[CityFix] Map stats API response:', data);
                if (!data || !Array.isArray(data)) {
                    console.warn('[CityFix] Map stats API did not return an array:', data);
                    return;
                }
                
                const reports = data;
                
                // Calculate today's reports
                const today = new Date();
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
                
                const todayReports = reports.filter(report => {
                    const reportDate = new Date(report.createdAt);
                    return reportDate >= todayStart && reportDate < todayEnd;
                });
                
                console.log(`[CityFix] Today's reports: ${todayReports.length}`);
                
                // Calculate top issue type
                const issueTypeCounts = {};
                reports.forEach(report => {
                    const issueType = report.issueType || 'unknown';
                    issueTypeCounts[issueType] = (issueTypeCounts[issueType] || 0) + 1;
                });
                
                let topIssueType = 'No data';
                let maxCount = 0;
                
                for (const [type, count] of Object.entries(issueTypeCounts)) {
                    if (count > maxCount) {
                        maxCount = count;
                        topIssueType = type;
                    }
                }
                
                console.log('[CityFix] Issue type counts:', issueTypeCounts);
                console.log(`[CityFix] Top issue type: ${topIssueType} (${maxCount} reports)`);
                
                // Update the map stat cards
                const mapStatCards = document.querySelectorAll('.map-stat-card .resolution-percentage');
                
                if (mapStatCards[0]) {
                    mapStatCards[0].textContent = todayReports.length.toString();
                }
                
                if (mapStatCards[1]) {
                    // Capitalize first letter of issue type
                    const formattedTopIssue = topIssueType.charAt(0).toUpperCase() + topIssueType.slice(1);
                    mapStatCards[1].textContent = `${formattedTopIssue} (${maxCount})`;
                }
                
            })
            .catch(err => {
                console.warn('[CityFix] Failed to fetch reports for map stats:', err);
                
                // Show error state
                const mapStatCards = document.querySelectorAll('.map-stat-card .resolution-percentage');
                if (mapStatCards[0]) mapStatCards[0].textContent = 'Error';
                if (mapStatCards[1]) mapStatCards[1].textContent = 'Error';
            });
    }

    document.addEventListener('DOMContentLoaded', function() {
        // Run after DOM is loaded and other scripts have had time to initialize
        setTimeout(updateMapStats, 1500);
    });
})();
