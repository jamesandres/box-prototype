const initialState = {
    text: '',
    postfix: null,
    startOffset: 0,
    endOffset: 0
};

const writing = (state = initialState, action) => {
    switch (action.type) {
        case 'UPDATE_TEXT': {
            console.log("updating text to " + action.text);
            return {
                ...state,
                text: action.text,
                startOffset: action.startOffset,
                endOffset: action.endOffset
            };
        }
        case 'UPDATE_POSTFIX': {
            return {
                ...state,
                postfix: action.postfix
            };
        }
        default: {
            return state;
        }
    }
}

export default writing;
