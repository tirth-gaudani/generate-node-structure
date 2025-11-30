# 🚀 Generate Node Structure
### The Ultimate Production-Ready Node.js & Express Boilerplate

[![npm version](https://img.shields.io/npm/v/generate-node-structure.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/generate-node-structure)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js->=14-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dt/generate-node-structure.svg?style=flat-square&color=orange)](https://www.npmjs.com/package/generate-node-structure)

- Build scalable, secure, and high-performance REST APIs in seconds.
- Stop wasting time on boilerplate code. Focus on building your product.

[Report Bug](https://github.com/tirth-gaudani/generate-node-structure/issues) · [Request Feature](https://github.com/tirth-gaudani/generate-node-structure/issues)

---

## 🌟 Why Choose This Boilerplate?

Starting a new Node.js project often involves setting up the same repetitive structure: Authentication, Database connection, Security headers, Error handling, etc. **Generate Node Structure** eliminates this hassle by providing a **battle-tested, production-ready foundation** instantly.

Whether you are building a small MVP or a large-scale enterprise application, this structure scales with you.

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🏗 Modular Architecture** | Clean, organized folder structure designed for scalability and maintainability. |
| **🐘 PostgreSQL Ready** | Pre-configured with `pg` for robust and efficient database interactions. |
| **🔐 Complete Auth System** | JWT-based Authentication: Signup, Login, Logout, Password Reset & Email Verification. |
| **🛡 Enterprise Security** | Secured with `Helmet`, `CORS`, Rate Limiting, and Input Validation (`Joi`). |
| **📝 Auto Documentation** | Integrated API documentation generation with `node-api-document`. |
| **📧 Email Service** | Ready-to-use email sending service with `Nodemailer` and EJS templates. |
| **🐛 Real-time Monitoring** | Integrated **Sentry** for tracking errors and performance issues in real-time. |
| **🌐 Localization (i18n)** | Built-in support for multiple languages using `localizify`. |
| **⚡ High Performance** | Optimized query structure, compression, and best practices for speed. |

---

## 🚀 Getting Started

Launch your new project in under 30 seconds.

### Option 1: The Fastest Way (npx)

Run this command in your terminal where you want to create your project:

```bash
npx generate-node-structure
```

### Option 2: Global Installation

Install the CLI globally to use it anytime:

```bash
npm install -g generate-node-structure
```

Then generate a new project:

```bash
create-node-structure
```

---

## 📂 Project Structure Overview

We follow a clean **Model-Service-Controller** pattern to keep concerns separated.

```text
.
├── bin/                # CLI entry point
├── config/             # Database & App Configuration
├── enc_dec/            # Encryption & Decryption Utilities
├── languages/          # Localization (i18n) Files
├── middleware/         # Custom Express Middleware (Auth, Error handling)
├── modules/            # API Features (The heart of your app)
│   └── v1/             # Versioned API
│       ├── Auth/       # Authentication Module
│       └── User/       # User Management Module
├── scripts/            # Database initialization & utility scripts
├── template/           # Project templates
├── tests/              # Unit & Integration Tests
├── utils/              # Shared Helper Functions
├── views/              # Email Templates (EJS)
├── .env.example        # Environment Variables Reference
├── index.js            # App Entry Point
└── package.json        # Dependencies & Scripts
```

---

## 🛠 Configuration

### 1. Environment Variables
Rename `.env.example` to `.env` and configure your secrets:

```bash
cp .env.example .env
```

Open `.env` and fill in your details:
- **Database Credentials** (Host, User, Password, DB Name)
- **JWT Secret** (For secure token generation)
- **Sentry DSN** (For error tracking)
- **Email Credentials** (For sending system emails)

### 2. Database Setup
Initialize your PostgreSQL database tables with a single command:

```bash
npm run db:init
```

---

## 📜 Available Scripts

| Script | Description |
| :--- | :--- |
| `npm start` | Starts the production server. |
| `npm run dev` | Starts the development server with hot-reloading (`nodemon`). |
| `npm test` | Runs the test suite using `jest`. |
| `npm run db:init` | Creates necessary database tables. |

---

## 📚 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Validation**: [Joi](https://joi.dev/)
- **Authentication**: [JWT](https://jwt.io/) & [Bcrypt.js](https://www.npmjs.com/package/bcryptjs)
- **Logging**: [Sentry](https://sentry.io/)
- **Documentation**: [node-api-document](https://www.npmjs.com/package/node-api-document)

---

## 🤝 Contributing

We love contributions! If you have ideas for improvements or find a bug, please open an issue or submit a pull request.

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Made with ❤️ by [Tirth Gaudani](https://github.com/tirth-gaudani)