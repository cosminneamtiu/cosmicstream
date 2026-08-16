var page  = require('movian/page');
var http  = require('movian/http');
var store = require('movian/store');

var BASE   = 'https://www.shanaproject.com';
var PREFIX = 'streamnet_shana';
var IMG    = Plugin.path + 'img/shana/';
var LOGO   = IMG + 'shana_logo.png';
var TMDB_KEY = 'b9896a58cdbfa6752a420e406877d1a5';
var TMDB_IMG = 'https://image.tmdb.org/t/p/';

var svc = {
  lang:     'en',
  metasrc:  'anilist',
  metalang: 'en-US',
  quality:  'all'
};

function RichText(s) { this.str = String(s); }
RichText.prototype.toRichString = function() { return this.str; };
function rt(s) { return new RichText(s); }
function c(s, col) { return '<font color="' + col + '">' + s + '</font>'; }

var CW = 'FFFFFF', CGR = 'AAAAAA', CRED = 'FF4444', COR = 'FF8800';
var CGLD = 'FFD700', CYLW = 'FFFF44', CLIM = '88FF00', CGN = '00FF88';
var CTEL = '00FFDD', CCYN = '00DDFF', CSKY = '44AAFF', CPUR = 'BB66FF';
var CPNK = 'FF88BB', CCOR = 'FF6655';

var THEME = { p:'BB66FF', s:'00DDFF', a:'FFD700', t:'FF44FF' };

function th() { return THEME; }
function bg() { return IMG + 'bg_purple.png'; }

function qCol(q) {
  if (!q) return CSKY;
  if (/4k|2160/i.test(q)) return CGLD;
  if (/1080/i.test(q))    return CCYN;
  if (/720/i.test(q))     return CLIM;
  if (/480|sd/i.test(q))  return COR;
  if (/hd/i.test(q))      return CCYN;
  return CGR;
}
function rCol(r) {
  if (r >= 8) return CLIM; if (r >= 7) return CGN;
  if (r >= 6) return CYLW; if (r >= 5) return COR; return CRED;
}
function sep(label) {
  var t = th();
  return rt(c('--[ ', t.p) + c(label, t.s) + c(' ]--', t.p));
}
function setupPage(pg, title, icon) {
  pg.type = 'directory';
  pg.contents = 'list';
  pg.metadata.logo = LOGO;
  pg.metadata.background = bg();
  pg.metadata.title = title || 'Shana Project';
  if (icon) pg.metadata.icon = icon;
}

var cache = {
  data: {},
  ttl: 180000,
  get:   function(k) { var e = this.data[k]; return (e && Date.now() - e.ts < this.ttl) ? e.v : null; },
  set:   function(k, v) { this.data[k] = { v: v, ts: Date.now() }; },
  clear: function() { this.data = {}; }
};

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

function GET(url) {
  var hit = cache.get(url);
  if (hit) return hit;
  try {
    var r = http.request(url, {
      timeout: 20000, noFail: true,
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }
    });
    if (!r || r.bytes === undefined) return null;
    var text = r.toString();
    cache.set(url, text);
    return text;
  } catch(e) { return null; }
}

function apiGET(url) {
  try {
    var r = http.request(url, { noFail: true, timeout: 12000 });
    return r ? JSON.parse(r.toString()) : null;
  } catch(e) { return null; }
}

