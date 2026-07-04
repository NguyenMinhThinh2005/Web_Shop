import { useState } from 'react'
import { NotebookPen, Save } from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { getApiErrorMessage } from '../../api/apiError'

function InternalNotePanel({ order, onUpdated, onMessage }) {
  const [internalNote, setInternalNote] = useState(
    () => order.internalNote || '',
  )
  const [saving, setSaving] = useState(false)

  async function saveNote() {
    setSaving(true)
    try {
      await adminApi.updateInternalNote(order._id, internalNote)
      onMessage('Đã lưu ghi chú')
      await onUpdated()
    } catch (apiError) {
      onMessage(getApiErrorMessage(apiError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-card__title">
        <h3>
          <NotebookPen size={18} />
          Ghi chú nội bộ
        </h3>
      </div>
      <p className="admin-help">
        Đây là ghi chú riêng của admin, không hiển thị cho khách.
      </p>
      <textarea
        className="admin-textarea"
        value={internalNote}
        onChange={(event) => setInternalNote(event.target.value)}
        rows="4"
      />
      <button
        type="button"
        className="admin-button admin-button--primary"
        onClick={saveNote}
        disabled={saving}
      >
        <Save size={15} />
        Lưu ghi chú
      </button>
    </section>
  )
}

export default InternalNotePanel
