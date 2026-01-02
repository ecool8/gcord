# Скрипт для локального запуска Analog Discord

Write-Host "=== Analog Discord - Локальный запуск ===" -ForegroundColor Cyan
Write-Host ""

# Проверка Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "Ошибка: Node.js не найден!" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# Проверка .env файла
if (-not (Test-Path .env)) {
    Write-Host "Создание .env файла..." -ForegroundColor Yellow
    @"
PORT=5000
NODE_ENV=development
HOST=0.0.0.0
DB_NAME=analog_discord
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=analog-discord-local-dev-secret-key-change-in-production
CLIENT_URL=http://localhost:3000
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host ".env файл создан" -ForegroundColor Green
    Write-Host ""
    Write-Host "ВАЖНО: Убедитесь, что PostgreSQL установлен и запущен!" -ForegroundColor Yellow
    Write-Host "Или создайте базу данных: CREATE DATABASE analog_discord;" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Запуск сервера и клиента..." -ForegroundColor Green
Write-Host "Сервер: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Клиент: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Нажмите Ctrl+C для остановки" -ForegroundColor Yellow
Write-Host ""

npm run dev

