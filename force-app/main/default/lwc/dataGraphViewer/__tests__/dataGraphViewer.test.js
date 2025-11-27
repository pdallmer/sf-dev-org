import { createElement } from 'lwc';
import DataGraphViewer from 'c/dataGraphViewer';
import queryDataGraph from '@salesforce/apex/DataCloudGraphQueryController.queryDataGraph';

// Mock Apex wire adapter
jest.mock(
    '@salesforce/apex/DataCloudGraphQueryController.queryDataGraph',
    () => {
        const {
            createApexTestWireAdapter
        } = require('@salesforce/sfdx-lwc-jest');
        return {
            default: createApexTestWireAdapter(jest.fn())
        };
    },
    { virtual: true }
);

describe('c-data-graph-viewer', () => {
    afterEach(() => {
        // Clean up DOM after each test
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        // Clear all mocks
        jest.clearAllMocks();
    });

    it('should display configuration message when required properties are missing', () => {
        // Create component
        const element = createElement('c-data-graph-viewer', {
            is: DataGraphViewer
        });
        document.body.appendChild(element);

        // Check for configuration message
        return Promise.resolve().then(() => {
            const configMessage = element.shadowRoot.querySelector('.slds-text-heading_medium');
            expect(configMessage).not.toBeNull();
            expect(configMessage.textContent).toContain('Please configure the component');
        });
    });

    it('should display loading spinner when data is being fetched', () => {
        // Create component with required properties
        const element = createElement('c-data-graph-viewer', {
            is: DataGraphViewer
        });
        element.recordId = '001xx000003DGXXX';
        element.graphName = 'TestGraph';
        element.rootDmo = 'TestDmo';
        element.selectFields = 'Field1__c, Field2__c';
        document.body.appendChild(element);

        // Check for loading spinner
        return Promise.resolve().then(() => {
            const spinner = element.shadowRoot.querySelector('lightning-spinner');
            expect(spinner).not.toBeNull();
        });
    });

    it('should display data table when data is successfully loaded', () => {
        // Create component
        const element = createElement('c-data-graph-viewer', {
            is: DataGraphViewer
        });
        element.recordId = '001xx000003DGXXX';
        element.graphName = 'TestGraph';
        element.rootDmo = 'TestDmo';
        element.selectFields = 'Field1__c, Field2__c';
        document.body.appendChild(element);

        // Emit mock data
        const mockData = {
            success: true,
            data: [
                { Field1__c: 'Value1', Field2__c: 'Value2' },
                { Field1__c: 'Value3', Field2__c: 'Value4' }
            ],
            rowCount: 2,
            metadata: {}
        };

        queryDataGraph.emit(mockData);

        return Promise.resolve().then(() => {
            const datatable = element.shadowRoot.querySelector('lightning-datatable');
            expect(datatable).not.toBeNull();
            expect(datatable.data).toEqual(mockData.data);
        });
    });

    it('should display error message when query fails', () => {
        // Create component
        const element = createElement('c-data-graph-viewer', {
            is: DataGraphViewer
        });
        element.recordId = '001xx000003DGXXX';
        element.graphName = 'TestGraph';
        element.rootDmo = 'TestDmo';
        element.selectFields = 'Field1__c, Field2__c';
        document.body.appendChild(element);

        // Emit error
        const mockError = {
            success: false,
            errorMessage: 'Test error message',
            errorType: 'TestError'
        };

        queryDataGraph.emit(mockError);

        return Promise.resolve().then(() => {
            const errorIcon = element.shadowRoot.querySelector('lightning-icon[icon-name="utility:error"]');
            const errorText = element.shadowRoot.querySelector('.slds-text-body_regular');
            expect(errorIcon).not.toBeNull();
            expect(errorText.textContent).toBe('Test error message');
        });
    });

    it('should display empty state when no data is returned', () => {
        // Create component
        const element = createElement('c-data-graph-viewer', {
            is: DataGraphViewer
        });
        element.recordId = '001xx000003DGXXX';
        element.graphName = 'TestGraph';
        element.rootDmo = 'TestDmo';
        element.selectFields = 'Field1__c, Field2__c';
        document.body.appendChild(element);

        // Emit empty data
        const mockData = {
            success: true,
            data: [],
            rowCount: 0,
            metadata: {}
        };

        queryDataGraph.emit(mockData);

        return Promise.resolve().then(() => {
            const emptyStateText = element.shadowRoot.querySelector('.slds-text-heading_medium');
            expect(emptyStateText).not.toBeNull();
            expect(emptyStateText.textContent).toContain('No Records Found');
        });
    });

    it('should use custom title when provided', () => {
        // Create component with custom title
        const element = createElement('c-data-graph-viewer', {
            is: DataGraphViewer
        });
        element.title = 'My Custom Title';
        element.recordId = '001xx000003DGXXX';
        element.graphName = 'TestGraph';
        element.rootDmo = 'TestDmo';
        element.selectFields = 'Field1__c, Field2__c';
        document.body.appendChild(element);

        return Promise.resolve().then(() => {
            const card = element.shadowRoot.querySelector('lightning-card');
            expect(card.title).toBe('My Custom Title');
        });
    });

    it('should limit rows to maxRows when specified', () => {
        // Create component with maxRows
        const element = createElement('c-data-graph-viewer', {
            is: DataGraphViewer
        });
        element.recordId = '001xx000003DGXXX';
        element.graphName = 'TestGraph';
        element.rootDmo = 'TestDmo';
        element.selectFields = 'Field1__c, Field2__c';
        element.maxRows = 2;
        document.body.appendChild(element);

        // Emit mock data with more rows than maxRows
        const mockData = {
            success: true,
            data: [
                { Field1__c: 'Value1', Field2__c: 'Value2' },
                { Field1__c: 'Value3', Field2__c: 'Value4' },
                { Field1__c: 'Value5', Field2__c: 'Value6' },
                { Field1__c: 'Value7', Field2__c: 'Value8' }
            ],
            rowCount: 4,
            metadata: {}
        };

        queryDataGraph.emit(mockData);

        return Promise.resolve().then(() => {
            const datatable = element.shadowRoot.querySelector('lightning-datatable');
            expect(datatable).not.toBeNull();
            expect(datatable.data.length).toBe(2);
        });
    });

    it('should auto-generate columns when no column config is provided', () => {
        // Create component
        const element = createElement('c-data-graph-viewer', {
            is: DataGraphViewer
        });
        element.recordId = '001xx000003DGXXX';
        element.graphName = 'TestGraph';
        element.rootDmo = 'TestDmo';
        element.selectFields = 'EventType__c, EventDate__c';
        document.body.appendChild(element);

        // Emit mock data
        const mockData = {
            success: true,
            data: [
                { EventType__c: 'Click', EventDate__c: '2024-01-01' }
            ],
            rowCount: 1,
            metadata: {}
        };

        queryDataGraph.emit(mockData);

        return Promise.resolve().then(() => {
            const datatable = element.shadowRoot.querySelector('lightning-datatable');
            expect(datatable).not.toBeNull();
            expect(datatable.columns.length).toBe(2);
            expect(datatable.columns[0].label).toBe('Event Type');
            expect(datatable.columns[1].label).toBe('Event Date');
        });
    });

    it('should show refresh button when data is loaded', () => {
        // Create component
        const element = createElement('c-data-graph-viewer', {
            is: DataGraphViewer
        });
        element.recordId = '001xx000003DGXXX';
        element.graphName = 'TestGraph';
        element.rootDmo = 'TestDmo';
        element.selectFields = 'Field1__c';
        document.body.appendChild(element);

        // Emit mock data
        const mockData = {
            success: true,
            data: [{ Field1__c: 'Value1' }],
            rowCount: 1,
            metadata: {}
        };

        queryDataGraph.emit(mockData);

        return Promise.resolve().then(() => {
            const refreshButton = element.shadowRoot.querySelector('lightning-button-icon');
            expect(refreshButton).not.toBeNull();
            expect(refreshButton.iconName).toBe('utility:refresh');
        });
    });

    it('should handle wire adapter error', () => {
        // Create component
        const element = createElement('c-data-graph-viewer', {
            is: DataGraphViewer
        });
        element.recordId = '001xx000003DGXXX';
        element.graphName = 'TestGraph';
        element.rootDmo = 'TestDmo';
        element.selectFields = 'Field1__c';
        document.body.appendChild(element);

        // Emit wire adapter error
        queryDataGraph.error({
            body: { message: 'Wire adapter error' },
            ok: false,
            status: 400,
            statusText: 'Bad Request'
        });

        return Promise.resolve().then(() => {
            const errorIcon = element.shadowRoot.querySelector('lightning-icon[icon-name="utility:error"]');
            const errorText = element.shadowRoot.querySelector('.slds-text-body_regular');
            expect(errorIcon).not.toBeNull();
            expect(errorText.textContent).toBe('Wire adapter error');
        });
    });
});
