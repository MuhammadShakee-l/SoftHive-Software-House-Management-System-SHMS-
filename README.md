# SoftHive — Software House Management System (SHMS)

SoftHive is a full-stack Software House Management System built using the MERN stack. It helps manage all the work in a software house in an organized way.
The system has different roles like Admin, Manager, Developer, and Client. A client can send a project request, which is then reviewed and approved. After approval, the project is managed by the team where developers work on tasks and submit their work.
Managers and admins can review the work, and finally, the client can accept or reject it with comments or files. The system also includes features like task management, invoices, notifications, and file uploads.
Overall, SoftHive makes it easy to handle projects from start to end in a simple and structured way.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Roles & Permissions](#roles--permissions)
- [Project Lifecycle Workflow](#project-lifecycle-workflow)
- [Attachments & File Handling](#attachments--file-handling)
- [Repository Structure (Complete Code Tree)](#repository-structure-complete-code-tree)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Run (Development)](#run-development)
- [Build (Production)](#build-production)
- [API Overview](#api-overview)
- [Common Troubleshooting](#common-troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)
- [Author](#author)

---

## Features

###  Client Portal
- Submit **Project Requests** with attachments
- View **My Projects** and project progress
- Receive email when a project is ready for review
- **Accept** delivered work, or **Reject** with remarks and optional attachments (revisions)

### Admin Portal
- Review incoming **Project Requests**
- Approve request → create project → assign manager
- Manage employees, clients, projects, invoices
- Override approvals and forward completed work to client review when needed
- Notifications dashboard

### Manager Portal
- View assigned projects
- Assign developers to projects
- Create/assign tasks
- Review developer delivery submissions
- Approve → send to client review
- Reject → return to developer with reason + remarks

### Developer Portal
- View assigned projects
- Work on tasks
- Upload delivery attachments and submit work for approval with remarks/comments
- Track review results and revision requests

### Invoices
- Create invoices linked to projects and clients
- Invoice items with Qty × Unit Price and totals
- Track payment status (depending on your implementation)

### Notifications
- On assignments and status changes (project/task related)

---

## Tech Stack

**Frontend**
- React
- Redux Toolkit
- React Router
- TailwindCSS (UI styling)
- lucide-react icons

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)

---

## Roles & Permissions

| Role | Key Capabilities |
|------|------------------|
| **Admin** | Approve/reject project requests, assign managers, monitor and override approvals, manage all data |
| **Manager** | Manage project execution, assign developers, manage tasks, approve/reject developer submissions |
| **Developer** | Execute tasks, submit delivery files + remarks for approval |
| **Client** | Submit requests, review completed work, accept/reject with remarks/attachments |

---

## Project Lifecycle Workflow

SoftHive follows a structured lifecycle so every stakeholder knows *where the project is and who owns the next action*:

### 1) Client Request → Admin Review
Client submits a **Project Request** (with attachments).

### 2) Admin Approves Request → Project Created
Admin approves request:
- creates a `Project`
- copies request attachments into project “requirements files”
- assigns a manager

### 3) Manager Phase → Development Phase
Manager assigns one or more developers.
Project moves to **development phase**.

### 4) Developer Submission → Manager/Admin Approval
Developer uploads delivery files + remarks and submits:
- lifecycle moves to **manager approval**
- manager/admin can approve/reject

### 5) Send to Client Review
After manager/admin approval, project moves to **client review** and client receives email.

### 6) Client Accepts or Rejects
- **Accept** → project lifecycle becomes **completed**
- **Reject** → lifecycle returns to **admin** with client remarks + optional files  
  Admin assigns manager again → manager assigns developer → development resumes.

---

## Attachments & File Handling

SoftHive supports multiple attachment flows:

### Project Request Attachments
Stored when client submits a request, then copied into the created project as requirement documents.

### Task Attachments
Users can upload files to tasks (designs, docs, etc.).

### Project Delivery Attachments
Developers submit final delivery files to the project delivery area for review.

### Client Revision Attachments
Clients can attach files (screenshots, documents) when rejecting a delivery and sending back for revisions.

> File storage is handled using Multer and served from your uploads directory (paths depend on your configuration).

---

## Repository Structure (Complete Code Tree)

### IMPORTANT (to not miss any file)
Run these commands in your project root and paste the output below:

**Mac/Linux**
```bash
tree -a -I "node_modules|.git|dist|build"
```

**Windows (PowerShell)**
```powershell
tree /F
```

Then replace the placeholder tree below.

### Code Tree
```text
.
├── client
│   ├── package.json
│   ├── public
│   │   └── ...
│   └── src
│       ├── App.jsx
│       ├── components
│       │   ├── common
│       │   │   ├── Navbar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   ├── ProtectedRoute.jsx
│       │   │   └── ...
│       │   ├── charts
│       │   │   ├── PieChartComp.jsx
│       │   │   ├── BarChartComp.jsx
│       │   │   └── LineChartComp.jsx
│       │   ├── invoices
│       │   │   ├── InvoiceForm.jsx
│       │   │   └── ...
│       │   ├── projects
│       │   │   ├── ProjectLifecyclePanel.jsx
│       │   │   ├── AdminProjectRequestsPanel.jsx
│       │   │   └── ...
│       │   └── tasks
│       │       ├── TaskForm.jsx
│       │       └── ...
│       ├── hooks
│       │   └── useAuth.js
│       ├── layouts
│       │   ├── AuthLayout.jsx
│       │   └── DashboardLayout.jsx
│       ├── pages
│       │   ├── auth
│       │   ├── dashboards
│       │   │   ├── AdminDashboard.jsx
│       │   │   ├── ManagerDashboard.jsx
│       │   │   ├── DeveloperDashboard.jsx
│       │   │   └── ClientDashboard.jsx
│       │   ├── projects
│       │   │   ├── ProjectList.jsx
│       │   │   ├── ProjectDetail.jsx
│       │   │   └── ProjectRequests.jsx
│       │   ├── tasks
│       │   │   ├── TaskList.jsx
│       │   │   └── TaskDetail.jsx
│       │   └── ...
│       ├── redux
│       │   └── slices
│       │       ├── authSlice.js
│       │       ├── projectSlice.js
│       │       ├── taskSlice.js
│       │       ├── invoiceSlice.js
│       │       └── ...
│       ├── services
│       │   ├── api.js
│       │   ├── projectService.js
│       │   ├── projectLifecycleService.js
│       │   ├── taskService.js
│       │   ├── invoiceService.js
│       │   └── dashboardService.js
│       └── utils
│           ├── helpers.js
│           └── constants.js
├── server
│   ├── package.json
│   ├── server.js
│   ├── config
│   │   ├── db.js
│   │   ├── projectDeliveryMulter.js
│   │   └── ...
│   ├── controllers
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── projectRequestController.js
│   │   ├── projectLifecycleController.js
│   │   ├── taskController.js
│   │   ├── invoiceController.js
│   │   └── dashboardController.js
│   ├── middleware
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── ...
│   ├── models
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── ProjectRequest.js
│   │   ├── Task.js
│   │   ├── Invoice.js
│   │   ├── Client.js
│   │   └── Notification.js
│   ├── routes
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── projectRequestRoutes.js
│   │   ├── projectLifecycleRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── invoiceRoutes.js
│   │   └── dashboardRoutes.js
│   ├── uploads
│   │   ├── project-requests
│   │   └── project-deliveries
│   └── utils
│       ├── apiResponse.js
│       ├── sendEmail.js
│       └── emailTemplates.js
└── README.md
```

---

## Setup & Installation

### Prerequisites
- Node.js (LTS recommended)
- MongoDB (local or Atlas)
- npm (or yarn)

### Clone
```bash
git clone YOUR_REPO_URL
cd YOUR_REPO_FOLDER
```

### Install dependencies
```bash
# backend
cd server
npm install

# frontend
cd ../client
npm install
```

---

## Environment Variables

Create a `.env` file in `server/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Email (if you enabled email notifications)
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=SoftHive <no-reply@yourdomain.com>

# Optional (if you use CORS whitelist)
CLIENT_URL=http://localhost:5173
```

> Your project may have different env var names. Keep them exactly as used in your server config.

---

## Run (Development)

### Backend
```bash
cd server
npm run dev
```

### Frontend
```bash
cd client
npm run dev
```

Open:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## Build (Production)

### Frontend
```bash
cd client
npm run build
```

Serve the built frontend via your preferred hosting (Vercel/Netlify) or configure your server to serve it.

---

## API Overview

> Endpoint names may differ slightly depending on your routes. These are the main flows.

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register` (if enabled)
- `GET /api/auth/me` (if enabled)

### Project Requests
- `POST /api/project-requests` (client submits request + attachments)
- `GET /api/project-requests/my` (client list)
- `GET /api/project-requests/admin` (admin list)

### Projects
- `GET /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id/assign-manager` (admin assigns manager)
- `PUT /api/projects/:id/assign-developer` (manager assigns developer)

### Tasks
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id` (status updates etc.)
- `POST /api/tasks/:id/comment`
- `POST /api/files/upload` (task attachments, depending on your implementation)

### Project Delivery Lifecycle
- `POST /api/project-lifecycle/:id/developer/submit` (developer delivery submission)
- `PUT /api/project-lifecycle/:id/manager/approve` (manager/admin -> client review)
- `PUT /api/project-lifecycle/:id/manager/reject`
- `PUT /api/project-lifecycle/:id/admin/send-to-client` (admin override)
- `PUT /api/project-lifecycle/:id/client/accept`
- `POST /api/project-lifecycle/:id/client/reject` (client -> admin with attachments)

---

## Common Troubleshooting

### “Rendered more hooks than during the previous render”
This usually happens when hooks (`useMemo`, `useEffect`, etc.) are placed after conditional returns.
Fix by calling all hooks unconditionally before any `return`.

### Duplicate key error for `projectId: null`
Ensure your `Project` model generates a unique `projectId` and that project creation always sets it.

### Uploads not accessible
Check:
- Multer destination folders exist (`server/uploads/...`)
- Static serving is configured in Express (e.g. `app.use('/uploads', express.static(...))`)
- Your frontend links match the backend serving path

---

## Roadmap
- Add “Tester” role and QA pipeline
- Add project archive for clients
- Add advanced reporting (revenue, performance, workload)
- Add real-time notifications via WebSockets

---

## License
This project is provided under the MIT License (or update to your preferred license).

---
