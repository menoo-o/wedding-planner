"use client";
import { useToastStore } from '@/store/useToastStore';

export default function NetworkToast() {
  const { message, type, isVisible, hideToast } = useToastStore();

  if (!isVisible) return null;

  return (
    <div className={`network-toast ${type}`}>
      <span>{type === 'online' ? '🟢' : '🔴'} {message}</span>
      <button onClick={hideToast} style={{ marginLeft: '10px', cursor: 'pointer' }}>
        &times;
      </button>
    </div>
  );
}
