# Node API Row Structure 🚀

[![npm version](https://img.shields.io/npm/v/generate-node-structure.svg?style=flat-square)](https://www.npmjs.com/package/generate-node-structure)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js->=14-green.svg?style=flat-square)](https://nodejs.org/)

**Node API Row Structure** is a powerful, production-ready boilerplate for building scalable and modular RESTful APIs with Node.js, Express, and PostgreSQL. It comes pre-configured with essential features like authentication, security, logging, and API documentation, allowing you to focus on building your product.

---

## 🌟 Features

- **🏗 Modular Architecture**: Organized structure for scalability and maintainability.
- **🐘 PostgreSQL Integration**: Direct and efficient database interaction using `pg`.
- **🔐 Authentication**: Complete auth system (Signup, Login, Logout, Password Reset) using JWT.
- **🛡 Security First**:
  - **CORS** configuration.
  - **Rate Limiting** to prevent abuse.
  - **Input Validation** with `Joi`.
  - **Password Hashing** with `bcryptjs`.
- **📝 API Documentation**: Integrated documentation generation with `node-api-document`.
- **📧 Email Service**: Pre-configured `Nodemailer` setup.
- **🐛 Error Tracking**: Integrated **Sentry** for real-time error monitoring.
- **🌐 Localization**: Support for multiple languages with `localizify`.
- **⚡ Performance**: Compression and optimized query structure.

---

## 🚀 Getting Started

You can easily generate a new project using `npx` or by installing the CLI globally.

### Option 1: Using npx (Recommended)

Run the following command to create a new project in your current directory:

```bash
npx generate-node-structure
```

### Option 2: Global Installation

Install the CLI globally:

```bash
npm install -g generate-node-structure
```

Then run the generator:

```bash
create-node-structure
```

---

## 📂 Project Structure

The generated project follows a clean, modular structure:

```text
.
├── bin/                # CLI scripts
├── config/             # Configuration files (DB, etc.)
├── enc_dec/            # Encryption/Decryption utilities
├── languages/          # Localization files
├── middleware/         # Express middleware (Auth, etc.)
├── modules/            # API Modules (Controllers, Routes, Services)
│   └── v1/             # Version 1 API
├── scripts/            # Utility scripts (DB init, etc.)
├── template/           # Template files
├── tests/              # Test suites
├── utils/              # Helper functions
├── views/              # EJS views (Email templates, etc.)
├── .env.example        # Environment variables example
├── index.js            # Application entry point
└── package.json        # Project dependencies
```

---

## 🛠 Configuration

1.  **Environment Variables**:
    Copy `.env.example` to `.env` and update the values:

    ```bash
    cp .env.example .env
    ```

    Update your database credentials, JWT secrets, and Sentry DSN in the `.env` file.

2.  **Database Setup**:
    Initialize your PostgreSQL database tables:

    ```bash
    npm run db:init
    ```

---

## 📜 Available Scripts

- `npm start`: Start the production server.
- `npm run dev`: Start the development server with `nodemon`.
- `npm test`: Run tests using `jest`.
- `npm run db:init`: Create database tables.

---

## 📚 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via `pg`)
- **Validation**: [Joi](https://joi.dev/)
- **Authentication**: [JSON Web Token (JWT)](https://jwt.io/)
- **Logging**: [Sentry](https://sentry.io/)
- **Documentation**: [node-api-document](https://www.npmjs.com/package/node-api-document)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Author**: Tirth Gaudani
