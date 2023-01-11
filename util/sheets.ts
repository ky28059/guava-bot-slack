import {google} from 'googleapis';
import {spreadsheetId} from '../config';


const auth = new google.auth.GoogleAuth({
    keyFile: 'keys.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const sheets = google.sheets({ version: 'v4', auth });


// Get a user's dinner signups for this week given their name.
// TODO: name parsing for the ethans
// Returns the week name and a list of sign-up information per day.
export async function getSignUps(name: string) {
    const weekName = getCurrentSheetName();

    const sheet = (await sheets.spreadsheets.values.get({
        auth, spreadsheetId,
        range: `${weekName}!A1:AW14`
    })).data.values;
    if (!sheet) return;

    const [first,] = name.split(' ');
    const column = sheet[0].findIndex(col => col.toLowerCase() === first.toLowerCase());
    if (column == -1) return;

    return {
        week: weekName,
        days: [
            // TODO: better way of doing this?
            {name: 'Monday', slots: sheet[1][1], signedUp: sheet[1][column] == 'Yes'},
            {name: 'Tuesday', slots: sheet[4][1], signedUp: sheet[4][column] == 'Yes'},
            {name: 'Wednesday', slots: sheet[7][1], signedUp: sheet[7][column] == 'Yes'},
            {name: 'Thursday', slots: sheet[10][1], signedUp: sheet[10][column] == 'Yes'},
            {name: 'Friday', slots: sheet[13][1], signedUp: sheet[13][column] == 'Yes'},
        ]
    };
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
