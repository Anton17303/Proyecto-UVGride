# Correr Docker
docker-compose up --build
(Esperar a que se inicien todos los servicios)

# Importante
Cambiar IP en frontend/src/services/api.ts a la IP local

# Acceder a pgadmin
http://localhost:5050

correo: admin@admin.com
contraseña: admin

# Conexión con la base de datos
Host: database
Puerto: 5432
Usuario: postgres
Contraseña: password
Base de datos: uvgride

# Iniciar frontend
docker-compose logs -f frontend (con docker corriendo)
Escanear código QR

ó

docker exec -it uvgride-frontend sh
npx expo start --tunnel