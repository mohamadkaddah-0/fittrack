import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LogWorkoutPage from './pages/LogWorkoutPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"    element={<HomePage />} />
        <Route path="/log" element={<LogWorkoutPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App