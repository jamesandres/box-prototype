import React from 'react';
import PropTypes from 'prop-types';
import ContentEditable from 'react-contenteditable';


class Main extends React.Component {
    constructor() {
        super();
        this.contentEditableRef = React.createRef();
        this.state = {
            fetchSuggestionsTimer: null,
            token: "VPBmhXXIFfA/Mu5vTSyWiZtJYT7TIfK8TuFHOgQ0FLa1Qjl1qbUBbstODme5znEwDUK7FncrxQdzEFQYVaMqBGGM6L47MADA3a59b9rAdqbWDvotpOPTMePhHtZDx7CimCAeDntOA9fNRdSwNhahjERX/6Sw"
        };
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
                this.encodeDOMPath(this.contentEditableRef.current, range.startContainer)];
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
                this.encodeDOMPath(scratch, lastTextNode)];
    }

    getCurrentRange() {
        if (window.getSelection()) {
            return window.getSelection().getRangeAt(0);
        }
    }

    encodeDOMPath(root, node, stack=[]) {
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

        return this.encodeDOMPath(root, node.parentNode, stack);
    }

    textChange(e) {
        const newText = this.removeSuggestionsSpan(e.target.value);
        if (newText !== this.props.text) {
            this.props.updateText(newText);
        }
    }

    removeSuggestionsSpan(html) {
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

    parseAndFindNode(html, nodePath) {
        let scratch = document.createElement('div');
        scratch.innerHTML = html;

        // FIXME: Possible for this search to not succeed due to editing races?
        let node = scratch;
        for (let i of nodePath.split('.')) {
            node = node.childNodes[parseInt(i, 10)];
        }

        return [scratch, node];
    }

    injectedWithSuggestion(html, suggestion, suggestionNodePath) {
        if (!suggestion) {
            return html;
        }

        const [scratch, textNode] = this.parseAndFindNode(html, suggestionNodePath);

        if (!textNode) {
            return html;
        }

        textNode.parentNode.insertAdjacentHTML('beforeend', `<span contenteditable="false" class="suggestion">${suggestion}</span>`);
        return scratch.innerHTML;
    }

    acceptOption(e) {
        if (!this.props.suggestion) {
            return;
        }

        const [scratch, node] = this.parseAndFindNode(this.props.text, this.props.suggestionNodePath);
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
                    html={this.injectedWithSuggestion(this.props.text, this.props.suggestion, this.props.suggestionNodePath)}
                    innerRef={this.contentEditableRef}
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
    suggestion: PropTypes.string,
    startOffset: PropTypes.number,
    endOffset: PropTypes.number,
    updateText: PropTypes.func.isRequired,
    fetchSuggestions: PropTypes.func.isRequired
};

export default Main;
