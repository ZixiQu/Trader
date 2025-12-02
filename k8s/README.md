# ECE1779 Project

## Run App Locally

1. `npm install` & `npx prisma migrate dev --name <migration_name>` & `npx prisma generate` (redundant)
2. `npm run dev`



## On a New Linux Environment 

1. Install minikube

   ```sh
   curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
   
   ```

2. Install Kubectl

   ```sh
   # https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/
   
   # 1. download kubectl
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"  # x86-64
   
   # 2. install kubectl to /bin
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   
   # 3. clean up
   rm kubectl
   ```

   

## Orchestration DevOps (New)

1. Start minikube

    ```sh
    minikube start --driver=docker
    minikube start --driver=docker --force  # If root
    
    minikube start --driver=docker \
      --force \
      --mount \
      --mount-string="/mnt/volume_tor1_01:/data" # If have mount volume
      
      
    eval $(minikube docker-env)
    
    # To unset eval
    eval $(minikube docker-env -u)
    ```

2. K8s start system

    ```sh
    cd /project_root/k8s
    ./start_all.sh
    ```

3. Expose external IP for accessing

    ```sh
    minikube service trader-service --url &
    ```

    The trader app is accessible in the browser, **locally**.

4. Connect outside world to local App via `socat`

    ```sh
    socat TCP-LISTEN:80,fork,reuseaddr TCP:<IPV4>:<PORT> 
    ```

5. Delete system

    ```sh
    ./close_all.sh
    ```

5. Clean up

   ```sh
   # Nuke clean up
   minikube delete --all --purge
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







## Deprecated: Orchestration DevOps (Old)

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

## Deploying on DigitalOcean Kubernetes

### Save Kubeconfig  
After creating the Kubernetes cluster on DigitalOcean, save the kubeconfig locally:

```bash
doctl kubernetes cluster kubeconfig save <CLUSTER_ID>
```

### Apply YAML Manifests (In Order)

Apply each Kubernetes resource step-by-step:

```bash
kubectl apply -f secret.yaml        # Database secrets
kubectl apply -f postgres.yaml      # PostgreSQL (StatefulSet + PVC)
kubectl apply -f deployment.yaml    # Application Deployment
kubectl apply -f service.yaml       # Expose the app (LoadBalancer)
```

### Reset / Clean Up (If Something Goes Wrong)

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

### Check Pod Status

Verify everything is running:

```bash
kubectl get pods
```

### Get External IP

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
