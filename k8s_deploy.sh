#!/bin/bash

# k8s_deploy.sh - Despliegue en Kubernetes (AKS) para ECONEURA-
# Fase F6: Producción y Escalado

set -e

# Configuración
RESOURCE_GROUP="ECONEURA-RG"
CLUSTER_NAME="ECONEURA-AKS"
LOCATION="northeurope"
NODE_COUNT=3
VM_SIZE="Standard_DS2_v2"
APP_NAME="ECONEURA-API"

echo "🚀 Configurando Kubernetes (AKS) para $APP_NAME..."

# Verificar login de Azure
if ! az account show > /dev/null 2>&1; then
    echo "❌ No estás logueado en Azure. Ejecuta: az login"
    exit 1
fi

# Crear cluster AKS si no existe
echo "☸️ Verificando cluster AKS..."
if ! az aks show --name "$CLUSTER_NAME" --resource-group "$RESOURCE_GROUP" > /dev/null 2>&1; then
    echo "Creando cluster AKS..."
    az aks create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$CLUSTER_NAME" \
        --node-count $NODE_COUNT \
        --node-vm-size "$VM_SIZE" \
        --location "$LOCATION" \
        --enable-managed-identity \
        --generate-ssh-keys \
        --network-plugin azure \
        --enable-cluster-autoscaler \
        --min-count 1 \
        --max-count 10
fi

# Obtener credenciales del cluster
echo "🔑 Obteniendo credenciales del cluster..."
az aks get-credentials \
    --resource-group "$RESOURCE_GROUP" \
    --name "$CLUSTER_NAME" \
    --overwrite-existing

# Verificar conexión
echo "🔍 Verificando conexión al cluster..."
kubectl get nodes

# Crear namespace
echo "📁 Creando namespace para la aplicación..."
kubectl create namespace econeura --dry-run=client -o yaml | kubectl apply -f -

# Crear deployment YAML
cat > k8s-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $APP_NAME
  namespace: econeura
spec:
  replicas: 3
  selector:
    matchLabels:
      app: $APP_NAME
  template:
    metadata:
      labels:
        app: $APP_NAME
    spec:
      containers:
      - name: api
        image: $APP_NAME:latest
        ports:
        - containerPort: 8080
        env:
        - name: PORT
          value: "8080"
        - name: HOST
          value: "0.0.0.0"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: $APP_NAME-service
  namespace: econeura
spec:
  selector:
    app: $APP_NAME
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: $APP_NAME-ingress
  namespace: econeura
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: api.econeura.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: $APP_NAME-service
            port:
              number: 80
EOF

# Aplicar configuración
echo "📦 Aplicando configuración de Kubernetes..."
kubectl apply -f k8s-deployment.yaml

# Esperar a que los pods estén listos
echo "⏳ Esperando a que los pods estén listos..."
kubectl wait --for=condition=available --timeout=300s deployment/$APP_NAME -n econeura

# Mostrar estado
echo "📊 Estado del despliegue:"
kubectl get pods -n econeura
kubectl get services -n econeura
kubectl get ingress -n econeura

echo "✅ Despliegue en Kubernetes completado!"
echo "🌐 URL externa: $(kubectl get svc $APP_NAME-service -n econeura -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"