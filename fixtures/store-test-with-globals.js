
export default function () {
  const ls = window.localStorage.getItem('test')
  const el = document.querySelector('.test')

  return {
    state: {},
    getters: {
      companyName () { return ls } // --> getters['companyName']
    },
    mutations: {
      incrementTimer () { } // --> commit['incrementTimer']
    },
    actions: {
      reportSome () { } // --> dispatch['reportSome']
    },
    modules: {
      account: {
        namespaced: true,

        // module assets
        state: { },
        getters: {
          isAdmin () { return el } // -> getters['account/isAdmin']
        },
        actions: {
          login () { } // -> dispatch('account/login')
        },
        mutations: {
          login () { } // -> commit('account/login')
        },

        // nested modules
        modules: {
          // inherits the namespace from parent module
          myPage: {
            state: { },
            getters: {
              profile () { } // -> getters['account/profile']
            }
          },

          // further nest the namespace
          posts: {
            namespaced: true,

            state: { },
            getters: {
              popular () { } // -> getters['account/posts/popular']
            },
            modules: {
              comments: {
                actions: {
                  comment (text) { } // -> actions['account/posts/comment']
                }
              }
            }
          }
        }
      }
    }
  }
}
