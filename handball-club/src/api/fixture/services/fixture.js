'use strict';

/**
 * fixture service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::fixture.fixture');
