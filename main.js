var page     = require('movian/page');
var service  = require('movian/service');
var settings = require('movian/settings');
var popup    = require('native/popup');
var prop     = require('movian/prop');

var videoscrobbler = null;
try {
    videoscrobbler = require('movian/videoscrobbler');
} catch(e) {
    console.log('VideoScrobbler not available: ' + e);
}

var plugin = JSON.parse(Plugin.manifest);
var logo   = Plugin.path + plugin.icon;
var BG     = Plugin.path + 'img/bg.png';

var shanaproject = require('./addons/shanaproject');
var bflix_tpb    = require('./addons/bflix_tpb');
var nekobt       = require('./addons/nekobt');
var nyaa         = require('./addons/nyaa');
var torrentio    = require('./addons/torrentio');
var metadata     = require('./metadata');
var history      = require('./history');

var ADDONS = [
    shanaproject, bflix_tpb, nekobt, nyaa
];

var addonEnabled = {};
var torrentioEnabled = true;
var torrentioPs3Filter = true;

var startPageContinue = { page: null, items: [], anchor: null };

service.create(plugin.title, plugin.id + ':start', 'video', true, logo);

settings.globalSettings(plugin.id, plugin.title, logo, plugin.synopsis);

settings.createDivider('Addons');
settings.createBool('cosmicstream_addon_shanaproject', 'Shana Project — Anime',      true, function(v) { addonEnabled['shanaproject'] = v; });
settings.createBool('cosmicstream_addon_bflix',        'The Pirate Bay — Torrents',  true, function(v) { addonEnabled['bflix-piratebay'] = v; });
settings.createBool('cosmicstream_addon_nekobt',       'NekoBT — Anime',             true, function(v) { addonEnabled['nekobt']       = v; });
settings.createBool('cosmicstream_addon_nyaa',         'Nyaa — Anime Torrents',      true, function(v) { addonEnabled['nyaa']         = v; });
settings.createBool('cosmicstream_addon_torrentio',    'Torrentio — Aggregated torrents', true, function(v) { torrentioEnabled = v; });
settings.createBool('cosmicstream_torrentio_ps3filter', 'Torrentio — PS3-compatible streams only', true, function(v) { torrentioPs3Filter = v; });

settings.createDivider('Interface');
settings.createBool('cosmicstream_filter_adult', 'Filter adult content', true, function(v) {
    service.filterAdult = v;
    metadata.setFilterAdult(v);
});
settings.createBool('cosmicstream_auto_advance', 'Auto-advance finished episodes', true, function(v) {
    service.autoAdvance = v;
});
settings.createAction('cosmicstream_empty_history', 'Empty watch history', function() {
    history.clear();
    popup.notify('Watch history cleared.', 3);
});

settings.createDivider('');
settings.createInfo('info', 'CosmicStream v' + plugin.version + ' by ' + plugin.author);

metadata.setFilterAdult(true);
service.autoAdvance = true;

for (var _si = 0; _si < ADDONS.length; _si++) {
    (function(a) {
        new page.Searcher(a.name, a.icon, function(p, query) {
            if (addonEnabled[a.id] === false) { p.loading = false; return; }
            p.type     = 'directory';
            p.contents = 'items';
            if (p.metadata) {
                p.metadata.logo       = a.icon;
                p.metadata.background = a.background;
                p.metadata.title      = a.name + ': ' + query;
            }
            try { a.search(p, query, a.icon, false); } catch(e) {}
            p.loading = false;
        });
    })(ADDONS[_si]);
}

if (videoscrobbler) {
    var scrobbler = new videoscrobbler.VideoScrobbler();

    scrobbler.onstop = function(data, prop, origin) {
    if (!data.canonical_url || data.canonical_url.indexOf('cosmicstream:playback:') !== 0) return;
    if (!data.duration || data.duration <= 0 || !prop.currenttime) return;

    var progress = prop.currenttime / data.duration;
    if (progress < 0.92) return;

    var rest = data.canonical_url.substring('cosmicstream:playback:'.length);
    var parts = rest.split(':');
    if (parts.length < 3) return;

    var title   = decodeURIComponent(parts[0]);
    var season  = parseInt(parts[1], 10) || 0;
    var episode = parseInt(parts[2], 10) || 0;

    history.markFinished(title, season, episode);

    if (service.autoAdvance !== false) {
        history.advanceEpisode(title, '');
    }

    refreshContinueWatching();
    };
}

