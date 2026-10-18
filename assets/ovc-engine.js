/* Numerical OVC replay. Synthetic features; equations follow the supplied paper.
 * No token-correctness labels are used by the estimator. */
(function (root) {
  "use strict";
  const H = 32, T = 24, B = 8, EPS = 1e-8;
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const dot = (a, b) => a.reduce((s, v, k) => s + v * b[k], 0);
  const sigmoid = (x) => 1 / (1 + Math.exp(-Math.max(-60, Math.min(60, x))));
  const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
  const cosine = (a, b) => dot(a, b) / Math.max(EPS, Math.sqrt(dot(a, a) * dot(b, b)));
  const zeros = () => Array(H + 1).fill(0);

  function weightedMean(tokens, extra = () => 1) {
    const out = zeros(); let mass = 0;
    for (const token of tokens) {
      const weight = Math.abs(token.advantage) * extra(token);
      mass += weight;
      token.z.forEach((v, k) => { out[k] += weight * v; });
    }
    return out.map((v) => v / Math.max(EPS, mass));
  }

  function evaluate({ coupling = .6, shrinkage = .1, scenario = "algebra" } = {}) {
    const rewards = [1, 1, 1, .1, .1, .1, .1, .1];
    const rewardMean = mean(rewards);
    const rewardSd = Math.sqrt(rewards.reduce((s, v) => s + (v - rewardMean) ** 2, 0) / (B - 1));
    const gImage = Array(H).fill(0), gContext = Array(H).fill(0);
    gImage[0] = 1; gContext[0] = .35; gContext[1] = Math.sqrt(1 - .35 ** 2);
    const responses = [], tokens = [];
    for (let r = 0; r < B; r += 1) {
      const advantage = (rewards[r] - rewardMean) / (rewardSd + EPS);
      const sign = Math.sign(advantage);
      const states = [], probabilities = [];
      for (let t = 0; t < T; t += 1) {
        const phase = Math.floor(t / 6);
        const failure = sign < 0 && phase >= (scenario === "frame" ? 1 : 2);
        const outcomeDirection = failure ? -1 : 1;
        const visual = [1.45, 1.05, .45, .25][phase] + coupling * sign * [.2, .3, .6, .6][phase];
        const context = [.7, .85, 1.0, 1.1][phase] + .1 * Math.sin(t * .85);
        const h = Array(H).fill(0);
        h[0] = visual + .35 * context + .07 * Math.sin(t * .61 + r * .11);
        h[1] = Math.sqrt(1 - .35 ** 2) * context + .06 * Math.cos(t * .82);
        for (let k = 2; k < H; k += 1) {
          const basis = .55 * Math.sin(k * .83) + .4 * Math.cos(k * .41);
          h[k] = outcomeDirection * [.3, .5, .65, .7][phase] * basis
            + .17 * Math.sin((t + 1) * (k + 1) * .73 + r * .09)
            + .09 * Math.cos((t + 3) * (k + 2) * .19);
        }
        states.push(h);
        probabilities.push(.42 + .37 * ((t % 6) / 5) + .025 * Math.sin(t + r * .3));
      }
      const scales = Array.from({ length: H }, (_, k) => Math.max(1e-6, sd(states.map((h) => h[k]))));
      const imageScaled = gImage.map((v, k) => v / scales[k]);
      const contextScaled = gContext.map((v, k) => v / scales[k]);
      const responseTokens = states.map((h, t) => {
        const hScaled = h.map((v, k) => v / scales[k]);
        const imageAffinity = cosine(hScaled, imageScaled);
        const contextAffinity = cosine(hScaled, contextScaled);
        const rho = imageAffinity - contextAffinity;
        const p = probabilities[t];
        const z = [...h.map((v) => (1 - p) * v), rho];
        return { r, t, phase: Math.floor(t / 6), h, p, rho, imageAffinity, contextAffinity,
          z, advantage, sign, scales };
      });
      responses.push({ r, reward: rewards[r], advantage, sign, tokens: responseTokens });
      tokens.push(...responseTokens);
    }

    const positive = tokens.filter((x) => x.sign > 0), negative = tokens.filter((x) => x.sign < 0);
    const mu0plus = weightedMean(positive), mu0minus = weightedMean(negative);
    const q = zeros();
    for (const [side, reference] of [[positive, mu0plus], [negative, mu0minus]]) {
      const mass = side.reduce((s, x) => s + Math.abs(x.advantage), 0);
      for (const token of side) token.z.forEach((v, k) => { q[k] += Math.abs(token.advantage) * (v - reference[k]) ** 2 / mass; });
    }
    const qbar = mean(q.slice(0, H)); // Visual coordinate is excluded from shrinkage target.
    const D = q.map((v) => Math.max((1 - shrinkage) * v + shrinkage * qbar + EPS, .001 * qbar + EPS));
    const evidence = (z, plus, minus) => z.reduce((s, v, k) => s + ((v - minus[k]) ** 2 - (v - plus[k]) ** 2) / D[k], 0);
    tokens.forEach((x) => { x.e0 = evidence(x.z, mu0plus, mu0minus); });
    const tauPlus = Math.max(EPS, sd(positive.map((x) => x.e0)));
    const tauMinus = Math.max(EPS, sd(negative.map((x) => -x.e0)));
    tokens.forEach((x) => { x.tau = x.sign > 0 ? tauPlus : tauMinus; x.u0 = sigmoid(x.sign * x.e0 / x.tau); });
    const muPlus = weightedMean(positive, (x) => x.u0), muMinus = weightedMean(negative, (x) => x.u0);
    const delta = muPlus.map((v, k) => v - muMinus[k]);
    const midpoint = muPlus.map((v, k) => (v + muMinus[k]) / 2);
    const b = delta.map((v, k) => v / D[k]);
    tokens.forEach((x) => {
      x.evidence = evidence(x.z, muPlus, muMinus);
      x.margin = x.sign * x.evidence / x.tau;
      x.rawWeight = .8 + .4 * sigmoid(x.margin);
      x.projection = dot(b.slice(0, H), x.z.slice(0, H).map((v, k) => v - midpoint[k]));
    });
    const Z = mean(tokens.map((x) => x.rawWeight));
    const ranked = [...tokens].sort((a, b) => a.rho - b.rho);
    ranked.forEach((x, index) => { x.affinityWeight = .8 + .4 * index / (ranked.length - 1); });
    tokens.forEach((x) => { x.weight = x.rawWeight / Z; x.update = x.advantage * x.weight; });
    const result = { H, T, B, N: B * T, coupling, shrinkage, scenario, responses, tokens, positive, negative,
      mu0plus, mu0minus, muPlus, muMinus, midpoint, delta, b, D, qbar, tauPlus, tauMinus, Z,
      rewardMean, rewardSd, weightMean: mean(tokens.map((x) => x.weight)),
      visualCoefficient: 2 * delta[H] / D[H] };
    return result;
  }

  function stageMeans(tokens, key) {
    return Array.from({ length: 4 }, (_, phase) => mean(tokens.filter((x) => x.phase === phase).map((x) => x[key])));
  }

  function conditionalCurve(batch, rho, sign) {
    // Fixed v at the reference midpoint; D, references, tau and Z are held fixed.
    const e = batch.visualCoefficient * (rho - batch.midpoint[H]);
    const tau = sign > 0 ? batch.tauPlus : batch.tauMinus;
    return (.8 + .4 * sigmoid(sign * e / tau)) / batch.Z;
  }

  function geometry(scenario = "algebra") {
    const angle = scenario === "frame" ? 25 : 65;
    const multiplier = scenario === "algebra" ? 88 : 176;
    return {
      correct: Math.sqrt(8 ** 2 + 11 ** 2 - 2 * 8 * 11 * Math.cos(65 * Math.PI / 180)),
      incorrect: Math.sqrt(8 ** 2 + 11 ** 2 - multiplier * Math.cos(angle * Math.PI / 180)),
      angle, multiplier,
    };
  }
  root.OVCMath = { evaluate, stageMeans, conditionalCurve, geometry, mean, dot, sigmoid };
})(globalThis);
