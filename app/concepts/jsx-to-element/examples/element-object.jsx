import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

function Greeting({ name }) {
  console.log('Greeting 호출: ' + name)
  return <h1>안녕, {name}</h1>
}

const fromJsx = <Greeting name="민지" />
const fromCall = createElement(Greeting, { name: '민지' })

console.log(typeof fromJsx, fromJsx.type === Greeting)
console.log(JSON.stringify(fromJsx.props))
console.log(JSON.stringify(fromCall.props))
console.log(fromJsx === fromCall)

createRoot(document.getElementById('root')).render(fromJsx)
