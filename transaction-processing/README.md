# Transaction Processing Microservice

Needs .env file:
```
PORT = 3001
RABBITMQ_URL = amqp://localhost
QUEUE_NAME = acceptedTransactions
DATABASE_URL=mysql://user:password@mysql:3306/transactions_db
MESSAGE_PROCESSING_SPEED = 3000 # milliseconds
```

NOTE: This microservice needs transactions_db database to exist. The database is created automatically in docker-compose and also in mysql-deployment for kubernetes.