function pad(n) {
    return n < 10 ? '0' + n : '' + n;
}

function setHeader(p, title) {
    if (p.metadata) {
        p.metadata.title      = title;
        p.metadata.icon       = logo;
        p.metadata.background = BG;
    }
    p.type     = 'directory';
    p.contents = 'items';
}

function textValue(v) {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (v.str) return v.str;
    return String(v);
}

function extractSeeders(title, description) {
    var text = textValue(title) + ' ' + textValue(description);
    var m = text.match(/\bSeeders[\s:]*(\d+)\b/i);
    if (m) return parseInt(m[1], 10) || 0;
    m = text.match(/\bS\s*:\s*(\d+)\b/);
    if (m) return parseInt(m[1], 10) || 0;
    m = text.match(/👤\s*(\d+)/);
    if (m) return parseInt(m[1], 10) || 0;
    return 0;
}

function convertMagnetUrl(url, context) {
    if (!url || url.indexOf('magnet:') !== 0) return url;
    if (context && context.title) {
        return plugin.id + ':playtorrent:' +
            encodeURIComponent(url) + ':' +
            encodeURIComponent(context.title) + ':' +
            (context.season || 0) + ':' +
            (context.episode || 0) + ':' +
            encodeURIComponent(context.episodeTitle || '');
    }
    return 'videoparams:' + JSON.stringify({
        title: context && context.title ? context.title : '',
        canonicalUrl: context && context.canonicalUrl ? context.canonicalUrl : '',
        no_fs_scan: true,
        sources: [{ url: 'torrent:video:' + url }]
    });
}

function collectMergedStreams(p, searchQuery, context) {
    var collected = [];
    var proxy = Object.create(p);

    var dummyItem = { addOptAction: function() { return dummyItem; } };

    proxy.appendItem = function(url, type, options) {
        if (type !== 'video') return dummyItem;
        var opts = options || {};
        var seeders = extractSeeders(opts.title, opts.description);
        var playUrl = convertMagnetUrl(url, context);
        collected.push({
            url: playUrl,
            title: opts.title,
            description: opts.description,
            icon: opts.icon,
            seeders: seeders
        });
        return dummyItem;
    };

    proxy.appendPassiveItem = function() { return dummyItem; };

    for (var i = 0; i < ADDONS.length; i++) {
        var a = ADDONS[i];
        if (addonEnabled[a.id] === false) continue;
        try { a.search(proxy, searchQuery, logo, false); } catch(e) {
            console.log('Addon search error (' + a.id + '): ' + e);
        }
    }

    if (torrentioEnabled) {
        try {
            var tType = (context.season > 0 && context.episode > 0) ? 'series' : 'movie';
            torrentio.addStreams(proxy, context.title, tType, context.season, context.episode,
                context.episodeTitle, context.canonicalUrl, torrentioPs3Filter);
        } catch(e) {
            console.log('Torrentio error: ' + e);
        }
    }

    collected.sort(function(a, b) { return b.seeders - a.seeders; });

    for (var j = 0; j < collected.length; j++) {
        var it = collected[j];
        p.appendItem(it.url, 'video', {
            title: it.title,
            description: it.description,
            icon: it.icon || logo
        });
    }

    return collected.length;
}

function refreshContinueWatching() {
    if (!startPageContinue.page) return;
    try {
        if (prop.isZombie(startPageContinue.page.model.nodes)) return;
    } catch(e) { return; }

    var p = startPageContinue.page;

    for (var i = 0; i < startPageContinue.items.length; i++) {
        try { startPageContinue.items[i].destroy(); } catch(e) {}
    }
    startPageContinue.items = [];

    var lastWatched = history.getAll().slice(0, 5);
    if (lastWatched.length === 0) return;

    var bgIcon = resolveHistoryBackdrop(lastWatched[0]);
    if (bgIcon && p.metadata) p.metadata.background = bgIcon;

    var sep = p.appendItem('', 'separator', { title: 'Continue Watching' });
    startPageContinue.items.push(sep);

    for (var j = 0; j < lastWatched.length; j++) {
        var h = lastWatched[j];
        var url, label;
        if (h.type === 'movie') {
            url = plugin.id + ':details:' + encodeURIComponent(h.title) + ':movie';
            label = h.title;
        } else {
            url = plugin.id + ':continue:' + encodeURIComponent(h.title);
            label = 'S' + pad(h.season) + 'E' + pad(h.episode);
            if (h.episodeTitle) label += ' - ' + h.episodeTitle;
        }
        var historyIcon = h.icon || resolveHistoryIcon(h);
        if (historyIcon && (!h.icon || h.icon.indexOf('image.tmdb.org') === -1)) {
            history.updateIcon(h.title, historyIcon);
        }
        var item = p.appendItem(url, 'video', {
            title: label,
            icon: historyIcon || logo
        });
        (function(t) {
            item.addOptAction('Remove from Last Watched', function() {
                history.remove(t);
                refreshContinueWatching();
            });
        })(h.title);
        startPageContinue.items.push(item);
    }

    if (startPageContinue.anchor) {
        for (var k = 0; k < startPageContinue.items.length; k++) {
            try { startPageContinue.items[k].moveBefore(startPageContinue.anchor); } catch(e) {}
        }
    }
}

