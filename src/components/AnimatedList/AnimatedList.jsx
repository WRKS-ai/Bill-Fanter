'use client';
// AnimatedList — React Bits "Animated List" (https://reactbits.dev/components/animated-list)
// adapted for the community-benefits list. We keep ONLY the per-item reveal
// (scale 0.7 -> 1, fade 0 -> 1, re-triggering when the row scrolls in/out of
// view) and deliberately drop the component's scroll container, gradients,
// keyboard nav and dark item styling — those would change how the list looks.
//
// Each item renders as `.bf-benefit` (the existing markup), so the design
// system's dividers (.bf-benefit:first-child border reset) and the parent's
// `gap: 24px` are preserved exactly. The mount node uses display:contents so
// these rows stay direct flex children of `.bf-community__benefits`.
//
// FADE quirk: modernization.css has a global `[style*="opacity: 0"]{opacity:1
// !important}` rule (it strips Webflow IX2 reveal states) that clobbers any
// inline opacity < 1. So instead of animating inline `opacity`, we animate a
// `--bf-reveal` CSS variable (0->1) and a `scale` motion value, binding both via
// `style`. A sandbox rule maps `--bf-reveal` back to opacity (see index.astro).
import { useRef, useEffect } from 'react';
import { motion, useInView, useMotionValue, animate } from 'motion/react';

const AnimatedBenefit = ({ item, delay = 0 }) => {
  const ref = useRef(null);
  // amount: 0.5 + once: true — the row reveals the first time it crosses the
  // halfway-visible threshold and then stays put (no re-animation on re-scroll).
  const inView = useInView(ref, { amount: 0.5, once: true });
  const reveal = useMotionValue(0); // 0..1 -> opacity (via CSS var)
  const scale = useMotionValue(0.7);

  useEffect(() => {
    const to = inView ? 1 : 0;
    const opts = { duration: 0.2, delay: inView ? delay : 0, ease: 'easeOut' };
    const a1 = animate(reveal, to, opts);
    const a2 = animate(scale, inView ? 1 : 0.7, opts);
    return () => { a1.stop(); a2.stop(); };
  }, [inView, delay, reveal, scale]);

  return (
    <motion.div ref={ref} className="bf-benefit" style={{ scale, '--bf-reveal': reveal }}>
      <div className="bf-benefit__num">{item.num}</div>
      <div>
        <div className="bf-benefit__title">{item.title}</div>
        <p className="bf-body">{item.body}</p>
      </div>
    </motion.div>
  );
};

const AnimatedList = ({ items = [] }) => (
  <>
    {items.map((item, index) => (
      <AnimatedBenefit key={index} item={item} delay={0.1} />
    ))}
  </>
);

export default AnimatedList;
