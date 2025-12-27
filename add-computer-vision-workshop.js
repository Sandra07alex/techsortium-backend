import { MongoClient } from 'mongodb';
import 'dotenv/config';

const newEvent = {
  id: 'w3',
  title: 'Computer Vision 101',
  slug: 'computer-vision-101',
  track: 'workshops',
  shortDescription: 'Beginner-friendly intro to how machines understand visual data.',
  longDescription:
    'Step into the world where computers learn to see. Computer Vision 101 introduces the fundamentals of how machines interpret and understand visual data. Led by Deva Nanda Nair, Technical Community Coordinator at IEEE LINK, covering core concepts, real-world applications, and how computer vision powers technologies like facial recognition, medical imaging, and autonomous systems.',
  posterUrl:
    'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800&auto=format&fit=crop',
  datetime: '2025-12-18T20:00:00',
  capacity: null,
  fee: null,
  qrPaymentRequired: false,
  requirements: ['Laptop recommended'],
};

async function addWorkshop() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('techsortium');
    const collection = db.collection('events');

    const existing = await collection.findOne({ slug: newEvent.slug });
    if (existing) {
      console.log(`⚠️  Event already exists: ${existing.title} (${existing.slug})`);
      console.log('   No changes made.');
      return;
    }

    const result = await collection.insertOne(newEvent);
    console.log(`✅ Inserted event with id ${result.insertedId}`);

    const count = await collection.countDocuments();
    console.log(`📊 Total events in database: ${count}`);
  } catch (error) {
    console.error('❌ Error adding workshop:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Add workshop complete!');
  }
}

addWorkshop();
