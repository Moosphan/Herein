const { BrowserWindow, session } = require('electron')
const { randomUUID } = require('node:crypto')

// Acceptance illustrations are assets, not full-canvas storyboard screenshots.
async function captureTransparentMaterial(svg, viewport) {
  const isolated = session.fromPartition(`acceptance-material-${randomUUID()}`, { cache: false })
  isolated.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  isolated.setPermissionCheckHandler(() => false)
  isolated.webRequest.onBeforeRequest((details, callback) =>
    callback({ cancel: !details.url.startsWith('data:') }),
  )
  const window = new BrowserWindow({
    show: false,
    transparent: true,
    backgroundColor: '#00000000',
    ...viewport,
    useContentSize: true,
    webPreferences: {
      session: isolated,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      javascript: false,
      webSecurity: true,
      offscreen: true,
      backgroundThrottling: false,
    },
  })
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  const timeout = setTimeout(() => window.destroy(), 20000)
  try {
    const document = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><style>html,body{margin:0;background:transparent;width:${viewport.width}px;height:${viewport.height}px;overflow:hidden}img{display:block;width:100%;height:100%}</style></head><body><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body></html>`
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(document)}`)
    await new Promise((resolve) => setTimeout(resolve, 80))
    const image = await window.webContents.capturePage({ x: 0, y: 0, ...viewport })
    if (image.isEmpty()) throw new Error('Acceptance material capture is empty')
    return image.resize(viewport).toPNG()
  } finally {
    clearTimeout(timeout)
    if (!window.isDestroyed()) window.destroy()
  }
}

module.exports = { captureTransparentMaterial }
