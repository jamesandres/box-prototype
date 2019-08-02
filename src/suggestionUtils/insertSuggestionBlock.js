import {EditorState, AtomicBlockUtils } from 'draft-js';

export default function insertSuggestionBlock(editorState) {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      'SUGGESTION',
      'IMMUTABLE',
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(
      editorState,
      {currentContent: contentStateWithEntity},
    );
    return AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' ');
  }