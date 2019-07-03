import { connect } from 'react-redux';
import { compose } from 'redux';

import MyEditor from '../components/MyEditor';
import { updateText, fetchSuggestions, clearSuggestion } from '../actions/textActions';

const mapStateToProps = state => ({
    text: state.writing.text,
    suggestion: state.writing.suggestion
});

const mapDispatchToProps = dispatch => ({
    updateText: compose(dispatch, updateText),
    fetchSuggestions: compose(dispatch, fetchSuggestions),
    clearSuggestion: compose(dispatch, clearSuggestion)
});


export default connect(mapStateToProps, mapDispatchToProps)(MyEditor);