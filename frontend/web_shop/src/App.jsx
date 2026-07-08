import { BrowserRouter } from 'react-router-dom'
import { CustomerAuthProvider } from './context/CustomerAuthContext'
import AppRouter from './router/AppRouter'
import './styles/tokens.css'
import './styles/public.css'
import './styles/admin.css'

function App() {
  return (
    <BrowserRouter>
      <CustomerAuthProvider>
        <AppRouter />
      </CustomerAuthProvider>
    </BrowserRouter>
  )
}

export default App
