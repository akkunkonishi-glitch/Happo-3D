# Happo-3D

八方尾根3D管理マップ 試作

## 公開URL（GitHub Pages）

- MapLibre版：https://akkunkonishi-glitch.github.io/Happo-3D/
- CesiumJS版：https://akkunkonishi-glitch.github.io/Happo-3D/cesium/

※ リポジトリの Settings → Pages で「Deploy from a branch」「main」「/(root)」を選ぶと上記URLで公開されます。

## CesiumJS版について

- 航空写真・標高とも国土地理院のタイルを直接読むため、Cesium ion のトークンは不要です。
- 標高：ズーム14以下は10m（dem_png）、ズーム15は5m（dem5a_png、欠けは10mで補完）。
- ゲレンデのコース・リフト：OpenStreetMap（© OpenStreetMap contributors, ODbL）を元にした `cesium/data/courses.geojson` を読みます（コース＝ポリゴン、リフト＝線）。OSMのピステ中心線は幅30mでバッファしてポリゴン化しています。

### コースデータ（courses.geojson）の作り方

どちらかの方法で作ります。

- **ブラウザで作る**：`cesium/?edit=1` を開き、「OSMから作成」→「GeoJSONを書き出す」（クリップボードにコピー）。内容を `cesium/data/courses.geojson` として保存。
- **コマンドで作る**：Overpass API の結果を保存して変換します。

```bash
curl -A "Happo3D-course-map/1.0" -o overpass.json --data-urlencode 'data=[out:json][timeout:90];(way["piste:type"="downhill"](36.655,137.76,36.735,137.87);relation["piste:type"="downhill"](36.655,137.76,36.735,137.87);way["aerialway"](36.655,137.76,36.735,137.87););out geom;' https://overpass-api.de/api/interpreter
```

```bash
node tools/make-courses.js overpass.json
```

### コース編集モード

`https://akkunkonishi-glitch.github.io/Happo-3D/cesium/?edit=1` で開くと編集モードになります（通常表示は courses.geojson を読むだけ）。

- 3Dマップ上でコースをタップ → 選択（頂点マーカーと辺の中点が表示される）
- 頂点をドラッグ → 地形に沿って移動／辺の中点（小さい点）をタップ → 頂点を追加／頂点を長押し（赤くなったら離す）→ 削除
- 編集モード中は1本指を頂点操作に使います。カメラは2本指（広げる＝ズーム、ひねる＝回転、そろえて動かす＝移動）、ミニマップ、視点スティックで動かします
- 「新規コース」→ 地面をタップして頂点を順に打つ →「確定」でポリゴンを追加
- 「名前」「コース削除」も可能。変更はすぐ3Dに反映され、端末（localStorage）に自動保存
- 「GeoJSONを書き出す」でクリップボードにコピー → `cesium/data/courses.geojson` として保存すると全員に反映
- 「編集を破棄」で courses.geojson の内容に戻します
