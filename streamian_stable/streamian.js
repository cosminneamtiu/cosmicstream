                                                      /*| Streamian plugin for Movian/M7 Media Center | © 2025 F0R3V3R50F7 All Rights Reserved |*/

/*|---------------------------------------------------------------------------------------- Pre - Requisits ----------------------------------------------------------------------------------------|*/


var page = require('movian/page');
var service = require('movian/service');
var settings = require('movian/settings');
var http = require('movian/http');
var html = require('movian/html');
var string = require('native/string');
var popup = require('native/popup');
var store = require('movian/store');
var plugin = JSON.parse(Plugin.manifest);
var logo = Plugin.path + plugin.icon;
var channels = require('channels');
var metadata = require('metadata');
var stream = require('stream');
var library = store.create('library');
var channelhistory = store.create('channelhistory');
var ondemandhistory = store.create('ondemandhistory');
var otalibrary = store.create('otalibrary');
var playlists = store.create('playlists');
var currentCancellationToken = null;




/*|---------------------------------------------------------------------------------------- Establish Services ----------------------------------------------------------------------------------------|*/


if (!library.list) {library.list = JSON.stringify([]);}
if (!otalibrary.list) {otalibrary.list = '[]';}
if (!ondemandhistory.list) {ondemandhistory.list = '[]';}
if (!channelhistory.list) {channelhistory.list = '[]';}
if (!playlists.list) {playlists.list = '[]';}
service.create(plugin.title, plugin.id + ":start", 'video', true, logo);
settings.globalSettings(plugin.id, plugin.title, logo, plugin.synopsis);

settings.createDivider('                On-Demand Settings:                                                                                                                                                                                                                                                                                                                                                                                                                              ');
settings.createDivider('');
settings.createMultiOpt('selectQuality', 'Preferred Quality', [
    ['UltraHD', 'Ultra HD | 4k'],
    ['FullHD', 'Full HD | 1080p', true],
    ['HD', 'HD | 720p'],
    ['SD', 'SD | 480p'],
  ], function(v) {
  service.selectQuality = v;
});
settings.createBool('h265filter', 'Enable H.265 Filter (Playstation 3)', false, function(v) {
    service.H265Filter = v;
});
settings.createMultiOpt('selectSeeders', 'Preferred Minimum Seeder Count', [
    ['60', '60'],
    ['40', '40'],
    ['30', '30'],
    ['20', '20'],
    ['15', '15', true],
    ['10', '10'],
    ['5', '5'],
    ['1', '1'],
  ], function(v) {
    service.minPreferredSeeders = v;
});
settings.createDivider("                Scraper Plug-in's:                                                                                                                                                                                                                                                                                                                                                                                                                              ");
settings.createDivider('');
settings.createString('addon1url', 'Slot 1', 'https://bit.ly/streamian-yts', function(v) {
    service.addon1url = v;
});
settings.createString('addon2url', 'Slot 2', 'https://bit.ly/streamian-tpb', function(v) {
    service.addon2url = v;
});
settings.createString('addon3url', 'Slot 3', 'https://bit.ly/streamian-eztv', function(v) {
    service.addon3url = v;
});
settings.createString('addon4url', 'Slot 4', 'https://bit.ly/streamian-ia', function(v) {
    service.addon4url = v;
});
settings.createString('addon5url', 'Slot 5', '', function(v) {
    service.addon5url = v;
});
settings.createString('addon6url', 'Slot 6', '', function(v) {
    service.addon6url = v;
});
settings.createDivider('                Data Management:                                                                                                                                                                                                                                                                                                                                                                                                                              ');
settings.createDivider('');

