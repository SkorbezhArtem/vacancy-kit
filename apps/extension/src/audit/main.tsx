import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/content/styles.css'
import { AuditApp } from './AuditApp'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<AuditApp />)
}
