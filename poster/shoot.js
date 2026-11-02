/**
 * High-resolution screenshot capture for the AIIQ poster.
 *
 * Drives headless Chrome over the DevTools Protocol so we can (a) inject the
 * auth cookie for signed-in pages and (b) capture at deviceScaleFactor 2 —
 * the editor preview pane downscales to ~800px, which is too coarse for print.
 *
 * Usage: node shoot.js <outDir> <token|-> <name=path> [name=path ...]
 */
const WebSocket = require('ws')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const http = require('http')

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333
const VIEW = { width: 1100, height: 1430, scale: 2 } // portrait, matches poster frame ratio

const [outDir, token, ...pairs] = process.argv.slice(2)
const targets = pairs.map((p) => {
  const i = p.indexOf('=')
  return { name: p.slice(0, i), url: p.slice(i + 1) }
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = ''
      res.on('data', (c) => (d += c))
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })

  // Short, space-free profile path — Chrome fails to start the debugging
  // endpoint when the profile path contains spaces on this machine.
  const userDataDir = 'C:/Users/ALOKYA~1/AppData/Local/Temp/aiiq-shot-profile'
  try { fs.rmSync(userDataDir, { recursive: true, force: true }) } catch {}
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${VIEW.width},${VIEW.height}`,
    'about:blank',
  ], { stdio: 'ignore', detached: false })

  // Wait for the debugging endpoint to answer.
  let ver = null
  for (let i = 0; i < 60; i++) {
    try { ver = await getJSON(`http://127.0.0.1:${PORT}/json/version`); break } catch { await sleep(500) }
  }
  if (!ver) { chrome.kill(); throw new Error('Chrome DevTools endpoint never came up') }

  const ws = new WebSocket(ver.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 })
  await new Promise((r) => ws.on('open', r))

  let id = 0
  const pending = new Map()
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString())
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
    }
  })
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const mid = ++id
      pending.set(mid, { resolve, reject })
      ws.send(JSON.stringify({ id: mid, method, params, sessionId }))
    })

  // Attach to the blank tab.
  const { targetInfos } = await send('Target.getTargets')
  const page = targetInfos.find((t) => t.type === 'page')
  const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true })

  await send('Page.enable', {}, sessionId)
  await send('Network.enable', {}, sessionId)
  await send('Emulation.setDeviceMetricsOverride', {
    width: VIEW.width, height: VIEW.height,
    deviceScaleFactor: VIEW.scale, mobile: false,
  }, sessionId)

  if (token && token !== '-') {
    const origin = new URL(targets[0].url).origin
    // Establish the origin before setting the cookie, and scope it with `url`.
    // Setting it on about:blank left the first navigation unauthenticated.
    await send('Page.navigate', { url: origin }, sessionId)
    await sleep(2500)
    await send('Network.setCookie', {
      name: 'allq_token', value: token, url: origin,
      domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax',
    }, sessionId)
    const { cookies } = await send('Network.getCookies', { urls: [origin] }, sessionId)
    const ok = cookies.some((c) => c.name === 'allq_token' && c.value === token)
    console.log(`auth cookie installed: ${ok ? 'yes' : 'NO'}`)
    if (!ok) throw new Error('auth cookie was not accepted by the browser')

    // The client reads the signed-in user from a zustand store persisted in
    // localStorage (written by login()), not from the cookie. Without seeding
    // it the API is authenticated but the chrome still renders logged-out.
    const seed = process.env.SEED_AUTH_B64
    if (seed) {
      const user = Buffer.from(seed, 'base64').toString('utf8')
      const persisted = JSON.stringify({ state: { user: JSON.parse(user), token: null }, version: 0 })
      await send('Page.addScriptToEvaluateOnNewDocument', {
        source: `try{localStorage.setItem('allq-auth', ${JSON.stringify(persisted)})}catch(e){}`,
      }, sessionId)
      console.log('auth store seeded: yes')
    }
  }

  for (const t of targets) {
    process.stdout.write(`capturing ${t.name} … `)
    // First visit warms the dev-server route compile and the data cache; the
    // reload is the one we actually capture, so nothing is still spinning.
    await send('Page.navigate', { url: t.url }, sessionId)
    await sleep(8000)
    await send('Page.reload', { ignoreCache: false }, sessionId)
    // Let it hydrate, fetch and settle entry animations before grabbing.
    await sleep(Number(process.env.SHOT_WAIT_MS || 12000))
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId)
    const file = path.join(outDir, `${t.name}.png`)
    fs.writeFileSync(file, Buffer.from(data, 'base64'))
    const kb = (fs.statSync(file).size / 1024).toFixed(0)
    console.log(`${kb} KB`)
  }

  ws.close()
  chrome.kill()
  await sleep(600)
  try { fs.rmSync(userDataDir, { recursive: true, force: true }) } catch {}
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
