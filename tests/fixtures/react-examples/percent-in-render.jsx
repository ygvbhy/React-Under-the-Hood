import { createRoot } from 'react-dom/client'

function App() {
  console.log('50%')
  return <p>hi</p>
}

createRoot(document.getElementById('root')).render(<App />)
