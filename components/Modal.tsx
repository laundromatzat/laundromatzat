import React, { useEffect, useRef } from 'react';
import { PortfolioItemData } from '../utils/parseCSV';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PortfolioItemData | null;
  onPrev: () => void;
  onNext: () => void;
}

export default function Modal({ isOpen, onClose, item, onPrev, onNext }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.classList.add('body-modal-open');
      closeButtonRef.current?.focus();
    } else {
      document.body.classList.remove('body-modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('body-modal-open');
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };
    const currentModalRef = modalRef.current;
    currentModalRef.addEventListener('keydown', handleTabKeyPress);
    return () => {
      currentModalRef?.removeEventListener('keydown', handleTabKeyPress);
    };
  }, [isOpen]);

  if (!isOpen || !item) {
    return null;
  }

  const contentId = `modal-content-${item.id}`;
  const titleId = `modal-title-${item.id}`;

  let mediaElement;

  if (item.type === 'video' && item.sourceUrl) {
    mediaElement = (
      <video
        src={item.sourceUrl}
        controls
        preload="metadata"
        playsInline
        aria-describedby={titleId}
        key={`${item.id}-video`}
      ></video>
    );
  } else if (item.type === 'cinemagraph') {
    const sourceToUse = item.sourceUrl || item.coverImage;
    const isVideoFormat = /\.(mp4|webm|ogv)$/i.test(sourceToUse);
    if (isVideoFormat) {
      mediaElement = (
        <video
          src={sourceToUse}
          autoPlay
          loop
          muted
          playsInline
          controls
          preload="metadata"
          aria-label={`${item.title} (cinemagraph)`}
          aria-describedby={titleId}
          key={`${item.id}-cinemagraph-video`}
        ></video>
      );
    } else {
      mediaElement = <img src={sourceToUse} alt={`${item.title} (cinemagraph)`} aria-describedby={titleId} key={`${item.id}-cinemagraph-img`}/>;
    }
  } else if (item.coverImage) {
    mediaElement = <img src={item.coverImage} alt={item.title} aria-describedby={titleId} key={`${item.id}-image`}/>;
  } else {
    mediaElement = <p>Media not available.</p>;
  }

  let infoLineText = '';
  if (item.location) infoLineText += item.location;
  if (item.date) infoLineText += (infoLineText ? ' ' : '') + item.date;
  if (item.feat) {
    infoLineText += (infoLineText ? '. feat ' : 'feat ') + item.feat;
  } else if (infoLineText) {
    infoLineText += '.';
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <button
        className="modal-nav prev"
        onClick={e => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous item"
      >
        ‹
      </button>
      <div
        ref={modalRef}
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={contentId}
      >
        <button
          id={`modal-close-button-${item.id}`}
          ref={closeButtonRef}
          className="modal-close-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          &times;
        </button>
        <div className="modal-content" id={contentId}>
          <h2 id={titleId} className="modal-title">{item.title}</h2>
          <div className="modal-media-container">{mediaElement}</div>
          <div className="modal-details">
            {infoLineText && <p className="modal-info-line">{infoLineText}</p>}
            {item.description && <p className="modal-description-reformatted">{item.description}</p>}
            {item.gpsCoords && <p className="modal-gps"><strong>GPS:</strong> {item.gpsCoords}</p>}
            {item.easterEgg && <p className="modal-easter-egg">🤫: {item.easterEgg}</p>}
          </div>
        </div>
      </div>
      <button
        className="modal-nav next"
        onClick={e => { e.stopPropagation(); onNext(); }}
        aria-label="Next item"
      >
        ›
      </button>
    </div>
  );
}
