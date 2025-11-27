/**
 * @description Controller for querying Data Cloud using Data Graphs
 * @author Salesforce
 * @date 2024
 */
public with sharing class DataCloudGraphQueryController {
    
    private static final String DATA_CLOUD_QUERY_ENDPOINT = '/services/data/v62.0/query';
    
    /**
     * @description Query Data Cloud using a Data Graph
     * @param unifiedIndividualId The Unified Individual ID to query for
     * @param graphName The API name of the Data Graph to use
     * @param selectFields Comma-separated list of fields to select
     * @param rootDmo The root DMO to query from (without __dll suffix)
     * @return QueryResult wrapper containing data or error information
     */
    @AuraEnabled(cacheable=true)
    public static QueryResult queryDataGraph(
        String unifiedIndividualId,
        String graphName,
        String selectFields,
        String rootDmo
    ) {
        QueryResult result = new QueryResult();
        
        try {
            // Validate inputs
            validateInputs(unifiedIndividualId, graphName, selectFields, rootDmo);
            
            // Build the SQL query
            String sqlQuery = buildQuery(unifiedIndividualId, graphName, selectFields, rootDmo);
            
            // Execute the query via HTTP callout
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:DataCloud' + DATA_CLOUD_QUERY_ENDPOINT);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            
            // Build request body
            Map<String, Object> requestBody = new Map<String, Object>{
                'sql' => sqlQuery
            };
            req.setBody(JSON.serialize(requestBody));
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                // Parse the response
                Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                
                result.success = true;
                result.data = (List<Map<String, Object>>) responseMap.get('data');
                result.metadata = (Map<String, Object>) responseMap.get('metadata');
                
                if (result.data != null) {
                    result.rowCount = result.data.size();
                } else {
                    result.rowCount = 0;
                    result.data = new List<Map<String, Object>>();
                }
            } else {
                result.success = false;
                result.errorMessage = 'HTTP Error: ' + res.getStatus() + ' - ' + res.getBody();
                result.errorType = 'HttpException';
            }
            
        } catch (Exception e) {
            result.success = false;
            result.errorMessage = e.getMessage();
            result.errorType = e.getTypeName();
            System.debug(LoggingLevel.ERROR, 'Error querying Data Cloud: ' + e.getMessage());
            System.debug(LoggingLevel.ERROR, 'Stack Trace: ' + e.getStackTraceString());
        }
        
        return result;
    }
    
    /**
     * @description Validate input parameters
     * @param unifiedIndividualId The Unified Individual ID
     * @param graphName The Data Graph name
     * @param selectFields The fields to select
     * @param rootDmo The root DMO name
     */
    private static void validateInputs(
        String unifiedIndividualId,
        String graphName,
        String selectFields,
        String rootDmo
    ) {
        if (String.isBlank(unifiedIndividualId)) {
            throw new QueryException('Unified Individual ID is required');
        }
        
        if (String.isBlank(graphName)) {
            throw new QueryException('Graph name is required');
        }
        
        if (String.isBlank(selectFields)) {
            throw new QueryException('Select fields are required');
        }
        
        if (String.isBlank(rootDmo)) {
            throw new QueryException('Root DMO is required');
        }
        
        // Validate graphName format (alphanumeric and underscores only)
        if (!Pattern.matches('^[a-zA-Z0-9_]+$', graphName)) {
            throw new QueryException('Invalid graph name format');
        }
        
        // Validate rootDmo format (alphanumeric and underscores only)
        if (!Pattern.matches('^[a-zA-Z0-9_]+$', rootDmo)) {
            throw new QueryException('Invalid root DMO format');
        }
        
        // Sanitize unifiedIndividualId - escape single quotes
        // This is handled in buildQuery method
    }
    
    /**
     * @description Build the SQL query with USING GRAPH clause
     * @param unifiedIndividualId The Unified Individual ID
     * @param graphName The Data Graph name
     * @param selectFields The fields to select
     * @param rootDmo The root DMO name
     * @return The complete SQL query string
     */
    private static String buildQuery(
        String unifiedIndividualId,
        String graphName,
        String selectFields,
        String rootDmo
    ) {
        // Sanitize the unifiedIndividualId by escaping single quotes
        String sanitizedId = String.escapeSingleQuotes(unifiedIndividualId);
        
        // Build the query
        String query = 'SELECT ' + selectFields + ' ' +
                      'FROM ' + rootDmo + '__dll ' +
                      'USING GRAPH ' + graphName + ' ' +
                      'WHERE UnifiedIndividualId__c = \'' + sanitizedId + '\'';
        
        System.debug('Executing Data Cloud Query: ' + query);
        
        return query;
    }
    
    /**
     * @description Wrapper class for query results
     */
    public class QueryResult {
        @AuraEnabled public Boolean success;
        @AuraEnabled public List<Map<String, Object>> data;
        @AuraEnabled public Map<String, Object> metadata;
        @AuraEnabled public Integer rowCount;
        @AuraEnabled public String errorMessage;
        @AuraEnabled public String errorType;
        
        public QueryResult() {
            this.success = false;
            this.data = new List<Map<String, Object>>();
            this.rowCount = 0;
        }
    }
    
    /**
     * @description Custom exception for query errors
     */
    public class QueryException extends Exception {}
}
