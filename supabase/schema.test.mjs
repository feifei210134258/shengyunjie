import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

test("training record owners can update saved feedback revisions", () => {
  assert.match(
    schema,
    /create policy "用户可以更新自己的训练记录"[\s\S]*on public\.training_records for update[\s\S]*to authenticated[\s\S]*using \(\(select auth\.uid\(\)\) = user_id\)[\s\S]*with check \(\(select auth\.uid\(\)\) = user_id\)/
  );
});
