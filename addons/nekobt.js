var page = require('movian/page');
var http = require('movian/http');

var PREFIX = 'streamnet_neko';
var LOGO   = Plugin.path + 'img/neko/neko_logo.png';
var IMG    = Plugin.path + 'img/neko/';
var BASE   = 'https://nekobt.to';
var API    = BASE + '/api/torznab/api';

var svc = { lang:'en', cacheOn:true, cacheTTL:1800000 };

var THEME = { p:'BB66FF', s:'DD99FF', a:'FFD700', d:'8844CC' };
var BG = IMG + 'bg_purple.png';

var CW='FFFFFF', CGR='AAAAAA', CRD='FF4444', COR='FF8800', CGN='00CC66', CCY='00DDFF', CLM='88FF00', CPR='BB66FF';

RichText = function(x) { this.str = x.toString(); };
RichText.prototype.toRichString = function() { return this.str; };
function c(s,col) { return '<font color="'+col+'">'+s+'</font>'; }
function th()     { return THEME; }
function bg()     { return BG; }
function sep(lbl) { var k=th(); return new RichText(c('[ ',k.d)+c(lbl,k.p)+c(' ]',k.d)); }

var STRINGS = {
  search:'Search in nekoBT...', categories:'CATEGORIES', latest:'LATEST TORRENTS',
  results:'RESULTS', typeSearch:'Type something to search',
  size:'Size:     ', seeders:'Seeders:  ', leechers:'Leechers: ',
  downloads:'Downloads:', category:'Category: ',
  cats:['Recent','Anime','Anime HD','Anime SD','Batch / Complete','OVA / ONA','Movies','Raw']
};
function s(key) { return STRINGS[key]||key; }
function catName(i) { return (STRINGS.cats&&STRINGS.cats[i])||''; }

function makeTitle(title,size,seeders) {
  var sv=parseInt(seeders)||0;
  var sc=sv>=20?CLM:(sv>=10?CGN:(sv>0?COR:CRD));
  var out=c(title,CW);
  if(size)    out+='  '+c('['+size+']',CGR);
  if(seeders) out+='  '+c('S:'+seeders,sc);
  return new RichText(out);
}
function makeDesc(size,seeders,leechers,grabs,category) {
  var k=th(), d='';
  if(size)               d+=c(s('size'),k.p)+c(size,CW)+'<br>';
  if(seeders!==undefined) d+=c(s('seeders'),CGN)+c(seeders,CW)+'   '+c(s('leechers'),COR)+c(leechers||'0',CW)+'<br>';
  if(grabs)              d+=c(s('downloads'),CCY)+c(grabs,CW)+'<br>';
  if(category)           d+=c(s('category'),CPR)+c(category,CGR);
  return new RichText(d);
}

var cache = {
  data:{},
  flush: function(){this.data={};},
  get: function(k){var it=this.data[k];if(!it)return null;if(Date.now()-it.ts>(svc.cacheTTL||1800000)){delete this.data[k];return null;}return it.v;},
  set: function(k,v){this.data[k]={v:v,ts:Date.now()};}
};

var HDR = { 'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept':'application/xml,text/xml,*/*;q=0.8', 'Accept-Language':'en-US,en;q=0.9' };

function GET(url) {
  if(svc.cacheOn!==false){var hit=cache.get(url);if(hit)return hit;}
  for(var i=0;i<3;i++){
    try{
      var r=http.request(url,{headers:HDR,timeout:20000,noFail:true});
      if(!r)continue;
      var txt=r.toString();
      if(txt&&txt.length>50){if(svc.cacheOn!==false)cache.set(url,txt);return txt;}
    }catch(e){}
  }
  return null;
}

