// @ts-nocheck
/* eslint-disable */

/*
 * Last update 2020-07-23
 *
 * Compiled from Howard Butler's laz-perf
 * https://github.com/hobu/laz-perf
 * Under LGPL License
 *
 * To update this file:
 * - git clone https://github.com/hobu/laz-perf
 * - cd laz-perf
 * - echo 'set(CMAKE_CXX_FLAGS "-s SINGLE_FILE=1 ${CMAKE_CXX_FLAGS}"' >> emscripten/CMakeLists.txt
 * - mkdir build && cd build
 * - cmake .. -DEMSCRIPTEN=1 -DCMAKE_TOOLCHAIN_FILE=<path-to-emsdk>/emscripten/<emsdk-version>/cmake/Modules/Platform/Emscripten.cmake
 * - VERBOSE=1 make
 *
 * See the laz-perf repository for required dependencies
 *
 * The result should be build/emscripten/laz-perf.asm.js
 * Copy the content of this file in the getModule function below
 */

// laz-perf.js
export default function getModule() {
  var Module = typeof Module !== "undefined" ? Module : {};
  var moduleOverrides = {};
  var key;
  for (key in Module) {
    if (Module.hasOwnProperty(key)) {
      moduleOverrides[key] = Module[key]
    }
  }
  var arguments_ = [];
  var thisProgram = "./this.program";
  var quit_ = function (status, toThrow) {
    throw toThrow
  };
  var ENVIRONMENT_IS_WEB = false;
  var ENVIRONMENT_IS_WORKER = false;
  var ENVIRONMENT_IS_NODE = false;
  var ENVIRONMENT_IS_SHELL = false;
  ENVIRONMENT_IS_WEB = typeof window === "object";
  ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
  ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
  ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
  var scriptDirectory = "";

  function locateFile(path) {
    if (Module["locateFile"]) {
      return Module["locateFile"](path, scriptDirectory)
    }
    return scriptDirectory + path
  }
  var read_, readAsync, readBinary, setWindowTitle;
  var nodeFS;
  var nodePath;
  if (ENVIRONMENT_IS_NODE) {
    if (ENVIRONMENT_IS_WORKER) {
      scriptDirectory = require("path").dirname(scriptDirectory) + "/"
    } else {
      scriptDirectory = __dirname + "/"
    }
    read_ = function shell_read(filename, binary) {
      var ret = tryParseAsDataURI(filename);
      if (ret) {
        return binary ? ret : ret.toString()
      }
      if (!nodeFS) nodeFS = require("fs");
      if (!nodePath) nodePath = require("path");
      filename = nodePath["normalize"](filename);
      return nodeFS["readFileSync"](filename, binary ? null : "utf8")
    };
    readBinary = function readBinary(filename) {
      var ret = read_(filename, true);
      if (!ret.buffer) {
        ret = new Uint8Array(ret)
      }
      assert(ret.buffer);
      return ret
    };
    if (process["argv"].length > 1) {
      thisProgram = process["argv"][1].replace(/\\/g, "/")
    }
    arguments_ = process["argv"].slice(2);
    if (typeof module !== "undefined") {
      module["exports"] = Module
    }
    process["on"]("uncaughtException", function (ex) {
      if (!(ex instanceof ExitStatus)) {
        throw ex
      }
    });
    process["on"]("unhandledRejection", abort);
    quit_ = function (status) {
      process["exit"](status)
    };
    Module["inspect"] = function () {
      return "[Emscripten Module object]"
    }
  } else if (ENVIRONMENT_IS_SHELL) {
    if (typeof read != "undefined") {
      read_ = function shell_read(f) {
        var data = tryParseAsDataURI(f);
        if (data) {
          return intArrayToString(data)
        }
        return read(f)
      }
    }
    readBinary = function readBinary(f) {
      var data;
      data = tryParseAsDataURI(f);
      if (data) {
        return data
      }
      if (typeof readbuffer === "function") {
        return new Uint8Array(readbuffer(f))
      }
      data = read(f, "binary");
      assert(typeof data === "object");
      return data
    };
    if (typeof scriptArgs != "undefined") {
      arguments_ = scriptArgs
    } else if (typeof arguments != "undefined") {
      arguments_ = arguments
    }
    if (typeof quit === "function") {
      quit_ = function (status) {
        quit(status)
      }
    }
    if (typeof print !== "undefined") {
      if (typeof console === "undefined") console = {};
      console.log = print;
      console.warn = console.error = typeof printErr !== "undefined" ? printErr : print
    }
  } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
      scriptDirectory = self.location.href
    } else if (document.currentScript) {
      scriptDirectory = document.currentScript.src
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
      scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
    } else {
      scriptDirectory = ""
    } {
      read_ = function shell_read(url) {
        try {
          var xhr = new XMLHttpRequest;
          xhr.open("GET", url, false);
          xhr.send(null);
          return xhr.responseText
        } catch (err) {
          var data = tryParseAsDataURI(url);
          if (data) {
            return intArrayToString(data)
          }
          throw err
        }
      };
      if (ENVIRONMENT_IS_WORKER) {
        readBinary = function readBinary(url) {
          try {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.responseType = "arraybuffer";
            xhr.send(null);
            return new Uint8Array(xhr.response)
          } catch (err) {
            var data = tryParseAsDataURI(url);
            if (data) {
              return data
            }
            throw err
          }
        }
      }
      readAsync = function readAsync(url, onload, onerror) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
            onload(xhr.response);
            return
          }
          var data = tryParseAsDataURI(url);
          if (data) {
            onload(data.buffer);
            return
          }
          onerror()
        };
        xhr.onerror = onerror;
        xhr.send(null)
      }
    }
    setWindowTitle = function (title) {
      document.title = title
    }
  } else {}
  var out = Module["print"] || console.log.bind(console);
  var err = Module["printErr"] || console.warn.bind(console);
  for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
      Module[key] = moduleOverrides[key]
    }
  }
  moduleOverrides = null;
  if (Module["arguments"]) arguments_ = Module["arguments"];
  if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
  if (Module["quit"]) quit_ = Module["quit"];
  var STACK_ALIGN = 16;

  function dynamicAlloc(size) {
    var ret = HEAP32[DYNAMICTOP_PTR >> 2];
    var end = ret + size + 15 & -16;
    HEAP32[DYNAMICTOP_PTR >> 2] = end;
    return ret
  }

  function getNativeTypeSize(type) {
    switch (type) {
    case "i1":
    case "i8":
      return 1;
    case "i16":
      return 2;
    case "i32":
      return 4;
    case "i64":
      return 8;
    case "float":
      return 4;
    case "double":
      return 8;
    default: {
      if (type[type.length - 1] === "*") {
        return 4
      } else if (type[0] === "i") {
        var bits = Number(type.substr(1));
        assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
        return bits / 8
      } else {
        return 0
      }
    }
    }
  }

  function warnOnce(text) {
    if (!warnOnce.shown) warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
      warnOnce.shown[text] = 1;
      err(text)
    }
  }
  var jsCallStartIndex = 1;
  var functionPointers = new Array(0);
  var funcWrappers = {};

  function dynCall(sig, ptr, args) {
    if (args && args.length) {
      return Module["dynCall_" + sig].apply(null, [ptr].concat(args))
    } else {
      return Module["dynCall_" + sig].call(null, ptr)
    }
  }
  var tempRet0 = 0;
  var setTempRet0 = function (value) {
    tempRet0 = value
  };
  var getTempRet0 = function () {
    return tempRet0
  };
  var GLOBAL_BASE = 8;
  var wasmBinary;
  if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
  var noExitRuntime;
  if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];

  function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
    case "i1":
      HEAP8[ptr >> 0] = value;
      break;
    case "i8":
      HEAP8[ptr >> 0] = value;
      break;
    case "i16":
      HEAP16[ptr >> 1] = value;
      break;
    case "i32":
      HEAP32[ptr >> 2] = value;
      break;
    case "i64":
      tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
      break;
    case "float":
      HEAPF32[ptr >> 2] = value;
      break;
    case "double":
      HEAPF64[ptr >> 3] = value;
      break;
    default:
      abort("invalid type for setValue: " + type)
    }
  }
  var ABORT = false;
  var EXITSTATUS = 0;

  function assert(condition, text) {
    if (!condition) {
      abort("Assertion failed: " + text)
    }
  }

  function getCFunc(ident) {
    var func = Module["_" + ident];
    assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
    return func
  }

  function ccall(ident, returnType, argTypes, args, opts) {
    var toC = {
      "string": function (str) {
        var ret = 0;
        if (str !== null && str !== undefined && str !== 0) {
          var len = (str.length << 2) + 1;
          ret = stackAlloc(len);
          stringToUTF8(str, ret, len)
        }
        return ret
      },
      "array": function (arr) {
        var ret = stackAlloc(arr.length);
        writeArrayToMemory(arr, ret);
        return ret
      }
    };

    function convertReturnValue(ret) {
      if (returnType === "string") return UTF8ToString(ret);
      if (returnType === "boolean") return Boolean(ret);
      return ret
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = stackSave();
          cArgs[i] = converter(args[i])
        } else {
          cArgs[i] = args[i]
        }
      }
    }
    var ret = func.apply(null, cArgs);
    ret = convertReturnValue(ret);
    if (stack !== 0) stackRestore(stack);
    return ret
  }
  var ALLOC_NONE = 3;
  var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

  function UTF8ArrayToString(heap, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
      return UTF8Decoder.decode(heap.subarray(idx, endPtr))
    } else {
      var str = "";
      while (idx < endPtr) {
        var u0 = heap[idx++];
        if (!(u0 & 128)) {
          str += String.fromCharCode(u0);
          continue
        }
        var u1 = heap[idx++] & 63;
        if ((u0 & 224) == 192) {
          str += String.fromCharCode((u0 & 31) << 6 | u1);
          continue
        }
        var u2 = heap[idx++] & 63;
        if ((u0 & 240) == 224) {
          u0 = (u0 & 15) << 12 | u1 << 6 | u2
        } else {
          u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63
        }
        if (u0 < 65536) {
          str += String.fromCharCode(u0)
        } else {
          var ch = u0 - 65536;
          str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
        }
      }
    }
    return str
  }

  function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
  }

  function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
      var u = str.charCodeAt(i);
      if (u >= 55296 && u <= 57343) {
        var u1 = str.charCodeAt(++i);
        u = 65536 + ((u & 1023) << 10) | u1 & 1023
      }
      if (u <= 127) {
        if (outIdx >= endIdx) break;
        heap[outIdx++] = u
      } else if (u <= 2047) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++] = 192 | u >> 6;
        heap[outIdx++] = 128 | u & 63
      } else if (u <= 65535) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++] = 224 | u >> 12;
        heap[outIdx++] = 128 | u >> 6 & 63;
        heap[outIdx++] = 128 | u & 63
      } else {
        if (outIdx + 3 >= endIdx) break;
        heap[outIdx++] = 240 | u >> 18;
        heap[outIdx++] = 128 | u >> 12 & 63;
        heap[outIdx++] = 128 | u >> 6 & 63;
        heap[outIdx++] = 128 | u & 63
      }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx
  }

  function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
  }

  function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      var u = str.charCodeAt(i);
      if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
      if (u <= 127) ++len;
      else if (u <= 2047) len += 2;
      else if (u <= 65535) len += 3;
      else len += 4
    }
    return len
  }
  var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

  function UTF16ToString(ptr, maxBytesToRead) {
    var endPtr = ptr;
    var idx = endPtr >> 1;
    var maxIdx = idx + maxBytesToRead / 2;
    while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
    endPtr = idx << 1;
    if (endPtr - ptr > 32 && UTF16Decoder) {
      return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr))
    } else {
      var i = 0;
      var str = "";
      while (1) {
        var codeUnit = HEAP16[ptr + i * 2 >> 1];
        if (codeUnit == 0 || i == maxBytesToRead / 2) return str;
        ++i;
        str += String.fromCharCode(codeUnit)
      }
    }
  }

  function stringToUTF16(str, outPtr, maxBytesToWrite) {
    if (maxBytesToWrite === undefined) {
      maxBytesToWrite = 2147483647
    }
    if (maxBytesToWrite < 2) return 0;
    maxBytesToWrite -= 2;
    var startPtr = outPtr;
    var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
    for (var i = 0; i < numCharsToWrite; ++i) {
      var codeUnit = str.charCodeAt(i);
      HEAP16[outPtr >> 1] = codeUnit;
      outPtr += 2
    }
    HEAP16[outPtr >> 1] = 0;
    return outPtr - startPtr
  }

  function lengthBytesUTF16(str) {
    return str.length * 2
  }

  function UTF32ToString(ptr, maxBytesToRead) {
    var i = 0;
    var str = "";
    while (!(i >= maxBytesToRead / 4)) {
      var utf32 = HEAP32[ptr + i * 4 >> 2];
      if (utf32 == 0) break;
      ++i;
      if (utf32 >= 65536) {
        var ch = utf32 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
      } else {
        str += String.fromCharCode(utf32)
      }
    }
    return str
  }

  function stringToUTF32(str, outPtr, maxBytesToWrite) {
    if (maxBytesToWrite === undefined) {
      maxBytesToWrite = 2147483647
    }
    if (maxBytesToWrite < 4) return 0;
    var startPtr = outPtr;
    var endPtr = startPtr + maxBytesToWrite - 4;
    for (var i = 0; i < str.length; ++i) {
      var codeUnit = str.charCodeAt(i);
      if (codeUnit >= 55296 && codeUnit <= 57343) {
        var trailSurrogate = str.charCodeAt(++i);
        codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023
      }
      HEAP32[outPtr >> 2] = codeUnit;
      outPtr += 4;
      if (outPtr + 4 > endPtr) break
    }
    HEAP32[outPtr >> 2] = 0;
    return outPtr - startPtr
  }

  function lengthBytesUTF32(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      var codeUnit = str.charCodeAt(i);
      if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
      len += 4
    }
    return len
  }

  function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer)
  }

  function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
      HEAP8[buffer++ >> 0] = str.charCodeAt(i)
    }
    if (!dontAddNull) HEAP8[buffer >> 0] = 0
  }
  var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

  function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module["HEAP8"] = HEAP8 = new Int8Array(buf);
    Module["HEAP16"] = HEAP16 = new Int16Array(buf);
    Module["HEAP32"] = HEAP32 = new Int32Array(buf);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
  }
  var STACK_BASE = 22384,
    DYNAMIC_BASE = 5265264,
    DYNAMICTOP_PTR = 22176;
  var INITIAL_INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 167772160;
  if (Module["buffer"]) {
    buffer = Module["buffer"]
  } else {
    buffer = new ArrayBuffer(INITIAL_INITIAL_MEMORY)
  }
  INITIAL_INITIAL_MEMORY = buffer.byteLength;
  updateGlobalBufferAndViews(buffer);
  HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

  function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
      var callback = callbacks.shift();
      if (typeof callback == "function") {
        callback(Module);
        continue
      }
      var func = callback.func;
      if (typeof func === "number") {
        if (callback.arg === undefined) {
          Module["dynCall_v"](func)
        } else {
          Module["dynCall_vi"](func, callback.arg)
        }
      } else {
        func(callback.arg === undefined ? null : callback.arg)
      }
    }
  }
  var __ATPRERUN__ = [];
  var __ATINIT__ = [];
  var __ATMAIN__ = [];
  var __ATPOSTRUN__ = [];
  var runtimeInitialized = false;
  var runtimeExited = false;

  function preRun() {
    if (Module["preRun"]) {
      if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
      while (Module["preRun"].length) {
        addOnPreRun(Module["preRun"].shift())
      }
    }
    callRuntimeCallbacks(__ATPRERUN__)
  }

  function initRuntime() {
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__)
  }

  function preMain() {
    callRuntimeCallbacks(__ATMAIN__)
  }

  function exitRuntime() {
    runtimeExited = true
  }

  function postRun() {
    if (Module["postRun"]) {
      if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
      while (Module["postRun"].length) {
        addOnPostRun(Module["postRun"].shift())
      }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
  }

  function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
  }

  function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
  }
  var Math_abs = Math.abs;
  var Math_ceil = Math.ceil;
  var Math_floor = Math.floor;
  var Math_min = Math.min;
  var runDependencies = 0;
  var runDependencyWatcher = null;
  var dependenciesFulfilled = null;

  function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
      Module["monitorRunDependencies"](runDependencies)
    }
  }

  function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
      Module["monitorRunDependencies"](runDependencies)
    }
    if (runDependencies == 0) {
      if (runDependencyWatcher !== null) {
        clearInterval(runDependencyWatcher);
        runDependencyWatcher = null
      }
      if (dependenciesFulfilled) {
        var callback = dependenciesFulfilled;
        dependenciesFulfilled = null;
        callback()
      }
    }
  }
  Module["preloadedImages"] = {};
  Module["preloadedAudios"] = {};

  function abort(what) {
    if (Module["onAbort"]) {
      Module["onAbort"](what)
    }
    what += "";
    out(what);
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
    throw what
  }
  var memoryInitializer = null;

  function hasPrefix(str, prefix) {
    return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0
  }
  var dataURIPrefix = "data:application/octet-stream;base64,";

  function isDataURI(filename) {
    return hasPrefix(filename, dataURIPrefix)
  }
  var fileURIPrefix = "file://";
  var tempDouble;
  var tempI64;
  __ATINIT__.push({
    func: function () {
      globalCtors()
    }
  });
  memoryInitializer = "data:application/octet-stream;base64,AAAAAAAAAAAPDg0MCwoJCA4AAQMGCgoJDQECBAcLCwoMAwQFCAwMCwsGBwgJDQ0MCgoLDA0ODg0JCgsMDQ4PDggJCgsMDQ4PAAECAwQFBgcBAAECAwQFBgIBAAECAwQFAwIBAAECAwQEAwIBAAECAwUEAwIBAAECBgUEAwIBAAEHBgUEAwIBAMgPAAAoDQAAEBAAACAQAADIDwAAUA0AABAQAAAgEAAAEQAKABEREQAAAAAFAAAAAAAACQAAAAALAAAAAAAAAAARAA8KERERAwoHAAEACQsLAAAJBgsAAAsABhEAAAAREREAAAAAAAAAAAAAAAAAAAAACwAAAAAAAAAAEQAKChEREQAKAAACAAkLAAAACQALAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAwAAAAADAAAAAAJDAAAAAAADAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAANAAAABA0AAAAACQ4AAAAAAA4AAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAADwAAAAAPAAAAAAkQAAAAAAAQAAAQAAASAAAAEhISAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABIAAAASEhIAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAKAAAAAAoAAAAACQsAAAAAAAsAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAADAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAwMTIzNDU2Nzg5QUJDREVGGRJEOwI/LEcUPTMwChsGRktFNw9JDo4XA0AdPGkrNh9KLRwBICUpIQgMFRYiLhA4Pgs0MRhkdHV2L0EJfzkRI0MyQomKiwUEJignDSoeNYwHGkiTE5SVAAAAAAAAAAAASWxsZWdhbCBieXRlIHNlcXVlbmNlAERvbWFpbiBlcnJvcgBSZXN1bHQgbm90IHJlcHJlc2VudGFibGUATm90IGEgdHR5AFBlcm1pc3Npb24gZGVuaWVkAE9wZXJhdGlvbiBub3QgcGVybWl0dGVkAE5vIHN1Y2ggZmlsZSBvciBkaXJlY3RvcnkATm8gc3VjaCBwcm9jZXNzAEZpbGUgZXhpc3RzAFZhbHVlIHRvbyBsYXJnZSBmb3IgZGF0YSB0eXBlAE5vIHNwYWNlIGxlZnQgb24gZGV2aWNlAE91dCBvZiBtZW1vcnkAUmVzb3VyY2UgYnVzeQBJbnRlcnJ1cHRlZCBzeXN0ZW0gY2FsbABSZXNvdXJjZSB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZQBJbnZhbGlkIHNlZWsAQ3Jvc3MtZGV2aWNlIGxpbmsAUmVhZC1vbmx5IGZpbGUgc3lzdGVtAERpcmVjdG9yeSBub3QgZW1wdHkAQ29ubmVjdGlvbiByZXNldCBieSBwZWVyAE9wZXJhdGlvbiB0aW1lZCBvdXQAQ29ubmVjdGlvbiByZWZ1c2VkAEhvc3QgaXMgZG93bgBIb3N0IGlzIHVucmVhY2hhYmxlAEFkZHJlc3MgaW4gdXNlAEJyb2tlbiBwaXBlAEkvTyBlcnJvcgBObyBzdWNoIGRldmljZSBvciBhZGRyZXNzAEJsb2NrIGRldmljZSByZXF1aXJlZABObyBzdWNoIGRldmljZQBOb3QgYSBkaXJlY3RvcnkASXMgYSBkaXJlY3RvcnkAVGV4dCBmaWxlIGJ1c3kARXhlYyBmb3JtYXQgZXJyb3IASW52YWxpZCBhcmd1bWVudABBcmd1bWVudCBsaXN0IHRvbyBsb25nAFN5bWJvbGljIGxpbmsgbG9vcABGaWxlbmFtZSB0b28gbG9uZwBUb28gbWFueSBvcGVuIGZpbGVzIGluIHN5c3RlbQBObyBmaWxlIGRlc2NyaXB0b3JzIGF2YWlsYWJsZQBCYWQgZmlsZSBkZXNjcmlwdG9yAE5vIGNoaWxkIHByb2Nlc3MAQmFkIGFkZHJlc3MARmlsZSB0b28gbGFyZ2UAVG9vIG1hbnkgbGlua3MATm8gbG9ja3MgYXZhaWxhYmxlAFJlc291cmNlIGRlYWRsb2NrIHdvdWxkIG9jY3VyAFN0YXRlIG5vdCByZWNvdmVyYWJsZQBQcmV2aW91cyBvd25lciBkaWVkAE9wZXJhdGlvbiBjYW5jZWxlZABGdW5jdGlvbiBub3QgaW1wbGVtZW50ZWQATm8gbWVzc2FnZSBvZiBkZXNpcmVkIHR5cGUASWRlbnRpZmllciByZW1vdmVkAERldmljZSBub3QgYSBzdHJlYW0ATm8gZGF0YSBhdmFpbGFibGUARGV2aWNlIHRpbWVvdXQAT3V0IG9mIHN0cmVhbXMgcmVzb3VyY2VzAExpbmsgaGFzIGJlZW4gc2V2ZXJlZABQcm90b2NvbCBlcnJvcgBCYWQgbWVzc2FnZQBGaWxlIGRlc2NyaXB0b3IgaW4gYmFkIHN0YXRlAE5vdCBhIHNvY2tldABEZXN0aW5hdGlvbiBhZGRyZXNzIHJlcXVpcmVkAE1lc3NhZ2UgdG9vIGxhcmdlAFByb3RvY29sIHdyb25nIHR5cGUgZm9yIHNvY2tldABQcm90b2NvbCBub3QgYXZhaWxhYmxlAFByb3RvY29sIG5vdCBzdXBwb3J0ZWQAU29ja2V0IHR5cGUgbm90IHN1cHBvcnRlZABOb3Qgc3VwcG9ydGVkAFByb3RvY29sIGZhbWlseSBub3Qgc3VwcG9ydGVkAEFkZHJlc3MgZmFtaWx5IG5vdCBzdXBwb3J0ZWQgYnkgcHJvdG9jb2wAQWRkcmVzcyBub3QgYXZhaWxhYmxlAE5ldHdvcmsgaXMgZG93bgBOZXR3b3JrIHVucmVhY2hhYmxlAENvbm5lY3Rpb24gcmVzZXQgYnkgbmV0d29yawBDb25uZWN0aW9uIGFib3J0ZWQATm8gYnVmZmVyIHNwYWNlIGF2YWlsYWJsZQBTb2NrZXQgaXMgY29ubmVjdGVkAFNvY2tldCBub3QgY29ubmVjdGVkAENhbm5vdCBzZW5kIGFmdGVyIHNvY2tldCBzaHV0ZG93bgBPcGVyYXRpb24gYWxyZWFkeSBpbiBwcm9ncmVzcwBPcGVyYXRpb24gaW4gcHJvZ3Jlc3MAU3RhbGUgZmlsZSBoYW5kbGUAUmVtb3RlIEkvTyBlcnJvcgBRdW90YSBleGNlZWRlZABObyBtZWRpdW0gZm91bmQAV3JvbmcgbWVkaXVtIHR5cGUATm8gZXJyb3IgaW5mb3JtYXRpb24AAAAAAADgFgAAmRgAAGAQAAAAAAAA4BYAAEIZAABgEAAAAAAAAOAWAAAqGgAASA8AAAAAAAC4FgAANBsAAOAWAACfGgAAMAoAAAAAAADgFgAAaRsAAEgPAAAAAAAA4BYAAIobAABIDwAAAAAAALgWAAAPHAAA4BYAAHwcAABIDwAAAAAAAOAWAACVHAAASA8AAAAAAADgFgAAHh0AAEgPAAAAAAAA4BYAAHcdAABIDwAAAAAAAOAWAACQHQAASA8AAAAAAADgFgAAQh4AAEgPAAAAAAAA4BYAAIceAABgEAAAAAAAAOAWAACkHwAASA8AAAAAAAC4FgAAZyAAAOAWAADkHwAA8AoAAAAAAADgFgAAjyAAAGAQAAAAAAAAuBYAAMMiAADgFgAAAiIAABgLAAAAAAAA4BYAAOEiAABgEAAAAAAAAOAWAADQJAAAGAsAAAAAAADgFgAAkSUAAGAQAAAAAAAA4BYAAIAnAAAYCwAAAAAAAOAWAAA9KAAAYBAAAAAAAADgFgAAJCoAABgLAAAAAAAA4BYAAOkqAABgEAAAAAAAAOAWAADgLAAA8AoAAAAAAADgFgAAui0AAGAQAAAAAAAA4BYAANsvAADwCgAAAAAAAOAWAADTMAAAYBAAAAAAAADgFgAAMDMAAPAKAAAAAAAA4BYAACQ0AABgEAAAAAAAAOAWAAB5NgAA8AoAAAAAAADgFgAAizcAAGAQAAAAAAAA4BYAABw6AABgEAAAAAAAAOAWAACdOgAAYBAAAAAAAADgFgAAXjsAAPAKAAAAAAAA4BYAALU7AABgEAAAAAAAAOAWAADMPAAAGAsAAAAAAADgFgAATz0AAGAQAAAAAAAA4BYAAL4+AAAYCwAAAAAAAOAWAABBPwAAYBAAAAAAAADgFgAAsEAAABgLAAAAAAAA4BYAADNBAABgEAAAAAAAAOAWAACiQgAAGAsAAAAAAADgFgAAJUMAAGAQAAAAAAAA4BYAAJREAAAYCwAAAAAAAOAWAAAXRQAAYBAAAAAAAADgFgAAhkYAABgLAAAAAAAA4BYAAAlHAABgEAAAAAAAALgWAAB4SAAAiBcAAIBIAAAAAAAAIA0AAIgXAACJSAAAAQAAACANAAC4FgAAqkgAAIgXAAC6SAAAAAAAAEgNAACIFwAAy0gAAAEAAABIDQAAuBYAABhMAAC4FgAAN0wAALgWAABWTAAAuBYAAHVMAAC4FgAAlEwAALgWAACzTAAAuBYAANJMAAC4FgAA8UwAALgWAAAQTQAAuBYAAC9NAAC4FgAATk0AALgWAABtTQAAuBYAAIxNAACkFwAAn00AAAAAAAABAAAA8A0AAAAAAAC4FgAA4U0AAKQXAAAHTgAAAAAAAAEAAADwDQAAAAAAAKQXAABJTgAAAAAAAAEAAADwDQAAAAAAAKQXAACITgAAAAAAAAEAAADwDQAAAAAAAKQXAADHTgAAAAAAAAEAAADwDQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALgWAADNTwAA4BYAAC1QAAAADwAAAAAAAOAWAADaTwAAEA8AAAAAAAC4FgAA+08AAOAWAAAIUAAA8A4AAAAAAADgFgAAhlAAAOgOAAAAAAAA4BYAAJNQAADoDgAAAAAAAOAWAACjUAAA6A4AAAAAAADgFgAAtVAAADgPAAAAAAAA4BYAAMZQAAA4DwAAAAAAAOAWAADXUAAAAA8AAAAAAADgFgAA+VAAAHgPAAAAAAAA4BYAAB1RAAAADwAAAAAAAOAWAABCUQAAeA8AAAAAAADgFgAAjlEAAAAPAAAAAAAAbBcAALZRAABsFwAAuFEAAGwXAAC7UQAAbBcAAL1RAABsFwAAv1EAAGwXAADBUQAAbBcAAMNRAABsFwAAxVEAAGwXAADHUQAAbBcAAMlRAABsFwAAy1EAAGwXAADNUQAAbBcAAM9RAABsFwAA0VEAAOAWAADTUQAA8A4AAAAAAADgFgAARlIAAOgOAAAAAAAAuBYAAGJSAACkFwAAe1IAAAAAAAABAAAAWBAAAAAAAADgFgAA9FIAAIgQAAAAAAAA4BYAABdTAACYEAAAAAAAALgWAAAuUwAA4BYAAHBTAACIEAAAAAAAAOAWAACSUwAASA8AAAAAAAAAAAAAAAoAAAEAAAACAAAAAwAAAAEAAAAEAAAAAAAAABAKAAABAAAABQAAAAYAAAACAAAABwAAAAAAAAAgCgAACAAAAAkAAAABAAAAAAAAADgKAAAKAAAACwAAAAIAAAABAAAADAAAAA0AAAACAAAAAwAAAAMAAAAAAAAASAoAAAgAAAAOAAAAAQAAAAAAAABYCgAACAAAAA8AAAABAAAAAAAAAIAKAAAIAAAAEAAAAAEAAAAAAAAAcAoAAAgAAAARAAAAAQAAAAAAAACQCgAACAAAABIAAAABAAAAAAAAAKAKAAAIAAAAEwAAAAEAAAAAAAAAsAoAAAgAAAAUAAAAAQAAAAAAAADACgAACAAAABUAAAABAAAAAAAAANAKAAABAAAAFgAAABcAAAAEAAAAGAAAAAAAAADgCgAACAAAABkAAAABAAAAAAAAAPgKAAAFAAAAGgAAABsAAAAAAAAA8AoAAAEAAAAcAAAAHQAAAAAAAAAICwAAAQAAAB4AAAAfAAAABgAAACAAAAAAAAAAIAsAACEAAAAiAAAABwAAAAgAAAAAAAAAGAsAACMAAAAkAAAABwAAAAkAAAAAAAAAMAsAAAEAAAAlAAAAJgAAAAoAAAAnAAAAAAAAAEALAAAoAAAAKQAAAAcAAAALAAAAAAAAAFALAAABAAAAKgAAACsAAAAMAAAALAAAAAAAAABgCwAALQAAAC4AAAAHAAAADQAAAAAAAABwCwAAAQAAAC8AAAAwAAAADgAAADEAAAAAAAAAgAsAADIAAAAzAAAABwAAAA8AAAAAAAAAkAsAAAEAAAA0AAAANQAAABAAAAA2AAAAAAAAAKALAAARAAAANwAAADgAAAAAAAAAsAsAAAEAAAA5AAAAOgAAABIAAAA7AAAAAAAAAMALAAATAAAAPAAAAD0AAAAAAAAA0AsAAAEAAAA+AAAAPwAAABQAAABAAAAAAAAAAOALAAAVAAAAQQAAAEIAAAAAAAAA8AsAAAEAAABDAAAARAAAABYAAABFAAAAAAAAAAAMAAAXAAAARgAAAEcAAAAAAAAAEAwAAAEAAABIAAAASQAAABgAAABKAAAAAAAAACAMAAABAAAASwAAAEwAAAAZAAAATQAAAAAAAAAwDAAAAQAAAE4AAABPAAAAGgAAAFAAAAAAAAAAQAwAABsAAABRAAAAUgAAAAAAAABQDAAAAQAAAFMAAABUAAAAHAAAAFUAAAAAAAAAYAwAAFYAAABXAAAABwAAAB0AAAAAAAAAcAwAAAEAAABYAAAAWQAAAB4AAABaAAAAAAAAAIAMAABbAAAAXAAAAAcAAAAfAAAAAAAAAJAMAAABAAAAXQAAAF4AAAAgAAAAXwAAAAAAAACgDAAAYAAAAGEAAAAHAAAAIQAAAAAAAACwDAAAAQAAAGIAAABjAAAAIgAAAGQAAAAAAAAAwAwAAGUAAABmAAAABwAAACMAAAAAAAAA0AwAAAEAAABnAAAAaAAAACQAAABpAAAAAAAAAOAMAABqAAAAawAAAAcAAAAlAAAAAAAAAPAMAAABAAAAbAAAAG0AAAAmAAAAbgAAAAAAAAAADQAAbwAAAHAAAAAHAAAAJwAAAAAAAAAQDQAAAQAAAHEAAAByAAAAKAAAAHMAAAAoDQAAyA8AACgNAAAIEAAAEBAAACgNAABQDQAAyA8AAFANAAAgEAAAyA8AAFANAAAIEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABsVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDgAAdAAAAHUAAAB2AAAAdwAAAAIAAAABAAAAAQAAAAEAAAAAAAAAGA8AAHQAAAB4AAAAdgAAAHcAAAACAAAAAgAAAAIAAAACAAAAAAAAACgPAAB5AAAAegAAAAQAAAAAAAAAOA8AAHsAAAB8AAAABQAAAAAAAABIDwAACAAAAH0AAAABAAAAAAAAAFgPAAB7AAAAfgAAAAUAAAAAAAAAaA8AAHsAAAB/AAAABQAAAAAAAAC4DwAAdAAAAIAAAAB2AAAAdwAAAAMAAAAAAAAAiA8AAHQAAACBAAAAdgAAAHcAAAAEAAAAAAAAADgQAAB0AAAAggAAAHYAAAB3AAAAAgAAAAMAAAADAAAAAwAAAAAAAABIEAAAgwAAAIQAAAAGAAAAAAAAAHgQAACFAAAAhgAAAAcAAAABAAAABQAAAAYAAAACAAAAAAAAAKAQAACFAAAAhwAAAAgAAAADAAAABQAAAAYAAAAEAAAA4BcAAAQYAAAAAAAAsBAAAIgAAACJAAAAAQAAAExBU1ppcABvcGVuAGdldFBvaW50AGdldENvdW50AER5bmFtaWNMQVNaaXAAYWRkRmllbGRGbG9hdGluZwBhZGRGaWVsZFNpZ25lZABhZGRGaWVsZFVuc2lnbmVkAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9wb2ludGVySVBONmxhc3ppcDdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRU5TXzE0ZGVmYXVsdF9kZWxldGVJUzNfRUVOU185YWxsb2NhdG9ySVMzX0VFRUUATlN0M19fMjE0ZGVmYXVsdF9kZWxldGVJTjZsYXN6aXA3c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfcG9pbnRlcklQTjZsYXN6aXAyaW82cmVhZGVyMTBiYXNpY19maWxlSU5TMV83c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRU5TXzE0ZGVmYXVsdF9kZWxldGVJUzdfRUVOU185YWxsb2NhdG9ySVM3X0VFRUUATlN0M19fMjE0ZGVmYXVsdF9kZWxldGVJTjZsYXN6aXAyaW82cmVhZGVyMTBiYXNpY19maWxlSU5TMV83c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFAExBU0YATjZsYXN6aXAxM2ludmFsaWRfbWFnaWNFAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemUARmlsZSBtYWdpYyBpcyBub3QgdmFsaWQATlN0M19fMjEwX19mdW5jdGlvbjZfX2Z1bmNJWk42bGFzemlwMmlvNnJlYWRlcjEwYmFzaWNfZmlsZUlOUzJfN3N0cmVhbXMxM21lbW9yeV9zdHJlYW1FRTExX3ZhbGlkYXRvcnNFdkVVbFJOUzNfNmhlYWRlckVFX05TXzlhbGxvY2F0b3JJU0JfRUVGdlNBX0VFRQBOU3QzX18yMTBfX2Z1bmN0aW9uNl9fYmFzZUlGdlJONmxhc3ppcDJpbzZoZWFkZXJFRUVFAE42bGFzemlwMjFvbGRfc3R5bGVfY29tcHJlc3Npb25FAE42bGFzemlwMTRub3RfY29tcHJlc3NlZEUAVGhlIGZpbGUgc2VlbXMgdG8gaGF2ZSBvbGQgc3R5bGUgY29tcHJlc3Npb24gd2hpY2ggaXMgbm90IHN1cHBvcnRlZABUaGUgZmlsZSBkb2Vzbid0IHNlZW0gdG8gYmUgY29tcHJlc3NlZABaTjZsYXN6aXAyaW82cmVhZGVyMTBiYXNpY19maWxlSU5TXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUUxMV92YWxpZGF0b3JzRXZFVWxSTlMwXzZoZWFkZXJFRV8AbGFzemlwIGVuY29kZWQATjZsYXN6aXAxM25vX2xhc3ppcF92bHJFAE42bGFzemlwMjVsYXN6aXBfZm9ybWF0X3Vuc3VwcG9ydGVkRQBPbmx5IExBU3ppcCBQT0lOVFdJU0UgQ0hVTktFRCBkZWNvbXByZXNzb3IgaXMgc3VwcG9ydGVkAE5vIExBU3ppcCBWTFIgd2FzIGZvdW5kIGluIHRoZSBWTFJzIHNlY3Rpb24ATjZsYXN6aXAyMmNodW5rX3RhYmxlX3JlYWRfZXJyb3JFAENodW5rIHRhYmxlIG9mZnNldCA9PSAtMSBpcyBub3Qgc3VwcG9ydGVkIGF0IHRoaXMgdGltZQBONmxhc3ppcDEzbm90X3N1cHBvcnRlZEUATjZsYXN6aXAyNnVua25vd25fY2h1bmtfdGFibGVfZm9ybWF0RQBjaHVua19zaXplID09IHVpbnQubWF4IGlzIG5vdCBzdXBwb3J0ZWQgYXQgdGhpcyB0aW1lLgBUaGVyZSB3YXMgYSBwcm9ibGVtIHJlYWRpbmcgdGhlIGNodW5rIHRhYmxlAFRoZSBjaHVuayB0YWJsZSB2ZXJzaW9uIG51bWJlciBpcyB1bmtub3duAE42bGFzemlwMTFlbmRfb2ZfZmlsZUUAUmVhY2hlZCBFbmQgb2YgZmlsZQBJbnZhbGlkIG51bWJlciBvZiBzeW1ib2xzAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9wb2ludGVySVBONmxhc3ppcDhkZWNvZGVyczEwYXJpdGhtZXRpY0lOUzFfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlMxXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVOU18xNGRlZmF1bHRfZGVsZXRlSVM5X0VFTlNfOWFsbG9jYXRvcklTOV9FRUVFAE5TdDNfXzIxNGRlZmF1bHRfZGVsZXRlSU42bGFzemlwOGRlY29kZXJzMTBhcml0aG1ldGljSU5TMV8yaW8xOF9faWZzdHJlYW1fd3JhcHBlcklOUzFfN3N0cmVhbXMxM21lbW9yeV9zdHJlYW1FRUVFRUVFAE42bGFzemlwMTl1bmtub3duX3NjaGVtYV90eXBlRQBUaGUgTEFaIHNjaGVtYSBpcyBub3QgcmVjb2duaXplZABONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2ZpZWxkX2RlY29tcHJlc3NvcklOU184ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlNfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlNfN3N0cmVhbXMxM21lbW9yeV9zdHJlYW1FRUVFRUVFAE42bGFzemlwN2Zvcm1hdHMyMGR5bmFtaWNfZGVjb21wcmVzc29yRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfcG9pbnRlcklQTjZsYXN6aXA3Zm9ybWF0czI2ZHluYW1pY19maWVsZF9kZWNvbXByZXNzb3JJTlMxXzhkZWNvZGVyczEwYXJpdGhtZXRpY0lOUzFfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlMxXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVFRU5TXzE0ZGVmYXVsdF9kZWxldGVJU0NfRUVOU185YWxsb2NhdG9ySVNDX0VFRUUATlN0M19fMjE0ZGVmYXVsdF9kZWxldGVJTjZsYXN6aXA3Zm9ybWF0czI2ZHluYW1pY19maWVsZF9kZWNvbXByZXNzb3JJTlMxXzhkZWNvZGVyczEwYXJpdGhtZXRpY0lOUzFfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlMxXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVFRUVFAE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TXzhkZWNvZGVyczEwYXJpdGhtZXRpY0lOU18yaW8xOF9faWZzdHJlYW1fd3JhcHBlcklOU183c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMwXzVmaWVsZElOUzBfM2xhczdwb2ludDEwRU5TMF8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSVNDX0VFRUVFRQBONmxhc3ppcDdmb3JtYXRzMTBiYXNlX2ZpZWxkRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfcG9pbnRlcklQTjZsYXN6aXA3Zm9ybWF0czI2ZHluYW1pY19kZWNvbXByZXNzb3JfZmllbGRJTlMxXzhkZWNvZGVyczEwYXJpdGhtZXRpY0lOUzFfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlMxXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVOUzJfNWZpZWxkSU5TMl8zbGFzN3BvaW50MTBFTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJU0VfRUVFRUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTSV9FRU5TXzlhbGxvY2F0b3JJU0lfRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2RlY29tcHJlc3Nvcl9maWVsZElOUzFfOGRlY29kZXJzMTBhcml0aG1ldGljSU5TMV8yaW8xOF9faWZzdHJlYW1fd3JhcHBlcklOUzFfN3N0cmVhbXMxM21lbW9yeV9zdHJlYW1FRUVFRU5TMl81ZmllbGRJTlMyXzNsYXM3cG9pbnQxMEVOUzJfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElTRV9FRUVFRUVFRQBONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2RlY29tcHJlc3Nvcl9maWVsZElOU184ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlNfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlNfN3N0cmVhbXMxM21lbW9yeV9zdHJlYW1FRUVFRU5TMF81ZmllbGRJTlMwXzNsYXM3Z3BzdGltZUVOUzBfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElTQ19FRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlMxXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TMV83c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMyXzVmaWVsZElOUzJfM2xhczdncHN0aW1lRU5TMl8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSVNFX0VFRUVFRU5TXzE0ZGVmYXVsdF9kZWxldGVJU0lfRUVOU185YWxsb2NhdG9ySVNJX0VFRUUATlN0M19fMjE0ZGVmYXVsdF9kZWxldGVJTjZsYXN6aXA3Zm9ybWF0czI2ZHluYW1pY19kZWNvbXByZXNzb3JfZmllbGRJTlMxXzhkZWNvZGVyczEwYXJpdGhtZXRpY0lOUzFfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlMxXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVOUzJfNWZpZWxkSU5TMl8zbGFzN2dwc3RpbWVFTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJU0VfRUVFRUVFRUUATjZsYXN6aXA3Zm9ybWF0czI2ZHluYW1pY19kZWNvbXByZXNzb3JfZmllbGRJTlNfOGRlY29kZXJzMTBhcml0aG1ldGljSU5TXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVOUzBfNWZpZWxkSU5TMF8zbGFzM3JnYkVOUzBfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElTQ19FRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlMxXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TMV83c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMyXzVmaWVsZElOUzJfM2xhczNyZ2JFTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJU0VfRUVFRUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTSV9FRU5TXzlhbGxvY2F0b3JJU0lfRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2RlY29tcHJlc3Nvcl9maWVsZElOUzFfOGRlY29kZXJzMTBhcml0aG1ldGljSU5TMV8yaW8xOF9faWZzdHJlYW1fd3JhcHBlcklOUzFfN3N0cmVhbXMxM21lbW9yeV9zdHJlYW1FRUVFRU5TMl81ZmllbGRJTlMyXzNsYXMzcmdiRU5TMl8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSVNFX0VFRUVFRUVFAE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TXzhkZWNvZGVyczEwYXJpdGhtZXRpY0lOU18yaW8xOF9faWZzdHJlYW1fd3JhcHBlcklOU183c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMwXzVmaWVsZElOUzBfM2xhczEwZXh0cmFieXRlc0VOUzBfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElTQ19FRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlMxXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TMV83c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMyXzVmaWVsZElOUzJfM2xhczEwZXh0cmFieXRlc0VOUzJfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElTRV9FRUVFRUVOU18xNGRlZmF1bHRfZGVsZXRlSVNJX0VFTlNfOWFsbG9jYXRvcklTSV9FRUVFAE5TdDNfXzIxNGRlZmF1bHRfZGVsZXRlSU42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlMxXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TMV83c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMyXzVmaWVsZElOUzJfM2xhczEwZXh0cmFieXRlc0VOUzJfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElTRV9FRUVFRUVFRQBONmxhc3ppcDdmb3JtYXRzMjFkeW5hbWljX2RlY29tcHJlc3NvcjFJTlNfOGRlY29kZXJzMTBhcml0aG1ldGljSU5TXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVOUzBfMTlyZWNvcmRfZGVjb21wcmVzc29ySUpOUzBfNWZpZWxkSU5TMF8zbGFzN3BvaW50MTBFTlMwXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJU0RfRUVFRUVFRUVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9wb2ludGVySVBONmxhc3ppcDdmb3JtYXRzMjFkeW5hbWljX2RlY29tcHJlc3NvcjFJTlMxXzhkZWNvZGVyczEwYXJpdGhtZXRpY0lOUzFfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlMxXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVOUzJfMTlyZWNvcmRfZGVjb21wcmVzc29ySUpOUzJfNWZpZWxkSU5TMl8zbGFzN3BvaW50MTBFTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJU0ZfRUVFRUVFRUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTS19FRU5TXzlhbGxvY2F0b3JJU0tfRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDdmb3JtYXRzMjFkeW5hbWljX2RlY29tcHJlc3NvcjFJTlMxXzhkZWNvZGVyczEwYXJpdGhtZXRpY0lOUzFfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlMxXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVOUzJfMTlyZWNvcmRfZGVjb21wcmVzc29ySUpOUzJfNWZpZWxkSU5TMl8zbGFzN3BvaW50MTBFTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJU0ZfRUVFRUVFRUVFRUUATjZsYXN6aXA3Zm9ybWF0czIxZHluYW1pY19kZWNvbXByZXNzb3IxSU5TXzhkZWNvZGVyczEwYXJpdGhtZXRpY0lOU18yaW8xOF9faWZzdHJlYW1fd3JhcHBlcklOU183c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMwXzE5cmVjb3JkX2RlY29tcHJlc3NvcklKTlMwXzVmaWVsZElOUzBfM2xhczdwb2ludDEwRU5TMF8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSVNEX0VFRUVOU0JfSU5TQ183Z3BzdGltZUVOU0VfSVNIX0VFRUVFRUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfcG9pbnRlcklQTjZsYXN6aXA3Zm9ybWF0czIxZHluYW1pY19kZWNvbXByZXNzb3IxSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlMxXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TMV83c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMyXzE5cmVjb3JkX2RlY29tcHJlc3NvcklKTlMyXzVmaWVsZElOUzJfM2xhczdwb2ludDEwRU5TMl8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSVNGX0VFRUVOU0RfSU5TRV83Z3BzdGltZUVOU0dfSVNKX0VFRUVFRUVFRU5TXzE0ZGVmYXVsdF9kZWxldGVJU05fRUVOU185YWxsb2NhdG9ySVNOX0VFRUUATlN0M19fMjE0ZGVmYXVsdF9kZWxldGVJTjZsYXN6aXA3Zm9ybWF0czIxZHluYW1pY19kZWNvbXByZXNzb3IxSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlMxXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TMV83c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMyXzE5cmVjb3JkX2RlY29tcHJlc3NvcklKTlMyXzVmaWVsZElOUzJfM2xhczdwb2ludDEwRU5TMl8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSVNGX0VFRUVOU0RfSU5TRV83Z3BzdGltZUVOU0dfSVNKX0VFRUVFRUVFRUVFAE42bGFzemlwN2Zvcm1hdHMyMWR5bmFtaWNfZGVjb21wcmVzc29yMUlOU184ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlNfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlNfN3N0cmVhbXMxM21lbW9yeV9zdHJlYW1FRUVFRU5TMF8xOXJlY29yZF9kZWNvbXByZXNzb3JJSk5TMF81ZmllbGRJTlMwXzNsYXM3cG9pbnQxMEVOUzBfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElTRF9FRUVFTlNCX0lOU0NfM3JnYkVOU0VfSVNIX0VFRUVFRUVFRQBOU3QzX18yMjBfX3NoYXJlZF9wdHJfcG9pbnRlcklQTjZsYXN6aXA3Zm9ybWF0czIxZHluYW1pY19kZWNvbXByZXNzb3IxSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlMxXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TMV83c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMyXzE5cmVjb3JkX2RlY29tcHJlc3NvcklKTlMyXzVmaWVsZElOUzJfM2xhczdwb2ludDEwRU5TMl8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSVNGX0VFRUVOU0RfSU5TRV8zcmdiRU5TR19JU0pfRUVFRUVFRUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTTl9FRU5TXzlhbGxvY2F0b3JJU05fRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDdmb3JtYXRzMjFkeW5hbWljX2RlY29tcHJlc3NvcjFJTlMxXzhkZWNvZGVyczEwYXJpdGhtZXRpY0lOUzFfMmlvMThfX2lmc3RyZWFtX3dyYXBwZXJJTlMxXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVOUzJfMTlyZWNvcmRfZGVjb21wcmVzc29ySUpOUzJfNWZpZWxkSU5TMl8zbGFzN3BvaW50MTBFTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJU0ZfRUVFRU5TRF9JTlNFXzNyZ2JFTlNHX0lTSl9FRUVFRUVFRUVFRQBONmxhc3ppcDdmb3JtYXRzMjFkeW5hbWljX2RlY29tcHJlc3NvcjFJTlNfOGRlY29kZXJzMTBhcml0aG1ldGljSU5TXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TXzdzdHJlYW1zMTNtZW1vcnlfc3RyZWFtRUVFRUVOUzBfMTlyZWNvcmRfZGVjb21wcmVzc29ySUpOUzBfNWZpZWxkSU5TMF8zbGFzN3BvaW50MTBFTlMwXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJU0RfRUVFRU5TQl9JTlNDXzdncHN0aW1lRU5TRV9JU0hfRUVFRU5TQl9JTlNDXzNyZ2JFTlNFX0lTS19FRUVFRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwN2Zvcm1hdHMyMWR5bmFtaWNfZGVjb21wcmVzc29yMUlOUzFfOGRlY29kZXJzMTBhcml0aG1ldGljSU5TMV8yaW8xOF9faWZzdHJlYW1fd3JhcHBlcklOUzFfN3N0cmVhbXMxM21lbW9yeV9zdHJlYW1FRUVFRU5TMl8xOXJlY29yZF9kZWNvbXByZXNzb3JJSk5TMl81ZmllbGRJTlMyXzNsYXM3cG9pbnQxMEVOUzJfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElTRl9FRUVFTlNEX0lOU0VfN2dwc3RpbWVFTlNHX0lTSl9FRUVFTlNEX0lOU0VfM3JnYkVOU0dfSVNNX0VFRUVFRUVFRU5TXzE0ZGVmYXVsdF9kZWxldGVJU1FfRUVOU185YWxsb2NhdG9ySVNRX0VFRUUATlN0M19fMjE0ZGVmYXVsdF9kZWxldGVJTjZsYXN6aXA3Zm9ybWF0czIxZHluYW1pY19kZWNvbXByZXNzb3IxSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJTlMxXzJpbzE4X19pZnN0cmVhbV93cmFwcGVySU5TMV83c3RyZWFtczEzbWVtb3J5X3N0cmVhbUVFRUVFTlMyXzE5cmVjb3JkX2RlY29tcHJlc3NvcklKTlMyXzVmaWVsZElOUzJfM2xhczdwb2ludDEwRU5TMl8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSVNGX0VFRUVOU0RfSU5TRV83Z3BzdGltZUVOU0dfSVNKX0VFRUVOU0RfSU5TRV8zcmdiRU5TR19JU01fRUVFRUVFRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUDEwYnVmX3N0cmVhbU5TXzE0ZGVmYXVsdF9kZWxldGVJUzFfRUVOU185YWxsb2NhdG9ySVMxX0VFRUUATlN0M19fMjE0ZGVmYXVsdF9kZWxldGVJMTBidWZfc3RyZWFtRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwOGRlY29kZXJzMTBhcml0aG1ldGljSTEwYnVmX3N0cmVhbUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTNV9FRU5TXzlhbGxvY2F0b3JJUzVfRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDhkZWNvZGVyczEwYXJpdGhtZXRpY0kxMGJ1Zl9zdHJlYW1FRUVFAE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZmllbGRfZGVjb21wcmVzc29ySU5TXzhkZWNvZGVyczEwYXJpdGhtZXRpY0kxMGJ1Zl9zdHJlYW1FRUVFAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9wb2ludGVySVBONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2ZpZWxkX2RlY29tcHJlc3NvcklOUzFfOGRlY29kZXJzMTBhcml0aG1ldGljSTEwYnVmX3N0cmVhbUVFRUVOU18xNGRlZmF1bHRfZGVsZXRlSVM4X0VFTlNfOWFsbG9jYXRvcklTOF9FRUVFAE5TdDNfXzIxNGRlZmF1bHRfZGVsZXRlSU42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZmllbGRfZGVjb21wcmVzc29ySU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJMTBidWZfc3RyZWFtRUVFRUVFAE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TXzhkZWNvZGVyczEwYXJpdGhtZXRpY0kxMGJ1Zl9zdHJlYW1FRU5TMF81ZmllbGRJaU5TMF8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSWlFRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJMTBidWZfc3RyZWFtRUVOUzJfNWZpZWxkSWlOUzJfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElpRUVFRUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTQ19FRU5TXzlhbGxvY2F0b3JJU0NfRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2RlY29tcHJlc3Nvcl9maWVsZElOUzFfOGRlY29kZXJzMTBhcml0aG1ldGljSTEwYnVmX3N0cmVhbUVFTlMyXzVmaWVsZElpTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJaUVFRUVFRUVFAE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TXzhkZWNvZGVyczEwYXJpdGhtZXRpY0kxMGJ1Zl9zdHJlYW1FRU5TMF81ZmllbGRJak5TMF8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSWpFRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJMTBidWZfc3RyZWFtRUVOUzJfNWZpZWxkSWpOUzJfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElqRUVFRUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTQ19FRU5TXzlhbGxvY2F0b3JJU0NfRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2RlY29tcHJlc3Nvcl9maWVsZElOUzFfOGRlY29kZXJzMTBhcml0aG1ldGljSTEwYnVmX3N0cmVhbUVFTlMyXzVmaWVsZElqTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJakVFRUVFRUVFAE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TXzhkZWNvZGVyczEwYXJpdGhtZXRpY0kxMGJ1Zl9zdHJlYW1FRU5TMF81ZmllbGRJYU5TMF8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSWFFRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJMTBidWZfc3RyZWFtRUVOUzJfNWZpZWxkSWFOUzJfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElhRUVFRUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTQ19FRU5TXzlhbGxvY2F0b3JJU0NfRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2RlY29tcHJlc3Nvcl9maWVsZElOUzFfOGRlY29kZXJzMTBhcml0aG1ldGljSTEwYnVmX3N0cmVhbUVFTlMyXzVmaWVsZElhTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJYUVFRUVFRUVFAE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TXzhkZWNvZGVyczEwYXJpdGhtZXRpY0kxMGJ1Zl9zdHJlYW1FRU5TMF81ZmllbGRJc05TMF8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSXNFRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJMTBidWZfc3RyZWFtRUVOUzJfNWZpZWxkSXNOUzJfMjBzdGFuZGFyZF9kaWZmX21ldGhvZElzRUVFRUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTQ19FRU5TXzlhbGxvY2F0b3JJU0NfRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2RlY29tcHJlc3Nvcl9maWVsZElOUzFfOGRlY29kZXJzMTBhcml0aG1ldGljSTEwYnVmX3N0cmVhbUVFTlMyXzVmaWVsZElzTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJc0VFRUVFRUVFAE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TXzhkZWNvZGVyczEwYXJpdGhtZXRpY0kxMGJ1Zl9zdHJlYW1FRU5TMF81ZmllbGRJaE5TMF8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSWhFRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJMTBidWZfc3RyZWFtRUVOUzJfNWZpZWxkSWhOUzJfMjBzdGFuZGFyZF9kaWZmX21ldGhvZEloRUVFRUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTQ19FRU5TXzlhbGxvY2F0b3JJU0NfRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2RlY29tcHJlc3Nvcl9maWVsZElOUzFfOGRlY29kZXJzMTBhcml0aG1ldGljSTEwYnVmX3N0cmVhbUVFTlMyXzVmaWVsZEloTlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJaEVFRUVFRUVFAE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TXzhkZWNvZGVyczEwYXJpdGhtZXRpY0kxMGJ1Zl9zdHJlYW1FRU5TMF81ZmllbGRJdE5TMF8yMHN0YW5kYXJkX2RpZmZfbWV0aG9kSXRFRUVFRUUATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUE42bGFzemlwN2Zvcm1hdHMyNmR5bmFtaWNfZGVjb21wcmVzc29yX2ZpZWxkSU5TMV84ZGVjb2RlcnMxMGFyaXRobWV0aWNJMTBidWZfc3RyZWFtRUVOUzJfNWZpZWxkSXROUzJfMjBzdGFuZGFyZF9kaWZmX21ldGhvZEl0RUVFRUVFTlNfMTRkZWZhdWx0X2RlbGV0ZUlTQ19FRU5TXzlhbGxvY2F0b3JJU0NfRUVFRQBOU3QzX18yMTRkZWZhdWx0X2RlbGV0ZUlONmxhc3ppcDdmb3JtYXRzMjZkeW5hbWljX2RlY29tcHJlc3Nvcl9maWVsZElOUzFfOGRlY29kZXJzMTBhcml0aG1ldGljSTEwYnVmX3N0cmVhbUVFTlMyXzVmaWVsZEl0TlMyXzIwc3RhbmRhcmRfZGlmZl9tZXRob2RJdEVFRUVFRUVFADZMQVNaaXAAUDZMQVNaaXAAUEs2TEFTWmlwAGlpAHYAdmkAdmlpaWkAdmlpaQBpaWkAMTNEeW5hbWljTEFTWmlwAFAxM0R5bmFtaWNMQVNaaXAAUEsxM0R5bmFtaWNMQVNaaXAAdm9pZABib29sAGNoYXIAc2lnbmVkIGNoYXIAdW5zaWduZWQgY2hhcgBzaG9ydAB1bnNpZ25lZCBzaG9ydABpbnQAdW5zaWduZWQgaW50AGxvbmcAdW5zaWduZWQgbG9uZwBmbG9hdABkb3VibGUAc3RkOjpzdHJpbmcAc3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4Ac3RkOjp3c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGVtc2NyaXB0ZW46OnZhbABlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGxvbmcgZG91YmxlPgBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0llRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZEVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWZFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ltRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbEVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWpFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lpRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJdEVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXNFRQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0loRUUATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJYUVFAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQBOMTBlbXNjcmlwdGVuM3ZhbEUATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUATlN0M19fMjIxX19iYXNpY19zdHJpbmdfY29tbW9uSUxiMUVFRQBOU3QzX18yMTJiYXNpY19zdHJpbmdJRHNOU18xMWNoYXJfdHJhaXRzSURzRUVOU185YWxsb2NhdG9ySURzRUVFRQBOU3QzX18yMTJiYXNpY19zdHJpbmdJd05TXzExY2hhcl90cmFpdHNJd0VFTlNfOWFsbG9jYXRvckl3RUVFRQBOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQBOU3QzX18yMTJiYXNpY19zdHJpbmdJY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRQAtKyAgIDBYMHgAKG51bGwpAC0wWCswWCAwWC0weCsweCAweABpbmYASU5GAG5hbgBOQU4ALgB0ZXJtaW5hdGluZyB3aXRoICVzIGV4Y2VwdGlvbiBvZiB0eXBlICVzOiAlcwB0ZXJtaW5hdGluZyB3aXRoICVzIGV4Y2VwdGlvbiBvZiB0eXBlICVzAHRlcm1pbmF0aW5nIHdpdGggJXMgZm9yZWlnbiBleGNlcHRpb24AdGVybWluYXRpbmcAdW5jYXVnaHQAU3Q5ZXhjZXB0aW9uAE4xMF9fY3h4YWJpdjExNl9fc2hpbV90eXBlX2luZm9FAFN0OXR5cGVfaW5mbwBOMTBfX2N4eGFiaXYxMjBfX3NpX2NsYXNzX3R5cGVfaW5mb0UATjEwX19jeHhhYml2MTE3X19jbGFzc190eXBlX2luZm9FAHRlcm1pbmF0ZV9oYW5kbGVyIHVuZXhwZWN0ZWRseSByZXR1cm5lZABzdGQ6OmJhZF9hbGxvYwBTdDliYWRfYWxsb2MAU3QxMWxvZ2ljX2Vycm9yAFN0MTNydW50aW1lX2Vycm9yAFN0MTJsZW5ndGhfZXJyb3IAU3QxMm91dF9vZl9yYW5nZQBOMTBfX2N4eGFiaXYxMTdfX3BiYXNlX3R5cGVfaW5mb0UATjEwX19jeHhhYml2MTE5X19wb2ludGVyX3R5cGVfaW5mb0UATjEwX19jeHhhYml2MTIwX19mdW5jdGlvbl90eXBlX2luZm9FAE4xMF9fY3h4YWJpdjEyOV9fcG9pbnRlcl90b19tZW1iZXJfdHlwZV9pbmZvRQBQdXJlIHZpcnR1YWwgZnVuY3Rpb24gY2FsbGVkIQBOMTBfX2N4eGFiaXYxMjNfX2Z1bmRhbWVudGFsX3R5cGVfaW5mb0UAdgBEbgBiAGMAaABhAHMAdABpAGoAbABtAGYAZABOMTBfX2N4eGFiaXYxMjFfX3ZtaV9jbGFzc190eXBlX2luZm9FAF9fY3hhX2d1YXJkX2FjcXVpcmUgZGV0ZWN0ZWQgcmVjdXJzaXZlIGluaXRpYWxpemF0aW9uAHN0ZDo6YmFkX2Z1bmN0aW9uX2NhbGwATlN0M19fMjE3YmFkX2Z1bmN0aW9uX2NhbGxFAE5TdDNfXzIxNF9fc2hhcmVkX2NvdW50RQBOU3QzX18yMTlfX3NoYXJlZF93ZWFrX2NvdW50RQBtdXRleCBsb2NrIGZhaWxlZABiYXNpY19zdHJpbmcAdW5zcGVjaWZpZWQgZ2VuZXJpY19jYXRlZ29yeSBlcnJvcgBVbmtub3duIGVycm9yICVkAGdlbmVyaWMATlN0M19fMjI0X19nZW5lcmljX2Vycm9yX2NhdGVnb3J5RQBOU3QzX18yMTJfX2RvX21lc3NhZ2VFAE5TdDNfXzIxNGVycm9yX2NhdGVnb3J5RQB1bnNwZWNpZmllZCBzeXN0ZW1fY2F0ZWdvcnkgZXJyb3IAc3lzdGVtAE5TdDNfXzIyM19fc3lzdGVtX2Vycm9yX2NhdGVnb3J5RQBOU3QzX18yMTJzeXN0ZW1fZXJyb3JFADogAHZlY3Rvcg==";
  var tempDoublePtr = 22368;

  function demangle(func) {
    return func
  }

  function demangleAll(text) {
    var regex = /\b__Z[\w\d_]+/g;
    return text.replace(regex, function (x) {
      var y = demangle(x);
      return x === y ? x : y + " [" + x + "]"
    })
  }

  function jsStackTrace() {
    var err = new Error;
    if (!err.stack) {
      try {
        throw new Error
      } catch (e) {
        err = e
      }
      if (!err.stack) {
        return "(no stack trace available)"
      }
    }
    return err.stack.toString()
  }

  function ___cxa_allocate_exception(size) {
    return _malloc(size)
  }
  var ___exception_infos = {};
  var ___exception_caught = [];

  function ___exception_addRef(ptr) {
    if (!ptr) return;
    var info = ___exception_infos[ptr];
    info.refcount++
  }

  function ___exception_deAdjust(adjusted) {
    if (!adjusted || ___exception_infos[adjusted]) return adjusted;
    for (var key in ___exception_infos) {
      var ptr = +key;
      var adj = ___exception_infos[ptr].adjusted;
      var len = adj.length;
      for (var i = 0; i < len; i++) {
        if (adj[i] === adjusted) {
          return ptr
        }
      }
    }
    return adjusted
  }

  function ___cxa_begin_catch(ptr) {
    var info = ___exception_infos[ptr];
    if (info && !info.caught) {
      info.caught = true;
      __ZSt18uncaught_exceptionv.uncaught_exceptions--
    }
    if (info) info.rethrown = false;
    ___exception_caught.push(ptr);
    ___exception_addRef(___exception_deAdjust(ptr));
    return ptr
  }
  var ___exception_last = 0;

  function ___cxa_throw(ptr, type, destructor) {
    ___exception_infos[ptr] = {
      ptr: ptr,
      adjusted: [ptr],
      type: type,
      destructor: destructor,
      refcount: 0,
      caught: false,
      rethrown: false
    };
    ___exception_last = ptr;
    if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
      __ZSt18uncaught_exceptionv.uncaught_exceptions = 1
    } else {
      __ZSt18uncaught_exceptionv.uncaught_exceptions++
    }
    throw ptr
  }

  function ___cxa_uncaught_exceptions() {
    return __ZSt18uncaught_exceptionv.uncaught_exceptions
  }

  function ___gxx_personality_v0() {}

  function getShiftFromSize(size) {
    switch (size) {
    case 1:
      return 0;
    case 2:
      return 1;
    case 4:
      return 2;
    case 8:
      return 3;
    default:
      throw new TypeError("Unknown type size: " + size)
    }
  }

  function embind_init_charCodes() {
    var codes = new Array(256);
    for (var i = 0; i < 256; ++i) {
      codes[i] = String.fromCharCode(i)
    }
    embind_charCodes = codes
  }
  var embind_charCodes = undefined;

  function readLatin1String(ptr) {
    var ret = "";
    var c = ptr;
    while (HEAPU8[c]) {
      ret += embind_charCodes[HEAPU8[c++]]
    }
    return ret
  }
  var awaitingDependencies = {};
  var registeredTypes = {};
  var typeDependencies = {};
  var char_0 = 48;
  var char_9 = 57;

  function makeLegalFunctionName(name) {
    if (undefined === name) {
      return "_unknown"
    }
    name = name.replace(/[^a-zA-Z0-9_]/g, "$");
    var f = name.charCodeAt(0);
    if (f >= char_0 && f <= char_9) {
      return "_" + name
    } else {
      return name
    }
  }

  function createNamedFunction(name, body) {
    name = makeLegalFunctionName(name);
    return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body)
  }

  function extendError(baseErrorType, errorName) {
    var errorClass = createNamedFunction(errorName, function (message) {
      this.name = errorName;
      this.message = message;
      var stack = new Error(message).stack;
      if (stack !== undefined) {
        this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "")
      }
    });
    errorClass.prototype = Object.create(baseErrorType.prototype);
    errorClass.prototype.constructor = errorClass;
    errorClass.prototype.toString = function () {
      if (this.message === undefined) {
        return this.name
      } else {
        return this.name + ": " + this.message
      }
    };
    return errorClass
  }
  var BindingError = undefined;

  function throwBindingError(message) {
    throw new BindingError(message)
  }
  var InternalError = undefined;

  function throwInternalError(message) {
    throw new InternalError(message)
  }

  function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
    myTypes.forEach(function (type) {
      typeDependencies[type] = dependentTypes
    });

    function onComplete(typeConverters) {
      var myTypeConverters = getTypeConverters(typeConverters);
      if (myTypeConverters.length !== myTypes.length) {
        throwInternalError("Mismatched type converter count")
      }
      for (var i = 0; i < myTypes.length; ++i) {
        registerType(myTypes[i], myTypeConverters[i])
      }
    }
    var typeConverters = new Array(dependentTypes.length);
    var unregisteredTypes = [];
    var registered = 0;
    dependentTypes.forEach(function (dt, i) {
      if (registeredTypes.hasOwnProperty(dt)) {
        typeConverters[i] = registeredTypes[dt]
      } else {
        unregisteredTypes.push(dt);
        if (!awaitingDependencies.hasOwnProperty(dt)) {
          awaitingDependencies[dt] = []
        }
        awaitingDependencies[dt].push(function () {
          typeConverters[i] = registeredTypes[dt];
          ++registered;
          if (registered === unregisteredTypes.length) {
            onComplete(typeConverters)
          }
        })
      }
    });
    if (0 === unregisteredTypes.length) {
      onComplete(typeConverters)
    }
  }

  function registerType(rawType, registeredInstance, options) {
    options = options || {};
    if (!("argPackAdvance" in registeredInstance)) {
      throw new TypeError("registerType registeredInstance requires argPackAdvance")
    }
    var name = registeredInstance.name;
    if (!rawType) {
      throwBindingError('type "' + name + '" must have a positive integer typeid pointer')
    }
    if (registeredTypes.hasOwnProperty(rawType)) {
      if (options.ignoreDuplicateRegistrations) {
        return
      } else {
        throwBindingError("Cannot register type '" + name + "' twice")
      }
    }
    registeredTypes[rawType] = registeredInstance;
    delete typeDependencies[rawType];
    if (awaitingDependencies.hasOwnProperty(rawType)) {
      var callbacks = awaitingDependencies[rawType];
      delete awaitingDependencies[rawType];
      callbacks.forEach(function (cb) {
        cb()
      })
    }
  }

  function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    registerType(rawType, {
      name: name,
      "fromWireType": function (wt) {
        return !!wt
      },
      "toWireType": function (destructors, o) {
        return o ? trueValue : falseValue
      },
      "argPackAdvance": 8,
      "readValueFromPointer": function (pointer) {
        var heap;
        if (size === 1) {
          heap = HEAP8
        } else if (size === 2) {
          heap = HEAP16
        } else if (size === 4) {
          heap = HEAP32
        } else {
          throw new TypeError("Unknown boolean type size: " + name)
        }
        return this["fromWireType"](heap[pointer >> shift])
      },
      destructorFunction: null
    })
  }

  function ClassHandle_isAliasOf(other) {
    if (!(this instanceof ClassHandle)) {
      return false
    }
    if (!(other instanceof ClassHandle)) {
      return false
    }
    var leftClass = this.$$.ptrType.registeredClass;
    var left = this.$$.ptr;
    var rightClass = other.$$.ptrType.registeredClass;
    var right = other.$$.ptr;
    while (leftClass.baseClass) {
      left = leftClass.upcast(left);
      leftClass = leftClass.baseClass
    }
    while (rightClass.baseClass) {
      right = rightClass.upcast(right);
      rightClass = rightClass.baseClass
    }
    return leftClass === rightClass && left === right
  }

  function shallowCopyInternalPointer(o) {
    return {
      count: o.count,
      deleteScheduled: o.deleteScheduled,
      preservePointerOnDelete: o.preservePointerOnDelete,
      ptr: o.ptr,
      ptrType: o.ptrType,
      smartPtr: o.smartPtr,
      smartPtrType: o.smartPtrType
    }
  }

  function throwInstanceAlreadyDeleted(obj) {
    function getInstanceTypeName(handle) {
      return handle.$$.ptrType.registeredClass.name
    }
    throwBindingError(getInstanceTypeName(obj) + " instance already deleted")
  }
  var finalizationGroup = false;

  function detachFinalizer(handle) {}

  function runDestructor($$) {
    if ($$.smartPtr) {
      $$.smartPtrType.rawDestructor($$.smartPtr)
    } else {
      $$.ptrType.registeredClass.rawDestructor($$.ptr)
    }
  }

  function releaseClassHandle($$) {
    $$.count.value -= 1;
    var toDelete = 0 === $$.count.value;
    if (toDelete) {
      runDestructor($$)
    }
  }

  function attachFinalizer(handle) {
    if ("undefined" === typeof FinalizationGroup) {
      attachFinalizer = function (handle) {
        return handle
      };
      return handle
    }
    finalizationGroup = new FinalizationGroup(function (iter) {
      for (var result = iter.next(); !result.done; result = iter.next()) {
        var $$ = result.value;
        if (!$$.ptr) {
          console.warn("object already deleted: " + $$.ptr)
        } else {
          releaseClassHandle($$)
        }
      }
    });
    attachFinalizer = function (handle) {
      finalizationGroup.register(handle, handle.$$, handle.$$);
      return handle
    };
    detachFinalizer = function (handle) {
      finalizationGroup.unregister(handle.$$)
    };
    return attachFinalizer(handle)
  }

  function ClassHandle_clone() {
    if (!this.$$.ptr) {
      throwInstanceAlreadyDeleted(this)
    }
    if (this.$$.preservePointerOnDelete) {
      this.$$.count.value += 1;
      return this
    } else {
      var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
        $$: {
          value: shallowCopyInternalPointer(this.$$)
        }
      }));
      clone.$$.count.value += 1;
      clone.$$.deleteScheduled = false;
      return clone
    }
  }

  function ClassHandle_delete() {
    if (!this.$$.ptr) {
      throwInstanceAlreadyDeleted(this)
    }
    if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
      throwBindingError("Object already scheduled for deletion")
    }
    detachFinalizer(this);
    releaseClassHandle(this.$$);
    if (!this.$$.preservePointerOnDelete) {
      this.$$.smartPtr = undefined;
      this.$$.ptr = undefined
    }
  }

  function ClassHandle_isDeleted() {
    return !this.$$.ptr
  }
  var delayFunction = undefined;
  var deletionQueue = [];

  function flushPendingDeletes() {
    while (deletionQueue.length) {
      var obj = deletionQueue.pop();
      obj.$$.deleteScheduled = false;
      obj["delete"]()
    }
  }

  function ClassHandle_deleteLater() {
    if (!this.$$.ptr) {
      throwInstanceAlreadyDeleted(this)
    }
    if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
      throwBindingError("Object already scheduled for deletion")
    }
    deletionQueue.push(this);
    if (deletionQueue.length === 1 && delayFunction) {
      delayFunction(flushPendingDeletes)
    }
    this.$$.deleteScheduled = true;
    return this
  }

  function init_ClassHandle() {
    ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
    ClassHandle.prototype["clone"] = ClassHandle_clone;
    ClassHandle.prototype["delete"] = ClassHandle_delete;
    ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
    ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater
  }

  function ClassHandle() {}
  var registeredPointers = {};

  function ensureOverloadTable(proto, methodName, humanName) {
    if (undefined === proto[methodName].overloadTable) {
      var prevFunc = proto[methodName];
      proto[methodName] = function () {
        if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
          throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!")
        }
        return proto[methodName].overloadTable[arguments.length].apply(this, arguments)
      };
      proto[methodName].overloadTable = [];
      proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
    }
  }

  function exposePublicSymbol(name, value, numArguments) {
    if (Module.hasOwnProperty(name)) {
      if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
        throwBindingError("Cannot register public name '" + name + "' twice")
      }
      ensureOverloadTable(Module, name, name);
      if (Module.hasOwnProperty(numArguments)) {
        throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!")
      }
      Module[name].overloadTable[numArguments] = value
    } else {
      Module[name] = value;
      if (undefined !== numArguments) {
        Module[name].numArguments = numArguments
      }
    }
  }

  function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
    this.name = name;
    this.constructor = constructor;
    this.instancePrototype = instancePrototype;
    this.rawDestructor = rawDestructor;
    this.baseClass = baseClass;
    this.getActualType = getActualType;
    this.upcast = upcast;
    this.downcast = downcast;
    this.pureVirtualFunctions = []
  }

  function upcastPointer(ptr, ptrClass, desiredClass) {
    while (ptrClass !== desiredClass) {
      if (!ptrClass.upcast) {
        throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name)
      }
      ptr = ptrClass.upcast(ptr);
      ptrClass = ptrClass.baseClass
    }
    return ptr
  }

  function constNoSmartPtrRawPointerToWireType(destructors, handle) {
    if (handle === null) {
      if (this.isReference) {
        throwBindingError("null is not a valid " + this.name)
      }
      return 0
    }
    if (!handle.$$) {
      throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
    }
    if (!handle.$$.ptr) {
      throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr
  }

  function genericPointerToWireType(destructors, handle) {
    var ptr;
    if (handle === null) {
      if (this.isReference) {
        throwBindingError("null is not a valid " + this.name)
      }
      if (this.isSmartPointer) {
        ptr = this.rawConstructor();
        if (destructors !== null) {
          destructors.push(this.rawDestructor, ptr)
        }
        return ptr
      } else {
        return 0
      }
    }
    if (!handle.$$) {
      throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
    }
    if (!handle.$$.ptr) {
      throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
    }
    if (!this.isConst && handle.$$.ptrType.isConst) {
      throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name)
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    if (this.isSmartPointer) {
      if (undefined === handle.$$.smartPtr) {
        throwBindingError("Passing raw pointer to smart pointer is illegal")
      }
      switch (this.sharingPolicy) {
      case 0:
        if (handle.$$.smartPtrType === this) {
          ptr = handle.$$.smartPtr
        } else {
          throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name)
        }
        break;
      case 1:
        ptr = handle.$$.smartPtr;
        break;
      case 2:
        if (handle.$$.smartPtrType === this) {
          ptr = handle.$$.smartPtr
        } else {
          var clonedHandle = handle["clone"]();
          ptr = this.rawShare(ptr, __emval_register(function () {
            clonedHandle["delete"]()
          }));
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr)
          }
        }
        break;
      default:
        throwBindingError("Unsupporting sharing policy")
      }
    }
    return ptr
  }

  function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
    if (handle === null) {
      if (this.isReference) {
        throwBindingError("null is not a valid " + this.name)
      }
      return 0
    }
    if (!handle.$$) {
      throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
    }
    if (!handle.$$.ptr) {
      throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
    }
    if (handle.$$.ptrType.isConst) {
      throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name)
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr
  }

  function simpleReadValueFromPointer(pointer) {
    return this["fromWireType"](HEAPU32[pointer >> 2])
  }

  function RegisteredPointer_getPointee(ptr) {
    if (this.rawGetPointee) {
      ptr = this.rawGetPointee(ptr)
    }
    return ptr
  }

  function RegisteredPointer_destructor(ptr) {
    if (this.rawDestructor) {
      this.rawDestructor(ptr)
    }
  }

  function RegisteredPointer_deleteObject(handle) {
    if (handle !== null) {
      handle["delete"]()
    }
  }

  function downcastPointer(ptr, ptrClass, desiredClass) {
    if (ptrClass === desiredClass) {
      return ptr
    }
    if (undefined === desiredClass.baseClass) {
      return null
    }
    var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
    if (rv === null) {
      return null
    }
    return desiredClass.downcast(rv)
  }

  function getInheritedInstanceCount() {
    return Object.keys(registeredInstances).length
  }

  function getLiveInheritedInstances() {
    var rv = [];
    for (var k in registeredInstances) {
      if (registeredInstances.hasOwnProperty(k)) {
        rv.push(registeredInstances[k])
      }
    }
    return rv
  }

  function setDelayFunction(fn) {
    delayFunction = fn;
    if (deletionQueue.length && delayFunction) {
      delayFunction(flushPendingDeletes)
    }
  }

  function init_embind() {
    Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
    Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
    Module["flushPendingDeletes"] = flushPendingDeletes;
    Module["setDelayFunction"] = setDelayFunction
  }
  var registeredInstances = {};

  function getBasestPointer(class_, ptr) {
    if (ptr === undefined) {
      throwBindingError("ptr should not be undefined")
    }
    while (class_.baseClass) {
      ptr = class_.upcast(ptr);
      class_ = class_.baseClass
    }
    return ptr
  }

  function getInheritedInstance(class_, ptr) {
    ptr = getBasestPointer(class_, ptr);
    return registeredInstances[ptr]
  }

  function makeClassHandle(prototype, record) {
    if (!record.ptrType || !record.ptr) {
      throwInternalError("makeClassHandle requires ptr and ptrType")
    }
    var hasSmartPtrType = !!record.smartPtrType;
    var hasSmartPtr = !!record.smartPtr;
    if (hasSmartPtrType !== hasSmartPtr) {
      throwInternalError("Both smartPtrType and smartPtr must be specified")
    }
    record.count = {
      value: 1
    };
    return attachFinalizer(Object.create(prototype, {
      $$: {
        value: record
      }
    }))
  }

  function RegisteredPointer_fromWireType(ptr) {
    var rawPointer = this.getPointee(ptr);
    if (!rawPointer) {
      this.destructor(ptr);
      return null
    }
    var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
    if (undefined !== registeredInstance) {
      if (0 === registeredInstance.$$.count.value) {
        registeredInstance.$$.ptr = rawPointer;
        registeredInstance.$$.smartPtr = ptr;
        return registeredInstance["clone"]()
      } else {
        var rv = registeredInstance["clone"]();
        this.destructor(ptr);
        return rv
      }
    }

    function makeDefaultHandle() {
      if (this.isSmartPointer) {
        return makeClassHandle(this.registeredClass.instancePrototype, {
          ptrType: this.pointeeType,
          ptr: rawPointer,
          smartPtrType: this,
          smartPtr: ptr
        })
      } else {
        return makeClassHandle(this.registeredClass.instancePrototype, {
          ptrType: this,
          ptr: ptr
        })
      }
    }
    var actualType = this.registeredClass.getActualType(rawPointer);
    var registeredPointerRecord = registeredPointers[actualType];
    if (!registeredPointerRecord) {
      return makeDefaultHandle.call(this)
    }
    var toType;
    if (this.isConst) {
      toType = registeredPointerRecord.constPointerType
    } else {
      toType = registeredPointerRecord.pointerType
    }
    var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
    if (dp === null) {
      return makeDefaultHandle.call(this)
    }
    if (this.isSmartPointer) {
      return makeClassHandle(toType.registeredClass.instancePrototype, {
        ptrType: toType,
        ptr: dp,
        smartPtrType: this,
        smartPtr: ptr
      })
    } else {
      return makeClassHandle(toType.registeredClass.instancePrototype, {
        ptrType: toType,
        ptr: dp
      })
    }
  }

  function init_RegisteredPointer() {
    RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
    RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
    RegisteredPointer.prototype["argPackAdvance"] = 8;
    RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
    RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
    RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType
  }

  function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
    this.name = name;
    this.registeredClass = registeredClass;
    this.isReference = isReference;
    this.isConst = isConst;
    this.isSmartPointer = isSmartPointer;
    this.pointeeType = pointeeType;
    this.sharingPolicy = sharingPolicy;
    this.rawGetPointee = rawGetPointee;
    this.rawConstructor = rawConstructor;
    this.rawShare = rawShare;
    this.rawDestructor = rawDestructor;
    if (!isSmartPointer && registeredClass.baseClass === undefined) {
      if (isConst) {
        this["toWireType"] = constNoSmartPtrRawPointerToWireType;
        this.destructorFunction = null
      } else {
        this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
        this.destructorFunction = null
      }
    } else {
      this["toWireType"] = genericPointerToWireType
    }
  }

  function replacePublicSymbol(name, value, numArguments) {
    if (!Module.hasOwnProperty(name)) {
      throwInternalError("Replacing nonexistant public symbol")
    }
    if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
      Module[name].overloadTable[numArguments] = value
    } else {
      Module[name] = value;
      Module[name].argCount = numArguments
    }
  }

  function embind__requireFunction(signature, rawFunction) {
    signature = readLatin1String(signature);

    function makeDynCaller(dynCall) {
      var args = [];
      for (var i = 1; i < signature.length; ++i) {
        args.push("a" + i)
      }
      var name = "dynCall_" + signature + "_" + rawFunction;
      var body = "return function " + name + "(" + args.join(", ") + ") {\n";
      body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
      body += "};\n";
      return new Function("dynCall", "rawFunction", body)(dynCall, rawFunction)
    }
    var dc = Module["dynCall_" + signature];
    var fp = makeDynCaller(dc);
    if (typeof fp !== "function") {
      throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction)
    }
    return fp
  }
  var UnboundTypeError = undefined;

  function getTypeName(type) {
    var ptr = ___getTypeName(type);
    var rv = readLatin1String(ptr);
    _free(ptr);
    return rv
  }

  function throwUnboundTypeError(message, types) {
    var unboundTypes = [];
    var seen = {};

    function visit(type) {
      if (seen[type]) {
        return
      }
      if (registeredTypes[type]) {
        return
      }
      if (typeDependencies[type]) {
        typeDependencies[type].forEach(visit);
        return
      }
      unboundTypes.push(type);
      seen[type] = true
    }
    types.forEach(visit);
    throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]))
  }

  function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
    name = readLatin1String(name);
    getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
    if (upcast) {
      upcast = embind__requireFunction(upcastSignature, upcast)
    }
    if (downcast) {
      downcast = embind__requireFunction(downcastSignature, downcast)
    }
    rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
    var legalFunctionName = makeLegalFunctionName(name);
    exposePublicSymbol(legalFunctionName, function () {
      throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [baseClassRawType])
    });
    whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], function (base) {
      base = base[0];
      var baseClass;
      var basePrototype;
      if (baseClassRawType) {
        baseClass = base.registeredClass;
        basePrototype = baseClass.instancePrototype
      } else {
        basePrototype = ClassHandle.prototype
      }
      var constructor = createNamedFunction(legalFunctionName, function () {
        if (Object.getPrototypeOf(this) !== instancePrototype) {
          throw new BindingError("Use 'new' to construct " + name)
        }
        if (undefined === registeredClass.constructor_body) {
          throw new BindingError(name + " has no accessible constructor")
        }
        var body = registeredClass.constructor_body[arguments.length];
        if (undefined === body) {
          throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!")
        }
        return body.apply(this, arguments)
      });
      var instancePrototype = Object.create(basePrototype, {
        constructor: {
          value: constructor
        }
      });
      constructor.prototype = instancePrototype;
      var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
      var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
      var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
      var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
      registeredPointers[rawType] = {
        pointerType: pointerConverter,
        constPointerType: constPointerConverter
      };
      replacePublicSymbol(legalFunctionName, constructor);
      return [referenceConverter, pointerConverter, constPointerConverter]
    })
  }

  function heap32VectorToArray(count, firstElement) {
    var array = [];
    for (var i = 0; i < count; i++) {
      array.push(HEAP32[(firstElement >> 2) + i])
    }
    return array
  }

  function runDestructors(destructors) {
    while (destructors.length) {
      var ptr = destructors.pop();
      var del = destructors.pop();
      del(ptr)
    }
  }

  function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
    assert(argCount > 0);
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    invoker = embind__requireFunction(invokerSignature, invoker);
    var args = [rawConstructor];
    var destructors = [];
    whenDependentTypesAreResolved([], [rawClassType], function (classType) {
      classType = classType[0];
      var humanName = "constructor " + classType.name;
      if (undefined === classType.registeredClass.constructor_body) {
        classType.registeredClass.constructor_body = []
      }
      if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
        throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!")
      }
      classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
        throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes)
      };
      whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
        classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
          if (arguments.length !== argCount - 1) {
            throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1))
          }
          destructors.length = 0;
          args.length = argCount;
          for (var i = 1; i < argCount; ++i) {
            args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1])
          }
          var ptr = invoker.apply(null, args);
          runDestructors(destructors);
          return argTypes[0]["fromWireType"](ptr)
        };
        return []
      });
      return []
    })
  }

  function new_(constructor, argumentList) {
    if (!(constructor instanceof Function)) {
      throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function")
    }
    var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function () {});
    dummy.prototype = constructor.prototype;
    var obj = new dummy;
    var r = constructor.apply(obj, argumentList);
    return r instanceof Object ? r : obj
  }

  function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
    var argCount = argTypes.length;
    if (argCount < 2) {
      throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")
    }
    var isClassMethodFunc = argTypes[1] !== null && classType !== null;
    var needsDestructorStack = false;
    for (var i = 1; i < argTypes.length; ++i) {
      if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
        needsDestructorStack = true;
        break
      }
    }
    var returns = argTypes[0].name !== "void";
    var argsList = "";
    var argsListWired = "";
    for (var i = 0; i < argCount - 2; ++i) {
      argsList += (i !== 0 ? ", " : "") + "arg" + i;
      argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired"
    }
    var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
    if (needsDestructorStack) {
      invokerFnBody += "var destructors = [];\n"
    }
    var dtorStack = needsDestructorStack ? "destructors" : "null";
    var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
    var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
    if (isClassMethodFunc) {
      invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n"
    }
    for (var i = 0; i < argCount - 2; ++i) {
      invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
      args1.push("argType" + i);
      args2.push(argTypes[i + 2])
    }
    if (isClassMethodFunc) {
      argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired
    }
    invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
    if (needsDestructorStack) {
      invokerFnBody += "runDestructors(destructors);\n"
    } else {
      for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
        var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
        if (argTypes[i].destructorFunction !== null) {
          invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
          args1.push(paramName + "_dtor");
          args2.push(argTypes[i].destructorFunction)
        }
      }
    }
    if (returns) {
      invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n"
    } else {}
    invokerFnBody += "}\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction
  }

  function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    methodName = readLatin1String(methodName);
    rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
    whenDependentTypesAreResolved([], [rawClassType], function (classType) {
      classType = classType[0];
      var humanName = classType.name + "." + methodName;
      if (isPureVirtual) {
        classType.registeredClass.pureVirtualFunctions.push(methodName)
      }

      function unboundTypesHandler() {
        throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes)
      }
      var proto = classType.registeredClass.instancePrototype;
      var method = proto[methodName];
      if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
        unboundTypesHandler.argCount = argCount - 2;
        unboundTypesHandler.className = classType.name;
        proto[methodName] = unboundTypesHandler
      } else {
        ensureOverloadTable(proto, methodName, humanName);
        proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler
      }
      whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
        var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
        if (undefined === proto[methodName].overloadTable) {
          memberFunction.argCount = argCount - 2;
          proto[methodName] = memberFunction
        } else {
          proto[methodName].overloadTable[argCount - 2] = memberFunction
        }
        return []
      });
      return []
    })
  }
  var emval_free_list = [];
  var emval_handle_array = [{}, {
    value: undefined
  }, {
    value: null
  }, {
    value: true
  }, {
    value: false
  }];

  function __emval_decref(handle) {
    if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
      emval_handle_array[handle] = undefined;
      emval_free_list.push(handle)
    }
  }

  function count_emval_handles() {
    var count = 0;
    for (var i = 5; i < emval_handle_array.length; ++i) {
      if (emval_handle_array[i] !== undefined) {
        ++count
      }
    }
    return count
  }

  function get_first_emval() {
    for (var i = 5; i < emval_handle_array.length; ++i) {
      if (emval_handle_array[i] !== undefined) {
        return emval_handle_array[i]
      }
    }
    return null
  }

  function init_emval() {
    Module["count_emval_handles"] = count_emval_handles;
    Module["get_first_emval"] = get_first_emval
  }

  function __emval_register(value) {
    switch (value) {
    case undefined: {
      return 1
    }
    case null: {
      return 2
    }
    case true: {
      return 3
    }
    case false: {
      return 4
    }
    default: {
      var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
      emval_handle_array[handle] = {
        refcount: 1,
        value: value
      };
      return handle
    }
    }
  }

  function __embind_register_emval(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
      name: name,
      "fromWireType": function (handle) {
        var rv = emval_handle_array[handle].value;
        __emval_decref(handle);
        return rv
      },
      "toWireType": function (destructors, value) {
        return __emval_register(value)
      },
      "argPackAdvance": 8,
      "readValueFromPointer": simpleReadValueFromPointer,
      destructorFunction: null
    })
  }

  function _embind_repr(v) {
    if (v === null) {
      return "null"
    }
    var t = typeof v;
    if (t === "object" || t === "array" || t === "function") {
      return v.toString()
    } else {
      return "" + v
    }
  }

  function floatReadValueFromPointer(name, shift) {
    switch (shift) {
    case 2:
      return function (pointer) {
        return this["fromWireType"](HEAPF32[pointer >> 2])
      };
    case 3:
      return function (pointer) {
        return this["fromWireType"](HEAPF64[pointer >> 3])
      };
    default:
      throw new TypeError("Unknown float type: " + name)
    }
  }

  function __embind_register_float(rawType, name, size) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    registerType(rawType, {
      name: name,
      "fromWireType": function (value) {
        return value
      },
      "toWireType": function (destructors, value) {
        if (typeof value !== "number" && typeof value !== "boolean") {
          throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
        }
        return value
      },
      "argPackAdvance": 8,
      "readValueFromPointer": floatReadValueFromPointer(name, shift),
      destructorFunction: null
    })
  }

  function integerReadValueFromPointer(name, shift, signed) {
    switch (shift) {
    case 0:
      return signed ? function readS8FromPointer(pointer) {
        return HEAP8[pointer]
      } : function readU8FromPointer(pointer) {
        return HEAPU8[pointer]
      };
    case 1:
      return signed ? function readS16FromPointer(pointer) {
        return HEAP16[pointer >> 1]
      } : function readU16FromPointer(pointer) {
        return HEAPU16[pointer >> 1]
      };
    case 2:
      return signed ? function readS32FromPointer(pointer) {
        return HEAP32[pointer >> 2]
      } : function readU32FromPointer(pointer) {
        return HEAPU32[pointer >> 2]
      };
    default:
      throw new TypeError("Unknown integer type: " + name)
    }
  }

  function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
    name = readLatin1String(name);
    if (maxRange === -1) {
      maxRange = 4294967295
    }
    var shift = getShiftFromSize(size);
    var fromWireType = function (value) {
      return value
    };
    if (minRange === 0) {
      var bitshift = 32 - 8 * size;
      fromWireType = function (value) {
        return value << bitshift >>> bitshift
      }
    }
    var isUnsignedType = name.indexOf("unsigned") != -1;
    registerType(primitiveType, {
      name: name,
      "fromWireType": fromWireType,
      "toWireType": function (destructors, value) {
        if (typeof value !== "number" && typeof value !== "boolean") {
          throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
        }
        if (value < minRange || value > maxRange) {
          throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!")
        }
        return isUnsignedType ? value >>> 0 : value | 0
      },
      "argPackAdvance": 8,
      "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
      destructorFunction: null
    })
  }

  function __embind_register_memory_view(rawType, dataTypeIndex, name) {
    var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
    var TA = typeMapping[dataTypeIndex];

    function decodeMemoryView(handle) {
      handle = handle >> 2;
      var heap = HEAPU32;
      var size = heap[handle];
      var data = heap[handle + 1];
      return new TA(buffer, data, size)
    }
    name = readLatin1String(name);
    registerType(rawType, {
      name: name,
      "fromWireType": decodeMemoryView,
      "argPackAdvance": 8,
      "readValueFromPointer": decodeMemoryView
    }, {
      ignoreDuplicateRegistrations: true
    })
  }

  function __embind_register_std_string(rawType, name) {
    name = readLatin1String(name);
    var stdStringIsUTF8 = name === "std::string";
    registerType(rawType, {
      name: name,
      "fromWireType": function (value) {
        var length = HEAPU32[value >> 2];
        var str;
        if (stdStringIsUTF8) {
          var decodeStartPtr = value + 4;
          for (var i = 0; i <= length; ++i) {
            var currentBytePtr = value + 4 + i;
            if (HEAPU8[currentBytePtr] == 0 || i == length) {
              var maxRead = currentBytePtr - decodeStartPtr;
              var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
              if (str === undefined) {
                str = stringSegment
              } else {
                str += String.fromCharCode(0);
                str += stringSegment
              }
              decodeStartPtr = currentBytePtr + 1
            }
          }
        } else {
          var a = new Array(length);
          for (var i = 0; i < length; ++i) {
            a[i] = String.fromCharCode(HEAPU8[value + 4 + i])
          }
          str = a.join("")
        }
        _free(value);
        return str
      },
      "toWireType": function (destructors, value) {
        if (value instanceof ArrayBuffer) {
          value = new Uint8Array(value)
        }
        var getLength;
        var valueIsOfTypeString = typeof value === "string";
        if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
          throwBindingError("Cannot pass non-string to std::string")
        }
        if (stdStringIsUTF8 && valueIsOfTypeString) {
          getLength = function () {
            return lengthBytesUTF8(value)
          }
        } else {
          getLength = function () {
            return value.length
          }
        }
        var length = getLength();
        var ptr = _malloc(4 + length + 1);
        HEAPU32[ptr >> 2] = length;
        if (stdStringIsUTF8 && valueIsOfTypeString) {
          stringToUTF8(value, ptr + 4, length + 1)
        } else {
          if (valueIsOfTypeString) {
            for (var i = 0; i < length; ++i) {
              var charCode = value.charCodeAt(i);
              if (charCode > 255) {
                _free(ptr);
                throwBindingError("String has UTF-16 code units that do not fit in 8 bits")
              }
              HEAPU8[ptr + 4 + i] = charCode
            }
          } else {
            for (var i = 0; i < length; ++i) {
              HEAPU8[ptr + 4 + i] = value[i]
            }
          }
        }
        if (destructors !== null) {
          destructors.push(_free, ptr)
        }
        return ptr
      },
      "argPackAdvance": 8,
      "readValueFromPointer": simpleReadValueFromPointer,
      destructorFunction: function (ptr) {
        _free(ptr)
      }
    })
  }

  function __embind_register_std_wstring(rawType, charSize, name) {
    name = readLatin1String(name);
    var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
    if (charSize === 2) {
      decodeString = UTF16ToString;
      encodeString = stringToUTF16;
      lengthBytesUTF = lengthBytesUTF16;
      getHeap = function () {
        return HEAPU16
      };
      shift = 1
    } else if (charSize === 4) {
      decodeString = UTF32ToString;
      encodeString = stringToUTF32;
      lengthBytesUTF = lengthBytesUTF32;
      getHeap = function () {
        return HEAPU32
      };
      shift = 2
    }
    registerType(rawType, {
      name: name,
      "fromWireType": function (value) {
        var length = HEAPU32[value >> 2];
        var HEAP = getHeap();
        var str;
        var decodeStartPtr = value + 4;
        for (var i = 0; i <= length; ++i) {
          var currentBytePtr = value + 4 + i * charSize;
          if (HEAP[currentBytePtr >> shift] == 0 || i == length) {
            var maxReadBytes = currentBytePtr - decodeStartPtr;
            var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
            if (str === undefined) {
              str = stringSegment
            } else {
              str += String.fromCharCode(0);
              str += stringSegment
            }
            decodeStartPtr = currentBytePtr + charSize
          }
        }
        _free(value);
        return str
      },
      "toWireType": function (destructors, value) {
        if (!(typeof value === "string")) {
          throwBindingError("Cannot pass non-string to C++ string type " + name)
        }
        var length = lengthBytesUTF(value);
        var ptr = _malloc(4 + length + charSize);
        HEAPU32[ptr >> 2] = length >> shift;
        encodeString(value, ptr + 4, length + charSize);
        if (destructors !== null) {
          destructors.push(_free, ptr)
        }
        return ptr
      },
      "argPackAdvance": 8,
      "readValueFromPointer": simpleReadValueFromPointer,
      destructorFunction: function (ptr) {
        _free(ptr)
      }
    })
  }

  function __embind_register_void(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
      isVoid: true,
      name: name,
      "argPackAdvance": 0,
      "fromWireType": function () {
        return undefined
      },
      "toWireType": function (destructors, o) {
        return undefined
      }
    })
  }

  function _abort() {
    abort()
  }

  function _emscripten_get_heap_size() {
    return HEAPU8.length
  }

  function abortOnCannotGrowMemory(requestedSize) {
    abort("OOM")
  }

  function _emscripten_resize_heap(requestedSize) {
    requestedSize = requestedSize >>> 0;
    abortOnCannotGrowMemory(requestedSize)
  }

  function _llvm_trap() {
    abort("trap!")
  }

  function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num)
  }
  embind_init_charCodes();
  BindingError = Module["BindingError"] = extendError(Error, "BindingError");
  InternalError = Module["InternalError"] = extendError(Error, "InternalError");
  init_ClassHandle();
  init_RegisteredPointer();
  init_embind();
  UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
  init_emval();
  var ASSERTIONS = false;

  function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      var chr = array[i];
      if (chr > 255) {
        if (ASSERTIONS) {
          assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.")
        }
        chr &= 255
      }
      ret.push(String.fromCharCode(chr))
    }
    return ret.join("")
  }
  var decodeBase64 = typeof atob === "function" ? atob : function (input) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    do {
      enc1 = keyStr.indexOf(input.charAt(i++));
      enc2 = keyStr.indexOf(input.charAt(i++));
      enc3 = keyStr.indexOf(input.charAt(i++));
      enc4 = keyStr.indexOf(input.charAt(i++));
      chr1 = enc1 << 2 | enc2 >> 4;
      chr2 = (enc2 & 15) << 4 | enc3 >> 2;
      chr3 = (enc3 & 3) << 6 | enc4;
      output = output + String.fromCharCode(chr1);
      if (enc3 !== 64) {
        output = output + String.fromCharCode(chr2)
      }
      if (enc4 !== 64) {
        output = output + String.fromCharCode(chr3)
      }
    } while (i < input.length);
    return output
  };

  function intArrayFromBase64(s) {
    if (typeof ENVIRONMENT_IS_NODE === "boolean" && ENVIRONMENT_IS_NODE) {
      var buf;
      try {
        buf = Buffer.from(s, "base64")
      } catch (_) {
        buf = new Buffer(s, "base64")
      }
      return new Uint8Array(buf["buffer"], buf["byteOffset"], buf["byteLength"])
    }
    try {
      var decoded = decodeBase64(s);
      var bytes = new Uint8Array(decoded.length);
      for (var i = 0; i < decoded.length; ++i) {
        bytes[i] = decoded.charCodeAt(i)
      }
      return bytes
    } catch (_) {
      throw new Error("Converting base64 string to bytes failed.")
    }
  }

  function tryParseAsDataURI(filename) {
    if (!isDataURI(filename)) {
      return
    }
    return intArrayFromBase64(filename.slice(dataURIPrefix.length))
  }
  var asmGlobalArg = {
    "Math": Math,
    "Int8Array": Int8Array,
    "Int16Array": Int16Array,
    "Int32Array": Int32Array,
    "Uint8Array": Uint8Array,
    "Uint16Array": Uint16Array,
    "Float32Array": Float32Array,
    "Float64Array": Float64Array
  };
  var asmLibraryArg = {
    "A": _emscripten_memcpy_big,
    "B": _emscripten_resize_heap,
    "C": _llvm_trap,
    "D": tempDoublePtr,
    "a": abort,
    "b": setTempRet0,
    "c": getTempRet0,
    "d": ___cxa_allocate_exception,
    "e": ___cxa_begin_catch,
    "f": ___cxa_throw,
    "g": ___cxa_uncaught_exceptions,
    "h": ___exception_addRef,
    "i": ___exception_deAdjust,
    "j": ___gxx_personality_v0,
    "k": __embind_register_bool,
    "l": __embind_register_class,
    "m": __embind_register_class_constructor,
    "n": __embind_register_class_function,
    "o": __embind_register_emval,
    "p": __embind_register_float,
    "q": __embind_register_integer,
    "r": __embind_register_memory_view,
    "s": __embind_register_std_string,
    "t": __embind_register_std_wstring,
    "u": __embind_register_void,
    "v": __emval_decref,
    "w": __emval_register,
    "x": _abort,
    "y": _embind_repr,
    "z": _emscripten_get_heap_size
  }; // EMSCRIPTEN_START_ASM
  var asm = ( /** @suppress {uselessCode} */ function (global, env, buffer) {
    "use asm";
    var a = new global.Int8Array(buffer),
      b = new global.Int16Array(buffer),
      c = new global.Int32Array(buffer),
      d = new global.Uint8Array(buffer),
      e = new global.Uint16Array(buffer),
      f = new global.Float32Array(buffer),
      g = new global.Float64Array(buffer),
      h = env.D | 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0.0,
      q = global.Math.imul,
      r = global.Math.clz32,
      s = env.a,
      t = env.b,
      u = env.c,
      v = env.d,
      w = env.e,
      x = env.f,
      y = env.g,
      z = env.h,
      A = env.i,
      B = env.j,
      C = env.k,
      D = env.l,
      E = env.m,
      F = env.n,
      G = env.o,
      H = env.p,
      I = env.q,
      J = env.r,
      K = env.s,
      L = env.t,
      M = env.u,
      N = env.v,
      O = env.w,
      P = env.x,
      Q = env.y,
      R = env.z,
      S = env.A,
      T = env.B,
      U = env.C,
      V = 22384,
      W = 5265264,
      X = 0.0;
    // EMSCRIPTEN_START_FUNCS
    function ia() {
      em();
      fm()
    }

    function ja() {
      ka(0);
      return
    }

    function ka(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0;
      a = V;
      V = V + 16 | 0;
      b = a + 8 | 0;
      d = a;
      vk();
      m = xk() | 0;
      g = yk() | 0;
      f = Ak() | 0;
      h = Bk() | 0;
      i = Ck() | 0;
      j = Dk() | 0;
      k = Jk() | 0;
      l = Kk() | 0;
      e = Kk() | 0;
      D(f | 0, h | 0, i | 0, j | 0, k | 0, 9, l | 0, m | 0, e | 0, g | 0, 6204, Lk() | 0, 138);
      Nk(1);
      c[d >> 2] = 5;
      c[d + 4 >> 2] = 0;
      c[b >> 2] = c[d >> 2];
      c[b + 4 >> 2] = c[d + 4 >> 2];
      Uk(6211, b);
      c[d >> 2] = 3;
      c[d + 4 >> 2] = 0;
      c[b >> 2] = c[d >> 2];
      c[b + 4 >> 2] = c[d + 4 >> 2];
      cl(6216, b);
      c[d >> 2] = 10;
      c[d + 4 >> 2] = 0;
      c[b >> 2] = c[d >> 2];
      c[b + 4 >> 2] = c[d + 4 >> 2];
      kl(6225, b);
      sl();
      g = ul() | 0;
      e = vl() | 0;
      m = xl() | 0;
      l = yl() | 0;
      k = zl() | 0;
      j = Dk() | 0;
      i = Jk() | 0;
      h = Kk() | 0;
      f = Kk() | 0;
      D(m | 0, l | 0, k | 0, j | 0, i | 0, 11, h | 0, g | 0, f | 0, e | 0, 6234, Lk() | 0, 139);
      Gl(2);
      c[d >> 2] = 6;
      c[d + 4 >> 2] = 0;
      c[b >> 2] = c[d >> 2];
      c[b + 4 >> 2] = c[d + 4 >> 2];
      Nl(6211, b);
      c[d >> 2] = 4;
      c[d + 4 >> 2] = 0;
      c[b >> 2] = c[d >> 2];
      c[b + 4 >> 2] = c[d + 4 >> 2];
      Ul(6248, b);
      c[d >> 2] = 5;
      c[d + 4 >> 2] = 0;
      c[b >> 2] = c[d >> 2];
      c[b + 4 >> 2] = c[d + 4 >> 2];
      Ul(6265, b);
      c[d >> 2] = 6;
      c[d + 4 >> 2] = 0;
      c[b >> 2] = c[d >> 2];
      c[b + 4 >> 2] = c[d + 4 >> 2];
      Ul(6280, b);
      c[d >> 2] = 7;
      c[d + 4 >> 2] = 0;
      c[b >> 2] = c[d >> 2];
      c[b + 4 >> 2] = c[d + 4 >> 2];
      _l(6216, b);
      V = a;
      return
    }

    function la(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0;
      e = V;
      V = V + 32 | 0;
      h = e + 16 | 0;
      f = e + 8 | 0;
      i = e;
      g = eq(20) | 0;
      ta(g, b, d);
      c[i >> 2] = 0;
      c[h >> 2] = c[i >> 2];
      va(f, g, h);
      b = c[f >> 2] | 0;
      c[f >> 2] = c[a >> 2];
      c[a >> 2] = b;
      b = f + 4 | 0;
      d = a + 4 | 0;
      g = c[b >> 2] | 0;
      c[b >> 2] = c[d >> 2];
      c[d >> 2] = g;
      wa(f);
      d = eq(352) | 0;
      ua(d, c[a >> 2] | 0);
      g = a + 8 | 0;
      c[i >> 2] = 0;
      c[h >> 2] = c[i >> 2];
      Fa(f, d, h);
      d = c[f >> 2] | 0;
      c[f >> 2] = c[g >> 2];
      c[g >> 2] = d;
      g = f + 4 | 0;
      d = a + 12 | 0;
      b = c[g >> 2] | 0;
      c[g >> 2] = c[d >> 2];
      c[d >> 2] = b;
      Ga(f);
      V = e;
      return
    }

    function ma(a, b) {
      a = a | 0;
      b = b | 0;
      dd(c[a + 8 >> 2] | 0, b);
      return
    }

    function na(a) {
      a = a | 0;
      a = (Qh(c[a + 8 >> 2] | 0) | 0) + 107 | 0;
      return d[a >> 0] | d[a + 1 >> 0] << 8 | d[a + 2 >> 0] << 16 | d[a + 3 >> 0] << 24 | 0
    }

    function oa(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0;
      e = V;
      V = V + 32 | 0;
      g = e + 16 | 0;
      f = e + 8 | 0;
      h = e;
      i = eq(12) | 0;
      Rh(i, b, d);
      c[h >> 2] = 0;
      c[g >> 2] = c[h >> 2];
      Vh(f, i, g);
      i = c[f >> 2] | 0;
      c[f >> 2] = c[a >> 2];
      c[a >> 2] = i;
      i = f + 4 | 0;
      d = a + 4 | 0;
      b = c[i >> 2] | 0;
      c[i >> 2] = c[d >> 2];
      c[d >> 2] = b;
      Wh(f);
      d = a + 8 | 0;
      b = eq(12) | 0;
      Sh(b, c[a >> 2] | 0);
      c[h >> 2] = 0;
      c[g >> 2] = c[h >> 2];
      ai(f, b, g);
      b = c[f >> 2] | 0;
      c[f >> 2] = c[d >> 2];
      c[d >> 2] = b;
      b = f + 4 | 0;
      h = a + 12 | 0;
      i = c[b >> 2] | 0;
      c[b >> 2] = c[h >> 2];
      c[h >> 2] = i;
      bi(f);
      Th(f, c[d >> 2] | 0);
      d = a + 16 | 0;
      h = c[f >> 2] | 0;
      i = f + 4 | 0;
      b = c[i >> 2] | 0;
      c[f >> 2] = 0;
      c[i >> 2] = 0;
      c[g >> 2] = c[d >> 2];
      c[d >> 2] = h;
      d = a + 20 | 0;
      c[g + 4 >> 2] = c[d >> 2];
      c[d >> 2] = b;
      Uh(g);
      Uh(f);
      V = e;
      return
    }

    function pa(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0;
      a = a + 16 | 0;
      d = c[a >> 2] | 0;
      a: do
          if (d | 0) switch (b | 0) {
          case 4: {
            ui(d);
            break a
          }
          case 8: {
            vi(d);
            vi(c[a >> 2] | 0);
            break a
          }
          default:
            break a
          }
        while (0);
        return
    }

    function qa(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0;
      d = a + 16 | 0;
      a = c[d >> 2] | 0;
      a: do
        if (a | 0) {
          switch (b | 0) {
          case 1: {
            hj(a);
            break a
          }
          case 2: {
            ij(a);
            break a
          }
          case 8: {
            ui(a);
            a = c[d >> 2] | 0;
            break
          }
          case 4:
            break;
          default:
            break a
          }
          ui(a)
        }
      while (0);
      return
    }

    function ra(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0;
      d = a + 16 | 0;
      a = c[d >> 2] | 0;
      a: do
        if (a | 0) {
          switch (b | 0) {
          case 1: {
            Rj(a);
            break a
          }
          case 2: {
            Sj(a);
            break a
          }
          case 8: {
            vi(a);
            a = c[d >> 2] | 0;
            break
          }
          case 4:
            break;
          default:
            break a
          }
          vi(a)
        }
      while (0);
      return
    }

    function sa(a, b) {
      a = a | 0;
      b = b | 0;
      a = c[a + 16 >> 2] | 0;
      if (a | 0) $[c[c[a >> 2] >> 2] & 63](a, b) | 0;
      return
    }

    function ta(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      c[b >> 2] = d;
      c[b + 4 >> 2] = e;
      c[b + 8 >> 2] = 0;
      a[b + 12 >> 0] = 0;
      a[b + 13 >> 0] = 0;
      c[b + 16 >> 2] = 0;
      return
    }

    function ua(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = b;
      Va(a + 4 | 0, b);
      Wa(a + 247 | 0);
      c[a + 288 >> 2] = 0;
      c[a + 292 >> 2] = 0;
      c[a + 296 >> 2] = 0;
      Xa(a + 300 | 0);
      b = a + 312 | 0;
      c[b >> 2] = 0;
      c[b + 4 >> 2] = 0;
      c[b + 8 >> 2] = 0;
      c[b + 12 >> 2] = 0;
      Ya(a + 328 | 0);
      Za(a);
      return
    }

    function va(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 4296;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      xa(a, e);
      V = d;
      return
    }

    function wa(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      a = c[a + 4 >> 2] | 0;
      if (a | 0 ? (d = a + 4 | 0, b = c[d >> 2] | 0, c[d >> 2] = b + -1, (b | 0) == 0) : 0) {
        ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
        qq(a)
      }
      return
    }

    function xa(a, b) {
      a = a | 0;
      b = b | 0;
      return
    }

    function ya(a) {
      a = a | 0;
      w(a | 0) | 0;
      lp()
    }

    function za(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Aa(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) jp(a);
      return
    }

    function Ba(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 6407 ? a + 12 | 0 : 0) | 0
    }

    function Ca(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Da(a, b) {
      a = a | 0;
      b = b | 0;
      Ea(a);
      return
    }

    function Ea(a) {
      a = a | 0;
      jp(a);
      return
    }

    function Fa(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 4324;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Ha(a, e);
      V = d;
      return
    }

    function Ga(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      a = c[a + 4 >> 2] | 0;
      if (a | 0 ? (d = a + 4 | 0, b = c[d >> 2] | 0, c[d >> 2] = b + -1, (b | 0) == 0) : 0) {
        ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
        qq(a)
      }
      return
    }

    function Ha(a, b) {
      a = a | 0;
      b = b | 0;
      return
    }

    function Ia(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Ja(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) {
        Ma(a);
        jp(a)
      }
      return
    }

    function Ka(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 6605 ? a + 12 | 0 : 0) | 0
    }

    function La(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Ma(a) {
      a = a | 0;
      Na(a + 320 | 0);
      Oa(a + 312 | 0);
      Pa(a + 300 | 0);
      Ta(a + 288 | 0);
      Qa(a + 247 | 0);
      Ra(a + 4 | 0);
      return
    }

    function Na(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      a = c[a + 4 >> 2] | 0;
      if (a | 0 ? (d = a + 4 | 0, b = c[d >> 2] | 0, c[d >> 2] = b + -1, (b | 0) == 0) : 0) {
        ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
        qq(a)
      }
      return
    }

    function Oa(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      a = c[a + 4 >> 2] | 0;
      if (a | 0 ? (d = a + 4 | 0, b = c[d >> 2] | 0, c[d >> 2] = b + -1, (b | 0) == 0) : 0) {
        ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
        qq(a)
      }
      return
    }

    function Pa(a) {
      a = a | 0;
      Sa(a);
      return
    }

    function Qa(a) {
      a = a | 0;
      a = a + 34 | 0;
      a = d[a >> 0] | d[a + 1 >> 0] << 8 | d[a + 2 >> 0] << 16 | d[a + 3 >> 0] << 24;
      if (a | 0) gq(a);
      return
    }

    function Ra(a) {
      a = a | 0;
      Ua(c[a + 12 >> 2] | 0);
      return
    }

    function Sa(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = c[a >> 2] | 0;
      d = b;
      if (b | 0) {
        c[a + 4 >> 2] = d;
        Da(b, (c[a + 8 >> 2] | 0) - d | 0)
      }
      return
    }

    function Ta(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = c[a >> 2] | 0;
      d = b;
      if (b | 0) {
        c[a + 4 >> 2] = d;
        Da(b, (c[a + 8 >> 2] | 0) - d | 0)
      }
      return
    }

    function Ua(a) {
      a = a | 0;
      er(c[a + -4 >> 2] | 0);
      return
    }

    function Va(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = b;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = 0;
      c[a + 12 >> 2] = _a(1048576) | 0;
      return
    }

    function Wa(b) {
      b = b | 0;
      var c = 0;
      c = b + 32 | 0;
      a[c >> 0] = 0;
      a[c + 1 >> 0] = 0;
      b = b + 34 | 0;
      a[b >> 0] = 0;
      a[b + 1 >> 0] = 0;
      a[b + 2 >> 0] = 0;
      a[b + 3 >> 0] = 0;
      return
    }

    function Xa(a) {
      a = a | 0;
      c[a >> 2] = 0;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = 0;
      return
    }

    function Ya(a) {
      a = a | 0;
      c[a >> 2] = 0;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = 0;
      c[a + 12 >> 2] = 0;
      a = a + 16 | 0;
      c[a >> 2] = -1;
      c[a + 4 >> 2] = -1;
      return
    }

    function Za(b) {
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0;
      i = V;
      V = V + 64 | 0;
      g = i + 32 | 0;
      e = i + 56 | 0;
      d = i + 16 | 0;
      h = i;
      $a(c[b >> 2] | 0, e, 4);
      mb(g, e, e + 4 | 0);
      e = lb(6693) | 0;
      f = a[g + 11 >> 0] | 0;
      if ((e | 0) == ((f << 24 >> 24 < 0 ? c[g + 4 >> 2] | 0 : f & 255) | 0)) {
        f = (Hq(g, 0, -1, 6693, e) | 0) == 0;
        Cq(g);
        if (f) {
          e = c[b >> 2] | 0;
          c[d >> 2] = 0;
          c[d + 4 >> 2] = 0;
          c[d + 8 >> 2] = 0;
          c[d + 12 >> 2] = 0;
          c[g >> 2] = c[d >> 2];
          c[g + 4 >> 2] = c[d + 4 >> 2];
          c[g + 8 >> 2] = c[d + 8 >> 2];
          c[g + 12 >> 2] = c[d + 12 >> 2];
          bb(e, g);
          e = b + 20 | 0;
          $a(c[b >> 2] | 0, e, 227);
          cb(b, e);
          f = db() | 0;
          d = c[f >> 2] | 0;
          f = c[f + 4 >> 2] | 0;
          if ((d | 0) != (f | 0))
            do {
              eb(g, d);
              fb(g, e);
              gb(g);
              d = d + 24 | 0
            } while ((d | 0) != (f | 0));
          hb(b);
          ib(b);
          jb(c[b >> 2] | 0);
          f = c[b >> 2] | 0;
          d = (c[b + 116 >> 2] | 0) + 8 | 0;
          e = h;
          c[e >> 2] = 0;
          c[e + 4 >> 2] = 0;
          e = h + 8 | 0;
          c[e >> 2] = d;
          c[e + 4 >> 2] = 0;
          c[g >> 2] = c[h >> 2];
          c[g + 4 >> 2] = c[h + 4 >> 2];
          c[g + 8 >> 2] = c[h + 8 >> 2];
          c[g + 12 >> 2] = c[h + 12 >> 2];
          bb(f, g);
          kb(b + 4 | 0);
          V = i;
          return
        }
      } else Cq(g);
      i = v(8) | 0;
      ab(i);
      x(i | 0, 2592, 8)
    }

    function _a(a) {
      a = a | 0;
      var b = 0;
      b = dr(a + 68 | 0) | 0;
      a = b + 68 & -64;
      c[a + -4 >> 2] = b;
      return a | 0
    }

    function $a(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      i = b + 13 | 0;
      if (!(a[i >> 0] | 0)) {
        h = b + 4 | 0;
        f = c[h >> 2] | 0;
        j = b + 8 | 0;
        g = c[j >> 2] | 0;
        k = f - g | 0;
        e = (k | 0) < (e | 0) ? k : e;
        if (e) {
          vr(d | 0, (c[b >> 2] | 0) + g | 0, e | 0) | 0;
          g = c[j >> 2] | 0;
          f = c[h >> 2] | 0
        }
        k = g + e | 0;
        c[j >> 2] = k;
        c[b + 16 >> 2] = e;
        if ((k | 0) >= (f | 0)) a[i >> 0] = 1
      } else a[b + 12 >> 0] = 1;
      return
    }

    function ab(a) {
      a = a | 0;
      xq(a, 6791);
      c[a >> 2] = 4352;
      return
    }

    function bb(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0;
      g = d + 8 | 0;
      d = c[g >> 2] | 0;
      g = c[g + 4 >> 2] | 0;
      e = c[b + 4 >> 2] | 0;
      f = ((e | 0) < 0) << 31 >> 31;
      if ((g | 0) < (f | 0) | (g | 0) == (f | 0) & d >>> 0 < e >>> 0) c[b + 8 >> 2] = d;
      else a[b + 12 >> 0] = 1;
      return
    }

    function cb(b, c) {
      b = b | 0;
      c = c | 0;
      var d = 0.0,
        e = 0.0,
        f = 0,
        i = 0.0,
        j = 0,
        k = 0.0,
        l = 0,
        m = 0.0,
        n = 0,
        o = 0.0;
      n = c + 179 | 0;
      a[h >> 0] = a[n >> 0];
      a[h + 1 >> 0] = a[n + 1 >> 0];
      a[h + 2 >> 0] = a[n + 2 >> 0];
      a[h + 3 >> 0] = a[n + 3 >> 0];
      a[h + 4 >> 0] = a[n + 4 >> 0];
      a[h + 5 >> 0] = a[n + 5 >> 0];
      a[h + 6 >> 0] = a[n + 6 >> 0];
      a[h + 7 >> 0] = a[n + 7 >> 0];
      m = +g[h >> 3];
      j = c + 187 | 0;
      a[h >> 0] = a[j >> 0];
      a[h + 1 >> 0] = a[j + 1 >> 0];
      a[h + 2 >> 0] = a[j + 2 >> 0];
      a[h + 3 >> 0] = a[j + 3 >> 0];
      a[h + 4 >> 0] = a[j + 4 >> 0];
      a[h + 5 >> 0] = a[j + 5 >> 0];
      a[h + 6 >> 0] = a[j + 6 >> 0];
      a[h + 7 >> 0] = a[j + 7 >> 0];
      o = +g[h >> 3];
      b = c + 195 | 0;
      a[h >> 0] = a[b >> 0];
      a[h + 1 >> 0] = a[b + 1 >> 0];
      a[h + 2 >> 0] = a[b + 2 >> 0];
      a[h + 3 >> 0] = a[b + 3 >> 0];
      a[h + 4 >> 0] = a[b + 4 >> 0];
      a[h + 5 >> 0] = a[b + 5 >> 0];
      a[h + 6 >> 0] = a[b + 6 >> 0];
      a[h + 7 >> 0] = a[b + 7 >> 0];
      i = +g[h >> 3];
      l = c + 203 | 0;
      a[h >> 0] = a[l >> 0];
      a[h + 1 >> 0] = a[l + 1 >> 0];
      a[h + 2 >> 0] = a[l + 2 >> 0];
      a[h + 3 >> 0] = a[l + 3 >> 0];
      a[h + 4 >> 0] = a[l + 4 >> 0];
      a[h + 5 >> 0] = a[l + 5 >> 0];
      a[h + 6 >> 0] = a[l + 6 >> 0];
      a[h + 7 >> 0] = a[l + 7 >> 0];
      k = +g[h >> 3];
      f = c + 211 | 0;
      a[h >> 0] = a[f >> 0];
      a[h + 1 >> 0] = a[f + 1 >> 0];
      a[h + 2 >> 0] = a[f + 2 >> 0];
      a[h + 3 >> 0] = a[f + 3 >> 0];
      a[h + 4 >> 0] = a[f + 4 >> 0];
      a[h + 5 >> 0] = a[f + 5 >> 0];
      a[h + 6 >> 0] = a[f + 6 >> 0];
      a[h + 7 >> 0] = a[f + 7 >> 0];
      d = +g[h >> 3];
      c = c + 219 | 0;
      a[h >> 0] = a[c >> 0];
      a[h + 1 >> 0] = a[c + 1 >> 0];
      a[h + 2 >> 0] = a[c + 2 >> 0];
      a[h + 3 >> 0] = a[c + 3 >> 0];
      a[h + 4 >> 0] = a[c + 4 >> 0];
      a[h + 5 >> 0] = a[c + 5 >> 0];
      a[h + 6 >> 0] = a[c + 6 >> 0];
      a[h + 7 >> 0] = a[c + 7 >> 0];
      e = +g[h >> 3];
      g[h >> 3] = o;
      a[n >> 0] = a[h >> 0];
      a[n + 1 >> 0] = a[h + 1 >> 0];
      a[n + 2 >> 0] = a[h + 2 >> 0];
      a[n + 3 >> 0] = a[h + 3 >> 0];
      a[n + 4 >> 0] = a[h + 4 >> 0];
      a[n + 5 >> 0] = a[h + 5 >> 0];
      a[n + 6 >> 0] = a[h + 6 >> 0];
      a[n + 7 >> 0] = a[h + 7 >> 0];
      g[h >> 3] = m;
      a[l >> 0] = a[h >> 0];
      a[l + 1 >> 0] = a[h + 1 >> 0];
      a[l + 2 >> 0] = a[h + 2 >> 0];
      a[l + 3 >> 0] = a[h + 3 >> 0];
      a[l + 4 >> 0] = a[h + 4 >> 0];
      a[l + 5 >> 0] = a[h + 5 >> 0];
      a[l + 6 >> 0] = a[h + 6 >> 0];
      a[l + 7 >> 0] = a[h + 7 >> 0];
      g[h >> 3] = k;
      a[j >> 0] = a[h >> 0];
      a[j + 1 >> 0] = a[h + 1 >> 0];
      a[j + 2 >> 0] = a[h + 2 >> 0];
      a[j + 3 >> 0] = a[h + 3 >> 0];
      a[j + 4 >> 0] = a[h + 4 >> 0];
      a[j + 5 >> 0] = a[h + 5 >> 0];
      a[j + 6 >> 0] = a[h + 6 >> 0];
      a[j + 7 >> 0] = a[h + 7 >> 0];
      g[h >> 3] = i;
      a[f >> 0] = a[h >> 0];
      a[f + 1 >> 0] = a[h + 1 >> 0];
      a[f + 2 >> 0] = a[h + 2 >> 0];
      a[f + 3 >> 0] = a[h + 3 >> 0];
      a[f + 4 >> 0] = a[h + 4 >> 0];
      a[f + 5 >> 0] = a[h + 5 >> 0];
      a[f + 6 >> 0] = a[h + 6 >> 0];
      a[f + 7 >> 0] = a[h + 7 >> 0];
      g[h >> 3] = e;
      a[b >> 0] = a[h >> 0];
      a[b + 1 >> 0] = a[h + 1 >> 0];
      a[b + 2 >> 0] = a[h + 2 >> 0];
      a[b + 3 >> 0] = a[h + 3 >> 0];
      a[b + 4 >> 0] = a[h + 4 >> 0];
      a[b + 5 >> 0] = a[h + 5 >> 0];
      a[b + 6 >> 0] = a[h + 6 >> 0];
      a[b + 7 >> 0] = a[h + 7 >> 0];
      g[h >> 3] = d;
      a[c >> 0] = a[h >> 0];
      a[c + 1 >> 0] = a[h + 1 >> 0];
      a[c + 2 >> 0] = a[h + 2 >> 0];
      a[c + 3 >> 0] = a[h + 3 >> 0];
      a[c + 4 >> 0] = a[h + 4 >> 0];
      a[c + 5 >> 0] = a[h + 5 >> 0];
      a[c + 6 >> 0] = a[h + 6 >> 0];
      a[c + 7 >> 0] = a[h + 7 >> 0];
      return
    }

    function db() {
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;
      g = V;
      V = V + 48 | 0;
      e = g + 24 | 0;
      f = g;
      b = g + 44 | 0;
      if ((a[21440] | 0) == 0 ? Tp(21440) | 0 : 0) {
        c[5374] = 0;
        c[5375] = 0;
        c[5376] = 0;
        $p(21440)
      }
      if ((a[21448] | 0) == 0 ? Tp(21448) | 0 : 0) $p(21448);
      if ((c[5374] | 0) == (c[5375] | 0)) {
        rq(21508);
        if ((c[5374] | 0) == (c[5375] | 0)) {
          a[e >> 0] = a[b >> 0] | 0;
          pb(f, e);
          b = c[5375] | 0;
          do
            if (b >>> 0 >= (c[5376] | 0) >>> 0) {
              b = ((b - (c[5374] | 0) | 0) / 24 | 0) + 1 | 0;
              d = xb(21496) | 0;
              if (d >>> 0 < b >>> 0) cr(21496);
              else {
                h = c[5374] | 0;
                j = ((c[5376] | 0) - h | 0) / 24 | 0;
                i = j << 1;
                ub(e, j >>> 0 < d >>> 1 >>> 0 ? (i >>> 0 < b >>> 0 ? b : i) : d, ((c[5375] | 0) - h | 0) / 24 | 0, 21504);
                d = e + 8 | 0;
                sb(c[d >> 2] | 0, f);
                c[d >> 2] = (c[d >> 2] | 0) + 24;
                vb(21496, e);
                wb(e);
                break
              }
            } else {
              qb(e, 21496, 1);
              j = e + 4 | 0;
              sb(c[j >> 2] | 0, f);
              c[j >> 2] = (c[j >> 2] | 0) + 24;
              rb(e)
            } while (0);
          gb(f)
        }
        sq(21508)
      }
      V = g;
      return 21496
    }

    function eb(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0;
      d = b + 16 | 0;
      e = c[d >> 2] | 0;
      do
        if (e)
          if ((b | 0) == (e | 0)) {
            e = tb(a) | 0;
            c[a + 16 >> 2] = e;
            d = c[d >> 2] | 0;
            da[c[(c[d >> 2] | 0) + 12 >> 2] & 15](d, e);
            break
          } else {
            c[a + 16 >> 2] = Z[c[(c[e >> 2] | 0) + 8 >> 2] & 15](e) | 0;
            break
          }
      else c[a + 16 >> 2] = 0; while (0);
      return
    }

    function fb(a, b) {
      a = a | 0;
      b = b | 0;
      a = c[a + 16 >> 2] | 0;
      if (!a) {
        b = v(4) | 0;
        c[b >> 2] = 0;
        Nb(b);
        x(b | 0, 4168, 131)
      } else {
        da[c[(c[a >> 2] | 0) + 24 >> 2] & 15](a, b);
        return
      }
    }

    function gb(a) {
      a = a | 0;
      var b = 0;
      b = c[a + 16 >> 2] | 0;
      if ((a | 0) != (b | 0)) {
        if (b | 0) ca[c[(c[b >> 2] | 0) + 20 >> 2] & 255](b)
      } else ca[c[(c[b >> 2] | 0) + 16 >> 2] & 255](b);
      return
    }

    function hb(b) {
      b = b | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0;
      q = V;
      V = V + 96 | 0;
      i = q + 16 | 0;
      o = q;
      l = q + 72 | 0;
      j = c[b >> 2] | 0;
      m = e[b + 114 >> 1] | 0;
      n = o;
      c[n >> 2] = 0;
      c[n + 4 >> 2] = 0;
      n = o + 8 | 0;
      c[n >> 2] = m;
      c[n + 4 >> 2] = 0;
      c[i >> 2] = c[o >> 2];
      c[i + 4 >> 2] = c[o + 4 >> 2];
      c[i + 8 >> 2] = c[o + 8 >> 2];
      c[i + 12 >> 2] = c[o + 12 >> 2];
      bb(j, i);
      j = b + 120 | 0;
      a: do
        if (c[j >> 2] | 0) {
          k = i + 2 | 0;
          m = i + 16 | 0;
          n = i + 20 | 0;
          o = i + 18 | 0;
          g = 0;
          while (1) {
            if (!(Ob(c[b >> 2] | 0) | 0)) break a;
            if (Pb(c[b >> 2] | 0) | 0) break a;
            $a(c[b >> 2] | 0, i, 54);
            f = 7277;
            h = k;
            while (1) {
              if ((a[h >> 0] | 0) != (a[f >> 0] | 0)) break;
              h = h + 1 | 0;
              if ((h | 0) == (m | 0)) {
                p = 8;
                break
              } else f = f + 1 | 0
            }
            if ((p | 0) == 8 ? (p = 0, (d[o >> 0] | d[o + 1 >> 0] << 8) << 16 >> 16 == 22204) : 0) break;
            Rb(c[b >> 2] | 0, (d[n >> 0] | d[n + 1 >> 0] << 8) & 65535, 0, 1);
            g = g + 1 | 0;
            if (g >>> 0 >= (c[j >> 2] | 0) >>> 0) break a
          }
          o = (d[n >> 0] | d[n + 1 >> 0] << 8) & 65535;
          p = fq(o) | 0;
          $a(c[b >> 2] | 0, p, o);
          Qb(b, p);
          jp(p);
          p = b + 125 | 0;
          Tb(l, b + 247 | 0, (d[p >> 0] | d[p + 1 >> 0] << 8) & 65535);
          Ub(b + 300 | 0, l) | 0;
          Pa(l);
          V = q;
          return
        }
      while (0);
      q = v(8) | 0;
      Sb(q);
      x(q | 0, 2672, 8)
    }

    function ib(a) {
      a = a | 0;
      var b = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;
      n = V;
      V = V + 176 | 0;
      g = n + 40 | 0;
      h = n + 24 | 0;
      b = n + 16 | 0;
      f = n;
      k = n + 152 | 0;
      l = n + 136 | 0;
      m = n + 56 | 0;
      j = c[a >> 2] | 0;
      i = a + 116 | 0;
      o = c[i >> 2] | 0;
      e = h;
      c[e >> 2] = 0;
      c[e + 4 >> 2] = 0;
      e = h + 8 | 0;
      c[e >> 2] = o;
      c[e + 4 >> 2] = 0;
      c[g >> 2] = c[h >> 2];
      c[g + 4 >> 2] = c[h + 4 >> 2];
      c[g + 8 >> 2] = c[h + 8 >> 2];
      c[g + 12 >> 2] = c[h + 12 >> 2];
      bb(j, g);
      j = b;
      c[j >> 2] = 0;
      c[j + 4 >> 2] = 0;
      $a(c[a >> 2] | 0, b, 8);
      if (!(Ob(c[a >> 2] | 0) | 0)) {
        o = v(8) | 0;
        hc(o);
        x(o | 0, 2704, 8)
      }
      e = b;
      b = c[e >> 2] | 0;
      e = c[e + 4 >> 2] | 0;
      if ((b | 0) == -1 & (e | 0) == -1) {
        o = v(8) | 0;
        ic(o, 7488);
        x(o | 0, 2720, 8)
      }
      o = c[a >> 2] | 0;
      j = f;
      c[j >> 2] = 0;
      c[j + 4 >> 2] = 0;
      j = f + 8 | 0;
      c[j >> 2] = b;
      c[j + 4 >> 2] = e;
      c[g >> 2] = c[f >> 2];
      c[g + 4 >> 2] = c[f + 4 >> 2];
      c[g + 8 >> 2] = c[f + 8 >> 2];
      c[g + 12 >> 2] = c[f + 12 >> 2];
      bb(o, g);
      if (!(Ob(c[a >> 2] | 0) | 0)) {
        o = v(8) | 0;
        hc(o);
        x(o | 0, 2704, 8)
      }
      $a(c[a >> 2] | 0, g, 8);
      if (!(Ob(c[a >> 2] | 0) | 0)) {
        o = v(8) | 0;
        hc(o);
        x(o | 0, 2704, 8)
      }
      if (c[g >> 2] | 0) {
        o = v(8) | 0;
        jc(o);
        x(o | 0, 2736, 8)
      }
      h = a + 288 | 0;
      j = a + 292 | 0;
      c[j >> 2] = c[h >> 2];
      o = a + 259 | 0;
      if ((d[o >> 0] | d[o + 1 >> 0] << 8 | d[o + 2 >> 0] << 16 | d[o + 3 >> 0] << 24 | 0) == -1) {
        o = v(8) | 0;
        ic(o, 7606);
        x(o | 0, 2720, 8)
      }
      f = g + 4 | 0;
      kc(h, (c[f >> 2] | 0) + 1 | 0);
      o = c[h >> 2] | 0;
      c[o >> 2] = (c[i >> 2] | 0) + 8;
      c[o + 4 >> 2] = 0;
      if ((c[f >> 2] | 0) >>> 0 > 1) {
        Va(k, c[a >> 2] | 0);
        lc(l, k);
        mc(m, 32, 2, 8, 0);
        nc(l);
        oc(m);
        if (!(c[f >> 2] | 0)) {
          h = c[h >> 2] | 0;
          e = h
        } else {
          e = 1;
          do {
            if (e >>> 0 > 1) b = c[(c[h >> 2] | 0) + (e + -1 << 3) >> 2] | 0;
            else b = 0;
            i = pc(m, l, b, 1) | 0;
            b = c[h >> 2] | 0;
            o = b + (e << 3) | 0;
            c[o >> 2] = i;
            c[o + 4 >> 2] = ((i | 0) < 0) << 31 >> 31;
            e = e + 1 | 0
          } while (e >>> 0 <= (c[f >> 2] | 0) >>> 0);
          e = b;
          h = b
        }
        b = c[j >> 2] | 0;
        if (b - e >> 3 >>> 0 > 1) {
          g = b - h >> 3;
          f = h;
          b = 1;
          e = c[f >> 2] | 0;
          f = c[f + 4 >> 2] | 0;
          do {
            o = h + (b << 3) | 0;
            j = o;
            e = lr(c[j >> 2] | 0, c[j + 4 >> 2] | 0, e | 0, f | 0) | 0;
            f = u() | 0;
            c[o >> 2] = e;
            c[o + 4 >> 2] = f;
            b = b + 1 | 0
          } while (b >>> 0 < g >>> 0)
        }
        qc(m);
        rc(l);
        Ra(k)
      }
      V = n;
      return
    }

    function jb(b) {
      b = b | 0;
      a[b + 12 >> 0] = 0;
      a[b + 13 >> 0] = 0;
      return
    }

    function kb(a) {
      a = a | 0;
      c[a + 8 >> 2] = 0;
      c[a + 4 >> 2] = 0;
      return
    }

    function lb(a) {
      a = a | 0;
      return fo(a) | 0
    }

    function mb(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      i = V;
      V = V + 16 | 0;
      g = d;
      h = i;
      f = e - g | 0;
      if (f >>> 0 > 4294967279) yq(b);
      if (f >>> 0 < 11) a[b + 11 >> 0] = f;
      else {
        k = f + 16 & -16;
        j = eq(k) | 0;
        c[b >> 2] = j;
        c[b + 8 >> 2] = k | -2147483648;
        c[b + 4 >> 2] = f;
        b = j
      }
      if ((d | 0) != (e | 0)) {
        g = e - g | 0;
        f = b;
        while (1) {
          nb(f, d);
          d = d + 1 | 0;
          if ((d | 0) == (e | 0)) break;
          else f = f + 1 | 0
        }
        b = b + g | 0
      }
      a[h >> 0] = 0;
      nb(b, h);
      V = i;
      return
    }

    function nb(b, c) {
      b = b | 0;
      c = c | 0;
      a[b >> 0] = a[c >> 0] | 0;
      return
    }

    function ob(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function pb(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = 4372;
      c[a + 16 >> 2] = a;
      return
    }

    function qb(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = b;
      b = c[b + 4 >> 2] | 0;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = b + (d * 24 | 0);
      return
    }

    function rb(a) {
      a = a | 0;
      c[(c[a >> 2] | 0) + 4 >> 2] = c[a + 4 >> 2];
      return
    }

    function sb(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0;
      d = b + 16 | 0;
      e = c[d >> 2] | 0;
      do
        if (e)
          if ((b | 0) == (e | 0)) {
            e = tb(a) | 0;
            c[a + 16 >> 2] = e;
            d = c[d >> 2] | 0;
            da[c[(c[d >> 2] | 0) + 12 >> 2] & 15](d, e);
            break
          } else {
            c[a + 16 >> 2] = e;
            c[d >> 2] = 0;
            break
          }
      else c[a + 16 >> 2] = 0; while (0);
      return
    }

    function tb(a) {
      a = a | 0;
      return a | 0
    }

    function ub(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0;
      f = a + 12 | 0;
      c[f >> 2] = 0;
      c[a + 16 >> 2] = e;
      do
        if (b)
          if (b >>> 0 > 178956970) {
            f = v(8) | 0;
            vq(f, 6723);
            c[f >> 2] = 5956;
            x(f | 0, 3928, 123)
          } else {
            e = eq(b * 24 | 0) | 0;
            break
          }
      else e = 0; while (0);
      c[a >> 2] = e;
      d = e + (d * 24 | 0) | 0;
      c[a + 8 >> 2] = d;
      c[a + 4 >> 2] = d;
      c[f >> 2] = e + (b * 24 | 0);
      return
    }

    function vb(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;
      i = c[a >> 2] | 0;
      j = a + 4 | 0;
      d = c[j >> 2] | 0;
      h = b + 4 | 0;
      if ((d | 0) == (i | 0)) {
        f = h;
        g = a;
        e = c[h >> 2] | 0;
        d = i
      } else {
        e = c[h >> 2] | 0;
        do {
          d = d + -24 | 0;
          sb(e + -24 | 0, d);
          e = (c[h >> 2] | 0) + -24 | 0;
          c[h >> 2] = e
        } while ((d | 0) != (i | 0));
        f = h;
        g = a;
        d = c[a >> 2] | 0
      }
      c[g >> 2] = e;
      c[f >> 2] = d;
      i = b + 8 | 0;
      h = c[j >> 2] | 0;
      c[j >> 2] = c[i >> 2];
      c[i >> 2] = h;
      i = a + 8 | 0;
      j = b + 12 | 0;
      a = c[i >> 2] | 0;
      c[i >> 2] = c[j >> 2];
      c[j >> 2] = a;
      c[b >> 2] = c[f >> 2];
      return
    }

    function wb(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      d = c[a + 4 >> 2] | 0;
      e = a + 8 | 0;
      b = c[e >> 2] | 0;
      if ((b | 0) != (d | 0))
        do {
          f = b + -24 | 0;
          c[e >> 2] = f;
          gb(f);
          b = c[e >> 2] | 0
        } while ((b | 0) != (d | 0));
      b = c[a >> 2] | 0;
      if (b | 0) Da(b, (c[a + 12 >> 2] | 0) - b | 0);
      return
    }

    function xb(a) {
      a = a | 0;
      return 178956970
    }

    function yb(a) {
      a = a | 0;
      jp(a);
      return
    }

    function zb(a) {
      a = a | 0;
      a = eq(8) | 0;
      c[a >> 2] = 4372;
      return a | 0
    }

    function Ab(a, b) {
      a = a | 0;
      b = b | 0;
      c[b >> 2] = 4372;
      return
    }

    function Bb(a) {
      a = a | 0;
      return
    }

    function Cb(a) {
      a = a | 0;
      Da(a, 8);
      return
    }

    function Db(a, b) {
      a = a | 0;
      b = b | 0;
      Hb(a + 4 | 0, b);
      return
    }

    function Eb(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 7183 ? a + 4 | 0 : 0) | 0
    }

    function Fb(a) {
      a = a | 0;
      return 2664
    }

    function Gb(a) {
      a = a | 0;
      return
    }

    function Hb(a, b) {
      a = a | 0;
      b = b | 0;
      Ib(a, b);
      return
    }

    function Ib(b, c) {
      b = b | 0;
      c = c | 0;
      var e = 0,
        f = 0;
      b = c + 104 | 0;
      c = d[b >> 0] | 0;
      e = c >>> 7;
      f = c >>> 6 & 1;
      if ((e | 0) == 1 & (f | 0) != 0) {
        f = v(8) | 0;
        Jb(f);
        x(f | 0, 2632, 8)
      }
      if ((e | 0) == (f | 0)) {
        f = v(8) | 0;
        Kb(f);
        x(f | 0, 2648, 8)
      } else {
        a[b >> 0] = c & 63;
        return
      }
    }

    function Jb(a) {
      a = a | 0;
      xq(a, 7076);
      c[a >> 2] = 4416;
      return
    }

    function Kb(a) {
      a = a | 0;
      xq(a, 7144);
      c[a >> 2] = 4436;
      return
    }

    function Lb(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function Mb(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function Nb(a) {
      a = a | 0;
      c[a >> 2] = 6092;
      return
    }

    function Ob(b) {
      b = b | 0;
      var c = 0;
      c = b + 12 | 0;
      b = (a[c >> 0] | 0) == 0;
      a[c >> 0] = 0;
      return b | 0
    }

    function Pb(b) {
      b = b | 0;
      return (a[b + 13 >> 0] | 0) != 0 | 0
    }

    function Qb(a, b) {
      a = a | 0;
      b = b | 0;
      a = a + 247 | 0;
      Vb(a, b);
      if ((d[a >> 0] | d[a + 1 >> 0] << 8) << 16 >> 16 == 2) return;
      else {
        b = v(8) | 0;
        Wb(b);
        x(b | 0, 2688, 8)
      }
    }

    function Rb(b, d, e, f) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0;
      switch (f | 0) {
      case 0:
        break;
      case 2: {
        f = c[b + 4 >> 2] | 0;
        d = lr(lr(d | 0, e | 0, -1, -1) | 0, u() | 0, f | 0, ((f | 0) < 0) << 31 >> 31 | 0) | 0;
        e = u() | 0;
        break
      }
      case 1: {
        f = c[b + 8 >> 2] | 0;
        d = lr(f | 0, ((f | 0) < 0) << 31 >> 31 | 0, d | 0, e | 0) | 0;
        e = u() | 0;
        break
      }
      default: {
        e = 0;
        d = 0
      }
      }
      g = c[b + 4 >> 2] | 0;
      h = ((g | 0) < 0) << 31 >> 31;
      f = b + 12 | 0;
      if (((e | 0) < 0) | ((e | 0) > (h | 0) | (e | 0) == (h | 0) & d >>> 0 >= g >>> 0)) a[f >> 0] = 1;
      else {
        a[f >> 0] = 0;
        c[b + 8 >> 2] = d
      }
      return
    }

    function Sb(a) {
      a = a | 0;
      xq(a, 7410);
      c[a >> 2] = 4476;
      return
    }

    function Tb(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      h = V;
      V = V + 16 | 0;
      g = h;
      Xa(a);
      f = b + 32 | 0;
      if ((d[f >> 0] | d[f + 1 >> 0] << 8) << 16 >> 16) {
        e = b + 34 | 0;
        b = 0;
        do {
          j = d[e >> 0] | d[e + 1 >> 0] << 8 | d[e + 2 >> 0] << 16 | d[e + 3 >> 0] << 24;
          k = j + (b * 6 | 0) | 0;
          i = j + (b * 6 | 0) + 2 | 0;
          j = j + (b * 6 | 0) + 4 | 0;
          _b(g, (d[k >> 0] | d[k + 1 >> 0] << 8) & 65535, (d[i >> 0] | d[i + 1 >> 0] << 8) & 65535, (d[j >> 0] | d[j + 1 >> 0] << 8) & 65535);
          Zb(a, g);
          c = c - ((d[i >> 0] | d[i + 1 >> 0] << 8) & 65535) | 0;
          b = b + 1 | 0
        } while (b >>> 0 < ((d[f >> 0] | d[f + 1 >> 0] << 8) & 65535) >>> 0)
      }
      if ((c | 0) < 0) {
        k = v(8) | 0;
        Wb(k);
        x(k | 0, 2688, 8)
      }
      if (c | 0) {
        _b(g, 0, c, 2);
        Zb(a, g)
      }
      V = h;
      return
    }

    function Ub(b, c) {
      b = b | 0;
      c = c | 0;
      var d = 0,
        e = 0;
      d = V;
      V = V + 16 | 0;
      e = d + 1 | 0;
      a[e >> 0] = a[d >> 0] | 0;
      fc(b, c, e);
      V = d;
      return b | 0
    }

    function Vb(b, c) {
      b = b | 0;
      c = c | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      f = c + 2 | 0;
      h = d[c >> 0] | d[c + 1 >> 0] << 8;
      a[b >> 0] = h;
      a[b + 1 >> 0] = h >> 8;
      h = b + 2 | 0;
      f = d[f >> 0] | d[f + 1 >> 0] << 8;
      a[h >> 0] = f;
      a[h + 1 >> 0] = f >> 8;
      a[b + 4 >> 0] = a[c + 4 >> 0] | 0;
      h = c + 6 | 0;
      a[b + 5 >> 0] = a[c + 5 >> 0] | 0;
      f = c + 8 | 0;
      e = b + 6 | 0;
      h = d[h >> 0] | d[h + 1 >> 0] << 8;
      a[e >> 0] = h;
      a[e + 1 >> 0] = h >> 8;
      e = c + 12 | 0;
      h = b + 8 | 0;
      f = d[f >> 0] | d[f + 1 >> 0] << 8 | d[f + 2 >> 0] << 16 | d[f + 3 >> 0] << 24;
      a[h >> 0] = f;
      a[h + 1 >> 0] = f >> 8;
      a[h + 2 >> 0] = f >> 16;
      a[h + 3 >> 0] = f >> 24;
      h = b + 12 | 0;
      e = d[e >> 0] | d[e + 1 >> 0] << 8 | d[e + 2 >> 0] << 16 | d[e + 3 >> 0] << 24;
      a[h >> 0] = e;
      a[h + 1 >> 0] = e >> 8;
      a[h + 2 >> 0] = e >> 16;
      a[h + 3 >> 0] = e >> 24;
      h = c + 16 | 0;
      e = h;
      e = d[e >> 0] | d[e + 1 >> 0] << 8 | d[e + 2 >> 0] << 16 | d[e + 3 >> 0] << 24;
      h = h + 4 | 0;
      h = d[h >> 0] | d[h + 1 >> 0] << 8 | d[h + 2 >> 0] << 16 | d[h + 3 >> 0] << 24;
      f = b + 16 | 0;
      i = f;
      a[i >> 0] = e;
      a[i + 1 >> 0] = e >> 8;
      a[i + 2 >> 0] = e >> 16;
      a[i + 3 >> 0] = e >> 24;
      f = f + 4 | 0;
      a[f >> 0] = h;
      a[f + 1 >> 0] = h >> 8;
      a[f + 2 >> 0] = h >> 16;
      a[f + 3 >> 0] = h >> 24;
      f = c + 32 | 0;
      h = c + 24 | 0;
      i = h;
      i = d[i >> 0] | d[i + 1 >> 0] << 8 | d[i + 2 >> 0] << 16 | d[i + 3 >> 0] << 24;
      h = h + 4 | 0;
      h = d[h >> 0] | d[h + 1 >> 0] << 8 | d[h + 2 >> 0] << 16 | d[h + 3 >> 0] << 24;
      e = b + 24 | 0;
      g = e;
      a[g >> 0] = i;
      a[g + 1 >> 0] = i >> 8;
      a[g + 2 >> 0] = i >> 16;
      a[g + 3 >> 0] = i >> 24;
      e = e + 4 | 0;
      a[e >> 0] = h;
      a[e + 1 >> 0] = h >> 8;
      a[e + 2 >> 0] = h >> 16;
      a[e + 3 >> 0] = h >> 24;
      e = c + 34 | 0;
      h = b + 32 | 0;
      f = d[f >> 0] | d[f + 1 >> 0] << 8;
      a[h >> 0] = f;
      a[h + 1 >> 0] = f >> 8;
      g = b + 34 | 0;
      b = d[g >> 0] | d[g + 1 >> 0] << 8 | d[g + 2 >> 0] << 16 | d[g + 3 >> 0] << 24;
      if (!b) b = f;
      else {
        gq(b);
        b = d[h >> 0] | d[h + 1 >> 0] << 8
      }
      f = fq((b & 65535) * 6 | 0) | 0;
      a[g >> 0] = f;
      a[g + 1 >> 0] = f >> 8;
      a[g + 2 >> 0] = f >> 16;
      a[g + 3 >> 0] = f >> 24;
      if (b << 16 >> 16 ? (b = c + 36 | 0, i = d[e >> 0] | d[e + 1 >> 0] << 8, a[f >> 0] = i, a[f + 1 >> 0] = i >> 8, c = c + 38 | 0, i = f + 2 | 0, b = d[b >> 0] | d[b + 1 >> 0] << 8, a[i >> 0] = b, a[i + 1 >> 0] = b >> 8, i = f + 4 | 0, c = d[c >> 0] | d[c + 1 >> 0] << 8, a[i >> 0] = c, a[i + 1 >> 0] = c >> 8, ((d[h >> 0] | d[h + 1 >> 0] << 8) & 65535) > 1) : 0) {
        b = 1;
        do {
          c = e;
          e = e + 6 | 0;
          i = d[g >> 0] | d[g + 1 >> 0] << 8 | d[g + 2 >> 0] << 16 | d[g + 3 >> 0] << 24;
          j = c + 8 | 0;
          f = i + (b * 6 | 0) | 0;
          k = d[e >> 0] | d[e + 1 >> 0] << 8;
          a[f >> 0] = k;
          a[f + 1 >> 0] = k >> 8;
          c = c + 10 | 0;
          f = i + (b * 6 | 0) + 2 | 0;
          j = d[j >> 0] | d[j + 1 >> 0] << 8;
          a[f >> 0] = j;
          a[f + 1 >> 0] = j >> 8;
          i = i + (b * 6 | 0) + 4 | 0;
          c = d[c >> 0] | d[c + 1 >> 0] << 8;
          a[i >> 0] = c;
          a[i + 1 >> 0] = c >> 8;
          b = b + 1 | 0
        } while (b >>> 0 < ((d[h >> 0] | d[h + 1 >> 0] << 8) & 65535) >>> 0)
      }
      return
    }

    function Wb(a) {
      a = a | 0;
      xq(a, 7354);
      c[a >> 2] = 4456;
      return
    }

    function Xb(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function Yb(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function Zb(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      i = V;
      V = V + 32 | 0;
      f = i;
      g = a + 4 | 0;
      d = c[g >> 2] | 0;
      h = a + 8 | 0;
      do
        if ((d | 0) == (c[h >> 2] | 0)) {
          d = ((d - (c[a >> 2] | 0) | 0) / 12 | 0) + 1 | 0;
          e = ec(a) | 0;
          if (e >>> 0 < d >>> 0) cr(a);
          else {
            j = c[a >> 2] | 0;
            k = ((c[h >> 2] | 0) - j | 0) / 12 | 0;
            h = k << 1;
            bc(f, k >>> 0 < e >>> 1 >>> 0 ? (h >>> 0 < d >>> 0 ? d : h) : e, ((c[g >> 2] | 0) - j | 0) / 12 | 0, a + 8 | 0);
            h = f + 8 | 0;
            g = c[h >> 2] | 0;
            c[g >> 2] = c[b >> 2];
            c[g + 4 >> 2] = c[b + 4 >> 2];
            c[g + 8 >> 2] = c[b + 8 >> 2];
            c[h >> 2] = (c[h >> 2] | 0) + 12;
            cc(a, f);
            dc(f);
            break
          }
        } else {
          $b(f, a, 1);
          k = f + 4 | 0;
          j = c[k >> 2] | 0;
          c[j >> 2] = c[b >> 2];
          c[j + 4 >> 2] = c[b + 4 >> 2];
          c[j + 8 >> 2] = c[b + 8 >> 2];
          c[k >> 2] = (c[k >> 2] | 0) + 12;
          ac(f)
        } while (0);
      V = i;
      return
    }

    function _b(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      c[a >> 2] = b;
      c[a + 4 >> 2] = d;
      c[a + 8 >> 2] = e;
      return
    }

    function $b(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = b;
      b = c[b + 4 >> 2] | 0;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = b + (d * 12 | 0);
      return
    }

    function ac(a) {
      a = a | 0;
      c[(c[a >> 2] | 0) + 4 >> 2] = c[a + 4 >> 2];
      return
    }

    function bc(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0;
      f = a + 12 | 0;
      c[f >> 2] = 0;
      c[a + 16 >> 2] = e;
      do
        if (b)
          if (b >>> 0 > 357913941) {
            f = v(8) | 0;
            vq(f, 6723);
            c[f >> 2] = 5956;
            x(f | 0, 3928, 123)
          } else {
            e = eq(b * 12 | 0) | 0;
            break
          }
      else e = 0; while (0);
      c[a >> 2] = e;
      d = e + (d * 12 | 0) | 0;
      c[a + 8 >> 2] = d;
      c[a + 4 >> 2] = d;
      c[f >> 2] = e + (b * 12 | 0);
      return
    }

    function cc(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      e = c[a >> 2] | 0;
      h = a + 4 | 0;
      g = b + 4 | 0;
      f = (c[h >> 2] | 0) - e | 0;
      d = (c[g >> 2] | 0) + (((f | 0) / -12 | 0) * 12 | 0) | 0;
      c[g >> 2] = d;
      if ((f | 0) > 0) {
        ur(d | 0, e | 0, f | 0) | 0;
        e = g;
        d = c[g >> 2] | 0
      } else e = g;
      g = c[a >> 2] | 0;
      c[a >> 2] = d;
      c[e >> 2] = g;
      g = b + 8 | 0;
      f = c[h >> 2] | 0;
      c[h >> 2] = c[g >> 2];
      c[g >> 2] = f;
      g = a + 8 | 0;
      h = b + 12 | 0;
      a = c[g >> 2] | 0;
      c[g >> 2] = c[h >> 2];
      c[h >> 2] = a;
      c[b >> 2] = c[e >> 2];
      return
    }

    function dc(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = c[a + 4 >> 2] | 0;
      d = a + 8 | 0;
      e = c[d >> 2] | 0;
      if ((e | 0) != (b | 0)) c[d >> 2] = e + (~(((e + -12 - b | 0) >>> 0) / 12 | 0) * 12 | 0);
      b = c[a >> 2] | 0;
      if (b | 0) Da(b, (c[a + 12 >> 2] | 0) - b | 0);
      return
    }

    function ec(a) {
      a = a | 0;
      return 357913941
    }

    function fc(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0;
      gc(a);
      c[a >> 2] = c[b >> 2];
      d = b + 4 | 0;
      c[a + 4 >> 2] = c[d >> 2];
      e = b + 8 | 0;
      c[a + 8 >> 2] = c[e >> 2];
      c[e >> 2] = 0;
      c[d >> 2] = 0;
      c[b >> 2] = 0;
      return
    }

    function gc(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      b = c[a >> 2] | 0;
      d = b;
      if (b | 0) {
        e = a + 4 | 0;
        c[e >> 2] = d;
        f = a + 8 | 0;
        Da(b, (c[f >> 2] | 0) - d | 0);
        c[f >> 2] = 0;
        c[e >> 2] = 0;
        c[a >> 2] = 0
      }
      return
    }

    function hc(a) {
      a = a | 0;
      xq(a, 7660);
      c[a >> 2] = 4496;
      return
    }

    function ic(a, b) {
      a = a | 0;
      b = b | 0;
      xq(a, b);
      c[a >> 2] = 4516;
      return
    }

    function jc(a) {
      a = a | 0;
      xq(a, 7704);
      c[a >> 2] = 4536;
      return
    }

    function kc(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0;
      d = a + 4 | 0;
      f = c[a >> 2] | 0;
      e = (c[d >> 2] | 0) - f >> 3;
      if (e >>> 0 >= b >>> 0) {
        if (e >>> 0 > b >>> 0) c[d >> 2] = f + (b << 3)
      } else vc(a, b - e | 0);
      return
    }

    function lc(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = b;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = -1;
      return
    }

    function mc(a, b, d, e, f) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = d;
      c[a + 12 >> 2] = e;
      c[a + 16 >> 2] = f;
      c[a + 36 >> 2] = 0;
      c[a + 40 >> 2] = 0;
      c[a + 44 >> 2] = 0;
      Gc(a + 48 | 0);
      c[a + 68 >> 2] = 0;
      c[a + 72 >> 2] = 0;
      c[a + 76 >> 2] = 0;
      do
        if (!f) {
          d = a + 20 | 0;
          if ((b + -1 | 0) >>> 0 < 31) {
            c[d >> 2] = b;
            f = 1 << b;
            c[a + 24 >> 2] = f;
            d = f >>> 1;
            c[a + 28 >> 2] = 0 - d;
            d = f + -1 - d | 0;
            break
          } else {
            c[d >> 2] = 32;
            c[a + 24 >> 2] = 0;
            c[a + 28 >> 2] = -2147483648;
            d = 2147483647;
            break
          }
        } else {
          e = a + 20 | 0;
          c[e >> 2] = 0;
          c[a + 24 >> 2] = f;
          d = f;
          g = 0;
          while (1) {
            d = d >>> 1;
            b = g + 1 | 0;
            if (!d) break;
            else g = b
          }
          c[e >> 2] = (1 << g | 0) == (f | 0) ? g : b;
          d = f >>> 1;
          c[a + 28 >> 2] = 0 - d;
          d = f + -1 - d | 0
        } while (0);
      c[a + 32 >> 2] = d;
      c[a >> 2] = 0;
      return
    }

    function nc(a) {
      a = a | 0;
      var b = 0;
      b = ((Jc(c[a >> 2] | 0) | 0) & 255) << 24;
      b = ((Jc(c[a >> 2] | 0) | 0) & 255) << 16 | b;
      b = b | ((Jc(c[a >> 2] | 0) | 0) & 255) << 8;
      c[a + 4 >> 2] = b | (Jc(c[a >> 2] | 0) | 0) & 255;
      return
    }

    function oc(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0;
      q = V;
      V = V + 64 | 0;
      o = q + 44 | 0;
      p = q;
      k = a + 36 | 0;
      l = a + 40 | 0;
      a: do
        if ((c[k >> 2] | 0) == (c[l >> 2] | 0)) {
          m = a + 8 | 0;
          b: do
            if (!(c[m >> 2] | 0)) n = a + 20 | 0;
            else {
              f = a + 20 | 0;
              g = a + 44 | 0;
              h = o + 4 | 0;
              i = a + 44 | 0;
              j = o + 8 | 0;
              e = 0;
              while (1) {
                Oc(p, (c[f >> 2] | 0) + 1 | 0, 0, 0);
                b = c[l >> 2] | 0;
                if (b >>> 0 < (c[g >> 2] | 0) >>> 0) {
                  Pc(o, k, 1);
                  Rc(c[h >> 2] | 0, p);
                  c[h >> 2] = (c[h >> 2] | 0) + 44;
                  Qc(o)
                } else {
                  b = ((b - (c[k >> 2] | 0) | 0) / 44 | 0) + 1 | 0;
                  d = Vc(k) | 0;
                  if (d >>> 0 < b >>> 0) break;
                  r = c[k >> 2] | 0;
                  t = ((c[g >> 2] | 0) - r | 0) / 44 | 0;
                  s = t << 1;
                  Sc(o, t >>> 0 < d >>> 1 >>> 0 ? (s >>> 0 < b >>> 0 ? b : s) : d, ((c[l >> 2] | 0) - r | 0) / 44 | 0, i);
                  Rc(c[j >> 2] | 0, p);
                  c[j >> 2] = (c[j >> 2] | 0) + 44;
                  Tc(k, o);
                  Uc(o)
                }
                Ic(p);
                e = e + 1 | 0;
                if (e >>> 0 >= (c[m >> 2] | 0) >>> 0) {
                  n = f;
                  break b
                }
              }
              cr(k)
            }
          while (0);
          if (c[n >> 2] | 0) {
            h = a + 12 | 0;
            i = a + 68 | 0;
            j = a + 72 | 0;
            k = a + 76 | 0;
            l = o + 4 | 0;
            f = a + 76 | 0;
            g = o + 8 | 0;
            e = 1;
            while (1) {
              b = c[h >> 2] | 0;
              Oc(p, 1 << (e >>> 0 > b >>> 0 ? b : e), 0, 0);
              b = c[j >> 2] | 0;
              if (b >>> 0 < (c[k >> 2] | 0) >>> 0) {
                Pc(o, i, 1);
                Rc(c[l >> 2] | 0, p);
                c[l >> 2] = (c[l >> 2] | 0) + 44;
                Qc(o)
              } else {
                b = ((b - (c[i >> 2] | 0) | 0) / 44 | 0) + 1 | 0;
                d = Vc(i) | 0;
                if (d >>> 0 < b >>> 0) break;
                t = c[i >> 2] | 0;
                r = ((c[k >> 2] | 0) - t | 0) / 44 | 0;
                s = r << 1;
                Sc(o, r >>> 0 < d >>> 1 >>> 0 ? (s >>> 0 < b >>> 0 ? b : s) : d, ((c[j >> 2] | 0) - t | 0) / 44 | 0, f);
                Rc(c[g >> 2] | 0, p);
                c[g >> 2] = (c[g >> 2] | 0) + 44;
                Tc(i, o);
                Uc(o)
              }
              Ic(p);
              e = e + 1 | 0;
              if (e >>> 0 > (c[n >> 2] | 0) >>> 0) break a
            }
            cr(i)
          }
        }
      while (0);
      V = q;
      return
    }

    function pc(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      d = (Yc(a, b, (c[a + 36 >> 2] | 0) + (e * 44 | 0) | 0) | 0) + d | 0;
      b = c[a + 24 >> 2] | 0;
      if ((d | 0) < 0) return d + b | 0;
      else return d - (d >>> 0 < b >>> 0 ? 0 : b) | 0;
      return 0
    }

    function qc(a) {
      a = a | 0;
      Hc(a + 68 | 0);
      Hc(a + 36 | 0);
      return
    }

    function rc(a) {
      a = a | 0;
      return
    }

    function sc(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function tc(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function uc(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function vc(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      i = V;
      V = V + 32 | 0;
      f = i;
      g = a + 8 | 0;
      h = a + 4 | 0;
      d = c[h >> 2] | 0;
      do
        if ((c[g >> 2] | 0) - d >> 3 >>> 0 < b >>> 0) {
          d = (d - (c[a >> 2] | 0) >> 3) + b | 0;
          e = Dc(a) | 0;
          if (e >>> 0 < d >>> 0) cr(a);
          else {
            j = c[a >> 2] | 0;
            k = (c[g >> 2] | 0) - j | 0;
            g = k >> 2;
            xc(f, k >> 3 >>> 0 < e >>> 1 >>> 0 ? (g >>> 0 < d >>> 0 ? d : g) : e, (c[h >> 2] | 0) - j >> 3, a + 8 | 0);
            yc(f, b);
            zc(a, f);
            Ac(f);
            break
          }
        } else wc(a, b); while (0);
      V = i;
      return
    }

    function wc(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0;
      f = V;
      V = V + 16 | 0;
      e = f;
      Bc(e, a, b);
      a = e + 4 | 0;
      b = c[a >> 2] | 0;
      d = c[e + 8 >> 2] | 0;
      if ((b | 0) != (d | 0)) {
        d = d + -8 - b | 0;
        wr(b | 0, 0, d + 8 & -8 | 0) | 0;
        c[a >> 2] = b + ((d >>> 3) + 1 << 3)
      }
      Cc(e);
      V = f;
      return
    }

    function xc(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0;
      f = a + 12 | 0;
      c[f >> 2] = 0;
      c[a + 16 >> 2] = e;
      do
        if (b)
          if (b >>> 0 > 536870911) {
            f = v(8) | 0;
            vq(f, 6723);
            c[f >> 2] = 5956;
            x(f | 0, 3928, 123)
          } else {
            e = eq(b << 3) | 0;
            break
          }
      else e = 0; while (0);
      c[a >> 2] = e;
      d = e + (d << 3) | 0;
      c[a + 8 >> 2] = d;
      c[a + 4 >> 2] = d;
      c[f >> 2] = e + (b << 3);
      return
    }

    function yc(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0;
      e = V;
      V = V + 16 | 0;
      d = e;
      Ec(d, a + 8 | 0, b);
      a = c[d >> 2] | 0;
      b = c[d + 4 >> 2] | 0;
      if ((a | 0) != (b | 0)) {
        b = b + -8 - a | 0;
        wr(a | 0, 0, b + 8 & -8 | 0) | 0;
        c[d >> 2] = a + ((b >>> 3) + 1 << 3)
      }
      Fc(d);
      V = e;
      return
    }

    function zc(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      e = c[a >> 2] | 0;
      h = a + 4 | 0;
      g = b + 4 | 0;
      f = (c[h >> 2] | 0) - e | 0;
      d = (c[g >> 2] | 0) + (0 - (f >> 3) << 3) | 0;
      c[g >> 2] = d;
      if ((f | 0) > 0) {
        ur(d | 0, e | 0, f | 0) | 0;
        e = g;
        d = c[g >> 2] | 0
      } else e = g;
      g = c[a >> 2] | 0;
      c[a >> 2] = d;
      c[e >> 2] = g;
      g = b + 8 | 0;
      f = c[h >> 2] | 0;
      c[h >> 2] = c[g >> 2];
      c[g >> 2] = f;
      g = a + 8 | 0;
      h = b + 12 | 0;
      a = c[g >> 2] | 0;
      c[g >> 2] = c[h >> 2];
      c[h >> 2] = a;
      c[b >> 2] = c[e >> 2];
      return
    }

    function Ac(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = c[a + 4 >> 2] | 0;
      d = a + 8 | 0;
      e = c[d >> 2] | 0;
      if ((e | 0) != (b | 0)) c[d >> 2] = e + (~((e + -8 - b | 0) >>> 3) << 3);
      b = c[a >> 2] | 0;
      if (b | 0) Da(b, (c[a + 12 >> 2] | 0) - b | 0);
      return
    }

    function Bc(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = b;
      b = c[b + 4 >> 2] | 0;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = b + (d << 3);
      return
    }

    function Cc(a) {
      a = a | 0;
      c[(c[a >> 2] | 0) + 4 >> 2] = c[a + 4 >> 2];
      return
    }

    function Dc(a) {
      a = a | 0;
      return 536870911
    }

    function Ec(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = c[b >> 2];
      c[a + 4 >> 2] = (c[b >> 2] | 0) + (d << 3);
      c[a + 8 >> 2] = b;
      return
    }

    function Fc(a) {
      a = a | 0;
      c[c[a + 8 >> 2] >> 2] = c[a >> 2];
      return
    }

    function Gc(a) {
      a = a | 0;
      c[a + 12 >> 2] = 1;
      c[a + 16 >> 2] = 2;
      c[a + 8 >> 2] = 4096;
      c[a + 4 >> 2] = 4;
      c[a >> 2] = 4;
      return
    }

    function Hc(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      d = c[a >> 2] | 0;
      if (d | 0) {
        e = a + 4 | 0;
        b = c[e >> 2] | 0;
        if ((b | 0) == (d | 0)) b = d;
        else {
          do {
            b = b + -44 | 0;
            Ic(b)
          } while ((b | 0) != (d | 0));
          b = c[a >> 2] | 0
        }
        c[e >> 2] = d;
        Da(b, (c[a + 8 >> 2] | 0) - b | 0)
      }
      return
    }

    function Ic(a) {
      a = a | 0;
      var b = 0;
      b = c[a + 8 >> 2] | 0;
      if (b | 0) Ua(b);
      b = c[a + 12 >> 2] | 0;
      if (b | 0) Ua(b);
      b = c[a + 16 >> 2] | 0;
      if (b | 0) Ua(b);
      return
    }

    function Jc(b) {
      b = b | 0;
      var d = 0,
        e = 0;
      e = b + 4 | 0;
      d = c[e >> 2] | 0;
      if ((d | 0) >= (c[b + 8 >> 2] | 0)) {
        Kc(b);
        d = c[e >> 2] | 0
      }
      b = c[b + 12 >> 2] | 0;
      c[e >> 2] = d + 1;
      return a[b + d >> 0] | 0
    }

    function Kc(a) {
      a = a | 0;
      var b = 0;
      c[a + 4 >> 2] = 0;
      $a(c[a >> 2] | 0, c[a + 12 >> 2] | 0, 1048576);
      b = Lc(c[a >> 2] | 0) | 0;
      c[a + 8 >> 2] = b;
      if (!b) {
        b = v(8) | 0;
        Mc(b);
        x(b | 0, 2752, 8)
      } else return
    }

    function Lc(a) {
      a = a | 0;
      return c[a + 16 >> 2] | 0
    }

    function Mc(a) {
      a = a | 0;
      xq(a, 7769);
      c[a >> 2] = 4556;
      return
    }

    function Nc(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function Oc(b, d, e, f) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0;
      c[b >> 2] = d;
      a[b + 4 >> 0] = e & 1;
      h = b + 8 | 0;
      c[h >> 2] = 0;
      i = b + 12 | 0;
      c[i >> 2] = 0;
      g = b + 16 | 0;
      c[g >> 2] = 0;
      if ((d + -2 | 0) >>> 0 > 2046) {
        b = v(8) | 0;
        xq(b, 7789);
        x(b | 0, 3912, 8)
      }
      c[b + 32 >> 2] = d + -1;
      if (d >>> 0 > 16 & (e ^ 1)) {
        e = 3;
        while (1)
          if (1 << e + 2 >>> 0 < d >>> 0) e = e + 1 | 0;
          else break;
        d = 1 << e;
        c[b + 36 >> 2] = d;
        c[b + 40 >> 2] = 15 - e;
        c[g >> 2] = _a((d << 2) + 8 | 0) | 0;
        d = c[b >> 2] | 0
      } else {
        c[g >> 2] = 0;
        c[b + 40 >> 2] = 0;
        c[b + 36 >> 2] = 0
      }
      c[h >> 2] = _a(d << 2) | 0;
      g = _a(c[b >> 2] << 2) | 0;
      c[i >> 2] = g;
      c[b + 20 >> 2] = 0;
      d = c[b >> 2] | 0;
      e = b + 24 | 0;
      c[e >> 2] = d;
      d = (d | 0) != 0;
      if (!f) {
        if (d) {
          d = 0;
          do {
            c[g + (d << 2) >> 2] = 1;
            d = d + 1 | 0
          } while (d >>> 0 < (c[b >> 2] | 0) >>> 0)
        }
      } else if (d) {
        d = 0;
        do {
          c[g + (d << 2) >> 2] = c[f + (d << 2) >> 2];
          d = d + 1 | 0
        } while (d >>> 0 < (c[b >> 2] | 0) >>> 0)
      }
      Xc(b);
      f = ((c[b >> 2] | 0) + 6 | 0) >>> 1;
      c[e >> 2] = f;
      c[b + 28 >> 2] = f;
      return
    }

    function Pc(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = b;
      b = c[b + 4 >> 2] | 0;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = b + (d * 44 | 0);
      return
    }

    function Qc(a) {
      a = a | 0;
      c[(c[a >> 2] | 0) + 4 >> 2] = c[a + 4 >> 2];
      return
    }

    function Rc(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0;
      c[b >> 2] = c[d >> 2];
      a[b + 4 >> 0] = a[d + 4 >> 0] | 0;
      e = d + 8 | 0;
      c[b + 8 >> 2] = c[e >> 2];
      c[b + 12 >> 2] = c[d + 12 >> 2];
      c[b + 16 >> 2] = c[d + 16 >> 2];
      c[b + 20 >> 2] = c[d + 20 >> 2];
      c[b + 24 >> 2] = c[d + 24 >> 2];
      c[b + 28 >> 2] = c[d + 28 >> 2];
      c[b + 32 >> 2] = c[d + 32 >> 2];
      c[b + 36 >> 2] = c[d + 36 >> 2];
      c[b + 40 >> 2] = c[d + 40 >> 2];
      c[e >> 2] = 0;
      c[e + 4 >> 2] = 0;
      c[e + 8 >> 2] = 0;
      return
    }

    function Sc(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0;
      f = a + 12 | 0;
      c[f >> 2] = 0;
      c[a + 16 >> 2] = e;
      do
        if (b)
          if (b >>> 0 > 97612893) {
            f = v(8) | 0;
            vq(f, 6723);
            c[f >> 2] = 5956;
            x(f | 0, 3928, 123)
          } else {
            e = eq(b * 44 | 0) | 0;
            break
          }
      else e = 0; while (0);
      c[a >> 2] = e;
      d = e + (d * 44 | 0) | 0;
      c[a + 8 >> 2] = d;
      c[a + 4 >> 2] = d;
      c[f >> 2] = e + (b * 44 | 0);
      return
    }

    function Tc(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;
      i = c[a >> 2] | 0;
      j = a + 4 | 0;
      d = c[j >> 2] | 0;
      h = b + 4 | 0;
      if ((d | 0) == (i | 0)) {
        f = h;
        g = a;
        e = c[h >> 2] | 0;
        d = i
      } else {
        e = c[h >> 2] | 0;
        do {
          d = d + -44 | 0;
          Wc(e + -44 | 0, d);
          e = (c[h >> 2] | 0) + -44 | 0;
          c[h >> 2] = e
        } while ((d | 0) != (i | 0));
        f = h;
        g = a;
        d = c[a >> 2] | 0
      }
      c[g >> 2] = e;
      c[f >> 2] = d;
      i = b + 8 | 0;
      h = c[j >> 2] | 0;
      c[j >> 2] = c[i >> 2];
      c[i >> 2] = h;
      i = a + 8 | 0;
      j = b + 12 | 0;
      a = c[i >> 2] | 0;
      c[i >> 2] = c[j >> 2];
      c[j >> 2] = a;
      c[b >> 2] = c[f >> 2];
      return
    }

    function Uc(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      d = c[a + 4 >> 2] | 0;
      e = a + 8 | 0;
      b = c[e >> 2] | 0;
      if ((b | 0) != (d | 0))
        do {
          f = b + -44 | 0;
          c[e >> 2] = f;
          Ic(f);
          b = c[e >> 2] | 0
        } while ((b | 0) != (d | 0));
      b = c[a >> 2] | 0;
      if (b | 0) Da(b, (c[a + 12 >> 2] | 0) - b | 0);
      return
    }

    function Vc(a) {
      a = a | 0;
      return 97612893
    }

    function Wc(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0;
      e = c[d >> 2] | 0;
      c[b >> 2] = e;
      a[b + 4 >> 0] = a[d + 4 >> 0] | 0;
      c[b + 20 >> 2] = c[d + 20 >> 2];
      c[b + 24 >> 2] = c[d + 24 >> 2];
      c[b + 28 >> 2] = c[d + 28 >> 2];
      c[b + 32 >> 2] = c[d + 32 >> 2];
      h = b + 36 | 0;
      c[h >> 2] = c[d + 36 >> 2];
      c[b + 40 >> 2] = c[d + 40 >> 2];
      e = e << 2;
      f = _a(e) | 0;
      c[b + 8 >> 2] = f;
      g = c[b >> 2] | 0;
      if (g | 0) vr(f | 0, c[d + 8 >> 2] | 0, g << 2 | 0) | 0;
      e = _a(e) | 0;
      c[b + 12 >> 2] = e;
      f = c[b >> 2] | 0;
      if (f | 0) vr(e | 0, c[d + 12 >> 2] | 0, f << 2 | 0) | 0;
      e = c[h >> 2] | 0;
      if (e) {
        f = _a((e << 2) + 8 | 0) | 0;
        c[b + 16 >> 2] = f;
        e = (c[h >> 2] << 2) + 8 | 0;
        if (e | 0) vr(f | 0, c[d + 16 >> 2] | 0, e | 0) | 0
      } else c[b + 16 >> 2] = 0;
      return
    }

    function Xc(b) {
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        r = 0;
      r = b + 24 | 0;
      g = b + 20 | 0;
      d = (c[g >> 2] | 0) + (c[r >> 2] | 0) | 0;
      c[g >> 2] = d;
      if (d >>> 0 > 32768) {
        c[g >> 2] = 0;
        if (!(c[b >> 2] | 0)) d = 0;
        else {
          f = c[b + 12 >> 2] | 0;
          e = 0;
          do {
            n = f + (e << 2) | 0;
            d = ((c[n >> 2] | 0) + 1 | 0) >>> 1;
            c[n >> 2] = d;
            d = (c[g >> 2] | 0) + d | 0;
            c[g >> 2] = d;
            e = e + 1 | 0
          } while (e >>> 0 < (c[b >> 2] | 0) >>> 0)
        }
      }
      n = 2147483648 / (d >>> 0) | 0;
      do
        if ((a[b + 4 >> 0] | 0) == 0 ? (o = b + 36 | 0, (c[o >> 2] | 0) != 0) : 0) {
          if (c[b >> 2] | 0) {
            j = c[b + 8 >> 2] | 0;
            k = c[b + 12 >> 2] | 0;
            l = b + 40 | 0;
            m = b + 16 | 0;
            d = 0;
            h = 0;
            i = 0;
            do {
              e = (q(h, n) | 0) >>> 16;
              c[j + (i << 2) >> 2] = e;
              h = (c[k + (i << 2) >> 2] | 0) + h | 0;
              e = e >>> (c[l >> 2] | 0);
              if (d >>> 0 < e >>> 0) {
                f = i + -1 | 0;
                g = c[m >> 2] | 0;
                do {
                  d = d + 1 | 0;
                  c[g + (d << 2) >> 2] = f
                } while ((d | 0) != (e | 0));
                d = e
              }
              i = i + 1 | 0
            } while (i >>> 0 < (c[b >> 2] | 0) >>> 0);
            e = c[m >> 2] | 0;
            c[e >> 2] = 0;
            if (d >>> 0 > (c[o >> 2] | 0) >>> 0) {
              d = b;
              break
            }
          } else {
            e = c[b + 16 >> 2] | 0;
            c[e >> 2] = 0;
            d = 0
          }
          do {
            d = d + 1 | 0;
            c[e + (d << 2) >> 2] = (c[b >> 2] | 0) + -1
          } while (d >>> 0 <= (c[o >> 2] | 0) >>> 0);
          d = b
        } else p = 7; while (0);
      if ((p | 0) == 7)
        if (!(c[b >> 2] | 0)) d = b;
        else {
          f = c[b + 8 >> 2] | 0;
          g = c[b + 12 >> 2] | 0;
          d = 0;
          e = 0;
          do {
            c[f + (d << 2) >> 2] = (q(e, n) | 0) >>> 16;
            e = (c[g + (d << 2) >> 2] | 0) + e | 0;
            d = d + 1 | 0
          } while (d >>> 0 < (c[b >> 2] | 0) >>> 0);
          d = b
        } p = ((c[r >> 2] | 0) * 5 | 0) >>> 2;
      o = (c[d >> 2] << 3) + 48 | 0;
      p = p >>> 0 > o >>> 0 ? o : p;
      c[r >> 2] = p;
      c[b + 28 >> 2] = p;
      return
    }

    function Yc(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0;
      d = Zc(b, d) | 0;
      c[a >> 2] = d;
      do
        if (d) {
          if (d >>> 0 >= 32) {
            d = c[a + 28 >> 2] | 0;
            break
          }
          e = c[a + 12 >> 2] | 0;
          if (d >>> 0 > e >>> 0) {
            e = d - e | 0;
            d = Zc(b, (c[a + 68 >> 2] | 0) + ((d + -1 | 0) * 44 | 0) | 0) | 0;
            e = d << e | (_c(b, e) | 0)
          } else e = Zc(b, (c[a + 68 >> 2] | 0) + ((d + -1 | 0) * 44 | 0) | 0) | 0;
          d = c[a >> 2] | 0;
          if ((e | 0) < (1 << d + -1 | 0)) {
            d = e + 1 + (-1 << d) | 0;
            break
          } else {
            d = e + 1 | 0;
            break
          }
        } else d = $c(b, a + 48 | 0) | 0; while (0);
      return d | 0
    }

    function Zc(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;
      n = a + 8 | 0;
      m = c[n >> 2] | 0;
      f = c[b + 16 >> 2] | 0;
      if (f) {
        e = a + 4 | 0;
        d = c[e >> 2] | 0;
        l = m >>> 15;
        c[n >> 2] = l;
        j = (d >>> 0) / (l >>> 0) | 0;
        i = j >>> (c[b + 40 >> 2] | 0);
        g = c[f + (i << 2) >> 2] | 0;
        i = (c[f + (i + 1 << 2) >> 2] | 0) + 1 | 0;
        h = g + 1 | 0;
        k = c[b + 8 >> 2] | 0;
        if (i >>> 0 > h >>> 0) {
          f = g;
          g = i;
          do {
            h = (g + f | 0) >>> 1;
            i = (c[k + (h << 2) >> 2] | 0) >>> 0 > j >>> 0;
            f = i ? f : h;
            g = i ? h : g;
            h = f + 1 | 0
          } while (g >>> 0 > h >>> 0);
          g = f
        }
        f = q(c[k + (g << 2) >> 2] | 0, l) | 0;
        if ((g | 0) == (c[b + 32 >> 2] | 0)) h = m;
        else h = q(c[k + (h << 2) >> 2] | 0, l) | 0
      } else {
        k = m >>> 15;
        c[n >> 2] = k;
        i = c[b >> 2] | 0;
        l = c[b + 8 >> 2] | 0;
        e = a + 4 | 0;
        d = c[e >> 2] | 0;
        j = i >>> 1;
        f = 0;
        h = m;
        g = 0;
        do {
          o = q(c[l + (j << 2) >> 2] | 0, k) | 0;
          m = o >>> 0 > d >>> 0;
          h = m ? o : h;
          f = m ? f : o;
          g = m ? g : j;
          i = m ? j : i;
          j = (g + i | 0) >>> 1
        } while ((j | 0) != (g | 0))
      }
      c[e >> 2] = d - f;
      o = h - f | 0;
      c[n >> 2] = o;
      if (o >>> 0 < 16777216) ad(a);
      n = (c[b + 12 >> 2] | 0) + (g << 2) | 0;
      c[n >> 2] = (c[n >> 2] | 0) + 1;
      n = b + 28 | 0;
      o = (c[n >> 2] | 0) + -1 | 0;
      c[n >> 2] = o;
      if (!o) Xc(b);
      return g | 0
    }

    function _c(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0;
      if (b >>> 0 > 19) {
        d = (bd(a) | 0) & 65535;
        return (_c(a, b + -16 | 0) | 0) << 16 | d | 0
      }
      e = a + 4 | 0;
      f = c[e >> 2] | 0;
      g = a + 8 | 0;
      d = (c[g >> 2] | 0) >>> b;
      c[g >> 2] = d;
      b = (f >>> 0) / (d >>> 0) | 0;
      c[e >> 2] = f - (q(b, d) | 0);
      if (d >>> 0 < 16777216) ad(a);
      return b | 0
    }

    function $c(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0;
      e = a + 8 | 0;
      f = c[e >> 2] | 0;
      d = q(f >>> 13, c[b + 8 >> 2] | 0) | 0;
      g = a + 4 | 0;
      h = c[g >> 2] | 0;
      i = h >>> 0 >= d >>> 0;
      if (i) {
        c[g >> 2] = h - d;
        d = f - d | 0;
        c[e >> 2] = d
      } else {
        c[e >> 2] = d;
        h = b + 12 | 0;
        c[h >> 2] = (c[h >> 2] | 0) + 1
      }
      if (d >>> 0 < 16777216) ad(a);
      h = b + 4 | 0;
      a = (c[h >> 2] | 0) + -1 | 0;
      c[h >> 2] = a;
      if (!a) cd(b);
      return i & 1 | 0
    }

    function ad(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      b = a + 4 | 0;
      d = a + 8 | 0;
      e = c[b >> 2] | 0;
      do {
        e = e << 8 | (Jc(c[a >> 2] | 0) | 0) & 255;
        c[b >> 2] = e;
        f = c[d >> 2] << 8;
        c[d >> 2] = f
      } while (f >>> 0 < 16777216);
      return
    }

    function bd(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      d = a + 4 | 0;
      f = c[d >> 2] | 0;
      b = a + 8 | 0;
      e = (c[b >> 2] | 0) >>> 16;
      c[b >> 2] = e;
      b = (f >>> 0) / (e >>> 0) | 0;
      c[d >> 2] = f - (q(b, e) | 0);
      ad(a);
      return b & 65535 | 0
    }

    function cd(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0;
      f = c[a >> 2] | 0;
      d = a + 16 | 0;
      b = (c[d >> 2] | 0) + f | 0;
      c[d >> 2] = b;
      if (b >>> 0 > 8192) {
        e = (b + 1 | 0) >>> 1;
        c[d >> 2] = e;
        g = a + 12 | 0;
        b = ((c[g >> 2] | 0) + 1 | 0) >>> 1;
        c[g >> 2] = b;
        if ((b | 0) == (e | 0)) {
          b = e + 1 | 0;
          c[d >> 2] = b;
          d = b;
          b = e
        } else d = e
      } else {
        d = b;
        b = c[a + 12 >> 2] | 0
      }
      c[a + 8 >> 2] = (q(b, 2147483648 / (d >>> 0) | 0) | 0) >>> 18;
      g = f * 5 | 0;
      g = g >>> 0 > 259 ? 64 : g >>> 2;
      c[a >> 2] = g;
      c[a + 4 >> 2] = g;
      return
    }

    function dd(a, b) {
      a = a | 0;
      b = b | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;
      m = V;
      V = V + 32 | 0;
      h = m + 16 | 0;
      i = m + 8 | 0;
      j = m;
      k = a + 336 | 0;
      f = k;
      g = a + 259 | 0;
      if (!((c[f + 4 >> 2] | 0) == 0 ? (c[f >> 2] | 0) == (d[g >> 0] | d[g + 1 >> 0] << 8 | d[g + 2 >> 0] << 16 | d[g + 3 >> 0] << 24 | 0) : 0)) {
        f = a + 320 | 0;
        e = c[f >> 2] | 0;
        g = e;
        if (!((e | 0) != 0 ? (c[a + 312 >> 2] | 0) != 0 : 0)) {
          e = g;
          l = 5
        }
      } else {
        f = a + 320 | 0;
        e = c[a + 320 >> 2] | 0;
        l = 5
      }
      if ((l | 0) == 5) {
        l = a + 320 | 0;
        c[h >> 2] = e;
        c[l >> 2] = 0;
        e = a + 324 | 0;
        c[h + 4 >> 2] = c[e >> 2];
        c[e >> 2] = 0;
        Na(h);
        g = a + 312 | 0;
        c[h >> 2] = c[g >> 2];
        c[g >> 2] = 0;
        n = a + 316 | 0;
        c[h + 4 >> 2] = c[n >> 2];
        c[n >> 2] = 0;
        Oa(h);
        o = eq(12) | 0;
        lc(o, a + 4 | 0);
        c[j >> 2] = 0;
        c[h >> 2] = c[j >> 2];
        fd(i, o, h);
        o = c[i >> 2] | 0;
        c[i >> 2] = c[g >> 2];
        c[g >> 2] = o;
        o = i + 4 | 0;
        j = c[o >> 2] | 0;
        c[o >> 2] = c[n >> 2];
        c[n >> 2] = j;
        Oa(i);
        ed(i, c[g >> 2] | 0, a + 300 | 0);
        g = c[i >> 2] | 0;
        n = i + 4 | 0;
        j = c[n >> 2] | 0;
        c[i >> 2] = 0;
        c[n >> 2] = 0;
        c[h >> 2] = c[l >> 2];
        c[l >> 2] = g;
        c[h + 4 >> 2] = c[e >> 2];
        c[e >> 2] = j;
        Na(h);
        Na(i);
        e = a + 328 | 0;
        j = e;
        j = lr(c[j >> 2] | 0, c[j + 4 >> 2] | 0, 1, 0) | 0;
        l = u() | 0;
        c[e >> 2] = j;
        c[e + 4 >> 2] = l;
        e = k;
        c[e >> 2] = 0;
        c[e + 4 >> 2] = 0;
        e = c[f >> 2] | 0
      }
      $[c[c[e >> 2] >> 2] & 63](e, b) | 0;
      l = k;
      l = lr(c[l >> 2] | 0, c[l + 4 >> 2] | 0, 1, 0) | 0;
      n = u() | 0;
      o = k;
      c[o >> 2] = l;
      c[o + 4 >> 2] = n;
      V = m;
      return
    }

    function ed(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0;
      h = V;
      V = V + 64 | 0;
      e = h + 56 | 0;
      f = h;
      g = ld(d) | 0;
      if ((g | 0) == -1) {
        h = v(8) | 0;
        md(h);
        x(h | 0, 2784, 8)
      }
      d = nd(d) | 0;
      a: do
          if (!d) switch (g | 0) {
          case 0: {
            g = eq(4788) | 0;
            xd(g);
            wd(a, b, g);
            break a
          }
          case 1: {
            g = eq(5116) | 0;
            zd(g);
            yd(a, b, g);
            break a
          }
          case 2: {
            g = eq(5104) | 0;
            Bd(g);
            Ad(a, b, g);
            break a
          }
          case 3: {
            g = eq(5432) | 0;
            Dd(g);
            Cd(a, b, g);
            break a
          }
          default: {
            c[a >> 2] = 0;
            c[a + 4 >> 2] = 0;
            break a
          }
          } else {
            od(e, b);
            pd(c[e >> 2] | 0);
            if ((g | 2 | 0) == 3) qd(c[e >> 2] | 0);
            if ((g | 1 | 0) == 3) rd(c[e >> 2] | 0);
            g = c[e >> 2] | 0;
            td(f, d);
            sd(g, f);
            ud(f);
            c[a >> 2] = c[e >> 2];
            g = e + 4 | 0;
            c[a + 4 >> 2] = c[g >> 2];
            c[e >> 2] = 0;
            c[g >> 2] = 0;
            vd(e)
          }
        while (0);
        V = h;
      return
    }

    function fd(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 4576;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      gd(a, e);
      V = d;
      return
    }

    function gd(a, b) {
      a = a | 0;
      b = b | 0;
      return
    }

    function hd(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function id(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) {
        rc(a);
        jp(a)
      }
      return
    }

    function jd(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 7983 ? a + 12 | 0 : 0) | 0
    }

    function kd(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function ld(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = (c[a + 4 >> 2] | 0) - (c[a >> 2] | 0) | 0;
      a: do
        if (((b | 0) != 0 ? (d = ((b | 0) / 12 | 0) + (((nd(a) | 0) != 0) << 31 >> 31) | 0, (d | 0) != 0) : 0) ? (b = c[a >> 2] | 0, !(Ed(b, Fd() | 0) | 0)) : 0) {
          switch (d | 0) {
          case 1: {
            a = 0;
            break a
          }
          case 2: {
            if (Gd((c[a >> 2] | 0) + 12 | 0, Hd() | 0) | 0) {
              a = 1;
              break a
            }
            if (Gd((c[a >> 2] | 0) + 12 | 0, Id() | 0) | 0) {
              a = 2;
              break a
            }
            break
          }
          case 3: {
            if (Gd((c[a >> 2] | 0) + 12 | 0, Hd() | 0) | 0 ? (d = (c[a >> 2] | 0) + 24 | 0, Gd(d, Id() | 0) | 0) : 0) {
              a = 3;
              break a
            }
            break
          }
          default: {}
          }
          a = -1
        } else a = -1; while (0);
      return a | 0
    }

    function md(a) {
      a = a | 0;
      xq(a, 8131);
      c[a >> 2] = 4604;
      return
    }

    function nd(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = c[a + 4 >> 2] | 0;
      if (((b | 0) != (c[a >> 2] | 0) ? (d = b, (c[d + -12 >> 2] | 0) == 0) : 0) ? (c[d + -4 >> 2] | 0) == 2 : 0) a = c[d + -8 >> 2] | 0;
      else a = 0;
      return a | 0
    }

    function od(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0;
      d = V;
      V = V + 16 | 0;
      e = d + 4 | 0;
      g = d;
      f = eq(24) | 0;
      Kd(f, b);
      c[g >> 2] = 0;
      c[e >> 2] = c[g >> 2];
      Ld(a, f, e);
      V = d;
      return
    }

    function pd(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      j = V;
      V = V + 32 | 0;
      e = j + 12 | 0;
      f = j;
      b = j + 8 | 0;
      h = eq(4792) | 0;
      Zd(h, c[a + 4 >> 2] | 0);
      g = a + 8 | 0;
      c[b >> 2] = 0;
      c[e >> 2] = c[b >> 2];
      _d(f, h, e);
      h = a + 12 | 0;
      b = c[h >> 2] | 0;
      i = a + 16 | 0;
      do
        if (b >>> 0 >= (c[i >> 2] | 0) >>> 0) {
          b = (b - (c[g >> 2] | 0) >> 3) + 1 | 0;
          d = ee(g) | 0;
          if (d >>> 0 < b >>> 0) cr(g);
          else {
            k = c[g >> 2] | 0;
            l = (c[i >> 2] | 0) - k | 0;
            i = l >> 2;
            be(e, l >> 3 >>> 0 < d >>> 1 >>> 0 ? (i >>> 0 < b >>> 0 ? b : i) : d, (c[h >> 2] | 0) - k >> 3, a + 16 | 0);
            i = e + 8 | 0;
            h = c[i >> 2] | 0;
            c[h >> 2] = c[f >> 2];
            a = f + 4 | 0;
            c[h + 4 >> 2] = c[a >> 2];
            c[f >> 2] = 0;
            c[a >> 2] = 0;
            c[i >> 2] = h + 8;
            ce(g, e);
            de(e);
            break
          }
        } else {
          $d(e, g, 1);
          l = e + 4 | 0;
          k = c[l >> 2] | 0;
          c[k >> 2] = c[f >> 2];
          i = f + 4 | 0;
          c[k + 4 >> 2] = c[i >> 2];
          c[f >> 2] = 0;
          c[i >> 2] = 0;
          c[l >> 2] = k + 8;
          ae(e)
        } while (0);
      Sd(f);
      V = j;
      return
    }

    function qd(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      j = V;
      V = V + 32 | 0;
      e = j + 12 | 0;
      f = j;
      b = j + 8 | 0;
      h = eq(336) | 0;
      af(h, c[a + 4 >> 2] | 0);
      g = a + 8 | 0;
      c[b >> 2] = 0;
      c[e >> 2] = c[b >> 2];
      bf(f, h, e);
      h = a + 12 | 0;
      b = c[h >> 2] | 0;
      i = a + 16 | 0;
      do
        if (b >>> 0 >= (c[i >> 2] | 0) >>> 0) {
          b = (b - (c[g >> 2] | 0) >> 3) + 1 | 0;
          d = ee(g) | 0;
          if (d >>> 0 < b >>> 0) cr(g);
          else {
            k = c[g >> 2] | 0;
            l = (c[i >> 2] | 0) - k | 0;
            i = l >> 2;
            be(e, l >> 3 >>> 0 < d >>> 1 >>> 0 ? (i >>> 0 < b >>> 0 ? b : i) : d, (c[h >> 2] | 0) - k >> 3, a + 16 | 0);
            i = e + 8 | 0;
            h = c[i >> 2] | 0;
            c[h >> 2] = c[f >> 2];
            a = f + 4 | 0;
            c[h + 4 >> 2] = c[a >> 2];
            c[f >> 2] = 0;
            c[a >> 2] = 0;
            c[i >> 2] = h + 8;
            ce(g, e);
            de(e);
            break
          }
        } else {
          $d(e, g, 1);
          l = e + 4 | 0;
          k = c[l >> 2] | 0;
          c[k >> 2] = c[f >> 2];
          i = f + 4 | 0;
          c[k + 4 >> 2] = c[i >> 2];
          c[f >> 2] = 0;
          c[i >> 2] = 0;
          c[l >> 2] = k + 8;
          ae(e)
        } while (0);
      Sd(f);
      V = j;
      return
    }

    function rd(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      j = V;
      V = V + 32 | 0;
      e = j + 12 | 0;
      f = j;
      b = j + 8 | 0;
      h = eq(324) | 0;
      Af(h, c[a + 4 >> 2] | 0);
      g = a + 8 | 0;
      c[b >> 2] = 0;
      c[e >> 2] = c[b >> 2];
      Bf(f, h, e);
      h = a + 12 | 0;
      b = c[h >> 2] | 0;
      i = a + 16 | 0;
      do
        if (b >>> 0 >= (c[i >> 2] | 0) >>> 0) {
          b = (b - (c[g >> 2] | 0) >> 3) + 1 | 0;
          d = ee(g) | 0;
          if (d >>> 0 < b >>> 0) cr(g);
          else {
            k = c[g >> 2] | 0;
            l = (c[i >> 2] | 0) - k | 0;
            i = l >> 2;
            be(e, l >> 3 >>> 0 < d >>> 1 >>> 0 ? (i >>> 0 < b >>> 0 ? b : i) : d, (c[h >> 2] | 0) - k >> 3, a + 16 | 0);
            i = e + 8 | 0;
            h = c[i >> 2] | 0;
            c[h >> 2] = c[f >> 2];
            a = f + 4 | 0;
            c[h + 4 >> 2] = c[a >> 2];
            c[f >> 2] = 0;
            c[a >> 2] = 0;
            c[i >> 2] = h + 8;
            ce(g, e);
            de(e);
            break
          }
        } else {
          $d(e, g, 1);
          l = e + 4 | 0;
          k = c[l >> 2] | 0;
          c[k >> 2] = c[f >> 2];
          i = f + 4 | 0;
          c[k + 4 >> 2] = c[i >> 2];
          c[f >> 2] = 0;
          c[i >> 2] = 0;
          c[l >> 2] = k + 8;
          ae(e)
        } while (0);
      Sd(f);
      V = j;
      return
    }

    function sd(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      j = V;
      V = V + 32 | 0;
      h = j + 12 | 0;
      i = j;
      e = j + 8 | 0;
      g = eq(64) | 0;
      Qf(g, c[a + 4 >> 2] | 0, b);
      f = a + 8 | 0;
      c[e >> 2] = 0;
      c[h >> 2] = c[e >> 2];
      Rf(i, g, h);
      g = a + 12 | 0;
      b = c[g >> 2] | 0;
      e = a + 16 | 0;
      do
        if (b >>> 0 >= (c[e >> 2] | 0) >>> 0) {
          b = (b - (c[f >> 2] | 0) >> 3) + 1 | 0;
          d = ee(f) | 0;
          if (d >>> 0 < b >>> 0) cr(f);
          else {
            k = c[f >> 2] | 0;
            l = (c[e >> 2] | 0) - k | 0;
            e = l >> 2;
            be(h, l >> 3 >>> 0 < d >>> 1 >>> 0 ? (e >>> 0 < b >>> 0 ? b : e) : d, (c[g >> 2] | 0) - k >> 3, a + 16 | 0);
            a = h + 8 | 0;
            g = c[a >> 2] | 0;
            c[g >> 2] = c[i >> 2];
            e = i + 4 | 0;
            c[g + 4 >> 2] = c[e >> 2];
            c[i >> 2] = 0;
            c[e >> 2] = 0;
            c[a >> 2] = g + 8;
            ce(f, h);
            de(h);
            break
          }
        } else {
          $d(h, f, 1);
          l = h + 4 | 0;
          k = c[l >> 2] | 0;
          c[k >> 2] = c[i >> 2];
          a = i + 4 | 0;
          c[k + 4 >> 2] = c[a >> 2];
          c[i >> 2] = 0;
          c[a >> 2] = 0;
          c[l >> 2] = k + 8;
          ae(h)
        } while (0);
      Sd(i);
      V = j;
      return
    }

    function td(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      e = V;
      V = V + 48 | 0;
      f = e;
      c[b >> 2] = d;
      a[b + 4 >> 0] = 0;
      Jg(b + 8 | 0, d);
      Jg(b + 20 | 0, d);
      Oc(f, 256, 0, 0);
      Kg(b + 32 | 0, d, f);
      Ic(f);
      V = e;
      return
    }

    function ud(a) {
      a = a | 0;
      Ng(a + 32 | 0);
      _f(a + 20 | 0);
      _f(a + 8 | 0);
      return
    }

    function vd(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      a = c[a + 4 >> 2] | 0;
      if (a | 0 ? (d = a + 4 | 0, b = c[d >> 2] | 0, c[d >> 2] = b + -1, (b | 0) == 0) : 0) {
        ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
        qq(a)
      }
      return
    }

    function wd(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0;
      e = V;
      V = V + 16 | 0;
      f = e + 4 | 0;
      h = e;
      g = eq(12) | 0;
      Og(g, b, d);
      c[h >> 2] = 0;
      c[f >> 2] = c[h >> 2];
      Pg(a, g, f);
      V = e;
      return
    }

    function xd(a) {
      a = a | 0;
      ge(a);
      $g(a + 4784 | 0);
      return
    }

    function yd(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0;
      e = V;
      V = V + 16 | 0;
      f = e + 4 | 0;
      h = e;
      g = eq(12) | 0;
      ah(g, b, d);
      c[h >> 2] = 0;
      c[f >> 2] = c[h >> 2];
      bh(a, g, f);
      V = e;
      return
    }

    function zd(a) {
      a = a | 0;
      ge(a);
      nh(a + 4784 | 0);
      return
    }

    function Ad(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0;
      e = V;
      V = V + 16 | 0;
      f = e + 4 | 0;
      h = e;
      g = eq(12) | 0;
      oh(g, b, d);
      c[h >> 2] = 0;
      c[f >> 2] = c[h >> 2];
      ph(a, g, f);
      V = e;
      return
    }

    function Bd(a) {
      a = a | 0;
      ge(a);
      Bh(a + 4784 | 0);
      return
    }

    function Cd(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0;
      e = V;
      V = V + 16 | 0;
      f = e + 4 | 0;
      h = e;
      g = eq(12) | 0;
      Ch(g, b, d);
      c[h >> 2] = 0;
      c[f >> 2] = c[h >> 2];
      Dh(a, g, f);
      V = e;
      return
    }

    function Dd(a) {
      a = a | 0;
      ge(a);
      Ph(a + 4784 | 0);
      return
    }

    function Ed(a, b) {
      a = a | 0;
      b = b | 0;
      return (Gd(a, b) | 0) ^ 1 | 0
    }

    function Fd() {
      if ((a[21456] | 0) == 0 ? Tp(21456) | 0 : 0) {
        _b(21536, 6, 20, 2);
        $p(21456)
      }
      return 21536
    }

    function Gd(a, b) {
      a = a | 0;
      b = b | 0;
      if ((c[a >> 2] | 0) == (c[b >> 2] | 0) ? (c[a + 8 >> 2] | 0) == (c[b + 8 >> 2] | 0) : 0) a = (c[a + 4 >> 2] | 0) == (c[b + 4 >> 2] | 0);
      else a = 0;
      return a | 0
    }

    function Hd() {
      if ((a[21464] | 0) == 0 ? Tp(21464) | 0 : 0) {
        _b(21548, 7, 8, 2);
        $p(21464)
      }
      return 21548
    }

    function Id() {
      if ((a[21472] | 0) == 0 ? Tp(21472) | 0 : 0) {
        _b(21560, 8, 6, 2);
        $p(21472)
      }
      return 21560
    }

    function Jd(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function Kd(b, d) {
      b = b | 0;
      d = d | 0;
      Md(b);
      c[b >> 2] = 4624;
      c[b + 4 >> 2] = d;
      c[b + 8 >> 2] = 0;
      c[b + 12 >> 2] = 0;
      c[b + 16 >> 2] = 0;
      a[b + 20 >> 0] = 1;
      return
    }

    function Ld(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 4664;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Ud(a, e);
      V = d;
      return
    }

    function Md(a) {
      a = a | 0;
      c[a >> 2] = 4644;
      return
    }

    function Nd(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      k = V;
      V = V + 16 | 0;
      h = k;
      e = c[b + 8 >> 2] | 0;
      i = c[b + 12 >> 2] | 0;
      if ((e | 0) != (i | 0)) {
        j = h + 4 | 0;
        do {
          f = c[e >> 2] | 0;
          c[h >> 2] = f;
          g = c[e + 4 >> 2] | 0;
          c[j >> 2] = g;
          if (g | 0) {
            g = g + 4 | 0;
            c[g >> 2] = (c[g >> 2] | 0) + 1
          }
          d = $[c[(c[f >> 2] | 0) + 12 >> 2] & 63](f, d) | 0;
          Sd(h);
          e = e + 8 | 0
        } while ((e | 0) != (i | 0))
      }
      e = b + 20 | 0;
      if (a[e >> 0] | 0) {
        a[e >> 0] = 0;
        nc(c[b + 4 >> 2] | 0)
      }
      V = k;
      return d | 0
    }

    function Od(a) {
      a = a | 0;
      c[a >> 2] = 4624;
      Td(a + 8 | 0);
      Qd(a);
      return
    }

    function Pd(a) {
      a = a | 0;
      Od(a);
      jp(a);
      return
    }

    function Qd(a) {
      a = a | 0;
      return
    }

    function Rd(a) {
      a = a | 0;
      U()
    }

    function Sd(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      a = c[a + 4 >> 2] | 0;
      if (a | 0 ? (d = a + 4 | 0, b = c[d >> 2] | 0, c[d >> 2] = b + -1, (b | 0) == 0) : 0) {
        ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
        qq(a)
      }
      return
    }

    function Td(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      d = c[a >> 2] | 0;
      if (d | 0) {
        e = a + 4 | 0;
        b = c[e >> 2] | 0;
        if ((b | 0) == (d | 0)) b = d;
        else {
          do {
            b = b + -8 | 0;
            Sd(b)
          } while ((b | 0) != (d | 0));
          b = c[a >> 2] | 0
        }
        c[e >> 2] = d;
        Da(b, (c[a + 8 >> 2] | 0) - b | 0)
      }
      return
    }

    function Ud(a, b) {
      a = a | 0;
      b = b | 0;
      return
    }

    function Vd(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Wd(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
      return
    }

    function Xd(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 8546 ? a + 12 | 0 : 0) | 0
    }

    function Yd(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Zd(a, b) {
      a = a | 0;
      b = b | 0;
      fe(a);
      c[a >> 2] = 4692;
      c[a + 4 >> 2] = b;
      ge(a + 8 | 0);
      return
    }

    function _d(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 4740;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xe(a, e);
      V = d;
      return
    }

    function $d(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = b;
      b = c[b + 4 >> 2] | 0;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = b + (d << 3);
      return
    }

    function ae(a) {
      a = a | 0;
      c[(c[a >> 2] | 0) + 4 >> 2] = c[a + 4 >> 2];
      return
    }

    function be(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0;
      f = a + 12 | 0;
      c[f >> 2] = 0;
      c[a + 16 >> 2] = e;
      do
        if (b)
          if (b >>> 0 > 536870911) {
            f = v(8) | 0;
            vq(f, 6723);
            c[f >> 2] = 5956;
            x(f | 0, 3928, 123)
          } else {
            e = eq(b << 3) | 0;
            break
          }
      else e = 0; while (0);
      c[a >> 2] = e;
      d = e + (d << 3) | 0;
      c[a + 8 >> 2] = d;
      c[a + 4 >> 2] = d;
      c[f >> 2] = e + (b << 3);
      return
    }

    function ce(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;
      i = c[a >> 2] | 0;
      j = a + 4 | 0;
      d = c[j >> 2] | 0;
      h = b + 4 | 0;
      if ((d | 0) == (i | 0)) {
        f = h;
        g = a;
        e = c[h >> 2] | 0;
        d = i
      } else {
        e = c[h >> 2] | 0;
        do {
          g = d;
          d = d + -8 | 0;
          c[e + -8 >> 2] = c[d >> 2];
          g = g + -4 | 0;
          c[e + -4 >> 2] = c[g >> 2];
          c[d >> 2] = 0;
          c[g >> 2] = 0;
          e = (c[h >> 2] | 0) + -8 | 0;
          c[h >> 2] = e
        } while ((d | 0) != (i | 0));
        f = h;
        g = a;
        d = c[a >> 2] | 0
      }
      c[g >> 2] = e;
      c[f >> 2] = d;
      i = b + 8 | 0;
      h = c[j >> 2] | 0;
      c[j >> 2] = c[i >> 2];
      c[i >> 2] = h;
      i = a + 8 | 0;
      j = b + 12 | 0;
      a = c[i >> 2] | 0;
      c[i >> 2] = c[j >> 2];
      c[j >> 2] = a;
      c[b >> 2] = c[f >> 2];
      return
    }

    function de(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      d = c[a + 4 >> 2] | 0;
      e = a + 8 | 0;
      b = c[e >> 2] | 0;
      if ((b | 0) != (d | 0))
        do {
          f = b + -8 | 0;
          c[e >> 2] = f;
          Sd(f);
          b = c[e >> 2] | 0
        } while ((b | 0) != (d | 0));
      b = c[a >> 2] | 0;
      if (b | 0) Da(b, (c[a + 12 >> 2] | 0) - b | 0);
      return
    }

    function ee(a) {
      a = a | 0;
      return 536870911
    }

    function fe(a) {
      a = a | 0;
      c[a >> 2] = 4716;
      return
    }

    function ge(b) {
      b = b | 0;
      oe(b);
      pe(b + 3980 | 0);
      qe(b + 4380 | 0);
      a[b + 4780 >> 0] = 0;
      a[b + 4781 >> 0] = 0;
      return
    }

    function he(a) {
      a = a | 0;
      c[a >> 2] = 4692;
      ze(a + 8 | 0);
      le(a);
      return
    }

    function ie(a) {
      a = a | 0;
      he(a);
      jp(a);
      return
    }

    function je(a, b) {
      a = a | 0;
      b = b | 0;
      return b | 0
    }

    function ke(a, b) {
      a = a | 0;
      b = b | 0;
      return Be(a + 8 | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function le(a) {
      a = a | 0;
      return
    }

    function me(a) {
      a = a | 0;
      le(a);
      jp(a);
      return
    }

    function ne(a, b) {
      a = a | 0;
      b = b | 0;
      return b | 0
    }

    function oe(d) {
      d = d | 0;
      var e = 0,
        f = 0;
      te(d);
      ue(d + 52 | 0);
      ue(d + 436 | 0);
      Oc(d + 852 | 0, 64, 0, 0);
      a[d + 3976 >> 0] = 0;
      e = d + 20 | 0;
      f = e + 32 | 0;
      do {
        b[e >> 1] = 0;
        e = e + 2 | 0
      } while ((e | 0) < (f | 0));
      e = eq(44) | 0;
      Oc(e, 256, 0, 0);
      c[d + 896 >> 2] = e;
      e = eq(44) | 0;
      Oc(e, 256, 0, 0);
      c[d + 900 >> 2] = e;
      e = d + 820 | 0;
      c[e >> 2] = 0;
      c[e + 4 >> 2] = 0;
      c[e + 8 >> 2] = 0;
      c[e + 12 >> 2] = 0;
      c[e + 16 >> 2] = 0;
      c[e + 20 >> 2] = 0;
      c[e + 24 >> 2] = 0;
      c[e + 28 >> 2] = 0;
      e = 0;
      do {
        f = eq(44) | 0;
        Oc(f, 256, 0, 0);
        c[d + 904 + (e << 2) >> 2] = f;
        f = eq(44) | 0;
        Oc(f, 256, 0, 0);
        c[d + 1928 + (e << 2) >> 2] = f;
        f = eq(44) | 0;
        Oc(f, 256, 0, 0);
        c[d + 2952 + (e << 2) >> 2] = f;
        e = e + 1 | 0
      } while (e >>> 0 < 256);
      return
    }

    function pe(a) {
      a = a | 0;
      xe(a, 16, 4, 8, 0);
      xe(a + 80 | 0, 16, 1, 8, 0);
      xe(a + 160 | 0, 32, 2, 8, 0);
      xe(a + 240 | 0, 32, 22, 8, 0);
      xe(a + 320 | 0, 32, 20, 8, 0);
      return
    }

    function qe(a) {
      a = a | 0;
      mc(a, 16, 4, 8, 0);
      mc(a + 80 | 0, 16, 1, 8, 0);
      mc(a + 160 | 0, 32, 2, 8, 0);
      mc(a + 240 | 0, 32, 22, 8, 0);
      mc(a + 320 | 0, 32, 20, 8, 0);
      return
    }

    function re(a) {
      a = a | 0;
      ye(a + 320 | 0);
      ye(a + 240 | 0);
      ye(a + 160 | 0);
      ye(a + 80 | 0);
      ye(a);
      return
    }

    function se(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = c[a + 896 >> 2] | 0;
      if (b | 0) {
        Ic(b);
        jp(b)
      }
      b = c[a + 900 >> 2] | 0;
      if (b | 0) {
        Ic(b);
        jp(b)
      }
      d = 0;
      do {
        b = c[a + 904 + (d << 2) >> 2] | 0;
        if (b | 0) {
          Ic(b);
          jp(b)
        }
        b = c[a + 1928 + (d << 2) >> 2] | 0;
        if (b | 0) {
          Ic(b);
          jp(b)
        }
        b = c[a + 2952 + (d << 2) >> 2] | 0;
        if (b | 0) {
          Ic(b);
          jp(b)
        }
        d = d + 1 | 0
      } while ((d | 0) != 256);
      Ic(a + 852 | 0);
      return
    }

    function te(b) {
      b = b | 0;
      var c = 0;
      a[b >> 0] = 0;
      a[b + 1 >> 0] = 0;
      a[b + 2 >> 0] = 0;
      a[b + 3 >> 0] = 0;
      c = b + 4 | 0;
      a[c >> 0] = 0;
      a[c + 1 >> 0] = 0;
      a[c + 2 >> 0] = 0;
      a[c + 3 >> 0] = 0;
      b = b + 12 | 0;
      c = b;
      a[c >> 0] = 0;
      a[c + 1 >> 0] = 0;
      a[c + 2 >> 0] = 0;
      a[c + 3 >> 0] = 0;
      b = b + 4 | 0;
      a[b >> 0] = 0;
      a[b + 1 >> 0] = 0;
      a[b + 2 >> 0] = 0;
      a[b + 3 >> 0] = 0;
      return
    }

    function ue(a) {
      a = a | 0;
      var b = 0;
      b = a + 384 | 0;
      do {
        ve(a);
        a = a + 24 | 0
      } while ((a | 0) != (b | 0));
      return
    }

    function ve(a) {
      a = a | 0;
      we(a);
      return
    }

    function we(b) {
      b = b | 0;
      c[b >> 2] = 0;
      c[b + 4 >> 2] = 0;
      c[b + 8 >> 2] = 0;
      c[b + 12 >> 2] = 0;
      c[b + 16 >> 2] = 0;
      a[b + 20 >> 0] = 1;
      return
    }

    function xe(a, b, d, e, f) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = d;
      c[a + 12 >> 2] = e;
      c[a + 16 >> 2] = f;
      c[a + 36 >> 2] = 0;
      c[a + 40 >> 2] = 0;
      c[a + 44 >> 2] = 0;
      Gc(a + 48 | 0);
      c[a + 68 >> 2] = 0;
      c[a + 72 >> 2] = 0;
      c[a + 76 >> 2] = 0;
      do
        if (!f) {
          d = a + 20 | 0;
          if ((b + -1 | 0) >>> 0 < 31) {
            c[d >> 2] = b;
            f = 1 << b;
            c[a + 24 >> 2] = f;
            d = f >>> 1;
            c[a + 28 >> 2] = 0 - d;
            d = f + -1 - d | 0;
            break
          } else {
            c[d >> 2] = 32;
            c[a + 24 >> 2] = 0;
            c[a + 28 >> 2] = -2147483648;
            d = 2147483647;
            break
          }
        } else {
          e = a + 20 | 0;
          c[e >> 2] = 0;
          c[a + 24 >> 2] = f;
          d = f;
          g = 0;
          while (1) {
            d = d >>> 1;
            b = g + 1 | 0;
            if (!d) break;
            else g = b
          }
          c[e >> 2] = (1 << g | 0) == (f | 0) ? g : b;
          d = f >>> 1;
          c[a + 28 >> 2] = 0 - d;
          d = f + -1 - d | 0
        } while (0);
      c[a + 32 >> 2] = d;
      c[a >> 2] = 0;
      return
    }

    function ye(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0;
      g = a + 36 | 0;
      d = c[g >> 2] | 0;
      e = a + 40 | 0;
      b = c[e >> 2] | 0;
      if ((b | 0) != (d | 0))
        do {
          b = b + -44 | 0;
          Ic(b)
        } while ((b | 0) != (d | 0));
      c[e >> 2] = d;
      e = a + 68 | 0;
      f = c[e >> 2] | 0;
      d = a + 72 | 0;
      b = c[d >> 2] | 0;
      if ((b | 0) != (f | 0))
        do {
          b = b + -44 | 0;
          Ic(b)
        } while ((b | 0) != (f | 0));
      c[d >> 2] = f;
      Hc(e);
      Hc(g);
      return
    }

    function ze(a) {
      a = a | 0;
      Ae(a + 4380 | 0);
      re(a + 3980 | 0);
      se(a);
      return
    }

    function Ae(a) {
      a = a | 0;
      qc(a + 320 | 0);
      qc(a + 240 | 0);
      qc(a + 160 | 0);
      qc(a + 80 | 0);
      qc(a);
      return
    }

    function Be(f, g, h) {
      f = f | 0;
      g = g | 0;
      h = h | 0;
      var i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0;
      p = V;
      V = V + 32 | 0;
      o = p;
      i = f + 4781 | 0;
      if (!(a[i >> 0] | 0)) {
        Ce(f + 4380 | 0);
        a[i >> 0] = 1
      }
      i = f + 3976 | 0;
      if (!(a[i >> 0] | 0)) {
        a[i >> 0] = 1;
        Ee(De(g) | 0, h, 20);
        Fe(o, h);
        k = f;
        i = o;
        j = k + 20 | 0;
        do {
          a[k >> 0] = a[i >> 0] | 0;
          k = k + 1 | 0;
          i = i + 1 | 0
        } while ((k | 0) < (j | 0));
        b[f + 12 >> 1] = 0
      } else {
        m = Zc(g, f + 852 | 0) | 0;
        if (m) {
          if (m & 32 | 0) He((Zc(g, c[f + 904 + (((Ge(f) | 0) & 255) << 2) >> 2] | 0) | 0) & 255, f);
          n = f + 14 | 0;
          k = a[n >> 0] | 0;
          i = k & 7;
          k = (k & 255) >>> 3 & 7;
          j = d[16 + (k << 3) + i >> 0] | 0;
          i = d[80 + (k << 3) + i >> 0] | 0;
          if (!(m & 16)) l = b[f + 20 + (j << 1) >> 1] | 0;
          else {
            q = f + 20 + (j << 1) | 0;
            l = (pc(f + 4380 | 0, g, e[q >> 1] | 0, j >>> 0 < 3 ? j : 3) | 0) & 65535;
            b[q >> 1] = l
          }
          b[f + 12 >> 1] = l;
          if (m & 8 | 0) {
            q = f + 15 | 0;
            a[q >> 0] = Zc(g, c[f + 1928 + (d[q >> 0] << 2) >> 2] | 0) | 0
          }
          if (m & 4 | 0) {
            n = Zc(g, c[f + 896 + (((d[n >> 0] | 0) >>> 6 & 1) << 2) >> 2] | 0) | 0;
            q = f + 16 | 0;
            a[q >> 0] = Ie(n + (a[q >> 0] | 0) | 0) | 0
          }
          if (m & 2 | 0) {
            q = f + 17 | 0;
            a[q >> 0] = Zc(g, c[f + 2952 + (d[q >> 0] << 2) >> 2] | 0) | 0
          }
          if (m & 1) {
            q = f + 18 | 0;
            b[q >> 1] = pc(f + 4460 | 0, g, e[q >> 1] | 0, 0) | 0
          }
        } else {
          q = a[f + 14 >> 0] | 0;
          i = q & 7;
          q = (q & 255) >>> 3 & 7;
          k = q;
          j = d[16 + (q << 3) + i >> 0] | 0;
          i = d[80 + (q << 3) + i >> 0] | 0
        }
        l = f + 52 + (j * 24 | 0) | 0;
        m = f + 4540 | 0;
        n = (k | 0) == 1 & 1;
        k = pc(m, g, Je(l) | 0, n) | 0;
        c[o >> 2] = k;
        c[f >> 2] = (c[f >> 2] | 0) + k;
        Ke(l, o);
        l = f + 436 + (j * 24 | 0) | 0;
        k = Je(l) | 0;
        j = Le(m) | 0;
        q = f + 4620 | 0;
        j = pc(q, g, k, (j >>> 0 < 20 ? j & -2 : 20) | n) | 0;
        c[o >> 2] = j;
        k = f + 4 | 0;
        c[k >> 2] = (c[k >> 2] | 0) + j;
        Ke(l, o);
        o = Le(m) | 0;
        o = (Le(q) | 0) + o | 0;
        q = f + 820 + (i << 2) | 0;
        o = pc(f + 4700 | 0, g, c[q >> 2] | 0, (o >>> 0 < 36 ? o >>> 1 & 2147483646 : 18) | n) | 0;
        c[f + 8 >> 2] = o;
        c[q >> 2] = o;
        Me(f, h)
      }
      V = p;
      return h + 20 | 0
    }

    function Ce(a) {
      a = a | 0;
      oc(a);
      oc(a + 80 | 0);
      oc(a + 160 | 0);
      oc(a + 240 | 0);
      oc(a + 320 | 0);
      return
    }

    function De(a) {
      a = a | 0;
      return c[a >> 2] | 0
    }

    function Ee(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      k = b + 4 | 0;
      f = c[k >> 2] | 0;
      j = (c[b + 8 >> 2] | 0) - f | 0;
      j = j >>> 0 > e >>> 0 ? e : j;
      i = b + 12 | 0;
      g = (c[i >> 2] | 0) + f | 0;
      h = g + j | 0;
      if (j) {
        f = g;
        g = d;
        while (1) {
          a[g >> 0] = a[f >> 0] | 0;
          f = f + 1 | 0;
          if ((f | 0) == (h | 0)) break;
          else g = g + 1 | 0
        }
        f = c[k >> 2] | 0
      }
      c[k >> 2] = f + j;
      e = e - j | 0;
      if (e | 0) {
        Kc(b);
        g = (c[i >> 2] | 0) + (c[k >> 2] | 0) | 0;
        h = g + e | 0;
        f = d + j | 0;
        while (1) {
          a[f >> 0] = a[g >> 0] | 0;
          g = g + 1 | 0;
          if ((g | 0) == (h | 0)) break;
          else f = f + 1 | 0
        }
        c[k >> 2] = (c[k >> 2] | 0) + e
      }
      return
    }

    function Fe(d, e) {
      d = d | 0;
      e = e | 0;
      te(d);
      c[d >> 2] = Ne(e) | 0;
      c[d + 4 >> 2] = Ne(e + 4 | 0) | 0;
      c[d + 8 >> 2] = Ne(e + 8 | 0) | 0;
      b[d + 12 >> 1] = Oe(e + 12 | 0) | 0;
      He(Pe(e + 14 | 0) | 0, d);
      a[d + 15 >> 0] = Pe(e + 15 | 0) | 0;
      a[d + 16 >> 0] = Qe(e + 16 | 0) | 0;
      a[d + 17 >> 0] = Qe(e + 17 | 0) | 0;
      b[d + 18 >> 1] = Oe(e + 18 | 0) | 0;
      return
    }

    function Ge(b) {
      b = b | 0;
      return a[b + 14 >> 0] | 0
    }

    function He(b, c) {
      b = b | 0;
      c = c | 0;
      a[c + 14 >> 0] = b;
      return
    }

    function Ie(a) {
      a = a | 0;
      return a & 255 | 0
    }

    function Je(a) {
      a = a | 0;
      return c[a + 8 >> 2] | 0
    }

    function Ke(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      k = b + 20 | 0;
      do
        if (!(a[k >> 0] | 0)) {
          j = b + 8 | 0;
          e = c[j >> 2] | 0;
          f = c[d >> 2] | 0;
          g = b + 4 | 0;
          h = c[g >> 2] | 0;
          if ((e | 0) >= (f | 0)) {
            if ((h | 0) < (f | 0)) {
              c[b >> 2] = h;
              c[g >> 2] = c[d >> 2]
            } else c[b >> 2] = f;
            a[k >> 0] = 1;
            break
          }
          c[b >> 2] = h;
          c[g >> 2] = e;
          g = b + 16 | 0;
          h = c[g >> 2] | 0;
          i = c[d >> 2] | 0;
          e = b + 12 | 0;
          f = c[e >> 2] | 0;
          if ((h | 0) < (i | 0)) {
            c[j >> 2] = f;
            c[e >> 2] = h;
            c[g >> 2] = c[d >> 2];
            break
          }
          if ((f | 0) < (i | 0)) {
            c[j >> 2] = f;
            c[e >> 2] = c[d >> 2];
            break
          } else {
            c[j >> 2] = i;
            break
          }
        } else {
          g = c[d >> 2] | 0;
          i = b + 8 | 0;
          e = c[i >> 2] | 0;
          h = b + 12 | 0;
          f = c[h >> 2] | 0;
          if ((g | 0) >= (e | 0)) {
            e = b + 16 | 0;
            if ((g | 0) < (f | 0)) {
              c[e >> 2] = f;
              c[h >> 2] = c[d >> 2]
            } else c[e >> 2] = g;
            a[k >> 0] = 0;
            break
          }
          c[b + 16 >> 2] = f;
          c[h >> 2] = e;
          e = c[d >> 2] | 0;
          f = c[b >> 2] | 0;
          g = b + 4 | 0;
          h = c[g >> 2] | 0;
          if ((e | 0) < (f | 0)) {
            c[i >> 2] = h;
            c[g >> 2] = f;
            c[b >> 2] = c[d >> 2];
            break
          }
          if ((e | 0) < (h | 0)) {
            c[i >> 2] = h;
            c[g >> 2] = c[d >> 2];
            break
          } else {
            c[i >> 2] = e;
            break
          }
        } while (0);
      return
    }

    function Le(a) {
      a = a | 0;
      return c[a >> 2] | 0
    }

    function Me(b, c) {
      b = b | 0;
      c = c | 0;
      var e = 0;
      Se(d[b >> 0] | d[b + 1 >> 0] << 8 | d[b + 2 >> 0] << 16 | d[b + 3 >> 0] << 24, c);
      e = b + 4 | 0;
      Se(d[e >> 0] | d[e + 1 >> 0] << 8 | d[e + 2 >> 0] << 16 | d[e + 3 >> 0] << 24, c + 4 | 0);
      e = b + 8 | 0;
      Se(d[e >> 0] | d[e + 1 >> 0] << 8 | d[e + 2 >> 0] << 16 | d[e + 3 >> 0] << 24, c + 8 | 0);
      e = b + 12 | 0;
      Te(d[e >> 0] | d[e + 1 >> 0] << 8, c + 12 | 0);
      Ue(Ge(b) | 0, c + 14 | 0);
      Ue(a[b + 15 >> 0] | 0, c + 15 | 0);
      Ve(a[b + 16 >> 0] | 0, c + 16 | 0);
      Ve(a[b + 17 >> 0] | 0, c + 17 | 0);
      b = b + 18 | 0;
      Te(d[b >> 0] | d[b + 1 >> 0] << 8, c + 18 | 0);
      return
    }

    function Ne(a) {
      a = a | 0;
      return Re(a) | 0
    }

    function Oe(b) {
      b = b | 0;
      return (a[b + 1 >> 0] << 8 | d[b >> 0]) & 65535 | 0
    }

    function Pe(b) {
      b = b | 0;
      return a[b >> 0] | 0
    }

    function Qe(b) {
      b = b | 0;
      return a[b >> 0] | 0
    }

    function Re(a) {
      a = a | 0;
      return (d[a + 1 >> 0] | 0) << 8 | (d[a >> 0] | 0) | (d[a + 2 >> 0] | 0) << 16 | (d[a + 3 >> 0] | 0) << 24 | 0
    }

    function Se(a, b) {
      a = a | 0;
      b = b | 0;
      We(a, b);
      return
    }

    function Te(b, c) {
      b = b | 0;
      c = c | 0;
      a[c + 1 >> 0] = (b & 65535) >>> 8;
      a[c >> 0] = b;
      return
    }

    function Ue(b, c) {
      b = b | 0;
      c = c | 0;
      a[c >> 0] = b;
      return
    }

    function Ve(b, c) {
      b = b | 0;
      c = c | 0;
      a[c >> 0] = b;
      return
    }

    function We(b, c) {
      b = b | 0;
      c = c | 0;
      a[c + 3 >> 0] = b >>> 24;
      a[c + 2 >> 0] = b >>> 16;
      a[c + 1 >> 0] = b >>> 8;
      a[c >> 0] = b;
      return
    }

    function Xe(a, b) {
      a = a | 0;
      b = b | 0;
      return
    }

    function Ye(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Ze(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 4 >> 2] & 255](a);
      return
    }

    function _e(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 9202 ? a + 12 | 0 : 0) | 0
    }

    function $e(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function af(a, b) {
      a = a | 0;
      b = b | 0;
      fe(a);
      c[a >> 2] = 4768;
      c[a + 4 >> 2] = b;
      cf(a + 8 | 0);
      return
    }

    function bf(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 4792;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xe(a, e);
      V = d;
      return
    }

    function cf(b) {
      b = b | 0;
      gf(b);
      hf(b + 164 | 0);
      jf(b + 244 | 0);
      a[b + 324 >> 0] = 0;
      a[b + 325 >> 0] = 0;
      return
    }

    function df(a) {
      a = a | 0;
      c[a >> 2] = 4768; of (a + 8 | 0);
      le(a);
      return
    }

    function ef(a) {
      a = a | 0;
      df(a);
      jp(a);
      return
    }

    function ff(a, b) {
      a = a | 0;
      b = b | 0;
      return qf(a + 8 | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function gf(b) {
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;
      h = V;
      V = V + 16 | 0;
      f = h;
      a[b >> 0] = 0;
      Oc(b + 4 | 0, 516, 0, 0);
      Oc(b + 48 | 0, 6, 0, 0);
      c[b + 92 >> 2] = 0;
      c[b + 96 >> 2] = 0;
      e = b + 100 | 0;
      mf(e);
      nf(f);
      g = c[f >> 2] | 0;
      f = c[f + 4 >> 2] | 0;
      d = 4;
      while (1) {
        i = e;
        j = i;
        a[j >> 0] = g;
        a[j + 1 >> 0] = g >> 8;
        a[j + 2 >> 0] = g >> 16;
        a[j + 3 >> 0] = g >> 24;
        i = i + 4 | 0;
        a[i >> 0] = f;
        a[i + 1 >> 0] = f >> 8;
        a[i + 2 >> 0] = f >> 16;
        a[i + 3 >> 0] = f >> 24;
        d = d + -1 | 0;
        if (!d) break;
        else e = e + 8 | 0
      }
      j = b + 132 | 0;
      c[j >> 2] = 0;
      c[j + 4 >> 2] = 0;
      c[j + 8 >> 2] = 0;
      c[j + 12 >> 2] = 0;
      c[j + 16 >> 2] = 0;
      c[j + 20 >> 2] = 0;
      c[j + 24 >> 2] = 0;
      c[j + 28 >> 2] = 0;
      V = h;
      return
    }

    function hf(a) {
      a = a | 0;
      xe(a, 32, 9, 8, 0);
      return
    }

    function jf(a) {
      a = a | 0;
      mc(a, 32, 9, 8, 0);
      return
    }

    function kf(a) {
      a = a | 0;
      ye(a);
      return
    }

    function lf(a) {
      a = a | 0;
      Ic(a + 48 | 0);
      Ic(a + 4 | 0);
      return
    }

    function mf(a) {
      a = a | 0;
      var b = 0;
      b = a + 32 | 0;
      do {
        nf(a);
        a = a + 8 | 0
      } while ((a | 0) != (b | 0));
      return
    }

    function nf(b) {
      b = b | 0;
      var c = 0;
      c = b;
      a[c >> 0] = 0;
      a[c + 1 >> 0] = 0;
      a[c + 2 >> 0] = 0;
      a[c + 3 >> 0] = 0;
      b = b + 4 | 0;
      a[b >> 0] = 0;
      a[b + 1 >> 0] = 0;
      a[b + 2 >> 0] = 0;
      a[b + 3 >> 0] = 0;
      return
    }

    function of (a) {
      a = a | 0;
      pf(a + 244 | 0);
      kf(a + 164 | 0);
      lf(a);
      return
    }

    function pf(a) {
      a = a | 0;
      qc(a);
      return
    }

    function qf(b, e, f) {
      b = b | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      g = b + 325 | 0;
      if (!(a[g >> 0] | 0)) {
        rf(b + 244 | 0);
        a[g >> 0] = 1
      }
      if (!(a[b >> 0] | 0)) {
        a[b >> 0] = 1;
        Ee(De(e) | 0, f, 8);
        i = sf(f) | 0;
        j = u() | 0;
        b = b + 100 | 0;
        e = b;
        a[e >> 0] = i;
        a[e + 1 >> 0] = i >> 8;
        a[e + 2 >> 0] = i >> 16;
        a[e + 3 >> 0] = i >> 24;
        b = b + 4 | 0;
        a[b >> 0] = j;
        a[b + 1 >> 0] = j >> 8;
        a[b + 2 >> 0] = j >> 16;
        a[b + 3 >> 0] = j >> 24
      } else {
        j = b + 92 | 0;
        a: do
          if (!(c[b + 132 + (c[j >> 2] << 2) >> 2] | 0)) {
            g = Zc(e, b + 48 | 0) | 0;
            switch (g | 0) {
            case 1: {
              e = pc(b + 244 | 0, e, 0, 0) | 0;
              c[b + 132 + (c[j >> 2] << 2) >> 2] = e;
              e = c[j >> 2] | 0;
              k = c[b + 132 + (e << 2) >> 2] | 0;
              i = b + 100 + (e << 3) | 0;
              h = i;
              g = h;
              h = h + 4 | 0;
              k = lr(d[g >> 0] | d[g + 1 >> 0] << 8 | d[g + 2 >> 0] << 16 | d[g + 3 >> 0] << 24 | 0, d[h >> 0] | d[h + 1 >> 0] << 8 | d[h + 2 >> 0] << 16 | d[h + 3 >> 0] << 24 | 0, k | 0, ((k | 0) < 0) << 31 >> 31 | 0) | 0;
              h = u() | 0;
              g = i;
              a[g >> 0] = k;
              a[g + 1 >> 0] = k >> 8;
              a[g + 2 >> 0] = k >> 16;
              a[g + 3 >> 0] = k >> 24;
              i = i + 4 | 0;
              a[i >> 0] = h;
              a[i + 1 >> 0] = h >> 8;
              a[i + 2 >> 0] = h >> 16;
              a[i + 3 >> 0] = h >> 24;
              c[b + 148 + (e << 2) >> 2] = 0;
              break a
            }
            case 2: {
              k = b + 96 | 0;
              c[k >> 2] = (c[k >> 2] | 0) + 1 & 3;
              i = b + 100 + (c[j >> 2] << 3) + 4 | 0;
              i = pc(b + 244 | 0, e, d[i >> 0] | d[i + 1 >> 0] << 8 | d[i + 2 >> 0] << 16 | d[i + 3 >> 0] << 24, 8) | 0;
              g = b + 100 + (c[k >> 2] << 3) | 0;
              h = g;
              a[h >> 0] = 0;
              a[h + 1 >> 0] = 0;
              a[h + 2 >> 0] = 0;
              a[h + 3 >> 0] = 0;
              g = g + 4 | 0;
              a[g >> 0] = i;
              a[g + 1 >> 0] = i >> 8;
              a[g + 2 >> 0] = i >> 16;
              a[g + 3 >> 0] = i >> 24;
              g = tf(e) | 0;
              k = c[k >> 2] | 0;
              e = b + 100 + (k << 3) | 0;
              i = e;
              h = i;
              i = i + 4 | 0;
              i = d[i >> 0] | d[i + 1 >> 0] << 8 | d[i + 2 >> 0] << 16 | d[i + 3 >> 0] << 24;
              g = d[h >> 0] | d[h + 1 >> 0] << 8 | d[h + 2 >> 0] << 16 | d[h + 3 >> 0] << 24 | g;
              h = e;
              a[h >> 0] = g;
              a[h + 1 >> 0] = g >> 8;
              a[h + 2 >> 0] = g >> 16;
              a[h + 3 >> 0] = g >> 24;
              e = e + 4 | 0;
              a[e >> 0] = i;
              a[e + 1 >> 0] = i >> 8;
              a[e + 2 >> 0] = i >> 16;
              a[e + 3 >> 0] = i >> 24;
              c[j >> 2] = k;
              c[b + 132 + (k << 2) >> 2] = 0;
              c[b + 148 + (c[j >> 2] << 2) >> 2] = 0;
              break a
            }
            default: {
              if ((g | 0) <= 2) break a;
              c[j >> 2] = g + 2 + (c[j >> 2] | 0) & 3;
              qf(b, e, f) | 0;
              break a
            }
            }
          } else {
            i = Zc(e, b + 4 | 0) | 0;
            if ((i | 0) == 1) {
              g = pc(b + 244 | 0, e, c[b + 132 + (c[j >> 2] << 2) >> 2] | 0, 1) | 0;
              k = c[j >> 2] | 0;
              e = b + 100 + (k << 3) | 0;
              i = e;
              h = i;
              i = i + 4 | 0;
              g = lr(d[h >> 0] | d[h + 1 >> 0] << 8 | d[h + 2 >> 0] << 16 | d[h + 3 >> 0] << 24 | 0, d[i >> 0] | d[i + 1 >> 0] << 8 | d[i + 2 >> 0] << 16 | d[i + 3 >> 0] << 24 | 0, g | 0, ((g | 0) < 0) << 31 >> 31 | 0) | 0;
              i = u() | 0;
              h = e;
              a[h >> 0] = g;
              a[h + 1 >> 0] = g >> 8;
              a[h + 2 >> 0] = g >> 16;
              a[h + 3 >> 0] = g >> 24;
              e = e + 4 | 0;
              a[e >> 0] = i;
              a[e + 1 >> 0] = i >> 8;
              a[e + 2 >> 0] = i >> 16;
              a[e + 3 >> 0] = i >> 24;
              c[b + 148 + (k << 2) >> 2] = 0;
              break
            }
            if ((i | 0) >= 511) {
              if ((i | 0) == 512) {
                k = b + 96 | 0;
                c[k >> 2] = (c[k >> 2] | 0) + 1 & 3;
                i = b + 100 + (c[j >> 2] << 3) + 4 | 0;
                i = pc(b + 244 | 0, e, d[i >> 0] | d[i + 1 >> 0] << 8 | d[i + 2 >> 0] << 16 | d[i + 3 >> 0] << 24, 8) | 0;
                g = b + 100 + (c[k >> 2] << 3) | 0;
                h = g;
                a[h >> 0] = 0;
                a[h + 1 >> 0] = 0;
                a[h + 2 >> 0] = 0;
                a[h + 3 >> 0] = 0;
                g = g + 4 | 0;
                a[g >> 0] = i;
                a[g + 1 >> 0] = i >> 8;
                a[g + 2 >> 0] = i >> 16;
                a[g + 3 >> 0] = i >> 24;
                g = tf(e) | 0;
                k = c[k >> 2] | 0;
                e = b + 100 + (k << 3) | 0;
                i = e;
                h = i;
                i = i + 4 | 0;
                i = d[i >> 0] | d[i + 1 >> 0] << 8 | d[i + 2 >> 0] << 16 | d[i + 3 >> 0] << 24;
                g = d[h >> 0] | d[h + 1 >> 0] << 8 | d[h + 2 >> 0] << 16 | d[h + 3 >> 0] << 24 | g;
                h = e;
                a[h >> 0] = g;
                a[h + 1 >> 0] = g >> 8;
                a[h + 2 >> 0] = g >> 16;
                a[h + 3 >> 0] = g >> 24;
                e = e + 4 | 0;
                a[e >> 0] = i;
                a[e + 1 >> 0] = i >> 8;
                a[e + 2 >> 0] = i >> 16;
                a[e + 3 >> 0] = i >> 24;
                c[j >> 2] = k;
                c[b + 132 + (k << 2) >> 2] = 0;
                c[b + 148 + (c[j >> 2] << 2) >> 2] = 0;
                break
              }
              if ((i | 0) <= 511) break;
              c[j >> 2] = (c[j >> 2] | 0) + i & 3;
              qf(b, e, f) | 0;
              break
            }
            do
              if (!i) {
                g = pc(b + 244 | 0, e, 0, 7) | 0;
                h = b + 148 + (c[j >> 2] << 2) | 0;
                c[h >> 2] = (c[h >> 2] | 0) + 1;
                h = c[j >> 2] | 0;
                if ((c[b + 148 + (h << 2) >> 2] | 0) > 3) {
                  c[b + 132 + (h << 2) >> 2] = g;
                  c[b + 148 + (c[j >> 2] << 2) >> 2] = 0
                }
              } else {
                if ((i | 0) < 500) {
                  g = b + 244 | 0;
                  h = q(c[b + 132 + (c[j >> 2] << 2) >> 2] | 0, i) | 0;
                  if ((i | 0) < 10) {
                    g = pc(g, e, h, 2) | 0;
                    break
                  } else {
                    g = pc(g, e, h, 3) | 0;
                    break
                  }
                }
                if ((i | 0) == 500) {
                  g = pc(b + 244 | 0, e, (c[b + 132 + (c[j >> 2] << 2) >> 2] | 0) * 500 | 0, 4) | 0;
                  h = b + 148 + (c[j >> 2] << 2) | 0;
                  c[h >> 2] = (c[h >> 2] | 0) + 1;
                  h = c[j >> 2] | 0;
                  if ((c[b + 148 + (h << 2) >> 2] | 0) <= 3) break;
                  c[b + 132 + (h << 2) >> 2] = g;
                  c[b + 148 + (c[j >> 2] << 2) >> 2] = 0;
                  break
                }
                g = 500 - i | 0;
                h = b + 244 | 0;
                i = c[b + 132 + (c[j >> 2] << 2) >> 2] | 0;
                if ((g | 0) > -10) {
                  g = pc(h, e, q(i, g) | 0, 5) | 0;
                  break
                }
                g = pc(h, e, q(i, -10) | 0, 6) | 0;
                h = b + 148 + (c[j >> 2] << 2) | 0;
                c[h >> 2] = (c[h >> 2] | 0) + 1;
                h = c[j >> 2] | 0;
                if ((c[b + 148 + (h << 2) >> 2] | 0) > 3) {
                  c[b + 132 + (h << 2) >> 2] = g;
                  c[b + 148 + (c[j >> 2] << 2) >> 2] = 0
                }
              } while (0);
            k = b + 100 + (c[j >> 2] << 3) | 0;
            h = k;
            e = h;
            h = h + 4 | 0;
            h = lr(d[e >> 0] | d[e + 1 >> 0] << 8 | d[e + 2 >> 0] << 16 | d[e + 3 >> 0] << 24 | 0, d[h >> 0] | d[h + 1 >> 0] << 8 | d[h + 2 >> 0] << 16 | d[h + 3 >> 0] << 24 | 0, g | 0, ((g | 0) < 0) << 31 >> 31 | 0) | 0;
            e = u() | 0;
            i = k;
            a[i >> 0] = h;
            a[i + 1 >> 0] = h >> 8;
            a[i + 2 >> 0] = h >> 16;
            a[i + 3 >> 0] = h >> 24;
            k = k + 4 | 0;
            a[k >> 0] = e;
            a[k + 1 >> 0] = e >> 8;
            a[k + 2 >> 0] = e >> 16;
            a[k + 3 >> 0] = e >> 24
          }
        while (0);
        uf(b + 100 + (c[j >> 2] << 3) | 0, f)
      }
      return f + 8 | 0
    }

    function rf(a) {
      a = a | 0;
      oc(a);
      return
    }

    function sf(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      e = Re(a) | 0;
      vf(d, e, Re(a + 4 | 0) | 0);
      a = c[d >> 2] | 0;
      t(c[d + 4 >> 2] | 0);
      V = b;
      return a | 0
    }

    function tf(a) {
      a = a | 0;
      var b = 0;
      b = (bd(a) | 0) & 65535;
      return ((bd(a) | 0) & 65535) << 16 | b | 0
    }

    function uf(a, b) {
      a = a | 0;
      b = b | 0;
      var c = 0;
      c = a;
      We(d[c >> 0] | d[c + 1 >> 0] << 8 | d[c + 2 >> 0] << 16 | d[c + 3 >> 0] << 24, b);
      a = a + 4 | 0;
      We(d[a >> 0] | d[a + 1 >> 0] << 8 | d[a + 2 >> 0] << 16 | d[a + 3 >> 0] << 24, b + 4 | 0);
      return
    }

    function vf(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0;
      e = b;
      a[e >> 0] = c;
      a[e + 1 >> 0] = c >> 8;
      a[e + 2 >> 0] = c >> 16;
      a[e + 3 >> 0] = c >> 24;
      c = b + 4 | 0;
      a[c >> 0] = d;
      a[c + 1 >> 0] = d >> 8;
      a[c + 2 >> 0] = d >> 16;
      a[c + 3 >> 0] = d >> 24;
      return
    }

    function wf(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function xf(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 4 >> 2] & 255](a);
      return
    }

    function yf(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 9890 ? a + 12 | 0 : 0) | 0
    }

    function zf(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Af(a, b) {
      a = a | 0;
      b = b | 0;
      fe(a);
      c[a >> 2] = 4820;
      c[a + 4 >> 2] = b;
      Cf(a + 8 | 0);
      return
    }

    function Bf(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 4844;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xe(a, e);
      V = d;
      return
    }

    function Cf(b) {
      b = b | 0;
      a[b >> 0] = 0;
      Gf(b + 1 | 0);
      Oc(b + 8 | 0, 128, 0, 0);
      Oc(b + 52 | 0, 256, 0, 0);
      Oc(b + 96 | 0, 256, 0, 0);
      Oc(b + 140 | 0, 256, 0, 0);
      Oc(b + 184 | 0, 256, 0, 0);
      Oc(b + 228 | 0, 256, 0, 0);
      Oc(b + 272 | 0, 256, 0, 0);
      return
    }

    function Df(a) {
      a = a | 0;
      c[a >> 2] = 4820;
      Hf(a + 8 | 0);
      le(a);
      return
    }

    function Ef(a) {
      a = a | 0;
      Df(a);
      jp(a);
      return
    }

    function Ff(a, b) {
      a = a | 0;
      b = b | 0;
      return If(a + 8 | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function Gf(b) {
      b = b | 0;
      var c = 0;
      a[b >> 0] = 0;
      a[b + 1 >> 0] = 0;
      c = b + 2 | 0;
      a[c >> 0] = 0;
      a[c + 1 >> 0] = 0;
      b = b + 4 | 0;
      a[b >> 0] = 0;
      a[b + 1 >> 0] = 0;
      return
    }

    function Hf(a) {
      a = a | 0;
      Ic(a + 272 | 0);
      Ic(a + 228 | 0);
      Ic(a + 184 | 0);
      Ic(a + 140 | 0);
      Ic(a + 96 | 0);
      Ic(a + 52 | 0);
      Ic(a + 8 | 0);
      return
    }

    function If(c, f, g) {
      c = c | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0;
      o = V;
      V = V + 16 | 0;
      m = o;
      if (!(a[c >> 0] | 0)) {
        a[c >> 0] = 1;
        Ee(De(f) | 0, g, 6);
        Jf(m, g);
        n = c + 1 | 0;
        a[n >> 0] = a[m >> 0] | 0;
        a[n + 1 >> 0] = a[m + 1 >> 0] | 0;
        a[n + 2 >> 0] = a[m + 2 >> 0] | 0;
        a[n + 3 >> 0] = a[m + 3 >> 0] | 0;
        a[n + 4 >> 0] = a[m + 4 >> 0] | 0;
        a[n + 5 >> 0] = a[m + 5 >> 0] | 0
      } else {
        n = Zc(f, c + 8 | 0) | 0;
        Gf(m);
        if (!(n & 1)) {
          h = c + 1 | 0;
          h = (d[h >> 0] | d[h + 1 >> 0] << 8) & 255
        } else {
          l = (Zc(f, c + 52 | 0) | 0) & 255;
          h = c + 1 | 0;
          h = (Ie(l + ((d[h >> 0] | d[h + 1 >> 0] << 8) & 255) | 0) | 0) & 255
        }
        b[m >> 1] = h;
        if (!(n & 2)) {
          l = c + 1 | 0;
          h = h | (d[l >> 0] | d[l + 1 >> 0] << 8) & -256
        } else {
          h = (Zc(f, c + 96 | 0) | 0) & 255;
          l = c + 1 | 0;
          h = ((Ie((((d[l >> 0] | d[l + 1 >> 0] << 8) & 65535) >>> 8) + h | 0) | 0) & 255) << 8;
          h = (h | e[m >> 1]) & 65535
        }
        b[m >> 1] = h;
        do
          if (n & 64) {
            k = c + 1 | 0;
            i = (h & 255) - ((d[k >> 0] | d[k + 1 >> 0] << 8) & 255) | 0;
            if (!(n & 4)) {
              h = c + 3 | 0;
              h = (d[h >> 0] | d[h + 1 >> 0] << 8) & 255
            } else {
              h = (Zc(f, c + 140 | 0) | 0) & 255;
              l = c + 3 | 0;
              l = i + ((d[l >> 0] | d[l + 1 >> 0] << 8) & 255) | 0;
              h = (Ie(((l | 0) < 1 ? 0 : (l | 0) > 254 ? 255 : l & 255) + h | 0) | 0) & 255
            }
            l = m + 2 | 0;
            b[l >> 1] = h;
            if (!(n & 16)) {
              h = c + 5 | 0;
              h = (d[h >> 0] | d[h + 1 >> 0] << 8) & 255
            } else {
              h = Zc(f, c + 228 | 0) | 0;
              p = c + 3 | 0;
              j = c + 5 | 0;
              j = ((i + (b[l >> 1] & 255) - ((d[p >> 0] | d[p + 1 >> 0] << 8) & 255) | 0) / 2 | 0) + ((d[j >> 0] | d[j + 1 >> 0] << 8) & 255) | 0;
              h = (Ie(((j | 0) < 1 ? 0 : (j | 0) > 254 ? 255 : j & 255) + (h & 255) | 0) | 0) & 255
            }
            j = m + 4 | 0;
            b[j >> 1] = h;
            h = ((e[m >> 1] | 0) >>> 8) - (((d[k >> 0] | d[k + 1 >> 0] << 8) & 65535) >>> 8) | 0;
            if (!(n & 8)) {
              i = c + 3 | 0;
              i = b[l >> 1] | (d[i >> 0] | d[i + 1 >> 0] << 8) & -256
            } else {
              i = (Zc(f, c + 184 | 0) | 0) & 255;
              p = c + 3 | 0;
              p = (((d[p >> 0] | d[p + 1 >> 0] << 8) & 65535) >>> 8) + h | 0;
              i = ((Ie(((p | 0) < 1 ? 0 : (p | 0) > 254 ? 255 : p & 255) + i | 0) | 0) & 255) << 8;
              i = (i | e[l >> 1]) & 65535
            }
            b[l >> 1] = i;
            if (!(n & 32)) {
              p = c + 5 | 0;
              b[j >> 1] = b[j >> 1] | (d[p >> 0] | d[p + 1 >> 0] << 8) & -256;
              break
            } else {
              p = Zc(f, c + 272 | 0) | 0;
              f = c + 3 | 0;
              n = c + 5 | 0;
              n = ((((e[l >> 1] | 0) >>> 8) + h - (((d[f >> 0] | d[f + 1 >> 0] << 8) & 65535) >>> 8) | 0) / 2 | 0) + (((d[n >> 0] | d[n + 1 >> 0] << 8) & 65535) >>> 8) | 0;
              p = ((Ie(((n | 0) < 1 ? 0 : (n | 0) > 254 ? 255 : n & 255) + (p & 255) | 0) | 0) & 255) << 8;
              b[j >> 1] = p | e[j >> 1];
              break
            }
          } else {
            b[m + 2 >> 1] = h;
            b[m + 4 >> 1] = h
          } while (0);
        p = c + 1 | 0;
        a[p >> 0] = a[m >> 0] | 0;
        a[p + 1 >> 0] = a[m + 1 >> 0] | 0;
        a[p + 2 >> 0] = a[m + 2 >> 0] | 0;
        a[p + 3 >> 0] = a[m + 3 >> 0] | 0;
        a[p + 4 >> 0] = a[m + 4 >> 0] | 0;
        a[p + 5 >> 0] = a[m + 5 >> 0] | 0;
        Kf(p, g)
      }
      V = o;
      return g + 6 | 0
    }

    function Jf(a, b) {
      a = a | 0;
      b = b | 0;
      var c = 0,
        d = 0;
      d = Oe(b) | 0;
      c = Oe(b + 2 | 0) | 0;
      Lf(a, d, c, Oe(b + 4 | 0) | 0);
      return
    }

    function Kf(a, b) {
      a = a | 0;
      b = b | 0;
      var c = 0;
      Te(d[a >> 0] | d[a + 1 >> 0] << 8, b);
      c = a + 2 | 0;
      Te(d[c >> 0] | d[c + 1 >> 0] << 8, b + 2 | 0);
      a = a + 4 | 0;
      Te(d[a >> 0] | d[a + 1 >> 0] << 8, b + 4 | 0);
      return
    }

    function Lf(b, c, d, e) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      a[b >> 0] = c;
      a[b + 1 >> 0] = c >> 8;
      c = b + 2 | 0;
      a[c >> 0] = d;
      a[c + 1 >> 0] = d >> 8;
      d = b + 4 | 0;
      a[d >> 0] = e;
      a[d + 1 >> 0] = e >> 8;
      return
    }

    function Mf(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Nf(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 4 >> 2] & 255](a);
      return
    }

    function Of(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 10570 ? a + 12 | 0 : 0) | 0
    }

    function Pf(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Qf(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      fe(a);
      c[a >> 2] = 4872;
      c[a + 4 >> 2] = b;
      Sf(a + 8 | 0, d);
      return
    }

    function Rf(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 4896;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xe(a, e);
      V = d;
      return
    }

    function Sf(b, d) {
      b = b | 0;
      d = d | 0;
      c[b >> 2] = c[d >> 2];
      a[b + 4 >> 0] = a[d + 4 >> 0] | 0;
      Wf(b + 8 | 0, d + 8 | 0);
      Wf(b + 20 | 0, d + 20 | 0);
      Xf(b + 32 | 0, d + 32 | 0);
      return
    }

    function Tf(a) {
      a = a | 0;
      c[a >> 2] = 4872;
      ud(a + 8 | 0);
      le(a);
      return
    }

    function Uf(a) {
      a = a | 0;
      Tf(a);
      jp(a);
      return
    }

    function Vf(a, b) {
      a = a | 0;
      b = b | 0;
      return Dg(a + 8 | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function Wf(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0;
      c[a >> 2] = 0;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = 0;
      d = b + 4 | 0;
      e = (c[d >> 2] | 0) - (c[b >> 2] | 0) | 0;
      if (e | 0) {
        Yf(a, e);
        Zf(a, c[b >> 2] | 0, c[d >> 2] | 0, e)
      }
      return
    }

    function Xf(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      d = V;
      V = V + 32 | 0;
      e = d + 24 | 0;
      f = d + 16 | 0;
      h = d + 8 | 0;
      g = d;
      c[a >> 2] = 0;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = 0;
      c[a + 12 >> 2] = 0;
      c[a + 16 >> 2] = 0;
      c[a + 20 >> 2] = 0;
      zg(h, b);
      Ag(g, b);
      c[f >> 2] = c[h >> 2];
      c[f + 4 >> 2] = c[h + 4 >> 2];
      c[e >> 2] = c[g >> 2];
      c[e + 4 >> 2] = c[g + 4 >> 2];
      cg(a, f, e, 0);
      V = d;
      return
    }

    function Yf(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0;
      if (($f(a) | 0) >>> 0 < b >>> 0) cr(a);
      else {
        d = eq(b) | 0;
        c[a + 4 >> 2] = d;
        c[a >> 2] = d;
        c[a + 8 >> 2] = d + b;
        return
      }
    }

    function Zf(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0;
      g = V;
      V = V + 16 | 0;
      f = g;
      ag(f, a, e);
      e = f + 4 | 0;
      a = d - b | 0;
      if ((a | 0) > 0) {
        ur(c[e >> 2] | 0, b | 0, a | 0) | 0;
        c[e >> 2] = (c[e >> 2] | 0) + a
      }
      bg(f);
      V = g;
      return
    }

    function _f(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = c[a >> 2] | 0;
      d = b;
      if (b | 0) {
        c[a + 4 >> 2] = d;
        Da(b, (c[a + 8 >> 2] | 0) - d | 0)
      }
      return
    }

    function $f(a) {
      a = a | 0;
      return 2147483647
    }

    function ag(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = b;
      b = c[b + 4 >> 2] | 0;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = b + d;
      return
    }

    function bg(a) {
      a = a | 0;
      c[(c[a >> 2] | 0) + 4 >> 2] = c[a + 4 >> 2];
      return
    }

    function cg(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0;
      q = V;
      V = V + 96 | 0;
      p = q + 80 | 0;
      m = q + 64 | 0;
      j = q + 48 | 0;
      k = q + 40 | 0;
      l = q + 8 | 0;
      i = q;
      n = q + 32 | 0;
      o = q + 16 | 0;
      h = b;
      g = c[h >> 2] | 0;
      h = c[h + 4 >> 2] | 0;
      f = d;
      d = c[f >> 2] | 0;
      f = c[f + 4 >> 2] | 0;
      e = g;
      if ((f | 0) == (h | 0)) h = 0;
      else h = ((f - (c[d >> 2] | 0) | 0) / 44 | 0) + ((d - g >> 2) * 93 | 0) + ((h - (c[g >> 2] | 0) | 0) / -44 | 0) | 0;
      d = (c[a + 8 >> 2] | 0) - (c[a + 4 >> 2] | 0) | 0;
      d = ((d | 0) == 0 ? 0 : ((d >> 2) * 93 | 0) + -1 | 0) - ((c[a + 20 >> 2] | 0) + (c[a + 16 >> 2] | 0)) | 0;
      if (h >>> 0 > d >>> 0) eg(a, h - d | 0);
      fg(k, a);
      fg(i, a);
      f = i;
      d = c[f >> 2] | 0;
      f = c[f + 4 >> 2] | 0;
      g = l;
      c[g >> 2] = d;
      c[g + 4 >> 2] = f;
      g = d;
      if (h | 0) {
        d = ((f - (c[d >> 2] | 0) | 0) / 44 | 0) + h | 0;
        if ((d | 0) > 0) {
          i = (d >>> 0) / 93 | 0;
          h = g + (i << 2) | 0;
          c[l >> 2] = h;
          d = (c[h >> 2] | 0) + ((d - (i * 93 | 0) | 0) * 44 | 0) | 0
        } else {
          d = 92 - d | 0;
          i = g + (((d | 0) / -93 | 0) << 2) | 0;
          c[l >> 2] = i;
          d = (c[i >> 2] | 0) + ((92 - ((d | 0) % 93 | 0) | 0) * 44 | 0) | 0
        }
        c[l + 4 >> 2] = d
      };
      c[m >> 2] = c[k >> 2];
      c[m + 4 >> 2] = c[k + 4 >> 2];
      c[p >> 2] = c[l >> 2];
      c[p + 4 >> 2] = c[l + 4 >> 2];
      gg(j, m, p);
      hg(p, j);
      ig(m, j);
      if (jg(p, m) | 0) {
        g = o + 4 | 0;
        h = b + 4 | 0;
        do {
          kg(n, p);
          lg(o, a, n);
          d = c[o >> 2] | 0;
          if ((d | 0) != (c[g >> 2] | 0)) {
            f = c[h >> 2] | 0;
            do {
              Wc(d, f);
              d = (c[o >> 2] | 0) + 44 | 0;
              c[o >> 2] = d;
              f = f + 44 | 0;
              c[h >> 2] = f;
              if ((f - (c[e >> 2] | 0) | 0) == 4092) {
                e = e + 4 | 0;
                c[b >> 2] = e;
                f = c[e >> 2] | 0;
                c[h >> 2] = f
              }
            } while ((d | 0) != (c[g >> 2] | 0))
          }
          mg(o);
          ng(p) | 0
        } while (jg(p, m) | 0)
      }
      V = q;
      return
    }

    function dg(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = c[a + 4 >> 2] | 0;
      d = a + 8 | 0;
      e = c[d >> 2] | 0;
      if ((e | 0) != (b | 0)) c[d >> 2] = e + (~((e + -4 - b | 0) >>> 2) << 2);
      b = c[a >> 2] | 0;
      if (b | 0) Da(b, (c[a + 12 >> 2] | 0) - b | 0);
      return
    }

    function eg(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0;
      B = V;
      V = V + 64 | 0;
      v = B + 52 | 0;
      u = B + 48 | 0;
      w = B + 28 | 0;
      x = B + 24 | 0;
      y = B + 20 | 0;
      p = B;
      z = a + 8 | 0;
      d = c[z >> 2] | 0;
      A = a + 4 | 0;
      j = c[A >> 2] | 0;
      s = ((d | 0) == (j | 0) & 1) + b | 0;
      h = (s >>> 0) / 93 | 0;
      h = h + ((s - (h * 93 | 0) | 0) != 0 & 1) | 0;
      s = a + 16 | 0;
      e = c[s >> 2] | 0;
      i = (e >>> 0) / 93 | 0;
      r = h >>> 0 < i >>> 0 ? h : i;
      b = h - r | 0;
      g = d;
      a: do
        if (!b) {
          c[s >> 2] = (q(r, -93) | 0) + e;
          if (r | 0) {
            i = a + 12 | 0;
            k = a + 12 | 0;
            l = w + 4 | 0;
            m = w + 8 | 0;
            n = w + 12 | 0;
            b = r;
            e = j;
            while (1) {
              h = c[e >> 2] | 0;
              g = e + 4 | 0;
              c[A >> 2] = g;
              t = c[i >> 2] | 0;
              e = t;
              do
                if ((d | 0) == (t | 0)) {
                  t = c[a >> 2] | 0;
                  d = t;
                  if (g >>> 0 <= t >>> 0) {
                    d = e - d | 0;
                    d = (d | 0) == 0 ? 1 : d >> 1;
                    qg(w, d, d >>> 2, k);
                    c[x >> 2] = c[A >> 2];
                    c[y >> 2] = c[z >> 2];
                    c[u >> 2] = c[x >> 2];
                    c[v >> 2] = c[y >> 2];
                    ug(w, u, v);
                    d = c[a >> 2] | 0;
                    c[a >> 2] = c[w >> 2];
                    c[w >> 2] = d;
                    d = c[A >> 2] | 0;
                    c[A >> 2] = c[l >> 2];
                    c[l >> 2] = d;
                    d = c[z >> 2] | 0;
                    c[z >> 2] = c[m >> 2];
                    c[m >> 2] = d;
                    d = c[i >> 2] | 0;
                    c[i >> 2] = c[n >> 2];
                    c[n >> 2] = d;
                    tg(w);
                    d = c[z >> 2] | 0;
                    break
                  }
                  t = g;
                  d = ((t - d >> 2) + 1 | 0) / -2 | 0;
                  f = g + (d << 2) | 0;
                  e = e - t | 0;
                  if (!e) d = f;
                  else {
                    vr(f | 0, g | 0, e | 0) | 0;
                    d = (c[A >> 2] | 0) + (d << 2) | 0
                  }
                  t = f + (e >> 2 << 2) | 0;
                  c[z >> 2] = t;
                  c[A >> 2] = d;
                  d = t
                } while (0);
              c[d >> 2] = h;
              d = (c[z >> 2] | 0) + 4 | 0;
              c[z >> 2] = d;
              b = b + -1 | 0;
              if (!b) break a;
              e = c[A >> 2] | 0
            }
          }
        } else {
          t = a + 12 | 0;
          e = c[t >> 2] | 0;
          f = e - (c[a >> 2] | 0) | 0;
          d = g - j >> 2;
          if (b >>> 0 > ((f >> 2) - d | 0) >>> 0) {
            o = f >> 1;
            n = d + b | 0;
            qg(p, o >>> 0 < n >>> 0 ? n : o, d - r | 0, a + 12 | 0);
            do {
              c[v >> 2] = eq(4092) | 0;
              rg(p, v);
              b = b + -1 | 0
            } while ((b | 0) != 0);
            if (!r) d = c[A >> 2] | 0;
            else {
              i = p + 8 | 0;
              j = p + 12 | 0;
              k = p + 4 | 0;
              l = p + 16 | 0;
              m = w + 4 | 0;
              n = w + 8 | 0;
              o = w + 12 | 0;
              h = r;
              b = c[i >> 2] | 0;
              d = c[A >> 2] | 0;
              do {
                g = c[j >> 2] | 0;
                e = g;
                do
                  if ((b | 0) == (g | 0)) {
                    f = c[k >> 2] | 0;
                    g = c[p >> 2] | 0;
                    b = g;
                    if (f >>> 0 <= g >>> 0) {
                      b = e - b | 0;
                      b = (b | 0) == 0 ? 1 : b >> 1;
                      qg(w, b, b >>> 2, c[l >> 2] | 0);
                      c[x >> 2] = c[k >> 2];
                      c[y >> 2] = c[i >> 2];
                      c[u >> 2] = c[x >> 2];
                      c[v >> 2] = c[y >> 2];
                      ug(w, u, v);
                      b = c[p >> 2] | 0;
                      c[p >> 2] = c[w >> 2];
                      c[w >> 2] = b;
                      b = c[k >> 2] | 0;
                      c[k >> 2] = c[m >> 2];
                      c[m >> 2] = b;
                      b = c[i >> 2] | 0;
                      c[i >> 2] = c[n >> 2];
                      c[n >> 2] = b;
                      b = c[j >> 2] | 0;
                      c[j >> 2] = c[o >> 2];
                      c[o >> 2] = b;
                      tg(w);
                      b = c[i >> 2] | 0;
                      break
                    }
                    C = f;
                    b = ((C - b >> 2) + 1 | 0) / -2 | 0;
                    g = f + (b << 2) | 0;
                    e = e - C | 0;
                    if (!e) b = g;
                    else {
                      vr(g | 0, f | 0, e | 0) | 0;
                      b = (c[k >> 2] | 0) + (b << 2) | 0
                    }
                    C = g + (e >> 2 << 2) | 0;
                    c[i >> 2] = C;
                    c[k >> 2] = b;
                    b = C
                  } while (0);
                c[b >> 2] = c[d >> 2];
                b = (c[i >> 2] | 0) + 4 | 0;
                c[i >> 2] = b;
                d = (c[A >> 2] | 0) + 4 | 0;
                c[A >> 2] = d;
                h = h + -1 | 0
              } while ((h | 0) != 0)
            }
            b = c[z >> 2] | 0;
            if ((b | 0) != (d | 0)) {
              do {
                b = b + -4 | 0;
                sg(p, b);
                d = c[A >> 2] | 0
              } while ((b | 0) != (d | 0));
              b = c[z >> 2] | 0
            }
            C = c[a >> 2] | 0;
            c[a >> 2] = c[p >> 2];
            c[p >> 2] = C;
            C = p + 4 | 0;
            c[A >> 2] = c[C >> 2];
            c[C >> 2] = d;
            C = p + 8 | 0;
            c[z >> 2] = c[C >> 2];
            c[C >> 2] = b;
            C = p + 12 | 0;
            A = c[t >> 2] | 0;
            c[t >> 2] = c[C >> 2];
            c[C >> 2] = A;
            c[s >> 2] = (c[s >> 2] | 0) + (q(r, -93) | 0);
            tg(p);
            break
          } else {
            b: do
              if ((e | 0) == (g | 0)) k = 18;
              else {
                while (1) {
                  c[v >> 2] = eq(4092) | 0;
                  og(a, v);
                  b = b + -1 | 0;
                  if (!b) break;
                  if ((c[t >> 2] | 0) == (c[z >> 2] | 0)) {
                    k = 18;
                    break b
                  }
                }
                d = r;
                b = c[s >> 2] | 0
              }while (0);
            if ((k | 0) == 18) {
              e = ~(h >>> 0 > i >>> 0 ? i : h);
              d = b;
              do {
                c[v >> 2] = eq(4092) | 0;
                pg(a, v);
                d = d + -1 | 0;
                f = (((c[z >> 2] | 0) - (c[A >> 2] | 0) | 0) == 4 ? 92 : 93) + (c[s >> 2] | 0) | 0;
                c[s >> 2] = f
              } while ((d | 0) != 0);
              d = b + -1 - e | 0;
              b = f
            }
            c[s >> 2] = b + (q(d, -93) | 0);
            if (!d) break;i = a + 12 | 0;j = w + 4 | 0;k = w + 8 | 0;l = w + 12 | 0;b = c[z >> 2] | 0;do {
              g = c[A >> 2] | 0;
              h = c[g >> 2] | 0;
              g = g + 4 | 0;
              c[A >> 2] = g;
              C = c[t >> 2] | 0;
              e = C;
              do
                if ((b | 0) == (C | 0)) {
                  C = c[a >> 2] | 0;
                  b = C;
                  if (g >>> 0 <= C >>> 0) {
                    b = e - b | 0;
                    b = (b | 0) == 0 ? 1 : b >> 1;
                    qg(w, b, b >>> 2, i);
                    c[x >> 2] = c[A >> 2];
                    c[y >> 2] = c[z >> 2];
                    c[u >> 2] = c[x >> 2];
                    c[v >> 2] = c[y >> 2];
                    ug(w, u, v);
                    b = c[a >> 2] | 0;
                    c[a >> 2] = c[w >> 2];
                    c[w >> 2] = b;
                    b = c[A >> 2] | 0;
                    c[A >> 2] = c[j >> 2];
                    c[j >> 2] = b;
                    b = c[z >> 2] | 0;
                    c[z >> 2] = c[k >> 2];
                    c[k >> 2] = b;
                    b = c[t >> 2] | 0;
                    c[t >> 2] = c[l >> 2];
                    c[l >> 2] = b;
                    tg(w);
                    b = c[z >> 2] | 0;
                    break
                  }
                  C = g;
                  b = ((C - b >> 2) + 1 | 0) / -2 | 0;
                  f = g + (b << 2) | 0;
                  e = e - C | 0;
                  if (!e) b = f;
                  else {
                    vr(f | 0, g | 0, e | 0) | 0;
                    b = (c[A >> 2] | 0) + (b << 2) | 0
                  }
                  C = f + (e >> 2 << 2) | 0;
                  c[z >> 2] = C;
                  c[A >> 2] = b;
                  b = C
                } while (0);
              c[b >> 2] = h;
              b = (c[z >> 2] | 0) + 4 | 0;
              c[z >> 2] = b;
              d = d + -1 | 0
            } while ((d | 0) != 0)
          }
        }
      while (0);
      V = B;
      return
    }

    function fg(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0;
      d = (c[b + 16 >> 2] | 0) + (c[b + 20 >> 2] | 0) | 0;
      g = c[b + 4 >> 2] | 0;
      e = (d >>> 0) / 93 | 0;
      f = g + (e << 2) | 0;
      if ((c[b + 8 >> 2] | 0) == (g | 0)) b = 0;
      else b = (c[f >> 2] | 0) + ((d - (e * 93 | 0) | 0) * 44 | 0) | 0;
      c[a >> 2] = f;
      c[a + 4 >> 2] = b;
      return
    }

    function gg(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      f = b;
      b = c[f + 4 >> 2] | 0;
      e = a;
      c[e >> 2] = c[f >> 2];
      c[e + 4 >> 2] = b;
      e = d;
      b = c[e + 4 >> 2] | 0;
      d = a + 8 | 0;
      c[d >> 2] = c[e >> 2];
      c[d + 4 >> 2] = b;
      return
    }

    function hg(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = c[b >> 2];
      c[a + 4 >> 2] = c[b + 4 >> 2];
      c[a + 8 >> 2] = c[b + 8 >> 2];
      c[a + 12 >> 2] = c[b + 12 >> 2];
      return
    }

    function ig(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;
      d = V;
      V = V + 32 | 0;
      e = d + 24 | 0;
      f = d + 16 | 0;
      h = d + 8 | 0;
      g = d;
      i = b + 8 | 0;
      j = c[i >> 2] | 0;
      i = c[i + 4 >> 2] | 0;
      b = h;
      c[b >> 2] = j;
      c[b + 4 >> 2] = i;
      b = g;
      c[b >> 2] = j;
      c[b + 4 >> 2] = i;
      c[f >> 2] = c[h >> 2];
      c[f + 4 >> 2] = c[h + 4 >> 2];
      c[e >> 2] = c[g >> 2];
      c[e + 4 >> 2] = c[g + 4 >> 2];
      gg(a, f, e);
      V = d;
      return
    }

    function jg(a, b) {
      a = a | 0;
      b = b | 0;
      return (xg(a, b) | 0) ^ 1 | 0
    }

    function kg(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0;
      d = c[b >> 2] | 0;
      e = c[b + 4 >> 2] | 0;
      if ((d | 0) == (c[b + 8 >> 2] | 0)) yg(a, e, c[b + 12 >> 2] | 0);
      else yg(a, e, (c[d >> 2] | 0) + 4092 | 0);
      return
    }

    function lg(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0;
      e = c[d >> 2] | 0;
      c[a >> 2] = e;
      c[a + 4 >> 2] = c[d + 4 >> 2];
      c[a + 8 >> 2] = e;
      c[a + 12 >> 2] = b;
      return
    }

    function mg(a) {
      a = a | 0;
      var b = 0;
      b = (c[a + 12 >> 2] | 0) + 20 | 0;
      c[b >> 2] = (c[b >> 2] | 0) + (((c[a >> 2] | 0) - (c[a + 8 >> 2] | 0) | 0) / 44 | 0);
      return
    }

    function ng(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = c[a >> 2] | 0;
      d = a + 8 | 0;
      if ((b | 0) == (c[d >> 2] | 0)) {
        e = d;
        b = c[e + 4 >> 2] | 0;
        d = a;
        c[d >> 2] = c[e >> 2];
        c[d + 4 >> 2] = b
      } else {
        e = b + 4 | 0;
        c[a >> 2] = e;
        c[a + 4 >> 2] = c[e >> 2]
      }
      return a | 0
    }

    function og(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0;
      p = V;
      V = V + 48 | 0;
      f = p + 32 | 0;
      e = p + 28 | 0;
      i = p + 8 | 0;
      j = p + 4 | 0;
      k = p;
      o = a + 8 | 0;
      d = c[o >> 2] | 0;
      l = a + 12 | 0;
      n = c[l >> 2] | 0;
      g = n;
      do
        if ((d | 0) == (n | 0)) {
          n = a + 4 | 0;
          m = c[n >> 2] | 0;
          q = c[a >> 2] | 0;
          h = q;
          if (m >>> 0 <= q >>> 0) {
            d = g - h | 0;
            d = (d | 0) == 0 ? 1 : d >> 1;
            qg(i, d, d >>> 2, a + 12 | 0);
            c[j >> 2] = c[n >> 2];
            c[k >> 2] = c[o >> 2];
            c[e >> 2] = c[j >> 2];
            c[f >> 2] = c[k >> 2];
            ug(i, e, f);
            d = c[a >> 2] | 0;
            c[a >> 2] = c[i >> 2];
            c[i >> 2] = d;
            d = i + 4 | 0;
            q = c[n >> 2] | 0;
            c[n >> 2] = c[d >> 2];
            c[d >> 2] = q;
            d = i + 8 | 0;
            q = c[o >> 2] | 0;
            c[o >> 2] = c[d >> 2];
            c[d >> 2] = q;
            d = i + 12 | 0;
            q = c[l >> 2] | 0;
            c[l >> 2] = c[d >> 2];
            c[d >> 2] = q;
            tg(i);
            d = c[o >> 2] | 0;
            break
          }
          f = m;
          e = ((f - h >> 2) + 1 | 0) / -2 | 0;
          a = m + (e << 2) | 0;
          f = d - f | 0;
          if (!f) d = a;
          else {
            vr(a | 0, m | 0, f | 0) | 0;
            d = (c[n >> 2] | 0) + (e << 2) | 0
          }
          q = a + (f >> 2 << 2) | 0;
          c[o >> 2] = q;
          c[n >> 2] = d;
          d = q
        } while (0);
      c[d >> 2] = c[b >> 2];
      c[o >> 2] = (c[o >> 2] | 0) + 4;
      V = p;
      return
    }

    function pg(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0;
      p = V;
      V = V + 48 | 0;
      e = p + 32 | 0;
      d = p + 28 | 0;
      h = p + 8 | 0;
      i = p + 4 | 0;
      j = p;
      o = a + 4 | 0;
      m = c[o >> 2] | 0;
      n = c[a >> 2] | 0;
      k = n;
      do
        if ((m | 0) == (n | 0)) {
          n = a + 8 | 0;
          l = c[n >> 2] | 0;
          g = a + 12 | 0;
          q = c[g >> 2] | 0;
          f = q;
          if (l >>> 0 >= q >>> 0) {
            q = f - k | 0;
            q = (q | 0) == 0 ? 1 : q >> 1;
            qg(h, q, (q + 3 | 0) >>> 2, a + 12 | 0);
            c[i >> 2] = c[o >> 2];
            c[j >> 2] = c[n >> 2];
            c[d >> 2] = c[i >> 2];
            c[e >> 2] = c[j >> 2];
            ug(h, d, e);
            d = c[a >> 2] | 0;
            c[a >> 2] = c[h >> 2];
            c[h >> 2] = d;
            d = h + 4 | 0;
            q = c[o >> 2] | 0;
            c[o >> 2] = c[d >> 2];
            c[d >> 2] = q;
            d = h + 8 | 0;
            q = c[n >> 2] | 0;
            c[n >> 2] = c[d >> 2];
            c[d >> 2] = q;
            d = h + 12 | 0;
            q = c[g >> 2] | 0;
            c[g >> 2] = c[d >> 2];
            c[d >> 2] = q;
            tg(h);
            d = c[o >> 2] | 0;
            break
          }
          e = l;
          a = ((f - e >> 2) + 1 | 0) / 2 | 0;
          f = l + (a << 2) | 0;
          e = e - m | 0;
          d = f + (0 - (e >> 2) << 2) | 0;
          if (!e) {
            d = f;
            e = f
          } else {
            vr(d | 0, m | 0, e | 0) | 0;
            e = (c[n >> 2] | 0) + (a << 2) | 0
          }
          c[o >> 2] = d;
          c[n >> 2] = e
        } else d = m; while (0);
      c[d + -4 >> 2] = c[b >> 2];
      c[o >> 2] = (c[o >> 2] | 0) + -4;
      V = p;
      return
    }

    function qg(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0;
      f = a + 12 | 0;
      c[f >> 2] = 0;
      c[a + 16 >> 2] = e;
      do
        if (b)
          if (b >>> 0 > 1073741823) {
            f = v(8) | 0;
            vq(f, 6723);
            c[f >> 2] = 5956;
            x(f | 0, 3928, 123)
          } else {
            e = eq(b << 2) | 0;
            break
          }
      else e = 0; while (0);
      c[a >> 2] = e;
      d = e + (d << 2) | 0;
      c[a + 8 >> 2] = d;
      c[a + 4 >> 2] = d;
      c[f >> 2] = e + (b << 2);
      return
    }

    function rg(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0;
      p = V;
      V = V + 48 | 0;
      f = p + 32 | 0;
      e = p + 28 | 0;
      i = p + 8 | 0;
      j = p + 4 | 0;
      k = p;
      o = a + 8 | 0;
      d = c[o >> 2] | 0;
      l = a + 12 | 0;
      n = c[l >> 2] | 0;
      g = n;
      do
        if ((d | 0) == (n | 0)) {
          n = a + 4 | 0;
          m = c[n >> 2] | 0;
          q = c[a >> 2] | 0;
          h = q;
          if (m >>> 0 <= q >>> 0) {
            d = g - h | 0;
            d = (d | 0) == 0 ? 1 : d >> 1;
            qg(i, d, d >>> 2, c[a + 16 >> 2] | 0);
            c[j >> 2] = c[n >> 2];
            c[k >> 2] = c[o >> 2];
            c[e >> 2] = c[j >> 2];
            c[f >> 2] = c[k >> 2];
            ug(i, e, f);
            d = c[a >> 2] | 0;
            c[a >> 2] = c[i >> 2];
            c[i >> 2] = d;
            d = i + 4 | 0;
            q = c[n >> 2] | 0;
            c[n >> 2] = c[d >> 2];
            c[d >> 2] = q;
            d = i + 8 | 0;
            q = c[o >> 2] | 0;
            c[o >> 2] = c[d >> 2];
            c[d >> 2] = q;
            d = i + 12 | 0;
            q = c[l >> 2] | 0;
            c[l >> 2] = c[d >> 2];
            c[d >> 2] = q;
            tg(i);
            d = c[o >> 2] | 0;
            break
          }
          f = m;
          e = ((f - h >> 2) + 1 | 0) / -2 | 0;
          a = m + (e << 2) | 0;
          f = d - f | 0;
          if (!f) d = a;
          else {
            vr(a | 0, m | 0, f | 0) | 0;
            d = (c[n >> 2] | 0) + (e << 2) | 0
          }
          q = a + (f >> 2 << 2) | 0;
          c[o >> 2] = q;
          c[n >> 2] = d;
          d = q
        } while (0);
      c[d >> 2] = c[b >> 2];
      c[o >> 2] = (c[o >> 2] | 0) + 4;
      V = p;
      return
    }

    function sg(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0;
      p = V;
      V = V + 48 | 0;
      e = p + 32 | 0;
      d = p + 28 | 0;
      h = p + 8 | 0;
      i = p + 4 | 0;
      j = p;
      o = a + 4 | 0;
      m = c[o >> 2] | 0;
      n = c[a >> 2] | 0;
      k = n;
      do
        if ((m | 0) == (n | 0)) {
          n = a + 8 | 0;
          l = c[n >> 2] | 0;
          g = a + 12 | 0;
          q = c[g >> 2] | 0;
          f = q;
          if (l >>> 0 >= q >>> 0) {
            q = f - k | 0;
            q = (q | 0) == 0 ? 1 : q >> 1;
            qg(h, q, (q + 3 | 0) >>> 2, c[a + 16 >> 2] | 0);
            c[i >> 2] = c[o >> 2];
            c[j >> 2] = c[n >> 2];
            c[d >> 2] = c[i >> 2];
            c[e >> 2] = c[j >> 2];
            ug(h, d, e);
            d = c[a >> 2] | 0;
            c[a >> 2] = c[h >> 2];
            c[h >> 2] = d;
            d = h + 4 | 0;
            q = c[o >> 2] | 0;
            c[o >> 2] = c[d >> 2];
            c[d >> 2] = q;
            d = h + 8 | 0;
            q = c[n >> 2] | 0;
            c[n >> 2] = c[d >> 2];
            c[d >> 2] = q;
            d = h + 12 | 0;
            q = c[g >> 2] | 0;
            c[g >> 2] = c[d >> 2];
            c[d >> 2] = q;
            tg(h);
            d = c[o >> 2] | 0;
            break
          }
          e = l;
          a = ((f - e >> 2) + 1 | 0) / 2 | 0;
          f = l + (a << 2) | 0;
          e = e - m | 0;
          d = f + (0 - (e >> 2) << 2) | 0;
          if (!e) {
            d = f;
            e = f
          } else {
            vr(d | 0, m | 0, e | 0) | 0;
            e = (c[n >> 2] | 0) + (a << 2) | 0
          }
          c[o >> 2] = d;
          c[n >> 2] = e
        } else d = m; while (0);
      c[d + -4 >> 2] = c[b >> 2];
      c[o >> 2] = (c[o >> 2] | 0) + -4;
      V = p;
      return
    }

    function tg(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = c[a + 4 >> 2] | 0;
      d = a + 8 | 0;
      e = c[d >> 2] | 0;
      if ((e | 0) != (b | 0)) c[d >> 2] = e + (~((e + -4 - b | 0) >>> 2) << 2);
      b = c[a >> 2] | 0;
      if (b | 0) Da(b, (c[a + 12 >> 2] | 0) - b | 0);
      return
    }

    function ug(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0;
      h = V;
      V = V + 16 | 0;
      g = h;
      f = c[b >> 2] | 0;
      vg(g, a + 8 | 0, (c[d >> 2] | 0) - f >> 2);
      a = c[g >> 2] | 0;
      e = g + 4 | 0;
      if ((a | 0) != (c[e >> 2] | 0)) {
        d = f;
        do {
          c[a >> 2] = c[d >> 2];
          a = (c[g >> 2] | 0) + 4 | 0;
          c[g >> 2] = a;
          d = d + 4 | 0
        } while ((a | 0) != (c[e >> 2] | 0));
        c[b >> 2] = d
      }
      wg(g);
      V = h;
      return
    }

    function vg(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = c[b >> 2];
      c[a + 4 >> 2] = (c[b >> 2] | 0) + (d << 2);
      c[a + 8 >> 2] = b;
      return
    }

    function wg(a) {
      a = a | 0;
      c[c[a + 8 >> 2] >> 2] = c[a >> 2];
      return
    }

    function xg(a, b) {
      a = a | 0;
      b = b | 0;
      return (c[a + 4 >> 2] | 0) == (c[b + 4 >> 2] | 0) | 0
    }

    function yg(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = b;
      c[a + 4 >> 2] = d;
      return
    }

    function zg(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0;
      g = c[b + 4 >> 2] | 0;
      d = c[b + 16 >> 2] | 0;
      e = (d >>> 0) / 93 | 0;
      f = g + (e << 2) | 0;
      if ((c[b + 8 >> 2] | 0) == (g | 0)) b = 0;
      else b = (c[f >> 2] | 0) + ((d - (e * 93 | 0) | 0) * 44 | 0) | 0;
      c[a >> 2] = f;
      c[a + 4 >> 2] = b;
      return
    }

    function Ag(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0;
      d = (c[b + 16 >> 2] | 0) + (c[b + 20 >> 2] | 0) | 0;
      g = c[b + 4 >> 2] | 0;
      e = (d >>> 0) / 93 | 0;
      f = g + (e << 2) | 0;
      if ((c[b + 8 >> 2] | 0) == (g | 0)) b = 0;
      else b = (c[f >> 2] | 0) + ((d - (e * 93 | 0) | 0) * 44 | 0) | 0;
      c[a >> 2] = f;
      c[a + 4 >> 2] = b;
      return
    }

    function Bg(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0;
      i = V;
      V = V + 16 | 0;
      e = i + 8 | 0;
      g = i;
      Cg(e, a);
      fg(g, a);
      f = e + 4 | 0;
      b = c[f >> 2] | 0;
      g = g + 4 | 0;
      if ((b | 0) != (c[g >> 2] | 0))
        do {
          Ic(b);
          b = (c[f >> 2] | 0) + 44 | 0;
          c[f >> 2] = b;
          d = c[e >> 2] | 0;
          if ((b - (c[d >> 2] | 0) | 0) == 4092) {
            b = d + 4 | 0;
            c[e >> 2] = b;
            b = c[b >> 2] | 0;
            c[f >> 2] = b
          }
        } while ((b | 0) != (c[g >> 2] | 0));
      c[a + 20 >> 2] = 0;
      f = a + 8 | 0;
      e = a + 4 | 0;
      d = c[e >> 2] | 0;
      b = (c[f >> 2] | 0) - d >> 2;
      if (b >>> 0 > 2)
        do {
          Da(c[d >> 2] | 0, 4092);
          d = (c[e >> 2] | 0) + 4 | 0;
          c[e >> 2] = d;
          b = (c[f >> 2] | 0) - d >> 2
        } while (b >>> 0 > 2);
      switch (b | 0) {
      case 1: {
        b = 46;
        h = 11;
        break
      }
      case 2: {
        b = 93;
        h = 11;
        break
      }
      default: {}
      }
      if ((h | 0) == 11) c[a + 16 >> 2] = b;
      V = i;
      return
    }

    function Cg(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0;
      g = c[b + 4 >> 2] | 0;
      d = c[b + 16 >> 2] | 0;
      e = (d >>> 0) / 93 | 0;
      f = g + (e << 2) | 0;
      if ((c[b + 8 >> 2] | 0) == (g | 0)) b = 0;
      else b = (c[f >> 2] | 0) + ((d - (e * 93 | 0) | 0) * 44 | 0) | 0;
      c[a >> 2] = f;
      c[a + 4 >> 2] = b;
      return
    }

    function Dg(b, e, f) {
      b = b | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0;
      m = V;
      V = V + 16 | 0;
      l = m;
      j = b + 4 | 0;
      if (!(a[j >> 0] | 0)) {
        l = De(e) | 0;
        Ee(l, f, c[b >> 2] | 0);
        l = c[b >> 2] | 0;
        i = f + l | 0;
        if (!l) g = 0;
        else {
          g = f;
          h = c[b + 8 >> 2] | 0;
          while (1) {
            a[h >> 0] = a[g >> 0] | 0;
            g = g + 1 | 0;
            if ((g | 0) == (i | 0)) break;
            else h = h + 1 | 0
          }
          g = c[b >> 2] | 0
        }
        a[j >> 0] = 1;
        f = f + g | 0
      } else {
        h = c[b + 20 >> 2] | 0;
        g = c[b + 8 >> 2] | 0;
        Cg(l, b + 32 | 0);
        b = b + 12 | 0;
        if ((g | 0) != (c[b >> 2] | 0)) {
          k = l + 4 | 0;
          j = g;
          i = h;
          g = c[k >> 2] | 0;
          while (1) {
            h = d[j >> 0] | 0;
            h = Eg((Zc(e, g) | 0) + h | 0) | 0;
            a[i >> 0] = h;
            a[f >> 0] = h;
            a[j >> 0] = h;
            j = j + 1 | 0;
            f = f + 1 | 0;
            h = c[l >> 2] | 0;
            g = (c[k >> 2] | 0) + 44 | 0;
            c[k >> 2] = g;
            if ((g - (c[h >> 2] | 0) | 0) == 4092) {
              g = h + 4 | 0;
              c[l >> 2] = g;
              g = c[g >> 2] | 0;
              c[k >> 2] = g
            }
            if ((j | 0) == (c[b >> 2] | 0)) break;
            else i = i + 1 | 0
          }
        }
      }
      V = m;
      return f | 0
    }

    function Eg(a) {
      a = a | 0;
      return a & 255 | 0
    }

    function Fg(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Gg(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 4 >> 2] & 255](a);
      return
    }

    function Hg(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 11262 ? a + 12 | 0 : 0) | 0
    }

    function Ig(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Jg(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = 0;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = 0;
      if (b | 0) {
        Yf(a, b);
        Lg(a, b)
      }
      return
    }

    function Kg(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = 0;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = 0;
      c[a + 12 >> 2] = 0;
      c[a + 16 >> 2] = 0;
      c[a + 20 >> 2] = 0;
      if (b | 0) Mg(a, b, d);
      return
    }

    function Lg(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0;
      g = V;
      V = V + 16 | 0;
      f = g;
      ag(f, b, d);
      d = f + 4 | 0;
      b = c[d >> 2] | 0;
      e = f + 8 | 0;
      if ((b | 0) != (c[e >> 2] | 0))
        do {
          a[b >> 0] = 0;
          b = (c[d >> 2] | 0) + 1 | 0;
          c[d >> 2] = b
        } while ((b | 0) != (c[e >> 2] | 0));
      bg(f);
      V = g;
      return
    }

    function Mg(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;
      o = V;
      V = V + 96 | 0;
      n = o + 80 | 0;
      k = o + 64 | 0;
      h = o + 48 | 0;
      i = o + 40 | 0;
      j = o + 8 | 0;
      f = o;
      l = o + 32 | 0;
      m = o + 16 | 0;
      e = (c[a + 8 >> 2] | 0) - (c[a + 4 >> 2] | 0) | 0;
      e = ((e | 0) == 0 ? 0 : ((e >> 2) * 93 | 0) + -1 | 0) - ((c[a + 20 >> 2] | 0) + (c[a + 16 >> 2] | 0)) | 0;
      if (e >>> 0 < b >>> 0) eg(a, b - e | 0);
      fg(i, a);
      fg(f, a);
      e = c[f >> 2] | 0;
      f = c[f + 4 >> 2] | 0;
      g = j;
      c[g >> 2] = e;
      c[g + 4 >> 2] = f;
      g = e;
      if (b | 0) {
        e = ((f - (c[e >> 2] | 0) | 0) / 44 | 0) + b | 0;
        if ((e | 0) > 0) {
          b = (e >>> 0) / 93 | 0;
          g = g + (b << 2) | 0;
          c[j >> 2] = g;
          e = (c[g >> 2] | 0) + ((e - (b * 93 | 0) | 0) * 44 | 0) | 0
        } else {
          e = 92 - e | 0;
          b = g + (((e | 0) / -93 | 0) << 2) | 0;
          c[j >> 2] = b;
          e = (c[b >> 2] | 0) + ((92 - ((e | 0) % 93 | 0) | 0) * 44 | 0) | 0
        }
        c[j + 4 >> 2] = e
      };
      c[k >> 2] = c[i >> 2];
      c[k + 4 >> 2] = c[i + 4 >> 2];
      c[n >> 2] = c[j >> 2];
      c[n + 4 >> 2] = c[j + 4 >> 2];
      gg(h, k, n);
      hg(n, h);
      ig(k, h);
      if (jg(n, k) | 0) {
        f = m + 4 | 0;
        do {
          kg(l, n);
          lg(m, a, l);
          e = c[m >> 2] | 0;
          if ((e | 0) != (c[f >> 2] | 0))
            do {
              Wc(e, d);
              e = (c[m >> 2] | 0) + 44 | 0;
              c[m >> 2] = e
            } while ((e | 0) != (c[f >> 2] | 0));
          mg(m);
          ng(n) | 0
        } while (jg(n, k) | 0)
      }
      V = o;
      return
    }

    function Ng(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      Bg(a);
      b = c[a + 4 >> 2] | 0;
      d = c[a + 8 >> 2] | 0;
      if ((b | 0) != (d | 0))
        do {
          Da(c[b >> 2] | 0, 4092);
          b = b + 4 | 0
        } while ((b | 0) != (d | 0));
      dg(a);
      return
    }

    function Og(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      Md(a);
      c[a >> 2] = 4924;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = d;
      return
    }

    function Pg(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 4944;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Wg(a, e);
      V = d;
      return
    }

    function Qg(a, b) {
      a = a | 0;
      b = b | 0;
      return Tg(c[a + 8 >> 2] | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function Rg(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      c[a >> 2] = 4924;
      d = a + 8 | 0;
      b = c[d >> 2] | 0;
      c[d >> 2] = 0;
      if (b | 0) {
        Vg(b);
        jp(b)
      }
      Qd(a);
      return
    }

    function Sg(a) {
      a = a | 0;
      Rg(a);
      jp(a);
      return
    }

    function Tg(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return Ug(a + 4784 | 0, b, Be(a, b, c) | 0) | 0
    }

    function Ug(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      if (a[b >> 0] | 0) {
        nc(c);
        a[b >> 0] = 0
      }
      return d | 0
    }

    function Vg(a) {
      a = a | 0;
      ze(a);
      return
    }

    function Wg(a, b) {
      a = a | 0;
      b = b | 0;
      return
    }

    function Xg(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Yg(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
      return
    }

    function Zg(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 12004 ? a + 12 | 0 : 0) | 0
    }

    function _g(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function $g(b) {
      b = b | 0;
      a[b >> 0] = 1;
      return
    }

    function ah(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      Md(a);
      c[a >> 2] = 4972;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = d;
      return
    }

    function bh(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 4992;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Wg(a, e);
      V = d;
      return
    }

    function ch(a, b) {
      a = a | 0;
      b = b | 0;
      return fh(c[a + 8 >> 2] | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function dh(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      c[a >> 2] = 4972;
      d = a + 8 | 0;
      b = c[d >> 2] | 0;
      c[d >> 2] = 0;
      if (b | 0) {
        hh(b);
        jp(b)
      }
      Qd(a);
      return
    }

    function eh(a) {
      a = a | 0;
      dh(a);
      jp(a);
      return
    }

    function fh(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return gh(a + 4784 | 0, b, Be(a, b, c) | 0) | 0
    }

    function gh(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return Ug(a + 328 | 0, b, qf(a, b, c) | 0) | 0
    }

    function hh(a) {
      a = a | 0;
      ih(a + 4784 | 0);
      ze(a);
      return
    }

    function ih(a) {
      a = a | 0; of (a);
      return
    }

    function jh(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function kh(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
      return
    }

    function lh(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 12827 ? a + 12 | 0 : 0) | 0
    }

    function mh(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function nh(a) {
      a = a | 0;
      cf(a);
      $g(a + 328 | 0);
      return
    }

    function oh(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      Md(a);
      c[a >> 2] = 5020;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = d;
      return
    }

    function ph(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5040;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Wg(a, e);
      V = d;
      return
    }

    function qh(a, b) {
      a = a | 0;
      b = b | 0;
      return th(c[a + 8 >> 2] | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function rh(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      c[a >> 2] = 5020;
      d = a + 8 | 0;
      b = c[d >> 2] | 0;
      c[d >> 2] = 0;
      if (b | 0) {
        vh(b);
        jp(b)
      }
      Qd(a);
      return
    }

    function sh(a) {
      a = a | 0;
      rh(a);
      jp(a);
      return
    }

    function th(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return uh(a + 4784 | 0, b, Be(a, b, c) | 0) | 0
    }

    function uh(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return Ug(a + 316 | 0, b, If(a, b, c) | 0) | 0
    }

    function vh(a) {
      a = a | 0;
      wh(a + 4784 | 0);
      ze(a);
      return
    }

    function wh(a) {
      a = a | 0;
      Hf(a);
      return
    }

    function xh(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function yh(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
      return
    }

    function zh(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 13672 ? a + 12 | 0 : 0) | 0
    }

    function Ah(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Bh(a) {
      a = a | 0;
      Cf(a);
      $g(a + 316 | 0);
      return
    }

    function Ch(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      Md(a);
      c[a >> 2] = 5068;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = d;
      return
    }

    function Dh(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5088;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Wg(a, e);
      V = d;
      return
    }

    function Eh(a, b) {
      a = a | 0;
      b = b | 0;
      return Hh(c[a + 8 >> 2] | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function Fh(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      c[a >> 2] = 5068;
      d = a + 8 | 0;
      b = c[d >> 2] | 0;
      c[d >> 2] = 0;
      if (b | 0) {
        Jh(b);
        jp(b)
      }
      Qd(a);
      return
    }

    function Gh(a) {
      a = a | 0;
      Fh(a);
      jp(a);
      return
    }

    function Hh(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return Ih(a + 4784 | 0, b, Be(a, b, c) | 0) | 0
    }

    function Ih(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return uh(a + 328 | 0, b, qf(a, b, c) | 0) | 0
    }

    function Jh(a) {
      a = a | 0;
      Kh(a + 4784 | 0);
      ze(a);
      return
    }

    function Kh(a) {
      a = a | 0;
      wh(a + 328 | 0); of (a);
      return
    }

    function Lh(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Mh(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
      return
    }

    function Nh(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 14573 ? a + 12 | 0 : 0) | 0
    }

    function Oh(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Ph(a) {
      a = a | 0;
      cf(a);
      Bh(a + 328 | 0);
      return
    }

    function Qh(a) {
      a = a | 0;
      return a + 20 | 0
    }

    function Rh(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = b;
      c[a + 4 >> 2] = d;
      c[a + 8 >> 2] = 0;
      return
    }

    function Sh(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = b;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = -1;
      return
    }

    function Th(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0;
      d = V;
      V = V + 16 | 0;
      e = d + 4 | 0;
      g = d;
      f = eq(24) | 0;
      ii(f, b);
      c[g >> 2] = 0;
      c[e >> 2] = c[g >> 2];
      ji(a, f, e);
      V = d;
      return
    }

    function Uh(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      a = c[a + 4 >> 2] | 0;
      if (a | 0 ? (d = a + 4 | 0, b = c[d >> 2] | 0, c[d >> 2] = b + -1, (b | 0) == 0) : 0) {
        ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
        qq(a)
      }
      return
    }

    function Vh(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5116;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xh(a, e);
      V = d;
      return
    }

    function Wh(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      a = c[a + 4 >> 2] | 0;
      if (a | 0 ? (d = a + 4 | 0, b = c[d >> 2] | 0, c[d >> 2] = b + -1, (b | 0) == 0) : 0) {
        ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
        qq(a)
      }
      return
    }

    function Xh(a, b) {
      a = a | 0;
      b = b | 0;
      return
    }

    function Yh(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Zh(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) jp(a);
      return
    }

    function _h(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 14966 ? a + 12 | 0 : 0) | 0
    }

    function $h(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function ai(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5144;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      ci(a, e);
      V = d;
      return
    }

    function bi(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      a = c[a + 4 >> 2] | 0;
      if (a | 0 ? (d = a + 4 | 0, b = c[d >> 2] | 0, c[d >> 2] = b + -1, (b | 0) == 0) : 0) {
        ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
        qq(a)
      }
      return
    }

    function ci(a, b) {
      a = a | 0;
      b = b | 0;
      return
    }

    function di(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function ei(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) {
        hi(a);
        jp(a)
      }
      return
    }

    function fi(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 15127 ? a + 12 | 0 : 0) | 0
    }

    function gi(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function hi(a) {
      a = a | 0;
      return
    }

    function ii(b, d) {
      b = b | 0;
      d = d | 0;
      Md(b);
      c[b >> 2] = 5172;
      c[b + 4 >> 2] = d;
      c[b + 8 >> 2] = 0;
      c[b + 12 >> 2] = 0;
      c[b + 16 >> 2] = 0;
      a[b + 20 >> 0] = 1;
      return
    }

    function ji(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5192;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      pi(a, e);
      V = d;
      return
    }

    function ki(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      k = V;
      V = V + 16 | 0;
      h = k;
      e = c[b + 8 >> 2] | 0;
      i = c[b + 12 >> 2] | 0;
      if ((e | 0) != (i | 0)) {
        j = h + 4 | 0;
        do {
          f = c[e >> 2] | 0;
          c[h >> 2] = f;
          g = c[e + 4 >> 2] | 0;
          c[j >> 2] = g;
          if (g | 0) {
            g = g + 4 | 0;
            c[g >> 2] = (c[g >> 2] | 0) + 1
          }
          d = $[c[(c[f >> 2] | 0) + 12 >> 2] & 63](f, d) | 0;
          Sd(h);
          e = e + 8 | 0
        } while ((e | 0) != (i | 0))
      }
      e = b + 20 | 0;
      if (a[e >> 0] | 0) {
        a[e >> 0] = 0;
        ni(c[b + 4 >> 2] | 0)
      }
      V = k;
      return d | 0
    }

    function li(a) {
      a = a | 0;
      c[a >> 2] = 5172;
      Td(a + 8 | 0);
      Qd(a);
      return
    }

    function mi(a) {
      a = a | 0;
      li(a);
      jp(a);
      return
    }

    function ni(a) {
      a = a | 0;
      var b = 0;
      b = ((oi(c[a >> 2] | 0) | 0) & 255) << 24;
      b = ((oi(c[a >> 2] | 0) | 0) & 255) << 16 | b;
      b = b | ((oi(c[a >> 2] | 0) | 0) & 255) << 8;
      c[a + 4 >> 2] = b | (oi(c[a >> 2] | 0) | 0) & 255;
      return
    }

    function oi(b) {
      b = b | 0;
      var d = 0,
        e = 0;
      d = c[b >> 2] | 0;
      e = b + 8 | 0;
      b = c[e >> 2] | 0;
      c[e >> 2] = b + 1;
      return a[d + b >> 0] | 0
    }

    function pi(a, b) {
      a = a | 0;
      b = b | 0;
      return
    }

    function qi(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function ri(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 8 >> 2] & 255](a);
      return
    }

    function si(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 15450 ? a + 12 | 0 : 0) | 0
    }

    function ti(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function ui(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      j = V;
      V = V + 32 | 0;
      e = j + 12 | 0;
      f = j;
      b = j + 8 | 0;
      h = eq(180) | 0;
      wi(h, c[a + 4 >> 2] | 0);
      g = a + 8 | 0;
      c[b >> 2] = 0;
      c[e >> 2] = c[b >> 2];
      xi(f, h, e);
      h = a + 12 | 0;
      b = c[h >> 2] | 0;
      i = a + 16 | 0;
      do
        if (b >>> 0 >= (c[i >> 2] | 0) >>> 0) {
          b = (b - (c[g >> 2] | 0) >> 3) + 1 | 0;
          d = ee(g) | 0;
          if (d >>> 0 < b >>> 0) cr(g);
          else {
            k = c[g >> 2] | 0;
            l = (c[i >> 2] | 0) - k | 0;
            i = l >> 2;
            be(e, l >> 3 >>> 0 < d >>> 1 >>> 0 ? (i >>> 0 < b >>> 0 ? b : i) : d, (c[h >> 2] | 0) - k >> 3, a + 16 | 0);
            i = e + 8 | 0;
            h = c[i >> 2] | 0;
            c[h >> 2] = c[f >> 2];
            a = f + 4 | 0;
            c[h + 4 >> 2] = c[a >> 2];
            c[f >> 2] = 0;
            c[a >> 2] = 0;
            c[i >> 2] = h + 8;
            ce(g, e);
            de(e);
            break
          }
        } else {
          $d(e, g, 1);
          l = e + 4 | 0;
          k = c[l >> 2] | 0;
          c[k >> 2] = c[f >> 2];
          i = f + 4 | 0;
          c[k + 4 >> 2] = c[i >> 2];
          c[f >> 2] = 0;
          c[i >> 2] = 0;
          c[l >> 2] = k + 8;
          ae(e)
        } while (0);
      Sd(f);
      V = j;
      return
    }

    function vi(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      j = V;
      V = V + 32 | 0;
      e = j + 12 | 0;
      f = j;
      b = j + 8 | 0;
      h = eq(180) | 0;
      Ui(h, c[a + 4 >> 2] | 0);
      g = a + 8 | 0;
      c[b >> 2] = 0;
      c[e >> 2] = c[b >> 2];
      Vi(f, h, e);
      h = a + 12 | 0;
      b = c[h >> 2] | 0;
      i = a + 16 | 0;
      do
        if (b >>> 0 >= (c[i >> 2] | 0) >>> 0) {
          b = (b - (c[g >> 2] | 0) >> 3) + 1 | 0;
          d = ee(g) | 0;
          if (d >>> 0 < b >>> 0) cr(g);
          else {
            k = c[g >> 2] | 0;
            l = (c[i >> 2] | 0) - k | 0;
            i = l >> 2;
            be(e, l >> 3 >>> 0 < d >>> 1 >>> 0 ? (i >>> 0 < b >>> 0 ? b : i) : d, (c[h >> 2] | 0) - k >> 3, a + 16 | 0);
            i = e + 8 | 0;
            h = c[i >> 2] | 0;
            c[h >> 2] = c[f >> 2];
            a = f + 4 | 0;
            c[h + 4 >> 2] = c[a >> 2];
            c[f >> 2] = 0;
            c[a >> 2] = 0;
            c[i >> 2] = h + 8;
            ce(g, e);
            de(e);
            break
          }
        } else {
          $d(e, g, 1);
          l = e + 4 | 0;
          k = c[l >> 2] | 0;
          c[k >> 2] = c[f >> 2];
          i = f + 4 | 0;
          c[k + 4 >> 2] = c[i >> 2];
          c[f >> 2] = 0;
          c[i >> 2] = 0;
          c[l >> 2] = k + 8;
          ae(e)
        } while (0);
      Sd(f);
      V = j;
      return
    }

    function wi(a, b) {
      a = a | 0;
      b = b | 0;
      fe(a);
      c[a >> 2] = 5220;
      c[a + 4 >> 2] = b;
      yi(a + 8 | 0);
      return
    }

    function xi(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5244;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xe(a, e);
      V = d;
      return
    }

    function yi(b) {
      b = b | 0;
      xe(b, 32, 1, 8, 0);
      mc(b + 80 | 0, 32, 1, 8, 0);
      a[b + 160 >> 0] = 0;
      a[b + 161 >> 0] = 0;
      Ci(b + 164 | 0);
      return
    }

    function zi(a) {
      a = a | 0;
      c[a >> 2] = 5220;
      Di(a + 8 | 0);
      le(a);
      return
    }

    function Ai(a) {
      a = a | 0;
      zi(a);
      jp(a);
      return
    }

    function Bi(a, b) {
      a = a | 0;
      b = b | 0;
      return Ei(a + 8 | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function Ci(b) {
      b = b | 0;
      a[b + 4 >> 0] = 0;
      return
    }

    function Di(a) {
      a = a | 0;
      qc(a + 80 | 0);
      ye(a);
      return
    }

    function Ei(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0;
      h = V;
      V = V + 16 | 0;
      f = h;
      if (!(a[b + 161 >> 0] | 0)) oc(b + 80 | 0);
      g = b + 164 | 0;
      if (Fi(g) | 0) {
        d = Gi(b + 80 | 0, d, c[g >> 2] | 0, 0) | 0;
        c[f >> 2] = d;
        Se(d, e)
      } else {
        Ii(Hi(d) | 0, e, 4);
        c[f >> 2] = Ne(e) | 0
      }
      Ji(g, f);
      V = h;
      return e + 4 | 0
    }

    function Fi(b) {
      b = b | 0;
      return (a[b + 4 >> 0] | 0) != 0 | 0
    }

    function Gi(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      d = (Ki(a, b, (c[a + 36 >> 2] | 0) + (e * 44 | 0) | 0) | 0) + d | 0;
      b = c[a + 24 >> 2] | 0;
      if ((d | 0) < 0) return d + b | 0;
      else return d - (d >>> 0 < b >>> 0 ? 0 : b) | 0;
      return 0
    }

    function Hi(a) {
      a = a | 0;
      return c[a >> 2] | 0
    }

    function Ii(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0;
      if ((d | 0) > 0) {
        e = 0;
        do {
          a[c + e >> 0] = oi(b) | 0;
          e = e + 1 | 0
        } while ((e | 0) != (d | 0))
      }
      return
    }

    function Ji(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0;
      e = b + 4 | 0;
      if (!(a[e >> 0] | 0)) a[e >> 0] = 1;
      c[b >> 2] = c[d >> 2];
      return
    }

    function Ki(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0;
      d = Li(b, d) | 0;
      c[a >> 2] = d;
      do
        if (d) {
          if (d >>> 0 >= 32) {
            d = c[a + 28 >> 2] | 0;
            break
          }
          e = c[a + 12 >> 2] | 0;
          if (d >>> 0 > e >>> 0) {
            e = d - e | 0;
            d = Li(b, (c[a + 68 >> 2] | 0) + ((d + -1 | 0) * 44 | 0) | 0) | 0;
            e = d << e | (Mi(b, e) | 0)
          } else e = Li(b, (c[a + 68 >> 2] | 0) + ((d + -1 | 0) * 44 | 0) | 0) | 0;
          d = c[a >> 2] | 0;
          if ((e | 0) < (1 << d + -1 | 0)) {
            d = e + 1 + (-1 << d) | 0;
            break
          } else {
            d = e + 1 | 0;
            break
          }
        } else d = Ni(b, a + 48 | 0) | 0; while (0);
      return d | 0
    }

    function Li(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;
      n = a + 8 | 0;
      m = c[n >> 2] | 0;
      f = c[b + 16 >> 2] | 0;
      if (f) {
        e = a + 4 | 0;
        d = c[e >> 2] | 0;
        l = m >>> 15;
        c[n >> 2] = l;
        j = (d >>> 0) / (l >>> 0) | 0;
        i = j >>> (c[b + 40 >> 2] | 0);
        g = c[f + (i << 2) >> 2] | 0;
        i = (c[f + (i + 1 << 2) >> 2] | 0) + 1 | 0;
        h = g + 1 | 0;
        k = c[b + 8 >> 2] | 0;
        if (i >>> 0 > h >>> 0) {
          f = g;
          g = i;
          do {
            h = (g + f | 0) >>> 1;
            i = (c[k + (h << 2) >> 2] | 0) >>> 0 > j >>> 0;
            f = i ? f : h;
            g = i ? h : g;
            h = f + 1 | 0
          } while (g >>> 0 > h >>> 0);
          g = f
        }
        f = q(c[k + (g << 2) >> 2] | 0, l) | 0;
        if ((g | 0) == (c[b + 32 >> 2] | 0)) h = m;
        else h = q(c[k + (h << 2) >> 2] | 0, l) | 0
      } else {
        k = m >>> 15;
        c[n >> 2] = k;
        i = c[b >> 2] | 0;
        l = c[b + 8 >> 2] | 0;
        e = a + 4 | 0;
        d = c[e >> 2] | 0;
        j = i >>> 1;
        f = 0;
        h = m;
        g = 0;
        do {
          o = q(c[l + (j << 2) >> 2] | 0, k) | 0;
          m = o >>> 0 > d >>> 0;
          h = m ? o : h;
          f = m ? f : o;
          g = m ? g : j;
          i = m ? j : i;
          j = (g + i | 0) >>> 1
        } while ((j | 0) != (g | 0))
      }
      c[e >> 2] = d - f;
      o = h - f | 0;
      c[n >> 2] = o;
      if (o >>> 0 < 16777216) Oi(a);
      n = (c[b + 12 >> 2] | 0) + (g << 2) | 0;
      c[n >> 2] = (c[n >> 2] | 0) + 1;
      n = b + 28 | 0;
      o = (c[n >> 2] | 0) + -1 | 0;
      c[n >> 2] = o;
      if (!o) Xc(b);
      return g | 0
    }

    function Mi(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0;
      if (b >>> 0 > 19) {
        d = (Pi(a) | 0) & 65535;
        return (Mi(a, b + -16 | 0) | 0) << 16 | d | 0
      }
      e = a + 4 | 0;
      f = c[e >> 2] | 0;
      g = a + 8 | 0;
      d = (c[g >> 2] | 0) >>> b;
      c[g >> 2] = d;
      b = (f >>> 0) / (d >>> 0) | 0;
      c[e >> 2] = f - (q(b, d) | 0);
      if (d >>> 0 < 16777216) Oi(a);
      return b | 0
    }

    function Ni(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0;
      e = a + 8 | 0;
      f = c[e >> 2] | 0;
      d = q(f >>> 13, c[b + 8 >> 2] | 0) | 0;
      g = a + 4 | 0;
      h = c[g >> 2] | 0;
      i = h >>> 0 >= d >>> 0;
      if (i) {
        c[g >> 2] = h - d;
        d = f - d | 0;
        c[e >> 2] = d
      } else {
        c[e >> 2] = d;
        h = b + 12 | 0;
        c[h >> 2] = (c[h >> 2] | 0) + 1
      }
      if (d >>> 0 < 16777216) Oi(a);
      h = b + 4 | 0;
      a = (c[h >> 2] | 0) + -1 | 0;
      c[h >> 2] = a;
      if (!a) cd(b);
      return i & 1 | 0
    }

    function Oi(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      b = a + 4 | 0;
      d = a + 8 | 0;
      e = c[b >> 2] | 0;
      do {
        e = e << 8 | (oi(c[a >> 2] | 0) | 0) & 255;
        c[b >> 2] = e;
        f = c[d >> 2] << 8;
        c[d >> 2] = f
      } while (f >>> 0 < 16777216);
      return
    }

    function Pi(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      d = a + 4 | 0;
      f = c[d >> 2] | 0;
      b = a + 8 | 0;
      e = (c[b >> 2] | 0) >>> 16;
      c[b >> 2] = e;
      b = (f >>> 0) / (e >>> 0) | 0;
      c[d >> 2] = f - (q(b, e) | 0);
      Oi(a);
      return b & 65535 | 0
    }

    function Qi(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Ri(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 4 >> 2] & 255](a);
      return
    }

    function Si(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 15904 ? a + 12 | 0 : 0) | 0
    }

    function Ti(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Ui(a, b) {
      a = a | 0;
      b = b | 0;
      fe(a);
      c[a >> 2] = 5272;
      c[a + 4 >> 2] = b;
      Wi(a + 8 | 0);
      return
    }

    function Vi(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5296;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xe(a, e);
      V = d;
      return
    }

    function Wi(b) {
      b = b | 0;
      xe(b, 32, 1, 8, 0);
      mc(b + 80 | 0, 32, 1, 8, 0);
      a[b + 160 >> 0] = 0;
      a[b + 161 >> 0] = 0;
      _i(b + 164 | 0);
      return
    }

    function Xi(a) {
      a = a | 0;
      c[a >> 2] = 5272;
      $i(a + 8 | 0);
      le(a);
      return
    }

    function Yi(a) {
      a = a | 0;
      Xi(a);
      jp(a);
      return
    }

    function Zi(a, b) {
      a = a | 0;
      b = b | 0;
      return aj(a + 8 | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function _i(b) {
      b = b | 0;
      a[b + 4 >> 0] = 0;
      return
    }

    function $i(a) {
      a = a | 0;
      qc(a + 80 | 0);
      ye(a);
      return
    }

    function aj(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0;
      h = V;
      V = V + 16 | 0;
      f = h;
      if (!(a[b + 161 >> 0] | 0)) oc(b + 80 | 0);
      g = b + 164 | 0;
      if (bj(g) | 0) {
        d = Gi(b + 80 | 0, d, c[g >> 2] | 0, 0) | 0;
        c[f >> 2] = d;
        We(d, e)
      } else {
        Ii(Hi(d) | 0, e, 4);
        c[f >> 2] = Re(e) | 0
      }
      cj(g, f);
      V = h;
      return e + 4 | 0
    }

    function bj(b) {
      b = b | 0;
      return (a[b + 4 >> 0] | 0) != 0 | 0
    }

    function cj(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0;
      e = b + 4 | 0;
      if (!(a[e >> 0] | 0)) a[e >> 0] = 1;
      c[b >> 2] = c[d >> 2];
      return
    }

    function dj(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function ej(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 4 >> 2] & 255](a);
      return
    }

    function fj(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 16402 ? a + 12 | 0 : 0) | 0
    }

    function gj(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function hj(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      j = V;
      V = V + 32 | 0;
      e = j + 12 | 0;
      f = j;
      b = j + 8 | 0;
      h = eq(172) | 0;
      jj(h, c[a + 4 >> 2] | 0);
      g = a + 8 | 0;
      c[b >> 2] = 0;
      c[e >> 2] = c[b >> 2];
      kj(f, h, e);
      h = a + 12 | 0;
      b = c[h >> 2] | 0;
      i = a + 16 | 0;
      do
        if (b >>> 0 >= (c[i >> 2] | 0) >>> 0) {
          b = (b - (c[g >> 2] | 0) >> 3) + 1 | 0;
          d = ee(g) | 0;
          if (d >>> 0 < b >>> 0) cr(g);
          else {
            k = c[g >> 2] | 0;
            l = (c[i >> 2] | 0) - k | 0;
            i = l >> 2;
            be(e, l >> 3 >>> 0 < d >>> 1 >>> 0 ? (i >>> 0 < b >>> 0 ? b : i) : d, (c[h >> 2] | 0) - k >> 3, a + 16 | 0);
            i = e + 8 | 0;
            h = c[i >> 2] | 0;
            c[h >> 2] = c[f >> 2];
            a = f + 4 | 0;
            c[h + 4 >> 2] = c[a >> 2];
            c[f >> 2] = 0;
            c[a >> 2] = 0;
            c[i >> 2] = h + 8;
            ce(g, e);
            de(e);
            break
          }
        } else {
          $d(e, g, 1);
          l = e + 4 | 0;
          k = c[l >> 2] | 0;
          c[k >> 2] = c[f >> 2];
          i = f + 4 | 0;
          c[k + 4 >> 2] = c[i >> 2];
          c[f >> 2] = 0;
          c[i >> 2] = 0;
          c[l >> 2] = k + 8;
          ae(e)
        } while (0);
      Sd(f);
      V = j;
      return
    }

    function ij(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      j = V;
      V = V + 32 | 0;
      e = j + 12 | 0;
      f = j;
      b = j + 8 | 0;
      h = eq(176) | 0;
      Aj(h, c[a + 4 >> 2] | 0);
      g = a + 8 | 0;
      c[b >> 2] = 0;
      c[e >> 2] = c[b >> 2];
      Bj(f, h, e);
      h = a + 12 | 0;
      b = c[h >> 2] | 0;
      i = a + 16 | 0;
      do
        if (b >>> 0 >= (c[i >> 2] | 0) >>> 0) {
          b = (b - (c[g >> 2] | 0) >> 3) + 1 | 0;
          d = ee(g) | 0;
          if (d >>> 0 < b >>> 0) cr(g);
          else {
            k = c[g >> 2] | 0;
            l = (c[i >> 2] | 0) - k | 0;
            i = l >> 2;
            be(e, l >> 3 >>> 0 < d >>> 1 >>> 0 ? (i >>> 0 < b >>> 0 ? b : i) : d, (c[h >> 2] | 0) - k >> 3, a + 16 | 0);
            i = e + 8 | 0;
            h = c[i >> 2] | 0;
            c[h >> 2] = c[f >> 2];
            a = f + 4 | 0;
            c[h + 4 >> 2] = c[a >> 2];
            c[f >> 2] = 0;
            c[a >> 2] = 0;
            c[i >> 2] = h + 8;
            ce(g, e);
            de(e);
            break
          }
        } else {
          $d(e, g, 1);
          l = e + 4 | 0;
          k = c[l >> 2] | 0;
          c[k >> 2] = c[f >> 2];
          i = f + 4 | 0;
          c[k + 4 >> 2] = c[i >> 2];
          c[f >> 2] = 0;
          c[i >> 2] = 0;
          c[l >> 2] = k + 8;
          ae(e)
        } while (0);
      Sd(f);
      V = j;
      return
    }

    function jj(a, b) {
      a = a | 0;
      b = b | 0;
      fe(a);
      c[a >> 2] = 5324;
      c[a + 4 >> 2] = b;
      lj(a + 8 | 0);
      return
    }

    function kj(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5348;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xe(a, e);
      V = d;
      return
    }

    function lj(b) {
      b = b | 0;
      xe(b, 8, 1, 8, 0);
      mc(b + 80 | 0, 8, 1, 8, 0);
      a[b + 160 >> 0] = 0;
      a[b + 161 >> 0] = 0;
      pj(b + 162 | 0);
      return
    }

    function mj(a) {
      a = a | 0;
      c[a >> 2] = 5324;
      qj(a + 8 | 0);
      le(a);
      return
    }

    function nj(a) {
      a = a | 0;
      mj(a);
      jp(a);
      return
    }

    function oj(a, b) {
      a = a | 0;
      b = b | 0;
      return rj(a + 8 | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function pj(b) {
      b = b | 0;
      a[b + 1 >> 0] = 0;
      return
    }

    function qj(a) {
      a = a | 0;
      qc(a + 80 | 0);
      ye(a);
      return
    }

    function rj(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0;
      g = V;
      V = V + 16 | 0;
      e = g;
      if (!(a[b + 161 >> 0] | 0)) oc(b + 80 | 0);
      f = b + 162 | 0;
      if (sj(f) | 0) {
        c = (Gi(b + 80 | 0, c, a[f >> 0] | 0, 0) | 0) & 255;
        a[e >> 0] = c;
        tj(c, d)
      } else {
        Ii(Hi(c) | 0, d, 1);
        a[e >> 0] = uj(d) | 0
      }
      vj(f, e);
      V = g;
      return d + 1 | 0
    }

    function sj(b) {
      b = b | 0;
      return (a[b + 1 >> 0] | 0) != 0 | 0
    }

    function tj(b, c) {
      b = b | 0;
      c = c | 0;
      a[c >> 0] = b;
      return
    }

    function uj(b) {
      b = b | 0;
      return a[b >> 0] | 0
    }

    function vj(b, c) {
      b = b | 0;
      c = c | 0;
      var d = 0;
      d = b + 1 | 0;
      if (!(a[d >> 0] | 0)) a[d >> 0] = 1;
      a[b >> 0] = a[c >> 0] | 0;
      return
    }

    function wj(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function xj(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 4 >> 2] & 255](a);
      return
    }

    function yj(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 16900 ? a + 12 | 0 : 0) | 0
    }

    function zj(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Aj(a, b) {
      a = a | 0;
      b = b | 0;
      fe(a);
      c[a >> 2] = 5376;
      c[a + 4 >> 2] = b;
      Cj(a + 8 | 0);
      return
    }

    function Bj(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5400;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xe(a, e);
      V = d;
      return
    }

    function Cj(b) {
      b = b | 0;
      xe(b, 16, 1, 8, 0);
      mc(b + 80 | 0, 16, 1, 8, 0);
      a[b + 160 >> 0] = 0;
      a[b + 161 >> 0] = 0;
      Gj(b + 162 | 0);
      return
    }

    function Dj(a) {
      a = a | 0;
      c[a >> 2] = 5376;
      Hj(a + 8 | 0);
      le(a);
      return
    }

    function Ej(a) {
      a = a | 0;
      Dj(a);
      jp(a);
      return
    }

    function Fj(a, b) {
      a = a | 0;
      b = b | 0;
      return Ij(a + 8 | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function Gj(b) {
      b = b | 0;
      a[b + 2 >> 0] = 0;
      return
    }

    function Hj(a) {
      a = a | 0;
      qc(a + 80 | 0);
      ye(a);
      return
    }

    function Ij(c, d, e) {
      c = c | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0;
      h = V;
      V = V + 16 | 0;
      f = h;
      if (!(a[c + 161 >> 0] | 0)) oc(c + 80 | 0);
      g = c + 162 | 0;
      if (Jj(g) | 0) {
        d = (Gi(c + 80 | 0, d, b[g >> 1] | 0, 0) | 0) & 65535;
        b[f >> 1] = d;
        Kj(d, e)
      } else {
        Ii(Hi(d) | 0, e, 2);
        b[f >> 1] = Lj(e) | 0
      }
      Mj(g, f);
      V = h;
      return e + 2 | 0
    }

    function Jj(b) {
      b = b | 0;
      return (a[b + 2 >> 0] | 0) != 0 | 0
    }

    function Kj(a, b) {
      a = a | 0;
      b = b | 0;
      Te(a, b);
      return
    }

    function Lj(a) {
      a = a | 0;
      return Oe(a) | 0
    }

    function Mj(c, d) {
      c = c | 0;
      d = d | 0;
      var e = 0;
      e = c + 2 | 0;
      if (!(a[e >> 0] | 0)) a[e >> 0] = 1;
      b[c >> 1] = b[d >> 1] | 0;
      return
    }

    function Nj(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function Oj(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 4 >> 2] & 255](a);
      return
    }

    function Pj(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 17398 ? a + 12 | 0 : 0) | 0
    }

    function Qj(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function Rj(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      j = V;
      V = V + 32 | 0;
      e = j + 12 | 0;
      f = j;
      b = j + 8 | 0;
      h = eq(172) | 0;
      Tj(h, c[a + 4 >> 2] | 0);
      g = a + 8 | 0;
      c[b >> 2] = 0;
      c[e >> 2] = c[b >> 2];
      Uj(f, h, e);
      h = a + 12 | 0;
      b = c[h >> 2] | 0;
      i = a + 16 | 0;
      do
        if (b >>> 0 >= (c[i >> 2] | 0) >>> 0) {
          b = (b - (c[g >> 2] | 0) >> 3) + 1 | 0;
          d = ee(g) | 0;
          if (d >>> 0 < b >>> 0) cr(g);
          else {
            k = c[g >> 2] | 0;
            l = (c[i >> 2] | 0) - k | 0;
            i = l >> 2;
            be(e, l >> 3 >>> 0 < d >>> 1 >>> 0 ? (i >>> 0 < b >>> 0 ? b : i) : d, (c[h >> 2] | 0) - k >> 3, a + 16 | 0);
            i = e + 8 | 0;
            h = c[i >> 2] | 0;
            c[h >> 2] = c[f >> 2];
            a = f + 4 | 0;
            c[h + 4 >> 2] = c[a >> 2];
            c[f >> 2] = 0;
            c[a >> 2] = 0;
            c[i >> 2] = h + 8;
            ce(g, e);
            de(e);
            break
          }
        } else {
          $d(e, g, 1);
          l = e + 4 | 0;
          k = c[l >> 2] | 0;
          c[k >> 2] = c[f >> 2];
          i = f + 4 | 0;
          c[k + 4 >> 2] = c[i >> 2];
          c[f >> 2] = 0;
          c[i >> 2] = 0;
          c[l >> 2] = k + 8;
          ae(e)
        } while (0);
      Sd(f);
      V = j;
      return
    }

    function Sj(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      j = V;
      V = V + 32 | 0;
      e = j + 12 | 0;
      f = j;
      b = j + 8 | 0;
      h = eq(176) | 0;
      gk(h, c[a + 4 >> 2] | 0);
      g = a + 8 | 0;
      c[b >> 2] = 0;
      c[e >> 2] = c[b >> 2];
      hk(f, h, e);
      h = a + 12 | 0;
      b = c[h >> 2] | 0;
      i = a + 16 | 0;
      do
        if (b >>> 0 >= (c[i >> 2] | 0) >>> 0) {
          b = (b - (c[g >> 2] | 0) >> 3) + 1 | 0;
          d = ee(g) | 0;
          if (d >>> 0 < b >>> 0) cr(g);
          else {
            k = c[g >> 2] | 0;
            l = (c[i >> 2] | 0) - k | 0;
            i = l >> 2;
            be(e, l >> 3 >>> 0 < d >>> 1 >>> 0 ? (i >>> 0 < b >>> 0 ? b : i) : d, (c[h >> 2] | 0) - k >> 3, a + 16 | 0);
            i = e + 8 | 0;
            h = c[i >> 2] | 0;
            c[h >> 2] = c[f >> 2];
            a = f + 4 | 0;
            c[h + 4 >> 2] = c[a >> 2];
            c[f >> 2] = 0;
            c[a >> 2] = 0;
            c[i >> 2] = h + 8;
            ce(g, e);
            de(e);
            break
          }
        } else {
          $d(e, g, 1);
          l = e + 4 | 0;
          k = c[l >> 2] | 0;
          c[k >> 2] = c[f >> 2];
          i = f + 4 | 0;
          c[k + 4 >> 2] = c[i >> 2];
          c[f >> 2] = 0;
          c[i >> 2] = 0;
          c[l >> 2] = k + 8;
          ae(e)
        } while (0);
      Sd(f);
      V = j;
      return
    }

    function Tj(a, b) {
      a = a | 0;
      b = b | 0;
      fe(a);
      c[a >> 2] = 5428;
      c[a + 4 >> 2] = b;
      Vj(a + 8 | 0);
      return
    }

    function Uj(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5452;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xe(a, e);
      V = d;
      return
    }

    function Vj(b) {
      b = b | 0;
      xe(b, 8, 1, 8, 0);
      mc(b + 80 | 0, 8, 1, 8, 0);
      a[b + 160 >> 0] = 0;
      a[b + 161 >> 0] = 0;
      Zj(b + 162 | 0);
      return
    }

    function Wj(a) {
      a = a | 0;
      c[a >> 2] = 5428;
      _j(a + 8 | 0);
      le(a);
      return
    }

    function Xj(a) {
      a = a | 0;
      Wj(a);
      jp(a);
      return
    }

    function Yj(a, b) {
      a = a | 0;
      b = b | 0;
      return $j(a + 8 | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function Zj(b) {
      b = b | 0;
      a[b + 1 >> 0] = 0;
      return
    }

    function _j(a) {
      a = a | 0;
      qc(a + 80 | 0);
      ye(a);
      return
    }

    function $j(b, c, e) {
      b = b | 0;
      c = c | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0;
      h = V;
      V = V + 16 | 0;
      f = h;
      if (!(a[b + 161 >> 0] | 0)) oc(b + 80 | 0);
      g = b + 162 | 0;
      if (ak(g) | 0) {
        c = (Gi(b + 80 | 0, c, d[g >> 0] | 0, 0) | 0) & 255;
        a[f >> 0] = c;
        Ue(c, e)
      } else {
        Ii(Hi(c) | 0, e, 1);
        a[f >> 0] = Pe(e) | 0
      }
      bk(g, f);
      V = h;
      return e + 1 | 0
    }

    function ak(b) {
      b = b | 0;
      return (a[b + 1 >> 0] | 0) != 0 | 0
    }

    function bk(b, c) {
      b = b | 0;
      c = c | 0;
      var d = 0;
      d = b + 1 | 0;
      if (!(a[d >> 0] | 0)) a[d >> 0] = 1;
      a[b >> 0] = a[c >> 0] | 0;
      return
    }

    function ck(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function dk(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 4 >> 2] & 255](a);
      return
    }

    function ek(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 17896 ? a + 12 | 0 : 0) | 0
    }

    function fk(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function gk(a, b) {
      a = a | 0;
      b = b | 0;
      fe(a);
      c[a >> 2] = 5480;
      c[a + 4 >> 2] = b;
      ik(a + 8 | 0);
      return
    }

    function hk(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      c[a >> 2] = b;
      f = eq(16) | 0;
      c[f + 4 >> 2] = 0;
      c[f + 8 >> 2] = 0;
      c[f >> 2] = 5504;
      c[f + 12 >> 2] = b;
      c[a + 4 >> 2] = f;
      c[e >> 2] = b;
      c[e + 4 >> 2] = b;
      Xe(a, e);
      V = d;
      return
    }

    function ik(b) {
      b = b | 0;
      xe(b, 16, 1, 8, 0);
      mc(b + 80 | 0, 16, 1, 8, 0);
      a[b + 160 >> 0] = 0;
      a[b + 161 >> 0] = 0;
      mk(b + 162 | 0);
      return
    }

    function jk(a) {
      a = a | 0;
      c[a >> 2] = 5480;
      nk(a + 8 | 0);
      le(a);
      return
    }

    function kk(a) {
      a = a | 0;
      jk(a);
      jp(a);
      return
    }

    function lk(a, b) {
      a = a | 0;
      b = b | 0;
      return ok(a + 8 | 0, c[a + 4 >> 2] | 0, b) | 0
    }

    function mk(b) {
      b = b | 0;
      a[b + 2 >> 0] = 0;
      return
    }

    function nk(a) {
      a = a | 0;
      qc(a + 80 | 0);
      ye(a);
      return
    }

    function ok(c, d, f) {
      c = c | 0;
      d = d | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0;
      i = V;
      V = V + 16 | 0;
      g = i;
      if (!(a[c + 161 >> 0] | 0)) oc(c + 80 | 0);
      h = c + 162 | 0;
      if (pk(h) | 0) {
        d = (Gi(c + 80 | 0, d, e[h >> 1] | 0, 0) | 0) & 65535;
        b[g >> 1] = d;
        Te(d, f)
      } else {
        Ii(Hi(d) | 0, f, 2);
        b[g >> 1] = Oe(f) | 0
      }
      qk(h, g);
      V = i;
      return f + 2 | 0
    }

    function pk(b) {
      b = b | 0;
      return (a[b + 2 >> 0] | 0) != 0 | 0
    }

    function qk(c, d) {
      c = c | 0;
      d = d | 0;
      var e = 0;
      e = c + 2 | 0;
      if (!(a[e >> 0] | 0)) a[e >> 0] = 1;
      b[c >> 1] = b[d >> 1] | 0;
      return
    }

    function rk(a) {
      a = a | 0;
      pq(a);
      jp(a);
      return
    }

    function sk(a) {
      a = a | 0;
      a = c[a + 12 >> 2] | 0;
      if (a | 0) ca[c[(c[a >> 2] | 0) + 4 >> 2] & 255](a);
      return
    }

    function tk(a, b) {
      a = a | 0;
      b = b | 0;
      return ((c[b + 4 >> 2] | 0) == 18394 ? a + 12 | 0 : 0) | 0
    }

    function uk(a) {
      a = a | 0;
      Da(a, 16);
      return
    }

    function vk() {
      return
    }

    function wk(a) {
      a = a | 0;
      return Ek(a) | 0
    }

    function xk() {
      return 0
    }

    function yk() {
      return 0
    }

    function zk(a) {
      a = a | 0;
      if (a | 0) {
        Fk(a);
        jp(a)
      }
      return
    }

    function Ak() {
      return Gk() | 0
    }

    function Bk() {
      return Hk() | 0
    }

    function Ck() {
      return Ik() | 0
    }

    function Dk() {
      return 0
    }

    function Ek(a) {
      a = a | 0;
      return 3360
    }

    function Fk(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      b = V;
      V = V + 16 | 0;
      e = b;
      c[e >> 2] = c[a >> 2];
      c[a >> 2] = 0;
      d = a + 4 | 0;
      c[e + 4 >> 2] = c[d >> 2];
      c[d >> 2] = 0;
      wa(e);
      d = a + 8 | 0;
      c[e >> 2] = c[d >> 2];
      c[d >> 2] = 0;
      f = a + 12 | 0;
      c[e + 4 >> 2] = c[f >> 2];
      c[f >> 2] = 0;
      Ga(e);
      Ga(d);
      wa(a);
      V = b;
      return
    }

    function Gk() {
      return 3360
    }

    function Hk() {
      return 3368
    }

    function Ik() {
      return 3384
    }

    function Jk() {
      return 18579
    }

    function Kk() {
      return 18582
    }

    function Lk() {
      return 18584
    }

    function Mk() {
      var a = 0;
      a = eq(16) | 0;
      Tk(a);
      return a | 0
    }

    function Nk(a) {
      a = a | 0;
      var b = 0,
        c = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      c = b;
      e = Ak() | 0;
      d = Pk(c) | 0;
      c = Qk(c) | 0;
      E(e | 0, d | 0, c | 0, Jk() | 0, 12, a | 0);
      V = b;
      return
    }

    function Ok(a) {
      a = a | 0;
      return Rk(Y[a & 3]() | 0) | 0
    }

    function Pk(a) {
      a = a | 0;
      return 1
    }

    function Qk(a) {
      a = a | 0;
      return Sk() | 0
    }

    function Rk(a) {
      a = a | 0;
      return a | 0
    }

    function Sk() {
      return 5524
    }

    function Tk(a) {
      a = a | 0;
      c[a >> 2] = 0;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = 0;
      c[a + 12 >> 2] = 0;
      return
    }

    function Uk(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      f = d + 8 | 0;
      h = c[b + 4 >> 2] | 0;
      c[e >> 2] = c[b >> 2];
      c[e + 4 >> 2] = h;
      h = Ak() | 0;
      g = Wk(f) | 0;
      f = Xk(f) | 0;
      b = bl() | 0;
      F(h | 0, a | 0, g | 0, f | 0, b | 0, 4, Yk(e) | 0, 0);
      V = d;
      return
    }

    function Vk(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0;
      g = Zk(b) | 0;
      b = c[a >> 2] | 0;
      f = c[a + 4 >> 2] | 0;
      a = g + (f >> 1) | 0;
      if (f & 1) b = c[(c[a >> 2] | 0) + b >> 2] | 0;
      f = _k(d) | 0;
      g = $k(e) | 0;
      ea[b & 15](a, f, g);
      return
    }

    function Wk(a) {
      a = a | 0;
      return 4
    }

    function Xk(a) {
      a = a | 0;
      return al() | 0
    }

    function Yk(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = eq(8) | 0;
      d = c[a + 4 >> 2] | 0;
      c[b >> 2] = c[a >> 2];
      c[b + 4 >> 2] = d;
      return b | 0
    }

    function Zk(a) {
      a = a | 0;
      return a | 0
    }

    function _k(a) {
      a = a | 0;
      return a | 0
    }

    function $k(a) {
      a = a | 0;
      return a | 0
    }

    function al() {
      return 144
    }

    function bl() {
      return 18587
    }

    function cl(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      f = d + 8 | 0;
      h = c[b + 4 >> 2] | 0;
      c[e >> 2] = c[b >> 2];
      c[e + 4 >> 2] = h;
      h = Ak() | 0;
      g = el(f) | 0;
      f = fl(f) | 0;
      b = jl() | 0;
      F(h | 0, a | 0, g | 0, f | 0, b | 0, 7, gl(e) | 0, 0);
      V = d;
      return
    }

    function dl(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      f = Zk(b) | 0;
      b = c[a >> 2] | 0;
      e = c[a + 4 >> 2] | 0;
      a = f + (e >> 1) | 0;
      if (e & 1) b = c[(c[a >> 2] | 0) + b >> 2] | 0;
      f = hl(d) | 0;
      da[b & 15](a, f);
      return
    }

    function el(a) {
      a = a | 0;
      return 3
    }

    function fl(a) {
      a = a | 0;
      return il() | 0
    }

    function gl(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = eq(8) | 0;
      d = c[a + 4 >> 2] | 0;
      c[b >> 2] = c[a >> 2];
      c[b + 4 >> 2] = d;
      return b | 0
    }

    function hl(a) {
      a = a | 0;
      return a | 0
    }

    function il() {
      return 5528
    }

    function jl() {
      return 18593
    }

    function kl(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      f = d + 8 | 0;
      h = c[b + 4 >> 2] | 0;
      c[e >> 2] = c[b >> 2];
      c[e + 4 >> 2] = h;
      h = Ak() | 0;
      g = ml(f) | 0;
      f = nl(f) | 0;
      b = rl() | 0;
      F(h | 0, a | 0, g | 0, f | 0, b | 0, 41, ol(e) | 0, 0);
      V = d;
      return
    }

    function ll(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0;
      e = V;
      V = V + 16 | 0;
      d = e;
      g = Zk(b) | 0;
      b = c[a >> 2] | 0;
      f = c[a + 4 >> 2] | 0;
      a = g + (f >> 1) | 0;
      if (f & 1) b = c[(c[a >> 2] | 0) + b >> 2] | 0;
      c[d >> 2] = Z[b & 15](a) | 0;
      g = pl(d) | 0;
      V = e;
      return g | 0
    }

    function ml(a) {
      a = a | 0;
      return 2
    }

    function nl(a) {
      a = a | 0;
      return ql() | 0
    }

    function ol(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = eq(8) | 0;
      d = c[a + 4 >> 2] | 0;
      c[b >> 2] = c[a >> 2];
      c[b + 4 >> 2] = d;
      return b | 0
    }

    function pl(a) {
      a = a | 0;
      return c[a >> 2] | 0
    }

    function ql() {
      return 5540
    }

    function rl() {
      return 18598
    }

    function sl() {
      return
    }

    function tl(a) {
      a = a | 0;
      return Al(a) | 0
    }

    function ul() {
      return 0
    }

    function vl() {
      return 0
    }

    function wl(a) {
      a = a | 0;
      if (a | 0) {
        Bl(a);
        jp(a)
      }
      return
    }

    function xl() {
      return Cl() | 0
    }

    function yl() {
      return Dl() | 0
    }

    function zl() {
      return El() | 0
    }

    function Al(a) {
      a = a | 0;
      return 3400
    }

    function Bl(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      b = V;
      V = V + 16 | 0;
      e = b;
      c[e >> 2] = c[a >> 2];
      c[a >> 2] = 0;
      d = a + 4 | 0;
      c[e + 4 >> 2] = c[d >> 2];
      c[d >> 2] = 0;
      Wh(e);
      d = a + 16 | 0;
      c[e >> 2] = c[d >> 2];
      c[d >> 2] = 0;
      f = a + 20 | 0;
      c[e + 4 >> 2] = c[f >> 2];
      c[f >> 2] = 0;
      Uh(e);
      c[e >> 2] = c[d >> 2];
      c[d >> 2] = 0;
      c[e + 4 >> 2] = c[f >> 2];
      c[f >> 2] = 0;
      Uh(e);
      Uh(d);
      bi(a + 8 | 0);
      Wh(a);
      V = b;
      return
    }

    function Cl() {
      return 3400
    }

    function Dl() {
      return 3408
    }

    function El() {
      return 3424
    }

    function Fl() {
      var a = 0;
      a = eq(24) | 0;
      Ml(a);
      return a | 0
    }

    function Gl(a) {
      a = a | 0;
      var b = 0,
        c = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      c = b;
      e = xl() | 0;
      d = Il(c) | 0;
      c = Jl(c) | 0;
      E(e | 0, d | 0, c | 0, Jk() | 0, 13, a | 0);
      V = b;
      return
    }

    function Hl(a) {
      a = a | 0;
      return Kl(Y[a & 3]() | 0) | 0
    }

    function Il(a) {
      a = a | 0;
      return 1
    }

    function Jl(a) {
      a = a | 0;
      return Ll() | 0
    }

    function Kl(a) {
      a = a | 0;
      return a | 0
    }

    function Ll() {
      return 5548
    }

    function Ml(a) {
      a = a | 0;
      c[a >> 2] = 0;
      c[a + 4 >> 2] = 0;
      c[a + 8 >> 2] = 0;
      c[a + 12 >> 2] = 0;
      c[a + 16 >> 2] = 0;
      c[a + 20 >> 2] = 0;
      return
    }

    function Nl(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      f = d + 8 | 0;
      h = c[b + 4 >> 2] | 0;
      c[e >> 2] = c[b >> 2];
      c[e + 4 >> 2] = h;
      h = xl() | 0;
      g = Pl(f) | 0;
      f = Ql(f) | 0;
      b = bl() | 0;
      F(h | 0, a | 0, g | 0, f | 0, b | 0, 5, Rl(e) | 0, 0);
      V = d;
      return
    }

    function Ol(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0;
      g = Sl(b) | 0;
      b = c[a >> 2] | 0;
      f = c[a + 4 >> 2] | 0;
      a = g + (f >> 1) | 0;
      if (f & 1) b = c[(c[a >> 2] | 0) + b >> 2] | 0;
      f = _k(d) | 0;
      g = $k(e) | 0;
      ea[b & 15](a, f, g);
      return
    }

    function Pl(a) {
      a = a | 0;
      return 4
    }

    function Ql(a) {
      a = a | 0;
      return Tl() | 0
    }

    function Rl(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = eq(8) | 0;
      d = c[a + 4 >> 2] | 0;
      c[b >> 2] = c[a >> 2];
      c[b + 4 >> 2] = d;
      return b | 0
    }

    function Sl(a) {
      a = a | 0;
      return a | 0
    }

    function Tl() {
      return 160
    }

    function Ul(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      f = d + 8 | 0;
      h = c[b + 4 >> 2] | 0;
      c[e >> 2] = c[b >> 2];
      c[e + 4 >> 2] = h;
      h = xl() | 0;
      g = Wl(f) | 0;
      f = Xl(f) | 0;
      b = jl() | 0;
      F(h | 0, a | 0, g | 0, f | 0, b | 0, 8, Yl(e) | 0, 0);
      V = d;
      return
    }

    function Vl(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      f = Sl(b) | 0;
      b = c[a >> 2] | 0;
      e = c[a + 4 >> 2] | 0;
      a = f + (e >> 1) | 0;
      if (e & 1) b = c[(c[a >> 2] | 0) + b >> 2] | 0;
      f = $k(d) | 0;
      da[b & 15](a, f);
      return
    }

    function Wl(a) {
      a = a | 0;
      return 3
    }

    function Xl(a) {
      a = a | 0;
      return Zl() | 0
    }

    function Yl(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = eq(8) | 0;
      d = c[a + 4 >> 2] | 0;
      c[b >> 2] = c[a >> 2];
      c[b + 4 >> 2] = d;
      return b | 0
    }

    function Zl() {
      return 5552
    }

    function _l(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      d = V;
      V = V + 16 | 0;
      e = d;
      f = d + 8 | 0;
      h = c[b + 4 >> 2] | 0;
      c[e >> 2] = c[b >> 2];
      c[e + 4 >> 2] = h;
      h = xl() | 0;
      g = am(f) | 0;
      f = bm(f) | 0;
      b = jl() | 0;
      F(h | 0, a | 0, g | 0, f | 0, b | 0, 9, cm(e) | 0, 0);
      V = d;
      return
    }

    function $l(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      f = Sl(b) | 0;
      b = c[a >> 2] | 0;
      e = c[a + 4 >> 2] | 0;
      a = f + (e >> 1) | 0;
      if (e & 1) b = c[(c[a >> 2] | 0) + b >> 2] | 0;
      f = hl(d) | 0;
      da[b & 15](a, f);
      return
    }

    function am(a) {
      a = a | 0;
      return 3
    }

    function bm(a) {
      a = a | 0;
      return dm() | 0
    }

    function cm(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = eq(8) | 0;
      d = c[a + 4 >> 2] | 0;
      c[b >> 2] = c[a >> 2];
      c[b + 4 >> 2] = d;
      return b | 0
    }

    function dm() {
      return 5564
    }

    function em() {
      ja();
      return
    }

    function fm() {
      gm();
      return
    }

    function gm() {
      hm(22144);
      return
    }

    function hm(a) {
      a = a | 0;
      var b = 0;
      b = V;
      V = V + 16 | 0;
      c[b >> 2] = a;
      im();
      V = b;
      return
    }

    function im() {
      M(jm() | 0, 18653);
      C(km() | 0, 18658, 1, 1, 0);
      lm(18663);
      mm(18668);
      nm(18680);
      om(18694);
      pm(18700);
      qm(18715);
      rm(18719);
      sm(18732);
      tm(18737);
      um(18751);
      vm(18757);
      K(wm() | 0, 18764);
      K(xm() | 0, 18776);
      L(ym() | 0, 4, 18809);
      L(zm() | 0, 2, 18822);
      L(Am() | 0, 4, 18837);
      G(Bm() | 0, 18852);
      Cm(18868);
      Dm(18898);
      Em(18935);
      Fm(18974);
      Gm(19005);
      Hm(19045);
      Im(19074);
      Jm(19112);
      Km(19142);
      Dm(19181);
      Em(19213);
      Fm(19246);
      Gm(19279);
      Hm(19313);
      Im(19346);
      Lm(19380);
      Mm(19411);
      Nm(19443);
      return
    }

    function jm() {
      return _n() | 0
    }

    function km() {
      return Zn() | 0
    }

    function lm(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Xn() | 0;
      I(a | 0, c[d >> 2] | 0, 1, -128 << 24 >> 24 | 0, 127 << 24 >> 24 | 0);
      V = b;
      return
    }

    function mm(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Vn() | 0;
      I(a | 0, c[d >> 2] | 0, 1, -128 << 24 >> 24 | 0, 127 << 24 >> 24 | 0);
      V = b;
      return
    }

    function nm(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Tn() | 0;
      I(a | 0, c[d >> 2] | 0, 1, 0, 255);
      V = b;
      return
    }

    function om(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Rn() | 0;
      I(a | 0, c[d >> 2] | 0, 2, -32768 << 16 >> 16 | 0, 32767 << 16 >> 16 | 0);
      V = b;
      return
    }

    function pm(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Pn() | 0;
      I(a | 0, c[d >> 2] | 0, 2, 0, 65535);
      V = b;
      return
    }

    function qm(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Nn() | 0;
      I(a | 0, c[d >> 2] | 0, 4, -2147483648, 2147483647);
      V = b;
      return
    }

    function rm(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Ln() | 0;
      I(a | 0, c[d >> 2] | 0, 4, 0, -1);
      V = b;
      return
    }

    function sm(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Jn() | 0;
      I(a | 0, c[d >> 2] | 0, 4, -2147483648, 2147483647);
      V = b;
      return
    }

    function tm(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Hn() | 0;
      I(a | 0, c[d >> 2] | 0, 4, 0, -1);
      V = b;
      return
    }

    function um(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Fn() | 0;
      H(a | 0, c[d >> 2] | 0, 4);
      V = b;
      return
    }

    function vm(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      a = Dn() | 0;
      H(a | 0, c[d >> 2] | 0, 8);
      V = b;
      return
    }

    function wm() {
      return Cn() | 0
    }

    function xm() {
      return Bn() | 0
    }

    function ym() {
      return An() | 0
    }

    function zm() {
      return zn() | 0
    }

    function Am() {
      return yn() | 0
    }

    function Bm() {
      return xn() | 0
    }

    function Cm(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = un() | 0;
      a = vn() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Dm(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = rn() | 0;
      a = sn() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Em(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = on() | 0;
      a = pn() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Fm(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = ln() | 0;
      a = mn() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Gm(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = hn() | 0;
      a = jn() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Hm(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = en() | 0;
      a = fn() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Im(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = bn() | 0;
      a = cn() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Jm(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = _m() | 0;
      a = $m() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Km(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = Xm() | 0;
      a = Ym() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Lm(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = Um() | 0;
      a = Vm() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Mm(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = Rm() | 0;
      a = Sm() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Nm(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      c[d >> 2] = a;
      e = Om() | 0;
      a = Pm() | 0;
      J(e | 0, a | 0, c[d >> 2] | 0);
      V = b;
      return
    }

    function Om() {
      return Qm() | 0
    }

    function Pm() {
      return 7
    }

    function Qm() {
      return 3440
    }

    function Rm() {
      return Tm() | 0
    }

    function Sm() {
      return 7
    }

    function Tm() {
      return 3448
    }

    function Um() {
      return Wm() | 0
    }

    function Vm() {
      return 6
    }

    function Wm() {
      return 3456
    }

    function Xm() {
      return Zm() | 0
    }

    function Ym() {
      return 5
    }

    function Zm() {
      return 3464
    }

    function _m() {
      return an() | 0
    }

    function $m() {
      return 4
    }

    function an() {
      return 3472
    }

    function bn() {
      return dn() | 0
    }

    function cn() {
      return 5
    }

    function dn() {
      return 3480
    }

    function en() {
      return gn() | 0
    }

    function fn() {
      return 4
    }

    function gn() {
      return 3488
    }

    function hn() {
      return kn() | 0
    }

    function jn() {
      return 3
    }

    function kn() {
      return 3496
    }

    function ln() {
      return nn() | 0
    }

    function mn() {
      return 2
    }

    function nn() {
      return 3504
    }

    function on() {
      return qn() | 0
    }

    function pn() {
      return 1
    }

    function qn() {
      return 3512
    }

    function rn() {
      return tn() | 0
    }

    function sn() {
      return 0
    }

    function tn() {
      return 3520
    }

    function un() {
      return wn() | 0
    }

    function vn() {
      return 0
    }

    function wn() {
      return 3528
    }

    function xn() {
      return 3536
    }

    function yn() {
      return 3544
    }

    function zn() {
      return 3576
    }

    function An() {
      return 3600
    }

    function Bn() {
      return 3624
    }

    function Cn() {
      return 3648
    }

    function Dn() {
      return En() | 0
    }

    function En() {
      return 4144
    }

    function Fn() {
      return Gn() | 0
    }

    function Gn() {
      return 4136
    }

    function Hn() {
      return In() | 0
    }

    function In() {
      return 4128
    }

    function Jn() {
      return Kn() | 0
    }

    function Kn() {
      return 4120
    }

    function Ln() {
      return Mn() | 0
    }

    function Mn() {
      return 4112
    }

    function Nn() {
      return On() | 0
    }

    function On() {
      return 4104
    }

    function Pn() {
      return Qn() | 0
    }

    function Qn() {
      return 4096
    }

    function Rn() {
      return Sn() | 0
    }

    function Sn() {
      return 4088
    }

    function Tn() {
      return Un() | 0
    }

    function Un() {
      return 4072
    }

    function Vn() {
      return Wn() | 0
    }

    function Wn() {
      return 4080
    }

    function Xn() {
      return Yn() | 0
    }

    function Yn() {
      return 4064
    }

    function Zn() {
      return 4056
    }

    function _n() {
      return 4040
    }

    function $n(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0;
      b = V;
      V = V + 16 | 0;
      d = b + 8 | 0;
      e = b + 4 | 0;
      f = b;
      c[f >> 2] = a;
      c[e >> 2] = c[f >> 2];
      c[d >> 2] = c[(c[e >> 2] | 0) + 4 >> 2];
      a = Jo(c[d >> 2] | 0) | 0;
      V = b;
      return a | 0
    }

    function ao() {
      return 21636
    }

    function bo(a) {
      a = a | 0;
      return (a + -48 | 0) >>> 0 < 10 | 0
    }

    function co() {
      return 5576
    }

    function eo(b, c) {
      b = b | 0;
      c = c | 0;
      var d = 0,
        e = 0;
      d = a[b >> 0] | 0;
      e = a[c >> 0] | 0;
      if (d << 24 >> 24 == 0 ? 1 : d << 24 >> 24 != e << 24 >> 24) b = e;
      else {
        do {
          b = b + 1 | 0;
          c = c + 1 | 0;
          d = a[b >> 0] | 0;
          e = a[c >> 0] | 0
        } while (!(d << 24 >> 24 == 0 ? 1 : d << 24 >> 24 != e << 24 >> 24));
        b = e
      }
      return (d & 255) - (b & 255) | 0
    }

    function fo(b) {
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0;
      f = b;
      a: do
        if (!(f & 3)) e = 5;
        else {
          d = f;
          while (1) {
            if (!(a[b >> 0] | 0)) {
              b = d;
              break a
            }
            b = b + 1 | 0;
            d = b;
            if (!(d & 3)) {
              e = 5;
              break
            }
          }
        }
      while (0);
      if ((e | 0) == 5) {
        while (1) {
          d = c[b >> 2] | 0;
          if (!((d & -2139062144 ^ -2139062144) & d + -16843009)) b = b + 4 | 0;
          else break
        }
        if ((d & 255) << 24 >> 24)
          do b = b + 1 | 0; while ((a[b >> 0] | 0) != 0)
      }
      return b - f | 0
    }

    function go(a) {
      a = a | 0;
      return
    }

    function ho(a) {
      a = a | 0;
      return 1
    }

    function io(b) {
      b = b | 0;
      var d = 0,
        e = 0;
      d = b + 74 | 0;
      e = a[d >> 0] | 0;
      a[d >> 0] = e + 255 | e;
      d = c[b >> 2] | 0;
      if (!(d & 8)) {
        c[b + 8 >> 2] = 0;
        c[b + 4 >> 2] = 0;
        e = c[b + 44 >> 2] | 0;
        c[b + 28 >> 2] = e;
        c[b + 20 >> 2] = e;
        c[b + 16 >> 2] = e + (c[b + 48 >> 2] | 0);
        b = 0
      } else {
        c[b >> 2] = d | 32;
        b = -1
      }
      return b | 0
    }

    function jo(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;
      f = e + 16 | 0;
      g = c[f >> 2] | 0;
      if (!g)
        if (!(io(e) | 0)) {
          g = c[f >> 2] | 0;
          h = 5
        } else f = 0;
      else h = 5;
      a: do
        if ((h | 0) == 5) {
          j = e + 20 | 0;
          i = c[j >> 2] | 0;
          f = i;
          if ((g - i | 0) >>> 0 < d >>> 0) {
            f = aa[c[e + 36 >> 2] & 7](e, b, d) | 0;
            break
          }
          b: do
            if ((a[e + 75 >> 0] | 0) < 0 | (d | 0) == 0) {
              h = 0;
              g = b
            } else {
              i = d;
              while (1) {
                g = i + -1 | 0;
                if ((a[b + g >> 0] | 0) == 10) break;
                if (!g) {
                  h = 0;
                  g = b;
                  break b
                } else i = g
              }
              f = aa[c[e + 36 >> 2] & 7](e, b, i) | 0;
              if (f >>> 0 < i >>> 0) break a;
              h = i;
              g = b + i | 0;
              d = d - i | 0;
              f = c[j >> 2] | 0
            }
          while (0);
          ur(f | 0, g | 0, d | 0) | 0;
          c[j >> 2] = (c[j >> 2] | 0) + d;
          f = h + d | 0
        }
      while (0);
      return f | 0
    }

    function ko(a, b) {
      a = a | 0;
      b = b | 0;
      if (!b) b = 0;
      else b = lo(c[b >> 2] | 0, c[b + 4 >> 2] | 0, a) | 0;
      return ((b | 0) == 0 ? a : b) | 0
    }

    function lo(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;
      o = (c[b >> 2] | 0) + 1794895138 | 0;
      h = mo(c[b + 8 >> 2] | 0, o) | 0;
      f = mo(c[b + 12 >> 2] | 0, o) | 0;
      g = mo(c[b + 16 >> 2] | 0, o) | 0;
      a: do
        if ((h >>> 0 < d >>> 2 >>> 0 ? (n = d - (h << 2) | 0, f >>> 0 < n >>> 0 & g >>> 0 < n >>> 0) : 0) ? ((g | f) & 3 | 0) == 0 : 0) {
          n = f >>> 2;
          m = g >>> 2;
          l = 0;
          while (1) {
            j = h >>> 1;
            k = l + j | 0;
            i = k << 1;
            g = i + n | 0;
            f = mo(c[b + (g << 2) >> 2] | 0, o) | 0;
            g = mo(c[b + (g + 1 << 2) >> 2] | 0, o) | 0;
            if (!(g >>> 0 < d >>> 0 & f >>> 0 < (d - g | 0) >>> 0)) {
              f = 0;
              break a
            }
            if (a[b + (g + f) >> 0] | 0) {
              f = 0;
              break a
            }
            f = eo(e, b + g | 0) | 0;
            if (!f) break;
            f = (f | 0) < 0;
            if ((h | 0) == 1) {
              f = 0;
              break a
            }
            l = f ? l : k;
            h = f ? j : h - j | 0
          }
          f = i + m | 0;
          g = mo(c[b + (f << 2) >> 2] | 0, o) | 0;
          f = mo(c[b + (f + 1 << 2) >> 2] | 0, o) | 0;
          if (f >>> 0 < d >>> 0 & g >>> 0 < (d - f | 0) >>> 0) f = (a[b + (f + g) >> 0] | 0) == 0 ? b + f | 0 : 0;
          else f = 0
        } else f = 0; while (0);
      return f | 0
    }

    function mo(a, b) {
      a = a | 0;
      b = b | 0;
      var c = 0;
      c = tr(a | 0) | 0;
      return ((b | 0) == 0 ? a : c) | 0
    }

    function no(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0;
      h = d & 255;
      f = (e | 0) != 0;
      a: do
        if (f & (b & 3 | 0) != 0) {
          g = d & 255;
          while (1) {
            if ((a[b >> 0] | 0) == g << 24 >> 24) {
              g = 6;
              break a
            }
            b = b + 1 | 0;
            e = e + -1 | 0;
            f = (e | 0) != 0;
            if (!(f & (b & 3 | 0) != 0)) {
              g = 5;
              break
            }
          }
        } else g = 5; while (0);
      if ((g | 0) == 5)
        if (f) g = 6;
        else b = 0;
      b: do
        if ((g | 0) == 6) {
          if ((a[b >> 0] | 0) != (d & 255) << 24 >> 24) {
            f = q(h, 16843009) | 0;
            c: do
              if (e >>> 0 > 3)
                do {
                  h = c[b >> 2] ^ f;
                  if ((h & -2139062144 ^ -2139062144) & h + -16843009 | 0) break c;
                  b = b + 4 | 0;
                  e = e + -4 | 0
                } while (e >>> 0 > 3); while (0)
          }
          if (!e) b = 0;
          else {
            f = d & 255;
            while (1) {
              if ((a[b >> 0] | 0) == f << 24 >> 24) break b;
              e = e + -1 | 0;
              if (!e) {
                b = 0;
                break
              } else b = b + 1 | 0
            }
          }
        }
      while (0);
      return b | 0
    }

    function oo(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return ro(a, b, c, 1, 8) | 0
    }

    function po(b, e, f, g, h, i) {
      b = b | 0;
      e = +e;
      f = f | 0;
      g = g | 0;
      h = h | 0;
      i = i | 0;
      var j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        r = 0.0,
        s = 0,
        t = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0;
      H = V;
      V = V + 560 | 0;
      l = H + 32 | 0;
      w = H + 536 | 0;
      G = H;
      F = G;
      m = H + 540 | 0;
      c[w >> 2] = 0;
      E = m + 12 | 0;
      Do(e) | 0;
      j = u() | 0;
      if ((j | 0) < 0) {
        e = -e;
        Do(e) | 0;
        D = 1;
        C = 20247;
        j = u() | 0
      } else {
        D = (h & 2049 | 0) != 0 & 1;
        C = (h & 2048 | 0) == 0 ? ((h & 1 | 0) == 0 ? 20248 : 20253) : 20250
      }
      do
        if (0 == 0 & (j & 2146435072 | 0) == 2146435072) {
          G = (i & 32 | 0) != 0;
          j = D + 3 | 0;
          zo(b, 32, f, j, h & -65537);
          to(b, C, D);
          to(b, e != e | 0.0 != 0.0 ? (G ? 20274 : 20278) : G ? 20266 : 20270, 3);
          zo(b, 32, f, j, h ^ 8192)
        } else {
          r = +Eo(e, w) * 2.0;
          j = r != 0.0;
          if (j) c[w >> 2] = (c[w >> 2] | 0) + -1;
          v = i | 32;
          if ((v | 0) == 97) {
            o = i & 32;
            s = (o | 0) == 0 ? C : C + 9 | 0;
            p = D | 2;
            j = 12 - g | 0;
            do
              if (!(g >>> 0 > 11 | (j | 0) == 0)) {
                e = 8.0;
                do {
                  j = j + -1 | 0;
                  e = e * 16.0
                } while ((j | 0) != 0);
                if ((a[s >> 0] | 0) == 45) {
                  e = -(e + (-r - e));
                  break
                } else {
                  e = r + e - e;
                  break
                }
              } else e = r; while (0);
            k = c[w >> 2] | 0;
            j = (k | 0) < 0 ? 0 - k | 0 : k;
            j = yo(j, ((j | 0) < 0) << 31 >> 31, E) | 0;
            if ((j | 0) == (E | 0)) {
              j = m + 11 | 0;
              a[j >> 0] = 48
            }
            a[j + -1 >> 0] = (k >> 31 & 2) + 43;
            n = j + -2 | 0;
            a[n >> 0] = i + 15;
            k = (g | 0) < 1;
            l = (h & 8 | 0) == 0;
            m = G;
            do {
              D = ~~e;
              j = m + 1 | 0;
              a[m >> 0] = o | d[640 + D >> 0];
              e = (e - +(D | 0)) * 16.0;
              if ((j - F | 0) == 1 ? !(l & (k & e == 0.0)) : 0) {
                a[j >> 0] = 46;
                m = m + 2 | 0
              } else m = j
            } while (e != 0.0);
            if ((g | 0) != 0 ? (-2 - F + m | 0) < (g | 0) : 0) {
              k = E;
              l = n;
              j = g + 2 + k - l | 0
            } else {
              k = E;
              l = n;
              j = k - F - l + m | 0
            }
            E = j + p | 0;
            zo(b, 32, f, E, h);
            to(b, s, p);
            zo(b, 48, f, E, h ^ 65536);
            F = m - F | 0;
            to(b, G, F);
            G = k - l | 0;
            zo(b, 48, j - (F + G) | 0, 0, 0);
            to(b, n, G);
            zo(b, 32, f, E, h ^ 8192);
            j = E;
            break
          }
          k = (g | 0) < 0 ? 6 : g;
          if (j) {
            j = (c[w >> 2] | 0) + -28 | 0;
            c[w >> 2] = j;
            e = r * 268435456.0
          } else {
            e = r;
            j = c[w >> 2] | 0
          }
          B = (j | 0) < 0 ? l : l + 288 | 0;
          l = B;
          do {
            z = ~~e >>> 0;
            c[l >> 2] = z;
            l = l + 4 | 0;
            e = (e - +(z >>> 0)) * 1.0e9
          } while (e != 0.0);
          z = B;
          if ((j | 0) > 0) {
            o = B;
            while (1) {
              n = (j | 0) < 29 ? j : 29;
              j = l + -4 | 0;
              if (j >>> 0 >= o >>> 0) {
                m = 0;
                do {
                  t = rr(c[j >> 2] | 0, 0, n | 0) | 0;
                  t = lr(t | 0, u() | 0, m | 0, 0) | 0;
                  x = u() | 0;
                  m = pr(t | 0, x | 0, 1e9, 0) | 0;
                  y = kr(m | 0, u() | 0, 1e9, 0) | 0;
                  y = mr(t | 0, x | 0, y | 0, u() | 0) | 0;
                  u() | 0;
                  c[j >> 2] = y;
                  j = j + -4 | 0
                } while (j >>> 0 >= o >>> 0);
                if (m) {
                  y = o + -4 | 0;
                  c[y >> 2] = m;
                  m = y
                } else m = o
              } else m = o;
              a: do
                if (l >>> 0 > m >>> 0) {
                  j = l;
                  while (1) {
                    l = j + -4 | 0;
                    if (c[l >> 2] | 0) {
                      l = j;
                      break a
                    }
                    if (l >>> 0 > m >>> 0) j = l;
                    else break
                  }
                }
              while (0);
              j = (c[w >> 2] | 0) - n | 0;
              c[w >> 2] = j;
              if ((j | 0) > 0) o = m;
              else break
            }
          } else m = B;
          if ((j | 0) < 0) {
            g = ((k + 25 | 0) / 9 | 0) + 1 | 0;
            t = (v | 0) == 102;
            do {
              s = 0 - j | 0;
              s = (s | 0) < 9 ? s : 9;
              if (m >>> 0 < l >>> 0) {
                n = (1 << s) + -1 | 0;
                o = 1e9 >>> s;
                p = 0;
                j = m;
                do {
                  y = c[j >> 2] | 0;
                  c[j >> 2] = (y >>> s) + p;
                  p = q(y & n, o) | 0;
                  j = j + 4 | 0
                } while (j >>> 0 < l >>> 0);
                m = (c[m >> 2] | 0) == 0 ? m + 4 | 0 : m;
                if (p) {
                  c[l >> 2] = p;
                  l = l + 4 | 0
                }
              } else m = (c[m >> 2] | 0) == 0 ? m + 4 | 0 : m;
              j = t ? B : m;
              l = (l - j >> 2 | 0) > (g | 0) ? j + (g << 2) | 0 : l;
              j = (c[w >> 2] | 0) + s | 0;
              c[w >> 2] = j
            } while ((j | 0) < 0);
            t = m
          } else t = m;
          if (t >>> 0 < l >>> 0) {
            j = (z - t >> 2) * 9 | 0;
            n = c[t >> 2] | 0;
            if (n >>> 0 >= 10) {
              m = 10;
              do {
                m = m * 10 | 0;
                j = j + 1 | 0
              } while (n >>> 0 >= m >>> 0)
            }
          } else j = 0;
          x = (v | 0) == 103;
          y = (k | 0) != 0;
          m = k - ((v | 0) == 102 ? 0 : j) + ((y & x) << 31 >> 31) | 0;
          if ((m | 0) < (((l - z >> 2) * 9 | 0) + -9 | 0)) {
            w = m + 9216 | 0;
            m = (w | 0) / 9 | 0;
            g = B + 4 + (m + -1024 << 2) | 0;
            m = w - (m * 9 | 0) | 0;
            if ((m | 0) < 8) {
              n = 10;
              while (1) {
                n = n * 10 | 0;
                if ((m | 0) < 7) m = m + 1 | 0;
                else break
              }
            } else n = 10;
            p = c[g >> 2] | 0;
            m = (p >>> 0) / (n >>> 0) | 0;
            s = p - (q(m, n) | 0) | 0;
            o = (g + 4 | 0) == (l | 0);
            if (!(o & (s | 0) == 0)) {
              r = (m & 1 | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;
              w = n >>> 1;
              e = s >>> 0 < w >>> 0 ? .5 : o & (s | 0) == (w | 0) ? 1.0 : 1.5;
              if (D) {
                w = (a[C >> 0] | 0) == 45;
                e = w ? -e : e;
                r = w ? -r : r
              }
              m = p - s | 0;
              c[g >> 2] = m;
              if (r + e != r) {
                w = m + n | 0;
                c[g >> 2] = w;
                if (w >>> 0 > 999999999) {
                  n = g;
                  j = t;
                  while (1) {
                    m = n + -4 | 0;
                    c[n >> 2] = 0;
                    if (m >>> 0 < j >>> 0) {
                      j = j + -4 | 0;
                      c[j >> 2] = 0
                    }
                    w = (c[m >> 2] | 0) + 1 | 0;
                    c[m >> 2] = w;
                    if (w >>> 0 > 999999999) n = m;
                    else {
                      n = j;
                      break
                    }
                  }
                } else {
                  m = g;
                  n = t
                }
                j = (z - n >> 2) * 9 | 0;
                p = c[n >> 2] | 0;
                if (p >>> 0 >= 10) {
                  o = 10;
                  do {
                    o = o * 10 | 0;
                    j = j + 1 | 0
                  } while (p >>> 0 >= o >>> 0)
                }
              } else {
                m = g;
                n = t
              }
            } else {
              m = g;
              n = t
            }
            w = m + 4 | 0;
            l = l >>> 0 > w >>> 0 ? w : l
          } else n = t;
          g = 0 - j | 0;
          b: do
              if (l >>> 0 > n >>> 0)
                while (1) {
                  m = l + -4 | 0;
                  if (c[m >> 2] | 0) {
                    w = l;
                    v = 1;
                    break b
                  }
                  if (m >>> 0 > n >>> 0) l = m;
                  else {
                    w = m;
                    v = 0;
                    break
                  }
                } else {
                  w = l;
                  v = 0
                }
            while (0);
            do
              if (x) {
                k = k + ((y ^ 1) & 1) | 0;
                if ((k | 0) > (j | 0) & (j | 0) > -5) {
                  o = i + -1 | 0;
                  k = k + -1 - j | 0
                } else {
                  o = i + -2 | 0;
                  k = k + -1 | 0
                }
                if (!(h & 8)) {
                  if (v ? (A = c[w + -4 >> 2] | 0, (A | 0) != 0) : 0)
                    if (!((A >>> 0) % 10 | 0)) {
                      m = 0;
                      l = 10;
                      do {
                        l = l * 10 | 0;
                        m = m + 1 | 0
                      } while (!((A >>> 0) % (l >>> 0) | 0 | 0))
                    } else m = 0;
                  else m = 9;
                  l = ((w - z >> 2) * 9 | 0) + -9 | 0;
                  if ((o | 32 | 0) == 102) {
                    i = l - m | 0;
                    i = (i | 0) > 0 ? i : 0;
                    k = (k | 0) < (i | 0) ? k : i;
                    break
                  } else {
                    i = l + j - m | 0;
                    i = (i | 0) > 0 ? i : 0;
                    k = (k | 0) < (i | 0) ? k : i;
                    break
                  }
                }
              } else o = i; while (0);
          t = (k | 0) != 0;
          p = t ? 1 : h >>> 3 & 1;
          s = (o | 32 | 0) == 102;
          if (s) {
            x = 0;
            j = (j | 0) > 0 ? j : 0
          } else {
            l = (j | 0) < 0 ? g : j;
            l = yo(l, ((l | 0) < 0) << 31 >> 31, E) | 0;
            m = E;
            if ((m - l | 0) < 2)
              do {
                l = l + -1 | 0;
                a[l >> 0] = 48
              } while ((m - l | 0) < 2);
            a[l + -1 >> 0] = (j >> 31 & 2) + 43;
            j = l + -2 | 0;
            a[j >> 0] = o;
            x = j;
            j = m - j | 0
          }
          j = D + 1 + k + p + j | 0;
          zo(b, 32, f, j, h);
          to(b, C, D);
          zo(b, 48, f, j, h ^ 65536);
          if (s) {
            p = n >>> 0 > B >>> 0 ? B : n;
            s = G + 9 | 0;
            n = s;
            o = G + 8 | 0;
            m = p;
            do {
              l = yo(c[m >> 2] | 0, 0, s) | 0;
              if ((m | 0) == (p | 0)) {
                if ((l | 0) == (s | 0)) {
                  a[o >> 0] = 48;
                  l = o
                }
              } else if (l >>> 0 > G >>> 0) {
                wr(G | 0, 48, l - F | 0) | 0;
                do l = l + -1 | 0; while (l >>> 0 > G >>> 0)
              }
              to(b, l, n - l | 0);
              m = m + 4 | 0
            } while (m >>> 0 <= B >>> 0);
            if (!((h & 8 | 0) == 0 & (t ^ 1))) to(b, 20282, 1);
            if (m >>> 0 < w >>> 0 & (k | 0) > 0)
              while (1) {
                l = yo(c[m >> 2] | 0, 0, s) | 0;
                if (l >>> 0 > G >>> 0) {
                  wr(G | 0, 48, l - F | 0) | 0;
                  do l = l + -1 | 0; while (l >>> 0 > G >>> 0)
                }
                to(b, l, (k | 0) < 9 ? k : 9);
                m = m + 4 | 0;
                l = k + -9 | 0;
                if (!(m >>> 0 < w >>> 0 & (k | 0) > 9)) {
                  k = l;
                  break
                } else k = l
              }
            zo(b, 48, k + 9 | 0, 9, 0)
          } else {
            w = v ? w : n + 4 | 0;
            if (n >>> 0 < w >>> 0 & (k | 0) > -1) {
              g = G + 9 | 0;
              t = (h & 8 | 0) == 0;
              v = g;
              p = 0 - F | 0;
              s = G + 8 | 0;
              o = n;
              do {
                l = yo(c[o >> 2] | 0, 0, g) | 0;
                if ((l | 0) == (g | 0)) {
                  a[s >> 0] = 48;
                  l = s
                }
                do
                  if ((o | 0) == (n | 0)) {
                    m = l + 1 | 0;
                    to(b, l, 1);
                    if (t & (k | 0) < 1) {
                      l = m;
                      break
                    }
                    to(b, 20282, 1);
                    l = m
                  } else {
                    if (l >>> 0 <= G >>> 0) break;
                    wr(G | 0, 48, l + p | 0) | 0;
                    do l = l + -1 | 0; while (l >>> 0 > G >>> 0)
                  } while (0);
                F = v - l | 0;
                to(b, l, (k | 0) > (F | 0) ? F : k);
                k = k - F | 0;
                o = o + 4 | 0
              } while (o >>> 0 < w >>> 0 & (k | 0) > -1)
            }
            zo(b, 48, k + 18 | 0, 18, 0);
            to(b, x, E - x | 0)
          }
          zo(b, 32, f, j, h ^ 8192)
        } while (0);
      V = H;
      return ((j | 0) < (f | 0) ? f : j) | 0
    }

    function qo(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0.0,
        e = 0;
      e = (c[b >> 2] | 0) + (8 - 1) & ~(8 - 1);
      d = +g[e >> 3];
      c[b >> 2] = e + 8;
      g[a >> 3] = d;
      return
    }

    function ro(b, d, e, f, g) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0;
      t = V;
      V = V + 224 | 0;
      p = t + 208 | 0;
      q = t + 160 | 0;
      r = t + 80 | 0;
      s = t;
      h = q;
      i = h + 40 | 0;
      do {
        c[h >> 2] = 0;
        h = h + 4 | 0
      } while ((h | 0) < (i | 0));
      c[p >> 2] = c[e >> 2];
      if ((so(0, d, p, r, q, f, g) | 0) < 0) e = -1;
      else {
        if ((c[b + 76 >> 2] | 0) > -1) o = ho(b) | 0;
        else o = 0;
        e = c[b >> 2] | 0;
        n = e & 32;
        if ((a[b + 74 >> 0] | 0) < 1) c[b >> 2] = e & -33;
        h = b + 48 | 0;
        if (!(c[h >> 2] | 0)) {
          i = b + 44 | 0;
          j = c[i >> 2] | 0;
          c[i >> 2] = s;
          k = b + 28 | 0;
          c[k >> 2] = s;
          l = b + 20 | 0;
          c[l >> 2] = s;
          c[h >> 2] = 80;
          m = b + 16 | 0;
          c[m >> 2] = s + 80;
          e = so(b, d, p, r, q, f, g) | 0;
          if (j) {
            aa[c[b + 36 >> 2] & 7](b, 0, 0) | 0;
            e = (c[l >> 2] | 0) == 0 ? -1 : e;
            c[i >> 2] = j;
            c[h >> 2] = 0;
            c[m >> 2] = 0;
            c[k >> 2] = 0;
            c[l >> 2] = 0
          }
        } else e = so(b, d, p, r, q, f, g) | 0;
        h = c[b >> 2] | 0;
        c[b >> 2] = h | n;
        if (o | 0) go(b);
        e = (h & 32 | 0) == 0 ? e : -1
      }
      V = t;
      return e | 0
    }

    function so(d, e, f, h, i, j, k) {
      d = d | 0;
      e = e | 0;
      f = f | 0;
      h = h | 0;
      i = i | 0;
      j = j | 0;
      k = k | 0;
      var l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        v = 0,
        w = 0,
        x = 0,
        y = 0,
        z = 0,
        A = 0,
        B = 0,
        C = 0,
        D = 0,
        E = 0,
        F = 0,
        G = 0,
        H = 0,
        I = 0,
        J = 0,
        K = 0;
      J = V;
      V = V + 64 | 0;
      G = J + 56 | 0;
      I = J + 40 | 0;
      B = J;
      D = J + 48 | 0;
      E = J + 60 | 0;
      c[G >> 2] = e;
      y = (d | 0) != 0;
      z = B + 40 | 0;
      A = z;
      B = B + 39 | 0;
      C = D + 4 | 0;
      l = 0;
      e = 0;
      n = 0;
      a: while (1) {
        do {
          do
            if ((e | 0) > -1)
              if ((l | 0) > (2147483647 - e | 0)) {
                c[(ao() | 0) >> 2] = 61;
                e = -1;
                break
              } else {
                e = l + e | 0;
                break
              } while (0);
          r = c[G >> 2] | 0;
          l = a[r >> 0] | 0;
          if (!(l << 24 >> 24)) {
            x = 92;
            break a
          }
          m = r;
          b: while (1) {
            switch (l << 24 >> 24) {
            case 37: {
              x = 10;
              break b
            }
            case 0: {
              l = m;
              break b
            }
            default: {}
            }
            w = m + 1 | 0;
            c[G >> 2] = w;
            l = a[w >> 0] | 0;
            m = w
          }
          c: do
            if ((x | 0) == 10) {
              x = 0;
              l = m;
              do {
                if ((a[m + 1 >> 0] | 0) != 37) break c;
                l = l + 1 | 0;
                m = m + 2 | 0;
                c[G >> 2] = m
              } while ((a[m >> 0] | 0) == 37)
            }
          while (0);
          l = l - r | 0;
          if (y) to(d, r, l)
        } while ((l | 0) != 0);
        w = (bo(a[(c[G >> 2] | 0) + 1 >> 0] | 0) | 0) == 0;
        m = c[G >> 2] | 0;
        if (!w ? (a[m + 2 >> 0] | 0) == 36 : 0) {
          t = (a[m + 1 >> 0] | 0) + -48 | 0;
          p = 1;
          l = 3
        } else {
          t = -1;
          p = n;
          l = 1
        }
        l = m + l | 0;
        c[G >> 2] = l;
        m = a[l >> 0] | 0;
        n = (m << 24 >> 24) + -32 | 0;
        if (n >>> 0 > 31 | (1 << n & 75913 | 0) == 0) o = 0;
        else {
          o = 0;
          do {
            o = 1 << n | o;
            l = l + 1 | 0;
            c[G >> 2] = l;
            m = a[l >> 0] | 0;
            n = (m << 24 >> 24) + -32 | 0
          } while (!(n >>> 0 > 31 | (1 << n & 75913 | 0) == 0))
        }
        if (m << 24 >> 24 == 42) {
          if ((bo(a[l + 1 >> 0] | 0) | 0) != 0 ? (H = c[G >> 2] | 0, (a[H + 2 >> 0] | 0) == 36) : 0) {
            l = H + 1 | 0;
            c[i + ((a[l >> 0] | 0) + -48 << 2) >> 2] = 10;
            l = c[h + ((a[l >> 0] | 0) + -48 << 3) >> 2] | 0;
            n = 1;
            m = H + 3 | 0
          } else {
            if (p | 0) {
              e = -1;
              break
            }
            if (y) {
              w = (c[f >> 2] | 0) + (4 - 1) & ~(4 - 1);
              l = c[w >> 2] | 0;
              c[f >> 2] = w + 4
            } else l = 0;
            n = 0;
            m = (c[G >> 2] | 0) + 1 | 0
          }
          c[G >> 2] = m;
          w = (l | 0) < 0;
          v = w ? 0 - l | 0 : l;
          o = w ? o | 8192 : o;
          w = n
        } else {
          l = uo(G) | 0;
          if ((l | 0) < 0) {
            e = -1;
            break
          }
          v = l;
          w = p;
          m = c[G >> 2] | 0
        }
        do
          if ((a[m >> 0] | 0) == 46) {
            l = m + 1 | 0;
            if ((a[l >> 0] | 0) != 42) {
              c[G >> 2] = l;
              l = uo(G) | 0;
              m = c[G >> 2] | 0;
              break
            }
            if (bo(a[m + 2 >> 0] | 0) | 0 ? (F = c[G >> 2] | 0, (a[F + 3 >> 0] | 0) == 36) : 0) {
              l = F + 2 | 0;
              c[i + ((a[l >> 0] | 0) + -48 << 2) >> 2] = 10;
              l = c[h + ((a[l >> 0] | 0) + -48 << 3) >> 2] | 0;
              m = F + 4 | 0;
              c[G >> 2] = m;
              break
            }
            if (w | 0) {
              e = -1;
              break a
            }
            if (y) {
              s = (c[f >> 2] | 0) + (4 - 1) & ~(4 - 1);
              l = c[s >> 2] | 0;
              c[f >> 2] = s + 4
            } else l = 0;
            m = (c[G >> 2] | 0) + 2 | 0;
            c[G >> 2] = m
          } else l = -1; while (0);
        s = 0;
        while (1) {
          if (((a[m >> 0] | 0) + -65 | 0) >>> 0 > 57) {
            e = -1;
            break a
          }
          n = m;
          m = m + 1 | 0;
          c[G >> 2] = m;
          n = a[(a[n >> 0] | 0) + -65 + (176 + (s * 58 | 0)) >> 0] | 0;
          p = n & 255;
          if ((p + -1 | 0) >>> 0 >= 8) break;
          else s = p
        }
        if (!(n << 24 >> 24)) {
          e = -1;
          break
        }
        q = (t | 0) > -1;
        do
          if (n << 24 >> 24 == 19)
            if (q) {
              e = -1;
              break a
            } else x = 54;
        else {
          if (q) {
            c[i + (t << 2) >> 2] = p;
            q = h + (t << 3) | 0;
            t = c[q + 4 >> 2] | 0;
            x = I;
            c[x >> 2] = c[q >> 2];
            c[x + 4 >> 2] = t;
            x = 54;
            break
          }
          if (!y) {
            e = 0;
            break a
          }
          vo(I, p, f, k);
          m = c[G >> 2] | 0;
          x = 55
        } while (0);
        if ((x | 0) == 54) {
          x = 0;
          if (y) x = 55;
          else l = 0
        }
        d: do
          if ((x | 0) == 55) {
            x = 0;
            m = a[m + -1 >> 0] | 0;
            m = (s | 0) != 0 & (m & 15 | 0) == 3 ? m & -33 : m;
            n = o & -65537;
            t = (o & 8192 | 0) == 0 ? o : n;
            e: do switch (m | 0) {
              case 110:
                switch ((s & 255) << 24 >> 24) {
                case 0: {
                  c[c[I >> 2] >> 2] = e;
                  l = 0;
                  break d
                }
                case 1: {
                  c[c[I >> 2] >> 2] = e;
                  l = 0;
                  break d
                }
                case 2: {
                  l = c[I >> 2] | 0;
                  c[l >> 2] = e;
                  c[l + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;
                  l = 0;
                  break d
                }
                case 3: {
                  b[c[I >> 2] >> 1] = e;
                  l = 0;
                  break d
                }
                case 4: {
                  a[c[I >> 2] >> 0] = e;
                  l = 0;
                  break d
                }
                case 6: {
                  c[c[I >> 2] >> 2] = e;
                  l = 0;
                  break d
                }
                case 7: {
                  l = c[I >> 2] | 0;
                  c[l >> 2] = e;
                  c[l + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;
                  l = 0;
                  break d
                }
                default: {
                  l = 0;
                  break d
                }
                }
                case 112: {
                  m = 120;
                  l = l >>> 0 > 8 ? l : 8;
                  n = t | 8;
                  x = 67;
                  break
                }
                case 88:
                case 120: {
                  n = t;
                  x = 67;
                  break
                }
                case 111: {
                  q = I;
                  q = xo(c[q >> 2] | 0, c[q + 4 >> 2] | 0, z) | 0;
                  n = A - q | 0;
                  o = 0;
                  p = 20230;
                  l = (t & 8 | 0) == 0 | (l | 0) > (n | 0) ? l : n + 1 | 0;
                  n = t;
                  x = 73;
                  break
                }
                case 105:
                case 100: {
                  n = I;
                  m = c[n >> 2] | 0;
                  n = c[n + 4 >> 2] | 0;
                  if ((n | 0) < 0) {
                    m = mr(0, 0, m | 0, n | 0) | 0;
                    n = u() | 0;
                    o = I;
                    c[o >> 2] = m;
                    c[o + 4 >> 2] = n;
                    o = 1;
                    p = 20230;
                    x = 72;
                    break e
                  } else {
                    o = (t & 2049 | 0) != 0 & 1;
                    p = (t & 2048 | 0) == 0 ? ((t & 1 | 0) == 0 ? 20230 : 20232) : 20231;
                    x = 72;
                    break e
                  }
                }
                case 117: {
                  n = I;
                  o = 0;
                  p = 20230;
                  m = c[n >> 2] | 0;
                  n = c[n + 4 >> 2] | 0;
                  x = 72;
                  break
                }
                case 99: {
                  a[B >> 0] = c[I >> 2];
                  r = B;
                  o = 0;
                  p = 20230;
                  q = 1;
                  m = n;
                  l = A;
                  break
                }
                case 115: {
                  s = c[I >> 2] | 0;
                  s = (s | 0) == 0 ? 20240 : s;
                  t = no(s, 0, l) | 0;
                  K = (t | 0) == 0;
                  r = s;
                  o = 0;
                  p = 20230;
                  q = K ? l : t - s | 0;
                  m = n;
                  l = K ? s + l | 0 : t;
                  break
                }
                case 67: {
                  c[D >> 2] = c[I >> 2];
                  c[C >> 2] = 0;
                  c[I >> 2] = D;
                  p = -1;
                  x = 79;
                  break
                }
                case 83: {
                  if (!l) {
                    zo(d, 32, v, 0, t);
                    l = 0;
                    x = 89
                  } else {
                    p = l;
                    x = 79
                  }
                  break
                }
                case 65:
                case 71:
                case 70:
                case 69:
                case 97:
                case 103:
                case 102:
                case 101: {
                  l = _[j & 1](d, +g[I >> 3], v, l, t, m) | 0;
                  break d
                }
                default: {
                  o = 0;
                  p = 20230;
                  q = l;
                  m = t;
                  l = A
                }
              }
              while (0);
              f: do
                if ((x | 0) == 67) {
                  q = I;
                  q = wo(c[q >> 2] | 0, c[q + 4 >> 2] | 0, z, m & 32) | 0;
                  p = I;
                  p = (n & 8 | 0) == 0 | (c[p >> 2] | 0) == 0 & (c[p + 4 >> 2] | 0) == 0;
                  o = p ? 0 : 2;
                  p = p ? 20230 : 20230 + (m >>> 4) | 0;
                  x = 73
                } else if ((x | 0) == 72) {
              q = yo(m, n, z) | 0;
              n = t;
              x = 73
            } else if ((x | 0) == 79) {
              x = 0;
              o = c[I >> 2] | 0;
              l = 0;
              while (1) {
                m = c[o >> 2] | 0;
                if (!m) break;
                m = Ao(E, m) | 0;
                n = (m | 0) < 0;
                if (n | m >>> 0 > (p - l | 0) >>> 0) {
                  x = 83;
                  break
                }
                l = m + l | 0;
                if (p >>> 0 > l >>> 0) o = o + 4 | 0;
                else break
              }
              if ((x | 0) == 83) {
                x = 0;
                if (n) {
                  e = -1;
                  break a
                }
              }
              zo(d, 32, v, l, t);
              if (!l) {
                l = 0;
                x = 89
              } else {
                n = c[I >> 2] | 0;
                o = 0;
                while (1) {
                  m = c[n >> 2] | 0;
                  if (!m) {
                    x = 89;
                    break f
                  }
                  m = Ao(E, m) | 0;
                  o = m + o | 0;
                  if ((o | 0) > (l | 0)) {
                    x = 89;
                    break f
                  }
                  to(d, E, m);
                  if (o >>> 0 >= l >>> 0) {
                    x = 89;
                    break
                  } else n = n + 4 | 0
                }
              }
            }
            while (0);
            if ((x | 0) == 73) {
              x = 0;
              m = I;
              m = (c[m >> 2] | 0) != 0 | (c[m + 4 >> 2] | 0) != 0;
              K = (l | 0) != 0 | m;
              m = A - q + ((m ^ 1) & 1) | 0;
              r = K ? q : z;
              q = K ? ((l | 0) > (m | 0) ? l : m) : 0;
              m = (l | 0) > -1 ? n & -65537 : n;
              l = A
            } else if ((x | 0) == 89) {
              x = 0;
              zo(d, 32, v, l, t ^ 8192);
              l = (v | 0) > (l | 0) ? v : l;
              break
            }
            t = l - r | 0;
            s = (q | 0) < (t | 0) ? t : q;
            K = s + o | 0;
            l = (v | 0) < (K | 0) ? K : v;
            zo(d, 32, l, K, m);
            to(d, p, o);
            zo(d, 48, l, K, m ^ 65536);
            zo(d, 48, s, t, 0);
            to(d, r, t);
            zo(d, 32, l, K, m ^ 8192)
          }
        while (0);
        n = w
      }
      g: do
        if ((x | 0) == 92)
          if (!d)
            if (!n) e = 0;
            else {
              e = 1;
              while (1) {
                l = c[i + (e << 2) >> 2] | 0;
                if (!l) break;
                vo(h + (e << 3) | 0, l, f, k);
                e = e + 1 | 0;
                if (e >>> 0 >= 10) {
                  e = 1;
                  break g
                }
              }
              while (1) {
                if (c[i + (e << 2) >> 2] | 0) {
                  e = -1;
                  break g
                }
                e = e + 1 | 0;
                if (e >>> 0 >= 10) {
                  e = 1;
                  break
                }
              }
            }
      while (0);
      V = J;
      return e | 0
    }

    function to(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      if (!(c[a >> 2] & 32)) jo(b, d, a) | 0;
      return
    }

    function uo(b) {
      b = b | 0;
      var d = 0,
        e = 0;
      if (!(bo(a[c[b >> 2] >> 0] | 0) | 0)) d = 0;
      else {
        d = 0;
        do {
          e = c[b >> 2] | 0;
          d = (d * 10 | 0) + -48 + (a[e >> 0] | 0) | 0;
          e = e + 1 | 0;
          c[b >> 2] = e
        } while ((bo(a[e >> 0] | 0) | 0) != 0)
      }
      return d | 0
    }

    function vo(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        h = 0.0;
      a: do
          if (b >>> 0 <= 20)
            do switch (b | 0) {
            case 9: {
              b = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
              e = c[b >> 2] | 0;
              c[d >> 2] = b + 4;
              c[a >> 2] = e;
              break a
            }
            case 10: {
              e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
              b = c[e >> 2] | 0;
              c[d >> 2] = e + 4;
              e = a;
              c[e >> 2] = b;
              c[e + 4 >> 2] = ((b | 0) < 0) << 31 >> 31;
              break a
            }
            case 11: {
              e = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
              b = c[e >> 2] | 0;
              c[d >> 2] = e + 4;
              e = a;
              c[e >> 2] = b;
              c[e + 4 >> 2] = 0;
              break a
            }
            case 12: {
              e = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);
              b = e;
              f = c[b >> 2] | 0;
              b = c[b + 4 >> 2] | 0;
              c[d >> 2] = e + 8;
              e = a;
              c[e >> 2] = f;
              c[e + 4 >> 2] = b;
              break a
            }
            case 13: {
              f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
              e = c[f >> 2] | 0;
              c[d >> 2] = f + 4;
              e = (e & 65535) << 16 >> 16;
              f = a;
              c[f >> 2] = e;
              c[f + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;
              break a
            }
            case 14: {
              f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
              e = c[f >> 2] | 0;
              c[d >> 2] = f + 4;
              f = a;
              c[f >> 2] = e & 65535;
              c[f + 4 >> 2] = 0;
              break a
            }
            case 15: {
              f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
              e = c[f >> 2] | 0;
              c[d >> 2] = f + 4;
              e = (e & 255) << 24 >> 24;
              f = a;
              c[f >> 2] = e;
              c[f + 4 >> 2] = ((e | 0) < 0) << 31 >> 31;
              break a
            }
            case 16: {
              f = (c[d >> 2] | 0) + (4 - 1) & ~(4 - 1);
              e = c[f >> 2] | 0;
              c[d >> 2] = f + 4;
              f = a;
              c[f >> 2] = e & 255;
              c[f + 4 >> 2] = 0;
              break a
            }
            case 17: {
              f = (c[d >> 2] | 0) + (8 - 1) & ~(8 - 1);
              h = +g[f >> 3];
              c[d >> 2] = f + 8;
              g[a >> 3] = h;
              break a
            }
            case 18: {
              da[e & 15](a, d);
              break a
            }
            default:
              break a
            }
            while (0); while (0);
        return
    }

    function wo(b, c, e, f) {
      b = b | 0;
      c = c | 0;
      e = e | 0;
      f = f | 0;
      if (!((b | 0) == 0 & (c | 0) == 0))
        do {
          e = e + -1 | 0;
          a[e >> 0] = d[640 + (b & 15) >> 0] | 0 | f;
          b = qr(b | 0, c | 0, 4) | 0;
          c = u() | 0
        } while (!((b | 0) == 0 & (c | 0) == 0));
      return e | 0
    }

    function xo(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      if (!((b | 0) == 0 & (c | 0) == 0))
        do {
          d = d + -1 | 0;
          a[d >> 0] = b & 7 | 48;
          b = qr(b | 0, c | 0, 3) | 0;
          c = u() | 0
        } while (!((b | 0) == 0 & (c | 0) == 0));
      return d | 0
    }

    function yo(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0;
      if (c >>> 0 > 0 | (c | 0) == 0 & b >>> 0 > 4294967295) {
        do {
          e = b;
          b = pr(b | 0, c | 0, 10, 0) | 0;
          f = c;
          c = u() | 0;
          g = kr(b | 0, c | 0, 10, 0) | 0;
          g = mr(e | 0, f | 0, g | 0, u() | 0) | 0;
          u() | 0;
          d = d + -1 | 0;
          a[d >> 0] = g & 255 | 48
        } while (f >>> 0 > 9 | (f | 0) == 9 & e >>> 0 > 4294967295);
        c = b
      } else c = b;
      if (c)
        do {
          g = c;
          c = (c >>> 0) / 10 | 0;
          d = d + -1 | 0;
          a[d >> 0] = g - (c * 10 | 0) | 48
        } while (g >>> 0 >= 10);
      return d | 0
    }

    function zo(a, b, c, d, e) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0;
      g = V;
      V = V + 256 | 0;
      f = g;
      if ((c | 0) > (d | 0) & (e & 73728 | 0) == 0) {
        e = c - d | 0;
        wr(f | 0, b << 24 >> 24 | 0, (e >>> 0 < 256 ? e : 256) | 0) | 0;
        if (e >>> 0 > 255) {
          b = c - d | 0;
          do {
            to(a, f, 256);
            e = e + -256 | 0
          } while (e >>> 0 > 255);
          e = b & 255
        }
        to(a, f, e)
      }
      V = g;
      return
    }

    function Ao(a, b) {
      a = a | 0;
      b = b | 0;
      if (!a) a = 0;
      else a = Bo(a, b, 0) | 0;
      return a | 0
    }

    function Bo(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      do
        if (b) {
          if (d >>> 0 < 128) {
            a[b >> 0] = d;
            b = 1;
            break
          }
          if (!(c[c[(Co() | 0) + 176 >> 2] >> 2] | 0))
            if ((d & -128 | 0) == 57216) {
              a[b >> 0] = d;
              b = 1;
              break
            } else {
              c[(ao() | 0) >> 2] = 25;
              b = -1;
              break
            } if (d >>> 0 < 2048) {
            a[b >> 0] = d >>> 6 | 192;
            a[b + 1 >> 0] = d & 63 | 128;
            b = 2;
            break
          }
          if (d >>> 0 < 55296 | (d & -8192 | 0) == 57344) {
            a[b >> 0] = d >>> 12 | 224;
            a[b + 1 >> 0] = d >>> 6 & 63 | 128;
            a[b + 2 >> 0] = d & 63 | 128;
            b = 3;
            break
          }
          if ((d + -65536 | 0) >>> 0 < 1048576) {
            a[b >> 0] = d >>> 18 | 240;
            a[b + 1 >> 0] = d >>> 12 & 63 | 128;
            a[b + 2 >> 0] = d >>> 6 & 63 | 128;
            a[b + 3 >> 0] = d & 63 | 128;
            b = 4;
            break
          } else {
            c[(ao() | 0) >> 2] = 25;
            b = -1;
            break
          }
        } else b = 1; while (0);
      return b | 0
    }

    function Co() {
      return co() | 0
    }

    function Do(a) {
      a = +a;
      var b = 0;
      g[h >> 3] = a;
      b = c[h >> 2] | 0;
      t(c[h + 4 >> 2] | 0);
      return b | 0
    }

    function Eo(a, b) {
      a = +a;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0;
      g[h >> 3] = a;
      d = c[h >> 2] | 0;
      e = c[h + 4 >> 2] | 0;
      f = qr(d | 0, e | 0, 52) | 0;
      u() | 0;
      switch (f & 2047) {
      case 0: {
        if (a != 0.0) {
          a = +Eo(a * 18446744073709551616.0, b);
          d = (c[b >> 2] | 0) + -64 | 0
        } else d = 0;
        c[b >> 2] = d;
        break
      }
      case 2047:
        break;
      default: {
        c[b >> 2] = (f & 2047) + -1022;
        c[h >> 2] = d;
        c[h + 4 >> 2] = e & -2146435073 | 1071644672;
        a = +g[h >> 3]
      }
      }
      return +a
    }

    function Fo(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      a: do
        if (!d) b = 0;
        else {
          while (1) {
            e = a[b >> 0] | 0;
            f = a[c >> 0] | 0;
            if (e << 24 >> 24 != f << 24 >> 24) break;
            d = d + -1 | 0;
            if (!d) {
              b = 0;
              break a
            } else {
              b = b + 1 | 0;
              c = c + 1 | 0
            }
          }
          b = (e & 255) - (f & 255) | 0
        }
      while (0);
      return b | 0
    }

    function Go(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0;
      f = V;
      V = V + 16 | 0;
      g = f;
      c[g >> 2] = e;
      e = Ho(a, b, d, g) | 0;
      V = f;
      return e | 0
    }

    function Ho(b, d, e, f) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0;
      j = V;
      V = V + 160 | 0;
      g = j + 144 | 0;
      i = j;
      ur(i | 0, 3672, 144) | 0;
      if ((d + -1 | 0) >>> 0 > 2147483646)
        if (!d) {
          b = g;
          d = 1;
          h = 4
        } else {
          c[(ao() | 0) >> 2] = 61;
          d = -1
        }
      else h = 4;
      if ((h | 0) == 4) {
        h = -2 - b | 0;
        h = d >>> 0 > h >>> 0 ? h : d;
        c[i + 48 >> 2] = h;
        g = i + 20 | 0;
        c[g >> 2] = b;
        c[i + 44 >> 2] = b;
        d = b + h | 0;
        b = i + 16 | 0;
        c[b >> 2] = d;
        c[i + 28 >> 2] = d;
        d = oo(i, e, f) | 0;
        if (h) {
          i = c[g >> 2] | 0;
          a[i + (((i | 0) == (c[b >> 2] | 0)) << 31 >> 31) >> 0] = 0
        }
      }
      V = j;
      return d | 0
    }

    function Io(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      e = a + 20 | 0;
      f = c[e >> 2] | 0;
      a = (c[a + 16 >> 2] | 0) - f | 0;
      a = a >>> 0 > d >>> 0 ? d : a;
      ur(f | 0, b | 0, a | 0) | 0;
      c[e >> 2] = (c[e >> 2] | 0) + a;
      return d | 0
    }

    function Jo(a) {
      a = a | 0;
      var b = 0,
        c = 0;
      b = (fo(a) | 0) + 1 | 0;
      c = dr(b) | 0;
      if (!c) a = 0;
      else a = ur(c | 0, a | 0, b | 0) | 0;
      return a | 0
    }

    function Ko(b, e) {
      b = b | 0;
      e = e | 0;
      var f = 0,
        g = 0;
      f = 0;
      while (1) {
        if ((d[656 + f >> 0] | 0) == (b | 0)) {
          g = 4;
          break
        }
        f = f + 1 | 0;
        if ((f | 0) == 87) {
          b = 87;
          g = 5;
          break
        }
      }
      if ((g | 0) == 4)
        if (!f) f = 752;
        else {
          b = f;
          g = 5
        } if ((g | 0) == 5) {
        f = 752;
        do {
          do {
            g = f;
            f = f + 1 | 0
          } while ((a[g >> 0] | 0) != 0);
          b = b + -1 | 0
        } while ((b | 0) != 0)
      }
      return Lo(f, c[e + 20 >> 2] | 0) | 0
    }

    function Lo(a, b) {
      a = a | 0;
      b = b | 0;
      return ko(a, b) | 0
    }

    function Mo(a) {
      a = a | 0;
      return Ko(a, c[(No() | 0) + 176 >> 2] | 0) | 0
    }

    function No() {
      return co() | 0
    }

    function Oo(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0;
      e = Mo(b) | 0;
      b = fo(e) | 0;
      if (b >>> 0 >= d >>> 0) {
        b = d + -1 | 0;
        if (!d) b = 68;
        else {
          ur(c | 0, e | 0, b | 0) | 0;
          a[c + b >> 0] = 0;
          b = 68
        }
      } else {
        ur(c | 0, e | 0, b + 1 | 0) | 0;
        b = 0
      }
      return b | 0
    }

    function Po() {
      var a = 0,
        b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      e = V;
      V = V + 48 | 0;
      g = e + 32 | 0;
      b = e + 24 | 0;
      h = e + 16 | 0;
      f = e;
      e = e + 36 | 0;
      a = Qo() | 0;
      if (a | 0 ? (d = c[a >> 2] | 0, d | 0) : 0) {
        a = d + 48 | 0;
        if (!(Ro(a) | 0)) {
          c[b >> 2] = 20420;
          To(20370, b)
        }
        b = So(a) | 0;
        if ((b | 0) == 1126902529 & (u() | 0) == 1129074247) a = c[d + 44 >> 2] | 0;
        else a = d + 80 | 0;
        c[e >> 2] = a;
        d = c[d >> 2] | 0;
        a = c[d + 4 >> 2] | 0;
        if (aa[c[(c[954] | 0) + 16 >> 2] & 7](3816, d, e) | 0) {
          h = c[e >> 2] | 0;
          h = Z[c[(c[h >> 2] | 0) + 8 >> 2] & 15](h) | 0;
          c[f >> 2] = 20420;
          c[f + 4 >> 2] = a;
          c[f + 8 >> 2] = h;
          To(20284, f)
        } else {
          c[h >> 2] = 20420;
          c[h + 4 >> 2] = a;
          To(20329, h)
        }
      }
      To(20408, g)
    }

    function Qo() {
      return 21640
    }

    function Ro(a) {
      a = a | 0;
      a = So(a) | 0;
      return (a & -256 | 0) == 1126902528 & (u() | 0) == 1129074247 | 0
    }

    function So(a) {
      a = a | 0;
      var b = 0;
      b = a;
      a = c[b >> 2] | 0;
      t(c[b + 4 >> 2] | 0);
      return a | 0
    }

    function To(a, b) {
      a = a | 0;
      b = b | 0;
      U()
    }

    function Uo(a) {
      a = a | 0;
      return
    }

    function Vo(a) {
      a = a | 0;
      Uo(a);
      jp(a);
      return
    }

    function Wo(a) {
      a = a | 0;
      return
    }

    function Xo(a) {
      a = a | 0;
      return
    }

    function Yo(d, e, f) {
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0;
      l = V;
      V = V + 64 | 0;
      j = l;
      if (!(ap(d, e, 0) | 0))
        if ((e | 0) != 0 ? (k = ep(e, 3840, 3824, 0) | 0, (k | 0) != 0) : 0) {
          c[j >> 2] = k;
          c[j + 4 >> 2] = 0;
          c[j + 8 >> 2] = d;
          c[j + 12 >> 2] = -1;
          d = j + 16 | 0;
          e = j + 24 | 0;
          g = j + 48 | 0;
          h = d;
          i = h + 36 | 0;
          do {
            c[h >> 2] = 0;
            h = h + 4 | 0
          } while ((h | 0) < (i | 0));
          b[d + 36 >> 1] = 0;
          a[d + 38 >> 0] = 0;
          c[g >> 2] = 1;
          fa[c[(c[k >> 2] | 0) + 28 >> 2] & 7](k, j, c[f >> 2] | 0, 1);
          if ((c[e >> 2] | 0) == 1) {
            c[f >> 2] = c[d >> 2];
            d = 1
          } else d = 0
        } else d = 0;
      else d = 1;
      V = l;
      return d | 0
    }

    function Zo(a, b, d, e, f, g) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      if (ap(a, c[b + 8 >> 2] | 0, g) | 0) dp(0, b, d, e, f);
      return
    }

    function _o(b, d, e, f, g) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      var h = 0;
      do
        if (!(ap(b, c[d + 8 >> 2] | 0, g) | 0)) {
          if (ap(b, c[d >> 2] | 0, g) | 0) {
            if ((c[d + 16 >> 2] | 0) != (e | 0) ? (h = d + 20 | 0, (c[h >> 2] | 0) != (e | 0)) : 0) {
              c[d + 32 >> 2] = f;
              c[h >> 2] = e;
              g = d + 40 | 0;
              c[g >> 2] = (c[g >> 2] | 0) + 1;
              if ((c[d + 36 >> 2] | 0) == 1 ? (c[d + 24 >> 2] | 0) == 2 : 0) a[d + 54 >> 0] = 1;
              c[d + 44 >> 2] = 4;
              break
            }
            if ((f | 0) == 1) c[d + 32 >> 2] = 1
          }
        } else cp(0, d, e, f); while (0);
      return
    }

    function $o(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      if (ap(a, c[b + 8 >> 2] | 0, 0) | 0) bp(0, b, d, e);
      return
    }

    function ap(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      if (d)
        if ((a | 0) == (b | 0)) a = 1;
        else a = (eo(c[a + 4 >> 2] | 0, c[b + 4 >> 2] | 0) | 0) == 0;
      else a = (c[a + 4 >> 2] | 0) == (c[b + 4 >> 2] | 0);
      return a | 0
    }

    function bp(b, d, e, f) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0;
      b = d + 16 | 0;
      g = c[b >> 2] | 0;
      do
        if (g) {
          if ((g | 0) != (e | 0)) {
            f = d + 36 | 0;
            c[f >> 2] = (c[f >> 2] | 0) + 1;
            c[d + 24 >> 2] = 2;
            a[d + 54 >> 0] = 1;
            break
          }
          b = d + 24 | 0;
          if ((c[b >> 2] | 0) == 2) c[b >> 2] = f
        } else {
          c[b >> 2] = e;
          c[d + 24 >> 2] = f;
          c[d + 36 >> 2] = 1
        } while (0);
      return
    }

    function cp(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0;
      if ((c[b + 4 >> 2] | 0) == (d | 0) ? (f = b + 28 | 0, (c[f >> 2] | 0) != 1) : 0) c[f >> 2] = e;
      return
    }

    function dp(b, d, e, f, g) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      a[d + 53 >> 0] = 1;
      do
        if ((c[d + 4 >> 2] | 0) == (f | 0)) {
          a[d + 52 >> 0] = 1;
          b = d + 16 | 0;
          f = c[b >> 2] | 0;
          if (!f) {
            c[b >> 2] = e;
            c[d + 24 >> 2] = g;
            c[d + 36 >> 2] = 1;
            if (!((g | 0) == 1 ? (c[d + 48 >> 2] | 0) == 1 : 0)) break;
            a[d + 54 >> 0] = 1;
            break
          }
          if ((f | 0) != (e | 0)) {
            g = d + 36 | 0;
            c[g >> 2] = (c[g >> 2] | 0) + 1;
            a[d + 54 >> 0] = 1;
            break
          }
          f = d + 24 | 0;
          b = c[f >> 2] | 0;
          if ((b | 0) == 2) {
            c[f >> 2] = g;
            b = g
          }
          if ((b | 0) == 1 ? (c[d + 48 >> 2] | 0) == 1 : 0) a[d + 54 >> 0] = 1
        } while (0);
      return
    }

    function ep(d, e, f, g) {
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0;
      p = V;
      V = V + 64 | 0;
      n = p;
      m = c[d >> 2] | 0;
      o = d + (c[m + -8 >> 2] | 0) | 0;
      m = c[m + -4 >> 2] | 0;
      c[n >> 2] = f;
      c[n + 4 >> 2] = d;
      c[n + 8 >> 2] = e;
      c[n + 12 >> 2] = g;
      d = n + 16 | 0;
      e = n + 20 | 0;
      g = n + 24 | 0;
      h = n + 28 | 0;
      i = n + 32 | 0;
      j = n + 40 | 0;
      k = d;
      l = k + 36 | 0;
      do {
        c[k >> 2] = 0;
        k = k + 4 | 0
      } while ((k | 0) < (l | 0));
      b[d + 36 >> 1] = 0;
      a[d + 38 >> 0] = 0;
      a: do
        if (ap(m, f, 0) | 0) {
          c[n + 48 >> 2] = 1;
          ha[c[(c[m >> 2] | 0) + 20 >> 2] & 3](m, n, o, o, 1, 0);
          d = (c[g >> 2] | 0) == 1 ? o : 0
        } else {
          ga[c[(c[m >> 2] | 0) + 24 >> 2] & 3](m, n, o, 1, 0);
          switch (c[n + 36 >> 2] | 0) {
          case 0: {
            d = (c[j >> 2] | 0) == 1 & (c[h >> 2] | 0) == 1 & (c[i >> 2] | 0) == 1 ? c[e >> 2] | 0 : 0;
            break a
          }
          case 1:
            break;
          default: {
            d = 0;
            break a
          }
          }
          if ((c[g >> 2] | 0) != 1 ? !((c[j >> 2] | 0) == 0 & (c[h >> 2] | 0) == 1 & (c[i >> 2] | 0) == 1) : 0) {
            d = 0;
            break
          }
          d = c[d >> 2] | 0
        }
      while (0);
      V = p;
      return d | 0
    }

    function fp(a) {
      a = a | 0;
      Uo(a);
      jp(a);
      return
    }

    function gp(a, b, d, e, f, g) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      if (ap(a, c[b + 8 >> 2] | 0, g) | 0) dp(0, b, d, e, f);
      else {
        a = c[a + 8 >> 2] | 0;
        ha[c[(c[a >> 2] | 0) + 20 >> 2] & 3](a, b, d, e, f, g)
      }
      return
    }

    function hp(b, d, e, f, g) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0,
        j = 0;
      a: do
        if (!(ap(b, c[d + 8 >> 2] | 0, g) | 0)) {
          if (!(ap(b, c[d >> 2] | 0, g) | 0)) {
            i = c[b + 8 >> 2] | 0;
            ga[c[(c[i >> 2] | 0) + 24 >> 2] & 3](i, d, e, f, g);
            break
          }
          if ((c[d + 16 >> 2] | 0) != (e | 0) ? (i = d + 20 | 0, (c[i >> 2] | 0) != (e | 0)) : 0) {
            c[d + 32 >> 2] = f;
            f = d + 44 | 0;
            do
              if ((c[f >> 2] | 0) != 4) {
                h = d + 52 | 0;
                a[h >> 0] = 0;
                j = d + 53 | 0;
                a[j >> 0] = 0;
                b = c[b + 8 >> 2] | 0;
                ha[c[(c[b >> 2] | 0) + 20 >> 2] & 3](b, d, e, e, 1, g);
                if (a[j >> 0] | 0) {
                  j = (a[h >> 0] | 0) == 0;
                  c[f >> 2] = 3;
                  if (j) break;
                  else break a
                } else {
                  c[f >> 2] = 4;
                  break
                }
              } while (0);
            c[i >> 2] = e;
            j = d + 40 | 0;
            c[j >> 2] = (c[j >> 2] | 0) + 1;
            if ((c[d + 36 >> 2] | 0) != 1) break;
            if ((c[d + 24 >> 2] | 0) != 2) break;
            a[d + 54 >> 0] = 1;
            break
          }
          if ((f | 0) == 1) c[d + 32 >> 2] = 1
        } else cp(0, d, e, f); while (0);
      return
    }

    function ip(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      if (ap(a, c[b + 8 >> 2] | 0, 0) | 0) bp(0, b, d, e);
      else {
        a = c[a + 8 >> 2] | 0;
        fa[c[(c[a >> 2] | 0) + 28 >> 2] & 7](a, b, d, e)
      }
      return
    }

    function jp(a) {
      a = a | 0;
      er(a);
      return
    }

    function kp(a) {
      a = a | 0;
      return
    }

    function lp() {
      var a = 0,
        b = 0;
      a = Qo() | 0;
      if ((a | 0 ? (b = c[a >> 2] | 0, b | 0) : 0) ? Ro(b + 48 | 0) | 0 : 0) mp(c[b + 12 >> 2] | 0);
      mp(np() | 0)
    }

    function mp(a) {
      a = a | 0;
      var b = 0;
      b = V;
      V = V + 16 | 0;
      ba[a & 3]();
      To(20559, b)
    }

    function np() {
      return 2
    }

    function op(a) {
      a = a | 0;
      return
    }

    function pp(a) {
      a = a | 0;
      jp(a);
      return
    }

    function qp(a) {
      a = a | 0;
      return 20599
    }

    function rp(a) {
      a = a | 0;
      c[a >> 2] = 5916;
      vp(a + 4 | 0);
      return
    }

    function sp(a) {
      a = a | 0;
      rp(a);
      jp(a);
      return
    }

    function tp(a) {
      a = a | 0;
      return up(a + 4 | 0) | 0
    }

    function up(a) {
      a = a | 0;
      return c[a >> 2] | 0
    }

    function vp(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      if (wp(a) | 0 ? (b = xp(c[a >> 2] | 0) | 0, d = b + 8 | 0, a = c[d >> 2] | 0, c[d >> 2] = a + -1, (a | 0) < 1) : 0) jp(b);
      return
    }

    function wp(a) {
      a = a | 0;
      return 1
    }

    function xp(a) {
      a = a | 0;
      return a + -12 | 0
    }

    function yp(a) {
      a = a | 0;
      c[a >> 2] = 5936;
      vp(a + 4 | 0);
      return
    }

    function zp(a) {
      a = a | 0;
      yp(a);
      jp(a);
      return
    }

    function Ap(a) {
      a = a | 0;
      return up(a + 4 | 0) | 0
    }

    function Bp(a) {
      a = a | 0;
      rp(a);
      jp(a);
      return
    }

    function Cp(a) {
      a = a | 0;
      rp(a);
      jp(a);
      return
    }

    function Dp() {
      var a = 0;
      a = V;
      V = V + 16 | 0;
      To(20848, a)
    }

    function Ep(a) {
      a = a | 0;
      Uo(a);
      jp(a);
      return
    }

    function Fp(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return ap(a, b, 0) | 0
    }

    function Gp(a) {
      a = a | 0;
      Uo(a);
      jp(a);
      return
    }

    function Hp(d, e, f) {
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0;
      n = V;
      V = V + 64 | 0;
      l = n;
      do
        if (!(ap(e, 4048, 0) | 0)) {
          if (Ip(d, e, 0) | 0) {
            e = c[f >> 2] | 0;
            if (!e) {
              e = 1;
              break
            }
            c[f >> 2] = c[e >> 2];
            e = 1;
            break
          }
          if ((e | 0) != 0 ? (g = ep(e, 3840, 3976, 0) | 0, (g | 0) != 0) : 0) {
            e = c[f >> 2] | 0;
            if (e | 0) c[f >> 2] = c[e >> 2];
            e = c[g + 8 >> 2] | 0;
            i = d + 8 | 0;
            h = c[i >> 2] | 0;
            if ((e & 7 & (h ^ 7) | 0) == 0 ? ((e & 96 ^ 96) & h | 0) == 0 : 0) {
              h = d + 12 | 0;
              d = c[h >> 2] | 0;
              g = g + 12 | 0;
              e = c[g >> 2] | 0;
              if (!(ap(d, e, 0) | 0)) {
                if (ap(d, 4040, 0) | 0) {
                  if (!e) {
                    e = 1;
                    break
                  }
                  e = (ep(e, 3840, 3992, 0) | 0) == 0;
                  break
                }
                if (d) {
                  e = ep(d, 3840, 3976, 0) | 0;
                  if (e | 0) {
                    if (!(c[i >> 2] & 1)) {
                      e = 0;
                      break
                    }
                    e = Jp(e, c[g >> 2] | 0) | 0;
                    break
                  }
                  e = c[h >> 2] | 0;
                  if (e) {
                    e = ep(e, 3840, 4008, 0) | 0;
                    if (e | 0) {
                      if (!(c[i >> 2] & 1)) {
                        e = 0;
                        break
                      }
                      e = Kp(e, c[g >> 2] | 0) | 0;
                      break
                    }
                    e = c[h >> 2] | 0;
                    if ((((e | 0) != 0 ? (j = ep(e, 3840, 3824, 0) | 0, (j | 0) != 0) : 0) ? (k = c[g >> 2] | 0, (k | 0) != 0) : 0) ? (m = ep(k, 3840, 3824, 0) | 0, (m | 0) != 0) : 0) {
                      c[l >> 2] = m;
                      c[l + 4 >> 2] = 0;
                      c[l + 8 >> 2] = j;
                      c[l + 12 >> 2] = -1;
                      e = l + 16 | 0;
                      d = l + 24 | 0;
                      g = l + 48 | 0;
                      h = e;
                      i = h + 36 | 0;
                      do {
                        c[h >> 2] = 0;
                        h = h + 4 | 0
                      } while ((h | 0) < (i | 0));
                      b[e + 36 >> 1] = 0;
                      a[e + 38 >> 0] = 0;
                      c[g >> 2] = 1;
                      fa[c[(c[m >> 2] | 0) + 28 >> 2] & 7](m, l, c[f >> 2] | 0, 1);
                      do
                        if ((c[d >> 2] | 0) == 1) {
                          if (!(c[f >> 2] | 0)) {
                            e = 1;
                            break
                          }
                          c[f >> 2] = c[e >> 2];
                          e = 1
                        } else e = 0; while (0)
                    } else e = 0
                  } else e = 0
                } else e = 0
              } else e = 1
            } else e = 0
          } else e = 0
        } else {
          c[f >> 2] = 0;
          e = 1
        } while (0);
      V = n;
      return e | 0
    }

    function Ip(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      if (!(c[a + 8 >> 2] & 24))
        if ((b | 0) != 0 ? (e = ep(b, 3840, 3960, 0) | 0, (e | 0) != 0) : 0) {
          d = (c[e + 8 >> 2] & 24 | 0) != 0;
          f = 5
        } else d = 0;
      else {
        d = 1;
        f = 5
      }
      if ((f | 0) == 5) d = ap(a, b, d) | 0;
      return d | 0
    }

    function Jp(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0;
      while (1) {
        if (!b) {
          b = 0;
          break
        }
        d = ep(b, 3840, 3976, 0) | 0;
        if (!d) {
          b = 0;
          break
        }
        f = c[a + 8 >> 2] | 0;
        if (c[d + 8 >> 2] & ~f | 0) {
          b = 0;
          break
        }
        e = a + 12 | 0;
        b = c[e >> 2] | 0;
        d = d + 12 | 0;
        if (ap(b, c[d >> 2] | 0, 0) | 0) {
          b = 1;
          break
        }
        if ((f & 1 | 0) == 0 | (b | 0) == 0) {
          b = 0;
          break
        }
        a = ep(b, 3840, 3976, 0) | 0;
        if (!a) {
          h = 9;
          break
        }
        b = c[d >> 2] | 0
      }
      if ((h | 0) == 9) {
        b = c[e >> 2] | 0;
        if ((b | 0) != 0 ? (g = ep(b, 3840, 4008, 0) | 0, (g | 0) != 0) : 0) b = Kp(g, c[d >> 2] | 0) | 0;
        else b = 0
      }
      return b | 0
    }

    function Kp(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0;
      if ((((b | 0) != 0 ? (d = ep(b, 3840, 4008, 0) | 0, (d | 0) != 0) : 0) ? (c[d + 8 >> 2] & ~c[a + 8 >> 2] | 0) == 0 : 0) ? ap(c[a + 12 >> 2] | 0, c[d + 12 >> 2] | 0, 0) | 0 : 0) a = ap(c[a + 16 >> 2] | 0, c[d + 16 >> 2] | 0, 0) | 0;
      else a = 0;
      return a | 0
    }

    function Lp(a) {
      a = a | 0;
      Uo(a);
      jp(a);
      return
    }

    function Mp(b, d, e, f, g, h) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      h = h | 0;
      var i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0;
      if (ap(b, c[d + 8 >> 2] | 0, h) | 0) dp(0, d, e, f, g);
      else {
        r = d + 52 | 0;
        j = a[r >> 0] | 0;
        q = d + 53 | 0;
        i = a[q >> 0] | 0;
        p = c[b + 12 >> 2] | 0;
        m = b + 16 + (p << 3) | 0;
        a[r >> 0] = 0;
        a[q >> 0] = 0;
        Qp(b + 16 | 0, d, e, f, g, h);
        k = a[r >> 0] | 0;
        j = k | j;
        l = a[q >> 0] | 0;
        i = l | i;
        a: do
          if ((p | 0) > 1) {
            n = d + 24 | 0;
            o = b + 8 | 0;
            p = d + 54 | 0;
            b = b + 24 | 0;
            do {
              i = i & 1;
              j = j & 1;
              if (a[p >> 0] | 0) break a;
              if (!(k << 24 >> 24)) {
                if (l << 24 >> 24 ? (c[o >> 2] & 1 | 0) == 0 : 0) break a
              } else {
                if ((c[n >> 2] | 0) == 1) break a;
                if (!(c[o >> 2] & 2)) break a
              }
              a[r >> 0] = 0;
              a[q >> 0] = 0;
              Qp(b, d, e, f, g, h);
              k = a[r >> 0] | 0;
              j = k | j;
              l = a[q >> 0] | 0;
              i = l | i;
              b = b + 8 | 0
            } while (b >>> 0 < m >>> 0)
          }
        while (0);
        a[r >> 0] = j << 24 >> 24 != 0 & 1;
        a[q >> 0] = i << 24 >> 24 != 0 & 1
      }
      return
    }

    function Np(b, d, e, f, g) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0;
      a: do
        if (!(ap(b, c[d + 8 >> 2] | 0, g) | 0)) {
          if (!(ap(b, c[d >> 2] | 0, g) | 0)) {
            p = c[b + 12 >> 2] | 0;
            k = b + 16 + (p << 3) | 0;
            Rp(b + 16 | 0, d, e, f, g);
            h = b + 24 | 0;
            if ((p | 0) <= 1) break;
            b = c[b + 8 >> 2] | 0;
            if ((b & 2 | 0) == 0 ? (j = d + 36 | 0, (c[j >> 2] | 0) != 1) : 0) {
              if (!(b & 1)) {
                b = d + 54 | 0;
                while (1) {
                  if (a[b >> 0] | 0) break a;
                  if ((c[j >> 2] | 0) == 1) break a;
                  Rp(h, d, e, f, g);
                  h = h + 8 | 0;
                  if (h >>> 0 >= k >>> 0) break a
                }
              }
              b = d + 24 | 0;
              i = d + 54 | 0;
              while (1) {
                if (a[i >> 0] | 0) break a;
                if ((c[j >> 2] | 0) == 1 ? (c[b >> 2] | 0) == 1 : 0) break a;
                Rp(h, d, e, f, g);
                h = h + 8 | 0;
                if (h >>> 0 >= k >>> 0) break a
              }
            }
            b = d + 54 | 0;
            while (1) {
              if (a[b >> 0] | 0) break a;
              Rp(h, d, e, f, g);
              h = h + 8 | 0;
              if (h >>> 0 >= k >>> 0) break a
            }
          }
          if ((c[d + 16 >> 2] | 0) != (e | 0) ? (p = d + 20 | 0, (c[p >> 2] | 0) != (e | 0)) : 0) {
            c[d + 32 >> 2] = f;
            o = d + 44 | 0;
            if ((c[o >> 2] | 0) != 4) {
              j = b + 16 + (c[b + 12 >> 2] << 3) | 0;
              k = d + 52 | 0;
              f = d + 53 | 0;
              l = d + 54 | 0;
              m = b + 8 | 0;
              n = d + 24 | 0;
              h = 0;
              i = b + 16 | 0;
              b = 0;
              b: while (1) {
                if (i >>> 0 >= j >>> 0) {
                  i = 18;
                  break
                }
                a[k >> 0] = 0;
                a[f >> 0] = 0;
                Qp(i, d, e, e, 1, g);
                if (a[l >> 0] | 0) {
                  i = 18;
                  break
                }
                do
                  if (a[f >> 0] | 0) {
                    if (!(a[k >> 0] | 0))
                      if (!(c[m >> 2] & 1)) {
                        i = 19;
                        break b
                      } else {
                        b = 1;
                        break
                      } if ((c[n >> 2] | 0) == 1) {
                      h = 1;
                      i = 19;
                      break b
                    }
                    if (!(c[m >> 2] & 2)) {
                      h = 1;
                      i = 19;
                      break b
                    } else {
                      h = 1;
                      b = 1
                    }
                  } while (0);
                i = i + 8 | 0
              }
              if ((i | 0) == 18)
                if (b) i = 19;
                else b = 4;
              if ((i | 0) == 19) b = 3;
              c[o >> 2] = b;
              if (h & 1) break
            }
            c[p >> 2] = e;
            e = d + 40 | 0;
            c[e >> 2] = (c[e >> 2] | 0) + 1;
            if ((c[d + 36 >> 2] | 0) != 1) break;
            if ((c[d + 24 >> 2] | 0) != 2) break;
            a[d + 54 >> 0] = 1;
            break
          }
          if ((f | 0) == 1) c[d + 32 >> 2] = 1
        } else cp(0, d, e, f); while (0);
      return
    }

    function Op(b, d, e, f) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0;
      a: do
        if (!(ap(b, c[d + 8 >> 2] | 0, 0) | 0)) {
          h = c[b + 12 >> 2] | 0;
          g = b + 16 + (h << 3) | 0;
          Pp(b + 16 | 0, d, e, f);
          if ((h | 0) > 1) {
            h = d + 54 | 0;
            b = b + 24 | 0;
            do {
              Pp(b, d, e, f);
              if (a[h >> 0] | 0) break a;
              b = b + 8 | 0
            } while (b >>> 0 < g >>> 0)
          }
        } else bp(0, d, e, f); while (0);
      return
    }

    function Pp(a, b, d, e) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0;
      g = c[a + 4 >> 2] | 0;
      if (d) {
        f = g >> 8;
        if (g & 1) f = c[(c[d >> 2] | 0) + f >> 2] | 0
      } else f = 0;
      a = c[a >> 2] | 0;
      fa[c[(c[a >> 2] | 0) + 28 >> 2] & 7](a, b, d + f | 0, (g & 2 | 0) == 0 ? 2 : e);
      return
    }

    function Qp(a, b, d, e, f, g) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0;
      i = c[a + 4 >> 2] | 0;
      h = i >> 8;
      if (i & 1) h = c[(c[e >> 2] | 0) + h >> 2] | 0;
      a = c[a >> 2] | 0;
      ha[c[(c[a >> 2] | 0) + 20 >> 2] & 3](a, b, d, e + h | 0, (i & 2 | 0) == 0 ? 2 : f, g);
      return
    }

    function Rp(a, b, d, e, f) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0;
      h = c[a + 4 >> 2] | 0;
      g = h >> 8;
      if (h & 1) g = c[(c[d >> 2] | 0) + g >> 2] | 0;
      a = c[a >> 2] | 0;
      ga[c[(c[a >> 2] | 0) + 24 >> 2] & 3](a, b, d + g | 0, (h & 2 | 0) == 0 ? 2 : e, f);
      return
    }

    function Sp(a) {
      a = a | 0;
      c[a >> 2] = 5896;
      return
    }

    function Tp(a) {
      a = a | 0;
      var b = 0,
        c = 0;
      b = V;
      V = V + 16 | 0;
      c = b;
      Up(c, a);
      a = Vp(c) | 0;
      V = b;
      return a | 0
    }

    function Up(a, b) {
      a = a | 0;
      b = b | 0;
      _p(a, b);
      return
    }

    function Vp(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      Wp(d, c[a + 4 >> 2] | 0);
      if (!((Xp(d) | 0) << 24 >> 24)) a = Zp(Yp(a) | 0) | 0;
      else a = 0;
      V = b;
      return a | 0
    }

    function Wp(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = b;
      return
    }

    function Xp(b) {
      b = b | 0;
      return a[c[b >> 2] >> 0] | 0
    }

    function Yp(a) {
      a = a | 0;
      return a | 0
    }

    function Zp(b) {
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0,
        g = 0;
      g = V;
      V = V + 16 | 0;
      f = g;
      b = c[b + 8 >> 2] | 0;
      d = a[b >> 0] | 0;
      do
        if (d << 24 >> 24 != 1)
          if (!(d & 2)) {
            a[b >> 0] = 2;
            e = 1;
            break
          } else To(20985, f);
      else e = 0; while (0);
      V = g;
      return e | 0
    }

    function _p(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = b;
      c[a + 4 >> 2] = b;
      c[a + 8 >> 2] = b + 1;
      c[a + 12 >> 2] = 0;
      return
    }

    function $p(a) {
      a = a | 0;
      var b = 0,
        c = 0;
      b = V;
      V = V + 16 | 0;
      c = b;
      Up(c, a);
      aq(c);
      V = b;
      return
    }

    function aq(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = V;
      V = V + 16 | 0;
      d = b;
      Wp(d, c[a + 4 >> 2] | 0);
      bq(d);
      cq(Yp(a) | 0);
      V = b;
      return
    }

    function bq(b) {
      b = b | 0;
      a[c[b >> 2] >> 0] = 1;
      return
    }

    function cq(b) {
      b = b | 0;
      a[c[b + 8 >> 2] >> 0] = 1;
      return
    }

    function dq() {
      return 0
    }

    function eq(a) {
      a = a | 0;
      var b = 0,
        c = 0;
      c = (a | 0) == 0 ? 1 : a;
      while (1) {
        b = dr(c) | 0;
        if (b | 0) {
          a = 6;
          break
        }
        a = dq() | 0;
        if (!a) {
          a = 5;
          break
        }
        ba[a & 3]()
      }
      if ((a | 0) == 5) {
        c = v(4) | 0;
        Sp(c);
        x(c | 0, 3880, 121)
      } else if ((a | 0) == 6) return b | 0;
      return 0
    }

    function fq(a) {
      a = a | 0;
      return eq(a) | 0
    }

    function gq(a) {
      a = a | 0;
      jp(a);
      return
    }

    function hq(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      f = V;
      V = V + 16 | 0;
      e = f;
      c[e >> 2] = c[d >> 2];
      a = aa[c[(c[a >> 2] | 0) + 16 >> 2] & 7](a, b, e) | 0;
      if (a) c[d >> 2] = c[e >> 2];
      V = f;
      return a & 1 | 0
    }

    function iq(a) {
      a = a | 0;
      if (!a) a = 0;
      else a = (ep(a, 3840, 3976, 0) | 0) != 0 & 1;
      return a | 0
    }

    function jq(a) {
      a = a | 0;
      return 0
    }

    function kq() {
      return (lq() | 0) > 0 | 0
    }

    function lq() {
      return y() | 0
    }

    function mq(a) {
      a = a | 0;
      return
    }

    function nq(a) {
      a = a | 0;
      mq(a);
      jp(a);
      return
    }

    function oq(a) {
      a = a | 0;
      return 21039
    }

    function pq(a) {
      a = a | 0;
      return
    }

    function qq(a) {
      a = a | 0;
      var b = 0,
        d = 0;
      b = a + 8 | 0;
      if (!((c[b >> 2] | 0) != 0 ? (d = c[b >> 2] | 0, c[b >> 2] = d + -1, (d | 0) != 0) : 0)) ca[c[(c[a >> 2] | 0) + 16 >> 2] & 255](a);
      return
    }

    function rq(a) {
      a = a | 0;
      a = jq(a) | 0;
      if (!a) return;
      else br(a, 21145)
    }

    function sq(a) {
      a = a | 0;
      return
    }

    function tq(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0;
      e = fo(b) | 0;
      d = eq(e + 13 | 0) | 0;
      c[d >> 2] = e;
      c[d + 4 >> 2] = e;
      c[d + 8 >> 2] = 0;
      d = uq(d) | 0;
      ur(d | 0, b | 0, e + 1 | 0) | 0;
      c[a >> 2] = d;
      return
    }

    function uq(a) {
      a = a | 0;
      return a + 12 | 0
    }

    function vq(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = 5916;
      tq(a + 4 | 0, b);
      return
    }

    function wq(b, d) {
      b = b | 0;
      d = d | 0;
      c[b >> 2] = 5936;
      tq(b + 4 | 0, (a[d + 11 >> 0] | 0) < 0 ? c[d >> 2] | 0 : d);
      return
    }

    function xq(a, b) {
      a = a | 0;
      b = b | 0;
      c[a >> 2] = 5936;
      tq(a + 4 | 0, b);
      return
    }

    function yq(a) {
      a = a | 0;
      a = v(8) | 0;
      vq(a, 21163);
      c[a >> 2] = 5956;
      x(a | 0, 3928, 123)
    }

    function zq(a) {
      a = a | 0;
      a = v(8) | 0;
      vq(a, 21163);
      c[a >> 2] = 5976;
      x(a | 0, 3944, 123)
    }

    function Aq(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0;
      g = V;
      V = V + 16 | 0;
      f = g;
      if (e >>> 0 > 4294967279) yq(b);
      if (e >>> 0 < 11) a[b + 11 >> 0] = e;
      else {
        i = e + 16 & -16;
        h = eq(i) | 0;
        c[b >> 2] = h;
        c[b + 8 >> 2] = i | -2147483648;
        c[b + 4 >> 2] = e;
        b = h
      }
      Bq(b, d, e) | 0;
      a[f >> 0] = 0;
      nb(b + e | 0, f);
      V = g;
      return
    }

    function Bq(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      if (c | 0) ur(a | 0, b | 0, c | 0) | 0;
      return a | 0
    }

    function Cq(b) {
      b = b | 0;
      if ((a[b + 11 >> 0] | 0) < 0) Da(c[b >> 2] | 0, c[b + 8 >> 2] & 2147483647);
      return
    }

    function Dq(b, d, e, f, g, h, i, j) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      h = h | 0;
      i = i | 0;
      j = j | 0;
      var k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0;
      o = V;
      V = V + 16 | 0;
      n = o;
      if ((-18 - d | 0) >>> 0 < e >>> 0) yq(b);
      if ((a[b + 11 >> 0] | 0) < 0) m = c[b >> 2] | 0;
      else m = b;
      if (d >>> 0 < 2147483623) {
        k = e + d | 0;
        l = d << 1;
        k = k >>> 0 < l >>> 0 ? l : k;
        k = k >>> 0 < 11 ? 11 : k + 16 & -16
      } else k = -17;
      l = eq(k) | 0;
      if (g | 0) Bq(l, m, g) | 0;
      if (i | 0) Bq(l + g | 0, j, i) | 0;
      f = f - h | 0;
      e = f - g | 0;
      if (e | 0) Bq(l + g + i | 0, m + g + h | 0, e) | 0;
      e = d + 1 | 0;
      if ((e | 0) != 11) Da(m, e);
      c[b >> 2] = l;
      c[b + 8 >> 2] = k | -2147483648;
      i = f + i | 0;
      c[b + 4 >> 2] = i;
      a[n >> 0] = 0;
      nb(l + i | 0, n);
      V = o;
      return
    }

    function Eq(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0;
      k = V;
      V = V + 16 | 0;
      i = k;
      j = b + 11 | 0;
      f = a[j >> 0] | 0;
      h = f << 24 >> 24 < 0;
      if (h) {
        g = (c[b + 8 >> 2] & 2147483647) + -1 | 0;
        f = c[b + 4 >> 2] | 0
      } else {
        g = 10;
        f = f & 255
      }
      if ((g - f | 0) >>> 0 >= e >>> 0) {
        if (e | 0) {
          if (h) g = c[b >> 2] | 0;
          else g = b;
          Bq(g + f | 0, d, e) | 0;
          f = f + e | 0;
          if ((a[j >> 0] | 0) < 0) c[b + 4 >> 2] = f;
          else a[j >> 0] = f;
          a[i >> 0] = 0;
          nb(g + f | 0, i)
        }
      } else Dq(b, g, f + e - g | 0, f, f, 0, e, d);
      V = k;
      return b | 0
    }

    function Fq(a, b) {
      a = a | 0;
      b = b | 0;
      return Eq(a, b, lb(b) | 0) | 0
    }

    function Gq(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      if (!c) a = 0;
      else a = Fo(a, b, c) | 0;
      return a | 0
    }

    function Hq(b, d, e, f, g) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      var h = 0,
        i = 0;
      h = a[b + 11 >> 0] | 0;
      i = h << 24 >> 24 < 0;
      if (i) h = c[b + 4 >> 2] | 0;
      else h = h & 255;
      if ((g | 0) == -1 | h >>> 0 < d >>> 0) zq(b);
      h = h - d | 0;
      e = h >>> 0 < e >>> 0 ? h : e;
      if (i) b = c[b >> 2] | 0;
      h = e >>> 0 > g >>> 0;
      b = Gq(b + d | 0, f, h ? g : e) | 0;
      if (!b) return (e >>> 0 < g >>> 0 ? -1 : h & 1) | 0;
      else return b | 0;
      return 0
    }

    function Iq(a) {
      a = a | 0;
      return
    }

    function Jq(a) {
      a = a | 0;
      jp(a);
      return
    }

    function Kq(a) {
      a = a | 0;
      return 21228
    }

    function Lq(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      c[a >> 2] = d;
      c[a + 4 >> 2] = b;
      return
    }

    function Mq(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      f = V;
      V = V + 16 | 0;
      e = f;
      ea[c[(c[a >> 2] | 0) + 12 >> 2] & 15](e, a, b);
      if ((c[e + 4 >> 2] | 0) == (c[d + 4 >> 2] | 0)) a = (c[e >> 2] | 0) == (c[d >> 2] | 0);
      else a = 0;
      V = f;
      return a | 0
    }

    function Nq(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      return ((c[b >> 2] | 0) == (d | 0) ? (c[b + 4 >> 2] | 0) == (a | 0) : 0) | 0
    }

    function Oq(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      if ((c | 0) > 256) Aq(a, 21176, lb(21176) | 0);
      else Pq(a, 0, c);
      return
    }

    function Pq(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      Qq(a, c);
      return
    }

    function Qq(b, d) {
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0;
      i = V;
      V = V + 1040 | 0;
      g = i + 1024 | 0;
      e = i;
      h = c[(ao() | 0) >> 2] | 0;
      f = Rq(Oo(d, e, 1024) | 0, e) | 0;
      if (!(a[f >> 0] | 0)) {
        c[g >> 2] = d;
        Go(e, 1024, 21211, g) | 0
      } else e = f;
      c[(ao() | 0) >> 2] = h;
      Aq(b, e, lb(e) | 0);
      V = i;
      return
    }

    function Rq(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0;
      switch (a | 0) {
      case 0: {
        d = b;
        break
      }
      case -1: {
        a = c[(ao() | 0) >> 2] | 0;
        e = 3;
        break
      }
      default:
        e = 3
      }
      if ((e | 0) == 3)
        if ((a | 0) == 28) d = 22145;
        else P();
      return d | 0
    }

    function Sq(a) {
      a = a | 0;
      jp(a);
      return
    }

    function Tq(a) {
      a = a | 0;
      return 21353
    }

    function Uq(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      if ((d | 0) > 256) {
        Wq() | 0;
        b = 6180
      } else {
        Xq() | 0;
        b = 6176
      }
      c[a >> 2] = d;
      c[a + 4 >> 2] = b;
      return
    }

    function Vq(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      if ((c | 0) > 256) Aq(a, 21319, lb(21319) | 0);
      else Pq(a, 0, c);
      return
    }

    function Wq() {
      if ((a[21488] | 0) == 0 ? Tp(21488) | 0 : 0) $p(21488);
      return 6180
    }

    function Xq() {
      if ((a[21480] | 0) == 0 ? Tp(21480) | 0 : 0) $p(21480);
      return 6176
    }

    function Yq(a) {
      a = a | 0;
      yp(a);
      return
    }

    function Zq(a) {
      a = a | 0;
      Yq(a);
      jp(a);
      return
    }

    function _q(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0;
      d = c[b + 4 >> 2] | 0;
      ea[c[(c[d >> 2] | 0) + 24 >> 2] & 15](a, d, c[b >> 2] | 0);
      return
    }

    function $q(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0;
      h = V;
      V = V + 16 | 0;
      g = h;
      if (c[d >> 2] | 0) {
        f = a[e + 11 >> 0] | 0;
        if (f << 24 >> 24 < 0) f = c[e + 4 >> 2] | 0;
        else f = f & 255;
        if (f | 0) Fq(e, 21417) | 0;
        _q(g, d);
        d = a[g + 11 >> 0] | 0;
        f = d << 24 >> 24 < 0;
        Eq(e, f ? c[g >> 2] | 0 : g, f ? c[g + 4 >> 2] | 0 : d & 255) | 0;
        Cq(g)
      };
      c[b >> 2] = c[e >> 2];
      c[b + 4 >> 2] = c[e + 4 >> 2];
      c[b + 8 >> 2] = c[e + 8 >> 2];
      f = 0;
      while (1) {
        if ((f | 0) == 3) break;
        c[e + (f << 2) >> 2] = 0;
        f = f + 1 | 0
      }
      V = h;
      return
    }

    function ar(a, b, d) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      var e = 0,
        f = 0,
        g = 0;
      e = V;
      V = V + 32 | 0;
      g = e + 12 | 0;
      f = e;
      Aq(f, d, lb(d) | 0);
      $q(g, b, f);
      wq(a, g);
      Cq(g);
      Cq(f);
      c[a >> 2] = 6192;
      f = b;
      b = c[f + 4 >> 2] | 0;
      d = a + 8 | 0;
      c[d >> 2] = c[f >> 2];
      c[d + 4 >> 2] = b;
      V = e;
      return
    }

    function br(a, b) {
      a = a | 0;
      b = b | 0;
      var d = 0,
        e = 0,
        f = 0;
      f = V;
      V = V + 16 | 0;
      e = f + 8 | 0;
      d = v(16) | 0;
      Wq() | 0;
      c[f >> 2] = a;
      c[f + 4 >> 2] = 6180;
      c[e >> 2] = c[f >> 2];
      c[e + 4 >> 2] = c[f + 4 >> 2];
      ar(d, e, b);
      x(d | 0, 4272, 136)
    }

    function cr(a) {
      a = a | 0;
      a = v(8) | 0;
      vq(a, 21420);
      c[a >> 2] = 5956;
      x(a | 0, 3928, 123)
    }

    function dr(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0,
        q = 0,
        r = 0,
        s = 0,
        t = 0,
        u = 0,
        v = 0,
        w = 0;
      w = V;
      V = V + 16 | 0;
      n = w;
      do
        if (a >>> 0 < 245) {
          k = a >>> 0 < 11 ? 16 : a + 11 & -8;
          a = k >>> 3;
          m = c[5412] | 0;
          d = m >>> a;
          if (d & 3 | 0) {
            b = (d & 1 ^ 1) + a | 0;
            a = 21688 + (b << 1 << 2) | 0;
            d = a + 8 | 0;
            e = c[d >> 2] | 0;
            f = e + 8 | 0;
            g = c[f >> 2] | 0;
            if ((g | 0) == (a | 0)) c[5412] = m & ~(1 << b);
            else {
              c[g + 12 >> 2] = a;
              c[d >> 2] = g
            }
            v = b << 3;
            c[e + 4 >> 2] = v | 3;
            v = e + v + 4 | 0;
            c[v >> 2] = c[v >> 2] | 1;
            v = f;
            V = w;
            return v | 0
          }
          l = c[5414] | 0;
          if (k >>> 0 > l >>> 0) {
            if (d | 0) {
              b = 2 << a;
              b = d << a & (b | 0 - b);
              b = (b & 0 - b) + -1 | 0;
              i = b >>> 12 & 16;
              b = b >>> i;
              d = b >>> 5 & 8;
              b = b >>> d;
              g = b >>> 2 & 4;
              b = b >>> g;
              a = b >>> 1 & 2;
              b = b >>> a;
              e = b >>> 1 & 1;
              e = (d | i | g | a | e) + (b >>> e) | 0;
              b = 21688 + (e << 1 << 2) | 0;
              a = b + 8 | 0;
              g = c[a >> 2] | 0;
              i = g + 8 | 0;
              d = c[i >> 2] | 0;
              if ((d | 0) == (b | 0)) {
                a = m & ~(1 << e);
                c[5412] = a
              } else {
                c[d + 12 >> 2] = b;
                c[a >> 2] = d;
                a = m
              }
              v = e << 3;
              h = v - k | 0;
              c[g + 4 >> 2] = k | 3;
              f = g + k | 0;
              c[f + 4 >> 2] = h | 1;
              c[g + v >> 2] = h;
              if (l | 0) {
                e = c[5417] | 0;
                b = l >>> 3;
                d = 21688 + (b << 1 << 2) | 0;
                b = 1 << b;
                if (!(a & b)) {
                  c[5412] = a | b;
                  b = d;
                  a = d + 8 | 0
                } else {
                  a = d + 8 | 0;
                  b = c[a >> 2] | 0
                }
                c[a >> 2] = e;
                c[b + 12 >> 2] = e;
                c[e + 8 >> 2] = b;
                c[e + 12 >> 2] = d
              }
              c[5414] = h;
              c[5417] = f;
              v = i;
              V = w;
              return v | 0
            }
            g = c[5413] | 0;
            if (g) {
              d = (g & 0 - g) + -1 | 0;
              f = d >>> 12 & 16;
              d = d >>> f;
              e = d >>> 5 & 8;
              d = d >>> e;
              h = d >>> 2 & 4;
              d = d >>> h;
              i = d >>> 1 & 2;
              d = d >>> i;
              j = d >>> 1 & 1;
              j = c[21952 + ((e | f | h | i | j) + (d >>> j) << 2) >> 2] | 0;
              d = j;
              i = j;
              j = (c[j + 4 >> 2] & -8) - k | 0;
              while (1) {
                a = c[d + 16 >> 2] | 0;
                if (!a) {
                  a = c[d + 20 >> 2] | 0;
                  if (!a) break
                }
                h = (c[a + 4 >> 2] & -8) - k | 0;
                f = h >>> 0 < j >>> 0;
                d = a;
                i = f ? a : i;
                j = f ? h : j
              }
              h = i + k | 0;
              if (h >>> 0 > i >>> 0) {
                f = c[i + 24 >> 2] | 0;
                b = c[i + 12 >> 2] | 0;
                do
                  if ((b | 0) == (i | 0)) {
                    a = i + 20 | 0;
                    b = c[a >> 2] | 0;
                    if (!b) {
                      a = i + 16 | 0;
                      b = c[a >> 2] | 0;
                      if (!b) {
                        d = 0;
                        break
                      }
                    }
                    while (1) {
                      e = b + 20 | 0;
                      d = c[e >> 2] | 0;
                      if (!d) {
                        e = b + 16 | 0;
                        d = c[e >> 2] | 0;
                        if (!d) break;
                        else {
                          b = d;
                          a = e
                        }
                      } else {
                        b = d;
                        a = e
                      }
                    }
                    c[a >> 2] = 0;
                    d = b
                  } else {
                    d = c[i + 8 >> 2] | 0;
                    c[d + 12 >> 2] = b;
                    c[b + 8 >> 2] = d;
                    d = b
                  } while (0);
                do
                  if (f | 0) {
                    b = c[i + 28 >> 2] | 0;
                    a = 21952 + (b << 2) | 0;
                    if ((i | 0) == (c[a >> 2] | 0)) {
                      c[a >> 2] = d;
                      if (!d) {
                        c[5413] = g & ~(1 << b);
                        break
                      }
                    } else {
                      v = f + 16 | 0;
                      c[((c[v >> 2] | 0) == (i | 0) ? v : f + 20 | 0) >> 2] = d;
                      if (!d) break
                    }
                    c[d + 24 >> 2] = f;
                    b = c[i + 16 >> 2] | 0;
                    if (b | 0) {
                      c[d + 16 >> 2] = b;
                      c[b + 24 >> 2] = d
                    }
                    b = c[i + 20 >> 2] | 0;
                    if (b | 0) {
                      c[d + 20 >> 2] = b;
                      c[b + 24 >> 2] = d
                    }
                  } while (0);
                if (j >>> 0 < 16) {
                  v = j + k | 0;
                  c[i + 4 >> 2] = v | 3;
                  v = i + v + 4 | 0;
                  c[v >> 2] = c[v >> 2] | 1
                } else {
                  c[i + 4 >> 2] = k | 3;
                  c[h + 4 >> 2] = j | 1;
                  c[h + j >> 2] = j;
                  if (l | 0) {
                    e = c[5417] | 0;
                    b = l >>> 3;
                    d = 21688 + (b << 1 << 2) | 0;
                    b = 1 << b;
                    if (!(b & m)) {
                      c[5412] = b | m;
                      b = d;
                      a = d + 8 | 0
                    } else {
                      a = d + 8 | 0;
                      b = c[a >> 2] | 0
                    }
                    c[a >> 2] = e;
                    c[b + 12 >> 2] = e;
                    c[e + 8 >> 2] = b;
                    c[e + 12 >> 2] = d
                  }
                  c[5414] = j;
                  c[5417] = h
                }
                v = i + 8 | 0;
                V = w;
                return v | 0
              } else m = k
            } else m = k
          } else m = k
        } else if (a >>> 0 <= 4294967231) {
        a = a + 11 | 0;
        k = a & -8;
        e = c[5413] | 0;
        if (e) {
          f = 0 - k | 0;
          a = a >>> 8;
          if (a)
            if (k >>> 0 > 16777215) j = 31;
            else {
              m = (a + 1048320 | 0) >>> 16 & 8;
              q = a << m;
              i = (q + 520192 | 0) >>> 16 & 4;
              q = q << i;
              j = (q + 245760 | 0) >>> 16 & 2;
              j = 14 - (i | m | j) + (q << j >>> 15) | 0;
              j = k >>> (j + 7 | 0) & 1 | j << 1
            }
          else j = 0;
          d = c[21952 + (j << 2) >> 2] | 0;
          a: do
            if (!d) {
              d = 0;
              a = 0;
              q = 61
            } else {
              a = 0;
              i = k << ((j | 0) == 31 ? 0 : 25 - (j >>> 1) | 0);
              g = 0;
              while (1) {
                h = (c[d + 4 >> 2] & -8) - k | 0;
                if (h >>> 0 < f >>> 0)
                  if (!h) {
                    a = d;
                    f = 0;
                    q = 65;
                    break a
                  } else {
                    a = d;
                    f = h
                  } q = c[d + 20 >> 2] | 0;
                d = c[d + 16 + (i >>> 31 << 2) >> 2] | 0;
                g = (q | 0) == 0 | (q | 0) == (d | 0) ? g : q;
                if (!d) {
                  d = g;
                  q = 61;
                  break
                } else i = i << 1
              }
            }
          while (0);
          if ((q | 0) == 61) {
            if ((d | 0) == 0 & (a | 0) == 0) {
              a = 2 << j;
              a = (a | 0 - a) & e;
              if (!a) {
                m = k;
                break
              }
              m = (a & 0 - a) + -1 | 0;
              h = m >>> 12 & 16;
              m = m >>> h;
              g = m >>> 5 & 8;
              m = m >>> g;
              i = m >>> 2 & 4;
              m = m >>> i;
              j = m >>> 1 & 2;
              m = m >>> j;
              d = m >>> 1 & 1;
              a = 0;
              d = c[21952 + ((g | h | i | j | d) + (m >>> d) << 2) >> 2] | 0
            }
            if (!d) {
              i = a;
              h = f
            } else q = 65
          }
          if ((q | 0) == 65) {
            g = d;
            while (1) {
              m = (c[g + 4 >> 2] & -8) - k | 0;
              d = m >>> 0 < f >>> 0;
              f = d ? m : f;
              a = d ? g : a;
              d = c[g + 16 >> 2] | 0;
              if (!d) d = c[g + 20 >> 2] | 0;
              if (!d) {
                i = a;
                h = f;
                break
              } else g = d
            }
          }
          if (((i | 0) != 0 ? h >>> 0 < ((c[5414] | 0) - k | 0) >>> 0 : 0) ? (l = i + k | 0, l >>> 0 > i >>> 0) : 0) {
            g = c[i + 24 >> 2] | 0;
            b = c[i + 12 >> 2] | 0;
            do
              if ((b | 0) == (i | 0)) {
                a = i + 20 | 0;
                b = c[a >> 2] | 0;
                if (!b) {
                  a = i + 16 | 0;
                  b = c[a >> 2] | 0;
                  if (!b) {
                    b = 0;
                    break
                  }
                }
                while (1) {
                  f = b + 20 | 0;
                  d = c[f >> 2] | 0;
                  if (!d) {
                    f = b + 16 | 0;
                    d = c[f >> 2] | 0;
                    if (!d) break;
                    else {
                      b = d;
                      a = f
                    }
                  } else {
                    b = d;
                    a = f
                  }
                }
                c[a >> 2] = 0
              } else {
                v = c[i + 8 >> 2] | 0;
                c[v + 12 >> 2] = b;
                c[b + 8 >> 2] = v
              } while (0);
            do
              if (g) {
                a = c[i + 28 >> 2] | 0;
                d = 21952 + (a << 2) | 0;
                if ((i | 0) == (c[d >> 2] | 0)) {
                  c[d >> 2] = b;
                  if (!b) {
                    e = e & ~(1 << a);
                    c[5413] = e;
                    break
                  }
                } else {
                  v = g + 16 | 0;
                  c[((c[v >> 2] | 0) == (i | 0) ? v : g + 20 | 0) >> 2] = b;
                  if (!b) break
                }
                c[b + 24 >> 2] = g;
                a = c[i + 16 >> 2] | 0;
                if (a | 0) {
                  c[b + 16 >> 2] = a;
                  c[a + 24 >> 2] = b
                }
                a = c[i + 20 >> 2] | 0;
                if (a) {
                  c[b + 20 >> 2] = a;
                  c[a + 24 >> 2] = b
                }
              } while (0);
            b: do
              if (h >>> 0 < 16) {
                v = h + k | 0;
                c[i + 4 >> 2] = v | 3;
                v = i + v + 4 | 0;
                c[v >> 2] = c[v >> 2] | 1
              } else {
                c[i + 4 >> 2] = k | 3;
                c[l + 4 >> 2] = h | 1;
                c[l + h >> 2] = h;
                b = h >>> 3;
                if (h >>> 0 < 256) {
                  d = 21688 + (b << 1 << 2) | 0;
                  a = c[5412] | 0;
                  b = 1 << b;
                  if (!(a & b)) {
                    c[5412] = a | b;
                    b = d;
                    a = d + 8 | 0
                  } else {
                    a = d + 8 | 0;
                    b = c[a >> 2] | 0
                  }
                  c[a >> 2] = l;
                  c[b + 12 >> 2] = l;
                  c[l + 8 >> 2] = b;
                  c[l + 12 >> 2] = d;
                  break
                }
                b = h >>> 8;
                if (b)
                  if (h >>> 0 > 16777215) d = 31;
                  else {
                    u = (b + 1048320 | 0) >>> 16 & 8;
                    v = b << u;
                    t = (v + 520192 | 0) >>> 16 & 4;
                    v = v << t;
                    d = (v + 245760 | 0) >>> 16 & 2;
                    d = 14 - (t | u | d) + (v << d >>> 15) | 0;
                    d = h >>> (d + 7 | 0) & 1 | d << 1
                  }
                else d = 0;
                b = 21952 + (d << 2) | 0;
                c[l + 28 >> 2] = d;
                a = l + 16 | 0;
                c[a + 4 >> 2] = 0;
                c[a >> 2] = 0;
                a = 1 << d;
                if (!(e & a)) {
                  c[5413] = e | a;
                  c[b >> 2] = l;
                  c[l + 24 >> 2] = b;
                  c[l + 12 >> 2] = l;
                  c[l + 8 >> 2] = l;
                  break
                }
                b = c[b >> 2] | 0;
                c: do
                  if ((c[b + 4 >> 2] & -8 | 0) != (h | 0)) {
                    e = h << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
                    while (1) {
                      d = b + 16 + (e >>> 31 << 2) | 0;
                      a = c[d >> 2] | 0;
                      if (!a) break;
                      if ((c[a + 4 >> 2] & -8 | 0) == (h | 0)) {
                        b = a;
                        break c
                      } else {
                        e = e << 1;
                        b = a
                      }
                    }
                    c[d >> 2] = l;
                    c[l + 24 >> 2] = b;
                    c[l + 12 >> 2] = l;
                    c[l + 8 >> 2] = l;
                    break b
                  }
                while (0);
                u = b + 8 | 0;
                v = c[u >> 2] | 0;
                c[v + 12 >> 2] = l;
                c[u >> 2] = l;
                c[l + 8 >> 2] = v;
                c[l + 12 >> 2] = b;
                c[l + 24 >> 2] = 0
              }
            while (0);
            v = i + 8 | 0;
            V = w;
            return v | 0
          } else m = k
        } else m = k
      } else m = -1;
      while (0);
      d = c[5414] | 0;
      if (d >>> 0 >= m >>> 0) {
        b = d - m | 0;
        a = c[5417] | 0;
        if (b >>> 0 > 15) {
          v = a + m | 0;
          c[5417] = v;
          c[5414] = b;
          c[v + 4 >> 2] = b | 1;
          c[a + d >> 2] = b;
          c[a + 4 >> 2] = m | 3
        } else {
          c[5414] = 0;
          c[5417] = 0;
          c[a + 4 >> 2] = d | 3;
          v = a + d + 4 | 0;
          c[v >> 2] = c[v >> 2] | 1
        }
        v = a + 8 | 0;
        V = w;
        return v | 0
      }
      h = c[5415] | 0;
      if (h >>> 0 > m >>> 0) {
        t = h - m | 0;
        c[5415] = t;
        v = c[5418] | 0;
        u = v + m | 0;
        c[5418] = u;
        c[u + 4 >> 2] = t | 1;
        c[v + 4 >> 2] = m | 3;
        v = v + 8 | 0;
        V = w;
        return v | 0
      }
      if (!(c[5530] | 0)) {
        c[5532] = 4096;
        c[5531] = 4096;
        c[5533] = -1;
        c[5534] = -1;
        c[5535] = 0;
        c[5523] = 0;
        c[5530] = n & -16 ^ 1431655768;
        a = 4096
      } else a = c[5532] | 0;
      i = m + 48 | 0;
      j = m + 47 | 0;
      g = a + j | 0;
      f = 0 - a | 0;
      k = g & f;
      if (k >>> 0 <= m >>> 0) {
        v = 0;
        V = w;
        return v | 0
      }
      a = c[5522] | 0;
      if (a | 0 ? (l = c[5520] | 0, n = l + k | 0, n >>> 0 <= l >>> 0 | n >>> 0 > a >>> 0) : 0) {
        v = 0;
        V = w;
        return v | 0
      }
      d: do
        if (!(c[5523] & 4)) {
          d = c[5418] | 0;
          e: do
            if (d) {
              e = 22096;
              while (1) {
                n = c[e >> 2] | 0;
                if (n >>> 0 <= d >>> 0 ? (n + (c[e + 4 >> 2] | 0) | 0) >>> 0 > d >>> 0 : 0) break;
                a = c[e + 8 >> 2] | 0;
                if (!a) {
                  q = 128;
                  break e
                } else e = a
              }
              b = g - h & f;
              if (b >>> 0 < 2147483647) {
                a = fr(b) | 0;
                if ((a | 0) == ((c[e >> 2] | 0) + (c[e + 4 >> 2] | 0) | 0)) {
                  if ((a | 0) != (-1 | 0)) {
                    h = b;
                    g = a;
                    q = 145;
                    break d
                  }
                } else {
                  e = a;
                  q = 136
                }
              } else b = 0
            } else q = 128; while (0);
          do
            if ((q | 0) == 128) {
              d = fr(0) | 0;
              if ((d | 0) != (-1 | 0) ? (b = d, o = c[5531] | 0, p = o + -1 | 0, b = ((p & b | 0) == 0 ? 0 : (p + b & 0 - o) - b | 0) + k | 0, o = c[5520] | 0, p = b + o | 0, b >>> 0 > m >>> 0 & b >>> 0 < 2147483647) : 0) {
                n = c[5522] | 0;
                if (n | 0 ? p >>> 0 <= o >>> 0 | p >>> 0 > n >>> 0 : 0) {
                  b = 0;
                  break
                }
                a = fr(b) | 0;
                if ((a | 0) == (d | 0)) {
                  h = b;
                  g = d;
                  q = 145;
                  break d
                } else {
                  e = a;
                  q = 136
                }
              } else b = 0
            } while (0);
          do
            if ((q | 0) == 136) {
              d = 0 - b | 0;
              if (!(i >>> 0 > b >>> 0 & (b >>> 0 < 2147483647 & (e | 0) != (-1 | 0))))
                if ((e | 0) == (-1 | 0)) {
                  b = 0;
                  break
                } else {
                  h = b;
                  g = e;
                  q = 145;
                  break d
                } a = c[5532] | 0;
              a = j - b + a & 0 - a;
              if (a >>> 0 >= 2147483647) {
                h = b;
                g = e;
                q = 145;
                break d
              }
              if ((fr(a) | 0) == (-1 | 0)) {
                fr(d) | 0;
                b = 0;
                break
              } else {
                h = a + b | 0;
                g = e;
                q = 145;
                break d
              }
            } while (0);
          c[5523] = c[5523] | 4;
          q = 143
        } else {
          b = 0;
          q = 143
        }
      while (0);
      if (((q | 0) == 143 ? k >>> 0 < 2147483647 : 0) ? (t = fr(k) | 0, p = fr(0) | 0, r = p - t | 0, s = r >>> 0 > (m + 40 | 0) >>> 0, !((t | 0) == (-1 | 0) | s ^ 1 | t >>> 0 < p >>> 0 & ((t | 0) != (-1 | 0) & (p | 0) != (-1 | 0)) ^ 1)) : 0) {
        h = s ? r : b;
        g = t;
        q = 145
      }
      if ((q | 0) == 145) {
        b = (c[5520] | 0) + h | 0;
        c[5520] = b;
        if (b >>> 0 > (c[5521] | 0) >>> 0) c[5521] = b;
        j = c[5418] | 0;
        f: do
          if (j) {
            b = 22096;
            while (1) {
              a = c[b >> 2] | 0;
              d = c[b + 4 >> 2] | 0;
              if ((g | 0) == (a + d | 0)) {
                q = 154;
                break
              }
              e = c[b + 8 >> 2] | 0;
              if (!e) break;
              else b = e
            }
            if (((q | 0) == 154 ? (u = b + 4 | 0, (c[b + 12 >> 2] & 8 | 0) == 0) : 0) ? g >>> 0 > j >>> 0 & a >>> 0 <= j >>> 0 : 0) {
              c[u >> 2] = d + h;
              v = (c[5415] | 0) + h | 0;
              t = j + 8 | 0;
              t = (t & 7 | 0) == 0 ? 0 : 0 - t & 7;
              u = j + t | 0;
              t = v - t | 0;
              c[5418] = u;
              c[5415] = t;
              c[u + 4 >> 2] = t | 1;
              c[j + v + 4 >> 2] = 40;
              c[5419] = c[5534];
              break
            }
            if (g >>> 0 < (c[5416] | 0) >>> 0) c[5416] = g;
            d = g + h | 0;
            b = 22096;
            while (1) {
              if ((c[b >> 2] | 0) == (d | 0)) {
                q = 162;
                break
              }
              a = c[b + 8 >> 2] | 0;
              if (!a) break;
              else b = a
            }
            if ((q | 0) == 162 ? (c[b + 12 >> 2] & 8 | 0) == 0 : 0) {
              c[b >> 2] = g;
              l = b + 4 | 0;
              c[l >> 2] = (c[l >> 2] | 0) + h;
              l = g + 8 | 0;
              l = g + ((l & 7 | 0) == 0 ? 0 : 0 - l & 7) | 0;
              b = d + 8 | 0;
              b = d + ((b & 7 | 0) == 0 ? 0 : 0 - b & 7) | 0;
              k = l + m | 0;
              i = b - l - m | 0;
              c[l + 4 >> 2] = m | 3;
              g: do
                if ((j | 0) == (b | 0)) {
                  v = (c[5415] | 0) + i | 0;
                  c[5415] = v;
                  c[5418] = k;
                  c[k + 4 >> 2] = v | 1
                } else {
                  if ((c[5417] | 0) == (b | 0)) {
                    v = (c[5414] | 0) + i | 0;
                    c[5414] = v;
                    c[5417] = k;
                    c[k + 4 >> 2] = v | 1;
                    c[k + v >> 2] = v;
                    break
                  }
                  a = c[b + 4 >> 2] | 0;
                  if ((a & 3 | 0) == 1) {
                    h = a & -8;
                    e = a >>> 3;
                    h: do
                      if (a >>> 0 < 256) {
                        a = c[b + 8 >> 2] | 0;
                        d = c[b + 12 >> 2] | 0;
                        if ((d | 0) == (a | 0)) {
                          c[5412] = c[5412] & ~(1 << e);
                          break
                        } else {
                          c[a + 12 >> 2] = d;
                          c[d + 8 >> 2] = a;
                          break
                        }
                      } else {
                        g = c[b + 24 >> 2] | 0;
                        a = c[b + 12 >> 2] | 0;
                        do
                          if ((a | 0) == (b | 0)) {
                            d = b + 16 | 0;
                            e = d + 4 | 0;
                            a = c[e >> 2] | 0;
                            if (!a) {
                              a = c[d >> 2] | 0;
                              if (!a) {
                                a = 0;
                                break
                              }
                            } else d = e;
                            while (1) {
                              f = a + 20 | 0;
                              e = c[f >> 2] | 0;
                              if (!e) {
                                f = a + 16 | 0;
                                e = c[f >> 2] | 0;
                                if (!e) break;
                                else {
                                  a = e;
                                  d = f
                                }
                              } else {
                                a = e;
                                d = f
                              }
                            }
                            c[d >> 2] = 0
                          } else {
                            v = c[b + 8 >> 2] | 0;
                            c[v + 12 >> 2] = a;
                            c[a + 8 >> 2] = v
                          } while (0);
                        if (!g) break;
                        d = c[b + 28 >> 2] | 0;
                        e = 21952 + (d << 2) | 0;
                        do
                          if ((c[e >> 2] | 0) != (b | 0)) {
                            v = g + 16 | 0;
                            c[((c[v >> 2] | 0) == (b | 0) ? v : g + 20 | 0) >> 2] = a;
                            if (!a) break h
                          } else {
                            c[e >> 2] = a;
                            if (a | 0) break;
                            c[5413] = c[5413] & ~(1 << d);
                            break h
                          } while (0);
                        c[a + 24 >> 2] = g;
                        d = b + 16 | 0;
                        e = c[d >> 2] | 0;
                        if (e | 0) {
                          c[a + 16 >> 2] = e;
                          c[e + 24 >> 2] = a
                        }
                        d = c[d + 4 >> 2] | 0;
                        if (!d) break;
                        c[a + 20 >> 2] = d;
                        c[d + 24 >> 2] = a
                      }
                    while (0);
                    b = b + h | 0;
                    f = h + i | 0
                  } else f = i;
                  b = b + 4 | 0;
                  c[b >> 2] = c[b >> 2] & -2;
                  c[k + 4 >> 2] = f | 1;
                  c[k + f >> 2] = f;
                  b = f >>> 3;
                  if (f >>> 0 < 256) {
                    d = 21688 + (b << 1 << 2) | 0;
                    a = c[5412] | 0;
                    b = 1 << b;
                    if (!(a & b)) {
                      c[5412] = a | b;
                      b = d;
                      a = d + 8 | 0
                    } else {
                      a = d + 8 | 0;
                      b = c[a >> 2] | 0
                    }
                    c[a >> 2] = k;
                    c[b + 12 >> 2] = k;
                    c[k + 8 >> 2] = b;
                    c[k + 12 >> 2] = d;
                    break
                  }
                  b = f >>> 8;
                  do
                    if (!b) e = 0;
                    else {
                      if (f >>> 0 > 16777215) {
                        e = 31;
                        break
                      }
                      u = (b + 1048320 | 0) >>> 16 & 8;
                      v = b << u;
                      t = (v + 520192 | 0) >>> 16 & 4;
                      v = v << t;
                      e = (v + 245760 | 0) >>> 16 & 2;
                      e = 14 - (t | u | e) + (v << e >>> 15) | 0;
                      e = f >>> (e + 7 | 0) & 1 | e << 1
                    } while (0);
                  b = 21952 + (e << 2) | 0;
                  c[k + 28 >> 2] = e;
                  a = k + 16 | 0;
                  c[a + 4 >> 2] = 0;
                  c[a >> 2] = 0;
                  a = c[5413] | 0;
                  d = 1 << e;
                  if (!(a & d)) {
                    c[5413] = a | d;
                    c[b >> 2] = k;
                    c[k + 24 >> 2] = b;
                    c[k + 12 >> 2] = k;
                    c[k + 8 >> 2] = k;
                    break
                  }
                  b = c[b >> 2] | 0;
                  i: do
                    if ((c[b + 4 >> 2] & -8 | 0) != (f | 0)) {
                      e = f << ((e | 0) == 31 ? 0 : 25 - (e >>> 1) | 0);
                      while (1) {
                        d = b + 16 + (e >>> 31 << 2) | 0;
                        a = c[d >> 2] | 0;
                        if (!a) break;
                        if ((c[a + 4 >> 2] & -8 | 0) == (f | 0)) {
                          b = a;
                          break i
                        } else {
                          e = e << 1;
                          b = a
                        }
                      }
                      c[d >> 2] = k;
                      c[k + 24 >> 2] = b;
                      c[k + 12 >> 2] = k;
                      c[k + 8 >> 2] = k;
                      break g
                    }
                  while (0);
                  u = b + 8 | 0;
                  v = c[u >> 2] | 0;
                  c[v + 12 >> 2] = k;
                  c[u >> 2] = k;
                  c[k + 8 >> 2] = v;
                  c[k + 12 >> 2] = b;
                  c[k + 24 >> 2] = 0
                }
              while (0);
              v = l + 8 | 0;
              V = w;
              return v | 0
            }
            b = 22096;
            while (1) {
              a = c[b >> 2] | 0;
              if (a >>> 0 <= j >>> 0 ? (v = a + (c[b + 4 >> 2] | 0) | 0, v >>> 0 > j >>> 0) : 0) break;
              b = c[b + 8 >> 2] | 0
            }
            f = v + -47 | 0;
            a = f + 8 | 0;
            a = f + ((a & 7 | 0) == 0 ? 0 : 0 - a & 7) | 0;
            f = j + 16 | 0;
            a = a >>> 0 < f >>> 0 ? j : a;
            b = a + 8 | 0;
            d = h + -40 | 0;
            t = g + 8 | 0;
            t = (t & 7 | 0) == 0 ? 0 : 0 - t & 7;
            u = g + t | 0;
            t = d - t | 0;
            c[5418] = u;
            c[5415] = t;
            c[u + 4 >> 2] = t | 1;
            c[g + d + 4 >> 2] = 40;
            c[5419] = c[5534];
            d = a + 4 | 0;
            c[d >> 2] = 27;
            c[b >> 2] = c[5524];
            c[b + 4 >> 2] = c[5525];
            c[b + 8 >> 2] = c[5526];
            c[b + 12 >> 2] = c[5527];
            c[5524] = g;
            c[5525] = h;
            c[5527] = 0;
            c[5526] = b;
            b = a + 24 | 0;
            do {
              u = b;
              b = b + 4 | 0;
              c[b >> 2] = 7
            } while ((u + 8 | 0) >>> 0 < v >>> 0);
            if ((a | 0) != (j | 0)) {
              g = a - j | 0;
              c[d >> 2] = c[d >> 2] & -2;
              c[j + 4 >> 2] = g | 1;
              c[a >> 2] = g;
              b = g >>> 3;
              if (g >>> 0 < 256) {
                d = 21688 + (b << 1 << 2) | 0;
                a = c[5412] | 0;
                b = 1 << b;
                if (!(a & b)) {
                  c[5412] = a | b;
                  b = d;
                  a = d + 8 | 0
                } else {
                  a = d + 8 | 0;
                  b = c[a >> 2] | 0
                }
                c[a >> 2] = j;
                c[b + 12 >> 2] = j;
                c[j + 8 >> 2] = b;
                c[j + 12 >> 2] = d;
                break
              }
              b = g >>> 8;
              if (b)
                if (g >>> 0 > 16777215) e = 31;
                else {
                  u = (b + 1048320 | 0) >>> 16 & 8;
                  v = b << u;
                  t = (v + 520192 | 0) >>> 16 & 4;
                  v = v << t;
                  e = (v + 245760 | 0) >>> 16 & 2;
                  e = 14 - (t | u | e) + (v << e >>> 15) | 0;
                  e = g >>> (e + 7 | 0) & 1 | e << 1
                }
              else e = 0;
              d = 21952 + (e << 2) | 0;
              c[j + 28 >> 2] = e;
              c[j + 20 >> 2] = 0;
              c[f >> 2] = 0;
              b = c[5413] | 0;
              a = 1 << e;
              if (!(b & a)) {
                c[5413] = b | a;
                c[d >> 2] = j;
                c[j + 24 >> 2] = d;
                c[j + 12 >> 2] = j;
                c[j + 8 >> 2] = j;
                break
              }
              b = c[d >> 2] | 0;
              j: do
                if ((c[b + 4 >> 2] & -8 | 0) != (g | 0)) {
                  e = g << ((e | 0) == 31 ? 0 : 25 - (e >>> 1) | 0);
                  while (1) {
                    d = b + 16 + (e >>> 31 << 2) | 0;
                    a = c[d >> 2] | 0;
                    if (!a) break;
                    if ((c[a + 4 >> 2] & -8 | 0) == (g | 0)) {
                      b = a;
                      break j
                    } else {
                      e = e << 1;
                      b = a
                    }
                  }
                  c[d >> 2] = j;
                  c[j + 24 >> 2] = b;
                  c[j + 12 >> 2] = j;
                  c[j + 8 >> 2] = j;
                  break f
                }
              while (0);
              u = b + 8 | 0;
              v = c[u >> 2] | 0;
              c[v + 12 >> 2] = j;
              c[u >> 2] = j;
              c[j + 8 >> 2] = v;
              c[j + 12 >> 2] = b;
              c[j + 24 >> 2] = 0
            }
          } else {
            v = c[5416] | 0;
            if ((v | 0) == 0 | g >>> 0 < v >>> 0) c[5416] = g;
            c[5524] = g;
            c[5525] = h;
            c[5527] = 0;
            c[5421] = c[5530];
            c[5420] = -1;
            c[5425] = 21688;
            c[5424] = 21688;
            c[5427] = 21696;
            c[5426] = 21696;
            c[5429] = 21704;
            c[5428] = 21704;
            c[5431] = 21712;
            c[5430] = 21712;
            c[5433] = 21720;
            c[5432] = 21720;
            c[5435] = 21728;
            c[5434] = 21728;
            c[5437] = 21736;
            c[5436] = 21736;
            c[5439] = 21744;
            c[5438] = 21744;
            c[5441] = 21752;
            c[5440] = 21752;
            c[5443] = 21760;
            c[5442] = 21760;
            c[5445] = 21768;
            c[5444] = 21768;
            c[5447] = 21776;
            c[5446] = 21776;
            c[5449] = 21784;
            c[5448] = 21784;
            c[5451] = 21792;
            c[5450] = 21792;
            c[5453] = 21800;
            c[5452] = 21800;
            c[5455] = 21808;
            c[5454] = 21808;
            c[5457] = 21816;
            c[5456] = 21816;
            c[5459] = 21824;
            c[5458] = 21824;
            c[5461] = 21832;
            c[5460] = 21832;
            c[5463] = 21840;
            c[5462] = 21840;
            c[5465] = 21848;
            c[5464] = 21848;
            c[5467] = 21856;
            c[5466] = 21856;
            c[5469] = 21864;
            c[5468] = 21864;
            c[5471] = 21872;
            c[5470] = 21872;
            c[5473] = 21880;
            c[5472] = 21880;
            c[5475] = 21888;
            c[5474] = 21888;
            c[5477] = 21896;
            c[5476] = 21896;
            c[5479] = 21904;
            c[5478] = 21904;
            c[5481] = 21912;
            c[5480] = 21912;
            c[5483] = 21920;
            c[5482] = 21920;
            c[5485] = 21928;
            c[5484] = 21928;
            c[5487] = 21936;
            c[5486] = 21936;
            v = h + -40 | 0;
            t = g + 8 | 0;
            t = (t & 7 | 0) == 0 ? 0 : 0 - t & 7;
            u = g + t | 0;
            t = v - t | 0;
            c[5418] = u;
            c[5415] = t;
            c[u + 4 >> 2] = t | 1;
            c[g + v + 4 >> 2] = 40;
            c[5419] = c[5534]
          }
        while (0);
        b = c[5415] | 0;
        if (b >>> 0 > m >>> 0) {
          t = b - m | 0;
          c[5415] = t;
          v = c[5418] | 0;
          u = v + m | 0;
          c[5418] = u;
          c[u + 4 >> 2] = t | 1;
          c[v + 4 >> 2] = m | 3;
          v = v + 8 | 0;
          V = w;
          return v | 0
        }
      }
      c[(ao() | 0) >> 2] = 48;
      v = 0;
      V = w;
      return v | 0
    }

    function er(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0,
        f = 0,
        g = 0,
        h = 0,
        i = 0,
        j = 0;
      if (!a) return;
      d = a + -8 | 0;
      f = c[5416] | 0;
      a = c[a + -4 >> 2] | 0;
      b = a & -8;
      j = d + b | 0;
      do
        if (!(a & 1)) {
          e = c[d >> 2] | 0;
          if (!(a & 3)) return;
          h = d + (0 - e) | 0;
          g = e + b | 0;
          if (h >>> 0 < f >>> 0) return;
          if ((c[5417] | 0) == (h | 0)) {
            a = j + 4 | 0;
            b = c[a >> 2] | 0;
            if ((b & 3 | 0) != 3) {
              i = h;
              b = g;
              break
            }
            c[5414] = g;
            c[a >> 2] = b & -2;
            c[h + 4 >> 2] = g | 1;
            c[h + g >> 2] = g;
            return
          }
          d = e >>> 3;
          if (e >>> 0 < 256) {
            a = c[h + 8 >> 2] | 0;
            b = c[h + 12 >> 2] | 0;
            if ((b | 0) == (a | 0)) {
              c[5412] = c[5412] & ~(1 << d);
              i = h;
              b = g;
              break
            } else {
              c[a + 12 >> 2] = b;
              c[b + 8 >> 2] = a;
              i = h;
              b = g;
              break
            }
          }
          f = c[h + 24 >> 2] | 0;
          a = c[h + 12 >> 2] | 0;
          do
            if ((a | 0) == (h | 0)) {
              b = h + 16 | 0;
              d = b + 4 | 0;
              a = c[d >> 2] | 0;
              if (!a) {
                a = c[b >> 2] | 0;
                if (!a) {
                  a = 0;
                  break
                }
              } else b = d;
              while (1) {
                e = a + 20 | 0;
                d = c[e >> 2] | 0;
                if (!d) {
                  e = a + 16 | 0;
                  d = c[e >> 2] | 0;
                  if (!d) break;
                  else {
                    a = d;
                    b = e
                  }
                } else {
                  a = d;
                  b = e
                }
              }
              c[b >> 2] = 0
            } else {
              i = c[h + 8 >> 2] | 0;
              c[i + 12 >> 2] = a;
              c[a + 8 >> 2] = i
            } while (0);
          if (f) {
            b = c[h + 28 >> 2] | 0;
            d = 21952 + (b << 2) | 0;
            if ((c[d >> 2] | 0) == (h | 0)) {
              c[d >> 2] = a;
              if (!a) {
                c[5413] = c[5413] & ~(1 << b);
                i = h;
                b = g;
                break
              }
            } else {
              i = f + 16 | 0;
              c[((c[i >> 2] | 0) == (h | 0) ? i : f + 20 | 0) >> 2] = a;
              if (!a) {
                i = h;
                b = g;
                break
              }
            }
            c[a + 24 >> 2] = f;
            b = h + 16 | 0;
            d = c[b >> 2] | 0;
            if (d | 0) {
              c[a + 16 >> 2] = d;
              c[d + 24 >> 2] = a
            }
            b = c[b + 4 >> 2] | 0;
            if (b) {
              c[a + 20 >> 2] = b;
              c[b + 24 >> 2] = a;
              i = h;
              b = g
            } else {
              i = h;
              b = g
            }
          } else {
            i = h;
            b = g
          }
        } else {
          i = d;
          h = d
        } while (0);
      if (h >>> 0 >= j >>> 0) return;
      a = j + 4 | 0;
      e = c[a >> 2] | 0;
      if (!(e & 1)) return;
      if (!(e & 2)) {
        if ((c[5418] | 0) == (j | 0)) {
          j = (c[5415] | 0) + b | 0;
          c[5415] = j;
          c[5418] = i;
          c[i + 4 >> 2] = j | 1;
          if ((i | 0) != (c[5417] | 0)) return;
          c[5417] = 0;
          c[5414] = 0;
          return
        }
        if ((c[5417] | 0) == (j | 0)) {
          j = (c[5414] | 0) + b | 0;
          c[5414] = j;
          c[5417] = h;
          c[i + 4 >> 2] = j | 1;
          c[h + j >> 2] = j;
          return
        }
        f = (e & -8) + b | 0;
        d = e >>> 3;
        do
          if (e >>> 0 < 256) {
            b = c[j + 8 >> 2] | 0;
            a = c[j + 12 >> 2] | 0;
            if ((a | 0) == (b | 0)) {
              c[5412] = c[5412] & ~(1 << d);
              break
            } else {
              c[b + 12 >> 2] = a;
              c[a + 8 >> 2] = b;
              break
            }
          } else {
            g = c[j + 24 >> 2] | 0;
            a = c[j + 12 >> 2] | 0;
            do
              if ((a | 0) == (j | 0)) {
                b = j + 16 | 0;
                d = b + 4 | 0;
                a = c[d >> 2] | 0;
                if (!a) {
                  a = c[b >> 2] | 0;
                  if (!a) {
                    d = 0;
                    break
                  }
                } else b = d;
                while (1) {
                  e = a + 20 | 0;
                  d = c[e >> 2] | 0;
                  if (!d) {
                    e = a + 16 | 0;
                    d = c[e >> 2] | 0;
                    if (!d) break;
                    else {
                      a = d;
                      b = e
                    }
                  } else {
                    a = d;
                    b = e
                  }
                }
                c[b >> 2] = 0;
                d = a
              } else {
                d = c[j + 8 >> 2] | 0;
                c[d + 12 >> 2] = a;
                c[a + 8 >> 2] = d;
                d = a
              } while (0);
            if (g | 0) {
              a = c[j + 28 >> 2] | 0;
              b = 21952 + (a << 2) | 0;
              if ((c[b >> 2] | 0) == (j | 0)) {
                c[b >> 2] = d;
                if (!d) {
                  c[5413] = c[5413] & ~(1 << a);
                  break
                }
              } else {
                e = g + 16 | 0;
                c[((c[e >> 2] | 0) == (j | 0) ? e : g + 20 | 0) >> 2] = d;
                if (!d) break
              }
              c[d + 24 >> 2] = g;
              a = j + 16 | 0;
              b = c[a >> 2] | 0;
              if (b | 0) {
                c[d + 16 >> 2] = b;
                c[b + 24 >> 2] = d
              }
              a = c[a + 4 >> 2] | 0;
              if (a | 0) {
                c[d + 20 >> 2] = a;
                c[a + 24 >> 2] = d
              }
            }
          } while (0);
        c[i + 4 >> 2] = f | 1;
        c[h + f >> 2] = f;
        if ((i | 0) == (c[5417] | 0)) {
          c[5414] = f;
          return
        }
      } else {
        c[a >> 2] = e & -2;
        c[i + 4 >> 2] = b | 1;
        c[h + b >> 2] = b;
        f = b
      }
      a = f >>> 3;
      if (f >>> 0 < 256) {
        d = 21688 + (a << 1 << 2) | 0;
        b = c[5412] | 0;
        a = 1 << a;
        if (!(b & a)) {
          c[5412] = b | a;
          a = d;
          b = d + 8 | 0
        } else {
          b = d + 8 | 0;
          a = c[b >> 2] | 0
        }
        c[b >> 2] = i;
        c[a + 12 >> 2] = i;
        c[i + 8 >> 2] = a;
        c[i + 12 >> 2] = d;
        return
      }
      a = f >>> 8;
      if (a)
        if (f >>> 0 > 16777215) e = 31;
        else {
          h = (a + 1048320 | 0) >>> 16 & 8;
          j = a << h;
          g = (j + 520192 | 0) >>> 16 & 4;
          j = j << g;
          e = (j + 245760 | 0) >>> 16 & 2;
          e = 14 - (g | h | e) + (j << e >>> 15) | 0;
          e = f >>> (e + 7 | 0) & 1 | e << 1
        }
      else e = 0;
      a = 21952 + (e << 2) | 0;
      c[i + 28 >> 2] = e;
      c[i + 20 >> 2] = 0;
      c[i + 16 >> 2] = 0;
      b = c[5413] | 0;
      d = 1 << e;
      a: do
        if (!(b & d)) {
          c[5413] = b | d;
          c[a >> 2] = i;
          c[i + 24 >> 2] = a;
          c[i + 12 >> 2] = i;
          c[i + 8 >> 2] = i
        } else {
          a = c[a >> 2] | 0;
          b: do
            if ((c[a + 4 >> 2] & -8 | 0) != (f | 0)) {
              e = f << ((e | 0) == 31 ? 0 : 25 - (e >>> 1) | 0);
              while (1) {
                d = a + 16 + (e >>> 31 << 2) | 0;
                b = c[d >> 2] | 0;
                if (!b) break;
                if ((c[b + 4 >> 2] & -8 | 0) == (f | 0)) {
                  a = b;
                  break b
                } else {
                  e = e << 1;
                  a = b
                }
              }
              c[d >> 2] = i;
              c[i + 24 >> 2] = a;
              c[i + 12 >> 2] = i;
              c[i + 8 >> 2] = i;
              break a
            }
          while (0);
          h = a + 8 | 0;
          j = c[h >> 2] | 0;
          c[j + 12 >> 2] = i;
          c[h >> 2] = i;
          c[i + 8 >> 2] = j;
          c[i + 12 >> 2] = a;
          c[i + 24 >> 2] = 0
        }
      while (0);
      j = (c[5420] | 0) + -1 | 0;
      c[5420] = j;
      if (j | 0) return;
      a = 22104;
      while (1) {
        a = c[a >> 2] | 0;
        if (!a) break;
        else a = a + 8 | 0
      }
      c[5420] = -1;
      return
    }

    function fr(a) {
      a = a | 0;
      var b = 0,
        d = 0,
        e = 0;
      e = a + 3 & -4;
      a = sr() | 0;
      b = c[a >> 2] | 0;
      d = b + e | 0;
      do
        if ((e | 0) < 1 | d >>> 0 > b >>> 0) {
          if (d >>> 0 > (R() | 0) >>> 0 ? (T(d | 0) | 0) == 0 : 0) break;
          c[a >> 2] = d;
          e = b;
          return e | 0
        } while (0);
      c[(ao() | 0) >> 2] = 48;
      e = -1;
      return e | 0
    }

    function gr(a) {
      a = a | 0;
      var b = 0;
      b = V;
      V = V + a | 0;
      V = V + 15 & -16;
      return b | 0
    }

    function hr(a) {
      a = a | 0;
      V = a
    }

    function ir() {
      return V | 0
    }

    function jr(a, b) {
      a = a | 0;
      b = b | 0;
      var c = 0,
        d = 0,
        e = 0,
        f = 0;
      f = a & 65535;
      e = b & 65535;
      c = q(e, f) | 0;
      d = a >>> 16;
      a = (c >>> 16) + (q(e, d) | 0) | 0;
      e = b >>> 16;
      b = q(e, f) | 0;
      return (t((a >>> 16) + (q(e, d) | 0) + (((a & 65535) + b | 0) >>> 16) | 0), a + b << 16 | c & 65535 | 0) | 0
    }

    function kr(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0,
        f = 0;
      e = a;
      f = c;
      c = jr(e, f) | 0;
      a = u() | 0;
      return (t((q(b, f) | 0) + (q(d, e) | 0) + a | a & 0 | 0), c | 0 | 0) | 0
    }

    function lr(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      c = a + c >>> 0;
      return (t(b + d + (c >>> 0 < a >>> 0 | 0) >>> 0 | 0), c | 0) | 0
    }

    function mr(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      d = b - d - (c >>> 0 > a >>> 0 | 0) >>> 0;
      return (t(d | 0), a - c >>> 0 | 0) | 0
    }

    function nr(a) {
      a = a | 0;
      return (a ? 31 - (r(a ^ a - 1) | 0) | 0 : 32) | 0
    }

    function or(a, b, d, e, f) {
      a = a | 0;
      b = b | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      var g = 0,
        h = 0,
        i = 0,
        j = 0,
        k = 0,
        l = 0,
        m = 0,
        n = 0,
        o = 0,
        p = 0;
      l = a;
      j = b;
      k = j;
      h = d;
      n = e;
      i = n;
      if (!k) {
        g = (f | 0) != 0;
        if (!i) {
          if (g) {
            c[f >> 2] = (l >>> 0) % (h >>> 0);
            c[f + 4 >> 2] = 0
          }
          n = 0;
          f = (l >>> 0) / (h >>> 0) >>> 0;
          return (t(n | 0), f) | 0
        } else {
          if (!g) {
            n = 0;
            f = 0;
            return (t(n | 0), f) | 0
          }
          c[f >> 2] = a | 0;
          c[f + 4 >> 2] = b & 0;
          n = 0;
          f = 0;
          return (t(n | 0), f) | 0
        }
      }
      g = (i | 0) == 0;
      do
        if (h) {
          if (!g) {
            g = (r(i | 0) | 0) - (r(k | 0) | 0) | 0;
            if (g >>> 0 <= 31) {
              m = g + 1 | 0;
              i = 31 - g | 0;
              b = g - 31 >> 31;
              h = m;
              a = l >>> (m >>> 0) & b | k << i;
              b = k >>> (m >>> 0) & b;
              g = 0;
              i = l << i;
              break
            }
            if (!f) {
              n = 0;
              f = 0;
              return (t(n | 0), f) | 0
            }
            c[f >> 2] = a | 0;
            c[f + 4 >> 2] = j | b & 0;
            n = 0;
            f = 0;
            return (t(n | 0), f) | 0
          }
          g = h - 1 | 0;
          if (g & h | 0) {
            i = (r(h | 0) | 0) + 33 - (r(k | 0) | 0) | 0;
            p = 64 - i | 0;
            m = 32 - i | 0;
            j = m >> 31;
            o = i - 32 | 0;
            b = o >> 31;
            h = i;
            a = m - 1 >> 31 & k >>> (o >>> 0) | (k << m | l >>> (i >>> 0)) & b;
            b = b & k >>> (i >>> 0);
            g = l << p & j;
            i = (k << p | l >>> (o >>> 0)) & j | l << m & i - 33 >> 31;
            break
          }
          if (f | 0) {
            c[f >> 2] = g & l;
            c[f + 4 >> 2] = 0
          }
          if ((h | 0) == 1) {
            o = j | b & 0;
            p = a | 0 | 0;
            return (t(o | 0), p) | 0
          } else {
            p = nr(h | 0) | 0;
            o = k >>> (p >>> 0) | 0;
            p = k << 32 - p | l >>> (p >>> 0) | 0;
            return (t(o | 0), p) | 0
          }
        } else {
          if (g) {
            if (f | 0) {
              c[f >> 2] = (k >>> 0) % (h >>> 0);
              c[f + 4 >> 2] = 0
            }
            o = 0;
            p = (k >>> 0) / (h >>> 0) >>> 0;
            return (t(o | 0), p) | 0
          }
          if (!l) {
            if (f | 0) {
              c[f >> 2] = 0;
              c[f + 4 >> 2] = (k >>> 0) % (i >>> 0)
            }
            o = 0;
            p = (k >>> 0) / (i >>> 0) >>> 0;
            return (t(o | 0), p) | 0
          }
          g = i - 1 | 0;
          if (!(g & i)) {
            if (f | 0) {
              c[f >> 2] = a | 0;
              c[f + 4 >> 2] = g & k | b & 0
            }
            o = 0;
            p = k >>> ((nr(i | 0) | 0) >>> 0);
            return (t(o | 0), p) | 0
          }
          g = (r(i | 0) | 0) - (r(k | 0) | 0) | 0;
          if (g >>> 0 <= 30) {
            b = g + 1 | 0;
            i = 31 - g | 0;
            h = b;
            a = k << i | l >>> (b >>> 0);
            b = k >>> (b >>> 0);
            g = 0;
            i = l << i;
            break
          }
          if (!f) {
            o = 0;
            p = 0;
            return (t(o | 0), p) | 0
          }
          c[f >> 2] = a | 0;
          c[f + 4 >> 2] = j | b & 0;
          o = 0;
          p = 0;
          return (t(o | 0), p) | 0
        } while (0);
      if (!h) {
        k = i;
        j = 0;
        i = 0
      } else {
        m = d | 0 | 0;
        l = n | e & 0;
        k = lr(m | 0, l | 0, -1, -1) | 0;
        d = u() | 0;
        j = i;
        i = 0;
        do {
          e = j;
          j = g >>> 31 | j << 1;
          g = i | g << 1;
          e = a << 1 | e >>> 31 | 0;
          n = a >>> 31 | b << 1 | 0;
          mr(k | 0, d | 0, e | 0, n | 0) | 0;
          p = u() | 0;
          o = p >> 31 | ((p | 0) < 0 ? -1 : 0) << 1;
          i = o & 1;
          a = mr(e | 0, n | 0, o & m | 0, (((p | 0) < 0 ? -1 : 0) >> 31 | ((p | 0) < 0 ? -1 : 0) << 1) & l | 0) | 0;
          b = u() | 0;
          h = h - 1 | 0
        } while ((h | 0) != 0);
        k = j;
        j = 0
      }
      h = 0;
      if (f | 0) {
        c[f >> 2] = a;
        c[f + 4 >> 2] = b
      }
      o = (g | 0) >>> 31 | (k | h) << 1 | (h << 1 | g >>> 31) & 0 | j;
      p = (g << 1 | 0 >>> 31) & -2 | i;
      return (t(o | 0), p) | 0
    }

    function pr(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      return or(a, b, c, d, 0) | 0
    }

    function qr(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      if ((c | 0) < 32) {
        t(b >>> c | 0);
        return a >>> c | (b & (1 << c) - 1) << 32 - c
      }
      t(0);
      return b >>> c - 32 | 0
    }

    function rr(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      if ((c | 0) < 32) {
        t(b << c | (a & (1 << c) - 1 << 32 - c) >>> 32 - c | 0);
        return a << c
      }
      t(a << c - 32 | 0);
      return 0
    }

    function sr() {
      return 22176
    }

    function tr(a) {
      a = a | 0;
      return (a & 255) << 24 | (a >> 8 & 255) << 16 | (a >> 16 & 255) << 8 | a >>> 24 | 0
    }

    function ur(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0;
      if ((e | 0) >= 512) {
        S(b | 0, d | 0, e | 0) | 0;
        return b | 0
      }
      h = b | 0;
      g = b + e | 0;
      if ((b & 3) == (d & 3)) {
        while (b & 3) {
          if (!e) return h | 0;
          a[b >> 0] = a[d >> 0] | 0;
          b = b + 1 | 0;
          d = d + 1 | 0;
          e = e - 1 | 0
        }
        e = g & -4 | 0;
        f = e - 64 | 0;
        while ((b | 0) <= (f | 0)) {
          c[b >> 2] = c[d >> 2];
          c[b + 4 >> 2] = c[d + 4 >> 2];
          c[b + 8 >> 2] = c[d + 8 >> 2];
          c[b + 12 >> 2] = c[d + 12 >> 2];
          c[b + 16 >> 2] = c[d + 16 >> 2];
          c[b + 20 >> 2] = c[d + 20 >> 2];
          c[b + 24 >> 2] = c[d + 24 >> 2];
          c[b + 28 >> 2] = c[d + 28 >> 2];
          c[b + 32 >> 2] = c[d + 32 >> 2];
          c[b + 36 >> 2] = c[d + 36 >> 2];
          c[b + 40 >> 2] = c[d + 40 >> 2];
          c[b + 44 >> 2] = c[d + 44 >> 2];
          c[b + 48 >> 2] = c[d + 48 >> 2];
          c[b + 52 >> 2] = c[d + 52 >> 2];
          c[b + 56 >> 2] = c[d + 56 >> 2];
          c[b + 60 >> 2] = c[d + 60 >> 2];
          b = b + 64 | 0;
          d = d + 64 | 0
        }
        while ((b | 0) < (e | 0)) {
          c[b >> 2] = c[d >> 2];
          b = b + 4 | 0;
          d = d + 4 | 0
        }
      } else {
        e = g - 4 | 0;
        while ((b | 0) < (e | 0)) {
          a[b >> 0] = a[d >> 0] | 0;
          a[b + 1 >> 0] = a[d + 1 >> 0] | 0;
          a[b + 2 >> 0] = a[d + 2 >> 0] | 0;
          a[b + 3 >> 0] = a[d + 3 >> 0] | 0;
          b = b + 4 | 0;
          d = d + 4 | 0
        }
      }
      while ((b | 0) < (g | 0)) {
        a[b >> 0] = a[d >> 0] | 0;
        b = b + 1 | 0;
        d = d + 1 | 0
      }
      return h | 0
    }

    function vr(b, c, d) {
      b = b | 0;
      c = c | 0;
      d = d | 0;
      var e = 0;
      if ((c | 0) < (b | 0) & (b | 0) < (c + d | 0)) {
        e = b;
        c = c + d | 0;
        b = b + d | 0;
        while ((d | 0) > 0) {
          b = b - 1 | 0;
          c = c - 1 | 0;
          d = d - 1 | 0;
          a[b >> 0] = a[c >> 0] | 0
        }
        b = e
      } else ur(b, c, d) | 0;
      return b | 0
    }

    function wr(b, d, e) {
      b = b | 0;
      d = d | 0;
      e = e | 0;
      var f = 0,
        g = 0,
        h = 0,
        i = 0;
      h = b + e | 0;
      d = d & 255;
      if ((e | 0) >= 67) {
        while (b & 3) {
          a[b >> 0] = d;
          b = b + 1 | 0
        }
        f = h & -4 | 0;
        i = d | d << 8 | d << 16 | d << 24;
        g = f - 64 | 0;
        while ((b | 0) <= (g | 0)) {
          c[b >> 2] = i;
          c[b + 4 >> 2] = i;
          c[b + 8 >> 2] = i;
          c[b + 12 >> 2] = i;
          c[b + 16 >> 2] = i;
          c[b + 20 >> 2] = i;
          c[b + 24 >> 2] = i;
          c[b + 28 >> 2] = i;
          c[b + 32 >> 2] = i;
          c[b + 36 >> 2] = i;
          c[b + 40 >> 2] = i;
          c[b + 44 >> 2] = i;
          c[b + 48 >> 2] = i;
          c[b + 52 >> 2] = i;
          c[b + 56 >> 2] = i;
          c[b + 60 >> 2] = i;
          b = b + 64 | 0
        }
        while ((b | 0) < (f | 0)) {
          c[b >> 2] = i;
          b = b + 4 | 0
        }
      }
      while ((b | 0) < (h | 0)) {
        a[b >> 0] = d;
        b = b + 1 | 0
      }
      return h - e | 0
    }

    function xr(a) {
      a = a | 0;
      return Y[a & 3]() | 0
    }

    function yr(a, b) {
      a = a | 0;
      b = b | 0;
      return Z[a & 15](b | 0) | 0
    }

    function zr(a, b, c, d, e, f, g) {
      a = a | 0;
      b = b | 0;
      c = +c;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      return _[a & 1](b | 0, +c, d | 0, e | 0, f | 0, g | 0) | 0
    }

    function Ar(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      return $[a & 63](b | 0, c | 0) | 0
    }

    function Br(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      return aa[a & 7](b | 0, c | 0, d | 0) | 0
    }

    function Cr(a) {
      a = a | 0;
      ba[a & 3]()
    }

    function Dr(a, b) {
      a = a | 0;
      b = b | 0;
      ca[a & 255](b | 0)
    }

    function Er(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      da[a & 15](b | 0, c | 0)
    }

    function Fr(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      ea[a & 15](b | 0, c | 0, d | 0)
    }

    function Gr(a, b, c, d, e) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      fa[a & 7](b | 0, c | 0, d | 0, e | 0)
    }

    function Hr(a, b, c, d, e, f) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      ga[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0)
    }

    function Ir(a, b, c, d, e, f, g) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      g = g | 0;
      ha[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0, g | 0)
    }

    function Jr() {
      s(0);
      return 0
    }

    function Kr(a) {
      a = a | 0;
      s(1);
      return 0
    }

    function Lr(a, b, c, d, e, f) {
      a = a | 0;
      b = +b;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      s(2);
      return 0
    }

    function Mr(a, b) {
      a = a | 0;
      b = b | 0;
      s(3);
      return 0
    }

    function Nr(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      s(4);
      return 0
    }

    function Or() {
      s(5)
    }

    function Pr(a) {
      a = a | 0;
      s(6)
    }

    function Qr(a, b) {
      a = a | 0;
      b = b | 0;
      s(7)
    }

    function Rr(a, b, c) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      s(8)
    }

    function Sr(a, b, c, d) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      s(9)
    }

    function Tr(a, b, c, d, e) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      s(10)
    }

    function Ur(a, b, c, d, e, f) {
      a = a | 0;
      b = b | 0;
      c = c | 0;
      d = d | 0;
      e = e | 0;
      f = f | 0;
      s(11)
    }

    // EMSCRIPTEN_END_FUNCS
    var Y = [Jr, Mk, Fl, Jr];
    var Z = [Kr, Ap, zb, Fb, qp, tp, oq, Kq, Tq, wk, na, tl, Ok, Hl, Kr, Kr];
    var _ = [Lr, po];
    var $ = [Mr, Ba, Ka, Eb, jd, Nd, Xd, je, ke, ne, _e, ff, yf, Ff, Of, Vf, Hg, Qg, Zg, ch, lh, qh, zh, Eh, Nh, _h, fi, ki, si, Bi, Si, Zi, fj, oj, yj, Fj, Pj, Yj, ek, lk, tk, ll, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr, Mr];
    var aa = [Nr, Io, Yo, Fp, Hp, Mq, Nq, Nr];
    var ba = [Or, Dp, Po, Or];
    var ca = [Pr, pq, za, Aa, Ca, Ia, Ja, La, yp, ob, Gb, yb, Bb, Cb, Lb, Mb, Xb, Yb, sc, tc, uc, Nc, hd, id, kd, Jd, Od, Pd, Qd, Rd, Vd, Wd, Yd, he, ie, le, me, Ye, Ze, $e, df, ef, wf, xf, zf, Df, Ef, Mf, Nf, Pf, Tf, Uf, Fg, Gg, Ig, Rg, Sg, Xg, Yg, _g, dh, eh, jh, kh, mh, rh, sh, xh, yh, Ah, Fh, Gh, Lh, Mh, Oh, Yh, Zh, $h, di, ei, gi, li, mi, qi, ri, ti, zi, Ai, Qi, Ri, Ti, Xi, Yi, dj, ej, gj, mj, nj, wj, xj, zj, Dj, Ej, Nj, Oj, Qj, Wj, Xj, ck, dk, fk, jk, kk, rk, sk, uk, Uo, Vo, Wo, Xo, fp, op, pp, rp, sp, zp, Bp, Cp, Ep, Gp, Lp, mq, nq, Iq, Jq, Sq, Yq, Zq, zk, wl, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr, Pr];
    var da = [Qr, Ab, Db, ma, pa, qa, ra, sa, qo, Qr, Qr, Qr, Qr, Qr, Qr, Qr];
    var ea = [Rr, Lq, Oq, Uq, Vq, la, oa, dl, Vl, $l, Rr, Rr, Rr, Rr, Rr, Rr];
    var fa = [Sr, $o, ip, Op, Vk, Ol, Sr, Sr];
    var ga = [Tr, _o, hp, Np];
    var ha = [Ur, Zo, gp, Mp];
    return {
      __ZSt18uncaught_exceptionv: kq,
      ___cxa_can_catch: hq,
      ___cxa_is_pointer_type: iq,
      ___embind_register_native_and_builtin_types: im,
      ___errno_location: ao,
      ___getTypeName: $n,
      ___muldi3: kr,
      ___udivdi3: pr,
      _bitshift64Lshr: qr,
      _bitshift64Shl: rr,
      _emscripten_get_sbrk_ptr: sr,
      _free: er,
      _i64Add: lr,
      _i64Subtract: mr,
      _llvm_bswap_i32: tr,
      _malloc: dr,
      _memcpy: ur,
      _memmove: vr,
      _memset: wr,
      dynCall_i: xr,
      dynCall_ii: yr,
      dynCall_iidiiii: zr,
      dynCall_iii: Ar,
      dynCall_iiii: Br,
      dynCall_v: Cr,
      dynCall_vi: Dr,
      dynCall_vii: Er,
      dynCall_viii: Fr,
      dynCall_viiii: Gr,
      dynCall_viiiii: Hr,
      dynCall_viiiiii: Ir,
      globalCtors: ia,
      stackAlloc: gr,
      stackRestore: hr,
      stackSave: ir
    }
  })


  // EMSCRIPTEN_END_ASM
  (asmGlobalArg, asmLibraryArg, buffer);
  var __ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = asm["__ZSt18uncaught_exceptionv"];
  var ___cxa_can_catch = Module["___cxa_can_catch"] = asm["___cxa_can_catch"];
  var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = asm["___cxa_is_pointer_type"];
  var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = asm["___embind_register_native_and_builtin_types"];
  var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
  var ___getTypeName = Module["___getTypeName"] = asm["___getTypeName"];
  var ___muldi3 = Module["___muldi3"] = asm["___muldi3"];
  var ___udivdi3 = Module["___udivdi3"] = asm["___udivdi3"];
  var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
  var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
  var _emscripten_get_sbrk_ptr = Module["_emscripten_get_sbrk_ptr"] = asm["_emscripten_get_sbrk_ptr"];
  var _free = Module["_free"] = asm["_free"];
  var _i64Add = Module["_i64Add"] = asm["_i64Add"];
  var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
  var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = asm["_llvm_bswap_i32"];
  var _malloc = Module["_malloc"] = asm["_malloc"];
  var _memcpy = Module["_memcpy"] = asm["_memcpy"];
  var _memmove = Module["_memmove"] = asm["_memmove"];
  var _memset = Module["_memset"] = asm["_memset"];
  var globalCtors = Module["globalCtors"] = asm["globalCtors"];
  var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];
  var stackRestore = Module["stackRestore"] = asm["stackRestore"];
  var stackSave = Module["stackSave"] = asm["stackSave"];
  var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
  var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
  var dynCall_iidiiii = Module["dynCall_iidiiii"] = asm["dynCall_iidiiii"];
  var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
  var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
  var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
  var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
  var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
  var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
  var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
  var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
  var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
  Module["asm"] = asm;
  if (memoryInitializer) {
    if (!isDataURI(memoryInitializer)) {
      memoryInitializer = locateFile(memoryInitializer)
    }
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      var data = readBinary(memoryInitializer);
      HEAPU8.set(data, GLOBAL_BASE)
    } else {
      addRunDependency("memory initializer");
      var applyMemoryInitializer = function (data) {
        if (data.byteLength) data = new Uint8Array(data);
        HEAPU8.set(data, GLOBAL_BASE);
        if (Module["memoryInitializerRequest"]) delete Module["memoryInitializerRequest"].response;
        removeRunDependency("memory initializer")
      };
      var doBrowserLoad = function () {
        readAsync(memoryInitializer, applyMemoryInitializer, function () {
          var e = new Error("could not load memory initializer " + memoryInitializer);
          throw e
        })
      };
      var memoryInitializerBytes = tryParseAsDataURI(memoryInitializer);
      if (memoryInitializerBytes) {
        applyMemoryInitializer(memoryInitializerBytes.buffer)
      } else if (Module["memoryInitializerRequest"]) {
        var useRequest = function () {
          var request = Module["memoryInitializerRequest"];
          var response = request.response;
          if (request.status !== 200 && request.status !== 0) {
            var data = tryParseAsDataURI(Module["memoryInitializerRequestURL"]);
            if (data) {
              response = data.buffer
            } else {
              console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: " + request.status + ", retrying " + memoryInitializer);
              doBrowserLoad();
              return
            }
          }
          applyMemoryInitializer(response)
        };
        if (Module["memoryInitializerRequest"].response) {
          setTimeout(useRequest, 0)
        } else {
          Module["memoryInitializerRequest"].addEventListener("load", useRequest)
        }
      } else {
        doBrowserLoad()
      }
    }
  }
  var calledRun;

  function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status
  }
  dependenciesFulfilled = function runCaller() {
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller
  };

  function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
      return
    }
    preRun();
    if (runDependencies > 0) return;

    function doRun() {
      if (calledRun) return;
      calledRun = true;
      Module["calledRun"] = true;
      if (ABORT) return;
      initRuntime();
      preMain();
      if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
      postRun()
    }
    if (Module["setStatus"]) {
      Module["setStatus"]("Running...");
      setTimeout(function () {
        setTimeout(function () {
          Module["setStatus"]("")
        }, 1);
        doRun()
      }, 1)
    } else {
      doRun()
    }
  }
  Module["run"] = run;
  if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
      Module["preInit"].pop()()
    }
  }
  noExitRuntime = true;
  run();
  return Module;
};
