import { useEffect, useState, type RefObject } from 'react'

export default function useFooterOverlap(reference: RefObject<HTMLElement | null>) {
  const [overlap, toggle] = useState(false)

  useEffect(() => {
    const update = () => {
      const target = reference.current
      const footer = document.querySelector('footer')

      if (target && footer) {
        const targetBottom = target.getBoundingClientRect().bottom
        const footerTop = footer.getBoundingClientRect().top
        toggle(targetBottom > footerTop)
      } else {
        toggle(false)
      }
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(document.body)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      resizeObserver.disconnect()
    }
  }, [reference])

  return overlap
}
