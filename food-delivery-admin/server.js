import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'; // Import dotenv

dotenv.config(); // Configure dotenv

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);

let db;
let restaurantsCollection;
let foodItemsCollection;
let usersCollection;
let ordersCollection;

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    db = client.db('foodstorage');
    restaurantsCollection = db.collection('restaurants');
    foodItemsCollection = db.collection('food_items');
    usersCollection = db.collection('users');
    ordersCollection = db.collection('orders');

    // Initialize collections with sample data if they're empty
    await initializeCollections();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

// Initialize collections with sample data if empty
async function initializeCollections() {
  try {
    // Check if restaurants collection is empty
    const restaurantsCount = await restaurantsCollection.countDocuments();
    if (restaurantsCount === 0) {
      const sampleRestaurants = [
        {
          _id: '1',
          name: 'Royal Bengal Restaurant',
          rating: 4.5,
          deliveryTime: '25-35 min',
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
          cuisine: ['Bengali', 'Indian', 'Spicy'],
          distance: '1.2 km'
        },
        {
          _id: '2',
          name: 'South Indian Delight',
          rating: 4.2,
          deliveryTime: '20-30 min',
          image: 'https://images.unsplash.com/photo-1550547660-9be8a3f6cb4b?w=400&h=300&fit=crop',
          cuisine: ['South Indian', 'Vegetarian', 'Traditional'],
          distance: '2.5 km'
        },
        {
          _id: '3',
          name: 'Dragon Palace',
          rating: 4.7,
          deliveryTime: '30-40 min',
          image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
          cuisine: ['Chinese', 'Asian', 'Seafood'],
          distance: '1.8 km'
        },
        {
          _id: '4',
          name: 'Pizza Express',
          rating: 4.3,
          deliveryTime: '25-35 min',
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
          cuisine: ['Italian', 'Fast Food', 'Vegetarian Options'],
          distance: '3.1 km'
        },
        {
          _id: '5',
          name: 'Taco Fiesta',
          rating: 4.6,
          deliveryTime: '15-25 min',
          image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop',
          cuisine: ['Mexican', 'Fast Food', 'Gluten Free'],
          distance: '0.9 km'
        }
      ];
      await restaurantsCollection.insertMany(sampleRestaurants);
      console.log('Sample restaurants inserted');
    }

    // Check if food items collection is empty
    const foodItemsCount = await foodItemsCollection.countDocuments();
    if (foodItemsCount === 0) {
      const sampleFoodItems = [
        {
          _id: '1',
          name: 'Chicken Biryani',
          price: 12.99,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop',
          rating: 4.8,
          isTrending: true,
          restaurantId: '1'
        },
        {
          _id: '2',
          name: 'Paneer Tikka',
          price: 9.99,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
          rating: 4.6,
          isTrending: true,
          restaurantId: '1'
        },
        {
          _id: '3',
          name: 'Sushi Platter',
          price: 14.99,
          image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200&h=200&fit=crop',
          rating: 4.9,
          isTrending: true,
          restaurantId: '3'
        },
        {
          _id: '4',
          name: 'Butter Chicken',
          price: 13.99,
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
          rating: 4.7,
          restaurantId: '1'
        },
        {
          _id: '5',
          name: 'Masala Dosa',
          price: 8.99,
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop',
          rating: 4.5,
          restaurantId: '2'
        },
        {
          _id: '6',
          name: 'Chocolate Cake',
          price: 6.99,
          image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=200&h=200&fit=crop',
          rating: 4.8,
          restaurantId: '4'
        },
        {
          _id: '7',
          name: 'Tandoori Chicken',
          price: 15.99,
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
          rating: 4.9,
          restaurantId: '1'
        },
        {
          _id: '8',
          name: 'Fish Curry',
          price: 14.99,
          image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&h=200&fit=crop',
          rating: 4.8,
          restaurantId: '1'
        },
        {
          _id: '9',
          name: 'Vegetable Korma',
          price: 11.99,
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
          rating: 4.7,
          restaurantId: '1'
        },
        {
          _id: '13',
          name: 'Mutton Biryani',
          price: 16.99,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop',
          rating: 4.6,
          restaurantId: '1'
        },
        {
          _id: '14',
          name: 'Garlic Naan',
          price: 3.99,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
          rating: 4.5,
          restaurantId: '1'
        }
      ];
      await foodItemsCollection.insertMany(sampleFoodItems);
      console.log('Sample food items inserted');
    }

    // Check if users collection is empty
    const usersCount = await usersCollection.countDocuments();
    if (usersCount === 0) {
      const sampleUsers = [
        {
          _id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '(555) 123-4567',
          signupDate: '2023-01-15'
        },
        {
          _id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '(555) 987-6543',
          signupDate: '2023-02-20'
        },
        {
          _id: 3,
          name: 'Robert Johnson',
          email: 'robert@example.com',
          phone: '(555) 456-7890',
          signupDate: '2023-03-10'
        }
      ];
      await usersCollection.insertMany(sampleUsers);
      console.log('Sample users inserted');
    }
    // Check if orders collection is empty (optional, maybe leave empty)
    const ordersCount = await ordersCollection.countDocuments();
    if (ordersCount === 0) {
      // Optional: Add sample orders?
      console.log('Orders collection is empty');
    }

  } catch (error) {
    console.error('Error initializing collections:', error);
  }
}

