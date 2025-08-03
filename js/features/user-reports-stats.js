// Fetch and update global report stats on homepage
// This script shows total reports from all users, not just current user

(function() {
    function updateGlobalStats() {
        // Fetch all reports from the database
        fetch('https://city-fix-backend.onrender.com/api/reports/getAllreports')
            .then(res => {
                console.log('[CityFix] Fetching all reports:', res.status, res.statusText);
                return res.ok ? res.json() : null;
            })
            .then(data => {
                console.log('[CityFix] All reports API response:', data);
                if (!data || !Array.isArray(data)) {
                    console.warn('[CityFix] All reports API did not return an array:', data);
                    return;
                }
                const reports = data;
                const total = reports.length;
                const resolved = reports.filter(r => r.status === 'resolved').length;
                const inProgress = reports.filter(r => r.status === 'in-progress' || r.status === 'progress').length;

                console.log(`[CityFix] Global stats: total=${total}, resolved=${resolved}, inProgress=${inProgress}`);
                
                // Log all unique status values to debug
                const allStatuses = [...new Set(reports.map(r => r.status))];
                console.log(`[CityFix] All status values found:`, allStatuses);

                // Update the stats section
                const statNumbers = document.querySelectorAll('.stat-card .stat-number');
                console.log('[CityFix] statNumbers:', statNumbers);
                if (statNumbers[0]) statNumbers[0].textContent = total;
                if (statNumbers[1]) statNumbers[1].textContent = resolved;
                if (statNumbers[2]) statNumbers[2].textContent = inProgress;
            })
            .catch(err => {
                console.warn('[CityFix] Failed to fetch all reports:', err);
                // Fallback: try to get user reports if global endpoint fails
                updateUserStats();
            });
    }

    function updateUserStats() {
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        fetch(`https://city-fix-backend.onrender.com/api/users/${userId}/reports`)
            .then(res => {
                console.log('[CityFix] Fallback: Fetching user reports:', res.status, res.statusText);
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
                const inProgress = reports.filter(r => r.status === 'in-progress' || r.status === 'progress').length;

                console.log(`[CityFix] User stats: total=${total}, resolved=${resolved}, inProgress=${inProgress}`);

                // Update the stats section
                const statNumbers = document.querySelectorAll('.stat-card .stat-number');
                console.log('[CityFix] statNumbers:', statNumbers);
                if (statNumbers[0]) statNumbers[0].textContent = total;
                if (statNumbers[1]) statNumbers[1].textContent = resolved;
                if (statNumbers[2]) statNumbers[2].textContent = inProgress;
            })
            .catch(err => {
                console.warn('[CityFix] Failed to fetch user reports:', err);
            });
    }

    document.addEventListener('DOMContentLoaded', function() {
        // Run once after DOM - now fetches global stats instead of user stats
        setTimeout(updateGlobalStats, 1200); // Wait for homepage.js to finish
    });
})();
