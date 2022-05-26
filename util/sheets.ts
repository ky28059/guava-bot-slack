import {google} from 'googleapis';
import {spreadsheetId} from '../config';


const auth = new google.auth.GoogleAuth({
    keyFile: 'keys.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const sheets = google.sheets({ version: 'v4', auth });


// Get a user's total shoptime hours for this week given their name.
// TODO: think about name parsing; some people are listed under their first names (Alina, Ipsita) and some under their
// last (Liang, Lin). The issue comes from people listed under neither (Fu -> Fuey).
// Returns the week name, parsed hours, and list of day names for the dropdown.
export async function getHours(name: string, day?: number) {
    const week = getCurrentSheetName();

    const res = await sheets.spreadsheets.values.get({
        auth, spreadsheetId,
        range: `${week}!A1:I47`
    });
    if (!res.data.values) return;

    const [first, last] = name.split(' ');
    const totals = res.data.values.find(row => row[0].toLowerCase() === first.toLowerCase() || row[0].toLowerCase() === last?.toLowerCase());
    if (!totals) return;

    return {week, hours: totals[day ?? 8], days: res.data.values[0].slice(1)};
}

export async function getStatuses() {
    const sheet = getCurrentSignupSheetName();

    const res = await sheets.spreadsheets.values.get({
        auth, spreadsheetId,
        range: `${sheet}!A1:C`
    });
    if (!res.data.values) return;

    const days: string[] = [];
    let text = '';
    for (const [label, value, count] of res.data.values) {
        // Ignore spacer rows
        if (!value) continue;
        if (label.match(/^\d+:\d+\s[AP]M/i)) {
            text += `*${label}:* _${value}_ \`(${count})\`\n`;
        } else if (label !== 'Start Time') {
            days.push(text);
            text = `*${label} (${value})*\n\n`;
        }
    }
    return days.slice(1);
}

// Returns the current week's signup hours tab name (1/25/2022 -> '1/23-1/29')
// https://stackoverflow.com/a/57914095
function getCurrentSheetName(offset: number = 0) {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + offset); // Last sunday

    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Next saturday

    return `${start.getMonth() + 1}/${start.getDate()}-${end.getMonth() + 1}/${end.getDate()}`;
}

// Returns the current week's signup tab name (1/25/2022 -> '1/24-1/30 Sign Ups')
// The signups tab dates are offset by 1 from the signup hours dates, because Sunday is signed up for in the previous week
function getCurrentSignupSheetName() {
    return `${getCurrentSheetName(1)} Sign Ups`;
}
