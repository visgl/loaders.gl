import {defineConfig} from 'vite'
import * as fs from 'fs'

/** Run against local source */
const getAliases = async (frameworkName, frameworkRootDir) => {
  const modules = await fs.promises.readdir(`${frameworkRootDir}/modules`)
  const aliases = {}
  modules.forEach((module) => {
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDir}/modules/${module}/src`
  })
  return aliases
}

export default defineConfig(async () => {
  return {
    resolve: {extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'], alias: await getAliases('@loaders.gl', `${__dirname}/../../..`)
    },
    server: {open: true}
  }
})
