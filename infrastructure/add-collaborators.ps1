# Add Bedrock Agent Collaborators via AWS CLI
# This script adds the remaining 4 specialist agents as collaborators to the supervisor

$ErrorActionPreference = "Stop"

$region = "us-east-1"
$supervisorAgentId = "AXVEOQ9BRY"
$agentVersion = "DRAFT"

# Collaborators to add
$collaborators = @(
    @{
        Name = "SecurityConsultant"
        AliasArn = "arn:aws:bedrock:us-east-1:065715357946:agent-alias/UEW7F0MBMX/CLNOB6A07X"
        Instruction = "Consult the Security Consultant for analysis of security risks, encryption, IAM policies, compliance, and network security aspects of the infrastructure change."
    },
    @{
        Name = "ReliabilityEngineer"
        AliasArn = "arn:aws:bedrock:us-east-1:065715357946:agent-alias/GWXGR2W65B/TPAQDB26PK"
        Instruction = "Consult the Reliability Engineer for analysis of availability, failover mechanisms, backup strategies, disaster recovery, and redundancy aspects of the infrastructure change."
    },
    @{
        Name = "PerformanceArchitect"
        AliasArn = "arn:aws:bedrock:us-east-1:065715357946:agent-alias/1TYUNCE1CP/V1X0K2M9Z6"
        Instruction = "Consult the Performance Architect for analysis of resource sizing, auto-scaling, performance bottlenecks, capacity planning, and latency aspects of the infrastructure change."
    },
    @{
        Name = "CostOptimizer"
        AliasArn = "arn:aws:bedrock:us-east-1:065715357946:agent-alias/GTFYE0DBVB/NI3VAIZ05Q"
        Instruction = "Consult the Cost Optimizer for analysis of pricing, over-provisioning, cost optimization opportunities, and budget implications of the infrastructure change."
    }
)

Write-Host "Adding collaborators to supervisor agent..." -ForegroundColor Cyan
Write-Host ""

foreach ($collab in $collaborators) {
    Write-Host "Adding $($collab.Name)..." -ForegroundColor Yellow
    
    try {
        $output = aws bedrock-agent associate-agent-collaborator `
            --agent-id $supervisorAgentId `
            --agent-version $agentVersion `
            --collaborator-name $collab.Name `
            --collaboration-instruction "$($collab.Instruction)" `
            --relay-conversation-history TO_COLLABORATOR `
            --agent-descriptor "aliasArn=$($collab.AliasArn)" `
            --region $region 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Added successfully" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed: $output" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Done! Listing all collaborators:" -ForegroundColor Cyan
aws bedrock-agent list-agent-collaborators `
    --agent-id $supervisorAgentId `
    --agent-version $agentVersion `
    --region $region
