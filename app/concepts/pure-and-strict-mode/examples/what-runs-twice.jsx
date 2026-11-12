import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'

function Counter() {
  console.log('Counter 본문')
  const [count, setCount] = useState(() => {
    console.log('초기값 함수')
    return 0
  })

  function handleClick() {
    console.log('클릭 핸들러')
    setCount(count + 1)
  }

  return <button onClick={handleClick}>{count}</button>
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Counter />
  </StrictMode>,
)
