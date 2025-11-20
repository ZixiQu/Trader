# ECE1779 Project



## Run App Locally

1. `npm install` & `npx prisma migrate dev --name <migration_name>` & `npx prisma generate` (redundant)
2. `npm run dev`



## Orchestration DevOps

1. Start minikube

    ```sh
    minikube start --driver=docker
    eval $(minikube docker-env)
    ```

2. Acquire App image

    1. Build from source

       ```sh
       # Go to App folder
       docker build -t mini-server:latest .
       ```

    2. Pull from docker hub

       ```sh
       docker pull zixiqu/mini-server:latest
       ```

3. K8s Ops

   ```sh
   kubectl apply -f secret.yaml       # DB secrets
   kubectl apply -f postgres.yaml     # DB
   kubectl apply -f deployment.yaml   # App
   kubectl apply -f service.yaml      # Expose outbound ports
   ```

4. Delete services

   ```sh
   kubectl delete -f service.yaml   
   kubectl delete -f deployment.yaml
   kubectl delete -f postgres.yaml
   kubectl delete -f secret.yaml
   ```

   















