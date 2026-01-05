import 'dotenv/config';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

async function checkEvents() {
  try {
    await client.connect();
    const db = client.db('techsortium');
    
    const events = await db.collection('events').find({}).toArray();
    
    console.log('=== All Events ===');
    events.forEach(e => {
      console.log(`ID: ${e.id}, Title: ${e.title}, Slug: ${e.slug}, Track: ${e.track}`);
    });
    
    console.log('\n=== SDS Event ===');
    const sds = events.find(e => e.track === 'sds');
    if (sds) {
      console.log(JSON.stringify({
        id: sds.id,
        title: sds.title,
        slug: sds.slug,
        track: sds.track,
        registeredCount: sds.registeredCount
      }, null, 2));
    }
  } finally {
    await client.close();
  }
}

checkEvents();
