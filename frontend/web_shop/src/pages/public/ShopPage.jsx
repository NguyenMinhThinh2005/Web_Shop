import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { publicApi } from "../../api/publicApi";
import CartDrawer from "../../components/cart/CartDrawer";
import MobileStickyBar from "../../components/layout/MobileStickyBar";
import PublicFooter from "../../components/layout/PublicFooter";
import PublicHeader from "../../components/layout/PublicHeader";
import CategoryChips from "../../components/product/CategoryChips";
import CategorySidebar from "../../components/product/CategorySidebar";
import ProductDetailModal from "../../components/product/ProductDetailModal";
import ProductGrid from "../../components/product/ProductGrid";
import ContactModal from "../../components/public/ContactModal";
import { CartProvider, useCart } from "../../store/cartStore";

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

function getShopHeroImageUrl(shop) {
  return shop?.thumbnailUrl || shop?.coverImageUrl || shop?.bannerUrl || "";
}

function ShopContent() {
  const { slug, productSlug } = useParams();
  const navigate = useNavigate();
  const { addProduct, itemCount } = useCart();
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState("");
  const [productRouteError, setProductRouteError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [failedHeroImageUrl, setFailedHeroImageUrl] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const heroImageUrl = getShopHeroImageUrl(shop);
  const shouldShowHeroImage = Boolean(
    heroImageUrl && failedHeroImageUrl !== heroImageUrl,
  );

  useEffect(() => {
    let mounted = true;

    async function loadBase() {
      setLoading(true);
      setError("");

      try {
        const [shopResponse, categoryResponse] = await Promise.all([
          publicApi.getShop(slug),
          publicApi.getCategories(slug),
        ]);

        if (!mounted) return;

        setShop(shopResponse.data.shop);
        setCategories(categoryResponse.data.categories || []);
      } catch (apiError) {
        if (mounted) setError(apiError.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBase();

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setProductsLoading(true);
      try {
        const params = {};
        if (selectedCategoryId) params.categoryId = selectedCategoryId;
        if (debouncedSearch.trim()) params.q = debouncedSearch.trim();

        const response = await publicApi.getProducts(slug, params);
        if (mounted) setProducts(response.data.products || []);
      } catch (apiError) {
        if (mounted) setError(apiError.message);
      } finally {
        if (mounted) setProductsLoading(false);
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [debouncedSearch, selectedCategoryId, slug]);

  useEffect(() => {
    let mounted = true;

    async function loadProductDetail() {
      if (!productSlug) {
        setProductRouteError("");
        return;
      }

      setProductRouteError("");

      try {
        const response = await publicApi.getProductDetail(slug, productSlug);
        if (mounted) setSelectedProduct(response.data.product);
      } catch {
        if (mounted) setProductRouteError("Không tìm thấy sản phẩm phù hợp.");
      }
    }

    loadProductDetail();

    return () => {
      mounted = false;
    };
  }, [productSlug, slug]);

  const trustBadges = useMemo(
    () => [
      { icon: ShieldCheck, label: "Đặt nhanh không cần đăng nhập" },
      { icon: Wrench, label: "Tư vấn đúng sản phẩm" },
      { icon: PackageCheck, label: "Xác nhận đơn nhanh" },
    ],
    [],
  );

  function handleAddProduct(product, quantity = 1) {
    addProduct(product, quantity);
    setCartOpen(true);
  }

  function closeProductModal() {
    setSelectedProduct(null);
    if (productSlug) navigate(`/shop/${slug}`);
  }

  function openContactModal() {
    setContactOpen(true);
  }

  if (loading) {
    return <main className="page-state">Đang tải cửa hàng...</main>;
  }

  if (error && !shop) {
    return (
      <main className="page-state">
        <PackageCheck size={42} />
        <h1>Shop hiện chưa hoạt động hoặc không tồn tại.</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <div className="public-page">
      <PublicHeader
        shop={shop}
        search={search}
        onSearchChange={setSearch}
        cartCount={itemCount}
        onCartOpen={() => setCartOpen(true)}
        onContactOpen={openContactModal}
      />

      <main className="container shop-layout">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />

        <div className="shop-main">
          <section
            className={
              shouldShowHeroImage
                ? "shop-hero shop-hero--with-image"
                : "shop-hero"
            }
          >
            {shouldShowHeroImage ? (
              <img
                className="shop-hero__image"
                src={heroImageUrl}
                alt={shop?.name || "Shop"}
                onError={() => setFailedHeroImageUrl(heroImageUrl)}
              />
            ) : null}
            <div className="shop-hero__content">
              <h1>{shop?.name || "Cửa hàng"}</h1>
              {shop?.description ? <p>{shop.description}</p> : null}
              <div className="hero-actions">
                <a className="button button--primary" href="#products">
                  <ArrowRight size={18} />
                  Xem sản phẩm
                </a>
                {shop?.contact?.messengerUrl || shop?.contact?.zaloUrl ? (
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={openContactModal}
                  >
                    <MessageCircle size={18} />
                    Liên hệ tư vấn
                  </button>
                ) : null}
              </div>
            </div>
            <div className="trust-panel">
              {trustBadges.map(({ icon: Icon, label }) => (
                <span key={label}>
                  <Icon size={20} />
                  {label}
                </span>
              ))}
            </div>
          </section>

          <CategoryChips
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />

          <section className="section-heading" id="products">
            <div>
              <p className="eyebrow">Sản phẩm</p>
              <h2>Chọn nhanh sản phẩm cần tư vấn</h2>
            </div>
            <span>{products.length} sản phẩm</span>
          </section>

          {error ? <div className="inline-error">{error}</div> : null}
          {productRouteError ? (
            <div className="inline-error">{productRouteError}</div>
          ) : null}

          <ProductGrid
            products={products}
            loading={productsLoading}
            hasSearch={Boolean(debouncedSearch.trim() || selectedCategoryId)}
            onAdd={handleAddProduct}
            onDetail={(product) =>
              navigate(`/shop/${slug}/products/${product.slug}`)
            }
          />
        </div>
      </main>

      <PublicFooter shop={shop} onContactOpen={openContactModal} />
      <MobileStickyBar
        cartCount={itemCount}
        onCartOpen={() => setCartOpen(true)}
        onContactOpen={openContactModal}
      />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        shopSlug={slug}
      />
      <ProductDetailModal
        product={selectedProduct}
        shop={shop}
        onClose={closeProductModal}
        onAdd={handleAddProduct}
        onContactOpen={openContactModal}
      />
      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        shop={shop}
      />
    </div>
  );
}

function ShopPage() {
  const { slug } = useParams();

  return (
    <CartProvider key={slug} shopSlug={slug}>
      <ShopContent />
    </CartProvider>
  );
}

export default ShopPage;
