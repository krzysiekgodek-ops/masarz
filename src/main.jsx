import React from 'react'
import ReactDOM from 'react-dom/client'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './index.css'
import App from './App'
import SuccessPage from './components/SuccessPage'

// Hook do obsługi PWA prompt
function usePWAPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
    registration,
  } = useRegisterSW({
    onNeedRefresh() {
      // Pokazujemy prompt gdy jest dostępna nowa wersja
      if (confirm('Dostępna jest nowa wersja aplikacji. Odświeżyć?')) {
        updateServiceWorker(true)
      }
    },
    onOfflineReady() {
      console.log('Aplikacja gotowa do pracy offline')
    },
    onRegisterError(error) {
      console.error('Błąd rejestracji SW:', error)
    },
  })

  return { offlineReady, needRefresh, updateServiceWorker, registration }
}

// Komponent wyświetlający prompt "Dodaj do ekranu głównego"
function PWAInstallPrompt() {
  const { offlineReady, needRefresh, updateServiceWorker, registration } = usePWAPrompt()
  const [showPrompt, setShowPrompt] = React.useState(false)

  React.useEffect(() => {
    // Sprawdź czy można pokazać prompt (beforeinstallprompt)
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      // Zachowujemy event, żeby użyć go później do instalacji
      window.deferredPrompt = e
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!window.deferredPrompt) return
    
    window.deferredPrompt.prompt()
    const { outcome } = await window.deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('Użytkownik zainstalował aplikację')
    }
    
    window.deferredPrompt = null
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Zainstaluj aplikację</p>
            <p className="text-sm text-gray-500">Dodaj do ekranu głównego</p>
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Instaluj
        </button>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {window.location.pathname === '/success' ? <SuccessPage /> : <App />}
    <PWAInstallPrompt />
  </React.StrictMode>
)
