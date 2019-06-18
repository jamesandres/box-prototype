import { compose } from 'redux';
import { connect } from 'react-redux';

import { updateText, fetchSuggestions, clearPostfix } from '../actions/textActions';
import Main from '../components/Main';

const mapStateToProps = state => ({
    text: state.writing.text,
    postfix: state.writing.postfix
});

const mapDispatchToProps = dispatch => ({
    updateText: compose(dispatch, updateText),
    fetchSuggestions: compose(dispatch, fetchSuggestions),
    clearPostfix: compose(dispatch, clearPostfix)
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
