import {Modifier, EditorState} from 'draft-js';


export const injectWithSuggestion = (editorState, suggestion) => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    let newContentState = Modifier.insertText(contentState, selectionState, suggestion);
    const newEditorStateWithCharacters = EditorState.push(editorState, newContentState, 'insert-characters');
    return newEditorStateWithCharacters;
};

export const clearSuggestion = (editorState) => {
    // TODO: Actually clear the suggestion
    return editorState;
};