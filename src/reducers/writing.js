const initialState = {
    text: '',
    postfix: ''
};

const writing = (state = initialState, action) => {
    switch (action.type) {
        case 'UPDATE_TEXT': {
            return {
                ...state,
                text: action.text
            };
        }
        case 'UPDATE_POSTFIX': {
            return {
                ...state,
                postfix: action.postfix
            };
        }
        case 'CLEAR_POSTFIX': {
            return {
                ...state,
                postfix: ""
            };
        }
        default: {
            return state;
        }
    }
}

export default writing;
