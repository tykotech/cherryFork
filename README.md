# 🍒 TykoTech Fork

TykoTech Fork is a reworked version of the Chinese application Cherry Studio by
Cherry-AI. This fork is intended to be available for everyone and primarily
serves as a project for my personal growth as a developer. It maintains the core
functionality while adding improvements and new features.

# 📖 Guide

Get started with TykoTech Fork by visiting our documentation:

- **For Users**: Check out the [User Guide](docs/README.md) for installation
  instructions and feature explanations
- **For Developers**: See the [Development Guide](docs/dev.md) for setting up
  the development environment
- **For Contributors**: Read the [Contribution Guidelines](CONTRIBUTING.md)
  before submitting code

# 🌠 Screenshot

![TykoTech Fork Main Interface](https://github.com/user-attachments/assets/082efa42-c4df-4863-a9cb-80435cecce0f)
![Conversation View](https://github.com/user-attachments/assets/f8411a65-c51f-47d3-9273-62ae384cc6f1)
![Knowledge Base](https://github.com/user-attachments/assets/0d235b3e-65ae-45ab-987f-8dbe003c52be)

# 🌟 Key Features

1. **Diverse LLM Provider Support**:

- ☁️ Major LLM Cloud Services: OpenAI, Gemini, Anthropic, and more
- 🔗 AI Web Service Integration: Claude, Peplexity, Poe, and others
- 💻 Local Model Support with Ollama, LM Studio

2. **AI Assistants & Conversations**:

- 📚 30+ Pre-configured AI Assistants
- 🤖 Custom Assistant Creation
- 💬 Multi-model Simultaneous Conversations

3. **Document & Data Processing**:

- 📄 Support for Text, Images, Office, PDF, and more
- ☁️ WebDAV File Management and Backup
- 📊 Mermaid Chart Visualization
- 💻 Code Syntax Highlighting

4. **Practical Tools Integration**:

- 🔍 Global Search Functionality
- 📝 Topic Management System
- 🔤 AI-powered Translation
- 🎯 Drag-and-drop Sorting
- 🔌 Mini Program Support
- ⚙️ MCP(Model Context Protocol) Server

5. **Enhanced User Experience**:

- 🖥️ Cross-platform Support for Windows, Mac, and Linux
- 📦 Ready to Use, No Environment Setup Required
- 🎨 Light/Dark Themes and Transparent Window
- 📝 Complete Markdown Rendering
- 🤲 Easy Content Sharing

# 📝 TODO

- [x] Quick popup (read clipboard, quick question, explain, translate,
      summarize)
- [x] Comparison of multi-model answers
- [x] Support login using SSO provided by service providers
- [x] All models support networking
- [x] Launch of the first official version
- [x] Bug fixes and improvements (In progress...)
- [ ] Plugin functionality (JavaScript)
- [ ] Browser extension (highlight text to translate, summarize, add to
      knowledge base)
- [ ] iOS & Android client
- [ ] AI notes
- [ ] Voice input and output (AI call)
- [ ] Data backup supports custom backup content

# 🌈 Theme

TykoTech Fork comes with multiple themes to match your preferences:

- **Light and Dark modes**: Switch between themes based on your environment
- **Transparent Window**: Enable transparency for a modern look
- **Color Customization**: Customize the UI colors to your liking
- **Custom CSS**: Advanced users can modify the appearance with custom CSS

The application automatically respects your system theme settings, but you can
override this in the Settings menu.

# 🤝 Contributing

Getting Started Fork the Repository: Fork and clone it to your local machine.
Create a Branch: For your changes (follow our branching strategy). Submit
Changes: Commit and push your changes. Open a Pull Request: Describe your
changes and reasons. See CONTRIBUTING.md for detailed contribution guidelines.

# 🚀 Contributors

Thank you to all contributors who have helped improve TykoTech Fork!

<a href="https://github.com/TykoTech/TykoTech-Fork/graphs/contributors">
<img src="https://contrib.rocks/image?repo=TykoTech/TykoTech-Fork" /> </a>

# 🌐 Community

Join our growing community to get help, share ideas, and connect with fellow
users:

GitHub Issues: Report bugs and request features Discussions: Share ideas and ask
questions Contact: For other inquiries, see the Contact section below

# ☕ Sponsor

If you find TykoTech Fork helpful, please consider supporting the development:

Star the repository: Show your appreciation with a GitHub star Spread the word:
Tell others about this project Contribute: Submit improvements via pull requests
See Sponsor for more ways to support this project.

# 📃 License

TykoTech Fork uses a User-Segmented Dual Licensing model:

For Individual Users and Organizations with ≤10 people: GNU Affero General
Public License v3.0 (AGPLv3) For Organizations with >10 people: Commercial
License required For licensing inquiries, please contact us via email.

# ✉️ Contact

GitHub Issues: For bug reports and feature requests Email:
support@tykotech-fork.com ⭐️ Star History

<img alt="Star History Chart" src="https://api.star-history.com/svg?repos=TykoTech/TykoTech-Fork&amp;type=Timeline">

# 🖥️ Develop

## Prerequisites

- Node.js v20.x or newer
- Yarn v4.6.0 (using Corepack)

## Quick Start

```bash
# Enable Corepack for Yarn
corepack enable
corepack prepare yarn@4.6.0 --activate

# Install dependencies
yarn install

# Start development server
yarn dev

# For your current platform
yarn build:current_os

# For specific platforms
yarn build:win
yarn build:mac
yarn build:linux

---
```
