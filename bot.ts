import {App, MessageShortcut} from '@slack/bolt';
import {Checkboxes, Header, Input, Message, Modal, Option, Section} from 'slack-block-builder';
import { signingSecret, token, port } from './config';
import {getCurrentSheetName, getSignUps} from './util/sheets';


const app = new App({
    signingSecret,
    token
});


// /gogurt
// Go GRT!
app.command('/gogurt', async ({ack, respond}) => {
    await ack();
    await respond('Go GRT! 👏');
});

// /help
// Sends info about other available commands.
app.command('/help', async ({ack, respond}) => {
    await ack();
    await respond(
        Message()
            .blocks([
                Header({text: 'Help — Commands'}),
                Section({text: 'Guava Bot is open sourced on <https://github.com/ky28059/guava-bot-slack|GitHub>.'}),
                Section().fields(
                    '*/help*\nSends info about other available commands.',
                    '*/gogurt*\nGo GRT!'
                ),
                Section().fields(
                    '*/dinner*\nManages your dinner sign-ups.'
                )
            ])
            .buildToObject()
    );
});

// /dinner
// Manages people's dinner sign-ups.
app.command('/dinner', async ({command, ack, client, payload}) => {
    await ack();

    // Get user real name
    const res = await client.users.info({ token, user: command.user_id });
    if (!res.user?.real_name) return void client.views.open({
        trigger_id: payload.trigger_id,
        view: Modal({title: 'An error occurred fetching your name.'})
            .blocks(Section({text: 'Please make sure your Slack `real_name` is set to your real name. If you think this a mistake, please report this error to <@U03SQ766BFD>.'}))
            .buildToObject()
    });

    // Fetch sign-up sheet
    const info = await getSignUps(res.user!.real_name!);
    if (!info) return void client.views.open({
        trigger_id: payload.trigger_id,
        view: Modal({title: 'An error occurred fetching your entry on the sign-ups sheet.'})
            .blocks(Section({text: 'Please make sure your Slack `real_name` is set to your real name. If you think this a mistake, please report this error to <@U03SQ766BFD>.'}))
            .buildToObject()
    });

    const options = info.days.map(day => Option({text: day.name, description: day.slots, value: day.name}));
    const initialOptions = info.days
        .filter(day => day.signedUp)
        .map(day => Option({text: day.name, description: day.slots, value: day.name}))

    const view = Modal({title: `${info.week} Dinner Sign-ups`, submit: 'Submit', callbackId: 'dinner-modal'})
        .blocks(
            Section({text: `Your dinner sign-ups for the week of ${info.week}. Don't sign up for a day that is already full, and remember that if you sign up for dinner you *must* stay for the rest of the night.`}),
            Input({label: 'Your dinner sign-ups:', blockId: 'sign-up-checkboxes'})
                .element(Checkboxes({actionId: 'sign-up-action'})
                    .options(options)
                    .initialOptions(initialOptions))
                .hint('Check the corresponding box and submit this modal to sign up for a day.')
        )
        .buildToObject()
    await client.views.open({trigger_id: payload.trigger_id, view});
});

app.view('dinner-modal', async ({ack, client, body, view}) => {
    // Update dinner modal with close message
    const weekName = getCurrentSheetName();
    await ack({
        response_action: 'update',
        view: Modal({title: `${weekName} Dinner Sign-ups`})
            .blocks(
                Header({text: 'Your dinner sign-ups have been successfully updated.'}),
                Section({text: 'This modal can be safely closed. Have a nice day!'})
            )
            .buildToObject()
    });

    // Update the sheet with modal values
    const days = view.state.values['sign-up-checkboxes']['sign-up-action'].selected_options?.map(option => option.value);
    // TODO
});

// reacted-shortcut
// Gets the list of people who haven't reacted to the given message.
app.shortcut<MessageShortcut>('reacted-shortcut', async ({ack, payload, client}) => {
    await ack();

    try {
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
            ?.filter(user => user.id && !reactedIds.has(user.id) && !user.deleted && !user.is_bot && !['U03SHM9TC7Q', 'U03SQ75BQMR', 'U03G98CQZ5X', 'USLACKBOT'].includes(user.id!)) // Exclude bots, deleted accounts, and Granlund, P. Roan, the gunnrobotics account, and slackbot (because the bot check doesn't seem to work for slackbot)
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
    } catch {
        await client.views.open({
            trigger_id: payload.trigger_id,
            view: Modal({title: 'An error occured.'})
                .blocks(Section({text: 'Please check that <@U040S0NCWM7> has been added and has access to this channel. Contact <@U03SQ766BFD> if you have further questions!'}))
                .buildToObject()
        })
    }
});

;(async () => {
    await app.start(port);
    console.log(`Started on port ${port}`);
})();
