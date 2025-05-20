document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const authSection = document.getElementById('authSection');
    const customerDashboard = document.getElementById('customerDashboard');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const loginMessage = document.getElementById('loginMessage');
    const signupMessage = document.getElementById('signupMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const customerName = document.getElementById('customerName');
    const driverIdInput = document.getElementById('driverIdInput');
    const trackBtn = document.getElementById('trackBtn');
    const trackingInfo = document.getElementById('trackingInfo');
    const driverInfo = document.getElementById('driverInfo');
    const routeInfo = document.getElementById('routeInfo');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const toast = document.getElementById('toast');
    
    // Map variables
    let map;
    let driverMarker;
    let routePath;
    
    // Check if user is logged in
    checkLoginStatus();
    
    // Event Listeners
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding form
            if (tabName === 'login') {
                loginForm.classList.add('active');
                signupForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                signupForm.classList.add('active');
            }
        });
    });
    
    loginBtn.addEventListener('click', function() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showMessage(loginMessage, 'Please fill in all fields', 'error');
            return;
        }
        
        showLoading('Logging in...');
        
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_type: 'customer',
                email: email,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                showCustomerDashboard(data.user.name);
                showToast('Login successful', 'success');
            } else {
                showMessage(loginMessage, data.message, 'error');
            }
        })
        .catch(error => {
            hideLoading();
            showMessage(loginMessage, 'An error occurred. Please try again.', 'error');
            console.error('Error:', error);
        });
    });
    
    signupBtn.addEventListener('click', function() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        if (!name || !email || !password) {
            showMessage(signupMessage, 'Please fill in all fields', 'error');
            return;
        }
        
        showLoading('Creating account...');
        
        fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_type: 'customer',
                name: name,
                email: email,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                showMessage(signupMessage, 'Signup successful! You can now login.', 'success');
                
                // Clear form
                document.getElementById('signupName').value = '';
                document.getElementById('signupEmail').value = '';
                document.getElementById('signupPassword').value = '';
                
                // Switch to login tab
                authTabs[0].click();
            } else {
                showMessage(signupMessage, data.message, 'error');
            }
        })
        .catch(error => {
            hideLoading();
            showMessage(signupMessage, 'An error occurred. Please try again.', 'error');
            console.error('Error:', error);
        });
    });
    
    logoutBtn.addEventListener('click', function() {
        showLoading('Logging out...');
        
        fetch('/api/logout', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                showAuthSection();
                showToast('Logout successful', 'success');
                
                // Clear tracking info
                trackingInfo.classList.add('hidden');
                routeInfo.classList.add('hidden');
                
                // Clear map
                if (map) {
                    if (driverMarker) {
                        map.removeLayer(driverMarker);
                    }
                    
                    if (routePath) {
                        map.removeLayer(routePath);
                    }
                }
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
        });
    });
    
    trackBtn.addEventListener('click', function() {
        const driverId = driverIdInput.value.trim();
        
        if (!driverId) {
            showToast('Please enter a Driver ID', 'error');
            return;
        }
        
        showLoading('Tracking driver...');
        
        fetch(`/api/track-driver/${driverId}`)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                showDriverTracking(data.driver, data.current_route);
            } else {
                showToast(data.message, 'error');
            }
        })
        .catch(error => {
            hideLoading();
            showToast('An error occurred. Please try again.', 'error');
            console.error('Error:', error);
        });
    });
    
    // Helper Functions
    function checkLoginStatus() {
        fetch('/api/login', {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user_type === 'customer') {
                showCustomerDashboard(data.user.name);
            } else {
                showAuthSection();
            }
        })
        .catch(error => {
            showAuthSection();
            console.error('Error:', error);
        });
    }
    
    function showAuthSection() {
        authSection.classList.remove('hidden');
        customerDashboard.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
    
    function showCustomerDashboard(name) {
        authSection.classList.add('hidden');
        customerDashboard.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        customerName.textContent = name;
        
        // Initialize map if not already done
        if (!map) {
            setTimeout(function() {
                initMap();
            }, 100);
        }
    }
    
    function initMap() {
        map = L.map('map').setView([40.7128, -74.0060], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }
    
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = 'auth-message';
        
        if (type) {
            element.classList.add(type);
        }
    }
    
    function showLoading(text) {
        loadingText.textContent = text || 'Processing...';
        loadingOverlay.classList.remove('hidden');
    }
    
    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }
    
    function showToast(message, type) {
        toast.textContent = message;
        toast.className = 'toast';
        
        if (type) {
            toast.classList.add(type);
        }
        
        toast.classList.add('show');
        
        setTimeout(function() {
            toast.classList.remove('show');
        }, 3000);
    }
    
    function showDriverTracking(driver, route) {
        // Show tracking info
        trackingInfo.classList.remove('hidden');
        
        // Render driver info
        driverInfo.innerHTML = `
            <div class="info-item">
                <div class="info-label">Driver Name:</div>
                <div class="info-value">${driver.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Truck Number:</div>
                <div class="info-value">${driver.truck_number || 'N/A'}</div>
            </div>
        `;
        
        // Clear existing markers and routes
        if (driverMarker) {
            map.removeLayer(driverMarker);
        }
        
        if (routePath) {
            map.removeLayer(routePath);
        }
        
        // Add driver marker
        if (driver.current_location && driver.current_location.lat && driver.current_location.lng) {
            driverMarker = L.marker([driver.current_location.lat, driver.current_location.lng], {
                icon: L.divIcon({
                    className: 'driver-marker',
                    html: '<i class="fas fa-truck"></i>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(map);
            
            driverMarker.bindPopup(`<b>${driver.name}</b><br>Truck: ${driver.truck_number || 'N/A'}`);
            
            map.setView([driver.current_location.lat, driver.current_location.lng], 13);
        }
        
        // Add route if available
        if (route && route.optimized_route && route.optimized_route.length > 0) {
            const routePoints = route.optimized_route.map(loc => [loc.lat, loc.lng]);
            
            routePath = L.polyline(routePoints, {
                color: '#4a6cf7',
                weight: 5,
                opacity: 0.7,
                lineJoin: 'round'
            }).addTo(map);
            
            // Add markers for each stop
            route.optimized_route.forEach((loc, index) => {
                L.marker([loc.lat, loc.lng], {
                    icon: L.divIcon({
                        className: 'stop-marker',
                        html: `<div class="stop-number">${index + 1}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(map).bindPopup(`Stop ${index + 1}: ${loc.display_name}`);
            });
            
            // Fit map to route
            map.fitBounds(routePath.getBounds(), { padding: [50, 50] });
            
            // Show route info
            routeInfo.classList.remove('hidden');
            const routeDetails = document.getElementById('routeDetails');
            routeDetails.innerHTML = '';
            
            route.optimized_route.forEach((loc, index) => {
                const div = document.createElement('div');
                div.className = 'route-stop';
                div.innerHTML = `
                    <div class="stop-number">${index + 1}</div>
                    <div class="stop-details">
                        <div class="stop-name">${loc.display_name}</div>
                    </div>
                `;
                routeDetails.appendChild(div);
            });
        } else if (driverMarker) {
            // If no route but driver location is available
            map.setView([driver.current_location.lat, driver.current_location.lng], 13);
        } else {
            // Default view if no route or driver location
            map.setView([40.7128, -74.0060], 13);
        }
    }
});