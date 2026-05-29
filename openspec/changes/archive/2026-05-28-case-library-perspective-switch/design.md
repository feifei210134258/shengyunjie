# Design — Fix Perspective Switch

修改 `switchPerspective`：直接调用 `loadArticle(slug)` 加载对应视角内容，同时保留 `router.replace` 更新 URL 用于书签/分享。

```diff
 function switchPerspective(slug: string) {
+  loadArticle(slug);
   router.replace(
     `/training/cases/${encodeURIComponent(productName)}?perspective=${slug}`
   );
 }
```
