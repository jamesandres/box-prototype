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
        // IE11: Doesn't have Element.remove(), fu IE.
        node.parentNode.removeChild(node);
    }
}

function findLastTextNode(root) {
    // IE11: This is null sometimes in IE. No idea why.
    if (!root) {
        return;
    }
    const reversedNodeList = Array.from(root.childNodes).reverse();
    for (let node of reversedNodeList) {
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
            token: "NE8VWpsnfJ/RqF2IxboGeo4UIgiTsDL/ivXIC58LQwBnWIyw0nMp6QCaRnSa/f7LmJNWxVfFqHM0+/QrestN+tYp48Pi94651s9+HzOiVsdhmpOrkzw5TybOje3k7QAZk3PsOR1wSLoMwYl3twtM4YuQybsm",
            suggestionBaseURL: 'http://localhost:8010'
        };
    }

    componentDidUpdate() {
        console.log('Main::cDU');
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

    // IE11: Apparently React's default sCU can't realise the timeout changing isn't a good reason
    //       to perform a full re-render. So here we diff all except this.state.fetchSuggestionsTimer
    shouldComponentUpdate(nextProps, nextState) {
        return (this.props.text !== nextProps.text
             || this.props.suggestion !== nextProps.suggestion
             || this.props.suggestionNodePath !== nextProps.suggestionNodePath
             || this.state.token !== nextState.token
             || this.state.suggestionBaseURL !== nextState.suggestionBaseURL);
    }

    fetchSuggestionsTimer() {
        const fetchSuggestionsClosure = (() => () => {
            if (this.props.text) {
                this.props.fetchSuggestions(this.currentSentence(),
                                            this.state.suggestionBaseURL, this.state.token);
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
        document.execCommand('insertText', false, this.props.suggestion)
    }

    pasteAsPlainText(event) {
        event.preventDefault()

        const text = event.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
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
                    <label>Suggestion Base URL:</label>
                    <input type="url"
                           value={this.state.suggestionBaseURL}
                           style={{width: 400}}
                           onChange={ (e) => this.setState({"suggestionBaseURL": e.target.value}) } />
                </p>
                <p>
                    <label>Token:</label>
                    <input type="text"
                           value={this.state.token}
                           style={{width: 400}}
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
