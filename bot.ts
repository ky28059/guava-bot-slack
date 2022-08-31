import {App, MessageShortcut} from '@slack/bolt';
import {Header, Message, Modal, Section} from 'slack-block-builder';
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

// reacted-shortcut
// Gets the list of people who haven't reacted to the given message.
app.shortcut<MessageShortcut>('reacted-shortcut', async ({ack, payload, client}) => {
    await ack();

    const users = (await client.users.list()).members;
    const reactions = (await client.reactions.get({
        channel: payload.channel.id,
        timestamp: payload.message.ts,
        full: true
    })).message?.reactions;

    // Flatmap reacted users to the IDs set.
    // TODO: better way of doing this?
    const reactedIds = new Set<string>();
    if (reactions) for (const {users} of reactions) {
        if (!users) continue;
        for (const id of users) reactedIds.add(id);
    }

    const reactedMessage = reactedIds.size
        ? [...reactedIds].map(id => `<@${id}>`).join('\n')
        : '_No one has reacted yet._'

    const notReactedMessage = users
        ?.filter(user => user.id && !reactedIds.has(user.id))
        .filter(user => !user.deleted && !user.is_bot && !['U03SHM9TC7Q', 'U03SQ75BQMR', 'U03G98CQZ5X', 'USLACKBOT'].includes(user.id!)) // Exclude bots, deleted accounts, and Granlund, P. Roan, the gunnrobotics account, and slackbot (because the bot check doesn't seem to work for slackbot)
        .map(user => `${user.real_name} (<@${user.id}>)`)
        .join('\n')
        ?? '_Everyone has reacted!_';

    await client.views.open({
        trigger_id: payload.trigger_id,
        view: Modal({title: 'Message Reactions'})
            .blocks(
                Section().fields(
                    `*Reacted:*\n${reactedMessage}`,
                    `*Haven't reacted:*\n${notReactedMessage}`
                )
            )
            .buildToObject()
    })
});

;(async () => {
    await app.start(port);
    console.log(`Started on port ${port}`);
})();
