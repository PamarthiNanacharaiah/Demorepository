pipeline {
    agent any
 
    environment {
        SF_USERNAME = credentials('user_name')
        SF_CONSUMER_KEY = credentials('consumer_key')
    }
 
    stages {
 
        stage('Checkout Code') {
            steps {
                git 'https://github.com/PamarthiNanacharaiah/Demorepository.git'
            }
        }
 
        stage('Authenticate Salesforce') {
            steps {
                sh '''
                sf force:auth:jwt:grant \
                --client-id $    \
                --jwt-key-file server.key \
                --username $SF_USERNAME \
                --instance-url https://login.salesforce.com \
                --set-default-dev-hub \
                --alias devopscicddemo
                '''
            }
        }
 
        stage('Deploy to Org') {
            steps {
                sh '''
                sf project deploy start \
                --source-dir force-app \
                --target-org $SF_USERNAME \
                --wait 10
                '''
            }
        }
 
        stage('Run Tests') {
            steps {
                sh '''
                sf apex run test \
                --target-org $SF_USERNAME \
                --wait 10 \
                --result-format human
                '''
            }
        }
    }
}
