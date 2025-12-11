# Sora Client 🎥

> A Premium Desktop Client for [TheSmallHanCat/sora2api](https://github.com/TheSmallHanCat/sora2api).
> 专为 `sora2api` 开源项目打造的极简、优雅桌面客户端。

![App Screenshot](./screenshot.png)

## ✨ Features (功能特性)

- **🎨 Premium UI/UX**: 采用毛玻璃（Glassmorphism）设计语言，流光渐变交互，提供原生应用的细腻体验。
- **📺 Video Stream Parsing**: 支持流式解析视频生成进度，实时反馈生成状态。
- **📂 Project Management**: 支持多项目管理，自动保存任务草稿。
- **⚡ Native Performance**: 基于 Electron + React 构建，支持本地文件系统直接读写，生成完成后自动打开视频。
- **📦 Portable**: 提供 Windows 免安装便携包，双击即用。

## 🛠️ Tech Stack (技术栈)

- **Core**: Electron, React 19, Vite
- **Styling**: Vanilla CSS (CSS Variables, Glassmorphism), TailwindCSS (Utility Class)
- **Icons**: Lucide React
- **Build**: Electron Builder

## 🚀 Getting Started (快速开始)

### Prerequisites (前置要求)

- Node.js 16+
- npm or yarn

### Installation (安装与运行)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/onelxw/sora2api-client.git
   cd sora-client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Build (打包构建)

Build for Windows (Installer + Portable):

```bash
npm run dist
```

Output files will be in `dist_electron/`.

## ⚙️ Configuration (配置)

Since this is a client, you need to configure your API endpoint in the Settings:

1. Click the **Settings (⚙️)** icon in the top left.
2. Enter your **Base URL** (e.g., `http://localhost:8082` or your API service).
3. Enter your **API Key** (if required).
4. Set your download path.

## 📄 License

MIT License © 2025
