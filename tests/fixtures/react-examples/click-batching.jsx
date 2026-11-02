import { useState } from 'react'
import { createRoot } from 'react-dom/client'

function Counter() {
  const [count, setCount] = useState(0)
  console.log('render', count)

  function handleClick() {
    setCount(count + 1)
    setCount(count + 1)
    console.log('clicked', count)
  }

  return <button onClick={handleClick}>{count}</button>
}

createRoot(document.getElementById('root')).render(<Counter />)
