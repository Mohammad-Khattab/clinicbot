const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendReminder(appointment) {
  const { name, phone, dateTime, reason, doctor } = appointment;

  const date = new Date(dateTime);
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const message =
    `Hello ${name},\n\n` +
    `This is a reminder for your appointment with ${doctor} tomorrow.\n\n` +
    `Date: ${dateStr}\n` +
    `Time: ${timeStr}\n` +
    `Reason: ${reason}\n\n` +
    `Reply *CONFIRM* to confirm or *CANCEL* to cancel.\n\n` +
    `See you soon!`;

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${phone}`,
    body: message,
  });

  console.log(`Reminder sent to ${name} (${phone})`);
}

async function sendFollowup(appointment) {
  const { name, phone, doctor } = appointment;

  const message =
    `Hello ${name},\n\n` +
    `We hope you're feeling well after your visit with ${doctor}.\n\n` +
    `Do you have any concerns or questions we can help with?\n\n` +
    `Thank you for trusting us with your health!`;

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${phone}`,
    body: message,
  });

  console.log(`Follow-up sent to ${name} (${phone})`);
}

module.exports = { sendReminder, sendFollowup };
