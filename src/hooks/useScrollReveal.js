import { useEffect, useRef } from "react";

/**
 * Custom hook that adds scroll-reveal entrance animation to elements.
 * Uses Intersection Observer to detect when elements enter the viewport.
 * 
 * @param {Object} options
 * @param {number} options.threshold - Visibility threshold (0-1, default 0.1)
 * @param {string} options.rootMargin - Root margin for observer (default "0px 0px -40px 0px")
 * @param {boolean} options.stagger - Whether to stagger child animations
 */
export default function useScrollReveal({
  threshold = 0.1,
  rootMargin = "0px 0px -40px 0px",
  stagger = true,
} = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find all card-animate elements inside this container (or the container itself)
    const targets = container.querySelectorAll(
      ".card-animate, .card-animate-left, .card-animate-right"
    );

    if (targets.length === 0) {
      // If the container itself has the class, observe it directly
      if (
        container.classList.contains("card-animate") ||
        container.classList.contains("card-animate-left") ||
        container.classList.contains("card-animate-right")
      ) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("card-visible");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold, rootMargin }
        );
        observer.observe(container);
        return () => observer.disconnect();
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("card-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    targets.forEach((el, index) => {
      // Add stagger delay classes
      if (stagger && index < 6) {
        el.classList.add(`card-stagger-${index + 1}`);
      } else if (stagger) {
        el.style.animationDelay = `${(index) * 0.1}s`;
      }
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [threshold, rootMargin, stagger]);

  return containerRef;
}
