var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
Object.defineProperty(exports, "__esModule", { value: true })
exports.buildSearchConfig = exports.buildSanityConfig = exports.buildShopifyIncrementalConfig = exports.buildShopifyConfig = exports.buildManifestConfig = exports.proxyUrl = exports.proxyMiddleware = exports.writeDocument = exports.writeCollections = exports.writeProducts = exports.writeRedirects = exports.writeRobots = exports.hasHandle = exports.hasSlug = exports.nestedHandles = exports.traverseParents = exports.wrapper = exports.isDevelopment = void 0
const fs = require("fs")
const jsonfile = require("jsonfile")
const http_proxy_middleware_1 = require("http-proxy-middleware")
exports.isDevelopment =
  (process.env.GATSBY_ACTIVE_ENV || process.env.NODE_ENV || "development") === "development"
exports.wrapper = promise =>
  promise.then(result => {
    if (result.errors) {
      throw result.errors
    }
    return result
  })
exports.traverseParents = node => {
  let handles = []
  if (node.parent) handles.push(...exports.traverseParents(node.parent))
  handles.push(node.shopify.handle)
  return handles
}
exports.nestedHandles = node => exports.traverseParents(node).join("/") || node.shopify.handle
exports.hasSlug = node => node && node.slug && node.slug.current
exports.hasHandle = node => node && node.handle && node.handle.current
exports.writeRobots = data =>
  __awaiter(this, void 0, void 0, function*() {
    if (data.length > -1) {
      try {
        if (data[0].hasOwnProperty("content")) {
          yield fs.writeFileSync("./static/robots.txt", data[0].content.code)
        }
      } catch (err) {
        console.error(err)
      }
    }
  })
exports.writeRedirects = (config, firebase, file, data, createRedirect, gatsbyFile = false) =>
  __awaiter(this, void 0, void 0, function*() {
    if (firebase && data.length) {
      const defaultRedirects = config.settings.defaultRedirects
      const sanityRedirects = data
        .filter(({ node }) => node.source && node.destination && node.type)
        .map(({ node }) => ({
          source: node.source,
          destination: node.destination,
          type: parseInt(node.type),
        }))
      const finalRedirects = [...defaultRedirects, ...sanityRedirects].filter(
        (v, i, a) => a.findIndex(t => t.source === v.source) === i,
      )
      finalRedirects.map(item =>
        createRedirect({ fromPath: item.source, toPath: item.destination, statusCode: item.type }),
      )
      const newConfig = Array.isArray(firebase.hosting)
        ? Object.assign(
            Object.assign(
              {},
              firebase.hosting.filter(site => site.public.includes("app/public"))[0],
            ),
            { redirects: finalRedirects },
          )
        : Object.assign(Object.assign({}, firebase.hosting), { redirects: finalRedirects })
      yield jsonfile.writeFileSync(
        file,
        Object.assign(Object.assign({}, firebase), {
          hosting: Array.isArray(firebase.hosting)
            ? [...firebase.hosting.filter(site => !site.public.includes("app/public")), newConfig]
            : newConfig,
        }),
        { spaces: 2 },
      )
      if (gatsbyFile)
        yield jsonfile.writeFileSync(
          gatsbyFile,
          {
            hosting: Object.assign({}, newConfig),
          },
          { spaces: 2 },
        )
    }
  })
