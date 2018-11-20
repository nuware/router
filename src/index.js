/* globals window */

import {
  isNull,
  isFunction,
  isDefined,
  eq,
  not,
  map,
  find,
  head,
  tail,
  keys,
  join,
  prop,
  assoc,
  split,
  append,
  reduce,
  length,
  compose
} from '@nuware/functions'

import Effect from '@nuware/effect'

/**
 * Router
 *
 * @param {*} routes - Router configuration
 * @param {*} options - Router options
 *
 * @example
 * var routeHandler = function (path, params) {
 *  console.log('Handle route', path, params)
 * }
 *
 * var routes = {
 *  '/': routeHandler,
 *  '/user': routeHandler,
 *  '/route/:param1/next/:param2': routeHandler,
 *  '/admin/:adminId': routeHandler
 * }
 *
 * var router = Router(routes, {
 *  default: '/',
 *  hashbang: '#!'
 * })
 *
 * router.navigate('/route/1/next/6')
 *
 */

const Router = (routes = {}, options = {}) => {
  options.default = options.default || '/'
  options.hashbang = options.hashbang || '#!'

  routes = Object.assign({
    '/': () => {}
  }, routes)

  const win = Effect.of(window)

  const prepareParts = parts => compose(tail, split('/'))(parts)

  const parsePattern = (pattern, handler) => reduce((acc, part, i) => {
    acc.params[i] = null
    acc.path[i] = null
    if (eq(head(part))(':')) {
      acc.params[i] = tail(part)
    } else {
      acc.path[i] = part
    }
    acc.size++
    return acc
  })({
    pattern: pattern,
    path: [],
    params: [],
    handler: handler,
    size: 0
  })(prepareParts(pattern))

  const parseRoutes = routes => compose(
    map(pattern => parsePattern(pattern, prop(pattern)(routes))),
    keys
  )(routes)

  const parsedRoutes = parseRoutes(routes)

  // const findRoutesByPattern = pattern => find(x => {
  //   return eq(pattern)(prop('pattern')(x))
  // })(parsedRoutes)

  const findRoutesByPath = path => {
    const pathParts = prepareParts(path)
    return find(route => {
      return eq(route.size)(length(pathParts))
        ? compose(
          reduce((acc, curr) => (curr && acc))(true),
          reduce((acc, part, i) => {
            const inPath = eq(route.path[i])(part)
            const inParams = !!route.params[i]
            return append(inPath || inParams)(acc)
          })([])
        )(pathParts)
        : false
    })(parsedRoutes)
  }

  const extractParams = (path, route) => {
    const pathParts = prepareParts(path)
    return reduce((acc, param, i) => {
      return not(isNull(param)) ? assoc(param)(pathParts[i])(acc) : acc
    })({})(route.params)
  }

  // const defaultRoute = () => findRoutesByPattern(options.default)

  const navigate = (path) => {
    const hash = join('')([options.hashbang, path])
    win.chain(x => {
      x.location.hash = hash
    })
  }

  const process = (path, route) => {
    const params = extractParams(path, route)
    isFunction(route.handler) && route.handler(path, params)
    return void (0)
  }

  const onHashChangeEventHandler = () => {
    const path = win.map(x => x.location.hash).chain(compose(
      head, tail,
      split(options.hashbang)
    ))
    const route = findRoutesByPath(path)
    isDefined(route) ? process(path, route) : navigate(options.default)
  }

  win.map(x => {
    x.addEventListener('hashchange', onHashChangeEventHandler, false)
    return options.default
  }).chain(navigate)

  return {
    navigate
  }
}

export default Router
