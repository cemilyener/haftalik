import { Link } from "react-router-dom";

export default function Header() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex gap-6">
      <Link to="/">Ana Sayfa</Link>
      <Link to="/ogrenciler">Öğrenciler</Link>
      <Link to="/odeme-takip">Ödeme Takip</Link>
    </nav>
  );
}