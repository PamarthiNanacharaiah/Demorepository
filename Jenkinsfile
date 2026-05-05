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

        // ✅ FIX: Ensure git works in pipeline (VERY IMPORTANT)
        PATH = "C:\\Users\\nancharaiah.pamarthi\\AppData\\Local\\Programs\\Git\\cmd;${env.PATH}"
    }

    stages {

        // 🔥 ONLY RUN ON MAIN AFTER MERGE
        stage('PR Approval Check') {
            when { branch 'main' }

            steps {
                script {

                    echo "🔍 Running approval check on MAIN branch..."

                    // ✅ Get latest commit message (merge commit)
                    def commitMsg = bat(
                        script: 'git log -1 --pretty=%%B',
                        returnStdout: true
                    ).trim()

                    echo "Commit message: ${commitMsg}"

                    // ✅ Extract PR number safely
                    def prNumber = null
                    def matcher = commitMsg =~ /#(\\d+)/
                    if (matcher.find()) {
                        prNumber = matcher.group(1)
                    }
                    matcher = null   // avoid serialization issue

                    if (!prNumber) {
                        error("❌ No PR number found — stopping deployment")
                    }

                    echo "Detected PR #${prNumber}"

                    def approved = false
                    def approvers = [] as Set

                    withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {

                        // ✅ FIX: Avoid Windows token issues using headers file
                        bat """
                        @echo off
                        echo -H "Authorization: token %GH_TOKEN%" > "%TEMP%\\headers.txt"
                        echo -H "Accept: application/vnd.github.v3+json" >> "%TEMP%\\headers.txt"
                        """

                        def response = bat(
                            script: """
                            @curl -s --config "%TEMP%\\headers.txt" ^
                            https://api.github.com/repos/%GITHUB_REPO%/pulls/${prNumber}/reviews
                            """,
                            returnStdout: true
                        ).trim()

                        def slurper = new groovy.json.JsonSlurperClassic()
                        def reviews = slurper.parseText(response)

                        echo "Total reviews: ${reviews.size()}"

                        for (def review in reviews) {
                            echo "${review.user.login} -> ${review.state}"

                            if (review.state == 'APPROVED') {
                                approved = true
                                approvers.add(review.user.login)
                            }
                        }

                        slurper = null  // avoid serialization issue
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
