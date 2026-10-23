2026-10-23 最新状态：Custom 当前主流程、桌面 Plus 两动作切换播放及重启自动恢复均已由用户通过。以 docs/runbooks/growth-release-readiness-2026-10-23.md 为当前范围与下一步的唯一摘要；下文旧 pending/STALE 为历史。两项 Custom 待办（购买前完整动作展示、减少拟人化）仍未实施。10/23 新候选已完成构建、TypeScript、13组回归、归档及源码解包校验；最终清单见 .private-upgrade/growth-release-final-2026-10-23/validation-summary.json。生产数据库预检/临发布备份恢复仍待执行，正式发布未授权。

桌面 Plus 两动作播放通过：用户明确回复“是的，没啥问题”，确认测试客户端配对后 Walking in place / Lying down relaxed 可切换并持续播放。随后仅重启已核对 bootstrap 路径的隔离客户端（原PID1164→5984），独立保存配置仍为 Plus 配对，未自动重新填写或更换配对码。新进程/窗口加载及本地请求见 .private-upgrade/custom-desktop-client-2026-10-23/owner-acceptance.json。下一步只需用户确认重启后桌面宠物自动出现、两个动作仍在；不要让用户重输配对码或重做付款/生成。最后视觉恢复确认仍待用户；正式站/客户端不变，最终候选仍 STALE。

桌面 Basic 配对与显示通过：用户 codex-clipboard-e86976e7-398b-42b5-9b75-c093825d7627.png 中隔离窗口 DeskBub TEST - LOCAL 3043 显示 Custom pet paired、Paw grooming，猫咪已在真实桌面显示。测试配置已只读核对 paired/Basic，原正式客户端未变。静态截图不单独证明动画循环；下一步测试 Plus 638912，应出现 Walking in place、Lying down relaxed 两个动作，用户分别点击检查切换和持续播放，不生成新视频。证据 .private-upgrade/custom-desktop-client-2026-10-23/owner-acceptance.json。

桌面验收入口已准备（2026-10-23）：当前 r12 网页候选的 desktop-pet 复制到 .private-upgrade/custom-desktop-client-2026-10-23/app，控制面板/托盘标明 DeskBub TEST - LOCAL 3043，配对请求仅指向 localhost:3043；Electron 用户/会话数据单独存于此工作区，外部网络拒绝，仅允许 3043 和本地 Supabase 15421。原已安装客户端未改，旧10/15测试客户端未覆盖。复用现有 Electron 33，本次进程1164响应，index.html/settings.html 已加载，初始Kaka/未配对。原模型预算中 Basic 旧成品1个Paw grooming、Plus旧成品2个Walking in place/Lying down relaxed，实际配对 GET200及3条本地WebM HEAD200已核对；无需重付或生成。配对账号/码仅记私有 .private-upgrade/desktop-acceptance-accounts-2026-10-23.private.json。下一步让用户在该测试窗口输入 Basic 码并点 Pair，确认 Kaka 换成已生成猫咪；尚未由用户操作，不得声称配对或桌面播放通过。代码/身份只在副本，生产回滚不变，模型保持关闭。

TikTok 手机备用流程验收通过：用户 tiktok3.png 显示将视频保存相册后，从 TikTok 导入已到编辑预览页，桌面与 Kaka 完整显示。不得把它写成系统面板 TikTok 直达通过；该设备列表仍缺 TikTok，确切原因未定位。Instagram 直接交接与 Reel 完整画面已通过。手机阶段现确认 Instagram 直传 + TikTok 保存/手动导入可用，未实际发布，文案自动带入未验收。可退出编辑，不点 Next 或 Your Story。后续应明确 TikTok 的保存后导入入口，避免让用户误认为网站能保证指定 TikTok 出现在系统面板。剩余主验收为隔离桌面客户端配对播放；最终候选仍 STALE、未发布正式站，原回滚点不变。

r12 Instagram 真机竖版复验通过：用户 ins6.png 显示 Instagram Reel 编辑页完整呈现桌面与右侧 Kaka，未再居中裁掉宠物。此前已确认 iPhone 系统文件分享、取消后的重试/下载入口、Instagram 接收与 Reel 编辑入口。只确认接收及画面完整，不声称实际发布或由静态截图确认全程播放。Instagram 这项不再重复；下一步仅验 TikTok 目标 App 接收与预览，不实际发帖。手机竖版素材仍为 /media/share/kaka-portrait-v1.mp4，网页横版桌面演示不变。正式站/回滚点未动，最终候选仍 STALE，待剩余验收及统一同步。

