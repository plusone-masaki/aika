/**
 * クリックの透過処理
 */
export default (el: HTMLElement) => {
  el.addEventListener('mouseenter', () => window.system.clickThrough(false))
  el.addEventListener('mouseleave', () => window.system.clickThrough(true))
}
