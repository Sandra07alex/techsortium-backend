import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/techsortium';

async function checkEvents() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('techsortium');
    const eventsCollection = db.collection('events');
    
    console.log('📊 Checking all events:\n');
    
    const events = await eventsCollection.find({}).toArray();
    
    events.forEach(event => {
      console.log(`📌 Event: ${event.title}`);
      console.log(`   Slug: ${event.slug}`);
      console.log(`   Capacity: ${event.capacity}`);
      console.log(`   Registered Count: ${event.registeredCount || 0}`);
      if (event.capacity) {
        console.log(`   Available Slots: ${event.capacity - (event.registeredCount || 0)}`);
      }
      console.log('');
    });
    
    // Specifically check web dev events
    console.log('\n🔍 Checking Web Development Events:\n');
    const webdevEvents = await eventsCollection.find({ slug: /web/i }).toArray();
    webdevEvents.forEach(event => {
      console.log(`Title: ${event.title}`);
      console.log(`Slug: ${event.slug}`);
      console.log(`Capacity: ${event.capacity}`);
      console.log(`Registered: ${event.registeredCount || 0}`);
      console.log(`Status: ${(event.registeredCount || 0) >= (event.capacity || 0) ? '❌ FULL' : '✅ AVAILABLE'}`);
      console.log('');
    });
    
  } finally {
    await client.close();
  }
}

checkEvents().catch(console.error);
