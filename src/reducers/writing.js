const initialState = {
    text: null,
    postfix: null,
    startOffset: 0,
    endOffset: 0
};

const writing = (state = initialState, action) => {
    switch (action.type) {
        case 'UPDATE_TEXT': {
            return {
                text: action.text,
                startOffset: action.startOffset,
                endOffset: action.endOffset
            };
        }
        case 'UPDATE_POSTFIX': {
            return {
                postfix: action.postfix
            };
        }
        default: {
            return state;
        }
    }
}

export default writing;
