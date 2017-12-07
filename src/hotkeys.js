//IE?indexOf?????
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (obj) {
    for (var i = 0; i < this.length; i++) if (this[i] === obj) return i;

    return -1;
  };
}

// IE?lastIndexOf?????
if (!Array.prototype.lastIndexOf) {
  Array.prototype.lastIndexOf = function (obj) {
    for (var i = this.length - 1; i >= 0; i--) if (this[i] === obj) return i;

    return -1;
  }
}

var _api, // ??API
  isff = navigator.userAgent.toLowerCase().indexOf('firefox') > 0,
  _keyMap = { // ???
    backspace: 8, tab: 9, clear: 12,
    enter: 13, 'return': 13,
    esc: 27, escape: 27, space: 32,
    left: 37, up: 38, right: 39, down: 40,
    del: 46, 'delete': 46,
    home: 36, end: 35,
    pageup: 33, pagedown: 34, '?': 20, 'capslock': 20,
    ',': 188, '.': 190, '/': 191,
    '`': 192, '-': isff ? 173 : 189, '=': isff ? 61 : 187,
    ';': isff ? 59 : 186, '\'': 222,
    '[': 219, ']': 221, '\\': 220
  },
  _scope = 'all', //??????
  _modifier = { //???
    '?': 16, shift: 16,
    '?': 18, alt: 18, option: 18,
    '?': 17, ctrl: 17, control: 17,
    '?': isff ? 224 : 91, cmd: isff ? 224 : 91, command: isff ? 224 : 91
  },
  _downKeys = [], // ????????
  modifierMap = {
    16: 'shiftKey',
    18: 'altKey',
    17: 'ctrlKey'
  },
  _mods = { 16: false, 18: false, 17: false },
  _handlers = {};

// F1~F12 ???
for (var k = 1; k < 20; k++) {
  _keyMap['f' + k] = 111 + k;
}

// ??Firefox??
modifierMap[isff ? 224 : 91] = 'metaKey';
_mods[isff ? 224 : 91] = false;

// ????
function code(x) { return _keyMap[x.toLowerCase()] || x.toUpperCase().charCodeAt(0); }

// ????????(???'??')
function setScope(scope) { _scope = scope || 'all'; }

// ??????
function getScope() { return _scope || 'all'; }

// ????
function addEvent(object, event, method) {
  if (object.addEventListener) {
    object.addEventListener(event, method, false);
  } else if (object.attachEvent) {
    object.attachEvent('on' + event, function () { method(window.event); });
  }
}

// ????????????,??true??false
function isPressed(keyCode) {
  if (typeof (keyCode) === 'string') {
    keyCode = code(keyCode); // ?????
  }

  return _downKeys.indexOf(keyCode) !== -1;
}

// ??????????
function getPressedKeyCodes() { return _downKeys.slice(0); }

// ??keydown??
function dispatch(event) {
  var key = event.keyCode || event.which || event.charCode,
    scope,
    asterisk = _handlers['*'];

  // ??????
  if (_downKeys.indexOf(key) === -1) _downKeys.push(key);

  // Gecko(Firefox)?command??224,?Webkit(Chrome)?????
  // Webkit??command?????
  if (key === 93 || key === 224) key = 91;

  if (key in _mods) {
    _mods[key] = true;

    // ??????key??? hotkeys ?
    for (var k in _modifier) if (_modifier[k] === key) hotkeys[k] = true;

    if (!asterisk) return;
  }

  // ?modifierMap?????????event?
  for (var e in _mods) _mods[e] = event[modifierMap[e]];

  // ?????? ????????????
  if (!hotkeys.filter.call(this, event)) return;

  // ???? ???all
  scope = getScope();

  // ?????????????
  if (asterisk) {
    for (i = 0; i < asterisk.length; i++) {
      if (asterisk[i].scope === scope) eventHandler(event, asterisk[i], scope);
    }
  }

  // key ??_handlers???
  if (!(key in _handlers)) return;

  for (var i = 0; i < _handlers[key].length; i++) {
    // ??????
    eventHandler(event, _handlers[key][i], scope);
  }
}

// ?????????????????
function eventHandler(event, handler, scope) {
  var modifiersMatch;

  // ?????????
  if (handler.scope === scope || handler.scope === 'all') {
    //?????????(?????true)
    modifiersMatch = handler.mods.length > 0;

    for (var y in _mods) {
      if (
        (!_mods[y] && handler.mods.indexOf(+y) > -1) ||
        (_mods[y] && handler.mods.indexOf(+y) === -1)
      ) modifiersMatch = false;
    }

    // ??????,??????????
    if (
      (handler.mods.length === 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91]) ||
      modifiersMatch ||
      handler.shortcut === '*'
    ) {
      if (handler.method(event, handler) === false) {
        if (event.preventDefault) event.preventDefault();
        else event.returnValue = false;
        if (event.stopPropagation) event.stopPropagation();
        if (event.cancelBubble) event.cancelBubble = true;
      }
    }
  }
}

