import {google} from 'googleapis';
import {spreadsheetId} from '../config';


const auth = new google.auth.GoogleAuth({
    keyFile: 'keys.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const sheets = google.sheets({ version: 'v4', auth });


const dayRows = [1, 4, 7, 10, 13];
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const dayNameToRow = (n: string) => dayRows[dayNames.findIndex(d => d === n)];

// Get a user's dinner signups for this week given their name.
// Returns the week name, the user's spreadsheet column index, and a list of sign-up information per day.
export async function getSignUps(name: string) {
    const weekName = getCurrentSheetName();

    const sheet = (await sheets.spreadsheets.values.get({
        auth, spreadsheetId,
        range: `${weekName}!A1:AW14`
    })).data.values;
    if (!sheet) return;

    const [first, last] = name.split(' ');
    const search = first.toLowerCase() !== 'ethan' ? first : `${first} ${last.charAt(0)}`
    const column = sheet[0].findIndex(col => col.toLowerCase() === search.toLowerCase());
    if (column == -1) return;

    return {
        week: weekName,
        days: dayRows.map(i => ({
            name: sheet[i - 1][0],
            slots: sheet[i][1],
            signedUp: sheet[i][column] == 'Yes'
        })),
        column
    };
}

// Updates a user's dinner signups on the sheet to the given array of days.
export async function updateSignUps(column: number, days: string[], weekName: string) {
    await sheets.spreadsheets.values.batchUpdate({
        auth, spreadsheetId, requestBody: {
            valueInputOption: 'RAW',
            data: dayNames.map(day => ({
                range: `${weekName}!${getSheetColumn(column + 1)}${dayNameToRow(day) + 1}`,
                values: [[days.includes(day) ? 'Yes' : '']],
            }))
        }
    })
}

// Returns the current week's dinner signup tab name (1/11/2023 -> '1/9-1/13')
// https://stackoverflow.com/a/57914095
export function getCurrentSheetName() {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + 1); // Last monday

    const end = new Date(start);
    end.setDate(end.getDate() + 4); // This friday

    return `${start.getMonth() + 1}/${start.getDate()}-${end.getMonth() + 1}/${end.getDate()}`;
}

// Converts a numeric column index into google sheet's hexavigesimal numbering system.
// https://stackoverflow.com/a/39644793
function getSheetColumn(column: number) {
    let cname = String.fromCharCode(65 + ((column - 1) % 26));
    if (column > 26) cname = String.fromCharCode(64 + (column - 1) / 26) + cname;
    return cname;
}
