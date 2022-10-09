require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/show-hint');
const CodeMirror = require('codemirror');
const protocols = require('./protocols');

const NON_SPECAIL_RE = /[^:/]/;
const PLUGIN_NAME_RE = /^((?:whistle\.)?([a-z\d_-]+):)(\/?$|\/\/)/;
const MAX_HINT_LEN = 512;
const MAX_VAR_LEN = 100;
const AT_RE = /^@/;
const P_RE = /^%/;
const P_VAR_RE = /^%([a-z\d_-]+)[=.]/;
const PLUGIN_SPEC_RE = /^(pipe|sniCallback):/;
const PROTOCOL_RE = /^([^\s:]+):\/\//;
const HINT_TIMEOUT = 120;
let curHintProto;
let curHintValue;
let curHintList;
let hintTimer;
let curHintPos;
let curHintOffset;
let waitingRemoteHints;
let order = 0;
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

function getPluginVarHints(keyword, specProto) {
  let list;
  if (specProto) {
    keyword = keyword.substring(specProto.length + 3);
    list = protocols.getAllPluginNameList().map((name) => {
      return `${specProto}://${name}`;
    });
  } else {
    keyword = keyword.substring(1);
    list = protocols.getPluginVarList();
  }
  if (!keyword) {
    return list;
  }
  keyword = keyword.toLowerCase();
  if (specProto) {
    keyword = `${specProto}://${keyword}`;
  }
  return list.filter((name) => {
    return name.indexOf(keyword) !== -1;
  });
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

function getHintText(protoName, text, isVar, isKey) {
  if (!isVar) {
    return `${protoName}://${text}`;
  }
  return protoName + (isKey ? '.' : '=') + text;
}

function handleRemoteHints(data, editor, protoName, value, isVar) {
  curHintPos = null;
  curHintOffset = 0;
  if (!data || (!Array.isArray(data) && !Array.isArray(data.list))) {
    curHintValue = null;
    curHintProto = null;
    return;
  }
  curHintValue = value;
  curHintProto = protoName;
  let len = 0;
  if (!Array.isArray(data)) {
    curHintPos = data.position;
    curHintOffset = parseInt(data.offset, 10) || 0;
    data = data.list;
  }
  const maxLen = isVar ? MAX_VAR_LEN : MAX_HINT_LEN;
  data.forEach((item) => {
    if (len >= 60) {
      return;
    }
    if (typeof item === 'string') {
      item = getHintText(protoName, item.trim(), isVar);
      if (item.length < maxLen) {
        ++len;
        curHintList.push(item);
      }
    } else if (item) {
      let label; let
        curVal;
      if (typeof item.label === 'string') {
        label = item.label.trim();
      }
      if (!label && typeof item.display === 'string') {
        label = item.display.trim();
      }
      if (typeof item.value === 'string') {
        curVal = getHintText(protoName, item.value.trim(), isVar, item.isKey);
      }
      if (curVal && curVal.length < maxLen) {
        ++len;
        curHintList.push(label && label !== curVal ? {
          displayText: label,
          text: curVal,
        } : curVal);
      }
    }
  });
  if (waitingRemoteHints && len) {
    editor._byPlugin = true;
    editor.execCommand('autocomplete');
  }
}

const WORD = /\S+/;
let showAtHint;
let showVarHint;
CodeMirror.registerHelper('hint', 'rulesHint', (editor) => {
  showAtHint = false;
  showVarHint = false;
  waitingRemoteHints = false;
  const byDelete = editor._byDelete || editor._byPlugin;
  const byEnter = editor._byEnter;
  editor._byDelete = false;
  editor._byPlugin = false;
  editor._byEnter = false;
  const cur = editor.getCursor();
  let curLine = editor.getLine(cur.line);
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
  const specProto = PLUGIN_SPEC_RE.test(curWord) && RegExp.$1;
  let isPluginVar = P_RE.test(curWord);
  if (isPluginVar && P_VAR_RE.test(curWord)) {
    pluginName = RegExp.$1;
    plugin = pluginName && protocols.getPlugin(pluginName);
    pluginVars = plugin && plugin.pluginVars;
    if (!pluginVars) {
      return;
    }
    value = curWord.substring(pluginName.length + 2);
    isPluginVar = false;
  }
  if (isAt || specProto || isPluginVar) {
    if (!byEnter || /^(?:pipe|sniCallback):\/\/$/.test(curWord)) {
      list = isAt ? getAtValueList(curWord) : getPluginVarHints(curWord, specProto);
    }
    if (!list || !list.length) {
      return;
    }
    if (isAt) {
      showAtHint = true;
    } else if (isPluginVar) {
      showVarHint = true;
    }
    return { list, from: CodeMirror.Pos(cur.line, specProto ? start : start + 1), to: CodeMirror.Pos(cur.line, end) };
  }
  if (curWord) {
    if (plugin || PLUGIN_NAME_RE.test(curWord)) {
      plugin = plugin || protocols.getPlugin(RegExp.$2);
      const pluginConf = pluginVars || plugin;
      if (plugin && pluginConf.hintList) {
        if (!pluginVars) {
          value = RegExp.$3 || '';
          value = value.length === 2 ? curWord.substring(curWord.indexOf('//') + 2) : '';
          if (value && (value.length > MAX_HINT_LEN || byEnter)) {
            return;
          }
        } else if (value && (byEnter || value.length > MAX_VAR_LEN)) {
          return;
        }
        clearTimeout(hintTimer);
        const protoName = pluginVars ? `%${pluginName}` : RegExp.$1.slice(0, -1);
        if (Array.isArray(pluginConf.hintList)) {
          if (value) {
            value = value.toLowerCase();
            curHintList = pluginConf.hintList.filter((item) => {
              if (typeof item === 'string') {
                return item.toLowerCase().indexOf(value) !== -1;
              }
              if (item.text.toLowerCase().indexOf(value) !== -1) {
                return true;
              }
              return item.displayText && item.displayText.toLowerCase().indexOf(value) !== -1;
            });
          } else {
            curHintList = pluginConf.hintList;
          }
          if (!curHintList.length) {
            return;
          }
          curHintList = curHintList.map((item) => {
            let hint;
            let text;
            if (typeof item === 'string') {
              text = getHintText(protoName, item, pluginVars);
            } else {
              text = getHintText(protoName, item.text, pluginVars, item.isKey);
              if (item.displayText) {
                text = item.displayText;
                hint = {
                  text,
                  displayText: item.displayText,
                };
              }
            }
            return hint || text;
          });
          curHintPos = '';
          curHintOffset = 0;
          curHintProto = protoName;
          value = curHintValue;
        }
        if (curHintList && curHintList.length && curHintProto === protoName && value === curHintValue) {
          if (commentIndex !== -1) {
            curLine = curLine.substring(0, commentIndex);
          }
          curLine = curLine.substring(start).split(/\s/, 1)[0];
          end = start + curLine.trim().length;
          let from = CodeMirror.Pos(cur.line, start);
          let to = CodeMirror.Pos(cur.line, end);
          let hintList = curHintList;
          const isCursorPos = curHintPos === 'cursor';
          if (curHintOffset || isCursorPos) {
            hintList = hintList.map((item) => {
              const hint = {
                from,
                to,
              };
              if (typeof item === 'string') {
                hint.text = item;
                hint.displayText = item;
              } else {
                hint.text = item.text;
                hint.displayText = item.displayText;
              }
              return hint;
            });
            if (isCursorPos) {
              from = cur;
            }
          }
          if (curHintPos === 'tail') {
            const temp = from;
            from = to;
            to = temp;
          }
          if (curHintOffset) {
            start = Math.max(start, from.ch + curHintOffset);
            if (start > end) {
              start = end;
            }
            from = CodeMirror.Pos(cur.line, start);
          }
          return { list: hintList, from, to };
        }
        waitingRemoteHints = true;
        hintTimer = setTimeout(() => {
          if (!editor._bindedHintEvents) {
            editor._bindedHintEvents = true;
            editor.on('blur', () => {
              waitingRemoteHints = false;
            });
          }
          const curOrder = ++order;
          curHintList = [];
          pluginConf.hintList({
            protocol: protoName,
            value,
          }, (data) => {
            if (curOrder === order) {
              handleRemoteHints(data, editor, protoName, value, pluginVars);
            }
          });
        }, HINT_TIMEOUT);
      }
    }
    if (value || curWord.indexOf('//') !== -1 || !NON_SPECAIL_RE.test(curWord)) {
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
  if (P_VAR_RE.test(name)) {
    name = name.substring(1, RegExp.$1.length + 1);
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
