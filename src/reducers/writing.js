const initialState = {
    text: '',
    suggestion: '',
    suggestionNodePath: '0',
};

const writing = (state = initialState, action) => {
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
