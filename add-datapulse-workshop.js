import { MongoClient } from 'mongodb';
import 'dotenv/config';

const datapulseWorkshop = {
  id: "w6",
  title: "DataPulse — Real-Time Communication with MQTT",
  slug: "datapulse-mqtt",
  track: "workshops",
  shortDescription: "Hands-on MQTT for scalable, real-time IoT communication.",
  longDescription: "Explore the fundamentals of real-time and intelligent communication in this hands-on workshop focused on MQTT, the lightweight messaging protocol that powers modern IoT and connected systems.\n\nIEEE Techsortium'25, powered by IEEE LINK, presents DataPulse, a practical session that dives into how devices communicate efficiently, how real-time data flows across systems, and how MQTT enables scalable and reliable messaging.\n\nThe workshop will be led by Deva Prakash, YouTuber, Blogger, and Maker in Electronics, and Project Coordinator, IEEE SSCS Kerala Chapter, who will share practical insights, use cases, and demonstrations from real-world IoT applications.\n\n🗓 Date: 23 December 2025\n⏰ Time: 8:00 PM\n📍 Venue: Google Meet\n\nThis session is ideal for students and enthusiasts interested in IoT, embedded systems, and real-time data communication.",
  posterUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop",
  datetime: "2025-12-23T20:00:00",
  capacity: null,
  fee: null,
  qrPaymentRequired: false,
  requirements: ["Laptop recommended", "Basic understanding of IoT/MQTT helpful"]
};

async function addDatapulseWorkshop() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('techsortium');
    const collection = db.collection('events');

    const existing = await collection.findOne({ slug: datapulseWorkshop.slug });
    if (existing) {
      console.log('⚠️  DataPulse workshop already exists in database');
      console.log(`   Title: ${existing.title}`);
      console.log(`   ID: ${existing.id}`);
      return;
    }

    const result = await collection.insertOne(datapulseWorkshop);
    console.log('✅ Successfully added DataPulse workshop!');
    console.log(`   ID: ${datapulseWorkshop.id}`);
    console.log(`   Title: ${datapulseWorkshop.title}`);
    console.log(`   Slug: ${datapulseWorkshop.slug}`);
    console.log(`   Date: ${datapulseWorkshop.datetime}`);
    console.log('   Speaker: Deva Prakash');

    const workshops = await collection.find({ track: 'workshops' }).sort({ datetime: 1 }).toArray();
    console.log('\n📋 Current Workshop Events:');
    workshops.forEach((w, idx) => {
      console.log(`   ${idx + 1}. ${w.title} (${w.slug})`);
      console.log(`      Date: ${w.datetime}`);
    });

    console.log(`\n✅ Total workshops: ${workshops.length}`);
  } catch (error) {
    console.error('❌ Error adding DataPulse workshop:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Operation complete!');
  }
}

addDatapulseWorkshop();
