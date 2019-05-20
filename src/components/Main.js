import React from 'react';
import PropTypes from 'prop-types';
import ContentEditable from 'react-contenteditable';

class Main extends React.Component {
    constructor() {
        super();
    }

    componentDidUpdate(prevProps) {
        console.log("componentDidUpdate");

        // TODO: update range
    }

    getCurrentRange() {
        if (window.getSelection()) {
            return window.getSelection().getRangeAt(0);
        }
    }

    textChange(e) {
        console.log(`text changed to ${e.target.value}`);
        const { startOffset, endOffset } = this.getCurrentRange();
        this.props.updateText(e.target.value, startOffset, endOffset);
    }

    selectionChange(e) {
        const { startOffset, endOffset } = this.getCurrentRange();
        //this.props.updateText(this.props.text, startOffset, endOffset);
    }

    addSignature() {
        //this.setState({text: `<span>${this.state.text}</span>  <span contenteditable="false">- HW</span>`});
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
                />
                <div>
                    <button onClick={(e) => this.addSignature(e) }>
                        Button
                    </button>
                </div>
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
