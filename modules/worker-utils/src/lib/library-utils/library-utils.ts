/* global importScripts */
import {global, isBrowser, isWorker} from '../env-utils/globals';
import * as node from '../node/require-utils.node';
import {assert} from '../env-utils/assert';
import {VERSION as __VERSION__} from '../env-utils/version';

/**
 * TODO - unpkg.com doesn't seem to have a `latest` specifier for alpha releases...
 * 'beta' on beta branch, 'latest' on prod branch
 */
const LATEST = 'latest';
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : LATEST;

const loadLibraryPromises: Record<string, Promise<any>> = {}; // promises

/**
 * Dynamically loads a library ("module")
 *
 * - wasm library: Array buffer is returned
 * - js library: Parse JS is returned
 *
 * Method depends on environment
 * - browser - script element is created and installed on document
 * - worker - eval is called on global context
 * - node - file is required
 *
 * @param libraryUrl
 * @param moduleName
 * @param options
 */
export async function loadLibrary(
  libraryUrl: string,
  moduleName: string | null = null,
  options: object = {}
): Promise<any> {
  if (moduleName) {
    libraryUrl = getLibraryUrl(libraryUrl, moduleName, options);
  }

  // Ensure libraries are only loaded once

  loadLibraryPromises[libraryUrl] =
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    loadLibraryPromises[libraryUrl] || loadLibraryFromFile(libraryUrl);
  return await loadLibraryPromises[libraryUrl];
}

// TODO - sort out how to resolve paths for main/worker and dev/prod
export function getLibraryUrl(library: string, moduleName?: string, options?: any): string {
  // Check if already a URL
  if (library.startsWith('http')) {
    return library;
  }

  // Allow application to import and supply libraries through `options.modules`
  const modules = options.modules || {};
  if (modules[library]) {
    return modules[library];
  }

  // Load from local files, not from CDN scripts in Node.js
  // TODO - needs to locate the modules directory when installed!
  if (!isBrowser) {
    return `modules/${moduleName}/dist/libs/${library}`;
  }

  // In browser, load from external scripts
  if (options.CDN) {
    assert(options.CDN.startsWith('http'));
    return `${options.CDN}/${moduleName}@${VERSION}/dist/libs/${library}`;
  }

  // TODO - loading inside workers requires paths relative to worker script location...
  if (isWorker) {
    return `../src/libs/${library}`;
  }

  return `modules/${moduleName}/src/libs/${library}`;
}

async function loadLibraryFromFile(libraryUrl: string): Promise<any> {
  if (libraryUrl.endsWith('wasm')) {
    const response = await fetch(libraryUrl);
    return await response.arrayBuffer();
  }

  if (!isBrowser) {
    try {
      return node && node.requireFromFile && (await node.requireFromFile(libraryUrl));
    } catch {
      return null;
    }
  }
  if (isWorker) {
    return importScripts(libraryUrl);
  }
  // TODO - fix - should be more secure than string parsing since observes CORS
  // if (isBrowser) {
  //   return await loadScriptFromFile(libraryUrl);
  // }

  const response = await fetch(libraryUrl);
  const scriptSource = await response.text();
  return loadLibraryFromString(scriptSource, libraryUrl);
}

/*
async function loadScriptFromFile(libraryUrl) {
  const script = document.createElement('script');
  script.src = libraryUrl;
  return await new Promise((resolve, reject) => {
    script.onload = data => {
      resolve(data);
    };
    script.onerror = reject;
  });
}
*/

// TODO - Needs security audit...
//  - Raw eval call
//  - Potentially bypasses CORS
// Upside is that this separates fetching and parsing
// we could create a`LibraryLoader` or`ModuleLoader`
function loadLibraryFromString(scriptSource: string, id: string): null | any {
  if (!isBrowser) {
    return node.requireFromString && node.requireFromString(scriptSource, id);
  }

  if (isWorker) {
    // Use lvalue trick to make eval run in global scope
    eval.call(global, scriptSource); // eslint-disable-line no-eval
    // https://stackoverflow.com/questions/9107240/1-evalthis-vs-evalthis-in-javascript
    // http://perfectionkills.com/global-eval-what-are-the-options/
    return null;
  }

  const script = document.createElement('script');
  script.id = id;
  // most browsers like a separate text node but some throw an error. The second method covers those.
  try {
    script.appendChild(document.createTextNode(scriptSource));
  } catch (e) {
    script.text = scriptSource;
  }
  document.body.appendChild(script);
  return null;
}

// TODO - technique for module injection into worker, from THREE.DracoLoader...
/*
function combineWorkerWithLibrary(worker, jsContent) {
  var fn = wWorker.toString();
  var body = [
    '// injected',
    jsContent,
    '',
    '// worker',
    fn.substring(fn.indexOf('{') + 1, fn.lastIndexOf('}'))
  ].join('\n');
  this.workerSourceURL = URL.createObjectURL(new Blob([body]));
}
*/