function apiPOST(url, body) {
  try {
    var r = http.request(url, {
      method: 'POST', timeout: 12000, noFail: true,
      postdata: body,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    return r ? JSON.parse(r.toString()) : null;
  } catch(e) { return null; }
}

function dec(s) {
  return (s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, function(_, n) { return String.fromCharCode(+n); });
}
function strip(s) { return (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function cleanTitle(title) {
  return (title || '')
    .replace(/\[([^\]]{1,30})\]/g, '').replace(/\(([^)]{1,20})\)/g, '')
    .replace(/\s+-\s+S\d+/gi, '').replace(/\s+Season\s+\d+/gi, '')
    .replace(/\s+Part\s+\d+/gi, '').replace(/\s+Cour\s+\d+/gi, '')
    .replace(/\s+OVA\b/gi, '').replace(/\s+ONA\b/gi, '').replace(/\s+Movie\b/gi, '')
    .replace(/\s{2,}/g, ' ').trim();
}

var favorites = {
  _list: null,
  _load: function() {
    if (this._list !== null) return;
    try {
      var raw = store.shana_favorites;
      this._list = (raw && raw !== '') ? JSON.parse(raw) : [];
    } catch(e) { this._list = []; }
  },
  _save: function() {
    try { store.shana_favorites = JSON.stringify(this._list); } catch(e) {}
  },
  has: function(id) {
    this._load();
    for (var i = 0; i < this._list.length; i++) if (this._list[i].id === id) return true;
    return false;
  },
  add: function(item) {
    this._load();
    if (!this.has(item.id)) { this._list.push(item); this._save(); }
  },
  remove: function(id) {
    this._load();
    for (var i = 0; i < this._list.length; i++) {
      if (this._list[i].id === id) { this._list.splice(i, 1); this._save(); return; }
    }
  },
  getAll: function() { this._load(); return this._list.slice(); }
};

function anilistSearch(title) {
  var r = { poster:'', backdrop:'', rating:0, overview:'', year:'', genres:'', episodes:'', status:'', studio:'' };
  var clean = cleanTitle(title);
  if (!clean || clean.length < 2) return r;
  var query = '{"query":"query($s:String){Media(search:$s,type:ANIME){title{romaji english}coverImage{extraLarge large}bannerImage averageScore genres episodes status startDate{year}studios(isMain:true){nodes{name}}description(asHtml:false)}}","variables":{"s":"' + clean.replace(/"/g, '\\"') + '"}}';
  var data = apiPOST('https://graphql.anilist.co', query);
  if (!data || !data.data || !data.data.Media) return r;
  var m = data.data.Media;
  if (m.coverImage) r.poster = m.coverImage.extraLarge || m.coverImage.large || '';
  if (m.bannerImage) r.backdrop = m.bannerImage;
  if (m.averageScore) r.rating = m.averageScore / 10;
  if (m.description) r.overview = m.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 400);
  if (m.startDate && m.startDate.year) r.year = String(m.startDate.year);
  if (m.genres && m.genres.length) r.genres = m.genres.slice(0, 3).join(' / ');
  if (m.episodes) r.episodes = String(m.episodes);
  if (m.status) r.status = m.status.charAt(0) + m.status.slice(1).toLowerCase().replace(/_/g, ' ');
  if (m.studios && m.studios.nodes && m.studios.nodes.length) r.studio = m.studios.nodes[0].name;
  return r;
}

function metaSearch(title) {
  var src = svc.metasrc || 'anilist';
  if (src === 'none') return { poster:'', backdrop:'', rating:0, overview:'', year:'', genres:'', episodes:'', status:'', studio:'' };
  return anilistSearch(title);
}

function buildMetaInfo(md) {
  var info = '';
  if (md.rating > 0) { var rc = rCol(md.rating); info += c('Rating:  ', rc) + c(md.rating.toFixed(1) + '/10', rc); }
  if (md.year)     info += (info ? '<br>' : '') + c('Year:    ', CGLD) + c(md.year, CYLW);
  if (md.genres)   info += '<br>' + c('Genre:   ', CPUR) + c(md.genres, 'FF88FF');
  if (md.episodes) info += '<br>' + c('Eps:     ', CTEL) + ' ' + c(md.episodes, CW);
  if (md.status)   info += '<br>' + c('Status:  ', CSKY) + ' ' + c(md.status, CW);
  if (md.studio)   info += '<br>' + c('Studio:  ', CCYN) + ' ' + c(md.studio, CW);
  if (md.overview && md.overview.length > 10) info += '<br><br>' + c(md.overview, CGR);
  return info;
}

// HTML parser
function nextPageUrl(html) {
  var patterns = [
    /href="([^"]+)"[^>]*>\s*Next\s*/i,
    /href="([^"]+)"[^>]*>\s*&gt;&gt;\s*/i,
    /class="list_next"[^>]*>\s*(?:&nbsp;\s*)?<a\s+href="([^"]+)"/i
  ];
  for (var pi = 0; pi < patterns.length; pi++) {
    var m = html.match(patterns[pi]);
    if (m) {
      var href = m[1] || m[2];
      if (!href) continue;
      if (href.indexOf('//') === 0) return 'https:' + href;
      if (href.indexOf('http') === 0) return href;
      return BASE + href;
    }
  }
  return null;
}

