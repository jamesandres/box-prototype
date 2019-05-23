import React from 'react';
import PropTypes from 'prop-types';
import ContentEditable from 'react-contenteditable';
import striptags from 'striptags';


class Main extends React.Component {
    constructor() {
        super();
        this.state = {
            editableNode: null,
            fetchSuggestionsTimer: null,
            token: "9xV8UIMGgocZ7AYz9r53EVoY86fLXeUSK9GjeMvkT2Zg0UaY8A89aAywA4U6WN9hcxlJB4wv7agMCRZgMut5GVVE4rN2Ajp5A2Qex22dQdQIgoNG1PAJdzY9O8WXOAsE5mb5oh4TxzrsXpqSf93028nYjHFP"
        };
    }

    componentDidUpdate(prevProps) {
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
        }
    }

    fetchSuggestionsTimer() {
        const fetchSuggestionsClosure = (() => () => {
            if (this.props.text) {
                this.props.fetchSuggestions(this.props.text, this.state.token);
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

    getCurrentRange() {
        this.getCaretCharacterOffsetWithin(); // JUST DEBUGGING
        // this returns 0,0 when the user has just accepted a suggestion.
        if (window.getSelection()) {
            try {
                return window.getSelection().getRangeAt(0);
            } catch (IndexSizeError) {
                return;
            }
        }
    }

    // DEBUGGING AN IDEA
    getCaretCharacterOffsetWithin() {
        const element = this.state.editableNode;

        // See: https://stackoverflow.com/a/4812022/806988
        var caretOffset = 0;
        var doc = element.ownerDocument || element.document;
        var win = doc.defaultView || doc.parentWindow;
        var sel;
        if (typeof win.getSelection != "undefined") {
            sel = win.getSelection();
            if (sel.rangeCount > 0) {
                var range = win.getSelection().getRangeAt(0);
                var preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                caretOffset = preCaretRange.toString().length;
            }
        } else if ( (sel = doc.selection) && sel.type != "Control") {
            var textRange = sel.createRange();
            var preCaretTextRange = doc.body.createTextRange();
            preCaretTextRange.moveToElementText(element);
            preCaretTextRange.setEndPoint("EndToEnd", textRange);
            caretOffset = preCaretTextRange.text.length;
        }
        console.log('getCaretCharacterOffsetWithin, caretOffset:', caretOffset);
        return caretOffset;
    }

    textChange(e) {
        // TODO: ugh. probably render this in the shadow DOM and remove this particular node?
        console.log('textChange, e.target.value:', e.target.value);
        let newText = e.target.value.split('<span contenteditable=')[0];
        newText = striptags(newText);
        if (newText !== this.props.text) {
            this.selectionChange() // Also update state with new cursor position
            this.props.updateText(newText);
        }
    }

    selectionChange(e) {
        const { startOffset, endOffset } = this.getCurrentRange();
        this.props.updateSelection(startOffset, endOffset);
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

        const postfixLength = acceptedPostfix.length;

        const newText = `${this.props.text}${acceptedPostfix}`;
        let { startOffset, endOffset } = this.getCurrentRange();

        this.props.updateText(newText);
        this.props.updateSelection(startOffset + postfixLength, endOffset + postfixLength);
    }

    render() {
        // TODO: Figure out why text was wrapped in a <span>?
        const html = `<span>${this.props.text || ''}</span><span contenteditable="false" class="postfix">${this.props.postfix || ''}</span>`;
        return (
            <div>
                <ContentEditable
                    onChange={ (e) => this.textChange(e) }
                    onSelect={ (e) => this.selectionChange(e) }
                    onKeyDown={ (e) => {
                        const arrowKeysAndESC = [27, 37, 38, 39, 40];
                        const tabKeyAndReturn = [9, 13];
                        if (!arrowKeysAndESC.includes(e.keyCode)) {
                            this.startFetchSuggestionsTimer();
                            if (tabKeyAndReturn.includes(e.keyCode)) {
                                this.acceptOption(e);
                                e.preventDefault();
                            }
                            this.props.clearPostfix();
                        }
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
    updateSelection: PropTypes.func.isRequired,
    fetchSuggestions: PropTypes.func.isRequired
};

export default Main;
