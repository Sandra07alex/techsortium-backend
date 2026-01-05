import { MongoClient } from 'mongodb';
import 'dotenv/config';

const hiveMindWorkshop = {
  id: "w8",
  title: "HiveMind — Swarm Intelligence Basics",
  slug: "hivemind-swarm",
  track: "workshops",
  shortDescription: "Intro to collective intelligence and swarm-based problem solving.",
  longDescription: "Explore how simple agents come together to create intelligent systems in this introductory workshop on Swarm Intelligence.\n\nIEEE Techsortium'25, powered by IEEE LINK, presents HiveMind, a session that introduces the principles of collective behavior and decentralized intelligence found in nature and applied in modern computational systems.\n\nThe workshop will be led by Anantha Krishnan K P, Student Representative, IEEE Education Society Kerala Chapter, who will guide participants through core concepts, examples, and applications of swarm-based problem-solving.\n\n🗓 Date: 7 January 2026\n⏰ Time: 8:00 PM\n📍 Venue: Google Meet\n\nThis session is ideal for students and enthusiasts interested in decentralized systems, natural swarms, and how simple interactions can lead to intelligent solutions.",
  posterUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop",
  datetime: "2026-01-07T20:00:00",
  capacity: null,
  fee: null,
  qrPaymentRequired: false,
  requirements: ["Laptop recommended", "Curiosity about decentralized systems"]
};

async function addHiveMindWorkshop() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('techsortium');
    const collection = db.collection('events');

    const existing = await collection.findOne({ slug: hiveMindWorkshop.slug });
    if (existing) {
      console.log('⚠️  HiveMind workshop already exists in database');
      console.log(`   Title: ${existing.title}`);
      console.log(`   ID: ${existing.id}`);
      return;
    }

    await collection.insertOne(hiveMindWorkshop);
    console.log('✅ Successfully added HiveMind workshop!');
    console.log(`   ID: ${hiveMindWorkshop.id}`);
    console.log(`   Title: ${hiveMindWorkshop.title}`);
    console.log(`   Slug: ${hiveMindWorkshop.slug}`);
    console.log(`   Date: ${hiveMindWorkshop.datetime}`);
    console.log('   Speaker: Anantha Krishnan K P');

    const workshops = await collection.find({ track: 'workshops' }).sort({ datetime: 1 }).toArray();
    console.log('\n📋 Current Workshop Events:');
    workshops.forEach((w, idx) => {
      console.log(`   ${idx + 1}. ${w.title} (${w.slug})`);
      console.log(`      Date: ${w.datetime}`);
    });

    console.log(`\n✅ Total workshops: ${workshops.length}`);
  } catch (error) {
    console.error('❌ Error adding HiveMind workshop:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Operation complete!');
  }
}

addHiveMindWorkshop();
