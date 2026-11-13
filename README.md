# Happo-3D

八方尾根3D管理マップ 試作

## 公開URL（GitHub Pages）

- MapLibre版：https://akkunkonishi-glitch.github.io/Happo-3D/
- CesiumJS版：https://akkunkonishi-glitch.github.io/Happo-3D/cesium/

※ リポジトリの Settings → Pages で「Deploy from a branch」「main」「/(root)」を選ぶと上記URLで公開されます。

## CesiumJS版について

- 航空写真・標高とも国土地理院のタイルを直接読むため、Cesium ion のトークンは不要です。
- 標高：ズーム14以下は10m（dem_png）、ズーム15は5m（dem5a_png、欠けは10mで補完）。
- ゲレンデのコース・リフト：OpenStreetMap（© OpenStreetMap contributors, ODbL）。
  `cesium/data/happo-courses.geojson` があればそれを読み、無ければブラウザから Overpass API で取得して端末に保存します。

### コースデータをリポジトリに保存する手順

1. CesiumJS版を開く（ファイルが無いので自動で OpenStreetMap から取得されます）。
2. パネルの「GeoJSON保存」で `happo-courses.geojson` をダウンロード。
3. GitHub のリポジトリで `cesium/data/` に「Add file → Upload files」でアップロード（または Claude に渡す）。
4. 以後はこのファイルが優先して読まれます。OSM を更新したいときは「OSM再取得」→ 再度保存・アップロード。