exports.writeProducts = (config, data, template, createPage) => {
  if (exports.isDevelopment && config.queries.products.devPageLimit > 0)
    data = data.slice(0, config.queries.products.devPageLimit)
  if (config.queries.products.hidden)
    data = data.filter(
      ({ node }) =>
        node &&
        node.handle &&
        (!node.tags ||
          (node.tags && !node.tags.find(tag => tag === config.queries.products.hidden))),
    )
  data = data.filter(({ node }) => node && !node.deleted)
  data.forEach(({ node }) => {
    var _a, _b, _c, _d, _e
    createPage(
      {
        path: `${(_a = config.settings) === null || _a === void 0 ? void 0 : _a.routes.PRODUCT}/${
          node.handle
        }`,
        component: template,
        context: {
          handle: node.handle,
          parentQuery: `${
            (_c =
              (_b = config === null || config === void 0 ? void 0 : config.queries) === null ||
              _b === void 0
                ? void 0
                : _b.products) === null || _c === void 0
              ? void 0
              : _c.parentTagPrefix
          }:${node.handle}`,
          siblingQuery: `${
            (_e =
              (_d = config === null || config === void 0 ? void 0 : config.queries) === null ||
              _d === void 0
                ? void 0
                : _d.products) === null || _e === void 0
              ? void 0
              : _e.siblingTagPrefix
          }:${node.handle}`,
          groupQuery1:
            node.tags.find(tag => {
              var _a, _b
              return tag === null || tag === void 0
                ? void 0
                : tag.includes(
                    (_b =
                      (_a = config === null || config === void 0 ? void 0 : config.queries) ===
                        null || _a === void 0
                        ? void 0
                        : _a.products) === null || _b === void 0
                      ? void 0
                      : _b.groupTagPrefix1,
                  )
            }) || "",
          groupQuery2:
            node.tags.find(tag => {
              var _a, _b
              return tag === null || tag === void 0
                ? void 0
                : tag.includes(
                    (_b =
                      (_a = config === null || config === void 0 ? void 0 : config.queries) ===
                        null || _a === void 0
                        ? void 0
                        : _a.products) === null || _b === void 0
                      ? void 0
                      : _b.groupTagPrefix2,
                  )
            }) || "",
        },
      },
      true,
    )
  })
}
exports.writeCollections = (config, data, template, createPage) => {
  if (exports.isDevelopment && config.queries.collections.devPageLimit > 0)
    data = data.slice(0, config.queries.collections.devPageLimit)
  if (config.queries.collections.hidden)
    data = data.filter(({ node }) => {
      var _a
      return (
        node &&
        ((_a = node === null || node === void 0 ? void 0 : node.shopify) === null || _a === void 0
          ? void 0
          : _a.handle) &&
        (!node.tags ||
          (node.tags && !node.tags.find(tag => tag === config.queries.collections.hidden)))
      )
    })
  data = data.filter(({ node }) => node && !node.deleted)
  data.forEach(({ node }) => {
    var _a
    createPage(
      {
        path: `${
          (_a = config.settings) === null || _a === void 0 ? void 0 : _a.routes.COLLECTION
        }/${exports.nestedHandles(node)}`,
        component: template,
        context: {
          handle: node.shopify.handle,
        },
      },
      true,
    )
  })
}
exports.writeDocument = (url, data, template, createPage) =>
  data.forEach(({ node }) => {
    var _a, _b
    createPage(
      {
        path: `${url}/${((_a = node === null || node === void 0 ? void 0 : node.handle) === null ||
        _a === void 0
          ? void 0
          : _a.current) ||
          ((_b = node === null || node === void 0 ? void 0 : node.slug) === null || _b === void 0
            ? void 0
            : _b.current)}`,
        component: template,
        context: {
          id: node._id,
        },
      },
      true,
    )
  })
exports.proxyMiddleware = (config, from, to) =>
  http_proxy_middleware_1.createProxyMiddleware({
    target: "http://localhost:5001",
    pathRewrite: {
      [`${from}`]: `/${config.services.firebase.projectId}/${config.services.firebase.region}/${to}`,
    },
  })
exports.proxyUrl = (config, to) =>
  `http://localhost:5001/${config.services.firebase.projectId}/${config.services.firebase.region}/${to}`
exports.buildManifestConfig = config => ({
  start_url: `/`,
  name: config.app.title,
  short_name: config.app.title,
  description: config.app.description,
  background_color: config.app.themeBackground,
  theme_color: config.app.themeColor,
  display: config.app.themeDisplay,
  icon: config.app.themeIcon,
  icons: [
    {
      src: config.app.themeIcon,
      sizes: "196x196",
      type: "image/png",
      purpose: "any maskable",
    },
  ],
})
exports.buildShopifyConfig = config => ({
  shopName: config.services.shopify.defaultShopName,
  accessToken: config.stores[config.services.shopify.defaultShopName].accessToken,
  apiVersion: config.services.shopify.apiVersion,
  paginationSize: parseInt(config.services.shopify.paginationSize, 10),
  verbose: true,
})
exports.buildShopifyIncrementalConfig = config => ({
  myshopifyDomain: `${config.services.shopify.defaultShopName}.myshopify.com`,
  adminAccessToken: config.stores[config.services.shopify.defaultShopName].adminAccessToken,
  storefrontAccessToken: config.stores[config.services.shopify.defaultShopName].accessToken,
  storefrontShopDomain: `${config.services.shopify.defaultShopName}.myshopify.com`,
  shopifyPlus: config.stores[config.services.shopify.defaultShopName].shopifyPlus,
  apiVersion: config.services.shopify.apiVersion,
  includePages: false,
  includeBlogs: false,
})
exports.buildSanityConfig = config =>
  Object.assign(
    {
      projectId: config.services.sanity.projectId,
      dataset: config.stores[config.services.shopify.defaultShopName].sanityDataset,
    },
    exports.isDevelopment && {
      token: config.services.sanity.token,
      overlayDrafts: true,
      watchMode: true,
    },
  )
exports.buildSearchConfig = config => ({
  url: `${config.services.reactify.searchConfig}?shop=${config.services.shopify.defaultShopName}.myshopify.com`,
  name: `Search`,
  payloadKey: `body`,
})
//# sourceMappingURL=index.js.map
