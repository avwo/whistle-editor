import React from 'react';
import ReactDOM from 'react-dom';
import Editor from './index';

const plugins = {
  'whistle.test': 'http://123',
  share: 0,
};

ReactDOM.render(<Editor mode="rules" plugins={plugins} />, document.getElementById('root'));
