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
            token: "yFZT20WxylFVEVj5S25scpOhTfERJVunGyUcll4Ap0wwmBrJTOYS7Amd04bWK/8qfGUQ7Aicul/1DihDgOrrPVu+b+nEDCjKpC1Lu1DqRn2MmAX4VCTtP0VYX5PYtZN193nxZ2ObJ7O8xWPL5roYcHUMubRL"
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
            range.setStart(this.findByDOMPath(this.state.editableNode, this.props.startContainerPath),
                           this.props.startOffset);
            range.setEnd(this.findByDOMPath(this.state.editableNode, this.props.endContainerPath),
                           this.props.endOffset);
            selection.removeAllRanges();
            selection.addRange(range);
        // }
        this.showSuggestionsSpan();
    }

    findSuggestionsSpan() {
        const xpathResult = document.evaluate('//span[@contenteditable="false"]', this.state.editableNode);
        return xpathResult.iterateNext();
    }

    showSuggestionsSpan() {
        if (this.props.postfix && !this.findSuggestionsSpan()) {
            this.state.editableNode.insertAdjacentHTML(
                'beforeend',
                `<span contenteditable="false" class="postfix">${this.props.postfix}</span>`);
        }
    }

    removeSuggestionsSpan() {
        let span = this.findSuggestionsSpan();
        if (span) {
            span.remove();
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

    findByDOMPath(root, path) {
        let child = root;
        for (let i in path.split('.')) {
            child = child.childNodes[i];
        }
        return child;
    }

    encodeDOMPath(root, node, stack=[]) {
        if (!root || !node) {
            return '';
        }
        if (node == root) {
            return stack.join('.');
        }

        let nodeIndex = null;

        for (const i in node.parentNode.childNodes) {
            const child = node.parentNode.childNodes[i];
            if (child == node) {
                stack.unshift(i);
                break;
            }
        }

        return this.encodeDOMPath(root, node.parentNode, stack);
    }

    getCurrentRange() {
        if (this.state.editableNode) {
            const endOfText = this.state.editableNode.length;
            if (window.getSelection()) {
                const range = window.getSelection().getRangeAt(0);
                // Ranges are a fairly complex thing. Highly recommend reading the spec.
                // see: https://dom.spec.whatwg.org/#ranges
                let ret =  [this.encodeDOMPath(this.state.editableNode, range.startContainer),
                            range.startOffset,
                            this.encodeDOMPath(this.state.editableNode, range.endContainer),
                            range.endOffset]
                console.log('getCurrentRange', {ret, text: this.state.editableNode.innerHTML})
                return ret;
            } else {
                throw new Error("TODO: Figure out how to put caret at the end..");
            }
        }
        console.log('getCurrentRange (default)')
        return ['0', 0, '0', 0]; // Just return something sensible
    }

    textChange(e) {
        this.removeSuggestionsSpan();
        const newText = this.state.editableNode.innerHTML;
        if (newText !== this.props.text) {
            this.selectionChange() // Also update state with new cursor position
            this.props.updateText(newText);
        }
    }

    selectionChange(e) {
        const [ startContainerPath, startOffset, endContainerPath, endOffset ] = this.getCurrentRange();
        this.props.updateSelection(startContainerPath, startOffset, endContainerPath, endOffset);
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
        // TODO: Figure out startContainerPath and endContainerPath here
        this.props.updateSelection(startOffset + postfixLength, endOffset + postfixLength);
    }

    render() {
        return (
            <div>
                <ContentEditable
                    onChange={ (e) => this.textChange(e) }
                    onSelect={ (e) => this.selectionChange(e) }
                    onKeyDown={ (e) => {
                        const arrowKeysAndESC = [27, 37, 38, 39, 40];
                        const returnKey = [13];
                        const tabKey = [9];
                        const altCtrlMeta = e.altKey || e.ctrlKey || e.metaKey;
                        if (arrowKeysAndESC.includes(e.keyCode) || altCtrlMeta) {
                            return;
                        }
                        if (returnKey.includes(e.keyCode)) {
                            this.props.clearPostfix();
                            return;
                        }
                        this.startFetchSuggestionsTimer();
                        if (tabKey.includes(e.keyCode)) {
                            this.acceptOption(e);
                            e.preventDefault();
                        }
                        this.props.clearPostfix();
                    }}
                    html={this.props.text || ''}
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