function bytesStr(n) {
  n=parseInt(n)||0; if(n<=0)return '';
  if(n>=1073741824) return (n/1073741824).toFixed(2)+' GiB';
  if(n>=1048576)    return (n/1048576).toFixed(2)+' MiB';
  return (n/1024).toFixed(0)+' KiB';
}
function attrVal(block,name) {
  var m=block.match(new RegExp('name="'+name+'"[^>]*value="([^"]*)"','i'))||
        block.match(new RegExp('value="([^"]*)"[^>]*name="'+name+'"','i'));
  return m?m[1]:'';
}
function parseItems(xml) {
  var items=[];
  if(!xml)return items;
  var blocks=xml.split('<item>'); blocks.shift();
  for(var i=0;i<blocks.length;i++){
    var b=blocks[i];
    var tm=b.match(/<title><!\[CDATA\[([^\]]*)\]\]><\/title>/)||b.match(/<title>([^<]*)<\/title>/);
    var title=tm?tm[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim():'';
    if(!title)continue;
    var magnet=attrVal(b,'magneturl');
    if(!magnet){var mm=b.match(/(magnet:\?[^<"'\s]+)/);if(mm)magnet=mm[1];}
    var encM=b.match(/<enclosure[^>]+url="([^"]+)"/);
    var torrentUrl=encM?encM[1].trim():'';
    var url=magnet||torrentUrl; if(!url)continue;
    var sizeRaw=attrVal(b,'size')||''; if(!sizeRaw){var szM=b.match(/<size>(\d+)<\/size>/);if(szM)sizeRaw=szM[1];}
    var seeders=attrVal(b,'seeders')||'0', leechers=attrVal(b,'leechers')||'0', grabs=attrVal(b,'grabs');
    var catM=b.match(/<category>([^<]*)<\/category>/); var category=catM?catM[1].trim():'';
    items.push({title:title,url:url,size:bytesStr(sizeRaw),seeders:seeders,leechers:leechers,grabs:grabs,category:category});
  }
  return items;
}
function appendItems(p,items) {
  for(var i=0;i<items.length;i++){
    var it=items[i];
    p.appendItem(it.url,'video',{title:makeTitle(it.title,it.size,it.seeders),icon:LOGO,backdrops:[{url:LOGO}],description:makeDesc(it.size,it.seeders,it.leechers,it.grabs,it.category)});
  }
}
function apiUrl(q,cat,offset) {
  var u=API+'?t=search&q='+encodeURIComponent(q||'');
  if(cat&&cat!=='')   u+='&cat='+encodeURIComponent(cat);
  if(offset&&offset>0) u+='&offset='+offset;
  return u;
}
function browseApi(p,q,cat,title) {
  var k=th();
  p.type='directory'; p.metadata.logo=LOGO; p.metadata.background=bg(); p.model.contents='list';
  p.metadata.title=new RichText(c('nekoBT',k.p)+(title?c('  '+title,k.s):''));
  var offset=0;
  p.loading=true; loader(); p.asyncPaginator=loader;
  function loader(){
    try{var xml=GET(apiUrl(q,cat,offset)),found=parseItems(xml);appendItems(p,found);p.loading=false;if(found.length>=50){offset+=50;return p.haveMore(true);}}
    catch(e){p.loading=false;}
    return p.haveMore(false);
  }
}

var CATS=[
  {q:'',cat:''},{q:'',cat:'5070'},{q:'',cat:'5040'},{q:'',cat:'5030'},
  {q:'batch',cat:''},{q:'ova',cat:''},{q:'movie',cat:''},{q:'raw',cat:''}
];

new page.Route(PREFIX+':start', function(p) {
  var k=th();
  p.type='directory'; p.metadata.logo=LOGO; p.metadata.background=bg(); p.model.contents='list';
  p.metadata.title=new RichText(c('neko',k.p)+c('BT',k.s));
  p.appendItem(PREFIX+':search:','search',{title:new RichText(c('[',CGR)+c(s('search'),k.s)+c(']',CGR))});
  p.appendItem('','separator',{title:sep(s('categories'))});
  for(var i=0;i<CATS.length;i++) {
    p.appendItem(PREFIX+':cat:'+i,'video',{title:new RichText(c('[',CGR)+c(catName(i),k.a)+c(']',CGR)),icon:LOGO,backdrops:[{url:LOGO}]});
  }
  p.appendItem('','separator',{title:sep(s('latest'))});
  var offset=0;
  p.loading=true; startLoader(); p.asyncPaginator=startLoader;
  function startLoader(){
    try{var xml=GET(apiUrl('','',offset)),found=parseItems(xml);appendItems(p,found);p.loading=false;if(found.length>=50){offset+=50;return p.haveMore(true);}}
    catch(e){p.loading=false;}
    return p.haveMore(false);
  }
});

new page.Route(PREFIX+':cat:(\\d+)', function(p,idx) {
  var i=parseInt(idx,10), cat=CATS[i];
  if(!cat){p.loading=false;return;}
  browseApi(p,cat.q,cat.cat,catName(i));
});

new page.Route(PREFIX+':search:(.*)', function(p,raw) {
  var query=decodeURIComponent(raw||'').trim(), k=th();
  p.type='directory'; p.metadata.logo=LOGO; p.metadata.background=bg(); p.model.contents='list';
  p.metadata.title=new RichText(c('nekoBT: ',k.p)+c(query||'...',k.s));
  if(!query){p.appendPassiveItem('video',null,{title:new RichText(c('[',CGR)+c(s('typeSearch'),CGR)+c(']',CGR)),icon:LOGO});p.loading=false;return;}
  p.appendItem('','separator',{title:sep(s('results')+': '+query)});
  browseApi(p,query,'',query);
});


exports.id          = 'nekobt';
exports.name        = 'nekoBT';
exports.description = 'Anime torrent tracker from nekobt.to (Torznab API)';
exports.categories  = ['anime'];
exports.adult       = false;
exports.icon        = LOGO;
exports.background  = bg();

exports.search = function(pg,query,logo,addSeparator) {
  try {
    if(!query||query.trim()==='')return 0;
    var xml=GET(apiUrl(query,'',0));
    if(!xml)return 0;
    var items=parseItems(xml);
    if(!items.length)return 0;
    if(addSeparator)pg.appendItem('','separator',{title:'===== NEKOBT ====='});
    appendItems(pg,items);
    return items.length;
  }catch(e){return 0;}
};

exports.browse = function(pg,logo) {
  for(var i=0;i<CATS.length;i++) {
    pg.appendItem(PREFIX+':cat:'+i,'video',{title:catName(i),icon:LOGO});
  }
};
