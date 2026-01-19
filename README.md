# Trader

[Video Demo](https://drive.google.com/file/d/10SzbdUMGpUiTOwAJqkGkPtUEa4ae1ZqD/view?usp=sharing)

[Link to system](http://174.138.112.104:8080/signin)

## Team Members

- Jinyan Yi — 1006232881 alexjy.yi@mail.utoronto.ca
- Zixi Qu — 1006143861 - zixi.qu@mail.utoronto.ca
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
- Trading Engine – Buy/sell functionality for three asset types: **stocks, bonds, and cryptocurrencies**
- Portfolio Management – Real-time visualization of user holdings (including crypto)
- Transaction History – Track deposits, withdrawals, and executed trades
- Real-time Market Data – Live prices for stocks, bonds (via ETFs), and major cryptocurrencies (BTC, ETH, DOGE)

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
- **Docker Compose** is used to orchestrate the API container (`dev`) and PostgreSQL during local development:
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
- The system is fully modularized and decomposed into a set of declarative manifests, that are applied in the following logical order:

  1. ``secrets.yaml``: **Securely stores sensitive configuration**: `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.
  2. `postgres.yaml`: Production-grade PostgreSQL instance deployed as a StatefulSet, such that it delivers:

     - Guarantees consistent network identity and persistent volume attachment.
     - Ensures data survives pod restarts, rescheduling, or node failures.
     - Includes a headless service for direct pod access and a PersistentVolumeClaim(PVC) for durable storage.
  3. `deployment.yaml`: Core Next.js App. Support horizontal scalability by increasing replicas to support more parallelism. Built-in rolling updates. Health checking via `livenessProbe` and `readinessProbe`.
  4. `service.yaml`: Expose the application externally via `LoadBalancer` style, that automatic round-robin load balancing across all healthy pods.
  5. `prisma-migrate.yaml`: Defines a one-time Kubernetes Job responsible for running Prisma schema migrations in production. It ensures the database is fully up-to-date before application rollout by executing `prisma migrate deploy` inside the production image used by the app.

### Deploying on DigitalOcean Kubernetes

#### Save Kubeconfig

After creating the Kubernetes cluster on DigitalOcean, save the kubeconfig locally:

```bash
doctl kubernetes cluster kubeconfig save <CLUSTER_ID>
```

#### Apply YAML Manifests (In Order)

Apply each Kubernetes resource step-by-step:

```bash
kubectl apply -f secret.yaml        # Database secrets
kubectl apply -f postgres.yaml      # PostgreSQL (StatefulSet + PVC)
kubectl apply -f deployment.yaml    # Application Deployment
kubectl apply -f service.yaml       # Expose the app (LoadBalancer)
```

#### Reset / Clean Up (If Something Goes Wrong)

If PostgreSQL or the application fails, delete resources in the correct order:

```bash
kubectl delete statefulset postgres
kubectl delete pods postgres-0
kubectl delete pvc pgdata-postgres-0
```

Then remove app + DB configs:

```bash
kubectl delete -f service.yaml
kubectl delete -f deployment.yaml
kubectl delete -f postgres.yaml
kubectl delete -f secret.yaml
```

#### Check Pod Status

Verify everything is running:

```bash
kubectl get pods
```

#### Get External IP

Retrieve service IPs:

```bash
kubectl get svc
```

Example output:

```
NAME             TYPE           CLUSTER-IP     EXTERNAL-IP        PORT(S)           AGE
kubernetes       ClusterIP      10.109.0.1     <none>             443/TCP           77m
postgres         ClusterIP      None           <none>             5432/TCP          10m
trader-service   LoadBalancer   10.109.3.119   <PUBLIC_IP>        8080:30940/TCP    89s
```

### Monitoring & Observability

- **DigitalOcean Monitoring** is enabled to track CPU, memory, and disk usage.
- An alert is configured to notify when CPU usage exceeds **70% for more than 5 minutes**.

![monitor1](./assets/monitor1.png)

![monitor2](./assets/monitor2.png)

![alert](./assets/alert.png)

### Advanced Features

- **Real-time functionality** is supported using the Yahoo Finance API for fetching updated stock prices.
- **Security enhancements**:

  - user authentication and authorization.
  - secret managements via Kubernetes secrets and GitHub CI/CD secrets.
- A **CI/CD pipeline** using GitHub Actions enabling seamless, zero-downtime delivery of the application from code commit to production.The pipeline automates the entire release process:

  - **Source checkout**The workflow begins with checking out the latest code from the `main` branch, ensuring every commit triggers a consistent and reproducible build.
  - **Docker Hub authentication**The workflow logs into Docker Hub using encrypted CI/CD secrets (`DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`) to allow pushing production images.
  - **Image building using Docker Compose**The API service image is built from the local `docker-compose` configuration. This ensures consistent builds between development and CI environments.
  - **Image tagging and pushing to Docker Hub**The generated `trader:latest` image is tagged as a production image (`trader:prod`) and uploaded to Docker Hub, making it available for Kubernetes to pull the latest version.
  - **DigitalOcean CLI (doctl) integration**The workflow installs the DigitalOcean CLI using `digitalocean/action-doctl`, authenticated via a CI secret (`DIGITALOCEAN_ACCESS_TOKEN`).This allows the pipeline to securely interact with the DigitalOcean Kubernetes cluster.
  - **Kubernetes cluster authentication**Using `doctl kubernetes cluster kubeconfig save`, the workflow retrieves the cluster’s kubeconfig into the runner so that subsequent `kubectl` commands operate directly against the production cluster.
  - **Database migration automation**A Kubernetes Job (`prisma-migrate.yaml`) is applied and executed.After submission, the workflow waits for the job to complete using:
    `kubectl wait --for=condition=complete job/prisma-migrate`.This ensures schema migrations are applied *before* rolling out the new application deployment.
  - **Applying application manifests**After migrations complete, the CI pipeline applies only the manifests necessary for runtime updates:

    - `postgres.yaml`
    - `deployment.yaml`
    - `service.yaml`

    These files represent:

    - the database StatefulSet and volumes,
    - the deployment that pulls the updated Docker image,
    - and the service exposing the application endpoint.

    The workflow intentionally **does not** apply the secrets manifest (`secret.yaml`).This is because Kubernetes secrets contain production credentials (DB password, JWT secrets, API keys), and re-applying them through CI/CD is unsafe. Secrets should:

    - be created **manually once** in the cluster,
    - remain stable across deployments,
    - and not be overwritten or regenerated automatically.
      GitHub Actions cannot store raw secret YAML files safely since Kubernetes secrets are only base64-encoded (not encrypted). Automatically reapplying them during CI/CD could break existing workloads or expose sensitive data.

    By applying only non-sensitive manifests, the CI/CD pipeline ensures safe, repeatable deployments without modifying critical secrets already stored in the cluster.

![action](./assets/action.png)

### Application Features

- Manage cash balance through **deposit**
- Trade assets:
  - **Buy and sell stocks** (Amazon, Apple, NVIDIA)
  - **Buy and sell bonds** via liquid bond ETFs (e.g., TLT, XGB.TO) using real-time market prices
  - **Buy and sell cryptocurrencies** (Bitcoin `BTC-USD`, Ethereum `ETH-USD`, Dogecoin `DOGE-USD`)
  - Support for **fractional quantities** (e.g., 1.25 shares or 0.5 BTC)
- View stock, bond, and crypto information (e.g., price, historical data)
- Review complete **transaction history** with quantity, notional value, and timestamps
- See **portfolio** and current holdings in real time, including unrealized P/L

## User Guide

### Accessing the Application & Authentication

When the user first visits the application, they are directed to the `/signin` page.

- If the user does not have an account, they can click the **Sign Up** link.
- The signup form requires:
  - Email
  - Password
  - Username
- After successful registration (no duplicate email), the user is automatically redirected back to `/signin`.
- After signing in, the user is taken to the main dashboard and a left navigation panel becomes available.

### Navigation Sidebar

Once signed in, a navigation sidebar appears on the left, providing quick access to every major section:

- **Profile (Portfolio Overview)**
- **Stocks**
- **Crypto**
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

The Stocks page provides real-time and historical market data for traditional equities.

Features include:

- A **line chart** that plots historical prices for the available stocks:
  - Amazon (AMZN)
  - Apple (AAPL)
  - NVIDIA (NVDA)
- A dropdown menu on the **top-left** allows selecting which stock to display.
- A dropdown menu on the **top-right** allows changing the historical date range.
- A holdings panel on the right shows:
  - Current stock quantities owned
  - A button that navigates directly to the **Trade** page for buying/selling
  - A compact summary of unrealized profit/loss for each holding

### Viewing Crypto Data (`/crypto`)

The Crypto page mirrors the Stocks page but focuses on digital assets:

- Real-time and historical charts for:
  - Bitcoin (`BTC-USD`)
  - Ethereum (`ETH-USD`)
  - Dogecoin (`DOGE-USD`)
- Users can switch between assets and time ranges (1 day / 1 month / 3 months).
- The right-hand holdings panel shows current crypto positions and links to the **Trade** page.

### Trading Stocks, Bonds, and Crypto (`/trade`)

The Trade page provides three lists:

- **Stocks (left column)**: AMZN, AAPL, NVDA
- **Crypto (left column)**: BTC-USD, ETH-USD, DOGE-USD
- **Bonds (right column)**: bond ETFs such as TLT and XGB.TO

Interaction flow:

1. Select a stock, bond, or crypto asset to trade.
2. A trade details panel appears showing current market price and a quantity input.
3. Toggle between **Buy** and **Sell** mode.
4. Enter the number of units (supports fractional quantities, e.g., 0.25 BTC).
5. For buys, the total cost is automatically calculated.
6. Click **Confirm Buy** or **Confirm Sell** to complete the transaction.

Trades immediately update the user’s holdings, cash balance, and transaction history.

### Viewing Transaction History (`/transactions`)

The Transactions page provides a chronological list of all user activity, including:

- Deposits
- Stock purchases and sales
- Bond purchases and sales
- Crypto purchases and sales

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

### 3.  Use Docker for Local Development

If you prefer running the database and API inside containers:

```
docker compose up --build dev
```

This will:

- Start PostgreSQL inside Docker
- Build the **dev** (development-stage) image
- Run Prisma schema synchronization (`prisma db push`)
- Start Next.js dev server with hot reload

Access the application at:

```
[http://localhost:3000](http://localhost:3000)
```

Persistent Storage:
Docker Compose mounts a volume for PostgreSQL so data survives restarts.

### 4. (Optional) Manual Local Development

To deploy the project manually on your machine:

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
  - Buy/sell **bonds** via bond ETFs (e.g., TLT, XGB.TO) using live prices
  - Buy/sell **cryptocurrencies** (BTC-USD, ETH-USD, DOGE-USD) with fractional quantities
- **Portfolio Dashboard**: confirm holdings update in real time
- **Transaction History**: deposits, withdrawals, trades logged correctly

## Deployment Information

This project is deployed at:

```
http://174.138.112.104:8080/
```

The application is hosted on a **DigitalOcean Kubernetes** cluster, where the backend services, PostgreSQL database, and supporting components are containerized and orchestrated using K8s.

![DO-Kubernetes](./assets/DO-Kubernetes.png)

![loadBalancer](./assets/loadBalancer.png)

Please note that there is a possibility the cluster could be attacked. This happened previously when one of the nodes in my DigitalOcean Kubernetes deployment (running on shared-CPU instances) was compromised and used to generate outgoing malicious traffic. As a result, DigitalOcean automatically disabled the node for security reasons. If a similar incident occurs during grading, the cluster may be temporarily shut down by DigitalOcean, and I would need to log into the DigitalOcean Kubernetes control panel and manually recycle the nodes. This recovery process typically takes about 5–10 minutes.

![attack](./assets/attack.png)

## Individual Contributions

### Kangzhi Gao (Connor)

- Implemented the entire application logic, including the frontend interface, backend functionality, and database schema
- Created the multi-stage Dockerfile to separate development and production builds
- Set up Docker Compose for both local development and production image building
- Deployed the application to DigitalOcean Kubernetes
- Built the CI/CD pipeline using GitHub Actions to automate Docker image creation, pushing to Docker Hub, and updating the DigitalOcean Kubernetes deployment

### Zixi Qu (Jessy)

- Design and developed orchestration procedures. Implement k8s manifests. The design decision takes simplicity into consideration and make sure minimum effort migration to a new environment.
- Build the first version of local orchestration and cloud orchestration (on single droplet server). This is a critical step before migrate the exact same orchestration to a larger scale cluster (DO k8s clusters, which was managed by [Kangzhi Gao](#Kangzhi Gao)
- Involved in designing the overall architecture of the project, this includes: application features, deployment decision, and technologies decision, ensures the project can be delivered at a reasonable scale in the given time allowance.

### Jinyan Yi (Alex)

- **Feature Implementation**: Designed and implemented the new **Bonds and Crypto Trading** modules, including the dedicated `/bonds` and `/crypto` pages, and the unified `/trade` page. Extended the trading engine to support real-time bond ETF pricing, cryptocurrency trading (BTC, ETH, DOGE), fractional quantities, and profit/loss visualization in both the profile dashboard and holdings sidebar.
- **Quality Assurance & Testing**: Performed end-to-end testing of stock, bond, and crypto trades, including edge cases around insufficient funds and partial quantities. Verified transaction consistency, portfolio updates, and real-time price refresh behaviour in both local Docker and DigitalOcean Kubernetes environments.
- **Presentation & Demo**: Led the creation of project presentation materials, the final demo video, and major updates to this `README`.

## Lessons Learned

Through building and deploying this project, we gained practical experience across containerization, orchestration, backend workflows, and deployment pipelines.

- Containerization with Docker, especially using Docker Compose, allows multi-service applications to be set up and configured efficiently, improving performance, consistency, and maintainability.
- Using a multi-stage Dockerfile significantly reduces the production image size and makes the build process cleaner and more optimized.
- Deploying on DigitalOcean Kubernetes revealed that managed K8s provides a powerful and convenient IaaS experience, but the cost can be high for student or small-scale projects.
- Working with Prisma introduced challenges related to schema generation and database migrations during containerization and orchestration. Through this, we developed a deeper understanding of how Prisma workflows integrate with different environments and how to prepare future applications for similar setups.
- Kubernetes provided valuable insights into deploying real applications on a cluster, managing pods, handling restarts, and understanding containerized workloads at scale.
- Due to time limitations, not all planned application features were fully implemented. The project will continue to be improved in the future with additional functionality and refinements.
