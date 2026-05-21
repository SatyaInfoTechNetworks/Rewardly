require('dotenv').config();
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');
const Broadcast = require('./src/models/Broadcast');
const BroadcastLog = require('./src/models/BroadcastLog');
const { broadcastQueue, worker } = require('./src/utils/queue');
const { queueCampaign } = require('./src/utils/scheduler');

async function runQueueValidation() {
  try {
    console.log('🏁 Starting Queue & Rate-Limiting Validation...');
    await sequelize.authenticate();
    console.log('✅ Database connection authenticated.');

    // 1. Create or Find Mock Users
    console.log('👥 Setting up test users in the database...');
    const testUsers = [
      { telegram_id: 111111111, first_name: 'Devra', username: 'devra_tester', balance: 7500 },
      { telegram_id: 222222222, first_name: 'Aishwarya', username: 'aish_tester', balance: 1200 },
      { telegram_id: 333333333, first_name: 'Divya', username: 'divya_tester', balance: 500 }
    ];

    for (const u of testUsers) {
      await User.findOrCreate({
        where: { telegram_id: u.telegram_id },
        defaults: {
          first_name: u.first_name,
          username: u.username,
          balance: u.balance,
          is_phone_verified: true,
          is_channel_joined: true
        }
      });
    }
    console.log('✅ Test users ready.');

    // 2. Create a Mock Broadcast Campaign (Draft)
    console.log('📢 Creating a test broadcast campaign...');
    const testBroadcast = await Broadcast.create({
      title: 'Harness Test Campaign',
      message: 'Hello {first_name}! Your balance is {coins} coins. Redeem now: {wallet}',
      media_type: 'none',
      button_text: 'Claim Now',
      button_url: 'https://rewardly.satyainfotechnetworks.com/withdraw',
      target_type: 'all_users',
      status: 'draft'
    });
    console.log(`✅ Test Campaign created with ID #${testBroadcast.id}.`);

    // 3. Queue Campaign & Start Worker Verification
    console.log('📡 Queuing campaign to BullMQ...');
    
    // We will measure execution timestamps
    const startTime = Date.now();
    
    // Listen to worker events
    let successCount = 0;
    let failedCount = 0;
    
    // We register temporary job complete listeners
    const onCompleted = async (job) => {
      if (job.data.broadcastId === testBroadcast.id) {
        successCount++;
        const duration = Date.now() - startTime;
        console.log(`✨ Job Completed for user ${job.data.telegramId} at +${duration}ms`);
      }
    };

    const onFailed = (job, err) => {
      if (job && job.data && job.data.broadcastId === testBroadcast.id) {
        failedCount++;
        console.log(`❌ Job Failed for user ${job.data.telegramId}: ${err.message}`);
      }
    };

    worker.on('completed', onCompleted);
    worker.on('failed', onFailed);

    // Trigger Campaign dispatch
    await queueCampaign(testBroadcast);
    console.log('⚡ Campaign queued. Waiting for queue to clear (6 seconds)...');

    await new Promise(resolve => setTimeout(resolve, 6000));

    // Cleanup listeners
    worker.off('completed', onCompleted);
    worker.off('failed', onFailed);

    // 4. Print Summary stats
    console.log('\n📊 Queue Execution Statistics:');
    console.log(`- Campaign status: ${await Broadcast.findByPk(testBroadcast.id).then(b => b.status)}`);
    console.log(`- Jobs executed: ${successCount + failedCount}`);
    console.log(`- Successful completions (simulated or real): ${successCount}`);
    console.log(`- Failures: ${failedCount}`);

    // Fetch the logs from DB
    const logs = await BroadcastLog.findAll({ where: { broadcast_id: testBroadcast.id } });
    console.log(`- Broadcast Logs saved in MySQL: ${logs.length}`);
    for (const log of logs) {
      console.log(`  └ User ID: ${log.telegram_id} | Status: ${log.status} | Error: ${log.error_message || 'none'}`);
    }

    console.log('\n🏁 Queue Validation Finished successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Queue Validation failed with error:', error);
    process.exit(1);
  }
}

runQueueValidation();