function buildEpisodeQuery(title, season, episode) {
    var base = title.replace(/\s*\(\d{4}\)\s*$/, '').trim();
    return base + ' S' + pad(season) + 'E' + pad(episode);
}

function buildMovieQuery(title) {
    return title.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

function buildPlayUrl(searchQuery, title, season, episode, episodeTitle) {
    return plugin.id + ':play:' +
        encodeURIComponent(searchQuery) + ':' +
        encodeURIComponent(title) + ':' +
        (season || 0) + ':' +
        (episode || 0) + ':' +
        encodeURIComponent(episodeTitle || '');
}

function canonicalPlaybackUrl(title, season, episode) {
    return 'cosmicstream:playback:' + encodeURIComponent(title) + ':' + (season || 0) + ':' + (episode || 0);
}

function extractTitle(options, fallback) {
    if (!options || !options.title) return fallback;
    if (typeof options.title === 'string') return options.title;
    if (options.title && options.title.str) return options.title.str;
    return fallback;
}

function searchAddons(p, query, logoUrl, context) {
    var total = 0;
    var originalAppend = p.appendItem;

    p.appendItem = function(url, type, options) {
        if (type === 'video' || type === 'directory') {
            total++;
            if (type === 'video' && url && url.indexOf('magnet:') === 0) {
                if (context && context.title) {
                    url = plugin.id + ':playtorrent:' + encodeURIComponent(url) + ':' +
                        encodeURIComponent(context.title) + ':' + (context.season || 0) + ':' + (context.episode || 0) + ':' +
                        encodeURIComponent(context.episodeTitle || '');
                } else {
                    url = 'videoparams:' + JSON.stringify({
                        title: extractTitle(options, query),
                        canonicalUrl: context && context.canonicalUrl ? context.canonicalUrl : '',
                        no_fs_scan: true,
                        sources: [{ url: 'torrent:video:' + url }]
                    });
                }
            }
        }
        return originalAppend.call(p, url, type, options);
    };

    try {
        for (var i = 0; i < ADDONS.length; i++) {
            var a = ADDONS[i];
            if (addonEnabled[a.id] === false) continue;
            try {
                a.search(p, query, logoUrl, true);
            } catch(e) {
                console.log('Addon search error (' + a.id + '): ' + e);
            }
        }
    } finally {
        p.appendItem = originalAppend;
    }

    return total;
}

function resolveHistoryIcon(h) {
    // If the history record already has a valid TMDB icon URL, use it
    if (h.icon && h.icon.indexOf('image.tmdb.org') !== -1) return h.icon;

    try {
        if (h.type === 'show') {
            // For TV shows: use the show's poster (portrait art)
            var show = metadata.resolveShow(h.title);
            if (show) {
                if (show.poster_path) return 'https://image.tmdb.org/t/p/w300' + show.poster_path;
                if (show.backdrop_path) return 'https://image.tmdb.org/t/p/w780' + show.backdrop_path;
            }
        } else if (h.type === 'movie') {
            // For movies: get the movie poster
            var md = metadata.getMovieDetails(h.title);
            if (md && md.poster) return md.poster;
            if (md && md.backdrop) return md.backdrop;
        }
    } catch(e) {
        console.log('Failed to resolve icon for: ' + h.title + ' | ' + e);
    }
    return '';
}

function resolveHistoryBackdrop(h) {
    try {
        if (h.type === 'show') {
            var show = metadata.resolveShow(h.title);
            if (show && show.backdrop_path) return 'https://image.tmdb.org/t/p/w1280' + show.backdrop_path;
        } else if (h.type === 'movie') {
            var md = metadata.getMovieDetails(h.title);
            if (md && md.backdrop) return md.backdrop;
        }
    } catch(e) {}
    return '';
}

new page.Route(plugin.id + ':start', function(p) {
    setHeader(p, 'Loading...');
    p.model.contents = 'grid';
    p.loading = true;

    // Reset the live section refs for this start-page instance
    startPageContinue.page = p;
    startPageContinue.items = [];
    startPageContinue.anchor = null;

    // === SEARCH BAR — always first ===
    p.appendItem(plugin.id + ':find:', 'search', { title: 'Search shows & movies...' });
    p.appendItem('', 'separator', { title: '' });

    // === CONTINUE WATCHING ===
    var lastWatched = history.getAll().slice(0, 5);
    if (lastWatched.length > 0) {
        // Use the first watched item's backdrop as the page background
        var bgIcon = resolveHistoryBackdrop(lastWatched[0]);
        if (bgIcon && p.metadata) {
            p.metadata.background = bgIcon;
        }
        p.appendItem('', 'separator', { title: 'Continue Watching' });
        for (var i = 0; i < lastWatched.length; i++) {
            var h = lastWatched[i];
            var url, label;
            if (h.type === 'movie') {
                url = plugin.id + ':details:' + encodeURIComponent(h.title) + ':movie';
                label = h.title;
            } else {
                url = plugin.id + ':continue:' + encodeURIComponent(h.title);
                label = 'S' + pad(h.season) + 'E' + pad(h.episode);
                if (h.episodeTitle) label += ' - ' + h.episodeTitle;
            }
            // Resolve TMDB poster for this history item
            var historyIcon = resolveHistoryIcon(h);
            // Cache the resolved icon back into history so future loads are instant
            if (historyIcon && (!h.icon || h.icon.indexOf('image.tmdb.org') === -1)) {
                history.updateIcon(h.title, historyIcon);
            }
            var item = p.appendItem(url, 'video', {
                title: label,
                icon: historyIcon || logo
            });
            startPageContinue.items.push(item);
            (function(t) {
                item.addOptAction('Remove from Last Watched', function() {
                    history.remove(t);
                    refreshContinueWatching();
                });
            })(h.title);
        }
    }

    // === RECOMMENDATIONS (based on most recent watched item) ===
    var recAnchor = null;
    if (lastWatched.length > 0) {
        var recSource = lastWatched[0];
        try {
            var recs = metadata.getRecommendations(recSource.title, recSource.type);
            if (recs.length > 0) {
                recAnchor = p.appendItem('', 'separator', { title: 'Because you watched ' + recSource.title });
                p.appendItem('', 'separator', { title: '' });
                for (var ri = 0; ri < recs.length; ri++) {
                    var rec = recs[ri];
                    var recUrl = rec.type === 'movie'
                        ? plugin.id + ':details:' + encodeURIComponent(rec.title) + ':movie'
                        : plugin.id + ':show:' + encodeURIComponent(rec.title);
                    p.appendItem(recUrl, 'video', { title: rec.title, icon: rec.icon || logo });
                }
            }
        } catch(e) {
            console.log('Recommendations error: ' + e);
        }
    }

    // === TRENDING SHOWS ===
    if (p.metadata) p.metadata.title = 'Loading shows...';
    var trendingAnchor = p.appendItem('', 'separator', { title: 'Trending Shows' });
    p.appendItem('', 'separator', { title: '' });
    try {
        var shows = metadata.getPopularShows(1).slice(0, 20);
        for (var s = 0; s < shows.length; s++) {
            var sh = shows[s];
            p.appendItem(
                plugin.id + ':show:' + encodeURIComponent(sh.title),
                'video', { title: sh.title, icon: sh.icon || logo }
            );
        }
    } catch(e) {
        console.log('Trending shows error: ' + e);
    }

    // === TRENDING MOVIES ===
    if (p.metadata) p.metadata.title = 'Loading movies...';
    p.appendItem('', 'separator', { title: 'Trending Movies' });
    p.appendItem('', 'separator', { title: '' });
    try {
        var movies = metadata.getPopularMovies(1).slice(0, 20);
        for (var m = 0; m < movies.length; m++) {
            var mv = movies[m];
            p.appendItem(
                plugin.id + ':details:' + encodeURIComponent(mv.title) + ':movie',
                'video', { title: mv.title, icon: mv.icon || logo }
            );
        }
    } catch(e) {
        console.log('Trending movies error: ' + e);
    }

    // === WATCH HISTORY — at the very bottom ===
    p.appendItem('', 'separator', { title: '' });
    p.appendItem(plugin.id + ':history', 'video', { title: 'Watch History', icon: logo });

    startPageContinue.anchor = recAnchor || trendingAnchor;

    if (p.metadata) p.metadata.title = plugin.title;
    p.loading = false;
});

new page.Route(plugin.id + ':continue:(.*)', function(p, enc) {
    var title = decodeURIComponent(enc);
    var rec = history.get(title);

    if (!rec || rec.type !== 'show') {
        p.redirect(plugin.id + ':show:' + enc);
        return;
    }

    if (rec.finished) {
        var next = history.advanceEpisode(title, rec.icon);
        if (next) {
            popup.notify('Playing next episode: S' + pad(next.season) + 'E' + pad(next.episode), 3);
        }
        rec = history.get(title);
    }

    if (!rec) {
        p.redirect(plugin.id + ':show:' + enc);
        return;
    }

    var query = buildEpisodeQuery(title, rec.season, rec.episode);

    if (!rec.finished && rec.lastMagnet) {
        p.redirect(plugin.id + ':playtorrent:' + encodeURIComponent(rec.lastMagnet) + ':' +
            encodeURIComponent(title) + ':' + rec.season + ':' + rec.episode + ':' + encodeURIComponent(rec.episodeTitle));
    } else {
        var url = buildPlayUrl(query, title, rec.season, rec.episode, rec.episodeTitle);
        p.redirect(url);
    }
});

new page.Route(plugin.id + ':find:(.*)', function(p, query) {
    var decoded = decodeURIComponent(query);
    setHeader(p, 'Search');
    p.model.contents = 'grid';

    if (!decoded || decoded.trim() === '') {
        p.appendPassiveItem('video', '', { title: 'Type something to search...', icon: logo });
        p.loading = false;
        return;
    }

    p.metadata.title = 'Search: ' + decoded;
    p.loading = true;

    try {
        var results = metadata.searchMulti(decoded, 1);
        if (!results.length) {
            p.appendPassiveItem('video', '', { title: 'No results for: ' + decoded, icon: logo });
        } else {
            for (var i = 0; i < results.length; i++) {
                var r = results[i];
                var u = r.type === 'movie'
                    ? plugin.id + ':details:' + encodeURIComponent(r.title) + ':movie'
                    : plugin.id + ':show:' + encodeURIComponent(r.title);
                p.appendItem(u, 'video', { title: r.title, icon: r.icon || logo });
            }
        }
    } catch(e) {
        p.appendPassiveItem('video', '', { title: 'Search error: ' + e, icon: logo });
    }

    p.loading = false;
});

new page.Route(plugin.id + ':show:(.*)', function(p, enc) {
    var title = decodeURIComponent(enc);
    setHeader(p, title);
    p.model.contents = 'grid';
    p.loading = true;

    var rec = history.get(title);
    if (rec && rec.type === 'show') {
        var epTitle = rec.episodeTitle || ('Episode ' + rec.episode);
        var contUrl = buildPlayUrl(
            buildEpisodeQuery(title, rec.season, rec.episode),
            title, rec.season, rec.episode, epTitle
        );
        p.appendItem(contUrl, 'video', {
            title: 'Continue S' + pad(rec.season) + 'E' + pad(rec.episode) + ' - ' + epTitle,
            icon: rec.icon || logo
        });

        if (rec.finished) {
            try {
                var next = metadata.computeNextEpisode(title, rec.season, rec.episode);
                if (next) {
                    var nextUrl = buildPlayUrl(
                        buildEpisodeQuery(title, next.season, next.episode),
                        title, next.season, next.episode, next.title
                    );
                    p.appendItem(nextUrl, 'video', {
                        title: 'Next S' + pad(next.season) + 'E' + pad(next.episode) + ' - ' + next.title,
                        icon: rec.icon || logo
                    });
                }
            } catch(e) {}
        }

        p.appendItem('', 'separator', { title: 'Seasons' });
    }

    try {
        var seasons = metadata.getShowSeasons(title);
        for (var i = 0; i < seasons.length; i++) {
            var s = seasons[i];
            var u = plugin.id + ':season:' + enc + ':' + s.seasonNumber;
            p.appendItem(u, 'video', { title: s.title, icon: s.icon || logo });
        }
        if (!seasons.length) {
            p.appendPassiveItem('video', '', { title: 'No seasons found', icon: logo });
        }
    } catch(e) {
        p.appendPassiveItem('video', '', { title: 'Error loading seasons: ' + e, icon: logo });
    }

    p.loading = false;
});

new page.Route(plugin.id + ':season:(.*):(\\d+)', function(p, enc, seasonStr) {
    var title = decodeURIComponent(enc);
    var season = parseInt(seasonStr, 10);
    setHeader(p, title + ' - Season ' + season);
    p.model.contents = 'list';
    p.loading = true;

    try {
        var episodes = metadata.getSeasonEpisodes(title, season);
        for (var i = 0; i < episodes.length; i++) {
            var e = episodes[i];
            var url = buildPlayUrl(
                buildEpisodeQuery(title, season, e.episodeNumber),
                title, season, e.episodeNumber, e.title
            );
            var item = p.appendItem(url, 'video', {
                title: 'S' + pad(season) + 'E' + pad(e.episodeNumber) + ' - ' + e.title,
                description: e.overview,
                icon: e.still || logo
            });
            (function(t, s, ep, et, pageRef) {
                item.addOptAction('Mark as watched', function() {
                    history.add(t, 'show', '', s, ep, et, true);
                    var next = history.advanceEpisode(t, '');
                    if (next) {
                        popup.notify('Marked watched. Next: S' + pad(next.season) + 'E' + pad(next.episode), 3);
                    } else {
                        popup.notify('Marked as watched', 2);
                    }
                    pageRef.redirect(plugin.id + ':show:' + encodeURIComponent(t));
                });
            })(title, season, e.episodeNumber, e.title, p);
        }
        if (!episodes.length) {
            p.appendPassiveItem('video', '', { title: 'No episodes found', icon: logo });
        }
    } catch(e) {
        p.appendPassiveItem('video', '', { title: 'Error loading episodes: ' + e, icon: logo });
    }

    p.loading = false;
});

new page.Route(plugin.id + ':details:(.*):movie', function(p, enc) {
    var title = decodeURIComponent(enc);
    setHeader(p, title);
    p.model.contents = 'list';
    p.loading = true;

    try {
        var md = metadata.getMovieDetails(title);
        if (!md) {
            p.appendPassiveItem('video', '', { title: 'No details found', icon: logo });
            p.loading = false;
            return;
        }

        if (p.metadata) {
            p.metadata.background = md.backdrop || BG;
            p.metadata.icon       = md.poster || logo;
        }

        var playUrl = buildPlayUrl(buildMovieQuery(title), title, 0, 0, md.title);
        p.appendItem(playUrl, 'video', {
            title: 'Play',
            icon: logo,
            description: md.overview
        });
        p.appendItem('', 'video', { title: 'Rating: ' + md.rating, icon: logo });
        p.appendItem('', 'video', { title: 'Runtime: ' + md.runtime, icon: logo });
        p.appendItem('', 'video', { title: 'Year: ' + md.year, icon: logo });
    } catch(e) {
        p.appendPassiveItem('video', '', { title: 'Error: ' + e, icon: logo });
    }

    p.loading = false;
});

new page.Route(plugin.id + ':play:(.*):(.*):(.*):(.*):(.*)', function(p, searchEnc, titleEnc, seasonStr, episodeStr, epTitleEnc) {
    var searchQuery  = decodeURIComponent(searchEnc);
    var title        = decodeURIComponent(titleEnc);
    var season       = parseInt(seasonStr, 10) || 0;
    var episode      = parseInt(episodeStr, 10) || 0;
    var episodeTitle = decodeURIComponent(epTitleEnc);

    setHeader(p, searchQuery);
    p.model.contents = 'list';
    p.loading = true;

    if (title) {
        if (season > 0 && episode > 0) {
            var playIcon = resolveHistoryIcon({ title: title, type: 'show', season: season, episode: episode });
            history.add(title, 'show', playIcon || '', season, episode, episodeTitle, false);
        } else {
            var playIcon = resolveHistoryIcon({ title: title, type: 'movie' });
            history.add(title, 'movie', playIcon || '', 0, 0, '', false);
        }
    }

    p.appendItem('', 'separator', { title: 'Torrent results for: ' + searchQuery });

    var context = {
        title: title,
        season: season,
        episode: episode,
        episodeTitle: episodeTitle,
        canonicalUrl: canonicalPlaybackUrl(title, season, episode)
    };

    var total = 0;
    try {
        total = collectMergedStreams(p, searchQuery, context);
    } catch(e) {
        console.log('Play route error: ' + e);
    }

    if (total === 0) {
        p.appendPassiveItem('video', '', { title: 'No torrents found for: ' + searchQuery, icon: logo });
    }

    p.loading = false;
});

new page.Route(plugin.id + ':playtorrent:(.*):(.*):(.*):(.*):(.*)', function(p, magnetEnc, titleEnc, seasonStr, episodeStr, epTitleEnc) {
    var magnet       = decodeURIComponent(magnetEnc);
    var title        = decodeURIComponent(titleEnc);
    var season       = parseInt(seasonStr, 10) || 0;
    var episode      = parseInt(episodeStr, 10) || 0;
    var episodeTitle = decodeURIComponent(epTitleEnc);

    if (title && season > 0 && episode > 0) {
        var torrentIcon = resolveHistoryIcon({ title: title, type: 'show', season: season, episode: episode });
        history.add(title, 'show', torrentIcon || '', season, episode, episodeTitle, false, magnet);
    }

    var vparams = 'videoparams:' + JSON.stringify({
        title: episodeTitle || title,
        canonicalUrl: canonicalPlaybackUrl(title, season, episode),
        no_fs_scan: true,
        sources: [{ url: 'torrent:video:' + magnet }]
    });

    p.redirect(vparams);
});

new page.Route(plugin.id + ':history', function(p) {
    setHeader(p, 'Watch History');
    p.model.contents = 'grid';
    p.loading = true;

    var list = history.getAll();
    if (!list.length) {
        p.appendPassiveItem('video', '', { title: 'No watch history', icon: logo });
    } else {
        for (var i = 0; i < list.length; i++) {
            var h = list[i];
            var url, label;
            if (h.type === 'movie') {
                url = plugin.id + ':details:' + encodeURIComponent(h.title) + ':movie';
                label = h.title;
            } else {
                url = plugin.id + ':continue:' + encodeURIComponent(h.title);
                label = 'S' + pad(h.season) + 'E' + pad(h.episode);
                if (h.episodeTitle) label += ' - ' + h.episodeTitle;
            }
            var hIcon = resolveHistoryIcon(h);
            if (hIcon && (!h.icon || h.icon.indexOf('image.tmdb.org') === -1)) {
                history.updateIcon(h.title, hIcon);
            }
            var item = p.appendItem(url, 'video', {
                title: label,
                icon: hIcon || logo
            });
            (function(t, pageRef) {
                item.addOptAction('Remove from history', function() {
                    history.remove(t);
                    pageRef.redirect(plugin.id + ':history');
                });
            })(h.title, p);
        }
    }

    p.loading = false;
});

new page.Route(plugin.id + ':search:(.*)', function(p, query) {
    var decodedQuery = decodeURIComponent(query);
    if (p.metadata) {
        p.metadata.title      = 'Searching: ' + decodedQuery;
        p.metadata.icon       = logo;
        p.metadata.background = BG;
    }
    p.type     = 'directory';
    p.contents = 'items';

    if (!query || query.trim() === '') {
        p.appendPassiveItem('video', '', { title: 'Type something to search...', icon: logo });
        p.loading = false;
        return;
    }

    var total = 0;
    for (var i = 0; i < ADDONS.length; i++) {
        var a = ADDONS[i];
        if (addonEnabled[a.id] === false) continue;
        try { total += a.search(p, decodedQuery, logo, true); } catch(e) {}
    }

    if (total === 0) {
        p.appendPassiveItem('video', '', { title: 'No results for: ' + decodedQuery, icon: logo });
    }
    if (p.metadata) {
        p.metadata.title = total + ' result' + (total !== 1 ? 's' : '') + ' for: ' + decodedQuery;
    }
    p.loading = false;
});
