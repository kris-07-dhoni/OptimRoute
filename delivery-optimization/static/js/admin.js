document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const authSection = document.getElementById('authSection');
    const adminDashboard = document.getElementById('adminDashboard');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const loginMessage = document.getElementById('loginMessage');
    const signupMessage = document.getElementById('signupMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminName = document.getElementById('adminName');
    const sectionTitles = document.querySelectorAll('.section-title');
    const driversList = document.getElementById('driversList');
    const driverDetails = document.getElementById('driverDetails');
    const driverInfo = document.getElementById('driverInfo');
    const noDriverSelected = document.getElementById('noDriverSelected');
    const addDriverBtn = document.getElementById('addDriverBtn');
    const addDriverModal = document.getElementById('addDriverModal');
    const editDriverModal = document.getElementById('editDriverModal');
    const deleteDriverModal = document.getElementById('deleteDriverModal');
    const confirmAddDriver = document.getElementById('confirmAddDriver');
    const confirmEditDriver = document.getElementById('confirmEditDriver');
    const confirmDeleteDriver = document.getElementById('confirmDeleteDriver');
    const cancelAddDriver = document.getElementById('cancelAddDriver');
    const cancelEditDriver = document.getElementById('cancelEditDriver');
    const cancelDeleteDriver = document.getElementById('cancelDeleteDriver');
    const closeButtons = document.querySelectorAll('.close-btn');
    const editDriverBtn = document.getElementById('editDriverBtn');
    const deleteDriverBtn = document.getElementById('deleteDriverBtn');
    const deleteDriverName = document.getElementById('deleteDriverName');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const toast = document.getElementById('toast');
    
    // Map variables
    let driverMap;
    let driverMarker;
    let routePath;
    let selectedDriverId = null;
    
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
                user_type: 'admin',
                email: email,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                showAdminDashboard(data.user.name);
                showToast('Login successful', 'success');
                loadDrivers();
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
                user_type: 'admin',
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
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Error:', error);
        });
    });
    
    sectionTitles.forEach(title => {
        title.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            const content = document.getElementById(`${section}Section`);
            
            if (content.classList.contains('active')) {
                content.classList.remove('active');
                content.style.maxHeight = '0';
                this.setAttribute('aria-expanded', 'false');
            } else {
                content.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });
    
    addDriverBtn.addEventListener('click', function() {
        // Clear form
        document.getElementById('driverName').value = '';
        document.getElementById('driverEmail').value = '';
        document.getElementById('driverPassword').value = '';
        document.getElementById('driverTruckNumber').value = '';
        
        // Show modal
        addDriverModal.classList.remove('hidden');
    });
    
    confirmAddDriver.addEventListener('click', function() {
        const name = document.getElementById('driverName').value;
        const email = document.getElementById('driverEmail').value;
        const password = document.getElementById('driverPassword').value;
        const truckNumber = document.getElementById('driverTruckNumber').value;
        
        if (!name || !email || !password || !truckNumber) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        showLoading('Adding driver...');
        
        fetch('/api/drivers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
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
                addDriverModal.classList.add('hidden');
                showToast('Driver added successfully', 'success');
                loadDrivers();
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
    
    editDriverBtn.addEventListener('click', function() {
        if (!selectedDriverId) {
            showToast('No driver selected', 'error');
            return;
        }
        
        showLoading('Loading driver details...');
        
        fetch(`/api/drivers/${selectedDriverId}`)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                // Fill form
                document.getElementById('editDriverName').value = data.driver.name;
                document.getElementById('editDriverEmail').value = data.driver.email;
                document.getElementById('editDriverPassword').value = '';
                document.getElementById('editDriverTruckNumber').value = data.driver.truck_number || '';
                
                // Show modal
                editDriverModal.classList.remove('hidden');
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
    
    confirmEditDriver.addEventListener('click', function() {
        const name = document.getElementById('editDriverName').value;
        const email = document.getElementById('editDriverEmail').value;
        const password = document.getElementById('editDriverPassword').value;
        const truckNumber = document.getElementById('editDriverTruckNumber').value;
        
        if (!name || !email || !truckNumber) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        showLoading('Updating driver...');
        
        const updateData = {
            name: name,
            email: email,
            truck_number: truckNumber
        };
        
        // Only include password if it's not empty
        if (password) {
            updateData.password = password;
        }
        
        fetch(`/api/drivers/${selectedDriverId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                editDriverModal.classList.add('hidden');
                showToast('Driver updated successfully', 'success');
                loadDrivers();
                loadDriverDetails(selectedDriverId);
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
    
    deleteDriverBtn.addEventListener('click', function() {
        if (!selectedDriverId) {
            showToast('No driver selected', 'error');
            return;
        }
        
        // Get driver name
        const driverNameElement = document.querySelector(`#driversList li[data-id="${selectedDriverId}"]`);
        if (driverNameElement) {
            deleteDriverName.textContent = driverNameElement.textContent;
        }
        
        // Show modal
        deleteDriverModal.classList.remove('hidden');
    });
    
    confirmDeleteDriver.addEventListener('click', function() {
        showLoading('Deleting driver...');
        
        fetch(`/api/drivers/${selectedDriverId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                deleteDriverModal.classList.add('hidden');
                showToast('Driver deleted successfully', 'success');
                
                // Clear selected driver
                selectedDriverId = null;
                driverDetails.classList.add('hidden');
                noDriverSelected.classList.remove('hidden');
                
                // Reload drivers list
                loadDrivers();
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
    
    // Close modals
    cancelAddDriver.addEventListener('click', function() {
        addDriverModal.classList.add('hidden');
    });
    
    cancelEditDriver.addEventListener('click', function() {
        editDriverModal.classList.add('hidden');
    });
    
    cancelDeleteDriver.addEventListener('click', function() {
        deleteDriverModal.classList.add('hidden');
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').classList.add('hidden');
        });
    });
    
    // Helper Functions
    function checkLoginStatus() {
        fetch('/api/login', {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user_type === 'admin') {
                showAdminDashboard(data.user.name);
                loadDrivers();
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
        adminDashboard.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
    
    function showAdminDashboard(name) {
        authSection.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        adminName.textContent = name;
        
        // Expand drivers section
        const driversTitle = document.querySelector('[data-section="drivers"]');
        if (driversTitle) {
            driversTitle.click();
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
    
    function loadDrivers() {
        showLoading('Loading drivers...');
        
        fetch('/api/drivers')
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                renderDriversList(data.drivers);
            } else {
                showToast('Failed to load drivers', 'error');
            }
        })
        .catch(error => {
            hideLoading();
            showToast('An error occurred. Please try again.', 'error');
            console.error('Error:', error);
        });
    }
    
    function renderDriversList(drivers) {
        driversList.innerHTML = '';
        
        if (drivers.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No drivers found';
            driversList.appendChild(li);
            return;
        }
        
        drivers.forEach(driver => {
            const li = document.createElement('li');
            li.textContent = driver.name;
            li.setAttribute('data-id', driver._id);
            
            if (driver._id === selectedDriverId) {
                li.classList.add('active');
            }
            
            li.addEventListener('click', function() {
                // Update selected driver
                selectedDriverId = driver._id;
                
                // Update active class
                document.querySelectorAll('#driversList li').forEach(item => {
                    item.classList.remove('active');
                });
                this.classList.add('active');
                
                // Load driver details
                loadDriverDetails(driver._id);
            });
            
            driversList.appendChild(li);
        });
    }
    
    function loadDriverDetails(driverId) {
        showLoading('Loading driver details...');
        
        fetch(`/api/drivers/${driverId}`)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data.success) {
                renderDriverDetails(data.driver, data.current_route);
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
    
    function renderDriverDetails(driver, route) {
        // Show driver details section
        driverDetails.classList.remove('hidden');
        noDriverSelected.classList.add('hidden');
        
        // Render driver info
        driverInfo.innerHTML = `
            <div class="info-item">
                <div class="info-label">Name:</div>
                <div class="info-value">${driver.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email:</div>
                <div class="info-value">${driver.email}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Truck Number:</div>
                <div class="info-value">${driver.truck_number || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Driver ID:</div>
                <div class="info-value">${driver._id}</div>
            </div>
        `;
        
        // Initialize map if not already done
        if (!driverMap) {
            driverMap = L.map('driverMap').setView([40.7128, -74.0060], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(driverMap);
        }
        
        // Clear existing markers and routes
        if (driverMarker) {
            driverMap.removeLayer(driverMarker);
        }
        
        if (routePath) {
            driverMap.removeLayer(routePath);
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
            }).addTo(driverMap);
            
            driverMap.setView([driver.current_location.lat, driver.current_location.lng], 13);
        }
        
        // Add route if available
        if (route && route.optimized_route && route.optimized_route.length > 0) {
            const routePoints = route.optimized_route.map(loc => [loc.lat, loc.lng]);
            
            routePath = L.polyline(routePoints, {
                color: '#4a6cf7',
                weight: 5,
                opacity: 0.7,
                lineJoin: 'round'
            }).addTo(driverMap);
            
            // Add markers for each stop
            route.optimized_route.forEach((loc, index) => {
                L.marker([loc.lat, loc.lng], {
                    icon: L.divIcon({
                        className: 'stop-marker',
                        html: `<div class="stop-number">${index + 1}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(driverMap).bindPopup(`Stop ${index + 1}: ${loc.display_name}`);
            });
            
            // Fit map to route
            driverMap.fitBounds(routePath.getBounds(), { padding: [50, 50] });
        } else if (driverMarker) {
            // If no route but driver location is available
            driverMap.setView([driver.current_location.lat, driver.current_location.lng], 13);
        } else {
            // Default view if no route or driver location
            driverMap.setView([40.7128, -74.0060], 13);
        }
    }
});