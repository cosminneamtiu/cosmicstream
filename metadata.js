// CosmicStream TMDB metadata wrapper
// Lightweight, PS3-friendly, no adult content.

var http = require('movian/http');

var API_KEY = 'a0d71cffe2d6693d462af9e4f336bc06';
var POSTER   = 'https://image.tmdb.org/t/p/w300';
var BACKDROP = 'https://image.tmdb.org/t/p/w780';
var BASE     = 'https://api.themoviedb.org/3';

var cache = { data: {}, ttl: 300000 };
cache.get = function(k) { var e = this.data[k]; return (e && Date.now() - e.ts < this.ttl) ? e.v : null; };
cache.set = function(k, v) { this.data[k] = { v: v, ts: Date.now() }; };

var filterAdult = true;
exports.setFilterAdult = function(v) { filterAdult = v; };
function isAdultFiltered(item) { return filterAdult && item.adult === true; }

function req(url) {
  var hit = cache.get(url);
  if (hit) return hit;
  try {
    var r = http.request(url, { method: 'GET', timeout: 15000, noFail: true });
    if (!r || r.bytes === undefined) return null;
    var json = JSON.parse(r.toString());
    cache.set(url, json);
    return json;
  } catch(e) {
    console.log('TMDB request failed: ' + url + ' | ' + e);
    return null;
  }
}

function parseTitleYear(input) {
  var m = String(input).match(/^(.*?)\s*\((\d{4})\)\s*$/);
  return m ? { title: m[1].trim(), year: m[2] } : { title: String(input).trim(), year: null };
}

var GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

function getGenres(ids) {
  var out = [];
  if (!ids) return 'Unknown';
  for (var i = 0; i < ids.length; i++) {
    if (GENRE_MAP[ids[i]]) out.push(GENRE_MAP[ids[i]]);
  }
  return out.length ? out.join(', ') : 'Unknown';
}

function backdropPath(item) {
  if (item && item.backdrop_path) return BACKDROP + item.backdrop_path;
  if (item && item.poster_path) return POSTER + item.poster_path;
  return '';
}

function buildResult(item, forceType) {
  if (isAdultFiltered(item)) return null;
  var type = forceType || item.media_type;
  if (type !== 'movie' && type !== 'tv') return null;
  var title, year, date;
  if (type === 'movie') {
    title = item.title || item.original_title || 'Unknown';
    date = item.release_date;
    year = date ? date.substring(0, 4) : 'Unknown';
  } else {
    title = item.name || item.original_name || 'Unknown';
    date = item.first_air_date;
    year = date ? date.substring(0, 4) : 'Unknown';
  }
  var icon = backdropPath(item);
  return {
    title: title + ' (' + year + ')',
    baseTitle: title,
    year: year,
    type: type === 'movie' ? 'movie' : 'show',
    icon: icon,
    genres: getGenres(item.genre_ids || []),
    id: item.id
  };
}

function fetchPage(apiUrl, forceType) {
  var json = req(apiUrl);
  if (!json || !json.results) return [];
  var out = [];
  for (var i = 0; i < json.results.length; i++) {
    var r = buildResult(json.results[i], forceType);
    if (r) out.push(r);
  }
  return out;
}

exports.searchMulti = function(query, pages) {
  pages = pages || 1;
  var out = [];
  for (var p = 1; p <= pages; p++) {
    var url = BASE + '/search/multi?api_key=' + API_KEY + '&query=' + encodeURIComponent(query) + '&page=' + p;
    var list = fetchPage(url);
    for (var i = 0; i < list.length; i++) out.push(list[i]);
  }
  return out;
};

exports.getPopularShows = function(pages) {
  pages = pages || 1;
  var out = [];
  for (var p = 1; p <= pages; p++) {
    var url = BASE + '/tv/popular?api_key=' + API_KEY + '&page=' + p;
    var list = fetchPage(url, 'tv');
    for (var i = 0; i < list.length; i++) {
      if (list[i].type === 'show') out.push(list[i]);
    }
  }
  return out;
};

