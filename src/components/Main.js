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
                if (currentRange) {
                    currentStartOffset = currentRange.startOffset;
                    currentEndOffset = currentRange.endOffset;
                }

                console.log("this.state.box.firstChild: ", this.state.box.firstChild);
                // only attempt to change offset if we're not already there
                if (!currentRange || this.props.startOffset !== currentStartOffset || this.props.endOffset !== currentEndOffset) {
                    const range = document.createRange();
                    // TODO: the box.firstChild situation happens on initial load. On initial load we don't care about Range yet, so don't let it try to
                    // create one?
                    let nodeToAlter = this.state.box.firstChild.firstChild ? this.state.box.firstChild.firstChild : this.state.box.firstChild;
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
        const textContent = striptags(e.target.value);
 
        console.log(`text changed to ${textContent}`);
        const { startOffset, endOffset } = this.getCurrentRange();
        this.props.updateText(textContent, startOffset, endOffset);
    }

    selectionChange(e) {
        const { startOffset, endOffset } = this.getCurrentRange();
        //this.props.updateText(this.props.text, startOffset, endOffset);
    }

    saveBox(node) {
        if (!this.state.box) {
            this.setState({
                box: node
            });
        }
    }
    
    render() {
        console.log(`rerendering - this.props.text: ${this.props.text}`);
        //const html = `<span>${this.props.text || ''}</span> <span>${this.props.postfix || ''}</span>`;
        const html = `<span>${this.props.text}</span>`;
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
