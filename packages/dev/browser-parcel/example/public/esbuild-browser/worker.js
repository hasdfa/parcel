"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});

// ../../../node_modules/notepack.io/browser/encode.js
var require_encode = __commonJS({
  "../../../node_modules/notepack.io/browser/encode.js"(exports, module2) {
    "use strict";
    var TIMESTAMP32_MAX_SEC = 4294967296 - 1;
    var TIMESTAMP64_MAX_SEC = 17179869184 - 1;
    function utf8Write(view, offset, str) {
      var c = 0;
      for (var i = 0, l = str.length; i < l; i++) {
        c = str.charCodeAt(i);
        if (c < 128) {
          view.setUint8(offset++, c);
        } else if (c < 2048) {
          view.setUint8(offset++, 192 | c >> 6);
          view.setUint8(offset++, 128 | c & 63);
        } else if (c < 55296 || c >= 57344) {
          view.setUint8(offset++, 224 | c >> 12);
          view.setUint8(offset++, 128 | c >> 6 & 63);
          view.setUint8(offset++, 128 | c & 63);
        } else {
          i++;
          c = 65536 + ((c & 1023) << 10 | str.charCodeAt(i) & 1023);
          view.setUint8(offset++, 240 | c >> 18);
          view.setUint8(offset++, 128 | c >> 12 & 63);
          view.setUint8(offset++, 128 | c >> 6 & 63);
          view.setUint8(offset++, 128 | c & 63);
        }
      }
    }
    function utf8Length(str) {
      var c = 0, length = 0;
      for (var i = 0, l = str.length; i < l; i++) {
        c = str.charCodeAt(i);
        if (c < 128) {
          length += 1;
        } else if (c < 2048) {
          length += 2;
        } else if (c < 55296 || c >= 57344) {
          length += 3;
        } else {
          i++;
          length += 4;
        }
      }
      return length;
    }
    function _encode(bytes, defers, value) {
      var type = typeof value, i = 0, l = 0, hi = 0, lo = 0, length = 0, size = 0;
      if (type === "string") {
        length = utf8Length(value);
        if (length < 32) {
          bytes.push(length | 160);
          size = 1;
        } else if (length < 256) {
          bytes.push(217, length);
          size = 2;
        } else if (length < 65536) {
          bytes.push(218, length >> 8, length);
          size = 3;
        } else if (length < 4294967296) {
          bytes.push(219, length >> 24, length >> 16, length >> 8, length);
          size = 5;
        } else {
          throw new Error("String too long");
        }
        defers.push({ _str: value, _length: length, _offset: bytes.length });
        return size + length;
      }
      if (type === "number") {
        if (Math.floor(value) !== value || !isFinite(value)) {
          bytes.push(203);
          defers.push({ _float: value, _length: 8, _offset: bytes.length });
          return 9;
        }
        if (value >= 0) {
          if (value < 128) {
            bytes.push(value);
            return 1;
          }
          if (value < 256) {
            bytes.push(204, value);
            return 2;
          }
          if (value < 65536) {
            bytes.push(205, value >> 8, value);
            return 3;
          }
          if (value < 4294967296) {
            bytes.push(206, value >> 24, value >> 16, value >> 8, value);
            return 5;
          }
          hi = value / Math.pow(2, 32) >> 0;
          lo = value >>> 0;
          bytes.push(207, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
          return 9;
        } else {
          if (value >= -32) {
            bytes.push(value);
            return 1;
          }
          if (value >= -128) {
            bytes.push(208, value);
            return 2;
          }
          if (value >= -32768) {
            bytes.push(209, value >> 8, value);
            return 3;
          }
          if (value >= -2147483648) {
            bytes.push(210, value >> 24, value >> 16, value >> 8, value);
            return 5;
          }
          hi = Math.floor(value / Math.pow(2, 32));
          lo = value >>> 0;
          bytes.push(211, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
          return 9;
        }
      }
      if (type === "object") {
        if (value === null) {
          bytes.push(192);
          return 1;
        }
        if (Array.isArray(value)) {
          length = value.length;
          if (length < 16) {
            bytes.push(length | 144);
            size = 1;
          } else if (length < 65536) {
            bytes.push(220, length >> 8, length);
            size = 3;
          } else if (length < 4294967296) {
            bytes.push(221, length >> 24, length >> 16, length >> 8, length);
            size = 5;
          } else {
            throw new Error("Array too large");
          }
          for (i = 0; i < length; i++) {
            size += _encode(bytes, defers, value[i]);
          }
          return size;
        }
        if (value instanceof Date) {
          var ms = value.getTime();
          var s = Math.floor(ms / 1e3);
          var ns = (ms - s * 1e3) * 1e6;
          if (s >= 0 && ns >= 0 && s <= TIMESTAMP64_MAX_SEC) {
            if (ns === 0 && s <= TIMESTAMP32_MAX_SEC) {
              bytes.push(214, 255, s >> 24, s >> 16, s >> 8, s);
              return 6;
            } else {
              hi = s / 4294967296;
              lo = s & 4294967295;
              bytes.push(215, 255, ns >> 22, ns >> 14, ns >> 6, hi, lo >> 24, lo >> 16, lo >> 8, lo);
              return 10;
            }
          } else {
            hi = Math.floor(s / 4294967296);
            lo = s >>> 0;
            bytes.push(199, 12, 255, ns >> 24, ns >> 16, ns >> 8, ns, hi >> 24, hi >> 16, hi >> 8, hi, lo >> 24, lo >> 16, lo >> 8, lo);
            return 15;
          }
        }
        if (value instanceof ArrayBuffer) {
          length = value.byteLength;
          if (length < 256) {
            bytes.push(196, length);
            size = 2;
          } else if (length < 65536) {
            bytes.push(197, length >> 8, length);
            size = 3;
          } else if (length < 4294967296) {
            bytes.push(198, length >> 24, length >> 16, length >> 8, length);
            size = 5;
          } else {
            throw new Error("Buffer too large");
          }
          defers.push({ _bin: value, _length: length, _offset: bytes.length });
          return size + length;
        }
        if (typeof value.toJSON === "function") {
          return _encode(bytes, defers, value.toJSON());
        }
        var keys = [], key = "";
        var allKeys = Object.keys(value);
        for (i = 0, l = allKeys.length; i < l; i++) {
          key = allKeys[i];
          if (value[key] !== void 0 && typeof value[key] !== "function") {
            keys.push(key);
          }
        }
        length = keys.length;
        if (length < 16) {
          bytes.push(length | 128);
          size = 1;
        } else if (length < 65536) {
          bytes.push(222, length >> 8, length);
          size = 3;
        } else if (length < 4294967296) {
          bytes.push(223, length >> 24, length >> 16, length >> 8, length);
          size = 5;
        } else {
          throw new Error("Object too large");
        }
        for (i = 0; i < length; i++) {
          key = keys[i];
          size += _encode(bytes, defers, key);
          size += _encode(bytes, defers, value[key]);
        }
        return size;
      }
      if (type === "boolean") {
        bytes.push(value ? 195 : 194);
        return 1;
      }
      if (type === "undefined") {
        bytes.push(192);
        return 1;
      }
      if (typeof value.toJSON === "function") {
        return _encode(bytes, defers, value.toJSON());
      }
      throw new Error("Could not encode");
    }
    function encode(value) {
      var bytes = [];
      var defers = [];
      var size = _encode(bytes, defers, value);
      var buf = new ArrayBuffer(size);
      var view = new DataView(buf);
      var deferIndex = 0;
      var deferWritten = 0;
      var nextOffset = -1;
      if (defers.length > 0) {
        nextOffset = defers[0]._offset;
      }
      var defer, deferLength = 0, offset = 0;
      for (var i = 0, l = bytes.length; i < l; i++) {
        view.setUint8(deferWritten + i, bytes[i]);
        if (i + 1 !== nextOffset) {
          continue;
        }
        defer = defers[deferIndex];
        deferLength = defer._length;
        offset = deferWritten + nextOffset;
        if (defer._bin) {
          var bin = new Uint8Array(defer._bin);
          for (var j = 0; j < deferLength; j++) {
            view.setUint8(offset + j, bin[j]);
          }
        } else if (defer._str) {
          utf8Write(view, offset, defer._str);
        } else if (defer._float !== void 0) {
          view.setFloat64(offset, defer._float);
        }
        deferIndex++;
        deferWritten += deferLength;
        if (defers[deferIndex]) {
          nextOffset = defers[deferIndex]._offset;
        }
      }
      return buf;
    }
    module2.exports = encode;
  }
});

// ../../../node_modules/notepack.io/browser/decode.js
var require_decode = __commonJS({
  "../../../node_modules/notepack.io/browser/decode.js"(exports, module2) {
    "use strict";
    function Decoder(buffer) {
      this._offset = 0;
      if (buffer instanceof ArrayBuffer) {
        this._buffer = buffer;
        this._view = new DataView(this._buffer);
      } else if (ArrayBuffer.isView(buffer)) {
        this._buffer = buffer.buffer;
        this._view = new DataView(this._buffer, buffer.byteOffset, buffer.byteLength);
      } else {
        throw new Error("Invalid argument");
      }
    }
    function utf8Read(view, offset, length) {
      var string = "", chr = 0;
      for (var i = offset, end = offset + length; i < end; i++) {
        var byte = view.getUint8(i);
        if ((byte & 128) === 0) {
          string += String.fromCharCode(byte);
          continue;
        }
        if ((byte & 224) === 192) {
          string += String.fromCharCode(
            (byte & 31) << 6 | view.getUint8(++i) & 63
          );
          continue;
        }
        if ((byte & 240) === 224) {
          string += String.fromCharCode(
            (byte & 15) << 12 | (view.getUint8(++i) & 63) << 6 | (view.getUint8(++i) & 63) << 0
          );
          continue;
        }
        if ((byte & 248) === 240) {
          chr = (byte & 7) << 18 | (view.getUint8(++i) & 63) << 12 | (view.getUint8(++i) & 63) << 6 | (view.getUint8(++i) & 63) << 0;
          if (chr >= 65536) {
            chr -= 65536;
            string += String.fromCharCode((chr >>> 10) + 55296, (chr & 1023) + 56320);
          } else {
            string += String.fromCharCode(chr);
          }
          continue;
        }
        throw new Error("Invalid byte " + byte.toString(16));
      }
      return string;
    }
    Decoder.prototype._array = function(length) {
      var value = new Array(length);
      for (var i = 0; i < length; i++) {
        value[i] = this._parse();
      }
      return value;
    };
    Decoder.prototype._map = function(length) {
      var key = "", value = {};
      for (var i = 0; i < length; i++) {
        key = this._parse();
        value[key] = this._parse();
      }
      return value;
    };
    Decoder.prototype._str = function(length) {
      var value = utf8Read(this._view, this._offset, length);
      this._offset += length;
      return value;
    };
    Decoder.prototype._bin = function(length) {
      var value = this._buffer.slice(this._offset, this._offset + length);
      this._offset += length;
      return value;
    };
    Decoder.prototype._parse = function() {
      var prefix = this._view.getUint8(this._offset++);
      var value, length = 0, type = 0, hi = 0, lo = 0;
      if (prefix < 192) {
        if (prefix < 128) {
          return prefix;
        }
        if (prefix < 144) {
          return this._map(prefix & 15);
        }
        if (prefix < 160) {
          return this._array(prefix & 15);
        }
        return this._str(prefix & 31);
      }
      if (prefix > 223) {
        return (255 - prefix + 1) * -1;
      }
      switch (prefix) {
        // nil
        case 192:
          return null;
        // false
        case 194:
          return false;
        // true
        case 195:
          return true;
        // bin
        case 196:
          length = this._view.getUint8(this._offset);
          this._offset += 1;
          return this._bin(length);
        case 197:
          length = this._view.getUint16(this._offset);
          this._offset += 2;
          return this._bin(length);
        case 198:
          length = this._view.getUint32(this._offset);
          this._offset += 4;
          return this._bin(length);
        // ext
        case 199:
          length = this._view.getUint8(this._offset);
          type = this._view.getInt8(this._offset + 1);
          this._offset += 2;
          if (type === -1) {
            var ns = this._view.getUint32(this._offset);
            hi = this._view.getInt32(this._offset + 4);
            lo = this._view.getUint32(this._offset + 8);
            this._offset += 12;
            return new Date((hi * 4294967296 + lo) * 1e3 + ns / 1e6);
          }
          return [type, this._bin(length)];
        case 200:
          length = this._view.getUint16(this._offset);
          type = this._view.getInt8(this._offset + 2);
          this._offset += 3;
          return [type, this._bin(length)];
        case 201:
          length = this._view.getUint32(this._offset);
          type = this._view.getInt8(this._offset + 4);
          this._offset += 5;
          return [type, this._bin(length)];
        // float
        case 202:
          value = this._view.getFloat32(this._offset);
          this._offset += 4;
          return value;
        case 203:
          value = this._view.getFloat64(this._offset);
          this._offset += 8;
          return value;
        // uint
        case 204:
          value = this._view.getUint8(this._offset);
          this._offset += 1;
          return value;
        case 205:
          value = this._view.getUint16(this._offset);
          this._offset += 2;
          return value;
        case 206:
          value = this._view.getUint32(this._offset);
          this._offset += 4;
          return value;
        case 207:
          hi = this._view.getUint32(this._offset) * Math.pow(2, 32);
          lo = this._view.getUint32(this._offset + 4);
          this._offset += 8;
          return hi + lo;
        // int
        case 208:
          value = this._view.getInt8(this._offset);
          this._offset += 1;
          return value;
        case 209:
          value = this._view.getInt16(this._offset);
          this._offset += 2;
          return value;
        case 210:
          value = this._view.getInt32(this._offset);
          this._offset += 4;
          return value;
        case 211:
          hi = this._view.getInt32(this._offset) * Math.pow(2, 32);
          lo = this._view.getUint32(this._offset + 4);
          this._offset += 8;
          return hi + lo;
        // fixext
        case 212:
          type = this._view.getInt8(this._offset);
          this._offset += 1;
          if (type === 0) {
            this._offset += 1;
            return void 0;
          }
          return [type, this._bin(1)];
        case 213:
          type = this._view.getInt8(this._offset);
          this._offset += 1;
          return [type, this._bin(2)];
        case 214:
          type = this._view.getInt8(this._offset);
          this._offset += 1;
          if (type === -1) {
            value = this._view.getUint32(this._offset);
            this._offset += 4;
            return new Date(value * 1e3);
          }
          return [type, this._bin(4)];
        case 215:
          type = this._view.getInt8(this._offset);
          this._offset += 1;
          if (type === 0) {
            hi = this._view.getInt32(this._offset) * Math.pow(2, 32);
            lo = this._view.getUint32(this._offset + 4);
            this._offset += 8;
            return new Date(hi + lo);
          }
          if (type === -1) {
            hi = this._view.getUint32(this._offset);
            lo = this._view.getUint32(this._offset + 4);
            this._offset += 8;
            var s = (hi & 3) * 4294967296 + lo;
            return new Date(s * 1e3 + (hi >>> 2) / 1e6);
          }
          return [type, this._bin(8)];
        case 216:
          type = this._view.getInt8(this._offset);
          this._offset += 1;
          return [type, this._bin(16)];
        // str
        case 217:
          length = this._view.getUint8(this._offset);
          this._offset += 1;
          return this._str(length);
        case 218:
          length = this._view.getUint16(this._offset);
          this._offset += 2;
          return this._str(length);
        case 219:
          length = this._view.getUint32(this._offset);
          this._offset += 4;
          return this._str(length);
        // array
        case 220:
          length = this._view.getUint16(this._offset);
          this._offset += 2;
          return this._array(length);
        case 221:
          length = this._view.getUint32(this._offset);
          this._offset += 4;
          return this._array(length);
        // map
        case 222:
          length = this._view.getUint16(this._offset);
          this._offset += 2;
          return this._map(length);
        case 223:
          length = this._view.getUint32(this._offset);
          this._offset += 4;
          return this._map(length);
      }
      throw new Error("Could not parse");
    };
    function decode(buffer) {
      var decoder2 = new Decoder(buffer);
      var value = decoder2._parse();
      if (decoder2._offset !== buffer.byteLength) {
        throw new Error(buffer.byteLength - decoder2._offset + " trailing bytes");
      }
      return value;
    }
    module2.exports = decode;
  }
});

// ../../../node_modules/notepack.io/lib/index.js
var require_lib = __commonJS({
  "../../../node_modules/notepack.io/lib/index.js"(exports) {
    exports.encode = require_encode();
    exports.decode = require_decode();
  }
});

// ../../../node_modules/p-queue/node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "../../../node_modules/p-queue/node_modules/eventemitter3/index.js"(exports, module2) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter2() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0) return names;
      for (name in events = this._events) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter2.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter2.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter2.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter2.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
    EventEmitter2.prefixed = prefix;
    EventEmitter2.EventEmitter = EventEmitter2;
    if ("undefined" !== typeof module2) {
      module2.exports = EventEmitter2;
    }
  }
});

