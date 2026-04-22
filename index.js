require('dotenv').config();
const cron = require('node-cron');
const { checkAndSendReminders } = require('./reminder');
const { checkAndSendFollowups } = require('./followup');

console.log('ClinicBot v2 starting...');
console.log(`Doctor: ${process.env.DOCTOR_NAME}`);
console.log('Reminder + follow-up checks run every 15 minutes.\n');

async function runAllChecks() {
  await checkAndSendReminders().catch(console.error);
  await checkAndSendFollowups().catch(console.error);
}

// Run immediately on startup
runAllChecks();

// Then run every 15 minutes
cron.schedule('*/15 * * * *', runAllChecks);
