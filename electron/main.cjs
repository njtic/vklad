const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

const DATA_FILE_NAME = 'deposits.json'

function getDataFilePath() {
  return path.join(app.getPath('userData'), DATA_FILE_NAME)
}

async function readDepositsState() {
  try {
    const raw = await fs.readFile(getDataFilePath(), 'utf8')
    return JSON.parse(raw)
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null
    }

    throw error
  }
}

async function writeDepositsState(state) {
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(getDataFilePath(), JSON.stringify(state, null, 2), 'utf8')
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    title: 'Vklad Tracker',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  void window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  ipcMain.handle('deposits:load', readDepositsState)
  ipcMain.handle('deposits:save', async (_event, state) => {
    await writeDepositsState(state)
    return true
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
