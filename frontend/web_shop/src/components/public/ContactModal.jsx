import { Copy, MessageCircle, Phone, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function isMobileDevice() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
}

function maskPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.length <= 4) return "••••";

  return `${digits.slice(0, 2)}•• ••• •${digits.slice(-2)}`;
}

function ContactModal({ open, onClose, shop }) {
  const [message, setMessage] = useState("");
  const contact = shop?.contact || {};
  const isMobile = isMobileDevice();
  const maskedHotline = useMemo(
    () => maskPhone(contact.hotline),
    [contact.hotline],
  );

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const hasAnyContact =
    contact.messengerUrl || contact.zaloUrl || contact.hotline;

  function showMessage(nextMessage) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 2200);
  }

  function openExternal(url, fallbackMessage) {
    if (!url) {
      showMessage(fallbackMessage);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyHotline() {
    if (!contact.hotline) {
      showMessage("Shop chưa cấu hình số tư vấn");
      return;
    }

    try {
      await navigator.clipboard.writeText(contact.hotline);
      showMessage("Đã sao chép số tư vấn");
    } catch {
      showMessage("Không sao chép được số tư vấn");
    }
  }

  function callNow() {
    if (!contact.hotline) {
      showMessage("Shop chưa cấu hình số tư vấn");
      return;
    }

    if (!isMobile) {
      showMessage("Hãy sao chép số tư vấn để gọi trên điện thoại");
      return;
    }

    window.location.href = `tel:${contact.hotline}`;
  }

  return (
    <div className="contact-modal-shell" role="dialog" aria-modal="true">
      <button
        type="button"
        className="contact-modal-backdrop"
        aria-label="Đóng liên hệ"
        onClick={onClose}
      />
      <section className="contact-modal-card">
        <header className="contact-modal-header">
          <div>
            <p className="eyebrow">Tư vấn nhanh</p>
            <h2>Liên hệ tư vấn</h2>
            <p>Chọn kênh phù hợp, Nhân Viên sẽ hỗ trợ bạn nhanh nhất.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Đóng liên hệ"
          >
            <X size={18} />
          </button>
        </header>

        {!hasAnyContact ? (
          <div className="contact-modal-empty">
            Shop chưa cấu hình kênh liên hệ.
          </div>
        ) : (
          <div className="contact-action-list">
            {contact.messengerUrl ? (
              <button
                type="button"
                className="contact-action"
                onClick={() =>
                  openExternal(
                    contact.messengerUrl,
                    "Shop chưa cấu hình Messenger",
                  )
                }
              >
                <span>
                  <MessageCircle size={20} />
                </span>
                <strong>Nhắn Messenger</strong>
                <small>Trao đổi nhanh qua Messenger</small>
              </button>
            ) : null}

            {contact.zaloUrl ? (
              <button
                type="button"
                className="contact-action"
                onClick={() =>
                  openExternal(contact.zaloUrl, "Shop chưa cấu hình Zalo")
                }
              >
                <span>
                  <Send size={20} />
                </span>
                <strong>Chat Zalo</strong>
                <small>Gửi thông tin sản phẩm cần tư vấn</small>
              </button>
            ) : null}

            {contact.hotline ? (
              <button
                type="button"
                className="contact-action"
                onClick={copyHotline}
              >
                <span>
                  <Copy size={20} />
                </span>
                <strong>Sao chép số điện thoại</strong>
                <small>
                  {maskedHotline
                    ? `Số tư vấn ${maskedHotline} đã sẵn sàng để sao chép`
                    : "Số tư vấn đã sẵn sàng để sao chép"}
                </small>
              </button>
            ) : null}

            {contact.hotline ? (
              <button
                type="button"
                className={`contact-action ${
                  isMobile ? "" : "contact-action--desktop-call"
                }`}
                onClick={callNow}
              >
                <span>
                  <Phone size={20} />
                </span>
                <strong>{isMobile ? "Gọi ngay" : "Gọi trên điện thoại"}</strong>
                <small>
                  {isMobile
                    ? "Mở trình gọi điện trên thiết bị của bạn"
                    : "Trên máy tính, hãy sao chép số tư vấn để gọi"}
                </small>
              </button>
            ) : null}
          </div>
        )}

        {message ? <div className="contact-toast">{message}</div> : null}
      </section>
    </div>
  );
}

export default ContactModal;
