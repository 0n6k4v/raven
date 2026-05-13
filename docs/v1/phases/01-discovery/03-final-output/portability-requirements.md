# Portability Requirements: Self-hosted + Cloud Portability

## Overview

เอกสารนี้กำหนดความต้องการด้าน Portability สำหรับระบบ Raven เพื่อให้สามารถ:
1. **Self-hosted** ภายในองค์กร (On-premises)
2. **Portable** ไปยัง Enterprise Grade Cloud (Azure, AWS, GCP)

---

## 1. Architecture Principles

### 1.1 12-Factor App Compliance

| Factor | Requirement | Implementation |
|--------|-------------|----------------|
| I. Codebase | ใช้ Git สำหรับทุก Environment | Single repo, multiple deployments |
| II. Dependencies | ประกาศ dependencies ชัดเจน | requirements.txt, package.json |
| III. Config | เก็บ config ใน Environment Variables | ไม่ hardcode |
| IV. Backing Services | ถือว่าเป็น Attached Resources | Database, Cache เป็น resources |
| V. Build/Release/Run | แยก Build จาก Run | Docker Image Build vs Run |
| VI. Processes | Stateless | ไม่เก็บ state ใน process |
| VII. Port Binding | Export services via port binding | Container port mapping |
| VIII. Concurrency | Scale via process model | Horizontal scaling |
| IX. Disposability | Fast startup & graceful shutdown | Docker container lifecycle |
| X. Dev/Prod Parity | Keep environments similar | Docker Compose for dev |
| XI. Logs | Treat logs as event streams | stdout/stderr in containers |
| XII. Admin Processes | Run admin tasks as one-off processes | Kubernetes Jobs |

### 1.2 Cloud-Native Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| Containerization | ทุก Service อยู่ใน Container | Docker + Docker Compose |
| Orchestration Ready | พร้อมสำหรับ Kubernetes | Docker labels, health checks |
| Portability | ไม่ผูกกับ Cloud Provider | Cloud-agnostic storage, databases |
| Scalability | รองรับ Horizontal Scaling | Stateless design |

---

## 2. Self-Hosted Requirements

### 2.1 Infrastructure Requirements

| Requirement | Specification | Priority |
|-------------|---------------|----------|
| OS Support | Ubuntu 20.04+, CentOS 8+ | Must |
| Docker | Docker 20.10+ | Must |
| Docker Compose | v2.0+ | Must |
| Hardware (Min) | 8 CPU, 16GB RAM, 500GB SSD | Must |
| Hardware (Recommended) | 16 CPU, 32GB RAM, 1TB SSD | Should |

### 2.2 Network Requirements

| Requirement | Description | Priority |
|-------------|---------------|----------|
| Internal Network | รองรับ Air-gapped network | Must |
| Static IP | รองรับ Static IP configuration | Must |
| DNS Configuration | รองรับ Internal DNS | Should |
| SSL/TLS | รองรับ Self-signed certificates | Must |
| Reverse Proxy | รองรับ Internal proxy | Should |

### 2.3 Data Storage (On-Premises)

| Component | Self-hosted Option | Priority |
|-----------|-------------------|----------|
| Database | PostgreSQL (VM/Container) | Must |
| Cache | Redis (Container) | Should |
| File Storage | Local/NFS | Must |
| Backup | rsync/Backup to NAS | Should |

---

## 3. Cloud Portability Requirements

### 3.1 Azure Compatibility

| Component | Azure Service | Portability Strategy |
|-----------|---------------|---------------------|
| Database | Azure Database for PostgreSQL | Use standard PostgreSQL |
| Cache | Azure Cache for Redis | Use Redis protocol |
| Storage | Azure Blob Storage | Use S3-compatible API |
| Container | Azure Container Instances / AKS | Use standard Docker |
| API Gateway | Azure API Management | Use standard REST APIs |
| Auth | Azure AD (optional) | Support both internal + Azure AD |

### 3.2 AWS Compatibility

| Component | AWS Service | Portability Strategy |
|-----------|-------------|---------------------|
| Database | Amazon RDS PostgreSQL | Use standard PostgreSQL |
| Cache | Amazon ElastiCache | Use Redis protocol |
| Storage | Amazon S3 | Use S3-compatible API |
| Container | ECS/EKS | Use standard Docker |
| API Gateway | Amazon API Gateway | Use standard REST APIs |

### 3.3 GCP Compatibility

| Component | GCP Service | Portability Strategy |
|-----------|-------------|---------------------|
| Database | Cloud SQL PostgreSQL | Use standard PostgreSQL |
| Cache | Cloud Memorystore | Use Redis protocol |
| Storage | Cloud Storage | Use S3-compatible API |
| Container | Cloud Run/GKE | Use standard Docker |
| API Gateway | Cloud Endpoints | Use standard REST APIs |

---

## 4. Configuration Management

### 4.1 Environment Variables

| Variable Group | Variables | Example |
|----------------|-----------|---------|
| Database | DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD | postgres://localhost:5432/raven |
| Redis | REDIS_HOST, REDIS_PORT, REDIS_PASSWORD | redis://localhost:6379 |
| App | APP_ENV, APP_DEBUG, APP_SECRET_KEY | production, false, ********** |
| JWT | JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES | HS256, 30 |
| Storage | STORAGE_TYPE, STORAGE_PATH, STORAGE_BACKEND | local, /data, - |
| Auth | AUTH_PROVIDER (internal/azure/ad) | internal |

### 4.2 Configuration Files

