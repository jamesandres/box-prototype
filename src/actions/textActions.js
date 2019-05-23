export const updateText = (text, startOffset, endOffset) => ({
    type: 'UPDATE_TEXT',
    text,
    startOffset,
    endOffset
});

const updatePostfix = (suggestion) => ({
    type: 'UPDATE_POSTFIX',
    postfix: suggestion
});

const fetchSuggestionsError = (error) => ({
    type: 'FETCH_SUGGESTIONS_ERROR',
    error: error
});

const abandonSuggestions = (reason) => ({
    type: 'FETCH_SUGGESTIONS_ABANDON',
    reason: reason
});

export const fetchSuggestions = (text, token) =>
    async (dispatch, getState) => {
        const escapedText = encodeURI(text);
        const escapedToken = encodeURI(token);
        fetch(`http://localhost:8010/suggest?q=${escapedText}&token=${escapedToken}`)
            .catch(e => {
                dispatch(fetchSuggestionsError(e.toString()));
                console.error(e);
            })
            .then(response => response.json())
            .then(responseJson => {
                if (!responseJson.suggestions || responseJson.suggestions.length <= 0) {
                    dispatch(abandonSuggestions("There were suggestions"));
                    return;
                }
                const { suggestion } = responseJson.suggestions[0];
                const currentText = getState().writing.text;

                if (!suggestion.startsWith(currentText)) {
                    dispatch(abandonSuggestions(`User changed text since suggestion fetched! was: ${JSON.stringify(text)}; now is: ${JSON.stringify(currentText)}`));
                    return;
                }

                const newPostfix = suggestion.slice(text.length);

                dispatch(updatePostfix(newPostfix));
            })
    };
