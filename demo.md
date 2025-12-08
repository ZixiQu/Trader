# Docker

```
docker compose up --build api
docker image ls | grep trader
docker tag ece1779project-api:latest yijinyan615/trader_macos:latest

```

# PSQL w Persistent Storage

```
kubectl get pods
kubectl delete pod postgres-0
kubectl get pods 

# notice AGE of postgres-0

Log out and log in again
testuser@gmail.com
123123

Everything stay the same
```

# Verify Persistent Volume

```
kubectl get pvc
# Notice postgres-0

```
