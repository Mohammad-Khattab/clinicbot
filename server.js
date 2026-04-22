const express = require('express');
const twilio = require('twilio');
const { handleMessage } = require('./conversation');
const { saveAppointment } = require('./sheets');

const app = express();
app.use(express.urlencoded({ extended: false }));

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/whatsapp/incoming', async (req, res) => {
  const from = req.body.From; // e.g. whatsapp:+962791234567
  const body = req.body.Body?.trim();
  const phone = from.replace('whatsapp:', '');

  console.log(`[INBOUND] ${phone}: ${body}`);

  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');

  try {
    const { complete, reply, booking } = await handleMessage(phone, body);

    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: from,
      body: reply,
    });

    if (complete && booking) {
      await saveAppointment(booking);
      console.log(`Booking saved for ${booking.name} (${phone})`);
    }
  } catch (err) {
    console.error('Error handling inbound message:', err.message);
  }
});

function startServer() {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Webhook server listening on port ${port}`);
  });
}

module.exports = { startServer };
