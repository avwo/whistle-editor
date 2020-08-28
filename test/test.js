import React from 'react';
import ReactDOM from 'react-dom';
import Editor from 'whistle-editor';

const plugins = {
  'whistle.test': 'http://123',
  share: 0,
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
