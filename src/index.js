require('codemirror/lib/codemirror.css');
require('codemirror/theme/neat.css');
require('codemirror/theme/elegant.css');
require('codemirror/theme/erlang-dark.css');
require('codemirror/theme/night.css');
require('codemirror/theme/monokai.css');
require('codemirror/theme/cobalt.css');
require('codemirror/theme/eclipse.css');
require('codemirror/theme/rubyblue.css');
require('codemirror/theme/lesser-dark.css');
require('codemirror/theme/xq-dark.css');
require('codemirror/theme/xq-light.css');
require('codemirror/theme/ambiance.css');
require('codemirror/theme/blackboard.css');
require('codemirror/theme/vibrant-ink.css');
require('codemirror/theme/solarized.css');
require('codemirror/theme/twilight.css');
require('codemirror/theme/midnight.css');
require('codemirror/addon/dialog/dialog.css');
require('codemirror/addon/search/matchesonscrollbar.css');
require('./index.css');

const React = require('react');
const ReactDOM = require('react-dom');
const CodeMirror = require('codemirror');
const rulesHint = require('./rules-hint');
const protocols = require('./protocols');

const INIT_LENGTH = 1024 * 16;

require('codemirror/mode/javascript/javascript');
require('codemirror/mode/css/css');
require('codemirror/mode/xml/xml');
require('codemirror/mode/htmlmixed/htmlmixed');
require('codemirror/mode/markdown/markdown');
require('codemirror/addon/dialog/dialog');
require('codemirror/addon/search/searchcursor');
require('codemirror/addon/search/search');
require('codemirror/addon/scroll/annotatescrollbar');
require('codemirror/addon/search/matchesonscrollbar');
require('./rules-mode');

const themes = ['default', 'neat', 'elegant', 'erlang-dark', 'night', 'monokai', 'cobalt', 'eclipse',
  'rubyblue', 'lesser-dark', 'xq-dark', 'xq-light', 'ambiance',
  'blackboard', 'vibrant-ink', 'solarized dark', 'solarized light', 'twilight', 'midnight'];

const DEFAULT_THEME = 'cobalt';
const DEFAULT_FONT_SIZE = '16px';
const RULES_COMMENT_RE = /^()\s*#\s*/;
const JS_COMMENT_RE = /^(\s*)\/\/+\s?/;
const NO_SPACE_RE = /\S/;
const LINK_RE = /\bcm-js-(?:type|at|http-url)\b/;

class Editor extends React.Component {
  componentDidMount() {
    let timeout;
    const self = this;
    const elem = ReactDOM.findDOMNode(self.editorRef); // eslint-disable-line
    const editor = CodeMirror(elem);
    self._editor = editor;
    editor.on('change', (e) => {
      if (typeof self.props.onChange === 'function' && editor.getValue() !== (self.props.value || '')) {
        self.props.onChange.call(self, e);
      }
    });
    editor.on('mousedown', (_, e) => {
      if ((e.ctrlKey || e.metaKey) && LINK_RE.test(e.target.className)) {
        e.preventDefault();
      }
    });
    self._init(true);
    const resize = function() {
      const height = elem.offsetHeight || 0;
      if (height < 10) {
        clearTimeout(timeout);
        timeout = setTimeout(resize, 300);
      } else {
        editor.setSize(null, height);
      }
    };
    resize();
    window.addEventListener('resize', () => {
      clearTimeout(timeout);
      timeout = null;
      timeout = setTimeout(resize, 30);
    });
    elem.addEventListener('keydown', (e) => {
      const isRules = self.isRulesEditor();
      const isJS = self._mode === 'javascript';
      if (isRules) {
        const options = {
          name: self.props.name,
          url: window.location.href,
        };
        if (!e.ctrlKey && !e.metaKey && e.keyCode === 112) {
          const helpUrl = rulesHint.getHelpUrl(self._editor, options);
          if (helpUrl) {
            window.open(helpUrl);
          }
          e.stopPropagation();
          e.preventDefault();
          return true;
        }
        try {
          const onKeyDown = window.onWhistleRulesEditorKeyDown;
          if (typeof onKeyDown === 'function' && onKeyDown(e, options) === false) {
            e.stopPropagation();
            e.preventDefault();
            return true;
          }
        } catch (err) {}
      }
      if ((!isRules && !isJS) || !(e.ctrlKey || e.metaKey) || e.keyCode !== 191) {
        return;
      }

      const list = editor.listSelections();
      if (!list || !list.length) {
        return;
      }
      const commentRE = isRules ? RULES_COMMENT_RE : JS_COMMENT_RE;
      const isShiftKey = e.shiftKey;
      let isEmpty;
      const ranges = [];
      list.forEach((range) => {
        let { anchor } = range;
        let { head } = range;
        let lines = [];
        let hasComment; let hasRule; let
          revert;

        if (anchor.line > head.line) {
          revert = anchor;
          anchor = head;
          head = revert;
        }

        for (let i = anchor.line; i <= head.line; i++) {
          const line = editor.getLine(i);
          if (commentRE.test(line)) {
            hasComment = true;
          } else if (NO_SPACE_RE.test(line)) {
            hasRule = true;
          }
          lines.push(line);
        }
        isEmpty = !hasComment && !hasRule;
        if (isEmpty) {
          return;
        }
        let lastIndex; let firstLine; let
          lastLine;
        if (hasRule) {
          lastIndex = lines.length - 1;
          firstLine = lines[0];
          lastLine = lines[lastIndex];
          lines = lines.map((line) => {
            if (!NO_SPACE_RE.test(line)) {
              return line;
            }
            if (isShiftKey && commentRE.test(line)) {
              return line.replace(commentRE, '$1');
            }
            return (isRules ? '# ' : '// ') + line;
          });
        } else {
          firstLine = lines[0];
          lastIndex = lines.length - 1;
          lastLine = lines[lastIndex];
          lines = lines.map((line) => {
            return line.replace(commentRE, '$1');
          });
        }
        if (anchor.ch !== 0) {
          anchor.ch += lines[0].length - firstLine.length;
          if (anchor.ch < 0) {
            anchor.ch = 0;
          }
        }
        if (head.ch !== 0 && head !== anchor) {
          head.ch += lines[lastIndex].length - lastLine.length;
          if (head.ch < 0) {
            head.ch = 0;
          }
        }
        if (revert) {
          editor.replaceRange(`${lines.join('\n')}\n`, { line: head.line + 1, ch: 0 }, { line: anchor.line, ch: 0 });
          ranges.push({ anchor: head, head: anchor });
        } else {
          editor.replaceRange(`${lines.join('\n')}\n`, { line: anchor.line, ch: 0 }, { line: head.line + 1, ch: 0 });
          ranges.push({ anchor, head });
        }
      });
      if (!isEmpty) {
        editor.setSelections(ranges);
      }
    });
  }

