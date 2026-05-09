# Test API performance
$endpoints = @(
    "http://localhost:3000/api/products?page=1&per_page=24",
    "http://localhost:3000/api/categories",
    "http://localhost:3000/api/products/product-1-test"
)

foreach ($url in $endpoints) {
    $start = Get-Date
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        $end = Get-Date
        $duration = ($end - $start).TotalMilliseconds
        Write-Host "$url`: ${duration}ms - Status: $($response.StatusCode)" -ForegroundColor $(if ($duration -lt 200) { "Green" } else { "Yellow" })
    } catch {
        Write-Host "$url`: ERROR - $_" -ForegroundColor Red
    }
}
