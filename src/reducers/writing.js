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
                // NOTE: This is fantastic, we can treat suggestion injection as a state change
                //       operation which means it can live in reducer land. This means there
                //       is no reason to expose the suggestion as a prop in the render layer!
                editorState: injectWithSuggestion(state.editorState, action.suggestion)
            };
        }
        case 'CLEAR_SUGGESTION': {
            return {
                ...state,
                // NOTE: Ditto to above, this pattern has legs I think!
                editorState: clearSuggestion(state.editorState)
            };
        }
        default: {
            return state;
        }
    }
}

export default writing;
