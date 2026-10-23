# 2026-10-23 已验收范围与发布候选

## 本轮新增范围（优先于下方 r12 冻结记录）

**最新发布候选 r21：** 用户已确认三个手机社媒入口跳转后，最新源（包括分享最终文案、Basic $2.99、取消 Plus 奖励、TikTok 分设备链接、爪印 favicon）同步至 `.private-upgrade/growth-release-candidate-2026-10-23-r21`，证据 `.private-upgrade/growth-release-final-2026-10-23-r21`。旧 r12 包与原生产回滚归档保留。构建/TypeScript及14组模拟供应商回归通过；第一次构建仅因本机写目录权限失败，保留日志并以适当权限重跑通过，未修改业务代码来规避。生产数据库只读元数据核对通过：现有必需表、user_id类型和订阅字段兼容，分享三张新表/三个函数尚未存在；仅计划应用 share_claims SQL，未实际迁移。临发布新鲜数据库备份/恢复验证、生产环境配置核对与正式部署仍待完成，不能据源码包归档称为数据库可恢复或已可直接发布。正式部署仍需明确批准，部署后必须通过自定义域名可索引性检查。X 电脑自动带入和GA4暂缓，外链在新版上线后。

**用户最新真机确认：** 用户回复“三个社媒都自动跳转了”，当前 iPhone X/TikTok/Instagram 平台入口跳转验收通过，证据 `.private-upgrade/iphone-share-preview-r22-2026-10-23/owner-acceptance.json`。不要求再测这三个入口；不把本条扩展为真实发帖、TikTok/Instagram 自动导入文案或 Windows X 自动带入通过。X 电脑文案和 GA4 仍暂缓。下一步收尾新版最终候选和发布前检查，正式上线需准备完成后明确批准，外链放在上线之后。

**r22 仅修独立测试页样式：** 用户电脑截图指出 Sample caption / Sample video 顶边不齐；用户另确认 localhost 完整网站正常。实测 r21 独立页漏重置 h4 默认 margin，右标题低18.61px、视频低37.22px；localhost 两项差值均0。修正 fixture 的全局标题 margin reset 后，1440px 两处差值均0，390px仍正常上下排列且无横向溢出；产品 TSX/CSS 未改，TikTok 手机路由仍为r21。更新独立 Preview `dpl_2dbG2nU3khzEXgnhS9mGpB7AJcrG`，证据和24小时链接在 `.private-upgrade/iphone-share-preview-r22-2026-10-23/`。此前错位不是电脑打开方式的问题，不能要求用户接受。手机 TikTok 唤起仍待真机；正式站未改。

**r21 手机 TikTok 路由复核中：** 用户 r20 真机截图显示分享弹窗排版正常、iPhone X 编辑器已有文案与官网链接、Instagram 已打开 App；TikTok 却停在 Safari 网页登录页。不能据截图推定复制/下载/关闭均通过，也不能推定 Windows X 空白问题已修复。只读读取 TikTok 官方 AASA 后确认 `/` 属于主 TikTok App 的关联路径，`/upload` 不在其列表；已将手机 TikTok 链接改为 `https://www.tiktok.com/` 且当前窗口导航，电脑仍是 `/upload` 新窗口。组件路由回归先失败后通过，状态回归、TypeScript、手机/电脑实际组件渲染检查通过；这些不能证明 iOS 已成功唤起 App，仍待用户只复验 TikTok。独立 Preview `dpl_BNjU43yac38KTbRoE2D6xdiZH5Ar`，访客链接与证据保存在 `.private-upgrade/iphone-share-preview-r21-2026-10-23/`；本地3043运行包仍r20，需后续构建同步r21，正式站未改。X/GA4继续暂缓，先新版上线再外链。

