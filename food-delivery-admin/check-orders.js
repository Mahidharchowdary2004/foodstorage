
import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://nallapanenimahidhar2004:LpmwoYdr4euwYEyX@cluster0.oclfqi3.mongodb.net/foodstorage?retryWrites=true&w=majority';
const client = new MongoClient(MONGODB_URI);

async function checkOrders() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('foodstorage');
        const ordersCollection = db.collection('orders');

        const orders = await ordersCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
        console.log('\n--- LATEST 5 ORDERS ---');

        if (orders.length === 0) {
            console.log("No orders found in database.");
        }

        orders.forEach((order, i) => {
            console.log(`\n[Order #${i + 1}]`);
            console.log(`ID: ${order._id}`);
            console.log(`Type: ${order.type}`);
            console.log(`User ID: ${order.userId} (Type: ${typeof order.userId})`);
            console.log(`Total: ${order.total}`);
            console.log(`Status: ${order.status}`);
            console.log(`Items count: ${order.items?.length || 0}`);
            if (order.details) {
                console.log(`Details: Phone=${order.details.phone}, Addr=${order.details.address || 'N/A'}`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkOrders();
