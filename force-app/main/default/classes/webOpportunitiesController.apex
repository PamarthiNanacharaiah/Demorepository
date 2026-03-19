public with sharing class webOpportunitiesController {
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getOpportunities() {
        return [
            SELECT Id, Name, StageName, CloseDate, Amount
            FROM Opportunity
            WHERE Source_Detail__c = 'Online Campaign'
            ORDER BY CloseDate DESC
        ];
    }
}