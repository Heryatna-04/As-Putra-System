"use client";

import { useState, useEffect, useRef } from "react";

interface LazyMapProps {
  heightClass?: string;
  title?: string;
}

export default function LazyMap({
  heightClass = "h-[230px]",
  title = "Peta Lokasi Dealer & AHASS Honda AS Putra Motor Kuningan",
}: LazyMapProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${heightClass} w-full bg-zinc-100 flex items-center justify-center relative overflow-hidden`}
    >
      {shouldLoad ? (
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d319.7268610197772!2d108.48832525312899!3d-6.9516689375066765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f16edc0e25e75%3A0x5a4162116590d82d!2sDealer%20Honda%20AS%20Putra%20Motor%20Kuningan!5e1!3m2!1sen!2sid!4v1790916002596!5m2!1sen!2sid"
          className="h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          title={title}
        />
      ) : (
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-zinc-300 animate-pulse" />
          <span>Memuat peta lokasi...</span>
        </div>
      )}
    </div>
  );
}
