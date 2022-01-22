import {HeaderBlock, MrkdwnElement, PlainTextElement, SectionBlock} from '@slack/bolt';


// Creates a Block Kit plain_text element
export function plainText(text: string): PlainTextElement {
    return {type: 'plain_text', text};
}

// Creates a Block Kit mrkdwn element
export function markdown(text: string): MrkdwnElement {
    return {type: 'mrkdwn', text};
}

// Creates a Block Kit header block
export function header(text: string): HeaderBlock {
    return {type: 'header', text: plainText(text)};
}

// Creates a Block Kit dropdown option
export function option(text: string, value: string) {
    return {text: plainText(text), value};
}

// Creates an array of Block Kit section blocks from an object array by grouping elements into pairs
type Block = {title: string, desc: string};
export function createSectionBlocks(blocks: Block[]) {
    const sections: SectionBlock[] = [];

    for (let i = 0; i < blocks.length; i += 2) {
        const fields: SectionBlock['fields'] = [createMarkdownBlock(blocks[i])];
        if (i + 1 < blocks.length) fields.push(createMarkdownBlock(blocks[i + 1]));
        sections.push({type: 'section', fields});
    }

    return sections;
}

function createMarkdownBlock(block: Block) {
    return markdown(`*${block.title}*\n${block.desc}`);
}
