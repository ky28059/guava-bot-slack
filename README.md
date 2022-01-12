# guava bot slack
Slack bot for a certain elusive slack workspace.

To run locally, create a `config.ts` in the root directory which exports your slack signing secret, bot user token, and 
desired port to run the server on:
```ts
// config.ts
export const signingSecret = 'legitimate-slack-signing-secret';
export const token = 'xoxb-also-legitimate-slack-token';
export const port = 443;
```
Install dependencies with `npm install` and run `npm start` to run the bot.
Note that the current version uses `ngrok`, which needs to first be set up [here](https://dashboard.ngrok.com/get-started/setup).
Also, a new URL will be generated every time the program is run, which the Slack application should be updated with 
accordingly.

### Slack
When creating the Slack application, note that boltjs requires that all URLs are appended with `/slack/events`. If your
server is running at `https://example.com`, set the event subscription URL and URL for all created slash commands to be 
`https://example.com/slack/events`.
