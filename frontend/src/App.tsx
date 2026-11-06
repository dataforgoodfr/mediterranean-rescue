import { Route, Routes } from 'react-router'
import { Home } from './pages/Home'

// Les pages du site. Une page de plus : un fichier dans pages/ et une ligne ici.
// https://reactrouter.com/start/declarative/routing
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

export default App
