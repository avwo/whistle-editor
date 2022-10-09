const PROTOCOLS = ['rule', 'style', 'pipe', 'plugin', 'host', 'xhost', 'proxy', 'xproxy', 'http-proxy',
  'xhttp-proxy', 'https-proxy', 'xhttps-proxy', 'socks', 'xsocks',
  'pac', 'weinre', 'log', 'filter', 'ignore', 'enable', 'disable', 'delete',
  'urlParams', 'pathReplace', 'method', 'replaceStatus', 'referer', 'auth', 'ua', 'cache',
  'attachment', 'forwardedFor', 'responseFor', 'reqMerge', 'resMerge',
  'reqScript', 'resScript', 'reqDelay', 'resDelay', 'reqSpeed', 'resSpeed',
  'reqHeaders', 'resHeaders', 'trailers', 'reqType', 'resType', 'reqCharset',
  'resCharset', 'reqCookies', 'resCookies', 'reqCors', 'resCors', 'reqPrepend', 'resPrepend',
  'reqBody', 'resBody', 'reqAppend', 'resAppend', 'headerReplace', 'reqReplace', 'resReplace',
  'htmlPrepend', 'htmlBody', 'htmlAppend', 'cssPrepend', 'cssBody',
  'cssAppend', 'jsPrepend', 'jsBody', 'jsAppend', 'reqWrite', 'resWrite',
  'reqWriteRaw', 'resWriteRaw', 'cipher', 'sniCallback',
];


const innerRules = ['file', 'xfile', 'tpl', 'xtpl', 'rawfile', 'xrawfile', 'redirect', 'statusCode'];
let plugins = {};
let pluginRules = [];
let pluginNameList = [];
let pluginVarList = [];
let allPluginNameList = [];
let forwardRules = innerRules.slice();
const webProtocols = ['http', 'https', 'ws', 'wss', 'tunnel'];
let allInnerRules = webProtocols.concat(innerRules).concat(PROTOCOLS.slice(1));
allInnerRules.splice(allInnerRules.indexOf('plugin'), 1);
allInnerRules.splice(allInnerRules.indexOf('reqScript') + 1, 0, 'reqRules');
allInnerRules.splice(allInnerRules.indexOf('resScript') + 1, 0, 'resRules');
allInnerRules = allInnerRules.map((name) => {
  return `${name}://`;
});
allInnerRules.splice(allInnerRules.indexOf('filter://'), 1, 'excludeFilter://', 'includeFilter://');
allInnerRules.push('lineProps://');
let allRules = allInnerRules;
const WHISTLE_PLUGIN_RE = /^(whistle\.)?(?:([a-z\d_-]+))$/;
let pluginHelps = {};

exports.PROTOCOLS = PROTOCOLS;

exports.setPlugins = (allPlugins) => {
  plugins = {};
  pluginHelps = {};
  allPlugins = allPlugins || {};
  pluginRules = [];
  pluginNameList = [];
  pluginVarList = [];
  allPluginNameList = [];
  forwardRules = innerRules.slice();
  allRules = allInnerRules.slice();
  Object.keys(allPlugins).forEach((key) => {
    if (!WHISTLE_PLUGIN_RE.test(key)) {
      return;
    }
    const prefix = RegExp.$1;
    const name = RegExp.$2;
    const plugin = allPlugins[key] || {};
    let homepage = plugin.homepage || plugin.help || plugin;
    if (homepage && typeof homepage === 'string') {
      pluginHelps[key] = homepage;
    } else {
      homepage = undefined;
    }
    plugins[name] = plugins[name] || {};
    plugins[name].homepage = homepage;
    let hintList;
    if (allPluginNameList.indexOf(name) === -1) {
      allPluginNameList.push(name);
      hintList = plugin.hintList;
      if (typeof hintList === 'function' || Array.isArray(hintList)) {
        plugins[name].hintList = hintList;
      }
    }
    const { pluginVars } = plugin;
    if (pluginVars && pluginNameList.indexOf(name) === -1) {
      pluginNameList.push(name);
      plugins[name].pluginVars = {};
      hintList = pluginVars.hintList;
      if (typeof hintList === 'function' || Array.isArray(hintList)) {
        plugins[name].pluginVars.hintList = hintList;
      }
      const { hintSuffix } = pluginVars;
      if (hintSuffix) {
        hintSuffix.forEach((suffix) => {
          pluginVarList.push(`%${name}${suffix}`);
        });
      } else {
        pluginVarList.push(`%${name}=`);
      }
    }
    if (prefix) {
      pluginRules.push(key);
      allRules.push(`${key}://`);
    } else {
      forwardRules.push(key);
      allRules.push(`${key}://`);
    }
  });
};

exports.getForwardRules = function () {
  return forwardRules;
};

exports.getPluginRules = function () {
  return pluginRules;
};

exports.getPluginNameList = function() {
  return pluginNameList;
};

exports.getPluginVarList = function() {
  return pluginVarList;
};

exports.getAllPluginNameList = function() {
  return allPluginNameList;
};

exports.getAllRules = function () {
  return allRules;
};

function getPlugin(rule) {
  return plugins[rule.substring(rule.indexOf('.') + 1)];
}

exports.getPlugin = getPlugin;

const ROOT_HELP_URL = 'https://avwo.github.io/whistle/rules/';
exports.getHelpUrl = function (rule) {
  if (!rule || rule === 'rule') {
    return ROOT_HELP_URL;
  }
  if (rule === 'includeFilter' || rule === 'excludeFilter') {
    return `${ROOT_HELP_URL}filter.html`;
  }
  if (rule === 'reqRules') {
    return `${ROOT_HELP_URL}reqScript.html`;
  }
  if (rule === 'resRules') {
    return `${ROOT_HELP_URL}resScript.html`;
  }
  if (innerRules.indexOf(rule) !== -1) {
    return `${ROOT_HELP_URL}rule/${rule.replace(/^x/, '')}.html`;
  }
  if (webProtocols.indexOf(rule) !== -1) {
    return `${ROOT_HELP_URL}rule/replace.html`;
  }
  if (PROTOCOLS.indexOf(rule) !== -1) {
    return `${ROOT_HELP_URL + rule.replace(/^x/, '')}.html`;
  }
  return pluginHelps[rule] || pluginHelps[rule.substring(rule.indexOf('.') + 1)] || ROOT_HELP_URL;
};
