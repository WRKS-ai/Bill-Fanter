'use client';
// CardNav — top header for Bill Fanter.
//  • Desktop: each top-level item (Join / Learn / Company) owns its OWN
//    dropdown. Hovering an item drops a small panel below the bar that reveals
//    ONE colored card per link (e.g. Join → a "Masterclass" card + a
//    "Community" card). Same colored-card look + slide-up reveal as the
//    original shared card-nav — just isolated per item.
//  • Mobile: the hamburger expands a stacked panel of every group + link.
// Open state is JS-controlled with a short close delay so moving the cursor from
// a label down into the full-width panel (across the small dead zone between
// them) doesn't snap the menu shut before you can click a card.
import { useState, useRef, useEffect } from 'react';
import { GoArrowUpRight } from 'react-icons/go';
import './CardNav.css';

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  logoHref = '/',
  items,
  className = '',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
  buttonLabel = 'Get Started',
  buttonHref,
  loginLabel,
  loginHref,
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState(null);
  const closeTimer = useRef(null);
  const navItems = (items || []).slice(0, 3);

  // Lock page scroll while the full-screen mobile menu is open, so the page
  // behind the panel can't be scrolled or interacted with.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = isHamburgerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isHamburgerOpen]);

  // Open immediately; close on a short delay so the cursor can cross the gap
  // between a label and its panel (or hop between items) without it closing.
  const openItem = (idx) => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setOpenIdx(idx);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenIdx(null), 220);
  };
  // Cancel a pending close — used when the cursor is anywhere within the nav so
  // the open dropdown stays open while moving across the bar's blank areas.
  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  return (
    <div className={`card-nav-container ${className} ${openIdx !== null ? 'has-open' : ''}`}>
      {/* Stripe-style focus: blur + dim the rest of the page while a dropdown is open. */}
      <div className="card-nav-backdrop" aria-hidden="true" />
      <nav
        className={`card-nav ${isHamburgerOpen ? 'open' : ''}`}
        style={{ backgroundColor: baseColor }}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={() => setIsHamburgerOpen((o) => !o)}
            role="button"
            aria-label={isHamburgerOpen ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            style={{ color: menuColor || '#000' }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <a className="logo-container" href={logoHref} aria-label={`${logoAlt}, home`}>
            <img src={logo} alt={logoAlt} className="logo" />
          </a>

          {/* Each top-level item owns its own dropdown of per-link cards. */}
          <div className="card-nav-menu" style={{ color: menuColor || '#000' }}>
            {navItems.map((item, idx) => (
              <div
                className={`card-nav-item ${openIdx === idx ? 'is-open' : ''}`}
                key={`top-${item.label}-${idx}`}
                onMouseEnter={() => openItem(idx)}
              >
                <span className="card-nav-menu-item" tabIndex={0} onFocus={() => openItem(idx)}>
                  {item.label}
                  <span className="card-nav-menu-caret" aria-hidden="true" />
                </span>
                <div className="card-nav-dropdown" role="menu" onMouseEnter={() => openItem(idx)}>
                  {item.links?.map((lnk, i) => (
                    <a
                      key={`${lnk.label}-${i}`}
                      className="nav-card"
                      href={lnk.href}
                      aria-label={lnk.ariaLabel}
                      role="menuitem"
                      style={{
                        backgroundColor: item.bgColor,
                        color: item.textColor,
                      }}
                    >
                      <GoArrowUpRight className="nav-card-arrow" aria-hidden="true" />
                      <div className="nav-card-label">{lnk.label}</div>
                      {lnk.desc && <div className="nav-card-desc">{lnk.desc}</div>}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="card-nav-actions">
            {loginLabel && (
              <a href={loginHref || '#'} target="_blank" rel="noopener" className="card-nav-login" style={{ color: menuColor || '#000' }}>
                {loginLabel}
              </a>
            )}
            <a href={buttonHref || '#'} className="bf-btn bf-btn--primary card-nav-cta">
              {buttonLabel}
            </a>
          </div>
        </div>

        {/* Mobile panel — every group + link, stacked (hamburger toggle). */}
        <div className={`card-nav-mobile ${isHamburgerOpen ? 'open' : ''}`}>
          {navItems.map((item, idx) => (
            <div className="card-nav-mobile-group" key={`m-${item.label}-${idx}`}>
              <div className="card-nav-mobile-grouplabel">{item.label}</div>
              {item.links?.map((lnk, i) => (
                <a key={`${lnk.label}-${i}`} className="card-nav-mobile-link" href={lnk.href}>
                  {lnk.label}
                </a>
              ))}
            </div>
          ))}
          {loginLabel && (
            <a className="card-nav-mobile-link card-nav-mobile-login" href={loginHref || '#'} target="_blank" rel="noopener">{loginLabel}</a>
          )}
          <a className="card-nav-mobile-cta" href={buttonHref || '#'}>{buttonLabel}</a>
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
