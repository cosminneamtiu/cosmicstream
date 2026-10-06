var http     = require('movian/http');
var metadata = require('../metadata');

var BASE = 'https://torrentio.strem.fun';

exports.id          = 'torrentio';
exports.name        = 'Torrentio';
exports.description = 'Aggregated torrent streams from Torrentio';
exports.icon        = 'https://torrentio.strem.fun/images/logo_v1.png';
exports.background  = '';

function httpGet(url) {
    try {
        var r = http.request(url, { method: 'GET', timeout: 20000, noFail: true });
        if (!r || r.bytes === undefined) return null;
        return r.toString();
    } catch(e) {
        console.log('Torrentio request failed: ' + url + ' | ' + e);
        return null;
    }
}

function buildMagnet(stream, fallbackName) {
    if (!stream.infoHash) return null;
    var infoHash = String(stream.infoHash).toLowerCase();
    var filename = stream.behaviorHints && stream.behaviorHints.filename
        ? stream.behaviorHints.filename
        : fallbackName;
    var magnet = 'magnet:?xt=urn:btih:' + infoHash + '&dn=' + encodeURIComponent(filename);

    if (stream.fileIdx !== undefined && stream.fileIdx !== null) {
        magnet += '&so=' + encodeURIComponent(stream.fileIdx);
    }

    if (stream.sources && stream.sources.length) {
        for (var i = 0; i < stream.sources.length; i++) {
            var src = stream.sources[i];
            if (typeof src === 'string' && src.indexOf('tracker:') === 0) {
                magnet += '&tr=' + encodeURIComponent(src.substring(8));
            }
        }
    }

    return magnet;
}

function buildPlayUrl(magnet, title, season, episode, episodeTitle, canonicalUrl) {
    return 'videoparams:' + JSON.stringify({
        title: episodeTitle || title,
        canonicalUrl: canonicalUrl || '',
        no_fs_scan: true,
        sources: [{ url: 'torrent:video:' + magnet }]
    });
}

exports.search = function(pg, query, logo, addSeparator) {
    return 0;
};

function isPs3Compatible(name, title) {
    var text = (name || '') + ' ' + (title || '');
    text = text.toLowerCase();

    var blocked = [
        // Codecs PS3 cannot hardware-decode / is too slow for
        { term: 'h265',     word: true },
        { term: 'x265',     word: true },
        { term: 'hevc',     word: true },
        { term: 'av1',      word: true },
        { term: 'vp9',      word: true },
        { term: 'h266',     word: true },
        { term: 'vvc',      word: true },
        { term: '10bit',    word: true },
        { term: '10-bit',   word: false },
        { term: 'hi10',     word: true },
        { term: 'hi10p',    word: true },
        // Resolutions above 1080p
        { term: '2160p',    word: true },
        { term: '4320p',    word: true },
        { term: '1440p',    word: true },
        { term: '4k',       word: true },
        { term: 'uhd',      word: true },
        { term: 'ultrahd',  word: true },
        // HDR / Dolby Vision
        { term: 'hdr',      word: true },
        { term: 'hdr10',    word: true },
        { term: 'hdr10+',   word: false },
        { term: 'dovi',     word: true },
        { term: 'dolbyvision', word: true },
        { term: 'dolby vision', word: false }
    ];

    for (var i = 0; i < blocked.length; i++) {
        var b = blocked[i];
        if (b.word) {
            var re = new RegExp('\\b' + b.term.replace(/\+/g, '\\+') + '\\b');
            if (re.test(text)) return false;
        } else {
            if (text.indexOf(b.term) !== -1) return false;
        }
    }

    return true;
}

exports.addStreams = function(pg, title, type, season, episode, episodeTitle, canonicalUrl, ps3Only) {
    try {
        var imdbId = type === 'movie'
            ? metadata.getMovieImdbId(title)
            : metadata.getShowImdbId(title);
        if (!imdbId) {
            console.log('Torrentio: no IMDB id for ' + title);
            return 0;
        }

        var endpoint = type === 'movie'
            ? BASE + '/stream/movie/' + imdbId + '.json'
            : BASE + '/stream/series/' + imdbId + ':' + season + ':' + episode + '.json';

        var body = httpGet(endpoint);
        if (!body) return 0;

        var data = JSON.parse(body);
        if (!data || !data.streams || !data.streams.length) return 0;

        var items = [];
        for (var i = 0; i < data.streams.length; i++) {
            var s = data.streams[i];
            var magnet = buildMagnet(s, title);
            if (!magnet) continue;
            if (ps3Only && !isPs3Compatible(s.name, s.title)) continue;

            var playUrl = buildPlayUrl(magnet, title, season, episode, episodeTitle, canonicalUrl);
            var label = s.name ? String(s.name).replace(/\n/g, ' | ') : title;
            var desc = s.title ? String(s.title) : '';

            items.push({ url: playUrl, title: label, description: desc });
        }

        if (!items.length) return 0;

        pg.appendItem('', 'separator', { title: '===== TORRENTIO =====' });
        for (var j = 0; j < items.length; j++) {
            var it = items[j];
            pg.appendItem(it.url, 'video', {
                title: it.title,
                description: it.description,
                icon: exports.icon
            });
        }

        return items.length;
    } catch(e) {
        console.log('Torrentio addStreams error: ' + e);
        return 0;
    }
};
