/** Report the poster's real layout heights so overflow can be attributed. */
const WebSocket = require('ws')
const { spawn } = require('child_process')
const http = require('http')

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9344
const URL_ = process.argv[2]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const getJSON = (u) => new Promise((res, rej) => {
  http.get(u, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)) } catch (e) { rej(e) } }) }).on('error', rej)
})

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:/Users/ALOKYA~1/AppData/Local/Temp/aiiq-layout-profile',
    '--window-size=2245,3179', 'about:blank',
  ], { stdio: 'ignore' })

  let ver = null
  for (let i = 0; i < 60; i++) { try { ver = await getJSON(`http://127.0.0.1:${PORT}/json/version`); break } catch { await sleep(500) } }
  if (!ver) { chrome.kill(); throw new Error('devtools endpoint never came up') }

  const ws = new WebSocket(ver.webSocketDebuggerUrl, { perMessageDeflate: false })
  await new Promise((r) => ws.on('open', r))
  let id = 0; const pending = new Map()
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString())
    if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result) }
  })
  const send = (method, params = {}, sid) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params, sessionId: sid })) })

  const { targetInfos } = await send('Target.getTargets')
  const page = targetInfos.find((t) => t.type === 'page')
  const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)
  await send('Emulation.setDeviceMetricsOverride', { width: 2245, height: 3179, deviceScaleFactor: 1, mobile: false }, sessionId)
  await send('Page.navigate', { url: URL_ }, sessionId)
  await sleep(9000)

  const expr = `(() => {
    const mm = 594 / 2245;
    const poster = document.querySelector('.poster');
    const body = document.querySelector('.body');
    const foot = document.querySelector('footer');
    const head = document.querySelector('header');
    const rows = [...body.children].map((el, i) => ({
      i, cls: el.className.slice(0, 26),
      h: +(el.getBoundingClientRect().height * mm).toFixed(1),
      label: (el.querySelector('h2') ? el.querySelector('h2').textContent : (el.querySelector('h2, .card h2') || {}).textContent) || ''
    }));
    const sum = rows.reduce((a, r) => a + r.h, 0);
    return JSON.stringify({
      posterScroll: +(poster.scrollHeight * mm).toFixed(1),
      posterClient: +(poster.clientHeight * mm).toFixed(1),
      header: +(head.getBoundingClientRect().height * mm).toFixed(1),
      bodyH: +(body.getBoundingClientRect().height * mm).toFixed(1),
      bodyScroll: +(body.scrollHeight * mm).toFixed(1),
      footer: +(foot.getBoundingClientRect().height * mm).toFixed(1),
      rowsSum: +sum.toFixed(1),
      rows
    }, null, 1);
  })()`
  const { result } = await send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId)
  console.log(result.value)

  ws.close(); chrome.kill()
}
main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
