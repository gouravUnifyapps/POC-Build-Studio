import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { I18nProvider } from '@/lib/i18n'
import Login from '@/routes/Login'
import ForgotPassword from '@/routes/ForgotPassword'
import UpdatePassword from '@/routes/UpdatePassword'
import { OrbitProvider } from '@/orbit/lib/context'
import { Shell } from '@/orbit/Shell'
import Home from '@/orbit/views/Home'
import PocPage from '@/orbit/views/PocPage'
import SkillsPage from '@/orbit/views/skills/SkillsPage'
import '@/orbit/ds/tokens.css'
import '@/orbit/ds/bundle.css'
import '@/orbit/orbit.css'

// BrowserRouter (clean URLs, no #). The mount path is never hardcoded here — the engine
// bakes it in as Vite's `base` (VITE_APP_BASE, see vite.config.ts) and the app reads it
// back as BASE_URL, so one value covers every slot it serves. A deploy build bakes '/'
// (the app's domain root → basename normalizes to undefined = root); a preview slot bakes
// its /agent-api/… path. The trailing slash goes because react-router rejects '/a/b'
// against basename '/a/b/'.
const APP_BASE = import.meta.env.BASE_URL
const basename = (APP_BASE.startsWith('/') ? APP_BASE.replace(/\/+$/, '') : '') || undefined

/** Orbit · POC Studio: the shell and its screens, reading the app's objects. */
function Orbit() {
  return (
    <OrbitProvider>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/waiting" element={<Navigate to="/" replace />} />
          <Route path="/pocs/:pocId" element={<PocPage />} />
          <Route path="/feedback" element={<Navigate to="/skills" replace />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Shell>
    </OrbitProvider>
  )
}

// I18nProvider wraps the router, not main.tsx: main.tsx is engine-owned. It stays mounted
// whether or not this app is translated, because it owns <html lang/dir> (what makes the
// `ltr:`/`rtl:` Tailwind variants work at all), Radix's direction context, and the locale
// every `useFormatters()` date/number/currency is rendered in. Translation is opt-in on top
// of it — see src/lib/i18n.
export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="*" element={<Orbit />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
