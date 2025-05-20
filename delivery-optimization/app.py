from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
import requests
import json
import os
from datetime import datetime
import math
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

app = Flask(__name__)
app.secret_key = os.urandom(24)
bcrypt = Bcrypt(app)

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['delivery_optimization']
admins_collection = db['admins']
drivers_collection = db['drivers']
customers_collection = db['customers']
routes_collection = db['routes']

# Helper function to calculate distance between two points
def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula to calculate distance between two points
    R = 6371  # Radius of the Earth in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    return distance

# Helper function to geocode place names to coordinates
def geocode_place(place_name):
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={place_name}&format=json&limit=1"
        headers = {
            'User-Agent': 'DeliveryOptimizationApp/1.0'
        }
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if data and len(data) > 0:
            lat = float(data[0]['lat'])
            lon = float(data[0]['lon'])
            display_name = data[0]['display_name']
            return {'lat': lat, 'lng': lon, 'display_name': display_name}
        else:
            return None
    except Exception as e:
        print(f"Geocoding error: {e}")
        return None

# TSP solver using Google OR-Tools
def solve_tsp(locations):
    if len(locations) <= 1:
        return locations
    
    # Create distance matrix
    num_locations = len(locations)
    distance_matrix = []
    
    for i in range(num_locations):
        row = []
        for j in range(num_locations):
            if i == j:
                row.append(0)
            else:
                dist = calculate_distance(
                    locations[i]['lat'], locations[i]['lng'],
                    locations[j]['lat'], locations[j]['lng']
                )
                # Convert to integer (required by OR-Tools)
                row.append(int(dist * 1000))
        distance_matrix.append(row)
    
    # Create routing model
    manager = pywrapcp.RoutingIndexManager(num_locations, 1, 0)
    routing = pywrapcp.RoutingModel(manager)
    
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Set search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    
    # Solve the problem
    solution = routing.SolveWithParameters(search_parameters)
    
    # Get the optimized route
    optimized_route = []
    if solution:
        index = routing.Start(0)
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            optimized_route.append(locations[node_index])
            index = solution.Value(routing.NextVar(index))
    
    return optimized_route

# Routes
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/driver')
def driver():
    return render_template('driver.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/customer')
def customer():
    return render_template('customer.html')

