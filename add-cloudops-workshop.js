import { MongoClient } from 'mongodb';
import 'dotenv/config';

const cloudOpsWorkshop = {
  id: "w5",
  title: "CloudOps 101 — Modern Cloud Computing",
  slug: "cloudops-101",
  track: "workshops",
  shortDescription: "Explore the fundamentals of scalable and intelligent cloud computing.",
  longDescription: "Explore the fundamentals of scalable and intelligent cloud computing in this introductory workshop on modern cloud operations.\n\nIEEE Techsortium'25, powered by IEEE LINK, presents CloudOps 101, a session designed to open the door to cloud platforms, infrastructure management, and operational practices that power today's digital applications.\n\nThe workshop will be led by Abdul Hakkeem P A, MLOps Researcher, who will guide participants through core cloud concepts, real-world use cases, and how cloud systems support scalable and intelligent solutions.\n\n🗓 Date: 22 December 2025\n⏰ Time: 8:00 PM\n📍 Venue: Google Meet\n\nThis session is ideal for students and beginners who are curious about how cloud platforms manage infrastructure at scale and enable modern intelligent systems.",
  posterUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop",
  datetime: "2025-12-22T20:00:00",
  capacity: null,
  fee: null,
  qrPaymentRequired: false,
  requirements: ["Laptop recommended", "Basic understanding of cloud concepts helpful"]
};

async function addCloudOpsWorkshop() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('techsortium');
    const collection = db.collection('events');
    
    // Check if CloudOps workshop already exists
    const existing = await collection.findOne({ slug: cloudOpsWorkshop.slug });
    if (existing) {
      console.log('⚠️  CloudOps workshop already exists in database');
      console.log(`   Title: ${existing.title}`);
      console.log(`   ID: ${existing.id}`);
      return;
    }
    
    // Insert the CloudOps workshop
    const result = await collection.insertOne(cloudOpsWorkshop);
    console.log(`✅ Successfully added CloudOps workshop!`);
    console.log(`   ID: ${cloudOpsWorkshop.id}`);
    console.log(`   Title: ${cloudOpsWorkshop.title}`);
    console.log(`   Slug: ${cloudOpsWorkshop.slug}`);
    console.log(`   Date: ${cloudOpsWorkshop.datetime}`);
    console.log(`   Speaker: Abdul Hakkeem P A`);
    
    // List all workshop events
    const workshops = await collection.find({ track: 'workshops' }).sort({ datetime: 1 }).toArray();
    console.log('\n📋 Current Workshop Events:');
    workshops.forEach((w, idx) => {
      console.log(`   ${idx + 1}. ${w.title} (${w.slug})`);
      console.log(`      Date: ${w.datetime}`);
    });
    
    console.log(`\n✅ Total workshops: ${workshops.length}`);
    
  } catch (error) {
    console.error('❌ Error adding CloudOps workshop:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Operation complete!');
  }
}

addCloudOpsWorkshop();
