import React from 'react';
import ReactDOM from 'react-dom';
import Editor from '../src/index';

const plugins = {
  'whistle.test': 'http://123.com',
  share: 0,
  test: 'http://abc.com'
};

const onChange = (e) => {
  console.log(e.getValue());
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
