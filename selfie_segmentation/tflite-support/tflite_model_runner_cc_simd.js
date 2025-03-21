var tflite_model_runner_ModuleFactory = (() => {
	var _scriptDir =
		typeof document !== "undefined" && document.currentScript
			? document.currentScript.src
			: undefined;
	if (typeof __filename !== "undefined")
		_scriptDir = _scriptDir || __filename;
	return function (tflite_model_runner_ModuleFactory) {
		tflite_model_runner_ModuleFactory =
			tflite_model_runner_ModuleFactory || {};

		var Module =
			typeof tflite_model_runner_ModuleFactory != "undefined"
				? tflite_model_runner_ModuleFactory
				: {};
		var readyPromiseResolve, readyPromiseReject;
		Module["ready"] = new Promise(function (resolve, reject) {
			readyPromiseResolve = resolve;
			readyPromiseReject = reject;
		});
		[
			"_main",
			"___getTypeName",
			"__embind_initialize_bindings",
			"_fflush",
			"onRuntimeInitialized",
		].forEach((prop) => {
			if (!Object.getOwnPropertyDescriptor(Module["ready"], prop)) {
				Object.defineProperty(Module["ready"], prop, {
					get: () =>
						abort(
							"You are getting " +
								prop +
								" on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js",
						),
					set: () =>
						abort(
							"You are setting " +
								prop +
								" on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js",
						),
				});
			}
		});
		var moduleOverrides = Object.assign({}, Module);
		var arguments_ = [];
		var thisProgram = "./this.program";
		var quit_ = (status, toThrow) => {
			throw toThrow;
		};
		var ENVIRONMENT_IS_WEB = typeof window == "object";
		var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
		var ENVIRONMENT_IS_NODE =
			typeof process == "object" &&
			typeof process.versions == "object" &&
			typeof process.versions.node == "string";
		var ENVIRONMENT_IS_SHELL =
			!ENVIRONMENT_IS_WEB &&
			!ENVIRONMENT_IS_NODE &&
			!ENVIRONMENT_IS_WORKER;
		if (Module["ENVIRONMENT"]) {
			throw new Error(
				"Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)",
			);
		}
		var scriptDirectory = "";
		function locateFile(path) {
			if (Module["locateFile"]) {
				return Module["locateFile"](path, scriptDirectory);
			}
			return scriptDirectory + path;
		}
		var read_, readAsync, readBinary, setWindowTitle;
		function logExceptionOnExit(e) {
			if (e instanceof ExitStatus) return;
			let toLog = e;
			if (e && typeof e == "object" && e.stack) {
				toLog = [e, e.stack];
			}
			err("exiting due to exception: " + toLog);
		}
		if (ENVIRONMENT_IS_NODE) {
			if (
				typeof process == "undefined" ||
				!process.release ||
				process.release.name !== "node"
			)
				throw new Error(
					"not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)",
				);
			if (ENVIRONMENT_IS_WORKER) {
				scriptDirectory =
					require("path").dirname(scriptDirectory) + "/";
			} else {
				scriptDirectory = __dirname + "/";
			}
			var fs, nodePath;
			if (typeof require === "function") {
				fs = require("fs");
				nodePath = require("path");
			}
			read_ = (filename, binary) => {
				filename = nodePath["normalize"](filename);
				return fs.readFileSync(filename, binary ? undefined : "utf8");
			};
			readBinary = (filename) => {
				var ret = read_(filename, true);
				if (!ret.buffer) {
					ret = new Uint8Array(ret);
				}
				assert(ret.buffer);
				return ret;
			};
			readAsync = (filename, onload, onerror) => {
				filename = nodePath["normalize"](filename);
				fs.readFile(filename, function (err, data) {
					if (err) onerror(err);
					else onload(data.buffer);
				});
			};
			if (process["argv"].length > 1) {
				thisProgram = process["argv"][1].replace(/\\/g, "/");
			}
			arguments_ = process["argv"].slice(2);
			process["on"]("uncaughtException", function (ex) {
				if (!(ex instanceof ExitStatus)) {
					throw ex;
				}
			});
			process["on"]("unhandledRejection", function (reason) {
				throw reason;
			});
			quit_ = (status, toThrow) => {
				if (keepRuntimeAlive()) {
					process["exitCode"] = status;
					throw toThrow;
				}
				logExceptionOnExit(toThrow);
				process["exit"](status);
			};
			Module["inspect"] = function () {
				return "[Emscripten Module object]";
			};
		} else if (ENVIRONMENT_IS_SHELL) {
			if (
				(typeof process == "object" && typeof require === "function") ||
				typeof window == "object" ||
				typeof importScripts == "function"
			)
				throw new Error(
					"not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)",
				);
			if (typeof read != "undefined") {
				read_ = function shell_read(f) {
					return read(f);
				};
			}
			readBinary = function readBinary(f) {
				let data;
				if (typeof readbuffer == "function") {
					return new Uint8Array(readbuffer(f));
				}
				data = read(f, "binary");
				assert(typeof data == "object");
				return data;
			};
			readAsync = function readAsync(f, onload, onerror) {
				setTimeout(() => onload(readBinary(f)), 0);
			};
			if (typeof scriptArgs != "undefined") {
				arguments_ = scriptArgs;
			} else if (typeof arguments != "undefined") {
				arguments_ = arguments;
			}
			if (typeof quit == "function") {
				quit_ = (status, toThrow) => {
					logExceptionOnExit(toThrow);
					quit(status);
				};
			}
			if (typeof print != "undefined") {
				if (typeof console == "undefined") console = {};
				console.log = print;
				console.warn = console.error =
					typeof printErr != "undefined" ? printErr : print;
			}
		} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
			if (ENVIRONMENT_IS_WORKER) {
				scriptDirectory = self.location.href;
			} else if (
				typeof document != "undefined" &&
				document.currentScript
			) {
				scriptDirectory = document.currentScript.src;
			}
			if (_scriptDir) {
				scriptDirectory = _scriptDir;
			}
			if (scriptDirectory.indexOf("blob:") !== 0) {
				scriptDirectory = scriptDirectory.substr(
					0,
					scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1,
				);
			} else {
				scriptDirectory = "";
			}
			if (
				!(
					typeof window == "object" ||
					typeof importScripts == "function"
				)
			)
				throw new Error(
					"not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)",
				);
			{
				read_ = (url) => {
					var xhr = new XMLHttpRequest();
					xhr.open("GET", url, false);
					xhr.send(null);
					return xhr.responseText;
				};
				if (ENVIRONMENT_IS_WORKER) {
					readBinary = (url) => {
						var xhr = new XMLHttpRequest();
						xhr.open("GET", url, false);
						xhr.responseType = "arraybuffer";
						xhr.send(null);
						return new Uint8Array(xhr.response);
					};
				}
				readAsync = (url, onload, onerror) => {
					var xhr = new XMLHttpRequest();
					xhr.open("GET", url, true);
					xhr.responseType = "arraybuffer";
					xhr.onload = () => {
						if (
							xhr.status == 200 ||
							(xhr.status == 0 && xhr.response)
						) {
							onload(xhr.response);
							return;
						}
						onerror();
					};
					xhr.onerror = onerror;
					xhr.send(null);
				};
			}
			setWindowTitle = (title) => (document.title = title);
		} else {
			throw new Error("environment detection error");
		}
		var out = Module["print"] || console.log.bind(console);
		var err = Module["printErr"] || console.warn.bind(console);
		Object.assign(Module, moduleOverrides);
		moduleOverrides = null;
		checkIncomingModuleAPI();
		if (Module["arguments"]) arguments_ = Module["arguments"];
		legacyModuleProp("arguments", "arguments_");
		if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
		legacyModuleProp("thisProgram", "thisProgram");
		if (Module["quit"]) quit_ = Module["quit"];
		legacyModuleProp("quit", "quit_");
		assert(
			typeof Module["memoryInitializerPrefixURL"] == "undefined",
			"Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead",
		);
		assert(
			typeof Module["pthreadMainPrefixURL"] == "undefined",
			"Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead",
		);
		assert(
			typeof Module["cdInitializerPrefixURL"] == "undefined",
			"Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead",
		);
		assert(
			typeof Module["filePackagePrefixURL"] == "undefined",
			"Module.filePackagePrefixURL option was removed, use Module.locateFile instead",
		);
		assert(
			typeof Module["read"] == "undefined",
			"Module.read option was removed (modify read_ in JS)",
		);
		assert(
			typeof Module["readAsync"] == "undefined",
			"Module.readAsync option was removed (modify readAsync in JS)",
		);
		assert(
			typeof Module["readBinary"] == "undefined",
			"Module.readBinary option was removed (modify readBinary in JS)",
		);
		assert(
			typeof Module["setWindowTitle"] == "undefined",
			"Module.setWindowTitle option was removed (modify setWindowTitle in JS)",
		);
		assert(
			typeof Module["TOTAL_MEMORY"] == "undefined",
			"Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY",
		);
		legacyModuleProp("read", "read_");
		legacyModuleProp("readAsync", "readAsync");
		legacyModuleProp("readBinary", "readBinary");
		legacyModuleProp("setWindowTitle", "setWindowTitle");
		assert(
			!ENVIRONMENT_IS_SHELL,
			"shell environment detected but not enabled at build time.  Add 'shell' to `-sENVIRONMENT` to enable.",
		);
		var POINTER_SIZE = 4;
		function legacyModuleProp(prop, newName) {
			if (!Object.getOwnPropertyDescriptor(Module, prop)) {
				Object.defineProperty(Module, prop, {
					configurable: true,
					get: function () {
						abort(
							"Module." +
								prop +
								" has been replaced with plain " +
								newName +
								" (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)",
						);
					},
				});
			}
		}
		function ignoredModuleProp(prop) {
			if (Object.getOwnPropertyDescriptor(Module, prop)) {
				abort(
					"`Module." +
						prop +
						"` was supplied but `" +
						prop +
						"` not included in INCOMING_MODULE_JS_API",
				);
			}
		}
		function isExportedByForceFilesystem(name) {
			return (
				name === "FS_createPath" ||
				name === "FS_createDataFile" ||
				name === "FS_createPreloadedFile" ||
				name === "FS_unlink" ||
				name === "addRunDependency" ||
				name === "FS_createLazyFile" ||
				name === "FS_createDevice" ||
				name === "removeRunDependency"
			);
		}
		function missingLibrarySymbol(sym) {
			if (
				typeof globalThis !== "undefined" &&
				!Object.getOwnPropertyDescriptor(globalThis, sym)
			) {
				Object.defineProperty(globalThis, sym, {
					configurable: true,
					get: function () {
						var msg =
							"`" +
							sym +
							"` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line";
						var librarySymbol = sym;
						if (!librarySymbol.startsWith("_")) {
							librarySymbol = "$" + sym;
						}
						msg +=
							" (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=" +
							librarySymbol +
							")";
						if (isExportedByForceFilesystem(sym)) {
							msg +=
								". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
						}
						warnOnce(msg);
						return undefined;
					},
				});
			}
		}
		function unexportedRuntimeSymbol(sym) {
			if (!Object.getOwnPropertyDescriptor(Module, sym)) {
				Object.defineProperty(Module, sym, {
					configurable: true,
					get: function () {
						var msg =
							"'" +
							sym +
							"' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)";
						if (isExportedByForceFilesystem(sym)) {
							msg +=
								". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
						}
						abort(msg);
					},
				});
			}
		}
		var wasmBinary;
		if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
		legacyModuleProp("wasmBinary", "wasmBinary");
		var noExitRuntime = Module["noExitRuntime"] || true;
		legacyModuleProp("noExitRuntime", "noExitRuntime");
		if (typeof WebAssembly != "object") {
			abort("no native wasm support detected");
		}
		var wasmMemory;
		var ABORT = false;
		var EXITSTATUS;
		function assert(condition, text) {
			if (!condition) {
				abort("Assertion failed" + (text ? ": " + text : ""));
			}
		}
		var UTF8Decoder =
			typeof TextDecoder != "undefined"
				? new TextDecoder("utf8")
				: undefined;
		function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
			var endIdx = idx + maxBytesToRead;
			var endPtr = idx;
			while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
			if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
				return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
			}
			var str = "";
			while (idx < endPtr) {
				var u0 = heapOrArray[idx++];
				if (!(u0 & 128)) {
					str += String.fromCharCode(u0);
					continue;
				}
				var u1 = heapOrArray[idx++] & 63;
				if ((u0 & 224) == 192) {
					str += String.fromCharCode(((u0 & 31) << 6) | u1);
					continue;
				}
				var u2 = heapOrArray[idx++] & 63;
				if ((u0 & 240) == 224) {
					u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
				} else {
					if ((u0 & 248) != 240)
						warnOnce(
							"Invalid UTF-8 leading byte 0x" +
								u0.toString(16) +
								" encountered when deserializing a UTF-8 string in wasm memory to a JS string!",
						);
					u0 =
						((u0 & 7) << 18) |
						(u1 << 12) |
						(u2 << 6) |
						(heapOrArray[idx++] & 63);
				}
				if (u0 < 65536) {
					str += String.fromCharCode(u0);
				} else {
					var ch = u0 - 65536;
					str += String.fromCharCode(
						55296 | (ch >> 10),
						56320 | (ch & 1023),
					);
				}
			}
			return str;
		}
		function UTF8ToString(ptr, maxBytesToRead) {
			return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
		}
		function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
			if (!(maxBytesToWrite > 0)) return 0;
			var startIdx = outIdx;
			var endIdx = outIdx + maxBytesToWrite - 1;
			for (var i = 0; i < str.length; ++i) {
				var u = str.charCodeAt(i);
				if (u >= 55296 && u <= 57343) {
					var u1 = str.charCodeAt(++i);
					u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
				}
				if (u <= 127) {
					if (outIdx >= endIdx) break;
					heap[outIdx++] = u;
				} else if (u <= 2047) {
					if (outIdx + 1 >= endIdx) break;
					heap[outIdx++] = 192 | (u >> 6);
					heap[outIdx++] = 128 | (u & 63);
				} else if (u <= 65535) {
					if (outIdx + 2 >= endIdx) break;
					heap[outIdx++] = 224 | (u >> 12);
					heap[outIdx++] = 128 | ((u >> 6) & 63);
					heap[outIdx++] = 128 | (u & 63);
				} else {
					if (outIdx + 3 >= endIdx) break;
					if (u > 1114111)
						warnOnce(
							"Invalid Unicode code point 0x" +
								u.toString(16) +
								" encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).",
						);
					heap[outIdx++] = 240 | (u >> 18);
					heap[outIdx++] = 128 | ((u >> 12) & 63);
					heap[outIdx++] = 128 | ((u >> 6) & 63);
					heap[outIdx++] = 128 | (u & 63);
				}
			}
			heap[outIdx] = 0;
			return outIdx - startIdx;
		}
		function stringToUTF8(str, outPtr, maxBytesToWrite) {
			assert(
				typeof maxBytesToWrite == "number",
				"stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!",
			);
			return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
		}
		function lengthBytesUTF8(str) {
			var len = 0;
			for (var i = 0; i < str.length; ++i) {
				var c = str.charCodeAt(i);
				if (c <= 127) {
					len++;
				} else if (c <= 2047) {
					len += 2;
				} else if (c >= 55296 && c <= 57343) {
					len += 4;
					++i;
				} else {
					len += 3;
				}
			}
			return len;
		}
		var buffer,
			HEAP8,
			HEAPU8,
			HEAP16,
			HEAPU16,
			HEAP32,
			HEAPU32,
			HEAPF32,
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
		if (Module["TOTAL_STACK"])
			assert(
				TOTAL_STACK === Module["TOTAL_STACK"],
				"the stack size can no longer be determined at runtime",
			);
		var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 33554432;
		legacyModuleProp("INITIAL_MEMORY", "INITIAL_MEMORY");
		assert(
			INITIAL_MEMORY >= TOTAL_STACK,
			"INITIAL_MEMORY should be larger than TOTAL_STACK, was " +
				INITIAL_MEMORY +
				"! (TOTAL_STACK=" +
				TOTAL_STACK +
				")",
		);
		assert(
			typeof Int32Array != "undefined" &&
				typeof Float64Array !== "undefined" &&
				Int32Array.prototype.subarray != undefined &&
				Int32Array.prototype.set != undefined,
			"JS engine does not provide full typed array support",
		);
		assert(
			!Module["wasmMemory"],
			"Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally",
		);
		assert(
			INITIAL_MEMORY == 33554432,
			"Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically",
		);
		var wasmTable;
		function writeStackCookie() {
			var max = _emscripten_stack_get_end();
			assert((max & 3) == 0);
			HEAPU32[max >> 2] = 34821223;
			HEAPU32[(max + 4) >> 2] = 2310721022;
			HEAPU32[0] = 1668509029;
		}
		function checkStackCookie() {
			if (ABORT) return;
			var max = _emscripten_stack_get_end();
			var cookie1 = HEAPU32[max >> 2];
			var cookie2 = HEAPU32[(max + 4) >> 2];
			if (cookie1 != 34821223 || cookie2 != 2310721022) {
				abort(
					"Stack overflow! Stack cookie has been overwritten at 0x" +
						max.toString(16) +
						", expected hex dwords 0x89BACDFE and 0x2135467, but received 0x" +
						cookie2.toString(16) +
						" 0x" +
						cookie1.toString(16),
				);
			}
			if (HEAPU32[0] !== 1668509029)
				abort(
					"Runtime error: The application has corrupted its heap memory area (address zero)!",
				);
		}
		(function () {
			var h16 = new Int16Array(1);
			var h8 = new Int8Array(h16.buffer);
			h16[0] = 25459;
			if (h8[0] !== 115 || h8[1] !== 99)
				throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
		})();
		var __ATPRERUN__ = [];
		var __ATINIT__ = [];
		var __ATPOSTRUN__ = [];
		var runtimeInitialized = false;
		function keepRuntimeAlive() {
			return noExitRuntime;
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
			assert(!runtimeInitialized);
			runtimeInitialized = true;
			checkStackCookie();
			callRuntimeCallbacks(__ATINIT__);
		}
		function postRun() {
			checkStackCookie();
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
		function addOnPostRun(cb) {
			__ATPOSTRUN__.unshift(cb);
		}
		assert(
			Math.imul,
			"This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill",
		);
		assert(
			Math.fround,
			"This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill",
		);
		assert(
			Math.clz32,
			"This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill",
		);
		assert(
			Math.trunc,
			"This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill",
		);
		var runDependencies = 0;
		var runDependencyWatcher = null;
		var dependenciesFulfilled = null;
		var runDependencyTracking = {};
		function addRunDependency(id) {
			runDependencies++;
			if (Module["monitorRunDependencies"]) {
				Module["monitorRunDependencies"](runDependencies);
			}
			if (id) {
				assert(!runDependencyTracking[id]);
				runDependencyTracking[id] = 1;
				if (
					runDependencyWatcher === null &&
					typeof setInterval != "undefined"
				) {
					runDependencyWatcher = setInterval(function () {
						if (ABORT) {
							clearInterval(runDependencyWatcher);
							runDependencyWatcher = null;
							return;
						}
						var shown = false;
						for (var dep in runDependencyTracking) {
							if (!shown) {
								shown = true;
								err("still waiting on run dependencies:");
							}
							err("dependency: " + dep);
						}
						if (shown) {
							err("(end of list)");
						}
					}, 1e4);
				}
			} else {
				err("warning: run dependency added without ID");
			}
		}
		function removeRunDependency(id) {
			runDependencies--;
			if (Module["monitorRunDependencies"]) {
				Module["monitorRunDependencies"](runDependencies);
			}
			if (id) {
				assert(runDependencyTracking[id]);
				delete runDependencyTracking[id];
			} else {
				err("warning: run dependency removed without ID");
			}
			if (runDependencies == 0) {
				if (runDependencyWatcher !== null) {
					clearInterval(runDependencyWatcher);
					runDependencyWatcher = null;
				}
				if (dependenciesFulfilled) {
					var callback = dependenciesFulfilled;
					dependenciesFulfilled = null;
					callback();
				}
			}
		}
		function abort(what) {
			{
				if (Module["onAbort"]) {
					Module["onAbort"](what);
				}
			}
			what = "Aborted(" + what + ")";
			err(what);
			ABORT = true;
			EXITSTATUS = 1;
			var e = new WebAssembly.RuntimeError(what);
			readyPromiseReject(e);
			throw e;
		}
		var FS = {
			error: function () {
				abort(
					"Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM",
				);
			},
			init: function () {
				FS.error();
			},
			createDataFile: function () {
				FS.error();
			},
			createPreloadedFile: function () {
				FS.error();
			},
			createLazyFile: function () {
				FS.error();
			},
			open: function () {
				FS.error();
			},
			mkdev: function () {
				FS.error();
			},
			registerDevice: function () {
				FS.error();
			},
			analyzePath: function () {
				FS.error();
			},
			loadFilesFromDB: function () {
				FS.error();
			},
			ErrnoError: function ErrnoError() {
				FS.error();
			},
		};
		Module["FS_createDataFile"] = FS.createDataFile;
		Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
		var dataURIPrefix = "data:application/octet-stream;base64,";
		function isDataURI(filename) {
			return filename.startsWith(dataURIPrefix);
		}
		function isFileURI(filename) {
			return filename.startsWith("file://");
		}
		function createExportWrapper(name, fixedasm) {
			return function () {
				var displayName = name;
				var asm = fixedasm;
				if (!fixedasm) {
					asm = Module["asm"];
				}
				assert(
					runtimeInitialized,
					"native function `" +
						displayName +
						"` called before runtime initialization",
				);
				if (!asm[name]) {
					assert(
						asm[name],
						"exported native function `" +
							displayName +
							"` not found",
					);
				}
				return asm[name].apply(null, arguments);
			};
		}
		var wasmBinaryFile;
		wasmBinaryFile = "tflite_model_runner_cc_simd.wasm";
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
				}
				throw "both async and sync fetching of the wasm failed";
			} catch (err) {
				abort(err);
			}
		}
		function getBinaryPromise() {
			if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
				if (typeof fetch == "function" && !isFileURI(wasmBinaryFile)) {
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
						return new Promise(function (resolve, reject) {
							readAsync(
								wasmBinaryFile,
								function (response) {
									resolve(new Uint8Array(response));
								},
								reject,
							);
						});
					}
				}
			}
			return Promise.resolve().then(function () {
				return getBinary(wasmBinaryFile);
			});
		}
		function createWasm() {
			var info = {
				env: asmLibraryArg,
				wasi_snapshot_preview1: asmLibraryArg,
			};
			function receiveInstance(instance, module) {
				var exports = instance.exports;
				Module["asm"] = exports;
				wasmMemory = Module["asm"]["memory"];
				assert(wasmMemory, "memory not found in wasm exports");
				updateGlobalBufferAndViews(wasmMemory.buffer);
				wasmTable = Module["asm"]["__indirect_function_table"];
				assert(wasmTable, "table not found in wasm exports");
				addOnInit(Module["asm"]["__wasm_call_ctors"]);
				removeRunDependency("wasm-instantiate");
			}
			addRunDependency("wasm-instantiate");
			var trueModule = Module;
			function receiveInstantiationResult(result) {
				assert(
					Module === trueModule,
					"the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?",
				);
				trueModule = null;
				receiveInstance(result["instance"]);
			}
			function instantiateArrayBuffer(receiver) {
				return getBinaryPromise()
					.then(function (binary) {
						return WebAssembly.instantiate(binary, info);
					})
					.then(function (instance) {
						return instance;
					})
					.then(receiver, function (reason) {
						err("failed to asynchronously prepare wasm: " + reason);
						if (isFileURI(wasmBinaryFile)) {
							err(
								"warning: Loading from a file URI (" +
									wasmBinaryFile +
									") is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing",
							);
						}
						abort(reason);
					});
			}
			function instantiateAsync() {
				if (
					!wasmBinary &&
					typeof WebAssembly.instantiateStreaming == "function" &&
					!isDataURI(wasmBinaryFile) &&
					!isFileURI(wasmBinaryFile) &&
					!ENVIRONMENT_IS_NODE &&
					typeof fetch == "function"
				) {
					return fetch(wasmBinaryFile, {
						credentials: "same-origin",
					}).then(function (response) {
						var result = WebAssembly.instantiateStreaming(
							response,
							info,
						);
						return result.then(
							receiveInstantiationResult,
							function (reason) {
								err("wasm streaming compile failed: " + reason);
								err(
									"falling back to ArrayBuffer instantiation",
								);
								return instantiateArrayBuffer(
									receiveInstantiationResult,
								);
							},
						);
					});
				} else {
					return instantiateArrayBuffer(receiveInstantiationResult);
				}
			}
			if (Module["instantiateWasm"]) {
				try {
					var exports = Module["instantiateWasm"](
						info,
						receiveInstance,
					);
					return exports;
				} catch (e) {
					err(
						"Module.instantiateWasm callback failed with error: " +
							e,
					);
					readyPromiseReject(e);
				}
			}
			instantiateAsync().catch(readyPromiseReject);
			return {};
		}
		var tempDouble;
		var tempI64;
		function ExitStatus(status) {
			this.name = "ExitStatus";
			this.message = "Program terminated with exit(" + status + ")";
			this.status = status;
		}
		function callRuntimeCallbacks(callbacks) {
			while (callbacks.length > 0) {
				callbacks.shift()(Module);
			}
		}
		function warnOnce(text) {
			if (!warnOnce.shown) warnOnce.shown = {};
			if (!warnOnce.shown[text]) {
				warnOnce.shown[text] = 1;
				if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
				err(text);
			}
		}
		function __ZN6tflite13DumpArenaInfoERKNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEERKNS0_6vectorIiNS4_IiEEEEmRKNS9_INS_27ArenaAllocWithUsageIntervalENS4_ISE_EEEE() {
			err(
				"missing function: _ZN6tflite13DumpArenaInfoERKNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEERKNS0_6vectorIiNS4_IiEEEEmRKNS9_INS_27ArenaAllocWithUsageIntervalENS4_ISE_EEEE",
			);
			abort(-1);
		}
		function ___assert_fail(condition, filename, line, func) {
			abort(
				"Assertion failed: " +
					UTF8ToString(condition) +
					", at: " +
					[
						filename ? UTF8ToString(filename) : "unknown filename",
						line,
						func ? UTF8ToString(func) : "unknown function",
					],
			);
		}
		function __dlinit(main_dso_handle) {}
		var dlopenMissingError =
			"To use dlopen, you need enable dynamic linking, see https://github.com/emscripten-core/emscripten/wiki/Linking";
		function __dlopen_js(filename, flag) {
			abort(dlopenMissingError);
		}
		function __dlsym_js(handle, symbol) {
			abort(dlopenMissingError);
		}
		var structRegistrations = {};
		function runDestructors(destructors) {
			while (destructors.length) {
				var ptr = destructors.pop();
				var del = destructors.pop();
				del(ptr);
			}
		}
		function simpleReadValueFromPointer(pointer) {
			return this["fromWireType"](HEAP32[pointer >> 2]);
		}
		var awaitingDependencies = {};
		var registeredTypes = {};
		var typeDependencies = {};
		var char_0 = 48;
		var char_9 = 57;
		function makeLegalFunctionName(name) {
			if (undefined === name) {
				return "_unknown";
			}
			name = name.replace(/[^a-zA-Z0-9_]/g, "$");
			var f = name.charCodeAt(0);
			if (f >= char_0 && f <= char_9) {
				return "_" + name;
			}
			return name;
		}
		function createNamedFunction(name, body) {
			name = makeLegalFunctionName(name);
			return new Function(
				"body",
				"return function " +
					name +
					"() {\n" +
					'    "use strict";' +
					"    return body.apply(this, arguments);\n" +
					"};\n",
			)(body);
		}
		function extendError(baseErrorType, errorName) {
			var errorClass = createNamedFunction(errorName, function (message) {
				this.name = errorName;
				this.message = message;
				var stack = new Error(message).stack;
				if (stack !== undefined) {
					this.stack =
						this.toString() +
						"\n" +
						stack.replace(/^Error(:[^\n]*)?\n/, "");
				}
			});
			errorClass.prototype = Object.create(baseErrorType.prototype);
			errorClass.prototype.constructor = errorClass;
			errorClass.prototype.toString = function () {
				if (this.message === undefined) {
					return this.name;
				} else {
					return this.name + ": " + this.message;
				}
			};
			return errorClass;
		}
		var InternalError = undefined;
		function throwInternalError(message) {
			throw new InternalError(message);
		}
		function whenDependentTypesAreResolved(
			myTypes,
			dependentTypes,
			getTypeConverters,
		) {
			myTypes.forEach(function (type) {
				typeDependencies[type] = dependentTypes;
			});
			function onComplete(typeConverters) {
				var myTypeConverters = getTypeConverters(typeConverters);
				if (myTypeConverters.length !== myTypes.length) {
					throwInternalError("Mismatched type converter count");
				}
				for (var i = 0; i < myTypes.length; ++i) {
					registerType(myTypes[i], myTypeConverters[i]);
				}
			}
			var typeConverters = new Array(dependentTypes.length);
			var unregisteredTypes = [];
			var registered = 0;
			dependentTypes.forEach((dt, i) => {
				if (registeredTypes.hasOwnProperty(dt)) {
					typeConverters[i] = registeredTypes[dt];
				} else {
					unregisteredTypes.push(dt);
					if (!awaitingDependencies.hasOwnProperty(dt)) {
						awaitingDependencies[dt] = [];
					}
					awaitingDependencies[dt].push(() => {
						typeConverters[i] = registeredTypes[dt];
						++registered;
						if (registered === unregisteredTypes.length) {
							onComplete(typeConverters);
						}
					});
				}
			});
			if (0 === unregisteredTypes.length) {
				onComplete(typeConverters);
			}
		}
		function __embind_finalize_value_object(structType) {
			var reg = structRegistrations[structType];
			delete structRegistrations[structType];
			var rawConstructor = reg.rawConstructor;
			var rawDestructor = reg.rawDestructor;
			var fieldRecords = reg.fields;
			var fieldTypes = fieldRecords
				.map((field) => field.getterReturnType)
				.concat(fieldRecords.map((field) => field.setterArgumentType));
			whenDependentTypesAreResolved(
				[structType],
				fieldTypes,
				(fieldTypes) => {
					var fields = {};
					fieldRecords.forEach((field, i) => {
						var fieldName = field.fieldName;
						var getterReturnType = fieldTypes[i];
						var getter = field.getter;
						var getterContext = field.getterContext;
						var setterArgumentType =
							fieldTypes[i + fieldRecords.length];
						var setter = field.setter;
						var setterContext = field.setterContext;
						fields[fieldName] = {
							read: (ptr) => {
								return getterReturnType["fromWireType"](
									getter(getterContext, ptr),
								);
							},
							write: (ptr, o) => {
								var destructors = [];
								setter(
									setterContext,
									ptr,
									setterArgumentType["toWireType"](
										destructors,
										o,
									),
								);
								runDestructors(destructors);
							},
						};
					});
					return [
						{
							name: reg.name,
							fromWireType: function (ptr) {
								var rv = {};
								for (var i in fields) {
									rv[i] = fields[i].read(ptr);
								}
								rawDestructor(ptr);
								return rv;
							},
							toWireType: function (destructors, o) {
								for (var fieldName in fields) {
									if (!(fieldName in o)) {
										throw new TypeError(
											'Missing field:  "' +
												fieldName +
												'"',
										);
									}
								}
								var ptr = rawConstructor();
								for (fieldName in fields) {
									fields[fieldName].write(ptr, o[fieldName]);
								}
								if (destructors !== null) {
									destructors.push(rawDestructor, ptr);
								}
								return ptr;
							},
							argPackAdvance: 8,
							readValueFromPointer: simpleReadValueFromPointer,
							destructorFunction: rawDestructor,
						},
					];
				},
			);
		}
		function __embind_register_bigint(
			primitiveType,
			name,
			size,
			minRange,
			maxRange,
		) {}
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
					throw new TypeError("Unknown type size: " + size);
			}
		}
		function embind_init_charCodes() {
			var codes = new Array(256);
			for (var i = 0; i < 256; ++i) {
				codes[i] = String.fromCharCode(i);
			}
			embind_charCodes = codes;
		}
		var embind_charCodes = undefined;
		function readLatin1String(ptr) {
			var ret = "";
			var c = ptr;
			while (HEAPU8[c]) {
				ret += embind_charCodes[HEAPU8[c++]];
			}
			return ret;
		}
		var BindingError = undefined;
		function throwBindingError(message) {
			throw new BindingError(message);
		}
		function registerType(rawType, registeredInstance, options = {}) {
			if (!("argPackAdvance" in registeredInstance)) {
				throw new TypeError(
					"registerType registeredInstance requires argPackAdvance",
				);
			}
			var name = registeredInstance.name;
			if (!rawType) {
				throwBindingError(
					'type "' +
						name +
						'" must have a positive integer typeid pointer',
				);
			}
			if (registeredTypes.hasOwnProperty(rawType)) {
				if (options.ignoreDuplicateRegistrations) {
					return;
				} else {
					throwBindingError(
						"Cannot register type '" + name + "' twice",
					);
				}
			}
			registeredTypes[rawType] = registeredInstance;
			delete typeDependencies[rawType];
			if (awaitingDependencies.hasOwnProperty(rawType)) {
				var callbacks = awaitingDependencies[rawType];
				delete awaitingDependencies[rawType];
				callbacks.forEach((cb) => cb());
			}
		}
		function __embind_register_bool(
			rawType,
			name,
			size,
			trueValue,
			falseValue,
		) {
			var shift = getShiftFromSize(size);
			name = readLatin1String(name);
			registerType(rawType, {
				name: name,
				fromWireType: function (wt) {
					return !!wt;
				},
				toWireType: function (destructors, o) {
					return o ? trueValue : falseValue;
				},
				argPackAdvance: 8,
				readValueFromPointer: function (pointer) {
					var heap;
					if (size === 1) {
						heap = HEAP8;
					} else if (size === 2) {
						heap = HEAP16;
					} else if (size === 4) {
						heap = HEAP32;
					} else {
						throw new TypeError(
							"Unknown boolean type size: " + name,
						);
					}
					return this["fromWireType"](heap[pointer >> shift]);
				},
				destructorFunction: null,
			});
		}
		function ClassHandle_isAliasOf(other) {
			if (!(this instanceof ClassHandle)) {
				return false;
			}
			if (!(other instanceof ClassHandle)) {
				return false;
			}
			var leftClass = this.$$.ptrType.registeredClass;
			var left = this.$$.ptr;
			var rightClass = other.$$.ptrType.registeredClass;
			var right = other.$$.ptr;
			while (leftClass.baseClass) {
				left = leftClass.upcast(left);
				leftClass = leftClass.baseClass;
			}
			while (rightClass.baseClass) {
				right = rightClass.upcast(right);
				rightClass = rightClass.baseClass;
			}
			return leftClass === rightClass && left === right;
		}
		function shallowCopyInternalPointer(o) {
			return {
				count: o.count,
				deleteScheduled: o.deleteScheduled,
				preservePointerOnDelete: o.preservePointerOnDelete,
				ptr: o.ptr,
				ptrType: o.ptrType,
				smartPtr: o.smartPtr,
				smartPtrType: o.smartPtrType,
			};
		}
		function throwInstanceAlreadyDeleted(obj) {
			function getInstanceTypeName(handle) {
				return handle.$$.ptrType.registeredClass.name;
			}
			throwBindingError(
				getInstanceTypeName(obj) + " instance already deleted",
			);
		}
		var finalizationRegistry = false;
		function detachFinalizer(handle) {}
		function runDestructor($$) {
			if ($$.smartPtr) {
				$$.smartPtrType.rawDestructor($$.smartPtr);
			} else {
				$$.ptrType.registeredClass.rawDestructor($$.ptr);
			}
		}
		function releaseClassHandle($$) {
			$$.count.value -= 1;
			var toDelete = 0 === $$.count.value;
			if (toDelete) {
				runDestructor($$);
			}
		}
		function downcastPointer(ptr, ptrClass, desiredClass) {
			if (ptrClass === desiredClass) {
				return ptr;
			}
			if (undefined === desiredClass.baseClass) {
				return null;
			}
			var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
			if (rv === null) {
				return null;
			}
			return desiredClass.downcast(rv);
		}
		var registeredPointers = {};
		function getInheritedInstanceCount() {
			return Object.keys(registeredInstances).length;
		}
		function getLiveInheritedInstances() {
			var rv = [];
			for (var k in registeredInstances) {
				if (registeredInstances.hasOwnProperty(k)) {
					rv.push(registeredInstances[k]);
				}
			}
			return rv;
		}
		var deletionQueue = [];
		function flushPendingDeletes() {
			while (deletionQueue.length) {
				var obj = deletionQueue.pop();
				obj.$$.deleteScheduled = false;
				obj["delete"]();
			}
		}
		var delayFunction = undefined;
		function setDelayFunction(fn) {
			delayFunction = fn;
			if (deletionQueue.length && delayFunction) {
				delayFunction(flushPendingDeletes);
			}
		}
		function init_embind() {
			Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
			Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
			Module["flushPendingDeletes"] = flushPendingDeletes;
			Module["setDelayFunction"] = setDelayFunction;
		}
		var registeredInstances = {};
		function getBasestPointer(class_, ptr) {
			if (ptr === undefined) {
				throwBindingError("ptr should not be undefined");
			}
			while (class_.baseClass) {
				ptr = class_.upcast(ptr);
				class_ = class_.baseClass;
			}
			return ptr;
		}
		function getInheritedInstance(class_, ptr) {
			ptr = getBasestPointer(class_, ptr);
			return registeredInstances[ptr];
		}
		function makeClassHandle(prototype, record) {
			if (!record.ptrType || !record.ptr) {
				throwInternalError("makeClassHandle requires ptr and ptrType");
			}
			var hasSmartPtrType = !!record.smartPtrType;
			var hasSmartPtr = !!record.smartPtr;
			if (hasSmartPtrType !== hasSmartPtr) {
				throwInternalError(
					"Both smartPtrType and smartPtr must be specified",
				);
			}
			record.count = { value: 1 };
			return attachFinalizer(
				Object.create(prototype, { $$: { value: record } }),
			);
		}
		function RegisteredPointer_fromWireType(ptr) {
			var rawPointer = this.getPointee(ptr);
			if (!rawPointer) {
				this.destructor(ptr);
				return null;
			}
			var registeredInstance = getInheritedInstance(
				this.registeredClass,
				rawPointer,
			);
			if (undefined !== registeredInstance) {
				if (0 === registeredInstance.$$.count.value) {
					registeredInstance.$$.ptr = rawPointer;
					registeredInstance.$$.smartPtr = ptr;
					return registeredInstance["clone"]();
				} else {
					var rv = registeredInstance["clone"]();
					this.destructor(ptr);
					return rv;
				}
			}
			function makeDefaultHandle() {
				if (this.isSmartPointer) {
					return makeClassHandle(
						this.registeredClass.instancePrototype,
						{
							ptrType: this.pointeeType,
							ptr: rawPointer,
							smartPtrType: this,
							smartPtr: ptr,
						},
					);
				} else {
					return makeClassHandle(
						this.registeredClass.instancePrototype,
						{ ptrType: this, ptr: ptr },
					);
				}
			}
			var actualType = this.registeredClass.getActualType(rawPointer);
			var registeredPointerRecord = registeredPointers[actualType];
			if (!registeredPointerRecord) {
				return makeDefaultHandle.call(this);
			}
			var toType;
			if (this.isConst) {
				toType = registeredPointerRecord.constPointerType;
			} else {
				toType = registeredPointerRecord.pointerType;
			}
			var dp = downcastPointer(
				rawPointer,
				this.registeredClass,
				toType.registeredClass,
			);
			if (dp === null) {
				return makeDefaultHandle.call(this);
			}
			if (this.isSmartPointer) {
				return makeClassHandle(
					toType.registeredClass.instancePrototype,
					{
						ptrType: toType,
						ptr: dp,
						smartPtrType: this,
						smartPtr: ptr,
					},
				);
			} else {
				return makeClassHandle(
					toType.registeredClass.instancePrototype,
					{ ptrType: toType, ptr: dp },
				);
			}
		}
		function attachFinalizer(handle) {
			if ("undefined" === typeof FinalizationRegistry) {
				attachFinalizer = (handle) => handle;
				return handle;
			}
			finalizationRegistry = new FinalizationRegistry((info) => {
				console.warn(info.leakWarning.stack.replace(/^Error: /, ""));
				releaseClassHandle(info.$$);
			});
			attachFinalizer = (handle) => {
				var $$ = handle.$$;
				var hasSmartPtr = !!$$.smartPtr;
				if (hasSmartPtr) {
					var info = { $$: $$ };
					var cls = $$.ptrType.registeredClass;
					info.leakWarning = new Error(
						"Embind found a leaked C++ instance " +
							cls.name +
							" <0x" +
							$$.ptr.toString(16) +
							">.\n" +
							"We'll free it automatically in this case, but this functionality is not reliable across various environments.\n" +
							"Make sure to invoke .delete() manually once you're done with the instance instead.\n" +
							"Originally allocated",
					);
					if ("captureStackTrace" in Error) {
						Error.captureStackTrace(
							info.leakWarning,
							RegisteredPointer_fromWireType,
						);
					}
					finalizationRegistry.register(handle, info, handle);
				}
				return handle;
			};
			detachFinalizer = (handle) =>
				finalizationRegistry.unregister(handle);
			return attachFinalizer(handle);
		}
		function ClassHandle_clone() {
			if (!this.$$.ptr) {
				throwInstanceAlreadyDeleted(this);
			}
			if (this.$$.preservePointerOnDelete) {
				this.$$.count.value += 1;
				return this;
			} else {
				var clone = attachFinalizer(
					Object.create(Object.getPrototypeOf(this), {
						$$: { value: shallowCopyInternalPointer(this.$$) },
					}),
				);
				clone.$$.count.value += 1;
				clone.$$.deleteScheduled = false;
				return clone;
			}
		}
		function ClassHandle_delete() {
			if (!this.$$.ptr) {
				throwInstanceAlreadyDeleted(this);
			}
			if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
				throwBindingError("Object already scheduled for deletion");
			}
			detachFinalizer(this);
			releaseClassHandle(this.$$);
			if (!this.$$.preservePointerOnDelete) {
				this.$$.smartPtr = undefined;
				this.$$.ptr = undefined;
			}
		}
		function ClassHandle_isDeleted() {
			return !this.$$.ptr;
		}
		function ClassHandle_deleteLater() {
			if (!this.$$.ptr) {
				throwInstanceAlreadyDeleted(this);
			}
			if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
				throwBindingError("Object already scheduled for deletion");
			}
			deletionQueue.push(this);
			if (deletionQueue.length === 1 && delayFunction) {
				delayFunction(flushPendingDeletes);
			}
			this.$$.deleteScheduled = true;
			return this;
		}
		function init_ClassHandle() {
			ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
			ClassHandle.prototype["clone"] = ClassHandle_clone;
			ClassHandle.prototype["delete"] = ClassHandle_delete;
			ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
			ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater;
		}
		function ClassHandle() {}
		function ensureOverloadTable(proto, methodName, humanName) {
			if (undefined === proto[methodName].overloadTable) {
				var prevFunc = proto[methodName];
				proto[methodName] = function () {
					if (
						!proto[methodName].overloadTable.hasOwnProperty(
							arguments.length,
						)
					) {
						throwBindingError(
							"Function '" +
								humanName +
								"' called with an invalid number of arguments (" +
								arguments.length +
								") - expects one of (" +
								proto[methodName].overloadTable +
								")!",
						);
					}
					return proto[methodName].overloadTable[
						arguments.length
					].apply(this, arguments);
				};
				proto[methodName].overloadTable = [];
				proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
			}
		}
		function exposePublicSymbol(name, value, numArguments) {
			if (Module.hasOwnProperty(name)) {
				if (
					undefined === numArguments ||
					(undefined !== Module[name].overloadTable &&
						undefined !== Module[name].overloadTable[numArguments])
				) {
					throwBindingError(
						"Cannot register public name '" + name + "' twice",
					);
				}
				ensureOverloadTable(Module, name, name);
				if (Module.hasOwnProperty(numArguments)) {
					throwBindingError(
						"Cannot register multiple overloads of a function with the same number of arguments (" +
							numArguments +
							")!",
					);
				}
				Module[name].overloadTable[numArguments] = value;
			} else {
				Module[name] = value;
				if (undefined !== numArguments) {
					Module[name].numArguments = numArguments;
				}
			}
		}
		function RegisteredClass(
			name,
			constructor,
			instancePrototype,
			rawDestructor,
			baseClass,
			getActualType,
			upcast,
			downcast,
		) {
			this.name = name;
			this.constructor = constructor;
			this.instancePrototype = instancePrototype;
			this.rawDestructor = rawDestructor;
			this.baseClass = baseClass;
			this.getActualType = getActualType;
			this.upcast = upcast;
			this.downcast = downcast;
			this.pureVirtualFunctions = [];
		}
		function upcastPointer(ptr, ptrClass, desiredClass) {
			while (ptrClass !== desiredClass) {
				if (!ptrClass.upcast) {
					throwBindingError(
						"Expected null or instance of " +
							desiredClass.name +
							", got an instance of " +
							ptrClass.name,
					);
				}
				ptr = ptrClass.upcast(ptr);
				ptrClass = ptrClass.baseClass;
			}
			return ptr;
		}
		function constNoSmartPtrRawPointerToWireType(destructors, handle) {
			if (handle === null) {
				if (this.isReference) {
					throwBindingError("null is not a valid " + this.name);
				}
				return 0;
			}
			if (!handle.$$) {
				throwBindingError(
					'Cannot pass "' +
						embindRepr(handle) +
						'" as a ' +
						this.name,
				);
			}
			if (!handle.$$.ptr) {
				throwBindingError(
					"Cannot pass deleted object as a pointer of type " +
						this.name,
				);
			}
			var handleClass = handle.$$.ptrType.registeredClass;
			var ptr = upcastPointer(
				handle.$$.ptr,
				handleClass,
				this.registeredClass,
			);
			return ptr;
		}
		function genericPointerToWireType(destructors, handle) {
			var ptr;
			if (handle === null) {
				if (this.isReference) {
					throwBindingError("null is not a valid " + this.name);
				}
				if (this.isSmartPointer) {
					ptr = this.rawConstructor();
					if (destructors !== null) {
						destructors.push(this.rawDestructor, ptr);
					}
					return ptr;
				} else {
					return 0;
				}
			}
			if (!handle.$$) {
				throwBindingError(
					'Cannot pass "' +
						embindRepr(handle) +
						'" as a ' +
						this.name,
				);
			}
			if (!handle.$$.ptr) {
				throwBindingError(
					"Cannot pass deleted object as a pointer of type " +
						this.name,
				);
			}
			if (!this.isConst && handle.$$.ptrType.isConst) {
				throwBindingError(
					"Cannot convert argument of type " +
						(handle.$$.smartPtrType
							? handle.$$.smartPtrType.name
							: handle.$$.ptrType.name) +
						" to parameter type " +
						this.name,
				);
			}
			var handleClass = handle.$$.ptrType.registeredClass;
			ptr = upcastPointer(
				handle.$$.ptr,
				handleClass,
				this.registeredClass,
			);
			if (this.isSmartPointer) {
				if (undefined === handle.$$.smartPtr) {
					throwBindingError(
						"Passing raw pointer to smart pointer is illegal",
					);
				}
				switch (this.sharingPolicy) {
					case 0:
						if (handle.$$.smartPtrType === this) {
							ptr = handle.$$.smartPtr;
						} else {
							throwBindingError(
								"Cannot convert argument of type " +
									(handle.$$.smartPtrType
										? handle.$$.smartPtrType.name
										: handle.$$.ptrType.name) +
									" to parameter type " +
									this.name,
							);
						}
						break;
					case 1:
						ptr = handle.$$.smartPtr;
						break;
					case 2:
						if (handle.$$.smartPtrType === this) {
							ptr = handle.$$.smartPtr;
						} else {
							var clonedHandle = handle["clone"]();
							ptr = this.rawShare(
								ptr,
								Emval.toHandle(function () {
									clonedHandle["delete"]();
								}),
							);
							if (destructors !== null) {
								destructors.push(this.rawDestructor, ptr);
							}
						}
						break;
					default:
						throwBindingError("Unsupporting sharing policy");
				}
			}
			return ptr;
		}
		function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
			if (handle === null) {
				if (this.isReference) {
					throwBindingError("null is not a valid " + this.name);
				}
				return 0;
			}
			if (!handle.$$) {
				throwBindingError(
					'Cannot pass "' +
						embindRepr(handle) +
						'" as a ' +
						this.name,
				);
			}
			if (!handle.$$.ptr) {
				throwBindingError(
					"Cannot pass deleted object as a pointer of type " +
						this.name,
				);
			}
			if (handle.$$.ptrType.isConst) {
				throwBindingError(
					"Cannot convert argument of type " +
						handle.$$.ptrType.name +
						" to parameter type " +
						this.name,
				);
			}
			var handleClass = handle.$$.ptrType.registeredClass;
			var ptr = upcastPointer(
				handle.$$.ptr,
				handleClass,
				this.registeredClass,
			);
			return ptr;
		}
		function RegisteredPointer_getPointee(ptr) {
			if (this.rawGetPointee) {
				ptr = this.rawGetPointee(ptr);
			}
			return ptr;
		}
		function RegisteredPointer_destructor(ptr) {
			if (this.rawDestructor) {
				this.rawDestructor(ptr);
			}
		}
		function RegisteredPointer_deleteObject(handle) {
			if (handle !== null) {
				handle["delete"]();
			}
		}
		function init_RegisteredPointer() {
			RegisteredPointer.prototype.getPointee =
				RegisteredPointer_getPointee;
			RegisteredPointer.prototype.destructor =
				RegisteredPointer_destructor;
			RegisteredPointer.prototype["argPackAdvance"] = 8;
			RegisteredPointer.prototype["readValueFromPointer"] =
				simpleReadValueFromPointer;
			RegisteredPointer.prototype["deleteObject"] =
				RegisteredPointer_deleteObject;
			RegisteredPointer.prototype["fromWireType"] =
				RegisteredPointer_fromWireType;
		}
		function RegisteredPointer(
			name,
			registeredClass,
			isReference,
			isConst,
			isSmartPointer,
			pointeeType,
			sharingPolicy,
			rawGetPointee,
			rawConstructor,
			rawShare,
			rawDestructor,
		) {
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
					this.destructorFunction = null;
				} else {
					this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
					this.destructorFunction = null;
				}
			} else {
				this["toWireType"] = genericPointerToWireType;
			}
		}
		function replacePublicSymbol(name, value, numArguments) {
			if (!Module.hasOwnProperty(name)) {
				throwInternalError("Replacing nonexistant public symbol");
			}
			if (
				undefined !== Module[name].overloadTable &&
				undefined !== numArguments
			) {
				Module[name].overloadTable[numArguments] = value;
			} else {
				Module[name] = value;
				Module[name].argCount = numArguments;
			}
		}
		function dynCallLegacy(sig, ptr, args) {
			assert(
				"dynCall_" + sig in Module,
				"bad function pointer type - dynCall function not found for sig '" +
					sig +
					"'",
			);
			if (args && args.length) {
				assert(
					args.length === sig.substring(1).replace(/j/g, "--").length,
				);
			} else {
				assert(sig.length == 1);
			}
			var f = Module["dynCall_" + sig];
			return args && args.length
				? f.apply(null, [ptr].concat(args))
				: f.call(null, ptr);
		}
		function getWasmTableEntry(funcPtr) {
			return wasmTable.get(funcPtr);
		}
		function dynCall(sig, ptr, args) {
			if (sig.includes("j")) {
				return dynCallLegacy(sig, ptr, args);
			}
			assert(
				getWasmTableEntry(ptr),
				"missing table entry in dynCall: " + ptr,
			);
			var rtn = getWasmTableEntry(ptr).apply(null, args);
			return rtn;
		}
		function getDynCaller(sig, ptr) {
			assert(
				sig.includes("j") || sig.includes("p"),
				"getDynCaller should only be called with i64 sigs",
			);
			var argCache = [];
			return function () {
				argCache.length = 0;
				Object.assign(argCache, arguments);
				return dynCall(sig, ptr, argCache);
			};
		}
		function embind__requireFunction(signature, rawFunction) {
			signature = readLatin1String(signature);
			function makeDynCaller() {
				if (signature.includes("j")) {
					return getDynCaller(signature, rawFunction);
				}
				return getWasmTableEntry(rawFunction);
			}
			var fp = makeDynCaller();
			if (typeof fp != "function") {
				throwBindingError(
					"unknown function pointer with signature " +
						signature +
						": " +
						rawFunction,
				);
			}
			return fp;
		}
		var UnboundTypeError = undefined;
		function getTypeName(type) {
			var ptr = ___getTypeName(type);
			var rv = readLatin1String(ptr);
			_free(ptr);
			return rv;
		}
		function throwUnboundTypeError(message, types) {
			var unboundTypes = [];
			var seen = {};
			function visit(type) {
				if (seen[type]) {
					return;
				}
				if (registeredTypes[type]) {
					return;
				}
				if (typeDependencies[type]) {
					typeDependencies[type].forEach(visit);
					return;
				}
				unboundTypes.push(type);
				seen[type] = true;
			}
			types.forEach(visit);
			throw new UnboundTypeError(
				message + ": " + unboundTypes.map(getTypeName).join([", "]),
			);
		}
		function __embind_register_class(
			rawType,
			rawPointerType,
			rawConstPointerType,
			baseClassRawType,
			getActualTypeSignature,
			getActualType,
			upcastSignature,
			upcast,
			downcastSignature,
			downcast,
			name,
			destructorSignature,
			rawDestructor,
		) {
			name = readLatin1String(name);
			getActualType = embind__requireFunction(
				getActualTypeSignature,
				getActualType,
			);
			if (upcast) {
				upcast = embind__requireFunction(upcastSignature, upcast);
			}
			if (downcast) {
				downcast = embind__requireFunction(downcastSignature, downcast);
			}
			rawDestructor = embind__requireFunction(
				destructorSignature,
				rawDestructor,
			);
			var legalFunctionName = makeLegalFunctionName(name);
			exposePublicSymbol(legalFunctionName, function () {
				throwUnboundTypeError(
					"Cannot construct " + name + " due to unbound types",
					[baseClassRawType],
				);
			});
			whenDependentTypesAreResolved(
				[rawType, rawPointerType, rawConstPointerType],
				baseClassRawType ? [baseClassRawType] : [],
				function (base) {
					base = base[0];
					var baseClass;
					var basePrototype;
					if (baseClassRawType) {
						baseClass = base.registeredClass;
						basePrototype = baseClass.instancePrototype;
					} else {
						basePrototype = ClassHandle.prototype;
					}
					var constructor = createNamedFunction(
						legalFunctionName,
						function () {
							if (
								Object.getPrototypeOf(this) !==
								instancePrototype
							) {
								throw new BindingError(
									"Use 'new' to construct " + name,
								);
							}
							if (
								undefined === registeredClass.constructor_body
							) {
								throw new BindingError(
									name + " has no accessible constructor",
								);
							}
							var body =
								registeredClass.constructor_body[
									arguments.length
								];
							if (undefined === body) {
								throw new BindingError(
									"Tried to invoke ctor of " +
										name +
										" with invalid number of parameters (" +
										arguments.length +
										") - expected (" +
										Object.keys(
											registeredClass.constructor_body,
										).toString() +
										") parameters instead!",
								);
							}
							return body.apply(this, arguments);
						},
					);
					var instancePrototype = Object.create(basePrototype, {
						constructor: { value: constructor },
					});
					constructor.prototype = instancePrototype;
					var registeredClass = new RegisteredClass(
						name,
						constructor,
						instancePrototype,
						rawDestructor,
						baseClass,
						getActualType,
						upcast,
						downcast,
					);
					var referenceConverter = new RegisteredPointer(
						name,
						registeredClass,
						true,
						false,
						false,
					);
					var pointerConverter = new RegisteredPointer(
						name + "*",
						registeredClass,
						false,
						false,
						false,
					);
					var constPointerConverter = new RegisteredPointer(
						name + " const*",
						registeredClass,
						false,
						true,
						false,
					);
					registeredPointers[rawType] = {
						pointerType: pointerConverter,
						constPointerType: constPointerConverter,
					};
					replacePublicSymbol(legalFunctionName, constructor);
					return [
						referenceConverter,
						pointerConverter,
						constPointerConverter,
					];
				},
			);
		}
		function new_(constructor, argumentList) {
			if (!(constructor instanceof Function)) {
				throw new TypeError(
					"new_ called with constructor type " +
						typeof constructor +
						" which is not a function",
				);
			}
			var dummy = createNamedFunction(
				constructor.name || "unknownFunctionName",
				function () {},
			);
			dummy.prototype = constructor.prototype;
			var obj = new dummy();
			var r = constructor.apply(obj, argumentList);
			return r instanceof Object ? r : obj;
		}
		function craftInvokerFunction(
			humanName,
			argTypes,
			classType,
			cppInvokerFunc,
			cppTargetFunc,
		) {
			var argCount = argTypes.length;
			if (argCount < 2) {
				throwBindingError(
					"argTypes array size mismatch! Must at least get return value and 'this' types!",
				);
			}
			var isClassMethodFunc = argTypes[1] !== null && classType !== null;
			var needsDestructorStack = false;
			for (var i = 1; i < argTypes.length; ++i) {
				if (
					argTypes[i] !== null &&
					argTypes[i].destructorFunction === undefined
				) {
					needsDestructorStack = true;
					break;
				}
			}
			var returns = argTypes[0].name !== "void";
			var argsList = "";
			var argsListWired = "";
			for (var i = 0; i < argCount - 2; ++i) {
				argsList += (i !== 0 ? ", " : "") + "arg" + i;
				argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
			}
			var invokerFnBody =
				"return function " +
				makeLegalFunctionName(humanName) +
				"(" +
				argsList +
				") {\n" +
				"if (arguments.length !== " +
				(argCount - 2) +
				") {\n" +
				"throwBindingError('function " +
				humanName +
				" called with ' + arguments.length + ' arguments, expected " +
				(argCount - 2) +
				" args!');\n" +
				"}\n";
			if (needsDestructorStack) {
				invokerFnBody += "var destructors = [];\n";
			}
			var dtorStack = needsDestructorStack ? "destructors" : "null";
			var args1 = [
				"throwBindingError",
				"invoker",
				"fn",
				"runDestructors",
				"retType",
				"classParam",
			];
			var args2 = [
				throwBindingError,
				cppInvokerFunc,
				cppTargetFunc,
				runDestructors,
				argTypes[0],
				argTypes[1],
			];
			if (isClassMethodFunc) {
				invokerFnBody +=
					"var thisWired = classParam.toWireType(" +
					dtorStack +
					", this);\n";
			}
			for (var i = 0; i < argCount - 2; ++i) {
				invokerFnBody +=
					"var arg" +
					i +
					"Wired = argType" +
					i +
					".toWireType(" +
					dtorStack +
					", arg" +
					i +
					"); // " +
					argTypes[i + 2].name +
					"\n";
				args1.push("argType" + i);
				args2.push(argTypes[i + 2]);
			}
			if (isClassMethodFunc) {
				argsListWired =
					"thisWired" +
					(argsListWired.length > 0 ? ", " : "") +
					argsListWired;
			}
			invokerFnBody +=
				(returns ? "var rv = " : "") +
				"invoker(fn" +
				(argsListWired.length > 0 ? ", " : "") +
				argsListWired +
				");\n";
			if (needsDestructorStack) {
				invokerFnBody += "runDestructors(destructors);\n";
			} else {
				for (
					var i = isClassMethodFunc ? 1 : 2;
					i < argTypes.length;
					++i
				) {
					var paramName =
						i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
					if (argTypes[i].destructorFunction !== null) {
						invokerFnBody +=
							paramName +
							"_dtor(" +
							paramName +
							"); // " +
							argTypes[i].name +
							"\n";
						args1.push(paramName + "_dtor");
						args2.push(argTypes[i].destructorFunction);
					}
				}
			}
			if (returns) {
				invokerFnBody +=
					"var ret = retType.fromWireType(rv);\n" + "return ret;\n";
			} else {
			}
			invokerFnBody += "}\n";
			args1.push(invokerFnBody);
			var invokerFunction = new_(Function, args1).apply(null, args2);
			return invokerFunction;
		}
		function heap32VectorToArray(count, firstElement) {
			var array = [];
			for (var i = 0; i < count; i++) {
				array.push(HEAPU32[(firstElement + i * 4) >> 2]);
			}
			return array;
		}
		function __embind_register_class_class_function(
			rawClassType,
			methodName,
			argCount,
			rawArgTypesAddr,
			invokerSignature,
			rawInvoker,
			fn,
		) {
			var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
			methodName = readLatin1String(methodName);
			rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
			whenDependentTypesAreResolved(
				[],
				[rawClassType],
				function (classType) {
					classType = classType[0];
					var humanName = classType.name + "." + methodName;
					function unboundTypesHandler() {
						throwUnboundTypeError(
							"Cannot call " +
								humanName +
								" due to unbound types",
							rawArgTypes,
						);
					}
					if (methodName.startsWith("@@")) {
						methodName = Symbol[methodName.substring(2)];
					}
					var proto = classType.registeredClass.constructor;
					if (undefined === proto[methodName]) {
						unboundTypesHandler.argCount = argCount - 1;
						proto[methodName] = unboundTypesHandler;
					} else {
						ensureOverloadTable(proto, methodName, humanName);
						proto[methodName].overloadTable[argCount - 1] =
							unboundTypesHandler;
					}
					whenDependentTypesAreResolved(
						[],
						rawArgTypes,
						function (argTypes) {
							var invokerArgsArray = [argTypes[0], null].concat(
								argTypes.slice(1),
							);
							var func = craftInvokerFunction(
								humanName,
								invokerArgsArray,
								null,
								rawInvoker,
								fn,
							);
							if (undefined === proto[methodName].overloadTable) {
								func.argCount = argCount - 1;
								proto[methodName] = func;
							} else {
								proto[methodName].overloadTable[argCount - 1] =
									func;
							}
							return [];
						},
					);
					return [];
				},
			);
		}
		function __embind_register_class_constructor(
			rawClassType,
			argCount,
			rawArgTypesAddr,
			invokerSignature,
			invoker,
			rawConstructor,
		) {
			assert(argCount > 0);
			var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
			invoker = embind__requireFunction(invokerSignature, invoker);
			whenDependentTypesAreResolved(
				[],
				[rawClassType],
				function (classType) {
					classType = classType[0];
					var humanName = "constructor " + classType.name;
					if (
						undefined === classType.registeredClass.constructor_body
					) {
						classType.registeredClass.constructor_body = [];
					}
					if (
						undefined !==
						classType.registeredClass.constructor_body[argCount - 1]
					) {
						throw new BindingError(
							"Cannot register multiple constructors with identical number of parameters (" +
								(argCount - 1) +
								") for class '" +
								classType.name +
								"'! Overload resolution is currently only performed using the parameter count, not actual type info!",
						);
					}
					classType.registeredClass.constructor_body[argCount - 1] =
						() => {
							throwUnboundTypeError(
								"Cannot construct " +
									classType.name +
									" due to unbound types",
								rawArgTypes,
							);
						};
					whenDependentTypesAreResolved(
						[],
						rawArgTypes,
						function (argTypes) {
							argTypes.splice(1, 0, null);
							classType.registeredClass.constructor_body[
								argCount - 1
							] = craftInvokerFunction(
								humanName,
								argTypes,
								null,
								invoker,
								rawConstructor,
							);
							return [];
						},
					);
					return [];
				},
			);
		}
		function __embind_register_class_function(
			rawClassType,
			methodName,
			argCount,
			rawArgTypesAddr,
			invokerSignature,
			rawInvoker,
			context,
			isPureVirtual,
		) {
			var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
			methodName = readLatin1String(methodName);
			rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
			whenDependentTypesAreResolved(
				[],
				[rawClassType],
				function (classType) {
					classType = classType[0];
					var humanName = classType.name + "." + methodName;
					if (methodName.startsWith("@@")) {
						methodName = Symbol[methodName.substring(2)];
					}
					if (isPureVirtual) {
						classType.registeredClass.pureVirtualFunctions.push(
							methodName,
						);
					}
					function unboundTypesHandler() {
						throwUnboundTypeError(
							"Cannot call " +
								humanName +
								" due to unbound types",
							rawArgTypes,
						);
					}
					var proto = classType.registeredClass.instancePrototype;
					var method = proto[methodName];
					if (
						undefined === method ||
						(undefined === method.overloadTable &&
							method.className !== classType.name &&
							method.argCount === argCount - 2)
					) {
						unboundTypesHandler.argCount = argCount - 2;
						unboundTypesHandler.className = classType.name;
						proto[methodName] = unboundTypesHandler;
					} else {
						ensureOverloadTable(proto, methodName, humanName);
						proto[methodName].overloadTable[argCount - 2] =
							unboundTypesHandler;
					}
					whenDependentTypesAreResolved(
						[],
						rawArgTypes,
						function (argTypes) {
							var memberFunction = craftInvokerFunction(
								humanName,
								argTypes,
								classType,
								rawInvoker,
								context,
							);
							if (undefined === proto[methodName].overloadTable) {
								memberFunction.argCount = argCount - 2;
								proto[methodName] = memberFunction;
							} else {
								proto[methodName].overloadTable[argCount - 2] =
									memberFunction;
							}
							return [];
						},
					);
					return [];
				},
			);
		}
		function validateThis(this_, classType, humanName) {
			if (!(this_ instanceof Object)) {
				throwBindingError(humanName + ' with invalid "this": ' + this_);
			}
			if (!(this_ instanceof classType.registeredClass.constructor)) {
				throwBindingError(
					humanName +
						' incompatible with "this" of type ' +
						this_.constructor.name,
				);
			}
			if (!this_.$$.ptr) {
				throwBindingError(
					"cannot call emscripten binding method " +
						humanName +
						" on deleted object",
				);
			}
			return upcastPointer(
				this_.$$.ptr,
				this_.$$.ptrType.registeredClass,
				classType.registeredClass,
			);
		}
		function __embind_register_class_property(
			classType,
			fieldName,
			getterReturnType,
			getterSignature,
			getter,
			getterContext,
			setterArgumentType,
			setterSignature,
			setter,
			setterContext,
		) {
			fieldName = readLatin1String(fieldName);
			getter = embind__requireFunction(getterSignature, getter);
			whenDependentTypesAreResolved(
				[],
				[classType],
				function (classType) {
					classType = classType[0];
					var humanName = classType.name + "." + fieldName;
					var desc = {
						get: function () {
							throwUnboundTypeError(
								"Cannot access " +
									humanName +
									" due to unbound types",
								[getterReturnType, setterArgumentType],
							);
						},
						enumerable: true,
						configurable: true,
					};
					if (setter) {
						desc.set = () => {
							throwUnboundTypeError(
								"Cannot access " +
									humanName +
									" due to unbound types",
								[getterReturnType, setterArgumentType],
							);
						};
					} else {
						desc.set = (v) => {
							throwBindingError(
								humanName + " is a read-only property",
							);
						};
					}
					Object.defineProperty(
						classType.registeredClass.instancePrototype,
						fieldName,
						desc,
					);
					whenDependentTypesAreResolved(
						[],
						setter
							? [getterReturnType, setterArgumentType]
							: [getterReturnType],
						function (types) {
							var getterReturnType = types[0];
							var desc = {
								get: function () {
									var ptr = validateThis(
										this,
										classType,
										humanName + " getter",
									);
									return getterReturnType["fromWireType"](
										getter(getterContext, ptr),
									);
								},
								enumerable: true,
							};
							if (setter) {
								setter = embind__requireFunction(
									setterSignature,
									setter,
								);
								var setterArgumentType = types[1];
								desc.set = function (v) {
									var ptr = validateThis(
										this,
										classType,
										humanName + " setter",
									);
									var destructors = [];
									setter(
										setterContext,
										ptr,
										setterArgumentType["toWireType"](
											destructors,
											v,
										),
									);
									runDestructors(destructors);
								};
							}
							Object.defineProperty(
								classType.registeredClass.instancePrototype,
								fieldName,
								desc,
							);
							return [];
						},
					);
					return [];
				},
			);
		}
		var emval_free_list = [];
		var emval_handle_array = [
			{},
			{ value: undefined },
			{ value: null },
			{ value: true },
			{ value: false },
		];
		function __emval_decref(handle) {
			if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
				emval_handle_array[handle] = undefined;
				emval_free_list.push(handle);
			}
		}
		function count_emval_handles() {
			var count = 0;
			for (var i = 5; i < emval_handle_array.length; ++i) {
				if (emval_handle_array[i] !== undefined) {
					++count;
				}
			}
			return count;
		}
		function get_first_emval() {
			for (var i = 5; i < emval_handle_array.length; ++i) {
				if (emval_handle_array[i] !== undefined) {
					return emval_handle_array[i];
				}
			}
			return null;
		}
		function init_emval() {
			Module["count_emval_handles"] = count_emval_handles;
			Module["get_first_emval"] = get_first_emval;
		}
		var Emval = {
			toValue: (handle) => {
				if (!handle) {
					throwBindingError(
						"Cannot use deleted val. handle = " + handle,
					);
				}
				return emval_handle_array[handle].value;
			},
			toHandle: (value) => {
				switch (value) {
					case undefined:
						return 1;
					case null:
						return 2;
					case true:
						return 3;
					case false:
						return 4;
					default: {
						var handle = emval_free_list.length
							? emval_free_list.pop()
							: emval_handle_array.length;
						emval_handle_array[handle] = {
							refcount: 1,
							value: value,
						};
						return handle;
					}
				}
			},
		};
		function __embind_register_emval(rawType, name) {
			name = readLatin1String(name);
			registerType(rawType, {
				name: name,
				fromWireType: function (handle) {
					var rv = Emval.toValue(handle);
					__emval_decref(handle);
					return rv;
				},
				toWireType: function (destructors, value) {
					return Emval.toHandle(value);
				},
				argPackAdvance: 8,
				readValueFromPointer: simpleReadValueFromPointer,
				destructorFunction: null,
			});
		}
		function embindRepr(v) {
			if (v === null) {
				return "null";
			}
			var t = typeof v;
			if (t === "object" || t === "array" || t === "function") {
				return v.toString();
			} else {
				return "" + v;
			}
		}
		function floatReadValueFromPointer(name, shift) {
			switch (shift) {
				case 2:
					return function (pointer) {
						return this["fromWireType"](HEAPF32[pointer >> 2]);
					};
				case 3:
					return function (pointer) {
						return this["fromWireType"](HEAPF64[pointer >> 3]);
					};
				default:
					throw new TypeError("Unknown float type: " + name);
			}
		}
		function __embind_register_float(rawType, name, size) {
			var shift = getShiftFromSize(size);
			name = readLatin1String(name);
			registerType(rawType, {
				name: name,
				fromWireType: function (value) {
					return value;
				},
				toWireType: function (destructors, value) {
					if (typeof value != "number" && typeof value != "boolean") {
						throw new TypeError(
							'Cannot convert "' +
								embindRepr(value) +
								'" to ' +
								this.name,
						);
					}
					return value;
				},
				argPackAdvance: 8,
				readValueFromPointer: floatReadValueFromPointer(name, shift),
				destructorFunction: null,
			});
		}
		function integerReadValueFromPointer(name, shift, signed) {
			switch (shift) {
				case 0:
					return signed
						? function readS8FromPointer(pointer) {
								return HEAP8[pointer];
							}
						: function readU8FromPointer(pointer) {
								return HEAPU8[pointer];
							};
				case 1:
					return signed
						? function readS16FromPointer(pointer) {
								return HEAP16[pointer >> 1];
							}
						: function readU16FromPointer(pointer) {
								return HEAPU16[pointer >> 1];
							};
				case 2:
					return signed
						? function readS32FromPointer(pointer) {
								return HEAP32[pointer >> 2];
							}
						: function readU32FromPointer(pointer) {
								return HEAPU32[pointer >> 2];
							};
				default:
					throw new TypeError("Unknown integer type: " + name);
			}
		}
		function __embind_register_integer(
			primitiveType,
			name,
			size,
			minRange,
			maxRange,
		) {
			name = readLatin1String(name);
			if (maxRange === -1) {
				maxRange = 4294967295;
			}
			var shift = getShiftFromSize(size);
			var fromWireType = (value) => value;
			if (minRange === 0) {
				var bitshift = 32 - 8 * size;
				fromWireType = (value) => (value << bitshift) >>> bitshift;
			}
			var isUnsignedType = name.includes("unsigned");
			var checkAssertions = (value, toTypeName) => {
				if (typeof value != "number" && typeof value != "boolean") {
					throw new TypeError(
						'Cannot convert "' +
							embindRepr(value) +
							'" to ' +
							toTypeName,
					);
				}
				if (value < minRange || value > maxRange) {
					throw new TypeError(
						'Passing a number "' +
							embindRepr(value) +
							'" from JS side to C/C++ side to an argument of type "' +
							name +
							'", which is outside the valid range [' +
							minRange +
							", " +
							maxRange +
							"]!",
					);
				}
			};
			var toWireType;
			if (isUnsignedType) {
				toWireType = function (destructors, value) {
					checkAssertions(value, this.name);
					return value >>> 0;
				};
			} else {
				toWireType = function (destructors, value) {
					checkAssertions(value, this.name);
					return value;
				};
			}
			registerType(primitiveType, {
				name: name,
				fromWireType: fromWireType,
				toWireType: toWireType,
				argPackAdvance: 8,
				readValueFromPointer: integerReadValueFromPointer(
					name,
					shift,
					minRange !== 0,
				),
				destructorFunction: null,
			});
		}
		function __embind_register_memory_view(rawType, dataTypeIndex, name) {
			var typeMapping = [
				Int8Array,
				Uint8Array,
				Int16Array,
				Uint16Array,
				Int32Array,
				Uint32Array,
				Float32Array,
				Float64Array,
			];
			var TA = typeMapping[dataTypeIndex];
			function decodeMemoryView(handle) {
				handle = handle >> 2;
				var heap = HEAPU32;
				var size = heap[handle];
				var data = heap[handle + 1];
				return new TA(buffer, data, size);
			}
			name = readLatin1String(name);
			registerType(
				rawType,
				{
					name: name,
					fromWireType: decodeMemoryView,
					argPackAdvance: 8,
					readValueFromPointer: decodeMemoryView,
				},
				{ ignoreDuplicateRegistrations: true },
			);
		}
		function __embind_register_std_string(rawType, name) {
			name = readLatin1String(name);
			var stdStringIsUTF8 = name === "std::string";
			registerType(rawType, {
				name: name,
				fromWireType: function (value) {
					var length = HEAPU32[value >> 2];
					var payload = value + 4;
					var str;
					if (stdStringIsUTF8) {
						var decodeStartPtr = payload;
						for (var i = 0; i <= length; ++i) {
							var currentBytePtr = payload + i;
							if (i == length || HEAPU8[currentBytePtr] == 0) {
								var maxRead = currentBytePtr - decodeStartPtr;
								var stringSegment = UTF8ToString(
									decodeStartPtr,
									maxRead,
								);
								if (str === undefined) {
									str = stringSegment;
								} else {
									str += String.fromCharCode(0);
									str += stringSegment;
								}
								decodeStartPtr = currentBytePtr + 1;
							}
						}
					} else {
						var a = new Array(length);
						for (var i = 0; i < length; ++i) {
							a[i] = String.fromCharCode(HEAPU8[payload + i]);
						}
						str = a.join("");
					}
					_free(value);
					return str;
				},
				toWireType: function (destructors, value) {
					if (value instanceof ArrayBuffer) {
						value = new Uint8Array(value);
					}
					var length;
					var valueIsOfTypeString = typeof value == "string";
					if (
						!(
							valueIsOfTypeString ||
							value instanceof Uint8Array ||
							value instanceof Uint8ClampedArray ||
							value instanceof Int8Array
						)
					) {
						throwBindingError(
							"Cannot pass non-string to std::string",
						);
					}
					if (stdStringIsUTF8 && valueIsOfTypeString) {
						length = lengthBytesUTF8(value);
					} else {
						length = value.length;
					}
					var base = _malloc(4 + length + 1);
					var ptr = base + 4;
					HEAPU32[base >> 2] = length;
					if (stdStringIsUTF8 && valueIsOfTypeString) {
						stringToUTF8(value, ptr, length + 1);
					} else {
						if (valueIsOfTypeString) {
							for (var i = 0; i < length; ++i) {
								var charCode = value.charCodeAt(i);
								if (charCode > 255) {
									_free(ptr);
									throwBindingError(
										"String has UTF-16 code units that do not fit in 8 bits",
									);
								}
								HEAPU8[ptr + i] = charCode;
							}
						} else {
							for (var i = 0; i < length; ++i) {
								HEAPU8[ptr + i] = value[i];
							}
						}
					}
					if (destructors !== null) {
						destructors.push(_free, base);
					}
					return base;
				},
				argPackAdvance: 8,
				readValueFromPointer: simpleReadValueFromPointer,
				destructorFunction: function (ptr) {
					_free(ptr);
				},
			});
		}
		var UTF16Decoder =
			typeof TextDecoder != "undefined"
				? new TextDecoder("utf-16le")
				: undefined;
		function UTF16ToString(ptr, maxBytesToRead) {
			assert(
				ptr % 2 == 0,
				"Pointer passed to UTF16ToString must be aligned to two bytes!",
			);
			var endPtr = ptr;
			var idx = endPtr >> 1;
			var maxIdx = idx + maxBytesToRead / 2;
			while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
			endPtr = idx << 1;
			if (endPtr - ptr > 32 && UTF16Decoder)
				return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
			var str = "";
			for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
				var codeUnit = HEAP16[(ptr + i * 2) >> 1];
				if (codeUnit == 0) break;
				str += String.fromCharCode(codeUnit);
			}
			return str;
		}
		function stringToUTF16(str, outPtr, maxBytesToWrite) {
			assert(
				outPtr % 2 == 0,
				"Pointer passed to stringToUTF16 must be aligned to two bytes!",
			);
			assert(
				typeof maxBytesToWrite == "number",
				"stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!",
			);
			if (maxBytesToWrite === undefined) {
				maxBytesToWrite = 2147483647;
			}
			if (maxBytesToWrite < 2) return 0;
			maxBytesToWrite -= 2;
			var startPtr = outPtr;
			var numCharsToWrite =
				maxBytesToWrite < str.length * 2
					? maxBytesToWrite / 2
					: str.length;
			for (var i = 0; i < numCharsToWrite; ++i) {
				var codeUnit = str.charCodeAt(i);
				HEAP16[outPtr >> 1] = codeUnit;
				outPtr += 2;
			}
			HEAP16[outPtr >> 1] = 0;
			return outPtr - startPtr;
		}
		function lengthBytesUTF16(str) {
			return str.length * 2;
		}
		function UTF32ToString(ptr, maxBytesToRead) {
			assert(
				ptr % 4 == 0,
				"Pointer passed to UTF32ToString must be aligned to four bytes!",
			);
			var i = 0;
			var str = "";
			while (!(i >= maxBytesToRead / 4)) {
				var utf32 = HEAP32[(ptr + i * 4) >> 2];
				if (utf32 == 0) break;
				++i;
				if (utf32 >= 65536) {
					var ch = utf32 - 65536;
					str += String.fromCharCode(
						55296 | (ch >> 10),
						56320 | (ch & 1023),
					);
				} else {
					str += String.fromCharCode(utf32);
				}
			}
			return str;
		}
		function stringToUTF32(str, outPtr, maxBytesToWrite) {
			assert(
				outPtr % 4 == 0,
				"Pointer passed to stringToUTF32 must be aligned to four bytes!",
			);
			assert(
				typeof maxBytesToWrite == "number",
				"stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!",
			);
			if (maxBytesToWrite === undefined) {
				maxBytesToWrite = 2147483647;
			}
			if (maxBytesToWrite < 4) return 0;
			var startPtr = outPtr;
			var endPtr = startPtr + maxBytesToWrite - 4;
			for (var i = 0; i < str.length; ++i) {
				var codeUnit = str.charCodeAt(i);
				if (codeUnit >= 55296 && codeUnit <= 57343) {
					var trailSurrogate = str.charCodeAt(++i);
					codeUnit =
						(65536 + ((codeUnit & 1023) << 10)) |
						(trailSurrogate & 1023);
				}
				HEAP32[outPtr >> 2] = codeUnit;
				outPtr += 4;
				if (outPtr + 4 > endPtr) break;
			}
			HEAP32[outPtr >> 2] = 0;
			return outPtr - startPtr;
		}
		function lengthBytesUTF32(str) {
			var len = 0;
			for (var i = 0; i < str.length; ++i) {
				var codeUnit = str.charCodeAt(i);
				if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
				len += 4;
			}
			return len;
		}
		function __embind_register_std_wstring(rawType, charSize, name) {
			name = readLatin1String(name);
			var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
			if (charSize === 2) {
				decodeString = UTF16ToString;
				encodeString = stringToUTF16;
				lengthBytesUTF = lengthBytesUTF16;
				getHeap = () => HEAPU16;
				shift = 1;
			} else if (charSize === 4) {
				decodeString = UTF32ToString;
				encodeString = stringToUTF32;
				lengthBytesUTF = lengthBytesUTF32;
				getHeap = () => HEAPU32;
				shift = 2;
			}
			registerType(rawType, {
				name: name,
				fromWireType: function (value) {
					var length = HEAPU32[value >> 2];
					var HEAP = getHeap();
					var str;
					var decodeStartPtr = value + 4;
					for (var i = 0; i <= length; ++i) {
						var currentBytePtr = value + 4 + i * charSize;
						if (i == length || HEAP[currentBytePtr >> shift] == 0) {
							var maxReadBytes = currentBytePtr - decodeStartPtr;
							var stringSegment = decodeString(
								decodeStartPtr,
								maxReadBytes,
							);
							if (str === undefined) {
								str = stringSegment;
							} else {
								str += String.fromCharCode(0);
								str += stringSegment;
							}
							decodeStartPtr = currentBytePtr + charSize;
						}
					}
					_free(value);
					return str;
				},
				toWireType: function (destructors, value) {
					if (!(typeof value == "string")) {
						throwBindingError(
							"Cannot pass non-string to C++ string type " + name,
						);
					}
					var length = lengthBytesUTF(value);
					var ptr = _malloc(4 + length + charSize);
					HEAPU32[ptr >> 2] = length >> shift;
					encodeString(value, ptr + 4, length + charSize);
					if (destructors !== null) {
						destructors.push(_free, ptr);
					}
					return ptr;
				},
				argPackAdvance: 8,
				readValueFromPointer: simpleReadValueFromPointer,
				destructorFunction: function (ptr) {
					_free(ptr);
				},
			});
		}
		function __embind_register_value_object(
			rawType,
			name,
			constructorSignature,
			rawConstructor,
			destructorSignature,
			rawDestructor,
		) {
			structRegistrations[rawType] = {
				name: readLatin1String(name),
				rawConstructor: embind__requireFunction(
					constructorSignature,
					rawConstructor,
				),
				rawDestructor: embind__requireFunction(
					destructorSignature,
					rawDestructor,
				),
				fields: [],
			};
		}
		function __embind_register_value_object_field(
			structType,
			fieldName,
			getterReturnType,
			getterSignature,
			getter,
			getterContext,
			setterArgumentType,
			setterSignature,
			setter,
			setterContext,
		) {
			structRegistrations[structType].fields.push({
				fieldName: readLatin1String(fieldName),
				getterReturnType: getterReturnType,
				getter: embind__requireFunction(getterSignature, getter),
				getterContext: getterContext,
				setterArgumentType: setterArgumentType,
				setter: embind__requireFunction(setterSignature, setter),
				setterContext: setterContext,
			});
		}
		function __embind_register_void(rawType, name) {
			name = readLatin1String(name);
			registerType(rawType, {
				isVoid: true,
				name: name,
				argPackAdvance: 0,
				fromWireType: function () {
					return undefined;
				},
				toWireType: function (destructors, o) {
					return undefined;
				},
			});
		}
		var nowIsMonotonic = true;
		function __emscripten_get_now_is_monotonic() {
			return nowIsMonotonic;
		}
		function requireRegisteredType(rawType, humanName) {
			var impl = registeredTypes[rawType];
			if (undefined === impl) {
				throwBindingError(
					humanName + " has unknown type " + getTypeName(rawType),
				);
			}
			return impl;
		}
		function __emval_as(handle, returnType, destructorsRef) {
			handle = Emval.toValue(handle);
			returnType = requireRegisteredType(returnType, "emval::as");
			var destructors = [];
			var rd = Emval.toHandle(destructors);
			HEAPU32[destructorsRef >> 2] = rd;
			return returnType["toWireType"](destructors, handle);
		}
		function emval_allocateDestructors(destructorsRef) {
			var destructors = [];
			HEAPU32[destructorsRef >> 2] = Emval.toHandle(destructors);
			return destructors;
		}
		var emval_symbols = {};
		function getStringOrSymbol(address) {
			var symbol = emval_symbols[address];
			if (symbol === undefined) {
				return readLatin1String(address);
			}
			return symbol;
		}
		var emval_methodCallers = [];
		function __emval_call_method(
			caller,
			handle,
			methodName,
			destructorsRef,
			args,
		) {
			caller = emval_methodCallers[caller];
			handle = Emval.toValue(handle);
			methodName = getStringOrSymbol(methodName);
			return caller(
				handle,
				methodName,
				emval_allocateDestructors(destructorsRef),
				args,
			);
		}
		function __emval_call_void_method(caller, handle, methodName, args) {
			caller = emval_methodCallers[caller];
			handle = Emval.toValue(handle);
			methodName = getStringOrSymbol(methodName);
			caller(handle, methodName, null, args);
		}
		function emval_get_global() {
			if (typeof globalThis == "object") {
				return globalThis;
			}
			return (function () {
				return Function;
			})()("return this")();
		}
		function __emval_get_global(name) {
			if (name === 0) {
				return Emval.toHandle(emval_get_global());
			} else {
				name = getStringOrSymbol(name);
				return Emval.toHandle(emval_get_global()[name]);
			}
		}
		function emval_addMethodCaller(caller) {
			var id = emval_methodCallers.length;
			emval_methodCallers.push(caller);
			return id;
		}
		function emval_lookupTypes(argCount, argTypes) {
			var a = new Array(argCount);
			for (var i = 0; i < argCount; ++i) {
				a[i] = requireRegisteredType(
					HEAPU32[(argTypes + i * POINTER_SIZE) >> 2],
					"parameter " + i,
				);
			}
			return a;
		}
		var emval_registeredMethods = [];
		function __emval_get_method_caller(argCount, argTypes) {
			var types = emval_lookupTypes(argCount, argTypes);
			var retType = types[0];
			var signatureName =
				retType.name +
				"_$" +
				types
					.slice(1)
					.map(function (t) {
						return t.name;
					})
					.join("_") +
				"$";
			var returnId = emval_registeredMethods[signatureName];
			if (returnId !== undefined) {
				return returnId;
			}
			var params = ["retType"];
			var args = [retType];
			var argsList = "";
			for (var i = 0; i < argCount - 1; ++i) {
				argsList += (i !== 0 ? ", " : "") + "arg" + i;
				params.push("argType" + i);
				args.push(types[1 + i]);
			}
			var functionName = makeLegalFunctionName(
				"methodCaller_" + signatureName,
			);
			var functionBody =
				"return function " +
				functionName +
				"(handle, name, destructors, args) {\n";
			var offset = 0;
			for (var i = 0; i < argCount - 1; ++i) {
				functionBody +=
					"    var arg" +
					i +
					" = argType" +
					i +
					".readValueFromPointer(args" +
					(offset ? "+" + offset : "") +
					");\n";
				offset += types[i + 1]["argPackAdvance"];
			}
			functionBody += "    var rv = handle[name](" + argsList + ");\n";
			for (var i = 0; i < argCount - 1; ++i) {
				if (types[i + 1]["deleteObject"]) {
					functionBody +=
						"    argType" + i + ".deleteObject(arg" + i + ");\n";
				}
			}
			if (!retType.isVoid) {
				functionBody +=
					"    return retType.toWireType(destructors, rv);\n";
			}
			functionBody += "};\n";
			params.push(functionBody);
			var invokerFunction = new_(Function, params).apply(null, args);
			returnId = emval_addMethodCaller(invokerFunction);
			emval_registeredMethods[signatureName] = returnId;
			return returnId;
		}
		function __emval_get_property(handle, key) {
			handle = Emval.toValue(handle);
			key = Emval.toValue(key);
			return Emval.toHandle(handle[key]);
		}
		function __emval_incref(handle) {
			if (handle > 4) {
				emval_handle_array[handle].refcount += 1;
			}
		}
		function craftEmvalAllocator(argCount) {
			var argsList = "";
			for (var i = 0; i < argCount; ++i) {
				argsList += (i !== 0 ? ", " : "") + "arg" + i;
			}
			var getMemory = () => HEAPU32;
			var functionBody =
				"return function emval_allocator_" +
				argCount +
				"(constructor, argTypes, args) {\n" +
				"  var HEAPU32 = getMemory();\n";
			for (var i = 0; i < argCount; ++i) {
				functionBody +=
					"var argType" +
					i +
					" = requireRegisteredType(HEAPU32[((argTypes)>>2)], 'parameter " +
					i +
					"');\n" +
					"var arg" +
					i +
					" = argType" +
					i +
					".readValueFromPointer(args);\n" +
					"args += argType" +
					i +
					"['argPackAdvance'];\n" +
					"argTypes += 4;\n";
			}
			functionBody +=
				"var obj = new constructor(" +
				argsList +
				");\n" +
				"return valueToHandle(obj);\n" +
				"}\n";
			return new Function(
				"requireRegisteredType",
				"Module",
				"valueToHandle",
				"getMemory",
				functionBody,
			)(requireRegisteredType, Module, Emval.toHandle, getMemory);
		}
		var emval_newers = {};
		function __emval_new(handle, argCount, argTypes, args) {
			handle = Emval.toValue(handle);
			var newer = emval_newers[argCount];
			if (!newer) {
				newer = craftEmvalAllocator(argCount);
				emval_newers[argCount] = newer;
			}
			return newer(handle, argTypes, args);
		}
		function __emval_new_array() {
			return Emval.toHandle([]);
		}
		function __emval_new_array_from_memory_view(view) {
			view = Emval.toValue(view);
			var a = new Array(view.length);
			for (var i = 0; i < view.length; i++) a[i] = view[i];
			return Emval.toHandle(a);
		}
		function __emval_new_cstring(v) {
			return Emval.toHandle(getStringOrSymbol(v));
		}
		function __emval_new_object() {
			return Emval.toHandle({});
		}
		function __emval_run_destructors(handle) {
			var destructors = Emval.toValue(handle);
			runDestructors(destructors);
			__emval_decref(handle);
		}
		function __emval_set_property(handle, key, value) {
			handle = Emval.toValue(handle);
			key = Emval.toValue(key);
			value = Emval.toValue(value);
			handle[key] = value;
		}
		function __emval_take_value(type, arg) {
			type = requireRegisteredType(type, "_emval_take_value");
			var v = type["readValueFromPointer"](arg);
			return Emval.toHandle(v);
		}
		var SYSCALLS = {
			varargs: undefined,
			get: function () {
				assert(SYSCALLS.varargs != undefined);
				SYSCALLS.varargs += 4;
				var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
				return ret;
			},
			getStr: function (ptr) {
				var ret = UTF8ToString(ptr);
				return ret;
			},
		};
		function __mmap_js(len, prot, flags, fd, off, allocated, addr) {
			return -52;
		}
		function __munmap_js(addr, len, prot, flags, fd, offset) {}
		function _abort() {
			abort("native code called abort()");
		}
		function _emscripten_date_now() {
			return Date.now();
		}
		function getHeapMax() {
			return 2147483648;
		}
		function _emscripten_get_heap_max() {
			return getHeapMax();
		}
		var _emscripten_get_now;
		if (ENVIRONMENT_IS_NODE) {
			_emscripten_get_now = () => {
				var t = process["hrtime"]();
				return t[0] * 1e3 + t[1] / 1e6;
			};
		} else _emscripten_get_now = () => performance.now();
		function _emscripten_memcpy_big(dest, src, num) {
			HEAPU8.copyWithin(dest, src, src + num);
		}
		function emscripten_realloc_buffer(size) {
			try {
				wasmMemory.grow((size - buffer.byteLength + 65535) >>> 16);
				updateGlobalBufferAndViews(wasmMemory.buffer);
				return 1;
			} catch (e) {
				err(
					"emscripten_realloc_buffer: Attempted to grow heap from " +
						buffer.byteLength +
						" bytes to " +
						size +
						" bytes, but got error: " +
						e,
				);
			}
		}
		function _emscripten_resize_heap(requestedSize) {
			var oldSize = HEAPU8.length;
			requestedSize = requestedSize >>> 0;
			assert(requestedSize > oldSize);
			var maxHeapSize = getHeapMax();
			if (requestedSize > maxHeapSize) {
				err(
					"Cannot enlarge memory, asked to go up to " +
						requestedSize +
						" bytes, but the limit is " +
						maxHeapSize +
						" bytes!",
				);
				return false;
			}
			let alignUp = (x, multiple) =>
				x + ((multiple - (x % multiple)) % multiple);
			for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
				var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
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
			err(
				"Failed to grow the heap from " +
					oldSize +
					" bytes to " +
					newSize +
					" bytes, not enough memory!",
			);
			return false;
		}
		var ENV = {};
		function getExecutableName() {
			return thisProgram || "./this.program";
		}
		function getEnvStrings() {
			if (!getEnvStrings.strings) {
				var lang =
					(
						(typeof navigator == "object" &&
							navigator.languages &&
							navigator.languages[0]) ||
						"C"
					).replace("-", "_") + ".UTF-8";
				var env = {
					USER: "web_user",
					LOGNAME: "web_user",
					PATH: "/",
					PWD: "/",
					HOME: "/home/web_user",
					LANG: lang,
					_: getExecutableName(),
				};
				for (var x in ENV) {
					if (ENV[x] === undefined) delete env[x];
					else env[x] = ENV[x];
				}
				var strings = [];
				for (var x in env) {
					strings.push(x + "=" + env[x]);
				}
				getEnvStrings.strings = strings;
			}
			return getEnvStrings.strings;
		}
		function writeAsciiToMemory(str, buffer, dontAddNull) {
			for (var i = 0; i < str.length; ++i) {
				assert(str.charCodeAt(i) === (str.charCodeAt(i) & 255));
				HEAP8[buffer++ >> 0] = str.charCodeAt(i);
			}
			if (!dontAddNull) HEAP8[buffer >> 0] = 0;
		}
		function _environ_get(__environ, environ_buf) {
			var bufSize = 0;
			getEnvStrings().forEach(function (string, i) {
				var ptr = environ_buf + bufSize;
				HEAPU32[(__environ + i * 4) >> 2] = ptr;
				writeAsciiToMemory(string, ptr);
				bufSize += string.length + 1;
			});
			return 0;
		}
		function _environ_sizes_get(penviron_count, penviron_buf_size) {
			var strings = getEnvStrings();
			HEAPU32[penviron_count >> 2] = strings.length;
			var bufSize = 0;
			strings.forEach(function (string) {
				bufSize += string.length + 1;
			});
			HEAPU32[penviron_buf_size >> 2] = bufSize;
			return 0;
		}
		function _proc_exit(code) {
			EXITSTATUS = code;
			if (!keepRuntimeAlive()) {
				if (Module["onExit"]) Module["onExit"](code);
				ABORT = true;
			}
			quit_(code, new ExitStatus(code));
		}
		function exitJS(status, implicit) {
			EXITSTATUS = status;
			checkUnflushedContent();
			if (keepRuntimeAlive() && !implicit) {
				var msg =
					"program exited (with status: " +
					status +
					"), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)";
				readyPromiseReject(msg);
				err(msg);
			}
			_proc_exit(status);
		}
		var _exit = exitJS;
		function _fd_close(fd) {
			abort("fd_close called without SYSCALLS_REQUIRE_FILESYSTEM");
		}
		function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
			return 70;
		}
		var printCharBuffers = [null, [], []];
		function printChar(stream, curr) {
			var buffer = printCharBuffers[stream];
			assert(buffer);
			if (curr === 0 || curr === 10) {
				(stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
				buffer.length = 0;
			} else {
				buffer.push(curr);
			}
		}
		function flush_NO_FILESYSTEM() {
			_fflush(0);
			if (printCharBuffers[1].length) printChar(1, 10);
			if (printCharBuffers[2].length) printChar(2, 10);
		}
		function _fd_write(fd, iov, iovcnt, pnum) {
			var num = 0;
			for (var i = 0; i < iovcnt; i++) {
				var ptr = HEAPU32[iov >> 2];
				var len = HEAPU32[(iov + 4) >> 2];
				iov += 8;
				for (var j = 0; j < len; j++) {
					printChar(fd, HEAPU8[ptr + j]);
				}
				num += len;
			}
			HEAPU32[pnum >> 2] = num;
			return 0;
		}
		function getRandomDevice() {
			if (
				typeof crypto == "object" &&
				typeof crypto["getRandomValues"] == "function"
			) {
				var randomBuffer = new Uint8Array(1);
				return () => {
					crypto.getRandomValues(randomBuffer);
					return randomBuffer[0];
				};
			} else if (ENVIRONMENT_IS_NODE) {
				try {
					var crypto_module = require("crypto");
					return () => crypto_module["randomBytes"](1)[0];
				} catch (e) {}
			}
			return () =>
				abort(
					"no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };",
				);
		}
		function _getentropy(buffer, size) {
			if (!_getentropy.randomDevice) {
				_getentropy.randomDevice = getRandomDevice();
			}
			for (var i = 0; i < size; i++) {
				HEAP8[(buffer + i) >> 0] = _getentropy.randomDevice();
			}
			return 0;
		}
		function __isLeapYear(year) {
			return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
		}
		function __arraySum(array, index) {
			var sum = 0;
			for (var i = 0; i <= index; sum += array[i++]) {}
			return sum;
		}
		var __MONTH_DAYS_LEAP = [
			31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
		];
		var __MONTH_DAYS_REGULAR = [
			31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
		];
		function __addDays(date, days) {
			var newDate = new Date(date.getTime());
			while (days > 0) {
				var leap = __isLeapYear(newDate.getFullYear());
				var currentMonth = newDate.getMonth();
				var daysInCurrentMonth = (
					leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR
				)[currentMonth];
				if (days > daysInCurrentMonth - newDate.getDate()) {
					days -= daysInCurrentMonth - newDate.getDate() + 1;
					newDate.setDate(1);
					if (currentMonth < 11) {
						newDate.setMonth(currentMonth + 1);
					} else {
						newDate.setMonth(0);
						newDate.setFullYear(newDate.getFullYear() + 1);
					}
				} else {
					newDate.setDate(newDate.getDate() + days);
					return newDate;
				}
			}
			return newDate;
		}
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
		function writeArrayToMemory(array, buffer) {
			assert(
				array.length >= 0,
				"writeArrayToMemory array must have a length (should be an array or typed array)",
			);
			HEAP8.set(array, buffer);
		}
		function _strftime(s, maxsize, format, tm) {
			var tm_zone = HEAP32[(tm + 40) >> 2];
			var date = {
				tm_sec: HEAP32[tm >> 2],
				tm_min: HEAP32[(tm + 4) >> 2],
				tm_hour: HEAP32[(tm + 8) >> 2],
				tm_mday: HEAP32[(tm + 12) >> 2],
				tm_mon: HEAP32[(tm + 16) >> 2],
				tm_year: HEAP32[(tm + 20) >> 2],
				tm_wday: HEAP32[(tm + 24) >> 2],
				tm_yday: HEAP32[(tm + 28) >> 2],
				tm_isdst: HEAP32[(tm + 32) >> 2],
				tm_gmtoff: HEAP32[(tm + 36) >> 2],
				tm_zone: tm_zone ? UTF8ToString(tm_zone) : "",
			};
			var pattern = UTF8ToString(format);
			var EXPANSION_RULES_1 = {
				"%c": "%a %b %d %H:%M:%S %Y",
				"%D": "%m/%d/%y",
				"%F": "%Y-%m-%d",
				"%h": "%b",
				"%r": "%I:%M:%S %p",
				"%R": "%H:%M",
				"%T": "%H:%M:%S",
				"%x": "%m/%d/%y",
				"%X": "%H:%M:%S",
				"%Ec": "%c",
				"%EC": "%C",
				"%Ex": "%m/%d/%y",
				"%EX": "%H:%M:%S",
				"%Ey": "%y",
				"%EY": "%Y",
				"%Od": "%d",
				"%Oe": "%e",
				"%OH": "%H",
				"%OI": "%I",
				"%Om": "%m",
				"%OM": "%M",
				"%OS": "%S",
				"%Ou": "%u",
				"%OU": "%U",
				"%OV": "%V",
				"%Ow": "%w",
				"%OW": "%W",
				"%Oy": "%y",
			};
			for (var rule in EXPANSION_RULES_1) {
				pattern = pattern.replace(
					new RegExp(rule, "g"),
					EXPANSION_RULES_1[rule],
				);
			}
			var WEEKDAYS = [
				"Sunday",
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday",
			];
			var MONTHS = [
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December",
			];
			function leadingSomething(value, digits, character) {
				var str =
					typeof value == "number" ? value.toString() : value || "";
				while (str.length < digits) {
					str = character[0] + str;
				}
				return str;
			}
			function leadingNulls(value, digits) {
				return leadingSomething(value, digits, "0");
			}
			function compareByDay(date1, date2) {
				function sgn(value) {
					return value < 0 ? -1 : value > 0 ? 1 : 0;
				}
				var compare;
				if (
					(compare = sgn(
						date1.getFullYear() - date2.getFullYear(),
					)) === 0
				) {
					if (
						(compare = sgn(date1.getMonth() - date2.getMonth())) ===
						0
					) {
						compare = sgn(date1.getDate() - date2.getDate());
					}
				}
				return compare;
			}
			function getFirstWeekStartDate(janFourth) {
				switch (janFourth.getDay()) {
					case 0:
						return new Date(janFourth.getFullYear() - 1, 11, 29);
					case 1:
						return janFourth;
					case 2:
						return new Date(janFourth.getFullYear(), 0, 3);
					case 3:
						return new Date(janFourth.getFullYear(), 0, 2);
					case 4:
						return new Date(janFourth.getFullYear(), 0, 1);
					case 5:
						return new Date(janFourth.getFullYear() - 1, 11, 31);
					case 6:
						return new Date(janFourth.getFullYear() - 1, 11, 30);
				}
			}
			function getWeekBasedYear(date) {
				var thisDate = __addDays(
					new Date(date.tm_year + 1900, 0, 1),
					date.tm_yday,
				);
				var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
				var janFourthNextYear = new Date(
					thisDate.getFullYear() + 1,
					0,
					4,
				);
				var firstWeekStartThisYear =
					getFirstWeekStartDate(janFourthThisYear);
				var firstWeekStartNextYear =
					getFirstWeekStartDate(janFourthNextYear);
				if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
					if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
						return thisDate.getFullYear() + 1;
					}
					return thisDate.getFullYear();
				}
				return thisDate.getFullYear() - 1;
			}
			var EXPANSION_RULES_2 = {
				"%a": function (date) {
					return WEEKDAYS[date.tm_wday].substring(0, 3);
				},
				"%A": function (date) {
					return WEEKDAYS[date.tm_wday];
				},
				"%b": function (date) {
					return MONTHS[date.tm_mon].substring(0, 3);
				},
				"%B": function (date) {
					return MONTHS[date.tm_mon];
				},
				"%C": function (date) {
					var year = date.tm_year + 1900;
					return leadingNulls((year / 100) | 0, 2);
				},
				"%d": function (date) {
					return leadingNulls(date.tm_mday, 2);
				},
				"%e": function (date) {
					return leadingSomething(date.tm_mday, 2, " ");
				},
				"%g": function (date) {
					return getWeekBasedYear(date).toString().substring(2);
				},
				"%G": function (date) {
					return getWeekBasedYear(date);
				},
				"%H": function (date) {
					return leadingNulls(date.tm_hour, 2);
				},
				"%I": function (date) {
					var twelveHour = date.tm_hour;
					if (twelveHour == 0) twelveHour = 12;
					else if (twelveHour > 12) twelveHour -= 12;
					return leadingNulls(twelveHour, 2);
				},
				"%j": function (date) {
					return leadingNulls(
						date.tm_mday +
							__arraySum(
								__isLeapYear(date.tm_year + 1900)
									? __MONTH_DAYS_LEAP
									: __MONTH_DAYS_REGULAR,
								date.tm_mon - 1,
							),
						3,
					);
				},
				"%m": function (date) {
					return leadingNulls(date.tm_mon + 1, 2);
				},
				"%M": function (date) {
					return leadingNulls(date.tm_min, 2);
				},
				"%n": function () {
					return "\n";
				},
				"%p": function (date) {
					if (date.tm_hour >= 0 && date.tm_hour < 12) {
						return "AM";
					}
					return "PM";
				},
				"%S": function (date) {
					return leadingNulls(date.tm_sec, 2);
				},
				"%t": function () {
					return "\t";
				},
				"%u": function (date) {
					return date.tm_wday || 7;
				},
				"%U": function (date) {
					var days = date.tm_yday + 7 - date.tm_wday;
					return leadingNulls(Math.floor(days / 7), 2);
				},
				"%V": function (date) {
					var val = Math.floor(
						(date.tm_yday + 7 - ((date.tm_wday + 6) % 7)) / 7,
					);
					if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
						val++;
					}
					if (!val) {
						val = 52;
						var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
						if (
							dec31 == 4 ||
							(dec31 == 5 &&
								__isLeapYear((date.tm_year % 400) - 1))
						) {
							val++;
						}
					} else if (val == 53) {
						var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
						if (
							jan1 != 4 &&
							(jan1 != 3 || !__isLeapYear(date.tm_year))
						)
							val = 1;
					}
					return leadingNulls(val, 2);
				},
				"%w": function (date) {
					return date.tm_wday;
				},
				"%W": function (date) {
					var days = date.tm_yday + 7 - ((date.tm_wday + 6) % 7);
					return leadingNulls(Math.floor(days / 7), 2);
				},
				"%y": function (date) {
					return (date.tm_year + 1900).toString().substring(2);
				},
				"%Y": function (date) {
					return date.tm_year + 1900;
				},
				"%z": function (date) {
					var off = date.tm_gmtoff;
					var ahead = off >= 0;
					off = Math.abs(off) / 60;
					off = (off / 60) * 100 + (off % 60);
					return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
				},
				"%Z": function (date) {
					return date.tm_zone;
				},
				"%%": function () {
					return "%";
				},
			};
			pattern = pattern.replace(/%%/g, "\0\0");
			for (var rule in EXPANSION_RULES_2) {
				if (pattern.includes(rule)) {
					pattern = pattern.replace(
						new RegExp(rule, "g"),
						EXPANSION_RULES_2[rule](date),
					);
				}
			}
			pattern = pattern.replace(/\0\0/g, "%");
			var bytes = intArrayFromString(pattern, false);
			if (bytes.length > maxsize) {
				return 0;
			}
			writeArrayToMemory(bytes, s);
			return bytes.length - 1;
		}
		function _strftime_l(s, maxsize, format, tm, loc) {
			return _strftime(s, maxsize, format, tm);
		}
		InternalError = Module["InternalError"] = extendError(
			Error,
			"InternalError",
		);
		embind_init_charCodes();
		BindingError = Module["BindingError"] = extendError(
			Error,
			"BindingError",
		);
		init_ClassHandle();
		init_embind();
		init_RegisteredPointer();
		UnboundTypeError = Module["UnboundTypeError"] = extendError(
			Error,
			"UnboundTypeError",
		);
		init_emval();
		function checkIncomingModuleAPI() {
			ignoredModuleProp("fetchSettings");
		}
		var asmLibraryArg = {
			_ZN6tflite13DumpArenaInfoERKNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEERKNS0_6vectorIiNS4_IiEEEEmRKNS9_INS_27ArenaAllocWithUsageIntervalENS4_ISE_EEEE:
				__ZN6tflite13DumpArenaInfoERKNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEERKNS0_6vectorIiNS4_IiEEEEmRKNS9_INS_27ArenaAllocWithUsageIntervalENS4_ISE_EEEE,
			__assert_fail: ___assert_fail,
			_dlinit: __dlinit,
			_dlopen_js: __dlopen_js,
			_dlsym_js: __dlsym_js,
			_embind_finalize_value_object: __embind_finalize_value_object,
			_embind_register_bigint: __embind_register_bigint,
			_embind_register_bool: __embind_register_bool,
			_embind_register_class: __embind_register_class,
			_embind_register_class_class_function:
				__embind_register_class_class_function,
			_embind_register_class_constructor:
				__embind_register_class_constructor,
			_embind_register_class_function: __embind_register_class_function,
			_embind_register_class_property: __embind_register_class_property,
			_embind_register_emval: __embind_register_emval,
			_embind_register_float: __embind_register_float,
			_embind_register_integer: __embind_register_integer,
			_embind_register_memory_view: __embind_register_memory_view,
			_embind_register_std_string: __embind_register_std_string,
			_embind_register_std_wstring: __embind_register_std_wstring,
			_embind_register_value_object: __embind_register_value_object,
			_embind_register_value_object_field:
				__embind_register_value_object_field,
			_embind_register_void: __embind_register_void,
			_emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic,
			_emval_as: __emval_as,
			_emval_call_method: __emval_call_method,
			_emval_call_void_method: __emval_call_void_method,
			_emval_decref: __emval_decref,
			_emval_get_global: __emval_get_global,
			_emval_get_method_caller: __emval_get_method_caller,
			_emval_get_property: __emval_get_property,
			_emval_incref: __emval_incref,
			_emval_new: __emval_new,
			_emval_new_array: __emval_new_array,
			_emval_new_array_from_memory_view:
				__emval_new_array_from_memory_view,
			_emval_new_cstring: __emval_new_cstring,
			_emval_new_object: __emval_new_object,
			_emval_run_destructors: __emval_run_destructors,
			_emval_set_property: __emval_set_property,
			_emval_take_value: __emval_take_value,
			_mmap_js: __mmap_js,
			_munmap_js: __munmap_js,
			abort: _abort,
			emscripten_date_now: _emscripten_date_now,
			emscripten_get_heap_max: _emscripten_get_heap_max,
			emscripten_get_now: _emscripten_get_now,
			emscripten_memcpy_big: _emscripten_memcpy_big,
			emscripten_resize_heap: _emscripten_resize_heap,
			environ_get: _environ_get,
			environ_sizes_get: _environ_sizes_get,
			exit: _exit,
			fd_close: _fd_close,
			fd_seek: _fd_seek,
			fd_write: _fd_write,
			getentropy: _getentropy,
			strftime_l: _strftime_l,
		};
		var asm = createWasm();
		var ___wasm_call_ctors = (Module["___wasm_call_ctors"] =
			createExportWrapper("__wasm_call_ctors"));
		var _malloc = (Module["_malloc"] = createExportWrapper("malloc"));
		var _free = (Module["_free"] = createExportWrapper("free"));
		var ___errno_location = (Module["___errno_location"] =
			createExportWrapper("__errno_location"));
		var ___getTypeName = (Module["___getTypeName"] =
			createExportWrapper("__getTypeName"));
		var __embind_initialize_bindings = (Module[
			"__embind_initialize_bindings"
		] = createExportWrapper("_embind_initialize_bindings"));
		var ___dl_seterr = (Module["___dl_seterr"] =
			createExportWrapper("__dl_seterr"));
		var _fflush = (Module["_fflush"] = createExportWrapper("fflush"));
		var _emscripten_stack_init = (Module["_emscripten_stack_init"] =
			function () {
				return (_emscripten_stack_init = Module[
					"_emscripten_stack_init"
				] =
					Module["asm"]["emscripten_stack_init"]).apply(
					null,
					arguments,
				);
			});
		var _emscripten_stack_get_free = (Module["_emscripten_stack_get_free"] =
			function () {
				return (_emscripten_stack_get_free = Module[
					"_emscripten_stack_get_free"
				] =
					Module["asm"]["emscripten_stack_get_free"]).apply(
					null,
					arguments,
				);
			});
		var _emscripten_stack_get_base = (Module["_emscripten_stack_get_base"] =
			function () {
				return (_emscripten_stack_get_base = Module[
					"_emscripten_stack_get_base"
				] =
					Module["asm"]["emscripten_stack_get_base"]).apply(
					null,
					arguments,
				);
			});
		var _emscripten_stack_get_end = (Module["_emscripten_stack_get_end"] =
			function () {
				return (_emscripten_stack_get_end = Module[
					"_emscripten_stack_get_end"
				] =
					Module["asm"]["emscripten_stack_get_end"]).apply(
					null,
					arguments,
				);
			});
		var stackSave = (Module["stackSave"] =
			createExportWrapper("stackSave"));
		var stackRestore = (Module["stackRestore"] =
			createExportWrapper("stackRestore"));
		var stackAlloc = (Module["stackAlloc"] =
			createExportWrapper("stackAlloc"));
		var dynCall_jjj = (Module["dynCall_jjj"] =
			createExportWrapper("dynCall_jjj"));
		var dynCall_jiii = (Module["dynCall_jiii"] =
			createExportWrapper("dynCall_jiii"));
		var dynCall_iiiijj = (Module["dynCall_iiiijj"] =
			createExportWrapper("dynCall_iiiijj"));
		var dynCall_viijj = (Module["dynCall_viijj"] =
			createExportWrapper("dynCall_viijj"));
		var dynCall_viiijjj = (Module["dynCall_viiijjj"] =
			createExportWrapper("dynCall_viiijjj"));
		var dynCall_iijjiiii = (Module["dynCall_iijjiiii"] =
			createExportWrapper("dynCall_iijjiiii"));
		var dynCall_jiji = (Module["dynCall_jiji"] =
			createExportWrapper("dynCall_jiji"));
		var dynCall_viijii = (Module["dynCall_viijii"] =
			createExportWrapper("dynCall_viijii"));
		var dynCall_iiiiij = (Module["dynCall_iiiiij"] =
			createExportWrapper("dynCall_iiiiij"));
		var dynCall_iiiiijj = (Module["dynCall_iiiiijj"] =
			createExportWrapper("dynCall_iiiiijj"));
		var dynCall_iiiiiijj = (Module["dynCall_iiiiiijj"] =
			createExportWrapper("dynCall_iiiiiijj"));
		var unexportedRuntimeSymbols = [
			"run",
			"UTF8ArrayToString",
			"UTF8ToString",
			"stringToUTF8Array",
			"stringToUTF8",
			"lengthBytesUTF8",
			"addOnPreRun",
			"addOnInit",
			"addOnPreMain",
			"addOnExit",
			"addOnPostRun",
			"addRunDependency",
			"removeRunDependency",
			"FS_createFolder",
			"FS_createPath",
			"FS_createDataFile",
			"FS_createPreloadedFile",
			"FS_createLazyFile",
			"FS_createLink",
			"FS_createDevice",
			"FS_unlink",
			"getLEB",
			"getFunctionTables",
			"alignFunctionTables",
			"registerFunctions",
			"prettyPrint",
			"getCompilerSetting",
			"print",
			"printErr",
			"callMain",
			"abort",
			"keepRuntimeAlive",
			"wasmMemory",
			"stackAlloc",
			"stackSave",
			"stackRestore",
			"getTempRet0",
			"setTempRet0",
			"writeStackCookie",
			"checkStackCookie",
			"ptrToString",
			"zeroMemory",
			"stringToNewUTF8",
			"exitJS",
			"getHeapMax",
			"emscripten_realloc_buffer",
			"ENV",
			"ERRNO_CODES",
			"ERRNO_MESSAGES",
			"setErrNo",
			"inetPton4",
			"inetNtop4",
			"inetPton6",
			"inetNtop6",
			"readSockaddr",
			"writeSockaddr",
			"DNS",
			"getHostByName",
			"Protocols",
			"Sockets",
			"getRandomDevice",
			"warnOnce",
			"traverseStack",
			"UNWIND_CACHE",
			"convertPCtoSourceLocation",
			"readAsmConstArgsArray",
			"readAsmConstArgs",
			"mainThreadEM_ASM",
			"jstoi_q",
			"jstoi_s",
			"getExecutableName",
			"listenOnce",
			"autoResumeAudioContext",
			"dynCallLegacy",
			"getDynCaller",
			"dynCall",
			"setWasmTableEntry",
			"getWasmTableEntry",
			"handleException",
			"runtimeKeepalivePush",
			"runtimeKeepalivePop",
			"callUserCallback",
			"maybeExit",
			"safeSetTimeout",
			"asmjsMangle",
			"asyncLoad",
			"alignMemory",
			"mmapAlloc",
			"writeI53ToI64",
			"writeI53ToI64Clamped",
			"writeI53ToI64Signaling",
			"writeI53ToU64Clamped",
			"writeI53ToU64Signaling",
			"readI53FromI64",
			"readI53FromU64",
			"convertI32PairToI53",
			"convertI32PairToI53Checked",
			"convertU32PairToI53",
			"getCFunc",
			"ccall",
			"cwrap",
			"uleb128Encode",
			"sigToWasmTypes",
			"generateFuncType",
			"convertJsFunctionToWasm",
			"freeTableIndexes",
			"functionsInTableMap",
			"getEmptyTableSlot",
			"updateTableMap",
			"addFunction",
			"removeFunction",
			"reallyNegative",
			"unSign",
			"strLen",
			"reSign",
			"formatString",
			"setValue",
			"getValue",
			"PATH",
			"PATH_FS",
			"intArrayFromString",
			"intArrayToString",
			"AsciiToString",
			"stringToAscii",
			"UTF16Decoder",
			"UTF16ToString",
			"stringToUTF16",
			"lengthBytesUTF16",
			"UTF32ToString",
			"stringToUTF32",
			"lengthBytesUTF32",
			"allocateUTF8",
			"allocateUTF8OnStack",
			"writeStringToMemory",
			"writeArrayToMemory",
			"writeAsciiToMemory",
			"SYSCALLS",
			"getSocketFromFD",
			"getSocketAddress",
			"JSEvents",
			"registerKeyEventCallback",
			"specialHTMLTargets",
			"maybeCStringToJsString",
			"findEventTarget",
			"findCanvasEventTarget",
			"getBoundingClientRect",
			"fillMouseEventData",
			"registerMouseEventCallback",
			"registerWheelEventCallback",
			"registerUiEventCallback",
			"registerFocusEventCallback",
			"fillDeviceOrientationEventData",
			"registerDeviceOrientationEventCallback",
			"fillDeviceMotionEventData",
			"registerDeviceMotionEventCallback",
			"screenOrientation",
			"fillOrientationChangeEventData",
			"registerOrientationChangeEventCallback",
			"fillFullscreenChangeEventData",
			"registerFullscreenChangeEventCallback",
			"JSEvents_requestFullscreen",
			"JSEvents_resizeCanvasForFullscreen",
			"registerRestoreOldStyle",
			"hideEverythingExceptGivenElement",
			"restoreHiddenElements",
			"setLetterbox",
			"currentFullscreenStrategy",
			"restoreOldWindowedStyle",
			"softFullscreenResizeWebGLRenderTarget",
			"doRequestFullscreen",
			"fillPointerlockChangeEventData",
			"registerPointerlockChangeEventCallback",
			"registerPointerlockErrorEventCallback",
			"requestPointerLock",
			"fillVisibilityChangeEventData",
			"registerVisibilityChangeEventCallback",
			"registerTouchEventCallback",
			"fillGamepadEventData",
			"registerGamepadEventCallback",
			"registerBeforeUnloadEventCallback",
			"fillBatteryEventData",
			"battery",
			"registerBatteryEventCallback",
			"setCanvasElementSize",
			"getCanvasElementSize",
			"demangle",
			"demangleAll",
			"jsStackTrace",
			"stackTrace",
			"ExitStatus",
			"getEnvStrings",
			"checkWasiClock",
			"flush_NO_FILESYSTEM",
			"dlopenMissingError",
			"createDyncallWrapper",
			"setImmediateWrapped",
			"clearImmediateWrapped",
			"polyfillSetImmediate",
			"uncaughtExceptionCount",
			"exceptionLast",
			"exceptionCaught",
			"ExceptionInfo",
			"exception_addRef",
			"exception_decRef",
			"Browser",
			"setMainLoop",
			"wget",
			"tempFixedLengthArray",
			"miniTempWebGLFloatBuffers",
			"heapObjectForWebGLType",
			"heapAccessShiftForWebGLHeap",
			"GL",
			"emscriptenWebGLGet",
			"computeUnpackAlignedImageSize",
			"emscriptenWebGLGetTexPixelData",
			"emscriptenWebGLGetUniform",
			"webglGetUniformLocation",
			"webglPrepareUniformLocationsBeforeFirstUse",
			"webglGetLeftBracePos",
			"emscriptenWebGLGetVertexAttrib",
			"writeGLArray",
			"AL",
			"SDL_unicode",
			"SDL_ttfContext",
			"SDL_audio",
			"SDL",
			"SDL_gfx",
			"GLUT",
			"EGL",
			"GLFW_Window",
			"GLFW",
			"GLEW",
			"IDBStore",
			"runAndAbortIfError",
			"ALLOC_NORMAL",
			"ALLOC_STACK",
			"allocate",
			"InternalError",
			"BindingError",
			"UnboundTypeError",
			"PureVirtualError",
			"init_embind",
			"throwInternalError",
			"throwBindingError",
			"throwUnboundTypeError",
			"ensureOverloadTable",
			"exposePublicSymbol",
			"replacePublicSymbol",
			"extendError",
			"createNamedFunction",
			"embindRepr",
			"registeredInstances",
			"getBasestPointer",
			"registerInheritedInstance",
			"unregisterInheritedInstance",
			"getInheritedInstance",
			"getInheritedInstanceCount",
			"getLiveInheritedInstances",
			"registeredTypes",
			"awaitingDependencies",
			"typeDependencies",
			"registeredPointers",
			"registerType",
			"whenDependentTypesAreResolved",
			"embind_charCodes",
			"embind_init_charCodes",
			"readLatin1String",
			"getTypeName",
			"heap32VectorToArray",
			"requireRegisteredType",
			"getShiftFromSize",
			"integerReadValueFromPointer",
			"enumReadValueFromPointer",
			"floatReadValueFromPointer",
			"simpleReadValueFromPointer",
			"runDestructors",
			"new_",
			"craftInvokerFunction",
			"embind__requireFunction",
			"tupleRegistrations",
			"structRegistrations",
			"genericPointerToWireType",
			"constNoSmartPtrRawPointerToWireType",
			"nonConstNoSmartPtrRawPointerToWireType",
			"init_RegisteredPointer",
			"RegisteredPointer",
			"RegisteredPointer_getPointee",
			"RegisteredPointer_destructor",
			"RegisteredPointer_deleteObject",
			"RegisteredPointer_fromWireType",
			"runDestructor",
			"releaseClassHandle",
			"finalizationRegistry",
			"detachFinalizer_deps",
			"detachFinalizer",
			"attachFinalizer",
			"makeClassHandle",
			"init_ClassHandle",
			"ClassHandle",
			"ClassHandle_isAliasOf",
			"throwInstanceAlreadyDeleted",
			"ClassHandle_clone",
			"ClassHandle_delete",
			"deletionQueue",
			"ClassHandle_isDeleted",
			"ClassHandle_deleteLater",
			"flushPendingDeletes",
			"delayFunction",
			"setDelayFunction",
			"RegisteredClass",
			"shallowCopyInternalPointer",
			"downcastPointer",
			"upcastPointer",
			"validateThis",
			"char_0",
			"char_9",
			"makeLegalFunctionName",
			"emval_handle_array",
			"emval_free_list",
			"emval_symbols",
			"init_emval",
			"count_emval_handles",
			"get_first_emval",
			"getStringOrSymbol",
			"Emval",
			"emval_newers",
			"craftEmvalAllocator",
			"emval_get_global",
			"emval_lookupTypes",
			"emval_allocateDestructors",
			"emval_methodCallers",
			"emval_addMethodCaller",
			"emval_registeredMethods",
		];
		unexportedRuntimeSymbols.forEach(unexportedRuntimeSymbol);
		var missingLibrarySymbols = [
			"ptrToString",
			"zeroMemory",
			"stringToNewUTF8",
			"setErrNo",
			"inetPton4",
			"inetNtop4",
			"inetPton6",
			"inetNtop6",
			"readSockaddr",
			"writeSockaddr",
			"getHostByName",
			"traverseStack",
			"convertPCtoSourceLocation",
			"readAsmConstArgs",
			"mainThreadEM_ASM",
			"jstoi_q",
			"jstoi_s",
			"listenOnce",
			"autoResumeAudioContext",
			"setWasmTableEntry",
			"handleException",
			"runtimeKeepalivePush",
			"runtimeKeepalivePop",
			"callUserCallback",
			"maybeExit",
			"safeSetTimeout",
			"asmjsMangle",
			"asyncLoad",
			"alignMemory",
			"mmapAlloc",
			"writeI53ToI64",
			"writeI53ToI64Clamped",
			"writeI53ToI64Signaling",
			"writeI53ToU64Clamped",
			"writeI53ToU64Signaling",
			"readI53FromI64",
			"readI53FromU64",
			"convertI32PairToI53",
			"convertU32PairToI53",
			"getCFunc",
			"ccall",
			"cwrap",
			"uleb128Encode",
			"sigToWasmTypes",
			"generateFuncType",
			"convertJsFunctionToWasm",
			"getEmptyTableSlot",
			"updateTableMap",
			"addFunction",
			"removeFunction",
			"reallyNegative",
			"unSign",
			"strLen",
			"reSign",
			"formatString",
			"intArrayToString",
			"AsciiToString",
			"stringToAscii",
			"allocateUTF8",
			"allocateUTF8OnStack",
			"writeStringToMemory",
			"getSocketFromFD",
			"getSocketAddress",
			"registerKeyEventCallback",
			"maybeCStringToJsString",
			"findEventTarget",
			"findCanvasEventTarget",
			"getBoundingClientRect",
			"fillMouseEventData",
			"registerMouseEventCallback",
			"registerWheelEventCallback",
			"registerUiEventCallback",
			"registerFocusEventCallback",
			"fillDeviceOrientationEventData",
			"registerDeviceOrientationEventCallback",
			"fillDeviceMotionEventData",
			"registerDeviceMotionEventCallback",
			"screenOrientation",
			"fillOrientationChangeEventData",
			"registerOrientationChangeEventCallback",
			"fillFullscreenChangeEventData",
			"registerFullscreenChangeEventCallback",
			"JSEvents_requestFullscreen",
			"JSEvents_resizeCanvasForFullscreen",
			"registerRestoreOldStyle",
			"hideEverythingExceptGivenElement",
			"restoreHiddenElements",
			"setLetterbox",
			"softFullscreenResizeWebGLRenderTarget",
			"doRequestFullscreen",
			"fillPointerlockChangeEventData",
			"registerPointerlockChangeEventCallback",
			"registerPointerlockErrorEventCallback",
			"requestPointerLock",
			"fillVisibilityChangeEventData",
			"registerVisibilityChangeEventCallback",
			"registerTouchEventCallback",
			"fillGamepadEventData",
			"registerGamepadEventCallback",
			"registerBeforeUnloadEventCallback",
			"fillBatteryEventData",
			"battery",
			"registerBatteryEventCallback",
			"setCanvasElementSize",
			"getCanvasElementSize",
			"demangle",
			"demangleAll",
			"jsStackTrace",
			"stackTrace",
			"checkWasiClock",
			"createDyncallWrapper",
			"setImmediateWrapped",
			"clearImmediateWrapped",
			"polyfillSetImmediate",
			"ExceptionInfo",
			"exception_addRef",
			"exception_decRef",
			"setMainLoop",
			"heapObjectForWebGLType",
			"heapAccessShiftForWebGLHeap",
			"emscriptenWebGLGet",
			"computeUnpackAlignedImageSize",
			"emscriptenWebGLGetTexPixelData",
			"emscriptenWebGLGetUniform",
			"webglGetUniformLocation",
			"webglPrepareUniformLocationsBeforeFirstUse",
			"webglGetLeftBracePos",
			"emscriptenWebGLGetVertexAttrib",
			"writeGLArray",
			"SDL_unicode",
			"SDL_ttfContext",
			"SDL_audio",
			"GLFW_Window",
			"runAndAbortIfError",
			"ALLOC_NORMAL",
			"ALLOC_STACK",
			"allocate",
			"registerInheritedInstance",
			"unregisterInheritedInstance",
			"enumReadValueFromPointer",
		];
		missingLibrarySymbols.forEach(missingLibrarySymbol);
		var calledRun;
		dependenciesFulfilled = function runCaller() {
			if (!calledRun) run();
			if (!calledRun) dependenciesFulfilled = runCaller;
		};
		function stackCheckInit() {
			_emscripten_stack_init();
			writeStackCookie();
		}
		function run(args) {
			args = args || arguments_;
			if (runDependencies > 0) {
				return;
			}
			stackCheckInit();
			preRun();
			if (runDependencies > 0) {
				return;
			}
			function doRun() {
				if (calledRun) return;
				calledRun = true;
				Module["calledRun"] = true;
				if (ABORT) return;
				initRuntime();
				readyPromiseResolve(Module);
				if (Module["onRuntimeInitialized"])
					Module["onRuntimeInitialized"]();
				assert(
					!Module["_main"],
					'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]',
				);
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
			checkStackCookie();
		}
		function checkUnflushedContent() {
			var oldOut = out;
			var oldErr = err;
			var has = false;
			out = err = (x) => {
				has = true;
			};
			try {
				flush_NO_FILESYSTEM();
			} catch (e) {}
			out = oldOut;
			err = oldErr;
			if (has) {
				warnOnce(
					"stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.",
				);
				warnOnce(
					"(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)",
				);
			}
		}
		if (Module["preInit"]) {
			if (typeof Module["preInit"] == "function")
				Module["preInit"] = [Module["preInit"]];
			while (Module["preInit"].length > 0) {
				Module["preInit"].pop()();
			}
		}
		run();

		return tflite_model_runner_ModuleFactory.ready;
	};
})();
if (typeof exports === "object" && typeof module === "object")
	module.exports = tflite_model_runner_ModuleFactory;
else if (typeof define === "function" && define["amd"])
	define([], function () {
		return tflite_model_runner_ModuleFactory;
	});
else if (typeof exports === "object")
	exports["tflite_model_runner_ModuleFactory"] =
		tflite_model_runner_ModuleFactory;