# 2026-10-22 发布准备与站长验收

## 当前验收进度（2026-10-22 21:33 更新，优先于下方旧修订记录）

- 本机实际版本为 r11-account-draft-isolation，页面视觉延续 r10，Free 按钮最终为 r9：Windows/Mac 均白底描边，系统说明居中间行，Custom 为珊瑚色整行双行文案，Share 为白底整行双行文案。Pricing 桌面演示留在本页。用户已认可这些视觉和入口。
- 用户已通过 Free 动作切换、分享弹窗开关、照片对比和桌面演示，Windows/Mac 实际下载，以及 Pricing 示例与同页桌面演示，不重复从头验收。
- 本轮 Basic 与 Plus 分属两个测试账号：Creem Test 付款、返回 Custom、刷新均通过；Basic 剩 1 次，Plus 剩 8 次。签名、单笔回执和重复回调不重复加额已核对。
- Plus 选 2 张、补到 5 张、删除后补回，Dashboard 8/8、回到 Custom 保留 5 张、退出后重新登录同账号仍保留额度与选图，均已由用户通过。
- 修复前账号隔离实测：Basic 剩 1 次、不出现 Plus 的照片、仅可选 1 张且提供 Replace photo，均通过。但回到 Plus 后，8 次仍在，原 5 张待处理照片消失，发现草稿被覆盖的问题；修复及复验如下。
- **当前 r11-account-draft-isolation**：回归测试准确复现 Plus 存 5 张→Basic 存 1 张→Plus 无草稿。根因是 IndexedDB 所有账号共用 `custom-photo` 键，ownerId 只阻止读取，无法防止另一账号覆盖。现改为各账号独立键，删除/过期仅作用于对应草稿；旧键按所属账号迁移，匿名草稿登录时在单事务内认领一次。已通过回归、图片编辑/付款返回/作品恢复相关测试及 Next 完整构建，3043 已加载新 build `nBZKKYBT-vg1qOSxO4eae`。自动测试未上传照片、未调用模型。
- **r11 用户双向复验已通过**：Plus 重新选择 5 张猫照片、剩 8 次 → Basic 原小狗 1 张、剩 1 次 → Plus 仍为同样 5 张猫、剩 8 次。三张用户截图分别为 `codex-clipboard-0ee19306-ff5b-4a60-a109-cd570a62891e.png`、`codex-clipboard-a6e64882-0042-45ae-8c04-36c4a3197592.png`、`codex-clipboard-9a6286ec-2f11-4849-ba2a-6c8b33fa7f0c.png`。账号切换与草稿隔离验收完成，不再要求重付、重选或重复切换。生产和回滚点未变，发布包继续 STALE。
- 重启后网页打不开的原因是本机服务和 Docker 未运行。现已启动原 Docker 容器及原构建服务，恢复 Creem Test 回调监听；未重建数据库、未改页面。HTTP Free/Pricing/Custom 均 200，未登录 Dashboard 跳登录；生成和图片处理接口仍 403。已只读确认 Basic 0/1、Plus 0/8、各订单回执仅 1 条。恢复证据：`.private-upgrade/recovery-2026-10-22.json`。
- 当前模型关闭，付款仅 Test；无需重新付款。生产未发布，原回滚点保留。旧发布候选仍 STALE，全部验收结束后统一同步最终源码再构建。

状态：仅本地候选，未上线。用户要求亲自测试各改动及流程，通过后另行明确批准生产发布。聊天必须先讲结论、入口、待办和限制；本文只是补充，不能只发报告链接。

