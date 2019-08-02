import {Modifier, EditorState, AtomicBlockUtils, genKey, ContentBlock, SelectionState} from 'draft-js';
const Immutable = require('immutable');


export const injectWithSuggestion = (editorState, suggestion) => {
    const contentState = editorState.getCurrentContent();

    const contentStateWithEntity = contentState.createEntity(
        'SUGGESTION',
        'IMMUTABLE',
        {content: "foobar"}
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    const selection = editorState.getSelection();

    const withEntity = Modifier.insertText(
        contentState,
        selection,
        suggestion,
        Immutable.OrderedSet.of('SUGGESTION'),
        entityKey
    );

    const newEditorState = EditorState.push(
        editorState,
        withEntity,
        'insert-suggestion'
    );
    const newSelection = newEditorState.getSelection();
    return EditorState.forceSelection(
        newEditorState,
        newSelection.merge({
            anchorOffset: newSelection.getFocusOffset() - suggestion.length,
            focusOffset: newSelection.getFocusOffset() - suggestion.length
        })
    );
};


function findSuggestion(editorState) {
    const contentState = editorState.getCurrentContent();
    return contentState.getBlockMap().reduce(
        (reduction, block) => {
            let updates = {};

            block.getCharacterList().forEach((char, characterOffset) => {
                if (!char.style.contains('SUGGESTION')) {
                    return;
                }

                updates.focusKey = block.key;
                updates.focusOffset = characterOffset + 1;

                if (!reduction.anchorKey && !updates.anchorKey) {
                    updates.anchorKey = block.key;
                    updates.anchorOffset = characterOffset;
                }
            });

            return reduction.merge(updates);
        },
        new SelectionState()
    );
}


// Convenience method, but rather expensive
export function hasSuggestion(editorState) {
    const suggestionSelection = findSuggestion(editorState);
    return !!suggestionSelection.anchorKey
}


export const clearSuggestion = (editorState) => {
    const suggestionSelection = findSuggestion(editorState);

    if (!suggestionSelection.anchorKey) {
        return editorState;
    }

    const contentState = editorState.getCurrentContent();
    const withoutSuggestion = Modifier.removeRange(contentState, suggestionSelection, 'backward');
    return EditorState.createWithContent(withoutSuggestion);
};


export const acceptSuggestion = (editorState) => {
    const suggestionSelection = findSuggestion(editorState);

    if (!suggestionSelection.anchorKey) {
        return editorState;
    }

    const contentState = editorState.getCurrentContent();
    const withoutEntity = Modifier.applyEntity(contentState, suggestionSelection, null);
    const withoutStyle = Modifier.removeInlineStyle(withoutEntity, suggestionSelection, 'SUGGESTION');

    const endSelection = suggestionSelection.merge({
        anchorOffset: suggestionSelection.focusOffset
    });
    const withSpace = Modifier.insertText(withoutStyle, endSelection, ' ');

    const newEditorState = EditorState.createWithContent(withSpace);
    return EditorState.moveFocusToEnd(newEditorState);

    // If there is a suggestion found..
    //    1. Remove entities (DONE)
    //    2. Remove character style (DONE)
    //    3. Put focus at the end of text.
    //    4. Append a blank space?
};
