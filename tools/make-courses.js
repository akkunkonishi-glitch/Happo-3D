#!/usr/bin/env node
// Overpass APIの結果(JSON)から cesium/data/courses.geojson を作る
//   node tools/make-courses.js overpass.json [出力先]
// 取得クエリは README の「コースデータの作り方」を参照。
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const [, , input, output = path.join(__dirname, '..', 'cesium', 'data', 'courses.geojson')] = process.argv;
if (!input) { console.error('使い方: node tools/make-courses.js overpass.json [出力先]'); process.exit(1); }
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'cesium', 'courses-lib.js'), 'utf8'));
const geo = globalThis.HappoCourses.osmToCourses(JSON.parse(fs.readFileSync(input, 'utf8')), { width: 30 });
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(geo));
const n = k => geo.features.filter(f => f.properties.kind === k).length;
console.log(`コース ${n('course')} 件・リフト ${n('lift')} 件 → ${output}`);
