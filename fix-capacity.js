import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/techsortium';

async function fixCapacity() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('techsortium');
    const eventsCollection = db.collection('events');
    
    console.log('🔧 Fixing event capacities and registered counts...\n');
    
    // Reset all registeredCount to 0 to ensure fresh state
    const result = await eventsCollection.updateMany(
      {},
      [
        {
          $set: {
            registeredCount: 0
          }
        }
      ]
    );
    
    console.log(`✅ Reset ${result.modifiedCount} events' registeredCount to 0\n`);
    
    // Verify the fix
    const events = await eventsCollection.find({}).toArray();
    events.forEach(event => {
      console.log(`📌 ${event.title}`);
      console.log(`   Capacity: ${event.capacity || 'Unlimited'}`);
      console.log(`   Registered: ${event.registeredCount || 0}`);
    });
    
  } finally {
    await client.close();
  }
}

fixCapacity().catch(console.error);
