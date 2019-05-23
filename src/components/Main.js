import React from 'react';
import PropTypes from 'prop-types';
import ContentEditable from 'react-contenteditable';
import striptags from 'striptags';


class Main extends React.Component {
    constructor() {
        console.log("constructor");
        super();
        this.state = {
            editableNode: null,
            fetchSuggestionsTimer: null,
            token: "9xV8UIMGgocZ7AYz9r53EVoY86fLXeUSK9GjeMvkT2Zg0UaY8A89aAywA4U6WN9hcxlJB4wv7agMCRZgMut5GVVE4rN2Ajp5A2Qex22dQdQIgoNG1PAJdzY9O8WXOAsE5mb5oh4TxzrsXpqSf93028nYjHFP"
        };
    }

    componentDidMount() {
        console.log("componentDidMount");
        this.resetFetchSuggestionsTimer();
    }

    componentDidUpdate(prevProps) {
        console.log("componentDidUpdate");
        let selection = window.getSelection();
        if (selection) {
            if (this.state.editableNode.firstChild) {
                let currentStartOffset, currentEndOffset;
                const currentRange = this.getCurrentRange();
                if (!currentRange) {
                    return;
                }

                currentStartOffset = currentRange.startOffset;
                currentEndOffset = currentRange.endOffset;

                if (this.props.startOffset !== currentStartOffset || this.props.endOffset !== currentEndOffset) {
                    console.log("  componentDidUpdate, updating startOffset:", this.props.startOffset, "; endOffset:", this.props.endOffset);
                    const range = document.createRange();
                    // oh no. editableNode.firstChild.firstChild doesn't exist on initial load but we do need to set the carat to the beginning of the
                    // box anyway.
                    const nodeToAlter = this.state.editableNode.firstChild.firstChild ? this.state.editableNode.firstChild.firstChild : this.state.editableNode.firstChild;
                    range.setStart(nodeToAlter, this.props.startOffset);
                    range.setEnd(nodeToAlter, this.props.endOffset);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        } else {
            console.log("  componentDidUpdate: no selection");
        }
    }

    fetchSuggestionsTimer() {
        let fetchSuggestionsClosure = (() => () => {
            if (this.props.text) {
                this.props.fetchSuggestions(this.props.text, this.state.token);
            }
        })();
        return setTimeout(fetchSuggestionsClosure, 200);
    }

    resetFetchSuggestionsTimer() {
        if (this.state.fetchSuggestionsTimer) {
            clearTimeout(this.state.fetchSuggestionsTimer);
        }
        this.setState({
            fetchSuggestionsTimer: this.fetchSuggestionsTimer()
        });
    }

    getCurrentRange() {
        // this returns 0,0 when the user has just accepted a suggestion.
        if (window.getSelection()) {
            try {
                return window.getSelection().getRangeAt(0);
            } catch (IndexSizeError) {
                return;
            }
        }
    }

    textChange(e) {
        // TODO: ugh. probably render this in the shadow DOM and remove this particular node?
        let textContent = e.target.value.split(' <span contenteditable=')[0];
        console.log("pre striptags: ", JSON.stringify(textContent));
        textContent = striptags(textContent);
        console.log("post striptags: ", JSON.stringify(textContent));

        const { startOffset, endOffset } = this.getCurrentRange();
        console.log("startOffset:", startOffset, ", endOffset:", endOffset);
        this.props.updateText(textContent, startOffset, endOffset);
    }

    selectionChange(e) {
        const { startOffset, endOffset } = this.getCurrentRange();
        this.props.updateText(this.props.text, startOffset, endOffset);
    }

    saveEditableNode(node) {
        if (!this.state.editableNode) {
            this.setState({
                editableNode: node
            });
        }
    }

    acceptOption(e) {
        const acceptedPostfix = this.props.postfix;
        if (!acceptedPostfix) {
            return;
        }

        console.log('acceptOption')

        const postfixLength = acceptedPostfix.length;

        const text = `${this.props.text}${acceptedPostfix}`;
        let { startOffset, endOffset } = this.getCurrentRange();

        startOffset = startOffset + postfixLength;
        endOffset = endOffset + postfixLength;

        this.props.updateText(text, startOffset, endOffset);
    }

    render() {
        const html = `<span>${this.props.text || ''}</span><span contenteditable="false" class="postfix">${this.props.postfix || ''}</span>`;
        return (
            <div>
                <ContentEditable
                    onChange={ (e) => this.textChange(e) }
                    onSelect={ (e) => this.selectionChange(e) }
                    onKeyDown={ (e) => {
                        this.resetFetchSuggestionsTimer();
                        if ([13, 9].includes(e.keyCode)) {
                            this.acceptOption(e);
                            e.preventDefault();
                        }
                        this.props.clearPostfix();
                    }}
                    html={html}
                    innerRef={ (ref) => this.saveEditableNode(ref) }
                />
                <hr />
                <p>
                    <label>Token:</label>
                    <input type="text"
                           value={this.state.token}
                           onChange={ (e) => this.setState({"token": e.value}) } />
                </p>
            </div>
        );
    }
}

Main.propTypes = {
    text: PropTypes.string.isRequired,
    postfix: PropTypes.string,
    startOffset: PropTypes.number,
    endOffset: PropTypes.number,
    updateText: PropTypes.func.isRequired,
    fetchSuggestions: PropTypes.func.isRequired
};

export default Main;