function parseReleases(html, fallbackSeriesId, fallbackTitle) {
  var releases = [], positions = [];
  var blockRe = /<div id="rel(\d+)"\s+class="release_block">/g, m;
  while ((m = blockRe.exec(html)) !== null) positions.push({ id: m[1], start: m.index });
  for (var i = 0; i < positions.length; i++) {
    var dlId  = positions[i].id;
    var start = positions[i].start;
    var end   = (i + 1 < positions.length) ? positions[i + 1].start : html.length;
    var chunk = html.substring(start, end);
    var qualClass  = chunk.indexOf('release_quality_hd') !== -1 ? 'HD' : 'SD';
    var profileM   = chunk.match(/class="release_profile">([^<]+)</);
    var profile    = profileM ? profileM[1].trim() : '';
    var qualExactM = chunk.match(/<b>Quality:<\/b>\s*([^\s<]+)/i);
    var quality    = qualExactM ? qualExactM[1].trim() : (profile || qualClass);
    var epM     = chunk.match(/class="release_episode">\s*([^<\s][^<]*?)\s*<\/div>/);
    var episode = epM ? epM[1].trim() : '?';
    var seriesId, seriesTitle;
    var serM = chunk.match(/href="\/series\/(\d+)\/"[^>]*>([^<]+)<\/a>/);
    if (serM) {
      seriesId = serM[1]; seriesTitle = dec(serM[2].trim());
    } else if (fallbackSeriesId) {
      seriesId = fallbackSeriesId;
      var txtM = chunk.match(/class="release_text_contents">([^<]+)/);
      seriesTitle = txtM ? dec(txtM[1].trim()) : (fallbackTitle || 'Series #' + fallbackSeriesId);
    } else { continue; }
    var subberBlockM = chunk.match(/class="release_subber">([\s\S]*?)<\/div>\s*<\/div>/);
    var subber = '?';
    if (subberBlockM) {
      var subLinkM = subberBlockM[1].match(/href="\/subbertag[^"]*"[^>]*>([^<]+)<\/a>/);
      if (subLinkM) { subber = dec(subLinkM[1].trim()); }
      else { var subTxtM = subberBlockM[1].match(/class="release_text_contents">\s*([^<\n\r]+?)\s*</); if (subTxtM) subber = dec(subTxtM[1].trim()); }
    }
    var sizeM = chunk.match(/class="release_size[^"]*">\s*([^<]+)\s*<\/div>/);
    var size  = sizeM ? sizeM[1].trim() : '';
    var qf = svc.quality || 'all';
    if (qf === 'hd' && qualClass !== 'HD') continue;
    if (qf === 'sd' && qualClass === 'HD') continue;
    releases.push({ dlId: dlId, seriesId: seriesId, title: seriesTitle, episode: episode,
      quality: quality, qualClass: qualClass, subber: subber, size: size,
      torrentUrl: BASE + '/download/' + dlId + '/' });
  }
  return releases;
}

function parseSeries(html) {
  var list = [], seen = {};
  var re = /href="\/series\/(\d+)\/"[^>]*>([^<]+)<\/a>/g, m;
  while ((m = re.exec(html)) !== null) {
    var id = m[1], title = dec(m[2].trim());
    if (!seen[id] && title.length > 1 && title !== 'List Titles') { seen[id] = true; list.push({ id: id, title: title }); }
  }
  return list;
}

function addRelease(pg, rel) {
  var t = th(), qc = qCol(rel.quality);
  var titleStr =
    c('[', CGR) + c('Ep ' + rel.episode, t.a) + c(']', CGR) + '  ' +
    c(rel.title, CW) + '  ' + c('[', CGR) + c(rel.quality, qc) + c(']', CGR);
  var descStr =
    c('Series:   ', CGLD) + c(rel.title,   CW)  + '<br>' +
    c('Episode:  ', t.p)  + c(rel.episode, CYLW) + '<br>' +
    c('Quality:  ', CCYN) + c(rel.quality, qc)   + '<br>' +
    c('Subber:   ', t.s)  + c(rel.subber,  CW)   +
    (rel.size ? '<br>' + c('Size:     ', CLIM) + c(rel.size, CGN) : '');
  var item = pg.appendItem(PREFIX + ':detail:' + rel.dlId + ':' + rel.seriesId, 'video', {
    title: rt(titleStr), icon: IMG + 'icon_anime.png',
    description: rt(descStr)
  });
  (function(r) {
    if (favorites.has(r.seriesId)) {
      item.addOptAction('Remove from favorites', function() { favorites.remove(r.seriesId); });
    } else {
      item.addOptAction('Add to favorites', function() { favorites.add({ id: r.seriesId, title: r.title, img: '' }); });
    }
  })(rel);
}

