import {EditorState} from 'draft-js';

import {injectWithSuggestion, clearSuggestion} from '../selectors/writing.js';


const initialState = {
    editorState: EditorState.createEmpty(),
    text: '',
    suggestion: '',
    suggestionNodePath: '0',
};

const writing = (state = initialState, action) => {
    // For debugging in IE *shudder*
    (window.actions ? window.actions : window.actions = []).push([state, action]);
    switch (action.type) {
        case 'EDITOR_CHANGED': {
            return {
                ...state,
                editorState: action.editorState
            };
        }
        case 'UPDATE_SUGGESTION': {
            return {
                ...state,
                editorState: injectWithSuggestion(state.editorState, action.suggestion)
            };
        }
        case 'CLEAR_SUGGESTION': {
            return {
                ...state,
                editorState: clearSuggestion(state.editorState)
            };
        }
        default: {
            return state;
        }
    }
}

export default writing;
