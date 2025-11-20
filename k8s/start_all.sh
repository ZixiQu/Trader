kubectl apply -f secret.yaml       # DB secrets
kubectl apply -f postgres.yaml     # DB
kubectl apply -f deployment.yaml   # App
kubectl apply -f service.yaml      # Expose outbound ports