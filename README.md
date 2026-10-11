# Mine Explorer

RPG idle de minage. Monorepo : serveur Spring Boot et client Angular.

| Dossier | Contenu | Prérequis |
|---|---|---|
| `backend/` | Spring Boot 4.1.1, Java 21, Maven (wrapper inclus) | JDK 21 |
| `frontend/` | Angular 22 | Node 22.22.3+ ou 24.15+ |

## Lancer en local

```powershell
# Terminal 1
cd backend
.\mvnw spring-boot:run      # http://localhost:8080

# Terminal 2
cd frontend
npm install
npm start                    # http://localhost:4200
```

## Tests

```powershell
cd backend;  .\mvnw test
cd frontend; npm test
```
