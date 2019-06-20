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
            if (this.props.textLastSentence) {
                this.props.fetchSuggestions(this.props.textLastSentence, this.state.token);
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

    acceptOption(e) {
        const acceptedPostfix = this.props.postfix;
        if (!acceptedPostfix) {
            return;
        }

        const newText = `${this.props.text}${acceptedPostfix}`;

        this.props.updateText(newText);
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
                    html={this.props.text + `<span contenteditable="false" class="postfix">${this.props.postfix}</span>`}
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
    postfix: PropTypes.string,
    startOffset: PropTypes.number,
    endOffset: PropTypes.number,
    updateText: PropTypes.func.isRequired,
    fetchSuggestions: PropTypes.func.isRequired
};

export default Main;