exports.getPopularMovies = function(pages) {
  pages = pages || 1;
  var out = [];
  for (var p = 1; p <= pages; p++) {
    var url = BASE + '/movie/popular?api_key=' + API_KEY + '&page=' + p;
    var list = fetchPage(url, 'movie');
    for (var i = 0; i < list.length; i++) {
      if (list[i].type === 'movie') out.push(list[i]);
    }
  }
  return out;
};

function resolveShow(titleWithYear) {
  var py = parseTitleYear(titleWithYear);
  var url = BASE + '/search/tv?api_key=' + API_KEY + '&query=' + encodeURIComponent(py.title);
  if (py.year) url += '&first_air_date_year=' + py.year;
  var json = req(url);
  if (!json || !json.results || !json.results.length) return null;
  for (var i = 0; i < json.results.length; i++) {
    var r = json.results[i];
    if (isAdultFiltered(r)) continue;
    var y = r.first_air_date ? r.first_air_date.substring(0, 4) : null;
    if (!py.year || y === py.year) return r;
  }
  return json.results[0];
}

exports.getShowSeasons = function(titleWithYear) {
  var show = resolveShow(titleWithYear);
  if (!show) return [];
  var url = BASE + '/tv/' + show.id + '?api_key=' + API_KEY;
  var json = req(url);
  if (!json || !json.seasons) return [];
  var out = [];
  for (var i = 0; i < json.seasons.length; i++) {
    var s = json.seasons[i];
    if (s.season_number === 0) continue; // skip specials
    out.push({
      seasonNumber: s.season_number,
      title: s.name || ('Season ' + s.season_number),
      icon: s.poster_path ? POSTER + s.poster_path : backdropPath(show),
      overview: s.overview || ''
    });
  }
  return out;
};

exports.getSeasonEpisodes = function(titleWithYear, seasonNumber) {
  var show = resolveShow(titleWithYear);
  if (!show) return [];
  var url = BASE + '/tv/' + show.id + '/season/' + seasonNumber + '?api_key=' + API_KEY;
  var json = req(url);
  if (!json || !json.episodes) return [];
  var out = [];
  for (var i = 0; i < json.episodes.length; i++) {
    var e = json.episodes[i];
    out.push({
      episodeNumber: e.episode_number,
      title: e.name || ('Episode ' + e.episode_number),
      overview: e.overview || '',
      still: e.still_path ? POSTER + e.still_path : backdropPath(show),
      airDate: e.air_date || ''
    });
  }
  return out;
};

exports.getMovieDetails = function(titleWithYear) {
  var py = parseTitleYear(titleWithYear);
  var url = BASE + '/search/movie?api_key=' + API_KEY + '&query=' + encodeURIComponent(py.title);
  if (py.year) url += '&year=' + py.year;
  var json = req(url);
  if (!json || !json.results || !json.results.length) return null;
  var movie = null;
  for (var i = 0; i < json.results.length; i++) {
    var r = json.results[i];
    if (isAdultFiltered(r)) continue;
    var y = r.release_date ? r.release_date.substring(0, 4) : null;
    if (!movie && (!py.year || y === py.year)) movie = r;
  }
  if (!movie) movie = json.results[0];

  var detailsUrl = BASE + '/movie/' + movie.id + '?api_key=' + API_KEY;
  var details = req(detailsUrl);
  if (!details) details = movie;

  return {
    title: movie.title || movie.original_title,
    year: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
    backdrop: backdropPath(movie),
    poster: movie.poster_path ? POSTER + movie.poster_path : '',
    overview: movie.overview || '',
    rating: movie.vote_average ? movie.vote_average.toString() : '0',
    runtime: details.runtime ? details.runtime + ' min' : 'Unknown',
    icon: backdropPath(movie)
  };
};

exports.getEpisodeDetails = function(titleWithYear, seasonNumber, episodeNumber) {
  var show = resolveShow(titleWithYear);
  if (!show) return null;
  var url = BASE + '/tv/' + show.id + '/season/' + seasonNumber + '/episode/' + episodeNumber + '?api_key=' + API_KEY;
  var json = req(url);
  if (!json) return null;
  return {
    title: json.name || ('Episode ' + episodeNumber),
    overview: json.overview || '',
    still: json.still_path ? POSTER + json.still_path : backdropPath(show),
    rating: json.vote_average ? json.vote_average.toString() : '0',
    airDate: json.air_date || ''
  };
};

