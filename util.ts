import {MrkdwnElement, SectionBlock} from '@slack/bolt';


type Block = {title: string, desc: string};

// Creates an array of section blocks from a given array by grouping elements into pairs
export function createSectionBlocks(blocks: Block[]) {
    const sections: SectionBlock[] = [];

    for (let i = 0; i < blocks.length; i += 2) {
        const fields: SectionBlock['fields'] = [createMarkdownBlock(blocks[i])];
        if (i + 1 < blocks.length) fields.push(createMarkdownBlock(blocks[i + 1]));
        sections.push({type: 'section', fields});
    }

    return sections;
}

function createMarkdownBlock(block: Block): MrkdwnElement {
    return {type: 'mrkdwn', text: `*${block.title}*\n${block.desc}`}
}
