import { MongoClient } from 'mongodb';
import 'dotenv/config';

const sdsEvent = {
  id: 'sds-main-2026',
  title: 'Skill Development Session (SDS)',
  slug: 'skill-development-session',
  track: 'sds',
  shortDescription:
    'A structured learning initiative powered by IEEE LINK, designed to equip students with in-demand technical skills through guided learning and hands-on project experience.',
  longDescription:
    "Welcome to Skill Development Session (SDS) — a structured learning initiative on IEEE Techsortium 2025 powered by IEEE LINK, designed to equip students with in-demand technical skills through guided learning and hands-on project experience.\n\nSDS focuses on helping participants explore new technologies, build strong fundamentals, and gain practical exposure by working on a domain-specific project. The program bridges the gap between learning and real-world application, enabling students to understand how to grow and position themselves within a chosen technology domain.\n\n🎯 Why SDS?\nTired of endless theories? It's time to experience learning that actually feels real. Here in SDS, you will learn skills that actually matter beyond the classroom. When learning feels like SOS, SDS steps in.\n\n📅 Timeline\nStarting on January 1st 2026. Sessions on Jan 3 & 4 at 7 PM. Jan 5–8: Project development period.\n\n🎓 Domains\n• Artificial Intelligence & Machine Learning\n• Data Science & Analytics\n• Full Stack Web Development\n• UI/UX Design & Product Thinking\n• Cyber Security\n• Computer Vision\n\n⭐ Highlights\n• Live interactive sessions\n• Hands-on live projects\n• Mentoring from domain experts\n• Resume-ready project experience\n\n💡 Participant Gains\n• Practical domain project\n• Exposure to emerging technologies\n• Strengthened fundamentals\n• Guidance to keep learning\n\n⚡ Notes\n• Only 30 seats per domain\n• One domain per participant",
  posterUrl:
    'https://images.unsplash.com/photo-1519389950473-47ba0277781f?w=800&auto=format&fit=crop',
  datetime: '2026-01-01T00:00:00',
  capacity: 180,
  fee: 200,
  feeDescription: 'IEEE Members: ₹200 | Non-IEEE Members: ₹400',
  domains: [
    'Artificial Intelligence & Machine Learning',
    'Data Science & Analytics',
    'Full Stack Web Development',
    'UI/UX Design & Product Thinking',
    'Cyber Security',
    'Computer Vision',
  ],
  // Per-domain counts (initialized to 0); capacity per domain is infinite
  domainCounts: {
    'ai-ml': 0,
    'data-science': 0,
    'full-stack-web': 0,
    'ui-ux': 0,
    'cyber-security': 0,
    'computer-vision': 0,
  },
  qrPaymentRequired: true,
  requirements: ['Choose one domain', 'Limited seats: 30 per domain'],
};

async function addSDSEvent() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('techsortium');
    const collection = db.collection('events');

    // Check if SDS already exists
    const existing = await collection.findOne({ slug: sdsEvent.slug });
    if (existing) {
      console.log('⚠️  SDS event already exists in database');
      console.log(`   Title: ${existing.title}`);
      console.log(`   ID: ${existing.id}`);
      // Ensure domains and fee description are present
      const update = {
        $set: {
          domains: sdsEvent.domains,
          feeDescription: sdsEvent.feeDescription,
          domainCounts: sdsEvent.domainCounts,
        },
      };
      await collection.updateOne({ slug: sdsEvent.slug }, update);
      console.log('✅ Updated SDS event with domains and fee description');
      return;
    }

    // Insert the SDS event
    const result = await collection.insertOne(sdsEvent);
    console.log('✅ Successfully added SDS event!');
    console.log(`   ID: ${sdsEvent.id}`);
    console.log(`   Title: ${sdsEvent.title}`);
    console.log(`   Slug: ${sdsEvent.slug}`);
    console.log(`   Capacity: ${sdsEvent.capacity}`);

    // Quick verification: list SDS track events
    const sdsEvents = await collection.find({ track: 'sds' }).toArray();
    console.log('\n📋 Current SDS Track Events:');
    sdsEvents.forEach((ev, idx) => {
      console.log(`   ${idx + 1}. ${ev.title} (${ev.slug})`);
      if (ev.capacity !== undefined) {
        console.log(`      Capacity: ${ev.capacity}`);
      }
    });

    console.log(`\n✅ Total SDS events: ${sdsEvents.length}`);
  } catch (error) {
    console.error('❌ Error adding SDS event:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Operation complete!');
  }
}

addSDSEvent();
