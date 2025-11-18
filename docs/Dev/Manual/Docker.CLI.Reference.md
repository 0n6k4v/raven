# CLI Reference

## docker

**Description**

The base command for the Docker CLI.

### docker compose

**Description**

Define and run multi-container applications with Docker

**Command**
```bash
docker compose
```

**Options**
```bash
# Remove all unused images not just dangling ones
rm
```

#### docker compose build

**Description**

- Services are built once and then tagged.

**command**

```bash
docker compose build
```

**Options**

```bash
# เลือก Tag ของ Service ที่ต้องการ
[tagged services]

# Do not use cache when building the image
--no-cache
```

#### docker compose rm

**Description**

- Removes stopped service containers.

**command**

```bash
docker compose rm
```

**Options**

```bash
# เลือก Tag ของ Service ที่ต้องการ
[tagged services]

# Don't ask to confirm removal
-f, --force
```

#### docker compose stop

**Description**

- Stops running containers without removing them.
- They can be started again with ```docker compose start```.

**command**

```bash
docker compose stop
```

**Options**

```bash
# เลือก Tag ของ Service ที่ต้องการ
[tagged services]
```

#### docker compose up

**Description**

- Builds, (re)creates, starts, and attaches to containers for a service.

**command**

```bash
docker compose up
```

**Options**

```bash
# Detached mode: Run containers in the background
-d, --detach
```

### **docker system**

**Description**

Manage Docker.

#### Subcommands

##### docker system prune

**Description**

Remove all unused containers, networks, images (both dangling and unused), and optionally, volumes.

**Command**
```bash
docker system prune
```

**Options**
```bash
# Remove all unused images not just dangling ones
-a, --all

# API 1.28+ Provide filter values (e.g. label=<key>=<value>)
--filter

# Do not prompt for confirmation
-f, --force

# Prune anonymous volumes
--volumes
```