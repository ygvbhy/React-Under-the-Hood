import { useState } from 'react'
import { createRoot } from 'react-dom/client'

const rootNode = document.getElementById('root')

function Title() {
  console.log('Title 렌더')
  return <h1>카운터</h1>
}

function Counter() {
  const [count, setCount] = useState(0)
  const shown = rootNode.querySelector('output')?.textContent ?? '없음'
  console.log('Counter 렌더: count ' + count + ', 화면 ' + shown)
  return (
    <>
      <output>{count}</output>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </>
  )
}

function App() {
  console.log('App 렌더')
  return (
    <main>
      <Title />
      <Counter />
    </main>
  )
}

// 관찰용 코드(React 기능 아님): #root 안의 DOM이 바뀌면 바뀐 요소의 이름을 찍습니다.
new MutationObserver((records) => {
  const changed = records.map((r) => {
    const node = r.target.nodeType === Node.TEXT_NODE ? r.target.parentNode : r.target
    return node.id ? '#' + node.id : node.nodeName.toLowerCase()
  })
  console.log('DOM 변경: ' + JSON.stringify([...new Set(changed)]))
}).observe(rootNode, { childList: true, subtree: true, characterData: true })

createRoot(rootNode).render(<App />)
