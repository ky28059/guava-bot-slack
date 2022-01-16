import {App} from '@slack/bolt';
import {getHours} from './sheets';
import {createSectionBlocks} from './util';
import { signingSecret, token, port, signupsLink } from './config';


const app = new App({
    signingSecret,
    token
});

type Command = {name: string, pattern: string, desc: string};
const commands: Command[] = [
    {name: 'help', pattern: '/help [command]?', desc: 'Sends info about other available commands.'},
    {name: 'signups', pattern: '/signups', desc: 'Sends a link to the shoptime signup spreadsheet.'},
    {name: 'hours', pattern: '/hours', desc: 'Sends how many hours you\'ve signed up for this week.'},
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

// /hours
// Returns the number of hours a user has signed up for in the current week.
app.command('/hours', async ({command, client, ack, respond}) => {
    await ack();

    // Extract Slack real_name from user ID
    const {user} = await client.users.info({ token, user: command.user_id });
    if (!user?.real_name) return respond('An error occurred parsing your name.');

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

// /help [command]?
// Sends info about other available commands.
// TODO: support search by command name
app.command('/help', async ({command, ack, respond}) => {
    await ack();

    const sections = createSectionBlocks(commands.map(({pattern, desc}) => ({title: pattern, desc})));
    await respond({
        blocks: [
            {type: 'header', text: {type: 'plain_text', text: 'Commands'}},
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
