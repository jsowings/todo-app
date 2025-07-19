import { useEffect } from 'react';
import { KEYBOARD_SHORTCUTS } from '../utils/constants';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === KEYBOARD_SHORTCUTS.ESCAPE) {
          e.target.blur();
        }
        return;
      }

      // Check for modifier keys
      const isModified = e.ctrlKey || e.metaKey || e.altKey;
      
      if (!isModified) {
        const handler = shortcuts[e.key.toLowerCase()];
        if (handler) {
          e.preventDefault();
          handler();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
};