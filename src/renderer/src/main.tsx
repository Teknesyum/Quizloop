import '@fontsource/atkinson-hyperlegible-next/400.css'
import '@fontsource/atkinson-hyperlegible-next/600.css'
import '@fontsource/cascadia-mono/400.css'
import '@fontsource/cascadia-mono/600.css'
import 'katex/dist/katex.min.css'
import '../../../teknesyum-ui/css/theme.css'
import '../../../teknesyum-ui/css/a11y.css'
import '../../../teknesyum-ui/css/forms.css'
import '../../../teknesyum-ui/css/states.css'
import './styles/app.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
