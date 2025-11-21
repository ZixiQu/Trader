# ECE1779 Project

## Run App Locally

1. `npm install` & `npx prisma migrate dev --name <migration_name>` & `npx prisma generate` (redundant)
2. `npm run dev`

## Orchestration DevOps (New)

1. Start minikube

    ```sh
    minikube start --driver=docker
    minikube start --driver=docker --force  # If root
    eval $(minikube docker-env)
    ```

2. K8s start system

    ```sh
    cd /project_root/k8s
    ./start_all.sh
    ```

3. Delete system

    ```sh
    ./close_all.sh
    ```

## Orchestration DevOps (Old)

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

3. K8s start system

    ```sh
    cd /project_root/k8s
    ./start_all.sh
    ```

4. Expose external IP for accessing

    ```sh
    minikube service trader-service --url &
    ```

    The trader app is accessible in the browser

5. Delete system

    ```sh
    ./close_all.sh
    ```

## Minikube / k8s Scale Nodes

Get node lists

```sh
kubectl get nodes
# or
minikube node list
```

## Docker build

```sh
docker build --target dev -t zixiqu/trader:linux .  # failed
docker build \
  --target runner \
  --build-arg DATABASE_URL="postgresql://admin:ECE1779ProjectPGPassword@db:5432/appdb?schema=public" \
  -t zixiqu/trader:macos .  # succeed

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

```sh
k get pods
k get service
```