// ../../../node_modules/base64-js/index.js
var require_base64_js = __commonJS({
  "../../../node_modules/base64-js/index.js"(exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1) validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      return arr;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
        );
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
  }
});

// ../../../node_modules/ieee754/index.js
var require_ieee754 = __commonJS({
  "../../../node_modules/ieee754/index.js"(exports) {
    exports.read = function(buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? nBytes - 1 : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];
      i += d;
      e = s & (1 << -nBits) - 1;
      s >>= -nBits;
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      m = e & (1 << -nBits) - 1;
      e >>= -nBits;
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : (s ? -1 : 1) * Infinity;
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };
    exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
      var i = isLE ? 0 : nBytes - 1;
      var d = isLE ? 1 : -1;
      var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
      value = Math.abs(value);
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }
        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }
      for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
      }
      e = e << mLen | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
      }
      buffer[offset + i - d] |= s * 128;
    };
  }
});

// node_modules/buffer/index.js
var require_buffer = __commonJS({
  "node_modules/buffer/index.js"(exports) {
    "use strict";
    var base64 = require_base64_js();
    var ieee754 = require_ieee754();
    var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
    exports.Buffer = Buffer3;
    exports.SlowBuffer = SlowBuffer;
    exports.INSPECT_MAX_BYTES = 50;
    var K_MAX_LENGTH = 2147483647;
    exports.kMaxLength = K_MAX_LENGTH;
    Buffer3.TYPED_ARRAY_SUPPORT = typedArraySupport();
    if (!Buffer3.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
      );
    }
    function typedArraySupport() {
      try {
        const arr = new Uint8Array(1);
        const proto = { foo: function() {
          return 42;
        } };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
      } catch (e) {
        return false;
      }
    }
    Object.defineProperty(Buffer3.prototype, "parent", {
      enumerable: true,
      get: function() {
        if (!Buffer3.isBuffer(this)) return void 0;
        return this.buffer;
      }
    });
    Object.defineProperty(Buffer3.prototype, "offset", {
      enumerable: true,
      get: function() {
        if (!Buffer3.isBuffer(this)) return void 0;
        return this.byteOffset;
      }
    });
    function createBuffer(length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"');
      }
      const buf = new Uint8Array(length);
      Object.setPrototypeOf(buf, Buffer3.prototype);
      return buf;
    }
    function Buffer3(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        if (typeof encodingOrOffset === "string") {
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
        }
        return allocUnsafe(arg);
      }
      return from(arg, encodingOrOffset, length);
    }
    Buffer3.poolSize = 8192;
    function from(value, encodingOrOffset, length) {
      if (typeof value === "string") {
        return fromString(value, encodingOrOffset);
      }
      if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
      }
      if (value == null) {
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof value === "number") {
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        );
      }
      const valueOf = value.valueOf && value.valueOf();
      if (valueOf != null && valueOf !== value) {
        return Buffer3.from(valueOf, encodingOrOffset, length);
      }
      const b = fromObject(value);
      if (b) return b;
      if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
        return Buffer3.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
      }
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
      );
    }
    Buffer3.from = function(value, encodingOrOffset, length) {
      return from(value, encodingOrOffset, length);
    };
    Object.setPrototypeOf(Buffer3.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(Buffer3, Uint8Array);
    function assertSize(size) {
      if (typeof size !== "number") {
        throw new TypeError('"size" argument must be of type number');
      } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
      }
    }
    function alloc(size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(size);
      }
      if (fill !== void 0) {
        return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
      }
      return createBuffer(size);
    }
    Buffer3.alloc = function(size, fill, encoding) {
      return alloc(size, fill, encoding);
    };
    function allocUnsafe(size) {
      assertSize(size);
      return createBuffer(size < 0 ? 0 : checked(size) | 0);
    }
    Buffer3.allocUnsafe = function(size) {
      return allocUnsafe(size);
    };
    Buffer3.allocUnsafeSlow = function(size) {
      return allocUnsafe(size);
    };
    function fromString(string, encoding) {
      if (typeof encoding !== "string" || encoding === "") {
        encoding = "utf8";
      }
      if (!Buffer3.isEncoding(encoding)) {
        throw new TypeError("Unknown encoding: " + encoding);
      }
      const length = byteLength(string, encoding) | 0;
      let buf = createBuffer(length);
      const actual = buf.write(string, encoding);
      if (actual !== length) {
        buf = buf.slice(0, actual);
      }
      return buf;
    }
    function fromArrayLike(array) {
      const length = array.length < 0 ? 0 : checked(array.length) | 0;
      const buf = createBuffer(length);
      for (let i = 0; i < length; i += 1) {
        buf[i] = array[i] & 255;
      }
      return buf;
    }
    function fromArrayView(arrayView) {
      if (isInstance(arrayView, Uint8Array)) {
        const copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
      }
      return fromArrayLike(arrayView);
    }
    function fromArrayBuffer(array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
      }
      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
      }
      let buf;
      if (byteOffset === void 0 && length === void 0) {
        buf = new Uint8Array(array);
      } else if (length === void 0) {
        buf = new Uint8Array(array, byteOffset);
      } else {
        buf = new Uint8Array(array, byteOffset, length);
      }
      Object.setPrototypeOf(buf, Buffer3.prototype);
      return buf;
    }
    function fromObject(obj) {
      if (Buffer3.isBuffer(obj)) {
        const len = checked(obj.length) | 0;
        const buf = createBuffer(len);
        if (buf.length === 0) {
          return buf;
        }
        obj.copy(buf, 0, 0, len);
        return buf;
      }
      if (obj.length !== void 0) {
        if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
          return createBuffer(0);
        }
        return fromArrayLike(obj);
      }
      if (obj.type === "Buffer" && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
      }
    }
    function checked(length) {
      if (length >= K_MAX_LENGTH) {
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
      }
      return length | 0;
    }
    function SlowBuffer(length) {
      if (+length != length) {
        length = 0;
      }
      return Buffer3.alloc(+length);
    }
    Buffer3.isBuffer = function isBuffer(b) {
      return b != null && b._isBuffer === true && b !== Buffer3.prototype;
    };
    Buffer3.compare = function compare(a, b) {
      if (isInstance(a, Uint8Array)) a = Buffer3.from(a, a.offset, a.byteLength);
      if (isInstance(b, Uint8Array)) b = Buffer3.from(b, b.offset, b.byteLength);
      if (!Buffer3.isBuffer(a) || !Buffer3.isBuffer(b)) {
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
      }
      if (a === b) return 0;
      let x = a.length;
      let y = b.length;
      for (let i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    Buffer3.isEncoding = function isEncoding(encoding) {
      switch (String(encoding).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return true;
        default:
          return false;
      }
    };
    Buffer3.concat = function concat(list, length) {
      if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }
      if (list.length === 0) {
        return Buffer3.alloc(0);
      }
      let i;
      if (length === void 0) {
        length = 0;
        for (i = 0; i < list.length; ++i) {
          length += list[i].length;
        }
      }
      const buffer = Buffer3.allocUnsafe(length);
      let pos = 0;
      for (i = 0; i < list.length; ++i) {
        let buf = list[i];
        if (isInstance(buf, Uint8Array)) {
          if (pos + buf.length > buffer.length) {
            if (!Buffer3.isBuffer(buf)) buf = Buffer3.from(buf);
            buf.copy(buffer, pos);
          } else {
            Uint8Array.prototype.set.call(
              buffer,
              buf,
              pos
            );
          }
        } else if (!Buffer3.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
          buf.copy(buffer, pos);
        }
        pos += buf.length;
      }
      return buffer;
    };
    function byteLength(string, encoding) {
      if (Buffer3.isBuffer(string)) {
        return string.length;
      }
      if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength;
      }
      if (typeof string !== "string") {
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
        );
      }
      const len = string.length;
      const mustMatch = arguments.length > 2 && arguments[2] === true;
      if (!mustMatch && len === 0) return 0;
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "ascii":
          case "latin1":
          case "binary":
            return len;
          case "utf8":
          case "utf-8":
            return utf8ToBytes(string).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return len * 2;
          case "hex":
            return len >>> 1;
          case "base64":
            return base64ToBytes(string).length;
          default:
            if (loweredCase) {
              return mustMatch ? -1 : utf8ToBytes(string).length;
            }
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer3.byteLength = byteLength;
    function slowToString(encoding, start, end) {
      let loweredCase = false;
      if (start === void 0 || start < 0) {
        start = 0;
      }
      if (start > this.length) {
        return "";
      }
      if (end === void 0 || end > this.length) {
        end = this.length;
      }
      if (end <= 0) {
        return "";
      }
      end >>>= 0;
      start >>>= 0;
      if (end <= start) {
        return "";
      }
      if (!encoding) encoding = "utf8";
      while (true) {
        switch (encoding) {
          case "hex":
            return hexSlice(this, start, end);
          case "utf8":
          case "utf-8":
            return utf8Slice(this, start, end);
          case "ascii":
            return asciiSlice(this, start, end);
          case "latin1":
          case "binary":
            return latin1Slice(this, start, end);
          case "base64":
            return base64Slice(this, start, end);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return utf16leSlice(this, start, end);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = (encoding + "").toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer3.prototype._isBuffer = true;
    function swap(b, n, m) {
      const i = b[n];
      b[n] = b[m];
      b[m] = i;
    }
    Buffer3.prototype.swap16 = function swap16() {
      const len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 16-bits");
      }
      for (let i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this;
    };
    Buffer3.prototype.swap32 = function swap32() {
      const len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      }
      for (let i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this;
    };
    Buffer3.prototype.swap64 = function swap64() {
      const len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      }
      for (let i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this;
    };
    Buffer3.prototype.toString = function toString() {
      const length = this.length;
      if (length === 0) return "";
      if (arguments.length === 0) return utf8Slice(this, 0, length);
      return slowToString.apply(this, arguments);
    };
    Buffer3.prototype.toLocaleString = Buffer3.prototype.toString;
    Buffer3.prototype.equals = function equals(b) {
      if (!Buffer3.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
      if (this === b) return true;
      return Buffer3.compare(this, b) === 0;
    };
    Buffer3.prototype.inspect = function inspect() {
      let str = "";
      const max = exports.INSPECT_MAX_BYTES;
      str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
      if (this.length > max) str += " ... ";
      return "<Buffer " + str + ">";
    };
    if (customInspectSymbol) {
      Buffer3.prototype[customInspectSymbol] = Buffer3.prototype.inspect;
    }
    Buffer3.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
      if (isInstance(target, Uint8Array)) {
        target = Buffer3.from(target, target.offset, target.byteLength);
      }
      if (!Buffer3.isBuffer(target)) {
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
        );
      }
      if (start === void 0) {
        start = 0;
      }
      if (end === void 0) {
        end = target ? target.length : 0;
      }
      if (thisStart === void 0) {
        thisStart = 0;
      }
      if (thisEnd === void 0) {
        thisEnd = this.length;
      }
      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError("out of range index");
      }
      if (thisStart >= thisEnd && start >= end) {
        return 0;
      }
      if (thisStart >= thisEnd) {
        return -1;
      }
      if (start >= end) {
        return 1;
      }
      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;
      if (this === target) return 0;
      let x = thisEnd - thisStart;
      let y = end - start;
      const len = Math.min(x, y);
      const thisCopy = this.slice(thisStart, thisEnd);
      const targetCopy = target.slice(start, end);
      for (let i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
      if (buffer.length === 0) return -1;
      if (typeof byteOffset === "string") {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 2147483647) {
        byteOffset = 2147483647;
      } else if (byteOffset < -2147483648) {
        byteOffset = -2147483648;
      }
      byteOffset = +byteOffset;
      if (numberIsNaN(byteOffset)) {
        byteOffset = dir ? 0 : buffer.length - 1;
      }
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1;
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1;
      }
      if (typeof val === "string") {
        val = Buffer3.from(val, encoding);
      }
      if (Buffer3.isBuffer(val)) {
        if (val.length === 0) {
          return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
      } else if (typeof val === "number") {
        val = val & 255;
        if (typeof Uint8Array.prototype.indexOf === "function") {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
          }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
      }
      throw new TypeError("val must be string, number or Buffer");
    }
    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
      let indexSize = 1;
      let arrLength = arr.length;
      let valLength = val.length;
      if (encoding !== void 0) {
        encoding = String(encoding).toLowerCase();
        if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
          if (arr.length < 2 || val.length < 2) {
            return -1;
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }
      function read2(buf, i2) {
        if (indexSize === 1) {
          return buf[i2];
        } else {
          return buf.readUInt16BE(i2 * indexSize);
        }
      }
      let i;
      if (dir) {
        let foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read2(arr, i) === read2(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          let found = true;
          for (let j = 0; j < valLength; j++) {
            if (read2(arr, i + j) !== read2(val, j)) {
              found = false;
              break;
            }
          }
          if (found) return i;
        }
      }
      return -1;
    }
    Buffer3.prototype.includes = function includes(val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1;
    };
    Buffer3.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
    };
    Buffer3.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
    };
    function hexWrite(buf, string, offset, length) {
      offset = Number(offset) || 0;
      const remaining = buf.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }
      const strLen = string.length;
      if (length > strLen / 2) {
        length = strLen / 2;
      }
      let i;
      for (i = 0; i < length; ++i) {
        const parsed = parseInt(string.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf[offset + i] = parsed;
      }
      return i;
    }
    function utf8Write(buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
    }
    function asciiWrite(buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length);
    }
    function base64Write(buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length);
    }
    function ucs2Write(buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
    }
    Buffer3.prototype.write = function write(string, offset, length, encoding) {
      if (offset === void 0) {
        encoding = "utf8";
        length = this.length;
        offset = 0;
      } else if (length === void 0 && typeof offset === "string") {
        encoding = offset;
        length = this.length;
        offset = 0;
      } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length)) {
          length = length >>> 0;
          if (encoding === void 0) encoding = "utf8";
        } else {
          encoding = length;
          length = void 0;
        }
      } else {
        throw new Error(
          "Buffer.write(string, encoding, offset[, length]) is no longer supported"
        );
      }
      const remaining = this.length - offset;
      if (length === void 0 || length > remaining) length = remaining;
      if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
        throw new RangeError("Attempt to write outside buffer bounds");
      }
      if (!encoding) encoding = "utf8";
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "hex":
            return hexWrite(this, string, offset, length);
          case "utf8":
          case "utf-8":
            return utf8Write(this, string, offset, length);
          case "ascii":
          case "latin1":
          case "binary":
            return asciiWrite(this, string, offset, length);
          case "base64":
            return base64Write(this, string, offset, length);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return ucs2Write(this, string, offset, length);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };
    Buffer3.prototype.toJSON = function toJSON() {
      return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };
    function base64Slice(buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64.fromByteArray(buf);
      } else {
        return base64.fromByteArray(buf.slice(start, end));
      }
    }
    function utf8Slice(buf, start, end) {
      end = Math.min(buf.length, end);
      const res = [];
      let i = start;
      while (i < end) {
        const firstByte = buf[i];
        let codePoint = null;
        let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
        if (i + bytesPerSequence <= end) {
          let secondByte, thirdByte, fourthByte, tempCodePoint;
          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 128) {
                codePoint = firstByte;
              }
              break;
            case 2:
              secondByte = buf[i + 1];
              if ((secondByte & 192) === 128) {
                tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                if (tempCodePoint > 127) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }
        if (codePoint === null) {
          codePoint = 65533;
          bytesPerSequence = 1;
        } else if (codePoint > 65535) {
          codePoint -= 65536;
          res.push(codePoint >>> 10 & 1023 | 55296);
          codePoint = 56320 | codePoint & 1023;
        }
        res.push(codePoint);
        i += bytesPerSequence;
      }
      return decodeCodePointsArray(res);
    }
    var MAX_ARGUMENTS_LENGTH = 4096;
    function decodeCodePointsArray(codePoints) {
      const len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints);
      }
      let res = "";
      let i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
      }
      return res;
    }
    function asciiSlice(buf, start, end) {
      let ret = "";
      end = Math.min(buf.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 127);
      }
      return ret;
    }
    function latin1Slice(buf, start, end) {
      let ret = "";
      end = Math.min(buf.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
      }
      return ret;
    }
    function hexSlice(buf, start, end) {
      const len = buf.length;
      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;
      let out = "";
      for (let i = start; i < end; ++i) {
        out += hexSliceLookupTable[buf[i]];
      }
      return out;
    }
    function utf16leSlice(buf, start, end) {
      const bytes = buf.slice(start, end);
      let res = "";
      for (let i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res;
    }
    Buffer3.prototype.slice = function slice(start, end) {
      const len = this.length;
      start = ~~start;
      end = end === void 0 ? len : ~~end;
      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }
      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }
      if (end < start) end = start;
      const newBuf = this.subarray(start, end);
      Object.setPrototypeOf(newBuf, Buffer3.prototype);
      return newBuf;
    };
    function checkOffset(offset, ext, length) {
      if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
      if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
    }
    Buffer3.prototype.readUintLE = Buffer3.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      return val;
    };
    Buffer3.prototype.readUintBE = Buffer3.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        checkOffset(offset, byteLength2, this.length);
      }
      let val = this[offset + --byteLength2];
      let mul = 1;
      while (byteLength2 > 0 && (mul *= 256)) {
        val += this[offset + --byteLength2] * mul;
      }
      return val;
    };
    Buffer3.prototype.readUint8 = Buffer3.prototype.readUInt8 = function readUInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset];
    };
    Buffer3.prototype.readUint16LE = Buffer3.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | this[offset + 1] << 8;
    };
    Buffer3.prototype.readUint16BE = Buffer3.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] << 8 | this[offset + 1];
    };
    Buffer3.prototype.readUint32LE = Buffer3.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
    };
    Buffer3.prototype.readUint32BE = Buffer3.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
    };
    Buffer3.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
      const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
      return BigInt(lo) + (BigInt(hi) << BigInt(32));
    });
    Buffer3.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
      return (BigInt(hi) << BigInt(32)) + BigInt(lo);
    });
    Buffer3.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer3.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let i = byteLength2;
      let mul = 1;
      let val = this[offset + --i];
      while (i > 0 && (mul *= 256)) {
        val += this[offset + --i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer3.prototype.readInt8 = function readInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 128)) return this[offset];
      return (255 - this[offset] + 1) * -1;
    };
    Buffer3.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset] | this[offset + 1] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer3.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset + 1] | this[offset] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer3.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
    };
    Buffer3.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
    };
    Buffer3.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
      return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
    });
    Buffer3.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first = this[offset];
      const last = this[offset + 7];
      if (first === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = (first << 24) + // Overflow
      this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
    });
    Buffer3.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, true, 23, 4);
    };
    Buffer3.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, false, 23, 4);
    };
    Buffer3.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, true, 52, 8);
    };
    Buffer3.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, false, 52, 8);
    };
    function checkInt(buf, value, offset, ext, max, min) {
      if (!Buffer3.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
      if (offset + ext > buf.length) throw new RangeError("Index out of range");
    }
    Buffer3.prototype.writeUintLE = Buffer3.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let mul = 1;
      let i = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeUintBE = Buffer3.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeUint8 = Buffer3.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer3.prototype.writeUint16LE = Buffer3.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer3.prototype.writeUint16BE = Buffer3.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer3.prototype.writeUint32LE = Buffer3.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 255;
      return offset + 4;
    };
    Buffer3.prototype.writeUint32BE = Buffer3.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    function wrtBigUInt64LE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      return offset;
    }
    function wrtBigUInt64BE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf[offset + 7] = lo;
      lo = lo >> 8;
      buf[offset + 6] = lo;
      lo = lo >> 8;
      buf[offset + 5] = lo;
      lo = lo >> 8;
      buf[offset + 4] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf[offset + 3] = hi;
      hi = hi >> 8;
      buf[offset + 2] = hi;
      hi = hi >> 8;
      buf[offset + 1] = hi;
      hi = hi >> 8;
      buf[offset] = hi;
      return offset + 8;
    }
    Buffer3.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer3.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer3.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = 0;
      let mul = 1;
      let sub = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      let sub = 0;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer3.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
      if (value < 0) value = 255 + value + 1;
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer3.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer3.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer3.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
      return offset + 4;
    };
    Buffer3.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      if (value < 0) value = 4294967295 + value + 1;
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    Buffer3.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    Buffer3.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    function checkIEEE754(buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError("Index out of range");
      if (offset < 0) throw new RangeError("Index out of range");
    }
    function writeFloat(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
      }
      ieee754.write(buf, value, offset, littleEndian, 23, 4);
      return offset + 4;
    }
    Buffer3.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert);
    };
    Buffer3.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert);
    };
    function writeDouble(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
      }
      ieee754.write(buf, value, offset, littleEndian, 52, 8);
      return offset + 8;
    }
    Buffer3.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert);
    };
    Buffer3.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert);
    };
    Buffer3.prototype.copy = function copy(target, targetStart, start, end) {
      if (!Buffer3.isBuffer(target)) throw new TypeError("argument should be a Buffer");
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;
      if (end === start) return 0;
      if (target.length === 0 || this.length === 0) return 0;
      if (targetStart < 0) {
        throw new RangeError("targetStart out of bounds");
      }
      if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
      if (end < 0) throw new RangeError("sourceEnd out of bounds");
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }
      const len = end - start;
      if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
        this.copyWithin(targetStart, start, end);
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        );
      }
      return len;
    };
    Buffer3.prototype.fill = function fill(val, start, end, encoding) {
      if (typeof val === "string") {
        if (typeof start === "string") {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === "string") {
          encoding = end;
          end = this.length;
        }
        if (encoding !== void 0 && typeof encoding !== "string") {
          throw new TypeError("encoding must be a string");
        }
        if (typeof encoding === "string" && !Buffer3.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        if (val.length === 1) {
          const code = val.charCodeAt(0);
          if (encoding === "utf8" && code < 128 || encoding === "latin1") {
            val = code;
          }
        }
      } else if (typeof val === "number") {
        val = val & 255;
      } else if (typeof val === "boolean") {
        val = Number(val);
      }
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError("Out of range index");
      }
      if (end <= start) {
        return this;
      }
      start = start >>> 0;
      end = end === void 0 ? this.length : end >>> 0;
      if (!val) val = 0;
      let i;
      if (typeof val === "number") {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        const bytes = Buffer3.isBuffer(val) ? val : Buffer3.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
          throw new TypeError('The value "' + val + '" is invalid for argument "value"');
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }
      return this;
    };
    var errors = {};
    function E(sym, getMessage, Base) {
      errors[sym] = class NodeError extends Base {
        constructor() {
          super();
          Object.defineProperty(this, "message", {
            value: getMessage.apply(this, arguments),
            writable: true,
            configurable: true
          });
          this.name = `${this.name} [${sym}]`;
          this.stack;
          delete this.name;
        }
        get code() {
          return sym;
        }
        set code(value) {
          Object.defineProperty(this, "code", {
            configurable: true,
            enumerable: true,
            value,
            writable: true
          });
        }
        toString() {
          return `${this.name} [${sym}]: ${this.message}`;
        }
      };
    }
    E(
      "ERR_BUFFER_OUT_OF_BOUNDS",
      function(name) {
        if (name) {
          return `${name} is outside of buffer bounds`;
        }
        return "Attempt to access memory outside buffer bounds";
      },
      RangeError
    );
    E(
      "ERR_INVALID_ARG_TYPE",
      function(name, actual) {
        return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
      },
      TypeError
    );
    E(
      "ERR_OUT_OF_RANGE",
      function(str, range, input) {
        let msg = `The value of "${str}" is out of range.`;
        let received = input;
        if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
          received = addNumericalSeparator(String(input));
        } else if (typeof input === "bigint") {
          received = String(input);
          if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
            received = addNumericalSeparator(received);
          }
          received += "n";
        }
        msg += ` It must be ${range}. Received ${received}`;
        return msg;
      },
      RangeError
    );
    function addNumericalSeparator(val) {
      let res = "";
      let i = val.length;
      const start = val[0] === "-" ? 1 : 0;
      for (; i >= start + 4; i -= 3) {
        res = `_${val.slice(i - 3, i)}${res}`;
      }
      return `${val.slice(0, i)}${res}`;
    }
    function checkBounds(buf, offset, byteLength2) {
      validateNumber(offset, "offset");
      if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
        boundsError(offset, buf.length - (byteLength2 + 1));
      }
    }
    function checkIntBI(value, min, max, buf, offset, byteLength2) {
      if (value > max || value < min) {
        const n = typeof min === "bigint" ? "n" : "";
        let range;
        if (byteLength2 > 3) {
          if (min === 0 || min === BigInt(0)) {
            range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
          } else {
            range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
          }
        } else {
          range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new errors.ERR_OUT_OF_RANGE("value", range, value);
      }
      checkBounds(buf, offset, byteLength2);
    }
    function validateNumber(value, name) {
      if (typeof value !== "number") {
        throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
      }
    }
    function boundsError(value, length, type) {
      if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
      }
      if (length < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
      }
      throw new errors.ERR_OUT_OF_RANGE(
        type || "offset",
        `>= ${type ? 1 : 0} and <= ${length}`,
        value
      );
    }
    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
    function base64clean(str) {
      str = str.split("=")[0];
      str = str.trim().replace(INVALID_BASE64_RE, "");
      if (str.length < 2) return "";
      while (str.length % 4 !== 0) {
        str = str + "=";
      }
      return str;
    }
    function utf8ToBytes(string, units) {
      units = units || Infinity;
      let codePoint;
      const length = string.length;
      let leadSurrogate = null;
      const bytes = [];
      for (let i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);
        if (codePoint > 55295 && codePoint < 57344) {
          if (!leadSurrogate) {
            if (codePoint > 56319) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            } else if (i + 1 === length) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            }
            leadSurrogate = codePoint;
            continue;
          }
          if (codePoint < 56320) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            leadSurrogate = codePoint;
            continue;
          }
          codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
        } else if (leadSurrogate) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
        }
        leadSurrogate = null;
        if (codePoint < 128) {
          if ((units -= 1) < 0) break;
          bytes.push(codePoint);
        } else if (codePoint < 2048) {
          if ((units -= 2) < 0) break;
          bytes.push(
            codePoint >> 6 | 192,
            codePoint & 63 | 128
          );
        } else if (codePoint < 65536) {
          if ((units -= 3) < 0) break;
          bytes.push(
            codePoint >> 12 | 224,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else if (codePoint < 1114112) {
          if ((units -= 4) < 0) break;
          bytes.push(
            codePoint >> 18 | 240,
            codePoint >> 12 & 63 | 128,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else {
          throw new Error("Invalid code point");
        }
      }
      return bytes;
    }
    function asciiToBytes(str) {
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        byteArray.push(str.charCodeAt(i) & 255);
      }
      return byteArray;
    }
    function utf16leToBytes(str, units) {
      let c, hi, lo;
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break;
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }
      return byteArray;
    }
    function base64ToBytes(str) {
      return base64.toByteArray(base64clean(str));
    }
    function blitBuffer(src, dst, offset, length) {
      let i;
      for (i = 0; i < length; ++i) {
        if (i + offset >= dst.length || i >= src.length) break;
        dst[i + offset] = src[i];
      }
      return i;
    }
    function isInstance(obj, type) {
      return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
    }
    function numberIsNaN(obj) {
      return obj !== obj;
    }
    var hexSliceLookupTable = function() {
      const alphabet = "0123456789abcdef";
      const table = new Array(256);
      for (let i = 0; i < 16; ++i) {
        const i16 = i * 16;
        for (let j = 0; j < 16; ++j) {
          table[i16 + j] = alphabet[i] + alphabet[j];
        }
      }
      return table;
    }();
    function defineBigIntMethod(fn) {
      return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
    }
    function BufferBigIntNotDefined() {
      throw new Error("BigInt not supported");
    }
  }
});

