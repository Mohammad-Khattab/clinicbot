const { getAppointments, markReminderSent } = require('./sheets');
const { sendReminder } = require('./whatsapp');

const WINDOW_MIN_HOURS = 23;
const WINDOW_MAX_HOURS = 26;

async function checkAndSendReminders() {
  console.log(`[${new Date().toISOString()}] Checking for upcoming appointments...`);

  const appointments = await getAppointments();
  const now = new Date();

  let sent = 0;

  for (const appt of appointments) {
    if (appt.reminderSent === 'Y') continue;
    if (!appt.phone || !appt.dateTime) continue;

    const apptTime = new Date(appt.dateTime);
    if (isNaN(apptTime.getTime())) {
      console.warn(`Invalid date for ${appt.name}: "${appt.dateTime}"`);
      continue;
    }

    const hoursUntil = (apptTime - now) / (1000 * 60 * 60);

    if (hoursUntil >= WINDOW_MIN_HOURS && hoursUntil <= WINDOW_MAX_HOURS) {
      try {
        await sendReminder(appt);
        await markReminderSent(appt.rowIndex);
        sent++;
      } catch (err) {
        console.error(`Failed to send reminder to ${appt.name}:`, err.message);
      }
    }
  }

  console.log(`Done. ${sent} reminder(s) sent.`);
}

module.exports = { checkAndSendReminders };
