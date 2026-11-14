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
  ファイルが未作成の間は、端末に残っているOSMデータかブラウザからOSMを取得して、その場でポリゴン化して表示します。

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

`https://akkunkonishi-glitch.github.io/Happo-3D/cesium/?edit=1` で開くと編集モードになります。

- 3Dマップ上でコースをタップ → 選択（頂点＝白い点、辺の目印＝小さいオレンジの点）
- 頂点をドラッグ → 地形に沿って移動／辺をタップ → 頂点を追加／頂点を長押し（赤くなったら離す）→ 削除／頂点をタップ → 頂点を選ぶ（青、最大2つ）
- 選択中のコースの内側をドラッグ → コースごと平行移動。コースの外側のドラッグは通常どおり地図の移動
- コースをタップすると全体がハイライトされ、メニュー（複製・名前変更・このコースを削除）が出ます
- パネル：新規コース（地面をタップして頂点を打ち「確定」）、名前変更、色変更、複製、このコースを削除（確認あり）、分割、結合、元に戻す
  - 分割：頂点を1つ選ぶと、その位置でコースを横に切ります（向かい側の一番近い頂点と結ぶ線）。2つ選ぶとその2点を結ぶ線で切ります
  - 結合：「結合」を押してから、重なるか接している隣のコースをタップ
- 変更はすぐ3Dに反映され、端末（localStorage）に自動保存
- 「GeoJSONを書き出す」でクリップボードにコピー → `cesium/data/courses.geojson` として保存すると全員に反映
- 「編集を破棄」で元のデータに戻します

### リフト・建物の立体表示

- リフト：`cesium/data/lifts3d.geojson`、建物：`cesium/data/buildings.geojson` を読みます（© OpenStreetMap contributors）。
  ファイルが無い間は、端末に保存した前回の取得結果、それも無ければブラウザから Overpass API で取得します。
- リフトは aerialway=pylon の支柱位置に柱（チェア10m・ゴンドラ14m・Tバー等6m）を立て、頂点どうしをワイヤーで結びます。支柱データが無いリフトは一定間隔（チェア約90m・ゴンドラ約200m）で支柱を自動生成します。
- リフトの駅舎：OSMの駅舎の面（aerialway=station）があればそれを優先、駅の点だけならその位置に、どちらも無ければ線の始点・終点に10m角・高さ6mの箱を自動で置きます。編集モード（?edit=1）では箱をドラッグして位置を直せます（端末に保存、lifts3d書き出しに含まれます）。
- 建物は管理区域KMLの範囲内だけを取得・表示します。height → building:levels×3.5m → どちらも無ければ2階建て（7m）で押し出し、名前があればラベルを出します。カメラが地表から2.5km以内のときだけ表示します。
- パネルの「lifts3d書き出し」「buildings書き出し」でファイルを保存し、`cesium/data/` に置くと全員に反映されます。
