// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== "undefined" ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// {{PRE_JSES}}

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
	if (Module.hasOwnProperty(key)) {
		moduleOverrides[key] = Module[key];
	}
}

var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = function (status, toThrow) {
	throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = typeof window === "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE =
	typeof process === "object" &&
	typeof process.versions === "object" &&
	typeof process.versions.node === "string";
var ENVIRONMENT_IS_SHELL =
	!ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = "";
function locateFile(path) {
	if (Module["locateFile"]) {
		return Module["locateFile"](path, scriptDirectory);
	}
	return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_, readAsync, readBinary, setWindowTitle;

var nodeFS;
var nodePath;

if (ENVIRONMENT_IS_NODE) {
	if (ENVIRONMENT_IS_WORKER) {
		scriptDirectory = require("path").dirname(scriptDirectory) + "/";
	} else {
		scriptDirectory = __dirname + "/";
	}

	// include: node_shell_read.js

	read_ = function shell_read(filename, binary) {
		if (!nodeFS) nodeFS = require("fs");
		if (!nodePath) nodePath = require("path");
		filename = nodePath["normalize"](filename);
		return nodeFS["readFileSync"](filename, binary ? null : "utf8");
	};

	readBinary = function readBinary(filename) {
		var ret = read_(filename, true);
		if (!ret.buffer) {
			ret = new Uint8Array(ret);
		}
		assert(ret.buffer);
		return ret;
	};

	readAsync = function readAsync(filename, onload, onerror) {
		if (!nodeFS) nodeFS = require("fs");
		if (!nodePath) nodePath = require("path");
		filename = nodePath["normalize"](filename);
		nodeFS["readFile"](filename, function (err, data) {
			if (err) onerror(err);
			else onload(data.buffer);
		});
	};

	// end include: node_shell_read.js
	if (process["argv"].length > 1) {
		thisProgram = process["argv"][1].replace(/\\/g, "/");
	}

	arguments_ = process["argv"].slice(2);

	if (typeof module !== "undefined") {
		module["exports"] = Module;
	}

	process["on"]("uncaughtException", function (ex) {
		// suppress ExitStatus exceptions from showing an error
		if (!(ex instanceof ExitStatus)) {
			throw ex;
		}
	});

	process["on"]("unhandledRejection", abort);

	quit_ = function (status, toThrow) {
		if (keepRuntimeAlive()) {
			process["exitCode"] = status;
			throw toThrow;
		}
		process["exit"](status);
	};

	Module["inspect"] = function () {
		return "[Emscripten Module object]";
	};
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
	// Note that this includes Node.js workers when relevant (pthreads is enabled).
	// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
	// ENVIRONMENT_IS_NODE.
	if (ENVIRONMENT_IS_WORKER) {
		// Check worker, not web, since window could be polyfilled
		scriptDirectory = self.location.href;
	} else if (typeof document !== "undefined" && document.currentScript) {
		// web
		scriptDirectory = document.currentScript.src;
	}
	// blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
	// otherwise, slice off the final part of the url to find the script directory.
	// if scriptDirectory does not contain a slash, lastIndexOf will return -1,
	// and scriptDirectory will correctly be replaced with an empty string.
	if (scriptDirectory.indexOf("blob:") !== 0) {
		scriptDirectory = scriptDirectory.substr(
			0,
			scriptDirectory.lastIndexOf("/") + 1,
		);
	} else {
		scriptDirectory = "";
	}

	// Differentiate the Web Worker from the Node Worker case, as reading must
	// be done differently.
	{
		// include: web_or_worker_shell_read.js

		read_ = function (url) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url, false);
			xhr.send(null);
			return xhr.responseText;
		};

		if (ENVIRONMENT_IS_WORKER) {
			readBinary = function (url) {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", url, false);
				xhr.responseType = "arraybuffer";
				xhr.send(null);
				return new Uint8Array(
					/** @type{!ArrayBuffer} */ (xhr.response),
				);
			};
		}

		readAsync = function (url, onload, onerror) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);
			xhr.responseType = "arraybuffer";
			xhr.onload = function () {
				if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
					// file URLs can return 0
					onload(xhr.response);
					return;
				}
				onerror();
			};
			xhr.onerror = onerror;
			xhr.send(null);
		};

		// end include: web_or_worker_shell_read.js
	}

	setWindowTitle = function (title) {
		document.title = title;
	};
} else {
}

// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);

// Merge back in the overrides
for (key in moduleOverrides) {
	if (moduleOverrides.hasOwnProperty(key)) {
		Module[key] = moduleOverrides[key];
	}
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (Module["quit"]) quit_ = Module["quit"];

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message

var STACK_ALIGN = 16;

function alignMemory(size, factor) {
	if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
	return Math.ceil(size / factor) * factor;
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
				return 4; // A pointer
			} else if (type[0] === "i") {
				var bits = Number(type.substr(1));
				assert(
					bits % 8 === 0,
					"getNativeTypeSize invalid bits " + bits + ", type " + type,
				);
				return bits / 8;
			} else {
				return 0;
			}
		}
	}
}

