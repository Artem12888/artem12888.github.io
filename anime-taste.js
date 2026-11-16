/* Аниме по вкусу 3.3.0 — персональные рекомендации для Lampa.
 * Каталог: https://github.com/cedya77/anime-offline-database
 * Данные каталога распространяются по ODbL 1.0 и DbCL 1.0.
 */
(function (window) {
    'use strict';

    var NAME = 'Аниме по вкусу';
    var COMPONENT = 'anime_taste';
    var STORAGE = 'anime_taste_v1';
    var HISTORY = 'anime_taste_history_v2';
    var SYNOPSES = 'anime_taste_synopses_v2';
    var ASSET_HOST = 'https://artem12888.github.io/';
    var ASSET_MIRROR = 'https://cdn.jsdelivr.net/gh/Artem12888/artem12888.github.io@main/';
    var ASSET_RAW = 'https://raw.githubusercontent.com/Artem12888/artem12888.github.io/main/';
    var CATALOG = ASSET_HOST + 'anime-catalog-3.json';
    var STORY_INDEX = ASSET_HOST + 'anime-story-3.json';
    var GENRE = /^(action|adventure|comedy|drama|fantasy|horror|mystery|romance|sci fi|slice of life|sports|supernatural|thriller|psychological|historical|music|crime|suspense|mecha|ecchi)$/;
    var WORLD = /world|fantasy|apocalyp|dystopi|cyberpunk|steampunk|space|magic|alchemy|alchemist|school|medieval|historical|isekai|future|virtual reality|parallel dimension|urban|rural|mytholog|military|empire|kingdom|demons?|vampire|outer space|robots?|superpowers?|alien|^folklore$|^supernatural$/;
    var TONES = /coming of age|found family|time loop|time travel|time skip|character driven|tragedy|ensemble cast|redemption|revenge|survival|battle of wits|mind games|conspiracy|rivalry|politics|detective|murder|rebellion|tournament|family life|unrequited love|sacrifice|secret identity|memory manipulation|espionage|slow burn|episodic/;
    var MOOD = /^(comedy|drama|thriller|horror|psychological|slice of life(?: drama)?|dark fantasy|action comedy|supernatural (?:drama|thriller)|romantic comedy|slapstick|parody|heartwarming|wholesome|melancholy|nostalgia|iyashikei|angst|tragedy|surreal comedy|black comedy|grimdark|suspense|ecchi|episodic)$/;
    var CHARACTERS = /protagonist|ensemble cast|strong (?:female|male) lead|anti ?hero|found family|friendship|mentor|siblings|rivalry|kuudere|tsundere|underdog|overpowered|harem|classmates/;
    var FOCUS = {
        all: 'Похожие на этот тайтл', world: 'Похожий мир', plot: 'Похожий сюжет',
        mood: 'Такая же атмосфера', characters: 'Похожие персонажи'
    };
    var DIMENSIONS = {
        all: [0.19, 0.23, 0.22, 0.16, 0.11, 0.09],
        world: [0.08, 0.61, 0.14, 0.10, 0.04, 0.03],
        plot: [0.06, 0.15, 0.54, 0.16, 0.05, 0.04],
        mood: [0.13, 0.08, 0.10, 0.08, 0.55, 0.06],
        characters: [0.08, 0.11, 0.10, 0.08, 0.07, 0.56]
    };
    var MOTIFS = [
        [/^school$|school life|boarding school|academy|high school|school club/, /^supernatural$|^magic$|^demon$|^urban fantasy$|angel/, /^action$|fighting|battle|combat/],
        [/^harem$|female harem|male harem/, /^comedy$|^ecchi$|romcom/, /^supernatural$|^magic$|^demon$|^urban fantasy$/],
        [/^school$|school life|boarding school|academy|high school/, /^harem$|female harem|male harem/, /^action$|fighting|battle|combat/],
        [/battle of wits|^psychological$|^detective$/, /crime|conspiracy|secret identity/, /suspense|thriller|mystery/],
        [/post apocaly|^dystopia$|isolated society/, /survival|rebellion|^military$/, /^action$|thriller|mystery/],
        [/^slice of life$|^daily life$|iyashikei/, /friendship|found family|coming of age/, /wholesome|heartwarming|^comedy$/],
        [/competition|tournament|^sports$/, /teamwork|rivalry|underdog/, /coming of age|^comedy$|^drama$/],
        [/^sports$/, /^team sport|teamwork/, /competition|tournament|^school|high school/],
        [/folklore|mytholog|youkai|yokai|^spirits?$/, /episodic|slice of life|iyashikei/, /supernatural|^mystery$/],
        [/^psychological$|battle of wits/, /moral|judge|justice|law and order|social commentary/, /^supernatural$|^thriller$|^mystery$/],
        [/time travel|time loop/, /revenge|redemption|detective|conspiracy/, /drama|psychological|thriller|mystery/],
        [/^isekai$|alternative world|fantasy world/, /found family|^journey$|^adventure$/, /^magic$|mytholog|^demon$/]
    ];
    // Weighted anchor evidence identifies the premise across synonymous catalogue tags.
    var PREMISES = [
        {label:'петли и путешествия во времени', anchors:[/^time (?:travel|loop|machine|manipulation)$/, /^sci fi$|parallel (?:world|universe|dimension)|different timelines/],
            context:[/^sci fi$|^time manipulation$/, /^psychological$|^thriller$|^mystery$/, /^drama$|tragedy|romance/], minimum:2, emphasis:1.35},
        {label:'музыка и выступления', anchors:[/^music$|rock music|^idol$/, /^band$|^bands$|musical band|orchestra|musical performance|performing arts|music club/],
            context:[/^school$|high school|school club|coming of age/, /female protagonist|primarily female cast|cute girls doing cute things/, /^slice of life$|^comedy$|iyashikei/], minimum:2},
        {label:'преступления и расследования', anchors:[/^crime$|crime fiction|^detective$|^police$/, /battle of wits|serial killer|conspiracy|detective|investigation/, /^psychological$|^mystery$|^thriller$/],
            context:[/^psychological$|^thriller$|^mystery$/, /morality|justice|tragedy|philosophy|psychological/, /protagonist|ensemble cast|anti ?hero/], minimum:3, emphasis:1.16},
        {label:'выживание и масштабный конфликт', anchors:[/^war$|military|rebellion|warfare|political conflict/,
            /post apocaly|dystopi|^survival$|isolated society/, /^action$|combat|swordplay/, /^fantasy$|^supernatural$|superpowers|body horror/],
            context:[/tragedy|conspiracy|politics|revenge|^thriller$/, /monster|demon|^magic$|^superpowers$|body horror/], minimum:4, emphasis:1.23},
        {label:'суеверия и легенды', anchors:[/^folklore$|mytholog|youkai|yokai|^spirits?$/, /episodic|iyashikei|^slice of life$|^supernatural$/],
            context:[/^supernatural$|^fantasy$|ghost|youkai/, /episodic|^slice of life$|iyashikei/, /rural|travel|historical|^mystery$|^drama$/], minimum:2},
        {label:'командные соревнования', anchors:[/^sports$|team sport|volleyball|basketball|baseball/, /team sport|teamwork|rivalry|tournament|competition/],
            context:[/school|coming of age/, /male protagonist|ensemble cast|primarily male/, /^drama$|^comedy$/], minimum:2},
        {label:'школа и сверхъестественные сражения', anchors:[/school|academy/, /magic|^demon$|^urban fantasy$|^supernatural$/, /^action$|combat|fighting/],
            context:[/^action$|combat|fighting/, /^ecchi$|harem|^comedy$/, /^magic$|demons|^urban fantasy$|angels/], minimum:3},
        {label:'сверхъестественные сражения и гаремная комедия', anchors:[/school|academy/, /magic|^demon$|^urban fantasy$|^supernatural$/,
            /^action$|combat|fighting/, /harem/, /^ecchi$|^comedy$/],
            context:[/^ecchi$/, /harem/, /angels|^demon$|^magic$|^urban fantasy$/], minimum:5, emphasis:1.29},
        {label:'путешествия и повседневность', anchors:[/outdoor activities|camping|travel|hiking|^rural$/, /^slice of life$|iyashikei|episodic/],
            context:[/female protagonist|cute girls doing cute things|primarily female/, /^comedy$|iyashikei|episodic/, /food|camping|travel|outdoor/], minimum:2},
        {label:'приключение в магическом мире', anchors:[/^adventure$|^journey$|travel/, /^fantasy$|^magic$|^demon$|^elf$/],
            context:[/found family|adventure|^travel$|^journey$/, /^drama$|^slice of life$|philosophy/, /protagonist|coming of age|ensemble cast/], minimum:2}
    ];
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
        'crime':'криминал','crime fiction':'криминальная история','anti hero':'антигерой','antihero':'антигерой'};
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
    var ABBREVIATIONS = {
        fmab: 'Fullmetal Alchemist Brotherhood', aot: 'Attack on Titan', snk: 'Shingeki no Kyojin',
        jjk: 'Jujutsu Kaisen', hxh: 'Hunter x Hunter', sao: 'Sword Art Online',
        mha: 'My Hero Academia', bnha: 'Boku no Hero Academia', opm: 'One Punch Man',
        csm: 'Chainsaw Man', ngev: 'Neon Genesis Evangelion', ylia: 'Your Lie in April',
        'ван пис': 'One Piece', 'ванпис': 'One Piece', 'атака титанов': 'Attack on Titan'
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
        var original = String(value || '').trim();
        if (/^[◯○●△▲▽▼◇◆□■★☆]+$/.test(original)) return original.replace(/○/g, '◯');
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
        var raw = String(value || '').trim().slice(0, 360);
        var yearMatch = raw.match(/(?:^|\s|\()(19\d{2}|20\d{2})\)?$/);
        var title = yearMatch && yearMatch.index > 0 ? raw.slice(0, yearMatch.index).trim() : raw;
        var year = title === raw ? 0 : Number(yearMatch[1]);
        var layout = /^[a-z\[\];'`,. ]{4,}$/i.test(title) ? keysInOtherLayout(title, KEY_EN, KEY_RU) : '';
        if (/^[а-яё ]{4,}$/i.test(title)) layout = keysInOtherLayout(title, KEY_RU, KEY_EN);
        var expanded = property(ABBREVIATIONS, clean(title));
        var layoutExpanded = property(ABBREVIATIONS, clean(layout));
        var normalized = normalTitle(title);
        var requests = unique([expanded || layoutExpanded || (normalized !== clean(title) ? normalized : title), title, layout]).slice(0, 3);
        var spelling = title.replace(/[хХ]/g, 'x').replace(/[×✕]/g, 'x');
        var variants = unique([expanded, layoutExpanded, title, layout, spelling].map(normalTitle));
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
        var titleWords = title.split(' ');
        if (words.length > 1 && words.length === titleWords.length &&
            words.every(function (word) { return titleWords.indexOf(word) >= 0; })) return 67;
        var tightQuery = query.replace(/ /g, '');
        if (tightQuery.length >= 5 && tightQuery === title.replace(/ /g, '')) return 89;
        if (query.length < 4 || title.length > 120) return 0;
        var edits = query.length > 9 ? 2 : 1;
        var comparable = titleWords.slice(0, words.length).join(' ');
        if (Math.abs(query.length - comparable.length) <= edits && distance(query, comparable) <= edits) {
            return comparable === title ? 64 : 58;
        }
        return 0;
    }

    function match(query, card) {
        var score = 0;
        query.variants.forEach(function (variant, index) {
            card.indexed.forEach(function (candidate) {
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
        var db = {cards: [], ids: maps(), names: maps(), frequency: maps(), tags: maps(), tmdb: maps(), families: maps(),
            entries: maps(), story: maps(), updated: raw.updated};
        raw.data.forEach(function (row) {
            var titles = [row[1]].concat(row[7]);
            var names = unique(titles.map(normalTitle));
            var image = /^([0-9]+):(.+)$/.exec(row[6]);
            var card = {id: row[0], title: row[1], titles: titles, indexed: names, year: row[2], type: row[3],
                rating: row[4], kitsu: row[5], episodes: row[10],
                poster: image ? 'https://' + raw.imageHosts[Number(image[1])] + '/' + image[2] : '',
                tags: unique(row[8].map(function (id) { return tagKey(raw.tags[id]); })), related: row[9],
                age: row[12] || '', restricted: row[13] || 0, family: row[14] || row[0],
                next: row[15] || '', tmdb: row[16] || null, upcoming: Boolean(row[17])};
            db.cards.push(card);
            db.ids[card.id] = card;
            (db.families[card.family] || (db.families[card.family] = [])).push(card);
            var root = db.entries[card.family];
            if ((card.type === 'TV' || card.type === 'ONA') && card.year && !card.upcoming &&
                !card.restricted && (!root || card.year < root.year)) db.entries[card.family] = card;
            (row[11] || []).forEach(function (id) { if (!db.ids[id]) db.ids[id] = card; });
            if (card.tmdb) (db.tmdb[card.tmdb[0]] || (db.tmdb[card.tmdb[0]] = [])).push(card);
            names.forEach(function (name) { (db.names[name] || (db.names[name] = [])).push(card); });
            card.tags.forEach(function (tag) {
                db.frequency[tag] = (db.frequency[tag] || 0) + 1;
                (db.tags[tag] || (db.tags[tag] = [])).push(card);
            });
        });
        return db;
    }

    function visible(card, disputed) { return card && (card.restricted === 0 || card.restricted === 1 && disputed); }

    function catalogueSearch(db, text, likes, disputed) {
        var query = parseQuery(text);
        if (!query.variants.length) return [];
        function collect(aliases) {
            var cards = [];
            aliases.forEach(function (alias) { Array.prototype.push.apply(cards, db.names[alias] || []); });
            return cards.filter(function (card) { return visible(card, disputed); });
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
            var tokens = unique(raw.split(' ').filter(function (part) { return part.length >= 3; }));
            var trigrams = [];
            tokens.forEach(function (part) {
                for (var offset = 0; offset <= part.length - 3; offset++) trigrams.push(part.slice(offset, offset + 3));
            });
            var first = raw.split(' ')[0];
            result = rankSearch(query, collect(names.filter(function (name) {
                var lead = name.split(' ')[0];
                return Math.abs(lead.length - first.length) <= 2 && trigrams.some(function (part) {
                    return name.indexOf(part) >= 0;
                });
            })), likes);
        }
        return result.slice(0, 24);
    }

    function matchCatalog(db, source, season) {
        if (!source) return null;
        if (source.media_type === 'movie' || source.method === 'movie' || source.original_title && !source.original_name &&
            (source.release_date && !source.first_air_date) && !source.anime_id && !source.yani_id) return null;
        var mal = remoteMal(source);
        if (mal && db.ids['m' + mal]) return db.ids['m' + mal];
        var native = (!source.source || source.source === 'tmdb' || source.source === 'cub') && db.tmdb[source.id];
        if (season && native) {
            var exactSeason = native.filter(function (card) { return card.tmdb[1] === Number(season); });
            if (exactSeason.length === 1) return exactSeason[0];
        }
        var names = [source.original_name, source.original_title, source.title, source.name].concat(source.titles || []);
        var year = Number(source.year || String(source.first_air_date || source.release_date || '').slice(0, 4));
        var exact = [];
        unique(names.map(normalTitle)).forEach(function (name) { exact = exact.concat(db.names[name] || []); });
        exact = uniqueCards(exact);
        var sameYear = exact.filter(function (card) { return card.year === year; });
        var base = sameYear.length === 1 ? sameYear[0] :
            exact.length === 1 && (!year || !exact[0].year || Math.abs(exact[0].year - year) <= 1) ? exact[0] : null;
        if (!base || Number(season) < 2 || !season) return base;
        var number = Number(season);
        var label = new RegExp('(?:^| )(?:season ' + number + '|'+ number + '(?:st|nd|rd|th) season|сезон ' + number +
            ')(?: |$)');
        var matching = db.families[base.family].filter(function (card) {
            return card.type !== 'OVA' && card.indexed.some(function (name) { return label.test(name); });
        });
        return matching.length === 1 ? matching[0] : null;
    }

    function features(card, synopsis) {
        var genres = maps(), world = maps(), plot = maps(), themes = maps(), mood = maps(), characters = maps();
        card.tags.forEach(function (key) {
            if (GENRE.test(key)) genres[key] = 1;
            if (MOOD.test(key)) mood[key] = 1;
            if (CHARACTERS.test(key)) characters[key] = 1;
            if (WORLD.test(key)) world[key] = 1;
            else if (TONES.test(key)) plot[key] = 1;
            else if (!GENRE.test(key)) themes[key] = 1;
        });
        var description = String(synopsis || '').replace(/\[[^\]]+\]/g, ' ').toLowerCase();
        STORY.forEach(function (rule) { if (rule[1].test(description)) plot[rule[0]] = 1; });
        SETTING.forEach(function (rule) { if (rule[1].test(description)) world[rule[0]] = 1; });
        var all = Object.keys(genres).concat(Object.keys(world), Object.keys(plot), Object.keys(themes));
        var motifs = MOTIFS.map(function (pattern) {
            return pattern.every(function (part) { return all.some(function (tag) { return part.test(tag); }); });
        });
        var premises = PREMISES.map(function (group) {
            function count(patterns) {
                return patterns.reduce(function (total, pattern) {
                    return total + Number(all.some(function (tag) { return pattern.test(tag); }));
                }, 0);
            }
            var anchors = count(group.anchors), context = count(group.context);
            return {anchors: anchors, context: context, eligible: anchors >= group.minimum && context >= 2};
        });
        return {genres: genres, world: world, plot: plot, themes: themes,
            mood: mood, characters: characters, motifs: motifs, premises: premises};
    }

    function overlap(left, right, rarity) {
        var total = 0, seedTotal = 0, shared = [];
        var keys = Object.keys(left).concat(Object.keys(right).filter(function (key) { return !left[key]; }));
        keys.forEach(function (key) {
            if (!left[key] || !right[key]) return;
            var weight = rarity(key);
            shared.push({key: key, weight: weight});
            total += weight;
        });
        Object.keys(left).forEach(function (key) { seedTotal += rarity(key); });
        shared.sort(function (a, b) { return b.weight - a.weight; });
        return {score: keys.length ? total / keys.length : 0, coverage: seedTotal ? total / seedTotal : 0,
            shared: shared.map(function (row) { return row.key; })};
    }

    function explain(label, matches) {
        var safe = matches.filter(function (tag) { return !/ending|everybody dies|twist|sacrifice|finale/.test(tag); });
        return safe.length ? label + ' — ' + safe.slice(0, 3).map(tagLabel).join(', ') : '';
    }

    function tagLabel(word) { return property(LABEL, word) || word; }

    function compareTaste(seed, candidate, rarity, focus, similarity, bothDescriptions) {
        var left = seed.features, right = candidate.features;
        var genres = overlap(left.genres, right.genres, rarity);
        var world = overlap(left.world, right.world, rarity);
        var plot = overlap(left.plot, right.plot, rarity);
        var themes = overlap(left.themes, right.themes, rarity);
        var mood = overlap(left.mood, right.mood, rarity);
        var cast = overlap(left.characters, right.characters, rarity);
        var motifs = left.motifs.reduce(function (count, hasMotif, index) {
            return count + Number(hasMotif && right.motifs[index]);
        }, 0);
        var weights = DIMENSIONS[focus] || DIMENSIONS.all;
        var axes = [genres, world, plot, themes, mood, cast];
        var score = axes.reduce(function (sum, axis, index) { return sum + axis.score * weights[index]; }, 0);
        var related = seed.card.related.indexOf(candidate.card.id) >= 0 || candidate.card.related.indexOf(seed.card.id) >= 0;
        score += Math.min(3, motifs) * (focus === 'all' ? 0.12 : 0.055) + similarity * (focus === 'plot' ? 0.24 : 0.14)
            + (related ? 0.08 : 0);
        var labels = ['Жанры', 'Мир', 'Сюжет', 'Темы', 'Атмосфера', 'Персонажи'];
        var reasons = axes.map(function (axis, index) {
            return {text: explain(labels[index], axis.shared), weight: axis.score * weights[index]};
        }).filter(function (row) { return row.text; }).sort(function (a, b) { return b.weight - a.weight; })
            .map(function (row) { return row.text; });
        if (similarity > 0.25 && (focus === 'plot' || !reasons.length)) {
            reasons.unshift(bothDescriptions ? 'Сходство сюжетных описаний' : 'Сходство сюжетных тем');
        }
        var available = [left.genres, left.world, left.plot, left.themes, left.mood, left.characters];
        var comparable = axes.reduce(function (sum, axis, index) {
            var prior = Object.keys(available[index]).length;
            return prior ? sum + weights[index] : sum;
        }, 0);
        var core = axes.reduce(function (sum, axis, index) {
            return sum + Math.sqrt(axis.coverage) * weights[index];
        }, 0);
        // Extra metadata on the candidate should not drown out matching facets.
        var breadth = comparable ? core / comparable : 0;
        score += breadth * 0.15 + Math.min(genres.coverage, Math.max(plot.coverage, world.coverage, mood.coverage)) * 0.08;
        var match = 0, premise;
        left.premises.forEach(function (part, index) {
            if (!part.eligible) return;
            var other = right.premises[index], expected = PREMISES[index];
            var anchorCoverage = Math.min(1, other.anchors / expected.minimum);
            var contextCoverage = Math.min(1, other.context / part.context);
            var agreement = anchorCoverage * anchorCoverage * (0.52 + 0.48 * contextCoverage) * (expected.emphasis || 1);
            if (agreement > match) { match = agreement; premise = expected; }
        });
        if (match && (focus === 'all' || focus === 'plot')) {
            score += (focus === 'plot' ? 0.22 : 0.26) * match;
            if (match >= 0.90 && premise) reasons.unshift('Общая основа — ' + premise.label);
        }
        return {score: score, specific: world.shared.length + plot.shared.length + themes.shared.length
                + mood.shared.length + cast.shared.length + Number(similarity > 0.15), reasons: reasons};
    }

    function tasteNetwork(db, positives, negatives) {
        if (!positives.length) return null;
        var signature = positives.map(function (seed) { return seed.card.id + ':' + seed.weight; }).join(',') +
            '/' + negatives.map(function (seed) { return seed.card.id; }).join(',');
        if (db.network && db.network.signature === signature) return db.network.predict;

        var width = 96, hidden = 12;
        var first = new Float32Array(width * hidden), last = new Float32Array(hidden);
        var hiddenValues = new Float32Array(hidden), bias = 0;
        var vectors = maps(), rated = maps(), hashState = 71817;
        function random() {
            hashState = (1664525 * hashState + 1013904223) >>> 0;
            return hashState / 4294967296;
        }
        for (var i = 0; i < first.length; i++) first[i] = (random() - 0.5) * 0.28;
        for (var j = 0; j < last.length; j++) last[j] = (random() - 0.5) * 0.28;

        function vector(card) {
            var bins = maps(), norm = 0;
            card.tags.forEach(function (tag) {
                var hash = 5381;
                for (var k = 0; k < tag.length; k++) hash = (hash * 33 ^ tag.charCodeAt(k)) >>> 0;
                var bin = hash % width;
                var value = Math.min(2, 0.6 + 0.27 * Math.log(db.cards.length / db.frequency[tag]));
                bins[bin] = (bins[bin] || 0) + (hash & 128 ? value : -value);
            });
            var keys = Object.keys(bins);
            keys.forEach(function (key) { norm += bins[key] * bins[key]; });
            var scale = Math.sqrt(norm) || 1;
            return keys.map(function (key) { return [Number(key), bins[key] / scale]; });
        }
        function forward(input) {
            var sum = bias;
            for (var unit = 0; unit < hidden; unit++) {
                var value = 0, offset = unit * width;
                for (var k = 0; k < input.length; k++) value += input[k][1] * first[offset + input[k][0]];
                hiddenValues[unit] = value >= 0 ? value : value * 0.12;
                sum += last[unit] * hiddenValues[unit];
            }
            return 1 / (1 + Math.exp(-sum));
        }
        function sample(seed, target, weight) {
            rated[seed.card.family] = true;
            return {input: vector(seed.card), target: target, weight: weight};
        }
        var examples = positives.map(function (seed) { return sample(seed, 1, seed.weight); });
        negatives.forEach(function (seed) { examples.push(sample(seed, 0, 1)); });
        // Unrated catalogue samples are a neutral reference, not recorded dislikes.
        for (var u = 0; u < positives.length * 2 + 16; u++) {
            var card = db.cards[Math.floor(random() * db.cards.length)];
            if (!rated[card.family] && card.tags.length && card.restricted !== 2) {
                examples.push({input: vector(card), target: 0.30, weight: 0.25});
            }
        }
        for (var epoch = 0; epoch < 14; epoch++) {
            for (var step = 0; step < examples.length; step++) {
                var example = examples[(step + epoch * 7) % examples.length];
                var delta = (example.target - forward(example.input)) * example.weight * 0.16;
                bias += delta * 0.30;
                for (var unit = 0; unit < hidden; unit++) {
                    var gradient = delta * last[unit] * (hiddenValues[unit] >= 0 ? 1 : 0.12);
                    var offset = unit * width;
                    last[unit] += delta * hiddenValues[unit];
                    for (var k = 0; k < example.input.length; k++) {
                        first[offset + example.input[k][0]] += gradient * example.input[k][1];
                    }
                }
            }
        }
        var confidence = Math.min(1, (positives.length + negatives.length) / 6);
        function predict(card) {
            if (vectors[card.id] === undefined) vectors[card.id] = (forward(vector(card)) - 0.5) * confidence;
            return vectors[card.id];
        }
        db.network = {signature: signature, predict: predict};
        return predict;
    }

    function rankTaste(db, seeds, candidates, descriptions, focus, negative, assistance, autonomous, personalization) {
        function rarity(key) {
            return Math.min(1.65, 0.45 + Math.log((db.cards.length + 1) / ((db.frequency[key] || 0) + 1)) * 0.2);
        }
        function prepare(seed) {
            var semantic = db.story[seed.card.id];
            var neighbors = maps();
            if (semantic) semantic[1].forEach(function (row) {
                neighbors[row[0]] = Math.max(0, (row[1] - 7300) / 1900) * (semantic[0] ? 1 : 0.7);
            });
            return {card: seed.card, features: features(seed.card, descriptions[seed.card.id]),
                weight: seed.weight, focus: seed.focus, neighbors: neighbors, described: semantic && semantic[0]};
        }
        var prepared = seeds.map(prepare);
        var unwanted = (negative || []).map(prepare);
        var ranked = candidates.map(function (card) {
            var candidate = {card: card, features: features(card, descriptions[card.id])};
            var described = db.story[card.id] && db.story[card.id][0];
            var hits = prepared.map(function (seed) {
                var hit = compareTaste(seed, candidate, rarity, focus === 'all' && seed.focus || focus,
                    seed.neighbors[card.id] || 0, described && seed.described);
                hit.seed = seed.card.title;
                hit.score *= seed.weight;
                return hit;
            }).filter(function (hit) { return hit.specific; }).sort(function (a, b) { return b.score - a.score; });
            if (!hits.length) return null;
            var primary = hits[0];
            var agreement = hits.slice(1, 4).reduce(function (sum, hit) { return sum + hit.score; }, 0);
            var penalty = unwanted.reduce(function (highest, seed) {
                if (card.family === seed.card.family) return Math.max(highest, 0.34);
                var similarity = compareTaste(seed, candidate, rarity, 'all', seed.neighbors[card.id] || 0).score;
                return Math.max(highest, Math.max(0, similarity - 0.17) * 0.42);
            }, 0);
            var signal = assistance && assistance[card.id] || 0;
            var bonus = signal && primary.score >= 0.28 ? Math.min(0.075, 0.06 * signal + Math.min(0.012, primary.score * 0.012)) : 0;
            var learned = personalization ? personalization.predict(card) * (personalization.anchored ? 0.11 : 0.22) : 0;
            return {card: card, score: primary.score + 0.12 * agreement + 0.002 * card.rating - penalty + learned, bonus: bonus,
                reasons: ['Похоже на «' + primary.seed + '»'].concat(primary.reasons.slice(0, 3))};
        }).filter(Boolean).sort(function (a, b) { return b.score - a.score || a.card.id.localeCompare(b.card.id); });
        if (autonomous) {
            var baselineFamilies = maps();
            var baseline = ranked.filter(function (entry) {
                if (!autonomous[entry.card.id] || entry.score <= 0 || baselineFamilies[entry.card.family]) return false;
                baselineFamilies[entry.card.family] = true;
                return true;
            });
            var cutoff = baseline.length >= 10 ? baseline[9].score * 0.96 : 0.28;
            ranked = ranked.filter(function (entry) {
                return autonomous[entry.card.id] || entry.score >= cutoff;
            });
            ranked.forEach(function (entry) {
                if (entry.bonus && entry.score >= cutoff) {
                    entry.score += entry.bonus;
                    entry.reasons.push('Также советует YummyAnime');
                }
            });
            ranked.sort(function (a, b) { return b.score - a.score || a.card.id.localeCompare(b.card.id); });
        }
        var shown = maps();
        return ranked.filter(function (entry) {
            if (shown[entry.card.family]) return false;
            shown[entry.card.family] = true;
            return entry.score > 0;
        });
    }

    function recommendationQueue(db, seeds, excluded, disputed, focus, negative, suggestions, personalization) {
        var scores = maps(), neighbors = maps(), assistance = maps();
        function eligible(card) { return card && !card.upcoming && visible(card, disputed) && !excluded[card.id]; }
        function canonical(card) {
            var first = card && db.entries[card.family];
            return eligible(first) ? first : card;
        }
        seeds.forEach(function (seed) {
            var tags = seed.card.tags.filter(function (tag) { return (db.frequency[tag] || 0) > 1; });
            tags.forEach(function (tag) {
                var specificity = Math.log(db.cards.length / db.frequency[tag]);
                var weight = GENRE.test(tag) ? 1.15 : WORLD.test(tag) || TONES.test(tag) || MOOD.test(tag) ?
                    Math.max(1.1, Math.min(4.5, specificity * 1.13)) : Math.max(0.5, Math.min(3.1, specificity));
                db.tags[tag].forEach(function (card) {
                    if (eligible(card)) scores[card.id] = (scores[card.id] || 0) + seed.weight * weight;
                });
            });
            var story = db.story[seed.card.id];
            if (story) story[1].forEach(function (row) {
                if (eligible(db.ids[row[0]])) neighbors[row[0]] = true;
            });
            seed.card.related.forEach(function (id) { if (eligible(db.ids[id])) neighbors[id] = true; });
        });
        var shortlist = Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; });
        var candidates = uniqueCards(shortlist.slice(0, 260).concat(Object.keys(neighbors))
            .map(function (id) { return canonical(db.ids[id]); }));
        var seedIds = maps(), autonomous = null, supplemental = [];
        seeds.forEach(function (seed) { seedIds[seed.card.id] = true; });
        (suggestions || []).forEach(function (entry) {
            var card = db.ids[entry.id];
            if (!seedIds[entry.seed] || !eligible(card)) return;
            card = canonical(card);
            if (!eligible(card)) return;
            supplemental.push(card);
            var weight = 1 / (1 + (Number(entry.rank) || 0) / 7);
            assistance[card.id] = Math.min(1.28, (assistance[card.id] || 0) + weight);
        });
        if (supplemental.length) {
            autonomous = maps();
            candidates.forEach(function (card) { autonomous[card.id] = true; });
            candidates = uniqueCards(candidates.concat(supplemental));
        }
        var cursor = 260, visited = maps(), shown = maps();
        function batch() {
            var firstBatch = Boolean(candidates);
            var group = candidates;
            candidates = null;
            if (!firstBatch) {
                group = uniqueCards(shortlist.slice(cursor, cursor + 260).map(function (id) { return canonical(db.ids[id]); }));
                cursor += 260;
            }
            var unseen = group.filter(function (card) {
                if (visited[card.id] || shown[card.family]) return false;
                visited[card.id] = true;
                return true;
            });
            return rankTaste(db, seeds, unseen, {}, focus || 'all', negative,
                firstBatch ? assistance : null, firstBatch ? autonomous : null, personalization).filter(function (entry) {
                shown[entry.card.family] = true;
                return true;
            });
        }
        return {next: batch, hasMore: function () { return candidates !== null || cursor < shortlist.length; }};
    }

    function recommend(db, seeds, excluded, disputed, focus, negative, suggestions, personalization) {
        return recommendationQueue(db, seeds, excluded, disputed, focus, negative, suggestions, personalization).next();
    }

    function interestGroups(seeds) {
        var groups = [];
        seeds.forEach(function (seed) {
            var own = features(seed.card, '');
            var fits = groups.map(function (group) {
                var shared = overlap(own.genres, group.anchor.genres, function () { return 1; }).score;
                var world = overlap(own.world, group.anchor.world, function () { return 1; }).score;
                return {group: group, score: shared * 0.58 + world * 0.42};
            }).sort(function (a, b) { return b.score - a.score; });
            var best = fits[0];
            if (best && (best.score >= 0.32 || groups.length === 4)) best.group.seeds.push(seed);
            else groups.push({anchor: own, title: seed.card.title, seeds: [seed]});
        });
        return groups;
    }

    function sufficient(road) {
        if (!road) return false;
        if (typeof road === 'number') return road >= 75;
        var time = Number(road.time || road.position) || 0;
        var duration = Number(road.duration) || 0;
        var percent = Number(road.percent || (duration ? 100 * time / duration : 0));
        return percent >= 75 || time >= 180 && percent >= 30 || !duration && time >= 480;
    }

    function progressOf(road) {
        if (typeof road === 'number') return Math.max(0, Math.min(100, road));
        if (!road) return 0;
        var ratio = Number(road.percent) || 100 * Number(road.time || road.position || 0) / (Number(road.duration) || Infinity);
        return Math.round(Math.max(0, Math.min(100, ratio)));
    }

    function viewedEpisode(previous, event) {
        var percent = progressOf(event.road);
        var time = Number(event.road.time || event.road.position || 0);
        if (percent < 8 && time < 60 && !sufficient(event.road)) return previous;
        var stamp = Number(event.stamp) || previous.last || Date.now();
        var episodes = Object.assign({}, previous.episodes || {});
        var season = Number(event.season || event.road.season) || 0;
        var episode = Number(event.episode || event.road.episode) || 0;
        var hash = String(event.hash || event.road.hash || '').replace(/[^0-9a-z_-]/gi, '').slice(0, 70);
        var key = episode ? season + ':' + episode : hash ? 'h:' + hash : '';
        var resumed = Number(previous.resumed) || 0;
        var lastSession = previous.lastSession || 0;
        if (event.session && event.session !== lastSession) {
            if (previous.last && (previous.last < stamp - 15 * 60000 || episodes[key] && episodes[key].percent < 85)) resumed++;
            lastSession = event.session;
        }
        if (key) {
            var prior = episodes[key] || {percent: 0, replays: 0, last: 0};
            var replays = prior.replays || 0;
            var replaySession = prior.replaySession || 0;
            if (prior.percent >= 85 && percent >= 85 && event.replay && event.session && event.session !== replaySession) {
                replays++;
                replaySession = event.session;
            }
            episodes[key] = {percent: Math.max(prior.percent, percent), last: Math.max(prior.last, stamp),
                season: season, episode: episode, replays: replays, replaySession: replaySession};
            var keys = Object.keys(episodes);
            if (keys.length > 180) keys.sort(function (a, b) { return episodes[b].last - episodes[a].last; })
                .slice(180).forEach(function (id) { delete episodes[id]; });
        }
        return {last: Math.max(previous.last || 0, stamp), percent: Math.max(previous.percent || 0, percent), episodes: episodes,
            lastSession: lastSession, resumed: resumed, substantial: Boolean(previous.substantial || sufficient(event.road)),
            marked: Boolean(previous.marked || event.marked)};
    }

    function watchStats(entry) {
        return Object.keys(entry.episodes || {}).reduce(function (result, key) {
            var episode = entry.episodes[key];
            result.finished += Number(episode.percent >= 85);
            result.replays += episode.replays || 0;
            return result;
        }, {finished: 0, replays: 0});
    }

    function viewingWeight(entry) {
        if (!entry) return 0;
        var counts = watchStats(entry);
        if (entry.marked || counts.finished) return Math.min(0.96, 0.68 + Math.log(1 + counts.finished) * 0.07 +
            Math.min(0.12, counts.replays * 0.05 + (entry.resumed || 0) * 0.025));
        if (entry.substantial || entry.percent >= 30) return entry.percent >= 75 ? 0.72 : 0.46;
        return 0;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = {parseQuery: parseQuery, indexCatalog: indexCatalog, catalogueSearch: catalogueSearch,
            matchCatalog: matchCatalog, features: features, rankTaste: rankTaste, sufficient: sufficient,
            recommend: recommend, recommendationQueue: recommendationQueue, tasteNetwork: tasteNetwork,
            interestGroups: interestGroups, viewingWeight: viewingWeight, viewedEpisode: viewedEpisode};
        return;
    }

    var Lampa = window.Lampa;
    var $ = window.jQuery || window.$;
    if (!Lampa || !$ || window.animeTasteInstalled) return;
    window.animeTasteInstalled = true;
    var accountCache;
    var yummyCache = maps();
    var catalogRequest;
    var storyRequest;
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
        return {likes: saved.likes || {}, hidden: saved.hidden || {}, ignored: saved.ignored || {},
            disputed: saved.disputed === true, useYummy: saved.useYummy !== false};
    }

    function publicApi() {
        var api = window.LampaYaniApi;
        return api && api.profile && api.userLists && api.normalize ? api : null;
    }

    function connectedYummy() {
        if (!data().useYummy) return null;
        var auth = window.LampaYaniAuth;
        var saved;
        try { saved = auth && typeof auth.get === 'function' ? auth.get() : null; }
        catch (error) { return null; }
        var api = publicApi();
        return api && saved && saved.token ? {
            api: api, userId: saved.user_id, identity: String(saved.user_id || saved.login || ''),
            token: saved.token
        } : null;
    }

    function sameYummy(connection) {
        var live = connectedYummy();
        return Boolean(live && connection && live.api === connection.api && live.identity === connection.identity &&
            live.token === connection.token);
    }

    function deadline(promise, fallback, timeout) {
        return new Promise(function (resolve) {
            var timer = setTimeout(function () { resolve(fallback); }, timeout);
            promise.then(function (value) { clearTimeout(timer); resolve(value); },
                function () { clearTimeout(timer); resolve(fallback); });
        });
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

    function catalogParts() {
        var count = 10;
        var loaded = [];
        var stopped = false;
        var receive = function (part, payload) {
            if (part >= 0 && part < count && payload && Array.isArray(payload.data)) loaded[part] = payload;
        };
        window.animeTastePart32 = receive;
        function transport(part, host) {
            return new Promise(function (resolve, reject) {
                var script = window.document.createElement('script');
                function finish() {
                    clearTimeout(timer);
                    script.onload = script.onerror = null;
                    if (script.parentNode) script.parentNode.removeChild(script);
                    if (loaded[part]) resolve(loaded[part]);
                    else reject(new Error('Часть каталога недоступна'));
                }
                var timer = setTimeout(finish, 6500);
                script.onload = script.onerror = finish;
                script.async = true;
                script.src = host + 'anime-assets-v32/catalog-' + part + '.js';
                window.document.head.appendChild(script);
            });
        }
        var cursor = 0;
        function next() {
            var part = cursor++;
            if (stopped || part >= count) return Promise.resolve();
            return transport(part, ASSET_HOST).catch(function () { return transport(part, ASSET_MIRROR); }).then(next);
        }
        function clean() {
            stopped = true;
            if (window.animeTastePart32 === receive) delete window.animeTastePart32;
        }
        return Promise.all([next(), next(), next(), next()]).then(function () {
            var first = loaded[0];
            if (loaded.some(function (part) { return !part || part.updated !== first.updated; })) {
                throw new Error('Части каталога разных версий');
            }
            return Object.assign({}, first, {data: [].concat.apply([], loaded.map(function (part) { return part.data; }))});
        }).then(function (data) { clean(); return data; }, function (error) { clean(); throw error; });
    }

    function validateCatalog(raw) {
        if (!raw || raw.version !== 3 || !Array.isArray(raw.data) || !raw.data.length ||
            !Array.isArray(raw.tags) || !Array.isArray(raw.imageHosts)) throw new Error('Формат каталога изменился.');
        return raw;
    }

    function catalog() {
        if (!catalogRequest) {
            catalogRequest = requestJson(CATALOG, 7500).then(validateCatalog).catch(function () {
                return catalogParts().then(validateCatalog);
            }).catch(function () {
                return requestJson(ASSET_MIRROR + 'anime-catalog-3.json', 10000).then(validateCatalog);
            }).catch(function () {
                return requestJson(ASSET_RAW + 'anime-catalog-3.json', 10000).then(validateCatalog);
            }).then(indexCatalog).catch(function () {
                catalogRequest = null;
                throw new Error('Не удалось получить каталог с основного сервера и зеркала. Повторите попытку.');
            });
        }
        return catalogRequest;
    }

    function loadStories(db) {
        if (!storyRequest) {
            storyRequest = requestJson(STORY_INDEX, 6500).catch(function () {
                return requestJson(ASSET_MIRROR + 'anime-story-3.json', 7000);
            }).then(function (raw) {
                if (raw.updated === db.updated && raw.entries) db.story = raw.entries;
                else storyRequest = null;
            }).catch(function () { storyRequest = null; });
        }
        return storyRequest;
    }

    function searchIndependent(text, likes) {
        return catalog().then(function (db) { return catalogueSearch(db, text, likes, data().disputed); });
    }

    function showPoster(item, card) {
        var image = item.find('.card__img').first();
        var alternative = card.kitsu ? 'https://media.kitsu.app/anime/poster_images/' + card.kitsu + '/small.jpg' : '';
        var original = /^https:\/\/cdn\.myanimelist\.net\//i.test(card.poster) ?
            card.poster.replace(/t(?=\.(?:jpe?g|png)$)/i, '') : card.poster;
        var urls = unique([original, alternative, card.poster, './img/img_broken.svg']);
        var timer;
        function advance() {
            clearTimeout(timer);
            if (!urls.length) {
                image.off('.animeTastePoster');
                item.addClass('card--loaded');
                return;
            }
            var next = urls.shift();
            if (urls.length) timer = setTimeout(advance, 5500);
            image.attr('src', next);
        }
        image.attr('alt', '').on('load.animeTastePoster', function () {
            clearTimeout(timer);
            image.off('.animeTastePoster');
            item.addClass('card--loaded');
        }).on('error.animeTastePoster', advance);
        advance();
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

    function guidanceFile() { return historyFile() + '_preferences'; }

    function guidance() {
        var saved = reading(guidanceFile());
        return {feedback: saved.feedback || {}, bindings: saved.bindings || {}, unresolved: saved.unresolved || {}};
    }

    function bindKey(source, season) {
        var key = nativeKey(source);
        return key && key + ':' + (Number(season) || 0);
    }

    function resolveViewing(db, rules, source, season) {
        var key = bindKey(source, season);
        var manual = rules.bindings[key];
        return manual && db.ids[manual] || matchCatalog(db, source, season);
    }

    function setFeedback(card, action, focus) {
        var rules = guidance();
        if (!action) delete rules.feedback[card.id];
        else rules.feedback[card.id] = {action: action, focus: focus || 'all', when: Date.now()};
        Lampa.Storage.set(guidanceFile(), rules);
    }

    function rememberBinding(record, card) {
        var rules = guidance();
        rules.bindings[bindKey(record.source, record.season)] = card.id;
        delete rules.unresolved[bindKey(record.source, record.season)];
        Lampa.Storage.set(guidanceFile(), rules);
    }

    function canonicalHistory(db, watch) {
        var changed = false;
        Object.keys(watch).forEach(function (id) {
            var card = db.ids[id];
            if (!card || card.id === id) return;
            var left = watch[id], right = watch[card.id];
            if (right) {
                var latest = left.last > right.last ? left : right;
                var episodes = Object.assign({}, right.episodes || {});
                Object.keys(left.episodes || {}).forEach(function (key) {
                    var a = left.episodes[key], b = episodes[key];
                    if (!b) { episodes[key] = a; return; }
                    episodes[key] = Object.assign({}, a.last > b.last ? a : b,
                        {percent: Math.max(a.percent, b.percent), replays: Math.max(a.replays || 0, b.replays || 0)});
                });
                watch[card.id] = Object.assign({}, latest, {episodes: episodes,
                    percent: Math.max(left.percent || 0, right.percent || 0),
                    marked: Boolean(left.marked || right.marked), substantial: Boolean(left.substantial || right.substantial),
                    native: latest.native || left.native || right.native, yani: latest.yani || left.yani || right.yani});
            } else watch[card.id] = left;
            delete watch[id];
            changed = true;
        });
        return changed;
    }

    function storeViews(db, file, events) {
        if (historyFile() !== file) return;
        var watched = reading(file), rules = guidance(), changed = canonicalHistory(db, watched), unresolved = false;
        events.forEach(function (event) {
            if (!event.road) return;
            var season = event.season || event.road.season;
            var card = event.card || resolveViewing(db, rules, event.source, season);
            var key = bindKey(event.source, season);
            if (!card) {
                if (key && event.native && sufficient(event.road) && !rules.unresolved[key] && Object.keys(rules.unresolved).length < 100) {
                    var source = event.source;
                    rules.unresolved[key] = {source: {id: source.id, source: source.source || 'tmdb',
                        original_name: source.original_name, name: source.name || source.title, first_air_date: source.first_air_date,
                        original_language: source.original_language, genre_ids: source.genre_ids},
                    season: Number(season) || 0, stamp: Number(event.stamp) || Date.now(), road: {
                        percent: progressOf(event.road), episode: Number(event.road.episode) || Number(event.episode) || 0}};
                    unresolved = true;
                }
                return;
            }
            if (key && rules.unresolved[key]) {
                delete rules.unresolved[key];
                unresolved = true;
            }
            var old = watched[card.id];
            var previous = old || {last: 0, percent: 0};
            var next = viewedEpisode(previous, event);
            if (next === previous) return;
            var native = event.native && nativeCard(event.source);
            next.native = native || previous.native || null;
            next.yani = event.yani || previous.yani || 0;
            next.title = card.title;
            if (old && JSON.stringify(old) === JSON.stringify(next)) return;
            watched[card.id] = next;
            changed = true;
        });
        if (changed) Lampa.Storage.set(file, watched);
        if (unresolved) Lampa.Storage.set(guidanceFile(), rules);
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
            if (!road || !road.card) return;
            (keyed[road.card] || (keyed[road.card] = [])).push({road: road, hash: hash});
        });
        var viewed = getFavorites('viewed');
        var explicit = maps();
        viewed.forEach(function (source) { explicit[nativeKey(source)] = true; });
        getFavorites('history').concat(viewed).forEach(function (source) {
            if (!isAnimeCandidate(source)) return;
            var key = nativeKey(source);
            if (!key) return;
            cache[key] = {source: source};
            if (explicit[key]) events.push({source: source, road: {percent: 100}, native: true, marked: true});
        });
        Object.keys(cache).forEach(function (key) {
            var cached = cache[key];
            var rows = keyed[key] || [];
            var source = cached.source;
            var original = source.original_name || source.original_title;
            if (!rows.length && original && Lampa.Utils && typeof Lampa.Utils.hash === 'function') {
                for (var episode = 1; episode <= 24; episode++) {
                    var hash = Lampa.Utils.hash('1' + episode + original);
                    var saved = timeline[hash];
                    if (saved) rows.push({road: saved, hash: hash, episode: episode, season: 1});
                }
            }
            rows.forEach(function (row) {
                var road = row.road;
                events.push({source: source, road: road, stamp: road.updated, native: true, hash: row.hash,
                    episode: road.episode || row.episode, season: road.season || row.season});
            });
        });
        var supplemental = reading('yani_playback_history');
        Object.keys(supplemental).forEach(function (id) {
            var row = supplemental[id];
            if (!row) return;
            var source = Object.assign({anime_id: Number(id) || 0}, row.card || row);
            var yani = /^\d+$/.test(id) ? Number(id) : 0;
            Object.keys(row.finished_episodes || {}).forEach(function (episode) {
                if (row.finished_episodes[episode] && /^\d+$/.test(episode)) events.push({source: source,
                    road: {percent: 100}, episode: Number(episode), stamp: row.updated_at, yani: yani});
            });
            events.push({source: source, road: row, episode: row.number, stamp: row.updated_at, yani: yani});
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
        var rules = guidance(), feedback = maps();
        Object.keys(rules.feedback).forEach(function (id) {
            if (db.ids[id]) feedback[db.ids[id].id] = rules.feedback[id];
        });
        return {likes: likes, hidden: hidden, supplemental: supplemental, feedback: feedback, disputed: saved.disputed};
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

    function tasteProfile(db, prefs, watch, source) {
        var feedback = prefs.feedback, excluded = maps(), families = maps();
        var keys = unique(Object.keys(prefs.likes).concat(Object.keys(watch), Object.keys(feedback)));
        var signals = keys.reduce(function (collected, id) {
            var card = db.ids[id], vote = feedback[id];
            if (!card || !visible(card, prefs.disputed) || vote && vote.action === 'negative') return collected;
            var weight = vote && vote.action === 'positive' ? 1.22 : prefs.likes[id] ? 1 : viewingWeight(watch[id]);
            if (weight) collected.push({card: card, weight: weight, focus: vote && vote.focus,
                updated: vote && vote.when || prefs.likes[id] || watch[id] && watch[id].last || 0});
            return collected;
        }, []).sort(function (a, b) { return b.weight - a.weight || b.updated - a.updated; }).filter(function (seed) {
            if (families[seed.card.family]) return false;
            families[seed.card.family] = true;
            return true;
        });
        var seeds = source ? [{card: source, weight: 1}] : signals.slice(0, 12);
        var negative = Object.keys(feedback).filter(function (id) { return feedback[id].action === 'negative'; })
            .sort(function (a, b) { return feedback[b].when - feedback[a].when; }).slice(0, 24)
            .map(function (id) { return {card: db.ids[id], weight: 1}; }).filter(function (seed) { return seed.card; });
        var trackedFamilies = maps();
        seeds.forEach(function (seed) { trackedFamilies[seed.card.family] = true; });
        var continuations = maps();
        // Keep the furthest confirmed season in each family. A later view supersedes older next-season suggestions.
        db.cards.forEach(function (card) {
            var vote = feedback[card.id];
            if (!trackedFamilies[card.family] && !(source && source.family === card.family)) return;
            if (watch[card.id] || vote && vote.action === 'seen' || source && source.id === card.id || prefs.likes[card.id]) {
                var previous = continuations[card.family];
                if (!previous || card.year > previous.year) continuations[card.family] = card;
            }
        });
        Object.keys(prefs.hidden).concat(Object.keys(prefs.likes)).forEach(function (id) { excluded[id] = true; });
        Object.keys(watch).forEach(function (id) {
            if (watch[id].marked || watch[id].substantial || watch[id].percent >= 75) excluded[id] = true;
        });
        Object.keys(feedback).forEach(function (id) { excluded[id] = true; });
        db.cards.forEach(function (card) { if (trackedFamilies[card.family]) excluded[card.id] = true; });
        var next = uniqueCards(Object.keys(continuations).map(function (family) {
            return db.ids[continuations[family].next];
        })).filter(function (card) {
            return visible(card, prefs.disputed) && !card.upcoming && !watch[card.id] && !prefs.hidden[card.id] && !feedback[card.id];
        });
        return {seeds: seeds, signals: signals.slice(0, 72), negative: negative, excluded: excluded, next: next};
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

    function rememberPlayback(play, update) {
        if (!play || !play.source || !play.timeline && !update) return;
        var current = update && update.road || play.timeline;
        var road = {percent: current.percent, time: current.time, duration: current.duration,
            season: current.season || play.season, episode: current.episode || play.episode};
        var position = progressOf(road);
        if (position > 0 && position < 35) play.replay = true;
        var replay = play.replay;
        var hash = update && update.hash || play.timeline && play.timeline.hash;
        catalog().then(function (db) {
            var key = nativeKey(play.source);
            if (key && !play.yani && historyIndex && historyIndex.file === play.file) {
                historyIndex.cards[key] = {source: play.source};
            }
            storeViews(db, play.file, [{source: play.source, road: road, hash: hash, session: play.stamp,
                stamp: Date.now(), replay: replay, native: !play.yani, yani: play.yani}]);
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
                    season: data.season || data.season_number, episode: data.episode || data.episode_number,
                    yani: Number(card.yani_id || card.anime_id) || 0};
            });
            player.follow('destroy', function () {
                rememberPlayback(activePlayback);
                activePlayback = null;
            });
            player.follow('close', scheduleHistory);
        }
        if (Lampa.Timeline && Lampa.Timeline.listener) {
            Lampa.Timeline.listener.follow('update', function (event) {
                var update = event && event.data;
                var live = activePlayback && activePlayback.timeline;
                if (live && update && String(update.hash) === String(live.hash)) rememberPlayback(activePlayback, update);
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
        var connection = connectedYummy();
        if (!connection) {
            accountCache = null;
            yummyCache = maps();
            return Promise.resolve({favorites: []});
        }
        var api = connection.api;
        if (accountCache && sameYummy(accountCache.connection) && accountCache.until > Date.now()) return accountCache.promise;
        var user = connection.userId ? Promise.resolve(connection.userId) : Promise.resolve().then(function () {
            return api.profile();
        }).then(function (payload) {
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
                var subject = item.anime || item;
                var list = item.user && item.user.list || item.user_list || item.list_state ||
                    subject.user && subject.user.list || subject.user_list || {};
                if (list.is_fav || list.is_favorite || list.favorite || item.is_fav || item.is_favorite ||
                    subject.is_favorite || subject.yani_is_favorite) favorites.push(card);
            });
            return sameYummy(connection) ? {favorites: uniqueCards(favorites), verified: true} : {favorites: []};
        }).catch(function () {
            if (accountCache && accountCache.promise === promise) accountCache = null;
            return {favorites: []};
        });
        accountCache = {connection: connection, until: Date.now() + 120000, promise: promise};
        return promise;
    }

    function nearbyYummy(db, seed, id, connection) {
        var api = connection.api;
        if (typeof api.recommendations !== 'function') return Promise.resolve([]);
        var cached = yummyCache[seed.id];
        if (cached && cached.expires > Date.now() && sameYummy(cached.connection)) return cached.pending;
        var target = id > 0 ? Promise.resolve(id) : Promise.resolve().then(function () {
            return typeof api.search === 'function' ? api.search(seed.title, {limit: 12}) : [];
        }).then(function (payload) {
            var matches = api.normalize(payload).map(anime).filter(function (source) {
                return source && matchCatalog(db, source) === seed;
            });
            return matches[0] && matches[0].id;
        });
        var pending = target.then(function (yani) {
            return yani && sameYummy(connection) ? api.recommendations(yani) : [];
        }).then(function (payload) {
            if (!sameYummy(connection)) return [];
            return api.normalize(payload).slice(0, 20).map(function (item, index) {
                var match = matchCatalog(db, anime(item));
                return match ? {seed: seed.id, id: match.id, rank: index} : null;
            }).filter(Boolean);
        }).catch(function () {
            if (yummyCache[seed.id] && yummyCache[seed.id].pending === pending) delete yummyCache[seed.id];
            return [];
        });
        if (Object.keys(yummyCache).length >= 30) yummyCache = maps();
        yummyCache[seed.id] = {connection: connection, expires: Date.now() + 300000, pending: pending};
        return pending;
    }

    function yummySuggestions(db, seeds, prefs, watch, account) {
        var connection = connectedYummy();
        if (!connection || !account.verified) return Promise.resolve([]);
        return Promise.all(seeds.slice(0, 3).map(function (seed) {
            var history = watch[seed.card.id];
            return nearbyYummy(db, seed.card, prefs.supplemental[seed.card.id] || history && history.yani, connection);
        })).then(function (groups) {
            return sameYummy(connection) ? [].concat.apply([], groups) : [];
        });
    }

    function openDetail(card) {
        Lampa.Activity.push({component: 'yani_detail', id: card.id, yani_id: card.id, title: card.title,
            url: 'yani/detail/' + card.id, card: {yani_id: card.id, title: card.title, yani_titles: card.titles, poster: card.poster,
                img: card.poster, release_date: String(card.year || ''), yani_rating: card.rating}});
    }

    function button(text, action, className) {
        return $('<div class="selector"></div>').addClass(className || 'simple-button anime-taste__button').text(text).on('hover:enter', action);
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

    function openTaste(mode, card, focus) {
        Lampa.Activity.push({url: 'anime-taste', title: 'Аниме', component: COMPONENT, tasteMode: mode, tasteCard: card, tasteFocus: focus});
    }

    function useNativeAnimeRoute() {
        var push = Lampa.Activity.push;
        Lampa.Activity.push = function (target) {
            if (!target || target.component !== 'category' || target.url !== 'anime') return push.apply(this, arguments);
            return push.call(this, Object.assign({}, target, {
                component: COMPONENT, title: 'Аниме', tasteMode: 'recommendations'
            }));
        };
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
        useNativeAnimeRoute();
        registerSearch();
        monitorHistory();
        var menu = $('<li class="menu__item selector" data-action="anime_taste"></li>');
        menu.append($('<div class="menu__ico" aria-hidden="true"></div>').text('♥'));
        menu.append($('<div class="menu__text"></div>').text('Аниме'));
        menu.on('hover:enter', function () { openTaste('recommendations'); });
        function mountMenu() {
            var target = $('.menu .menu__list').first();
            var nativeAnime = $('.menu [data-action="anime"]').first();
            if (nativeAnime.length) menu.detach();
            else if (target.length && !target.find('[data-action="anime_taste"]').length) target.append(menu);
            installCardButtons();
        }
        mountMenu();
        Lampa.Listener.follow('activity', function (event) {
            if (event.type !== 'start') return;
            mountMenu();
        });
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
            '.activity__body .anime-taste{min-height:100%;padding:.6em 1.5em 2em;background:#30394d;color:#f5f6fa}',
            'body.anime-taste-open .wrap__content{background:#30394d}',
            'body.anime-taste-open .head{background:#30394d!important;box-shadow:none!important}',
            '.anime-taste__toolbar,.anime-taste__interests{display:flex;flex-wrap:wrap;margin-bottom:.32em}',
            '.anime-taste .anime-taste__button{margin:.18em .45em .18em 0;padding:.52em .82em;border-radius:.8em;background:#46536a;color:#f5f6fa;opacity:1}',
            '.anime-taste .anime-taste__button.is-current{background:#677891;color:#fff}',
            '.anime-taste .anime-taste__button.focus{background:#f6f8fc;color:#172032}',
            '.anime-taste__hero{position:relative;overflow:hidden;display:flex;align-items:flex-end;min-height:8.4em;margin:.5em 0 .9em;padding:1em 1.3em;border-radius:.85em;background:#465570}',
            '.anime-taste__hero .card__img{position:absolute;right:0;top:0;width:55%;height:100%;object-fit:cover;object-position:50% 33%}',
            '.anime-taste__hero:after{content:"";position:absolute;top:0;right:0;bottom:0;left:0;background:linear-gradient(90deg,#465570 44%,rgba(70,85,112,0) 83%);pointer-events:none}',
            '.anime-taste__hero-copy{position:relative;z-index:1;width:66%;text-shadow:0 1px 3px #30394d}',
            '.anime-taste__hero-title{font-size:1.85em;font-weight:700;line-height:1.12}',
            '.anime-taste__hero-meta{margin-top:.45em;color:#f0f3f9}',
            '.anime-taste__message{margin:.6em 0 .8em;line-height:1.4}',
            '.anime-taste__message:empty{display:none}',
            '.anime-taste__grid{display:flex;flex-wrap:wrap;align-items:flex-start}',
            '.anime-taste__grid .anime-taste__row{width:20%;padding:0 .6em 1.3em;box-sizing:border-box}',
            '.anime-taste__shelf{margin:.4em 0 1em}',
            '.anime-taste__shelf-head{display:flex;align-items:center;justify-content:space-between;min-height:2.4em;margin:0 .5em .4em;font-weight:600}',
            '.anime-taste__shelf .anime-taste__grid{position:relative;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}',
            '.anime-taste__shelf .anime-taste__grid::-webkit-scrollbar{display:none}',
            '.anime-taste__shelf .anime-taste__row{width:14.285%;flex:0 0 14.285%;padding:.25em .5em .65em}',
            '.anime-taste__shelf .card__title{font-size:.95em;line-height:1.2}',
            '.anime-taste__shelf .card__vote{display:block;color:#fff;background:#46536a;border-radius:.32em}',
            '.anime-taste__reason{font-size:.72em;line-height:1.28;opacity:.76;margin-top:.28em;max-height:3.84em;overflow:hidden}',
            '@media(max-width:800px){.anime-taste__grid .anime-taste__row{width:25%}}',
            '@media(max-width:700px){.anime-taste__shelf .anime-taste__row{width:20%;flex-basis:20%}}',
            '@media(max-width:540px){.anime-taste__grid .anime-taste__row{width:33.333%}.anime-taste__shelf .anime-taste__row{width:28%;flex-basis:28%}}'
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
        var flavor = property(FOCUS, object.tasteFocus) ? object.tasteFocus : 'all';
        if ((mode === 'similar' || mode === 'mark' || mode === 'card' || mode === 'bind') && !source) mode = 'recommendations';
        var query = '';
        var interest = null;
        var account = {favorites: []};
        var db, prefs, watch;
        var focusId;
        var workspace = $('<div class="anime-taste"></div>');
        var toolbar = $('<div class="anime-taste__toolbar"></div>').appendTo(workspace);
        var interests = $('<div class="anime-taste__interests"></div>').appendTo(workspace);
        var message = $('<div class="anime-taste__message"></div>').appendTo(workspace);
        var results = $('<div class="anime-taste__results"></div>').appendTo(workspace);
        var scroll = new Lampa.Scroll({mask: false, over: true, step: 220});
        scroll.append(workspace);

        function focus() {
            if (!active || destroyed || Lampa.Controller.enabled().name !== 'content') return;
            Lampa.Controller.collectionSet(workspace);
            var selected = results.find('.anime-taste__row').filter(function () { return $(this).data('tasteId') === focusId; }).first();
            Lampa.Controller.collectionFocus(selected.length ? selected[0] : false, workspace);
        }

        function drawToolbar() {
            toolbar.empty();
            interests.empty().hide();
            button('Поиск аниме', input).toggleClass('is-current', mode === 'search' || mode === 'mark').appendTo(toolbar);
            button('Рекомендации', function () { show('recommendations'); }).toggleClass('is-current', mode === 'recommendations').appendTo(toolbar);
            button('Моё любимое', function () { show('favorites'); }).toggleClass('is-current', mode === 'favorites').appendTo(toolbar);
            button('История аниме', function () { show('history'); }).toggleClass('is-current', mode === 'history').appendTo(toolbar);
            if (Object.keys(data().hidden).length) button('Скрытые', function () { show('hidden'); }).toggleClass('is-current', mode === 'hidden').appendTo(toolbar);
            button('Настройки подбора', function () { show('options'); }).toggleClass('is-current', mode === 'options').appendTo(toolbar);
        }

        function input() {
            if (!Lampa.Input || !Lampa.Input.edit) return Lampa.Noty.show('В этой сборке Lampa нет экранного ввода.');
            Lampa.Input.edit({title: 'Название аниме или название и год', value: query, free: true, nosave: true, nomic: true}, function (value) {
                query = String(value || '').trim();
                Lampa.Controller.toggle('content');
                if (query) show(mode === 'bind' ? 'bind' : 'search');
            });
        }

        function selectCard(card) {
            if (mode === 'bind') {
                rememberBinding(source, card);
                storeViews(db, historyFile(), [{source: source.source, card: card, road: source.road,
                    season: source.season, stamp: source.stamp, native: true}]);
                Lampa.Noty.show('Привязка сохранена');
                Lampa.Activity.backward();
                return;
            }
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
                {title: hidden ? 'Вернуть в рекомендации' : 'Скрыть из рекомендаций', action: function () {
                    setPreference(db, card, 'hidden', !hidden);
                    refresh();
                }}
            ];
            Object.keys(FOCUS).forEach(function (kind) {
                items.push({title: FOCUS[kind], action: function () { openTaste('similar', card, kind); }});
            });
            var feedback = prefs.feedback[card.id];
            items.push({title: 'Больше такого', action: function () {
                function vote(kind) {
                    setFeedback(card, 'positive', kind);
                    Lampa.Noty.show('Учту в рекомендациях');
                    refresh();
                }
                Lampa.Select.show({title: 'Что понравилось?', items: [
                    {title: 'Всё вместе', kind: 'all'}, {title: 'Мир', kind: 'world'}, {title: 'Сюжет', kind: 'plot'},
                    {title: 'Атмосфера', kind: 'mood'}, {title: 'Персонажи', kind: 'characters'}
                ], onSelect: function (item) { vote(item.kind); }, onBack: function () { Lampa.Controller.toggle('content'); }});
            }});
            items.push({title: 'Не моё', action: function () { setFeedback(card, 'negative'); refresh(); }});
            items.push({title: 'Уже видел', action: function () { setFeedback(card, 'seen'); refresh(); }});
            if (feedback) items.push({title: 'Снять оценку', action: function () { setFeedback(card, null); refresh(); }});
            if (mode !== 'card') items.push({title: 'Описание и темы', action: function () { openTaste('card', card); }});
            if (yummy && window.LampaYaniDetail) items.push({
                title: 'Открыть в YummyAnime', action: function () { openDetail(Object.assign({}, card, {id: yummy})); }
            });
            Lampa.Select.show({title: card.title, items: items,
                onSelect: function (item) { item.action(); }, onBack: function () { Lampa.Controller.toggle('content'); }});
        }

        function row(card, reason, target) {
            var grid = target || results.children().last();
            if (!grid.hasClass('anime-taste__grid')) grid = $('<div class="anime-taste__grid"></div>').appendTo(results);
            var item = $(Lampa.Template.get('card', {title: '', release_year: String(card.year || '')}));
            item.addClass('anime-taste__row').on('hover:enter', function () { focusId = card.id; selectCard(card); });
            item.data('tasteId', card.id);
            item.find('.card__title').addClass('anime-taste__title').text(card.title);
            item.find('.card__age').text([card.year || '', card.type, card.age || ''].filter(Boolean).join(' · '));
            if (card.rating > 0) item.find('.card__view').append($('<div class="card__vote"></div>').text(Number(card.rating).toFixed(1)));
            showPoster(item, card);
            if (reason) item.append($('<div class="anime-taste__reason"></div>').text(reason));
            item.on('hover:focus', function () {
                focusId = card.id;
                if (target) {
                    var track = grid[0], element = item[0];
                    var left = element.offsetLeft, right = left + element.offsetWidth;
                    if (left < track.scrollLeft) track.scrollLeft = left;
                    else if (right > track.scrollLeft + track.clientWidth) track.scrollLeft = right - track.clientWidth;
                }
                scroll.update(item, true);
            });
            grid.append(item);
            return item;
        }

        function show(next) {
            mode = next;
            if (next === 'recommendations') interest = null;
            focusId = undefined;
            scroll.reset();
            refresh();
        }

        function displayHero(title, card, subtitle) {
            var hero = $('<div class="anime-taste__hero"></div>').appendTo(results);
            if (card && (card.poster || card.kitsu)) {
                $('<img class="card__img" alt="" aria-hidden="true">').appendTo(hero);
                showPoster(hero, card);
            }
            var content = $('<div class="anime-taste__hero-copy"></div>').appendTo(hero);
            $('<div class="anime-taste__hero-title"></div>').text(title).appendTo(content);
            if (subtitle) $('<div class="anime-taste__hero-meta"></div>').text(subtitle).appendTo(content);
        }

        function shelf(title) {
            var section = $('<section class="anime-taste__shelf"></section>').appendTo(results);
            var header = $('<div class="anime-taste__shelf-head"></div>').appendTo(section);
            $('<div></div>').text(title).appendTo(header);
            return {header: header, grid: $('<div class="anime-taste__grid"></div>').appendTo(section)};
        }

        function pagedShelf(title, queue, current) {
            var lane = shelf(title);
            var pending = [], busy = false, pageSize = 21;
            var more = button('Показать ещё', function () { append(true); }).addClass('anime-taste__more');
            lane.grid.data('tasteMore', function () {
                if (!more.parent().length) return false;
                append(true);
                return true;
            });
            function append(moveFocus) {
                if (busy || current !== ticket || destroyed) return;
                busy = true;
                function step() {
                    if (current !== ticket || destroyed) return;
                    if (pending.length < pageSize && queue.hasMore()) {
                        pending = pending.concat(queue.next());
                        if (pending.length < pageSize && queue.hasMore()) { setTimeout(step, 0); return; }
                    }
                    var latest = pending.splice(0, pageSize);
                    latest.forEach(function (entry) {
                        row(entry.card, entry.reasons[1] || entry.reasons[0], lane.grid).addClass('anime-taste__suggestion');
                    });
                    more.detach();
                    if (pending.length || queue.hasMore()) more.appendTo(lane.header);
                    if (!lane.grid.children().length) $('<div class="anime-taste__message"></div>').text('Подходящих аниме пока нет.').appendTo(lane.grid);
                    busy = false;
                    if (moveFocus && latest.length) focusId = latest[0].card.id;
                    focus();
                }
                if (moveFocus && pending.length < pageSize && queue.hasMore()) {
                    more.text('Загрузка…');
                    setTimeout(function () { more.text('Показать ещё'); step(); }, 0);
                } else step();
            }
            append(false);
        }

        function moveAcross(direction) {
            var selected = workspace.find('.anime-taste__shelf .anime-taste__row.focus').first();
            if (selected.length) {
                var next = direction === 'right' ? selected.next('.anime-taste__row') : selected.prev('.anime-taste__row');
                if (next.length) { Lampa.Controller.collectionFocus(next[0], workspace); return; }
                var more = selected.parent().data('tasteMore');
                if (direction === 'right' && more && more()) return;
            }
            if (window.Navigator.canmove(direction)) window.Navigator.move(direction);
            else if (direction === 'left') Lampa.Controller.toggle('menu');
        }

        function localState(saved, watch) { return JSON.stringify([saved, watch, guidance()]); }

        function historyLabel(entry) {
            var stats = watchStats(entry);
            var detail = [];
            if (entry.marked) detail.push('Отмечено просмотренным');
            if (stats.finished) detail.push('Досмотрено серий — ' + stats.finished);
            else if (entry.percent) detail.push('Начато — ' + entry.percent + '%');
            if (entry.resumed) detail.push('Возвратов — ' + entry.resumed);
            if (stats.replays) detail.push('Пересмотров — ' + stats.replays);
            return detail.join(' · ');
        }

        function refresh() {
            var current = ++ticket;
            var saved = data();
            lastStorageState = localState(saved, savedHistory());
            drawToolbar();
            results.empty();
            message.text('Загрузка…');
            focus();
            var connection = connectedYummy();
            var usesAccount = mode === 'recommendations' || mode === 'similar' || mode === 'favorites' || mode === 'options';
            var profileRequest = usesAccount ? deadline(snapshot(), {favorites: []}, 1700) :
                Promise.resolve(connection ? account : {favorites: []});
            if (mode === 'recommendations' || mode === 'similar') {
                catalog().then(function (indexed) { if (!Object.keys(indexed.story).length) return loadStories(indexed); }).catch(function () {});
            }
            Promise.all([catalog(), profileRequest]).then(function (ready) {
                if (current !== ticket || destroyed) return;
                db = ready[0];
                account = ready[1];
                prefs = preferences(db, saved, account);
                watch = consolidateHistory(db);
                lastStorageState = localState(saved, watch);
                if (mode === 'options') {
                    message.text('Видимость каталога и сохранённые оценки.');
                    button(saved.useYummy ? 'Дополнение YummyAnime — включено' : 'Дополнение YummyAnime — выключено', function () {
                        var fresh = data();
                        fresh.useYummy = !fresh.useYummy;
                        Lampa.Storage.set(STORAGE, fresh);
                        refresh();
                    }).appendTo(results);
                    button(saved.disputed ? 'Спорные карточки — показывать' : 'Спорные карточки — скрывать', function () {
                        var fresh = data();
                        fresh.disputed = !fresh.disputed;
                        Lampa.Storage.set(STORAGE, fresh);
                        refresh();
                    }).appendTo(results);
                    button('Мои оценки', function () { show('feedback'); }).appendTo(results);
                    focus();
                    return;
                }
                if (mode === 'favorites' || mode === 'hidden' || mode === 'history' || mode === 'feedback') {
                    var listing = mode === 'favorites' ? prefs.likes : mode === 'hidden' ? prefs.hidden : mode === 'feedback' ? prefs.feedback : watch;
                    var ids = Object.keys(listing).filter(function (id) { return db.ids[id] && visible(db.ids[id], prefs.disputed); });
                    if (mode === 'favorites') ids.sort(function (a, b) { return listing[b] - listing[a]; });
                    if (mode === 'history') ids.sort(function (a, b) { return listing[b].last - listing[a].last; });
                    var empty = {favorites: 'Выберите аниме в поиске и нажмите «В любимое».', feedback: 'Оценок пока нет.',
                        hidden: 'Скрытых аниме пока нет.', history: 'История пока пуста. Здесь появится аниме с сохранённым прогрессом.'};
                    message.text(ids.length ? 'Тайтлов в списке — ' + ids.length : empty[mode]);
                    if (mode === 'history') {
                        var unresolved = guidance().unresolved;
                        Object.keys(unresolved).forEach(function (key) {
                            var record = unresolved[key];
                            var title = record.source.name || record.source.original_name;
                            button('Уточнить «' + title + '»' + (record.season ? ' · сезон ' + record.season : ''), function () {
                                openTaste('bind', record);
                            }).appendTo(results);
                        });
                    }
                    function listFrom(start) {
                        ids.slice(start, start + 50).forEach(function (id) {
                            var labels = {positive: 'Больше такого', negative: 'Не моё', seen: 'Уже видел'};
                            row(db.ids[id], mode === 'history' ? historyLabel(watch[id]) :
                                mode === 'feedback' ? labels[prefs.feedback[id].action] : '');
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
                if (mode === 'mark' || mode === 'search' || mode === 'bind') {
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
                    if (mode === 'bind' && !value) value = source.source.original_name || source.source.name || '';
                    if (mode === 'mark' && source) {
                        var year = source.year || String(source.first_air_date || source.release_date || '').slice(0, 4);
                        value = String(source.title || source.name || source.original_name || '') + (year ? ' ' + year : '');
                    }
                    if (!value) { message.text('Введите название аниме.'); return; }
                    var similarQuery = mode === 'search' && /^(?:похожие на|похоже на|как|like)\s+[«"']?(.+?)\s*[»"']?$/i.exec(value);
                    if (similarQuery) value = similarQuery[1];
                    var matches = catalogueSearch(db, value, prefs.likes, prefs.disputed);
                    if (similarQuery && matches.length && matches[0].score >= 90) {
                        openTaste('similar', matches[0].card);
                        return;
                    }
                    message.text(matches.length ? (mode === 'bind' ? 'Выберите аниме для привязки истории.' : mode === 'mark' ?
                        'Выберите аниме и нажмите «В любимое».' : 'Совпадения по запросу «' + value + '».') :
                        'Подходящих аниме нет. Попробуйте другое название.');
                    matches.forEach(function (entry) { row(entry.card); });
                    if (matches.length && mode === 'search' && matches[0].score >= 90) {
                        var best = matches[0].card;
                        button('Похожие на «' + best.title + '»', function () { openTaste('similar', best); }).appendTo(results);
                    }
                    focus();
                    return;
                }
                var anchor = mode === 'similar' ? source : interest && db.ids[interest];
                var profile = tasteProfile(db, prefs, watch, anchor);
                if (!profile.seeds.length) {
                    message.text('Посмотрите аниме в Lampa или отметьте любимые тайтлы, чтобы получить рекомендации.');
                    return;
                }
                if (mode === 'recommendations' && profile.signals.length) {
                    interests.show();
                    button('Все интересы', function () { selectInterest(null); })
                        .toggleClass('is-current', !interest).appendTo(interests);
                    profile.signals.slice(0, 6).forEach(function (seed) {
                        button('Как «' + seed.card.title + '»', function () { selectInterest(seed.card.id); })
                            .toggleClass('is-current', interest === seed.card.id).appendTo(interests);
                    });
                }

                function selectInterest(id) {
                    interest = id;
                    focusId = null;
                    scroll.reset();
                    refresh();
                }

                var seeds = profile.seeds;
                function renderList(loaded) {
                    if (current !== ticket || destroyed) return;
                    var predict = tasteNetwork(db, profile.signals, profile.negative);
                    var queue = recommendationQueue(db, seeds, profile.excluded, prefs.disputed, flavor,
                        profile.negative.slice(0, 6), loaded[1], predict && {predict: predict, anchored: Boolean(anchor)});
                    message.empty();
                    var title = anchor ? 'Как «' + anchor.title + '»' : 'Аниме по вашему вкусу';
                    var subtitle = anchor ? (flavor === 'all' ? anchor.tags.filter(function (tag) { return GENRE.test(tag); })
                        .slice(0, 4).map(tagLabel).join(' · ') : FOCUS[flavor]) : 'По избранному, истории и оценкам';
                    displayHero(title, anchor || seeds[0].card, subtitle);
                    pagedShelf(anchor ? 'Похожие аниме' : 'Рекомендации для вас', queue, current);
                    if (!anchor && profile.next.length) {
                        var seasons = shelf('Следующие сезоны');
                        profile.next.forEach(function (card) { row(card, '', seasons.grid); });
                    }
                    focus();
                }
                var story = Object.keys(db.story).length ? Promise.resolve() : deadline(loadStories(db), null, 3500);
                var suggestions = connection && account.verified ?
                    deadline(yummySuggestions(db, seeds, prefs, watch, account), [], 2800) : Promise.resolve([]);
                return Promise.all([story, suggestions]).then(renderList);
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
            $('body').addClass('anime-taste-open');
            Lampa.Controller.add('content', {
                toggle: focus,
                left: function () { moveAcross('left'); },
                right: function () { moveAcross('right'); },
                up: function () { if (window.Navigator.canmove('up')) window.Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { window.Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
            if (lastStorageState !== localState(data(), savedHistory())) refresh();
        };
        page.pause = function () { active = false; $('body').removeClass('anime-taste-open'); };
        page.stop = page.pause;
        page.destroy = function () { destroyed = true; active = false; ticket++; scroll.destroy(); };
    }

    if (Lampa.Manifest) Lampa.Manifest.plugins = {type: 'other', version: '3.3.0', name: NAME, author: 'Nano',
        description: 'Независимый подбор аниме с дополнительными сигналами подключённого YummyAnime.'};
    if (window.appready) register();
    else Lampa.Listener.follow('app', function (event) { if (event.type === 'ready') register(); });
}(typeof window === 'undefined' ? {} : window));
