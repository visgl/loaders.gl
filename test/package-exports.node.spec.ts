import {existsSync, readdirSync, readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {describe, expect, it} from 'vitest'

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const ROOT_DIRECTORY = dirname(TEST_DIRECTORY)
const MODULES_DIRECTORY = join(ROOT_DIRECTORY, 'modules')

describe('package loader and writer exports', () => {
  it('exposes each public implementation loader and writer as a package subpath', () => {
    const missingExports: string[] = []

    for (const packageDirectory of getModuleDirectories()) {
      const packageJson = readPackageJson(packageDirectory)
      const requiredSubpaths = getRequiredLoaderAndWriterSubpaths(packageDirectory)

      for (const subpath of requiredSubpaths) {
        if (!hasPackageExport(packageJson, subpath)) {
          missingExports.push(`${packageJson.name}: ${subpath}`)
        }
      }
    }

    expect(missingExports).toEqual([])
  })

  it('points loader and writer subpath exports at the emitted dist filenames', () => {
    const staleExports: string[] = []

    for (const packageDirectory of getModuleDirectories()) {
      const packageJson = readPackageJson(packageDirectory)

      for (const subpath of getDeclaredLoaderAndWriterSubpaths(packageJson.exports ?? {})) {
        const exportValue = packageJson.exports[subpath]
        const baseName = subpath.slice(2)
        const expectedImportPath = `./dist/${baseName}.js`
        const expectedTypesPath = `./dist/${baseName}.d.ts`
        const sourcePath = join(packageDirectory, 'src', `${baseName}.ts`)

        if (!exportValue || typeof exportValue !== 'object') {
          staleExports.push(`${packageJson.name}: ${subpath} must define import/types targets`)
          continue
        }

        if (exportValue.import !== expectedImportPath) {
          staleExports.push(
            `${packageJson.name}: ${subpath} import target should be ${expectedImportPath}`
          )
        }

        if (exportValue.types !== expectedTypesPath) {
          staleExports.push(
            `${packageJson.name}: ${subpath} types target should be ${expectedTypesPath}`
          )
        }

        if (!existsSync(sourcePath)) {
          staleExports.push(`${packageJson.name}: ${subpath} is missing ${sourcePath}`)
        }
      }
    }

    expect(staleExports).toEqual([])
  })
})

/**
 * Returns module workspace directories that publish a package manifest.
 */
function getModuleDirectories(): string[] {
  return readdirSync(MODULES_DIRECTORY, {withFileTypes: true})
    .filter((directoryEntry) => directoryEntry.isDirectory())
    .map((directoryEntry) => join(MODULES_DIRECTORY, directoryEntry.name))
    .filter((packageDirectory) => existsSync(join(packageDirectory, 'package.json')))
}

/**
 * Reads a module package manifest as JSON.
 */
function readPackageJson(packageDirectory: string): Record<string, any> {
  const packageJsonPath = join(packageDirectory, 'package.json')
  return JSON.parse(readFileSync(packageJsonPath, 'utf8'))
}

/**
 * Collects required loader and writer subpath exports from a package root index.
 */
function getRequiredLoaderAndWriterSubpaths(packageDirectory: string): string[] {
  const indexPath = join(packageDirectory, 'src', 'index.ts')

  if (!existsSync(indexPath)) {
    return []
  }

  const indexSource = readFileSync(indexPath, 'utf8')
  const requiredSubpaths = new Set<string>()

  for (const exportStatement of getLocalNamedExportStatements(indexSource)) {
    if (!isEligibleLoaderOrWriterSource(exportStatement.source)) {
      continue
    }

    const publicExportNames = getPublicLoaderAndWriterExportNames(exportStatement.specifiers)

    if (!publicExportNames.length) {
      continue
    }

    requiredSubpaths.add(`./${exportStatement.source.replace(/-metadata$/, '')}`)
  }

  return [...requiredSubpaths].sort()
}

/**
 * Finds local named export statements from a source file.
 */
function getLocalNamedExportStatements(
  source: string
): Array<{specifiers: string; source: string}> {
  const exportStatements: Array<{specifiers: string; source: string}> = []
  const localNamedExportPattern = /export(?:\s+type)?\s*\{([\s\S]*?)\}\s*from\s+'\.\/([^']+)';/g
  const sourceWithoutLineComments = removeLineComments(source)

  for (const match of sourceWithoutLineComments.matchAll(localNamedExportPattern)) {
    exportStatements.push({specifiers: match[1], source: match[2]})
  }

  return exportStatements
}

/**
 * Removes single-line comments so comma-splitting named exports stays stable.
 */
function removeLineComments(source: string): string {
  return source
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n')
}

/**
 * Returns whether a local export source is eligible for package subpath exports.
 */
function isEligibleLoaderOrWriterSource(source: string): boolean {
  if (source.startsWith('lib/') || source.startsWith('wip/') || source.startsWith('types')) {
    return false
  }

  if (source.includes('/lib/')) {
    return false
  }

  return /(loader|writer)(?:-metadata)?$/.test(source)
}

/**
 * Extracts public loader/writer export names from a named export specifier list.
 */
function getPublicLoaderAndWriterExportNames(specifiers: string): string[] {
  return specifiers
    .split(',')
    .map((specifier) => specifier.trim())
    .filter(Boolean)
    .map((specifier) => {
      const aliasMatch = specifier.match(/^([A-Za-z0-9_]+)\s+as\s+([A-Za-z0-9_]+)$/)
      const exportName = aliasMatch ? aliasMatch[2] : specifier

      if (!/^(?:[A-Za-z0-9_]+(?:Loader|Writer))$/.test(exportName)) {
        return null
      }

      if (exportName.startsWith('_')) {
        return null
      }

      if (exportName.endsWith('WorkerLoader') || exportName.endsWith('WriterWorker')) {
        return null
      }

      return exportName
    })
    .filter((exportName): exportName is string => Boolean(exportName))
}

/**
 * Returns whether a manifest exports an exact or wildcard-covered subpath.
 */
function hasPackageExport(packageJson: Record<string, any>, subpath: string): boolean {
  const exportsField = packageJson.exports ?? {}

  if (exportsField[subpath]) {
    return true
  }

  return Object.keys(exportsField).some((exportKey) => {
    const wildcardMatch = exportKey.match(/^\.\/(.+)\/\*$/)
    return wildcardMatch ? subpath.startsWith(`./${wildcardMatch[1]}/`) : false
  })
}

/**
 * Lists declared exact loader/writer subpaths that should map to emitted dist files.
 */
function getDeclaredLoaderAndWriterSubpaths(exportsField: Record<string, any>): string[] {
  return Object.keys(exportsField)
    .filter((exportKey) => exportKey.startsWith('./'))
    .filter((exportKey) => !exportKey.includes('*'))
    .filter((exportKey) => !exportKey.endsWith('.js'))
    .filter((exportKey) => /(loader|writer)$/.test(exportKey))
    .sort()
}
