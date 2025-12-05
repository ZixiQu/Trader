# Proposal

## Team Members

- Jinyan Yi — 1006232881  
- Zixi Qu — 1006143861  
- Kangzhi Gao — 1006307827 — kangzhi.gao@mail.utoronto.ca

## Introduction

This project is a **trading system** that provides a browser-based frontend for efficiently handling various financial products. Our goal is to design a full-stack web application that allows users to manage their investments, execute buy/sell transactions, and monitor portfolio performance in real time.

## Motivation

Financial products such as stocks, bonds, and mutual funds play a crucial role in wealth management and economic growth. However, most existing trading systems are either too complex for general users or require high transaction fees and full brokerage integration. For individuals who want to understand how trading mechanisms function or experiment with different investment strategies, the learning curve and cost of participation remain significant barriers.

As a team interested in both financial technology and backend system design, we were motivated to work on this project because we see this accessibility gap as meaningful and worth solving. Our goal is to design an efficient and reliable trading simulator that mimics real-world trading operations while maintaining simplicity and transparency. The system allows users to execute trades, monitor performance, and manage different asset types—such as equities, bonds, and mutual funds—within a unified interface. By focusing on responsiveness, transaction accuracy, and real-time data updates, our project demonstrates how a modern trading backend can be structured to handle concurrent transactions and maintain consistency in portfolio states.

Beyond the functional objectives, this project also represents an opportunity to explore the technological foundations behind trading infrastructures, including database design for transactional systems, concurrent order processing, and scalable service orchestration. Building such a platform not only reinforces our understanding of distributed systems but also highlights the broader significance of lowering barriers to financial learning, where users can safely practice trading without complexity, risk, or cost.

## Objective

The main objective of this project is to create a secure, scalable, and user-friendly web application that simulates real-world financial trading. Through this implementation, our team aims to demonstrate how a modern trading system can support accurate transaction processing, maintain consistent portfolio states, and provide an accessible environment for users to explore different investment products.

The platform is designed to allow users to:

- Trade financial products such as stocks, bonds, and mutual funds
- Manage their account balances with deposit and withdrawal features
- View real-time updates on portfolio values
- Monitor interest rates and transaction history

By building these capabilities, the project aims to show how trading logic, database transactions, and user interactions can be integrated into a cohesive full-stack system.

### Key Features

- User Authentication – Secure login and account management
- Trading Engine – Buy/sell functionality for two asset types: stocks and bonds
- Portfolio Management – Real-time visualization of user holdings
- Transaction History – Track deposits, withdrawals, and executed trades
- Interest Simulation – For simplicity, bonds yield a fixed 100% return when sold

## Technical Stack

### Backend & Database

- **PostgreSQL** – Stores all persistent data, including users, balances, holdings, and transactions
- **SQL** – Used to define relational tables and enforce transactional consistency
- **Prisma** – Manages the database schema and provides type-safe queries for all backend operations

### Frontend

- **Next.js** – Hosts the frontend interface and backend API routes in a unified framework
- **React** – Builds the interactive trading interface and portfolio visualization
- **TailwindCSS** – Styles the UI efficiently for fast layout development
- **ShadCN UI** – Provides prebuilt UI components used for forms, tables, and dashboard elements

### Containerization & Deployment

- **Docker** – Packages the application and database into reproducible containers
- **Docker Compose** – Coordinates multi-service development environments (API + Postgres)
- **Docker Hub** – Stores production-ready images used by the deployment pipeline

### Orchestration

- **Kubernetes (K8s)** – Chosen for orchestrating and scaling the application in production
- **DigitalOcean Kubernetes** – Runs the managed K8s cluster where the backend and database are deployed

### CI/CD

- **GitHub Actions** – Automates building Docker images, pushing them to Docker Hub, and updating the Kubernetes deployment

## Features

### Containerization & Local Development

- The application backend and database are fully containerized using **Docker**, ensuring consistent runtime environments across development and production.
- A **multi-stage Dockerfile** is implemented to optimize the build process and reduce production image size:
  - **Builder Stage (`builder`)**  
    - Installs dependencies using `npm ci`  
    - Generates the Prisma client  
    - Compiles the Next.js application into an optimized `.next` build  
    - This stage contains development tools but does not appear in the final image  
  - **Production Runner Stage (`runner`)**  
    - Copies only the compiled build output and minimal runtime dependencies  
    - Excludes source code, dev dependencies, and build tools  
    - Produces a smaller, faster, and more secure production image  
    - Runs the production server using `npm run start`  
  - **Local Development Stage (`dev`)**  
    - Installs all dependencies (including dev dependencies)  
    - Runs `prisma db push` and `npm run dev` with hot reload  
    - Provides a smooth developer experience without requiring separate tooling  
