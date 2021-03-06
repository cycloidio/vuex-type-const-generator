Vuex Type Constantats Generator
===============================

Simple tool which read a Vuex state definition and output a JS ES2015 file which exports the 'getters', 'mutations' and 'actions' object which contains properties with the constant name convention (uppercase + snakecase) as their names and the Vuex types as value.

## Considerations

This tool has been developed with NodeJS v7 and we don't think to add support for previous versions.

## Install

With NPM
`npm install vuex-type-const-generator`

With Yarn
`yarn add vuex-type-const-generator`

## Docs

The tool will show their own help command if your run it without any argument.

If you don't have installed it globally (it's preferable not to so, for the reasons mentioned on [yarn docs comemnt](https://yarnpkg.com/en/docs/cli/add#toc-caveats)), then run `./node_modules/.bin/vuextcg`

You will get the same below message

```
vuextcg [store-definition.js] [output]

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
```

## Development

Install dependencies `npm install` or `yarn install` (recommended).

### lint
All the JS code is linted using [standard](https://github.com/feross/standard)

`npm run lint` or `yarn run lint`

### Test

`npm test` or `yarn test`

## License

The MIT License (MIT)
Copyright (c) 2017 cycloid.io
Read the LICENSE file for more information.
