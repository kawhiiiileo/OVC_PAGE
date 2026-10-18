import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const html = await readFile(path.join(root, "index.html"), "utf8");
const data = JSON.parse(await readFile(path.join(root, "data/results.json"), "utf8"));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, "Duplicate HTML IDs");
for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const url = match[1];
  if (url.startsWith("#")) {
    if (url.length > 1) assert(ids.includes(url.slice(1)), `Missing anchor: ${url}`);
  } else if (!/^(https?:|data:|mailto:)/.test(url)) {
    assert(!url.startsWith("/"), `Root-relative URL breaks project Pages: ${url}`);
    await access(path.join(root, url.split("#")[0].split("?")[0]));
  }
}
assert.equal(data.benchmarks.length, 6);
for (const model of Object.values(data.models)) {
  for (const row of model.rows) {
    assert.equal(row.scores.length, 6);
    if (row.average === null) {
      assert(row.scores.every((score) => score === null));
    } else {
      assert(row.scores.every((score) => Number.isFinite(score) && score >= 0 && score <= 100));
      const calculated = row.scores.reduce((a, b) => a + b, 0) / 6;
      assert(Math.abs(calculated - row.average) <= .011, `${model.name}/${row.method}: inconsistent average`);
    }
  }
}
for (const [key, expected] of [["4b", 2.04], ["8b", 2.39], ["9b", 1.86]]) {
  const rows = data.models[key].rows;
  const delta = rows.find((r) => r.method === "GSPO + OVC").average - rows.find((r) => r.method === "GSPO").average;
  assert(Math.abs(delta - expected) < .0001);
}
assert(html.includes('prefers-reduced-motion') || (await readFile(path.join(root, "styles.css"), "utf8")).includes("prefers-reduced-motion"));
await import("../assets/ovc-engine.js");
const math = globalThis.OVCMath;
for (const scenario of ["algebra", "frame"]) {
  for (const coupling of [-1, 0, 1]) {
    for (const shrinkage of [0, .1, 1]) {
      const replay = math.evaluate({ scenario, coupling, shrinkage });
      assert.equal(replay.tokens.length, 192);
      assert.equal(replay.H, 32);
      assert(Math.abs(replay.weightMean - 1) < 1e-12);
      assert(replay.D.every((d) => Number.isFinite(d) && d > 0));
      assert(replay.tokens.every((token) => token.rawWeight >= .8 && token.rawWeight <= 1.2));
      for (const token of replay.tokens) {
        assert.equal(token.z.length, 33);
        assert(token.weight > 0 && Math.sign(token.update) === token.sign);
        assert(token.weight >= 2/3 - 1e-12 && token.weight <= 1.5 + 1e-12);
        assert(token.rho >= -2 && token.rho <= 2);
        const expanded = 2 * math.dot(replay.b, token.z.map((v, k) => v - replay.midpoint[k]));
        assert(Math.abs(expanded - token.evidence) < 1e-7, "Distance contrast must equal calibrated linear evidence");
      }
    }
  }
}
assert(Math.abs(math.geometry("algebra").correct - 10.5175655897) < 1e-9);
assert(Math.abs(math.geometry("algebra").incorrect - 12.1576968611) < 1e-9);
assert(Math.abs(math.geometry("frame").incorrect - 5.0487453374) < 1e-9);
const positiveContrast = math.evaluate({coupling: 1}), negativeContrast = math.evaluate({coupling: -1});
assert(positiveContrast.visualCoefficient > 0 && negativeContrast.visualCoefficient < 0);
for (const replay of [positiveContrast, negativeContrast]) {
  const positiveChange = math.conditionalCurve(replay, 1, 1) - math.conditionalCurve(replay, -1, 1);
  const negativeChange = math.conditionalCurve(replay, 1, -1) - math.conditionalCurve(replay, -1, -1);
  assert(Math.sign(positiveChange) === -Math.sign(negativeChange));
}
for (const author of ["Yuhang Han", "Dingning Liu", "Yujie Chen", "Yaojie Zhang", "Jingwei Song", "Zequn Yang", "Xuanming Shang", "Li Ding", "Zhijiang Guo", "Linfeng Zhang"]) {
  assert(html.includes(`class="author-name">${author}<sup>`));
  assert(html.includes(`name="citation_author" content="${author}"`));
}
assert(html.includes("1,2,3,*") && html.includes("4,*") && html.includes("1,†") && html.includes("2,†"));
console.log("Passed: local assets, data, author metadata, geometry, 18 synthetic estimator settings, positive weights, global normalization, evidence identity and advantage-sign preservation.");
