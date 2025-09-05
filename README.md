# Idea Hub

<div align="center">

  <!-- Logo placeholder with better styling -->
  <img src="https://iili.io/K2mqQsf.png" alt="Idea Hub logo " width="200" style="border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"/>

  <h1>Idea Hub</h1>

  <p>
    <b>An enterprise-grade, full-stack solution for the systematic management and lifecycle tracking of application concepts. From ideation to archival, Idea Hub provides a secure, structured, and scalable environment for innovation.</b>
  </p>

  <!-- Badges -->
  <p>
    <a href="LICENSE.txt"><img src="https://img.shields.io/badge/License-Apache_2.0-007EC6?style=for-the-badge" alt="License"></a>
    <a href="https://github.com/ZiadKhaled999/ideahub/actions"><img src="https://img.shields.io/badge/Build-Passing-4c1?style=for-the-badge" alt="Build Status"></a>
    <a href="https://github.com/ZiadKhaled999/ideahub/releases"><img src="https://img.shields.io/badge/Version-1.0.0-9f58a3?style=for-the-badge" alt="Version"></a>
    <a href="https://github.com/ZiadKhaled999/ideahub"><img src="https://img.shields.io/github/stars/ZiadKhaled999/ideahub?style=for-the-badge" alt="GitHub stars"></a>
  </p>

</div>

---

### **Transforming Ephemeral Concepts into Tangible Assets.**
Standard note-taking applications fail to capture the structured journey of a digital product. Idea Hub is architected to solve this critical gap, providing a dedicated, purpose-built platform that ensures your most valuable ideas are meticulously tracked, evaluated, and primed for development.

<!-- Application Demo Placeholder -->
<div align="center">
  <img src="https://i.ibb.co/WWrKDmtV/Idea-Hub-Application-screenshot.png" alt="Idea Hub Application screenshot" style="border-radius: 10px;"/>
</div>

## 📋 Table of Contents

