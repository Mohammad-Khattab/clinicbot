const { google } = require('googleapis');

const SHEET_NAME = 'Appointments';
const COLUMNS = { Name: 0, Phone: 1, DateTime: 2, Reason: 3, Doctor: 4, ReminderSent: 5 };

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

async function getAppointments() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A2:F`,
  });

  const rows = res.data.values || [];
  return rows.map((row, index) => ({
    rowIndex: index + 2,
    name: row[COLUMNS.Name] || '',
    phone: row[COLUMNS.Phone] || '',
    dateTime: row[COLUMNS.DateTime] || '',
    reason: row[COLUMNS.Reason] || '',
    doctor: row[COLUMNS.Doctor] || process.env.DOCTOR_NAME,
    reminderSent: row[COLUMNS.ReminderSent] || 'N',
  }));
}

async function markReminderSent(rowIndex) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!F${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['Y']] },
  });
}

module.exports = { getAppointments, markReminderSent };
