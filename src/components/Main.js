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

function removeSuggestionsSpan(html) {
    let scratch = document.createElement('div');
    scratch.innerHTML = html;
    const xpathResult = document.evaluate('//span[@contenteditable="false"]', scratch);
    let node, nodes = [];
    // Annoyingly can't delete the nodes on the initial iteration as mutated XPathResults
    // cannot be iterated.
    while (node = xpathResult.iterateNext()) {
        nodes.push(node);
    }
    for (node of nodes) {
        node.remove();
    }
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
            token: "1PwCELEi4UtTRiUKsrjEtSb4dFwSx6zaSWnQkjHYSCQHjCkWMgp6uZBGDYrbK0GrI5sbCRzhTcAydjr3oAXSZ4f3GWame5/UILIGXFX1JSudwi5KksjK6LqpMtl4ZFKRCWUU48q3z3opdHrgjZOKCyeFziWn"
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

        if (!range) {
            return this.lastSentence();
        } else if (range.startContainer.nodeType !== Node.TEXT_NODE) {
            // FIXME: Probably this causes grief with selection (ie: startContainer !== endContainer)
            return this.lastSentence();
        }

        return [range.startContainer.textContent,
                encodeDOMPath(this.contentEditableRef.current, range.startContainer)];
    }

    lastSentence() {
        let scratch = document.createElement('div');
        scratch.innerHTML = this.contentEditableRef.current.innerHTML;

        const xpathResult = document.evaluate('//descendant::text()[last()]', scratch);
        const lastTextNode = xpathResult.iterateNext();

        if (!lastTextNode) {
            return ['', '0'];
        }
        return [lastTextNode.textContent,
                encodeDOMPath(scratch, lastTextNode)];
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

        const [scratch, node] = parseAndFindNode(this.props.text, this.props.suggestionNodePath);
        node.textContent += this.props.suggestion;

        this.props.updateText(scratch.innerHTML);
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
                        this.props.clearSuggestion();
                    }}
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
