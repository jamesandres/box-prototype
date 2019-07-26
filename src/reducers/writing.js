const initialState = {
    text: '',
    suggestion: '',
    suggestionNodePath: '0',
};

const writing = (state = initialState, action) => {
    // For debugging in IE *shudder*
    (window.actions ? window.actions : window.actions = []).push([state, action]);
    switch (action.type) {
        case 'UPDATE_TEXT': {
            return {
                ...state,
                text: action.text
            };
        }
        case 'UPDATE_SUGGESTION': {
            return {
                ...state,
                suggestion: action.suggestion,
                suggestionNodePath: action.suggestionNodePath
            };
        }
        case 'CLEAR_SUGGESTION': {
            return {
                ...state,
                suggestion: initialState.suggestion,
                suggestionNodePath: initialState.suggestionNodePath
            };
        }
        default: {
            return state;
        }
    }
}

export default writing;
