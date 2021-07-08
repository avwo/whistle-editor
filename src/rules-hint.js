require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/show-hint');
const CodeMirror = require('codemirror');
const protocols = require('./protocols');

const NON_SPECAIL_RE = /[^:/]/;
const AT_RE = /^@/;
const P_RE = /^%/;
const PIPE_RE = /^pipe:/;
const PROTOCOL_RE = /^([^\s:]+):\/\//;
const extraKeys = { 'Alt-/': 'autocomplete' };
const CHARS = [
  '-', '"_"', 'Shift-2', '.', ',', 'Shift-,', 'Shift-.', 'Shift-;', '/', 'Shift-/',
  'Shift-1', 'Shift-4', 'Shift-5', 'Shift-6', 'Shift-7', 'Shift-8',
  '=', 'Shift-=', '\'', 'Shift-\'', ';', 'Shift-;', '\\', 'Shift-\\', 'Shift-`',
  '[', ']', 'Shift-[', 'Shift-]', 'Shift-9', 'Shift-0',
];
for (let i = 0; i < 10; i++) {
  CHARS.push(`'${i}'`);
}
for (let a = 'a'.charCodeAt(), z = 'z'.charCodeAt(); a <= z; a++) {
  const ch = String.fromCharCode(a);
  CHARS.push(`'${ch.toUpperCase()}'`);
  CHARS.push(`'${ch}'`);
}

function getHints(keyword) {
  const allRules = protocols.getAllRules();
  if (!keyword) {
    return allRules;
  }
  keyword = keyword.toLowerCase();
  const list = allRules.filter((name) => {
    if (name === 'socks://' && 'proxy'.indexOf(keyword) !== -1) {
      return true;
    }
    name = name.toLowerCase();
    return name.indexOf(keyword) !== -1;
  });
  list.sort((cur, next) => {
    const curIndex = cur.toLowerCase().indexOf(keyword);
    const nextIndex = next.toLowerCase().indexOf(keyword);
    if (curIndex === nextIndex) {
      return 0;
    }
    return curIndex < 0 || (curIndex > nextIndex && nextIndex >= 0) ? 1 : -1;
  });
  if (keyword === 'csp') {
    list.push('disable://csp');
  } else if ('upstream'.indexOf(keyword) !== -1) {
    list.push('proxy://', 'xproxy://');
  } else if ('xupstream'.indexOf(keyword) !== -1) {
    list.push('xproxy://');
  } else if ('extend'.indexOf(keyword) !== -1) {
    list.push('reqMerge://', 'resMerge://');
  }
  return list;
}

function getAtValueList(keyword) {
  try {
    const { getAtValueListForWhistle } = window;
    if (typeof getAtValueListForWhistle !== 'function') {
      return;
    }
    const list = getAtValueListForWhistle(keyword);
    if (Array.isArray(list)) {
      const result = [];
      let len = 60;
      list.forEach((item) => {
        if (!item || len < 1) {
          return;
        }
        if (typeof item === 'string') {
          --len;
          result.push(item);
          return;
        }
        const { value } = item;
        if (!value || typeof value !== 'string') {
          return;
        }
        --len;
        const { label } = item;
        if (!label || typeof label !== 'string') {
          result.push(value);
        } else {
          result.push({
            text: value,
            displayText: label,
          });
        }
      });
      return result;
    }
  } catch (e) {}
}

function getPluginVarHints(keyword, isPipe) {
  let list;
  if (isPipe) {
    list = protocols.getAllPluginNameList();
  } else {
    keyword = keyword.substring(1);
    list = protocols.getPluginNameList();
  }
  if (!keyword) {
    return list.map((name) => {
      return isPipe ? `pipe://${name}` : `${name}=`;
    });
  }
  const result = [];
  keyword = keyword.toLowerCase();
  list.forEach((name) => {
    if (isPipe) {
      name = `pipe://${name}`;
    } else {
      name += '=';
    }
    if (name.indexOf(keyword) !== -1) {
      result.push(name);
    }
  });
  return result;
}

function getAtHelpUrl(name, options) {
  try {
    const _getAtHelpUrl = window.getAtHelpUrlForWhistle;
    if (typeof _getAtHelpUrl !== 'function') {
      return;
    }
    const url = _getAtHelpUrl(name, options);
    if (url === false || typeof url === 'string') {
      return url;
    }
  } catch (e) {}
}

