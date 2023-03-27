/**
 * DOM要素を画面内どこへでも移動できるようにする
 *
 * @param {HTMLElement} el
 */
export default (el: HTMLElement) => {
  el.addEventListener('mousedown', e => {
    let shiftX = e.clientX - el.getBoundingClientRect().left
    let shiftY = e.clientY - el.getBoundingClientRect().top

    const moveAt = (x: number, y: number) => {
      el.style.left = x - shiftX + 'px'
      el.style.top = y - shiftY + 'px'
    }
    const onMouseMove = (e: MouseEvent) => moveAt(e.pageX, e.pageY)

    document.addEventListener('mousemove', onMouseMove)
    el.onmouseup = function () {
      document.removeEventListener('mousemove', onMouseMove)
      el.onmouseup = null
    }
  })
}
