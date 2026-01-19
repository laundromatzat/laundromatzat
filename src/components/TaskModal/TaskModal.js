// src/components/TaskModal/TaskModal.js
import React, { useEffect, useRef } from 'react';
import styles from './TaskModal.module.css'; // Assuming CSS Modules

const TaskModal = ({ isOpen, onClose, children, titleId = 'modal-title' }) => {
    const modalRef = useRef(null);
    const prevBodyOverflow = useRef(''); // To store original body overflow state

    useEffect(() => {
        if (isOpen) {
            // Fix: Store original overflow and then hide it to prevent background scrolling
            prevBodyOverflow.current = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            // Fix: Add ESC key listener for closing
            const handleEscape = (event) => {
                if (event.key === 'Escape') {
                    onClose();
                }
            };
            document.addEventListener('keydown', handleEscape);

            // Optional: Programmatically focus the modal for accessibility
            // Setting tabIndex to -1 makes the div focusable
            if (modalRef.current) {
                modalRef.current.focus();
            }

            // Cleanup function for event listener and overflow
            return () => {
                document.removeEventListener('keydown', handleEscape);
                // Fix: Restore original overflow only if this modal was the one that hid it
                if (document.body.style.overflow === 'hidden') {
                    document.body.style.overflow = prevBodyOverflow.current;
                }
            };
        } else {
            // When modal closes, ensure overflow is reset
            if (document.body.style.overflow === 'hidden') {
                document.body.style.overflow = prevBodyOverflow.current;
            }
        }
    }, [isOpen, onClose]); // Dependencies: re-run effect if isOpen or onClose changes

    if (!isOpen) {
        return null; // Don't render anything if the modal is not open
    }

    // The taskModalOverlay handles clicks outside the modal content.
    // The taskModalContainer prevents clicks inside from bubbling up to the overlay.
    return (
        <div
            className={`${styles.taskModalOverlay} ${isOpen ? styles.isVisible : ''}`}
            onClick={onClose} // Fix: Close modal when clicking on the dimmed overlay area
            // aria-hidden is not strictly necessary here as `null` is returned when not open
        >
            <div
                ref={modalRef}
                className={`${styles.taskModalContainer} ${isOpen ? styles.isVisible : ''}`}
                onClick={(e) => e.stopPropagation()} // Fix: Crucial for preventing modal closure on internal clicks/text selection
                role="dialog" // ARIA role for accessibility
                aria-modal="true" // Indicate that it's a modal dialog
                aria-labelledby={titleId} // Link to a title element within the modal for screen readers
                tabIndex="-1" // Make the div programmatically focusable for A11y
            >
                {/* Explicit Close Button */}
                <button
                    className={styles.modalCloseButton}
                    onClick={onClose} // Fix: Close modal when the explicit close button is clicked
                    aria-label="Close modal"
                >
                    &times; {/* HTML entity for a multiplication sign / 'x' */}
                </button>

                <div className={styles.taskModalContent}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
