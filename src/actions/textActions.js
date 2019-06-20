import { textLastSentence } from '../selectors/writing';

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

export const fetchSuggestions = (lastSentence, token) =>
    async (dispatch, getState) => {
        const escapedText = encodeURIComponent(lastSentence);
        const escapedToken = encodeURIComponent(token);
        fetch(`http://localhost:8010/suggest?q=${escapedText}&token=${escapedToken}`)
            .catch(e => {
                dispatch(fetchSuggestionsErrorAction(e.toString()));
                console.error(e);
            })
            .then(response => response.json())
            .then(responseJson => {
                if (!responseJson.suggestions || responseJson.suggestions.length <= 0) {
                    dispatch(abandonSuggestionsAction(`There are no suggestions for ${JSON.stringify(lastSentence)}`));
                    return;
                }
                const { suggestion } = responseJson.suggestions[0];
                const currentLastSentence = textLastSentence(getState());

                if (!suggestion.startsWith(currentLastSentence)) {
                    dispatch(abandonSuggestionsAction(`User changed text since suggestion fetched! was: ${JSON.stringify(lastSentence)}; now is: ${JSON.stringify(currentLastSentence)}`));
                    return;
                }

                const newPostfix = suggestion.slice(lastSentence.length);

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