function warnOnce(text) {
	if (!warnOnce.shown) warnOnce.shown = {};
	if (!warnOnce.shown[text]) {
		warnOnce.shown[text] = 1;
		err(text);
	}
}

// include: runtime_functions.js

// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {
	// If the type reflection proposal is available, use the new
	// "WebAssembly.Function" constructor.
	// Otherwise, construct a minimal wasm module importing the JS function and
	// re-exporting it.
	if (typeof WebAssembly.Function === "function") {
		var typeNames = {
			i: "i32",
			j: "i64",
			f: "f32",
			d: "f64",
		};
		var type = {
			parameters: [],
			results: sig[0] == "v" ? [] : [typeNames[sig[0]]],
		};
		for (var i = 1; i < sig.length; ++i) {
			type.parameters.push(typeNames[sig[i]]);
		}
		return new WebAssembly.Function(type, func);
	}

	// The module is static, with the exception of the type section, which is
	// generated based on the signature passed in.
	var typeSection = [
		0x01, // id: section,
		0x00, // length: 0 (placeholder)
		0x01, // count: 1
		0x60, // form: func
	];
	var sigRet = sig.slice(0, 1);
	var sigParam = sig.slice(1);
	var typeCodes = {
		i: 0x7f, // i32
		j: 0x7e, // i64
		f: 0x7d, // f32
		d: 0x7c, // f64
	};

	// Parameters, length + signatures
	typeSection.push(sigParam.length);
	for (var i = 0; i < sigParam.length; ++i) {
		typeSection.push(typeCodes[sigParam[i]]);
	}

	// Return values, length + signatures
	// With no multi-return in MVP, either 0 (void) or 1 (anything else)
	if (sigRet == "v") {
		typeSection.push(0x00);
	} else {
		typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
	}

	// Write the overall length of the type section back into the section header
	// (excepting the 2 bytes for the section id and length)
	typeSection[1] = typeSection.length - 2;

	// Rest of the module is static
	var bytes = new Uint8Array(
		[
			0x00,
			0x61,
			0x73,
			0x6d, // magic ("\0asm")
			0x01,
			0x00,
			0x00,
			0x00, // version: 1
		].concat(typeSection, [
			0x02,
			0x07, // import section
			// (import "e" "f" (func 0 (type 0)))
			0x01,
			0x01,
			0x65,
			0x01,
			0x66,
			0x00,
			0x00,
			0x07,
			0x05, // export section
			// (export "f" (func 0 (type 0)))
			0x01,
			0x01,
			0x66,
			0x00,
			0x00,
		]),
	);

	// We can compile this wasm module synchronously because it is very small.
	// This accepts an import (at "e.f"), that it reroutes to an export (at "f")
	var module = new WebAssembly.Module(bytes);
	var instance = new WebAssembly.Instance(module, {
		e: {
			f: func,
		},
	});
	var wrappedFunc = instance.exports["f"];
	return wrappedFunc;
}

var freeTableIndexes = [];

// Weak map of functions in the table to their indexes, created on first use.
var functionsInTableMap;

function getEmptyTableSlot() {
	// Reuse a free index if there is one, otherwise grow.
	if (freeTableIndexes.length) {
		return freeTableIndexes.pop();
	}
	// Grow the table
	try {
		wasmTable.grow(1);
	} catch (err) {
		if (!(err instanceof RangeError)) {
			throw err;
		}
		throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
	}
	return wasmTable.length - 1;
}

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
	// Check if the function is already in the table, to ensure each function
	// gets a unique index. First, create the map if this is the first use.
	if (!functionsInTableMap) {
		functionsInTableMap = new WeakMap();
		for (var i = 0; i < wasmTable.length; i++) {
			var item = wasmTable.get(i);
			// Ignore null values.
			if (item) {
				functionsInTableMap.set(item, i);
			}
		}
	}
	if (functionsInTableMap.has(func)) {
		return functionsInTableMap.get(func);
	}

	// It's not in the table, add it now.

	var ret = getEmptyTableSlot();

	// Set the new value.
	try {
		// Attempting to call this with JS function will cause of table.set() to fail
		wasmTable.set(ret, func);
	} catch (err) {
		if (!(err instanceof TypeError)) {
			throw err;
		}
		var wrapped = convertJsFunctionToWasm(func, sig);
		wasmTable.set(ret, wrapped);
	}

	functionsInTableMap.set(func, ret);

	return ret;
}

function removeFunction(index) {
	functionsInTableMap.delete(wasmTable.get(index));
	freeTableIndexes.push(index);
}

// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {
	return addFunctionWasm(func, sig);
}

// end include: runtime_functions.js
// include: runtime_debug.js

// end include: runtime_debug.js
var tempRet0 = 0;

var setTempRet0 = function (value) {
	tempRet0 = value;
};

var getTempRet0 = function () {
	return tempRet0;
};

// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
var noExitRuntime = Module["noExitRuntime"] || true;

if (typeof WebAssembly !== "object") {
	abort("no native wasm support detected");
}

// include: runtime_safe_heap.js

// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @param {number} ptr
    @param {number} value
    @param {string} type
    @param {number|boolean=} noSafe */
