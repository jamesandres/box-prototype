import { connect } from 'react-redux';
import { compose } from 'redux';

import AutoComplete from '../components/AutoComplete';
import { fetchSuggestions, clearSuggestion } from '../actions/textActions';

const mapStateToProps = state => ({
    suggestion: state.writing.suggestion
});

const mapDispatchToProps = dispatch => ({
    fetchSuggestions: compose(dispatch, fetchSuggestions),
    clearSuggestion: compose(dispatch, clearSuggestion)
});


export default connect(mapStateToProps, mapDispatchToProps)(AutoComplete);