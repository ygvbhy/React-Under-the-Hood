import { createRoot } from 'react-dom/client'

// 실제 코드에서는 컴포넌트 안에서 useRef로 ref를 만듭니다. 여기서는 컴포넌트 밖이라 ref 객체의 모양만 흉내 냈습니다.
const inputRef = { current: null }
const field = <input key="q" ref={inputRef} placeholder="검색" />

console.log(field.key)
console.log(JSON.stringify(Object.keys(field.props)))
console.log(field.props.ref === inputRef)

createRoot(document.getElementById('root')).render(field)
