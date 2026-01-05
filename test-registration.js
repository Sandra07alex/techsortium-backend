import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/techsortium';

async function testRegistration() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('techsortium');
    const eventsCollection = db.collection('events');
    
    // Find the web dev competition
    const event = await eventsCollection.findOne({ slug: 'web-development-competition' });
    
    console.log('Current Event State:');
    console.log('- Title:', event.title);
    console.log('- Slug:', event.slug);
    console.log('- Capacity:', event.capacity);
    console.log('- Registered Count:', event.registeredCount || 0);
    console.log('- Available:', event.capacity - (event.registeredCount || 0));
    
    // Try to simulate a registration (atomic update check)
    const reservation = await eventsCollection.findOneAndUpdate(
      {
        slug: 'web-development-competition',
        $expr: {
          $or: [
            { $eq: ['$capacity', null] },
            { $gt: ['$capacity', { $ifNull: ['$registeredCount', 0] }] }
          ]
        }
      },
      [
        {
          $set: {
            registeredCount: { $add: [{ $ifNull: ['$registeredCount', 0] }, 1] }
          }
        }
      ],
      { returnDocument: 'before' }
    );
    
    if (reservation.value) {
      console.log('\n✅ Registration would succeed - slot reserved!');
      console.log('Old registered count:', reservation.value.registeredCount || 0);
      
      // Fetch updated event
      const updatedEvent = await eventsCollection.findOne({ slug: 'web-development-competition' });
      console.log('New registered count:', updatedEvent.registeredCount);
    } else {
      console.log('\n❌ Registration would FAIL - Event is full!');
    }
    
  } finally {
    await client.close();
  }
}

testRegistration().catch(console.error);
