# ACS Classic 2008 Mode

ACS Publications（`pubs.acs.org`）の論文ページを読みやすく整える Chrome 拡張の試作版です。

現在は `Latest Articles`、検索結果、個別論文ページを対象にしています。

## できること

- 右サイドバー、広告、関連・推薦コンテンツを非表示
- Abstract を本文の先頭へ移動
- 本文の折りたたみ状態は維持し、Visual Abstract だけを Abstract の横に表示
- Visual Abstract は遅延デコード・低優先度読み込み
- Latest Articlesでは、Abstractを手で開くとACS本来のVisual Abstractをそのまま表示する
- Latest Articles／検索結果では、タイトル・著者・書誌情報の右側にVisual Abstractを表示（ACS標準のGraphical Abstract画像を利用。図がない論文は1列表示）
- PDF リンクを目立つボタンに変更
- 論文本文を固定幅・セリフ体で表示
- ツールバーからオン／オフを切替（状態を保存）

## インストール

1. `chrome://extensions` を開く
2. 右上の「デベロッパー モード」をオンにする
3. 「パッケージ化されていない拡張機能を読み込む」を選ぶ
4. この `acs-classic-2008` フォルダを選ぶ

## 注意

- ACS 側の HTML 構造変更により、特定ページで一部セレクタを追加調整することがあります。
- ページ内容の取得・保存・外部送信は行いません。表示だけを変更します。
