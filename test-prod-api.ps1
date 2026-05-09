# Test Production API Performance
$baseUrl = "https://white-label-ecommerce-iy5t5j9qw-ilkin-ibishovs-projects.vercel.app"

$endpoints = @(
    "/api/products?page=1&per_page=24",
    "/api/categories",
    "/api/health"
)

Write-Host "Testing Production API Performance`n" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl`n"

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$endpoint"
    $start = Get-Date
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
        $end = Get-Date
        $duration = ($end - $start).TotalMilliseconds
        $color = if ($duration -lt 200) { "Green" } elseif ($duration -lt 500) { "Yellow" } else { "Red" }
        Write-Host "$endpoint" -NoNewline
        Write-Host ": ${duration}ms " -NoNewline -ForegroundColor $color
        Write-Host "(Status: $($response.StatusCode))" -ForegroundColor Gray
        
        # Show first 100 chars of response
        $preview = $response.Content.Substring(0, [Math]::Min(100, $response.Content.Length))
        Write-Host "  Preview: $preview..." -ForegroundColor DarkGray
        Write-Host ""
    } catch {
        Write-Host "$endpoint`: ERROR - $_" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "Benchmark: < 200ms = Green, < 500ms = Yellow, > 500ms = Red" -ForegroundColor Cyan
