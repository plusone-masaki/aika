/**
 * DOM要素を画面内どこへでも移動できるようにする
 *
 * @param {HTMLElement} el
 */
export default (el: HTMLElement) => {
  el.addEventListener('mousedown', e => {
    // 対象のDOMの端とクリックポイントの差分を保持
    const shiftX = e.clientX - el.getBoundingClientRect().left
    const shiftY = e.clientY - el.getBoundingClientRect().top

    const moveAt = (x: number, y: number) => {
      el.style.left = x - shiftX + 'px'
      el.style.top = y - shiftY + 'px'
    }
    const onMouseMove = (e: MouseEvent) => moveAt(e.pageX, e.pageY)
    const onMouseUp = () => document.removeEventListener('mousemove', onMouseMove)

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  })
}
