#!/usr/bin/env node

const HELP_MSG = `vuextcg [store-definition.js] [output]

Read the input Vuex definition file to output a ES2015 module file which exports
three properties:

  * getters: contains upper case properties with the getters types
  * mutations: contains upper case properties with the mutations types
  * actions: contains upper case properties with the actions types

The Vuex definition file is required and has to be a module with a default
exports with the store definition (an Object) or a function which returns
the object definition, because it's preferred this last case sometimes to
avoid that when the store definition is imported serveral time (for exmaple)
in tests, it returns the same object instance which it's used as store.

When the file path to the JS file which contains the store defintion is
relative, then it's calculated from the current working directory of the
Node.js process (process.cwd()), otherwise, it's considered absolute and
it's used as provided.

The output file is optional, using the standard output when isn't specified.

Each type defined in mutations and actions is an uppercase and snake case
property, which starts (first word) with namespace (if it's a Vuex module with
the namespace set to true), following the subnamespaces (in case that it's
nested Vuex namespaced module) and the type; moreover if any of the namespaces
or the type are camel case, then they will become to snake case name before
uppercasing them.

Example
// store-definition.js
exports default {
  ...
  mutations: {
    increment(state) {
      state.count++
    }
  },
  modules: {
    account: {
      namespace: true,
      mutations: {
        increment(state) {
          state.count += 2
        }
      },

      modules: {
        settings: {
          namespace: true,
          getters: {
            isAdmin() {...}
          }
        }
      }
    },
    user: {
      actions: {
        getProfile() {....}
      }
    }
  }
}

# Output:
// DO NOT MODIFY THIS FILE: AUTOGENERATED BY vuextcg
exports const getters = {
  ACCOUNT_SETTINGS_IS_ADMIN: 'account/settings/isAdmin'
}

exports const mutations = {
  INCREMENT: 'increment',
  ACCOUNT_INCREMENT: 'account/increment',
}

exports const actions = {
  GET_PROFILE: 'getProfile'
}

The same input, but exporting a function like:

exports default function () {
  return {
    ...
    mutations: {
      increment(state) {
    ....
  }
}

would produce the same ouput than before.
`

require('babel-register')({
  presets: ['es2015', 'stage-2'],
  plugins: ['transform-runtime']
})

const fs = require('fs')
const {isAbsolute, resolve} = require('path')
const snakeCase = require('snake-case')

if (process.argv.length < 3) {
  exitWithError(`Error: the store definition filepath is required.

${HELP_MSG}
  `)
}

const storeDefFilepath = (isAbsolute(process.argv[2]))
  ? process.argv[2] : resolve(process.cwd(), process.argv[2])

// Write the provided file, otherwise to stdout
const outputFd = (process.argv[3])
  ? fs.openSync(process.argv[3], 'w+', parseInt('777', 8)) : 1

// Inject a fake window and document object in global scope
global.window = fakeObject()
global.document = global.window

const storeDefImp = require(storeDefFilepath).default
const getters = []
const mutations = []
const actions = []
let storeDef

if (typeof storeDefImp === 'function') {
  // Call the function which initialize the definition with that many fake
  // objects as needed parameters
  storeDef = storeDefImp(...Array(storeDefImp.length).fill(global.window))
} else {
  storeDef = storeDefImp
}

extract(storeDef, [])

// Lexicographical sort the const for each group
;[getters, mutations, actions].forEach(g => {
  g.sort((c1, c2) => {
    // Same namespsace level, then sort them lexicographically
    if (c1[2] === c2[2]) {
      if (c1[0] < c2[0]) {
        return -1
      } else {
        return 1
      }
    }

    return (c1[2] < c2[2]) ? -1 : 1
  })
})

fs.writeSync(
  outputFd, '// DO NOT MODIFY THIS FILE: AUTOGENERATED BY vuextcg', null, 'utf8'
)

