const { getAppointments, markFollowupSent } = require('./sheets');
const { sendFollowup } = require('./whatsapp');

const WINDOW_MIN_HOURS = 24;
const WINDOW_MAX_HOURS = 27;

async function checkAndSendFollowups() {
  console.log(`[${new Date().toISOString()}] Checking for post-visit follow-ups...`);

  const appointments = await getAppointments();
  const now = new Date();

  let sent = 0;

  for (const appt of appointments) {
    if (appt.followupSent === 'Y') continue;
    if (!appt.phone || !appt.dateTime) continue;

    const apptTime = new Date(appt.dateTime);
    if (isNaN(apptTime.getTime())) {
      console.warn(`Invalid date for ${appt.name}: "${appt.dateTime}"`);
      continue;
    }

    const hoursAgo = (now - apptTime) / (1000 * 60 * 60);

    if (hoursAgo >= WINDOW_MIN_HOURS && hoursAgo <= WINDOW_MAX_HOURS) {
      try {
        await sendFollowup(appt);
        await markFollowupSent(appt.rowIndex);
        sent++;
      } catch (err) {
        console.error(`Failed to send follow-up to ${appt.name}:`, err.message);
      }
    }
  }

  console.log(`Done. ${sent} follow-up(s) sent.`);
}

module.exports = { checkAndSendFollowups };
