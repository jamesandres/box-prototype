import { compose } from 'redux';
import { connect } from 'react-redux';

import { updateText, fetchSuggestions, clearSuggestion } from '../actions/textActions';
import Main from '../components/Main';

const mapStateToProps = state => ({
    text: state.writing.text,
    suggestion: state.writing.suggestion,
    suggestionNodePath: state.writing.suggestionNodePath
});

const mapDispatchToProps = dispatch => ({
    updateText: compose(dispatch, updateText),
    fetchSuggestions: compose(dispatch, fetchSuggestions),
    clearSuggestion: compose(dispatch, clearSuggestion)
});

export default connect(mapStateToProps, mapDispatchToProps)(Main);