// ????????????
function unbind(key, scope) {
  var multipleKeys = getKeys(key),
    keys,
    mods = [],
    obj;

  for (var i = 0; i < multipleKeys.length; i++) {
    // ???????????
    keys = multipleKeys[i].split('+');

    // ??????????????? ????
    if (keys.length > 1) mods = getMods(keys);

    // ??????????key
    key = keys[keys.length - 1];
    key = key === '*' ? '*' : code(key);

    // ????????,???????
    if (!scope) scope = getScope();

    // ??key?? _handlers ???????
    if (!_handlers[key]) return;

    // ?? handlers ???,
    // ???????????????????????????
    for (var r = 0; r < _handlers[key].length; r++) {
      obj = _handlers[key][r];

      // ??????????????
      if (
        obj.scope === scope &&
        compareArray(obj.mods, mods)
      ) _handlers[key][r] = {};
    }
  }
}

// ????handlers???? scope(??)
function deleteScope(scope, newScope) {
  var key,
    handlers,
    i;

  // ????scope,??scope
  if (!scope) scope = getScope();

  for (key in _handlers) {
    handlers = _handlers[key];

    for (i = 0; i < handlers.length;) {
      if (handlers[i].scope === scope) handlers.splice(i, 1);
      else i++;
    }
  }

  // ??scope???,?scope???all
  if (getScope() === scope) setScope(newScope || 'all');
}

//????????
function compareArray(a1, a2) {
  var arr1 = a1.length >= a2.length ? a1 : a2
  var arr2 = a1.length >= a2.length ? a2 : a1

  for (var i = 0; i < arr1.length; i++) {
    if (arr2.indexOf(arr1[i]) === -1) return false;
  }

  return true;
}

// ???????? ?? Boolean
function filter(event) {
  var tagName = (event.target || event.srcElement).tagName;

  // ??????????????
  return !(tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA');
}

// ???????????
function getMods(key) {
  var mods = key.slice(0, key.length - 1);

  for (var i = 0; i < mods.length; i++) mods[i] = _modifier[mods[i].toLowerCase()];

  return mods;
}

// ????key????????
function getKeys(key) {
  if (!key) key = '';
  var keys, index;

  key = key.replace(/\s/g, ''); // ????????,??????????????
  keys = key.split(','); // ?????????,?','??
  index = keys.lastIndexOf('');

  // ???????',',?????
  for (; index >= 0;) {
    keys[index - 1] += ',';
    keys.splice(index, 1);
    index = keys.lastIndexOf('');
  }

  return keys;
}

// ???document??????
addEvent(document, 'keydown', function (event) {
  dispatch(event);
});

addEvent(document, 'keyup', function (event) {
  clearModifier(event);
});

// ?????
function clearModifier(event) {
  var key = event.keyCode || event.which || event.charCode,
    i = _downKeys.indexOf(key);

  // ???????????
  if (i >= 0) _downKeys.splice(i, 1);

  // ??? shiftKey altKey ctrlKey (command||metaKey) ??
  if (key === 93 || key === 224) key = 91;
  if (key in _mods) {
    _mods[key] = false;

    // ???????false
    for (var k in _modifier) if (_modifier[k] === key) hotkeys[k] = false;
  }
}

// ??hotkeys??
function hotkeys(key, scope, method) {
  var keys = getKeys(key), // ??????????
    mods = [],
    i = 0;

  // ?????????
  if (method === undefined) {
    method = scope;
    scope = 'all'; // scope???all,???????
  }
  // ???????????
  for (; i < keys.length; i++) {
    key = keys[i].split('+'); // ????
    mods = [];

    // ???????????????
    if (key.length > 1) mods = getMods(key);

    // ??????????
    key = key[key.length - 1];
    key = key === '*' ? '*' : code(key); // *?????????

    // ??key???_handlers?,?????????
    if (!(key in _handlers)) _handlers[key] = [];

    _handlers[key].push({
      shortcut: keys[i],
      scope: scope,
      method: method,
      key: keys[i],
      mods: mods
    });
  }
}

_api = {
  setScope: setScope,
  getScope: getScope,
  deleteScope: deleteScope,
  getPressedKeyCodes: getPressedKeyCodes,
  isPressed: isPressed,
  filter: filter,
  unbind: unbind
};

for (var a in _api) hotkeys[a] = _api[a];

var _hotkeys = window.hotkeys

hotkeys.noConflict = function (deep) {
  if (deep && window.hotkeys === hotkeys) {
    window.hotkeys = _hotkeys;
  }

  return hotkeys;
};

window.hotkeys = hotkeys;

return hotkeys;
