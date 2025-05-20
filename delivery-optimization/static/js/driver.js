document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const authSection = document.getElementById('authSection');
    const driverDashboard = document.getElementById('driverDashboard');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const loginMessage = document.getElementById('loginMessage');
    const signupMessage = document.getElementById('signupMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const driverName = document.getElementById('driverName');
    const coordToggle = document.getElementById('coordToggle');
    const coordInputs = document.getElementById('coordInputs');
    const locationInput = document.getElementById('locationInput');
    const latInput = document.getElementById('latInput');
    const lngInput = document.getElementById('lngInput');
    const addLocationBtn = document.getElementById('addLocationBtn');
    const locationsContainer = document.getElementById('locationsContainer');
    const optimizeBtn = document.getElementById('optimizeBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const toast = document.getElementById('toast');
    const routeInfo = document.getElementById('routeInfo');
    const routeDetails = document.getElementById('routeDetails');
    
    // Map variables
    let map;
    let markers = [];
    let routePath;
    let locations = [];
    let currentDriverId = null;
    
    // Check if user is logged in
    checkLoginStatus();
    
    // Initialize map
    function initMap() {
        map = L.map('map').setView([40.7128, -74.0060], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }
    
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
                user_type: 'driver',
                email: email,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                currentDriverId = data.user._id;
                showDriverDashboard(data.user.name);
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
        const truckNumber = document.getElementById('truckNumber').value;
        
        if (!name || !email || !password || !truckNumber) {
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
                user_type: 'driver',
                name: name,
                email: email,
                password: password,
                truck_number: truckNumber
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
                document.getElementById('truckNumber').value = '';
                
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
                
                // Clear data
                locations = [];
                clearMap();
                routeInfo.classList.add('hidden');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
        });
    });
    
    coordToggle.addEventListener('change', function() {
        if (this.checked) {
            coordInputs.classList.remove('hidden');
            locationInput.classList.add('hidden');
        } else {
            coordInputs.classList.add('hidden');
            locationInput.classList.remove('hidden');
        }
    });
    
    addLocationBtn.addEventListener('click', function() {
        if (coordToggle.checked) {
            // Add coordinates
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);
            
            if (isNaN(lat) || isNaN(lng)) {
                showToast('Please enter valid coordinates', 'error');
                return;
            }
            
            addLocation({
                lat: lat,
                lng: lng,
                display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            });
            
            // Clear inputs
            latInput.value = '';
            lngInput.value = '';
        } else {
            // Geocode place name
            const placeName = locationInput.value.trim();
            
            if (!placeName) {
                showToast('Please enter a place name', 'error');
                return;
            }
            
            showLoading('Geocoding location...');
            
            fetch('/api/geocode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    place_name: placeName
                })
            })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                
                if (data.success) {
                    addLocation(data.location);
                    locationInput.value = '';
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch(error => {
                hideLoading();
                showToast('An error occurred. Please try again.', 'error');
                console.error('Error:', error);
            });
        }
    });
    
    optimizeBtn.addEventListener('click', function() {
        if (locations.length < 2) {
            showToast('Please add at least 2 locations', 'error');
            return;
        }
        
        showLoading('Optimizing route...');
        
        fetch('/api/optimize-route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                driver_id: currentDriverId,
                locations: locations
            })
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                showToast('Route optimized successfully', 'success');
                displayOptimizedRoute(data.optimized_route);
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
            if (data.success && data.user_type === 'driver') {
                currentDriverId = data.user._id;
                showDriverDashboard(data.user.name);
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
        driverDashboard.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
    
    function showDriverDashboard(name) {
        authSection.classList.add('hidden');
        driverDashboard.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        driverName.textContent = name;
        
        // Initialize map if not already done
        if (!map) {
            setTimeout(function() {
                initMap();
            }, 100);
        }
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
    
    function addLocation(location) {
        // Add to locations array
        locations.push(location);
        
        // Add to list
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="location-name">${location.display_name}</span>
            <div class="location-actions">
                <button class="remove-location" title="Remove Location">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add remove event listener
        const removeBtn = li.querySelector('.remove-location');
        removeBtn.addEventListener('click', function() {
            const index = locations.indexOf(location);
            if (index !== -1) {
                locations.splice(index, 1);
                li.remove();
                
                // Remove marker
                removeMarker(location);
                
                // Update optimize button
                updateOptimizeButton();
            }
        });
        
        locationsContainer.appendChild(li);
        
        // Add marker to map
        addMarker(location);
        
        // Update optimize button
        updateOptimizeButton();
    }
    
    function addMarker(location) {
        const marker = L.marker([location.lat, location.lng]).addTo(map);
        marker.bindPopup(location.display_name);
        markers.push({
            location: location,
            marker: marker
        });
        
        // Fit map to markers
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.location.lat, m.location.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
    
    function removeMarker(location) {
        const index = markers.findIndex(m => m.location === location);
        if (index !== -1) {
            map.removeLayer(markers[index].marker);
            markers.splice(index, 1);
            
            // Fit map to remaining markers
            if (markers.length > 0) {
                const bounds = L.latLngBounds(markers.map(m => [m.location.lat, m.location.lng]));
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }
    
    function clearMap() {
        // Remove all markers
        markers.forEach(m => map.removeLayer(m.marker));
        markers = [];
        
        // Remove route path
        if (routePath) {
            map.removeLayer(routePath);
            routePath = null;
        }
    }
    
    function updateOptimizeButton() {
        optimizeBtn.disabled = locations.length < 2;
    }
    
    function displayOptimizedRoute(route) {
        // Clear existing route
        if (routePath) {
            map.removeLayer(routePath);
        }
        
        // Create route path
        const routePoints = route.map(loc => [loc.lat, loc.lng]);
        routePath = L.polyline(routePoints, {
            color: '#4a6cf7',
            weight: 5,
            opacity: 0.7,
            lineJoin: 'round'
        }).addTo(map);
        
        // Fit map to route
        map.fitBounds(routePath.getBounds(), { padding: [50, 50] });
        
        // Display route details
        routeInfo.classList.remove('hidden');
        routeDetails.innerHTML = '';
        
        route.forEach((loc, index) => {
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
        
        // Animate route
        animateRoute(routePoints);
    }
    
    function animateRoute(routePoints) {
        let i = 0;
        const animationMarker = L.marker(routePoints[0], {
            icon: L.divIcon({
                className: 'route-animation-marker',
                html: '<i class="fas fa-truck"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(map);
        
        function animate() {
            if (i < routePoints.length - 1) {
                i++;
                animationMarker.setLatLng(routePoints[i]);
                setTimeout(animate, 500);
            }
        }
        
        animate();
    }
});