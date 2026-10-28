"use strict";

// Copy is bundled locally; no translation, font, animation or chart CDN is needed.
const originalCopy = {};
document.querySelectorAll("[data-i18n], [data-i18n-html]").forEach((node) => {
  const html = node.hasAttribute("data-i18n-html");
  originalCopy[node.dataset[html ? "i18nHtml" : "i18n"]] = html ? node.innerHTML : node.textContent;
});

const chinese = {
  "skip": "跳到正文",
  "nav.motivation": "研究动机", "nav.method": "方法机制", "nav.results": "实验结果", "nav.resources": "论文资料", "nav.paper": "论文",
  "hero.eyebrow": "多模态强化学习", "hero.status": "arXiv:2610.32324",
  "hero.title": "从视觉关联<br>到<em>学习信用分配。</em>",
  "hero.subtitle": "From Visual Affinity to Learning Credit in Multimodal Reinforcement Learning",
  "hero.description": "视觉关联描述的是一种表征关系，如何据此调整学习，还需要结合结果反馈。OVC 通过结果条件校准，把视觉关联转化为 token 级的学习信用。",
  "hero.paper": "阅读论文", "hero.explore": "探索方法机制", "hero.authors": "Outcome-Conditioned Visual Credit · OVC",
  "overview.kicker": "用动画理解核心思路", "overview.visual": "视觉信号", "overview.outcome": "结果证据", "overview.note": "合成数据数值回放，非模型真实轨迹", "overview.swipe": "左右滑动，查看完整计算图 →",
  "animation.pause": "暂停", "animation.play": "播放",
  "diagram.input": "图像 + 问题", "diagram.question": "读取、观察、推理。", "diagram.rve": "相对视觉编码", "diagram.image": "图像亲和度", "diagram.context": "提示上下文亲和度", "diagram.relative": "在上下文参照下度量视觉关联", "diagram.oec": "依据结果进行校准", "diagram.evidence": "视觉关联 → 结果证据", "diagram.nca": "分配学习信用", "diagram.preserve": "权重为正，优势符号不变。",
  "stat.gain": "六项基准均分相对 GSPO 的提升", "stat.models": "个模型", "stat.scales": "Qwen3-VL 4B / 8B · Qwen3.5 9B", "stat.modules": "个额外模块", "stat.inference": "推理阶段无需新增模块",
  "motivation.kicker": "研究动机", "motivation.title": "一个最终结果，<br>覆盖了不同作用的 token。",
  "motivation.intro": "多模态回答同时包含视觉观察、信息解释和后续推理。整段回答共享一个优势值，无法区分这些环节应该获得多强的更新。",
  "example.label": "一个解释性失败案例", "example.question": "每个红色标记计 2 分，一共多少分？", "example.answer": "正确答案：6",
  "example.observation": "视觉观察", "example.observationText": "“有三个红色标记。”", "example.valid": "正确", "example.reasoning": "后续推理", "example.invalid": "错误",
  "example.update": "负的回答级优势会同时作用于两段内容。此时直接加大视觉 token 的权重，也可能放大对正确观察的负向更新。",
  "example.note": "此处为解释性示例。OVC 不使用 token 正确性标签；优势的正负表示相对奖励高低，不是对 token 正误的标注。",
  "motivation.aTitle": "亲和度需要参照系。", "motivation.aText": "同一个预测状态可能同时接近图像表征与提示文本表征。只看图像余弦相似度，无法区分相对于周围上下文的视觉关联。",
  "motivation.bTitle": "更新方向不能忽略。", "motivation.bText": "正权重在正优势回答中放大强化作用，在负优势回答中则放大抑制作用。固定地偏爱视觉关联高的 token，忽略了这一方向差异。",
  "motivation.cTitle": "测量结果需要校准。", "motivation.cText": "OVC 比较正负优势两侧的特征均值，并考虑侧内变化尺度。视觉关联通过实际观测到的结果差异提供证据，而不是直接获得固定奖励。",
  "evidence.label": "论文中的动机证据", "evidence.text": "冻结模型分析中，按图像亲和度从低到高划分的四组准确率为 80.2%、77.8%、82.2%、79.8%。亲和度最高的一组并非最准确。在图像亲和度近似匹配的回答对中，上下文亲和度也对应不同的结果统计。", "evidence.source": "图 1 · arXiv ↗",
  "method.kicker": "方法机制", "method.title": "先测量，再校准，<br><em>最后分配信用。</em>",
  "method.intro": "OVC 复用已有采样回答，用不参与梯度传播的统计量估计信用。它调整各 token 的更新强度，同时保留原优势符号与 GSPO 的序列级裁剪。",
  "method.rveTitle": "相对视觉编码", "method.rveText": "在相同的回答内对角缩放下，计算预测状态对图像与非图像提示的亲和度差。上下文原型来自原始多模态输入，无需额外执行纯文本前向。", "method.rveDetail": "余弦计算不减去均值；预测状态与两个原型应用同一个缩放。",
  "method.oecTitle": "结果条件证据校准", "method.oecText": "把相对视觉坐标与不确定性缩放特征 v = (1 − p)h 拼接，其中 p 为当前 actor 给采样 token 的概率。在正则化的对角侧内度量下，比较联合特征到正负优势参考均值的距离。", "method.oecDetail": "统计量按优势绝对值加权；进行一次软参考均值更新。度量矩阵与更新前的边际尺度保持固定。",
  "method.ncaTitle": "归一化信用分配", "method.ncaText": "将带有回答优势符号的证据 cᵢe(z) 映射为正的原始权重。在 actor 小批次的所有有效 token 上进行全局归一化，再用停止梯度的 token 权重乘以回答级优势。", "method.ncaDetail": "全局 token 平均权重为 1。这保持优势符号，不保证最终策略梯度范数不变。零优势 token 也参与归一化。",
  "lab.kicker": "亲手调整校准规则", "lab.title": "视觉信号何时影响信用？", "lab.tag": "二维合成示意",
  "lab.description": "调整视觉参考均值之差。差值为正、为零或为负时，视觉坐标对证据的作用不同。再切换回答的优势符号，观察权重怎样变化。", "lab.contrast": "视觉参考均值差", "lab.sign": "回答级优势", "lab.coefficient": "直接视觉贡献的系数", "lab.tokens": "归一化后的 token 权重", "lab.mean": "小批次 token 均值 = 1.000", "lab.observation": "观察片段", "lab.reasoning": "推理片段", "lab.after": "加权后的优势",
  "lab.disclaimer": "基于公式 (4)、(5)、(12) 的固定参考二维合成示例，并非真实模型轨迹或因果归因。归一化同时包含正负优势两侧的 16 个 token。原始权重范围为 [0.8, 1.2]，归一化后不一定仍在此区间。",
  "details.title": "展开查看一次训练更新", "details.passesTitle": "四遍统计前向，一次策略更新。", "details.pass1": "聚合停止梯度的优势加权参考矩，构造正则化对角度量。", "details.pass2": "使用初始参考均值，估计两个优势侧的边际尺度。", "details.pass3": "执行一次软参考均值更新，保持度量与边际尺度固定。", "details.pass4": "计算所有有效 token 的原始权重全局均值。", "details.pass5": "重新计算可微对数概率，通过 GSPO-token 应用停止梯度的信用权重，累积梯度后仅更新一次 actor。",
  "details.boundaryTitle": "方法的推断范围", "details.boundary": "五遍计算之间，actor 参数不变。参考分组依据组相对优势的符号；所用奖励同时包含准确性与格式。因此，分组不是 token 正确性标签。估计器使用对角度量，不是全协方差模型，也不提供因果 token 归因。", "details.scope": "参考估计公式要求两侧均有正质量。若所有采样组内奖励都相同，优势和策略梯度均为零。论文所述形式针对带图像的输入。", "details.source": "算法 1 · 附录 F ↗", "framework.caption": "完整框架图，取自所提供稿件的图 2。",
  "results.kicker": "实验依据", "results.title": "三个模型，<br>均获得平均性能提升。", "results.intro": "在每个模型设置内，对比方法共享指令微调初始权重、强化学习数据与采样配置。以下数字取自论文表 1，均为四次独立运行的平均值。", "results.gainNote": "六项基准的算术平均：GSPO → GSPO + OVC。提升单位为百分点，不是相对百分比。9B 模型使用了不同且更大的训练数据集。", "results.download": "下载数据 ↓", "results.chartTitle": "各基准相对 GSPO 的变化", "results.pp": "单位：百分点", "results.caption": "论文表 1 的主要实验结果，分数均为百分数。", "results.method": "方法", "results.average": "均分", "results.readingLabel": "如何准确理解这些结果", "results.reading": "三个模型的六任务均分均有提升，但并非每个单项都提高：Qwen3.5-9B 的 MathVerse 相对 GSPO 降低 0.94 个百分点；8B 的 We-Math 上，DelTA 也更强。OVC 的结果支持给定设置下整体均分更高，不表示所有基准全面占优。",
  "ablation.kicker": "不仅仅是权重不均匀", "ablation.title": "权重分给哪个 token，确实重要。", "ablation.text": "把每条回答的权重替换为该回答内均值，会损失 1.48 个百分点。回答内随机置换权重则损失 1.56 个百分点，尽管该回答拥有的权重集合完全不变。增益取决于权重与具体 token 的对应关系。", "ablation.note": "表 2 · Qwen3-VL-8B · 此处为四任务均分，与上方六任务均分不同。完整 OVC 为 63.85，GSPO 为 62.57。", "ablation.interactionTitle": "为什么视觉坐标与校准需要共同发挥作用", "ablation.interaction": "使用侧内校准时，加入视觉坐标使均分由 61.98 提高到 63.85；使用单位度量时，反而由 62.29 降至 62.10。这一交互作用说明，视觉亲和度不应被当作独立有效的固定加分项。", "ablation.variant": "消融设置", "ablation.change": "相对完整 OVC 的变化", "ablation.noVisual": "去掉视觉坐标", "ablation.absolute": "绝对图像亲和度", "ablation.identity": "单位度量矩阵", "ablation.responseMean": "回答内均值权重", "ablation.permutation": "回答内随机置换", "ablation.ranked": "按亲和度排序权重",
  "efficiency.kicker": "仅增加训练阶段计算", "efficiency.title": "复用采样回答，<br>保持推理路径不变。", "efficiency.text": "OVC 不引入可学习预测头、额外奖励模型或过程标注。新增计算来自不参与梯度传播的训练统计，而不是推理计算图。", "efficiency.share": "在测得的一次完整训练步中，OVC 专属统计遍历所占的时间比例", "efficiency.ovc": "OVC 统计计算", "efficiency.note": "图 4 给出一次完整训练步的测量。这是总步耗时中的占比，不是通用减速比，也不是推理开销。",
  "resources.kicker": "继续阅读", "resources.title": "查看完整论文。", "resources.description": "推导、评估协议、完整消融实验和 actor 更新算法，均包含在论文及补充材料中。", "resources.paper": "论文与补充材料", "resources.method": "方法与理论推导", "resources.results": "实验与消融", "resources.algorithm": "Actor 更新算法", "resources.animation": "机制动图",
  "citation.title": "BibTeX 引用", "citation.copy": "复制 BibTeX", "citation.note": "请使用上方 BibTeX 引用 arXiv:2610.32324。论文链接均指向 arXiv 页面。", "footer.text": "结合结果反馈，理解视觉关联。", "footer.top": "返回顶部 ↑",
};

