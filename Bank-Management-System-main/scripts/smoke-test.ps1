$ErrorActionPreference = "Stop"

$baseUrl = if ($env:HOO_BANK_URL) { $env:HOO_BANK_URL } else { "http://localhost:3000" }

$healthResponse = Invoke-WebRequest -Uri "$baseUrl/api/public/health" -UseBasicParsing
$health = $healthResponse.Content | ConvertFrom-Json
if ($health.status -ne "UP") {
  throw "Health check failed."
}
if ($healthResponse.Headers["X-Content-Type-Options"] -ne "nosniff") {
  throw "Security headers are missing."
}

$loginBody = @{
  email = if ($env:HOO_BANK_TEST_EMAIL) { $env:HOO_BANK_TEST_EMAIL } else { "kartik@example.com" }
  password = if ($env:HOO_BANK_TEST_PASSWORD) { $env:HOO_BANK_TEST_PASSWORD } else { "password123" }
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/auth/login" -ContentType "application/json" -Body $loginBody
$headers = @{ Authorization = "Bearer $($login.token)" }
$accounts = Invoke-RestMethod -Uri "$baseUrl/api/accounts" -Headers $headers
$cards = Invoke-RestMethod -Uri "$baseUrl/api/cards" -Headers $headers
$bills = Invoke-RestMethod -Uri "$baseUrl/api/bills" -Headers $headers
$transactions = Invoke-RestMethod -Uri "$baseUrl/api/transactions" -Headers $headers

if (-not $accounts -or $accounts.Count -lt 1) {
  throw "No accounts returned for the smoke-test user."
}

if ($accounts[0].balance -is [string]) {
  throw "Account balance must be numeric."
}
if ($cards.Count -lt 1 -or $bills.Count -lt 1 -or $null -eq $transactions) {
  throw "One or more dashboard data endpoints returned no response."
}

$invalidTransfer = @{
  senderAccountId = $accounts[0].id
  receiverAccountNumber = "   "
  amount = 10
  description = "validation"
} | ConvertTo-Json

try {
  Invoke-RestMethod -Method Post -Uri "$baseUrl/api/transactions/transfer" -Headers $headers -ContentType "application/json" -Body $invalidTransfer | Out-Null
  throw "Invalid transfer was accepted."
} catch {
  if (-not $_.Exception.Response -or $_.Exception.Response.StatusCode.value__ -ne 400) {
    throw
  }
}

Write-Output "Smoke test passed: security headers, health, login, accounts, cards, bills, transactions, numeric balances, and transfer validation."