exports.computeNextEpisode = function(titleWithYear, seasonNumber, episodeNumber) {
  var show = resolveShow(titleWithYear);
  if (!show) return null;

  // First check current season for next episode
  var sUrl = BASE + '/tv/' + show.id + '/season/' + seasonNumber + '?api_key=' + API_KEY;
  var sJson = req(sUrl);
  if (sJson && sJson.episodes) {
    for (var i = 0; i < sJson.episodes.length; i++) {
      if (sJson.episodes[i].episode_number === episodeNumber + 1) {
        var e = sJson.episodes[i];
        return { season: seasonNumber, episode: e.episode_number, title: e.name || ('Episode ' + e.episode_number) };
      }
    }
  }

  // No next episode in current season, try next season
  var showUrl = BASE + '/tv/' + show.id + '?api_key=' + API_KEY;
  var showJson = req(showUrl);
  if (!showJson || !showJson.seasons) return null;

  var nextSeason = 0;
  for (var j = 0; j < showJson.seasons.length; j++) {
    var sn = showJson.seasons[j].season_number;
    if (sn > seasonNumber && (nextSeason === 0 || sn < nextSeason)) {
      nextSeason = sn;
    }
  }
  if (nextSeason === 0) return null;

  var nsUrl = BASE + '/tv/' + show.id + '/season/' + nextSeason + '?api_key=' + API_KEY;
  var nsJson = req(nsUrl);
  if (!nsJson || !nsJson.episodes || !nsJson.episodes.length) return null;
  var first = nsJson.episodes[0];
  return { season: nextSeason, episode: first.episode_number, title: first.name || ('Episode ' + first.episode_number) };
};

exports.getRecommendations = function(titleWithYear, mediaType) {
  var py = parseTitleYear(titleWithYear);
  var tmdbType = mediaType === 'show' ? 'tv' : 'movie';
  var searchUrl = BASE + '/search/' + tmdbType + '?api_key=' + API_KEY + '&query=' + encodeURIComponent(py.title);
  if (py.year) searchUrl += '&year=' + py.year;
  var searchJson = req(searchUrl);
  if (!searchJson || !searchJson.results || !searchJson.results.length) return [];

  var id = searchJson.results[0].id;
  var recUrl = BASE + '/' + tmdbType + '/' + id + '/recommendations?api_key=' + API_KEY;
  var recJson = req(recUrl);
  if (!recJson || !recJson.results) return [];

  var out = [];
  for (var i = 0; i < Math.min(8, recJson.results.length); i++) {
    var item = recJson.results[i];
    var r = buildResult(item, tmdbType);
    if (r) out.push(r);
  }
  return out;
};

exports.resolveShow = resolveShow;
exports.parseTitleYear = parseTitleYear;

exports.getMovieImdbId = function(titleWithYear) {
  var py = parseTitleYear(titleWithYear);
  var url = BASE + '/search/movie?api_key=' + API_KEY + '&query=' + encodeURIComponent(py.title);
  if (py.year) url += '&year=' + py.year;
  var json = req(url);
  if (!json || !json.results || !json.results.length) return null;
  var movie = null;
  for (var i = 0; i < json.results.length; i++) {
    var r = json.results[i];
    if (isAdultFiltered(r)) continue;
    var y = r.release_date ? r.release_date.substring(0, 4) : null;
    if (!movie && (!py.year || y === py.year)) movie = r;
  }
  if (!movie) movie = json.results[0];

  var ext = req(BASE + '/movie/' + movie.id + '/external_ids?api_key=' + API_KEY);
  return ext && ext.imdb_id ? ext.imdb_id : null;
};

exports.getShowImdbId = function(titleWithYear) {
  var show = resolveShow(titleWithYear);
  if (!show || !show.id) return null;
  var ext = req(BASE + '/tv/' + show.id + '/external_ids?api_key=' + API_KEY);
  return ext && ext.imdb_id ? ext.imdb_id : null;
};
