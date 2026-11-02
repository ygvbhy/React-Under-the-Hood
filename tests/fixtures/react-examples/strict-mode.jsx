import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  console.log('render')
  useEffect(() => {
    console.log('effect')
    return () => console.log('cleanup')
  }, [])
  return <p>hi</p>
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
console.log('after render call')