当前最新r5-four-hero-buttons：用户不喜欢r4棕红/浅桃配色，要求四个按钮，Want your own pet for free?本身做按钮。首屏变2×2同尺寸：Windows/Mac、付费Custom/分享领取，分享大框消失；回归原站#ff6b6b珊瑚色实心+珊瑚描边/透明底，不用棕红底或黑白按钮。系统兼容说明移至四按钮整体下方。ShareBasic新增可选compactTrigger，只换入口呈现，复用原dialog和hash打开/关闭逻辑，审核提交逻辑不改。真实组件处理器配模拟dialog验证两种入口均可打开且防重复；四组文字/hover对比4.81–7.97，通过React边界/可访问名称检查，无新增依赖或请求。实际视觉/浏览器点击待用户，发布包仍STALE，验收后统一同步，原生产/回滚包不变。

最新r4-coral-free-buttons：用户反馈r3排版有提高，要求替换黑白按钮。保留r3结构与尺寸，只改Free按钮和分享入口配色：Windows珊瑚实色、Mac浅桃底、Custom浅珊瑚底/红棕文字，Share入口暖桃底与珊瑚文字链接，取消黑底及黑色描边。分享弹窗业务处理不改。新按钮默认/hover九组文字配色对比均>=4.5，具体见.private-upgrade/free-coral-contrast-2026-10-22.json；浏览器实看仍待用户。发布候选继续标STALE，待用户验收配色后统一同步，生产回滚点不变。

当前实际验收为 r3-compact-free-hero：用户否定r2首屏留白及按钮观感，并指出照片对比/桌面演示入口被挤出视口。仅3043 Free首屏压缩：桌面顶部96px改40px、移除重复免费徽章、取消定制按钮前的多余问句、定制按钮改正常字号描边、右列顶对齐且预览按6:5缩放，两条演示入口移到预览正下方。Title/H1文字与下载/分享逻辑不改。新视觉由用户验收，不能宣称已实际截图通过。旧r2发布候选已标STALE，待用户认可r3后统一同步和重打包，不要每次微调都重做发布包；原生产回滚源/部署不变。

最新修订 r2-free-custom-cta：用户发现Free付费入口过深，首屏Share前和五动作后新增直接去Custom的标价入口，页尾按钮同步。仅Free页源码变化，原生产回滚包未变，r1参考/候选冻结包另存checkpoint的revisions/r1-before-free-custom-cta。新CTA位置/桌面和390观感尚待用户亲测；不能沿用上一版视觉通过结论。SEO逐词核对见 `docs/research/free-custom-cta-keyword-coverage-2026-10-22.md`。

## 回滚点已固定

- 2026-10-22 只读核对 Vercel 当前 `deskbub.com` 生产别名，READY 部署 `dpl_E3t1grXwCw6T3Jc6SkzFCUaV7Awq`，URL `https://deskbub-9zjy19k1v-deskbub.vercel.app`。
- GitHub main 提交 `badb56f3f6a3fd3bcedfc4ae7f3b917640322aec`。不是根目录当前工作区，也不是更早的 October 15 回滚目标。
- `.private-upgrade/release-checkpoint-2026-10-22/rollback-checkpoint.json` 保存部署、别名、提交、备份校验值；`production-badb56f-source.tar.gz` 是完整源码备份。165 个文件的 Git blob hash 均与该提交的 GitHub tree 一致，包含原桌面客户端代码，没有混入根目录未提交改动。
- 同目录 `production-indexability-baseline.json`：Googlebot mobile 真 GET，首页、Free、Pricing、Custom、Download、两篇文章共 7 页均 200、index/follow。
- 这是代码及部署回滚点，**尚未创建本轮生产数据库快照**。正式迁移前必须另做当时最新的私有数据库备份，并验证可恢复；不能用旧快照覆盖用户之后产生的订单/作品/额度。

## 验收入口与版本

本机服务 `http://localhost:3043`，仅绑定 127.0.0.1。模型关闭、付款仅 Creem Test，分享审核连接本地 15421 沙盒，不写生产。原 Basic、Plus 账号和成品保留，不重置用户数据。

页面验收使用 `.private-upgrade/custom-staging-2026-10-21`。已冻结参考源码与逐文件 hash：`accepted-staging-reference.tar.gz`、`accepted-staging-source-manifest.json`；该参考包包含本机预算测试保护，**不能作为生产部署包**。

另备 `.private-upgrade/growth-release-candidate-2026-10-22` 和 `growth-release-source.tar.gz`；完整逐文件范围在 `release-candidate-manifest.json`，压缩包 SHA-256 在 `archive-sha256.json`。页面源码逐字节与本机已验收版本一致。差异仅为发布整理：

