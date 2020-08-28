# whistle-editor
本模块是 whistle 编辑器的 React 组件，可以作为 whistle 规则及其 Values 编辑器。

# 用法
``` js
import React from 'react';
import ReactDOM from 'react-dom';
import Editor from 'whistle-editor';
console.log(Editor)
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
```

其中可设属性：
1. `className`: 组件样式
2. `mode`: 编辑器类型，默认 txt 类型，可设类型：rules、html、js (pac|jsx|json)、css、md、html
3. `plugins`: 添加插件名称及帮助文档链接，用于编辑器书写规则时自动提醒
    ``` txt
    const plugins = {
      test: 'http://xxxx',
      ...
    };
    ```
4. `value`: 设置编辑器默认值
5. `onChange`: 内容改变时触发
    ``` txt
    const onChange = (e) => {
      console.log(e.getValue());
    };
    ```
6. `theme`: 编辑器主题，默认为 `cobalt`，可选：['default', 'neat', 'elegant', 'erlang-dark', 'night', 'monokai', 'cobalt', 'eclipse', 'rubyblue', 'lesser-dark', 'xq-dark', 'xq-light', 'ambiance', 'blackboard', 'vibrant-ink', 'solarized dark', 'solarized light', 'twilight', 'midnight']
7. fontSize: 字体大小，默认 `14px`
8. lineNumbers: `true` | `false`，是否显示行数，默认为 `false`
