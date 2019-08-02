import React from 'react';
import PropTypes from 'prop-types';
import {Editor, DefaultDraftBlockRenderMap} from 'draft-js';
const Immutable = require('immutable');


class SuggestionBlock extends React.Component {
    render() {
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


const blockRenderMap = Immutable.Map({
    'suggestion': {
        element: 'span',
        editable: false,
    }
});

// keep support for other draft default block types and add our myCustomBlock type
const extendedBlockRenderMap = DefaultDraftBlockRenderMap.merge(blockRenderMap);


export default class MyEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {fetchSuggestionsTimer: null,
                      token: "yNGHRIWWxYcAk2aCb8+3nyk/h5+XZAyXldIPL9haknQMsmaaIl/AUZFWX5mhW82ikzoaXJ4nv9icP9w5ns0k4bk6R/j6cNHkb5TTQ+kLfnG6DYOtcwdgXVcZh+0b6tb/qfmVeZStsrMHNFhAWjoyLx2fvzgl",
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
        if (block.getType() === 'suggestion') {
            return {
                component: SuggestionBlock
            };
        }
        return null;
    }

    render() {
        return <Editor editorState={this.props.editorState}
                       onChange={(editorState) => this.onChange(editorState)}
                       stripPastedStyles={true}
                       blockRenderMap={extendedBlockRenderMap}
                       blockRendererFn={this.blockRendererFn} />;
    }
}

MyEditor.propTypes = {
    editorState: PropTypes.object,
    fetchSuggestions: PropTypes.func.isRequired,
    clearSuggestion: PropTypes.func.isRequired
};