- **Docker Compose** is used to orchestrate the API container (`api-dev`) and PostgreSQL during local development:
  - Automatically injects `DATABASE_URL` for developer workflows  
  - Ensures both services start together with proper networking  
  - Provides a reproducible environment without manual database setup

### State Management & Persistent Storage

- All application data (users, balances, holdings, transactions) is stored in **PostgreSQL**.
- **DigitalOcean Volumes** provide persistent storage so data is preserved across container restarts and redeployments.

### Deployment Provider

- The entire application is deployed to **DigitalOcean**.
  (See Deployment Information section for the live URL.)

### Orchestration with Kubernetes

- **Kubernetes (K8s)** is used as the orchestration approach.
- A **DigitalOcean Kubernetes** cluster runs the production workloads.
- (More details here - Zixi)

### Monitoring & Observability

- **DigitalOcean Monitoring** is enabled to track CPU, memory, and disk usage.
- An alert is configured to notify when CPU usage exceeds **70% for more than 5 minutes**.

### Advanced Features

- **Real-time functionality** is supported using the Yahoo Finance API for fetching updated stock prices.
- **Security & Authentication** is implemented with **NextAuth** in Next.js, enabling signup, signin, and signout.
- A **CI/CD pipeline** using GitHub Actions:
  - Builds production-ready Docker images
  - Pushes images to Docker Hub
  - Automatically updates the Kubernetes deployment in production

### Application Features

The trading system provides the following capabilities for users:

- Create an account and authenticate (signup, signin, signout)
- Manage cash balance through **deposit**
- Trade assets:
  - **Buy and sell stocks** (Amazon, Apple, NVIDIA)
  - **Buy and sell bonds** (US Treasury Bond, Canada Savings Bond)  
    *Bond interest simplified to fixed 100% gain upon selling*
- View stock and bond information (e.g., price, historical data)
- Review complete **transaction history**
- See **portfolio** and current holdings in real time

## User Guide

### Accessing the Application & Authentication

When the user first visits the application, they are directed to the **/signin** page.

- If the user does not have an account, they can click the **Sign Up** link.
- The signup form requires:
  - Email  
  - Password  
  - Username  
- After successful registration (no duplicate email), the user is automatically redirected back to **/signin**.
- After signing in, the user is taken to the main dashboard and a left navigation panel becomes available.

### Navigation Sidebar

Once signed in, a navigation sidebar appears on the left, providing quick access to every major section:

- **Profile (Portfolio Overview)**
- **Stocks**
- **Trade**
- **Transactions**

### Managing Portfolio & Deposits (Profile Page: `/profile`)

Users can access their profile by clicking their username in the navigation bar.

On this page, users can:

- **Deposit cash** to increase their available balance
- View **current stock and bond holdings**
- **Sell** any stock or bond they own
- View **total portfolio value**, including cash balance + market value of all holdings

### Viewing Stock Data (`/stocks`)

The Stocks page provides real-time and historical market data.

Features include:

- A **line chart** that plots historical prices for the three available stocks:
  - Amazon (AMZN)
  - Apple (AAPL)
  - NVIDIA (NVDA)
- A dropdown menu on the **top-left** allows selecting which stock to display.
- A dropdown menu on the **top-right** allows changing the historical date range.
- A holdings panel on the right shows:
  - Current stock quantities owned  
  - A button that navigates directly to the **Trade** page for buying/selling  

### Trading Stocks and Bonds (`/trade`)

The Trade page provides two lists:

- **Stocks (left box)**: AMZN, AAPL, NVDA  
- **Bonds (right box)**: US Treasury Bond, Canada Savings Bond  

Interaction flow:

1. Select a stock or bond to trade.  
2. A details panel appears showing current price and input fields.
3. Enter the number of units you want to buy.  
4. The total cost is automatically calculated.  
5. Click **Confirm Trade** to complete the transaction.

Trades update the user’s holdings, balance, and transaction history immediately.

### Viewing Transaction History (`/transactions`)