// src/helpers/fs.ts
var Stats = class {
  constructor(entry) {
    const blksize = 4096;
    const size = entry.kind_ === 0 /* File */ ? entry.content_.length : 0;
    const mtimeMs = entry.mtime_.getTime();
    const ctimeMs = entry.ctime_.getTime();
    this.dev = 1;
    this.ino = entry.inode_;
    this.mode = entry.kind_ === 0 /* File */ ? 32768 /* IFREG */ : 16384 /* IFDIR */;
    this.nlink = 1;
    this.uid = 1;
    this.gid = 1;
    this.rdev = 0;
    this.size = size;
    this.blksize = blksize;
    this.blocks = size + (blksize - 1) & blksize - 1;
    this.atimeMs = mtimeMs;
    this.mtimeMs = mtimeMs;
    this.ctimeMs = ctimeMs;
    this.birthtimeMs = ctimeMs;
    this.atime = entry.mtime_;
    this.mtime = entry.mtime_;
    this.ctime = entry.ctime_;
    this.birthtime = entry.ctime_;
  }
  isDirectory() {
    return this.mode === 16384 /* IFDIR */;
  }
  isFile() {
    return this.mode === 32768 /* IFREG */;
  }
};
var nextFD = 3;
var nextInode = 1;
var stderrSinceReset = "";
var EBADF = errorWithCode("EBADF");
var EINVAL = errorWithCode("EINVAL");
var EISDIR = errorWithCode("EISDIR");
var ENOENT = errorWithCode("ENOENT");
var ENOTDIR = errorWithCode("ENOTDIR");
var handles = /* @__PURE__ */ new Map();
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var root = createDirectory();
var esbuildWriteSync;
var esbuildRead;
function writeSync(fd, buffer, offset, length, position) {
  if (fd <= 2) {
    if (fd === 2) writeToStderr(buffer, offset, length);
    else esbuildWriteSync(fd, buffer, offset, length, position);
  } else {
    throw EINVAL;
  }
}
function read(fd, buffer, offset, length, position, callback) {
  if (fd <= 2) {
    esbuildRead(fd, buffer, offset, length, position, callback);
  } else {
    const handle = handles.get(fd);
    if (!handle) {
      callback(EBADF, 0, buffer);
    } else if (handle.entry_.kind_ === 1 /* Directory */) {
      callback(EISDIR, 0, buffer);
    } else {
      const content = handle.entry_.content_;
      if (position !== null && position !== -1) {
        const slice = content.slice(position, position + length);
        buffer.set(slice, offset);
        callback(null, slice.length, buffer);
      } else {
        const slice = content.slice(handle.offset_, handle.offset_ + length);
        handle.offset_ += slice.length;
        buffer.set(slice, offset);
        callback(null, slice.length, buffer);
      }
    }
  }
}
function rejectConflict(part) {
  throw new Error(JSON.stringify(part, null, 2) + " cannot be both a file and a directory");
}
function setFilesBulk(files) {
  for (const path in files) {
    const parts = splitPath(absoluteNormalizedPath(path));
    let dir = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part2 = parts[i];
      let child = dir.children_.get(part2);
      if (!child) {
        child = createDirectory();
        dir.children_.set(part2, child);
      } else if (child.kind_ !== 1 /* Directory */) {
        rejectConflict({ parts, path, part: part2, dir });
      }
      dir = child;
    }
    const part = parts[parts.length - 1];
    dir.children_.set(part, createFile(encoder.encode(files[path])));
  }
}
globalThis.fs = {
  get writeSync() {
    return writeSync;
  },
  set writeSync(value) {
    esbuildWriteSync = value;
  },
  get read() {
    return read;
  },
  set read(value) {
    esbuildRead = value;
  },
  constants: {
    O_WRONLY: -1,
    O_RDWR: -1,
    O_CREAT: -1,
    O_TRUNC: -1,
    O_APPEND: -1,
    O_EXCL: -1
  },
  open(path, flags, mode, callback) {
    try {
      const entry = getEntryFromPath(path);
      const fd = nextFD++;
      handles.set(fd, { entry_: entry, offset_: 0 });
      callback(null, fd);
    } catch (err) {
      callback(err, null);
    }
  },
  close(fd, callback) {
    callback(handles.delete(fd) ? null : EBADF);
  },
  write(fd, buffer, offset, length, position, callback) {
    if (fd <= 2) {
      if (fd === 2) writeToStderr(buffer, offset, length);
      else esbuildWriteSync(fd, buffer, offset, length, position);
      callback(null, length, buffer);
    } else {
      callback(EINVAL, 0, buffer);
    }
  },
  readdir(path, callback) {
    try {
      const entry = getEntryFromPath(path);
      if (entry.kind_ !== 1 /* Directory */) throw ENOTDIR;
      callback(null, [...entry.children_.keys()]);
    } catch (err) {
      callback(err, null);
    }
  },
  stat(path, callback) {
    try {
      const entry = getEntryFromPath(path);
      callback(null, new Stats(entry));
    } catch (err) {
      callback(err, null);
    }
  },
  lstat(path, callback) {
    try {
      const entry = getEntryFromPath(path);
      callback(null, new Stats(entry));
    } catch (err) {
      callback(err, null);
    }
  },
  fstat(fd, callback) {
    const handle = handles.get(fd);
    if (handle) {
      callback(null, new Stats(handle.entry_));
    } else {
      callback(EBADF, null);
    }
  }
};
function createFile(content) {
  const now = /* @__PURE__ */ new Date();
  return {
    kind_: 0 /* File */,
    inode_: nextInode++,
    ctime_: now,
    mtime_: now,
    content_: content
  };
}
function createDirectory() {
  const now = /* @__PURE__ */ new Date();
  return {
    kind_: 1 /* Directory */,
    inode_: nextInode++,
    ctime_: now,
    mtime_: now,
    children_: /* @__PURE__ */ new Map()
  };
}
function absoluteNormalizedPath(path) {
  if (path[0] !== "/") path = "/" + path;
  const parts = path.split("/");
  parts.shift();
  let end = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "..") {
      if (end) end--;
    } else if (part !== "." && part !== "") {
      parts[end++] = part;
    }
  }
  parts.length = end;
  return "/" + parts.join("/");
}
function splitPath(path) {
  path = absoluteNormalizedPath(path);
  if (path === "/") return [];
  const parts = path.split("/");
  parts.shift();
  return parts;
}
function getEntryFromPath(path) {
  const parts = splitPath(path);
  let dir = root;
  for (let i = 0, n = parts.length; i < n; i++) {
    const child = dir.children_.get(parts[i]);
    if (!child) throw ENOENT;
    if (child.kind_ === 0 /* File */) {
      if (i + 1 === n) return child;
      throw ENOTDIR;
    }
    dir = child;
  }
  return dir;
}
function errorWithCode(code) {
  const err = new Error(code);
  err.code = code;
  return err;
}
function writeToStderr(buffer, offset, length) {
  stderrSinceReset += decoder.decode(
    offset === 0 && length === buffer.length ? buffer : buffer.slice(offset, offset + length)
  );
}

