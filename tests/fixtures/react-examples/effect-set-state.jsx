import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  const [ready, setReady] = useState(false)
  console.log('render', ready)
  useEffect(() => {
    console.log('effect', ready)
    if (!ready) setReady(true)
  }, [ready])
  return <p>{String(ready)}</p>
}

createRoot(document.getElementById('root')).render(<App />)
console.log('sync end')