function setValue(ptr, value, type, noSafe) {
	type = type || "i8";
	if (type.charAt(type.length - 1) === "*") type = "i32"; // pointers are 32-bit
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
			(tempI64 = [
				value >>> 0,
				((tempDouble = value),
				+Math.abs(tempDouble) >= 1.0
					? tempDouble > 0.0
						? (Math.min(
								+Math.floor(tempDouble / 4294967296.0),
								4294967295.0,
							) |
								0) >>>
							0
						: ~~+Math.ceil(
								(tempDouble - +(~~tempDouble >>> 0)) /
									4294967296.0,
							) >>> 0
					: 0),
			]),
				(HEAP32[ptr >> 2] = tempI64[0]),
				(HEAP32[(ptr + 4) >> 2] = tempI64[1]);
			break;
		case "float":
			HEAPF32[ptr >> 2] = value;
			break;
		case "double":
			HEAPF64[ptr >> 3] = value;
			break;
		default:
			abort("invalid type for setValue: " + type);
	}
}

/** @param {number} ptr
    @param {string} type
    @param {number|boolean=} noSafe */
function getValue(ptr, type, noSafe) {
	type = type || "i8";
	if (type.charAt(type.length - 1) === "*") type = "i32"; // pointers are 32-bit
	switch (type) {
		case "i1":
			return HEAP8[ptr >> 0];
		case "i8":
			return HEAP8[ptr >> 0];
		case "i16":
			return HEAP16[ptr >> 1];
		case "i32":
			return HEAP32[ptr >> 2];
		case "i64":
			return HEAP32[ptr >> 2];
		case "float":
			return HEAPF32[ptr >> 2];
		case "double":
			return HEAPF64[ptr >> 3];
		default:
			abort("invalid type for getValue: " + type);
	}
	return null;
}

// end include: runtime_safe_heap.js
// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

/** @type {function(*, string=)} */
function assert(condition, text) {
	if (!condition) {
		abort("Assertion failed: " + text);
	}
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
	var func = Module["_" + ident]; // closure exported function
	assert(
		func,
		"Cannot call unknown function " + ident + ", make sure it is exported",
	);
	return func;
}

// C calling interface.
/** @param {string|null=} returnType
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} opts */
function ccall(ident, returnType, argTypes, args, opts) {
	// For fast lookup of conversion functions
	var toC = {
		string: function (str) {
			var ret = 0;
			if (str !== null && str !== undefined && str !== 0) {
				// null string
				// at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
				var len = (str.length << 2) + 1;
				ret = stackAlloc(len);
				stringToUTF8(str, ret, len);
			}
			return ret;
		},
		array: function (arr) {
			var ret = stackAlloc(arr.length);
			writeArrayToMemory(arr, ret);
			return ret;
		},
	};

	function convertReturnValue(ret) {
		if (returnType === "string") return UTF8ToString(ret);
		if (returnType === "boolean") return Boolean(ret);
		return ret;
	}

	var func = getCFunc(ident);
	var cArgs = [];
	var stack = 0;
	if (args) {
		for (var i = 0; i < args.length; i++) {
			var converter = toC[argTypes[i]];
			if (converter) {
				if (stack === 0) stack = stackSave();
				cArgs[i] = converter(args[i]);
			} else {
				cArgs[i] = args[i];
			}
		}
	}
	var ret = func.apply(null, cArgs);

	ret = convertReturnValue(ret);
	if (stack !== 0) stackRestore(stack);
	return ret;
}

/** @param {string=} returnType
    @param {Array=} argTypes
    @param {Object=} opts */
function cwrap(ident, returnType, argTypes, opts) {
	argTypes = argTypes || [];
	// When the function takes numbers and returns a number, we can just return
	// the original function
	var numericArgs = argTypes.every(function (type) {
		return type === "number";
	});
	var numericRet = returnType !== "string";
	if (numericRet && numericArgs && !opts) {
		return getCFunc(ident);
	}
	return function () {
		return ccall(ident, returnType, argTypes, arguments, opts);
	};
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((Uint8Array|Array<number>), number)} */
function allocate(slab, allocator) {
	var ret;

	if (allocator == ALLOC_STACK) {
		ret = stackAlloc(slab.length);
	} else {
		ret = _malloc(slab.length);
	}

	if (slab.subarray || slab.slice) {
		HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
	} else {
		HEAPU8.set(new Uint8Array(slab), ret);
	}
	return ret;
}

// include: runtime_strings.js

// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder =
	typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
	var endIdx = idx + maxBytesToRead;
	var endPtr = idx;
	// TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
	// Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
	// (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
	while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;

	if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
		return UTF8Decoder.decode(heap.subarray(idx, endPtr));
	} else {
		var str = "";
		// If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
		while (idx < endPtr) {
			// For UTF8 byte structure, see:
			// http://en.wikipedia.org/wiki/UTF-8#Description
			// https://www.ietf.org/rfc/rfc2279.txt
			// https://tools.ietf.org/html/rfc3629
			var u0 = heap[idx++];
			if (!(u0 & 0x80)) {
				str += String.fromCharCode(u0);
				continue;
			}
			var u1 = heap[idx++] & 63;
			if ((u0 & 0xe0) == 0xc0) {
				str += String.fromCharCode(((u0 & 31) << 6) | u1);
				continue;
			}
			var u2 = heap[idx++] & 63;
			if ((u0 & 0xf0) == 0xe0) {
				u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
			} else {
				u0 =
					((u0 & 7) << 18) |
					(u1 << 12) |
					(u2 << 6) |
					(heap[idx++] & 63);
			}

			if (u0 < 0x10000) {
				str += String.fromCharCode(u0);
			} else {
				var ch = u0 - 0x10000;
				str += String.fromCharCode(
					0xd800 | (ch >> 10),
					0xdc00 | (ch & 0x3ff),
				);
			}
		}
	}
	return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
	return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
	if (!(maxBytesToWrite > 0))
		// Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
		return 0;

	var startIdx = outIdx;
	var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
	for (var i = 0; i < str.length; ++i) {
		// Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
		// See http://unicode.org/faq/utf_bom.html#utf16-3
		// For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
		var u = str.charCodeAt(i); // possibly a lead surrogate
		if (u >= 0xd800 && u <= 0xdfff) {
			var u1 = str.charCodeAt(++i);
			u = (0x10000 + ((u & 0x3ff) << 10)) | (u1 & 0x3ff);
		}
		if (u <= 0x7f) {
			if (outIdx >= endIdx) break;
			heap[outIdx++] = u;
		} else if (u <= 0x7ff) {
			if (outIdx + 1 >= endIdx) break;
			heap[outIdx++] = 0xc0 | (u >> 6);
			heap[outIdx++] = 0x80 | (u & 63);
		} else if (u <= 0xffff) {
			if (outIdx + 2 >= endIdx) break;
			heap[outIdx++] = 0xe0 | (u >> 12);
			heap[outIdx++] = 0x80 | ((u >> 6) & 63);
			heap[outIdx++] = 0x80 | (u & 63);
		} else {
			if (outIdx + 3 >= endIdx) break;
			heap[outIdx++] = 0xf0 | (u >> 18);
			heap[outIdx++] = 0x80 | ((u >> 12) & 63);
			heap[outIdx++] = 0x80 | ((u >> 6) & 63);
			heap[outIdx++] = 0x80 | (u & 63);
		}
	}
	// Null-terminate the pointer to the buffer.
	heap[outIdx] = 0;
	return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
	return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
	var len = 0;
	for (var i = 0; i < str.length; ++i) {
		// Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
		// See http://unicode.org/faq/utf_bom.html#utf16-3
		var u = str.charCodeAt(i); // possibly a lead surrogate
		if (u >= 0xd800 && u <= 0xdfff)
			u = (0x10000 + ((u & 0x3ff) << 10)) | (str.charCodeAt(++i) & 0x3ff);
		if (u <= 0x7f) ++len;
		else if (u <= 0x7ff) len += 2;
		else if (u <= 0xffff) len += 3;
		else len += 4;
	}
	return len;
}

// end include: runtime_strings.js
// include: runtime_strings_extra.js

// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
	var str = "";
	while (1) {
		var ch = HEAPU8[ptr++ >> 0];
		if (!ch) return str;
		str += String.fromCharCode(ch);
	}
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
	return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder =
	typeof TextDecoder !== "undefined"
		? new TextDecoder("utf-16le")
		: undefined;

function UTF16ToString(ptr, maxBytesToRead) {
	var endPtr = ptr;
	// TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
	// Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
	var idx = endPtr >> 1;
	var maxIdx = idx + maxBytesToRead / 2;
	// If maxBytesToRead is not passed explicitly, it will be undefined, and this
	// will always evaluate to true. This saves on code size.
	while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
	endPtr = idx << 1;

	if (endPtr - ptr > 32 && UTF16Decoder) {
		return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
	} else {
		var str = "";

		// If maxBytesToRead is not passed explicitly, it will be undefined, and the for-loop's condition
		// will always evaluate to true. The loop is then terminated on the first null char.
		for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
			var codeUnit = HEAP16[(ptr + i * 2) >> 1];
			if (codeUnit == 0) break;
			// fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
			str += String.fromCharCode(codeUnit);
		}

		return str;
	}
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
	// Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
	if (maxBytesToWrite === undefined) {
		maxBytesToWrite = 0x7fffffff;
	}
	if (maxBytesToWrite < 2) return 0;
	maxBytesToWrite -= 2; // Null terminator.
	var startPtr = outPtr;
	var numCharsToWrite =
		maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
	for (var i = 0; i < numCharsToWrite; ++i) {
		// charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
		var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
		HEAP16[outPtr >> 1] = codeUnit;
		outPtr += 2;
	}
	// Null-terminate the pointer to the HEAP.
	HEAP16[outPtr >> 1] = 0;
	return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
	return str.length * 2;
}

