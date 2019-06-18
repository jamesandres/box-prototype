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
            token: "9nsP8FqKIDHMQwnb3u7CFiu5gvnwMXg86f90nygssdwBes1h3wF7GIy7ZXASNUh+S7yazwkGvsQ2IwL/R+Zzqw+4ejHcUgYwvdO+q6KlC21dQOoRKPdKyUba73pyek7O/DBJ365AXhQF2RXkRzS2C03vVUt7"
        };
    }

    // componentDidUpdate
    // ~~~~~~~~~~~~~~~~~~
    // Invoked whenever the component has a state change.  The componentDidUpdate is particularly
    // useful when an operation needs to happen after the DOM is updated and the update queue is
    // emptied. It's probably most useful on complex renders and state or DOM changes or when you
    // need something to be the absolutely last thing to be executed.
    componentDidUpdate(prevProps) {
        if (!this.state.editableNode.firstChild) {
            return;
        }
        this.state.editableNode.insertAdjacentHTML(
            'beforeend',
            `<span contenteditable="false" class="postfix">${this.props.postfix || ''}</span>`);
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

        this.props.updateText(newText);
    }

    render() {
        return (
            <div>
                <ContentEditable
                    onChange={ (e) => this.textChange(e) }
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
                    html={this.props.text}
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
