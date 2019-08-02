import React from 'react';

class SuggestionBlock extends React.Component {
    render() {
      return (
        <div className='SuggestionBlock' onClick={this.props.blockProps.onRemove}>
          {this.props.blockProps.suggestion}
        </div>
      );
    }
}

export default SuggestionBlock;