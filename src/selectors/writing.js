import {Modifier, EditorState, AtomicBlockUtils, genKey, ContentBlock} from 'draft-js';
const Immutable = require('immutable');

export const injectWithSuggestion = (editorState, suggestion) => {
    // Inspired by: https://stackoverflow.com/a/49533333/806988
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const blockMap = content.getBlockMap();
    const key = selection.getAnchorKey()
    const block = blockMap.get(key);

    const blocksBefore = blockMap.toSeq().takeUntil((v) => (v === block));
    const blocksAfter = blockMap.toSeq().skipUntil((v) => (v === block)).rest();
    const newBlockKey = genKey();

    const newBlock = new ContentBlock({
        key: newBlockKey,
        type: 'suggestion',
        text: suggestion,
        characterList: new Immutable.List(),
        depth: 0,
        data: new Immutable.Map({}),
    });

    const newBlockMap = blocksBefore.concat(
        [[key, block], [newBlockKey, newBlock]],
        blocksAfter
    ).toOrderedMap();

    const newContent = content.merge({
        blockMap: newBlockMap,
        selectionBefore: selection,
        selectionAfter: selection.merge({
            anchorKey: newBlockKey,
            anchorOffset: 0,
            focusKey: newBlockKey,
            focusOffset: 0,
            isBackward: false,
        }),
    });

    return EditorState.push(editorState, newContent, 'split-block');
};

export const clearSuggestion = (editorState) => {
    // TODO: Actually clear the suggestion
    return editorState;
};