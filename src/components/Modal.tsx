import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  labelledBy?: string
}

export function Modal({ title, onClose, children, labelledBy = 'modal-title' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={labelledBy}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <div className="modal__card">
        <div className="modal__heading">
          <h2 id={labelledBy}>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Lukk">×</button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