const WORD = /\S+/;
let showAtHint;
let showVarHint;
CodeMirror.registerHelper('hint', 'rulesHint', (editor) => {
  showAtHint = false;
  showVarHint = false;
  const byDelete = editor._byDelete || editor._byPlugin;
  const byEnter = editor._byEnter;
  editor._byDelete = false;
  editor._byPlugin = false;
  editor._byEnter = false;
  const cur = editor.getCursor();
  const curLine = editor.getLine(cur.line);
  let end = cur.ch; let start = end; let
    list;
  const commentIndex = curLine.indexOf('#');
  if ((commentIndex !== -1 && commentIndex < start)) {
    return;
  }
  while (start && WORD.test(curLine.charAt(start - 1))) {
    --start;
  }
  const curWord = start !== end && curLine.substring(start, end);
  const isAt = AT_RE.test(curWord);
  let plugin;
  let pluginName;
  let value;
  let pluginVars;
  const isPipe = PIPE_RE.test(curWord);
  let isPluginVar = P_RE.test(curWord);
  if (isPluginVar) {
    const eqIdx = curWord.indexOf('=');
    if (eqIdx !== -1) {
      pluginName = curWord.substring(1, eqIdx);
      plugin = pluginName && protocols.getPlugin(pluginName);
      pluginVars = plugin && plugin.pluginVars;
      if (!pluginVars) {
        return;
      }
      value = curWord.substring(eqIdx + 1);
      isPluginVar = false;
    }
  }
  if (isAt || isPipe || isPluginVar) {
    if (!byEnter || /^pipe:\/\/$/.test(curWord)) {
      list = isAt ? getAtValueList(curWord) : getPluginVarHints(curWord, isPipe);
    }
    if (!list || !list.length) {
      return;
    }
    if (isAt) {
      showAtHint = true;
    } else if (isPluginVar) {
      showVarHint = true;
    }
    return { list, from: CodeMirror.Pos(cur.line, isPipe ? start : start + 1), to: CodeMirror.Pos(cur.line, end) };
  }
  if (curWord) {
    if (curWord.indexOf('//') !== -1 || !NON_SPECAIL_RE.test(curWord)) {
      return;
    }
  } else if (byDelete) {
    return;
  }
  list = getHints(curWord);
  if (!list.length) {
    return;
  }
  let index = curLine.indexOf('://', start);
  let protocol;
  if (index !== -1) {
    index += 3;
    protocol = curLine.substring(start, index);
    // redirect://http://
    if (!/\s/.test(protocol) && (curWord.indexOf('red') !== 0
      || (protocol !== `${curWord}http://` && protocol !== `${curWord}https://`))) {
      end = index;
    }
  } else {
    index = curLine.indexOf(':', start);
    if (index !== -1) {
      ++index;
      protocol = `${curLine.substring(start, index)}//`;
      if (list.indexOf(protocol) !== -1) {
        end = index;
        let curChar = curLine[end];
        if (curChar === '/') {
          end++;
          curChar = curLine[end];
          if (curChar === '/') {
            end++;
          }
        }
      }
    }
  }
  return { list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end) };
});

CodeMirror.commands.autocomplete = function(cm) {
  cm.showHint({
    hint: CodeMirror.hint.rulesHint,
    completeSingle: false,
  });
};

function completeAfter(cm, pred) {
  if (!pred || pred()) {
    setTimeout(() => {
      if (!cm.state.completionActive) {
        cm.showHint({
          hint: CodeMirror.hint.rulesHint,
          completeSingle: false,
        });
      }
    }, 100);
  }
  return CodeMirror.Pass;
}

CHARS.forEach((ch) => {
  extraKeys[ch] = completeAfter;
});

function getFocusRuleName(editor) {
  const activeHint = document.querySelector('li.CodeMirror-hint-active');
  let name = activeHint && activeHint.innerText;
  if (name) {
    if (showAtHint) {
      name = `@${name}`;
    } else if (showVarHint) {
      name = `%${name}`;
    } else {
      const index = name.indexOf(':');
      if (index !== -1) {
        name = name.substring(0, index);
      }
    }
  } else {
    const cur = editor.getCursor();
    let end = cur.ch;
    let curLine = editor.getLine(cur.line).replace(/(#.*|\s+)$/, '');
    const len = curLine.length;
    if (end <= len) {
      let start = end;
      while (--start >= 0) {
        if (/\s/.test(curLine[start])) {
          break;
        }
      }
      ++start;
      while (++end <= len) {
        if (/\s/.test(curLine[end])) {
          break;
        }
      }
      curLine = curLine.slice(start, end);
      if (AT_RE.test(curLine) || P_RE.test(curLine)) {
        name = curLine;
      } else if (PROTOCOL_RE.test(curLine)) {
        name = RegExp.$1;
      }
    }
  }
  return name;
}

exports.getExtraKeys = function() {
  return extraKeys;
};

exports.getHelpUrl = function(editor, options) {
  let name = getFocusRuleName(editor);
  const isVar = P_RE.test(name);
  if (isVar || PIPE_RE.test(name)) {
    name = isVar ? name.substring(1, name.indexOf('=')) : name.substring(7);
    let plugin = name && protocols.getPlugin(name);
    plugin = plugin && plugin.homepage;
    return plugin || `https://avwo.github.io/whistle/plugins.html?plugin=${name}`;
  }
  let url;
  if (AT_RE.test(name)) {
    url = getAtHelpUrl(name.substring(1), options);
    if (url) {
      return url;
    }
  }
  return url === false ? false : protocols.getHelpUrl(name);
};
