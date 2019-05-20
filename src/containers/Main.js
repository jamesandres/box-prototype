import { connect } from 'react-redux'; 

import { updateText } from '../actions/textActions';
import Main from '../components/Main';

const mapStateToProps = state => ({
    text: state.writing.text,
    postfix: state.writing.postfix,
    startOffset: state.writing.startOffset,
    endOffset: state.writing.endOffset
});

const mapDispatchToProps = dispatch => ({
    updateText: (text, startOffset, endOffset) => {
        dispatch(updateText(text, startOffset, endOffset));
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
