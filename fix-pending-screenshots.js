import 'dotenv/config';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

async function fixPendingScreenshots() {
  try {
    await client.connect();
    const db = client.db('techsortium');
    const registrationsCollection = db.collection('registrations');
    
    // Find all registrations with pending screenshots
    const pendingRegs = await registrationsCollection.find({
      paymentScreenshotUrl: { $regex: /^\[pending/ }
    }).toArray();
    
    console.log(`Found ${pendingRegs.length} registrations with pending screenshots:`);
    
    if (pendingRegs.length === 0) {
      console.log('✅ No pending screenshots found!');
      return;
    }
    
    pendingRegs.forEach(reg => {
      console.log(`  - ${reg.name} (${reg.email}) - ${reg.eventSlug}`);
      console.log(`    Registration ID: ${reg.registrationId}`);
      console.log(`    Status: ${reg.paymentScreenshotUrl}`);
    });
    
    console.log('\n⚠️  These registrations have pending screenshot uploads that failed.');
    console.log('   You can either:');
    console.log('   1. Contact these users to re-register');
    console.log('   2. Manually verify their payment through other means');
    console.log('   3. Update their records with screenshot URLs if available\n');
    
    // Optional: Update them to show upload failed
    const updateChoice = process.argv[2];
    
    if (updateChoice === '--mark-failed') {
      console.log('Marking pending uploads as failed...');
      const result = await registrationsCollection.updateMany(
        { paymentScreenshotUrl: { $regex: /^\[pending/ } },
        { 
          $set: { 
            paymentScreenshotUrl: '[Upload Failed - Please contact support]',
            uploadFailedAt: new Date()
          } 
        }
      );
      console.log(`✅ Updated ${result.modifiedCount} registrations`);
    } else if (updateChoice === '--delete') {
      console.log('⚠️  Deleting registrations with failed uploads...');
      const result = await registrationsCollection.deleteMany(
        { paymentScreenshotUrl: { $regex: /^\[pending/ } }
      );
      console.log(`🗑️  Deleted ${result.deletedCount} registrations`);
    } else {
      console.log('Run with --mark-failed to mark them as failed');
      console.log('Run with --delete to remove these registrations');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixPendingScreenshots();