// node_modules/idb/build/index.js
var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
var idbProxyableTypes;
var cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
var transactionDoneMap = /* @__PURE__ */ new WeakMap();
var transformCache = /* @__PURE__ */ new WeakMap();
var reverseTransformCache = /* @__PURE__ */ new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve2, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve2(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve2, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve2();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
var idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop === "done")
        return transactionDoneMap.get(target);
      if (prop === "store") {
        return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
      return true;
    }
    return prop in target;
  }
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(this.request);
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var unwrap = (value) => reverseTransformCache.get(value);
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event.oldVersion,
      event.newVersion,
      event
    ));
  }
  openPromise.then((db) => {
    if (terminated)
      db.addEventListener("close", () => terminated());
    if (blocking) {
      db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
var writeMethods = ["put", "add", "delete", "clear"];
var cachedMethods = /* @__PURE__ */ new Map();
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
}));
var advanceMethodProps = ["continue", "continuePrimaryKey", "advance"];
var methodMap = {};
var advanceResults = /* @__PURE__ */ new WeakMap();
var ittrProxiedCursorToOriginalProxy = /* @__PURE__ */ new WeakMap();
var cursorIteratorTraps = {
  get(target, prop) {
    if (!advanceMethodProps.includes(prop))
      return target[prop];
    let cachedFunc = methodMap[prop];
    if (!cachedFunc) {
      cachedFunc = methodMap[prop] = function(...args) {
        advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
      };
    }
    return cachedFunc;
  }
};
async function* iterate(...args) {
  let cursor = this;
  if (!(cursor instanceof IDBCursor)) {
    cursor = await cursor.openCursor(...args);
  }
  if (!cursor)
    return;
  cursor = cursor;
  const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
  ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
  reverseTransformCache.set(proxiedCursor, unwrap(cursor));
  while (cursor) {
    yield proxiedCursor;
    cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
    advanceResults.delete(proxiedCursor);
  }
}
function isIteratorProp(target, prop) {
  return prop === Symbol.asyncIterator && instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor]) || prop === "iterate" && instanceOfAny(target, [IDBIndex, IDBObjectStore]);
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get(target, prop, receiver) {
    if (isIteratorProp(target, prop))
      return iterate;
    return oldTraps.get(target, prop, receiver);
  },
  has(target, prop) {
    return isIteratorProp(target, prop) || oldTraps.has(target, prop);
  }
}));

