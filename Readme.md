# Microservices demo with RabbitMQ message broker.

## Tech stack:
- Typescript
- Node.js
- Express.js
- RabbitMQ
- Docker
- Docker-compose
- MySQL

## Instructions:

### How to run:
```bash
docker-compose up --build -d
```
### How to stop:
```bash
docker-compose down
```

### How to scale a service within docker-compose:
```bash
docker-compose up --scale service_name=3
```

## Scaling in docker-compose:
Limitations:
- you cannot define a service name in the docker-compose file
- you cannot define a port mapping for the scaled service
