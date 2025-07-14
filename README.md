nestjs-fintech-clean/
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── nest-cli.json
├── README.md
├── .env
├── examples/
│   └── 1-spaghetti-code.ts
├── scripts/
│   └── init-db.sql
└── src/
    ├── main.ts
    ├── app.module.ts
    └── modules/
        └── disbursement/
            ├── domain/
            │   └── entities/
            ├── application/
            │   ├── use-cases/
            │   ├── commands/
            │   └── queries/
            ├── infrastructure/
            │   ├── repositories/
            │   └── services/
            └── presentation/
                ├── controllers/
                └── dto/