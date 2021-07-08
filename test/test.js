import React from 'react';
import ReactDOM from 'react-dom';
import Editor from '../src/index';

const plugins = {
  'whistle.test': {
    homepage: 'http://123.com',
    hintList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(String),
    pluginVars: {
      hintList: (options, callback) => {
        if (options.value !== '3') {
          return;
        }
        setTimeout(() => {
          callback([10000, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(String));
        }, 1000);
      },
    },
  },
  share: 0,
  test: 'http://abc.com',
};

const onChange = (e) => {
  console.log(e.getValue()); // eslint-disable-line
};

const editor = (
  <Editor
    value="test"
    fontSize="16px"
    theme="monokai"
    lineNumbers
    onChange={onChange}
    className="test-class"
    mode="rules"
    plugins={plugins}
  />
);

ReactDOM.render(editor, document.getElementById('root'));
