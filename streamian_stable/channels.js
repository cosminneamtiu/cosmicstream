// Channel Scraper for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7
exports.Scrape = function (page) {

    page.metadata.title = 'Detecting Region, please wait...';

    var userRegion;

    // TEMP //
    service.adultContent = false;
    // TEMP //

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

    if (!userRegion) {
        page.appendItem('', 'separator', { title: 'Failed to detect location. Please try again later.' });
        return;
    }

    // Load saved playlists
    var savedPlaylists = [];
    try {
        savedPlaylists = JSON.parse(playlists.list);
    } catch(e) {
        savedPlaylists = [];
    }

    // Iterate through each playlist
    savedPlaylists.forEach(function(entry, pos) {
        try {
            var plData = JSON.parse(entry); // entry is stored as stringified JSON
            var plTitle = decodeURIComponent(plData.title);
            var plLink = decodeURIComponent(plData.link.split(':')[1]); // strip the "m3u:" part

            // Main entry for the playlist (All Channels)
            var item = page.appendItem(plData.link + ':' + plTitle, 'video', {
                icon: Plugin.path + "images/playlist.png" // default icon
            });

            // Add "Remove" option to the playlist item
            item.addOptAction("Remove '" + plTitle + "' playlist from the list", function() {
                var playlistArray = eval(playlists.list);
                playlistArray.splice(pos, 1); // remove the selected playlist
                playlists.list = JSON.stringify(playlistArray);
                popup.notify("'" + plTitle + "' has been removed from the list.", 2);
                page.flush();
                page.redirect(plugin.id + ':channels');
            });

            // Parse playlist and show 4 items
            var specifiedGroup = '';
            var limit = '4';
            var parsedData = iprotM3UParser(page, encodeURIComponent(plLink), specifiedGroup, limit);
            var items = parsedData.items;

            // Append first 4 channels with icons
            items.forEach(function(item) {
                addChannels(page, [item], specifiedGroup, limit);
            });

        } catch(err) {
            console.log('Error parsing playlist entry: ' + err);
        }
    });



    page.appendItem('channelNetwork:Samsung TV Plus', 'video', { icon: 'https://i.pinimg.com/736x/44/99/4e/44994e0da4f3f31dfa5cfb2b35943a9c.jpg', });
    scrapeSamsung(page, '4');
    
    page.appendItem('channelNetwork:Pluto TV', 'video', { icon: 'https://yandex-images.clstorage.net/5yUMb3179/653cfaF_sm/nOHwpDsrinF6VVFvwr3Y41LSRxwo2hjDZVuNZ7xStPeN8vaUgpFwl5JfanMiJpXxxeVp6mo-yPxOntZTwwjjJdq2seh8bJ0kJxdJO8q-3eFPjwQNNIAcnn8Z0W_-XuL4hKLP86G1AfroOhQFWFnY9s7lP6RwP5-jIffEYoJamROc98-3ATfreFdcDm7pvN_3aZ1CEjObAo1kfsFPzBDpoMPE2MW6tw_C5AAFB3tnze3YzR27Mx6huiTxqG6zTJkqjcTIvyUd82RaTzVl-bnu0GKLbB8fsD2eWG35eMMV_ZbRx9Hap7w6ze86MTRdbtjx4dIsuzc0oYQTwa59rkmiIIHZ8ZcuE9Z-WXUob8SD2exfm04gMp82jXpr-3TDJ-2S0fDAwIuxEMzwGTAxQ3XO5szxN7ksOaCBO-eyVZpAuzO7zOa_Lx3qWnhIC1fModjMb7ZiFh2gA6RrWNp06Sbdo8LZ6ueTuiLj8AkeIFdN68bU5QiGGSSaqQTcr3iMdrAJm-LKiQgO3E13dgxZ64PFwGm5ezoJhBKsQXznRPc17pHU8MXEipwy1OgpHyNSY_HYz88osA8ZtJgq0rxElVuSIoLTwIoqCeF2eFAQTOil1uVEt3waLYA1tFpTwFb5EMSi7_bC2LSxDOrODRg7cH7Z5enzF6w5Or-NMtCjQo5PoRCiw8eIGj7vSGhVMGLLmezBS5RqEhGgO7l-b9J06RT-lefT9MOFhyrc3jAYJ1t7w-fs1yOSECWdhhrvq02zU7U-hNbgiR4X4U9sVAp565rU5VCRSBsLhwSMfXfyY-Q13ITs1P_YpZAk6sIaPghmbsnf2e4NtCoOt7Qp3IpxiWqhJIj06LAjINJ1Tnc4T8aq1f9njVwrFY8JtnVU0U_hD96vwPLz27WRKcLiDRAhYHbR3tXjDZsMBp6bNfiKULlAuwGP6eK9BxLCXlNSEUXNvNv-TLdFHDSnPaVWacJU4wo', });
    scrapePluto(page, '4');
    
    if (userRegion == "us") {
    
        page.appendItem('m3u:https%3A%2F%2Fwww.apsattv.com%2Fredbox.m3u:Redbox', 'video', { icon: 'https://mma.prnewswire.com/media/858885/redbox_logo.jpg?p=facebook', });
        var pl = 'https%3A%2F%2Fwww.apsattv.com%2Fredbox.m3u';
        var specifiedGroup = '';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_usa.m3u8:USA:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_usa.m3u8';
        var specifiedGroup = 'USA';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    } else if (userRegion == "gb") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fwww.apsattv.com%2Frakuten-uk.m3u:RakutenTV UK:Rakuten TV', 'video', { icon: 'https://i0.wp.com/thefutureoftheforce.com/wp-content/uploads/2023/04/Rakuten-TV-Header.jpg', });
        var pl = 'https%3A%2F%2Fwww.apsattv.com%2Frakuten-uk.m3u';
        var specifiedGroup = 'RakutenTV UK';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_uk.m3u8:UK:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_uk.m3u8';
        var specifiedGroup = 'UK';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "fr") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_france.m3u8:France:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_france.m3u8';
        var specifiedGroup = 'France';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "ca") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_canada.m3u8:Canada:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_canada.m3u8';
        var specifiedGroup = 'Canada';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "br") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_brazil.m3u8:Brazil:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_brazil.m3u8';
        var specifiedGroup = 'Brazil';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "kr") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_south korea.m3u8:South Korea:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_south_korea.m3u8';
        var specifiedGroup = 'South Korea';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "mx") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_mexico.m3u8:Mexico:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_mexico.m3u8';
        var specifiedGroup = 'Mexico';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "cl") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_chile.m3u8:Chile:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_chile.m3u8';
        var specifiedGroup = 'Chile';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "de") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_germany.m3u8:Germany:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_germany.m3u8';
        var specifiedGroup = 'Germany';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "ch") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_switzerland.m3u8:Switzerland:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_switzerland.m3u8';
        var specifiedGroup = 'Switzerland';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "dk") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_denmark.m3u8:Denmark:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_denmark.m3u8';
        var specifiedGroup = 'Denmark';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "se") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_sweden.m3u8:Sweden:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_sweden.m3u8';
        var specifiedGroup = 'Sweden';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "es") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_Spain.m3u8:Spain:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_spain.m3u8';
        var specifiedGroup = 'Spain';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "at") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_austria.m3u8:Austria:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_austria.m3u8';
        var specifiedGroup = 'Austria';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "it") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_Italy.m3u8:Italy:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_italy.m3u8';
        var specifiedGroup = 'Italy';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "in") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_India.m3u8:India:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_india.m3u8';
        var specifiedGroup = 'India';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "no") {
    
        page.appendItem('m3uGroup:https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_norway.m3u8:Norway:Over-The-Air', 'video', { icon: 'https://myriadrf.org/app/uploads/2017/04/ota-banner-central.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_norway.m3u8';
        var specifiedGroup = 'Norway';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    }

    if (service.adultContent == true) {
    
        page.appendItem("m3u:https%3A%2F%2Fraw.githubusercontent.com%2FF0R3V3R50F7%2Fm7-plugin-streamian%2Frefs%2Fheads%2Fmain%2Fplaylists%2FMyCamTV.m3u:MyCamTV (18+)", 'video', { icon: 'https://adultiptv.net/wp-content/uploads/2024/04/mycamtv.jpg', });
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FF0R3V3R50F7%2Fm7-plugin-streamian%2Frefs%2Fheads%2Fmain%2Fplaylists%2FMyCamTV.m3u';
        var specifiedGroup = '';
        var limit = '4';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
        
    }

};

exports.Search = function (page, query) {

    page.metadata.title = 'Detecting Region, please wait...';

    var userRegion = getUserLocation();
    
    
    if (!userRegion) {
        page.appendItem('', 'separator', { title: 'Failed to detect location. Please try again later.' });
        return;
    }
    
    if (userRegion == "us") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fwww.apsattv.com%2Fredbox.m3u';
        var specifiedGroup = '';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_usa.m3u8';
        var specifiedGroup = 'USA';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "gb") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        /*var pl = 'https%3A%2F%2Fwww.apsattv.com%2Frakuten-uk.m3u';
        var specifiedGroup = 'RakutenTV UK';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });*/// ----------- Particular list is very slow parsing and causes problems with the search.
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_uk.m3u8';
        var specifiedGroup = 'UK';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "fr") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_france.m3u8';
        var specifiedGroup = 'France';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "ca") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_canada.m3u8';
        var specifiedGroup = 'Canada';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "br") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_brazil.m3u8';
        var specifiedGroup = 'Brazil';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "kr") {
    
        scrapeSamsung(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_south_korea.m3u8';
        var specifiedGroup = 'South Korea';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "mx") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_mexico.m3u8';
        var specifiedGroup = 'Mexico';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "cl") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_chile.m3u8';
        var specifiedGroup = 'Chile';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "de") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_germany.m3u8';
        var specifiedGroup = 'Germany';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "ch") {
    
        scrapeSamsung(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_switzerland.m3u8';
        var specifiedGroup = 'Switzerland';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "dk") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_denmark.m3u8';
        var specifiedGroup = 'Denmark';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "se") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_sweden.m3u8';
        var specifiedGroup = 'Sweden';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "es") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_spain.m3u8';
        var specifiedGroup = 'Spain';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "at") {
    
        scrapeSamsung(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_austria.m3u8';
        var specifiedGroup = 'Austria';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "it") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_italy.m3u8';
        var specifiedGroup = 'Italy';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "in") {
    
        scrapeSamsung(page, '100', query);
    
        scrapePluto(page, '100', query);
    
         var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_india.m3u8';
        var specifiedGroup = 'India';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    } else if (userRegion == "no") {
    
        scrapePluto(page, '100', query);
    
        var pl = 'https%3A%2F%2Fraw.githubusercontent.com%2FFree-TV%2FIPTV%2Fmaster%2Fplaylists%2Fplaylist_norway.m3u8';
        var specifiedGroup = 'Norway';
        var limit = '100';
        var parsedData = iprotM3UParser(page, pl, specifiedGroup, limit, query);
        var items = parsedData.items;
        items.forEach(function(item) {
            addChannels(page, [item], specifiedGroup, limit);
        });
    
    }
}

