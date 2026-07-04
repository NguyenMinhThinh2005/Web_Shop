import { MessageCircle } from 'lucide-react'

function hasContact(shop) {
  return Boolean(
    shop?.contact?.messengerUrl ||
      shop?.contact?.zaloUrl ||
      shop?.contact?.hotline,
  )
}

function PublicFooter({ shop, onContactOpen }) {
  return (
    <footer className="public-footer">
      <div className="container public-footer__inner">
        <div>
          <strong>{shop?.name || 'Chú Tám Tân Xe'}</strong>
          <p>Tư vấn đúng sản phẩm, đặt hàng nhanh, không cần đăng nhập.</p>
        </div>
        <div className="footer-links">
          {hasContact(shop) ? (
            <button
              type="button"
              className="contact-pill"
              onClick={onContactOpen}
            >
              <MessageCircle size={17} />
              Liên hệ tư vấn
            </button>
          ) : null}
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
