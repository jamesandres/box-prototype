import { compose } from 'redux';
import { connect } from 'react-redux';

import { updateText, updateSelection, fetchSuggestions, clearPostfix } from '../actions/textActions';
import Main from '../components/Main';

const mapStateToProps = state => ({
    text: state.writing.text,
    postfix: state.writing.postfix,
    startOffset: state.writing.startOffset,
    startContainerPath: state.writing.startContainerPath,
    endOffset: state.writing.endOffset,
    endContainerPath: state.writing.endContainerPath
});

const mapDispatchToProps = dispatch => ({
    updateText: compose(dispatch, updateText),
    updateSelection: compose(dispatch, updateSelection),
    fetchSuggestions: compose(dispatch, fetchSuggestions),
    clearPostfix: compose(dispatch, clearPostfix)
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
