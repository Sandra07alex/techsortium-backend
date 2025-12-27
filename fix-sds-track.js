import 'dotenv/config';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

async function fixSDSTrack() {
  try {
    await client.connect();
    const db = client.db('techsortium');
    const collection = db.collection('events');
    
    // Update s1, s2, s3 to track: "workshops" instead of "sds"
    const result = await collection.updateMany(
      { id: { $in: ['s1', 's2', 's3'] } },
      { $set: { track: 'workshops' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} events from "sds" track to "workshops"`);
    
    // Verify changes
    const events = await collection.find({ id: { $in: ['s1', 's2', 's3', 'sds-main-2026'] } }).toArray();
    console.log('\n=== Verification ===');
    events.forEach(e => {
      console.log(`${e.id}: ${e.title} → track: ${e.track}`);
    });
  } finally {
    await client.close();
  }
}

fixSDSTrack();