new page.Route(PREFIX + ':start', function(pg) {
  var t = th();
  setupPage(pg, rt(c('SHANA ', t.p) + c('PROJECT', t.s)));
  pg.flush();
  pg.appendItem(PREFIX + ':search:', 'search', { title: rt(c('Search anime...', t.s)) });
  pg.appendItem(PREFIX + ':favorites', 'directory', { title: rt(c('My Favorites', CGLD)), icon: IMG + 'icon_fav.png' });
  pg.appendItem('', 'separator', { title: sep('SECTIONS') });
  pg.appendItem(PREFIX + ':list:' + encodeURIComponent(BASE + '/'),        'video', { title: rt(c('Latest Releases', t.p)), icon: IMG + 'icon_latest.png' });
  pg.appendItem(PREFIX + ':list:' + encodeURIComponent(BASE + '/titles/'), 'video', { title: rt(c('Browse Series', CGLD)),     icon: IMG + 'icon_series.png' });
  pg.appendItem(PREFIX + ':list:' + encodeURIComponent(BASE + '/season/'), 'video', { title: rt(c('Current Season', CCYN)),    icon: IMG + 'icon_latest.png' });
  pg.appendItem('', 'separator', { title: sep('FANSUB GROUPS') });
  var subbers = [
    { id: 4023, name: 'SubsPlease', tc: CCYN }, { id: 3275, name: 'Erai-raws', tc: CLIM },
    { id: 1458, name: 'HorribleSubs', tc: COR }, { id: 2534, name: 'FFF-Fansubs', tc: CPUR },
    { id: 3588, name: 'Judas', tc: CRED }, { id: 3987, name: 'ASW', tc: CSKY },
    { id: 4456, name: 'Yameii', tc: CYLW }, { id: 4719, name: 'Onalrie', tc: CPNK }
  ];
  for (var j = 0; j < subbers.length; j++) {
    var sb = subbers[j];
    pg.appendItem(PREFIX + ':list:' + encodeURIComponent(BASE + '/subbertag/' + sb.id + '/'), 'video', {
      title: rt(c(sb.name, sb.tc)), icon: IMG + 'icon_group.png'
    });
  }
  pg.loading = false;
});

new page.Route(PREFIX + ':list:(.*)', function(pg, enc) {
  var t = th(), url = decodeURIComponent(enc);
  setupPage(pg, rt(c('Shana Project', t.p)));
  pg.flush(); pg.loading = true;
  var currentUrl = url, pageNum = 1, hasMore = true;
  while (hasMore) {
    var html = GET(currentUrl);
    if (!html) { hasMore = false; break; }
    if (pageNum === 1) { var h2M = html.match(/<h2[^>]*>([^<]+)<\/h2>/i); if (h2M) pg.metadata.title = rt(c(dec(strip(h2M[1])), t.p)); }
    var rels = parseReleases(html);
    if (rels.length === 0) {
      var series = parseSeries(html);
      if (series.length > 0) {
        for (var si = 0; si < series.length; si++) {
          pg.appendItem(PREFIX + ':series:' + series[si].id, 'directory', {
            title: rt(c(series[si].title, CW)), icon: IMG + 'icon_anime.png'
          });
        }
        var nextS = nextPageUrl(html);
        if (!nextS || nextS === currentUrl) { hasMore = false; } else { currentUrl = nextS; pageNum++; }
      } else { hasMore = false; }
    } else {
      for (var ri = 0; ri < rels.length; ri++) addRelease(pg, rels[ri]);
      var next = nextPageUrl(html);
      if (!next || next === currentUrl) { hasMore = false; } else { currentUrl = next; pageNum++; }
    }
  }
  pg.loading = false;
});

