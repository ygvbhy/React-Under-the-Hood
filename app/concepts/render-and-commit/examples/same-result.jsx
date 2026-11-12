import { useState } from 'react'
import { createRoot } from 'react-dom/client'

const rootNode = document.getElementById('root')

function Status() {
  const [clicks, setClicks] = useState(0)
  console.log('Status 렌더: clicks ' + clicks)
  return (
    <main>
      <p>{clicks === 0 ? '아직 안 눌렀어요' : '눌렀어요'}</p>
      <button onClick={() => setClicks(clicks + 1)}>누르기</button>
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

createRoot(rootNode).render(<Status />)
