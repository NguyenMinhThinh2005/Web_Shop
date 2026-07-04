import { X } from 'lucide-react'

function AdminModal({ title, children, onClose, footer }) {
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <section className="admin-modal" role="dialog" aria-modal="true">
        <header className="admin-modal__header">
          <h2>{title}</h2>
          <button
            type="button"
            className="admin-icon-button"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </header>
        <div className="admin-modal__body">{children}</div>
        {footer ? <footer className="admin-modal__footer">{footer}</footer> : null}
      </section>
    </div>
  )
}

export default AdminModal