function UTF32ToString(ptr, maxBytesToRead) {
	var i = 0;

	var str = "";
	// If maxBytesToRead is not passed explicitly, it will be undefined, and this
	// will always evaluate to true. This saves on code size.
	while (!(i >= maxBytesToRead / 4)) {
		var utf32 = HEAP32[(ptr + i * 4) >> 2];
		if (utf32 == 0) break;
		++i;
		// Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
		// See http://unicode.org/faq/utf_bom.html#utf16-3
		if (utf32 >= 0x10000) {
			var ch = utf32 - 0x10000;
			str += String.fromCharCode(
				0xd800 | (ch >> 10),
				0xdc00 | (ch & 0x3ff),
			);
		} else {
			str += String.fromCharCode(utf32);
		}
	}
	return str;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
	// Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
	if (maxBytesToWrite === undefined) {
		maxBytesToWrite = 0x7fffffff;
	}
	if (maxBytesToWrite < 4) return 0;
	var startPtr = outPtr;
	var endPtr = startPtr + maxBytesToWrite - 4;
	for (var i = 0; i < str.length; ++i) {
		// Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
		// See http://unicode.org/faq/utf_bom.html#utf16-3
		var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
		if (codeUnit >= 0xd800 && codeUnit <= 0xdfff) {
			var trailSurrogate = str.charCodeAt(++i);
			codeUnit =
				(0x10000 + ((codeUnit & 0x3ff) << 10)) |
				(trailSurrogate & 0x3ff);
		}
		HEAP32[outPtr >> 2] = codeUnit;
		outPtr += 4;
		if (outPtr + 4 > endPtr) break;
	}
	// Null-terminate the pointer to the HEAP.
	HEAP32[outPtr >> 2] = 0;
	return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
	var len = 0;
	for (var i = 0; i < str.length; ++i) {
		// Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
		// See http://unicode.org/faq/utf_bom.html#utf16-3
		var codeUnit = str.charCodeAt(i);
		if (codeUnit >= 0xd800 && codeUnit <= 0xdfff) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
		len += 4;
	}

	return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
	var size = lengthBytesUTF8(str) + 1;
	var ret = _malloc(size);
	if (ret) stringToUTF8Array(str, HEAP8, ret, size);
	return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
	var size = lengthBytesUTF8(str) + 1;
	var ret = stackAlloc(size);
	stringToUTF8Array(str, HEAP8, ret, size);
	return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated
    @param {boolean=} dontAddNull */
function writeStringToMemory(string, buffer, dontAddNull) {
	warnOnce(
		"writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!",
	);

	var /** @type {number} */ lastChar, /** @type {number} */ end;
	if (dontAddNull) {
		// stringToUTF8Array always appends null. If we don't want to do that, remember the
		// character that existed at the location where the null will be placed, and restore
		// that after the write (below).
		end = buffer + lengthBytesUTF8(string);
		lastChar = HEAP8[end];
	}
	stringToUTF8(string, buffer, Infinity);
	if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
	HEAP8.set(array, buffer);
}

/** @param {boolean=} dontAddNull */
function writeAsciiToMemory(str, buffer, dontAddNull) {
	for (var i = 0; i < str.length; ++i) {
		HEAP8[buffer++ >> 0] = str.charCodeAt(i);
	}
	// Null-terminate the pointer to the HEAP.
	if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}

// end include: runtime_strings_extra.js
// Memory management

function alignUp(x, multiple) {
	if (x % multiple > 0) {
		x += multiple - (x % multiple);
	}
	return x;
}

var HEAP,
	/** @type {ArrayBuffer} */
	buffer,
	/** @type {Int8Array} */
	HEAP8,
	/** @type {Uint8Array} */
	HEAPU8,
	/** @type {Int16Array} */
	HEAP16,
	/** @type {Uint16Array} */
	HEAPU16,
	/** @type {Int32Array} */
	HEAP32,
	/** @type {Uint32Array} */
	HEAPU32,
	/** @type {Float32Array} */
	HEAPF32,
	/** @type {Float64Array} */
	HEAPF64;

function updateGlobalBufferAndViews(buf) {
	buffer = buf;
	Module["HEAP8"] = HEAP8 = new Int8Array(buf);
	Module["HEAP16"] = HEAP16 = new Int16Array(buf);
	Module["HEAP32"] = HEAP32 = new Int32Array(buf);
	Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
	Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
	Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
	Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
	Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}

var TOTAL_STACK = 5242880;

var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;

// include: runtime_init_table.js
// In regular non-RELOCATABLE mode the table is exported
// from the wasm module and this will be assigned once
// the exports are available.
var wasmTable;

// end include: runtime_init_table.js
// include: runtime_stack_check.js

// end include: runtime_stack_check.js
// include: runtime_assertions.js

// end include: runtime_assertions.js
var __ATPRERUN__ = []; // functions called before the runtime is initialized
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;
var runtimeKeepaliveCounter = 0;

function keepRuntimeAlive() {
	return noExitRuntime || runtimeKeepaliveCounter > 0;
}

function preRun() {
	if (Module["preRun"]) {
		if (typeof Module["preRun"] == "function")
			Module["preRun"] = [Module["preRun"]];
		while (Module["preRun"].length) {
			addOnPreRun(Module["preRun"].shift());
		}
	}

	callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
	runtimeInitialized = true;

	callRuntimeCallbacks(__ATINIT__);
}

function exitRuntime() {
	runtimeExited = true;
}

function postRun() {
	if (Module["postRun"]) {
		if (typeof Module["postRun"] == "function")
			Module["postRun"] = [Module["postRun"]];
		while (Module["postRun"].length) {
			addOnPostRun(Module["postRun"].shift());
		}
	}

	callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
	__ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
	__ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
	__ATMAIN__.unshift(cb);
}

function addOnExit(cb) {}

function addOnPostRun(cb) {
	__ATPOSTRUN__.unshift(cb);
}

// include: runtime_math.js

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
	return id;
}