settings.createAction('emptyhistory', 'Empty Watch History', function() {
    channelhistory.list = '[]';
    ondemandhistory.list = '[]';
    popup.notify('Watch history has been emptied successfully.', 3);
});
/*
settings.createDivider('                Channel Settings:                                                                                                                                                                                                                                                                                                                                                                                                                              ');
settings.createDivider('');
settings.createBool('adultContent', 'Display Adult Content (18+)', false, function(v) {
    service.adultContent = v;
});
/*settings.createMultiOpt('regionOverride', 'Region Override (Debug - No Pluto)', [
    ['off', 'Off', true],
    ['gb', 'United Kingdom'],
    ['us', 'United States'],
    ['af', 'Afghanistan'],
    ['al', 'Albania'],
    ['dz', 'Algeria'],
    ['as', 'American Samoa'],
    ['ad', 'Andorra'],
    ['ao', 'Angola'],
    ['ai', 'Anguilla'],
    ['aq', 'Antarctica'],
    ['ag', 'Antigua and Barbuda'],
    ['ar', 'Argentina'],
    ['am', 'Armenia'],
    ['aw', 'Aruba'],
    ['au', 'Australia'],
    ['at', 'Austria'],
    ['az', 'Azerbaijan'],
    ['bs', 'Bahamas'],
    ['bh', 'Bahrain'],
    ['bd', 'Bangladesh'],
    ['bb', 'Barbados'],
    ['by', 'Belarus'],
    ['be', 'Belgium'],
    ['bz', 'Belize'],
    ['bj', 'Benin'],
    ['bm', 'Bermuda'],
    ['bt', 'Bhutan'],
    ['bo', 'Bolivia'],
    ['bq', 'Bonaire, Sint Eustatius and Saba'],
    ['ba', 'Bosnia and Herzegovina'],
    ['bw', 'Botswana'],
    ['bv', 'Bouvet Island'],
    ['br', 'Brazil'],
    ['io', 'British Indian Ocean Territory'],
    ['bn', 'Brunei Darussalam'],
    ['bg', 'Bulgaria'],
    ['bf', 'Burkina Faso'],
    ['bi', 'Burundi'],
    ['cv', 'Cabo Verde'],
    ['kh', 'Cambodia'],
    ['cm', 'Cameroon'],
    ['ca', 'Canada'],
    ['ky', 'Cayman Islands'],
    ['cf', 'Central African Republic'],
    ['td', 'Chad'],
    ['cl', 'Chile'],
    ['cn', 'China'],
    ['cx', 'Christmas Island'],
    ['cc', 'Cocos (Keeling) Islands'],
    ['co', 'Colombia'],
    ['km', 'Comoros'],
    ['cd', 'Congo (Democratic Republic of the)'],
    ['cg', 'Congo'],
    ['ck', 'Cook Islands'],
    ['cr', 'Costa Rica'],
    ['ci', 'Côte d\'Ivoire'],
    ['hr', 'Croatia'],
    ['cu', 'Cuba'],
    ['cw', 'Curaçao'],
    ['cy', 'Cyprus'],
    ['cz', 'Czechia'],
    ['dk', 'Denmark'],
    ['dj', 'Djibouti'],
    ['dm', 'Dominica'],
    ['do', 'Dominican Republic'],
    ['ec', 'Ecuador'],
    ['eg', 'Egypt'],
    ['sv', 'El Salvador'],
    ['gq', 'Equatorial Guinea'],
    ['er', 'Eritrea'],
    ['ee', 'Estonia'],
    ['sz', 'Eswatini'],
    ['et', 'Ethiopia'],
    ['fk', 'Falkland Islands'],
    ['fo', 'Faroe Islands'],
    ['fj', 'Fiji'],
    ['fi', 'Finland'],
    ['fr', 'France'],
    ['gf', 'French Guiana'],
    ['pf', 'French Polynesia'],
    ['tf', 'French Southern Territories'],
    ['ga', 'Gabon'],
    ['gm', 'Gambia'],
    ['ge', 'Georgia'],
    ['de', 'Germany'],
    ['gh', 'Ghana'],
    ['gi', 'Gibraltar'],
    ['gr', 'Greece'],
    ['gl', 'Greenland'],
    ['gd', 'Grenada'],
    ['gp', 'Guadeloupe'],
    ['gu', 'Guam'],
    ['gt', 'Guatemala'],
    ['gg', 'Guernsey'],
    ['gn', 'Guinea'],
    ['gw', 'Guinea-Bissau'],
    ['gy', 'Guyana'],
    ['ht', 'Haiti'],
    ['hm', 'Heard Island and McDonald Islands'],
    ['va', 'Holy See'],
    ['hn', 'Honduras'],
    ['hk', 'Hong Kong'],
    ['hu', 'Hungary'],
    ['is', 'Iceland'],
    ['in', 'India'],
    ['id', 'Indonesia'],
    ['ir', 'Iran'],
    ['iq', 'Iraq'],
    ['ie', 'Ireland'],
    ['im', 'Isle of Man'],
    ['il', 'Israel'],
    ['it', 'Italy'],
    ['jm', 'Jamaica'],
    ['jp', 'Japan'],
    ['je', 'Jersey'],
    ['jo', 'Jordan'],
    ['kz', 'Kazakhstan'],
    ['ke', 'Kenya'],
    ['ki', 'Kiribati'],
    ['kp', 'Korea (Democratic People\'s Republic of)'],
    ['kr', 'Korea'],
    ['kw', 'Kuwait'],
    ['kg', 'Kyrgyzstan'],
    ['la', 'Lao'],
    ['lv', 'Latvia'],
    ['lb', 'Lebanon'],
    ['ls', 'Lesotho'],
    ['lr', 'Liberia'],
    ['ly', 'Libya'],
    ['li', 'Liechtenstein'],
    ['lt', 'Lithuania'],
    ['lu', 'Luxembourg'],
    ['mo', 'Macao'],
    ['mg', 'Madagascar'],
    ['mw', 'Malawi'],
    ['my', 'Malaysia'],
    ['mv', 'Maldives'],
    ['ml', 'Mali'],
    ['mt', 'Malta'],
    ['mh', 'Marshall Islands'],
    ['mq', 'Martinique'],
    ['mr', 'Mauritania'],
    ['mu', 'Mauritius'],
    ['yt', 'Mayotte'],
    ['mx', 'Mexico'],
    ['fm', 'Micronesia'],
    ['md', 'Moldova'],
    ['mc', 'Monaco'],
    ['mn', 'Mongolia'],
    ['me', 'Montenegro'],
    ['ms', 'Montserrat'],
    ['ma', 'Morocco'],
    ['mz', 'Mozambique'],
    ['mm', 'Myanmar'],
    ['na', 'Namibia'],
    ['nr', 'Nauru'],
    ['np', 'Nepal'],
    ['nl', 'Netherlands'],
    ['nc', 'New Caledonia'],
    ['nz', 'New Zealand'],
    ['ni', 'Nicaragua'],
    ['ne', 'Niger'],
    ['ng', 'Nigeria'],
    ['nu', 'Niue'],
    ['nf', 'Norfolk Island'],
    ['mp', 'Northern Mariana Islands'],
    ['no', 'Norway'],
    ['om', 'Oman'],
    ['pk', 'Pakistan'],
    ['pw', 'Palau'],
    ['ps', 'Palestine'],
    ['pa', 'Panama'],
    ['pg', 'Papua New Guinea'],
    ['py', 'Paraguay'],
    ['pe', 'Peru'],
    ['ph', 'Philippines'],
    ['pn', 'Pitcairn'],
    ['pl', 'Poland'],
    ['pt', 'Portugal'],
    ['pr', 'Puerto Rico'],
    ['qa', 'Qatar'],
    ['mk', 'Republic of North Macedonia'],
    ['ro', 'Romania'],
    ['ru', 'Russian Federation'],
    ['rw', 'Rwanda'],
    ['re', 'Réunion'],
    ['bl', 'Saint Barthélemy'],
    ['sh', 'Saint Helena, Ascension and Tristan da Cunha'],
    ['kn', 'Saint Kitts and Nevis'],
    ['lc', 'Saint Lucia'],
    ['mf', 'Saint Martin (French part)'],
    ['pm', 'Saint Pierre and Miquelon'],
    ['vc', 'Saint Vincent and the Grenadines'],
    ['ws', 'Samoa'],
    ['sm', 'San Marino'],
    ['st', 'Sao Tome and Principe'],
    ['sa', 'Saudi Arabia'],
    ['sn', 'Senegal'],
    ['rs', 'Serbia'],
    ['sc', 'Seychelles'],
    ['sl', 'Sierra Leone'],
    ['sg', 'Singapore'],
    ['sx', 'Sint Maarten (Dutch part)'],
    ['sk', 'Slovakia'],
    ['si', 'Slovenia'],
    ['sb', 'Solomon Islands'],
    ['so', 'Somalia'],
    ['za', 'South Africa'],
    ['gs', 'South Georgia and the South Sandwich Islands'],
    ['ss', 'South Sudan'],
    ['es', 'Spain'],
    ['lk', 'Sri Lanka'],
    ['sd', 'Sudan'],
    ['sr', 'Suriname'],
    ['sj', 'Svalbard and Jan Mayen'],
    ['se', 'Sweden'],
    ['ch', 'Switzerland'],
    ['sy', 'Syrian Arab Republic'],
    ['tw', 'Taiwan'],
    ['tj', 'Tajikistan'],
    ['tz', 'Tanzania'],
    ['th', 'Thailand'],
    ['tl', 'Timor-Leste'],
    ['tg', 'Togo'],
    ['tk', 'Tokelau'],
    ['to', 'Tonga'],
    ['tt', 'Trinidad and Tobago'],
    ['tn', 'Tunisia'],
    ['tr', 'Turkey'],
    ['tm', 'Turkmenistan'],
    ['tc', 'Turks and Caicos Islands'],
    ['tv', 'Tuvalu'],
    ['ug', 'Uganda'],
    ['ua', 'Ukraine'],
    ['ae', 'United Arab Emirates'],
    ['uy', 'Uruguay'],
    ['uz', 'Uzbekistan'],
    ['vu', 'Vanuatu'],
    ['ve', 'Venezuela'],
    ['vn', 'Viet Nam'],
    ['vg', 'Virgin Islands (British)'],
    ['vi', 'Virgin Islands (U.S.)'],
    ['wf', 'Wallis and Futuna'],
    ['eh', 'Western Sahara'],
    ['ye', 'Yemen'],
    ['zm', 'Zambia'],
    ['zw', 'Zimbabwe']
  ], function(v) {
  service.regionOverride = v;
});

/*|---------------------------------------------------------------------------------------- Establish Global Functions ----------------------------------------------------------------------------------------|*/

function createCancellationToken() {
    return { cancelled: false };
}

// Function to cancel the current operation
function cancelCurrentOperation() {
    if (currentCancellationToken) {
        currentCancellationToken.cancelled = true;
    }
}

function addtoOnDemandHistory(title, type) {
    var list = JSON.parse(ondemandhistory.list);
    var historyItem = {
      title: title,
      type: type,
    };
    list.push(historyItem);
    ondemandhistory.list = JSON.stringify(list);
}

function removeFromOnDemandHistory(title) {
    var list = ondemandhistory.list ? JSON.parse(ondemandhistory.list) : [];
    var initialLength = list.length;

    // Normalize titles by trimming spaces and converting to lowercase
    title = title.trim().toLowerCase();
    
    list = list.filter(function(fav) {
        return fav.title.trim().toLowerCase() !== title;
    });

    ondemandhistory.list = JSON.stringify(list);

    // Check if an entry was actually removed
    if (list.length < initialLength) {
        popup.notify("'" + title + "' has been removed from Your Watch History.", 3);
        page.redirect(plugin.id + ':watchhistory');
    } else {
        popup.notify("Entry not found in watch history.", 3);
    }
}

