const _ = require('lodash'),
    debug = require('ghost-ignition').debug('services:routing:controllers:collection'),
    common = require('../../../lib/common'),
    security = require('../../../lib/security'),
    urlService = require('../../../services/url'),
    themes = require('../../themes'),
    filters = require('../../../filters'),
    helpers = require('../helpers');

module.exports = function collectionController(req, res, next) {
    debug('collectionController', req.params, res.routerOptions);

    const pathOptions = {
        page: req.params.page !== undefined ? req.params.page : 1,
        slug: req.params.slug ? security.string.safe(req.params.slug) : undefined
    };

    if (pathOptions.page) {
        // CASE 1: routes.yaml `limit` is stronger than theme definition
        // CASE 2: use `posts_per_page` config from theme as `limit` value
        if (res.routerOptions.limit) {
            themes.getActive().updateTemplateOptions({
                data: {
                    config: {
                        posts_per_page: res.routerOptions.limit
                    }
                }
            });

            pathOptions.limit = res.routerOptions.limit;
        } else {
            const postsPerPage = parseInt(themes.getActive().config('posts_per_page'));

            if (!isNaN(postsPerPage) && postsPerPage > 0) {
                pathOptions.limit = postsPerPage;
            }
        }
    }

    return helpers.fetchData(pathOptions, res.routerOptions, res.locals)
        .then(function handleResult(result) {
            // CASE: requested page is greater than number of pages we have
            if (pathOptions.page > result.meta.pagination.pages) {
                return next(new common.errors.NotFoundError({
                    message: common.i18n.t('errors.errors.pageNotFound')
                }));
            }

            debug(result.posts.length);

            // CASE: does this post belong to this collection?
            result.posts = _.filter(result.posts, (post) => {
                if (urlService.owns(res.routerOptions.identifier, post.id)) {
                    return post;
                }

                debug(`'${post.slug}' is not owned by this collection`);
            });

            // Format data 1
            // @TODO: figure out if this can be removed, it's supposed to ensure that absolutely URLs get generated
            // correctly for the various objects, but I believe it doesn't work and a different approach is needed.
            helpers.secure(req, result.posts);

            // @TODO: get rid of this O_O
            _.each(result.data, function (data) {
                helpers.secure(req, data);
            });

            // @TODO: properly design these filters
            filters.doFilter('prePostsRender', result.posts, res.locals)
                .then(function (posts) {
                    result.posts = posts;
                    return result;
                })
                .then(helpers.renderEntries(req, res));
        })
        .catch(helpers.handleError(next));
};
