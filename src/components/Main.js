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
            token: "TPH07EcYxh2SuzjTujMO63L2QCW6QpDH9A6rRWlFqyhxfphL63pwS+2KAsKNeiVFQjdUS6r9SG6vSDUXC4XIUnOX7Z2J5TP17b70CJtl8ZM2o0JpQRCxm8RJ2xfFOJh1Atb/Pm6C+R96oup9p7xE+q2hej2C"
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
        if (this.state.editableNode) {
            const endOfText = this.state.editableNode.length;
            if (window.getSelection()) {
                const range = window.getSelection().getRangeAt(0);
                // This is still quite shonky but does get Ctrl+A working, and arrow keys mostly
                // working.
                //
                // The situation with Ctrl+A ended up being as follows. Let's assume the following
                // DOM structure:
                //     - <div>
                //       - text: "thanks"
                //       - <span>
                //         - text: " for getting in touch"
                // Ctrl+A ended up creating this range:
                //     {startContainer: div.childNodes[0],
                //      startOffset: 0,
                //      endContainer: div
                //      endOffset: 2}
                // The start seems sensible, but the end seems fairly odd. However if you consider that
                // endOffset in the context of a div is counting the number of inner nodes it does make
                // some sense.
                //
                // The shonky solution here is to assume that any start or end which is not on the
                // initial text node must be "after" the starting text node, hence snapping that
                // boundary to the end of the text node is reasonable.
                //
                // see: https://dom.spec.whatwg.org/#ranges
                let startOffset = range.startContainer == this.state.editableNode.firstChild
                                  ? range.startOffset
                                  : endOfText,
                    endOffset = range.endContainer == this.state.editableNode.firstChild
                                  ? range.endOffset
                                  : endOfText;
                return [startOffset, endOffset]
            } else {
                return [endOfText, endOfText]; // If unsure put caret at end
            }
        }
        return [0, 0]; // Just return something sensible
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
        const [ startOffset, endOffset ] = this.getCurrentRange();
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
        let [ startOffset, endOffset ] = this.getCurrentRange();

        this.props.updateText(newText);
        this.props.updateSelection(startOffset + postfixLength, endOffset + postfixLength);
    }

    render() {
        // const html = `${this.props.text || ''}`;
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
