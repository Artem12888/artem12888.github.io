/* Аниме по вкусу 2.0.0 — персональные рекомендации для Lampa.
 * Каталог Manami: https://github.com/manami-project/anime-offline-database
 * Данные каталога распространяются по ODbL 1.0 и DbCL 1.0.
 */
(function (window) {
    'use strict';

    var NAME = 'Аниме по вкусу';
    var COMPONENT = 'anime_taste';
    var STORAGE = 'anime_taste_v1';
    var HISTORY = 'anime_taste_history_v2';
    var SYNOPSES = 'anime_taste_synopses_v2';
    var CATALOG = 'https://artem12888.github.io/anime-catalog-2.json';
    var GENRE = /^(action|adventure|comedy|drama|fantasy|horror|mystery|romance|sci fi|slice of life|sports|supernatural|thriller|psychological|historical|music|crime|suspense|mecha)$/;
    var WORLD = /world|fantasy|apocalyp|dystopi|cyberpunk|steampunk|space|magic|alchemy|alchemist|school|medieval|historical|isekai|future|virtual reality|parallel dimension|urban|rural|mytholog|military|empire|kingdom|demons?|vampire|outer space|robots?|superpowers?|alien/;
    var TONES = /coming of age|found family|time loop|time travel|time skip|character driven|tragedy|ensemble cast|redemption|revenge|survival|battle of wits|mind games|conspiracy|rivalry|politics|detective|murder|rebellion|tournament|family life|unrequited love|sacrifice|secret identity|memory manipulation|espionage|slow burn|episodic/;
    var VARIANTS = {'science fiction': 'sci fi', 'dystopian': 'dystopia', 'post apocalypse': 'post apocalyptic',
        'mind games': 'battle of wits', 'rivalries': 'rivalry', 'detectives': 'detective', 'demons': 'demon',
        'assassins': 'assassin', 'robots': 'robot', 'super powers': 'superpowers', 'super power': 'superpowers',
        'magic users': 'magic', 'psychological drama': 'psychological'};
    var LABEL = {'action':'экшен','adventure':'приключения','drama':'драма','fantasy':'фэнтези','sci fi':'фантастика',
        'supernatural':'сверхъестественное','romance':'романтика','comedy':'комедия','thriller':'триллер',
        'mystery':'загадка','slice of life':'повседневность','dark fantasy':'тёмное фэнтези','magic':'магия',
        'military':'военный сеттинг','alchemy':'алхимия','alternative world':'альтернативный мир','isekai':'исэкай',
        'urban fantasy':'городское фэнтези','dystopia':'антиутопия','post apocalyptic':'постапокалипсис',
        'battle of wits':'игра умов','revenge':'месть','coming of age':'взросление','found family':'обретённая семья',
        'conspiracy':'заговор','tragedy':'трагедия','survival':'выживание','redemption':'искупление',
        'time travel':'путешествия во времени','time loop':'временная петля','secret identity':'тайная личность',
        'detective':'расследование','politics':'политика','rivalry':'соперничество','espionage':'шпионаж',
        'contemporary fantasy':'современное фэнтези','epic fantasy':'эпическое фэнтези','school life':'школьная жизнь',
        'steampunk':'стимпанк','cyberpunk':'киберпанк','historical':'исторический сеттинг','urban':'город',
        'memory manipulation':'манипуляции с памятью','murder':'убийство','rebellion':'восстание',
        'crime fiction':'криминальная история','anti hero':'антигерой','antihero':'антигерой'};
    var STORY = [
        ['revenge', /\b(?:revenge|avenge[sd]?|vengeance|retribution)\b/],
        ['conspiracy', /\b(?:conspiracy|conspiracies|cover.up|secret organization|government plot)\b/],
        ['survival', /\b(?:survive|survival|fight for their lives|fight for his life)\b/],
        ['detective', /\b(?:detectives?|investigat(?:es?|ing|ion)|solve the case|unsolved)\b/],
        ['time travel', /\b(?:time travel|travel back in time|travels back in time|back to the past)\b/],
        ['time loop', /\b(?:time loop|repeats the same day|relive the same day)\b/],
        ['secret identity', /\b(?:secret identity|double life|hidden identity)\b/],
        ['espionage', /\b(?:espionage|undercover|secret agent|spy mission)\b/],
        ['rebellion', /\b(?:rebellion|uprising|overthrow|rebel forces)\b/],
        ['competition', /\b(?:competition|tournament|championship)\b/],
        ['memory manipulation', /\b(?:erased memories|memory loss|amnesia|lost (?:his|her|their) memories)\b/],
        ['journey', /\b(?:embarks? on a journey|sets? out on a journey|travels? across)\b/]
    ];
    var SETTING = [
        ['magic', /\b(?:magical?|sorcery|sorcerers?|spellcasting|wizards?|witchcraft)\b/],
        ['alchemy', /\b(?:alchemy|alchemists?|transmutation)\b/],
        ['alternative world', /\b(?:another world|alternate world|parallel universes?|otherworldly realm)\b/],
        ['post apocalyptic', /\b(?:post.apocalyptic|apocalypse|ruined civilization|collapse of civilization)\b/],
        ['virtual reality', /\b(?:virtual reality|trapped in a game|virtual world)\b/],
        ['military', /\b(?:military|armed forces|military academy|battalion)\b/],
        ['outer space', /\b(?:outer space|spaceships?|interstellar|space colony|space colonies)\b/],
        ['school life', /\b(?:high school|middle school|school students|school life)\b/],
        ['demon', /\b(?:demons?|demon king|demonic)\b/]
    ];
    var STOP = /^(?:about|after|again|also|along|already|always|among|around|because|before|being|between|could|does|during|everything|finds?|first|from|have|having|however|into|just|know|later|life|little|long|make|many|more|most|much|must|never|only|other|over|people|right|said|seems?|since|some|still|such|than|that|their|them|then|there|these|they|things?|this|those|through|time|together|under|upon|very|want|well|were|what|when|where|which|while|will|with|without|world|would|years?|young)$/;
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

    function property(object, key) {
        return Object.prototype.hasOwnProperty.call(object, key) ? object[key] : undefined;
    }

    function parseQuery(value) {
        var raw = String(value || '').trim().slice(0, 100);
        var yearMatch = raw.match(/(?:^|\s|\()(19\d{2}|20\d{2})\)?$/);
        var title = yearMatch && yearMatch.index > 0 ? raw.slice(0, yearMatch.index).trim() : raw;
        var year = title === raw ? 0 : Number(yearMatch[1]);
        var layout = /^[a-z\[\];'`,. ]{4,}$/i.test(title) ? keysInOtherLayout(title, KEY_EN, KEY_RU) : '';
        if (/^[а-яё ]{4,}$/i.test(title)) layout = keysInOtherLayout(title, KEY_RU, KEY_EN);
        var expanded = property(ABBREVIATIONS, clean(title));
        var layoutExpanded = property(ABBREVIATIONS, clean(layout));
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
        return {
            id: id, title: title.slice(0, 180), titles: unique([title].concat(titles, item.yani_titles || [])).slice(0, 24),
            mal: remoteMal(item),
            year: Number(item.yani_year || item.year || item.release_year || String(item.release_date || '').slice(0, 4)) || 0
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

    function maps() { return Object.create(null); }

    function remoteMal(card) {
        var ids = card.remote_ids || card.yani_remote_ids || {};
        return Number(card.mal || card.mal_id || ids.mal || ids.mal_id || ids.myanimelist || ids.myanimelist_id) || 0;
    }

    function tagKey(value) {
        var key = clean(value);
        return property(VARIANTS, key) || key;
    }

    function indexCatalog(raw) {
        var db = {cards: [], ids: maps(), names: maps(), frequency: maps(), tags: maps()};
        raw.data.forEach(function (row) {
            var titles = [row[1]].concat(row[7]);
            var names = unique(titles.map(normalTitle));
            var image = /^([0-9]+):(.+)$/.exec(row[6]);
            var card = {id: row[0], title: row[1], titles: titles, indexed: names, year: row[2], type: row[3],
                rating: row[4], kitsu: row[5], episodes: row[10],
                poster: image ? 'https://' + raw.imageHosts[Number(image[1])] + '/' + image[2] : '',
                tags: unique(row[8].map(function (id) { return tagKey(raw.tags[id]); })), related: row[9]};
            db.cards.push(card);
            db.ids[card.id] = card;
            names.forEach(function (name) { (db.names[name] || (db.names[name] = [])).push(card); });
            card.tags.forEach(function (tag) {
                db.frequency[tag] = (db.frequency[tag] || 0) + 1;
                (db.tags[tag] || (db.tags[tag] = [])).push(card);
            });
        });
        return db;
    }

    function catalogueSearch(db, text, likes) {
        var query = parseQuery(text);
        if (!query.variants.length) return [];
        function collect(aliases) {
            var cards = [];
            aliases.forEach(function (alias) { Array.prototype.push.apply(cards, db.names[alias] || []); });
            return cards;
        }
        var exact = rankSearch(query, collect(query.variants), likes);
        if (exact.length && exact[0].score >= 90) return exact.slice(0, 24);
        var raw = query.variants[0];
        var names = Object.keys(db.names);
        var eligible = names.filter(function (name) {
            return query.variants.some(function (variant) {
                return name.indexOf(variant) >= 0 || variant.length >= 4 && name.slice(0, 4).indexOf(variant.slice(0, 2)) >= 0;
            });
        });
        var result = rankSearch(query, collect(eligible), likes);
        if (!result.length && raw.length >= 5) {
            // Handle a typo in the first two letters without testing every alias with edit distance.
            var tail = raw.split(' ')[0].slice(-3);
            result = rankSearch(query, collect(names.filter(function (name) {
                return name.split(' ')[0].slice(-3) === tail;
            })), likes);
        }
        return result.slice(0, 24);
    }

    function matchCatalog(db, source) {
        if (!source) return null;
        if (source.media_type === 'movie' || source.method === 'movie' || source.original_title && !source.original_name &&
            (source.release_date && !source.first_air_date) && !source.anime_id && !source.yani_id) return null;
        var mal = remoteMal(source);
        if (mal && db.ids['m' + mal]) return db.ids['m' + mal];
        var names = [source.original_name, source.original_title, source.title, source.name].concat(source.titles || []);
        var year = Number(source.year || String(source.first_air_date || source.release_date || '').slice(0, 4));
        var exact = [];
        unique(names.map(normalTitle)).forEach(function (name) { exact = exact.concat(db.names[name] || []); });
        exact = uniqueCards(exact);
        var sameYear = exact.filter(function (card) { return card.year === year; });
        if (sameYear.length === 1) return sameYear[0];
        return exact.length === 1 && (!year || !exact[0].year || Math.abs(exact[0].year - year) <= 1) ? exact[0] : null;
    }

    function features(card, synopsis) {
        var genres = maps(), world = maps(), plot = maps(), themes = maps(), words = maps();
        card.tags.forEach(function (key) {
            if (GENRE.test(key)) genres[key] = 1;
            if (WORLD.test(key)) world[key] = 1;
            else if (TONES.test(key)) plot[key] = 1;
            else if (!GENRE.test(key)) themes[key] = 1;
        });
        var description = String(synopsis || '').replace(/\[[^\]]+\]/g, ' ').toLowerCase();
        STORY.forEach(function (rule) { if (rule[1].test(description)) plot[rule[0]] = 1; });
        SETTING.forEach(function (rule) { if (rule[1].test(description)) world[rule[0]] = 1; });
        clean(description).split(' ').forEach(function (word) {
            if (word.length < 5 || !/^[a-z]+$/.test(word) || STOP.test(word)) return;
            var stem = word.replace(/(?:ing|ed|es|s)$/, '');
            if (stem.length >= 4) words[stem] = 1;
        });
        return {genres: genres, world: world, plot: plot, themes: themes, words: words};
    }

    function overlap(left, right, rarity) {
        var total = 0, shared = [];
        var keys = Object.keys(left).concat(Object.keys(right).filter(function (key) { return !left[key]; }));
        keys.forEach(function (key) {
            if (!left[key] || !right[key]) return;
            var weight = rarity(key);
            shared.push({key: key, weight: weight});
            total += weight;
        });
        shared.sort(function (a, b) { return b.weight - a.weight; });
        return {score: keys.length ? total / keys.length : 0, shared: shared.map(function (row) { return row.key; })};
    }

    function explain(label, matches) {
        var safe = matches.filter(function (tag) { return !/ending|everybody dies|twist|sacrifice|finale/.test(tag); });
        return safe.length ? label + ' — ' + safe.slice(0, 3).map(tagLabel).join(', ') : '';
    }

    function tagLabel(word) { return property(LABEL, word) || word; }

    function compareTaste(seed, candidate, rarity) {
        var left = seed.features, right = candidate.features;
        var genres = overlap(left.genres, right.genres, rarity);
        var world = overlap(left.world, right.world, rarity);
        var plot = overlap(left.plot, right.plot, rarity);
        var themes = overlap(left.themes, right.themes, rarity);
        var words = overlap(left.words, right.words, function () { return 1; });
        var related = seed.card.related.indexOf(candidate.card.id) >= 0 || candidate.card.related.indexOf(seed.card.id) >= 0;
        var score = 0.18 * genres.score + 0.28 * world.score + 0.29 * plot.score + 0.25 * themes.score
            + Math.min(0.18, 2 * words.score) + (related ? 0.14 : 0);
        return {score: score, specific: world.shared.length + plot.shared.length + themes.shared.length + Number(related),
            reasons: [explain('Мир', world.shared), explain('Сюжет', plot.shared), explain('Темы', themes.shared),
                explain('Жанры', genres.shared), related ? 'Связано в каталоге' : ''].filter(Boolean)};
    }

    function rankTaste(db, seeds, candidates, descriptions) {
        function rarity(key) {
            return Math.min(1.65, 0.45 + Math.log((db.cards.length + 1) / ((db.frequency[key] || 0) + 1)) * 0.2);
        }
        var prepared = seeds.map(function (seed) {
            return {card: seed.card, features: features(seed.card, descriptions[seed.card.id]), weight: seed.weight};
        });
        var ranked = candidates.map(function (card) {
            var candidate = {card: card, features: features(card, descriptions[card.id])};
            var hits = prepared.map(function (seed) {
                var hit = compareTaste(seed, candidate, rarity);
                hit.seed = seed.card.title;
                hit.score *= seed.weight;
                return hit;
            }).filter(function (hit) { return hit.specific; }).sort(function (a, b) { return b.score - a.score; });
            if (!hits.length) return null;
            var primary = hits[0];
            var agreement = hits.slice(1, 4).reduce(function (sum, hit) { return sum + hit.score; }, 0);
            return {card: card, score: primary.score + 0.16 * agreement + 0.002 * card.rating,
                reasons: ['Похоже на «' + primary.seed + '»'].concat(primary.reasons.slice(0, 3))};
        }).filter(Boolean).sort(function (a, b) { return b.score - a.score || a.card.id.localeCompare(b.card.id); });
        // One entry per closely related set near the top leaves room for stories in other worlds.
        var diverse = [], deferred = [];
        ranked.forEach(function (entry) {
            var card = entry.card;
            var hasRelated = diverse.some(function (other) {
                return card.related.indexOf(other.card.id) >= 0 || other.card.related.indexOf(card.id) >= 0;
            });
            (hasRelated ? deferred : diverse).push(entry);
        });
        return diverse.slice(0, 18).concat(deferred.slice(0, 4), diverse.slice(18), deferred.slice(4));
    }

    function sufficient(road) {
        if (!road) return false;
        if (typeof road === 'number') return road >= 75;
        var time = Number(road.time || road.position) || 0;
        var duration = Number(road.duration) || 0;
        var percent = Number(road.percent || (duration ? 100 * time / duration : 0));
        return percent >= 75 || time >= 180 && percent >= 30 || !duration && time >= 480;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = {parseQuery: parseQuery, indexCatalog: indexCatalog, catalogueSearch: catalogueSearch,
            matchCatalog: matchCatalog, features: features, rankTaste: rankTaste, sufficient: sufficient};
        return;
    }

    var Lampa = window.Lampa;
    var $ = window.jQuery || window.$;
    if (!Lampa || !$ || window.animeTasteInstalled) return;
    window.animeTasteInstalled = true;
    var accountCache;
    var catalogRequest;
    var plotCache = maps();
    var nativeCache = maps();
    var activePlayback;
    var historyTimer;
    var historyIndex;

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
        return api && api.profile && api.userLists && api.normalize ? api : null;
    }

    function requestJson(url, timeout) {
        return new Promise(function (resolve, reject) {
            var xhr = new window.XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.timeout = timeout;
            xhr.onload = function () {
                if (xhr.status < 200 || xhr.status >= 300) return reject(new Error('HTTP ' + xhr.status));
                try { resolve(JSON.parse(xhr.responseText)); }
                catch (error) { reject(error); }
            };
            xhr.onerror = xhr.ontimeout = xhr.onabort = function () { reject(new Error('Сетевой запрос не завершился.')); };
            xhr.send();
        });
    }

    function catalog() {
        if (!catalogRequest) {
            catalogRequest = requestJson(CATALOG, 22000).then(function (raw) {
                if (raw.version !== 2 || !Array.isArray(raw.data)) throw new Error('Формат каталога изменился.');
                return indexCatalog(raw);
            }).catch(function () {
                catalogRequest = null;
                throw new Error('Не удалось загрузить каталог аниме. Повторите попытку.');
            });
        }
        return catalogRequest;
    }

    function searchIndependent(text, likes) {
        return catalog().then(function (db) { return catalogueSearch(db, text, likes); });
    }

    function reading(name) {
        var value = Lampa.Storage.get(name, {});
        if (typeof value === 'string') {
            try { value = JSON.parse(value); } catch (error) { value = {}; }
        }
        return value && typeof value === 'object' ? value : {};
    }

    function timelineFile() {
        return Lampa.Timeline && typeof Lampa.Timeline.filename === 'function' ? Lampa.Timeline.filename() : 'file_view';
    }

    function historyFile() { return HISTORY + timelineFile().slice('file_view'.length); }

    function nativeKey(source) {
        if (!source || !source.id) return '';
        var kind = source.original_name || source.first_air_date || source.name && !source.title ? 'tv' : 'movie';
        var provider = String(source.source || 'tmdb');
        return ((provider === 'tmdb' || provider === 'cub' ? '' : provider + '_') + kind + '_' + source.id)
            .toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 64);
    }

    function isAnimeCandidate(source) {
        if (!source) return false;
        if (source.media_type === 'movie' || source.method === 'movie') return false;
        if (source.yani_id || source.anime_id || remoteMal(source)) return true;
        if (source.original_title && !source.original_name) return false;
        if (source.original_language && source.original_language !== 'ja') return false;
        var country = source.origin_country;
        if (Array.isArray(country) && country.length && country.indexOf('JP') < 0) return false;
        return animationCard(source);
    }

    function nativeCard(source) {
        var key = nativeKey(source);
        if (!key) return null;
        return {id: source.id, source: source.source || 'tmdb',
            method: key.indexOf('tv_') >= 0 ? 'tv' : 'movie',
            title: String(source.name || source.title || source.original_name || source.original_title || '').slice(0, 180)};
    }

    function savedHistory() { return reading(historyFile()); }

    function storeViews(db, file, events) {
        if (historyFile() !== file) return;
        var watched = reading(file), changed = false;
        events.forEach(function (event) {
            var card = event.card || matchCatalog(db, event.source);
            if (!card || !sufficient(event.road)) return;
            var old = watched[card.id];
            var stamp = Number(event.stamp) || (old ? old.last : Date.now());
            var position = typeof event.road === 'number' ? event.road :
                Number(event.road.percent) || 100 * Number(event.road.time || 0) / (Number(event.road.duration) || Infinity);
            position = Math.max(0, Math.min(100, position));
            var native = event.native && nativeCard(event.source);
            var previous = old || {last: 0, percent: 0};
            var next = {last: Math.max(previous.last, stamp), percent: Math.max(previous.percent, Math.round(position)),
                native: native || previous.native || null, yani: event.yani || previous.yani || 0, title: card.title};
            if (old && JSON.stringify(old) === JSON.stringify(next)) return;
            watched[card.id] = next;
            changed = true;
        });
        if (changed) Lampa.Storage.set(file, watched);
    }

    function getFavorites(type) {
        try {
            var rows = Lampa.Favorite && Lampa.Favorite.get({type: type});
            return Array.isArray(rows) ? rows : [];
        } catch (error) { return []; }
    }

    function consolidateHistory(db) {
        var file = historyFile();
        var cache = historyIndex && historyIndex.file === file ? historyIndex.cards : maps();
        historyIndex = {file: file, cards: cache};
        var events = [];
        var timeline = reading(timelineFile()), keyed = maps();
        Object.keys(timeline).forEach(function (hash) {
            var road = timeline[hash];
            if (!road || !road.card || !sufficient(road)) return;
            var prior = keyed[road.card];
            if (!prior || Number(road.updated || 0) >= Number(prior.updated || 0)) keyed[road.card] = road;
        });
        var viewed = getFavorites('viewed');
        var explicit = maps();
        viewed.forEach(function (source) { explicit[nativeKey(source)] = true; });
        getFavorites('history').concat(viewed).forEach(function (source) {
            if (!isAnimeCandidate(source)) return;
            var key = nativeKey(source);
            var card = matchCatalog(db, source);
            if (!key || !card) return;
            cache[key] = {source: source, card: card};
            if (explicit[key]) events.push({source: source, card: card, road: {percent: 100}, native: true});
        });
        Object.keys(cache).forEach(function (key) {
            var cached = cache[key];
            var road = keyed[key];
            var source = cached.source;
            var original = source.original_name || source.original_title;
            // Older Lampa saves contain only a hash. Match historical season-one keys without touching the timeline.
            if (!road && original && Lampa.Utils && typeof Lampa.Utils.hash === 'function') {
                for (var episode = 1; episode <= 24; episode++) {
                    var candidate = timeline[Lampa.Utils.hash('1' + episode + original)];
                    if (sufficient(candidate) && (!road || Number(candidate.updated || 0) >= Number(road.updated || 0))) road = candidate;
                }
            }
            if (road) events.push({source: source, card: cached.card, road: road, stamp: road.updated, native: true});
        });
        var supplemental = reading('yani_playback_history');
        Object.keys(supplemental).forEach(function (id) {
            var row = supplemental[id];
            if (!row) return;
            var finished = Object.keys(row.finished_episodes || {}).some(function (episode) { return Boolean(row.finished_episodes[episode]); });
            var source = Object.assign({anime_id: Number(id) || 0}, row.card || row);
            events.push({source: source, road: finished ? {percent: 100} : row,
                stamp: row.updated_at, yani: /^\d+$/.test(id) ? Number(id) : 0});
        });
        storeViews(db, file, events);
        return reading(file);
    }

    function scheduleHistory() {
        if (historyTimer) clearTimeout(historyTimer);
        historyTimer = setTimeout(function () {
            historyTimer = null;
            // Catalogue and history are initialized when Lampa is ready, independently of the recommendations page.
            catalog().then(consolidateHistory).catch(function () {});
        }, 500);
    }

    function preferences(db, saved, account) {
        var likes = maps(), hidden = maps(), ignored = maps(), supplemental = maps();
        function convert(card) {
            return db.ids[card.id] || matchCatalog(db, card);
        }
        function apply(rows, target, asFavorite) {
            Object.keys(rows).forEach(function (key) {
                var original = rows[key];
                if (!original || typeof original !== 'object') return;
                var card = convert(original);
                if (!card) return;
                target[card.id] = asFavorite ? (Number(original.added) || 1) : true;
                if (/^\d+$/.test(String(original.id))) supplemental[card.id] = Number(original.id);
            });
        }
        apply(saved.likes, likes, true);
        apply(saved.hidden, hidden, false);
        Object.keys(saved.ignored).forEach(function (key) {
            if (db.ids[key]) ignored[key] = true;
        });
        account.favorites.forEach(function (original) {
            var card = convert(original);
            if (card && !ignored[card.id] && !saved.ignored[original.id]) {
                if (!likes[card.id]) likes[card.id] = 1;
                supplemental[card.id] = original.id;
            }
        });
        // Suppressing a legacy favorite must also suppress its canonical record.
        Object.keys(supplemental).forEach(function (id) {
            if (ignored[id] && likes[id] === 1) delete likes[id];
        });
        return {likes: likes, hidden: hidden, supplemental: supplemental};
    }

    function compactPreference(card, stamp) {
        return {id: card.id, title: card.title, year: card.year, added: stamp};
    }

    function setPreference(db, card, field, enabled) {
        var saved = data();
        Object.keys(saved[field]).forEach(function (id) {
            var old = saved[field][id];
            var match = old && typeof old === 'object' && matchCatalog(db, old);
            if (id === card.id || match && match.id === card.id) delete saved[field][id];
        });
        if (enabled) saved[field][card.id] = compactPreference(card, Date.now());
        if (field === 'likes') {
            if (enabled) {
                delete saved.ignored[card.id];
                delete saved.hidden[card.id];
            } else saved.ignored[card.id] = true;
        }
        Lampa.Storage.set(STORAGE, saved);
    }

    function synopsis(card) {
        if (!card.kitsu) return Promise.resolve('');
        if (!plotCache[card.id]) {
            var saved = reading(SYNOPSES)[card.id];
            if (saved && saved.when > Date.now() - 60 * 24 * 60 * 60 * 1000) return Promise.resolve(saved.text);
            plotCache[card.id] = requestJson('https://kitsu.app/api/edge/anime/' + card.kitsu, 4500).then(function (payload) {
                var text = String(payload.data && payload.data.attributes && payload.data.attributes.synopsis || '').slice(0, 3200);
                if (text) {
                    var all = reading(SYNOPSES);
                    all[card.id] = {text: text, when: Date.now()};
                    Object.keys(all).sort(function (a, b) { return all[b].when - all[a].when; })
                        .slice(80).forEach(function (id) { delete all[id]; });
                    Lampa.Storage.set(SYNOPSES, all, true);
                }
                delete plotCache[card.id];
                return text;
            }).catch(function () {
                delete plotCache[card.id];
                return '';
            });
        }
        return plotCache[card.id];
    }

    function independentSuggestions(db, prefs, watch, source, progress) {
        var order = Object.keys(prefs.likes).sort(function (a, b) { return prefs.likes[b] - prefs.likes[a]; });
        var watched = Object.keys(watch).filter(function (id) { return db.ids[id]; }).sort(function (a, b) {
            return watch[b].last - watch[a].last;
        });
        var seeds = source ? [{card: source, weight: 1}] : unique(order.slice(0, 4).concat(watched.slice(0, 7))).slice(0, 9)
            .map(function (id) {
                var viewing = watch[id];
                return {card: db.ids[id], weight: prefs.likes[id] ? 1 : viewing.percent >= 75 ? 0.77 : 0.58};
            });
        if (!seeds.length) return Promise.resolve([]);
        var excluded = maps();
        order.concat(watched, Object.keys(prefs.hidden)).forEach(function (id) { excluded[id] = true; });
        if (source) excluded[source.id] = true;
        var scores = maps();
        seeds.forEach(function (seed) {
            var tags = seed.card.tags.filter(function (tag) {
                return !GENRE.test(tag) && (db.frequency[tag] || 0) > 3;
            }).sort(function (a, b) {
                return db.frequency[a] - db.frequency[b];
            }).slice(0, 18);
            var common = seed.card.tags.filter(function (tag) { return GENRE.test(tag); }).slice(0, 5);
            tags.concat(common).forEach(function (tag) {
                var weight = GENRE.test(tag) ? 0.12 : 1 + Math.log(db.cards.length / db.frequency[tag]);
                db.tags[tag].forEach(function (candidate) {
                    if (!excluded[candidate.id]) scores[candidate.id] = (scores[candidate.id] || 0) + seed.weight * weight;
                });
            });
            seed.card.related.forEach(function (id) {
                if (db.ids[id] && !excluded[id]) scores[id] = (scores[id] || 0) + seed.weight * 8;
            });
        });
        var candidates = Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; }).slice(0, 200)
            .map(function (id) { return db.ids[id]; });
        var descriptions = maps();
        var preliminary = rankTaste(db, seeds, candidates, descriptions);
        progress(preliminary);
        // Refine the top results with descriptions; the open dataset is sufficient if Kitsu is unavailable.
        var shortlist = uniqueCards(seeds.slice(0, 4).map(function (seed) { return seed.card; })
            .concat(preliminary.slice(0, 8).map(function (entry) { return entry.card; })));
        var synopsisQueue = shortlist.slice();
        function nextSynopsis() {
            var card = synopsisQueue.shift();
            if (!card) return Promise.resolve();
            return synopsis(card).then(function (description) {
                if (description) descriptions[card.id] = description;
                return nextSynopsis();
            });
        }
        return Promise.all([nextSynopsis(), nextSynopsis(), nextSynopsis(), nextSynopsis()]).then(function () {
            return Object.keys(descriptions).length ? rankTaste(db, seeds, candidates, descriptions) : preliminary;
        });
    }

    function sourceFromLampa(card, entry) {
        if (entry && entry.native) return Promise.resolve(entry.native);
        if (!Lampa.Api || !Lampa.Api.search) return Promise.resolve(null);
        if (!nativeCache[card.id]) {
            nativeCache[card.id] = new Promise(function (resolve) {
                var timer = setTimeout(function () { resolve(null); }, 8500);
                var query = card.titles.filter(function (title) { return /^[\x20-\x7e]+$/.test(title); })[0] || card.title;
                Lampa.Api.search({query: query}, function (data) {
                    clearTimeout(timer);
                    var group = Array.isArray(data) ? data.filter(function (item) { return item.type === 'tv'; })[0] : data && data.tv;
                    var results = group && group.results || [];
                    var exact = results.filter(function (source) {
                        return isAnimeCandidate(source) && Number(String(source.first_air_date || '').slice(0, 4)) === card.year &&
                            [source.original_name, source.name].map(normalTitle).some(function (title) { return card.indexed.indexOf(title) >= 0; });
                    });
                    resolve(exact.length === 1 ? nativeCard(exact[0]) : null);
                });
            }).then(function (native) {
                if (!native) delete nativeCache[card.id];
                return native;
            });
        }
        return nativeCache[card.id];
    }

    function openNative(card, entry) {
        sourceFromLampa(card, entry).then(function (source) {
            if (!source) return Lampa.Noty.show('Карточка Lampa не найдена. Попробуйте поиск по названию.');
            Lampa.Activity.push({component: 'full', id: source.id, method: source.method,
                source: source.source, title: source.title || card.title});
        }).catch(function () { Lampa.Noty.show('Не удалось открыть карточку.'); });
    }

    function rememberPlayback(play) {
        if (!play || !play.source || !sufficient(play.timeline)) return;
        var road = {percent: play.timeline.percent, time: play.timeline.time, duration: play.timeline.duration};
        catalog().then(function (db) {
            var card = matchCatalog(db, play.source);
            if (!card) return;
            var key = nativeKey(play.source);
            if (key && !play.yani && historyIndex && historyIndex.file === play.file) {
                historyIndex.cards[key] = {source: play.source, card: card};
            }
            storeViews(db, play.file, [{source: play.source, card: card, road: road,
                stamp: play.stamp, native: !play.yani, yani: play.yani}]);
        }).catch(function () {});
    }

    function monitorHistory() {
        var player = Lampa.Player && Lampa.Player.listener;
        if (player) {
            player.follow('start', function (event) {
                var data = event && (event.card ? event : event.data);
                if (!data || !isAnimeCandidate(data.card)) { activePlayback = null; return; }
                var card = data.card;
                activePlayback = {source: card, timeline: data.timeline, stamp: Date.now(), file: historyFile(),
                    yani: Number(card.yani_id || card.anime_id) || 0};
            });
            player.follow('destroy', function () {
                rememberPlayback(activePlayback);
                activePlayback = null;
            });
            player.follow('close', scheduleHistory);
        }
        if (Lampa.Timeline && Lampa.Timeline.listener) {
            Lampa.Timeline.listener.follow('update', function () {
                rememberPlayback(activePlayback);
                scheduleHistory();
            });
            Lampa.Timeline.listener.follow('read', scheduleHistory);
        }
        if (Lampa.Favorite && Lampa.Favorite.listener) {
            ['add', 'added'].forEach(function (type) {
                Lampa.Favorite.listener.follow(type, function (event) {
                    if (event && (event.where === 'history' || event.where === 'viewed')) scheduleHistory();
                });
            });
        }
        if (Lampa.Storage.listener) Lampa.Storage.listener.follow('change', function (event) {
            if (event && event.name === 'yani_playback_history') scheduleHistory();
        });
        scheduleHistory();
    }

    function snapshot() {
        var auth = window.LampaYaniAuth;
        var saved = auth && auth.get ? auth.get() : {};
        var api = publicApi();
        if (!api || !saved || !saved.token) return Promise.resolve({favorites: []});
        var identity = String(saved.user_id || saved.login || '');
        if (identity && accountCache && accountCache.identity === identity && accountCache.until > Date.now()) return accountCache.promise;
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
            rows.forEach(function (item) {
                var card = anime(item);
                if (!card) return;
                var list = item.user && item.user.list || item.user_list || item.list_state || {};
                if (list.is_fav || list.is_favorite || list.favorite) favorites.push(card);
            });
            return {favorites: favorites};
        }).catch(function () {
            accountCache = null;
            return {favorites: []};
        });
        accountCache = {identity: identity, until: Date.now() + 120000, promise: promise};
        return promise;
    }

    function openDetail(card) {
        Lampa.Activity.push({component: 'yani_detail', id: card.id, yani_id: card.id, title: card.title,
            url: 'yani/detail/' + card.id, card: {yani_id: card.id, title: card.title, yani_titles: card.titles, poster: card.poster,
                img: card.poster, release_date: String(card.year || ''), yani_rating: card.rating}});
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
                        var control = button('♡ В любимое аниме', function () {
                            openTaste('mark', card);
                        }, 'yani-detail__button anime-taste__favorite');
                        actions.prepend(control);
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
                if (query.length < 3) { finishPrevious = null; complete([]); return; }
                var cancelled = false;
                var done = function (groups) {
                    if (cancelled) return;
                    cancelled = true;
                    if (finishPrevious === done) finishPrevious = null;
                    complete(groups);
                };
                finishPrevious = done;
                timer = setTimeout(function () {
                    searchIndependent(query, data().likes).then(function (matches) {
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
                openTaste('card', card);
            }
        });
    }

    function register() {
        if (window.animeTasteReady) return;
        window.animeTasteReady = true;
        Lampa.Component.add(COMPONENT, TastePage);
        registerSearch();
        monitorHistory();
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
            if (event.type !== 'complite' || !movie || !isAnimeCandidate(movie)) return;
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
        if ((mode === 'similar' || mode === 'mark' || mode === 'card') && !source) mode = 'recommendations';
        var query = '';
        var account = {favorites: []};
        var db, prefs, watch;
        var accountRequested = false;
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
            button('История аниме', function () { show('history'); }).toggleClass('is-current', mode === 'history').appendTo(toolbar);
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
            var selected = Boolean(prefs.likes[card.id]);
            var hidden = Boolean(prefs.hidden[card.id]);
            var entry = watch[card.id];
            var yummy = prefs.supplemental[card.id] || entry && entry.yani;
            var items = [
                {title: 'Открыть карточку Lampa', action: function () { openNative(card, entry); }},
                {title: selected ? 'Убрать из моего любимого' : 'В любимое', action: function () {
                    setPreference(db, card, 'likes', !selected);
                    Lampa.Noty.show(selected ? 'Убрано из «Моё любимое»' : 'Добавлено в «Моё любимое»');
                    if (mode === 'mark') { Lampa.Activity.backward(); return; }
                    refresh();
                }},
                {title: 'Похожие на этот тайтл', action: function () { openTaste('similar', card); }},
                {title: hidden ? 'Вернуть в рекомендации' : 'Скрыть из рекомендаций', action: function () {
                    setPreference(db, card, 'hidden', !hidden);
                    refresh();
                }}
            ];
            if (mode !== 'card') items.push({title: 'Описание и темы', action: function () { openTaste('card', card); }});
            if (yummy && window.LampaYaniDetail) items.push({
                title: 'Открыть в YummyAnime', action: function () { openDetail(Object.assign({}, card, {id: yummy})); }
            });
            Lampa.Select.show({title: card.title, items: items,
                onSelect: function (item) { item.action(); }, onBack: function () { Lampa.Controller.toggle('content'); }});
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
            lastStorageState = JSON.stringify([saved, savedHistory()]);
            drawToolbar();
            results.empty();
            message.text('Загрузка…');
            focus();
            if (!accountRequested && publicApi() && (mode === 'recommendations' || mode === 'favorites')) {
                accountRequested = true;
                snapshot().then(function (profile) {
                    account = profile;
                    if (profile.favorites.length && !destroyed && (mode === 'recommendations' || mode === 'favorites')) refresh();
                }).catch(function () {});
            }
            catalog().then(function (library) {
                if (current !== ticket || destroyed) return;
                db = library;
                prefs = preferences(db, saved, account);
                watch = consolidateHistory(db);
                lastStorageState = JSON.stringify([saved, watch]);
                if (mode === 'favorites' || mode === 'hidden' || mode === 'history') {
                    var listing = mode === 'favorites' ? prefs.likes : mode === 'hidden' ? prefs.hidden : watch;
                    var ids = Object.keys(listing).filter(function (id) { return db.ids[id]; });
                    if (mode === 'favorites') ids.sort(function (a, b) { return listing[b] - listing[a]; });
                    if (mode === 'history') ids.sort(function (a, b) { return listing[b].last - listing[a].last; });
                    var empty = {favorites: 'Выберите аниме в поиске и нажмите «В любимое».',
                        hidden: 'Скрытых аниме пока нет.', history: 'История пока пуста. Здесь появится аниме с сохранённым прогрессом.'};
                    message.text(ids.length ? 'Тайтлов в списке — ' + ids.length : empty[mode]);
                    function listFrom(start) {
                        ids.slice(start, start + 50).forEach(function (id) {
                            row(db.ids[id], mode === 'history' && watch[id].percent ? 'Прогресс эпизода — ' + watch[id].percent + '%' : '');
                        });
                        if (start + 50 < ids.length) {
                            var more = button('Показать ещё', function () {
                                more.remove();
                                focusId = ids[start + 50];
                                listFrom(start + 50);
                            }).appendTo(results);
                        }
                        focus();
                    }
                    listFrom(0);
                    return;
                }
                if (mode === 'card') {
                    row(source);
                    synopsis(source).then(function (description) {
                        if (description && current === ticket && !destroyed) message.text(description);
                    });
                    message.text(source.tags.slice(0, 6).map(tagLabel).join(' · '));
                    focus();
                    return;
                }
                if (mode === 'mark' || mode === 'search') {
                    var exact = mode === 'mark' && matchCatalog(db, source);
                    if (exact) {
                        var selected = Boolean(prefs.likes[exact.id]);
                        message.text(exact.title);
                        button(selected ? '♥ Убрать из любимого' : '♡ В любимое', function () {
                            setPreference(db, exact, 'likes', !selected);
                            Lampa.Noty.show(selected ? 'Убрано из «Моё любимое»' : 'Добавлено в «Моё любимое»');
                            Lampa.Activity.backward();
                        }).appendTo(results);
                        focus();
                        return;
                    }
                    var value = query;
                    if (mode === 'mark' && source) {
                        var year = source.year || String(source.first_air_date || source.release_date || '').slice(0, 4);
                        value = String(source.title || source.name || source.original_name || '') + (year ? ' ' + year : '');
                    }
                    if (!value) { message.text('Введите название аниме.'); return; }
                    var matches = catalogueSearch(db, value, prefs.likes);
                    message.text(matches.length ? (mode === 'mark' ? 'Выберите аниме и нажмите «В любимое».' : 'Совпадения по запросу «' + value + '».') : 'Подходящих аниме нет. Попробуйте другое название.');
                    matches.forEach(function (entry) { row(entry.card); });
                    if (matches.length && mode === 'search' && matches[0].score >= 90) {
                        var best = matches[0].card;
                        button('Похожие на «' + best.title + '»', function () { openTaste('similar', best); }).appendTo(results);
                    }
                    focus();
                    return;
                }
                if (!Object.keys(prefs.likes).length && !Object.keys(watch).length && mode !== 'similar') {
                    message.text('Посмотрите аниме в Lampa или отметьте любимые тайтлы, чтобы получить рекомендации.');
                    return;
                }
                function showRecommendations(rows) {
                    if (current !== ticket || destroyed) return;
                    results.empty();
                    message.text(rows.length ? (mode === 'similar' ? 'Похожие на «' + source.title + '».' : 'По истории и избранному.') : 'Новых совпадений пока нет.');
                    rows.slice(0, 25).forEach(function (entry) { row(entry.card, entry.reasons.join(' · ')); });
                    focus();
                }
                return independentSuggestions(db, prefs, watch, mode === 'similar' ? source : null,
                    showRecommendations).then(showRecommendations);
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
            if (lastStorageState !== JSON.stringify([data(), savedHistory()])) refresh();
        };
        page.pause = function () { active = false; };
        page.stop = page.pause;
        page.destroy = function () { destroyed = true; active = false; ticket++; scroll.destroy(); };
    }

    if (Lampa.Manifest) Lampa.Manifest.plugins = {type: 'other', version: '2.0.0', name: NAME, author: 'Nano',
        description: 'Локальная история, избранное, поиск и рекомендации аниме по миру, сюжету и жанрам.'};
    if (window.appready) register();
    else Lampa.Listener.follow('app', function (event) { if (event.type === 'ready') register(); });
}(typeof window === 'undefined' ? {} : window));
