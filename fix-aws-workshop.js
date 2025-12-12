import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function updateAWSWorkshop() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('techsortium');
    const collection = db.collection('events');
    
    // Update AWS workshop to be free with unlimited capacity
    const result = await collection.updateOne(
      { slug: 'cloud-aws' },
      { 
        $set: { 
          fee: null,
          capacity: null,
          qrPaymentRequired: false,
          lastDate: '15/12/25'
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} workshop event`);
    
    // Verify all workshops
    const workshops = await collection.find({ track: 'workshops' }).toArray();
    console.log('\n📋 All Workshop Events:');
    workshops.forEach(w => {
      console.log(`   - ${w.title} (${w.slug})`);
      console.log(`     Fee: ${w.fee === null ? 'FREE' : '₹' + w.fee}`);
      console.log(`     Capacity: ${w.capacity === null ? 'Unlimited' : w.capacity}`);
      console.log(`     Last Date: ${w.lastDate || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Complete!');
  }
}

updateAWSWorkshop();
