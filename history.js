// CosmicStream local watch history

var store = require('movian/store');
var metadata = require('./metadata');

var historyStore = store.create('cosmicstream_history');

function getAll() {
  try {
    return JSON.parse(historyStore.list || '[]');
  } catch(e) {
    return [];
  }
}

function save(list) {
  historyStore.list = JSON.stringify(list);
}

exports.getAll = getAll;

exports.get = function(title) {
  var list = getAll();
  for (var i = 0; i < list.length; i++) {
    if (list[i].title === title) return list[i];
  }
  return null;
};

exports.add = function(title, type, icon, season, episode, episodeTitle, finished, lastMagnet) {
  var list = getAll();
  var existing = null;
  var filtered = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].title === title) {
      existing = list[i];
    } else {
      filtered.push(list[i]);
    }
  }
  filtered.unshift({
    title: title,
    type: type,
    icon: icon || (existing ? existing.icon : ''),
    season: season,
    episode: episode,
    episodeTitle: episodeTitle || '',
    finished: finished === true,
    lastMagnet: lastMagnet || (existing ? existing.lastMagnet : ''),
    timestamp: Date.now()
  });
  save(filtered);
};

exports.markFinished = function(title, season, episode) {
  var list = getAll();
  var changed = false;
  for (var i = 0; i < list.length; i++) {
    var h = list[i];
    if (h.title === title && h.season === season && h.episode === episode) {
      h.finished = true;
      changed = true;
    }
  }
  if (changed) save(list);
};

exports.setLastMagnet = function(title, season, episode, magnet) {
  var list = getAll();
  var changed = false;
  for (var i = 0; i < list.length; i++) {
    var h = list[i];
    if (h.title === title && h.season === season && h.episode === episode) {
      h.lastMagnet = magnet;
      changed = true;
    }
  }
  if (changed) save(list);
};

exports.remove = function(title) {
  var list = getAll();
  var filtered = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].title !== title) filtered.push(list[i]);
  }
  save(filtered);
};

exports.clear = function() {
  save([]);
};

exports.advanceEpisode = function(title, icon) {
  var rec = exports.get(title);
  if (!rec) return null;
  var next = metadata.computeNextEpisode(title, rec.season, rec.episode);
  if (next) {
    exports.add(title, 'show', icon || rec.icon, next.season, next.episode, next.title, false, '');
    return next;
  }
  return null;
};