const dynamicCopy = {
  en: {
    "animation.play": "Play",
    "phase.0": "01 / Relative visual encoding", "phase.1": "02 / Outcome-conditioned calibration", "phase.2": "03 / Normalized credit allocation",
    "contrast.positive": "Higher relative visual affinity contributes more positive evidence under these fixed statistics.",
    "contrast.zero": "The direct visual term is zero. Visual affinity alone contributes no evidence in this fixed-statistic comparison.",
    "contrast.negative": "The visual contribution reverses: higher relative affinity contributes more negative evidence under these fixed statistics.",
    "lab.positive": "Positive response: larger signed evidence increases its weight. All weighted advantages remain positive.",
    "lab.negative": "Negative response: positive-side evidence can reduce the weight of its negative update. All weighted advantages remain negative; no token is relabelled.",
    "copy.done": "Copied", "copy.failed": "Select the reference to copy",
  },
  zh: {
    "phase.0": "01 / 相对视觉编码", "phase.1": "02 / 结果条件校准", "phase.2": "03 / 归一化信用分配",
    "contrast.positive": "在当前固定统计量下，相对视觉亲和度越高，直接视觉项贡献的正证据越强。",
    "contrast.zero": "直接视觉项为零。在这一固定统计量比较中，视觉亲和度本身不贡献证据。",
    "contrast.negative": "视觉项的作用方向反转：在当前固定统计量下，较高相对亲和度贡献更负的证据。",
    "lab.positive": "正优势回答：带符号证据越大，权重越高。加权后的优势始终为正。",
    "lab.negative": "负优势回答：偏向正优势参考的证据，可以减小负向更新的权重。加权后的优势仍全部为负；算法没有给 token 改写正误标签。",
    "copy.done": "已复制", "copy.failed": "请选中参考信息复制",
  },
};