function addRunDependency(id) {
	runDependencies++;

	if (Module["monitorRunDependencies"]) {
		Module["monitorRunDependencies"](runDependencies);
	}
}

function removeRunDependency(id) {
	runDependencies--;

	if (Module["monitorRunDependencies"]) {
		Module["monitorRunDependencies"](runDependencies);
	}

	if (runDependencies == 0) {
		if (runDependencyWatcher !== null) {
			clearInterval(runDependencyWatcher);
			runDependencyWatcher = null;
		}
		if (dependenciesFulfilled) {
			var callback = dependenciesFulfilled;
			dependenciesFulfilled = null;
			callback(); // can add another dependenciesFulfilled
		}
	}
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

/** @param {string|number=} what */
function abort(what) {
	if (Module["onAbort"]) {
		Module["onAbort"](what);
	}

	what += "";
	err(what);

	ABORT = true;
	EXITSTATUS = 1;

	what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";

	// Use a wasm runtime error, because a JS error might be seen as a foreign
	// exception, which means we'd run destructors on it. We need the error to
	// simply make the program stop.
	var e = new WebAssembly.RuntimeError(what);

	// Throw the error whether or not MODULARIZE is set because abort is used
	// in code paths apart from instantiation where an exception is expected
	// to be thrown when abort is called.
	throw e;
}

// {{MEM_INITIALIZER}}

// include: memoryprofiler.js

// end include: memoryprofiler.js
// include: URIUtils.js

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = "data:application/octet-stream;base64,";

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
	// Prefix of data URIs emitted by SINGLE_FILE and related options.
	return filename.startsWith(dataURIPrefix);
}

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
	return filename.startsWith("file://");
}

