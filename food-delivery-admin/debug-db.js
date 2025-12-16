
import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://nallapanenimahidhar2004:LpmwoYdr4euwYEyX@cluster0.oclfqi3.mongodb.net/foodstorage?retryWrites=true&w=majority';
const client = new MongoClient(MONGODB_URI);

async function debugDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('foodstorage');
        const restaurantsCollection = db.collection('restaurants');
        const foodItemsCollection = db.collection('food_items');

        const restaurants = await restaurantsCollection.find({}).toArray();
        console.log('\n--- RESTAURANTS ---');
        restaurants.forEach(r => {
            console.log(`"${r.name}" -> ID: '${r._id}' (Type: ${typeof r._id})`);
        });

        const vennila = await foodItemsCollection.findOne({ name: { $regex: /Vennila/i } });
        console.log('\n--- ITEM: VENNILA ---');
        if (vennila) {
            console.log(`Name: ${vennila.name}`);
            console.log(`Saved RestaurantID: '${vennila.restaurantId}' (Type: ${typeof vennila.restaurantId})`);

            const parent = restaurants.find(r => String(r._id) === String(vennila.restaurantId));
            if (parent) {
                console.log(`MATCH FOUND: Linked to "${parent.name}"`);
            } else {
                console.log('NO MATCH FOUND in Restaurants list.');
            }
        } else {
            console.log('Item "Vennila" not found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

debugDatabase();
