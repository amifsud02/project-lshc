// 'use strict';

// /**
//  * team-stat controller
//  */

// const { createCoreController } = require('@strapi/strapi').factories;

// module.exports = createCoreController('api::team-stat.team-stat');


'use strict';

/**
 * team-stat controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::team-stat.team-stat', ({ strapi }) => ({
    async create(ctx) {
        const { goalsFor, goalsAgainst } = ctx.request.body;
        ctx.request.body.goalDifference = goalsFor - goalsAgainst;
        
        const entity = await strapi.services['team-stat'].create(ctx.request.body);
        return entity;
    },

    async update(ctx) {
        const { id } = ctx.params;
        const { goalsFor, goalsAgainst } = ctx.request.body;
        ctx.request.body.goalDifference = goalsFor - goalsAgainst;

        const entity = await strapi.services['team-stat'].update({ id }, ctx.request.body);
        return entity;
    }
}));