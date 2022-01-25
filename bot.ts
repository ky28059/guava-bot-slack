import {App, StaticSelectAction} from '@slack/bolt';
import {getHours} from './util/sheets';
import {createSectionBlocks, header, markdown, option, plainText} from './util/slack';
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
            header('GRT Shoptime Signups'),
            {type: 'section', text: markdown(`<${signupsLink}|Signup Sheet>`)}
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

        const message = await hoursResponse(user.real_name, day.num + 1, day.name); // Add one to skip name column
        if (!message) return respond('An error occurred parsing your name.');

        return respond(message);
    }

    const message = await hoursResponse(user.real_name);
    if (!message) return respond('An error occurred parsing your name.');

    await respond(message);
});

app.action('hours-dropdown', async ({body, payload, client, ack, respond}) => {
    await ack();

    // Extract Slack real_name from user ID
    const {user} = await client.users.info({ token, user: body.user.id });
    if (!user?.real_name) return respond('An error occurred parsing your name.');

    // Extract standardized day name from first part of option value ('Saturday 1/29' -> 'Saturday')
    const option = (payload as StaticSelectAction).selected_option;
    const dayName = option.text.text !== 'Total' ? option.text.text.split(' ')[0] : undefined;

    const message = await hoursResponse(user.real_name, Number(option.value), dayName);
    if (!message) return respond('An error occurred parsing your name.');

    await respond(message);
});

// Returns the /hours response message given the user's name and requested day and day name.
// `user.real_name` and day parsing cannot be recycled between the slash command and dropdown response, as they rely
// on different API response fields to work, leading to the current unideal solution of passing in day and dayName
// explicitly.
async function hoursResponse(name: string, day?: number, dayName?: string) {
    const parsed = await getHours(name, day);
    if (!parsed) return;

    const heading = header(dayName
        ? `Shoptime hours for ${dayName}, week of ${parsed.week}`
        : `Shoptime hours, week of ${parsed.week}`);

    return {
        blocks: [
            heading,
            {type: 'section', text: markdown(`You have signed up for ${parsed.hours} hours of shoptime this ${dayName ?? 'week'}.`)},
            {
                type: 'actions',
                elements: [{
                    type: 'static_select',
                    placeholder: plainText('Select a day'),
                    options: parsed.days.map((day, i) => option(day, (i + 1).toString())),
                    action_id: 'hours-dropdown'
                }]
            }
        ]
    };
}

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
            header('Help — Commands'),
            {type: 'section', text: markdown('Guava Bot is open sourced on <https://github.com/ky28059/guava-bot-slack|GitHub>.')},
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
