"use client";
import { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0, placeAbove: true });

  useLayoutEffect(() => {
    if (!visible) return;

    function updatePosition() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const margin = 8;
      const vw = window.innerWidth;
      const tooltipWidth = 256; // w-64
      let left = rect.left + rect.width / 2;
      left = Math.max(tooltipWidth / 2 + margin, Math.min(left, vw - tooltipWidth / 2 - margin));
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceAbove >= 96 || spaceAbove > spaceBelow;
      const top = placeAbove ? rect.top - margin : rect.bottom + margin;
      setPos({ left, top, placeAbove });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible, text]);

  const tooltip =
    visible &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        role="tooltip"
        className="fixed z-[9999] w-64 max-h-[min(70vh,20rem)] overflow-y-auto bg-gray-900 border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed pointer-events-none"
        style={{
          left: pos.left,
          top: pos.top,
          transform: pos.placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
        }}
      >
        {text}
        <div
          className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
            pos.placeAbove ? "top-full border-t-gray-900" : "bottom-full border-b-gray-900"
          }`}
        />
      </div>,
      document.body
    );

  return (
    <div
      className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      ref={triggerRef}
    >
      {children}
      <HelpCircle className="w-3.5 h-3.5 text-gray-500 cursor-help flex-shrink-0" />
      {tooltip}
    </div>
  );
}