// src/dependencies-installer.ts
var import_notepack = __toESM(require_lib());

// ../../../node_modules/p-queue/node_modules/eventemitter3/index.mjs
var import_index = __toESM(require_eventemitter3(), 1);

// ../../../node_modules/p-timeout/index.js
var TimeoutError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
};
var AbortError = class extends Error {
  constructor(message) {
    super();
    this.name = "AbortError";
    this.message = message;
  }
};
var getDOMException = (errorMessage) => globalThis.DOMException === void 0 ? new AbortError(errorMessage) : new DOMException(errorMessage);
var getAbortedReason = (signal) => {
  const reason = signal.reason === void 0 ? getDOMException("This operation was aborted.") : signal.reason;
  return reason instanceof Error ? reason : getDOMException(reason);
};
function pTimeout(promise, options) {
  const {
    milliseconds,
    fallback,
    message,
    customTimers = { setTimeout, clearTimeout }
  } = options;
  let timer;
  let abortHandler;
  const wrappedPromise = new Promise((resolve2, reject) => {
    if (typeof milliseconds !== "number" || Math.sign(milliseconds) !== 1) {
      throw new TypeError(`Expected \`milliseconds\` to be a positive number, got \`${milliseconds}\``);
    }
    if (options.signal) {
      const { signal } = options;
      if (signal.aborted) {
        reject(getAbortedReason(signal));
      }
      abortHandler = () => {
        reject(getAbortedReason(signal));
      };
      signal.addEventListener("abort", abortHandler, { once: true });
    }
    if (milliseconds === Number.POSITIVE_INFINITY) {
      promise.then(resolve2, reject);
      return;
    }
    const timeoutError = new TimeoutError();
    timer = customTimers.setTimeout.call(void 0, () => {
      if (fallback) {
        try {
          resolve2(fallback());
        } catch (error) {
          reject(error);
        }
        return;
      }
      if (typeof promise.cancel === "function") {
        promise.cancel();
      }
      if (message === false) {
        resolve2();
      } else if (message instanceof Error) {
        reject(message);
      } else {
        timeoutError.message = message != null ? message : `Promise timed out after ${milliseconds} milliseconds`;
        reject(timeoutError);
      }
    }, milliseconds);
    (async () => {
      try {
        resolve2(await promise);
      } catch (error) {
        reject(error);
      }
    })();
  });
  const cancelablePromise = wrappedPromise.finally(() => {
    cancelablePromise.clear();
    if (abortHandler && options.signal) {
      options.signal.removeEventListener("abort", abortHandler);
    }
  });
  cancelablePromise.clear = () => {
    customTimers.clearTimeout.call(void 0, timer);
    timer = void 0;
  };
  return cancelablePromise;
}

// ../../../node_modules/p-queue/dist/lower-bound.js
function lowerBound(array, value, comparator) {
  let first = 0;
  let count = array.length;
  while (count > 0) {
    const step = Math.trunc(count / 2);
    let it = first + step;
    if (comparator(array[it], value) <= 0) {
      first = ++it;
      count -= step + 1;
    } else {
      count = step;
    }
  }
  return first;
}

// ../../../node_modules/p-queue/dist/priority-queue.js
var _queue;
var PriorityQueue = class {
  constructor() {
    __privateAdd(this, _queue, []);
  }
  enqueue(run, options) {
    options = {
      priority: 0,
      ...options
    };
    const element = {
      priority: options.priority,
      id: options.id,
      run
    };
    if (this.size === 0 || __privateGet(this, _queue)[this.size - 1].priority >= options.priority) {
      __privateGet(this, _queue).push(element);
      return;
    }
    const index = lowerBound(__privateGet(this, _queue), element, (a, b) => b.priority - a.priority);
    __privateGet(this, _queue).splice(index, 0, element);
  }
  setPriority(id, priority) {
    const index = __privateGet(this, _queue).findIndex((element) => element.id === id);
    if (index === -1) {
      throw new ReferenceError(`No promise function with the id "${id}" exists in the queue.`);
    }
    const [item] = __privateGet(this, _queue).splice(index, 1);
    this.enqueue(item.run, { priority, id });
  }
  dequeue() {
    const item = __privateGet(this, _queue).shift();
    return item == null ? void 0 : item.run;
  }
  filter(options) {
    return __privateGet(this, _queue).filter((element) => element.priority === options.priority).map((element) => element.run);
  }
  get size() {
    return __privateGet(this, _queue).length;
  }
};
_queue = new WeakMap();