new page.Route(PREFIX + ':series:(\\d+)', function(pg, seriesId) {
  var t = th();
  setupPage(pg, rt(c('Loading...', t.p))); pg.flush(); pg.loading = true;
  var html = GET(BASE + '/series/' + seriesId + '/');
  if (!html) { pg.appendPassiveItem('video', '', { title: rt(c('Connection error', CRED)), icon: LOGO }); pg.loading = false; return; }
  var h1M = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  var serTitle = h1M ? dec(strip(h1M[1])) : 'Series #' + seriesId;
  pg.metadata.title = rt(c(serTitle, t.t));
  var finalPoster = '';
  try {
    var md = metaSearch(serTitle);
    if (md.poster) { finalPoster = md.poster; pg.metadata.icon = md.poster; pg.metadata.backdrops = [{ url: md.poster }]; }
    if (md.backdrop) pg.metadata.background = md.backdrop;
    var info = buildMetaInfo(md);
    if (info) pg.appendPassiveItem('video', '', { title: rt(c(serTitle, t.t)), icon: finalPoster || LOGO, description: rt(info) });
  } catch(e) {}
  pg.appendItem('', 'separator', { title: sep('EPISODES') });
  var rels = parseReleases(html, seriesId, serTitle);
  if (rels.length === 0) {
    pg.appendPassiveItem('video', '', { title: rt(c('No releases', COR)), icon: LOGO });
  } else {
    for (var i = 0; i < rels.length; i++) addRelease(pg, rels[i]);
  }
  pg.appendItem('', 'separator', { title: sep('OPTIONS') });
  if (favorites.has(seriesId)) {
    pg.appendItem(PREFIX + ':unfav:' + seriesId + ':' + encodeURIComponent(serTitle), 'directory', {
      title: rt(c('Remove from favorites', CGLD)), icon: IMG + 'icon_fav.png'
    });
  } else {
    pg.appendItem(PREFIX + ':fav:' + seriesId + ':' + encodeURIComponent(serTitle), 'directory', {
      title: rt(c('Add to favorites', CYLW)), icon: IMG + 'icon_fav.png'
    });
  }
  pg.loading = false;
});

new page.Route(PREFIX + ':detail:(\\d+):(\\d+)', function(pg, dlId, seriesId) {
  var t = th();
  setupPage(pg, rt(c('Loading...', t.p))); pg.flush(); pg.loading = true;
  var html = GET(BASE + '/series/' + seriesId + '/');
  var serTitle = 'Release #' + dlId;
  if (html) { var h1M = html.match(/<h1[^>]*>([^<]+)<\/h1>/i); if (h1M) serTitle = dec(strip(h1M[1])); }
  pg.metadata.title = rt(c(serTitle, t.t));
  var finalPoster = '';
  try {
    var md = metaSearch(serTitle);
    if (md.poster) { finalPoster = md.poster; pg.metadata.icon = md.poster; pg.metadata.backdrops = [{ url: md.poster }]; }
    if (md.backdrop) pg.metadata.background = md.backdrop;
    var info = buildMetaInfo(md);
    if (info) pg.appendPassiveItem('video', '', { title: rt(c(serTitle, t.t)), icon: finalPoster || LOGO, description: rt(info) });
  } catch(e) {}
  pg.appendItem('', 'separator', { title: sep('DOWNLOAD') });
  var torrentUrl = BASE + '/download/' + dlId + '/';
  var torItem = pg.appendItem(torrentUrl, 'video', {
    title: rt(c('[TORRENT]', CCYN) + '  ' + c(serTitle, CW)),
    icon: IMG + 'icon_torrent.png',
    description: rt(c('Series: ', CGLD) + c(serTitle, CW) + '<br>' + c('URL:   ', CCYN) + c(torrentUrl, CTEL))
  });
  (function(sid, stitle) {
    if (favorites.has(sid)) {
      torItem.addOptAction('Remove from favorites', function() { favorites.remove(sid); });
    } else {
      torItem.addOptAction('Add to favorites', function() { favorites.add({ id: sid, title: stitle, img: finalPoster || '' }); });
    }
  })(seriesId, serTitle);
  pg.appendItem('', 'separator', { title: sep('MORE EPISODES') });
  pg.appendItem(PREFIX + ':series:' + seriesId, 'directory', {
    title: rt(c('View all episodes: ' + serTitle, CGLD)),
    icon: finalPoster || IMG + 'icon_series.png'
  });
  pg.loading = false;
});

