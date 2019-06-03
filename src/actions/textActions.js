const updatePostfixAction = (suggestion) => ({
    type: 'UPDATE_POSTFIX',
    postfix: suggestion
});

const clearPostfixAction = () => ({
    type: 'CLEAR_POSTFIX'
});

export const clearPostfix = () =>
    (dispatch, getState) => dispatch(clearPostfixAction());


const fetchSuggestionsErrorAction = (error) => ({
    type: 'FETCH_SUGGESTIONS_ERROR',
    error: error
});

const abandonSuggestionsAction = (reason) => ({
    type: 'FETCH_SUGGESTIONS_ABANDON',
    reason: reason
});

export const fetchSuggestions = (text, token) =>
    async (dispatch, getState) => {
        const escapedText = encodeURIComponent(text);
        const escapedToken = encodeURIComponent(token);
        fetch(`http://localhost:8010/suggest?q=${escapedText}&token=${escapedToken}`)
            .catch(e => {
                dispatch(fetchSuggestionsErrorAction(e.toString()));
                console.error(e);
            })
            .then(response => response.json())
            .then(responseJson => {
                if (!responseJson.suggestions || responseJson.suggestions.length <= 0) {
                    dispatch(abandonSuggestionsAction(`There are no suggestions for ${JSON.stringify(text)}`));
                    return;
                }
                const { suggestion } = responseJson.suggestions[0];
                const currentText = getState().writing.text;

                if (!suggestion.startsWith(currentText)) {
                    dispatch(abandonSuggestionsAction(`User changed text since suggestion fetched! was: ${JSON.stringify(text)}; now is: ${JSON.stringify(currentText)}`));
                    return;
                }

                const newPostfix = suggestion.slice(text.length);

                dispatch(updatePostfixAction(newPostfix));
            })
    };


const updateTextAction = (text) => ({
    type: 'UPDATE_TEXT',
    text
});

export const updateText = (text) =>
    (dispatch, getState) => {
        dispatch(updateTextAction(text));
    };


const updateSelectionAction = (startOffset, endOffset) => ({
    type: 'UPDATE_SELECTION',
    startOffset,
    endOffset
});

export const updateSelection = (startOffset, endOffset) =>
    (dispatch, getState) => {
        dispatch(updateSelectionAction(startOffset, endOffset));
    };
