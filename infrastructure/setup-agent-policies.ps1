# Setup resource-based policies for Bedrock Agent collaboration
# This script grants the supervisor agent permission to invoke collaborator agents

$ErrorActionPreference = "Stop"

# Configuration
$region = "us-east-1"
$accountId = (aws sts get-caller-identity --query Account --output text)
$supervisorAgentArn = "arn:aws:bedrock:${region}:${accountId}:agent/AXVEOQ9BRY"

# Agent alias configurations
$collaborators = @(
    @{
        Name = "Security Consultant"
        AgentId = "UEW7F0MBMX"
        AliasId = "CLNOB6A07X"
    },
    @{
        Name = "Reliability Engineer"
        AgentId = "GWXGR2W65B"
        AliasId = "TPAQDB26PK"
    },
    @{
        Name = "Performance Architect"
        AgentId = "1TYUNCE1CP"
        AliasId = "V1X0K2M9Z6"
    },
    @{
        Name = "Cost Optimizer"
        AgentId = "GTFYE0DBVB"
        AliasId = "NI3VAIZ05Q"
    },
    @{
        Name = "Operations Specialist"
        AgentId = "9FTFB7I8KQ"
        AliasId = "BESMXBDUGI"
    }
)

Write-Host "Setting up agent collaboration policies..." -ForegroundColor Cyan
Write-Host "Account ID: $accountId" -ForegroundColor Gray
Write-Host "Supervisor ARN: $supervisorAgentArn" -ForegroundColor Gray
Write-Host ""

foreach ($collab in $collaborators) {
    Write-Host "Configuring $($collab.Name)..." -ForegroundColor Yellow
    
    $aliasArn = "arn:aws:bedrock:${region}:${accountId}:agent-alias/$($collab.AgentId)/$($collab.AliasId)"
    
    # Create resource policy JSON
    $policy = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Sid = "AllowSupervisorInvoke"
                Effect = "Allow"
                Principal = @{
                    Service = "bedrock.amazonaws.com"
                }
                Action = "bedrock:InvokeAgent"
                Resource = $aliasArn
                Condition = @{
                    StringEquals = @{
                        "aws:SourceAccount" = $accountId
                    }
                    ArnEquals = @{
                        "aws:SourceArn" = $supervisorAgentArn
                    }
                }
            }
        )
    } | ConvertTo-Json -Depth 10 -Compress
    
    # Escape quotes for JSON
    $policy = $policy.Replace('"', '\"')
    
    # Use AWS CLI to set the policy
    try {
        $output = aws bedrock-agent put-resource-policy `
            --resource-arn $aliasArn `
            --policy $policy `
            --region $region 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Policy set successfully" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed: $output" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Done!" -ForegroundColor Cyan
