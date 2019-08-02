import React from 'react';
import PropTypes from 'prop-types';
import {Editor, DefaultDraftBlockRenderMap, getDefaultKeyBinding} from 'draft-js';
const Immutable = require('immutable');


class SuggestionBlock extends React.Component {
    render() {
        debugger;
        const style = {
            color: 'grey'
        };
        return (
            <span className='SuggestionBlock'
                  style={style}
                  contentEditable={false}
                  readOnly>{this.props.block.text}</span>
        );
    }
}


const styleMap = {
    SUGGESTION: {
        color: 'grey',
    },
};


export default class MyEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {fetchSuggestionsTimer: null,
                      token: 'E5ETWgqwbb7dUxXGnd3XMIaucBLIH3GDWIbEopqnXfNf+2VrQACXD4cQ8z0IXeD8VXopaFzrlE5rumqFUPEWvAfYOwQbSkxfLOxDkTXKQqUTm1IsQk6Ukby4oIEspGyxwvOlVtsaS58iizT7rp6x/4QR+3PE',
                      suggestionBaseURL: 'http://localhost:8010'};
    }

    onChange(editorState) {
        const fetchSuggestionsTimer = this.fetchSuggestionsTimer();
        this.setState({fetchSuggestionsTimer});
        this.props.editorChanged(editorState);
    }

    // Idea 1: After stop typing for a short while fetch the suggestion.
    fetchSuggestionsTimer() {
        if (this.state.fetchSuggestionsTimer) {
            clearTimeout(this.state.fetchSuggestionsTimer);
        }
        const fetchSuggestionsClosure = (() => () => {
            const text = this.currentBlockText();
            if (text) {
                this.props.fetchSuggestions(text, this.state.suggestionBaseURL, this.state.token);
            }
        })();
        return setTimeout(fetchSuggestionsClosure, 200);
    }

    currentBlockText() {
        // TODO: Surely there is an easier way?
        const editorState = this.props.editorState;
        const selectionState = editorState.getSelection();
        const anchorKey = selectionState.getAnchorKey();
        const currentContent = editorState.getCurrentContent();
        const currentContentBlock = currentContent.getBlockForKey(anchorKey);
        return currentContentBlock.getText();
    }

    blockRendererFn(block) {
        if (block.getType() === 'atomic') {
            return {
                component: SuggestionBlock
            };
        }
        return null;
    }

    myKeyBindingFn(e) {
        this.props.clearSuggestion()
        return getDefaultKeyBinding(e);
    }

    onTab(e) {
        if (this.props.acceptSuggestion()) {
            e.preventDefault();
        }
    }

    render() {
        return <Editor editorState={this.props.editorState}
                       onChange={(editorState) => this.onChange(editorState)}
                       stripPastedStyles={true}
                       customStyleMap={styleMap}
                       blockRendererFn={this.blockRendererFn}
                       keyBindingFn={(e) => this.myKeyBindingFn(e)}
                       onTab={(e) => this.onTab(e)}/>;
    }
}

MyEditor.propTypes = {
    editorState: PropTypes.object,
    fetchSuggestions: PropTypes.func.isRequired,
    clearSuggestion: PropTypes.func.isRequired
};
