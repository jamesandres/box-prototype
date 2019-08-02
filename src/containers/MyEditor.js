import { compose } from 'redux';
import { connect } from 'react-redux';

import { editorChanged, fetchSuggestions, clearSuggestion } from '../actions/textActions';
import MyEditor from '../components/MyEditor';

const mapStateToProps = state => ({
    editorState: state.writing.editorState
});

const mapDispatchToProps = dispatch => ({
    editorChanged: compose(dispatch, editorChanged),
    fetchSuggestions: compose(dispatch, fetchSuggestions),
    clearSuggestion: compose(dispatch, clearSuggestion)
});

export default connect(mapStateToProps, mapDispatchToProps)(MyEditor);
