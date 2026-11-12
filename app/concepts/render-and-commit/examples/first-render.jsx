import { createRoot } from 'react-dom/client'

const rootNode = document.getElementById('root')

function Title() {
  console.log('Title 렌더')
  return <h1>카운터</h1>
}

function Count() {
  console.log('Count 렌더')
  return <output>0</output>
}

function App() {
  console.log('App 렌더, #root 자식 수: ' + rootNode.childNodes.length)
  return (
    <main>
      <Title />
      <Count />
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
console.log('render 호출 직후, #root 자식 수: ' + rootNode.childNodes.length)
