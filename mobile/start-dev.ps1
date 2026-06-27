$wifiIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -like '*Wi-Fi*' -or $_.InterfaceAlias -like '*WLAN*' -or $_.InterfaceAlias -like '*Ethernet*'
} | Where-Object {
    $_.PrefixOrigin -ne 'WellKnown' -and $_.IPAddress -notlike '172.*' -and $_.IPAddress -notlike '10.*'
} | Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $wifiIp) {
    $wifiIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.InterfaceAlias -notlike '*Loopback*' -and $_.PrefixOrigin -ne 'WellKnown' -and $_.IPAddress -notlike '172.*' -and $_.IPAddress -notlike '10.*'
    } | Select-Object -First 1 -ExpandProperty IPAddress)
}

if (-not $wifiIp) {
    Write-Host "ERREUR: Impossible de détecter l'IP du WiFi. Vérifie ta connexion réseau."
    exit 1
}

"EXPO_PUBLIC_API_HOST=$wifiIp" | Set-Content -Path "$PSScriptRoot\.env"
"EXPO_PUBLIC_API_PORT=8000" | Add-Content -Path "$PSScriptRoot\.env"

Write-Host "==================================="
Write-Host "  Helios-X - Mobile Dev Server"
Write-Host "==================================="
Write-Host "  IP détectée : $wifiIp"
Write-Host "  Port API    : 8000"
Write-Host "  .env mis à jour"
Write-Host "==================================="
Write-Host ""

npx expo start
