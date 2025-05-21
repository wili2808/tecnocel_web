import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import ProductCatalog from './pages/ProductCatalog';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/uniformes-escolares" element={<Layout><ProductCatalog /></Layout>} />
            {/* Agrega otras rutas aquí envolviéndolas también con <Layout> */}
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
