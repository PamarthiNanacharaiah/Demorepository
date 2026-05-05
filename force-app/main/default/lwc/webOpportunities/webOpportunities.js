import { LightningElement, wire, track } from 'lwc';
import getOpportunities from '@salesforce/apex/webOpportunitiesController.getOpportunities';

const columns = [
    { label: 'Opportunity Name', fieldName: 'Name', type: 'text' },
    { label: 'Stage Name', fieldName: 'StageName', type: 'text' },
    { label: 'Close Date', fieldName: 'CloseDate', type: 'date' },
    { label: 'Amount', fieldName: 'Amount', type: 'currency' }
];

export default class WebOpportunities extends LightningElement {
     allOpportunities = [];
     filteredOpportunities = [];
    searchKey = '';
    columns = columns;

    @wire(getOpportunities)
    wiredOpportunities({ error, data }) {
        if (data) {
            this.allOpportunities = data;
            this.filteredOpportunities = data;
        } else if (error) {
            console.error('Error fetching Opportunities:', error);
        }
    }

    handleSearch(event) {
        this.searchKey = event.target.value.toLowerCase();
        if (this.searchKey) {
            this.filteredOpportunities = this.allOpportunities.filter(opp =>
                opp.Name.toLowerCase().includes(this.searchKey)
            );
        } else {
            this.filteredOpportunities = this.allOpportunities;
        }
    }
}