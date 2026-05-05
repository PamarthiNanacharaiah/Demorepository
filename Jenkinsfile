pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    environment {
        SF_USERNAME     = credentials('SF_USERNAME')
        SF_CONSUMER_KEY = credentials('SF_CONSUMER_KEY')
        SF_CLI          = 'C:/Program Files/sf/bin/sf.cmd'
        GITHUB_REPO     = 'PamarthiNanacharaiah/Demorepository'

        // Ensure git works in pipeline
        PATH = "C:\\Users\\nancharaiah.pamarthi\\AppData\\Local\\Programs\\Git\\cmd;${env.PATH}"
    }

    stages {

        stage('PR Approval Check') {
            when { branch 'main' }

            steps {
                script {

                    echo "🔍 Running approval check on MAIN branch..."

                    // ✅ Get clean commit message
                    def commitMsg = bat(
                        script: """
                        @echo off
                        git log -1 --pretty=%%B
                        """,
                        returnStdout: true
                    ).trim()

                    commitMsg = commitMsg.readLines().join(' ').trim()

                    echo "Commit message: ${commitMsg}"

                    // ✅ Extract PR number (FIXED REGEX)
                    def prNumber = null
                    def matcher = commitMsg =~ /#(\d+)/
                    if (matcher.find()) {
                        prNumber = matcher.group(1)
                    }
                    matcher = null

                    if (!prNumber) {
                        error("❌ No PR number found — stopping deployment")
                    }

                    echo "Detected PR #${prNumber}"

                    def approved = false
                    def approvers = []

                    withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {

                        // ✅ PowerShell JSON parsing (NO Jenkins approval required)
                       def result = bat(
    script: """
    @echo off
    powershell -Command ^
    "\$headers = @{Authorization='token %GH_TOKEN%'}; ^
    \$response = Invoke-RestMethod -Uri 'https://api.github.com/repos/%GITHUB_REPO%/pulls/${prNumber}/reviews' -Headers \$headers; ^
    \$approvedUsers = \$response | Where-Object { \$_.state -eq 'APPROVED' } | Select-Object -ExpandProperty user | Select-Object -ExpandProperty login; ^
    \$approvedUsers -join ','"
    """,
    returnStdout: true
).trim()

                        if (result) {
                            approved = true
                            approvers = result.split(',')
                        }
                    }

                    if (!approved) {
                        error("❌ PR #${prNumber} NOT approved — deployment blocked")
                    }

                    echo "✅ PR #${prNumber} approved by: ${approvers.join(', ')}"
                }
            }
        }

        stage('Code Checkout') {
            when { branch 'main' }
            steps {
                checkout scm
            }
        }

        stage('Authorize Salesforce') {
            when { branch 'main' }
            steps {
                withCredentials([file(credentialsId: 'sfdc-jwt-key', variable: 'JWT_KEY_FILE')]) {
                    bat """
                    @echo off
                    "%SF_CLI%" org login jwt ^
                    --client-id %SF_CONSUMER_KEY% ^
                    --jwt-key-file "%JWT_KEY_FILE%" ^
                    --username %SF_USERNAME% ^
                    --instance-url https://login.salesforce.com ^
                    --alias projectdemosfdc
                    """
                }
            }
        }

        stage('Deploy to Salesforce') {
            when { branch 'main' }
            steps {
                bat """
                @echo off
                "%SF_CLI%" deploy metadata ^
                --target-org projectdemosfdc ^
                --wait 10
                """
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful (after PR approval & merge)"
        }
        failure {
            echo "❌ Deployment failed — check logs"
        }
        always {
            cleanWs()
        }
    }
}
