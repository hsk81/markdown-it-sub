// Process ~subscript~

'use strict';

// same as UNESCAPE_MD_RE plus a space
var UNESCAPE_RE = /\\([ \\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;


function subscript(state, silent) {
  var found,
      content,
      token,
      max = state.posMax,
      start = state.pos,
      parenthesis = 1;

  if (state.src.charCodeAt(start) !== 0x7e/* ~ */) { return false; }
  if (state.src.charCodeAt(start + 1) !== 0x7b/* { */) { return false; }
  if (silent) { return false; } // don't run any pairs in validation mode
  if (start + 3 >= max) { return false; }

  state.pos = start + 2;

  while (state.pos < max) {
    if (state.src.charCodeAt(state.pos) === 0x7b/* { */) {
      parenthesis += 1;
    }
    if (state.src.charCodeAt(state.pos) === 0x7d/* } */) {
      parenthesis -= 1;
    }
    if (parenthesis === 0) {
      found = true;
      break;
    }
    state.md.inline.skipToken(state);
  }

  if (!found || start + 2 === state.pos) {
    state.pos = start;
    return false;
  }

  content = state.src.slice(start + 2, state.pos);

  // don't allow unescaped newlines inside
  if (content.match(/(^|[^\\])(\\\\)*\n/)) {
    state.pos = start;
    return false;
  }

  // found!
  state.posMax = state.pos;
  state.pos = start + 1;

  token         = state.push('sub_open', 'sub', 1);
  token.markup  = '_{';
  token         = state.push('text', '', 0);
  token.content = content.replace(UNESCAPE_RE, '$1');
  token         = state.push('sub_close', 'sub', -1);
  token.markup  = '}';

  state.pos = state.posMax + 1;
  state.posMax = max;
  return true;
}


module.exports = function sub_plugin(md) {
  md.inline.ruler.after('emphasis', 'sub', subscript);
};