function addChannelToHistory(page, link, title, icon) {
    var entry = JSON.stringify({
        link: link,
        title: title,
        icon: icon
    });
    channelhistory.list = JSON.stringify([entry].concat(eval(channelhistory.list)));
}

function addOptionForAddingChannelToLibrary(item, link, title, icon) {
    item.addOptAction('Add \'' + title + '\' to Your Library', function() {
      var entry = JSON.stringify({
        link: encodeURIComponent(link),
        title: encodeURIComponent(title),
        icon: icon,
      });
      otalibrary.list = JSON.stringify([entry].concat(eval(otalibrary.list)));
      popup.notify('\'' + title + '\' has been added to Your Library.', 3);
    });
}
  
function addOptionForRemovingChannelFromLibrary(page, item, title, pos) {
    item.addOptAction('Remove \'' + title + '\' from Your Library', function() {
      var list = eval(otalibrary.list);
      popup.notify('\'' + title + '\' has been removed from Your Library.', 3);
      list.splice(pos, 1);
      otalibrary.list = JSON.stringify(list);
      page.redirect(plugin.id + ':library');
    });
}

function isFavorite(title) {
    var list = JSON.parse(library.list || "[]"); // Handle empty library case
    return list.some(function(fav) {
        return fav.title === title; // Use `title` consistently
    });
}

function addToLibrary(title, type, icon) {
    var list = JSON.parse(library.list || "[]"); // Handle empty library case
    if (isFavorite(title)) {
        popup.notify("'" + title + "' is already in Your Library.", 3);
    } else {
        popup.notify("'" + title + "' has been added to Your Library.", 3);
        var libraryItem = {
            title: title, // Consistently use `title`
            type: type,
            icon: icon
        };
        list.push(libraryItem);
        library.list = JSON.stringify(list);
    }
}

function removeFromLibrary(title) {
    var list = JSON.parse(library.list || "[]"); // Handle empty library case
    var initialLength = list.length;
    list = list.filter(function(fav) {
        return fav.title !== title; // Consistently use `title`
    });

    if (list.length < initialLength) {
        popup.notify("'" + title + "' has been removed from Your Library.", 3);
    } else {
        popup.notify("'" + title + "' was not found in Your Library.", 3);
    }

    library.list = JSON.stringify(list);
}

function setPageHeader(page, title) {
    if (page.metadata) {
        page.metadata.title = title;
        page.metadata.icon = logo;
        page.metadata.background = Plugin.path + "images/bg.png";
    }
    page.type = "directory";
    page.contents = "items";
    page.entries = 0;
    page.loading = true;
}