  componentDidUpdate() {
    this._init();
  }

  getThemes() {
    return themes;
  }

  setMode(mode) {
    if (/^(javascript|css|xml|rules|markdown)$/i.test(mode)) {
      mode = RegExp.$1.toLowerCase();
    } else if (/^(js|pac|jsx|json)$/i.test(mode)) {
      mode = 'javascript';
    } else if (/^(html|wtpl)?$/i.test(mode)) {
      mode = 'htmlmixed';
    } else if (/^md$/i.test(mode)) {
      mode = 'markdown';
    }

    this._mode = mode;
    if (this._editor) {
      this._editor.setOption('mode', mode);
    }
  }

  setValue(value) {
    value = value == null ? '' : `${value}`;
    this._value = value;
    if (!this._editor || this._editor.getValue() === value) {
      return;
    }
    this._editor.setValue(value);
  }

  getValue() {
    return this._editor ? '' : this._editor.getValue();
  }

  setTheme(theme) {
    theme = theme || DEFAULT_THEME;
    this._theme = theme;
    if (!this._editor) {
      return;
    }
    this._editor.setOption('theme', theme);
  }

  setFontSize(fontSize) {
    fontSize = fontSize || DEFAULT_FONT_SIZE;
    this._fontSize = fontSize;
    if (this._editor) {
      ReactDOM.findDOMNode(this.editorRef).style.fontSize = fontSize; // eslint-disable-line
    }
  }

  setAutoComplete() {
    const isRules = this.isRulesEditor();
    const option = isRules && !this.props.readOnly ? rulesHint.getExtraKeys() : {};
    if (!/\(Macintosh;/i.test(window.navigator.userAgent)) {
      option['Ctrl-F'] = 'findPersistent';
    }
    option['Cmd-F'] = 'findPersistent';
    const editor = this._editor;
    editor.setOption('extraKeys', option);
    editor.off('keyup', this.handleKeyUp);
    if (isRules) {
      editor.on('keyup', this.handleKeyUp);
    }
  }

  setReadOnly(readOnly) {
    readOnly = !(readOnly === false || readOnly === 'false');
    this._readOnly = readOnly;
    if (this._editor) {
      this._editor.setOption('readOnly', readOnly);
    }
  }

  handleKeyUp = (_, e) => {
    clearTimeout(this._timer);
    const _byDelete = e.keyCode === 8;
    if (_byDelete || e.keyCode === 13) {
      const editor = this._editor;
      this._timer = setTimeout(() => {
        if (!document.querySelector('.CodeMirror-hints')) {
          editor._byDelete = true;
          editor._byEnter = !_byDelete;
          editor.execCommand('autocomplete');
        }
      }, 300);
    }
  }

  showLineNumber(show) {
    show = show !== false;
    this._showLineNumber = show;
    if (this._editor) {
      this._editor.setOption('lineNumbers', show);
    }
  }

  showLineWrapping(show) {
    show = show !== false;
    this._showLineNumber = show;
    if (this._editor) {
      this._editor.setOption('lineWrapping', show);
    }
  }

  _init(init) {
    const self = this;
    this.setMode(self.props.mode);
    const { value } = self.props;
    if (init && value && value.length > INIT_LENGTH) {
      self.timer = setTimeout(() => {
        self.timer = null;
        self.setValue(self.props.value); // 节流
      }, 500);
    } else if (!self.timer) {
      self.setValue(value);
    }
    self.setTheme(self.props.theme);
    self.setFontSize(self.props.fontSize);
    self.setTheme(self.props.theme);
    self.showLineNumber(self.props.lineNumbers || false);
    self.showLineWrapping(self.props.lineWrapping || false);
    self.setReadOnly(self.props.readOnly || false);
    self.setAutoComplete();
    if (self._curPlugins !== self.props.plugins) {
      self._curPlugins = self.props.plugins;
      protocols.setPlugins(self._curPlugins);
    }
  }

  isRulesEditor() {
    return this.props.name === 'rules' || this._mode === 'rules';
  }

  render() {
    return (
      <div tabIndex="0" ref={editor => (this.editorRef = editor)} className={this.props.className} />
    );
  }
}

module.exports = Editor;
