param(
    [string]$Command = "help"
)

switch ($Command) {
    "up" {
        docker compose up -d
    }
    "down" {
        docker compose down
    }
    "logs" {
        docker compose logs -f
    }
    "restart" {
        docker compose restart
    }
    "clean" {
        docker compose down -v
    }
    "install" {
        Push-Location backend
        npm install
        Pop-Location
    }
    "test" {
        Push-Location backend
        npm test
        Pop-Location
    }
    "k8s-deploy" {
        helm upgrade --install consistium ./helm/consistium -f helm/environments/prod.yaml -n consistium-prod --create-namespace
    }
    "k8s-delete" {
        helm uninstall consistium -n consistium-prod
        kubectl delete namespace consistium-prod --ignore-not-found
    }
    "help" {
        Write-Host "Usage: .\manage.ps1 [command]" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor Yellow
        Write-Host "  up            Start the entire stack using Docker Compose"
        Write-Host "  down          Stop and remove the Docker Compose stack"
        Write-Host "  logs          Follow the logs of the Docker Compose stack"
        Write-Host "  restart       Restart the Docker Compose stack"
        Write-Host "  clean         Stop the stack and remove persistent volumes (WARNING: Deletes database data)"
        Write-Host "  install       Install backend npm dependencies"
        Write-Host "  test          Run backend unit tests"
        Write-Host "  k8s-deploy    Deploy to Kubernetes using Helm"
        Write-Host "  k8s-delete    Uninstall the Kubernetes Helm release"
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host "Run '.\manage.ps1 help' to see available commands."
    }
}