```yaml
# config.yaml - Environment-agnostic config
database:
  host: ${DB_HOST}
  port: ${DB_PORT}
  name: ${DB_NAME}
  user: ${DB_USER}
  password: ${DB_PASSWORD}
  # Cloud-agnostic: use standard PostgreSQL

redis:
  host: ${REDIS_HOST}
  port: ${REDIS_PORT}
  
storage:
  type: ${STORAGE_TYPE}  # local, s3, azure-blob
  backend: ${STORAGE_BACKEND}  # cloud-agnostic

auth:
  provider: ${AUTH_PROVIDER}  # internal, azure-ad, ldap
```

---

## 5. Data Portability

### 5.1 Database Export/Import

| Format | Tool | Use Case |
|--------|------|----------|
| SQL Dump | pg_dump/pg_restore | Full migration |
| CSV | COPY command | Data export |
| JSON | pg_export | API integration |

### 5.2 File Storage Migration

| Method | Description | Tool |
|--------|-------------|------|
| rsync | Local to Local | rsync -avz |
| S3 CLI | Local to S3 | aws s3 sync |
| AzCopy | Local to Azure | azcopy copy |
| gsutil | Local to GCS | gsutil rsync |

### 5.3 Backup Strategy

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full Backup | Weekly | 4 weeks |
| Incremental | Daily | 7 days |
| Transaction Log | Hourly | 24 hours |

---

## 6. Deployment Portability

### 6.1 Docker Compose (Development)

```yaml
# docker-compose.yml - Works on any OS with Docker
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    
  redis:
    image: redis:7-alpine
    
  auth-service:
    build: ./auth-service
    ports:
      - "8001:8000"
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
```

### 6.2 Kubernetes (Production Cloud)

```yaml
# kubernetes/ - Cloud-agnostic manifests
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
  ports:
    - port: 80
      targetPort: 8000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
```

### 6.3 Migration Paths

| From | To | Method |
|------|-----|-------|
| On-prem (Docker) | Azure AKS | az aks create, kubectl apply |
| On-prem (Docker) | AWS EKS | eksctl create cluster, kubectl apply |
| On-prem (Docker) | GCP GKE | gcloud container clusters create |
| Azure AKS | AWS EKS | kubectl export, kubectl apply |
| Any K8s | Any K8s | Manifest files are portable |

---

## 7. Authentication Portability

### 7.1 Auth Provider Options

| Provider | On-Prem | Azure AD | AWS Cognito | GCP Firebase |
|----------|---------|----------|-------------|--------------|
| Internal | ✅ | - | - | - |
| LDAP/AD | ✅ | - | - | - |
| OAuth 2.0 | ✅ | ✅ | ✅ | ✅ |
| OIDC | ✅ | ✅ | ✅ | ✅ |

### 7.2 Implementation Strategy

```python
# Auth Provider Abstraction
class AuthProvider(ABC):
    @abstractmethod
    def authenticate(self, credentials: Credentials) -> AuthResult:
        pass
    
class InternalAuthProvider(AuthProvider):
    """On-premises authentication"""
    
class AzureADProvider(AuthProvider):
    """Azure Active Directory"""
    
class LDAPProvider(AuthProvider):
    """LDAP/Active Directory"""
```

---

## 8. Security Requirements

### 8.1 Network Security

| Requirement | On-Prem | Cloud |
|-------------|---------|-------|
| TLS/SSL | Self-signed / Internal CA | Let's Encrypt / Cloud CA |
| Firewall | Hardware/Software Firewall | Security Groups / NSG |
| VPN | Site-to-Site VPN | Azure VPN Gateway |
| DDoS Protection | Hardware | Cloud-native |

### 8.2 Compliance

| Standard | On-Prem | Cloud |
|----------|---------|-------|
| PDPA | ✅ | ✅ (Azure PDPA compliance) |
| ISO 27001 | ✅ | ✅ (Azure ISO certified) |
| NIST | ✅ | ✅ |

---

## 9. Monitoring & Logging

### 9.1 Metrics

| Metric | On-Prem | Cloud |
|--------|---------|-------|
| CPU/Memory | Prometheus + Grafana | Cloud Monitor |
| Application | Prometheus | Cloud Monitor |
| Database | pg_stat_statements | Cloud DB Monitoring |

### 9.2 Logging

| Type | On-Prem | Cloud |
|------|---------|-------|
| Application Logs | ELK Stack | Cloud Logging |
| Audit Logs | Local storage | Cloud storage |
| Access Logs | Nginx/Apache | Cloud CDN logs |

---

## 10. Testing Requirements

### 10.1 Portability Testing

| Test | Description | Frequency |
|------|-------------|-----------|
| Docker Compose Test | ทดสอบรันด้วย docker-compose | Every release |
| Kubernetes Manifest Test | ทดสอบ apply บน minikube | Weekly |
| Azure Deployment Test | ทดสอบ deploy บน Azure | Monthly |
| Backup/Restore Test | ทดสอบ backup จาก A ย้ายไป B | Monthly |

---

## 11. Documentation Requirements

### 11.1 Required Documentation

| Document | Description |
|----------|-------------|
| README.md | Quick start สำหรับทุก Platform |
| DEPLOY_ON_PREM.md | คู่มือติดตั้ง On-premises |
| DEPLOY_AZURE.md | คู่มือติดตั้งบน Azure |
| DEPLOY_AWS.md | คู่มือติดตั้งบน AWS |
| MIGRATION_GUIDE.md | คู่มือย้ายระหว่าง Platform |
| BACKUP_RECOVERY.md | คู่มือ Backup และ Recovery |

---

## 12. Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Self-hosted Deployment | < 2 ชั่วโมง | Installation time |
| Cloud Deployment | < 1 ชั่วโมง | Deployment time |
| Migration Time | < 4 ชั่วโมง | Data transfer time |
| Portability Score | 100% | 12-Factor compliance |

---

## References

- [12-Factor App](https://12factor.net/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure Kubernetes Service](https://docs.microsoft.com/azure/aks/)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [GCP GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)