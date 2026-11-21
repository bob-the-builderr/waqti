/**
 * One small Leaflet page for every map in the app (address pin, order tracking).
 * Native shows it in a WebView, web in an iframe; both talk to it with messages.
 * Tiles: OpenStreetMap, fine for testing; before launch move to a paid tile
 * provider (OSM's own servers are not for app traffic).
 */

export type MapMarker = { lat: number; lng: number; kind: 'home' | 'store' | 'driver'; label?: string };

export type MapConfig = {
  id: string;
  lat: number;
  lng: number;
  zoom: number;
  markers: MapMarker[];
  /** Picker mode: the map reports its centre after every move (the pin is drawn by the app on top). */
  picker: boolean;
};

/** Messages from the map page. */
export type MapMessage = { type: 'center'; lat: number; lng: number } | { type: 'ready' };

export function mapHtml(config: MapConfig) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
html,body,#m{margin:0;height:100%;background:#EEF0EA}
.mk{width:34px;height:34px;border-radius:17px;display:flex;align-items:center;justify-content:center;font:700 15px sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.3);border:3px solid #fff}
.home{background:#7A35FF;color:#fff}.home:empty::after{content:'';width:10px;height:10px;border-radius:5px;background:#fff}.store{background:#fff;color:#1A0F3D;border-color:#7A35FF}.driver{background:#5CF2C4;color:#1A0F3D}
.leaflet-control-attribution{font-size:9px}
</style></head><body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var cfg = ${JSON.stringify(config)};
function send(msg){ var s = JSON.stringify(msg);
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
  else if (window.parent) window.parent.postMessage({ waqtiMap: cfg.id, msg: msg }, '*'); }
var map = L.map('m', { zoomControl: false }).setView([cfg.lat, cfg.lng], cfg.zoom);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
function icon(m){ return L.divIcon({ className: '', html: '<div class="mk ' + m.kind + '">' + (m.label || '') + '</div>', iconSize: [34, 34], iconAnchor: [17, 17] }); }
var layer = L.layerGroup().addTo(map);
function draw(markers, fit){ layer.clearLayers();
  markers.forEach(function(m){ L.marker([m.lat, m.lng], { icon: icon(m) }).addTo(layer); });
  if (fit && markers.length > 1) map.fitBounds(markers.map(function(m){ return [m.lat, m.lng]; }), { padding: [48, 48], maxZoom: 16 }); }
draw(cfg.markers, !cfg.picker);
if (cfg.picker) map.on('moveend', function(){ var c = map.getCenter(); send({ type: 'center', lat: c.lat, lng: c.lng }); });
function onCommand(d){ try { if (typeof d === 'string') d = JSON.parse(d); } catch (e) { return; }
  if (!d) return;
  if (d.type === 'recenter') map.setView([d.lat, d.lng], d.zoom || 17);
  if (d.type === 'markers') draw(d.markers, false); }
window.addEventListener('message', function(e){ onCommand(e.data); });
document.addEventListener('message', function(e){ onCommand(e.data); });
send({ type: 'ready' });
</script></body></html>`;
}
