'use strict';

/**
 * fixture controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::fixture.fixture');
