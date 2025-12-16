import { MongoClient } from 'mongodb';

// MongoDB connection URI
const uri = "mongodb+srv://nallapanenimahidhar2004:LpmwoYdr4euwYEyX@cluster0.oclfqi3.mongodb.net/foodstorage?retryWrites=true&w=majority";

// Database and collection names
const dbName = 'foodstorage';
const collectionName = 'users';

async function checkUsers() {
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();
        console.log("Connected to MongoDB");

        // Access the database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Fetch all users
        const users = await collection.find({}).toArray();
        
        console.log("\n=== ALL USERS IN DATABASE ===");
        console.log(JSON.stringify(users, null, 2));
        
        console.log("\n=== USER COUNT ===");
        console.log(`Total users: ${users.length}`);
        
        // Check if any users have passwords
        const usersWithPasswords = users.filter(user => user.password);
        console.log(`\nUsers with passwords: ${usersWithPasswords.length}`);
        
        if (usersWithPasswords.length > 0) {
            console.log("\n=== USERS WITH PASSWORDS ===");
            usersWithPasswords.forEach(user => {
                console.log(`- ID: ${user._id}, Name: ${user.name}, Email: ${user.email}, Password: ${user.password}`);
            });
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        // Close the connection
        await client.close();
        console.log("\nDisconnected from MongoDB");
    }
}

checkUsers();