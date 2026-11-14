/* Аниме по вкусу 1.0.0 — расширение для Lampa и YummyAnime. */
(function (window) {
    'use strict';

    var NAME = 'Аниме по вкусу';
    var COMPONENT = 'anime_taste';
    var STORAGE = 'anime_taste_v1';
    var ABBREVIATIONS = {
        fmab: 'Fullmetal Alchemist Brotherhood', aot: 'Attack on Titan', snk: 'Shingeki no Kyojin',
        jjk: 'Jujutsu Kaisen', hxh: 'Hunter x Hunter', sao: 'Sword Art Online',
        mha: 'My Hero Academia', bnha: 'Boku no Hero Academia', opm: 'One Punch Man',
        csm: 'Chainsaw Man', ngev: 'Neon Genesis Evangelion', ylia: 'Your Lie in April'
    };
    var KEY_EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
    var KEY_RU = 'йцукенгшщзхъфывапролджэячсмитьбюё';
    var NUMBERS = {'ноль': '0', 'один': '1', 'два': '2', 'три': '3', 'четыре': '4', 'пять': '5',
        'шесть': '6', 'семь': '7', 'восемь': '8', 'девять': '9', 'десять': '10'};

    function clean(value) {
        var text = String(value || '').replace(/№/g, ' ');
        if (text.normalize) text = text.normalize('NFKC');
        return text.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-яіїєґ0-9\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]+/g, ' ').trim();
    }

    function normalTitle(value) {
        return clean(value).replace(/\b(?:no|number)\s+(?=\d)/g, '')
            .replace(/(^| )номер ([^ ]+)/g, function (all, space, next) {
                return NUMBERS[next] || /^\d+$/.test(next) ? space + (NUMBERS[next] || next) : all;
            });
    }

    function unique(values) {
        return values.filter(function (value, index) { return value && values.indexOf(value) === index; });
    }

    function keysInOtherLayout(text, from, to) {
        return text.toLowerCase().split('').map(function (character) {
            var index = from.indexOf(character);
            return index < 0 ? character : to.charAt(index);
        }).join('');
    }

    function parseQuery(value) {
        var raw = String(value || '').trim().slice(0, 100);
        var yearMatch = raw.match(/(?:^|\s|\()(19\d{2}|20\d{2})\)?$/);
        var title = yearMatch && yearMatch.index > 0 ? raw.slice(0, yearMatch.index).trim() : raw;
        var year = title === raw ? 0 : Number(yearMatch[1]);
        var layout = /^[a-z\[\];'`,. ]{4,}$/i.test(title) ? keysInOtherLayout(title, KEY_EN, KEY_RU) : '';
        if (/^[а-яё ]{4,}$/i.test(title)) layout = keysInOtherLayout(title, KEY_RU, KEY_EN);
        var expanded = ABBREVIATIONS[clean(title)];
        var layoutExpanded = ABBREVIATIONS[clean(layout)];
        var normalized = normalTitle(title);
        var requests = unique([expanded || layoutExpanded || (normalized !== clean(title) ? normalized : title), title, layout]).slice(0, 3);
        var variants = unique([expanded, layoutExpanded, title, layout].map(normalTitle));
        return {year: year, requests: variants.length ? requests : [], variants: variants};
    }

    function distance(a, b) {
        var beforePrevious, previous = [], current;
        for (var column = 0; column <= b.length; column++) previous[column] = column;
        for (var row = 1; row <= a.length; row++) {
            current = [row];
            for (column = 1; column <= b.length; column++) {
                current[column] = Math.min(current[column - 1] + 1, previous[column] + 1,
                    previous[column - 1] + (a.charAt(row - 1) === b.charAt(column - 1) ? 0 : 1));
                if (row > 1 && column > 1 && a.charAt(row - 1) === b.charAt(column - 2) && a.charAt(row - 2) === b.charAt(column - 1)) {
                    current[column] = Math.min(current[column], beforePrevious[column - 2] + 1);
                }
            }
            beforePrevious = previous;
            previous = current;
        }
        return previous[b.length];
    }

    function titleScore(query, title) {
        if (query === title) return 100;
        if (title.indexOf(query + ' ') === 0) return 80;
        if ((' ' + title + ' ').indexOf(' ' + query + ' ') >= 0) return 72;
        var words = query.split(' ');
        if (words.length > 1 && words.every(function (word) { return title.split(' ').indexOf(word) >= 0; })) return 67;
        if (query.length < 4 || title.length > 120) return 0;
        var edits = query.length > 9 ? 2 : 1;
        var comparable = title.split(' ').slice(0, words.length).join(' ');
        if (Math.abs(query.length - comparable.length) <= edits && distance(query, comparable) <= edits) {
            return comparable === title ? 64 : 58;
        }
        return 0;
    }

    function match(query, card) {
        var score = 0;
        query.variants.forEach(function (variant, index) {
            card.titles.forEach(function (title) {
                var candidate = normalTitle(title);
                var numbers = variant.split(' ').filter(function (part) { return /^\d+$/.test(part); });
                if (numbers.some(function (number) { return candidate.split(' ').indexOf(number) < 0; })) return;
                score = Math.max(score, titleScore(variant, candidate) - Math.min(index, 1) * 2);
            });
        });
        if (!score) return 0;
        // A known different release year is never returned as a match for a specified year.
        if (query.year && card.year && card.year !== query.year) return 0;
        return score + (query.year ? (card.year ? 14 : -18) : 0);
    }

    function anime(item) {
        if (item && item.anime && typeof item.anime === 'object') item = item.anime;
        if (!item) return null;
        var id = Number(item.yani_id || item.anime_id || item.animeId || item.id);
        if (!id || id < 1 || id !== Math.floor(id)) return null;
        var utils = window.LampaYaniUiUtils;
        var titles = utils && utils.titleValues ? utils.titleValues(item) : [item.title, item.name, item.original_title];
        var title = String(item.title || item.name || titles[0] || '').trim();
        if (!title) return null;
        var poster = item.poster || item.img || item.image;
        if (utils && utils.posterUrl) poster = utils.posterUrl(poster, 'card');
        if (typeof poster !== 'string' || !/^https:\/\//i.test(poster)) poster = '';
        var genres = item.yani_genres || item.genres || [];
        var studios = item.yani_studios || item.studios || [];
        var type = item.yani_type || item.type;
        var rating = item.rating;
        return {
            id: id, title: title.slice(0, 180), titles: unique([title].concat(titles, item.yani_titles || [])).slice(0, 24),
            year: Number(item.yani_year || item.year || item.release_year || String(item.release_date || '').slice(0, 4)) || 0,
            poster: poster, type: String(type && (type.name || type.title || type.alias) || (typeof type === 'string' ? type : '')),
            genres: (Array.isArray(genres) ? genres : []).slice(0, 20).map(function (genre) {
                return {id: Number(genre && (genre.id || genre.value)) || 0,
                    name: String(genre && (genre.title || genre.name) || (typeof genre === 'string' ? genre : ''))};
            }).filter(function (genre) { return genre.id || genre.name; }),
            studios: (Array.isArray(studios) ? studios : []).slice(0, 8).map(function (studio) {
                return String(studio && (studio.title || studio.name) || (typeof studio === 'string' ? studio : ''));
            }).filter(Boolean),
            rating: Number(item.yani_rating || (rating && rating.average) || rating || item.vote_average) || 0,
            votes: Number(item.vote_count || (rating && rating.counters)) || 0,
            accountFavorite: Boolean(item.yani_is_favorite || item.user && item.user.list && item.user.list.is_fav)
        };
    }

    function payloadValue(payload) {
        return payload && payload.response !== undefined ? payload.response : payload;
    }

    function uniqueCards(cards) {
        var seen = Object.create(null);
        return cards.filter(function (card) {
            if (!card || seen[card.id]) return false;
            seen[card.id] = true;
            return true;
        });
    }

    function rankSearch(query, cards, favoriteIds) {
        return uniqueCards(cards).map(function (card, index) {
            return {card: card, score: match(query, card), index: index};
        }).filter(function (entry) { return entry.score >= 54; }).sort(function (a, b) {
            return b.score - a.score || Number(Boolean(favoriteIds[b.card.id])) - Number(Boolean(favoriteIds[a.card.id])) || a.index - b.index;
        });
    }

    function genreKey(genre) { return genre.id ? String(genre.id) : clean(genre.name); }

    function recommendations(seeds, groups, extra, excluded) {
        var candidates = Object.create(null);
        var genreCounts = Object.create(null);
        seeds.forEach(function (seed) {
            unique(seed.genres.map(genreKey)).forEach(function (key) { genreCounts[key] = (genreCounts[key] || 0) + 1; });
        });
        function entry(card) {
            if (!card || excluded[card.id]) return null;
            if (!candidates[card.id]) candidates[card.id] = {card: card, mentions: [], relevance: 0};
            var candidate = candidates[card.id];
            if (card.genres.length > candidate.card.genres.length) candidate.card = card;
            return candidate;
        }
        groups.forEach(function (group, index) {
            uniqueCards(group).forEach(function (card, rank) {
                var candidate = entry(card);
                if (!candidate) return;
                candidate.mentions.push(seeds[index].title);
                candidate.relevance += 12 + 12 / (1 + rank / 5);
            });
        });
        extra.forEach(entry);
        return Object.keys(candidates).map(function (key) {
            var row = candidates[key];
            var shared = row.card.genres.filter(function (genre) { return genreCounts[genreKey(genre)] > 0; })
                .sort(function (a, b) { return genreCounts[genreKey(b)] - genreCounts[genreKey(a)]; });
            var studio = row.card.studios.filter(function (name) {
                return seeds.some(function (seed) { return seed.studios.some(function (item) { return clean(item) === clean(name); }); });
            })[0];
            var genreScore = shared.reduce(function (total, genre) { return total + 2 + 3 * genreCounts[genreKey(genre)] / seeds.length; }, 0);
            row.score = row.relevance + Math.min(16, genreScore) + (studio ? 4 : 0)
                + Math.min(3, row.card.rating / 4) * row.card.votes / (row.card.votes + 100);
            row.reasons = [];
            if (row.mentions.length) row.reasons.push('Похоже на «' + row.mentions.slice(0, 2).join('» и «') + '»');
            var genreNames = unique(shared.map(function (genre) { return genre.name; })).slice(0, 3);
            if (genreNames.length) row.reasons.push('Общие жанры: ' + genreNames.join(', '));
            if (studio) row.reasons.push('Студия: ' + studio);
            return row;
        }).filter(function (row) { return row.reasons.length; }).sort(function (a, b) {
            return b.score - a.score || a.card.id - b.card.id;
        });
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = {parseQuery: parseQuery, anime: anime, rankSearch: rankSearch, recommendations: recommendations};
        return;
    }

    var Lampa = window.Lampa;
    var $ = window.jQuery || window.$;
    if (!Lampa || !$ || window.animeTasteInstalled) return;
    window.animeTasteInstalled = true;
    var accountCache;
    var detailCache = Object.create(null);

    function data() {
        var saved = Lampa.Storage.get(STORAGE, {});
        if (typeof saved === 'string') {
            try { saved = JSON.parse(saved); } catch (error) { saved = {}; }
        }
        saved = saved || {};
        return {likes: saved.likes || {}, hidden: saved.hidden || {}, ignored: saved.ignored || {}};
    }

    function publicApi() {
        var api = window.LampaYaniApi;
        if (!api || !api.normalize || !api.search || !api.recommendations || !api.detail) {
            throw new Error('Откройте или установите YummyAnime в этой Lampa.');
        }
        return api;
    }

    function snapshot() {
        var auth = window.LampaYaniAuth;
        var saved = auth && auth.get ? auth.get() : {};
        if (!saved || !saved.token) return Promise.resolve({favorites: [], excluded: {}, error: false});
        var identity = String(saved.user_id || saved.login || '');
        if (identity && accountCache && accountCache.identity === identity && accountCache.until > Date.now()) return accountCache.promise;
        var api = publicApi();
        var user = saved.user_id ? Promise.resolve(saved.user_id) : api.profile().then(function (payload) {
            var item = payloadValue(payload) || {};
            return item.id || item.user_id || (item.user && item.user.id);
        });
        var promise = user.then(function (id) {
            if (!id) throw new Error('Профиль YummyAnime недоступен.');
            return api.userLists(id);
        }).then(function (payload) {
            var lists = window.LampaYaniAccountLists;
            var rows = lists && lists.normalize ? lists.normalize(payload) : api.normalize(payload);
            var favorites = [];
            var excluded = Object.create(null);
            rows.forEach(function (item) {
                var card = anime(item);
                if (!card) return;
                var list = item.user && item.user.list || item.user_list || item.list_state || {};
                var status = Number(list.list && list.list.id !== undefined ? list.list.id : list.id);
                if (list.is_fav || list.is_favorite || list.favorite) favorites.push(card);
                if (status === 0 || status === 2 || status === 3) excluded[card.id] = true;
            });
            return {favorites: favorites, excluded: excluded, error: false};
        }).catch(function () {
            accountCache = null;
            return {favorites: [], excluded: {}, error: true};
        });
        accountCache = {identity: identity, until: Date.now() + 120000, promise: promise};
        return promise;
    }

    function favorites(saved, account) {
        var local = Object.keys(saved.likes).map(function (id) { return saved.likes[id]; })
            .sort(function (a, b) { return b.added - a.added; });
        return uniqueCards(local.concat(account.favorites)).filter(function (card) { return !saved.ignored[card.id]; });
    }

    function byId(cards) {
        var ids = Object.create(null);
        cards.forEach(function (card) { ids[card.id] = true; });
        return ids;
    }

    function requestDetail(card) {
        if (detailCache[card.id]) return detailCache[card.id];
        if (Object.keys(detailCache).length >= 128) detailCache = Object.create(null);
        var pending = publicApi().detail(card.id).then(function (payload) { return anime(payloadValue(payload)) || card; });
        detailCache[card.id] = pending;
        pending.catch(function () { if (detailCache[card.id] === pending) delete detailCache[card.id]; });
        return pending;
    }

    function searchCatalog(value, likedIds) {
        var api = publicApi();
        var query = parseQuery(value);
        var failures = 0;
        var primary = query.requests[0];
        function find(text) {
            return api.search(text, {limit: 20}).then(function (payload) { return api.normalize(payload).map(anime); })
                .catch(function () { failures++; return []; });
        }
        function rerank(cards) {
            var preliminary = rankSearch(query, cards, likedIds);
            if (preliminary.length && preliminary[0].score >= 95) return Promise.resolve(preliminary);
            var shortlist = uniqueCards(preliminary.slice(0, 3).map(function (row) { return row.card; }).concat(cards)).slice(0, 5);
            return Promise.all(shortlist.map(function (card) { return requestDetail(card).catch(function () { return card; }); }))
                .then(function (details) {
                    var lookup = Object.create(null);
                    details.forEach(function (card) { lookup[card.id] = card; });
                    return rankSearch(query, uniqueCards(cards).map(function (card) { return lookup[card.id] || card; }), likedIds);
                });
        }
        if (!primary) return Promise.resolve([]);
        return find(primary).then(function (first) {
            var exact = rankSearch(query, first, likedIds);
            if (exact.length && exact[0].score >= 95) return exact;
            return Promise.all(query.requests.slice(1).map(find)).then(function (rest) {
                if (failures === query.requests.length) throw new Error('Каталог YummyAnime не ответил. Попробуйте ещё раз.');
                var candidates = first.concat.apply(first, rest);
                return rerank(candidates).then(function (ranked) {
                    if (ranked.length) return ranked;
                    var recovered = query.variants[0].split(' ').filter(function (word) { return word.length >= 5; })
                        .sort(function (a, b) { return b.length - a.length; })[0];
                    if (!recovered || query.requests.indexOf(recovered) >= 0) return ranked;
                    return find(recovered).then(function (more) { return rerank(candidates.concat(more)); });
                });
            });
        });
    }

    function suggest(likes, saved, account, similarTo) {
        var api = publicApi();
        var chosen = similarTo ? [similarTo] : likes.slice(0, 6);
        if (!chosen.length) return Promise.resolve([]);
        var seen = byId(likes.concat(chosen));
        Object.keys(saved.hidden).concat(Object.keys(account.excluded)).forEach(function (id) { seen[id] = true; });
        var history = Lampa.Storage.get('yani_playback_history', {});
        if (typeof history === 'string') {
            try { history = JSON.parse(history); } catch (error) { history = {}; }
        }
        Object.keys(history || {}).forEach(function (id) { if (/^\d+$/.test(id)) seen[id] = true; });
        var errors = 0;
        return Promise.all(chosen.map(function (card) {
            return Promise.all([
                requestDetail(card).catch(function () { return card; }),
                api.recommendations(card.id).then(function (payload) { return api.normalize(payload).map(anime); })
                    .catch(function () { errors++; return []; })
            ]);
        })).then(function (pairs) {
            var seeds = pairs.map(function (pair) { return pair[0]; });
            var groups = pairs.map(function (pair) { return pair[1]; });
            var result = recommendations(seeds, groups, [], seen);
            if (result.length >= 12 || !api.catalog) return result;
            var genreHits = Object.create(null);
            seeds.forEach(function (seed) {
                seed.genres.forEach(function (genre) { if (genre.id) genreHits[genre.id] = (genreHits[genre.id] || 0) + 1; });
            });
            var topGenres = Object.keys(genreHits).sort(function (a, b) { return genreHits[b] - genreHits[a]; }).slice(0, 2);
            return Promise.all(topGenres.map(function (id) {
                return api.catalog({genres: id, limit: 18, sort: 'top'}).then(function (payload) { return api.normalize(payload).map(anime); })
                    .catch(function () { return []; });
            })).then(function (extra) {
                var combined = recommendations(seeds, groups, [].concat.apply([], extra), seen);
                if (!combined.length && errors === chosen.length) throw new Error('YummyAnime не вернул рекомендации. Попробуйте ещё раз.');
                return combined;
            });
        });
    }

    function openDetail(card) {
        Lampa.Activity.push({component: 'yani_detail', id: card.id, yani_id: card.id, title: card.title,
            url: 'yani/detail/' + card.id, card: {yani_id: card.id, title: card.title, yani_titles: card.titles, poster: card.poster,
                img: card.poster, release_date: String(card.year || ''), yani_genres: card.genres, yani_rating: card.rating}});
    }

    function toggleFavorite(card, selected) {
        var saved = data();
        if (selected || saved.likes[card.id]) {
            delete saved.likes[card.id];
            saved.ignored[card.id] = true;
        } else {
            delete saved.hidden[card.id];
            delete saved.ignored[card.id];
            saved.likes[card.id] = Object.assign({added: Date.now()}, card);
        }
        Lampa.Storage.set(STORAGE, saved);
        return Boolean(saved.likes[card.id]);
    }

    function button(text, action, className) {
        return $('<div class="selector"></div>').addClass(className || 'anime-taste__button').text(text).on('hover:enter', action);
    }

    function installCardButtons() {
        var detail = window.LampaYaniDetail;
        if (detail && detail.create && !detail.create.animeTaste) {
            var original = detail.create;
            detail.create = function (object, dependencies) {
                var deps = Object.assign({}, dependencies);
                var card = anime(object.card || object.data || object.object);
                var detailId = Number(object.yani_id || object.id || (card && card.id));
                deps.toCard = function (item) {
                    var rendered = dependencies.toCard(item);
                    var candidate = anime(rendered) || anime(item);
                    if (candidate && candidate.id === detailId) card = candidate;
                    return rendered;
                };
                var component = original.call(this, object, deps);
                var start = component.start;
                component.start = function () {
                    var actions = $(component.render()).find('.yani-detail__actions').first();
                    if (card && actions.length && !actions.find('.anime-taste__favorite').length) {
                        function isSelected() {
                            var saved = data();
                            return Boolean(saved.likes[card.id] || !saved.ignored[card.id] && card.accountFavorite);
                        }
                        var control = button(isSelected() ? '♥ В любимом' : '♡ В любимое', function () {
                            var liked = toggleFavorite(card, isSelected());
                            control.text(liked ? '♥ В любимом' : '♡ В любимое');
                        }, 'yani-detail__button anime-taste__favorite');
                        actions.prepend(control);
                    } else if (card) {
                        var saved = data();
                        actions.find('.anime-taste__favorite').text(saved.likes[card.id] || !saved.ignored[card.id] && card.accountFavorite ? '♥ В любимом' : '♡ В любимое');
                    }
                    return start.apply(this, arguments);
                };
                return component;
            };
            detail.create.animeTaste = true;
        }
    }

    function openTaste(mode, card) {
        Lampa.Activity.push({url: 'anime-taste', title: NAME, component: COMPONENT, tasteMode: mode, tasteCard: card});
    }

    function animationCard(movie) {
        var ids = movie.genre_ids || movie.genres_ids || [];
        var genres = movie.genres || movie.genre || [];
        if (Array.isArray(ids) && ids.some(function (id) { return Number(id) === 16; })) return true;
        if (typeof genres === 'string') genres = [genres];
        return Array.isArray(genres) && genres.some(function (genre) {
            return genre && (Number(genre.id) === 16 || /аниме|анимация|мультфильм|animation|anime/i.test(genre.name || genre.title || genre));
        });
    }

    function registerSearch() {
        if (!Lampa.Search || typeof Lampa.Search.addSource !== 'function') return;
        var timer, finishPrevious;
        Lampa.Search.addSource({
            title: NAME,
            params: {save: true, lazy: true},
            search: function (params, complete) {
                if (timer) clearTimeout(timer);
                if (finishPrevious) finishPrevious([]);
                var query = String(typeof params === 'string' ? params : params && (params.query || params.search || params.value || params.q) || '').replace(/\+/g, ' ').trim();
                try { query = decodeURIComponent(query); } catch (error) { /* Use the literal query. */ }
                if (query.length < 3 || !window.LampaYaniApi) { finishPrevious = null; complete([]); return; }
                var cancelled = false;
                var done = function (groups) {
                    if (cancelled) return;
                    cancelled = true;
                    if (finishPrevious === done) finishPrevious = null;
                    complete(groups);
                };
                finishPrevious = done;
                timer = setTimeout(function () {
                    searchCatalog(query, data().likes).then(function (matches) {
                        var results = matches.slice(0, 12).map(function (entry) {
                            var card = entry.card;
                            return {id: 'anime_taste_' + card.id, title: card.title, img: card.poster, poster: card.poster,
                                release_date: String(card.year || ''), vote_average: card.rating, tasteCard: card};
                        });
                        done(results.length ? [{title: NAME, type: 'anime', results: results, total: results.length, total_pages: 1}] : []);
                    }).catch(function () { done([]); });
                }, 400);
            },
            onSelect: function (params, close) {
                var card = params && params.element && params.element.tasteCard;
                if (!card) return;
                if (typeof close === 'function') close();
                openDetail(card);
            }
        });
    }

    function register() {
        if (window.animeTasteReady) return;
        window.animeTasteReady = true;
        Lampa.Component.add(COMPONENT, TastePage);
        registerSearch();
        var menu = $('<li class="menu__item selector" data-action="anime_taste"></li>');
        menu.append($('<div class="menu__ico anime-taste__icon" aria-hidden="true"></div>').text('♥'));
        menu.append($('<div class="menu__text"></div>').text(NAME));
        menu.on('hover:enter', function () { openTaste('recommendations'); });
        function mountMenu() {
            var target = $('.menu .menu__list').first();
            if (target.length && !target.find('[data-action="anime_taste"]').length) target.append(menu);
            installCardButtons();
        }
        mountMenu();
        Lampa.Listener.follow('activity', mountMenu);
        // Stable YummyAnime can finish loading after this extension.
        var attempts = 0;
        var timer = setInterval(function () {
            mountMenu();
            if (++attempts >= 20 || window.LampaYaniDetail && window.LampaYaniDetail.create.animeTaste) clearInterval(timer);
        }, 500);

        Lampa.Listener.follow('full', function (event) {
            var movie = event.data && event.data.movie;
            if (event.type !== 'complite' || !movie || !animationCard(movie)) return;
            var render = event.body || (event.object && event.object.activity && event.object.activity.render());
            var actions = $(render).find('.full-start-new__buttons, .full-start__buttons').first();
            if (!actions.length || actions.find('.anime-taste__lampa-favorite').length) return;
            var add = button('♡ В любимое аниме', function () { openTaste('mark', movie); }, 'full-start__button anime-taste__lampa-favorite');
            actions.prepend(add);
        });
        $('<style></style>').text([
            '.anime-taste{padding:1em 1.5em 2em}', '.anime-taste__icon{display:flex;align-items:center;justify-content:center;color:#ff91ad}',
            '.anime-taste__toolbar{display:flex;flex-wrap:wrap;margin-bottom:.8em}',
            '.anime-taste__button{background:#303748;color:#fff;border-radius:.45em;padding:.55em .8em;margin:.18em .45em .18em 0}',
            '.anime-taste__button.focus,.anime-taste__row.focus{background:#eef1f7;color:#162033;outline:0}',
            '.anime-taste__button.is-current{box-shadow:inset 0 -.18em #ff91ad}',
            '.anime-taste__message{opacity:.78;margin:.6em 0 1em;line-height:1.4}',
            '.anime-taste__row{display:flex;align-items:center;min-height:4.2em;background:#292d38;border-radius:.55em;margin:.45em 0;padding:.35em .65em}',
            '.anime-taste__image{width:2.5em;height:3.5em;object-fit:cover;border-radius:.18em;margin-right:.7em;background:#3a4052}',
            '.anime-taste__caption{min-width:0}', '.anime-taste__title{font-size:1.05em;font-weight:600}',
            '.anime-taste__meta,.anime-taste__reason{font-size:.79em;line-height:1.3;opacity:.8;margin-top:.18em}'
        ].join('\n')).appendTo('head');
    }

    function TastePage(object) {
        var page = this;
        var active = false;
        var destroyed = false;
        var ticket = 0;
        var lastStorageState;
        var mode = object.tasteMode || 'recommendations';
        var source = object.tasteCard;
        if ((mode === 'similar' || mode === 'mark') && !source) mode = 'recommendations';
        var query = '';
        var account = {favorites: [], excluded: {}, error: false};
        var focusId;
        var workspace = $('<div class="anime-taste"></div>');
        var toolbar = $('<div class="anime-taste__toolbar"></div>').appendTo(workspace);
        var message = $('<div class="anime-taste__message"></div>').appendTo(workspace);
        var results = $('<div class="anime-taste__results"></div>').appendTo(workspace);
        var scroll = new Lampa.Scroll({mask: true, over: true, step: 220});
        scroll.append(workspace);

        function focus() {
            if (!active || destroyed || Lampa.Controller.enabled().name !== 'content') return;
            Lampa.Controller.collectionSet(workspace);
            var selected = results.children().filter(function () { return $(this).data('tasteId') === focusId; }).first();
            Lampa.Controller.collectionFocus(selected.length ? selected[0] : false, workspace);
        }

        function drawToolbar() {
            toolbar.empty();
            button('Поиск аниме', input).toggleClass('is-current', mode === 'search' || mode === 'mark').appendTo(toolbar);
            button('Рекомендации', function () { show('recommendations'); }).toggleClass('is-current', mode === 'recommendations').appendTo(toolbar);
            button('Моё любимое', function () { show('favorites'); }).toggleClass('is-current', mode === 'favorites').appendTo(toolbar);
            if (Object.keys(data().hidden).length) button('Скрытые', function () { show('hidden'); }).toggleClass('is-current', mode === 'hidden').appendTo(toolbar);
        }

        function input() {
            if (!Lampa.Input || !Lampa.Input.edit) return Lampa.Noty.show('В этой сборке Lampa нет экранного ввода.');
            Lampa.Input.edit({title: 'Название аниме или название и год', value: query, free: true, nosave: true, nomic: true}, function (value) {
                query = String(value || '').trim();
                Lampa.Controller.toggle('content');
                if (query) show('search');
            });
        }

        function selectCard(card) {
            var saved = data();
            var selected = Boolean(byId(favorites(saved, account))[card.id]);
            var hidden = Boolean(saved.hidden[card.id]);
            Lampa.Select.show({title: card.title, items: [
                {title: 'Открыть в YummyAnime', action: function () { openDetail(card); }},
                {title: selected ? 'Убрать из моего любимого' : 'В любимое', action: function () {
                    var liked = toggleFavorite(card, selected);
                    Lampa.Noty.show(liked ? 'Добавлено в «Моё любимое»' : 'Убрано из «Моё любимое»');
                    if (mode === 'mark') { Lampa.Activity.backward(); return; }
                    refresh();
                }},
                {title: 'Похожие на этот тайтл', action: function () { openTaste('similar', card); }},
                {title: hidden ? 'Вернуть в рекомендации' : 'Скрыть из рекомендаций', action: function () {
                    var current = data();
                    if (hidden) delete current.hidden[card.id];
                    else current.hidden[card.id] = card;
                    Lampa.Storage.set(STORAGE, current);
                    refresh();
                }}
            ], onSelect: function (item) { item.action(); }, onBack: function () { Lampa.Controller.toggle('content'); }});
        }

        function row(card, reason) {
            var item = button('', function () { focusId = card.id; selectCard(card); }, 'anime-taste__row');
            item.data('tasteId', card.id);
            if (card.poster) item.append($('<img class="anime-taste__image" alt="">').attr('src', card.poster));
            var text = $('<div class="anime-taste__caption"></div>').appendTo(item);
            text.append($('<div class="anime-taste__title"></div>').text(card.title));
            text.append($('<div class="anime-taste__meta"></div>').text([card.year || '', card.type, card.rating > 0 ? '★ ' + card.rating.toFixed(1) : ''].filter(Boolean).join(' · ')));
            if (reason) text.append($('<div class="anime-taste__reason"></div>').text(reason));
            item.on('hover:focus', function () { scroll.update(item, true); });
            results.append(item);
        }

        function show(next) {
            mode = next;
            focusId = undefined;
            scroll.reset();
            refresh();
        }

        function refresh() {
            var current = ++ticket;
            var saved = data();
            lastStorageState = JSON.stringify(saved);
            var localLikes = favorites(saved, account);
            drawToolbar();
            results.empty();
            message.text('Загрузка…');
            focus();
            var accountRequest = mode === 'search' || mode === 'mark' || mode === 'hidden' ? Promise.resolve(account) : Promise.resolve().then(snapshot);
            accountRequest.then(function (profile) {
                if (current !== ticket || destroyed) return;
                account = profile;
                var likes = favorites(saved, account);
                var suffix = account.error ? ' Избранное аккаунта сейчас недоступно.' : '';
                if (mode === 'favorites' || mode === 'hidden') {
                    var cards = mode === 'favorites' ? likes : Object.keys(saved.hidden).map(function (id) { return saved.hidden[id]; });
                    message.text(cards.length ? (mode === 'favorites' ? 'Любимые тайтлы' + suffix : 'Скрытые тайтлы') : (mode === 'favorites' ? 'Выберите аниме в поиске и нажмите «В любимое».' + suffix : 'Скрытых тайтлов нет.'));
                    cards.forEach(function (card) { row(card); });
                    focus();
                    return;
                }
                if (mode === 'mark' || mode === 'search') {
                    var value = query;
                    if (mode === 'mark' && source) {
                        var year = String(source.first_air_date || source.release_date || '').slice(0, 4);
                        value = String(source.title || source.name || source.original_name || '') + (year ? ' ' + year : '');
                    }
                    if (!value) { message.text('Введите название аниме.'); return; }
                    return searchCatalog(value, byId(localLikes)).then(function (rows) {
                        if (current !== ticket || destroyed) return;
                        message.text(rows.length ? (mode === 'mark' ? 'Выберите нужный тайтл, затем «В любимое».' : 'Совпадения по запросу «' + value + '».') : 'Подходящих тайтлов нет. Попробуйте другое название.');
                        rows.slice(0, 24).forEach(function (entry) { row(entry.card); });
                        if (rows.length && mode === 'search' && rows[0].score >= 90) {
                            var best = rows[0].card;
                            button('Похожие на «' + best.title + '»', function () { openTaste('similar', best); }).appendTo(results);
                        }
                        focus();
                    });
                }
                if (!likes.length && mode !== 'similar') {
                    message.text('Добавьте любимое аниме, чтобы получить рекомендации.' + suffix);
                    return;
                }
                return suggest(likes, saved, account, mode === 'similar' ? source : null).then(function (rows) {
                    if (current !== ticket || destroyed) return;
                    message.text(rows.length ? (mode === 'similar' ? 'Похожие на «' + source.title + '».' : 'По вашим любимым тайтлам.' + suffix) : 'Новых совпадений пока нет.');
                    rows.slice(0, 25).forEach(function (entry) { row(entry.card, entry.reasons.join(' · ')); });
                    focus();
                });
            }).catch(function (error) {
                if (current !== ticket || destroyed) return;
                message.text(error && error.message || 'Не удалось загрузить данные.');
                button('Повторить', refresh).appendTo(results);
                focus();
            });
        }

        page.create = function () { refresh(); return page.render(); };
        page.render = function (native) { return scroll.render(native); };
        page.start = function () {
            active = true;
            Lampa.Controller.add('content', {
                toggle: focus,
                left: function () { if (window.Navigator.canmove('left')) window.Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right: function () { window.Navigator.move('right'); },
                up: function () { if (window.Navigator.canmove('up')) window.Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { window.Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
            if (lastStorageState !== JSON.stringify(data())) refresh();
        };
        page.pause = function () { active = false; };
        page.stop = page.pause;
        page.destroy = function () { destroyed = true; active = false; ticket++; scroll.destroy(); };
    }

    if (Lampa.Manifest) Lampa.Manifest.plugins = {type: 'other', version: '1.0.0', name: NAME, author: 'Nano',
        description: 'Личное избранное, точный поиск и объяснимые рекомендации аниме.'};
    if (window.appready) register();
    else Lampa.Listener.follow('app', function (event) { if (event.type === 'ready') register(); });
}(typeof window === 'undefined' ? {} : window));
