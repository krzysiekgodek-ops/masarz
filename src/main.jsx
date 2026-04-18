import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import SuccessPage from './components/SuccessPage'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {window.location.pathname === '/success' ? <SuccessPage /> : <App />}
  </React.StrictMode>
)