let language = "en";
let selectedModel = "8b";
let results = null;
let responseSign = -1;
Object.assign(chinese, window.OVCResearch.translations);
chinese["dynamics.source"] = "图 5 · arXiv ↗";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let paused = reducedMotion.matches;
let progress = 0;
let overviewVisible = true;
const $ = (selector) => document.querySelector(selector);
const t = (key) => (language === "zh" ? chinese[key] : undefined) ?? dynamicCopy[language]?.[key] ?? originalCopy[key] ?? key;
const signed = (value, digits = 2) => `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(digits)}`;

function setLanguage(nextLanguage) {
  language = nextLanguage;
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n], [data-i18n-html]").forEach((node) => {
    const html = node.hasAttribute("data-i18n-html");
    const key = node.dataset[html ? "i18nHtml" : "i18n"];
    if (html) node.innerHTML = t(key);
    else node.textContent = t(key);
  });
  $("#language-toggle").innerHTML = language === "zh" ? 'EN <span aria-hidden="true">⇄</span>' : '中文 <span aria-hidden="true">⇄</span>';
  $("#language-toggle").setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换到中文");
  try { localStorage.setItem("ovc-language", language); } catch { /* Private browsing may disable storage. */ }
  updatePauseButton();
  renderLab();
  renderOverview(progress);
  if (results) renderResults();
}

