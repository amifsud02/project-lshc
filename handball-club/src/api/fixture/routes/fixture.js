'use strict';

/**
 * fixture router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::fixture.fixture');
