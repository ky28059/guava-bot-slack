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
export async function getHours(name: string, day?: number) {
    const week = getCurrentSheetName();

    const res = await sheets.spreadsheets.values.get({
        auth, spreadsheetId,
        range: `${week}!A2:I47`
    });
    if (!res.data.values) return;

    const [first, last] = name.split(' ');
    const totals = res.data.values.find(row => row[0].toLowerCase() === first.toLowerCase() || row[0].toLowerCase() === last.toLowerCase());
    if (!totals) return;

    return {week, hours: totals[day ?? 8]};
}

// Returns the current week's signup sheet tab name (1/12/2022 -> '1/9-1/15')
// https://stackoverflow.com/a/57914095
function getCurrentSheetName() {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + 1); // Last monday

    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Next sunday

    return `${start.getMonth() + 1}/${start.getDate()}-${end.getMonth() + 1}/${end.getDate()}`;
}