1. 恢复当前生产的 Replicate、job handlers、upload-photo 三文件，移除本机模型预算模块及调用，不改线上模型/提示词。
2. 保留 Custom 付款返回目的地，支付 URL 使用当前生产的 HTTPS 校验；移除只为 localhost 3043 设置的例外。
3. 把重复的 weekend sandbox bootstrap 移到测试 fixtures；实际 migrations 目录仅新增 share_claims，保留原生产已有迁移。
4. 保留整个已验证的生产仓库，包括未修改的 desktop-pet；不能拿仅网页文件替换整个仓库。

干净候选 Next 完整构建/TypeScript、分享审核/幂等/权限、13 项 checkout tracking、生成恢复套件、Custom 返回、分享奖励生成事务、状态反馈及视频取消回退测试通过。测试使用本地或桩，外部支付/模型调用为 0。第一次构建遇沙盒 EPERM，提权后在同一隔离目录重跑通过。未启动此构建包的服务，未绑定 Vercel。

## 用户亲测清单

已通过的不要求从头重做。若修改某处，只重验受影响部分；发现问题需给页面与操作路径，不能让用户反复进 Console 粘代码。

| 轮次 | 入口与操作 | 应看到的结果 | 当前证据 |
| --- | --- | --- | --- |
| 1 Free | `/free-desktop-pet`，点五动作、原图对照、桌面演示、下载 Windows/Mac；打开并关闭分享弹窗 | 五动作各自对应；免费 Kaka 与定制说明明确；下载直接到正确安装文件；分享入口醒目且页面风格一致 | 桌面及真实 CSS 390 布局/回退已检查；最终整页由用户确认 |
| 2 Pricing | `/pricing`，对比三卡和动作示例；点免费卡分享入口 | Free 0、Basic $2.99、Plus $9.99，一次付费；Basic 一图一默认动作，Plus 1–5 图/8 次/最多留 5；分享只引导到 Free | 最终文案与视觉由用户确认 |
| 3 Custom/入口 | `/custom-desktop-pet`；首页、导航 Create My Pet、Dashboard Upload、旧 `/upload` 逐一点；比较照片、动画、桌面效果与套餐 | 所有定制入口进入 Custom 制作区；旧 Upload 跳转兼容；Custom 不放分享活动；原风格保留 | 同页照片/动作、桌面初验已认可；本轮统一复核入口 |
| 4 图片与登录 | 未登录选图、Basic/Plus 切换、登录返回、刷新；已买 Plus 加图至 5、移除再补；Basic 一图 | 图和套餐按同一浏览器保留；Plus 能补图，超过 5 不继续加；Basic 不允许多图。由用户自己选图，代理不代上传 | Basic/Plus 测试付款返回与保留、多图操作此前已由用户通过；仅按需要复核，不强制重复付费 |
| 5 作品与 Dashboard | `/dashboard`；查看既有视频，播放、下载、刷新、退出再登录；进入 Custom 继续作品 | 视频效果和动作名可见，额度正确；简洁布局；成品和锁定状态不丢、不串账号 | 用户已通过生成、锁定、刷新及下载播放；重登录和最终样式可再确认 |
| 6 分享用户与后台 | Free → 分享 → 贴测试链接；新账号与管理员分别登录；后台 `/dashboard/share-review` 退回、重提、通过、查询 | 待审有反馈；原因可见；批准只加一次 Basic；进入 Custom 剩 1 次；已购买/已有作品账号无资格；非管理员无审核权限 | 用户已完整通过提交→退回→重提→批准→查询→Custom 1 次。不要求再注册或重置原账号 |
| 7 三个平台与手机 | X 打开预填发布框；TikTok/Instagram 保存视频、打开平台；支持文件分享的真机点分享并取消/重试 | X 预填可编辑；取消不丢保存视频入口；不支持原生分享时能下载；真机能交给目标 App 的草稿，验收不需要实际发布 | 桌面两平台回退和真实 MP4 下载通过；手机目标 App 接收未测。127.0.0.1 不能在手机打开，需要另外准备隔离且 noindex 的可访问预览，不能拿生产当测试环境 |
| 8 付款和真实生成复核 | 由用户亲自做 Creem Test Basic/Plus 付款及需要的生成、锁定、刷新、下载/桌面配对 | 价格/回调/权益正确，返回 Custom；生成扣额且作品保留；桌面客户端实际显示正确 | 本轮两档 Test 付款、刷新和账号隔离已通过；此前 Basic/Plus 生成已有用户测试证据。当前仅测试付款开启、模型关闭。新模型测试须另报预算，旧 USD1 /9 调用已用完，不可重开旧账本；隔离客户端配对播放仍待验收 |

