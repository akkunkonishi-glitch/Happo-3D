# Happo-3D

八方尾根3D管理マップ 試作

## 公開URL（GitHub Pages）

- MapLibre版：https://akkunkonishi-glitch.github.io/Happo-3D/
- CesiumJS版：https://akkunkonishi-glitch.github.io/Happo-3D/cesium/

※ リポジトリの Settings → Pages で「Deploy from a branch」「main」「/(root)」を選ぶと上記URLで公開されます。

## CesiumJS版について

- 航空写真・標高とも国土地理院のタイルを直接読むため、Cesium ion のトークンは不要です。
- 標高：ズーム14以下は10m（dem_png）、ズーム15は5m（dem5a_png、欠けは10mで補完）。