The Transactions page provides a chronological list of all user activity, including:

- Deposits  
- Stock purchases  
- Stock sales  
- Bond purchases  
- Bond sales  

Each record shows the asset, transaction type, quantity, price, and timestamp.

## Development Guide

### 1. Install Required Tools

Ensure the following tools are installed on your machine:

- PostgreSQL
- Node.js (v22)
- npm
- Docker (optional but recommended)

### 2. Configure Environment Variables

Fill in the required environment variables into `.env` file

```
DATABASE_URL="postgresql://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/POSTGRES_DB?schema=public"
NEXTAUTH_URL="YOUR_NEXTAUTH_URL"
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"

POSTGRES_USER="YOUR_POSTGRES_USER"
POSTGRES_PASSWORD="YOUR_POSTGRES_PASSWORD"
POSTGRES_DB="YOUR_POSTGRES_DB"
DB_PORT="5432"
```

These variables are required to:
- Connect to PostgreSQL
- Run Prisma migrations
- Configure NextAuth authentication

### 3. (Optional) Use Docker for Local Development — Recommended

If you prefer running the database and API inside containers:

```
docker compose up --build api-dev
```

This will:
- Start PostgreSQL inside Docker  
- Build the **api-dev** (development-stage) image  
- Run Prisma schema synchronization (`prisma db push`)  
- Start Next.js dev server with hot reload  

Access the application at:

```
[http://localhost:3000](http://localhost:3000)
```

Persistent Storage:
Docker Compose mounts a volume for PostgreSQL so data survives restarts.

### 4. Manual Local Development

If running the project directly on your machine:

#### Step 4.1 Install dependencies

```
npm install
```

#### Step 4.2 Generate Prisma Client

```
npx prisma generate
```

#### Step 4.3 Push schema to PostgreSQL

```
npx prisma db push
```

Ensure PostgreSQL is running locally and credentials match the `.env` file.

#### Step 4.4 Start the development server

```
npm run dev
```

Access the application at:

```
[http://localhost:3000](http://localhost:3000)
```

### 5. Local Testing Workflow

- **User Authentication**: signup → signin → signout
- **Cash Management**: deposit and verify new balance
- **Trading**:
  - Buy/sell **stocks** (AAPL, AMZN, NVDA)
  - Buy/sell **bonds** (fixed 100% return on sell)
- **Portfolio Dashboard**: confirm holdings update in real time  
- **Transaction History**: deposits, withdrawals, trades logged correctly

User Guide: How does a user interact with your application? Provide clear instructions for using each main feature, supported with screenshots where appropriate.

## Deployment Information

This project is deployed at:

**http://174.138.112.104:8080/**

The application is hosted on a **DigitalOcean Kubernetes** cluster, where the backend services, PostgreSQL database, and supporting components are containerized and orchestrated using K8s.

## Individual Contributions

<!-- Individual Contributions: What were the specific contributions made by each team member? This should align with the Git commit history. -->

### Kangzhi Gao

- Implemented the entire application logic, including the frontend interface, backend functionality, and database schema
- Created the multi-stage Dockerfile to separate development and production builds
- Set up Docker Compose for both local development and production image building
- Deployed the application to DigitalOcean Kubernetes
- Built the CI/CD pipeline using GitHub Actions to automate Docker image creation, pushing to Docker Hub, and updating the DigitalOcean Kubernetes deployment

## Lessons Learned

Through building and deploying this project, we gained practical experience across containerization, orchestration, backend workflows, and deployment pipelines.

- Containerization with Docker, especially using Docker Compose, allows multi-service applications to be set up and configured efficiently, improving performance, consistency, and maintainability.  
- Using a multi-stage Dockerfile significantly reduces the production image size and makes the build process cleaner and more optimized.  
- Deploying on DigitalOcean Kubernetes revealed that managed K8s provides a powerful and convenient IaaS experience, but the cost can be high for student or small-scale projects.  
- Working with Prisma introduced challenges related to schema generation and database migrations during containerization and orchestration. Through this, we developed a deeper understanding of how Prisma workflows integrate with different environments and how to prepare future applications for similar setups.  
- Kubernetes provided valuable insights into deploying real applications on a cluster, managing pods, handling restarts, and understanding containerized workloads at scale.  
- Due to time limitations, not all planned application features were fully implemented. The project will continue to be improved in the future with additional functionality and refinements.  