// ../../../node_modules/p-queue/dist/index.js
var _carryoverConcurrencyCount, _isIntervalIgnored, _intervalCount, _intervalCap, _interval, _intervalEnd, _intervalId, _timeoutId, _queue2, _queueClass, _pending, _concurrency, _isPaused, _throwOnTimeout, _idAssigner, _PQueue_instances, doesIntervalAllowAnother_get, doesConcurrentAllowAnother_get, next_fn, onResumeInterval_fn, isIntervalPaused_get, tryToStartAnother_fn, initializeIntervalIfNeeded_fn, onInterval_fn, processQueue_fn, throwOnAbort_fn, onEvent_fn;
var PQueue = class extends import_index.default {
  // TODO: The `throwOnTimeout` option should affect the return types of `add()` and `addAll()`
  constructor(options) {
    var _a, _b, _c, _d;
    super();
    __privateAdd(this, _PQueue_instances);
    __privateAdd(this, _carryoverConcurrencyCount);
    __privateAdd(this, _isIntervalIgnored);
    __privateAdd(this, _intervalCount, 0);
    __privateAdd(this, _intervalCap);
    __privateAdd(this, _interval);
    __privateAdd(this, _intervalEnd, 0);
    __privateAdd(this, _intervalId);
    __privateAdd(this, _timeoutId);
    __privateAdd(this, _queue2);
    __privateAdd(this, _queueClass);
    __privateAdd(this, _pending, 0);
    // The `!` is needed because of https://github.com/microsoft/TypeScript/issues/32194
    __privateAdd(this, _concurrency);
    __privateAdd(this, _isPaused);
    __privateAdd(this, _throwOnTimeout);
    // Use to assign a unique identifier to a promise function, if not explicitly specified
    __privateAdd(this, _idAssigner, 1n);
    /**
        Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they haven't already.
    
        Applies to each future operation.
        */
    __publicField(this, "timeout");
    options = {
      carryoverConcurrencyCount: false,
      intervalCap: Number.POSITIVE_INFINITY,
      interval: 0,
      concurrency: Number.POSITIVE_INFINITY,
      autoStart: true,
      queueClass: PriorityQueue,
      ...options
    };
    if (!(typeof options.intervalCap === "number" && options.intervalCap >= 1)) {
      throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${(_b = (_a = options.intervalCap) == null ? void 0 : _a.toString()) != null ? _b : ""}\` (${typeof options.intervalCap})`);
    }
    if (options.interval === void 0 || !(Number.isFinite(options.interval) && options.interval >= 0)) {
      throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${(_d = (_c = options.interval) == null ? void 0 : _c.toString()) != null ? _d : ""}\` (${typeof options.interval})`);
    }
    __privateSet(this, _carryoverConcurrencyCount, options.carryoverConcurrencyCount);
    __privateSet(this, _isIntervalIgnored, options.intervalCap === Number.POSITIVE_INFINITY || options.interval === 0);
    __privateSet(this, _intervalCap, options.intervalCap);
    __privateSet(this, _interval, options.interval);
    __privateSet(this, _queue2, new options.queueClass());
    __privateSet(this, _queueClass, options.queueClass);
    this.concurrency = options.concurrency;
    this.timeout = options.timeout;
    __privateSet(this, _throwOnTimeout, options.throwOnTimeout === true);
    __privateSet(this, _isPaused, options.autoStart === false);
  }
  get concurrency() {
    return __privateGet(this, _concurrency);
  }
  set concurrency(newConcurrency) {
    if (!(typeof newConcurrency === "number" && newConcurrency >= 1)) {
      throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
    }
    __privateSet(this, _concurrency, newConcurrency);
    __privateMethod(this, _PQueue_instances, processQueue_fn).call(this);
  }
  /**
      Updates the priority of a promise function by its id, affecting its execution order. Requires a defined concurrency limit to take effect.
  
      For example, this can be used to prioritize a promise function to run earlier.
  
      ```js
      import PQueue from 'p-queue';
  
      const queue = new PQueue({concurrency: 1});
  
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦀', {priority: 0, id: '🦀'});
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦄', {priority: 1});
  
      queue.setPriority('🦀', 2);
      ```
  
      In this case, the promise function with `id: '🦀'` runs second.
  
      You can also deprioritize a promise function to delay its execution:
  
      ```js
      import PQueue from 'p-queue';
  
      const queue = new PQueue({concurrency: 1});
  
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦀', {priority: 1, id: '🦀'});
      queue.add(async () => '🦄');
      queue.add(async () => '🦄', {priority: 0});
  
      queue.setPriority('🦀', -1);
      ```
      Here, the promise function with `id: '🦀'` executes last.
      */
  setPriority(id, priority) {
    __privateGet(this, _queue2).setPriority(id, priority);
  }
  async add(function_, options = {}) {
    var _a;
    (_a = options.id) != null ? _a : options.id = (__privateWrapper(this, _idAssigner)._++).toString();
    options = {
      timeout: this.timeout,
      throwOnTimeout: __privateGet(this, _throwOnTimeout),
      ...options
    };
    return new Promise((resolve2, reject) => {
      __privateGet(this, _queue2).enqueue(async () => {
        var _a2;
        __privateWrapper(this, _pending)._++;
        __privateWrapper(this, _intervalCount)._++;
        try {
          (_a2 = options.signal) == null ? void 0 : _a2.throwIfAborted();
          let operation = function_({ signal: options.signal });
          if (options.timeout) {
            operation = pTimeout(Promise.resolve(operation), { milliseconds: options.timeout });
          }
          if (options.signal) {
            operation = Promise.race([operation, __privateMethod(this, _PQueue_instances, throwOnAbort_fn).call(this, options.signal)]);
          }
          const result = await operation;
          resolve2(result);
          this.emit("completed", result);
        } catch (error) {
          if (error instanceof TimeoutError && !options.throwOnTimeout) {
            resolve2();
            return;
          }
          reject(error);
          this.emit("error", error);
        } finally {
          __privateMethod(this, _PQueue_instances, next_fn).call(this);
        }
      }, options);
      this.emit("add");
      __privateMethod(this, _PQueue_instances, tryToStartAnother_fn).call(this);
    });
  }
  async addAll(functions, options) {
    return Promise.all(functions.map(async (function_) => this.add(function_, options)));
  }
  /**
  Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
  */
  start() {
    if (!__privateGet(this, _isPaused)) {
      return this;
    }
    __privateSet(this, _isPaused, false);
    __privateMethod(this, _PQueue_instances, processQueue_fn).call(this);
    return this;
  }
  /**
  Put queue execution on hold.
  */
  pause() {
    __privateSet(this, _isPaused, true);
  }
  /**
  Clear the queue.
  */
  clear() {
    __privateSet(this, _queue2, new (__privateGet(this, _queueClass))());
  }
  /**
      Can be called multiple times. Useful if you for example add additional items at a later time.
  
      @returns A promise that settles when the queue becomes empty.
      */
  async onEmpty() {
    if (__privateGet(this, _queue2).size === 0) {
      return;
    }
    await __privateMethod(this, _PQueue_instances, onEvent_fn).call(this, "empty");
  }
  /**
      @returns A promise that settles when the queue size is less than the given limit: `queue.size < limit`.
  
      If you want to avoid having the queue grow beyond a certain size you can `await queue.onSizeLessThan()` before adding a new item.
  
      Note that this only limits the number of items waiting to start. There could still be up to `concurrency` jobs already running that this call does not include in its calculation.
      */
  async onSizeLessThan(limit) {
    if (__privateGet(this, _queue2).size < limit) {
      return;
    }
    await __privateMethod(this, _PQueue_instances, onEvent_fn).call(this, "next", () => __privateGet(this, _queue2).size < limit);
  }
  /**
      The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.
  
      @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
      */
  async onIdle() {
    if (__privateGet(this, _pending) === 0 && __privateGet(this, _queue2).size === 0) {
      return;
    }
    await __privateMethod(this, _PQueue_instances, onEvent_fn).call(this, "idle");
  }
  /**
  Size of the queue, the number of queued items waiting to run.
  */
  get size() {
    return __privateGet(this, _queue2).size;
  }
  /**
      Size of the queue, filtered by the given options.
  
      For example, this can be used to find the number of items remaining in the queue with a specific priority level.
      */
  sizeBy(options) {
    return __privateGet(this, _queue2).filter(options).length;
  }
  /**
  Number of running items (no longer in the queue).
  */
  get pending() {
    return __privateGet(this, _pending);
  }
  /**
  Whether the queue is currently paused.
  */
  get isPaused() {
    return __privateGet(this, _isPaused);
  }
};
_carryoverConcurrencyCount = new WeakMap();
_isIntervalIgnored = new WeakMap();
_intervalCount = new WeakMap();
_intervalCap = new WeakMap();
_interval = new WeakMap();
_intervalEnd = new WeakMap();
_intervalId = new WeakMap();
_timeoutId = new WeakMap();
_queue2 = new WeakMap();
_queueClass = new WeakMap();
_pending = new WeakMap();
_concurrency = new WeakMap();
_isPaused = new WeakMap();
_throwOnTimeout = new WeakMap();
_idAssigner = new WeakMap();
_PQueue_instances = new WeakSet();
doesIntervalAllowAnother_get = function() {
  return __privateGet(this, _isIntervalIgnored) || __privateGet(this, _intervalCount) < __privateGet(this, _intervalCap);
};
doesConcurrentAllowAnother_get = function() {
  return __privateGet(this, _pending) < __privateGet(this, _concurrency);
};
next_fn = function() {
  __privateWrapper(this, _pending)._--;
  __privateMethod(this, _PQueue_instances, tryToStartAnother_fn).call(this);
  this.emit("next");
};
onResumeInterval_fn = function() {
  __privateMethod(this, _PQueue_instances, onInterval_fn).call(this);
  __privateMethod(this, _PQueue_instances, initializeIntervalIfNeeded_fn).call(this);
  __privateSet(this, _timeoutId, void 0);
};
isIntervalPaused_get = function() {
  const now = Date.now();
  if (__privateGet(this, _intervalId) === void 0) {
    const delay = __privateGet(this, _intervalEnd) - now;
    if (delay < 0) {
      __privateSet(this, _intervalCount, __privateGet(this, _carryoverConcurrencyCount) ? __privateGet(this, _pending) : 0);
    } else {
      if (__privateGet(this, _timeoutId) === void 0) {
        __privateSet(this, _timeoutId, setTimeout(() => {
          __privateMethod(this, _PQueue_instances, onResumeInterval_fn).call(this);
        }, delay));
      }
      return true;
    }
  }
  return false;
};
tryToStartAnother_fn = function() {
  if (__privateGet(this, _queue2).size === 0) {
    if (__privateGet(this, _intervalId)) {
      clearInterval(__privateGet(this, _intervalId));
    }
    __privateSet(this, _intervalId, void 0);
    this.emit("empty");
    if (__privateGet(this, _pending) === 0) {
      this.emit("idle");
    }
    return false;
  }
  if (!__privateGet(this, _isPaused)) {
    const canInitializeInterval = !__privateGet(this, _PQueue_instances, isIntervalPaused_get);
    if (__privateGet(this, _PQueue_instances, doesIntervalAllowAnother_get) && __privateGet(this, _PQueue_instances, doesConcurrentAllowAnother_get)) {
      const job = __privateGet(this, _queue2).dequeue();
      if (!job) {
        return false;
      }
      this.emit("active");
      job();
      if (canInitializeInterval) {
        __privateMethod(this, _PQueue_instances, initializeIntervalIfNeeded_fn).call(this);
      }
      return true;
    }
  }
  return false;
};
initializeIntervalIfNeeded_fn = function() {
  if (__privateGet(this, _isIntervalIgnored) || __privateGet(this, _intervalId) !== void 0) {
    return;
  }
  __privateSet(this, _intervalId, setInterval(() => {
    __privateMethod(this, _PQueue_instances, onInterval_fn).call(this);
  }, __privateGet(this, _interval)));
  __privateSet(this, _intervalEnd, Date.now() + __privateGet(this, _interval));
};
onInterval_fn = function() {
  if (__privateGet(this, _intervalCount) === 0 && __privateGet(this, _pending) === 0 && __privateGet(this, _intervalId)) {
    clearInterval(__privateGet(this, _intervalId));
    __privateSet(this, _intervalId, void 0);
  }
  __privateSet(this, _intervalCount, __privateGet(this, _carryoverConcurrencyCount) ? __privateGet(this, _pending) : 0);
  __privateMethod(this, _PQueue_instances, processQueue_fn).call(this);
};
/**
Executes all queued functions until it reaches the limit.
*/
processQueue_fn = function() {
  while (__privateMethod(this, _PQueue_instances, tryToStartAnother_fn).call(this)) {
  }
};
throwOnAbort_fn = async function(signal) {
  return new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => {
      reject(signal.reason);
    }, { once: true });
  });
};
onEvent_fn = async function(event, filter) {
  return new Promise((resolve2) => {
    const listener = () => {
      if (filter && !filter()) {
        return;
      }
      this.off(event, listener);
      resolve2();
    };
    this.on(event, listener);
  });
};

