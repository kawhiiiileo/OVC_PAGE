/* Academic SVG renderer for the numerical OVC replay. */
(function () {
  "use strict";
  const M = window.OVCMath;
  const $ = (s) => document.querySelector(s);
  let language = "en", sign = -1, scenario = "algebra", currentProgress = 0;
  let batch = M.evaluate(), lastFrameKey = "", revision = 0;
  const l = (en, zh) => language === "zh" ? zh : en;
  const f = (v, n = 3) => Number(v).toFixed(n);
  const signed = (v, n = 3) => `${v < 0 ? "−" : "+"}${f(Math.abs(v), n)}`;
  const stageNames = () => l(["Perception", "Frame conversion", "Cosine law", "Solve"], ["视觉读取", "参照系转换", "余弦定理", "距离求解"]);
  const colours = { positive: "#4d8063", negative: "#b87a60", purple: "#7960ae", grey: "#a4aca1" };
  const selectedResponse = () => batch.responses[sign > 0 ? 0 : 3];
  const text = (x, y, value, extra = "") => `<text x="${x}" y="${y}" ${extra}>${value}</text>`;
  const pathLine = (points) => points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  const spread = (values) => { const m = M.mean(values); return Math.sqrt(M.mean(values.map((x) => (x - m) ** 2))); };

  const translations = {
    "dynamics.kicker": "论文实测训练趋势", "dynamics.title": "收益也体现在训练过程中。", "dynamics.text": "论文中 Qwen3.5-9B 在 Math77K 上的训练轨迹显示，OVC 的训练奖励与 MMK12-val 表现整体高于 GSPO。此处保留原始报告曲线，不重建或模拟时间序列。", "dynamics.source": "图 5 · 稿件第 7 页 ↗", "dynamics.caption": "保留论文原始坐标轴与曲线。蓝色：GSPO；红色：OVC。Qwen3.5-9B / Math77K。",

    "authors.equal": "共同第一作者。", "authors.corresponding": "通讯作者。",
    "academic.supervision": "结果监督 · 组相对优势", "academic.rollouts": "采样 G = 8 条回答轨迹", "academic.advantages": "相对奖励，不是 token 正误标签", "academic.clipping": "保留序列级比率与裁剪", "academic.estimator": "停止梯度的估计器 · ACTOR 参数保持固定", "academic.tensor": "预测状态张量 · 24 × 32", "academic.refine": "μ⁰ → μ* · 一次软更新", "academic.metric": "D：正则化的对角侧内变化尺度", "academic.deviation": "逐 token 权重偏移 Δw = w − 1", "academic.step0": "采样监督", "academic.step4": "策略更新",
    "survey.kicker": "几何推理 · 坐标参照", "survey.question": "Q 位于 P 正东 11 km。R 距 P 8 km，从正北顺时针测得方位角 025°。求 Q 与 R 的距离。", "survey.correct": "经几何计算验证的解", "survey.algebra": "后续代数错误", "survey.frame": "参照系转换错误", "survey.takeaway": "最终答案错误，无法定位错误发生在哪一步。方位角读取可能正确，而出错的是坐标参照转换，或之后的代数运算。",
    "example.note": "这里为构造的测绘案例，回放特征坐标是合成数据。“正确／错误”只解释案例，不输入 OVC 估计器。优势符号对应相对奖励，而不是 token 正确性。",
    "research.kicker": "机制数值工作台", "research.title": "从表征几何，到策略更新强度。", "research.coupling": "注入的视觉—结果关联强度 κ", "research.shrinkage": "侧内方差收缩系数 η", "research.trajectory": "选择要检查的回答轨迹", "research.scope": "两侧参考统计量均在整个 actor 小批次上重新估计。", "research.controlNote": "κ 改变合成数据中注入的视觉—结果关联，不是 OVC 的训练超参数；η 控制方差收缩。每次调整后都会重新估计参考统计量、度量和归一化常数。", "research.geometry": "结果判别方向上的特征几何", "research.geometryNote": "横轴将全部 32 个预测特征投影到当前校准方向；纵轴为相对视觉亲和度。虚线表示证据为零，不是 token 正误边界。", "research.sensitivity": "视觉信用的条件敏感性", "research.sensitivityNote": "将预测特征固定在参考中点，固定 μ*、D、τ、Z，扫描 ρ。优势符号改变时曲线斜率方向相反。这是条件敏感性示意，不是因果归因。", "research.traceKicker": "沿推理过程观察信用分配", "research.trendTitle": "比较三种分配方式下的逐阶段更新。", "research.inspect": "展开检查估计器：参考矩、对角度量与一次软更新", "research.disclaimer": "本区所有几何、特征与分配曲线均由 H=32、B=8、T=24 的合成小批次计算，并非训练模型的真实轨迹。估计过程遵循公式 (1)–(12)，包含回答内缩放、优势绝对值加权、对角侧内变化、一次软更新和全局归一化。论文 9B 配方使用 H=4096。条件曲线固定参考统计量与 Z；批次图则重新计算这些量。亲和度排序曲线是解释性启发式，不是某一具名基线的复现。此处不模拟准确率或实验性能趋势。",
  };

  function scatterMarkup(width, height, mini = false) {
    const b = batch, pad = mini ? { l: 29, r: 14, t: 13, b: 29 } : { l: 58, r: 23, t: 23, b: 55 };
    const sigma = Math.max(.01, spread(b.tokens.map((x) => x.projection)));
    const extent = Math.max(2, ...b.tokens.map((x) => Math.abs(x.projection / sigma) + .2));
    const sx = (v) => pad.l + (v / extent + 1) / 2 * (width - pad.l - pad.r);
    const sy = (v) => height - pad.b - (v + 1) / 2 * (height - pad.t - pad.b);
    const projection = (z) => M.dot(b.b.slice(0, b.H), z.slice(0, b.H).map((v, k) => v - b.midpoint[k])) / sigma;
    const clip = mini ? "clip-mini-space" : "clip-full-space";
    let s = `<defs><clipPath id="${clip}"><rect x="${pad.l}" y="${pad.t}" width="${width-pad.l-pad.r}" height="${height-pad.t-pad.b}"/></clipPath></defs>`;
    s += `<g clip-path="url(#${clip})">`;
    for (let ix = 0; ix < 24; ix += 1) for (let iy = 0; iy < 14; iy += 1) {
      const u = -extent + (ix + .5) / 24 * 2 * extent, rho = -1 + (iy + .5) / 14 * 2;
      const e = 2 * sigma * u + b.visualCoefficient * (rho - b.midpoint[b.H]);
      const opacity = .025 + .085 * Math.min(1, Math.abs(e) / (3 * (b.tauPlus+b.tauMinus)/2));
      s += `<rect x="${sx(-extent+ix/24*2*extent)}" y="${sy(-1+(iy+1)/14*2)}" width="${(width-pad.l-pad.r)/24+.5}" height="${(height-pad.t-pad.b)/14+.5}" fill="${e>=0?colours.positive:colours.negative}" opacity="${opacity}"/>`;
    }
    for (const value of [-2, -1, 0, 1, 2]) {
      const evidence = value * (b.tauPlus+b.tauMinus)/2;
      const line = [];
      if (Math.abs(b.visualCoefficient) > .001) {
        for (let i=0;i<=40;i++) { const u=-extent+i/40*2*extent; const rho=b.midpoint[b.H]+(evidence-2*sigma*u)/b.visualCoefficient; line.push([sx(u),sy(rho)]); }
      } else {
        const x = sx(evidence/(2*sigma)); line.push([x,sy(-1)],[x,sy(1)]);
      }
      s += `<path d="${pathLine(line)}" fill="none" stroke="${value===0?'#66705f':'#b9c4b4'}" stroke-width="${value===0?1.3:.6}" stroke-dasharray="${value===0?'5 4':'2 5'}"/>`;
    }
    for (const token of b.tokens) {
      const selected = token.r === selectedResponse().r;
      s += `<circle cx="${sx(token.projection/sigma)}" cy="${sy(token.rho)}" r="${mini?1.8:selected?3.1:2.4}" fill="${selected?colours.purple:token.sign>0?colours.positive:colours.negative}" opacity="${selected?.8:.3}"/>`;
    }
    for (const [side, initial, refined, colour] of [[b.positive,b.mu0plus,b.muPlus,colours.positive],[b.negative,b.mu0minus,b.muMinus,colours.negative]]) {
      const x = sx(projection(refined)), y = sy(refined[b.H]), x0 = sx(projection(initial)), y0 = sy(initial[b.H]);
      const radiusX = Math.max(4,spread(side.map(t=>t.projection/sigma))*(width-pad.l-pad.r)/(2*extent));
      const radiusY = Math.max(4,spread(side.map(t=>t.rho))*(height-pad.t-pad.b)/2);
      s += `<ellipse cx="${x}" cy="${y}" rx="${radiusX}" ry="${radiusY}" fill="none" stroke="${colour}" opacity=".35"/>`;
      s += `<path d="M${x0},${y0}L${x},${y}" stroke="${colour}" stroke-width="1.2"/><circle cx="${x0}" cy="${y0}" r="${mini?4:6}" fill="none" stroke="${colour}" stroke-dasharray="2 2"/>`;
      s += `<path d="M${x-5},${y}h10M${x},${y-5}v10" stroke="${colour}" stroke-width="2.2"/>`;
      s += text(x+7,y-8,colour===colours.positive?'μ*₊':'μ*₋',`fill="${colour}" font-size="${mini?10:13}" class="reference-label"`);
    }
    s += `<circle id="${mini?'mini-query':'full-query'}" cx="0" cy="0" r="${mini?4:6}" fill="#fff" stroke="${colours.purple}" stroke-width="2"/></g>`;
    s += `<path d="M${pad.l},${pad.t}V${height-pad.b}H${width-pad.r}" fill="none" stroke="#aab3a4"/>`;
    for (const tick of [-1,0,1]) s+=text(sx(tick),height-pad.b+15,tick,`text-anchor="middle" class="plot-tick"`);
    for (const tick of [-.5,0,.5]) s+=text(pad.l-7,sy(tick)+3,tick,`text-anchor="end" class="plot-tick"`);
    s += text(width/2,height-(mini?2:11),mini?'bₕᵀ(v − μ̄ₕ) / sₕ':l('Predictive discriminant bₕᵀ(v − μ̄ₕ) / sₕ','预测判别方向 bₕᵀ(v − μ̄ₕ) / sₕ'),'text-anchor="middle" class="plot-axis"');
    s += text(mini?9:15,pad.t+6,'ρ','class="plot-axis"');
    if (!mini) s+=text(width-pad.r,pad.t-6,l('× refined mean    ◌ initial mean','× 更新后均值    ◌ 初始均值'),'text-anchor="end" class="plot-tick"');
    return { markup:s, position:(token)=>[sx(token.projection/sigma),sy(token.rho)] };
  }

  let miniPosition = () => [0,0], fullPosition = () => [0,0];
  function sigmoidMarkup() {
    const sx=(v)=>12+(v+5)/10*225, sy=(v)=>74-(v-.8)/.4*58;
    const points=Array.from({length:61},(_,i)=>{const x=-5+i/6;return[sx(x),sy(.8+.4*M.sigmoid(x))];});
    return `<path d="M12 13V74H240" fill="none" stroke="#bbc4b4"/><path d="${pathLine(points)}" fill="none" stroke="#9d8b58" stroke-width="2"/>${text(1,76,'.8','class="plot-tick"')}${text(1,18,'1.2','class="plot-tick"')}${text(12,86,'−5','class="plot-tick"')}${text(229,86,'+5','class="plot-tick"')}<circle id="sigmoid-query" r="3.6" fill="#7960ae" stroke="#fff"/>`;
  }

  function renderSensitivity() {
    const w=550,h=345,pad={l:59,r:25,t:28,b:55};
    const ymin=Math.floor((.8/batch.Z-.02)*20)/20, ymax=Math.ceil((1.2/batch.Z+.02)*20)/20;
    const sx=(x)=>pad.l+(x+1)/2*(w-pad.l-pad.r), sy=(y)=>h-pad.b-(y-ymin)/(ymax-ymin)*(h-pad.t-pad.b);
    let s='';
    for(let i=0;i<5;i++){const y=ymin+i/4*(ymax-ymin);s+=`<path d="M${pad.l} ${sy(y)}H${w-pad.r}" stroke="#e3e7dd"/>`+text(pad.l-8,sy(y)+3,f(y,2),'text-anchor="end" class="plot-tick"');}
    s+=`<path d="M${pad.l},${sy(1)}H${w-pad.r}" stroke="#98a78f" stroke-dasharray="4 4"/>`;
    for(const c of [1,-1]){
      const pts=Array.from({length:81},(_,i)=>{const rho=-1+i/40;return[sx(rho),sy(M.conditionalCurve(batch,rho,c))];});
      s+=`<path d="${pathLine(pts)}" fill="none" stroke="${c>0?colours.positive:colours.purple}" stroke-width="2.8"/>`;
    }
    s+=`<path d="M${pad.l} ${pad.t}V${h-pad.b}H${w-pad.r}" fill="none" stroke="#aab3a4"/>`;
    for(const x of [-1,-.5,0,.5,1])s+=text(sx(x),h-pad.b+18,f(x,1),'text-anchor="middle" class="plot-tick"');
    s+=text(w/2,h-10,l('Relative visual affinity ρ','相对视觉亲和度 ρ'),'text-anchor="middle" class="plot-axis"');
    s+=text(17,20,'w','class="plot-axis"');
    s+=text(74,19,'Aᵢ > 0',`fill="${colours.positive}" class="plot-key"`)+text(160,19,'Aᵢ < 0',`fill="${colours.purple}" class="plot-key"`);
    s+=text(w-pad.r,19,`∂e/∂ρ = ${signed(batch.visualCoefficient,2)}`,'text-anchor="end" class="plot-tick"');
    $('#credit-sensitivity').innerHTML=s;
  }

  function renderTrend() {
    const response=selectedResponse(), means=M.stageMeans(response.tokens,'weight'), affinity=M.stageMeans(response.tokens,'affinityWeight');
    const standard=Array.from({length:4},(_,phase)=>spread(response.tokens.filter(x=>x.phase===phase).map(x=>x.weight)));
    const low=Math.min(.8,...means.map((v,i)=>v-standard[i]))-.03, high=Math.max(1.16,...affinity,...means.map((v,i)=>v+standard[i]))+.03;
    const w=1040,h=280,pad={l:65,r:48,t:45,b:50},sx=(i)=>pad.l+45+i*(w-pad.l-pad.r-90)/3,sy=(v)=>h-pad.b-(v-low)/(high-low)*(h-pad.t-pad.b);
    let s='';
    for(let i=0;i<5;i++){const value=low+i/4*(high-low);s+=`<path d="M${pad.l},${sy(value)}H${w-pad.r}" stroke="#e4e7de"/>`+text(pad.l-9,sy(value)+4,f(value,2),'text-anchor="end" class="plot-tick"');}
    s+=`<path d="M${pad.l},${sy(1)}H${w-pad.r}" stroke="#9ba395" stroke-width="1.3" stroke-dasharray="6 4"/>`;
    for(const [values,colour,dashed]of[[affinity,'#b69973',false],[means,colours.purple,false]]){
      s+=`<path d="${pathLine(values.map((v,i)=>[sx(i),sy(v)]))}" fill="none" stroke="${colour}" stroke-width="2.6"/>`;
      values.forEach((v,i)=>{s+=`<circle cx="${sx(i)}" cy="${sy(v)}" r="4" fill="#fff" stroke="${colour}" stroke-width="2"/>`;});
    }
    means.forEach((v,i)=>{s+=`<path d="M${sx(i)},${sy(v-standard[i])}V${sy(v+standard[i])}M${sx(i)-5},${sy(v-standard[i])}h10M${sx(i)-5},${sy(v+standard[i])}h10" stroke="${colours.purple}" opacity=".55"/>`;s+=text(sx(i),sy(v)-12,f(v,3),`text-anchor="middle" class="plot-value" fill="${colours.purple}"`);});
    stageNames().forEach((name,i)=>{s+=text(sx(i),h-19,name,'text-anchor="middle" class="plot-axis"');});
    s+=text(66,23,l('Uniform = 1.0','均匀分配 = 1.0'),'fill="#88907f" class="plot-key"')+text(250,23,l('Affinity-ranked heuristic','亲和度排序启发式'),'fill="#aa8960" class="plot-key"')+text(500,23,'OVC','fill="#7960ae" class="plot-key"')+text(w-pad.r,23,l('Whiskers: token SD','误差线：阶段内 token 标准差'),'text-anchor="end" class="plot-tick"');
    $('#allocation-trend').innerHTML=s;
    $('#trajectory-advantage').textContent=`Aᵢ = ${signed(response.advantage)} · Rᵢ = ${f(response.reward,1)}`;
    $('#token-detail-strip').innerHTML=means.map((value,i)=>`<div><span>${stageNames()[i]}</span><strong>Δw = ${signed(value-1)}</strong><small>A′ = ${signed(value*response.advantage)}</small></div>`).join('');
    $('#research-interpretation').textContent=l(
      `For this ${sign>0?'positive':'negative'} trajectory, observation-stage weight changes from ${f(affinity[0])} under the affinity heuristic to ${f(means[0])} with OVC. The final-stage OVC weight is ${f(means[3])}. All ${batch.N} weights are positive and their global mean is ${f(batch.weightMean,6)}. These are synthetic mechanism values, not measured accuracy gains.`,
      `在当前${sign>0?'正':'负'}优势轨迹中，视觉读取阶段的权重由亲和度启发式的 ${f(affinity[0])} 变为 OVC 的 ${f(means[0])}，最后求解阶段的 OVC 权重为 ${f(means[3])}。全部 ${batch.N} 个权重均为正，全局均值为 ${f(batch.weightMean,6)}。这些是合成机制数值，不是实测准确率增益。`);
  }

  function renderCase() {
    const g=M.geometry(scenario), labels=stageNames();
    const expressions=['bearing(P→R) = 025°; PQ = 11; PR = 8',scenario==='frame'?'θ = 25°':'θ = 90° − 25° = 65°',`d² = 8² + 11² − ${g.multiplier} cos ${g.angle}°`,`d = ${f(g.incorrect,2)} km ≠ 10.52 km`];
    const valid=[true,scenario!=='frame',false,false];
    $('#reasoning-trace').innerHTML=expressions.map((expression,i)=>`<div class="trace-stage ${valid[i]?'valid':'invalid'}"><span class="trace-number">0${i+1}</span><div><span class="trace-stage-name">${labels[i]}</span><p>${expression}</p></div><span class="trace-status">${valid[i]?l('valid','正确'):l('error','错误')}</span></div>`).join('');
    document.querySelectorAll('[data-scenario]').forEach(button=>{const active=button.dataset.scenario===scenario;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  }

  function renderBatch() {
    revision+=1;
    const mini=scatterMarkup(390,190,true),full=scatterMarkup(550,345,false);
    $('#overview-scatter').innerHTML=mini.markup; miniPosition=mini.position;
    $('#evidence-space').innerHTML=full.markup; fullPosition=full.position;
    $('#overview-sigmoid').innerHTML=sigmoidMarkup();
    $('#rollout-raster').innerHTML=batch.responses.map((r)=>r.tokens.map((token)=>`<rect x="${252+token.t*10.1}" y="${78+r.r*5.4}" width="7.7" height="3" rx=".5" fill="${r.sign>0?colours.positive:colours.negative}" opacity="${r.r===selectedResponse().r?.95:.35}"/>`).join('')).join('');
    $('#reward-chips').innerHTML=batch.responses.map((r)=>`<rect x="${557+r.r*30.4}" y="79" width="24" height="24" rx="3" fill="${r.sign>0?'#e0ebdf':'#f3e5de'}"/>${text(569+r.r*30.4,95,f(r.reward,1),`text-anchor="middle" fill="${r.sign>0?colours.positive:colours.negative}" font-size="10"`)}`).join('');
    $('#overview-credit-bars').innerHTML=selectedResponse().tokens.map((token,i)=>{const x=783+i*10.5,delta=token.weight-1,y=411-delta*200;return`<rect id="credit-bar-${i}" x="${x}" y="${Math.min(411,y)}" width="7.3" height="${Math.max(1,Math.abs(delta)*200)}" fill="${delta>=0?'#839c78':'#a08bbb'}"/><title>${f(token.weight)}</title>`;}).join('')+'<path d="M781 411H1036" stroke="#b2bba9" stroke-dasharray="3 3"/>';
    $('#reference-contrast').textContent=`Δμρ = ${signed(batch.delta[batch.H])}   dρ = ${f(batch.D[batch.H],4)}`;
    $('#batch-normalizer').textContent=`Z = ${f(batch.Z,4)} · mean(w) = ${f(batch.weightMean,4)}`;
    $('#overview-invariant').textContent=l('w > 0 · sign(A′) = sign(A)','w > 0 · sign(A′) = sign(A)');
    $('#contrast-output').textContent=signed(batch.coupling,2);
    $('#shrinkage-output').textContent=f(batch.shrinkage,2);
    const stats=[['Δμρ',signed(batch.delta[batch.H]),l('refined visual contrast','更新后的视觉均值差')],['2Δμρ / dρ',signed(batch.visualCoefficient,2),l('direct visual coefficient','直接视觉贡献系数')],['τ₊ / τ₋',`${f(batch.tauPlus,1)} / ${f(batch.tauMinus,1)}`,l('pre-refinement margin scales','更新前的边际尺度')],['Z',f(batch.Z,4),l('global raw-weight mean','全局原始权重均值')]];
    $('#research-statistics').innerHTML=stats.map(([name,value,caption])=>`<div><span>${name}</span><strong>${value}</strong><small>${caption}</small></div>`).join('');
    $('#estimator-numbers').textContent=`H = ${batch.H}, N = ${batch.N}; η = ${f(batch.shrinkage,2)}; q̄ = ${f(batch.qbar,5)}; λmin = 0.8, λmax = 1.2; min(w) = ${f(Math.min(...batch.tokens.map(t=>t.weight)))}; max(w) = ${f(Math.max(...batch.tokens.map(t=>t.weight)))}.`;
    document.querySelectorAll('[data-advantage]').forEach(button=>{const active=Number(button.dataset.advantage)===sign;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    renderCase(); renderSensitivity(); renderTrend(); seek(currentProgress);
  }

  function renderHeatmap(token) {
    const response=selectedResponse(),start=Math.floor(token.t/6)*6;
    $('#state-heatmap').innerHTML=response.tokens.slice(start,start+6).map((row,i)=>row.h.slice(0,12).map((v,k)=>`<rect x="${43+k*20}" y="${256+i*10}" width="16" height="7" rx="1" fill="${v>=0?'#8b75b1':'#7fa18b'}" opacity="${.14+.8*Math.min(1,Math.abs(v)/1.6)}" ${row.t===token.t?'stroke="#423259" stroke-width="1"':''}/>`).join('')).join('');
  }

  function seek(value) {
    currentProgress=((value%1)+1)%1;
    const phase=Math.min(4,Math.floor(currentProgress*5));
    const token=selectedResponse().tokens[Math.floor((currentProgress*5-phase)*24)%24];
    const key=`${revision}:${phase}:${token.t}`;
    if(key===lastFrameKey)return;lastFrameKey=key;
    document.querySelectorAll('.overview-stage').forEach(node=>node.classList.toggle('active',Number(node.dataset.stage)===phase));
    document.querySelectorAll('[data-mechanism-stage]').forEach(button=>{const active=Number(button.dataset.mechanismStage)===phase;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    $('#image-affinity-value').textContent=f(token.imageAffinity);
    $('#context-affinity-value').textContent=f(token.contextAffinity);
    $('#rho-value').textContent=`ρ = ${signed(token.rho)} · p = ${f(token.p)}`;
    $('#overview-live-token').textContent=`trajectory ${token.r+1} · token ${token.t+1}/24 · e* = ${signed(token.evidence,2)} · w = ${f(token.weight)} · A′ = ${signed(token.update)}`;
    for(const [id,position]of[['#mini-query',miniPosition],['#full-query',fullPosition]]){const [x,y]=position(token);$(id)?.setAttribute('cx',x);$(id)?.setAttribute('cy',y);}
    const query=$('#sigmoid-query');query?.setAttribute('cx',12+(Math.max(-5,Math.min(5,token.margin))+5)/10*225);query?.setAttribute('cy',74-(token.rawWeight-.8)/.4*58);
    selectedResponse().tokens.forEach((_,i)=>{$(`#credit-bar-${i}`)?.setAttribute('stroke',i===token.t?'#433252':'none');});
    renderHeatmap(token);
  }

  function recompute() {
    batch=M.evaluate({coupling:Number($('#contrast-slider').value)/100,shrinkage:Number($('#shrinkage-slider').value)/100,scenario});renderBatch();
  }
  $('#contrast-slider').addEventListener('input',recompute);
  $('#shrinkage-slider').addEventListener('input',recompute);
  document.querySelectorAll('[data-advantage]').forEach(button=>button.addEventListener('click',()=>{sign=Number(button.dataset.advantage);renderBatch();}));
  document.querySelectorAll('[data-scenario]').forEach(button=>button.addEventListener('click',()=>{scenario=button.dataset.scenario;recompute();}));
  window.OVCResearch={translations,seek,
    phaseLabel:(phase)=>l(['00 / Rollout & outcome supervision','01 / Relative visual encoding','02 / Outcome-conditioned calibration','03 / Normalized token credit','04 / GSPO-token policy update'],['00 / 采样与结果监督','01 / 相对视觉编码','02 / 结果条件校准','03 / 归一化 token 信用','04 / GSPO-token 策略更新'])[phase],
    setLanguage(next){language=next;renderBatch();},
    getState:()=>({language,responseSign:sign,scenario,coupling:batch.coupling,shrinkage:batch.shrinkage,H:batch.H,N:batch.N,visualCoefficient:batch.visualCoefficient,weightMean:batch.weightMean}),
    calculate:(options)=>M.evaluate(options),getBatch:()=>batch,
  };
})();
