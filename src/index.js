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
  reduce,
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

const Router = (routes, options = {}) => {
  options.default = options.default || '/'
  options.hashbang = options.hashbang || '#!'

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
    return acc
  })({
    pattern: pattern,
    path: [],
    params: [],
    handler: handler
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
      return compose(reduce((acc, curr) => curr && acc)(true), map((part, i) => {
        const inPath = eq(route.path[i])(part)
        const inParams = not(isNull(route.params[i]))
        return !!(inPath || inParams)
      }))(pathParts)
    })(parsedRoutes)
  }

  const extractParams = (path, route) => {
    const pathParts = prepareParts(path)
    return reduce((acc, param, i) => {
      return not(isNull(param)) ? assoc(param)(pathParts[i])(acc) : acc
    })({})(route.params)
  }

  // const defaultRoute = () => findRoutesByPattern(options.default)

  const navigate = path => {
    return win.chain(x => {
      x.location.hash = join('')([options.hashbang, path])
      return x.location.hash
    })
  }

  const process = (path, route) => {
    const params = extractParams(path, route)
    isFunction(route.handler) && route.handler(path, params)
  }

  const onHashChangeEventHandler = () => {
    const path = win.map(x => x.location.hash).chain(compose(
      head, tail,
      split(options.hashbang)
    ))
    const route = findRoutesByPath(path)
    isDefined(route) ? process(path, route) : navigate(options.default)
  }

  win.chain(x => x.addEventListener('hashchange', onHashChangeEventHandler, false))

  return {
    navigate
  }
}

export default Router
