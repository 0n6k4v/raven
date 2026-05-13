# Raven - Database Specification

> **Version:** 1.0  
> **Generated:** 2026-02-28  
> **Based on:** Codebase Analysis

---

## 1. Database Overview

| Attribute | Value |
|-----------|-------|
| **Database** | PostgreSQL 15+ |
| **Extensions** | pgvector, PostGIS, pg_trgm |
| **Port** | 5432 |
| **ORM** | SQLAlchemy |

---

## 2. Core Tables

### 2.1 users

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(20),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    profile_image_url VARCHAR(255),
    profile_image_public_id VARCHAR(255),
    role_id INTEGER NOT NULL REFERENCES roles(id)
);

CREATE INDEX ix_users_user_id ON users(user_id);
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_role_id ON users(role_id);
```

### 2.2 roles

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);
```

### 2.3 exhibits

```sql
CREATE TABLE exhibits (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100),
    subcategory VARCHAR(100)
);
```

### 2.4 history

```sql
CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    exhibit_id INTEGER REFERENCES exhibits(id),
    subdistrict_id INTEGER REFERENCES subdistricts(id),
    discovery_date DATE,
    discovery_time TIME,
    discovered_by VARCHAR(20) REFERENCES users(user_id),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    modified_at TIMESTAMP DEFAULT NOW(),
    modified_by VARCHAR(20) REFERENCES users(user_id),
    quantity DECIMAL(10,2),
    location GEOMETRY(POINT, 4326) NOT NULL,
    ai_confidence DECIMAL(5,2)
);
```

---

## 3. Firearms Tables

### 3.1 firearms

```sql
CREATE TABLE firearms (
    id SERIAL PRIMARY KEY,
    exhibit_id INTEGER REFERENCES exhibits(id) ON DELETE CASCADE,
    mechanism VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    series VARCHAR(100),
    model VARCHAR(100),
    normalized_name VARCHAR(255)
);
```

### 3.2 ammunitions

```sql
CREATE TABLE ammunitions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100),
    caliber VARCHAR(50),
    manufacturer VARCHAR(100)
);
```

### 3.3 firearm_ammunitions

```sql
CREATE TABLE firearm_ammunitions (
    firearm_id INTEGER REFERENCES firearms(id) ON DELETE CASCADE,
    ammunition_id INTEGER REFERENCES ammunitions(id) ON DELETE CASCADE,
    PRIMARY KEY (firearm_id, ammunition_id)
);
```

### 3.4 firearm_example_images

```sql
CREATE TABLE firearm_example_images (
    id SERIAL PRIMARY KEY,
    firearm_id INTEGER REFERENCES firearms(id) ON DELETE CASCADE,
    image_url TEXT,
    description TEXT
);
```

---

## 4. Narcotics Tables

### 4.1 narcotics

```sql
CREATE TABLE narcotics (
    id SERIAL PRIMARY KEY,
    exhibit_id INTEGER REFERENCES exhibits(id),
    form_id INTEGER REFERENCES drug_forms(id),
    characteristics VARCHAR(100),
    drug_type VARCHAR(100),
    drug_category VARCHAR(100),
    consumption_method VARCHAR(100),
    effect TEXT,
    weight_grams NUMERIC(10,2)
);
```

### 4.2 drug_forms

```sql
CREATE TABLE drug_forms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);
```

### 4.3 chemical_compounds

```sql
CREATE TABLE chemical_compounds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);
```

### 4.4 narcotics_chemical_compounds

```sql
CREATE TABLE narcotics_chemical_compounds (
    narcotic_id INTEGER REFERENCES narcotics(id) ON DELETE CASCADE,
    chemical_compound_id INTEGER REFERENCES chemical_compounds(id) ON DELETE CASCADE,
    percentage NUMERIC(5,2),
    PRIMARY KEY (narcotic_id, chemical_compound_id)
);
```

### 4.5 narcotic_example_images

```sql
CREATE TABLE narcotic_example_images (
    id SERIAL PRIMARY KEY,
    narcotic_id INTEGER REFERENCES narcotics(id) ON DELETE CASCADE,
    image_url TEXT,
    description TEXT,
    priority INTEGER,
    image_type VARCHAR(50)
);
```

### 4.6 narcotics_image_vectors

```sql
CREATE TABLE narcotics_image_vectors (
    id SERIAL PRIMARY KEY,
    narcotic_id INTEGER REFERENCES narcotics(id) ON DELETE CASCADE,
    image_id INTEGER REFERENCES narcotic_example_images(id) ON DELETE CASCADE,
    image_vector VECTOR(16000)
);
```

### 4.7 narcotics_pills

```sql
CREATE TABLE narcotics_pills (
    narcotic_id INTEGER PRIMARY KEY REFERENCES narcotics(id) ON DELETE CASCADE,
    color VARCHAR(50),
    diameter_mm NUMERIC(5,2),
    thickness_mm NUMERIC(5,2),
    edge_shape VARCHAR(50)
);
```

---

## 5. Geolocation Tables

### 5.1 provinces

```sql
CREATE TABLE provinces (
    id SERIAL PRIMARY KEY,
    code VARCHAR(2) UNIQUE NOT NULL,
    name_th VARCHAR(150),
    name_en VARCHAR(150)
);
```

### 5.2 districts

```sql
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(4) UNIQUE NOT NULL,
    province_code VARCHAR(2) REFERENCES provinces(code),
    name_th VARCHAR(150),
    name_en VARCHAR(150)
);
```

### 5.3 subdistricts

```sql
CREATE TABLE subdistricts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(6) UNIQUE NOT NULL,
    district_code VARCHAR(4) REFERENCES districts(code),
    name_th VARCHAR(150),
    name_en VARCHAR(150),
    postal_code VARCHAR(5)
);
```

---

## 6. Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| users | ix_users_email | Login lookup |
| users | ix_users_user_id | User ID lookup |
| users | ix_users_role_id | Role filtering |
| history | ix_history_exhibit_id | Exhibit lookup |
| history | ix_history_discovered_by | Discoverer lookup |
| firearms | ix_firearms_exhibit_id | Exhibit lookup |
| firearms | ix_firearms_brand | Brand filtering |
| narcotics | ix_narcotics_exhibit_id | Exhibit lookup |
| narcotics | ix_narcotics_drug_type | Drug type filtering |

---

## 7. Relationships Diagram

```
users ──────► roles ──────► exhibits ──────┬──► firearms
    │                                        │
    │                                        └──► narcotics
    │                                             │
    ▼                                             ▼
history ◄──────────────────────────────────────┘
    │
    ▼
subdistricts ──► districts ──► provinces
```

---

## 8. Related Documents

- [API.md](./API.md)
- [TDD.md](./TDD.md)
- [raven-reverse-engineering.md](../01-human-decisions/architecture-decisions/raven-reverse-engineering.md)
