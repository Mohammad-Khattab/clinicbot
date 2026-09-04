# ClinicBot

A WhatsApp bot that handles appointment booking, reminders, and post-visit follow-ups for a small clinic or medical practice, using conversational AI, Twilio WhatsApp, and Google Sheets as the data store.

## What it does

- **Inbound booking** — Patients message the clinic's WhatsApp number. A Groq-hosted LLM (Llama 3.1) runs a short conversation to collect the patient's name, reason for visit, and preferred date/time, then confirms the booking automatically.
- **Appointment storage** — Bookings are appended as rows in a Google Sheet (`Appointments` tab), which acts as the system of record. No patient data is stored in the repo or in a local database.
- **Reminders** — A scheduled job (every 15 minutes) scans the sheet and sends a WhatsApp reminder ~23–26 hours before each upcoming appointment, asking the patient to reply CONFIRM or CANCEL.
- **Follow-ups** — The same scheduler sends a post-visit follow-up message ~24–27 hours after the appointment time, checking in on the patient.
- **Bilingual** — The booking assistant responds in either Arabic or English depending on the language the patient uses.

## Tech stack

- Node.js (Express) for the inbound webhook server
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp) for sending/receiving messages
- [Groq SDK](https://groq.com/) (Llama 3.1 8B Instant) for the conversational booking flow
- [Google Sheets API](https://developers.google.com/sheets/api) (via a service account) as the appointment data store
- `node-cron` for scheduled reminder/follow-up checks

## How it works

```
Patient WhatsApp message
        │
        ▼
POST /whatsapp/incoming (server.js)
        │
        ▼
conversation.js  ──►  Groq LLM (collects name, reason, date/time)
        │
        ▼
sheets.js  ──►  Google Sheet "Appointments" (append row)
        │
        ▼
Twilio  ──►  confirmation reply to patient

Every 15 minutes (index.js cron):
  reminder.js  ──► scans sheet, sends WhatsApp reminders ~24h before appointment
  followup.js  ──► scans sheet, sends WhatsApp follow-ups ~24h after appointment
```

## Setup

### Prerequisites

- Node.js 18+
- A [Twilio](https://www.twilio.com/) account with the WhatsApp Sandbox (or an approved WhatsApp Business sender) enabled
- A [Groq](https://console.groq.com/) API key
- A Google Cloud service account with access to the Sheets API, and a Google Sheet shared with that service account

### Google Sheet format

Create a sheet named `Appointments` with these columns (A–G):

| Name | Phone | DateTime | Reason | Doctor | ReminderSent | FollowupSent |
|------|-------|----------|--------|--------|---------------|----------------|

`ReminderSent` / `FollowupSent` should start as `N` and are flipped to `Y` automatically once each message is sent.

### Installation

```bash
git clone <this-repo>
cd clinicbot
npm install
cp .env.example .env
```

Fill in `.env`:

```env
# Google Sheets
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Groq
GROQ_API_KEY=your_groq_api_key_here

# Clinic Info
BUSINESS_NAME=Your Clinic Name
DOCTOR_NAME=Dr. Example
```

### Running locally

```bash
npm start
```

This starts the Express webhook server (default port 3000) and the 15-minute reminder/follow-up scheduler.

To receive inbound WhatsApp messages locally, expose the server with a tunnel (e.g. `ngrok http 3000`) and point your Twilio WhatsApp sandbox webhook to `https://<your-tunnel>/whatsapp/incoming`.

### Deployment

A `Procfile` is included (`worker: node index.js`) for platforms like Heroku or Railway that run the app as a background worker with an exposed HTTP port for the webhook.

## Security notes

- Never commit `.env` or any real Google service-account JSON — both are covered by `.gitignore`.
- Patient data lives only in your own Google Sheet, not in this codebase.
- Rotate the Twilio auth token and Google service account key if they are ever exposed.

## License

MIT (or update to your preferred license).
