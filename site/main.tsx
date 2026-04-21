import * as React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from '@/site/app'
import '@/site/styles.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
