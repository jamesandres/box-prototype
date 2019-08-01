import React from 'react';
import {Editor, EditorState, getDefaultKeyBinding, Modifier } from 'draft-js';


export default class AutoComplete extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: EditorState.createEmpty(),
            fetchSuggestionsTimer: null,
            token: "+s/7D5OkViG8N8FpPADN67NK5LD1qxpJFpEhjjqc1/v8/yrOFiYSslRSdxmLEu0tOuVSWV6tCZxw05C1J/KA3tyU0U5JSZHxYjMkvIpUJLhKD98AMUTyaR9SC7FdXc25eSieiTIrrG42Mhwjrey9mu4O+IvE",
            suggestionBaseURL: 'http://localhost:8010'
        };

        this.setDomEditorRef = ref => this.domEditor = ref;
        this.onChange = (editorState) => {
            this.startFetchSuggestionsTimer()
            this.setState({editorState});
        };

        this.getTextFromCurrentContentBlock = () => {
            const editorState = this.state.editorState;
            const selectionState = editorState.getSelection();
            // Get Key of currently selected content block
            const anchorKey = selectionState.getAnchorKey();
            // Get current contentState of Editor
            const currentContent = editorState.getCurrentContent();
            // Get Selected Content Block based off Anchor (Start of selection)
            const currentContentBlock = currentContent.getBlockForKey(anchorKey);
            // Get Current Text from selected block
            return currentContentBlock.getText();
        }

        this.fetchSuggestionsTimer = () => {
            const fetchSuggestionsClosure = (() => () => {
                if (this.getTextFromCurrentContentBlock()) {
                    this.props.fetchSuggestions(this.getTextFromCurrentContentBlock(),
                                                this.state.suggestionBaseURL, this.state.token);
                }
            })();
            return setTimeout(fetchSuggestionsClosure, 200);
        }
        
        this.startFetchSuggestionsTimer = () => {
            if (this.state.fetchSuggestionsTimer) {
                clearTimeout(this.state.fetchSuggestionsTimer);
            }
            this.setState({
                fetchSuggestionsTimer: this.fetchSuggestionsTimer()
            });
        }
    }
    render() {
        return (
            <Editor
                editorState={this.state.editorState}
                onChange={this.onChange}
                onBlur={() => this.domEditor.focus()}
                ref={this.setDomEditorRef}/>
        );
    }
}