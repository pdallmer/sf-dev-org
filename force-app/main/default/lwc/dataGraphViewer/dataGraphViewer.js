import { LightningElement, api, wire } from 'lwc';
import queryDataGraph from '@salesforce/apex/DataCloudGraphQueryController.queryDataGraph';

export default class DataGraphViewer extends LightningElement {
    // Public properties - configurable via App Builder
    @api recordId; // Unified Individual ID from record page context
    @api graphName = '';
    @api rootDmo = '';
    @api selectFields = '';
    @api columnConfig = '';
    @api title = 'Data Cloud Records';
    @api maxRows = 50;

    // Private properties
    tableData = [];
    tableColumns = [];
    isLoading = false;
    error = null;
    hasData = false;

    /**
     * Wire the Apex method to automatically query when parameters change
     */
    @wire(queryDataGraph, {
        unifiedIndividualId: '$recordId',
        graphName: '$graphName',
        selectFields: '$selectFields',
        rootDmo: '$rootDmo'
    })
    wiredQueryResult({ error, data }) {
        this.isLoading = false;
        
        if (data) {
            this.processSuccessResponse(data);
        } else if (error) {
            this.processErrorResponse(error);
        }
    }

    /**
     * Lifecycle hook - runs when component is inserted into DOM
     */
    connectedCallback() {
        // Validate required configuration
        if (this.hasRequiredConfig) {
            this.isLoading = true;
        }
    }

    /**
     * Process successful API response
     */
    processSuccessResponse(result) {
        this.error = null;
        
        if (result.success && result.data && result.data.length > 0) {
            // Generate columns from column config or from data
            this.tableColumns = this.generateColumns(result.data);
            
            // Limit rows if maxRows is specified
            this.tableData = result.data.slice(0, this.maxRows);
            this.hasData = true;
        } else if (result.success && result.rowCount === 0) {
            // No data returned
            this.hasData = false;
            this.tableData = [];
        } else if (!result.success) {
            // Query failed
            this.error = {
                message: result.errorMessage || 'Unknown error occurred',
                type: result.errorType || 'Error'
            };
            this.hasData = false;
        }
    }

    /**
     * Process error response
     */
    processErrorResponse(error) {
        this.hasData = false;
        this.tableData = [];
        
        let errorMessage = 'Unknown error';
        
        if (error.body) {
            if (error.body.message) {
                errorMessage = error.body.message;
            } else if (error.body.pageErrors && error.body.pageErrors.length > 0) {
                errorMessage = error.body.pageErrors[0].message;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        this.error = {
            message: errorMessage,
            type: 'Error'
        };
    }

    /**
     * Generate columns for the datatable
     */
    generateColumns(data) {
        if (this.columnConfig) {
            try {
                // Parse custom column configuration
                return JSON.parse(this.columnConfig);
            } catch (e) {
                console.error('Invalid column configuration JSON:', e);
            }
        }
        
        // Auto-generate columns from first row of data
        if (data && data.length > 0) {
            const firstRow = data[0];
            return Object.keys(firstRow).map(fieldName => ({
                label: this.formatFieldLabel(fieldName),
                fieldName: fieldName,
                type: this.inferFieldType(firstRow[fieldName])
            }));
        }
        
        return [];
    }

    /**
     * Format field name into a readable label
     */
    formatFieldLabel(fieldName) {
        // Remove __c suffix and replace underscores with spaces
        return fieldName
            .replace(/__c$/i, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    /**
     * Infer Lightning datatable field type from value
     */
    inferFieldType(value) {
        if (value === null || value === undefined) {
            return 'text';
        }
        
        if (typeof value === 'number') {
            return 'number';
        }
        
        if (typeof value === 'boolean') {
            return 'boolean';
        }
        
        // Check if it's a date string
        if (typeof value === 'string') {
            const datePattern = /^\d{4}-\d{2}-\d{2}/;
            if (datePattern.test(value)) {
                return 'date';
            }
            
            // Check if it looks like a URL
            if (value.startsWith('http://') || value.startsWith('https://')) {
                return 'url';
            }
        }
        
        return 'text';
    }

    /**
     * Handle refresh button click
     */
    handleRefresh() {
        this.isLoading = true;
        this.error = null;
        
        // Re-evaluate the wire adapter by modifying a tracked property
        // Force refresh by temporarily clearing recordId
        const currentRecordId = this.recordId;
        this.recordId = null;
        
        // Use setTimeout to ensure the wire adapter detects the change
        setTimeout(() => {
            this.recordId = currentRecordId;
        }, 0);
    }

    /**
     * Check if all required configuration is present
     */
    get hasRequiredConfig() {
        return this.recordId && this.graphName && this.rootDmo && this.selectFields;
    }

    /**
     * Check if component should show loading spinner
     */
    get showLoading() {
        return this.isLoading && this.hasRequiredConfig;
    }

    /**
     * Check if component should show error state
     */
    get showError() {
        return this.error !== null;
    }

    /**
     * Check if component should show empty state
     */
    get showEmpty() {
        return !this.isLoading && !this.error && !this.hasData && this.hasRequiredConfig;
    }

    /**
     * Check if component should show configuration message
     */
    get showConfigMessage() {
        return !this.hasRequiredConfig;
    }

    /**
     * Get configuration message
     */
    get configMessage() {
        const missing = [];
        if (!this.recordId) missing.push('Record ID');
        if (!this.graphName) missing.push('Graph Name');
        if (!this.rootDmo) missing.push('Root DMO');
        if (!this.selectFields) missing.push('Select Fields');
        
        return `Please configure the component in App Builder. Missing: ${missing.join(', ')}`;
    }

    /**
     * Get formatted error message
     */
    get errorMessage() {
        return this.error ? this.error.message : '';
    }

    /**
     * Get row count message
     */
    get rowCountMessage() {
        const count = this.tableData.length;
        if (count === this.maxRows) {
            return `Showing ${count} of potentially more records (limited to ${this.maxRows})`;
        }
        return `${count} record${count !== 1 ? 's' : ''} found`;
    }
}
