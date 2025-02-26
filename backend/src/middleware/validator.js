/**
 * Validation Middleware
 * Centralized input validation for API endpoints
 */

const { ApiError } = require('./errorHandler');

/**
 * Validate request body against schema
 * @param {Object} schema - Validation schema object with field rules
 * @returns {Function} Express middleware
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (req.body[field] === undefined) {
          errors.push(`${field} is required`);
        }
      }
    }
    
    // Validate fields
    for (const [field, rules] of Object.entries(schema.fields || {})) {
      const value = req.body[field];
      
      // Skip validation if field is not present and not required
      if (value === undefined) {
        continue;
      }
      
      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be a ${rules.type}`);
        continue;
      }
      
      // String validations
      if (rules.type === 'string') {
        // Min length
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        
        // Max length
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
        
        // Pattern
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }
      
      // Number validations
      if (rules.type === 'number') {
        // Min value
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        
        // Max value
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }
      }
      
      // Array validations
      if (Array.isArray(value) && rules.type === 'array') {
        // Min items
        if (rules.minItems !== undefined && value.length < rules.minItems) {
          errors.push(`${field} must have at least ${rules.minItems} items`);
        }
        
        // Max items
        if (rules.maxItems !== undefined && value.length > rules.maxItems) {
          errors.push(`${field} must have at most ${rules.maxItems} items`);
        }
      }
      
      // Custom validation
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value);
        if (customError) {
          errors.push(customError);
        }
      }
    }
    
    // Return errors if any
    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation error', errors));
    }
    
    next();
  };
};

/**
 * Validate request query parameters against schema
 * @param {Object} schema - Validation schema object with field rules
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    // Validate fields
    for (const [field, rules] of Object.entries(schema.fields || {})) {
      const value = req.query[field];
      
      // Skip validation if field is not present and not required
      if (value === undefined) {
        if (rules.required) {
          errors.push(`${field} query parameter is required`);
        }
        continue;
      }
      
      // Type conversion for query params (they come as strings)
      let typedValue = value;
      if (rules.type === 'number') {
        typedValue = Number(value);
        if (isNaN(typedValue)) {
          errors.push(`${field} must be a number`);
          continue;
        }
      } else if (rules.type === 'boolean') {
        typedValue = value === 'true';
      }
      
      // String validations
      if (rules.type === 'string') {
        // Min length
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        
        // Max length
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
        
        // Pattern
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }
      
      // Number validations
      if (rules.type === 'number') {
        // Min value
        if (rules.min !== undefined && typedValue < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        
        // Max value
        if (rules.max !== undefined && typedValue > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }
      }
      
      // Custom validation
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(typedValue);
        if (customError) {
          errors.push(customError);
        }
      }
    }
    
    // Return errors if any
    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation error', errors));
    }
    
    next();
  };
};

/**
 * Validate request parameters against schema
 * @param {Object} schema - Validation schema object with field rules
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    // Validate fields
    for (const [field, rules] of Object.entries(schema.fields || {})) {
      const value = req.params[field];
      
      // Skip validation if field is not present and not required
      if (value === undefined) {
        if (rules.required) {
          errors.push(`${field} parameter is required`);
        }
        continue;
      }
      
      // String validations
      if (rules.type === 'string') {
        // Pattern
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }
      
      // Custom validation
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value);
        if (customError) {
          errors.push(customError);
        }
      }
    }
    
    // Return errors if any
    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation error', errors));
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  // Project validation
  project: {
    create: {
      required: ['repositoryUrl'],
      fields: {
        repositoryUrl: {
          type: 'string',
          pattern: /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/,
          maxLength: 255
        }
      }
    },
    
    // Project query validation
    query: {
      fields: {
        page: {
          type: 'number',
          min: 1,
          default: 1
        },
        search: {
          type: 'string',
          maxLength: 50
        }
      }
    }
  },
  
  // Auth validation
  auth: {
    github: {
      required: ['code'],
      fields: {
        code: {
          type: 'string',
          minLength: 20,
          maxLength: 255
        }
      }
    }
  },

  // Like validation
  like: {
    // Project ID parameter validation
    params: {
      fields: {
        projectId: {
          type: 'string',
          required: true,
          validate: (value) => {
            try {
              // Check if it's a valid MongoDB ObjectId format
              if (!/^[0-9a-fA-F]{24}$/.test(value)) {
                console.warn(`Invalid project ID format in params: ${value}`);
                return 'Invalid project ID format';
              }
            } catch (error) {
              console.error('Error validating project ID:', error);
              return 'Error validating project ID';
            }
          }
        }
      }
    },
    
    // Project IDs array validation for bulk operations
    counts: {
      required: ['projectIds'],
      fields: {
        projectIds: {
          type: 'array',
          validate: (value) => {
            if (!Array.isArray(value)) {
              return 'Project IDs must be an array';
            }
            
            if (value.length === 0) {
              return 'Project IDs array cannot be empty';
            }
            
            if (value.length > 50) {
              return 'Maximum of 50 project IDs allowed';
            }
            
            // Filter out invalid IDs instead of rejecting the whole request
            const validIds = value.filter(id => 
              typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)
            );
            
            if (validIds.length === 0) {
              return 'No valid project IDs found in array';
            }
            
            // If we lost some IDs but still have valid ones, don't return an error
            if (validIds.length < value.length) {
              // This is a warning, not an error - we'll just use the valid IDs
              console.warn(`Filtered out ${value.length - validIds.length} invalid project IDs`);
              // Replace the array with only valid IDs
              value.splice(0, value.length, ...validIds);
            }
          }
        }
      }
    }
  }
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  schemas
}; 