new page.Route(PREFIX + ':favorites', function(pg) {
  var t = th();
  setupPage(pg, rt(c('MY FAVORITES', t.p)), IMG + 'icon_fav.png'); pg.flush();
  var list = favorites.getAll();
  if (list.length === 0) {
    pg.appendPassiveItem('video', '', { title: rt(c('No saved favorites', COR)), icon: IMG + 'icon_fav.png' });
  } else {
    for (var i = 0; i < list.length; i++) {
      var fav  = list[i];
      var item = pg.appendItem(PREFIX + ':series:' + fav.id, 'directory', {
        title: rt(c(fav.title, CW)), icon: fav.img || IMG + 'icon_anime.png'
      });
      (function(f) {
        item.addOptAction('Remove from favorites', function() { favorites.remove(f.id); });
      })(fav);
    }
  }
  pg.loading = false;
});

new page.Route(PREFIX + ':fav:(\\d+):(.*)', function(pg, seriesId, enc) {
  favorites.add({ id: seriesId, title: decodeURIComponent(enc), img: '' });
  pg.redirect(PREFIX + ':series:' + seriesId);
});
new page.Route(PREFIX + ':unfav:(\\d+):(.*)', function(pg, seriesId, enc) {
  favorites.remove(seriesId);
  pg.redirect(PREFIX + ':series:' + seriesId);
});

new page.Route(PREFIX + ':search:(.*)', function(pg, enc) {
  var t = th(), query = decodeURIComponent(enc);
  setupPage(pg, rt(c('Search: ', t.p) + c(query || '...', t.s))); pg.flush();
  if (!query || query.trim() === '') { pg.loading = false; return; }
  var html = GET(BASE + '/search/?title=' + encodeURIComponent(query));
  if (!html) { pg.appendPassiveItem('video', '', { title: rt(c('Connection error', CRED)), icon: LOGO }); pg.loading = false; return; }
  var series = parseSeries(html), seen = {};
  if (series.length > 0) {
    pg.appendItem('', 'separator', { title: sep('SERIES') });
    for (var si = 0; si < series.length; si++) {
      if (seen[series[si].id]) continue;
      seen[series[si].id] = true;
      pg.appendItem(PREFIX + ':series:' + series[si].id, 'directory', { title: rt(c(series[si].title, CW)), icon: IMG + 'icon_anime.png' });
    }
  }
  var rels = parseReleases(html);
  if (rels.length > 0) { pg.appendItem('', 'separator', { title: sep('RELEASES') }); for (var ri = 0; ri < rels.length; ri++) addRelease(pg, rels[ri]); }
  if (series.length === 0 && rels.length === 0) {
    pg.appendPassiveItem('video', '', { title: rt(c('No results for: ' + query, COR)), icon: LOGO });
  }
  pg.loading = false;
});


exports.id          = 'shanaproject';
exports.name        = 'Shana Project';
exports.description = 'Fansub anime tracker from ShanaProject.com';
exports.categories  = ['anime'];
exports.adult       = false;
exports.icon        = LOGO;
exports.background  = bg();

exports.search = function(pg, query, logo, addSeparator) {
  try {
    if (!query || query.trim() === '') return 0;
    var html = GET(BASE + '/search/?title=' + encodeURIComponent(query));
    if (!html) return 0;
    var series = parseSeries(html), seen = {}, count = 0;
    if (addSeparator && series.length > 0) pg.appendItem('', 'separator', { title: '===== SHANA PROJECT =====' });
    for (var si = 0; si < series.length; si++) {
      if (seen[series[si].id]) continue;
      seen[series[si].id] = true;
      pg.appendItem(PREFIX + ':series:' + series[si].id, 'directory', {
        title: series[si].title, icon: IMG + 'icon_anime.png'
      });
      count++;
    }
    var rels = parseReleases(html);
    for (var ri = 0; ri < rels.length; ri++) { addRelease(pg, rels[ri]); count++; }
    return count;
  } catch(e) { return 0; }
};

exports.browse = function(pg, logo) {
  var t = th();
  pg.appendItem(PREFIX + ':list:' + encodeURIComponent(BASE + '/'),        'video', { title: 'Latest Releases', icon: IMG + 'icon_latest.png' });
  pg.appendItem(PREFIX + ':list:' + encodeURIComponent(BASE + '/titles/'), 'video', { title: 'Browse Series',      icon: IMG + 'icon_series.png' });
  pg.appendItem(PREFIX + ':list:' + encodeURIComponent(BASE + '/season/'), 'video', { title: 'Current Season',     icon: IMG + 'icon_latest.png' });
  pg.appendItem(PREFIX + ':favorites', 'directory', { title: 'My Favorites', icon: IMG + 'icon_fav.png' });
};
