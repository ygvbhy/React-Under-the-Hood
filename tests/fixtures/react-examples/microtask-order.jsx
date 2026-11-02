import { useEffect, useLayoutEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  const [n, setN] = useState(0)
  console.log('render', n)
  useLayoutEffect(() => {
    console.log('layout', n)
  })
  useEffect(() => {
    console.log('effect', n)
  })

  function handleClick() {
    Promise.resolve().then(() => console.log('microtask'))
    setTimeout(() => console.log('timeout'), 0)
    setN((v) => v + 1)
    console.log('handler end')
  }

  return <button onClick={handleClick}>{n}</button>
}

createRoot(document.getElementById('root')).render(<App />)