function recaseShowTitle(showTitle) {
    var smallWords = ['of', 'the', 'in', 'on', 'at', 'by', 'and', 'but', 'for', 'or', 'nor', 'to', 'with'];
    return showTitle.split(' ').map(function(word, index) {
        word = word.toLowerCase();
        if (index === 0 || smallWords.indexOf(word) === -1) {
            // Capitalize the first letter if it's the first word or not a small word
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word; // Return small words in lowercase
    }).join(' ');
}

function getUserLocation() {
    var apiUrl = 'http://ip-api.com/json';  // API to detect user's location
    
    var response = http.request(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!!response) {
        var data = JSON.parse(response.toString());
        return data.countryCode.toLowerCase();  // Extracting the 2-letter country code (e.g., 'uk', 'us')
    } else {
        page.appendItem("", "separator", { title: "Unable to determine location | Check http://ip-api.com" });
        return null;
        page.loading = false;
    }
}

function iprotM3UParser(page, pl, specifiedGroup, limit, query) {  // by iprot -https://github.com/lprot/movian-plugin-onlinetv
    var m3uItems = [];
    var groups = [];
    var theLastList = '';
    var title = page.metadata.title + '';
    page.loading = true;

    if (theLastList !== pl) {
        page.metadata.title = 'Loading Channels, please wait...';
        var m3u = http.request(decodeURIComponent(pl), {}).toString().split('\n');
        theLastList = pl;

        var m3uTitle = '',
            m3uImage = '',
            m3uGroup = '',
            m3uRegion = '',
            m3uEpgId = '',
            m3uHeaders = '',
            m3uUA = '';

        for (var i = 0; i < m3u.length; i++) {
            page.metadata.title = 'Loading Channels, please wait...';
            var line = m3u[i].trim();
            if (line.substr(0, 7) !== '#EXTM3U' && line.indexOf(':') < 0 && line.length !== 40) continue; // skip invalid lines
            line = string.entityDecode(line.replace(/[\u200B-\u200F\u202A-\u202E]/g, ''));

            switch (line.substr(0, 7)) {
                case '#EXTM3U':
                    var match = line.match(/region=(.*)\b/);
                    if (match) {
                        m3uRegion = match[1];
                    }
                    break;
                case '#EXTINF':
                    var match = line.match(/#EXTINF:.*,(.*)/);
                    if (match) {
                        m3uTitle = match[1].trim();
                    }
                    match = line.match(/group-title="([\s\S]*?)"/);
                    if (match) {
                        m3uGroup = match[1].trim();
                        if (groups.indexOf(m3uGroup) < 0) {
                            groups.push(m3uGroup);
                        }
                    }
                    match = line.match(/tvg-logo=["|”]([\s\S]*?)["|”]/);
                    if (match) {
                        m3uImage = match[1].trim();
                    }
                    match = line.match(/region="([\s\S]*?)"/);
                    if (match) {
                        m3uRegion = match[1];
                    }
                    if (m3uRegion) {
                        match = line.match(/description="([\s\S]*?)"/);
                        if (match) {
                            m3uEpgId = match[1];
                        }
                    }
                    break;
                case '#EXTGRP':
                    var match = line.match(/#EXTGRP:(.*)/);
                    if (match) {
                        m3uGroup = match[1].trim();
                        if (groups.indexOf(m3uGroup) < 0) {
                            groups.push(m3uGroup);
                        }
                    }
                    break;
                case '#EXTVLC':
                    var match = line.match(/http-(user-agent=[\s\S]*)$/);
                    if (match) {
                        m3uUA = match[1];
                    }
                    break;
                default:
                    if (line[0] === '#') {
                        m3uImage = '';
                        continue; // skip unknown tags and comments
                    }
                    line = line.replace(/rtmp:\/\/\$OPT:rtmp-raw=/, '');
                    if (line.indexOf(':') === -1 && line.length === 40) {
                        line = 'acestream://' + line;
                    }
                    if (m3uImage && m3uImage.substr(0, 4) !== 'http') {
                        m3uImage = line.match(/^.+?[^\/:](?=[?\/]|$)/) + '/' + m3uImage;
                    }
                    m3uHeaders = line.match(/([\s\S]*?)\|([\s\S]*?)$/);
                    m3uHeaders ? line = m3uHeaders[1] : '';

                    var item = {
                        title: m3uTitle ? m3uTitle : line,
                        url: line,
                        group: m3uGroup,
                        logo: m3uImage,
                        region: m3uRegion,
                        epgid: m3uEpgId,
                        headers: m3uHeaders ? m3uHeaders[2] : m3uUA ? m3uUA : void(0),
                    };

                    if (specifiedGroup && item.group !== specifiedGroup) {
                        continue; // Skip items not matching specified group
                    }

                    // Check if a query is provided and matches the item title
                    if (query && item.title.toLowerCase().indexOf(query.toLowerCase()) === -1) {
                        continue; // Skip items that don't match the query
                    }

                    m3uItems.push(item);
                    m3uTitle = '';
                    m3uImage = '';
                    m3uEpgId = '';
                    m3uHeaders = '';
            }

            // Check if limit is reached
            if (limit && m3uItems.length >= limit) {
                break;
            }
        }

        page.metadata.title = title;
    }

    return {
        items: m3uItems,
        groups: groups
    };
}

function scrapeSamsung(page, limit, query) {
    console.log("Starting Samsung TV Plus channel fetch...");
    page.metadata.title = "Detecting Region, please wait...";

    var userRegion;

    // Check for region override
    if (service.regionOverride && service.regionOverride !== "off") {
        console.log("Using region override: " + service.regionOverride);
        userRegion = service.regionOverride;
    } else {
        console.log("No region override, detecting region...");
        userRegion = getUserLocation();
    }

    // If no region is found
    if (!userRegion) {
        console.log("Region not found, displaying custom icon");
        page.appendItem(null, "video", {
            'icon': plugin.path + "images/regionerror.png"
        });
        return;
    }

    console.log("User's detected region: " + userRegion);

    // Fetch the Samsung TV JSON data
    var response = http.request("https://bit.ly/3MXFu4g", {
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36",
            "Accept": "application/json",
            "Connection": "keep-alive"
        }
    });

    if (response) {
        // Decode the JSON data
        var allRegions = showtime.JSONDecode(response.toString()).regions;
        if (!allRegions[userRegion]) {
            console.log("Region not found in Samsung data, displaying custom icon");
            page.appendItem(null, "video", {
                'icon': plugin.path + "images/regionerror.png"
            });
            return;
        }

        var channels = allRegions[userRegion].channels;
        var groupedChannels = {};

        for (var key in channels) {
            if (channels.hasOwnProperty(key)) {
                var channel = channels[key];
                var genre = channel.group;
                var channelId = key; // Extract ID from the channel key
                var channelUrl = "https://jmp2.uk/sam-" + channelId + ".m3u8";

                // Skip channels without a valid URL or with DRM
                if (!channelId || !channelUrl || channel.license_url) {
                    continue;
                }

                // Filter channels by query if provided
                if (query && channel.name.toLowerCase().indexOf(query.toLowerCase()) === -1) {
                    continue;
                }

                if (!groupedChannels[genre]) {
                    groupedChannels[genre] = [];
                }

                groupedChannels[genre].push({
                    id: channelId,
                    name: channel.name,
                    logo: channel.logo,
                    url: channelUrl
                });
            }
        }

        // Display channels
        page.metadata.title = "Loading Channels, please wait...";
        var globalCount = 0;
        for (var genre in groupedChannels) {
            if (groupedChannels.hasOwnProperty(genre)) {
                if (!limit) {
                    page.appendItem(null, "separator", { title: "" });
                    page.appendItem(null, "separator", { title: genre });
                    page.appendItem(null, "separator", { title: "" });
                }

                var channelsInGenre = groupedChannels[genre];
                for (var i = 0; i < channelsInGenre.length; i++) {
                    if (limit && globalCount >= limit) {
                        break;
                    }

                    addChannel(
                        page,
                        channelsInGenre[i].url,
                        channelsInGenre[i].name,
                        channelsInGenre[i].logo
                    );
                    globalCount++;
                }

                if (limit && globalCount >= limit) {
                    break;
                }
            }
        }
    } else {
        console.log("Error fetching Samsung TV Plus channels.");
    }
}

function scrapePluto(page, limit, query) {
    console.log("Starting channel fetch...");
    var response = http.request("http://api.pluto.tv/v2/channels", {
      'method': "GET",
      'headers': {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36",
        'Accept': "application/json",
        'Connection': 'keep-alive'
      }
    });
    if (!!response) {
      var channelsData = showtime.JSONDecode(response.toString());
      var groupedChannels = {};
      function generateUniqueId() {
        var _0x491762 = new Date().getTime();
        var _0x354ad1 = Math.floor(Math.random() * 0xf4240).toString(0x10);
        return _0x491762.toString(0x10) + '-' + _0x354ad1;
      }
      var deviceId = generateUniqueId();
      var sid = generateUniqueId();
      for (var i = 0x0; i < channelsData.length; i++) {
        var channel = channelsData[i];
        var genre = channel.category;
        var baseUrl = channel.stitched.urls[0x0].url.split('?')[0x0];
        var logo = channel.colorLogoPNG.path;
        var name = channel.name;
        if (name === "How To Use Pluto TV") {
          continue;
        }
        if (genre === "Samsung") {
          continue;
        }
        var dynamicParams = "?appName=web&appVersion=unknown&clientTime=0&deviceDNT=0&deviceId=" + deviceId + "&deviceMake=Chrome&deviceModel=web&deviceType=web&deviceVersion=unknown&includeExtendedEvents=false&serverSideAds=true&sid=" + sid;
        var finalUrl = baseUrl + dynamicParams;
        if (!groupedChannels[genre]) {
          groupedChannels[genre] = [];
        }
        groupedChannels[genre].push({
          'name': name,
          'url': finalUrl,
          'logo': logo
        });
      }
      var totalCount = 0x0;
      page.metadata.title = "Loading Channels, please wait...";
      for (var genre in groupedChannels) {
        if (groupedChannels.hasOwnProperty(genre)) {
          if (!limit) {
            page.appendItem(null, "separator", {
              'title': ''
            });
            page.appendItem(null, "separator", {
              'title': genre
            });
            page.appendItem(null, "separator", {
              'title': ''
            });
          }
          var channels = groupedChannels[genre];
          for (var j = 0x0; j < channels.length; j++) {
            if (limit && totalCount >= limit) {
              break;
            }
            if (query && channels[j].name.toLowerCase().indexOf(query.toLowerCase()) === -0x1) {
              continue;
            }
            addChannel(page, channels[j].url, channels[j].name, channels[j].logo);
            totalCount++;
          }
          if (limit && totalCount >= limit) {
            break;
          }
        }
      }
      if (totalCount === 0x0) {}
    } else {
      console.log("Error fetching channels.");
    }
}

function addChannels(page, items, specifiedGroup, limit) {
    var num = 0; // Initialize num counter

    for (var i = 0; i < items.length; i++) {
        if (specifiedGroup && items[i].group !== specifiedGroup) {
            continue; // Skip items not matching specified group
        }

        var description = '';
        if (items[i].region && items[i].epgid) {
            description = getEpg(items[i].region, items[i].epgid);
        }

        addChannel(page, items[i].url, items[i].title, items[i].logo, description, '', '', items[i].headers);
        num++; // Increment num for each added item

        // Check if limit is reached
        if (limit && num >= limit) {
            break;
        }
    }
}

function addChannel(page, url, title, icon) {
    console.log("Adding channel with the following parameters:");
    console.log("URL: " + url);
    console.log("Title: " + title);
    console.log("Icon: " + icon);

    var linkUrl = 'hls:' + url;
    var link = 'videoparams:' + JSON.stringify({
        icon: icon ? icon : void(0),
        sources: [{
            url: linkUrl,
        }],
        no_fs_scan: true,
        no_subtitle_scan: true,
    });

    var decodedIcon = decodeURIComponent(icon || '');

    try {
        var item = page.appendItem(plugin.id + ":playchannel:" + link + ':' + title + ':' + decodedIcon, "video", {
            icon: icon ? icon : null,
        });

        addOptionForAddingChannelToLibrary(item, link, title, icon);

        console.log("Item created:", item);
    } catch (error) {
        console.log("Error appending item:", error);
    }
}


/*|---------------------------------------------------------------------------------------- Establish Pages ----------------------------------------------------------------------------------------|*/


// Patched start page route
new page.Route(plugin.id + ":start", function(page) {
    setPageHeader(page, "Loading...");
    page.model.contents = 'grid';
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://bit.ly/streamian-zip');
    });

    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/find_on.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + "images/shows.png",
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + "images/movies.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff.png",
    });

    page.appendItem('', 'separator', { title: '', });
    page.appendItem(plugin.id + ":searchresults:", 'search', { title: 'Find something specific...' });
    page.appendItem('', 'separator', { title: '', });

    page.metadata.title = 'Loading recommendations...';

    var libraryList = library.list ? JSON.parse(library.list) : [];
    var validItems = libraryList.filter(function(item) {
        return item.title && item.title.match(/^(.*)\s+\((\d{4})\)$/);
    });

    for (var i = validItems.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = validItems[i];
        validItems[i] = validItems[j];
        validItems[j] = temp;
    }
    var selectedItems = validItems.slice(0, 3);

    selectedItems.forEach(function(itemmd) {
        var title = itemmd.title;
        var type = itemmd.type;

        var match = title.match(/^(.*)\s+\((\d{4})\)$/);
        if (!match) return;

        var baseTitle = match[1];
        var year = match[2];
        var scoutType = (type === "show") ? "tv" : "movie";

        var results = metadata.Scout(baseTitle + ":" + year + ":" + scoutType, "recommendations");
        if (!results || results.length === 0) return;

        page.appendItem("", "separator", { title: "Because you like " + title + "...                                                                                                                                                                                                                                                                                                                                                         " });
        page.appendItem("", "separator", { title: "" });

        results.forEach(function(entry) {
            var parts = entry.split(" -|- ");
            var title = parts[0];
            var icon = parts[1];
            var mediatype = parts[2];

            var recUrl = mediatype === "show"
                ? plugin.id + ":show:" + title
                : plugin.id + ":details:" + title + ":" + mediatype;

            var videoItem = page.appendItem(recUrl, "video", {
                icon: icon
            });

            videoItem.addOptAction("Add '" + title + "' to Your Library", function() {
                addToLibrary(title, mediatype, icon);
            });

            videoItem.addOptAction("Remove '" + title + "' from Your Library", function() {
                removeFromLibrary(title);
            });
        });
    });

    page.metadata.title = 'Looking for Shows, please wait...';
    page.appendItem('', 'separator', { title: 'Trending Shows                                                                                                                                                                                                                                                                                                                                                         ' });
    page.appendItem('', 'separator', { title: '' });

    var results = metadata.Scout('popularshows', 'query');
    if (results && results.length > 0) {
        var genresMap = {};
        var uniqueTitles = {};

        results.forEach(function(item) {
            var itemParts = item.split(" -|- ");
            var title = itemParts[0];
            var icon = itemParts[1];
            var genre = decodeURIComponent(itemParts[3]);

            if (genre !== 'Unknown' && genre && !uniqueTitles[title]) {
                uniqueTitles[title] = true;

                if (!genresMap[genre]) genresMap[genre] = [];

                genresMap[genre].push({
                    title: title,
                    icon: icon,
                    url: plugin.id + ":show:" + title
                });
            }
        });

        for (var genre in genresMap) {
            if (genresMap[genre].length >= 4) {
                genresMap[genre].slice(0, 4).forEach(function(item) {
                    var videoItem = page.appendItem(item.url, "video", {
                        icon: item.icon
                    });
                    videoItem.addOptAction('Add \'' + item.title + '\' to Your Library', function() {
                        addToLibrary(item.title, 'show', item.icon);
                    });
                    videoItem.addOptAction('Remove \'' + item.title + '\' from Your Library', function() {
                        removeFromLibrary(item.title);
                    });
                });
            }
        }
    }

    page.metadata.title = 'Looking for Movies, please wait...';
    page.appendItem('', 'separator', { title: 'Trending Movies                                                                                                                                                                                                                                                                                                                                                         ' });
    page.appendItem('', 'separator', { title: '' });

    var results = metadata.Scout('popularmovies', 'query');
    if (results && results.length > 0) {
        var genresMap = {};
        var uniqueTitles = {};

        results.forEach(function(item) {
            var itemParts = item.split(" -|- ");
            var title = itemParts[0];
            var icon = itemParts[1];
            var genre = decodeURIComponent(itemParts[3]);

            if (genre !== 'Unknown' && genre && !uniqueTitles[title]) {
                uniqueTitles[title] = true;

                if (!genresMap[genre]) genresMap[genre] = [];

                genresMap[genre].push({
                    title: title,
                    icon: icon,
                    url: plugin.id + ":details:" + title + ':movie'
                });
            }
        });

        for (var genre in genresMap) {
            if (genresMap[genre].length >= 4) {
                genresMap[genre].slice(0, 4).forEach(function(item) {
                    var videoItem = page.appendItem(item.url, "video", {
                        icon: item.icon
                    });
                    videoItem.addOptAction('Add \'' + item.title + '\' to Your Library', function() {
                        addToLibrary(item.title, 'movie', item.icon);
                    });
                    videoItem.addOptAction('Remove \'' + item.title + '\' from Your Library', function() {
                        removeFromLibrary(item.title);
                    });
                });
            }
        }
    }
    page.metadata.title = 'Streamian - Find';
    page.loading = false;
    popup.notify('Streamian | No Streams Available? Your ISP may be filtering torrent sites.', 10);
});