**r20 手机复核入口已更新：** 独立静态项目 `deskbub-iphone-share-preview` 新 Preview 部署 `dpl_9om9YszjnVttnqR81K2reCSGou4b` 已 READY；复用当前 r20 组件和素材，匿名 fixture，无数据库/支付/模型/客户信息。24 小时访客链接保存在 `.private-upgrade/iphone-share-preview-r20-2026-10-23/visitor-url.private.json`，本地390px检查和线上匿名页面/脚本/视频核对通过，线上保留 noindex；见同目录 `local-verification.json`、`remote-verification.json`。只请用户补当前手机 UI、平台链接、复制/保存及关闭复核，不重做实际发帖或付款；真机结果仍待用户。正式站未变。

**2026-10-23 用户最新优先级：** 新版先上线，随后再做外链；当前先收尾发布准备。X 自动带入文案列为待办，暂不排查，保持现有复制/粘贴兜底；GA4 暂缓，不等待衡量 ID，也不作为本轮发布前置条件。X 问题仍未通过，不能记为修复。用户已认可当前分享界面；r20 已做桌面/窄屏自动检查，新版手机分享 UI 尚无真机复核，旧版 iPhone Instagram 接收、TikTok 保存导入证据仍有效，不要求重新实际发帖或重做已通过流程。尚需同步最新源码至干净发布候选、核对生产配置和数据库差异、临发布备份/恢复验证及最终回归；正式发布仍待准备完成后单独明确批准。外链在新版上线后复用已有清单，逐站复核再推进。

**r20 取消分享 Plus 展示（当前）：** 用户认为 Plus 规则尚未考虑清楚，明确要求先删除，后续另行决定。已移除分享页 Plus 升级说明、$9.99 奖励和左右分栏；保留 Basic $2.99 与三条最低要求。未修改付费 Plus 产品或任何账户权益。审核后台继续只发 Basic，不再以 r19 为依据接入 Plus 奖励。入口 `http://localhost:3043/free-desktop-pet?share_preview=r20#share-basic`，最终 build/检查见 `.private-upgrade/share-basic-only-preview-2026-10-23/verification.json`。正式站未改，X 真实自动带入仍未解决。

**r19 Basic / Plus 奖励展示稿（当前）：** 用户选择“精选原创演示视频，经人工审核后升级 Plus”，未采用点赞/转发数门槛；随后要求 Basic 标注 $2.99。当前 r19-basic-plus-reward-display / `DhmPGIP4ShTZfm95lwI4L`，入口 `http://localhost:3043/free-desktop-pet?share_preview=r19#share-basic`。Basic 三条最低要求旁新增 Plus 原创视频说明，分别从现有定价常量读取 $2.99 / $9.99，手机上下排列。构建/TypeScript、分享组件/状态及隔离浏览器展示、原复制/下载/草稿回退检查通过，证据 `.private-upgrade/share-plus-preview-2026-10-23/browser-verification.json`。**本轮仅供用户看展示：审核后台/SQL 目前仍只发 Basic，Plus 选择与实际发放未接入；不能带着这条未兑现的承诺直接上线。** 未修改数据库、未发奖、未发帖、生产未改，模型关闭、TEST付款。真实 X 自动带入仍未通过。

**r18 明确分享最低要求（当前）：** 用户同意将最低要求写进页面。平台入口后、sample 素材前，直接展示三条：介绍 DeskBub 是桌面宠物；带官网地址；说明分享可获得免费创作额度。用户明确要求删除额外的态度评价句，最终界面只保留这三条要求。Reward details 同步采用同一标准与人工审核说明，原平台格式/公开帖/首次账户资格保留。入口 `http://localhost:3043/free-desktop-pet?share_preview=r18#share-basic`。未修改审核 API、数据库或奖励额度。证据与最终 build 见 `.private-upgrade/share-requirements-preview-2026-10-23/browser-verification.json`。X 真实自动带入问题仍未解决，不能把本版页面检查计为真实 X 接收成功。正式站未改、模型关闭、TEST 付款、原沙盒保留。

