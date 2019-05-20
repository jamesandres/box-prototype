import React from 'react';
import PropTypes from 'prop-types';
import ContentEditable from 'react-contenteditable';
import striptags from 'striptags';

class Main extends React.Component {
    constructor() {
        super();
        this.state = {
            box: null
        };
    }

    componentDidUpdate(prevProps) {
        let selection = window.getSelection();
        if (selection) {
            if (this.state.box.firstChild) {
                let currentStartOffset, currentEndOffset;
                const currentRange = this.getCurrentRange();
                if (!currentRange) {
                    return;
                }

                currentStartOffset = currentRange.startOffset;
                currentEndOffset = currentRange.endOffset;

                console.log("componentDidUpdate. props startOffset: ", this.props.startOffset);
                if (this.props.startOffset !== currentStartOffset || this.props.endOffset !== currentEndOffset) {
                    const range = document.createRange();
                    // oh no. box.firstChild.firstChild doesn't exist on initial load but we do need to set the carat to the beginning of the
                    // box anyway.
                    const nodeToAlter = this.state.box.firstChild.firstChild ? this.state.box.firstChild.firstChild : this.state.box.firstChild;
                    range.setStart(nodeToAlter, this.props.startOffset);
                    range.setEnd(nodeToAlter, this.props.endOffset);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        } else {
            console.log("no selection");
        }
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
        // TODO: ugh. probably render this in the shadow DOM and remove this particular node?
        let textContent = e.target.value.split(' <span contenteditable=')[0];
        console.log("pre striptags: ", textContent);
        textContent = striptags(textContent);
        console.log("post striptags: ", textContent);
 
        const { startOffset, endOffset } = this.getCurrentRange();
        console.log("textChange - startOffset: ", startOffset);
        this.props.updateText(textContent, startOffset, endOffset);
    }

    selectionChange(e) {
        const { startOffset, endOffset } = this.getCurrentRange();
        this.props.updateText(this.props.text, startOffset, endOffset);
    }

    saveBox(node) {
        if (!this.state.box) {
            this.setState({
                box: node
            });
        }
    }

    acceptOption(e) {
        const acceptedPostfix = this.props.postfix;
        if (!acceptedPostfix) {
            return;
        }
        
        const postfixLength = acceptedPostfix.length;

        const text = `${this.props.text} ${acceptedPostfix}`;
        let { startOffset, endOffset } = this.getCurrentRange();
        
        startOffset = startOffset + postfixLength;
        endOffset = endOffset + postfixLength;

        this.props.updateText(text, startOffset, endOffset);
    }
    
    render() {
        const html = `<span>${this.props.text || ''}</span> <span contenteditable="false">${this.props.postfix || ''}</span>`;
        return (
            <div>
                <ContentEditable
                    onChange={ (e) => this.textChange(e) }
                    onSelect={ (e) => this.selectionChange(e) }
                    onKeyDown={ (e) => {
                        if (e.keyCode !== 13) {
                            return;
                        } else {
                            this.acceptOption(e);
                            e.preventDefault();
                        }
                    }}
                    html={html}
                    innerRef={ (ref) => this.saveBox(ref) }
                />
            </div>
        );
    }
}

Main.propTypes = {
    text: PropTypes.string.isRequired,
    postfix: PropTypes.string,
    startOffset: PropTypes.number,
    endOffset: PropTypes.number,
    updateText: PropTypes.func.isRequired
};

export default Main;
