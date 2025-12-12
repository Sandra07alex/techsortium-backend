import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function deleteAWSWorkshop() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('techsortium');
    const collection = db.collection('events');
    
    // Delete AWS workshop
    const result = await collection.deleteOne({ slug: 'cloud-aws' });
    console.log(`🗑️  Deleted ${result.deletedCount} event (cloud-aws)`);
    
    // List remaining workshops
    const workshops = await collection.find({ track: 'workshops' }).toArray();
    console.log('\n📋 Remaining Workshop Events:');
    workshops.forEach(w => {
      console.log(`   - ${w.title} (${w.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Complete!');
  }
}

deleteAWSWorkshop();
