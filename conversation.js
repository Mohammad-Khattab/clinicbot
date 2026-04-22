const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// phone -> array of { role, parts }
const sessions = new Map();

const SYSTEM_PROMPT = `You are a friendly booking assistant for ${process.env.BUSINESS_NAME || 'our clinic'}.
Your job is to collect three things from the customer:
1. Their full name
2. The reason for their visit or what service they need
3. Their preferred appointment date and time

Rules:
- Be warm, friendly, and concise — no long paragraphs
- Respond in the same language the person uses (Arabic or English)
- Ask for one thing at a time if they haven't provided it
- Once you have all three pieces of information, confirm the booking back to them in a friendly message, then on a new line output exactly this format:
BOOKING_COMPLETE {"name": "...", "reason": "...", "dateTime": "YYYY-MM-DD HH:MM:SS"}
- If the year is not mentioned, assume 2026
- If the time is not mentioned, ask for it
- If the date or time is ambiguous, ask for clarification`;

async function handleMessage(phone, incomingText) {
  if (!sessions.has(phone)) {
    sessions.set(phone, []);
  }

  const history = sessions.get(phone);

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const chat = model.startChat({ history });

  const result = await chat.sendMessage(incomingText);
  const reply = result.response.text();

  history.push({ role: 'user', parts: [{ text: incomingText }] });
  history.push({ role: 'model', parts: [{ text: reply }] });

  if (reply.includes('BOOKING_COMPLETE')) {
    const jsonMatch = reply.match(/BOOKING_COMPLETE\s*(\{.*\})/s);
    if (jsonMatch) {
      try {
        const booking = JSON.parse(jsonMatch[1]);
        booking.phone = phone;
        sessions.delete(phone);
        const friendlyReply = reply.split('BOOKING_COMPLETE')[0].trim();
        return { complete: true, booking, reply: friendlyReply };
      } catch (e) {
        console.error('Failed to parse booking JSON:', e.message);
      }
    }
  }

  return { complete: false, reply };
}

function clearSession(phone) {
  sessions.delete(phone);
}

module.exports = { handleMessage, clearSession };
