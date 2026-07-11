import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { getApiErrorMessage } from "../../api/apiError";
import { customerApi } from "../../api/customerApi";
import { publicApi } from "../../api/publicApi";
import CheckoutForm from "../../components/checkout/CheckoutForm";
import OrderSummary from "../../components/checkout/OrderSummary";
import { useCustomerAuth } from "../../context/customerAuth";
import { CartProvider, useCart } from "../../store/cartStore";
import {
  saveLastGuestOrder,
  saveLastShopSlug,
} from "../../utils/lastGuestOrder";
import { invalidPhoneMessage, isValidVietnamPhone } from "../../utils/phone";
import { Wrench } from "lucide-react";

const initialForm = {
  name: "",
  phone: "",
  province: "",
  address: "",
  preferredContactTime: "Gọi ngay khi có thể",
  note: "",
};

function CheckoutContent() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { customer, token, isAuthenticated } = useCustomerAuth();
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    saveLastShopSlug(slug);
    let mounted = true;

    async function loadShop() {
      try {
        const response = await publicApi.getShop(slug);
        if (mounted) setShop(response.data.shop);
      } catch (error) {
        if (mounted) setSubmitError(getApiErrorMessage(error));
      }
    }

    loadShop();

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    let mounted = true;

    async function prefillCustomer() {
      if (!isAuthenticated || !customer) return;

      setForm((current) => ({
        ...current,
        name: current.name || customer.fullName || "",
        phone: current.phone || customer.phone || "",
      }));

      try {
        const response = await customerApi.getCustomerAddresses();
        if (!mounted) return;

        const addresses = response.data.addresses || [];
        const defaultAddress =
          addresses.find((address) => address.isDefault) || addresses[0];

        if (defaultAddress) {
          setForm((current) => ({
            ...current,
            name:
              current.name ||
              defaultAddress.receiverName ||
              customer.fullName ||
              "",
            phone:
              current.phone || defaultAddress.phone || customer.phone || "",
            province: current.province || defaultAddress.province || "",
            address: current.address || defaultAddress.addressLine || "",
            note: current.note || defaultAddress.note || "",
          }));
        }
      } catch {
        // Keep checkout usable even if address preload fails.
      }
    }

    prefillCustomer();

    return () => {
      mounted = false;
    };
  }, [customer, isAuthenticated]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "Vui lòng nhập họ tên";
    if (!isValidVietnamPhone(form.phone))
      nextErrors.phone = invalidPhoneMessage;
    if (!form.address.trim()) nextErrors.address = "Vui lòng nhập địa chỉ";
    if (items.length === 0) nextErrors.cart = "Giỏ hàng đang trống";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event?.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const payload = {
        shopSlug: slug,
        pageUrl: window.location.href,
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: [form.address.trim(), form.province.trim()]
            .filter(Boolean)
            .join(", "),
          note: form.note.trim(),
          preferredContactTime: form.preferredContactTime,
        },
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod: "consult_later",
        source: {
          utmSource: searchParams.get("utm_source") || "",
          utmCampaign:
            searchParams.get("utm_campaign") || shop?.campaignId || "",
          userAgent: navigator.userAgent,
        },
      };

      const response = await publicApi.createOrder(payload, token);
      const order = response.data.order;

      localStorage.setItem(`lastOrder:${slug}`, JSON.stringify(order));
      if (!isAuthenticated) {
        saveLastGuestOrder({
          orderCode: order.orderCode,
          phone: form.phone.trim(),
          shopSlug: slug,
          createdAt: order.createdAt,
        });
      }
      clearCart();
      navigate(`/shop/${slug}/success`, { state: { order } });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  function getShopLogoUrl(shop) {
    return shop?.avatarUrl || shop?.logoUrl || "";
  }

  const [failedLogoUrl, setFailedLogoUrl] = useState("");
  const logoUrl = getShopLogoUrl(shop);
  const shouldShowLogo = Boolean(logoUrl && failedLogoUrl !== logoUrl);

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link className="brand-mark" to={`/shop/${shop?.slug || ""}`}>
          <span className="brand-mark__icon">
            {shouldShowLogo ? (
              <img
                src={logoUrl}
                alt={shop?.name || "Shop"}
                onError={() => setFailedLogoUrl(logoUrl)}
              />
            ) : (
              <Wrench size={22} />
            )}
          </span>
          <span>
            <strong>{shop?.name || "Shop Bán Hàng Uy Tín"}</strong>
          </span>
        </Link>
      </header>
      <main className="container checkout-main">
        <section className="checkout-title">
          <p className="eyebrow">Đặt hàng</p>
          <h1>Đặt Hàng Nhanh</h1>
          <p>
            Để lại thông tin, shop sẽ liên hệ xác nhận đơn trong thời gian sớm
            nhất.
          </p>
        </section>

        {items.length === 0 ? (
          <section className="empty-state checkout-empty">
            <ShoppingCart size={42} />
            <h2>Giỏ hàng đang trống</h2>
            <p>Hãy quay lại shop để chọn sản phẩm trước khi đặt hàng.</p>
            <Link className="button button--primary" to={`/shop/${slug}`}>
              Quay lại shop
            </Link>
          </section>
        ) : (
          <>
            {errors.cart ? (
              <div className="inline-error">{errors.cart}</div>
            ) : null}
            {submitError ? (
              <div className="inline-error">{submitError}</div>
            ) : null}

            <form className="checkout-grid" onSubmit={handleSubmit}>
              <CheckoutForm
                form={form}
                errors={errors}
                onChange={updateField}
              />
              <OrderSummary
                items={items}
                subtotal={subtotal}
                submitLabel="Gửi đơn hàng"
                submitting={submitting}
                onSubmit={handleSubmit}
              />
            </form>
          </>
        )}
      </main>
    </div>
  );
}

function CheckoutPage() {
  const { slug } = useParams();

  return (
    <CartProvider key={slug} shopSlug={slug}>
      <CheckoutContent />
    </CartProvider>
  );
}

export default CheckoutPage;
