# RentBridge

RentBridge is a comprehensive landlord-tenant platform designed for the Nigerian market. This application connects landlords and tenants, offering a seamless experience for property listings, tenant screening, secure payments, and rental management.

## Overview

RentBridge is built with a modern tech stack consisting of a ReactJS-based frontend and an Express.js backend, supported by MongoDB as the database. The platform is designed to ensure robust performance, scalability, and security.

### Architecture and Technologies

- **Frontend**: 
  - **ReactJS** with Vite dev server
  - **Tailwind CSS** for styling
  - **Shadcn-ui** component library
  - **React Router** for client-side routing
  
- **Backend**:
  - **Express.js**: REST API server
  - **MongoDB** with Mongoose for database management
  - **JWT** for authentication

### Project Structure

**Frontend (client/)**:
- **Components**: All UI components
- **Pages**: Defines the main page components
- **API**: Contains mocked API requests and configurations
- **Contexts**: Manages global state and themes

**Backend (server/)**:
- **Models**: Mongoose schemas
- **Routes**: API endpoints
- **Services**: Business logic and interactions with the database
- **Utils**: Utility functions for authentication, email, and more

## Features

The RentBridge platform offers a suite of features catering to various user roles:

### Landlords
- Create and manage property listings
- View and respond to tenant inquiries
- Accept/reject rental applications
- Generate rental agreements
- Receive holding deposits and rental payments

### Tenants
- Search and filter available properties
- Contact landlords through messaging
- Submit rental applications
- Make holding deposits
- Sign rental agreements digitally

### Administrators
- Monitor platform activity
- Manage user accounts
- Handle disputes and support requests

Additional core features include:
- **User Registration & Authentication**
- **Identity Verification**
- **Property & Listing Management**
- **Real-Time Messaging System**
- **Rental Application Process**
- **Holding Deposit & Payment Flow**
- **Rental Agreement Workflow**
- **Dashboard Experiences**
- **Notification System**
- **User Profile Management**

## Getting started

### Requirements

To run RentBridge, you'll need the following:

- **Node.js** (version 16.x or later)
- **npm** (version 7.x or later)
- **MongoDB** (running instance or access to a MongoDB cluster)

### Quickstart

Follow these steps to set up and run the project locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/rentbridge.git
   cd rentbridge
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the `server/` directory based on the `.env.example` file.

4. **Run the application**:
   ```bash
   npm run start
   ```

This command will start both the frontend and backend concurrently. The frontend will be accessible at `http://localhost:5173` and the backend at `http://localhost:3000`.

### License

The project is proprietary. 

&copy; 2024. All rights reserved.
