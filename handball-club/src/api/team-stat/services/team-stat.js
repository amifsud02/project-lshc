'use strict';

/**
 * team-stat service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::team-stat.team-stat');
