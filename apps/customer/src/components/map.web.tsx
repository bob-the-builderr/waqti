import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { mapHtml, type MapMessage } from '@/lib/map-html';
import { colors, radius } from '@/theme';

import type { MapProps } from './map';

export type { MapHandle, MapProps } from './map';

/** Web build: the same Leaflet page in a sandboxed iframe, talking by postMessage. */
export function MapView({ lat, lng, zoom = 16, markers = [], picker = false, onCenter, style, ref }: MapProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const id = useId();
  const [html] = useState(() => mapHtml({ id, lat, lng, zoom, markers, picker }));
  const onCenterRef = useRef(onCenter);
  const markersKey = JSON.stringify(markers);

  useEffect(() => {
    onCenterRef.current = onCenter;
  }, [onCenter]);

  useEffect(() => {
    const listen = (e: MessageEvent) => {
      const data = e.data as { waqtiMap?: string; msg?: MapMessage } | null;
      if (!data || data.waqtiMap !== id || !data.msg) return;
      if (data.msg.type === 'center') onCenterRef.current?.(data.msg.lat, data.msg.lng);
    };
    window.addEventListener('message', listen);
    return () => window.removeEventListener('message', listen);
  }, [id]);

  const post = (data: object) => frame.current?.contentWindow?.postMessage(JSON.stringify(data), '*');

  useImperativeHandle(ref, () => ({
    recenter: (la: number, ln: number) => post({ type: 'recenter', lat: la, lng: ln }),
  }));

  useEffect(() => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ type: 'markers', markers: JSON.parse(markersKey) }), '*');
  }, [markersKey]);

  return (
    <View style={[styles.wrap, style]}>
      <iframe ref={frame} title="خريطة" srcDoc={html} sandbox="allow-scripts" style={{ border: 0, width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.photo },
});
