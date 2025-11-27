# Data Graph Viewer Component

A Lightning Web Component for displaying Data Cloud records on Unified Individual record pages using Data Graphs and the Connect API.

## Overview

This component allows you to display related Data Cloud records on a Unified Individual record page by leveraging pre-defined Data Graphs. It queries Data Cloud using the `USING GRAPH` clause for optimized performance and displays results in a configurable datatable.

## Components

- **Apex Controller**: `DataCloudGraphQueryController` - Handles Data Cloud query execution
- **LWC Component**: `dataGraphViewer` - Displays data in a configurable lightning-datatable
- **Test Classes**: Comprehensive Apex and Jest tests included

## Prerequisites

### Data Cloud Setup

1. **Data Graph**: A Data Graph must exist in Data Cloud that includes:
   - The Unified Individual as the root or connected node
   - The target DMO(s) you want to query
   - Activated join paths between entities

2. **Permissions**: Users need:
   - Data Cloud User or Admin permission set
   - Access to the specific DMOs being queried
   - Query Data Cloud Data permission

### Salesforce Setup

1. Deploy the component to your org
2. The component works on any Lightning Record Page (not restricted to Unified Individual)
3. **Important**: The component uses `recordId` from the page context automatically
4. The Unified Individual object does NOT need to exist for deployment (object reference has been removed)

**Note:** While designed for Unified Individual pages, this component is flexible and can be placed on any record page where you want to display Data Cloud data related to that record's ID.

## Configuration

### App Builder Properties

When adding the component to a Unified Individual record page in Lightning App Builder, configure the following properties:

| Property | Type | Required | Description | Example |
|----------|------|----------|-------------|---------|
| **Graph Name** | String | Yes | API name of the Data Graph to query | `CustomerEngagementGraph` |
| **Root DMO** | String | Yes | Root DMO to query from (without `__dll` suffix) | `EngagementEvent` |
| **Select Fields** | String | Yes | Comma-separated list of fields to query | `EventType__c, EventDate__c, Channel__c` |
| **Column Configuration** | String | No | JSON array for custom column configuration | See below |
| **Card Title** | String | No | Title to display on the component card | `Recent Engagements` |
| **Max Rows** | Integer | No | Maximum number of rows to display (1-2000) | `50` |

### Column Configuration (Optional)

If you want custom column labels, types, or formatting, provide a JSON array:

```json
[
  {
    "label": "Event Type",
    "fieldName": "EventType__c",
    "type": "text"
  },
  {
    "label": "Date",
    "fieldName": "EventDate__c",
    "type": "date"
  },
  {
    "label": "Channel",
    "fieldName": "Channel__c",
    "type": "text"
  }
]
```

Supported column types:
- `text` - Plain text
- `number` - Numeric values
- `date` - Date values
- `date-local` - Date with time
- `boolean` - True/false
- `url` - Clickable links
- `email` - Email addresses
- `phone` - Phone numbers

If no column configuration is provided, the component will auto-generate columns from the query results.

## Usage Examples

### Example 1: Engagement Events

Display recent engagement events for a Unified Individual:

**Configuration:**
- Graph Name: `CustomerEngagementGraph`
- Root DMO: `EngagementEvent`
- Select Fields: `EventType__c, EventDate__c, Channel__c, Score__c`
- Card Title: `Recent Engagements`
- Max Rows: `25`

**Generated SQL:**
```sql
SELECT EventType__c, EventDate__c, Channel__c, Score__c
FROM EngagementEvent__dll
USING GRAPH CustomerEngagementGraph
WHERE UnifiedIndividualId__c = '{recordId}'
```

### Example 2: Purchase History

Show purchase history with custom columns:

**Configuration:**
- Graph Name: `CustomerPurchaseGraph`
- Root DMO: `Purchase`
- Select Fields: `PurchaseDate__c, ProductName__c, Amount__c, Status__c`
- Card Title: `Purchase History`
- Max Rows: `50`
- Column Configuration:
```json
[
  {"label": "Date", "fieldName": "PurchaseDate__c", "type": "date"},
  {"label": "Product", "fieldName": "ProductName__c", "type": "text"},
  {"label": "Amount", "fieldName": "Amount__c", "type": "number"},
  {"label": "Status", "fieldName": "Status__c", "type": "text"}
]
```

### Example 3: Communication Preferences

Display communication preferences:

