import React from 'react';
import Immutable from 'immutable';
import {SelectionState, Editor, EditorState, getDefaultKeyBinding, Modifier, DefaultDraftBlockRenderMap, ContentBlock, genKey, ContentState, AtomicBlockUtils} from 'draft-js';


class SuggestionBlock extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='SuggestionBlock' onClick={this.props.blockProps.onRemove}>
        {"HeLLO"}
      </div>
    );
  }
}

function insertSuggestionBlock(editorState) {
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

function removeSelectionBlock(editorState, blockKey) {
  var content = editorState.getCurrentContent();
  var block = content.getBlockForKey(blockKey);

  var targetRange = new SelectionState({
    anchorKey: blockKey,
    anchorOffset: 0,
    focusKey: blockKey,
    focusOffset: block.getLength(),
  });

  var withoutTeX = Modifier.removeRange(content, targetRange, 'backward');
  var resetBlock = Modifier.setBlockType(
    withoutTeX,
    withoutTeX.getSelectionAfter(),
    'unstyled',
  );

  var newState = EditorState.push(editorState, resetBlock, 'remove-range');
  return EditorState.forceSelection(newState, resetBlock.getSelectionAfter());
}

function blockRenderMap(block) {
  if (block.getType() === 'atomic') {
    return {
      component: SuggestionBlock,
      props: {
        onRemove: (blockKey) => {removeSelectionBlock(blockKey)},
      },
    };
  }
  return null;
};

export default class MyEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        editorState: EditorState.createEmpty(),
        fetchSuggestionsTimer: null,
        token: "NE8VWpsnfJ/RqF2IxboGeo4UIgiTsDL/ivXIC58LQwBnWIyw0nMp6QCaRnSa/f7LmJNWxVfFqHM0+/QrestN+tYp48Pi94651s9+HzOiVsdhmpOrkzw5TybOje3k7QAZk3PsOR1wSLoMwYl3twtM4YuQybsm",
        suggestionBaseURL: 'http://localhost:8010'
    };

    this.setDomEditorRef = ref => this.domEditor = ref;
    this.getTextFromCurrentContentBlock = this.getTextFromCurrentContentBlock.bind(this);
    this.onChange = (editorState) => {
        this.startFetchSuggestionsTimer()
        this.setState({editorState});
    }
    this.customKeyBindings = this.customKeyBindings.bind(this);
    this.handleCustomKeyCommand = this.handleCustomKeyCommand.bind(this);
    this.splitCurrentBlock = this.splitCurrentBlock.bind(this);
    this.blockStyleFn = this.myBlockStyleFn.bind(this);
    this.fetchSuggestionsTimer = this.fetchSuggestionsTimer.bind(this);
    this.startFetchSuggestionsTimer = this.startFetchSuggestionsTimer.bind(this);
    this.insertSuggestion = this.insertSuggestion.bind(this);
    this.onTab = this.onTab.bind(this);
  }

  getTextFromCurrentContentBlock() {
    const editorState = this.state.editorState;
    const selectionState = editorState.getSelection();
    // Get Key of currently selected content block
    const anchorKey = selectionState.getAnchorKey();
    // Get current contentState of Editor
    const currentContent = editorState.getCurrentContent();
    // Get Selected Content Block based off Anchor (Start of selection)
    const currentContentBlock = currentContent.getBlockForKey(anchorKey);
    // Get Current Text from selected block
    console.log("TCL: MyEditor -> getTextFromCurrentContentBlock -> currentContentBlock.getText()", currentContentBlock.getText());
    return currentContentBlock.getText();
  }

  splitCurrentBlock ({editorState}) {
    // Get Current Draft JS States
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();

    // Add full stop
    let newContentState = Modifier.insertText(contentState, selectionState, ".");
    const newEditorStateWithCharacters = EditorState.push(editorState, newContentState, 'insert-characters');
    
    // Split the content block so the next sentence is in a new content block.
    const contentStateWithNewBlock = Modifier.splitBlock(newEditorStateWithCharacters.getCurrentContent(), newEditorStateWithCharacters.getSelection());
    const newEditorStateWithNewBlock = EditorState.push(
      newEditorStateWithCharacters,
      contentStateWithNewBlock, 'split-block');

    // Set the state.
    this.setState({editorState: newEditorStateWithNewBlock});
  }



  insertSuggestion () {
    // // Broken Custom Block
    // const suggestionContentBlock = new ContentBlock({
    //   key: genKey(),
    //   type: 'SuggestionBlock'
    // })

    // const contentState = this.state.editorState.getCurrentContent();
    // const newBlockMap = contentState.getBlockMap().set(suggestionContentBlock.key, suggestionContentBlock);
    // const newEditorStateWithCharacters = EditorState.push(this.state.editorState, ContentState.createFromBlockArray(newBlockMap.toArray()).set('selectionBefore', contentState.getSelectionBefore())
    // .set('selectionAfter', contentState.getSelectionAfter()));

    // // const selectionState = this.state.editorState.getSelection();
    // // let newContentState = Modifier.insertText(contentState, selectionState, this.props.suggestion);
    // // const newEditorStateWithCharacters = EditorState.push(this.state.editorState, newContentState, 'insert-characters');
  
    // this.setState({editorState: newEditorStateWithCharacters});
    const newEditorStateWithChracters = insertSuggestionBlock(this.state.editorState);
    this.setState({editorState: newEditorStateWithChracters});
  }

  myBlockStyleFn(contentBlock) {
    const type = contentBlock.getType();
    if (type === 'unstyled') {
      return 'superFancyBlockquote';
    }
  }

  customKeyBindings(e) {
    if (e.keyCode === 190) {
      return 'full-stop';
    }
    return getDefaultKeyBinding(e);
  }

  onTab() {
    this.insertSuggestion();
  }

  handleCustomKeyCommand(command){
    if (command === 'full-stop') {
      this.splitCurrentBlock(this.state);
      return 'handled';
    }
    return 'not-handled';
  }

  fetchSuggestionsTimer() {
    const fetchSuggestionsClosure = (() => () => {
        if (this.getTextFromCurrentContentBlock()) {
            this.props.fetchSuggestions(this.getTextFromCurrentContentBlock(),
                                        this.state.suggestionBaseURL, this.state.token);
        }
    })();
    return setTimeout(fetchSuggestionsClosure, 200);
}

startFetchSuggestionsTimer() {
    if (this.state.fetchSuggestionsTimer) {
        clearTimeout(this.state.fetchSuggestionsTimer);
    }
    this.setState({
        fetchSuggestionsTimer: this.fetchSuggestionsTimer()
    });
}

  render() {
    return (
      <Editor
          editorState={this.state.editorState}
          handleKeyCommand={this.handleCustomKeyCommand}
          keyBindingFn={this.customKeyBindings}
          onChange={this.onChange}
          onBlur={() => this.domEditor.focus()}
          onTab={this.onTab}
          ref={this.setDomEditorRef}
          blockStyleFn={this.myBlockStyleFn}
          blockRendererFn={blockRenderMap}/>

    );
  }
}