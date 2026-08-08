import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import { useState, useEffect } from "react";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled
          ? "bg-black/80 border-b border-emerald-600/20 shadow-lg backdrop-blur-xl"
          : "bg-transparent border-b border-transparent"
        }`}
    >
      <nav className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link
          to="/"
          className="flex items-center space-x-3 group link-slide"
        >
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 group-hover:scale-110 transition-transform duration-300">
            <Brain className="h-7 w-7 text-white icon-bounce" />
            <div className="absolute inset-0 rounded-xl bg-blue-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]">
            CareerAlign AI
          </span>
        </Link>
      </nav>

    </header>
  );
};

export default Header;
