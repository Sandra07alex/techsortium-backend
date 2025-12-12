import { MongoClient } from 'mongodb';
import 'dotenv/config';

const newWorkshops = [
  {
    id: "w1",
    title: "ThinkUX — UX & Cognitive Science",
    slug: "thinkux",
    track: "workshops",
    shortDescription: "UX & Cognitive Science Workshop",
    longDescription: "Discover how cognitive science shapes modern user experience design in this focused, insight-packed workshop.\n\nJoin Brian Roy Mathew, UX Strategist at Cenit Labs and Research Activities Coordinator at IEEE EdSoc Kerala Chapter SLT, as he breaks down practical frameworks that help you design interfaces aligned with human perception, behavior, and decision-making.\n\n📗 Date: 15 December 2025\n\n⏰ Time: 8:00 PM\n\nGain clarity, tools, and strategies to create intuitive, human-centered digital experiences. Ideal for designers, developers, and anyone curious about how the mind interacts with technology.",
    posterUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop",
    datetime: "2025-12-15T20:00:00",
    lastDate: "15/12/25",
    capacity: null,
    fee: null,
    qrPaymentRequired: false,
    requirements: ["Laptop recommended"]
  },
  {
    id: "w2",
    title: "TejasGuard — Cyber Security Workshop",
    slug: "tejasguard",
    track: "workshops",
    shortDescription: "Session in Cyber Threats and Defence",
    longDescription: "Dive into the world of modern cyber threats and learn how to defend against them in this practical and engaging session.\n\nJoin Sukesh S, Founder of ASTROLABZ and Project Coordinator at IEEE LINK, as he unpacks real-world attack surfaces, hands-on defence playbooks, and essential security hygiene for both individuals and teams.\n\n📗 Date: 16 December 2025\n\n⏰ Time: 8:00 PM\n\nWhether you're a beginner or a tech enthusiast, this session will equip you with the knowledge to stay safe in today's evolving digital landscape.",
    posterUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop",
    datetime: "2025-12-16T20:00:00",
    lastDate: "15/12/25",
    capacity: null,
    fee: null,
    qrPaymentRequired: false,
    requirements: ["Laptop recommended"]
  }
];

async function updateWorkshops() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('techsortium');
    const collection = db.collection('events');
    
    // Delete old workshop events
    const oldSlugs = ['fullstack-web-dev', 'ml-fundamentals'];
    const deleteResult = await collection.deleteMany({ 
      slug: { $in: oldSlugs } 
    });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old workshop events`);
    
    // Insert new workshop events
    const insertResult = await collection.insertMany(newWorkshops);
    console.log(`✅ Inserted ${insertResult.insertedCount} new workshop events`);
    
    // List all workshop events
    const workshops = await collection.find({ track: 'workshops' }).toArray();
    console.log('\n📋 Current Workshop Events:');
    workshops.forEach(w => {
      console.log(`   - ${w.title} (${w.slug})`);
      console.log(`     Fee: ${w.fee === null ? 'FREE' : '₹' + w.fee}`);
      console.log(`     Capacity: ${w.capacity === null ? 'Unlimited' : w.capacity}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating workshops:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Update complete!');
  }
}

updateWorkshops();
