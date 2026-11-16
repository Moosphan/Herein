// This browser module is frozen alongside each new native Remotion project.
// Scene modules import the hook without editing the shared visual dispatcher.
export const NATIVE_CAPTIONS_FILE = 'host-captions.tsx'

export const NATIVE_CAPTIONS_SOURCE = `import React, {createContext, useCallback, useContext, useId, useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

type Cue = {start: number; duration: number; text: string};
export type CaptionBounds = {left: number; top: number; right: number; bottom: number; width: number; height: number};
export type CaptionLayout = {containerStyle?: React.CSSProperties; captionStyle?: React.CSSProperties};
type Registration = CaptionLayout & {owner: string};
type Measurement = {key: string; bounds: CaptionBounds | null};
type HostState = {
  sceneId: string | null;
  caption: Cue | null;
  width: number;
  height: number;
  fontsReady: boolean;
  canvas: React.RefObject<HTMLDivElement>;
  layout: CaptionLayout;
  measurementKey: string;
  measurement: Measurement | null;
  register: (sceneId: string, owner: string, layout: CaptionLayout) => void;
  unregister: (sceneId: string, owner: string) => void;
  measure: React.Dispatch<React.SetStateAction<Measurement | null>>;
};
const HostContext = createContext<HostState | null>(null);

export function HostCaptionProvider({sceneId, caption, width, height, fontsReady, children}: {
  sceneId: string | null; caption: Cue | null; width: number; height: number; fontsReady: boolean; children: React.ReactNode;
}) {
  const [layouts, setLayouts] = useState<Record<string, Registration>>({});
  const [measurement, measure] = useState<Measurement | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const register = useCallback((id: string, owner: string, layout: CaptionLayout) => {
    setLayouts(previous => ({...previous, [id]: {...layout, owner}}));
  }, []);
  const unregister = useCallback((id: string, owner: string) => {
    setLayouts(previous => {
      if (previous[id]?.owner !== owner) return previous;
      const next = {...previous};
      delete next[id];
      return next;
    });
  }, []);
  const layout = (sceneId && layouts[sceneId]) || {};
  const measurementKey = JSON.stringify([sceneId, caption, width, height, layout]);
  return <HostContext.Provider value={{sceneId, caption, width, height, fontsReady, canvas, layout, measurementKey, measurement, register, unregister, measure}}>
    <div ref={canvas} style={{position: 'absolute', top: 0, left: 0, width, height}}>{children}</div>
  </HostContext.Provider>;
}

export function useHostCaption(sceneId: string, layout: CaptionLayout = {}) {
  const host = useContext(HostContext);
  if (!host) throw new Error('useHostCaption requires the native host caption provider');
  const owner = useId();
  const serialized = JSON.stringify(layout);
  const {register, unregister} = host;
  useLayoutEffect(() => {
    register(sceneId, owner, JSON.parse(serialized));
    return () => unregister(sceneId, owner);
  }, [sceneId, owner, serialized, register, unregister]);
  const active = host.sceneId === sceneId;
  return {
    active,
    caption: active ? host.caption : null,
    bounds: active && host.measurement?.key === host.measurementKey ? host.measurement.bounds : null,
  };
}

export function HostCaptionOverlay() {
  const host = useContext(HostContext)!;
  const caption = useRef<HTMLDivElement>(null);
  const pending = useRef<number | null>(null);
  const {measurementKey, fontsReady, width, height, measure} = host;
  useLayoutEffect(() => {
    const handle = delayRender('Measuring host caption layout');
    pending.current = handle;
    if (!fontsReady) return () => {
      if (pending.current === handle) pending.current = null;
      continueRender(handle);
    };
    const update = () => {
      let bounds: CaptionBounds | null = null;
      if (caption.current && host.canvas.current) {
        const outer = host.canvas.current.getBoundingClientRect();
        const box = caption.current.getBoundingClientRect();
        const scaleX = outer.width / width;
        const scaleY = outer.height / height;
        bounds = {
          left: (box.left - outer.left) / scaleX,
          top: (box.top - outer.top) / scaleY,
          right: (box.right - outer.left) / scaleX,
          bottom: (box.bottom - outer.top) / scaleY,
          width: box.width / scaleX,
          height: box.height / scaleY,
        };
      }
      measure(previous => previous?.key === measurementKey && JSON.stringify(previous.bounds) === JSON.stringify(bounds)
        ? previous : {key: measurementKey, bounds});
    };
    update();
    const observer = new ResizeObserver(update);
    if (caption.current) observer.observe(caption.current);
    return () => {
      observer.disconnect();
      if (pending.current === handle) pending.current = null;
      continueRender(handle);
    };
  }, [measurementKey, fontsReady, width, height, measure]);
  useLayoutEffect(() => {
    if (fontsReady && host.measurement?.key === measurementKey && pending.current !== null) {
      continueRender(pending.current);
      pending.current = null;
    }
  }, [fontsReady, host.measurement, measurementKey]);
  return <div data-host-caption-container style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', boxSizing: 'border-box', padding: height > width ? '0 120px 200px 72px' : '0 100px 48px', ...host.layout.containerStyle, pointerEvents: 'none'}}>
    {host.caption && <div ref={caption} data-host-caption style={{fontFamily: 'system-ui, sans-serif', fontSize: 38, lineHeight: 1.4, textAlign: 'center', color: '#fff', background: '#101521', padding: '12px 28px', borderRadius: 12, ...host.layout.captionStyle}}>{host.caption.text}</div>}
  </div>;
}
`
