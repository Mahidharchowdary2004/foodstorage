import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://nallapanenimahidhar2004:LpmwoYdr4euwYEyX@cluster0.oclfqi3.mongodb.net/foodstorage?retryWrites=true&w=majority';

async function debugUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('foodstorage');
    const usersCollection = db.collection('users');
    
    // Fetch all users
    const users = await usersCollection.find({}).toArray();
    console.log('All users in database:');
    console.log(JSON.stringify(users, null, 2));
    
    // Count total users
    const count = await usersCollection.countDocuments();
    console.log(`\nTotal users: ${count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugUsers();