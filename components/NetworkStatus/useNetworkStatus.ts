"use client";
import { useEffect } from 'react';
import { useToastStore } from '@/store/useToastStore';

export default function NetworkListener() {
  const showToast = useToastStore((state) => state.showToast);
  const hideToast = useToastStore((state) => state.hideToast);

  useEffect(() => {
    const goOnline = () => {
      showToast("Back online!", "online");
      setTimeout(hideToast, 3000); // Auto-hide after 3s
    };
    
    const goOffline = () => {
      showToast("No internet connection.", "offline");
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [showToast, hideToast]);

  return null; // Logic only
}
