import { App } from '@slack/bolt';
import ngrok from 'ngrok';
import { signingSecret, token, port } from './config';


const app = new App({
    signingSecret,
    token
});

// /help [command]?
app.command('/help', async ({command, ack, respond}) => {
    await ack();
    await respond('This command is currently unimplemented. Pester Kevin to complete it!');
    console.log(`received ${command.text}`);
});

// /ping
app.command('/ping', async ({command, ack, respond}) => {
    await ack();
    await respond('Pong!');
});

// reaction_added
app.event('reaction_added', async ({event}) => {
    console.log(event.reaction);
});

;(async () => {
    const url = await ngrok.connect(port);
    await app.start(port);

    console.log(`Running on ${url}`);
})();
