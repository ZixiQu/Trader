# ECE1779 Project



## Run App Locally

1. `npm install` & `npx prisma migrate dev --name <migration_name>` & `npx prisma generate` (redundant)
2. `npm run dev`



## Orchestration DevOps

1. Start minikube 

    ```sh
    minikube start --driver=docker
    minikube start --driver=docker --force  # If root
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

   



## Minikube / k8s Scale Nodes

Get node lists

```sh
kubectl get nodes
minikube node list
```



## Docker build

```sh
docker build --target dev -t zixiqu/trader:linux .  # failed
docker tag ece1779project-api-dev:latest zixiqu/trader-dev:linux
docker push zixiqu/trader-dev:linux
```



## Get service port

```sh
minikube service list
┌─────────────┬──────────────────────┬──────────────┬───────────────────────────┐
│  NAMESPACE  │         NAME         │ TARGET PORT  │            URL            │
├─────────────┼──────────────────────┼──────────────┼───────────────────────────┤
│ default     │ kubernetes           │ No node port │                           │
│ default     │ postgres             │ No node port │                           │
│ default     │ task-manager-service │ 8080         │ http://192.168.49.2:32198 │
│ kube-system │ kube-dns             │ No node port │                           │
└─────────────┴──────────────────────┴──────────────┴───────────────────────────┘
```





