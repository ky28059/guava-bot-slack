# guava bot slack
Slack bot for a certain elusive slack workspace.

To run locally, create a `config.ts` in the root directory which exports your slack signing secret, bot user token, port,
and signup spreadsheet link and id:
```ts
// config.ts
export const signingSecret = 'legitimate-slack-signing-secret';
export const token = 'xoxb-also-legitimate-slack-token';
export const port = 3000;

export const signupsLink = 'https://tinyurl.com/guava-gang-secret-build-signups!1!!1';
export const spreadsheetId = 'some-spreadsheet-id';
```
Install dependencies with `npm install` and run `npm start` to run the bot.

### Slack
When creating the Slack application, note that boltjs requires that all URLs are appended with `/slack/events`. If your
server is running at `13.00.255.255` on port `3000`, set the event subscription URL and request URL for all created slash 
commands to be `http://13.00.255.255:3000/slack/events`.

Guava bot requires the following scopes:
- `commands` to add and receive slash command interactions
- `chat:write` to send messages
- `users:read` to extract `user.real_name` from `command.user_id`
- `reactions:read` to receive `reaction_add` events

### Google
To use the sheets API, create a [Google cloud project](https://console.cloud.google.com) and enable the [Google Sheets
API](https://console.cloud.google.com/marketplace/product/google/sheets.googleapis.com). Create a service account via
`Create Credentials > Google Sheets API > Application data`. In your service account details page, save your key file 
(`Keys > Add Key > Create new key > JSON`) as `keys.json`.
[...]

### Deployment
[...]