# Authentication routes
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    user_type = data.get('user_type')
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    if not all([user_type, email, password, name]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    # Hash the password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Create user document
    user_data = {
        'email': email,
        'password': hashed_password,
        'name': name,
        'created_at': datetime.now()
    }
    
    # Add to appropriate collection
    if user_type == 'admin':
        if admins_collection.find_one({'email': email}):
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        admins_collection.insert_one(user_data)
    elif user_type == 'driver':
        if drivers_collection.find_one({'email': email}):
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        user_data['truck_number'] = data.get('truck_number', '')
        user_data['current_location'] = {'lat': 0, 'lng': 0}
        drivers_collection.insert_one(user_data)
    elif user_type == 'customer':
        if customers_collection.find_one({'email': email}):
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        customers_collection.insert_one(user_data)
    else:
        return jsonify({'success': False, 'message': 'Invalid user type'}), 400
    
    return jsonify({'success': True, 'message': 'Signup successful'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user_type = data.get('user_type')
    email = data.get('email')
    password = data.get('password')
    
    if not all([user_type, email, password]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    # Get the appropriate collection
    if user_type == 'admin':
        collection = admins_collection
    elif user_type == 'driver':
        collection = drivers_collection
    elif user_type == 'customer':
        collection = customers_collection
    else:
        return jsonify({'success': False, 'message': 'Invalid user type'}), 400
    
    # Find the user
    user = collection.find_one({'email': email})
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    # Check password
    if not bcrypt.check_password_hash(user['password'], password):
        return jsonify({'success': False, 'message': 'Invalid password'}), 401
    
    # Set session
    session['user_id'] = str(user['_id'])
    session['user_type'] = user_type
    session['name'] = user['name']
    
    # Return user data (excluding password)
    user_data = {k: v for k, v in user.items() if k != 'password'}
    user_data['_id'] = str(user_data['_id'])
    
    return jsonify({
        'success': True, 
        'message': 'Login successful',
        'user': user_data
    })

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logout successful'})

# Driver routes
@app.route('/api/geocode', methods=['POST'])
def geocode():
    data = request.json
    place_name = data.get('place_name')
    
    if not place_name:
        return jsonify({'success': False, 'message': 'Place name is required'}), 400
    
    result = geocode_place(place_name)
    if result:
        return jsonify({'success': True, 'location': result})
    else:
        return jsonify({'success': False, 'message': 'Could not geocode the place name'}), 404

@app.route('/api/optimize-route', methods=['POST'])
def optimize_route():
    data = request.json
    driver_id = data.get('driver_id')
    locations = data.get('locations', [])
    
    if not driver_id or not locations or len(locations) < 2:
        return jsonify({'success': False, 'message': 'Driver ID and at least 2 locations are required'}), 400
    
    # Solve TSP
    optimized_route = solve_tsp(locations)
    
    # Save route to database
    route_data = {
        'driver_id': driver_id,
        'input_locations': locations,
        'optimized_route': optimized_route,
        'created_at': datetime.now()
    }
    route_id = routes_collection.insert_one(route_data).inserted_id
    
    # Update driver's current route
    drivers_collection.update_one(
        {'_id': ObjectId(driver_id)},
        {'$set': {'current_route_id': str(route_id)}}
    )
    
    return jsonify({
        'success': True,
        'route_id': str(route_id),
        'optimized_route': optimized_route
    })

@app.route('/api/update-driver-location', methods=['POST'])
def update_driver_location():
    data = request.json
    driver_id = data.get('driver_id')
    location = data.get('location')
    
    if not driver_id or not location:
        return jsonify({'success': False, 'message': 'Driver ID and location are required'}), 400
    
    # Update driver's current location
    drivers_collection.update_one(
        {'_id': ObjectId(driver_id)},
        {'$set': {'current_location': location}}
    )
    
    return jsonify({'success': True, 'message': 'Location updated successfully'})

# Admin routes
@app.route('/api/drivers', methods=['GET'])
def get_drivers():
    drivers = list(drivers_collection.find({}, {'password': 0}))
    for driver in drivers:
        driver['_id'] = str(driver['_id'])
    
    return jsonify({'success': True, 'drivers': drivers})

@app.route('/api/drivers/<driver_id>', methods=['GET'])
def get_driver(driver_id):
    driver = drivers_collection.find_one({'_id': ObjectId(driver_id)}, {'password': 0})
    if not driver:
        return jsonify({'success': False, 'message': 'Driver not found'}), 404
    
    driver['_id'] = str(driver['_id'])
    
    # Get driver's current route
    current_route = None
    if 'current_route_id' in driver:
        route = routes_collection.find_one({'_id': ObjectId(driver['current_route_id'])})
        if route:
            route['_id'] = str(route['_id'])
            current_route = route
    
    return jsonify({
        'success': True,
        'driver': driver,
        'current_route': current_route
    })

@app.route('/api/drivers', methods=['POST'])
def add_driver():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    truck_number = data.get('truck_number', '')
    
    if not all([email, password, name]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    # Check if email already exists
    if drivers_collection.find_one({'email': email}):
        return jsonify({'success': False, 'message': 'Email already exists'}), 400
    
    # Hash the password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    # Create driver document
    driver_data = {
        'email': email,
        'password': hashed_password,
        'name': name,
        'truck_number': truck_number,
        'current_location': {'lat': 0, 'lng': 0},
        'created_at': datetime.now()
    }
    
    # Insert driver
    driver_id = drivers_collection.insert_one(driver_data).inserted_id
    
    return jsonify({
        'success': True,
        'message': 'Driver added successfully',
        'driver_id': str(driver_id)
    })

@app.route('/api/drivers/<driver_id>', methods=['PUT'])
def update_driver(driver_id):
    data = request.json
    
    # Fields that can be updated
    update_fields = {}
    if 'name' in data:
        update_fields['name'] = data['name']
    if 'truck_number' in data:
        update_fields['truck_number'] = data['truck_number']
    if 'email' in data:
        update_fields['email'] = data['email']
    
    # Update password if provided
    if 'password' in data and data['password']:
        update_fields['password'] = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    if not update_fields:
        return jsonify({'success': False, 'message': 'No fields to update'}), 400
    
    # Update driver
    result = drivers_collection.update_one(
        {'_id': ObjectId(driver_id)},
        {'$set': update_fields}
    )
    
    if result.matched_count == 0:
        return jsonify({'success': False, 'message': 'Driver not found'}), 404
    
    return jsonify({'success': True, 'message': 'Driver updated successfully'})

@app.route('/api/drivers/<driver_id>', methods=['DELETE'])
def delete_driver(driver_id):
    # Delete driver
    result = drivers_collection.delete_one({'_id': ObjectId(driver_id)})
    
    if result.deleted_count == 0:
        return jsonify({'success': False, 'message': 'Driver not found'}), 404
    
    # Delete associated routes
    routes_collection.delete_many({'driver_id': driver_id})
    
    return jsonify({'success': True, 'message': 'Driver deleted successfully'})

# Customer routes
@app.route('/api/track-driver/<driver_id>', methods=['GET'])
def track_driver(driver_id):
    driver = drivers_collection.find_one({'_id': ObjectId(driver_id)}, {'password': 0})
    if not driver:
        return jsonify({'success': False, 'message': 'Driver not found'}), 404
    
    driver['_id'] = str(driver['_id'])
    
    # Get driver's current route
    current_route = None
    if 'current_route_id' in driver:
        route = routes_collection.find_one({'_id': ObjectId(driver['current_route_id'])})
        if route:
            route['_id'] = str(route['_id'])
            current_route = route
    
    return jsonify({
        'success': True,
        'driver': driver,
        'current_route': current_route
    })

if __name__ == '__main__':
    app.run(debug=True)