// end include: URIUtils.js
var wasmBinaryFile;
wasmBinaryFile = "process.wasm";
if (!isDataURI(wasmBinaryFile)) {
	wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary(file) {
	try {
		if (file == wasmBinaryFile && wasmBinary) {
			return new Uint8Array(wasmBinary);
		}
		if (readBinary) {
			return readBinary(file);
		} else {
			throw "both async and sync fetching of the wasm failed";
		}
	} catch (err) {
		abort(err);
	}
}

function getBinaryPromise() {
	// If we don't have the binary yet, try to to load it asynchronously.
	// Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
	// See https://github.com/github/fetch/pull/92#issuecomment-140665932
	// Cordova or Electron apps are typically loaded from a file:// url.
	// So use fetch if it is available and the url is not a file, otherwise fall back to XHR.
	if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
		if (typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
			return fetch(wasmBinaryFile, { credentials: "same-origin" })
				.then(function (response) {
					if (!response["ok"]) {
						throw (
							"failed to load wasm binary file at '" +
							wasmBinaryFile +
							"'"
						);
					}
					return response["arrayBuffer"]();
				})
				.catch(function () {
					return getBinary(wasmBinaryFile);
				});
		} else {
			if (readAsync) {
				// fetch is not available or url is file => try XHR (readAsync uses XHR internally)
				return new Promise(function (resolve, reject) {
					readAsync(
						wasmBinaryFile,
						function (response) {
							resolve(
								new Uint8Array(
									/** @type{!ArrayBuffer} */ (response),
								),
							);
						},
						reject,
					);
				});
			}
		}
	}

	// Otherwise, getBinary should be able to get it synchronously
	return Promise.resolve().then(function () {
		return getBinary(wasmBinaryFile);
	});
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
	// prepare imports
	var info = {
		env: asmLibraryArg,
		wasi_snapshot_preview1: asmLibraryArg,
	};
	// Load the wasm module and create an instance of using native support in the JS engine.
	// handle a generated wasm instance, receiving its exports and
	// performing other necessary setup
	/** @param {WebAssembly.Module=} module*/
	function receiveInstance(instance, module) {
		var exports = instance.exports;

		Module["asm"] = exports;

		wasmMemory = Module["asm"]["memory"];
		updateGlobalBufferAndViews(wasmMemory.buffer);

		wasmTable = Module["asm"]["__indirect_function_table"];

		addOnInit(Module["asm"]["__wasm_call_ctors"]);

		removeRunDependency("wasm-instantiate");
	}
	// we can't run yet (except in a pthread, where we have a custom sync instantiator)
	addRunDependency("wasm-instantiate");

	// Prefer streaming instantiation if available.
	function receiveInstantiationResult(result) {
		// 'result' is a ResultObject object which has both the module and instance.
		// receiveInstance() will swap in the exports (to Module.asm) so they can be called
		// TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
		// When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
		receiveInstance(result["instance"]);
	}

	function instantiateArrayBuffer(receiver) {
		return getBinaryPromise()
			.then(function (binary) {
				var result = WebAssembly.instantiate(binary, info);
				return result;
			})
			.then(receiver, function (reason) {
				err("failed to asynchronously prepare wasm: " + reason);

				abort(reason);
			});
	}

	function instantiateAsync() {
		if (
			!wasmBinary &&
			typeof WebAssembly.instantiateStreaming === "function" &&
			!isDataURI(wasmBinaryFile) &&
			// Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
			!isFileURI(wasmBinaryFile) &&
			typeof fetch === "function"
		) {
			return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(
				function (response) {
					var result = WebAssembly.instantiateStreaming(
						response,
						info,
					);
					return result.then(
						receiveInstantiationResult,
						function (reason) {
							// We expect the most common failure cause to be a bad MIME type for the binary,
							// in which case falling back to ArrayBuffer instantiation should work.
							err("wasm streaming compile failed: " + reason);
							err("falling back to ArrayBuffer instantiation");
							return instantiateArrayBuffer(
								receiveInstantiationResult,
							);
						},
					);
				},
			);
		} else {
			return instantiateArrayBuffer(receiveInstantiationResult);
		}
	}

	// User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
	// to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
	// to any other async startup actions they are performing.
	if (Module["instantiateWasm"]) {
		try {
			var exports = Module["instantiateWasm"](info, receiveInstance);
			return exports;
		} catch (e) {
			err("Module.instantiateWasm callback failed with error: " + e);
			return false;
		}
	}

	instantiateAsync();
	return {}; // no exports yet; we'll fill them in later
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {};

function callRuntimeCallbacks(callbacks) {
	while (callbacks.length > 0) {
		var callback = callbacks.shift();
		if (typeof callback == "function") {
			callback(Module); // Pass the module as the first argument.
			continue;
		}
		var func = callback.func;
		if (typeof func === "number") {
			if (callback.arg === undefined) {
				wasmTable.get(func)();
			} else {
				wasmTable.get(func)(callback.arg);
			}
		} else {
			func(callback.arg === undefined ? null : callback.arg);
		}
	}
}
Module["callRuntimeCallbacks"] = callRuntimeCallbacks;

function demangle(func) {
	return func;
}
Module["demangle"] = demangle;

function demangleAll(text) {
	var regex = /\b_Z[\w\d_]+/g;
	return text.replace(regex, function (x) {
		var y = demangle(x);
		return x === y ? x : y + " [" + x + "]";
	});
}
Module["demangleAll"] = demangleAll;

function jsStackTrace() {
	var error = new Error();
	if (!error.stack) {
		// IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
		// so try that as a special-case.
		try {
			throw new Error();
		} catch (e) {
			error = e;
		}
		if (!error.stack) {
			return "(no stack trace available)";
		}
	}
	return error.stack.toString();
}
Module["jsStackTrace"] = jsStackTrace;

function stackTrace() {
	var js = jsStackTrace();
	if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
	return demangleAll(js);
}
Module["stackTrace"] = stackTrace;

function _emscripten_memcpy_big(dest, src, num) {
	HEAPU8.copyWithin(dest, src, src + num);
}
Module["_emscripten_memcpy_big"] = _emscripten_memcpy_big;

function emscripten_realloc_buffer(size) {
	try {
		// round size grow request up to wasm page size (fixed 64KB per spec)
		wasmMemory.grow((size - buffer.byteLength + 65535) >>> 16); // .grow() takes a delta compared to the previous size
		updateGlobalBufferAndViews(wasmMemory.buffer);
		return 1 /*success*/;
	} catch (e) {}
	// implicit 0 return to save code size (caller will cast "undefined" into 0
	// anyhow)
}
Module["emscripten_realloc_buffer"] = emscripten_realloc_buffer;
function _emscripten_resize_heap(requestedSize) {
	var oldSize = HEAPU8.length;
	requestedSize = requestedSize >>> 0;
	// With pthreads, races can happen (another thread might increase the size in between), so return a failure, and let the caller retry.

	// Memory resize rules:
	// 1. Always increase heap size to at least the requested size, rounded up to next page multiple.
	// 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap geometrically: increase the heap size according to
	//                                         MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%),
	//                                         At most overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
	// 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap linearly: increase the heap size by at least MEMORY_GROWTH_LINEAR_STEP bytes.
	// 3. Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
	// 4. If we were unable to allocate as much memory, it may be due to over-eager decision to excessively reserve due to (3) above.
	//    Hence if an allocation fails, cut down on the amount of excess growth, in an attempt to succeed to perform a smaller allocation.

	// A limit is set for how much we can grow. We should not exceed that
	// (the wasm binary specifies it, so if we tried, we'd fail anyhow).
	// In CAN_ADDRESS_2GB mode, stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate full 4GB Wasm memories, the size will wrap
	// back to 0 bytes in Wasm side for any code that deals with heap sizes, which would require special casing all heap size related code to treat
	// 0 specially.
	var maxHeapSize = 2147483648;
	if (requestedSize > maxHeapSize) {
		return false;
	}

	// Loop through potential heap size increases. If we attempt a too eager reservation that fails, cut down on the
	// attempted size and reserve a smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
	for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
		var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
		// but limit overreserving (default to capping at +96MB overgrowth at most)
		overGrownHeapSize = Math.min(
			overGrownHeapSize,
			requestedSize + 100663296,
		);

		var newSize = Math.min(
			maxHeapSize,
			alignUp(Math.max(requestedSize, overGrownHeapSize), 65536),
		);

		var replacement = emscripten_realloc_buffer(newSize);
		if (replacement) {
			return true;
		}
	}
	return false;
}
Module["_emscripten_resize_heap"] = _emscripten_resize_heap;
var ASSERTIONS = false;

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
	var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
	var u8array = new Array(len);
	var numBytesWritten = stringToUTF8Array(
		stringy,
		u8array,
		0,
		u8array.length,
	);
	if (dontAddNull) u8array.length = numBytesWritten;
	return u8array;
}