**r17 文案精简 / X 自动带入未通过（当前）：** 用户真实截图显示 Windows X 编辑器空白，故 X 自动带入验收重新打开。当前 r17-share-copy-cleanup / `fA6DTSZXeLA38rvqosofg`，预览 `http://localhost:3043/free-desktop-pet?share_preview=r17#share-basic`。删除重复 optional/文案已到达断言，保留复制成功及空框时粘贴提示；示例移除固定 #ad，改用清楚的奖励说明。Reward details 保留披露与平台合作标记提示。构建、组件/状态/链接及隔离浏览器检查通过，但这些只证明 URL/剪贴板/下载可用，**不证明真实 X 编辑器已接收文字**。用户授权只检查 X 测试窗口后，Windows Computer Use 因不能可靠确认 URL 而终止，未操作登录、未发帖、未绕过限制。详情 `docs/research/share-x-blank-composer-2026-10-23.md`；证据 `.private-upgrade/share-x-fix-2026-10-23/browser-verification.json`。模型关闭、TEST付款、原沙盒保留、生产未改。用户新问最低文案要求，建议品牌/桌面宠物说明+官网地址+奖励说明，尚未新增自动审核或数据库门槛。

**r16 用户自选内容，平台入口优先（当前）：** 用户已进一步纠正分享定位：鼓励用户录自己的桌面体验、写自己的文案；sample 素材只作可选起点。已实现 **r16-share-your-way** / build `JVj4y2Wz7Cu7AyqKkHPKk`，入口 `http://localhost:3043/free-desktop-pet?share_preview=r16#share-basic`。标题采用用户认可的 “Show DeskBub on your desktop”，先展示三个显著的真实平台链接，点击直接导航，无下载/复制/视频加载前置条件。X 保留编辑后文案和官网链接自动带入及复制兜底，明确文字帖和视频可选；Instagram/TikTok 直接打开平台。下面 “Need a starting point?” 才提供可编辑 Sample caption / Copy caption 与 Sample video / Save demo video，手机另保留可选 Share demo video。删除 r15 强制准备视频和逐步引导；用户提交任意自己的有效帖子链接，原人工审核流程不变。

完整构建/TypeScript、组件和状态/链接/素材/账户草稿回归通过；隔离浏览器确认三个入口直接可用、不触发下载、X 编辑后 URL/剪贴板、可选下载字节哈希、视频实际播放、URL 草稿重开、390px 主入口首屏可见与 768px 故障回退，无页面脚本错误。手机是模拟检查，新版真实设备和用户视觉验收仍待确认。证据 `.private-upgrade/share-your-way-preview-2026-10-23/browser-verification.json`。未发帖、未部署正式站、未重置数据，模型仍关闭、付款仍 TEST。冻结 r12 保留但未同步 r16。下面 X3 下载优先/r15 内容已被本条覆盖，不应恢复成先下载才能开平台。

**用户已选择并实施的分享方案（最新）：** 用户明确选择 X3，Instagram/TikTok 按电脑与手机分别交接。当前运行 **r15-selected-sharing-options**，build `CzKEFSEwje_nVFVL5lsy-`，预览 `http://localhost:3043/free-desktop-pet?share_preview=r15#share-basic`。X 首先下载现成 MP4 并复制文案，再打开动态预填文字和官网链接的 X 发布框；步骤明确提示用户用媒体按钮手动添加 `DeskBub-Kaka.mp4`、检查并亲自发布。不采用 X2 原视频复用或 API 代发。电脑 Instagram/TikTok 同样先准备素材，打开目标网页后按提示上传、粘贴；手机 Instagram 保留文件分享，TikTok 明确选择 Save Video 保存到 Photos 后从 App 导入。下载状态跨平台及文案编辑保留，避免重复下载；打开平台时复制最新文案。

