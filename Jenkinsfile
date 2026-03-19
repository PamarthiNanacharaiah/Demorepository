pipeline {
    agent any
 
    environment {
        SF_USERNAME     = credentials('SF_USERNAME')
        SF_CONSUMER_KEY = credentials('SF_CONSUMER_KEY')
        SF_CLI          = 'C:/Program Files/sf/bin/sf.cmd'
    }
 
    stages {
 
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/PamarthiNanacharaiah/Demorepository.git'
            }
        }
 
        stage('Authenticate Salesforce') {
            steps {
                withCredentials([file(credentialsId: 'sfdc-jwt-key', variable: 'JWT_KEY_FILE')]) {
                    bat """
                    "%SF_CLI%" org login jwt ^
                    --client-id %SF_CONSUMER_KEY% ^
                    --jwt-key-file "%JWT_KEY_FILE%" ^
                    --username %SF_USERNAME% ^
                    --instance-url https://login.salesforce.com ^
                    --alias devopscicddemo
                    """
                }
            }
        }
 
        stage('Validate Deployment') {
         steps {
          bat """
          "%SF_CLI%" deploy metadata ^
          --target-org devopscicddemo ^
          --dry-run ^
          --wait 10
          """
    }
}
 
        stage('Deploy to Org') {
            steps {
                bat """
                "%SF_CLI%" deploy metadata ^
                --target-org devopscicddemo ^
                --wait 10
                """
            }
        }
 
        stage('Post Deployment Check') {
        steps {
        bat """
        "%SF_CLI%" org display ^
        --target-org devopscicddemo
        """
    }
}
 
stage('Backup Metadata') {
    steps {
        bat """
        "%SF_CLI%" retrieve metadata ^
        --target-org devopscicddemo ^
        --manifest manifest/package.xml ^
        --wait 10
        """
    }
}
 
 
 
    }
 
    post {
        success {
            echo '✅ Salesforce deployment and tests completed successfully'
        }
        failure {
            echo '❌ Pipeline failed. Check logs above for details.'
        }
    }
}