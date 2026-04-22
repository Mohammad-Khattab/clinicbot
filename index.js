require('dotenv').config();
const cron = require('node-cron');
const { checkAndSendReminders } = require('./reminder');
const { checkAndSendFollowups } = require('./followup');
const { startServer } = require('./server');

console.log('ClinicBot v3 starting...');
console.log(`Business: ${process.env.BUSINESS_NAME || process.env.DOCTOR_NAME}`);
console.log('Reminder + follow-up checks run every 15 minutes.');
console.log('Inbound booking webhook active.\n');

startServer();

async function runAllChecks() {
  await checkAndSendReminders().catch(console.error);
  await checkAndSendFollowups().catch(console.error);
}

runAllChecks();

cron.schedule('*/15 * * * *', runAllChecks);
