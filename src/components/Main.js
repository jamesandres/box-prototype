import React from 'react';
import PropTypes from 'prop-types';
import ContentEditable from 'react-contenteditable';


function encodeDOMPath(root, node, stack=[]) {
    if (!root || !node) {
        return '';
    }
    if (node === root) {
        return stack.join('.');
    }

    for (const i in node.parentNode.childNodes) {
        const child = node.parentNode.childNodes[i];
        if (child === node) {
            stack.unshift(i);
            break;
        }
    }

    return encodeDOMPath(root, node.parentNode, stack);
}

function removeSuggestionFromDOM(root) {
    const nodeList = root.querySelectorAll('span[contenteditable="false"]')
    for (let node of nodeList) {
        node.remove();
    }
}

function findLastTextNode(root) {
    for (let node of root.childNodes.reverse()) {
        if (node.nodeType == Node.TEXT_NODE) {
            return node;
        } else if (node.childNodes.length > 0) {
            return findLastTextNode(node);
        }
    }
}

function lastSentence(root) {
    const lastTextNode = findLastTextNode(root);

    if (!lastTextNode) {
        return ['', '0'];
    }
    return [lastTextNode.textContent, encodeDOMPath(root, lastTextNode)];
}


function removeSuggestionsSpan(html) {
    let scratch = document.createElement('div');
    scratch.innerHTML = html;
    removeSuggestionFromDOM(scratch)
    return scratch.innerHTML;
}

function parseAndFindNode(html, nodePath) {
    let scratch = document.createElement('div');
    scratch.innerHTML = html;

    const node = findNode(scratch, nodePath);

    return [scratch, node];
}

function findNode(root, nodePath) {
    // FIXME: Possible for this search to not succeed due to editing races?
    let node = root;
    for (let i of nodePath.split('.')) {
        node = node.childNodes[parseInt(i, 10)];
    }
    return node;
}

function injectSuggestionIntoDOM(root, suggestion, suggestionNodePath) {
    const textNode = findNode(root, suggestionNodePath);

    if (!textNode) {
        return;
    }

    // FIXME: Being lazy and not creating my DOM nodes one bit at a time.
    let scratch = document.createElement('div');
    scratch.innerHTML = `<span contenteditable="false" class="suggestion">${suggestion}</span>`;
    // insertBefore in order to potentially insert between nodes. For example in "Hi,
    // thanks<br><br>" if the cursor is just after "thanks" but before the breaks it's important
    // the suggestions appear in line with "thanks" and not jumped down two lines.
    textNode.parentNode.insertBefore(scratch.firstChild, textNode.nextSibling);
}


class Main extends React.Component {
    constructor() {
        super();
        this.contentEditableRef = React.createRef();
        this.state = {
            fetchSuggestionsTimer: null,
            token: "X5ACx0rk84MU8EDZp4KmG8BflUteh2DyvEi4RdP7m1g9cCzqZsZ2hpf4EdYjQsCBom6MCTy8Fbnp/R+SgE0gkli6jJGJq9BcCcZltyxKhA8ySlbW9CCt5b9syiJu8P2xrttJw/bdkKDS1wkkslXMRNykZuFM"
        };
    }

    componentDidUpdate() {
        if (this.props.suggestion) {
            // Yes, this is a little crazy. But maybe it's crazy awesome? The idea is to entirely
            // hide the suggestion span from the underlying <ContentEditable> component. The
            // advantage of that is ContentEditable has a nasty habit of moving the caret to the
            // end of the last text node (see: their function replaceCaret) on componentDidUpdate.
            // However ContentEditable also implements shouldComponentUpdate and it largely uses
            // an internal bit of state `this.lastHtml` to track if the component has been
            // programmatically updated.
            injectSuggestionIntoDOM(this.contentEditableRef.current, this.props.suggestion, this.props.suggestionNodePath);
        }
    }

    fetchSuggestionsTimer() {
        const fetchSuggestionsClosure = (() => () => {
            if (this.props.text) {
                this.props.fetchSuggestions(this.currentSentence(), this.state.token);
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

    currentSentence() {
        const range = this.getCurrentRange();

        if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) {
            // FIXME: Probably this causes grief with selection (ie: startContainer !== endContainer)
            return lastSentence(this.contentEditableRef.current);
        }

        return [range.startContainer.textContent,
                encodeDOMPath(this.contentEditableRef.current, range.startContainer)];
    }

    getCurrentRange() {
        if (window.getSelection()) {
            return window.getSelection().getRangeAt(0);
        }
    }

    textChange(e) {
        const newText = removeSuggestionsSpan(e.target.value);
        if (newText !== this.props.text) {
            this.props.updateText(newText);
        }
    }

    acceptOption(e) {
        if (!this.props.suggestion) {
            return;
        }

        // The point behind using the 'insertHTML' command here is it acts as though the user
        // actually typed the text. This bubbles the events up "from the bottom" so to speak which
        // keeps ContentEditable in the loop so it will update its `lastHtml` state accurately.
        // In turn this helps it avoid doing an unnecessary component update see its implementation
        // of componentShouldUpdate.

        // FIXME: This does not work in IE 11 or so the internet tells me.
        document.execCommand('insertHTML', false, this.props.suggestion)
    }

    pasteAsPlainText(event) {
        event.preventDefault()

        const text = event.clipboardData.getData('text/plain')
        document.execCommand('insertHTML', false, text)
    }

    render() {
        return (
            <div>
                <ContentEditable
                    onChange={ (e) => this.textChange(e) }
                    onKeyDown={ (e) => {
                        // TODO: Redo this key handling, new shit has come to light!
                        const arrowKeysAndESC = [27, 37, 38, 39, 40];
                        const returnKey = [13];
                        const tabKey = [9];
                        const altCtrlMeta = e.altKey || e.ctrlKey || e.metaKey;
                        if (arrowKeysAndESC.includes(e.keyCode) || altCtrlMeta) {
                            return;
                        }
                        if (returnKey.includes(e.keyCode)) {
                            this.props.clearSuggestion();
                            return;
                        }
                        this.startFetchSuggestionsTimer();
                        if (tabKey.includes(e.keyCode)) {
                            this.acceptOption(e);
                            e.preventDefault();
                        }
                        removeSuggestionFromDOM(this.contentEditableRef.current)
                        this.props.clearSuggestion();
                    }}
                    onPaste={this.pasteAsPlainText}
                    html={this.props.text}
                    innerRef={this.contentEditableRef}
                />
                <hr />
                <p>
                    <label>Token:</label>
                    <input type="text"
                           value={this.state.token}
                           onChange={ (e) => this.setState({"token": e.target.value}) } />
                </p>
            </div>
        );
    }
}

Main.propTypes = {
    text: PropTypes.string.isRequired,
    suggestion: PropTypes.string,
    startOffset: PropTypes.number,
    endOffset: PropTypes.number,
    updateText: PropTypes.func.isRequired,
    fetchSuggestions: PropTypes.func.isRequired
};

export default Main;
