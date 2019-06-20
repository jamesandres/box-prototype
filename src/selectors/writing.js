import striptags from 'striptags';

export const textLastSentence = (state) => {
    const reversedSentences = striptags(state.writing.text, [], '\n').split('\n').reverse();

    if (reversedSentences.length > 0) {
        for (let sentence of reversedSentences) {
            if (sentence) {
                return sentence;
            }
        }
    }
    return '';
}