// Default admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123' // In a real app, this would be hashed
};

// Middleware
app.use(cors({
  origin: true, // Allow all origins dynamically
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enable Private Network Access for local development with deployed frontend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

app.use(bodyParser.json());
app.use(express.json()); // Add support for JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('trust proxy', 1); // Trust first proxy (Render/Heroku)

// Authentication endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Return the full URL to the uploaded file
  // Force HTTPS on Render to avoid Mixed Content errors
  let protocol = req.protocol;
  const host = req.get('host');
  if (host.includes('onrender.com')) {
    protocol = 'https';
  }

  const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt:', { username, password });

  try {
    // First check if it's admin credentials
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      console.log('Admin login successful');
      // Admin login
      res.json({
        success: true,
        token: 'admin-token', // Mock token
        user: {
          id: 1,
          username: ADMIN_CREDENTIALS.username,
          role: 'admin'
        }
      });
      return;
    }

    // Check if it's a regular user by looking in the users collection
    console.log('Checking for regular user...');
    console.log('Query parameters:', {
      $or: [
        { email: username },
        { phone: username }
      ],
      password: password
    });

    const user = await usersCollection.findOne({
      $or: [
        { email: username },
        { phone: username }
      ],
      password: password
    });

    console.log('User lookup result:', user);

    if (user) {
      console.log('Regular user login successful');
      // Regular user login
      res.json({
        success: true,
        token: 'user-token', // Mock token
        user: {
          id: user._id,  // This should be fine as MongoDB _id
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: 'user'
        }
      });
      return;
    }

    // If we get here, let's check what users exist in the database
    console.log('No user found with provided credentials. Checking all users:');
    const allUsers = await usersCollection.find({}).toArray();
    console.log('All users in database:', allUsers.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      password: u.password ? '[HIDDEN]' : '[NONE]'
    })));

    console.log('Invalid credentials');
    // Invalid credentials
    res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Admin Stats Endpoint
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalOrders = await ordersCollection.countDocuments();
    const totalUsers = await usersCollection.countDocuments();
    const totalRestaurants = await restaurantsCollection.countDocuments();

    // Calculate total revenue from orders
    const orders = await ordersCollection.find({}).toArray();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    res.json({
      totalOrders,
      totalUsers,
      totalRestaurants,
      totalRevenue
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Order Endpoints

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = {
      _id: String(Date.now()),
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };

    const result = await ordersCollection.insertOne(newOrder);
    res.status(201).json({ _id: result.insertedId, ...newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Get all orders (Admin)
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await ordersCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get orders by User ID
app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching orders for user: ${userId}`);
    const orders = await ordersCollection.find({ userId: userId }).sort({ createdAt: -1 }).toArray();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch user orders' });
  }
});

// Update order status (Admin)
app.put('/api/admin/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await ordersCollection.updateOne(
      { _id: id },
      { $set: { status: status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// API Routes

// Get all restaurants
app.get('/api/restaurants', async (req, res) => {
  try {
    const { location } = req.query;

    // In a real app, you would filter by location
    // For now, we'll return all restaurants
    const restaurants = await restaurantsCollection.find({}).toArray();
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Failed to fetch restaurants' });
  }
});

// Get restaurant menu
app.get('/api/restaurants/:restaurantId/menu', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    console.log(`Fetching menu for restaurantId: ${restaurantId}`);

    // Filter food items by restaurant
    // Ensure accurate string comparison
    const restaurantItems = await foodItemsCollection.find({ restaurantId: String(restaurantId) }).toArray();
    console.log(`Found ${restaurantItems.length} items for restaurant ${restaurantId}`);

    // Debug: If 0 items found, show what IS in the database to debug ID mismatch
    if (restaurantItems.length === 0) {
      const allItems = await foodItemsCollection.find({}).limit(5).toArray();
      console.log('DEBUG - First 5 items in DB:', allItems.map(i => ({ name: i.name, rId: i.restaurantId, type: typeof i.restaurantId })));
      console.log('DEBUG - Searching for rId:', String(restaurantId), 'Type:', typeof String(restaurantId));
    }

    // Get unique categories from restaurant items
    const categories = [...new Set(restaurantItems.map(item => item.category))];

    res.json({
      items: restaurantItems,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching restaurant menu:', error);
    res.status(500).json({ message: 'Failed to fetch restaurant menu' });
  }
});

// Get food categories
app.get('/api/categories', async (req, res) => {
  try {
    // Extract unique categories from food items in the database
    const foodItems = await foodItemsCollection.find({}).toArray();
    const uniqueCategories = [...new Set(foodItems.map(item => item.category).filter(Boolean))];

    // Transform categories into the expected format
    const foodCategories = uniqueCategories.map((category, index) => ({
      id: String(index + 1),
      name: category,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop' // Using a default image
    }));

    res.json(foodCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Get trending items
app.get('/api/trending', async (req, res) => {
  try {
    const trendingItems = await foodItemsCollection.find({ isTrending: true }).toArray();
    res.json(trendingItems);
  } catch (error) {
    console.error('Error fetching trending items:', error);
    res.status(500).json({ message: 'Failed to fetch trending items' });
  }
});

// Get best reviewed items
app.get('/api/best-reviewed', async (req, res) => {
  try {
    // Sort by rating descending
    const bestReviewed = await foodItemsCollection.find({}).sort({ rating: -1 }).toArray();
    res.json(bestReviewed);
  } catch (error) {
    console.error('Error fetching best reviewed items:', error);
    res.status(500).json({ message: 'Failed to fetch best reviewed items' });
  }
});

// Get popular items
app.get('/api/popular', async (req, res) => {
  try {
    // For demo, we'll just return all items
    const foodItems = await foodItemsCollection.find({}).toArray();
    res.json(foodItems);
  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({ message: 'Failed to fetch popular items' });
  }
});

// Admin routes (protected in a real app)

// Get all users (for admin)
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await usersCollection.find({}).toArray();
    console.log('Fetching users:', users); // Debug log
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Add new user (for admin)
app.post('/api/admin/users', async (req, res) => {
  try {
    console.log('Received user creation request:', req.body);

    const newUser = {
      _id: Date.now(), // Generate a unique ID
      ...req.body
    };

    console.log('Creating new user:', newUser); // Debug log

    const result = await usersCollection.insertOne(newUser);
    console.log('Insert result:', result);

    const savedUser = await usersCollection.findOne({ _id: newUser._id });
    console.log('Saved user:', savedUser); // Debug log

    res.status(201).json({ _id: result.insertedId, ...newUser });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Failed to add user' });
  }
});

// Update user (for admin)
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = req.body;

    const result = await usersCollection.updateOne(
      { _id: parseInt(id) },
      { $set: updatedUser }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedDocument = await usersCollection.findOne({ _id: parseInt(id) });
    res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user (for admin)
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await usersCollection.deleteOne({ _id: parseInt(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get all food items (for admin)
app.get('/api/admin/food-items', async (req, res) => {
  try {
    const foodItems = await foodItemsCollection.find({}).toArray();
    res.json(foodItems);
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({ message: 'Failed to fetch food items' });
  }
});

// Add new food item (for admin)
app.post('/api/admin/food-items', async (req, res) => {
  try {
    console.log('Adding new food item:', req.body);

    if (!req.body.restaurantId) {
      console.error('MISSING RESTAURANT ID');
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    const newItem = {
      _id: String(Date.now()), // Generate a unique ID
      ...req.body,
      restaurantId: String(req.body.restaurantId) // Force string type for consistency
    };

    const result = await foodItemsCollection.insertOne(newItem);
    res.status(201).json({ _id: result.insertedId, ...newItem });
  } catch (error) {
    console.error('Error adding food item:', error);
    res.status(500).json({ message: 'Failed to add food item' });
  }
});

// Update food item (for admin)
app.put('/api/admin/food-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = req.body;

    const result = await foodItemsCollection.updateOne(
      { _id: id },
      { $set: updatedItem }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    const updatedDocument = await foodItemsCollection.findOne({ _id: id });
    res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({ message: 'Failed to update food item' });
  }
});

// Delete food item (for admin)
app.delete('/api/admin/food-items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await foodItemsCollection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ message: 'Failed to delete food item' });
  }
});

// Get all restaurants (for admin)
app.get('/api/admin/restaurants', async (req, res) => {
  try {
    const restaurants = await restaurantsCollection.find({}).toArray();
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Failed to fetch restaurants' });
  }
});

// Add new restaurant (for admin)
app.post('/api/admin/restaurants', async (req, res) => {
  try {
    const newRestaurant = {
      _id: String(Date.now()), // Generate a unique ID
      ...req.body
    };

    const result = await restaurantsCollection.insertOne(newRestaurant);
    res.status(201).json({ _id: result.insertedId, ...newRestaurant });
  } catch (error) {
    console.error('Error adding restaurant:', error);
    res.status(500).json({ message: 'Failed to add restaurant' });
  }
});

// Update restaurant (for admin)
app.put('/api/admin/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRestaurant = req.body;

    const result = await restaurantsCollection.updateOne(
      { _id: id },
      { $set: updatedRestaurant }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const updatedDocument = await restaurantsCollection.findOne({ _id: id });
    res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Failed to update restaurant' });
  }
});

// Delete restaurant (for admin)
app.delete('/api/admin/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await restaurantsCollection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ message: 'Failed to delete restaurant' });
  }
});

// Get all categories (for admin)
app.get('/api/admin/categories', async (req, res) => {
  try {
    // Default categories list
    const defaultCategories = [
      'Pizza', 'Salads', 'Sides', 'Desserts', 'Drinks',
      'Indian', 'Chinese', 'Mexican', 'Ice Creams',
      'Milk Shakes', 'Burgers', 'Appetizers', 'Biryani',
      'Noodles', 'Sandwiches', 'Pasta'
    ];

    // Extract unique categories from food items
    const foodItems = await foodItemsCollection.find({}).toArray();
    const existingCategories = foodItems.map(item => item.category).filter(Boolean);

    // Merge defaults with existing, remove duplicates, and sort
    const allCategories = [...new Set([...defaultCategories, ...existingCategories])].sort();

    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});



// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'dist')));

// Anything that doesn't match the above, send back index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Food Delivery API Server is running on http://localhost:${port}`);
    console.log('Default Admin Credentials:');
    console.log('- Username: admin');
    console.log('- Password: admin123');
    console.log('');
    console.log('API Endpoints:');
    console.log('- POST /api/auth/login');
    console.log('- GET /api/restaurants');
    console.log('- GET /api/restaurants/:restaurantId/menu');
    console.log('- GET /api/categories');
    console.log('- GET /api/trending');
    console.log('- GET /api/best-reviewed');
    console.log('- GET /api/popular');
    console.log('- GET /api/admin/users');
    console.log('- POST /api/admin/users');
    console.log('- PUT /api/admin/users/:id');
    console.log('- DELETE /api/admin/users/:id');
    console.log('- GET /api/admin/food-items');
    console.log('- POST /api/admin/food-items');
    console.log('- PUT /api/admin/food-items/:id');
    console.log('- DELETE /api/admin/food-items/:id');
    console.log('- GET /api/admin/restaurants');
    console.log('- POST /api/admin/restaurants');
    console.log('- PUT /api/admin/restaurants/:id');
    console.log('- DELETE /api/admin/restaurants/:id');
    console.log('- GET /api/admin/categories');
    console.log('- GET /api/admin/stats');
    console.log('- GET /api/admin/orders');
    console.log('- POST /api/orders');

  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', e);
    }
  });
};

connectToDatabase().then(() => {
  // Ensure PORT is a number to avoid string concatenation (e.g., "3000" + 1 = "30001")
  startServer(Number(PORT));
}).catch(error => {
  console.error('Failed to start server:', error);
});