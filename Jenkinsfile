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
    }

    stages {

        stage('PR Approval Check') {
            when {
                expression { return env.CHANGE_ID != null }
            }
            steps {
                script {

                    def prNumber = env.CHANGE_ID
                    echo "Checking approval for PR #${prNumber}"

                    def approved = false

                    withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {

                        // Call GitHub API
                        def response = bat(
                            script: """
                            @echo off
                            curl -s -H "Authorization: token %GH_TOKEN%" ^
                            -H "Accept: application/vnd.github.v3+json" ^
                            https://api.github.com/repos/%GITHUB_REPO%/pulls/${prNumber}/reviews
                            """,
                            returnStdout: true
                        ).trim()

                        echo "GitHub response received"

                        def slurper = new groovy.json.JsonSlurperClassic()
                        def reviews = slurper.parseText(response)

                        echo "Total reviews: ${reviews.size()}"

                        for (def review in reviews) {
                            echo "${review.user.login} -> ${review.state}"
                            if (review.state == 'APPROVED') {
                                approved = true
                            }
                        }
                    }

                    if (!approved) {
                        error("❌ PR #${prNumber} is NOT approved — stopping pipeline")
                    }

                    echo "✅ PR #${prNumber} approved — continuing"
                }
            }
        }

        stage('Code Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Authorize Salesforce') {
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
            echo "✅ Deployment successful"
        }
        failure {
            echo "❌ Deployment failed — check logs"
        }
        aborted {
            echo "⚠️ Pipeline aborted"
        }
        always {
            cleanWs()
        }
    }
}
