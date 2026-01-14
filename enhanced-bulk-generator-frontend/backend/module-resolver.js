/**
 * Module Resolver for Vercel Deployment
 * Adds parent node_modules to module resolution paths
 * This allows backend code to access frontend's installed dependencies
 */

const path = require('path');

// Add parent node_modules to module paths
const parentNodeModules = path.join(__dirname, '..', 'node_modules');
if (!module.paths.includes(parentNodeModules)) {
  module.paths.unshift(parentNodeModules);
}

// Export for easy importing
module.exports = {
  resolved: true,
  parentNodeModules
};
