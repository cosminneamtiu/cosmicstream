var page  = require('movian/page');
var http  = require('movian/http');
var store = require('movian/store');

var PREFIX   = 'streamnet_tpb';
var IMG      = Plugin.path + 'img/tpb/';
var LOGO     = IMG + 'tpb_logo.png';
var BG       = IMG + 'bg.png';
var BASE_URL = 'https://www2.thepiratebay3.to';

var svc = { language:'en', sortOrder:'default', minSeeders:0, minQuality:'all', filter265:false, adultFilter:true };

var cache = {
  data:{}, ttl:300000,
  get: function(k){var e=this.data[k];return(e&&Date.now()-e.timestamp<this.ttl)?e.value:null;},
  set: function(k,v){this.data[k]={value:v,timestamp:Date.now()};},
  clear: function(){this.data={};}
};

var favorites = {
  _list:null,
  _load: function(){
    if(this._list!==null)return;
    try{var raw=store.tpb_favorites;this._list=(raw&&raw!=='')?JSON.parse(raw):[];}catch(e){this._list=[];}
  },
  _save: function(){try{store.tpb_favorites=JSON.stringify(this._list);}catch(e){}},
  has: function(hash){this._load();for(var i=0;i<this._list.length;i++)if(this._list[i].hash===hash)return true;return false;},
  add: function(item){this._load();if(!this.has(item.hash)){this._list.push(item);this._save();}},
  remove: function(hash){this._load();for(var i=0;i<this._list.length;i++){if(this._list[i].hash===hash){this._list.splice(i,1);this._save();return;}}},
  getAll: function(){this._load();return this._list.slice();}
};

var TRANS = {
  movies:'Movies',tvshow:'TV Shows',recent:'Recent Updates',top100:'Top 100',
  favorites:'Favorites',favAdd:'Add to favorites',favRemove:'Remove from favorites',
  favEmpty:'No saved favorites',favAdded:'Added to favorites',favRemoved:'Removed from favorites',
  noresults:'No results found',error:'Error loading',size:'Size',
  seeders:'Seeders',leechers:'Leechers',anonymous:'Anonymous',unknown:'Unknown',page:'Page',search:'Search'
};
function tr(key){return TRANS[key]||key;}

function httpGet(url) {
  var cached=cache.get(url); if(cached) return{success:true,data:cached};
  try {
    var r=http.request(url,{timeout:15000,noFail:true});
    if(!r||r.bytes===undefined) return{success:false,error:tr('error')};
    var text=r.toString();
    cache.set(url,text);
    return{success:true,data:text};
  }catch(e){return{success:false,error:tr('error')+': '+e};}
}

function sanitizeHtml(s){
  return s.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}
function extractQuality(title){
  var m=title.match(/(\d{3,4}p|4K|2160p|1080p|720p|480p)/i);
  if(m){var q=m[1].toUpperCase();return q==='4K'?'2160P':q;} return'UNKNOWN';
}
function getQualityValue(q){return{2160:2160,P2160:2160,1080:1080,P1080:1080,720:720,P720:720,480:480,P480:480}[q]||((/^(\d+)P?$/.exec(q||'')||[0,0])[1]);}
function meetsQuality(title){
  var min=svc.minQuality||'all'; if(min==='all') return true;
  var map={'720p':720,'1080p':1080,'2160p':2160}, minVal=map[min]||0;
  var q=extractQuality(title), val=parseInt(q)||0; return val>=minVal;
}

function sortItems(items){
  var min=svc.minSeeders||0;
  var filtered=items.filter(function(it){
    if(it.seeders<min) return false;
    if(!meetsQuality(it.title)) return false;
    if(svc.filter265&&/[xhX][.\s-]?265|HEVC/i.test(it.title)) return false;
    if(svc.adultFilter&&/\b(xxx|porn|adult|18\+|\+18|erotic|hentai|nude|naked|sexy?)\b/i.test(it.title)) return false;
    return true;
  });
  var so=svc.sortOrder||'default';
  if(so==='nameAsc')     filtered.sort(function(a,b){return a.title.localeCompare(b.title);});
  if(so==='nameDesc')    filtered.sort(function(a,b){return b.title.localeCompare(a.title);});
  if(so==='seedersDesc') filtered.sort(function(a,b){return b.seeders-a.seeders;});
  if(so==='seedersAsc')  filtered.sort(function(a,b){return a.seeders-b.seeders;});
  return filtered;
}

