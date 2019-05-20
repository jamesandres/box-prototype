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
        let textContent = e.target.value.split('<span contenteditable=')[0];
        textContent = striptags(textContent);
 
        const { startOffset, endOffset } = this.getCurrentRange();
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
    
    render() {
        const html = `<span>${this.props.text || ''}</span> <span contenteditable="false">${this.props.postfix || ''}</span>`;
        return (
            <div>
                <ContentEditable
                    onChange={(e) => this.textChange(e) }
                    onSelect={(e) => this.selectionChange(e) }
                    html={html}
                    innerRef={(ref) => this.saveBox(ref) }
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