Basic 默认动作及 Plus 全部动作在购买前逐项展示、拟人化提示词优化：此前列为待办，**未实现**，不要混称本次已完成。

## 正式上线前代理收尾项

- 用户确认本轮清单；记录未通过项及修订版本。未获明确上线批准时，不 push main、不 promote、不执行生产 SQL。
- 用完整固定生产源码新建隔离分支/checkout，按候选 manifest 应用改动；根目录 dirty 老分支不能 `git add .` 或整目录覆盖。
- 用 `share-schema-preflight.sql` 只读核查实际生产表/列/RPC 与迁移记录，保存最新私有备份并演练恢复。只按差异审核 `202610210001_share_claims.sql`，禁止直接 `db push` 全部迁移，禁止跑 sandbox bootstrap。
- 保留生产 Clerk/身份映射/Supabase/Creem live/model 配置。不要复制 `.env.local`、本机端口、Clerk test、测试账本或 `.vercel` 绑定。核验 `DESKBUB_SHARE_ADMIN_EMAILS=lsbillups@gmail.com`，管理员必须有服务端验证邮箱，support routing 邮箱只是对外联系。
- 明确配置 `DESKBUB_SHARE_CAMPAIGN_ENABLED=1` 时机。Free 是静态页，改变活动环境变量后须重建部署，不能把它描述为即时运行时开关。
- 真正发布当天仅更新 Free/Pricing/Custom 有意义变更的 sitemap 日期，不给所有页面填构建时间。首页共享按钮和两篇文章只换定制入口，文章 SEO/正文与其他页面原日期保留。
- 批准后执行发布，严格按 `docs/runbooks/vercel-google-indexing.md` 检查自定义域名实际 GET、7 个公开页、robots/sitemap、私有页 noindex、登录、支付返回、旧用户作品与管理员权限；自定义域名可索引检查通过才算发布完成。不要在未 Ready 时提交索引，不改 DNS。

## 回滚执行原则

这是应急方案，不是本轮执行记录。操作前先复核线上部署；若用户测试期间其他人已发布，应重新确定回滚点并保存，不自动覆盖本记录。

Vercel 控制台将生产回滚到精确 ID `dpl_E3t1grXwCw6T3Jc6SkzFCUaV7Awq`（团队 deskbub，项目 deskbub），或在有效 Vercel CLI 上使用 `rollback <该精确 ID> --scope deskbub`。不能误用 `rollback` 不带目标而回到未知版本。若旧部署已清理，使用校验过的源码压缩包与原生产配置重建；它不能代替数据库备份。

回滚只切代码/流量，保留新增分享表、奖励账和审核记录；不删除作品、不恢复旧订阅余额、不撤销已授 Basic。Vercel Instant Rollback 对之后自动生产别名分配的影响需按当时控制台检查，恢复正常发布时显式 promote 正确版本。回滚后同样跑自定义域名可索引检查。

**已识别的兼容点：原生产 `/api/unlock-basic` 有旧自助发奖逻辑，完整回滚会恢复该行为。** 活动出现问题时优先以当前新代码关闭活动并重建，或使用旧源码加 `/api/unlock-basic` 返回 410 的最小修补版本；不要误以为新版本的活动开关能控制旧代码。最小修补源码已另存 `release-checkpoint-2026-10-22/emergency-overlay/app/api/unlock-basic/route.ts`（路径前缀为 `.private-upgrade/`），只禁用旧接口；它是重建旧版的覆盖文件，不改变已固定的原生产源码备份。实际应用仍属于获批的生产或应急操作。其他新增分享表留在库内不影响旧版读取原订阅/作品。

上线前不执行旧数据恢复、清空表、重置额度，也不实际发帖或提交外链。付费模型、人类上传和实际社媒发布继续按已有授权边界执行。
