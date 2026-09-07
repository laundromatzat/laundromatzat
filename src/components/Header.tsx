import React from "react";
import { NavLink } from "react-router-dom";

function Header(): React.ReactNode {
  return (
    <header className="fixed top-0 left-0 right-0 z-[2001] bg-aura-bg/90 backdrop-blur-md py-4 shadow-sm">
      <nav
        aria-label="Primary"
        className="max-w-[1800px] mx-auto px-4 sm:px-8 flex items-center justify-between"
      >
        <NavLink
          to="/"
          className="text-2xl sm:text-3xl font-display font-medium tracking-tight text-aura-text-primary"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          laundromatzat.com
        </NavLink>
        <span className="text-sm font-medium tracking-wide text-aura-text-secondary">
          Music Videos
        </span>
      </nav>
    </header>
  );
}

export default Header;
