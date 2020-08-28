const PROTOCOLS = ['rule', 'style', 'pipe', 'plugin', 'host', 'xhost', 'proxy', 'xproxy', 'http-proxy',
  'xhttp-proxy', 'https-proxy', 'xhttps-proxy', 'socks', 'xsocks',
  'pac', 'weinre', 'log', 'filter', 'ignore', 'enable', 'disable', 'delete',
  'urlParams', 'pathReplace', 'method', 'replaceStatus', 'referer', 'auth', 'ua', 'cache',
  'redirect', 'attachment', 'forwardedFor', 'responseFor', 'reqMerge', 'resMerge',
  'reqScript', 'resScript', 'reqDelay', 'resDelay', 'reqSpeed', 'resSpeed',
  'reqHeaders', 'resHeaders', 'trailers', 'reqType', 'resType', 'reqCharset',
  'resCharset', 'reqCookies', 'resCookies', 'reqCors', 'resCors', 'reqPrepend', 'resPrepend',
  'reqBody', 'resBody', 'reqAppend', 'resAppend', 'headerReplace', 'reqReplace', 'resReplace',
  'htmlPrepend', 'htmlBody', 'htmlAppend', 'cssPrepend', 'cssBody',
  'cssAppend', 'jsPrepend', 'jsBody', 'jsAppend', 'reqWrite', 'resWrite',
  'reqWriteRaw', 'resWriteRaw',
];

const WHISTLE_PLUGIN_RE = /^(?:whistle\.)?([a-z\d_-]+)$/;
const innerRules = ['file', 'xfile', 'tpl', 'xtpl', 'rawfile', 'xrawfile', 'statusCode'];
let plugins = {};
let pluginRules = [];
let forwardRules = innerRules.slice();
const webProtocols = ['http', 'https', 'ws', 'wss', 'tunnel'];
let allInnerRules = webProtocols.concat(innerRules).concat(PROTOCOLS.slice(1));
allInnerRules.splice(allInnerRules.indexOf('plugin'), 1);
allInnerRules.splice(allInnerRules.indexOf('reqScript') + 1, 0, 'reqRules');
allInnerRules.splice(allInnerRules.indexOf('resScript') + 1, 0, 'resRules');
allInnerRules = allInnerRules.map(name => `${name}://`);
let allRules = allInnerRules;
allRules.splice(allRules.indexOf('filter://'), 1, 'excludeFilter://', 'includeFilter://');

exports.PROTOCOLS = PROTOCOLS;

exports.setPlugins = (allPlugins) => {
  plugins = {};
  if (!allPlugins) {
    return;
  }
  pluginRules = [];
  forwardRules = innerRules.slice();
  allRules = allInnerRules.slice();
  Object.keys(allPlugins).forEach((name) => {
    if (!WHISTLE_PLUGIN_RE.test(name)) {
      return;
    }
    const shortName = RegExp.$1;
    const helpUrl = allPlugins[name];
    if (helpUrl && typeof helpUrl === 'string') {
      plugins[shortName] = helpUrl;
    }
    forwardRules.push(shortName);
    allRules.push(`${shortName}://`);
    pluginRules.push(`whistle.${shortName}`);
    allRules.push(`whistle.${shortName}://`);
  });
};

exports.getForwardRules = function () {
  return forwardRules;
};

exports.getPluginRules = function () {
  return pluginRules;
};

exports.getAllRules = function () {
  return allRules;
};

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
  return plugins[rule] || plugins[rule.substring(rule.indexOf('.') + 1)] || ROOT_HELP_URL;
};
