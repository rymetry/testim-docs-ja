# 実装履歴メモ

このファイルは、通常の設計書やコードコメントに残さない履歴情報を最小限で集約するための保管場所です。

## source parity / source sync

- source-side debt の除外運用は、過去に upstream 側の broken source を調査した結果として導入された。
- structure comparator、source unusable 判定、orphan baseline 集計は、source parity の運用を安定させるため段階的に導入された。
- `--types` による baseline partial regeneration は、structure/source-unusable 系 entry だけを安全に再生成するために追加された。

## 運用ルール

- 通常の docs、コードコメント、JSDoc、テスト名には完了済みの Issue 番号や PR 番号を書かない。
- 履歴番号を残す必要がある場合は、このファイルか外部の issue tracker に集約する。
- 一時的な調査 plan やドラフトは `docs/` の恒久文書に混ぜず、不要になった時点で削除する。
