
import {EditorState, SelectionState, Modifier } from 'draft-js';

export default function removeSuggestionBlock(editorState, blockKey) {
    let content = editorState.getCurrentContent();
    let block = content.getBlockForKey(blockKey);
  
    let targetRange = new SelectionState({
      anchorKey: blockKey,
      anchorOffset: 0,
      focusKey: blockKey,
      focusOffset: block.getLength(),
    });
  
    let withoutSuggestion = Modifier.removeRange(content, targetRange, 'backward');
    let resetBlock = Modifier.setBlockType(
        withoutSuggestion,
        withoutSuggestion.getSelectionAfter(),
        'unstyled',
    );
  
    let newState = EditorState.push(editorState, resetBlock, 'remove-range');
    return EditorState.forceSelection(newState, resetBlock.getSelectionAfter());
  }