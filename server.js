/**
 * AIIQ Custom Server
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
      console.log(`\n🚀 AIIQ is running!`)
      console.log(`   App:       http://${hostname}:${port}`)
      console.log(`   Env:       ${dev ? 'development' : 'production'}`)

      // Live quiz rooms need the realtime server. Starting it here means one
      // command boots the whole product — previously Compete silently failed
      // because nothing ever ran the websocket server by hand.
      if (process.env.DISABLE_WS === '1') {
        console.log('   Realtime:  disabled (DISABLE_WS=1)\n')
        return
      }
      try {
        require('./server/ws-server.js')
      } catch (err) {
        // A missing realtime server must not take the whole app down —
        // everything except live rooms keeps working without it.
        console.warn('   Realtime:  failed to start — live rooms unavailable')
        console.warn(`              ${err.message}\n`)
      }
    })
})
