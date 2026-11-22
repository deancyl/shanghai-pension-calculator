# 软件维护迭代记录 (ITERATION_LOG.md)

## 项目信息
- **项目目标**：上海市城镇职工与城乡居民养老金精准测算及政策热更新 Android 应用。
- **核心边界**：忠实实现上海市社保公开计发办法与渐进式延迟法定退休年龄政策，保证核心算法精准、边界防御严密与离线可用；严禁新增任何额外界面、弹窗、三方依赖或发散功能。
- **基线验证命令**：`node test/verify_baseline.js`

---

## 1. 已完成
- **第 1 轮** | `app/src/main/assets/index.html:736,749,770,786,821,832,864,944` | 消除测算与展示中硬编码的 12577 与 1555 常量，绑定至 `ACTIVE_BASE_WAGE` 与 `ACTIVE_RESIDENT_BASIC` 使政策热更新完全生效 | 验证退出码: 0

---

## 2. 待办池
1. **[P1]** `app/src/main/assets/index.html:889` - 机关事业单位视同缴费年限返回值未受 `totalYears` 约束，断缴时出现 `deemedYears > actualYears` 边界缺陷。
   - 触发证据：当 `scheme='government'` 且存在断缴年限时，`res.deemedYears` 使用了未经上限约束的 `2014.75 - state.startWorkYear`，导致视同工龄超出总工龄。
2. **[P2]** `app/src/main/assets/index.html:1338-1340,1441-1443` - 缴费档位切换与输入联动高亮硬编码旧版基数（7546/12577/37731），政策更新后档位快捷按钮未联动最新基数。
   - 触发证据：代码静态核验可见 `setTier` 与 input 事件监听器中直接比对和赋值数字常量，未引用 `ACTIVE_MIN_BASE` / `ACTIVE_BASE_WAGE` / `ACTIVE_MAX_BASE`。

---

## 3. 失败黑名单
（暂无）
