# Скрипт запуска приложения Analog Discord

Write-Host "Запуск Analog Discord..." -ForegroundColor Green
Write-Host ""

# Проверка Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "Ошибка: Node.js не найден!" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js версия: $nodeVersion" -ForegroundColor Cyan

# Проверка npm
$npmVersion = npm --version 2>$null
if (-not $npmVersion) {
    Write-Host "Ошибка: npm не найден!" -ForegroundColor Red
    exit 1
}
Write-Host "npm версия: $npmVersion" -ForegroundColor Cyan
Write-Host ""

# Проверка .env файла
if (-not (Test-Path .env)) {
    Write-Host "Создание .env файла..." -ForegroundColor Yellow
    @"
PORT=5000
JWT_SECRET=analog-discord-secret-key-change-in-production
TELEMOST_API_URL=https://telemost.yandex.ru/api/v1
TELEMOST_API_KEY=
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host ".env файл создан" -ForegroundColor Green
}

Write-Host "Запуск сервера и клиента..." -ForegroundColor Green
Write-Host "Сервер будет доступен на: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Клиент будет доступен на: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Нажмите Ctrl+C для остановки" -ForegroundColor Yellow
Write-Host ""

# Запуск приложения
npm run dev

