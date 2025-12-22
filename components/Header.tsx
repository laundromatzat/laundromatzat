import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import MenuIcon from "./icons/MenuIcon";
import { CloseIcon } from "./icons/CloseIcon";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/images", label: "Images" },
  { to: "/vids", label: "Videos" },
  { to: "/cinemagraphs", label: "Cinemagraphs" },
  { to: "/tools", label: "Tools" },
  { to: "/links", label: "Links" },
];

function Header(): React.ReactNode {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Always use dark text as the header is now above the content on all pages
  const textColorClass = "text-aura-text-primary";

  return (
    <>
      <header
        className={clsx(
          "fixed top-0 left-0 right-0 z-nav transition-all duration-700 ease-in-out bg-aura-bg/90 backdrop-blur-md py-4 shadow-sm"
        )}
      >
        <nav
          aria-label="Primary"
          className="max-w-[1800px] mx-auto px-8 flex items-center justify-between"
        >
          {/* Logo */}
          <NavLink
            to="/"
            className={clsx(
              "text-3xl font-serif font-medium tracking-tight z-50 relative transition-colors duration-500",
              textColorClass
            )}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            laundromatzat.com
          </NavLink>

          {/* Center Links - Desktop */}
          <div
            className={clsx(
              "hidden md:flex items-center gap-2 text-sm font-medium tracking-wide transition-colors duration-500",
              textColorClass
            )}
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "px-4 py-2 rounded-full transition-all duration-300",
                    isActive
                      ? "bg-aura-text-primary text-aura-bg hover:opacity-90 font-semibold"
                      : "hover:bg-aura-text-primary/10 hover:text-aura-text-primary"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right Actions - Mobile Toggle & User Profile */}
          <div
            className={clsx(
              "flex items-center gap-6 z-50 relative transition-colors duration-500",
              textColorClass
            )}
          >
            {user ? (
              <div className="flex items-center gap-4">
                <NavLink
                  to="/profile"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {user.profile_picture ? (
                    <img
                      src={`http://localhost:4000${user.profile_picture}`}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-aura-accent/20 flex items-center justify-center border border-white/10">
                      <span className="text-xs font-bold text-aura-accent">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium">
                    {user.username}
                  </span>
                </NavLink>
                <button
                  onClick={logout}
                  className="text-xs hover:text-aura-accent transition-colors hidden md:block"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="hidden md:block text-sm font-medium hover:text-aura-accent transition-colors"
              >
                Login
              </NavLink>
            )}

            <button
              type="button"
              className="block md:hidden focus:outline-none transition-colors duration-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation"
            >
              {isMenuOpen ? (
                <CloseIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={clsx(
          "fixed inset-0 bg-aura-bg z-[1100] flex flex-col justify-center items-center transition-all duration-500 ease-in-out",
          isMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-10 pointer-events-none"
        )}
      >
        <div className="flex flex-col items-center space-y-8 text-xl font-serif font-medium text-aura-text-primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="hover:opacity-60 transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink
                to="/profile"
                className="hover:opacity-60 transition-opacity"
                onClick={() => setIsMenuOpen(false)}
              >
                My Profile
              </NavLink>
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="hover:opacity-60 transition-opacity text-red-400"
              >
                Log Out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="hover:opacity-60 transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </NavLink>
          )}
        </div>
      </div>
    </>
  );
}

export default Header;