new page.Route(plugin.id + ":popularshows", function(page) {
    setPageHeader(page, "Popular Shows");
    page.model.contents = 'grid';
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });

    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/find.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + "images/shows_on.png",
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + "images/movies.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff.png",
    });

    var query = 'popularshows';
    var results = metadata.Scout(query.toLowerCase(), 'query');

    if (results && results.length > 0) {
        var genresMap = {};
        var displayedTitles = {};

        results.forEach(function(item) {
            var itemParts = item.split(" -|- ");
            var title = itemParts[0];
            var icon = itemParts[1];
            var genreString = decodeURIComponent(itemParts[3]);

            if (genreString !== 'Unknown' && genreString) {
                var genres = genreString.split(',').map(function(g) {
                    return g.trim();
                });

                if (!displayedTitles[title]) {
                    for (var i = 0; i < genres.length; i++) {
                        var genre = genres[i];

                        if (!genresMap[genre]) {
                            genresMap[genre] = [];
                        }

                        genresMap[genre].push({
                            title: title,
                            icon: icon,
                            url: plugin.id + ":show:" + title
                        });

                        displayedTitles[title] = true;
                        break;
                    }
                }
            }
        });

        for (var genre in genresMap) {
            if (genresMap[genre].length >= 4) {
                var iconFile = genre.toLowerCase().replace(/\s+/g, '') + '.png';
                var genreIcon = Plugin.path + 'images/' + iconFile;

                page.appendItem(plugin.id + ":genre:" + genre + ':show', "video", {
                    icon: genreIcon
                });

                genresMap[genre].slice(0, 4).forEach(function(item) {
                    var videoItem = page.appendItem(item.url, "video", {
                        icon: item.icon
                    });
                    videoItem.addOptAction('Add \'' + item.title + '\' to Your Library', function() {
                        addToLibrary(item.title, 'show', item.icon);
                    });
                    videoItem.addOptAction('Remove \'' + item.title + '\' from Your Library', function() {
                        removeFromLibrary(item.title);
                    });
                });
            }
        }
    }

    page.loading = false;
});

