import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="page-state">
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn không tồn tại hoặc đã được thay đổi.</p>
      <Link className="button button--primary" to="/shop/chu-tam-tan-xe">
        Về cửa hàng
      </Link>
    </main>
  );
}

export default NotFoundPage;