**Configuration:**
- Graph Name: `CustomerProfileGraph`
- Root DMO: `CommunicationPreference`
- Select Fields: `Channel__c, OptIn__c, LastUpdated__c`
- Card Title: `Communication Preferences`
- Max Rows: `10`

## Features

### User Interface
- **Loading State**: Displays spinner while data is being fetched
- **Empty State**: Shows friendly message when no records are found
- **Error State**: Displays clear error messages with details
- **Refresh Button**: Allows users to manually refresh the data
- **Row Counter**: Shows number of records displayed
- **Responsive Design**: Adapts to different screen sizes

### Data Handling
- **Automatic Column Generation**: Creates columns from data if not configured
- **Field Type Inference**: Intelligently determines field types (date, number, text, etc.)
- **Row Limiting**: Prevents performance issues with large datasets
- **Input Sanitization**: Protects against SQL injection
- **Error Handling**: Comprehensive error catching and user-friendly messages

## Security Considerations

### Input Validation
The component validates and sanitizes all inputs:
- **Graph Name**: Alphanumeric and underscores only
- **Root DMO**: Alphanumeric and underscores only
- **Unified Individual ID**: Single quotes are escaped

### Permissions
Users must have appropriate Data Cloud permissions to view data. The component respects:
- Data Cloud's sharing model
- DMO-level access controls
- Record-level security

### Best Practices
1. Only configure graphs that users should have access to
2. Limit the number of fields queried to improve performance
3. Use appropriate maxRows values based on expected data volume
4. Test with users who have different permission levels

## Troubleshooting

### Component Not Visible in App Builder
- Verify LWC components are supported on Data Cloud record pages
- Check that the component is deployed successfully
- Ensure you're editing a Unified Individual record page

### "No Records Found"
- Verify the Data Graph exists and is activated
- Check that join paths are correctly defined in the graph
- Confirm the Unified Individual has related records in the DMO
- Verify field API names are correct (include `__c` suffix)

### Error: "Graph name is required"
- Ensure all required properties are configured in App Builder
- Graph Name, Root DMO, and Select Fields cannot be blank

### Error: "Invalid graph name format"
- Graph names must contain only letters, numbers, and underscores
- Remove any hyphens, spaces, or special characters

### Permission Errors
- Verify user has Data Cloud permissions
- Check DMO access in Data Cloud setup
- Ensure the user's profile has "Query Data Cloud Data" permission

### Slow Performance
- Reduce the number of fields in Select Fields
- Lower the Max Rows value
- Ensure the Data Graph has proper indexes
- Consider adding filters to the query (requires code modification)

## Limitations

1. **Query Complexity**: Only simple SELECT queries with WHERE clause are supported
2. **Filtering**: The component filters by UnifiedIndividualId only
3. **Sorting**: No built-in sorting capability (displays in query result order)
4. **Pagination**: Limited to max rows, no true pagination
5. **Caching**: Uses wire service caching, may not reflect real-time changes

## Development and Testing

### Running Apex Tests
```bash
sf apex run test --test-level RunSpecifiedTests --tests DataCloudGraphQueryControllerTest
```

### Running Jest Tests
```bash
npm run test:unit
```

### Deployment
```bash
sf project deploy start --source-dir force-app/main/default
```

## API Reference

### Apex Controller

#### `queryDataGraph(String unifiedIndividualId, String graphName, String selectFields, String rootDmo)`

Queries Data Cloud using a Data Graph.

**Parameters:**
- `unifiedIndividualId` - The Unified Individual ID from record context
- `graphName` - API name of the Data Graph
- `selectFields` - Comma-separated field list
- `rootDmo` - Root DMO name (without __dll)

**Returns:**
- `QueryResult` wrapper with success/error information and data

## Version History

- **v1.0** - Initial release
  - Basic query functionality
  - Auto-column generation
  - Error handling and loading states
  - Refresh capability

## Support and Contribution

For issues or feature requests, please contact your Salesforce administrator or development team.

## Additional Resources

- [Data Cloud Connect API Documentation](https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_data_cloud.htm)
- [Data Graphs in Data Cloud](https://help.salesforce.com/s/articleView?id=sf.c360_a_data_graphs.htm)
- [Data Cloud SQL Reference](https://help.salesforce.com/s/articleView?id=sf.c360_a_sql_reference.htm)
- [Lightning Web Components Developer Guide](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)
