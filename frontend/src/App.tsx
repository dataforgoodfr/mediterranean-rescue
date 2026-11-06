import { Route, Routes } from 'react-router'
import { Accueil } from './pages/Accueil'

// Les pages du site. Une page de plus : un fichier dans pages/ et une ligne ici.
// https://reactrouter.com/start/declarative/routing
function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
    </Routes>
  )
}

export default App