function parseTorrents(pg,htmlStr){
  htmlStr=sanitizeHtml(htmlStr);
  var rows=htmlStr.split('<tr'), items=[];
  for(var i=0;i<rows.length;i++){
    var row=rows[i];
    var titleM=row.match(/class="detLink"[^>]*title="Details for ([^"]+)"/); if(!titleM) continue;
    var title=titleM[1];
    var magnetM=row.match(/href="(magnet:\?[^"]+)"/); if(!magnetM) continue;
    var magnetLink=magnetM[1].replace(/&amp;/g,'&');
    var detM=row.match(/class="detDesc">([^<]+)</), details=detM?detM[1]:'';
    var seedM=row.match(/align="right">(\d+)<\/td>\s*<td align="right">(\d+)<\/td>/);
    var seeders=seedM?parseInt(seedM[1]):0, leechers=seedM?parseInt(seedM[2]):0;
    var szM=details.match(/Size ([^,]+),/), size=szM?szM[1]:tr('unknown');
    var upM=details.match(/Uploaded ([^,]+),/), uploaded=upM?upM[1]:tr('unknown');
    var uplrM=row.match(/class="detDesc">.*?<a[^>]*>([^<]+)<\/a>/), uploader=uplrM?uplrM[1]:tr('anonymous');
    var hashM=magnetLink.match(/btih:([^&]+)/), hash=hashM?hashM[1]:'';
    var quality=extractQuality(title);
    var desc=tr('size')+': '+size+' | '+quality+'\n'+tr('seeders')+': '+seeders+' | '+tr('leechers')+': '+leechers+'\n'+uploaded+' by '+uploader;
    items.push({magnetLink:magnetLink,title:title,description:desc,seeders:seeders,quality:quality,hash:hash});
  }
  items=sortItems(items);
  for(var j=0;j<items.length;j++){
    var it=items[j];
    var torItem=pg.appendItem(it.magnetLink,'video',{title:it.title,icon:IMG+'folders.png',description:it.description});
    (function(fi){
      torItem.addOptAction(tr('favAdd'),function(){favorites.add(fi);});
    })({hash:it.hash,title:it.title,magnetLink:it.magnetLink,description:it.description});
  }
  return items.length;
}

function loadPaged(pg,baseUrl) {
  var pageNum=1, failures=0;
  while(true){
    var url=pageNum===1?baseUrl:baseUrl+'/page/'+pageNum;
    var res=httpGet(url);
    if(!res.success){if(++failures>=2)break;continue;}
    pg.appendItem('','separator',{title:'--- '+tr('page')+' '+pageNum+' ---'});
    var count=parseTorrents(pg,res.data);
    if(count===0){if(++failures>=2)break;}
    else{failures=0;pageNum++;}
    if(pageNum>30)break;
  }
}

function setupPage(pg,title){
  pg.type='directory'; pg.contents='items'; pg.model.contents='grid';
  pg.metadata.logo=LOGO; pg.metadata.background=BG; pg.metadata.title=title;
}

new page.Route(PREFIX+':start',function(pg){
  setupPage(pg,'Bflix The Pirate Bay');
  pg.appendItem(PREFIX+':search:','search',{title:tr('search')});
  pg.appendItem(PREFIX+':favorites','video',{title:tr('favorites'),icon:IMG+'favorites.png'});
  pg.appendItem(PREFIX+':open:'+encodeURIComponent(BASE_URL+'/browse/201'),'video',{title:tr('movies'),     icon:IMG+'folders.png'});
  pg.appendItem(PREFIX+':open:'+encodeURIComponent(BASE_URL+'/browse/205'),'video',{title:tr('tvshow'),     icon:IMG+'folders.png'});
  pg.appendItem(PREFIX+':open:'+encodeURIComponent(BASE_URL+'/recent'),     'video',{title:tr('recent'),    icon:IMG+'folders.png'});
  pg.appendItem(PREFIX+':open:'+encodeURIComponent(BASE_URL+'/top/all'),    'video',{title:tr('top100'),    icon:IMG+'folders.png'});
  pg.appendItem(PREFIX+':open:'+encodeURIComponent(BASE_URL+'/browse/207'), 'video',{title:'HD Movies',    icon:IMG+'folders.png'});
  pg.appendItem(PREFIX+':open:'+encodeURIComponent(BASE_URL+'/browse/208'), 'video',{title:'HD TV Shows',  icon:IMG+'folders.png'});
  pg.loading=false;
});