// src/helpers/path.ts
function join(...paths) {
  return paths.filter(Boolean).map((p, i) => i === 0 ? p.replace(/\/+$/g, "") : p.replace(/^\/+|\/+$/g, "")).join("/").replace(/\/+/g, "/");
}
function resolve(...paths) {
  let resolvedPath = "";
  for (let i = paths.length - 1; i >= 0; i--) {
    const segment = paths[i];
    if (!segment) continue;
    if (segment.startsWith("/")) {
      resolvedPath = segment + "/" + resolvedPath;
      break;
    } else {
      resolvedPath = segment + "/" + resolvedPath;
    }
  }
  const parts = resolvedPath.split("/").filter(Boolean);
  const stack = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return "/" + stack.join("/");
}
function dirname(path) {
  if (!path) return ".";
  path = path.replace(/\/+$/, "");
  if (!path) return "/";
  const idx = path.lastIndexOf("/");
  if (idx === -1) return ".";
  if (idx === 0) return "/";
  return path.slice(0, idx);
}

// src/dependencies-installer.ts
var { Buffer: Buffer2 } = require_buffer();
var requestsQueue = new PQueue({
  concurrency: 10,
  timeout: 6e4
});
async function fetchWithRetry(input, init, retries = 3, delay = 1e3) {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    await new Promise((resolve2) => setTimeout(resolve2, delay));
    return fetchWithRetry(input, init, retries - 1, delay);
  }
}
var sandpackClient = {
  async resolvePackages(registryBaseUrl, packages) {
    const dependenciesRequest = Object.entries(packages).map(
      ([name, version]) => `${name}@${version}`
    );
    if (!dependenciesRequest) {
      return {};
    }
    const dependeciesBase64 = Buffer2.from(
      dependenciesRequest.join(";")
    ).toString("base64");
    const requestPath = `/v2/deps/${dependeciesBase64}`;
    const response = await fetchWithRetry(`${registryBaseUrl}${requestPath}`);
    const responseBytes = await response.arrayBuffer();
    const distTags = import_notepack.default.decode(responseBytes);
    const resolvedPackages = Object.fromEntries(
      Object.entries(distTags).map(([name, version]) => [
        name.split("@").slice(0, -1).join("@"),
        version
      ])
    );
    return resolvedPackages;
  },
  async hasPackageFilesInCache(packageName, packageVersion) {
    const packageRequest = Buffer2.from(
      `${packageName}@${packageVersion}`
    ).toString("base64");
    const requestPath = `/v2/mod/${packageRequest}`;
    return Cache.isCached(requestPath);
  },
  async downloadPackageFiles(registryBaseUrl, packageName, packageVersion) {
    const packageRequest = Buffer2.from(
      `${packageName}@${packageVersion}`
    ).toString("base64");
    const requestPath = `/v2/mod/${packageRequest}`;
    return Cache.withCacheData(
      requestPath,
      async () => {
        const response = await fetchWithRetry(
          `${registryBaseUrl}${requestPath}`
        );
        const responseBytes = await response.arrayBuffer();
        return responseBytes;
      },
      async (responseBytes) => {
        const files = import_notepack.default.decode(responseBytes);
        return files;
      }
    );
  }
};
function measureTime() {
  const startTime = Date.now();
  return () => {
    const endTime = Date.now();
    let durationMs = endTime - startTime;
    return durationMs > 1e3 ? `${Math.round(durationMs / 1e3)}s ${durationMs % 1e3}ms` : `${durationMs}ms`;
  };
}
var NPMInstaller = class {
  static cwd(fs, options) {
    return (options == null ? void 0 : options.cwd) || fs.cwd() || process.cwd();
  }
  static async getPackageJson(fs, options) {
    const packageJsonPath = join(
      this.cwd(fs, options),
      "package.json"
    );
    console.debug("[npm] packageJsonPath", packageJsonPath);
    const content = await Promise.resolve(fs.readFile(packageJsonPath)).catch(() => null);
    return content ? JSON.parse(content) : null;
  }
  static async resolveDependencies(fs, options) {
    const packageJson = await this.getPackageJson(fs, options);
    const allDependencies = {
      ...(packageJson == null ? void 0 : packageJson.dependencies) || {},
      ...(packageJson == null ? void 0 : packageJson.devDependencies) || {},
      ...(packageJson == null ? void 0 : packageJson.peerDependencies) || {},
      ...(options == null ? void 0 : options.dependencies) || {}
    };
    return await sandpackClient.resolvePackages(
      options.registryBaseUrl,
      allDependencies
    );
  }
  static async install(fs, options) {
    var _a;
    const log = (_a = options.reported) != null ? _a : () => {
    };
    log("info", `> npm install`);
    const installTime = measureTime();
    const packageJson = await this.getPackageJson(fs, options);
    console.debug("[npm] packageJson", packageJson);
    const restoreTime = measureTime();
    log("info", `\u250C Restoring cache`);
    log("info", `\u2514 Completed in ${restoreTime()}`);
    const allDependencies = {
      ...(packageJson == null ? void 0 : packageJson.dependencies) || {},
      ...(packageJson == null ? void 0 : packageJson.devDependencies) || {},
      ...(packageJson == null ? void 0 : packageJson.peerDependencies) || {},
      ...(options == null ? void 0 : options.dependencies) || {}
    };
    const nodeModulesPath = join("/node_modules");
    const scriptsPath = join(nodeModulesPath, ".scripts.json");
    const resolutionTime = measureTime();
    log("info", `\u250C Resolution step`);
    const packages = await sandpackClient.resolvePackages(
      options.registryBaseUrl,
      allDependencies
    );
    log("info", `\u2514 Completed in ${resolutionTime()}`);
    const scripts = {
      ...await Promise.resolve(fs.readFile(scriptsPath)).then(JSON.parse).catch(() => ({})) || {}
    };
    const fetchTime = measureTime();
    log("info", `\u250C Fetch step`);
    await Promise.all(
      Object.entries(packages).map(([packageName, packageVersion]) => requestsQueue.add(async () => {
        const packagePath = join(nodeModulesPath, packageName);
        const cachePath = packagePath;
        if (fs.exists(cachePath)) {
          log(
            "info",
            `\u2502 ${packageName}@npm:${packageVersion} found in the cache`
          );
        } else {
          if (await sandpackClient.hasPackageFilesInCache(
            packageName,
            packageVersion
          )) {
            log(
              "info",
              `\u2502 ${packageName}@npm:${packageVersion} found in the cache`
            );
          } else {
            log(
              "info",
              `\u2502 ${packageName}@npm:${packageVersion} can't be found in the cache and will be fetched from the remote registry`
            );
          }
          const files = await sandpackClient.downloadPackageFiles(
            options.registryBaseUrl,
            packageName,
            packageVersion
          );
          for (const [baseFilePath, fileContent] of Object.entries(files)) {
            const filePath = join(cachePath, baseFilePath);
            const dirPath = dirname(filePath);
            const string = new TextDecoder().decode(fileContent);
            fs.writeFile(filePath, string);
          }
        }
        const pkgJsonText = await Promise.resolve(fs.readFile(join(cachePath, "package.json"))).catch(() => null);
        const pkgJson = pkgJsonText ? JSON.parse(pkgJsonText) : null;
        if (pkgJson && pkgJson.bin) {
          if (typeof pkgJson.bin === "string") {
            scripts[pkgJson.name] = resolve(
              packagePath,
              pkgJson.bin
            );
          } else if (typeof pkgJson.bin === "object") {
            Object.entries(pkgJson.bin).forEach(([name, bin]) => {
              scripts[name] = resolve(packagePath, bin);
            });
          }
        } else if (pkgJson && pkgJson.main) {
          scripts[pkgJson.name] = resolve(
            packagePath,
            pkgJson.main
          );
        }
      }))
    );
    log("info", `\u2514 Completed in ${fetchTime()}`);
    const linkTime = measureTime();
    log("info", `\u250C Link step`);
    this.scriptsMap = scripts;
    fs.writeFile(scriptsPath, JSON.stringify(scripts, null, 2));
    log("info", `\u2514 Completed in ${linkTime()}`);
    log("info", `Done in ${installTime()}`);
  }
  static async packageScript(fs, script, options) {
    const packageJson = await this.getPackageJson(fs, options);
    const scripts = packageJson == null ? void 0 : packageJson.scripts;
    const scriptPath = scripts == null ? void 0 : scripts[script];
    const [cmd, ...args] = (scriptPath == null ? void 0 : scriptPath.split(" ")) || [];
    return { cmd, args };
  }
  // E.g. to found source file for `next` script
  static async dependencyScripts(cmd) {
    const scriptPath = this.scriptsMap[cmd];
    return scriptPath || null;
  }
};
NPMInstaller.scriptsMap = {};
var IDB_DB_DEPENDENCIES = "ESBUILD-dependencies-cache";
var IDB_STORE_CACHE = "cache";
var IDB_STORE_LOCK = "lockfile";
var IDB_STORE_SANDPACK_CDN = "sandpack-cdn";
var IDB_CACHE_VERSION = 1;
function getDB() {
  return openDB(IDB_DB_DEPENDENCIES, IDB_CACHE_VERSION, {
    upgrade(db) {
      const cache = db.createObjectStore(IDB_STORE_CACHE, { keyPath: "name" });
      cache.createIndex("lastUsed", "lastUsed", { unique: false });
      db.createObjectStore(IDB_STORE_LOCK, { keyPath: "name" });
      db.createObjectStore(IDB_STORE_SANDPACK_CDN, { keyPath: "request" });
    },
    blocked() {
    },
    blocking() {
    },
    terminated() {
    }
  });
}
var Cache = {
  async isCached(request) {
    const db = await getDB();
    const cachedData = await db.get(IDB_STORE_SANDPACK_CDN, request);
    return cachedData && cachedData.data;
  },
  async withCacheData(request, getData, transform) {
    const db = await getDB();
    try {
      const cachedData = await db.get(IDB_STORE_SANDPACK_CDN, request);
      if (cachedData && cachedData.data) {
        return await transform(cachedData.data);
      }
    } catch (error) {
      console.error("Error transforming cached data. Trying to get fresh data...", error);
    }
    const data = await getData();
    await db.put(IDB_STORE_SANDPACK_CDN, { request, data });
    return transform(data);
  }
  // async savePartialCache(basePath: string, files: Record<string, Buffer>) {
  //   const db = await getDB();
  //   let time = Date.now();
  //   // await db.clear(IDB_STORE_CACHE);
  //   {
  //     const tx = db.transaction(IDB_STORE_CACHE, 'readwrite');
  //     await Promise.all([
  //       ...Object.entries(files).map(([name, data]) =>
  //         data && tx.store.put({
  //           name: path.join(basePath, name),
  //           lastUsed: time,
  //           data,
  //         }).catch(() => {}),
  //       ),
  //       tx.done,
  //     ]);
  //   }
  // },
  // async saveCache(fs: FileSystem, cacheDir: string) {
  //   const files = await Promise.all(
  //     (await fs.readdir(cacheDir))
  //       .map(async name => [
  //         name,
  //         (await fs.readFile(cacheDir + '/' + name).catch(() => null)),
  //       ])
  //   );
  //   const db = await getDB();
  //   let time = Date.now();
  //   // await db.clear(IDB_STORE_CACHE);
  //   {
  //     const tx = db.transaction(IDB_STORE_CACHE, 'readwrite');
  //     // await tx.store.clear();
  //     await Promise.all([
  //       ...files.map(([name, data]) =>
  //         data && tx.store.put({
  //           name,
  //           lastUsed: time,
  //           data,
  //         }).catch(() => {}),
  //       ),
  //       tx.done,
  //     ]);
  //   }
  // },
  // async restoreCache(fs: FileSystem, cacheDir: string) {
  //   await fs.mkdirp(cacheDir);
  //   const db = await getDB();
  //   for (let { name, data } of await db.getAll(IDB_STORE_CACHE)) {
  //     await fs.writeFile(
  //       path.join(cacheDir, name),
  //       Buffer.from(data),
  //       undefined,
  //     );
  //   }
  // },
  // async saveLockfile(fs: FileSystem, baseDir: string) {
  //   const data = await fs.readFile(path.join(baseDir, 'yarn.lock'));
  //   const db = await getDB();
  //   await db.put(IDB_STORE_LOCK, {
  //     name: 'yarn.lock',
  //     data,
  //   });
  // },
  // async restoreLockfile(fs: FileSystem, baseDir: string) {
  //   const db = await getDB();
  //   const result = await db.get(IDB_STORE_LOCK, 'yarn.lock');
  //   if (result) {
  //     await fs.writeFile(path.join(baseDir, 'yarn.lock'), Buffer.from(result.data), undefined);
  //   }
  // },
};

