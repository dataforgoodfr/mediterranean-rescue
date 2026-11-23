import { Route, Routes } from 'react-router'
import { Design } from './pages/Design'
import { Home } from './pages/Home'
import { NotFound } from '@/pages/NotFound'
import { DevOnly } from '@/guards/DevOnly'

// Les pages du site. Une page de plus : un fichier dans pages/ et une ligne ici.
// https://reactrouter.com/start/declarative/routing
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/design"
        element={
          <DevOnly>
            <Design />
          </DevOnly>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