$("#language-toggle").addEventListener("click", () => setLanguage(language === "en" ? "zh" : "en"));
$("#menu-toggle").addEventListener("click", () => {
  const expanded = $("#menu-toggle").getAttribute("aria-expanded") === "true";
  $("#menu-toggle").setAttribute("aria-expanded", String(!expanded));
  $("#nav-links").classList.toggle("open", !expanded);
});
document.querySelectorAll("#nav-links a").forEach((link) => link.addEventListener("click", () => {
  $("#menu-toggle").setAttribute("aria-expanded", "false");
  $("#nav-links").classList.remove("open");
}));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $("#menu-toggle").setAttribute("aria-expanded", "false");
    $("#nav-links").classList.remove("open");
  }
});

// Numerical scene renderer; no empirical results are generated by the animation.
function renderOverview(value) {
  progress = ((value % 1) + 1) % 1;
  window.OVCResearch.seek(progress);
  $("#overview-phase").textContent = window.OVCResearch.phaseLabel(Math.floor(progress * 5));
  $("#overview-progress").style.width = `${progress * 100}%`;
}
document.querySelectorAll("[data-mechanism-stage]").forEach(button => button.addEventListener("click", () => {
  paused = true;
  updatePauseButton();
  renderOverview((Number(button.dataset.mechanismStage) + .3) / 5);
}));

function updatePauseButton() {
  $("#overview-pause").innerHTML = `${paused ? "▶" : "Ⅱ"} <span>${t(paused ? "animation.play" : "animation.pause")}</span>`;
  $("#overview-pause").setAttribute("aria-pressed", String(paused));
  $("#overview-pause").setAttribute("aria-label", language === "zh" ? (paused ? "播放机制动画" : "暂停机制动画") : (paused ? "Play mechanism animation" : "Pause mechanism animation"));
  $(".overview-figure").classList.toggle("paused", paused);
}

$("#overview-pause").addEventListener("click", () => { paused = !paused; updatePauseButton(); });
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => { overviewVisible = entry.isIntersecting; }).observe($("#overview-animation"));
}
let lastFrame = null;
function animate(timestamp) {
  const dt = lastFrame === null ? 0 : Math.min((timestamp - lastFrame) / 1000, .1);
  lastFrame = timestamp;
  if (!paused && overviewVisible && !document.hidden) renderOverview(progress + dt / 18);
  requestAnimationFrame(animate);
}

