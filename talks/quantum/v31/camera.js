// v3.1 camera: one pure projection shared by screen, print, board and gates.
// A camera is a 16:9 viewBox in map units; zoom = mapWidth / width.
export const FRAME = [1920, 1080];

export function rect(stop, route, map = [9600, 5400]) {
  const w = stop.width, h = w * FRAME[1] / FRAME[0];
  const [cx0, cy0] = stop.c ? stop.c : stop.at == null ? [map[0] / 2, map[1] / 2] : route.at(stop.at);
  const cx = cx0 + (stop.dx || 0), cy = cy0 + (stop.dy || 0);
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

// map point -> page px for camera rect r (no getScreenCTM; G22 measures it).
export function project([x, y], r) {
  const s = FRAME[0] / r.w;
  return [(x - r.x) * s, (y - r.y) * s];
}

export const zoom = (r, map = [9600, 5400]) => map[0] / r.w;

// van Wijk–Nuij style log-zoom interpolation between two rects, t in 0..1.
export function hop(a, b, t) {
  const wa = a.w, wb = b.w, w = wa * Math.pow(wb / wa, t);
  const ca = [a.x + a.w / 2, a.y + a.h / 2], cb = [b.x + b.w / 2, b.y + b.h / 2];
  const k = wa === wb ? t : (wa - w) / (wa - wb);
  const cx = ca[0] + (cb[0] - ca[0]) * k, cy = ca[1] + (cb[1] - ca[1]) * k, h = w * FRAME[1] / FRAME[0];
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
