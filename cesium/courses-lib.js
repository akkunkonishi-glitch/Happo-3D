// 八方尾根 コースデータ用ライブラリ（ブラウザと tools/make-courses.js で共用）
// - OSMのピステ中心線(piste-line)を幅30mでバッファしてポリゴン化
// - Overpass APIの結果(out geom)を courses.geojson 形式に変換
(function (root) {
  'use strict';
  const R = 6378137;
  const toXY = (p, o) => [(p[0] - o[0]) * Math.PI / 180 * R * Math.cos(o[1] * Math.PI / 180), (p[1] - o[1]) * Math.PI / 180 * R];
  const toLL = (q, o) => [+(o[0] + q[0] / (R * Math.cos(o[1] * Math.PI / 180)) * 180 / Math.PI).toFixed(7), +(o[1] + q[1] / R * 180 / Math.PI).toFixed(7)];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const len = a => Math.hypot(a[0], a[1]);
  const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const cross = (a, b) => a[0] * b[1] - a[1] * b[0];

  // 線の簡略化（Douglas-Peucker、tolメートル）。頂点を減らして編集しやすくする
  function simplify(pts, tol) {
    if (pts.length < 3) return pts.slice();
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop(); let idx = -1, max = tol;
      const ab = sub(pts[b], pts[a]), L = len(ab) || 1;
      for (let i = a + 1; i < b; i++) { const d = Math.abs(cross(ab, sub(pts[i], pts[a]))) / L; if (d > max) { max = d; idx = i; } }
      if (idx >= 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  }

  // 片側のオフセット線。外側の角は面取り、内側は交点（長さ制限つき）にして、折り返しで生じる逆向きの点は除く
  function offsetSide(xy, h, sign) {
    const out = [], n = xy.length;
    for (let i = 0; i < n; i++) {
      const p = xy[i];
      const d0 = i > 0 ? unit(sub(p, xy[i - 1])) : null, d1 = i < n - 1 ? unit(sub(xy[i + 1], p)) : null;
      const nrm = d => [-d[1] * sign, d[0] * sign];
      if (!d0 || !d1) { const nn = nrm(d0 || d1); out.push([p[0] + nn[0] * h, p[1] + nn[1] * h]); continue; }
      const n0 = nrm(d0), n1 = nrm(d1), turn = cross(d0, d1) * sign; // turn>0：この側が内側
      const m = unit([n0[0] + n1[0], n0[1] + n1[1]]), c = Math.max(dot(m, n1), 0.2);
      if (turn > 0 || c > 0.92) { const k = Math.min(h / c, h * 2.5); out.push([p[0] + m[0] * k, p[1] + m[1] * k]); }
      else { out.push([p[0] + n0[0] * h, p[1] + n0[1] * h], [p[0] + n1[0] * h, p[1] + n1[1] * h]); }
    }
    // 元の線と逆向きに進む点（急な折り返しの内側）を取り除く
    const clean = [out[0]];
    for (let i = 1; i < out.length; i++) {
      const prev = clean[clean.length - 1], seg = sub(out[i], prev);
      const j = Math.min(n - 1, Math.round(i * (n - 1) / Math.max(1, out.length - 1))), ref = sub(xy[Math.min(n - 1, j)], xy[Math.max(0, j - 1)]);
      if (len(seg) < 0.5) continue;
      if (dot(seg, ref) < 0 && i < out.length - 1) continue;
      clean.push(out[i]);
    }
    return clean;
  }

  // 中心線 coords([[lon,lat],...]) を幅 width(m) の帯ポリゴン(閉じたリング)にする。両端は丸める
  function bufferLine(coords, width, opts) {
    opts = opts || {};
    const o = coords[0], h = width / 2;
    let xy = coords.map(p => toXY(p, o)).filter((q, i, a) => i === 0 || len(sub(q, a[i - 1])) > 0.3);
    xy = simplify(xy, opts.simplify == null ? 3 : opts.simplify);
    if (xy.length < 2) return null;
    const left = offsetSide(xy, h, 1), right = offsetSide(xy, h, -1);
    const cap = (p, d, from, to) => { const pts = [], a0 = Math.atan2(d[1], d[0]); for (let k = 1; k < 6; k++) { const a = a0 + from + (to - from) * k / 6; pts.push([p[0] + Math.cos(a) * h, p[1] + Math.sin(a) * h]); } return pts; };
    const dEnd = unit(sub(xy[xy.length - 1], xy[xy.length - 2])), dStart = unit(sub(xy[1], xy[0]));
    const ring = [...left, ...cap(xy[xy.length - 1], dEnd, Math.PI / 2, -Math.PI / 2), ...right.reverse(), ...cap(xy[0], dStart, -Math.PI / 2, -3 * Math.PI / 2)];
    const ll = ring.map(q => toLL(q, o));
    ll.push(ll[0].slice());
    return ll;
  }

  // 複数のwayをつないで閉じたリングにする（OSMのマルチポリゴン用）
  function joinRings(ways) {
    const same = (p, q) => p[0] === q[0] && p[1] === q[1], closed = c => c.length > 3 && same(c[0], c[c.length - 1]);
    const rings = [], pool = ways.map(w => w.slice());
    while (pool.length) {
      let r = pool.shift(), grew = true;
      while (!closed(r) && grew) {
        grew = false;
        for (let i = 0; i < pool.length; i++) {
          const w = pool[i], a = r[r.length - 1];
          if (same(a, w[0])) r = r.concat(w.slice(1)); else if (same(a, w[w.length - 1])) r = r.concat(w.slice(0, -1).reverse()); else continue;
          pool.splice(i, 1); grew = true; break;
        }
      }
      if (closed(r)) rings.push(r);
    }
    return rings;
  }

  // Overpass(out geom)の結果 → courses.geojson（コース＝ポリゴン、リフト＝線）
  function osmToCourses(osm, opts) {
    opts = opts || {};
    const width = opts.width || 30, feats = [];
    const ll = g => g.map(p => [+p.lon.toFixed(7), +p.lat.toFixed(7)]);
    const closed = c => c.length > 3 && c[0][0] === c[c.length - 1][0] && c[0][1] === c[c.length - 1][1];
    const course = (id, t, ring, source) => feats.push({ type: 'Feature', properties: { id, kind: 'course', name: t['piste:name'] || t.name || '', difficulty: t['piste:difficulty'] || '', source }, geometry: { type: 'Polygon', coordinates: [ring] } });
    for (const e of osm.elements || []) {
      const t = e.tags || {};
      if (e.type === 'way' && e.geometry) {
        const c = ll(e.geometry);
        if (t.aerialway && !['station', 'pylon', 'goods'].includes(t.aerialway)) {
          feats.push({ type: 'Feature', properties: { id: 'way/' + e.id, kind: 'lift', name: t.name || t['name:ja'] || '', aerialway: t.aerialway }, geometry: { type: 'LineString', coordinates: c } });
        } else if (t['piste:type'] === 'downhill') {
          if (closed(c) && (t.area === 'yes' || t.landuse || t.leisure || t.natural)) course('way/' + e.id, t, c, 'osm-area');
          else { const ring = bufferLine(c, width); if (ring) course('way/' + e.id, t, ring, 'osm-centerline-buffer' + width + 'm'); }
        }
      } else if (e.type === 'relation' && t['piste:type'] === 'downhill' && e.members) {
        const outs = joinRings(e.members.filter(m => m.type === 'way' && m.geometry && m.role !== 'inner').map(m => ll(m.geometry)));
        outs.forEach((r, i) => course('relation/' + e.id + (outs.length > 1 ? '#' + i : ''), t, r, 'osm-area'));
      }
    }
    return { type: 'FeatureCollection', properties: { source: 'OpenStreetMap (Overpass API)', license: 'ODbL © OpenStreetMap contributors', note: 'ピステ中心線は幅' + width + 'mでバッファしてポリゴン化', generated: new Date().toISOString() }, features: feats };
  }

  root.HappoCourses = { bufferLine, osmToCourses, simplify, joinRings };
})(typeof window !== 'undefined' ? window : globalThis);