// src/file-system-manager.ts
function absPath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}
var FileSystemManager = class _FileSystemManager {
  constructor(remote) {
    this.remote = remote;
    this.projectFiles = {
      // [`${this.tmpDirPath}/.gitkeep`]: { contents: '' },
    };
    this.currentWorkingDirectory = "/app";
    this.cwd = () => {
      return this.currentWorkingDirectory;
    };
    this.chdir = (path) => {
      var _a;
      const targetPath = absPath(path);
      this.currentWorkingDirectory = targetPath;
      (_a = this.remote) == null ? void 0 : _a.chdir(targetPath);
    };
    this.exists = (path) => {
      const targetPath = absPath(path);
      return targetPath in this.projectFiles;
    };
    this.isDirectory = (path) => {
      const targetPath = absPath(path);
      return this.fileNames.some((file) => file.startsWith(targetPath) && file.length > targetPath.length + 1);
    };
    this.setFiles = (files) => {
      var _a;
      for (const [path, file] of Object.entries(files)) {
        this.projectFiles[absPath(path)] = {
          ...this.projectFiles[absPath(path)] || {},
          ...file
        };
      }
      (_a = this.remote) == null ? void 0 : _a.setFiles(files);
    };
    this.writeFile = (path, contents) => {
      var _a;
      const targetPath = absPath(path);
      this.projectFiles[targetPath] = {
        ...this.projectFiles[targetPath] || {},
        contents
      };
      (_a = this.remote) == null ? void 0 : _a.writeFile(targetPath, contents);
    };
    this.appendFile = (path, contents) => {
      var _a, _b;
      const targetPath = absPath(path);
      this.writeFile(targetPath, (((_a = this.projectFiles[targetPath]) == null ? void 0 : _a.contents) || "") + contents);
      (_b = this.remote) == null ? void 0 : _b.appendFile(targetPath, contents);
    };
    this.deleteFile = (path) => {
      delete this.projectFiles[absPath(path)];
    };
    this.readFile = (path) => {
      var _a;
      return ((_a = this.projectFiles[absPath(path)]) == null ? void 0 : _a.contents) || "";
    };
    this.readdir = (path) => {
      const targetPath = absPath(path);
      return this.fileNames.filter((file) => file.startsWith(targetPath));
    };
  }
  get tmpDirPath() {
    return "/tmp";
  }
  get files() {
    return this.projectFiles;
  }
  get rawFiles() {
    return Object.fromEntries(Object.entries(this.projectFiles).map(([key, value]) => [key, value.contents]));
  }
  get fileNames() {
    return Object.keys(this.projectFiles);
  }
  toSerializable() {
    const self = this;
    return {
      fs__cwd: self.cwd,
      fs__chdir: self.chdir,
      fs__exists: self.exists,
      fs__readdir: self.readdir,
      fs__isDirectory: self.isDirectory,
      fs__writeFile: self.writeFile,
      fs__appendFile: self.appendFile,
      fs__readFile: self.readFile,
      fs__deleteFile: self.deleteFile,
      fs__setFiles: self.setFiles
    };
  }
  static fromFiles(files, remoteFS) {
    const fs = new _FileSystemManager(remoteFS);
    fs.setFiles(files);
    return fs;
  }
  static fromSerializedRemote(remote) {
    const fs = new _FileSystemManager(unserializeFS(remote));
    return fs;
  }
};
function unserializeFS(fs) {
  return new Proxy({}, {
    get(target, prop) {
      return fs[`fs__${prop}`];
    }
  });
}

// src/worker.ts
var setup = async ([_event, version, wasm]) => {
  const [major, minor, patch] = version.split(".").map((x) => +x);
  const hasBugWithWorker = major === 0 && (minor === 5 && patch >= 20 || minor >= 6 && minor <= 7 || minor === 8 && patch <= 34);
  const options = {
    // This uses "wasmURL" instead of "wasmModule" because "wasmModule" was added in version 0.14.32
    wasmURL: URL.createObjectURL(new Blob([wasm], { type: "application/wasm" }))
  };
  if (!hasBugWithWorker) {
    options.worker = false;
  }
  if (esbuild.startService) {
    await esbuild.startService(options);
  } else {
    await esbuild.initialize(options);
  }
  if (esbuild.transform) {
    await esbuild.transform("let a = 1").catch(() => void 0);
  }
  return esbuild;
};
var perf = typeof performance !== "undefined" ? performance : Date;
var formatMessages = (api, messages, options) => {
  if (api.formatMessages) return api.formatMessages(messages, options);
  const format = (kind, text, location) => {
    let result = kind === "note" ? "   " : "\x1B[1m > ";
    if (location) result += `${location.file}:${location.line}:${location.column}: `;
    result += kind === "error" ? "\x1B[31merror:\x1B[1m " : kind === "warning" ? "\x1B[35mwarning:\x1B[1m " : "\x1B[1mnote:\x1B[0m ";
    result += text + "\x1B[0m\n";
    if (location) {
      const { line, column, length, lineText } = location;
      const prefix = line.toString().padStart(5);
      result += `\x1B[37m${prefix} \u2502 ${lineText.slice(0, column)}\x1B[32m${lineText.slice(column, column + length)}\x1B[37m${lineText.slice(column + length)}
${" ".repeat(prefix.length)} \u2575 \x1B[32m${" ".repeat(column)}${length > 1 ? "~".repeat(length) : "^"}\x1B[0m
`;
    }
    return result;
  };
  return Promise.resolve(
    messages.map((msg) => {
      let result = format(options.kind, msg.text, msg.location);
      for (const note of msg.notes || []) {
        result += format("note", note.text, note.location);
      }
      return result + "\n";
    })
  );
};
var handler = function(e) {
  const respondWithError = (respond2, err) => {
    let errors = err && err.errors;
    const warnings = err && err.warnings;
    if (!errors && !warnings) errors = [{ text: err + "" }];
    Promise.all([
      errors ? formatMessages(this, errors, { kind: "error", color }) : [],
      warnings ? formatMessages(this, warnings, { kind: "warning", color }) : []
    ]).then(([errors2, warnings2]) => {
      respond2("reject", {
        stderr_: mergeStderrStreams([...errors2, ...warnings2], stderrSinceReset)
      });
    });
  };
  const mergeStderrStreams = (formatted, stderr) => {
    for (let i = 0; i < formatted.length; ++i) {
      if (stderr.includes(formatted[i])) {
        formatted[i] = "";
      } else {
        const replaced = formatted[i].replace(/\x1B\[[^m]*m/g, "");
        const index = stderr.indexOf(replaced);
        if (index >= 0) {
          stderr = stderr.slice(0, index) + formatted[i] + stderr.slice(index + replaced.length);
          formatted[i] = "";
        }
      }
    }
    return formatted.filter(Boolean).join("") + stderr;
  };
  const finish = (warnings, done) => {
    if (warnings.length) {
      formatMessages(this, warnings, { kind: "warning", color }).then(
        (formatted) => done(mergeStderrStreams(formatted, stderrSinceReset))
      );
    } else {
      done(stderrSinceReset);
    }
  };
  const [requestId, request] = e.data;
  console.debug("[worker] request", [requestId, request]);
  const respond = (status, response) => {
    console.debug("[worker] respond", [requestId, status, response]);
    return postMessage([requestId, status, response]);
  };
  let start;
  let color = true;
  try {
    if (request.command_ === "transform") {
      if (request.options_.color === false) color = false;
      setFilesBulk({});
      start = perf.now();
      this.transform(request.input_, request.options_).then(
        ({ code, map, js, jsSourceMap, warnings, mangleCache, legalComments }) => finish(
          warnings,
          (stderr) => respond("resolve", {
            // "code" and "map" were "js" and "jsSourceMap" before version 0.8.0
            code_: code != null ? code : js,
            map_: map != null ? map : jsSourceMap,
            mangleCache_: mangleCache,
            legalComments_: legalComments,
            stderr_: stderr,
            duration_: perf.now() - start
          })
        ),
        (err) => respondWithError(respond, err)
      );
    } else if (request.command_ === "build") {
      if (request.options_.color === false) color = false;
      setFilesBulk(request.input_);
      const outdir = "/dist/";
      start = perf.now();
      this.build({
        ...request.options_,
        outdir
      }).then(
        ({ warnings, outputFiles, metafile, mangleCache }) => finish(
          warnings,
          (stderr) => respond("resolve", {
            outputFiles_: outputFiles.map(({ path, contents }) => ({
              path: path.slice(outdir.length),
              contents
            })),
            metafile_: metafile,
            mangleCache_: mangleCache,
            stderr_: stderr,
            duration_: perf.now() - start
          })
        ),
        (err) => respondWithError(respond, err)
      );
    } else if (request.command_ === "npm_install") {
      const fs = new FileSystemManager();
      fs.setFiles(Object.fromEntries(Object.entries(request.input_).map(([path, file]) => [path, { contents: file }])));
      NPMInstaller.install(fs, {
        registryBaseUrl: request.registryBaseUrl_,
        cwd: request.cwd_,
        reported: (type, message) => {
          console.debug("[npm] progress", [type, message]);
          respond("progress", {
            type,
            message
          });
        }
      }).then(() => {
        setFilesBulk(fs.rawFiles);
        respond("resolve", {
          status_: "success"
        });
      }).catch((err) => respondWithError(respond, err));
    }
  } catch (err) {
    respondWithError(respond, err);
  }
};
onmessage = async (e) => {
  if (e.data[0] !== "setup") {
    return;
  }
  try {
    const api = await setup(e.data);
    onmessage = handler.bind(api);
    postMessage(["success"]);
  } catch (err) {
    console.error(err);
    postMessage(["failure", err + ""]);
  }
};
/*! Bundled license information:

ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

buffer/index.js:
  (*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)
*/
