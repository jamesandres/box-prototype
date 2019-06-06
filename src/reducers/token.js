const initialState = {
    token: null
};

const token = (state = initialState, action) => {
    switch (action.type) {
        case 'FETCH_TOKEN_SUCCESS': {
            return {
                ...state,
                token: action.token
            };
        }
        default: {
            return state;
        }
    }
}

export default token;
