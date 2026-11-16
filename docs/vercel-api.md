# Vercel 项目 API 接入记录

日期：2026-11-16（Asia/Shanghai）
项目：`donation-website` / `prj_Rf04c904XCMzz2JHgfapVx5Qnt8k`（framework `nextjs`，`nodeVersion 24.x`，创建于 2026-09-15）

## 凭据

- 访问令牌存放于 `.local/vercel-token`（权限 `600`，`.local/` 已被 `.gitignore:11` 忽略，`git check-ignore` 验证通过）。
- 令牌前缀 `vcp_0qWJ…`，共 60 字节；sha256 前 12 位 `aaa385ee1f4a`，用于核对同一令牌而不暴露明文。
- 令牌类型为 **project 级**：只覆盖这一个项目。用户级与团队级资源按设计返回 401/403/404（见下表），并非令牌失效。
- 该令牌曾以明文出现在会话中，建议在完成接入后在 <https://vercel.com/account/tokens> 轮换一次，并把新值只写入 `.local/vercel-token`。

## 端点探测结果（实测）

| 端点 | 结果 | 说明 |
| --- | --- | --- |
| `GET /v10/projects` | 200 | 只返回 `donation-website`，范围符合预期 |
| `GET /v9/projects/{id}` | 200 | 项目配置、别名、最近部署 |
| `GET /v9/projects/{id}/env` | 200 | 14 个变量，全部 `production`（`STRIPE_SECRET_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 额外含 `preview`） |
| `GET /v9/projects/{id}/domains` | 200 | `donate.mealsupport.org`、`foodhope.org`、`donate.hungersupport.org`、`donation-website-six-olive.vercel.app`，全部 verified |
| `GET /v6/deployments?projectId=` | 200 | 最新生产部署 `dpl_D5wTSvgekUqGtuzZAk1A6Ph112ff`（READY，2026-11-16 15:38:01Z） |
| `GET /v13/deployments/{uid}` | 200 | 状态字段是 `readyState`，不是 `state` |
| `GET /v3/deployments/{uid}/events` | 200 | 只出事件元数据，`payload` 恒为 `null`（94/94 条实测），拿不到构建文本 |
| `GET /v1/projects/{id}/deployments/{uid}/runtime-logs` | 流式 | 连接保持、按事件推送；窗口内无流量时 `curl` 超时退出且 0 字节 |
| `GET /v2/projects/{id}/members` | 200 空数组 | project 级令牌读不到成员列表 |
| `GET /v2/user` | 404 | project 级令牌不覆盖用户级资源 |
| `GET /v2/teams` | 403 | 同上，团队级资源被拒 |
| `GET /v1/crons`、`/v1/crons/{id}` | 404 | 公共 REST API 的 OpenAPI 描述（<https://vercel.com/openapi.json>）里不存在 cron 路径 |
| `GET /v3/events` | 403 | 这是审计事件流（`ownEvent`），需要更高权限 |
| `GET /v1/integrations/configurations` | 403 | 集成层资源不可见 |

结论：项目级令牌覆盖「项目配置 / 部署 / 环境变量名单 / 域名」的读写面，以及 runtime logs 流。Cron 执行记录、构建日志文本、成员管理走 dashboard 或需要 team 级令牌。

## 用法

```bash
scripts/vercel-api.sh projects            # 可见项目
scripts/vercel-api.sh project             # 当前项目摘要
scripts/vercel-api.sh deployments 10      # 最近 10 个部署
scripts/vercel-api.sh deploy latest       # 最新部署详情（含 commit message）
scripts/vercel-api.sh events latest 20    # 构建事件元数据
scripts/vercel-api.sh logs 20 200         # 流式 runtime logs，窗口 20 秒
scripts/vercel-api.sh env                 # 环境变量 key 清单，不打印 value
scripts/vercel-api.sh domains
scripts/vercel-api.sh raw /v9/projects/prj_xxx
```

覆盖项目可用 `VERCEL_PROJECT_ID` 环境变量或 `.local/vercel-project` 文件。

## 备注

- `vercel.json` 里的两个 cron（`/api/cron/abandoned-donations` 每 5 分钟、`/api/cron/reconcile-donations` 每 15 分钟）没有对应 API；观察执行只能抓 `/api/cron/*` 的 runtime log，或看 dashboard 的 Cron 面板。
- 环境变量 `CRON_SECRET`、`STRIPE_WEBHOOK_SECRET`、`META_CAPI_ACCESS_TOKEN`、`RESEND_API_KEY` 等为 `sensitive` 类型，API 读回时值恒为不可逆，脚本只列 key。
- 写操作（创建部署、改环境变量、回滚）需要 POST/PATCH，当前脚本为只读；需要时按 `raw` 的同一鉴权方式扩展。
