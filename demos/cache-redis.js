const CacheManager = require('cache-manager')
const redisStore = require('cache-manager-ioredis')
const redisCache = CacheManager.caching({
  store: redisStore,
  db: 0,
  host: 'localhost',
  port: 6379,
  ttl: 30
})

const gateway = require('fastify')({})
gateway.register(require('./../src/plugins/cache'), {
  stores: [redisCache]
})
gateway.register(require('fastify-reply-from'))
gateway.register(require('./../index'), {

  routes: [{
    prefix: '/api',
    target: 'http://localhost:3000'
  }]
})

gateway.listen(8080).then((address) => {
  console.log(`API Gateway listening on ${address}`)
})

const service = require('restana')({})
service.get('/numbers', (req, res) => {
  res.setHeader('x-cache-timeout', '1 hour') // a cache entry will be created for key: "GET/api/numbers"
  setTimeout(() => {
    res.send([
      1, 2, 3
    ])
  }, 100)
})

service.patch('/numbers', (req, res) => {
  res.setHeader('x-cache-expire', '*/numbers') // cache expire pattern will match: "GET/api/numbers"
  res.send(200)
})

service.start(3000).then(() => {
  console.log('Remote service listening on port 3000')
})
