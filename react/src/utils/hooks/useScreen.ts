import { useEffect, useState } from "react";

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

export function useScreen() {
  const getWidth = () =>
    typeof window !== "undefined" ? window.innerWidth : 0;

  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    const onResize = () => setWidth(getWidth());

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const isMobile = width < BREAKPOINTS.mobile;

  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;

  const isDesktop = width >= BREAKPOINTS.tablet;

  console.log("useScreen hook called, width:", width, "isMobile:", isMobile, "isTablet:", isTablet, "isDesktop:", isDesktop);

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
  };
}