import { createRoot } from 'react-dom/client'

const card = (
  <section className="card">
    <h2>제목</h2>
    본문
  </section>
)

console.log(card.type, card.props.className)
console.log(Array.isArray(card.props.children), card.props.children.length)
console.log(card.props.children[0].type, card.props.children[0].props.children)
console.log(typeof card.props.children[1])

createRoot(document.getElementById('root')).render(card)
