# Deployment Guide

This guide provides instructions for deploying the integrated MoonDev Trading AI system.

## Prerequisites

Before deploying the system, ensure you have the following:

- Docker and Docker Compose
- Redis (for distributed caching)
- PostgreSQL (for database)
- Sufficient server resources:
  - At least 4 CPU cores
  - At least 8GB RAM
  - At least 50GB disk space

## Deployment Options

There are several deployment options available:

1. **Docker Compose**: Recommended for development and testing.
2. **Kubernetes**: Recommended for production deployments.
3. **Manual Deployment**: For custom environments.

## Docker Compose Deployment

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-organization/sellyoursolv2.git
cd sellyoursolv2
```

### Step 2: Configure Environment Variables

Create a `.env` file with the following variables:

```
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=trading

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=your_secure_password

# API Configuration
API_PORT=8000
API_HOST=0.0.0.0
API_WORKERS=4

# Cache Configuration
CACHE_MEMORY_MAX_SIZE=10000
CACHE_DISK_MAX_SIZE=104857600
CACHE_DISK_ENABLED=true
CACHE_DISTRIBUTED_ENABLED=true

# Execution Engine Configuration
EXECUTION_MAX_CONCURRENT_TASKS=20
EXECUTION_TASK_TIMEOUT_MULTIPLIER=1.5
EXECUTION_MAX_RETRIES=3

# Monitoring Configuration
MONITORING_ENABLED=true
MONITORING_METRICS_INTERVAL=60
```

### Step 3: Create Docker Compose File

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "${API_PORT}:8000"
    environment:
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - REDIS_HOST=${REDIS_HOST}
      - REDIS_PORT=${REDIS_PORT}
      - REDIS_DB=${REDIS_DB}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - CACHE_MEMORY_MAX_SIZE=${CACHE_MEMORY_MAX_SIZE}
      - CACHE_DISK_MAX_SIZE=${CACHE_DISK_MAX_SIZE}
      - CACHE_DISK_ENABLED=${CACHE_DISK_ENABLED}
      - CACHE_DISTRIBUTED_ENABLED=${CACHE_DISTRIBUTED_ENABLED}
      - EXECUTION_MAX_CONCURRENT_TASKS=${EXECUTION_MAX_CONCURRENT_TASKS}
      - EXECUTION_TASK_TIMEOUT_MULTIPLIER=${EXECUTION_TASK_TIMEOUT_MULTIPLIER}
      - EXECUTION_MAX_RETRIES=${EXECUTION_MAX_RETRIES}
      - MONITORING_ENABLED=${MONITORING_ENABLED}
      - MONITORING_METRICS_INTERVAL=${MONITORING_METRICS_INTERVAL}
    volumes:
      - ./cache:/app/cache
      - ./logs:/app/logs
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Step 4: Create Dockerfile

Create a `Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create cache directory
RUN mkdir -p /app/cache

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "trading_agents.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 5: Build and Start the Services

```bash
docker-compose build
docker-compose up -d
```

### Step 6: Verify Deployment

1. Check if the services are running:
   ```bash
   docker-compose ps
   ```

2. Check the logs:
   ```bash
   docker-compose logs -f api
   ```

3. Access the API:
   ```
   http://localhost:8000/health
   ```

4. Access the dashboard:
   ```
   http://localhost:8000/dashboard
   ```

## Kubernetes Deployment

For production deployments, Kubernetes is recommended.

### Step 1: Create Kubernetes Manifests

Create the following Kubernetes manifest files:

1. `namespace.yaml`:
   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: trading-ai
   ```

2. `configmap.yaml`:
   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: trading-ai-config
     namespace: trading-ai
   data:
     CACHE_DISK_ENABLED: "true"
     CACHE_DISTRIBUTED_ENABLED: "true"
     MONITORING_ENABLED: "true"
     MONITORING_METRICS_INTERVAL: "60"
   ```

3. `secret.yaml`:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: trading-ai-secrets
     namespace: trading-ai
   type: Opaque
   data:
     DB_PASSWORD: <base64-encoded-password>
     REDIS_PASSWORD: <base64-encoded-password>
   ```

4. `deployment.yaml`:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: trading-ai
     namespace: trading-ai
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: trading-ai
     template:
       metadata:
         labels:
           app: trading-ai
       spec:
         containers:
         - name: trading-ai
           image: your-registry/trading-ai:latest
           ports:
           - containerPort: 8000
           envFrom:
           - configMapRef:
               name: trading-ai-config
           - secretRef:
               name: trading-ai-secrets
           env:
           - name: DB_HOST
             value: postgres
           - name: DB_PORT
             value: "5432"
           - name: DB_USER
             value: postgres
           - name: DB_NAME
             value: trading
           - name: REDIS_HOST
             value: redis
           - name: REDIS_PORT
             value: "6379"
           - name: REDIS_DB
             value: "0"
           resources:
             requests:
               cpu: "1"
               memory: "2Gi"
             limits:
               cpu: "2"
               memory: "4Gi"
           volumeMounts:
           - name: cache-volume
             mountPath: /app/cache
         volumes:
         - name: cache-volume
           emptyDir: {}
   ```

5. `service.yaml`:
   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: trading-ai
     namespace: trading-ai
   spec:
     selector:
       app: trading-ai
     ports:
     - port: 80
       targetPort: 8000
     type: ClusterIP
   ```

6. `ingress.yaml`:
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: trading-ai
     namespace: trading-ai
     annotations:
       kubernetes.io/ingress.class: nginx
       cert-manager.io/cluster-issuer: letsencrypt-prod
   spec:
     tls:
     - hosts:
       - trading-ai.example.com
       secretName: trading-ai-tls
     rules:
     - host: trading-ai.example.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: trading-ai
               port:
                 number: 80
   ```

### Step 2: Apply the Manifests

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

### Step 3: Verify Deployment

```bash
kubectl get pods -n trading-ai
kubectl get services -n trading-ai
kubectl get ingress -n trading-ai
```

## Manual Deployment

For custom environments, you can deploy the system manually.

### Step 1: Install Dependencies

```bash
# Install system dependencies
apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    python3 \
    python3-pip \
    python3-venv

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 2: Configure the System

Create a `.env` file with the configuration variables as shown in the Docker Compose section.

### Step 3: Start the API Server

```bash
uvicorn trading_agents.api.app:app --host 0.0.0.0 --port 8000 --workers 4
```

## Monitoring and Maintenance

### Monitoring

1. **Dashboard**: Access the dashboard at `/dashboard` for real-time monitoring.
2. **Logs**: Check the logs for errors and warnings.
3. **Metrics**: Use Prometheus and Grafana for advanced monitoring.

### Maintenance

1. **Backups**: Regularly backup the database and cache.
2. **Updates**: Keep the system updated with the latest security patches.
3. **Scaling**: Monitor resource usage and scale as needed.

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Check database credentials
   - Verify network connectivity
   - Check database logs

2. **Redis Connection Issues**:
   - Check Redis credentials
   - Verify network connectivity
   - Check Redis logs

3. **API Server Issues**:
   - Check API logs
   - Verify environment variables
   - Check resource usage

### Getting Help

If you encounter issues, please:

1. Check the logs for error messages
2. Consult the documentation
3. Contact support at support@example.com