new page.Route(PREFIX+':open:(.*)',function(pg,enc){
  var baseUrl=decodeURIComponent(enc);
  pg.type='directory'; pg.contents='list'; pg.metadata.logo=LOGO; pg.metadata.background=BG; pg.metadata.title='The Pirate Bay';
  pg.loading=true;
  loadPaged(pg,baseUrl);
  pg.loading=false;
});

new page.Route(PREFIX+':search:(.*)',function(pg,query){
  pg.type='directory'; pg.contents='list'; pg.metadata.logo=LOGO; pg.metadata.background=BG;
  var q=decodeURIComponent(query);
  if(!q||q.trim()===''){pg.metadata.title=tr('search');pg.loading=false;return;}
  pg.metadata.title=tr('search')+': '+q;
  pg.loading=true;
  var pageNum=1, failures=0;
  while(true){
    var url=pageNum===1?BASE_URL+'/s/?q='+encodeURIComponent(q):BASE_URL+'/s/page/'+pageNum+'/?q='+encodeURIComponent(q);
    var res=httpGet(url);
    if(!res.success){if(++failures>=2)break;continue;}
    pg.appendItem('','separator',{title:'--- '+tr('page')+' '+pageNum+' ---'});
    var count=parseTorrents(pg,res.data);
    if(count===0){if(++failures>=2){if(pageNum===1)pg.appendPassiveItem('video','',{title:tr('noresults'),icon:LOGO});break;}}
    else{failures=0;pageNum++;}
    if(pageNum>20)break;
  }
  pg.loading=false;
});

new page.Route(PREFIX+':favorites',function(pg){
  setupPage(pg,tr('favorites'));
  var list=favorites.getAll();
  if(list.length===0){
    pg.appendPassiveItem('video','',{title:tr('favEmpty'),icon:IMG+'favorites.png'});
  } else {
    for(var i=0;i<list.length;i++){
      var fav=list[i];
      var fi=pg.appendItem(fav.magnetLink,'video',{title:fav.title,icon:IMG+'folders.png',description:fav.description});
      (function(f){fi.addOptAction(tr('favRemove'),function(){favorites.remove(f.hash);});})(fav);
    }
  }
  pg.loading=false;
});


exports.id          = 'bflix-piratebay';
exports.name        = 'The Pirate Bay';
exports.description = 'Torrents from The Pirate Bay';
exports.categories  = ['movies','series'];
exports.adult       = false;
exports.icon        = LOGO;
exports.background  = BG;

exports.search = function(pg,query,logo,addSeparator) {
  try {
    if(!query||query.trim()==='') return 0;
    var res=httpGet(BASE_URL+'/s/?q='+encodeURIComponent(query));
    if(!res.success) return 0;
    if(addSeparator) pg.appendItem('','separator',{title:'===== THE PIRATE BAY ====='});
    return parseTorrents(pg,res.data);
  }catch(e){return 0;}
};

exports.browse = function(pg,logo) {
  pg.appendItem(PREFIX+':open:'+encodeURIComponent(BASE_URL+'/browse/201'), 'video',{title:tr('movies'),  icon:IMG+'folders.png'});
  pg.appendItem(PREFIX+':open:'+encodeURIComponent(BASE_URL+'/browse/205'), 'video',{title:tr('tvshow'),  icon:IMG+'folders.png'});
  pg.appendItem(PREFIX+':open:'+encodeURIComponent(BASE_URL+'/recent'),     'video',{title:tr('recent'),  icon:IMG+'folders.png'});
  pg.appendItem(PREFIX+':open:'+encodeURIComponent(BASE_URL+'/top/all'),    'video',{title:tr('top100'),  icon:IMG+'folders.png'});
  pg.appendItem(PREFIX+':favorites',                                         'video',{title:tr('favorites'),icon:IMG+'favorites.png'});
};
