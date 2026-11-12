import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const rootNode = document.getElementById('root')
let nextNumber = 1

function Ticket() {
  const number = nextNumber
  nextNumber = nextNumber + 1
  console.log('Ticket 렌더: 번호표 ' + number)
  return <li>번호표 {number}</li>
}

// 관찰용 코드(React 기능 아님): #root 안의 DOM이 바뀌면 화면에 보이는 번호표를 찍습니다.
new MutationObserver(() => {
  const shown = [...rootNode.querySelectorAll('li')].map((li) => li.textContent)
  console.log('화면: ' + JSON.stringify(shown))
}).observe(rootNode, { childList: true, subtree: true, characterData: true })

createRoot(rootNode).render(
  <StrictMode>
    <ul>
      <Ticket />
      <Ticket />
      <Ticket />
    </ul>
  </StrictMode>,
)