new page.Route(plugin.id + ":popularmovies", function(page) {
    setPageHeader(page, "Popular Movies");
    page.model.contents = 'grid';
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });

    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/find.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + "images/shows.png",
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + "images/movies_on.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff.png",
    });

    var query = 'popularmovies';
    var results = metadata.Scout(query.toLowerCase(), 'query');

    if (results && results.length > 0) {
        var genresMap = {};
        var displayedTitles = {};  // Tracks movies already displayed

        results.forEach(function(item) {
            var itemParts = item.split(" -|- ");
            var title = itemParts[0];
            var icon = itemParts[1];
            var genreString = decodeURIComponent(itemParts[3]);

            if (genreString !== 'Unknown' && genreString) {
                var genres = genreString.split(',').map(function(g) {
                    return g.trim();
                });

                // Only display the movie under the first genre it appears in
                if (!displayedTitles[title]) {
                    for (var i = 0; i < genres.length; i++) {
                        var genre = genres[i];

                        if (!genresMap[genre]) {
                            genresMap[genre] = [];
                        }

                        genresMap[genre].push({
                            title: title,
                            icon: icon,
                            url: plugin.id + ":details:" + title + ':movie'
                        });

                        // Mark this movie as already displayed
                        displayedTitles[title] = true;
                        break;  // Stop after first genre
                    }
                }
            }
        });

        // Display genres with their icons and items
        for (var genre in genresMap) {
            if (genresMap[genre].length >= 4) {
                var iconFile = genre.toLowerCase().replace(/\s+/g, '') + '.png';
                var genreIcon = Plugin.path + 'images/' + iconFile;

                page.appendItem(plugin.id + ":genre:" + genre + ':movie', "video", {
                    icon: genreIcon
                });

                genresMap[genre].slice(0, 4).forEach(function(item) {
                    var videoItem = page.appendItem(item.url, "video", {
                        icon: item.icon
                    });
                    videoItem.addOptAction('Add \'' + item.title + '\' to Your Library', function() {
                        addToLibrary(item.title, 'movie', item.icon);
                    });
                    videoItem.addOptAction('Remove \'' + item.title + '\' from Your Library', function() {
                        removeFromLibrary(item.title);
                    });
                });
            }
        }
    }

    page.loading = false;
});


new page.Route(plugin.id + ":genre:(.*):(.*)", function(page, genre, type) {
    page.model.contents = 'grid';
    setPageHeader(page, genre);
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });

    page.appendItem(plugin.id + ":start", 'video', {
    icon: Plugin.path + "images/find.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + (type === 'show' ? "images/shows_on.png" : "images/shows.png"),
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + (type === 'movie' ? "images/movies_on.png" : "images/movies.png"),
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff.png",
    });


    // Adjust the query type based on the passed type ('show' or 'movie')
    var query = type === 'movie' ? 'popularmovies' : 'popularshows';  // Set the query based on the type

    var results = metadata.Scout(query.toLowerCase(), 'query', 30);  // Retrieve results from the API

    if (results && results.length > 0) {
        var uniqueTitles = {};  // Object to track unique titles

        // Process the results to filter by the specified genre
        results.forEach(function(item) {
            var itemParts = item.split(" -|- ");
            var title = itemParts[0];
            var icon = itemParts[1];
            var itemGenre = decodeURIComponent(itemParts[3]);
            var type = itemParts[2];

            // Only show items that match the genre passed in the route
            if (itemGenre === genre && !uniqueTitles[title]) {
                uniqueTitles[title] = true;  // Mark this title as added

                // Append the item to the page
                var videoItem = page.appendItem(plugin.id + ":details:" + title + ":" + type, "video", {
                    icon: icon
                });

                // Add options for adding/removing from the library
                videoItem.addOptAction('Add \'' + title + '\' to Your Library', function() {
                    addToLibrary(title, type, icon);  // Use 'type' for consistency in adding/removing
                });
                videoItem.addOptAction('Remove \'' + title + '\' from Your Library', function() {
                    removeFromLibrary(title);
                });
            }
        });
    }

    page.loading = false;
});

new page.Route(plugin.id + ":search", function(page) {
    page.model.contents = 'grid';
    setPageHeader(page, "Search for Shows, Movies & Channels!");
    cancelCurrentOperation();


    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });


    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/find_on.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + "images/shows.png",
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + "images/movies.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff.png",
    });
    page.appendItem('', 'separator', { title: '', });
    page.appendItem(plugin.id + ":searchresults:", 'search', { title: 'Search for Shows, Movies & Channels...' });
    page.appendItem('', 'separator', { title: '', });
    page.appendItem(plugin.id + ":search", "video", {
        icon: Plugin.path + "images/refresh.png"
    });
    page.loading = false;
});

new page.Route(plugin.id + ":searchresults:(.*)", function(page, query) {
    setPageHeader(page, "Search Results for " + query);
    page.loading = true;
    page.model.contents = 'grid';

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });


    cancelCurrentOperation();
    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/find_on.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + "images/shows.png",
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + "images/movies.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff.png",
    });
    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        On-Demand                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});
    var results = metadata.Scout(query.toLowerCase(), 'query');
    if (results && results.length > 0) {
        results.forEach(function (item) {
            var itemParts = item.split(" -|- ");
            if (itemParts[2] === 'movie') {
                url = plugin.id + ":details:" + itemParts[0] + ':movie';
                videoItem = page.appendItem(url, "video", {
                    icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/cvrntfnd.png",
                });
                videoItem.addOptAction('Add \'' + itemParts[0] + '\' to Your Library', function() {
                    addToLibrary(itemParts[0], 'movie', itemParts[1]);
                });
                videoItem.addOptAction('Remove \'' + itemParts[0] + '\' from Your Library', function() {
                    removeFromLibrary(itemParts[0]);
                });
            } else {
                url = plugin.id + ":show:" + itemParts[0];
                videoItem = page.appendItem(url, "video", {
                    icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/cvrntfnd.png",
                });
                videoItem.addOptAction('Add \'' + itemParts[0] + '\' to Your Library', function() {
                    addToLibrary(itemParts[0], 'show', itemParts[1]);
                });
                videoItem.addOptAction('Remove \'' + itemParts[0] + '\' from Your Library', function() {
                    removeFromLibrary(itemParts[0]);
                });
            }
            
        });
    }
    page.appendItem("", "separator", { title: "" });
    page.appendItem("", "separator", { title: "        Channels                                                                                                                                                                                                                                                               " });
    page.appendItem("", "separator", { title: "" });
    channels.Search(page, query.toLowerCase());
    page.loading = false;
});

new page.Route(plugin.id + ":show:(.*)", function(page, query) {
    setPageHeader(page, decodeURIComponent(query));
    page.model.contents = 'grid';
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });


    var results = metadata.Scout(query.toLowerCase(), 'show');
    if (results && results.length > 0) {
        results.forEach(function (item) {
            var itemParts = item.split(" -|- ");
            url = plugin.id + ":season:" + query + ' S' + itemParts[3];
            page.appendItem(url, "video", {
                title: itemParts[0],
                icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/cvrntfnd.png",
            });
        });
    }
    page.loading = false;
});

new page.Route(plugin.id + ":season:(.*)", function(page, query) {
    page.model.contents = 'list';
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });


    var results = metadata.Scout(query.toLowerCase(), 'season');
    if (results && results.length > 0) {
        results.forEach(function (item) {
            var itemParts = item.split(" -|- ");
            url = plugin.id + ":details:" + itemParts[2] + ':episode';
            page.appendItem(url, "video", {
                title: itemParts[0],
                description: itemParts[3],
                icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/nostill.png",
                backdrops: itemParts[1].indexOf('https') > -1 ? [{url: itemParts[1]}] : [{url: Plugin.path + "images/nostill.png"}],
            });
        });
    }
    // Recase the query: replace 'S' followed by a digit with 'Season' followed by the number
    var recasedQuery = query.replace(/ S(\d+)/, function(match, p1) {
        return ' Season ' + p1;
    });

    // Set the page header with the modified query
    setPageHeader(page, recasedQuery);

    page.loading = false;
});

