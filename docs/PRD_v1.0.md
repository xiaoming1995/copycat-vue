# 📄 产品需求文档 (PRD) - 爆款文案仿写与分析工具

| 项目名称 | **Project CopyCat (爆款文案助手)** |
| :--- | :--- |
| **版本号** | v1.0 (MVP) |
| **文档状态** | 正式发布 |
| **发布日期** | 2026-01-17 |
| **优先级** | P0 (核心闭环验证) |
| **适用端** | Web Desktop (优先), Mobile H5 (适配) |

---

## 1. 项目背景与目标 (Overview)
* **核心痛点:** 文案创作者缺乏灵感，难以快速拆解爆款文案的逻辑，且“照葫芦画瓢”效率低。
* **产品目标:** 打造一款轻量级 AI 工具，通过“深度拆解 + 逻辑映射”的方式，帮助用户将一篇爆款文案的结构和情绪，迁移到新的产品/主题上。
* **MVP 核心指标:** 跑通 **“输入 -> 智能分析 -> 仿写生成”** 的核心闭环，确保生成质量（神似度）达到用户预期。

---

## 2. 核心业务流程 (User Flow)

```mermaid
graph TD
    Start[用户进入工作台] --> InputMethod{选择输入方式}
    
    InputMethod -->|方式A: 粘贴文本| Parse[文本预处理]
    InputMethod -->|方式B: 输入链接| Crawler[爬虫抓取 (小红书/公众号)]
    Crawler -->|成功| Parse
    Crawler -->|失败| ErrorToast[提示手动复制] --> InputMethod
    
    Parse --> Analyze[AI 深度分析]
    Analyze --> ShowReport[展示分析报告]
    
    subgraph 分析报告内容
    ShowReport --> Tags[情绪标签]
    ShowReport --> Structure[结构步骤条]
    end
    
    ShowReport --> UserConfig[用户输入新主题]
    UserConfig --> Generate[AI 仿写生成]
    
    Generate -->|SSE 流式输出| ResultDisplay[结果展示 (打字机效果)]
    ResultDisplay --> Actions{用户操作}
    
    Actions -->|满意| Copy[一键复制]
    Actions -->|不满意| Retry[重新生成]