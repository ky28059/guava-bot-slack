import {App} from '@slack/bolt';
import {Header, Message, Section} from 'slack-block-builder';
import { signingSecret, token, port } from './config';


const app = new App({
    signingSecret,
    token
});


// /gogurt
// Go GRT!
app.command('/gogurt', async ({command, ack, respond}) => {
    await ack();
    await respond('Go GRT! 👏');
});

// /help
// Sends info about other available commands.
app.command('/help', async ({command, ack, respond}) => {
    await ack();
    await respond(
        Message()
            .blocks([
                Header({text: 'Help — Commands'}),
                Section({text: 'Guava Bot is open sourced on <https://github.com/ky28059/guava-bot-slack|GitHub>.'}),
                Section().fields(
                    `*/help*\nSends info about other available commands.`,
                    `*/gogurt*\nGo GRT!`
                )
            ])
            .buildToObject()
    );
});

;(async () => {
    await app.start(port);
    console.log(`Started on port ${port}`);
})();
