// frontend/src/utils/hooks/useFullscreenToggle.ts
import { useEffect } from 'react';
import { ToggleFullscreen } from '../../wailsjs/go/app/App';

export function useFullscreenToggle() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault();
        ToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