1.  [✨ Core Functionality](#-core-functionality)
2.  [🛠️ Architectural Blueprint](#️-architectural-blueprint)
3.  [🚀 Local Deployment](#-local-deployment)
4.  [⚙️ Environment Configuration](#️-environment-configuration)
5.  [▶️ Operational Commands](#️-operational-commands)
6.  [📡 API Endpoints](#-api-endpoints)
7.  [🗄️ Data Architecture](#️-data-architecture)
8.  [🐛 Current Issues](#-current-issues)
9.  [🗺️ Future Vision](#️-future-vision)
10. [🤝 Contributing & Collaboration](#-contributing--collaboration)
11. [📜 License](#-license)
12. [📬 Get in Touch](#-get-in-touch)

---

## ✨ Core Functionality

* 🔐 **Fortified User Authentication:** Employs JWT-based security protocols to guarantee data integrity and user privacy.
* 📝 **Comprehensive Idea Management:** Full CRUD (Create, Read, Update, Delete) operations, providing complete control over your ideation assets.
* 📊 **Strategic Lifecycle Tracking:** Monitor progress with granular status assignments (`Idea`, `Researching`, `In Progress`, `Launched`, `Archived`).
* 🏷️ **Advanced Categorization Engine:** Utilizes a multi-tag system for sophisticated filtering, sorting, and organizational capabilities.
* 🔍 **High-Performance Search:** A real-time, indexed search engine allows for instantaneous retrieval of ideas by keyword, status, or tag.
* 🎨 **Visual Prioritization Matrix:** Assign custom color codes to idea cards for intuitive, at-a-glance grouping and strategic assessment.

---

## 🛠️ Architectural Blueprint

This project is engineered with a robust, scalable, and modern technology stack designed for high performance and maintainability.

<p align="center">
  <a href="https://nextjs.org/" target="_blank"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"></a>
  <a href="https://reactjs.org/" target="_blank"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"></a>
  <a href="https://supabase.io/" target="_blank"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"></a>
  <a href="https://www.postgresql.org/" target="_blank"><img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
  <a href="https://tailwindcss.com/" target="_blank"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
</p>

---

## 🚀 Local Deployment

To provision a local instance of the application, please follow the steps below.

### System Prerequisites
- Node.js (v18.x or later)
- `npm`, `yarn`, or `pnpm` package manager
- Git

### Installation & Setup

1.  **Clone the remote repository:**
    ```sh
    git clone https://github.com/ZiadKhaled999/ideahub.git
    cd ideahub
    ```

2.  **Install project dependencies:**
    ```sh
    npm install
    ```

3.  **Configure environment variables:**
    Create a `.env.local` file in the project's root directory and populate it with your Supabase project credentials.
    ```env
    # Supabase Configuration
     VITE_SUPABASE_PROJECT_ID=""
    VITE_SUPABASE_PUBLISHABLE_KEY=""
    VITE_SUPABASE_URL=""
    
    # AI Features (Not yet implemented)
    # For DeepSeek API (Prompt Enhancement)
    DEEPSEEK_API_KEY="your_deepseek_api_key_here"

    # For Stability AI API (Free Tier Image Generation) / Add any one free.
    STABILITY_API_KEY="your_stability_ai_api_key_here"
    ```

4.  **Initialize the database schema:**
    Access your Supabase project dashboard and execute the SQL script located at `db/schema.sql` to provision the required tables and security policies.

5.  **Start the development server:**
    ```sh
    npm run dev
    ```
    The application will be accessible at http://localhost:3000.

---

## ⚙️ Environment Configuration

The application requires the following environment variables for backend connectivity.

| Variable                      | Description                                           | Required |
| ----------------------------- | ----------------------------------------------------- | :------: |
| `VITE_SUPABASE_PROJECT_ID`    | Supabase project ID (for future AI features)          | `true`  |
| `VITE_SUPABASE_PUBLISHABLE_KEY`| Supabase publishable key (for future AI features)     | `true`  |
| `VITE_SUPABASE_URL`           | Supabase URL (for future AI features)                 | `true`  |

---

## ▶️ Operational Commands

### **Development Mode**
Initiates the Next.js development server with Hot-Module Replacement (HMR).
```sh
npm run dev
```
The application will be accessible at http://localhost:3000.

### **Production Build**
Compiles and optimizes the application for production deployment.
```sh
npm run build
```

This command generates a production-ready .next directory. To serve this build locally, execute:
```sh
npm start
```

### **Linting**
Run ESLint to check code quality:
```sh
npm run lint
```

---

## 📡 API Endpoints

All backend communication is handled via a secure, RESTful API.

### Idea Resource
* **GET** `/api/ideas`
  * Retrieves a collection of ideas for the authenticated user.
  * Query Parameters: `status`, `tag`, `q` (search query).
  * Returns: `200 OK` - An array of idea objects.

* **POST** `/api/ideas`
  * Creates a new idea record.
  * Request Body: A JSON object representing the new idea.
  * Returns: `201 Created` - The newly created idea object.

* **PUT** `/api/ideas/{id}`
  * Updates a specified, existing idea by its unique identifier.
  * Request Body: A JSON object containing the fields to be updated.
  * Returns: `200 OK` - The updated idea object.

* **DELETE** `/api/ideas/{id}`
  * Permanently deletes an idea by its unique identifier.
  * Returns: `204 No Content`.

---

## 🗄️ Data Architecture

The core data entity is the `ideas` table, which is protected by Row Level Security (RLS) to enforce data isolation between users.

### `ideas` Table Schema
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | `PRIMARY KEY`, `default: uuid_generate_v4()` | Unique identifier for the idea (PK). |
| `user_id` | `uuid` | `FOREIGN KEY` to `auth.users(id)` | Owning user's identifier (FK). |
| `title` | `text` | `NOT NULL` | The concise title of the idea. |
| `description` | `text` |  | A comprehensive description of the idea. |
| `status` | `text` | `default: 'Idea'` | The current stage in the idea's lifecycle. |
| `tags` | `text[]` |  | An array of text-based classification tags. |
| `color` | `varchar(7)` | `default: '#ffffff'` | A hex color code for UI card visualization. |
| `created_at` | `timestamptz` | `default: now()` | Timestamp of the record's creation. |
| `updated_at` | `timestamptz` | `default: now()` | Timestamp of the last record modification. |

---

## 🐛 Current Issues

We're actively working to resolve the following issues:

- [ ] **AI Integration**: AI features are not yet implemented in the current version
- [ ] **Responsive Design**: UI inconsistencies on mobile devices
- [ ] **Search Performance**: Search functionality can be slow with large datasets
- [ ] **Image Uploads**: Support for attaching images to ideas is not implemented

---

## 🗺️ Future Vision

Our development roadmap includes several high-impact features:

### Core Improvements
- [ ] **Rich Text Editor**: Implement a WYSIWYG editor for the description field
- [ ] **File Attachments**: Allow for the upload of mockups, documents, and other assets
- [ ] **Team Collaboration**: Introduce multi-user workspaces for collaborative ideation
- [ ] **Analytics Dashboard**: Develop a dashboard for visualizing key idea metrics and trends

### AI Integration
- [ ] **Idea Recommendations**: AI-powered suggestions based on existing ideas
- [ ] **Automated Tagging**: AI-assisted tag generation for new ideas
- [ ] **Sentiment Analysis**: Analyze idea descriptions for emotional tone
- [ ] **Similar Idea Detection**: Identify duplicate or similar ideas automatically

For a detailed list of proposed features and known issues, please consult the [open issues on GitHub](https://github.com/ZiadKhaled999/ideahub/issues).

---

## 🤝 Contributing & Collaboration

We welcome contributions from the open-source community. Your expertise and passion are invaluable in making Idea Hub the best it can be.

### Contribution Process
1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'feat: Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contributor Recognition
Contributors who implement features or fix issues will be recognized here:

- **Feature Implementation**: [@ContributorName](https://github.com/ContributorName) - Implemented [Feature Name]
- **Bug Fixes**: [@ContributorName](https://github.com/ContributorName) - Fixed [Issue Description]

Please review [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on our development process.

---

## 📜 License

Distributed under the Apache 2.0 License. See [LICENSE.txt](LICENSE.txt) for more information.

---

## 📬 Get in Touch

**Ziad Khaled** - Project Maintainer

- GitHub: [@ZiadKhaled999](https://github.com/ZiadKhaled999)
- Email: [albhyrytwamrwhy@gmail.com]

**Project Link**: [https://github.com/ZiadKhaled999/ideahub](https://github.com/ZiadKhaled999/ideahub)

---

<div align="center">
  <sub>Built with ❤️ by the Idea Hub contributors</sub>
</div>