function intArrayToString(array) {
	var ret = [];
	for (var i = 0; i < array.length; i++) {
		var chr = array[i];
		if (chr > 0xff) {
			if (ASSERTIONS) {
				assert(
					false,
					"Character code " +
						chr +
						" (" +
						String.fromCharCode(chr) +
						")  at offset " +
						i +
						" not in 0x00-0xFF.",
				);
			}
			chr &= 0xff;
		}
		ret.push(String.fromCharCode(chr));
	}
	return ret.join("");
}

var asmLibraryArg = {
	emscripten_memcpy_big: _emscripten_memcpy_big,
	emscripten_resize_heap: _emscripten_resize_heap,
};
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = (Module["___wasm_call_ctors"] = function () {
	return (___wasm_call_ctors = Module["___wasm_call_ctors"] =
		Module["asm"]["__wasm_call_ctors"]).apply(null, arguments);
});

/** @type {function(...*):?} */
var _malloc = (Module["_malloc"] = function () {
	return (_malloc = Module["_malloc"] = Module["asm"]["malloc"]).apply(
		null,
		arguments,
	);
});

/** @type {function(...*):?} */
var _free = (Module["_free"] = function () {
	return (_free = Module["_free"] = Module["asm"]["free"]).apply(
		null,
		arguments,
	);
});

/** @type {function(...*):?} */
var _pre_processing = (Module["_pre_processing"] = function () {
	return (_pre_processing = Module["_pre_processing"] =
		Module["asm"]["pre_processing"]).apply(null, arguments);
});

/** @type {function(...*):?} */
var _post_processing = (Module["_post_processing"] = function () {
	return (_post_processing = Module["_post_processing"] =
		Module["asm"]["post_processing"]).apply(null, arguments);
});

/** @type {function(...*):?} */
var ___errno_location = (Module["___errno_location"] = function () {
	return (___errno_location = Module["___errno_location"] =
		Module["asm"]["__errno_location"]).apply(null, arguments);
});

/** @type {function(...*):?} */
var stackSave = (Module["stackSave"] = function () {
	return (stackSave = Module["stackSave"] = Module["asm"]["stackSave"]).apply(
		null,
		arguments,
	);
});

/** @type {function(...*):?} */
var stackRestore = (Module["stackRestore"] = function () {
	return (stackRestore = Module["stackRestore"] =
		Module["asm"]["stackRestore"]).apply(null, arguments);
});

/** @type {function(...*):?} */
var stackAlloc = (Module["stackAlloc"] = function () {
	return (stackAlloc = Module["stackAlloc"] =
		Module["asm"]["stackAlloc"]).apply(null, arguments);
});

// === Auto-generated postamble setup entry stuff ===

Module["cwrap"] = cwrap;

var calledRun;

/**
 * @constructor
 * @this {ExitStatus}
 */
function ExitStatus(status) {
	this.name = "ExitStatus";
	this.message = "Program terminated with exit(" + status + ")";
	this.status = status;
}

var calledMain = false;

dependenciesFulfilled = function runCaller() {
	// If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
	if (!calledRun) run();
	if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

/** @type {function(Array=)} */
function run(args) {
	args = args || arguments_;

	if (runDependencies > 0) {
		return;
	}

	preRun();

	// a preRun added a dependency, run will be called later
	if (runDependencies > 0) {
		return;
	}

	function doRun() {
		// run may have just been called through dependencies being fulfilled just in this very frame,
		// or while the async setStatus time below was happening
		if (calledRun) return;
		calledRun = true;
		Module["calledRun"] = true;

		if (ABORT) return;

		initRuntime();

		if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();

		postRun();
	}

	if (Module["setStatus"]) {
		Module["setStatus"]("Running...");
		setTimeout(function () {
			setTimeout(function () {
				Module["setStatus"]("");
			}, 1);
			doRun();
		}, 1);
	} else {
		doRun();
	}
}
Module["run"] = run;

/** @param {boolean|number=} implicit */
function exit(status, implicit) {
	EXITSTATUS = status;

	if (keepRuntimeAlive()) {
	} else {
		exitRuntime();

		if (Module["onExit"]) Module["onExit"](status);

		ABORT = true;
	}

	quit_(status, new ExitStatus(status));
}

if (Module["preInit"]) {
	if (typeof Module["preInit"] == "function")
		Module["preInit"] = [Module["preInit"]];
	while (Module["preInit"].length > 0) {
		Module["preInit"].pop()();
	}
}

run();
