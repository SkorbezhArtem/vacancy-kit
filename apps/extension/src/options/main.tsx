import React from 'react'
import ReactDOM from 'react-dom/client'
import { Options } from './Options'
import '@/styles/globals.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
)
