import striptags from 'striptags';

export const humanText = (state) => striptags(state.writing.text, [], '\n');