new page.Route(plugin.id + ":details:(.*):(.*)", function(page, query, type) {
    setPageHeader(page, "Loading Information... please wait");
    page.model.contents = 'list';
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });


    page.appendItem('', 'separator', {title: '         Actions:                                                                                                                              '});
    page.appendItem('', 'separator', {title: ''});

    var results = metadata.Scout(query.toLowerCase(), type);
    if (type === 'episode') {
        results.forEach(function (item) {
            var itemParts = item.split(" -|- ");
            var url =  plugin.id + ":play:" + query + ':' + itemParts[7] + ':episode';
            page.metadata.background = itemParts[0];
            page.metadata.title = itemParts[8] || query;
            page.appendItem(url, "video", {
                title: "Play",
                description: itemParts[5],
                icon: Plugin.path + "images/play.png",
                backdrops: itemParts[1].indexOf('https') > -1 ? [{url: itemParts[1]}] : [{url: Plugin.path + "images/nostill.png"}],
            });
            page.appendItem('', 'separator', {title: ''});
            page.appendItem('', 'separator', {title: '         Information:                                                                                                                              '});
            page.appendItem('', 'separator', {title: ''});
            page.appendItem('', 'video', {title: "Air Date: " + itemParts[2],
                icon: Plugin.path + 'images/airdate.png',
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
            page.appendItem('', 'video', {title: "Vote Average: " + itemParts[3],
                icon: Plugin.path + 'images/vote.png',
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });            
            page.appendItem('', 'video', {
                icon: Plugin.path + 'images/stars.png',
                title: "Guest Stars: " + itemParts[4],
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
        });
    } else {
        results.forEach(function (item) {
            var itemParts = item.split(" -|- ");
            var url =  plugin.id + ":play:" + query + ':' + itemParts[8] + ':movie';
            page.metadata.background = itemParts[0];
            page.metadata.title = query; 
            page.appendItem(url, "video", {
                title: "Play",
                icon: Plugin.path + "images/play.png",
                description: itemParts[5],
                backdrops: itemParts[1].indexOf('https') > -1 ? [{url: itemParts[1]}] : [{url: Plugin.path + "images/nostill.png"}],
            });
            page.appendItem('', 'separator', {title: ''});
            page.appendItem('', 'separator', {title: '         Information:                                                                                                                              '});
            page.appendItem('', 'separator', {title: ''});
            page.appendItem('', 'video', {title: "Release Date: " + itemParts[2],
                icon: Plugin.path + 'images/airdate.png',
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
            page.appendItem('', 'video', {title: "Vote Average: " + itemParts[3],
                icon: Plugin.path + 'images/vote.png',
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });            
            page.appendItem('', 'video', {
                icon: Plugin.path + 'images/time.png',
                title: "Runtime: " + itemParts[4],
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
            page.appendItem('', 'video', {
                icon: Plugin.path + 'images/cast.png',
                title: "Cast: " + itemParts[6],
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
            page.appendItem('', 'video', {
                icon: Plugin.path + 'images/crew.png',
                title: "Crew: " + itemParts[7],
                description: itemParts[5],
                backdrops: [{url: itemParts[1]}] || Plugin.path + "images/nostill.png"
            });
        });
    }
    popup.notify("Welcome To The Information Page! If you wish to skip this page in future, you can turn on Auto-Play in Settings.", 10);
    page.loading = false;
});

new page.Route(plugin.id + ":play:(.*):(.*):(.*)", function(page, query, imdbid, type) {
    page.model.contents = 'grid';
    setPageHeader(page, "Loading Addons, please wait..");
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });


    page.appendItem(plugin.id + ":start", 'video', {
        title: 'Buy me a Coffee!',
        icon: Plugin.path + "images/bmcqr.png",
    });
    addtoOnDemandHistory(query, type);
    var sanitized = query;
    // Remove special characters and specific words for all types
    sanitized = sanitized.replace(/presents|[:]/gi, "").replace(/[^a-zA-Z0-9\s]/g, "").trim();
    // For movies, remove brackets around the year (if any) but keep the year
    if (type === 'movie') {
        sanitized = sanitized.replace(/\s*\(\d{4}\)\s*/g, " "); // Remove brackets around the year
    }
    // For episodes, remove the year and normalize season/episode formatting
    if (type === 'episode') {
        // Remove the year if present
        sanitized = sanitized.replace(/\b\d{4}\b/g, "").trim();

        // Normalize S1E1 to S01E01 (two digits for season and episode numbers)
        sanitized = sanitized.replace(/S(\d{1,2})E(\d{1,2})/i, function(match, season, episode) {
            return 'S' + ('0' + season).slice(-2) + 'E' + ('0' + episode).slice(-2);
        });
    }
    // Collapse multiple spaces to a single space
    query = sanitized.replace(/\s+/g, " ").trim();
    popup.notify('Streamian | Encountering issues? Please report to Reddit r/movian', 10);
    stream.Scout(page, query, imdbid);
    page.loading = false;
    setPageHeader(page, 'No suitable streams found for ' + query);
});

new page.Route(plugin.id + ":channels", function(page) {
    page.model.contents = 'grid';
    setPageHeader(page, "Channels");
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });

    page.options.createAction('addPlaylist', 'Add Playlist', function() {
        var result = popup.textDialog(
            'Enter the URL to the playlist like:\nhttp://bit.ly/xyz or https://example.com/list.m3u',
            true, true
        );

        if (!result.rejected && result.input) {
            var link = result.input.trim();

            // Normalize the link
            if (!link.match(/\./)) {
                link = 'http://bit.ly/' + link;
            }
            if (!link.match(/:\/\//)) {
                link = 'http://' + link;
            }

            // Ask for display name
            var result2 = popup.textDialog('Enter the name of the playlist:', true, true);
            if (!result2.rejected && result2.input) {
                var entry = JSON.stringify({
                    title: encodeURIComponent(result2.input),
                    link: 'm3u:' + encodeURIComponent(link)
                });

                // prepend new entry
                playlists.list = JSON.stringify([entry].concat(eval(playlists.list)));

                popup.notify("Playlist '" + result2.input + "' has been added.", 2);
                page.flush();
                page.redirect(plugin.id + ':channels');
            }
        }
    });



    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/find.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_on.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + "images/shows.png",
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + "images/movies.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff.png",
    });
    page.loading = true;
    channels.Scrape(page);
    setPageHeader(page, "Channels");
    page.loading = false;
});

new page.Route('channelNetwork:(.*)', function(page, title) {
    setPageHeader(page, title);
    page.model.contents = 'grid';
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });

    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/find.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_on.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + "images/shows.png",
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + "images/movies.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff.png",
    });

    if (title === 'Pluto TV') {scrapePluto(page)};
    if (title === 'Samsung TV Plus') {scrapeSamsung(page)};

    setPageHeader(page, title);

    popup.notify("Right Click / Hold to add to Library.", 5);
    page.loading = false;
});

new page.Route('m3uGroup:(.*):(.*):(.*)', function(page, pl, specifiedGroup, title) {
    setPageHeader(page, title);
    page.model.contents = 'grid';
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });

    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/find.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_on.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + "images/shows.png",
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + "images/movies.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff.png",
    });

    var parsedData = iprotM3UParser(page, pl, specifiedGroup);
    var items = parsedData.items;

    items.forEach(function(item) {
        addChannels(page, [item], specifiedGroup); // Use addChannels to add each item
    });

    popup.notify("Right Click / Hold to add to Library.", 5);
    page.loading = false;
});

