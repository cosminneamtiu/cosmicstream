var page = require('movian/page');
var http = require('movian/http');

var PREFIX = 'streamnet_nyaa';
var BASE_URL = 'https://nyaa.si';
var IMG = Plugin.path + 'img/nyaa/';
var LOGO = IMG + 'logo.png';
var BG = IMG + 'bg.png';

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function httpGet(url) {
    try {
        var r = http.request(url, { timeout: 15000, noFail: true, headers: { 'User-Agent': UA } });
        if (!r || r.bytes === undefined) return null;
        return r.toString();
    } catch(e) { return null; }
}

function extractTorrents(html) {
    var torrents = [];
    if (!html) return torrents;
    var tableM = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tableM) return torrents;
    var rowRe = /<tr class="[^"]*">([\s\S]*?)<\/tr>/g;
    var row;
    while ((row = rowRe.exec(tableM[1])) !== null) {
        var r = row[1];
        var titleM  = r.match(/<a href="\/view\/\d+" title="([^"]*)"/);
        var magnetM = r.match(/<a href="(magnet:\?[^"]*)"/);
        var sizeM   = r.match(/<td class="text-center">([^<]*?(?:MiB|GiB|KiB))<\/td>/);
        var seedM   = r.match(/<td class="text-center">(\d+)<\/td>\s*<td class="text-center">(\d+)<\/td>\s*<td class="text-center">(\d+)<\/td>/);
        var catM    = r.match(/<a href="\/?c=([^"]*)" title="([^"]*)"/);
        if (titleM && magnetM) {
            torrents.push({
                title:     titleM[1],
                magnet:    magnetM[1],
                size:      sizeM   ? sizeM[1]   : 'N/A',
                seeders:   seedM   ? seedM[1]   : '0',
                leechers:  seedM   ? seedM[2]   : '0',
                downloads: seedM   ? seedM[3]   : '0',
                category:  catM    ? catM[2]    : 'Unknown'
            });
        }
    }
    return torrents;
}

exports.id          = 'nyaa';
exports.name        = 'Nyaa';
exports.description = 'Anime torrents from nyaa.si';
exports.categories  = ['anime'];
exports.adult       = false;
exports.icon        = LOGO;
exports.background  = BG;

exports.search = function(pg, query, logo, addSeparator) {
    try {
        if (!query || query.trim() === '') return 0;
        var html = httpGet(BASE_URL + '/?q=' + encodeURIComponent(query));
        if (!html) return 0;
        var torrents = extractTorrents(html);
        if (!torrents.length) return 0;
        if (addSeparator) pg.appendItem('', 'separator', { title: '===== NYAA =====' });
        for (var i = 0; i < torrents.length; i++) {
            var t = torrents[i];
            pg.appendItem(t.magnet, 'video', {
                title: t.title,
                icon: LOGO,
                description: 'Category: ' + t.category + ' | Size: ' + t.size + ' | Seeders: ' + t.seeders + ' | Leechers: ' + t.leechers
            });
        }
        return torrents.length;
    } catch(e) { return 0; }
};
