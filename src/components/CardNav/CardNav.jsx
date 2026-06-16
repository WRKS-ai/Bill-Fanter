'use client';
// CardNav — adapted from React Bits (https://reactbits.dev/components/card-nav).
// Behavior tuned for Bill Fanter:
//  • At the top of the page it fills a wide header area (left-aligned, flush).
//  • Once you scroll it pins to a centered, rounded pill (wider than the RB default).
//  • Hovering anywhere on the bar expands the WHOLE block downward to reveal all
//    cards at once (the original "card nav" concept), not a per-item dropdown.
// CSS-driven (no GSAP) so the hover expand stays smooth alongside the hero's
// WebGL/canvas animations.
import { useState } from 'react';
import { GoArrowUpRight } from 'react-icons/go';
import './CardNav.css';

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  buttonLabel = 'Get Started',
  buttonHref,
  loginLabel,
  loginHref
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const navItems = (items || []).slice(0, 3);

  // No scroll animation — the nav stays put as the top header (see CardNav.css).

  // Desktop expand is pure CSS (:hover) — see CardNav.css — so it can't be
  // starved by the hero's WebGL/canvas loops. React state only drives the
  // mobile hamburger toggle.
  const toggleHamburger = () => {
    setIsHamburgerOpen(o => !o);
    setIsExpanded(o => !o);
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav className={`card-nav ${isExpanded ? 'open' : ''}`} style={{ backgroundColor: baseColor }}>
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleHamburger}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            style={{ color: menuColor || '#000' }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            <img src={logo} alt={logoAlt} className="logo" />
          </div>

          {/* Visible top-level labels. Hovering the bar expands the whole block. */}
          <div className="card-nav-menu" style={{ color: menuColor || '#000' }}>
            {navItems.map((item, idx) => (
              <span key={`top-${item.label}-${idx}`} className="card-nav-menu-item">
                {item.label}
                <span className="card-nav-menu-caret" aria-hidden="true" />
              </span>
            ))}
          </div>

          <div className="card-nav-actions">
            {loginLabel && (
              <a href={loginHref || '#'} className="card-nav-login" style={{ color: menuColor || '#000' }}>
                {loginLabel}
              </a>
            )}
            <a
              href={buttonHref || '#'}
              className="card-nav-cta-button"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            >
              {buttonLabel}
            </a>
          </div>
        </div>

        {/* The full block: all cards revealed together on expand. */}
        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {navItems.map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              style={{ backgroundColor: item.bgColor, color: item.textColor, transitionDelay: `${idx * 0.05}s` }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <a key={`${lnk.label}-${i}`} className="nav-card-link" href={lnk.href} aria-label={lnk.ariaLabel}>
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
