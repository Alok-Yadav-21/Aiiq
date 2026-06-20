/**
 * AllQ Custom Server
 * Runs Next.js + WebSocket server concurrently
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`\n🚀 AllQ is running!`)
      console.log(`   App:       http://${hostname}:${port}`)
      console.log(`   Env:       ${dev ? 'development' : 'production'}`)
      console.log(`\n   Run WebSocket server separately:`)
      console.log(`   node server/ws-server.js\n`)
    })
})
