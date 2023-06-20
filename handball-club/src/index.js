'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe({
      model: ['api::competition.competition'],

      afterCreate: async (event) => {

        const { result, params } = event;
        const { category } = params.data; 
        const { season } = params.data;    

        if (category && category.connect && category.connect.length > 0) {
          // Fetch the related Category using the connected category ID
          const categoryId = category.connect[0].id;
          const relatedCategory = await strapi.query('api::category.category').findOne({ where: { id: categoryId }});

          if (relatedCategory) {
            const seasonId = season.connect[0].id;
            const relatedSeason = await strapi.query('api::season.season').findOne({ where: { id: seasonId }});
            // Combine the Category object and name field
            const compCatCombined = `${result.name} - ${relatedCategory.name} - ${relatedSeason.year}`;

            // Update the newly created competition's combined field
            await strapi.query('api::competition.competition').update({
              where: {
                id: result.id
              },
              data: {
                comp_cat_combined: compCatCombined
              }
            })
          }

        }
      }
    })
  },
};
