import { MongoClient } from 'mongodb';
import 'dotenv/config';

const brandYouWorkshop = {
  id: "w7",
  title: "Brand You — Personal Branding on LinkedIn",
  slug: "brand-you",
  track: "workshops",
  shortDescription: "Build your professional identity and strengthen your presence on LinkedIn.",
  longDescription: "Learn how to build, position, and strengthen your professional identity in the digital world through this focused session on personal branding.\n\nIEEE Techsortium'25, powered by IEEE LINK, presents Brand You, a practical session designed to help you create a strong and authentic presence on LinkedIn. The workshop covers strategies to showcase your skills effectively, communicate your value, and connect with the right professional opportunities.\n\nThe session will be led by Adil A, Technical Coordinator, IEEE SPS Kerala Chapter, who will share actionable insights and best practices for personal branding in today's competitive landscape.\n\n🗓 Date: 27 December 2025\n⏰ Time: 8:00 PM\n📍 Venue: Google Meet\n\nThis session is ideal for students and early professionals looking to build visibility, credibility, and meaningful connections on LinkedIn.",
  posterUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
  datetime: "2025-12-27T20:00:00",
  capacity: null,
  fee: null,
  qrPaymentRequired: false,
  requirements: ["Laptop recommended", "LinkedIn profile setup helpful"]
};

async function addBrandYouWorkshop() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('techsortium');
    const collection = db.collection('events');

    const existing = await collection.findOne({ slug: brandYouWorkshop.slug });
    if (existing) {
      console.log('⚠️  Brand You workshop already exists in database');
      console.log(`   Title: ${existing.title}`);
      console.log(`   ID: ${existing.id}`);
      return;
    }

    const result = await collection.insertOne(brandYouWorkshop);
    console.log('✅ Successfully added Brand You workshop!');
    console.log(`   ID: ${brandYouWorkshop.id}`);
    console.log(`   Title: ${brandYouWorkshop.title}`);
    console.log(`   Slug: ${brandYouWorkshop.slug}`);
    console.log(`   Date: ${brandYouWorkshop.datetime}`);
    console.log('   Speaker: Adil A');

    const workshops = await collection.find({ track: 'workshops' }).sort({ datetime: 1 }).toArray();
    console.log('\n📋 Current Workshop Events:');
    workshops.forEach((w, idx) => {
      console.log(`   ${idx + 1}. ${w.title} (${w.slug})`);
      console.log(`      Date: ${w.datetime}`);
    });

    console.log(`\n✅ Total workshops: ${workshops.length}`);
  } catch (error) {
    console.error('❌ Error adding Brand You workshop:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Operation complete!');
  }
}

addBrandYouWorkshop();
