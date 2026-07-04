import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router/AppRouter'
import './styles/tokens.css'
import './styles/public.css'
import './styles/admin.css'

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

export default App
