import { Pane } from 'tweakpane';
import { useEffect, useRef } from 'react';
import clsx from 'clsx';

interface SetupPanelProps {
  isOpen: boolean;
}

export default function SetupPanel({ isOpen }: SetupPanelProps) {
  const paneRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const pane = new Pane({
      container: document.getElementById('tweakpane-container')!,
      title: 'Lattice Background'
    });

    const paneAny = pane as any;

    // Global lattice options
    const options = {
      spacing: 80,
      mouseRepel: true,
      mouseDistance: 200,
      moveStrength: 0.5,
      mouseGradient: 'outward' as 'none' | 'outward' | 'inward',
      drawColored: true
    };

    // Mouse folder
    const mouseFolder = paneAny.addFolder({ title: 'Mouse' });
    mouseFolder.addBlade({
      view: 'list',
      options: [
        { text: 'none', value: 'none' },
        { text: 'outward', value: 'outward' },
        { text: 'inward', value: 'inward' }
      ],
      label: 'gradient',
      value: options.mouseGradient
    }).on('change', () => paneAny.refresh());

    mouseFolder.addInput(options, 'mouseRepel');
    mouseFolder.addInput(options, 'mouseDistance', { min: 100, max: 1000 });
    mouseFolder.addInput(options, 'mouseStrength', { min: 0, max: 5 });

    // Save to localStorage
    (pane as any).on('change', () => {
      localStorage.setItem('latticeOptions', JSON.stringify(options));
    });

    paneRef.current = pane;

    return () => {
      pane.dispose();
    };
  }, [isOpen]);

  return (
    <div
      id="tweakpane-container"
      className={clsx(
        "fixed top-4 right-4 z-50 w-80 h-96 bg-[#1a1b26]/95 backdrop-blur-xl rounded-2xl border border-[#2f334d]/50 shadow-2xl",
        !isOpen && "hidden"
      )}
    />
  );
}
