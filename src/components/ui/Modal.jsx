// src/components/ui/Modal.jsx
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./Modal.scss";

export default function Modal({
  open,
  onClose,
  title,
  footer,
  size,
  children,
  closeOnBackdrop = true,
  ariaLabel,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const onBackdrop = (e) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div
      className="modal-root"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || undefined}
    >
      <div className="modal-backdrop" onMouseDown={onBackdrop} />
      <div className={`modal-dialog size-${size}`} ref={dialogRef}>
        <div className="modal-content">
          {(title || onClose) && (
            <div className="modal-header">
              <div className="modal-title">{title}</div>
              {onClose && (
                <button
                  className="modal-close"
                  aria-label="Yopish"
                  onClick={onClose}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <div className="modal-body">{children}</div>

          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}
