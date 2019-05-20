export const updateText = (text, startOffset, endOffset) => (dispatch, getState) => {
    dispatch(reallyUpdateText(text, startOffset, endOffset));

    const possiblePostfixes = ['something', 'yeah', 'it', 'is', 'a', 'very', 'nice', 'day', 'today'];
    const postfix = possiblePostfixes[Math.floor(Math.random() * postfix.length)];

    dispatch(updatePostfix(postfix));
};

const reallyUpdateText = (text, startOffset, endOffset) => ({
    type: 'UPDATE_TEXT',
    text,
    startOffset,
    endOffset
});

export const updatePostfix = (postfix) => ({
    type: 'UPDATE_POSTFIX',
    postfix
});