本版完整构建/TypeScript、组件/状态/链接/素材/账户草稿测试通过；浏览器验证含真实下载哈希、编辑后 X URL/剪贴板、跨平台复用、URL 草稿重开、390px/768px 尺寸、模拟手机取消回退，无页面错误。证据 `.private-upgrade/share-selected-preview-2026-10-23/browser-verification.json`。第三方导航在自动化中拦截，没有发帖；新版真实 X App、iPhone 交接及用户视觉验收仍待确认。只改隔离 staging，模型关闭、Creem TEST、原沙盒数据保留，未发布正式站。原 r12 冻结归档仍待下一次统一同步。下方 r14 目标讨论和 X2 研究为历史，不能覆盖用户已选择 X3。

**分享目标纠正：** 用户明确要求我们把视频/文案交给平台编辑器，用户用自己账号亲自发布；不做网站代发，不以引用官方帖替换。r14 仅完成素材准备，尚未满足视频自动进入编辑器。TikTok 有独立 Upload API（需应用审批及用户上传许可），可交给用户在 TikTok 编辑/发布；它与 Direct Post 不同。Instagram 原生 App 文件交接已有真机证据，不能混同专业账号发布 API。X 普通分享链接带视频未有已验证方案。详情 `docs/research/share-editor-handoff-2026-10-23.md`。本轮未改 runtime、未调用平台 API。

最新运行版本为 **r14-share-ready-preview**，build `kxzUtFruQR1N5wfoHTuwP`，预览 `/free-desktop-pet#share-basic`。新增 `SharePostComposer`：现成视频可播放；用户视角文案可编辑；X 动态预填并同时复制文案；电脑 TikTok/Instagram 下载视频+复制文案后打开平台，选择平台本身不弹 Windows 系统面板；手机支持时使用文件分享，文案单独复制，取消可重试/下载。没有平台 OAuth/API 代发，用户最终确认与平台上传仍在目标平台进行，不能声称一键完成发布。

本轮完整构建/TypeScript、分享组件/链接/审核 SQL/状态/素材/草稿相关回归通过，设计检测无发现；隔离 Chromium 已验证实际视频播放和下载哈希、编辑后 X 链接与剪贴板、URL 草稿重开、390px 布局和模拟手机取消回退，证据 `.private-upgrade/share-ready-preview-2026-10-23/browser-verification.json`。真实 X App 交接、iPhone 新流程及用户视觉验收待确认；未发帖、未生成、未重置数据。付款仍 Test，GA4 等待用户下午新建属性，尚未接入。原 r12 冻结包保留，不能沿用其“最终候选完成”代表当前 r14 已同步。

当前运行 staging 已为 r13-paw-favicon，build `TW4rqZy5glclcLzLJqAhO`：按用户截图制作紫色双爪印，替换默认 favicon，并加入 SVG / Apple 图标。完整构建、三个页面图标 metadata、实际文件 HTTP 200/哈希及浏览器脚本检查通过；证据 `.private-upgrade/paw-favicon-2026-10-23/verification.json`。原 r12 冻结归档保留，新 favicon 尚需纳入下一份最终候选。正式站未改。

分享入口虽已通过文件交接，但用户新反馈表明端到端分享便利度未通过：Windows X 编辑器空白，TikTok/Instagram 仅打开通用系统面板。后续要让视频与用户推荐口吻的文案先预览、再交接，避免将系统面板打开计为发帖成功。尚未修改这段流程。

GA4 仅评估最小方案，尚未安装或发送事件；当前只有 Vercel Analytics。待确定 GA4 属性/衡量 ID 后再实施。付款成功依服务端验证订单去重，分享发起与真实发帖区分，测试流量与生产分开。

截至 2026-10-23（Asia/Shanghai），Custom 当前版本主流程人工验收通过。正式站尚未发布；生产发布需要用户另行明确授权。下列状态优先于 10/22 验收记录及交接文档中的历史 pending/STALE 段落。

## 用户已通过

