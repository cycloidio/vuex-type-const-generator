import baseDef from './store-test-func'

export default function (dep1, dep2) {
  const base = baseDef()
  base.state.token = dep2.getToken()

  return base
}
