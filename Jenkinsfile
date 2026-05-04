pipeline {
    agent any

    triggers {
        pollSCM('H/1 * * * *')
    }

    environment {
        SF_USERNAME     = credentials('sfdc_user')
        SF_CONSUMER_KEY = credentials('consumer_key')
        SF_CLI          = 'C:/Program Files/sf/bin/sf.cmd'
        GITHUB_REPO     = 'Dharsaikat13/SFDC--DemoProject'
    }

    stages {

        stage('Skip CI check') {
            steps {
                script {
                    def msg = bat(
                        script: '@git log -1 --pretty=%%B',
                        returnStdout: true
                    ).trim()
                    echo "Last commit message: ${msg}"
                    if (msg.contains('[skip ci]')) {
                        currentBuild.result = 'NOT_BUILT'
                        error('CI bot commit — skipping pipeline')
                    }
                }
            }
        }


stage('PR Approval Check') {
    steps {
        script {
            def commitMsg = bat(
                script: '@git log -1 --pretty=%%B',
                returnStdout: true
            ).trim()

            echo "Commit message: ${commitMsg}"

            // Extract PR number — discard Matcher immediately (not serializable)
            def prNumber = null
            def matcher = commitMsg =~ /Merge pull request #(\d+)/
            if (matcher.find()) {
                prNumber = matcher.group(1)
            }
            matcher = null  // must discard — Matcher is not serializable

            if (!prNumber) {
                echo "Not a PR merge commit — skipping approval check"
                return
            }

            echo "Detected PR #${prNumber} — checking GitHub approval..."

            def approved = false

            withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {

                // Write headers to temp file to avoid Windows token expansion issues
                bat """
                @echo off
                echo -H "Authorization: token %GH_TOKEN%" > "%TEMP%\\curl_headers.txt"
                echo -H "Accept: application/vnd.github.v3+json" >> "%TEMP%\\curl_headers.txt"
                """

                def response = bat(
                    script: """
                    @curl -s --config "%TEMP%\\curl_headers.txt" ^
                    https://api.github.com/repos/%GITHUB_REPO%/pulls/${prNumber}/reviews
                    """,
                    returnStdout: true
                ).trim()

                echo "GitHub API response received"

                // FIX: use JsonSlurper instead of readJSON — no plugin required
                def slurper = new groovy.json.JsonSlurper()
                def reviews = slurper.parseText(response)

                echo "Total reviews: ${reviews.size()}"

                for (def review : reviews) {
                    echo "  ${review.user.login} -> ${review.state}"
                    if (review.state == 'APPROVED') {
                        approved = true
                    }
                }

                // Must discard slurper — JsonSlurper is not serializable either
                slurper = null
            }

            if (!approved) {
                currentBuild.result = 'ABORTED'
                error("PR #${prNumber} is NOT approved — blocking deploy")
            }

            echo "PR #${prNumber} APPROVED — proceeding to deploy"
        }
    }
}


        

        stage('Code Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Authorization to Org') {
            steps {
                withCredentials([file(credentialsId: 'jwt_key', variable: 'JWT_KEY_FILE')]) {
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

        stage('Deploy to Org') {
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
            echo "Deployment successful to Salesforce"
        }
        failure {
            echo "Deployment failed — check console output"
        }
        aborted {
            echo "Pipeline aborted — PR #${env.GIT_COMMIT} was not approved"
        }
        always {
            cleanWs()
        }
    }
}