- Free 最终样式、Custom 入口、五动作、原图对比、分享弹窗、桌面演示；Windows/Mac 安装文件实际下载。
- Pricing 动作示例及留在 Pricing 本页的 desktop demo。
- Basic / Plus 两个独立测试账号的 Creem Test 付款、返回 Custom、刷新保留 1 / 8 次额度；签名、收据唯一及重复通知不重复授额另有后台验证。
- Basic 单图替换；Plus 2→5 张、删除补回、Dashboard 返回、重登录恢复。r11 修复按账号隔离 IndexedDB 草稿后，用户完成 Plus 5 猫→Basic 1 狗→Plus 原 5 猫的双向复验。
- 此前已完成 Basic 1 条、Plus 2 条真实模型测试、锁定成品、刷新恢复及 Dashboard 播放/下载；本轮复用成品，没有新增模型调用。
- 桌面隔离客户端 Basic 配对/显示；Plus 两动作切换与播放。用户“是的，没啥问题”确认 Plus 播放；重启后用户“可以的”确认宠物及动作自动恢复，不用重新配对。
- 分享申请、退回原因、重新提交、管理员批准、查询结果与 Basic 奖励额度。
- iPhone Instagram 文件接收及 Reel 完整画面；r12 竖版分享视频避免裁掉右侧 Kaka。TikTok 保存至相册后手动导入编辑器通过。

## 范围与剩余事项

Custom 两项已记录但暂未实施的需求仍在 `docs/research/product-flow-backlog-2026-10-15.md`：购买前完整展示 Basic 默认动作和 Plus 具体动作；减少生成动作拟人化。用户要求先列待办，不因主流程通过而擅自实施、重生成或增加费用。

TikTok 未出现在本机 iOS 分享列表，确切原因未定位；只能标记保存后手动导入通过，不能标记原生直达通过。Instagram/TikTok 均未真实发帖，文案自动带入没有验收。Mac 安装包下载通过，macOS 客户端运行未验收。

## 最终候选与可复核证据

- 当前本机源：`.private-upgrade/custom-staging-2026-10-21`，r12-portrait-share-video。
- 新候选：`.private-upgrade/growth-release-candidate-2026-10-23`。
- 检查点：`.private-upgrade/growth-release-final-2026-10-23`。以其中 `source-sync.json`、`clean-candidate-build.json`、`regression-results.json`、`release-candidate-manifest.json`、`archive-restore-verification.json` 的实际内容判断整理完成，缺少或失败的证据均不能称为通过。
- `source-sync.json` 已核对 11 项后续修改，app/components 与验收版本逐字节一致；保留生产生成管线和 HTTPS checkout，排除本地模型预算模块和沙盒迁移。
- 桌面用户证据：`.private-upgrade/custom-desktop-client-2026-10-23/owner-acceptance.json`；手机证据：`.private-upgrade/instagram-crop-check-2026-10-23/verification.json` 及 `.private-upgrade/iphone-share-preview-2026-10-22/tiktok-device-observation-2026-10-23.json`。
- 构建/自动回归使用本地沙盒及模拟供应商，不能代替用户人工验收。整理过程中不调用模型、不付款、不改生产。

## 发布边界

原生产回滚点 `badb56f3f6a3fd3bcedfc4ae7f3b917640322aec` 与原源码归档保持；新候选整理不覆盖旧候选或原回滚包。源码解包校验不等于数据库恢复演练。

发布前仍需生产 schema 只读核对、确认仅适用的 share_claims SQL，以及临发布的新鲜数据库备份/恢复验证。收到明确生产授权后，按 `docs/runbooks/vercel-google-indexing.md` 执行发布与自定义域名 indexability 验证；不能把历史 indexability 结果更新时间后当作新检查。

整理结果：新候选完整构建、TypeScript、13 组回归均通过；238 个候选源码文件与原生产 165 个文件的归档解包校验通过，原回滚包哈希未变。实际证据见检查点 validation-summary.json 和 archive-restore-verification.json。冻结归档内的本文是整理时快照，最新状态以这些独立验证回执及本工作区文档为准。

下一步：在聊天里说明验收范围及剩余事项；生产数据库预检与临发布备份恢复另行处理，正式上线等待明确授权。已通过的用户测试直接复用证据，不重置账号/草稿、不要求重付或重生成。
