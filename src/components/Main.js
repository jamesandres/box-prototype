import React from 'react';
import PropTypes from 'prop-types';
import ContentEditable from 'react-contenteditable';
import striptags from 'striptags';


class Main extends React.Component {
    constructor() {
        super();
        this.state = {
            editableNode: null,
            fetchSuggestionsTimer: null
        };
    }

    // componentDidUpdate
    // ~~~~~~~~~~~~~~~~~~
    // Invoked whenever the component has a state change.  The componentDidUpdate is particularly
    // useful when an operation needs to happen after the DOM is updated and the update queue is
    // emptied. It's probably most useful on complex renders and state or DOM changes or when you
    // need something to be the absolutely last thing to be executed.
    componentDidUpdate(prevProps) {
        // FIXME: Our cursor positioning code is full of holes. We should try to stick to the
        //        underlying code provided by react-contenteditable
        //        https://github.com/lovasoa/react-contenteditable/blob/master/src/react-contenteditable.tsx#L99
        const nodeToAlter = this.state.editableNode.firstChild;
        if (!nodeToAlter) {
            return;
        }
        // if (this.props.startOffset !== currentStartOffset || this.props.endOffset !== currentEndOffset) {
            let selection = window.getSelection();
            const range = document.createRange();
            range.setStart(nodeToAlter, this.props.startOffset);
            range.setEnd(nodeToAlter, this.props.endOffset);
            selection.removeAllRanges();
            selection.addRange(range);
        // }
    }

    componentDidMount() {
        this.props.fetchToken();
    }

    fetchSuggestionsTimer() {
        const fetchSuggestionsClosure = (() => () => {
            if (this.props.text) {
                this.props.fetchSuggestions(this.props.text, this.props.token);
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
        let newText = e.target.value;
        // TODO: ugh. probably render this in the shadow DOM and remove this particular node?
        newText = newText.split('<span contenteditable=')[0];
        // newText = newText.replace('<br>', '\n');
        // newText = striptags(newText);
        if (newText !== this.props.text) {
            this.selectionChange() // Also update state with new cursor position
            this.props.updateText(newText);
        }
    }

    selectionChange(e) {
        const { startOffset, endOffset } = this.getCurrentRange();
        console.log('selectionChange', startOffset, endOffset)
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
        const html = `${this.props.text || ''}<span contenteditable="false" class="postfix">${this.props.postfix || ''}</span>`;
        return (
            <div>
                <ContentEditable
                    onChange={ (e) => this.textChange(e) }
                    onSelect={ (e) => this.selectionChange(e) }
                    onKeyDown={ (e) => {
                        const arrowKeysESCAndReturn = [27, 37, 38, 39, 40, 13];
                        const tabKey = [9];
                        const altCtrlMeta = e.altKey || e.ctrlKey || e.metaKey;
                        console.log('onKeyDown', {'e.keyCode': e.keyCode,
                                                  'chr(e.keyCode)': String.fromCharCode(e.keyCode),
                                                  'arrowKeysESCAndReturn': arrowKeysESCAndReturn,
                                                  'tabKey': tabKey,
                                                  'altCtrlMeta': altCtrlMeta})
                        if (arrowKeysESCAndReturn.includes(e.keyCode) || altCtrlMeta) {
                            return true;
                        }
                        this.startFetchSuggestionsTimer();
                        if (tabKey.includes(e.keyCode)) {
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
                           value={this.props.token} />
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
