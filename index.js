require('dotenv').config();
const cron = require('node-cron');
const { checkAndSendReminders } = require('./reminder');

console.log('ClinicBot v1 starting...');
console.log(`Doctor: ${process.env.DOCTOR_NAME}`);
console.log('Reminder check runs every 15 minutes.\n');

// Run immediately on startup
checkAndSendReminders().catch(console.error);

// Then run every 15 minutes
cron.schedule('*/15 * * * *', () => {
  checkAndSendReminders().catch(console.error);
});
