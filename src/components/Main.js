import React from 'react';
import ContentEditable from 'react-contenteditable';

class Main extends React.Component {
    constructor() {
        super();
        this.state = {
            text: '',
            startOffset: null,
            endOffset: null
        };
    }

    componentDidUpdate(prevProps) {
        console.log("componentDidUpdate");
    }

    textChange(e) {
        console.log(`text changed to ${e.target.value}`);
        // TODO: something about setState batching calls?
        this.setState({
            text: e.target.value
        });
    }

    selectionChange(e) {
        const range = window.getSelection().getRangeAt(0);
        const { startOffset, endOffset } = range;
        console.log(`offset change to (${startOffset}, ${endOffset})`);

        this.setState({
            startOffset,
            endOffset
        });
    }

    addSignature() {
        this.setState({text: `<span>${this.state.text}</span>  <span contenteditable="false">- HW</span>`});
    }
    
    render() {
        const html = this.state.text;
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

export default Main;
