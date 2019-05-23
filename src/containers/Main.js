import { compose } from 'redux';
import { connect } from 'react-redux';

import { updateText, fetchSuggestions } from '../actions/textActions';
import Main from '../components/Main';

const mapStateToProps = state => ({
    text: state.writing.text,
    postfix: state.writing.postfix,
    startOffset: state.writing.startOffset,
    endOffset: state.writing.endOffset
});

const mapDispatchToProps = dispatch => ({
    updateText: compose(dispatch, updateText),
    fetchSuggestions: compose(dispatch, fetchSuggestions)
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