new page.Route('m3u:(.*):(.*)', function(page, pl, title) {
    setPageHeader(page, unescape(title));
    page.model.contents = 'grid';
    cancelCurrentOperation();

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });

    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/find.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels_on.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + "images/shows.png",
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + "images/movies.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff.png",
    });

    var parsedData = iprotM3UParser(page, pl);
    var items = parsedData.items;

    items.forEach(function(item) {
        addChannels(page, [item]); // Use addChannels to add each item
    });

    popup.notify("Right Click / Hold to add to Library.", 5);
    page.loading = false;
});

new page.Route(plugin.id + ":playchannel:(.*):(.*):(.*)", function(page, link, title, decodedIcon) {
    setPageHeader(page, "Searching for best source, please wait..");
    page.model.contents = 'list';

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });


    icon = decodedIcon;
    cancelCurrentOperation();
    console.log("Icon Link:" + icon);
    addChannelToHistory(page, link, title, icon);
    page.redirect(link);

});

new page.Route(plugin.id + ":library", function(page) {
    setPageHeader(page, "Your Library");

    page.options.createAction('update', "Update Streamian", function() {
		popup.notify("Updating Streamian, please wait...", 5);
		page.redirect('https://github.com/F0R3V3R50F7/m7-plugin-streamian/raw/refs/heads/main/streamian_stable.zip');
    });

    
    page.model.contents = 'grid';
    cancelCurrentOperation();
    page.appendItem(plugin.id + ":start", 'video', {
        icon: Plugin.path + "images/find.png",
    });
    page.appendItem(plugin.id + ":channels", 'video', {
        icon: Plugin.path + "images/channels.png",
    });
    page.appendItem(plugin.id + ":popularshows", 'video', {
        icon: Plugin.path + "images/shows.png",
    });
    page.appendItem(plugin.id + ":popularmovies", 'video', {
        icon: Plugin.path + "images/movies.png",
    });
    page.appendItem(plugin.id + ":library", 'video', {
        icon: Plugin.path + "images/mystuff_on.png",
    });

    page.appendItem('', 'separator', { title: '' });
    page.appendItem('', 'separator', { title: '        My On-Demand                                                                                                                                                                                                                                                               ' });
    page.appendItem('', 'separator', { title: '' });

    // Check if library.list is defined and parse it
    var libraryList = library.list ? JSON.parse(library.list) : [];

    for (var i = libraryList.length - 1; i >= 0; i--) {
        var itemmd = libraryList[i];
        var fallbackIcon = Plugin.path + "images/nostill.png";
        var icon = fallbackIcon;

        // Extract title and year
        var match = itemmd.title.match(/^(.*) \((\d{4})\)$/);
        var cleanTitle = match ? match[1] : itemmd.title;
        var expectedYear = match ? match[2] : null;

        // Get metadata
        var scoutResults = metadata.Scout(cleanTitle, 'query', 1);

        // Loop and find best match by year
        for (var j = 0; j < scoutResults.length; j++) {
            var parts = scoutResults[j].split(" -|- ");
            if (parts.length < 4) continue;

            var resultTitle = parts[0];           // e.g. "Rick and Morty (2013)"
            var resultIcon = parts[1];            // backdrop image
            var resultType = parts[2];            // 'show' or 'movie'

            // Extract year from result title
            var resultMatch = resultTitle.match(/\((\d{4})\)$/);
            var resultYear = resultMatch ? resultMatch[1] : null;

            // Only match if year matches exactly
            if (expectedYear && resultYear && expectedYear === resultYear) {
                icon = resultIcon;
                break;
            }
        }

        // Append item as before
        var url;
        if (itemmd.type === 'show') {
            url = plugin.id + ":show:" + itemmd.title;
        } else {
            url = plugin.id + ":details:" + itemmd.title + ':movie';
        }

        var videoItem = page.appendItem(url, "video", {
            icon: icon
        });

        (function(item) {
            videoItem.addOptAction('Remove \'' + item.title + '\' from Your Library', function() {
                removeFromLibrary(item.title);
                page.redirect(plugin.id + ":library");
            });
        })(itemmd);
    }


    page.appendItem('', 'separator', {title: ''});
    page.appendItem('', 'separator', {title: '        My Channels                                                                                                                                                                                                                                                               '});
    page.appendItem('', 'separator', {title: ''});

    var channelList = otalibrary.list ? eval(otalibrary.list) : [];
    var pos = 0;

    for (var i in channelList) {
        var itemmd = JSON.parse(channelList[i]);
        var item = page.appendItem(plugin.id + ":playchannel:" + decodeURIComponent(itemmd.link) + ':' + itemmd.title + ':' + decodeURIComponent(itemmd.icon), "video", {
            icon: itemmd.icon ? decodeURIComponent(itemmd.icon) : Plugin.path + "images/nostill.png",
            description: 'Link: ' + decodeURIComponent(itemmd.link),
        });
        addOptionForRemovingChannelFromLibrary(page, item, decodeURIComponent(itemmd.title), pos);
        pos++;
    }
    page.loading = false;


    page.appendItem('', 'separator', { title: '' });
    page.appendItem('', 'separator', { title: '        On-Demand Watch History                                                                                                                                                                                                                                                               ' });
    page.appendItem('', 'separator', { title: '' });

    var ondemandhistoryList = ondemandhistory.list ? JSON.parse(ondemandhistory.list) : [];

    // Process the on-demand history
    ondemandhistoryList.reverse().forEach(function(itemmd) {
        if (itemmd.type === 'episode') {
            var results = metadata.Scout(itemmd.title, 'episode');
            results.forEach(function(item) {
                var itemParts = item.split(" -|- ");
                var url = plugin.id + ":details:" + itemmd.title + ':episode';
                var videoItem = page.appendItem(url, "video", {
                    title: itemmd.title,
                    icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/nostill.png",
                });
                // Use a scoped function to correctly bind itemmd
                (function(title) {
                    videoItem.addOptAction('Remove \'' + title + '\' from Your Watch History', function() {
                        removeFromOnDemandHistory(title);
                    });
                })(itemmd.title);
            });
        } else {
            var results = metadata.Scout(itemmd.title, 'movie');
            results.forEach(function(item) {
                var itemParts = item.split(" -|- ");
                var url = plugin.id + ":details:" + itemmd.title + ':movie';
                var videoItem = page.appendItem(url, "video", {
                    title: itemmd.title,
                    icon: itemParts[1].indexOf('https') > -1 ? itemParts[1] : Plugin.path + "images/nostill.png",
                });
                // Use a scoped function to correctly bind itemmd
                (function(title) {
                    videoItem.addOptAction('Remove \'' + title + '\' from Your Watch History', function() {
                        removeFromOnDemandHistory(title);
                    });
                })(itemmd.title);
            });
        }
    });

    // Add separators
    page.appendItem('', 'separator', { title: '' });
    page.appendItem('', 'separator', { title: '        Channel Watch History                                                                                                                                                                                                                                                               ' });
    page.appendItem('', 'separator', { title: '' });

    // Process the channel history
    var list = eval(channelhistory.list);
    list.forEach(function(item) {
        var itemmd = JSON.parse(item);
        page.appendItem(plugin.id + ":playchannel:" + itemmd.link + ':' + itemmd.title + ':' + itemmd.icon, "video", {
            icon: "https:" + itemmd.icon || Plugin.path + "images/nostill.png",
            description: 'Link: ' + itemmd.link,
        });
    });
});