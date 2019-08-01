import React from 'react';
import {Editor, EditorState, RichUtils, getDefaultKeyBinding, KeyBindingUtil, SelectionState, Modifier} from 'draft-js';
import { OrderedSet } from 'immutable'
import 'draft-js/dist/Draft.css'
const {hasCommandModifier} = KeyBindingUtil;

// const HANDLE_REGEX = /@[\w]+/g;
// const HASHTAG_REGEX = /#[\w\u0590-\u05ff]+/g;
// function handleStrategy(contentBlock, callback, contentState) {
//   findWithRegex(HANDLE_REGEX, contentBlock, callback);
// }
// function hashtagStrategy(contentBlock, callback, contentState) {
//   findWithRegex(HASHTAG_REGEX, contentBlock, callback);
// }
// function findWithRegex(regex, contentBlock, callback) {
//   const text = contentBlock.getText();
//   let matchArr, start;
//   while ((matchArr = regex.exec(text)) !== null) {
//     start = matchArr.index;
//     callback(start, start + matchArr[0].length);
//   }
// }

// const HandleSpan = (props) => {
//   return (
//     <span
//       style={styles.handle}
//       data-offset-key={props.offsetKey}
//     >
//       {props.children}
//     </span>
//   );
// };
// const HashtagSpan = (props) => {
//   return (
//     <span
//       style={styles.hashtag}
//       data-offset-key={props.offsetKey}
//     >
//       {props.children}
//     </span>
//   );
// };

class MyEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      fetchSuggestionsTimer: null,
      token: "gdtxaMGvTVsE7Zd0ZDi58DqVO/HtNscob5cpgzsUBjsUUIQQD5Ka1sshHsWnhwxQ4lYq3kGe7sMxU117/scm7bc4/DPpSWCMSJVUGlHSxDqNMSQ9bCrpR21VdLpZpew73Su+iXDd0XHIISQdYycy4VGedST6",
      suggestion: null,
      suggestionBaseURL: 'http://localhost:8010',
      suggestionStartPosn: null,
      suggestionEndPosn: null
    };
    this.onChange = (editorState) => {
      this.setState({editorState});
      this.textChange();
      this.startFetchSuggestionsTimer();
      // this.test();
    };
    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.keyBindingFn = this._keyBindingFn.bind(this);
    this._insertSuggestion = this._insertSuggestion.bind(this);
    this._focusCursorToLastPosn = this._focusCursorToLastPosn.bind(this);
    this.setEditor = (editor) => {
      this.editor = editor;
    };
    this.focusEditor = () => {
      if (this.editor) {
        this.editor.focus();
      }
    };
    // this.onBlur = () => {
    //   this.focusEditor();
    // }
  }

  componentDidMount() {
    this.focusEditor();
  }

  componentDidUpdate(prevProps) {
    if (this.props.suggestion !== prevProps.suggestion) {
      console.log("this.props.suggestion", this.props.suggestion);
      console.log("prevProps.suggestion", prevProps.suggestion);
      this._insertSuggestion();
    }
  }

  // test() {
  //   var editorState = this.state.editorState;
  //   var selectionState = editorState.getSelection();
  //   var anchorKey = selectionState.getAnchorKey();
  //   var currentContent = editorState.getCurrentContent();
  //   var currentContentBlock = currentContent.getBlockForKey(anchorKey);
  //   var start = selectionState.getStartOffset();
  //   var end = selectionState.getEndOffset();
  //   var selectedText = currentContentBlock.getText().slice(start, end);
  // }

  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    if (command === 'myeditor-tab') {
      this._acceptOption();
      console.log('tab clicked');
      return 'handled';
    }
    if (command === 'myeditor-esc') {
      this.props.clearSuggestion();
      this.clearSuggestion();
      // this._focusCursorToLastPosn();
      console.log('esc clicked');
      return 'handled';
    }
    if (command === 'myeditor-a') {
      this.props.clearSuggestion();
      this.clearSuggestion();
      this.selectAll(); // TBC
      return 'handled';
    }
    console.log('not-handled');
    return 'not-handled';
  };

  _keyBindingFn(e: SyntheticKeyboardEvent): string {
    switch (e.keyCode) {
      case 9: /* TAB */
        e.preventDefault();
        return 'myeditor-tab';
      case 27: /* ESC */
        return 'myeditor-esc';
      case 65 /* A */:
        if (hasCommandModifier(e)) {
          return 'myeditor-a';
        }
        break;
      default:
        return getDefaultKeyBinding(e);
    }
  }

  _focusCursorToLastPosn() {
    console.log("_focusCursorToLastPosn");
    if (this.props.suggestion === this.state.suggestion) {
      console.log("EQUAL2");
      return;
    }
    const {editorState} = this.state;
    // To get the last selection state, either 
    // (1) Set SelectionState manually, or
    // const selection = editorState.getSelection()
    // const anchorKey = selection.getAnchorKey();
    // var lastSelection = SelectionState.createEmpty(anchorKey).set('anchorOffset', suggestionStartPosn);
    // lastSelection = lastSelection.set('focusOffset', suggestionStartPosn);
    // this.setState({editorState: EditorState.acceptSelection(editorState, lastSelection)});
    // console.log("editorState: ", this.state.editorState.getCurrentContent());

    // (2) Get the last selection using getSelectionBefore()
    const contentState = this.state.editorState.getCurrentContent();
    const selectionBefore = contentState.getSelectionBefore();
    const ncs = Modifier.replaceText(contentState, selectionBefore, ''); 
    const es = EditorState.push(editorState, ncs, 'insert-characters');
    this.setState({editorState: es});

  }

  async _insertSuggestion() {
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    console.log("this.props.suggestion", this.props.suggestion);
    console.log("this.state.suggestion", this.state.suggestion);
    if (this.props.suggestion === this.state.suggestion) {
      console.log("EQUAL");
      return;
    }

    const {editorState} = this.state;
    const selection = editorState.getSelection()
    const contentState = editorState.getCurrentContent();
    const anchorKey = editorState.getSelection().getAnchorKey();
    const anchorOffset = editorState.getSelection().getAnchorOffset();
    this.setState({suggestionStartPosn: anchorOffset});
    console.log("Suggestion start position set to: ", this.state.suggestionStartPosn);
    

    let ncs = Modifier.insertText(contentState, selection, this.props.suggestion, OrderedSet.of('SUGGESTION'));
    let es = EditorState.push(editorState, ncs, 'insert-fragment');
    this.setState({editorState: es});

    const currentBlock = es.getCurrentContent().getBlockForKey(anchorKey);
    const blockLength = currentBlock.getLength();
    this.setState({suggestionEndPosn: blockLength});
    console.log("Suggestion end position set to: ", this.state.suggestionEndPosn);

    await sleep(0);
    this._focusCursorToLastPosn();

    if (this.props.suggestion) {
      this.state.suggestion = this.props.suggestion;
    }
  }

  _insertText() {
    if (this.props.suggestion) {
      console.log("_insertText");
      const {editorState, suggestionStartPosn, suggestionEndPosn} = this.state;
      // const selection = editorState.getSelection();
      const contentState = editorState.getCurrentContent();
      // var startKey = editorState.getSelection().getStartKey();
      // console.log("startKey", startKey);
      // var startOffset = editorState.getSelection().getStartOffset();
      // console.log("startOffset", startOffset);
      // var endKey = editorState.getSelection().getEndKey();
      // console.log("endKey", endKey);
      // var endOffset = editorState.getSelection().getEndOffset();
      // console.log("endOffset", endOffset);
      const anchorKey = editorState.getSelection().getAnchorKey();
      console.log("anchorKey", anchorKey);
      // // var anchorOffset = editorState.getSelection().getAnchorOffset();
      // // console.log("anchorOffset", anchorOffset);
      // var focusKey = editorState.getSelection().getFocusKey();
      // console.log("focusKey", focusKey);
      // var focusOffset = editorState.getSelection().getFocusOffset();
      // console.log("focusOffset", focusOffset);

      var selectionWithOffset = SelectionState.createEmpty(anchorKey).set('anchorOffset', suggestionStartPosn);
      selectionWithOffset = selectionWithOffset.set('focusOffset', suggestionEndPosn);

      // const ncs = Modifier.insertText(contentState, selection, this.props.suggestion);
      // const es = EditorState.push(editorState, ncs, 'insert-fragment');

      // const ncs = Modifier.removeInlineStyle(contentState, selectionWithOffset, OrderedSet.of('SUGGESTION'));
      // const contentWithoutStyles = (OrderedSet.of('SUGGESTION')).reduce((OrderedSet.of('SUGGESTION')), (newContentState, style) => {
      //   Modifier.removeInlineStyle(
      //     newContentState,
      //     selectionWithOffset,
      //     style
      //   )
      // }, contentState);
      // const es = EditorState.push(editorState, contentWithoutStyles, 'change-inline-style');

      var newContentState = Modifier.replaceText(contentState, selectionWithOffset, this.props.suggestion);
      var es = EditorState.push(editorState, newContentState, 'insert-characters');
      this.setState({editorState: es});

      // var newContentState = Modifier.replaceText(contentState, selectionWithOffset, '');
      // var es = EditorState.push(editorState, newContentState)
      // const newContentState = Modifier.removeRange(contentState, selection, 'backward');
      // const es = EditorState.push(editorState, newContentState, 'remove-range');
      // this.setState({editorState: es});
      // this.setState({suggestionStartPosn: suggestionEndPosn});
      // this._focusCursorToLastPosn();
    }
  }

  _acceptOption() {
    if (!this.props.suggestion) {
      return;
    }
    this._insertText();
  }

  textChange() {
    console.log("textChange");
    if (this.props.suggestion) {
      this.props.clearSuggestion();
      this.clearSuggestion();
    }
    const {editorState} = this.state;
    // const newText = removeSuggestionsSpan(
    //   editorState.getCurrentContent().getPlainText());
    const newText = editorState.getCurrentContent().getPlainText();
    if (newText !== this.props.text) {
      this.props.updateText(newText);
      console.log("this.props.text: ", this.props.text);
    }
  }

  clearSuggestion() {
    console.log("clearSuggestion");
    if (!this.props.suggestion) {
      return;
    }
    const {editorState, suggestionStartPosn, suggestionEndPosn} = this.state;
    console.log(suggestionStartPosn, suggestionEndPosn);
    const contentState = editorState.getCurrentContent();
    const anchorKey = editorState.getSelection().getAnchorKey();
    var selectionWithOffset = SelectionState.createEmpty(anchorKey).set('anchorOffset', suggestionStartPosn);
    selectionWithOffset = selectionWithOffset.set('focusOffset', suggestionEndPosn);
    var newContentState = Modifier.replaceText(contentState, selectionWithOffset, '');
    var es = EditorState.push(editorState, newContentState, 'insert-characters');
    
    // Poor alternative:
    // const es = EditorState.undo(this.state.editorState);
    this.setState({editorState: es});
  }

  selectAll() {
    // TBC...
  }

  fetchSuggestionsTimer() {
    const fetchSuggestionsClosure = (() => () => {
      if (this.props.text) {
        this.props.fetchSuggestions(
          this.state.editorState.getCurrentContent().getPlainText(),
          this.state.suggestionBaseURL, 
          this.state.token
        );
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
      <div style={styles.editor} onClick={this.focusEditor}>
        <p style={styles.noselect}>Unselectable text.</p> 
        <button onClick={this._insertText.bind(this)}>Insert Text</button>       
        <Editor
          ref={this.setEditor}
          customStyleMap={styleMap}          
          editorState={this.state.editorState}
          handleKeyCommand={this.handleKeyCommand}
          // onBlur={this.onBlur}
          onChange={this.onChange}
          keyBindingFn={this.keyBindingFn}
          textAlignment="left"
          textDirectionality="LTR"
          handlePastedText={this.handlePastedText}
          placeholder="Enter some text..."
          autoCapitalize="true"
          autoComplete="true"
          autoCorrect="true"
          spellCheck={true}
        />
      </div>
    );
  }
}

const styleMap = {
  'STRIKETHROUGH': {
    textDecoration: 'line-through',
  },
  'SUGGESTION': {
    color: '#757575',
    // WebkitTouchCallout: 'none', /* iOS Safari */
    // WebkitUserSelect: 'none', /* Safari */
    // WebkitUserModify: 'read-only',
    // KhtmlUserSelect: 'none', /* Konqueror HTML */
    // MozUserSelect: 'none', /* Firefox */
    // msUserSelect: 'none', /* Internet Explorer/Edge */
    // userSelect: 'none' /* Non-prefixed version, currently
    //                       supported by Chrome and Opera */
  },
};

const styles = {
  editor: {
    border: '1px solid #ddd',
    cursor: 'text',
    fontSize: 16,
    minHeight: 40,
    padding: 10,
  },
  handle: {
    color: 'rgba(98, 177, 254, 1.0)',
    direction: 'ltr',
    unicodeBidi: 'bidi-override',
  },
  hashtag: {
    color: 'rgba(95, 184, 138, 1.0)',
  },
  superFancyBlockquote: {
    color: '#999',
    fontFamily: 'Hoefler Text, Georgia, serif',
    fontStyle: 'italic',
    textAlign: 'center'
  },
  noselect: {
    WebkitTouchCallout: 'none', /* iOS Safari */
    WebkitUserSelect: 'none', /* Safari */
    KhtmlUserSelect: 'none', /* Konqueror HTML */
    MozUserSelect: 'none', /* Firefox */
    msUserSelect: 'none', /* Internet Explorer/Edge */
    userSelect: 'none' /* Non-prefixed version, currently
                          supported by Chrome and Opera */
  }
};

export default MyEditor;
