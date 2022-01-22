import {App} from '@slack/bolt';
import {getHours} from './util/sheets';
import {createSectionBlocks} from './util/slack';
import {dayToNumber} from './util/parsing';
import { signingSecret, token, port, signupsLink } from './config';


const app = new App({
    signingSecret,
    token
});

type Command = {name: string, pattern: string, desc: string};
const commands: Command[] = [
    {name: 'help', pattern: '/help', desc: 'Sends info about other available commands.'},
    {name: 'signups', pattern: '/signups', desc: 'Sends a link to the shoptime signup spreadsheet.'},
    {name: 'hours', pattern: '/hours [day]?', desc: 'Sends how many hours you\'ve signed up for this week, or on a specific day.'},
    {name: 'gogurt', pattern: '/gogurt', desc: 'Go GRT!'},
];


// /signups
// Sends a link to the shoptime signup spreadsheet.
// TODO: consider adding advanced features like which days have free slots, which week it is, how many hours a person has, etc.
app.command('/signups', async ({command, ack, respond}) => {
    await ack();
    await respond({
        blocks: [
            {type: 'header', text: {type: 'plain_text', text: 'GRT Shoptime Signups'}},
            {type: 'section', text: {type: 'mrkdwn', text: `<${signupsLink}|Signup Sheet>`}}
        ]
    });
});

// /signup [day] [hours]
// Signs a user up for the day and time range specified.
// TODO: implement this
app.command('/signup', async ({command, client, ack, respond}) => {
    await ack();
    await respond('This command is currently unimplemented. Pester Kevin to complete it!');

    const res = await client.users.info({ token, user: command.user_id });
    console.log(res.user?.real_name);
});

// /hours [day]?
// Returns the number of hours a user has signed up for in the current week, or on the provided day.
app.command('/hours', async ({command, client, ack, respond}) => {
    await ack();

    // Extract Slack real_name from user ID
    const {user} = await client.users.info({ token, user: command.user_id });
    if (!user?.real_name) return respond('An error occurred parsing your name.');

    // TODO: consider abstracting argument parsing
    // I don't think this application needs a massive and somewhat scary pattern-based argParser like what RBot has,
    // but perhaps some abstraction would be nice.
    const args = command.text.match(/("(?:[^"\\]|\\.)*")|[^\s]+/g);
    if (args?.length) {
        const day = dayToNumber(args[0]);
        if (!day) return respond(`Argument \`${args[0]}\` could not be resolved to a day.`);

        const parsed = await getHours(user.real_name, day.num + 1); // Add one to skip name column
        if (!parsed) return respond('An error occurred parsing your name.');

        return respond({
            blocks: [
                {type: 'header', text: {type: 'plain_text', text: `Shoptime hours for ${day.name}, week of ${parsed.week}`}},
                {type: 'section', text: {type: 'mrkdwn', text: `You have signed up for ${parsed.hours} hours of shoptime this ${day.name}.`}}
            ]
        });
    }

    const parsed = await getHours(user.real_name);
    if (!parsed) return respond('An error occurred parsing your name.');

    await respond({
        blocks: [
            {type: 'header', text: {type: 'plain_text', text: `Shoptime hours, week of ${parsed.week}`}},
            {type: 'section', text: {type: 'mrkdwn', text: `You have signed up for ${parsed.hours} hours of shoptime this week.`}}
        ]
    });
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

    const sections = createSectionBlocks(commands.map(({pattern, desc}) => ({title: pattern, desc})));
    await respond({
        blocks: [
            {type: 'header', text: {type: 'plain_text', text: 'Help — Commands'}},
            {type: 'section', text: {type: 'mrkdwn', text: 'Guava Bot is open sourced on <https://github.com/ky28059/guava-bot-slack|GitHub>.'}},
            ...sections
        ]
    });
});

// TODO: log reactions on spreadsheet
app.event('reaction_added', async ({event}) => {
    console.log(event.reaction);
});

;(async () => {
    await app.start(port);
    console.log(`Started on port ${port}`);
})();