// Write the output
let isFirstExport = true
;[
  ['getters', getters],
  ['mutations', mutations],
  ['actions', actions]
].forEach(g => {
  if (g[1].length === 0) {
    return
  }

  let exportInst
  if (isFirstExport) {
    exportInst = '\n'
    isFirstExport = false
  } else {
    exportInst = '\n\n'
  }

  exportInst += `export const ${g[0]} = {\n`
  fs.writeSync(outputFd, exportInst, null, 'utf8')

  let globalsEnded = false

  g[1].forEach((c, idx, list) => {
    if (!globalsEnded) {
      if (c[2] > 0) {
        globalsEnded = true

        let sep = (idx > 0) ? '\n  ' : ''
        sep += '// Namespaced\n'

        fs.writeSync(outputFd, sep, null, 'utf8')
      } else if (idx === 0) {
        fs.writeSync(outputFd, '  // Globals\n', null, 'utf8')
      }
    }

    let prop = `  ${c[0]}: '${c[1]}'`
    prop += (idx === (list.length - 1)) ? '\n' : ',\n'

    fs.writeSync(outputFd, prop, null, 'utf8')
  })

  fs.writeSync(outputFd, '}', null, 'utf8')
})

fs.writeSync(outputFd, '\n', null, 'utf8')
fs.closeSync(outputFd)

/** *** Helper functions *****/
/**
 * Return the constant uppercase-snakecase identifier, the full path identifier
 * of the property separated by '/' and the namespace level.
 *
 * @param {Array} namespace - The list of the nested namepsaces from startint
 *      at the root level.
 *      e.g. account/company/employee => ['account', 'company', 'employee']
 * @param {string} prop - Name of an object property
 * @return {Array} - An array with 3 elements,
 *      [0]: the uppercase-snakecase identifier e.g. ACCOUNT_COMPANY_NAME
 *      [1]: the full path of the property considering the namespace e.g.
 *              account/company/name
 *      [2]: The namespace level (i.e. @param namespace.length)
 */
function propMapper (namespace, prop) {
  const ctp = (namespace.length === 0) ? [prop] : [...namespace, prop]
  return [toTypeConst(ctp), ctp.join('/'), namespace.length]
}

function extract (store, namespace) {
  const mapFn = propMapper.bind(null, namespace)

  if (store.getters) {
    const getts = Object.keys(store.getters).map(mapFn)
    getters.push(...getts)
  }

  if (store.mutations) {
    const muts = Object.keys(store.mutations).map(mapFn)
    mutations.push(...muts)
  }

  if (store.actions) {
    const acts = Object.keys(store.actions).map(mapFn)
    actions.push(...acts)
  }

  if (store.modules) {
    Object.keys(store.modules).forEach(m => {
      let sm = store.modules[m]

      if (sm.namespaced) {
        extract(sm, [...namespace, m])
        return
      }

      extract(sm, namespace)
    })
  }
}
/**
 * Generate a uppercase and snakecase string from the full path (from the root
 * store to the mutation/action name, which can be in a submodule).
 * The generated string also convert any camelCase to snakecase
 *
 * @param {string[]} typePath - The mutation/action full path (namespace/type),
 *      e.g.
 *        - a global action: ['getProfile']
 *        - an action of an account module attached as a module of the root
 *              store: ['account', 'login']
 *        - a mutation of a settings module which is a module of the account
 *              module: ['account', 'settings', 'resetPassoword']
 * @return {string} The uppercased and snakecase representation of the typePath
 *      e.g ACCOUNT_SETTINGS_RESET_PASSWORD
 */
function toTypeConst (typePath) {
  return typePath.map(t => snakeCase(t).toUpperCase()).join('_')
}

function exitWithError (msg) {
  console.error(msg)
  process.exit(1)
}

/**
 * Create an object which can be called as a function or asked for any property.
 * The call as a function to itself or any of the properties as a function will
 * return a new fakeObject, so it creates objects with infinite properties.
 * This function is used to create global objects which exist in the browser but
 * not in node, hence if any of the store definitions use some of the browser API,
 * it won't crash and it will return the store definition, which is what's
 * needed in this tool.
 */
function fakeObject () {
  const target = function () {}
  target.toString = () => ''
  target.toJSON = () => ''

  return new Proxy(
    target,
    {
      get (target, prop) {
        return fakeObject()
      }
    }
  )
}