function renderLab() {
  window.OVCResearch.setLanguage(language);
  responseSign = window.OVCResearch.getState().responseSign;
}

function renderResults() {
  const model = results.models[selectedModel];
  const winners = Array.from({ length: 7 }, (_, index) => Math.max(...model.rows.map((row) => index === 6 ? row.average ?? -Infinity : row.scores[index] ?? -Infinity)));
  $("#results-body").replaceChildren(...model.rows.map((row) => {
    const tr = document.createElement("tr");
    if (row.method === "GSPO + OVC") tr.classList.add("ours");
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = row.method;
    tr.append(label);
    [...row.scores, row.average].forEach((score, index) => {
      const cell = document.createElement("td");
      cell.textContent = score === null ? "OOM" : score.toFixed(2);
      if (score !== null && Math.abs(score - winners[index]) < .0001) cell.classList.add("best-score");
      tr.append(cell);
    });
    return tr;
  }));
  const base = model.rows.find((row) => row.method === "GSPO");
  const ours = model.rows.find((row) => row.method === "GSPO + OVC");
  $("#benchmark-deltas").replaceChildren(...results.benchmarks.map((benchmark, index) => {
    const delta = ours.scores[index] - base.scores[index];
    const card = document.createElement("div");
    card.className = `benchmark-delta${delta < 0 ? " loss" : ""}`;
    card.innerHTML = `<span>${benchmark}</span><strong>${signed(delta)}</strong><span class="delta-line"><i style="width:${Math.abs(delta) / 8 * 100}%"></i></span>`;
    return card;
  }));
  $("#model-context").textContent = language === "zh"
    ? `${model.name} · 训练数据：${model.trainingData} · 评估检查点：${model.checkpoint}。MMK12-val 使用固定的训练期验证协议。下划线表示该列最高分；OOM 表示显存不足。六项变化的短条使用统一 0–8 个百分点的幅度刻度。`
    : `${model.name} · Training: ${model.trainingData} · Evaluated checkpoint: ${model.checkpoint}. MMK12-val follows a fixed training-time validation protocol. Underlines mark column maxima; OOM means out of memory. Delta bars share a 0–8 pp magnitude scale.`;
  document.querySelectorAll("[data-model]").forEach((button) => {
    const active = button.dataset.model === selectedModel;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

document.querySelectorAll("[data-model]").forEach((button) => button.addEventListener("click", () => {
  if (!results) return;
  selectedModel = button.dataset.model;
  renderResults();
}));

fetch("data/results.json")
  .then((response) => { if (!response.ok) throw new Error(`Results request failed: ${response.status}`); return response.json(); })
  .then((data) => { results = data; renderResults(); })
  .catch(() => {
    $("#model-context").textContent = "Interactive data could not be loaded. Default Qwen3-VL-8B results remain above. Use a local HTTP server or GitHub Pages for the full interactive version.";
    document.querySelectorAll("[data-model]").forEach((button) => { button.disabled = true; });
  });

$("#copy-citation").addEventListener("click", async () => {
  const text = $("#citation-text").textContent;
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      copied = true;
    } else {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      copied = document.execCommand("copy");
      field.remove();
    }
  } catch { copied = false; }
  if (!copied) {
    const range = document.createRange();
    range.selectNodeContents($("#citation-text"));
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }
  $("#copy-citation").textContent = t(copied ? "copy.done" : "copy.failed");
  $("#copy-status").textContent = t(copied ? "copy.done" : "copy.failed");
  setTimeout(() => { $("#copy-citation").textContent = t("citation.copy"); }, 2200);
});

// Deterministic seeking is also used by the local GIF exporter and browser checks.
window.OVCDemo = {
  seek(value) { paused = true; updatePauseButton(); renderOverview(value); },
  getState() { return { language, paused, progress, responseSign: window.OVCResearch.getState().responseSign, model: selectedModel, resultsLoaded: Boolean(results) }; },
  calculateLab: window.OVCResearch.calculate,
  research: window.OVCResearch,
};

let initialLanguage = "en";
try { if (localStorage.getItem("ovc-language") === "zh") initialLanguage = "zh"; } catch { /* Optional persistence. */ }
setLanguage(initialLanguage);
requestAnimationFrame(animate);
