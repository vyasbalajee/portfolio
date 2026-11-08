import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ChatProvider } from './chat/Chat'
import Footer from './components/Footer'
import Header from './components/Header'
import CaseStudy from './pages/CaseStudy'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

// Loaded on demand so the 3D engine never slows down the quick view.
const World = lazy(() => import('./world/World'))

function ScrollManager() {
  const { key, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [key, hash])

  return null
}

export default function App() {
  const { pathname } = useLocation()

  return (
    <ChatProvider showLauncher={pathname !== '/world'}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollManager />
      <Header />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work/:slug" element={<CaseStudy />} />
          <Route
            path="/world"
            element={
              <Suspense fallback={<p className="world-loading">Raising the kingdom…</p>}>
                <World />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {pathname !== '/world' && <Footer />}
    </ChatProvider>
  )
}
