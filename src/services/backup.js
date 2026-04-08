const STORAGE_KEY = 'we_hub_v4'
const LAST_BACKUP_KEY = 'we_hub_last_backup'

export function exportData() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return

  const data = JSON.parse(raw)
  const backup = {
    exportedAt: new Date().toISOString(),
    version: '1',
    storageKey: STORAGE_KEY,
    data,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().split('T')[0]
  a.href = url
  a.download = `dashboard-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result)
        if (!backup.data || !backup.version) {
          reject(new Error('Invalid backup file'))
          return
        }

        // Merge: read existing, overlay with backup data (skip missing keys)
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
        const merged = { ...existing }
        for (const [key, value] of Object.entries(backup.data)) {
          if (value !== undefined) merged[key] = value
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        resolve()
      } catch {
        reject(new Error('Invalid backup file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function getLastBackup() {
  return localStorage.getItem(LAST_BACKUP_KEY)
}

export function daysSinceBackup() {
  const last = getLastBackup()
  if (!last) return Infinity
  return Math.floor((Date.now() - new Date(last).getTime()) / 86400000)
}
