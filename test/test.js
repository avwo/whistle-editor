import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import WhistleEditor from '../index';

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


class App extends Component {
  state = {}
  onChange = (e) => {
    // 获取编辑器内容
    this.setState({ value: e.getValue() });
  }
  render() {
    const { value } = this.state;
    return (
      <WhistleEditor
        value={value}
        fontSize="16px"
        theme="monokai"
        lineNumbers
        onChange={this.onChange}
        className="test-class"
        mode="rules"
        plugins={plugins}
      />
    );
  }
}



ReactDOM.render(<App />, document.getElementById('root'));
