import {hasSuggestion} from '../selectors/writing';


const editorChangedAction = (editorState) => ({
    type: 'EDITOR_CHANGED',
    editorState
});

export const editorChanged = (editorState) =>
    (dispatch, getState) => {
        dispatch(editorChangedAction(editorState))
    };




const fetchSuggestionsErrorAction = (error) => ({
    type: 'FETCH_SUGGESTIONS_ERROR',
    error: error
});

const abandonSuggestionsAction = (reason) => ({
    type: 'FETCH_SUGGESTIONS_ABANDON',
    reason: reason
});

const updateSuggestionAction = (suggestion) => ({
    type: 'UPDATE_SUGGESTION',
    suggestion: suggestion
});

export const fetchSuggestions = (text, suggestionBaseURL, token) =>
    async (dispatch, getState) => {
        const escapedText = encodeURIComponent(text);
        const escapedToken = encodeURIComponent(token);
        fetch(`${suggestionBaseURL}/suggest?q=${escapedText}&token=${escapedToken}`)
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
                // TODO: Re-add support for abort due to editing race.
                // const currentLastSentence = textCurrentSentence(getState());

                // if (!suggestion.startsWith(currentLastSentence)) {
                //     dispatch(abandonSuggestionsAction(`User changed text since suggestion fetched! was: ${JSON.stringify(text)}; now is: ${JSON.stringify(currentLastSentence)}`));
                //     return;
                // }

                const newSuggestion = suggestion.slice(text.length);

                dispatch(updateSuggestionAction(newSuggestion, getState().editorState));
            })
    };




const clearSuggestionAction = () => ({
    type: 'CLEAR_SUGGESTION'
});

export const clearSuggestion = () =>
    (dispatch, getState) => dispatch(clearSuggestionAction());




const acceptSuggestionAction = () => ({
    type: 'ACCEPT_SUGGESTION'
});

export const acceptSuggestion = () =>
    (dispatch, getState) => {
        // FIXME: So sad, the decoupled nature of actions means locating the suggestion is
        //        done twice here. Once in `hasSuggestion` and again in
        //        `../selectors/writing.js::acceptSuggestion`
        if (hasSuggestion(getState().writing.editorState)) {
            dispatch(acceptSuggestionAction())
            return true;
        } else {
            return false;
        }
    };
