import { useEffect, useRef, useState, useCallback } from 'react';

export type ModalKey =
  | 'search_modal'
  | 'product_detail'
  | 'admin_panel'
  | 'agent_portal'
  | 'quick_order'
  | 'order_confirmation'
  | 'product_form'
  | 'auth_modal'
  | 'customer_orders'
  | 'review_modal'
  | 'cart_drawer'
  | 'download_modal'
  | 'user_profile'
  | 'menu_drawer'
  | 'variant_sheet'
  | 'settings_modal'
  | 'messages_modal'
  | 'language_selector'
  | 'trust_protection'
  | 'support_center';

interface BackNavigationOptions {
  onCloseModal: (key: ModalKey) => void;
  isAnyModalOpen: boolean;
  onRootBack?: () => boolean;
}

export function useBackNavigation({ onCloseModal, isAnyModalOpen, onRootBack }: BackNavigationOptions) {
  const modalStackRef = useRef<ModalKey[]>([]);
  const isProgrammaticBackRef = useRef(false);
  const lastBackPressTimeRef = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);

  // Initialize history baseline and root guard on mount
  useEffect(() => {
    // 1. Establish the base root state
    if (!window.history.state || !window.history.state.__app_root) {
      window.history.replaceState({ __app_root: true, depth: 0 }, '');
    }

    // 2. Push a root guard entry so the first hardware back tap at root is captured
    // instead of immediately exiting the PWA or browser
    window.history.pushState({ __app_guard: true, depth: 1 }, '');

    // 3. Listen to popstate for phone hardware back button, gestures, and browser back
    const handlePopState = (event: PopStateEvent) => {
      // If back was triggered by UI button calling history.back(), skip handling
      if (isProgrammaticBackRef.current) {
        isProgrammaticBackRef.current = false;
        return;
      }

      // If there are modals/views open in the stack
      if (modalStackRef.current.length > 0) {
        // Pop the topmost active modal from the stack (step-by-step back navigation)
        const topModal = modalStackRef.current.pop();
        if (topModal) {
          onCloseModal(topModal);
        }

        // When all modals have been dismissed and user is now back at root,
        // re-arm the root guard so the next hardware back button doesn't quit the app
        if (modalStackRef.current.length === 0) {
          window.history.pushState({ __app_guard: true, depth: 1 }, '');
        }
        return;
      }

      // If onRootBack returns true (e.g. switched active tab from categories/you/cart back to home)
      if (onRootBack && onRootBack()) {
        window.history.pushState({ __app_guard: true, depth: 1 }, '');
        return;
      }

      // No modals open: User is at the root home view
      const now = Date.now();
      const timeSinceLastPress = now - lastBackPressTimeRef.current;

      if (timeSinceLastPress < 2000) {
        // Double-tap within 2 seconds: Allow user to exit the app
        setShowExitToast(false);
        // Let Android/browser exit naturally
        window.history.back();
      } else {
        // Single tap: Warn user with toast and prevent accidental app exit
        lastBackPressTimeRef.current = now;
        setShowExitToast(true);
        setTimeout(() => {
          setShowExitToast(false);
        }, 2200);

        // Re-push guard state so the next back press is also caught
        window.history.pushState({ __app_guard: true, depth: 1 }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onCloseModal]);

  // Open a modal: pushes to stack and creates a new history entry
  const pushModal = useCallback((key: ModalKey) => {
    // Avoid duplicate entry on top
    if (modalStackRef.current[modalStackRef.current.length - 1] !== key) {
      modalStackRef.current.push(key);
      window.history.pushState(
        { __app_modal: key, depth: modalStackRef.current.length + 1 },
        ''
      );
    }
  }, []);

  // Close a modal via in-app UI button (X, backdrop, or "ফিরে যান")
  const popModal = useCallback((key: ModalKey) => {
    const idx = modalStackRef.current.lastIndexOf(key);
    if (idx !== -1) {
      modalStackRef.current.splice(idx, 1);
      // Synchronize browser history stack
      isProgrammaticBackRef.current = true;
      window.history.back();
    }
    onCloseModal(key);
  }, [onCloseModal]);

  // Triggered when an in-app "ফিরে যান" / Back button is tapped
  const triggerInAppBack = useCallback(() => {
    if (modalStackRef.current.length > 0) {
      const topModal = modalStackRef.current.pop();
      if (topModal) {
        isProgrammaticBackRef.current = true;
        window.history.back();
        onCloseModal(topModal);
      }
    } else {
      window.history.back();
    }
  }, [onCloseModal]);

  return {
    pushModal,
    popModal,
    triggerInAppBack,
    showExitToast,
    openModalCount: modalStackRef.current.length
  };
}
