import React, { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView as RNWebView, type WebViewMessageEvent } from 'react-native-webview';

import { mapHtml, type MapMarker, type MapMessage } from '@/lib/map-html';
import { colors, radius } from '@/theme';

export type MapHandle = { recenter: (lat: number, lng: number) => void };

export type MapProps = {
  lat: number;
  lng: number;
  zoom?: number;
  markers?: MapMarker[];
  /** Report the map's centre after each move (the pin is drawn on top by the screen). */
  picker?: boolean;
  onCenter?: (lat: number, lng: number) => void;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<MapHandle>;
};

/** The WebView handle we use; typed loosely because its class typings clash with React 19's. */
type WebViewHandle = { injectJavaScript: (script: string) => void };
const WebView = RNWebView as unknown as (props: {
  ref: Ref<WebViewHandle>;
  originWhitelist: string[];
  source: { html: string };
  style: StyleProp<ViewStyle>;
  onMessage: (e: WebViewMessageEvent) => void;
}) => React.ReactNode;

const command = (data: object) => `onCommand(${JSON.stringify(JSON.stringify(data))});true;`;

/** OpenStreetMap in a WebView (Android / iOS). The web build uses map.web.tsx. */
export function MapView({ lat, lng, zoom = 16, markers = [], picker = false, onCenter, style, ref }: MapProps) {
  const web = useRef<WebViewHandle>(null);
  // Built once: later changes go in as messages, so the map never reloads.
  const [html] = useState(() => mapHtml({ id: 'map', lat, lng, zoom, markers, picker }));
  const markersKey = JSON.stringify(markers);

  useImperativeHandle(ref, () => ({
    recenter: (la, ln) => web.current?.injectJavaScript(command({ type: 'recenter', lat: la, lng: ln })),
  }));

  useEffect(() => {
    web.current?.injectJavaScript(command({ type: 'markers', markers: JSON.parse(markersKey) }));
  }, [markersKey]);

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={web}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.fill}
        onMessage={(e) => {
          const msg = JSON.parse(e.nativeEvent.data) as MapMessage;
          if (msg.type === 'center') onCenter?.(msg.lat, msg.lng);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.photo },
  fill: { flex: 1, backgroundColor: 'transparent' },
});
