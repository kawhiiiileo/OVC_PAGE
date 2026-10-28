# OVC 项目主页

基于 `MLLM_RL (14).pdf` 制作的独立静态项目主页。

**论文：** *From Visual Affinity to Learning Credit in Multimodal Reinforcement Learning*。

**网站：** [kawhiiiileo.github.io/OVC_PAGE](https://kawhiiiileo.github.io/OVC_PAGE/) · **源码：** [kawhiiiileo/OVC_PAGE](https://github.com/kawhiiiileo/OVC_PAGE)

页面包含完整研究动机、RVE → OEC → NCA 机制动画、可下载 GIF、包含 192 个合成 token、32 维特征、侧内方差校准与一次软参考更新的数值回放、三种模型的完整主结果、关键消融和训练开销说明。支持中英文切换、手机布局、键盘访问和减少动画偏好。字体、数据与图片均为本地资源，没有运行时 CDN 或后端服务依赖；论文入口指向 arXiv。

[查看页面截图](preview.png) · [查看机制 GIF](assets/mechanism.gif)

## 本地运行

需要 Node.js 20 或以上版本，不需要执行 `npm install`。

```bash
git clone https://github.com/kawhiiiileo/OVC_PAGE.git
cd OVC_PAGE
npm run dev
```

打开终端显示的地址，默认是 `http://127.0.0.1:4173`。请通过 HTTP 预览；直接双击 HTML 时，浏览器可能阻止读取结果 JSON。

```bash
npm test          # 检查资源、锚点、数据均分和头部增益
npm run build     # 生成 dist/
npm run preview   # 通过 HTTP 预览 dist/
```

## 部署到 GitHub Pages

仓库已启用 **GitHub Actions** 作为 Pages 的发布源。向 `main` 推送提交后，工作流使用 Node.js 24 校验内容、构建 `dist/`，并自动部署到 [项目网站](https://kawhiiiileo.github.io/OVC_PAGE/)。

可以在 [Actions](https://github.com/kawhiiiileo/OVC_PAGE/actions/workflows/deploy.yml) 查看部署状态或手动运行 `Deploy project page to GitHub Pages`。所有资源均使用相对路径，兼容 `/OVC_PAGE/` 项目路径。工作流配置见 `.github/workflows/deploy.yml`；Pages 配置参考 [GitHub 官方工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 已完成的验证

`npm test` 和 `npm run build` 均通过。Chromium 浏览器检查覆盖 360 / 390 / 768 / 1024 / 1440 像素宽度、动画播放与暂停、中英切换及语言记忆、三模型表格、滑块键盘操作、优势符号保持、全局权重均值、引用复制、移动导航及减少动画偏好。生产构建已在 `/ovc-project-page/` 子路径下实际加载，论文、图像、GIF 和 JSON 均正常返回。GIF 已升级为五阶段高密度计算图，支持循环播放。远端校验、构建与部署结果可在上述 Actions 页面查看。

## 内容来源与边界

| 内容 | 依据 |
| --- | --- |
| 标题、OVC 定义与三阶段机制 | 摘要、§3、公式 (1)–(14) |
| 亲和度与准确率之间的动机证据 | 图 1，第 2 页 |
| 完整方法图 | 图 2，第 4 页，原图裁出 |
| 三个模型的主结果 | 表 1，第 6 页；四次独立运行的均值 |
| 消融分析 | 表 2，第 6 页；此处是四任务均分 |
| 189 / 3,663 秒与 5.16% | 图 4、§4.3；一次测得的训练步时间占比 |
| 训练步骤与归一化范围 | 算法 1、附录 F |
| 动画、几何图与标记计数案例 | 新绘制的解释性示意，不是论文模型的真实样本轨迹 |
| 高维数值工作台 | 按公式 (1)–(12) 计算 8 条回答 × 24 个 token，隐藏维度 H=32；二维图为当前判别方向投影 |
| 高级几何案例 | 构造的方位角测绘问题；正确距离 10.52 km，代数错误为 12.16 km，参照系错误为 5.05 km |
| 训练与验证趋势 | 图 5，第 7 页，保留原始曲线与坐标轴，不模拟或重建时间序列 |
| 作者、机构和贡献标记 | 用户提供的完整作者列表：10 位作者、4 个机构、共同一作与通讯作者 |

论文入口及引用使用 [arXiv:2610.32324](https://arxiv.org/abs/2610.32324)。网页展示并复制下方 BibTeX；中英文界面使用相同的论文地址和引用内容。

主结果数据可在 `data/results.json` 修改；正文及作者信息在 `index.html`，通用翻译与交互在 `app.js`，基础样式在 `styles.css`，学术图表样式在 `academic.css`。`assets/ovc-engine.js` 实现可测试的数值估计器，`assets/research-demo.js` 负责双语图表与动态回放。`assets/mechanism.gif` 是机制动画的便携版本；网页内使用原生 SVG/JavaScript 动画，支持暂停，并在离屏时停止推进。

## 引用

```bibtex
@misc{han2026visualaffinitylearningcredit,
  title={From Visual Affinity to Learning Credit in Multimodal Reinforcement Learning},
  author={Yuhang Han and Dingning Liu and Yujie Chen and Yaojie Zhang and Jingwei Song and Zequn Yang and Xuanming Shang and Li Ding and Zhijiang Guo and Linfeng Zhang},
  year={2026},
  eprint={2610.32324},
  archivePrefix={arXiv},
  primaryClass={cs.AI},
  url={https://arxiv.org/abs/2610.32324},
}
```

## 文件结构

```text
.
├── index.html
├── styles.css
├── academic.css
├── app.js
├── assets/
│   ├── favicon.svg
│   ├── framework.png
│   ├── training-dynamics.png
│   ├── ovc-engine.js
│   ├── research-demo.js
│   ├── mechanism.gif
│   └── paper.pdf
├── data/results.json
├── scripts/{serve,check,build}.mjs
├── .github/workflows/deploy.yml
├── .nojekyll
└── package.json
```

本项目没有训练代码或模型服务；机制演示完全在浏览器内进行数值计算。论文和原始插图的权利归原权利人所有，本项目不另行授予这些材料的使用许可。

## 学术机制展示说明

- 五阶段计算图：采样与组相对优势 → RVE → OEC → NCA → GSPO-token。图中状态张量、参考分布、方差尺度、sigmoid 映射、逐 token 权重偏移与符号保持均关联同一合成小批次。
- 两种失败模式：正确读取 025° 方位角后，分别在内角参照转换或后续余弦定理系数处出错。案例正误标签只用于解释，不输入信用估计器。
- 注入关联强度 κ 是合成数据生成参数，不是论文的 OVC 超参数；η 为方差收缩参数。批次图会重算统计量；条件敏感性图固定 μ*、D、τ、Z。
- 三条阶段曲线比较均匀分配、对相对亲和度 ρ 排序的解释性启发式和 OVC。误差线仅表示阶段内 token 标准差，不是置信区间。未改动论文实验分数，也未编造训练准确率曲线。
- `npm test` 新增 18 种合成设置的数值检查：距离差与线性证据恒等、正定对角度量、全局均值、优势符号保持、几何结果，以及全部作者元数据。
