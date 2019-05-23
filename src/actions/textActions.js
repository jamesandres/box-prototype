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
                window.responseJson = responseJson;
                console.log("fetch response was", responseJson);
                dispatch(updatePostfix(responseJson.suggestions[0].suggestion))
            })
    };
