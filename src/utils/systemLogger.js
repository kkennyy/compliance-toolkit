import { supabase } from '../config/supabaseClient';

/**
 * Action types for system logging
 */
export const ACTION_TYPES = {
    // Data modification actions
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    // User activity actions
    VIEW: 'view',
    SEARCH: 'search',
    LOGIN: 'login',
    LOGOUT: 'logout',
    EXPORT: 'export',
    DOWNLOAD: 'download'
};

/**
 * Core logging function for all system events
 */
export const logSystemEvent = async (
    actionType,
    entityType,
    entityId = null,
    entityName = null,
    details = {},
    metadata = {}
) => {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Error getting session:', sessionError);
            return null;
        }

        if (!session?.user) {
            console.warn('No authenticated user found while trying to log event');
            return null;
        }

        const logEntry = {
            action_type: actionType,
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            user_email: session.user.email,
            session_id: session.id,
            ip_address: metadata.ipAddress || null,
            user_agent: window.navigator.userAgent,
            details,
            metadata: {
                ...metadata,
                url: window.location.pathname,
                referrer: document.referrer
            },
            timestamp: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('system_logs')
            .insert([logEntry]);

        if (error) {
            console.error('Error creating system log:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in logSystemEvent:', error);
        return null;
    }
};

/**
 * Logs data changes (create, update, delete)
 */
export const logDataChange = async (actionType, entityType, entityId, entityName, changes, metadata = {}) => {
    if (!Object.values(ACTION_TYPES).slice(0, 3).includes(actionType)) {
        throw new Error('Invalid action type for data change');
    }
    
    return logSystemEvent(
        actionType,
        entityType,
        entityId,
        entityName,
        { changes },
        metadata
    );
};

/**
 * Logs when a user views an entity
 */
export const logEntityView = async (entityType, entityId, entityName, viewDetails = {}, metadata = {}) => {
    return logSystemEvent(
        ACTION_TYPES.VIEW,
        entityType,
        entityId,
        entityName,
        viewDetails,
        metadata
    );
};

/**
 * Logs search operations
 */
export const logSearch = async (entityType, searchParams, resultCount, metadata = {}) => {
    return logSystemEvent(
        ACTION_TYPES.SEARCH,
        entityType,
        null,
        null,
        {
            search_params: searchParams,
            result_count: resultCount
        },
        metadata
    );
};

/**
 * Logs authentication events
 */
export const logAuth = async (actionType, userId, metadata = {}) => {
    if (![ACTION_TYPES.LOGIN, ACTION_TYPES.LOGOUT].includes(actionType)) {
        throw new Error('Invalid action type for auth event');
    }

    return logSystemEvent(
        actionType,
        'system',
        userId,
        null,
        { auth_event: actionType },
        metadata
    );
};

/**
 * Generates a changes object by comparing old and new values
 */
export const generateChangesObject = (oldData, newData) => {
    const changes = {};
    
    // Get all unique keys from both objects
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    
    for (const key of allKeys) {
        const oldValue = oldData?.[key];
        const newValue = newData?.[key];
        
        // Only record if values are different
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[key] = {
                old: oldValue,
                new: newValue
            };
        }
    }
    
    return changes;
};

/**
 * Retrieves system logs with flexible filtering
 */
export const getSystemLogs = async (filters = {}) => {
    let query = supabase
        .from('system_logs')
        .select('*')
        .order('timestamp', { ascending: false });

    // Apply filters
    if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
    }
    if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
    }
    if (filters.entityId) {
        query = query.eq('entity_id', filters.entityId);
    }
    if (filters.userEmail) {
        query = query.eq('user_email', filters.userEmail);
    }
    if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
    }
    if (filters.searchText) {
        query = query.or(`entity_name.ilike.%${filters.searchText}%,details->>'search_query'.ilike.%${filters.searchText}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching system logs:', error);
        throw error;
    }

    return data;
};
