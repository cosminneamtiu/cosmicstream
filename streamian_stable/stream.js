exports.Scout = function (page, title, imdbid) {
    cancelCurrentOperation();
    currentCancellationToken = createCancellationToken();
    var cancellationToken = currentCancellationToken;

    page.loading = true;

    function cleanup() {
        page.loading = false;
        currentCancellationToken = null;
    }

    function checkCancellation() {
        if (cancellationToken.cancelled) {
            cleanup();
            throw 'Operation cancelled';
        }
    }

    function getScraperUrls() {
        return [
            service.addon1url,
            service.addon2url,
            service.addon3url,
            service.addon4url,
            service.addon5url,
            service.addon6url
        ];
    }

    function loadScraper(url) {
        if (!url) return null;
        var fileName = url.split('/').pop().replace('.js', '');
        try {
            var scriptText = showtime.httpReq(url).toString();
            var scraperFunc = new Function(
                'page',
                'title',
                scriptText + '\nreturn search' + fileName + '(page, title);'
            );
            return { func: scraperFunc, name: fileName };
        } catch (e) {
            console.log("Failed to load scraper " + fileName + ": " + e.message);
            return null;
        }
    }

    try {
        var scrapers = getScraperUrls().map(loadScraper);
        var combinedResults = [];

        function analyzeQuality(magnet, codec) {
            if (service.H265Filter && /x265|h265/i.test(codec)) return null;

            var text = (magnet + ' ' + codec).toLowerCase();

            if (/(^|[^a-z0-9])(2160p|4k|ultrahd)([^a-z0-9]|$)/.test(text)) return '4k';
            if (/(^|[^a-z0-9])(1080p|fullhd|fhd)([^a-z0-9]|$)/.test(text)) return '1080p';
            if (/(^|[^a-z0-9])(720p|hd)([^a-z0-9]|$)/.test(text)) return '720p';
            if (/(^|[^a-z0-9])(480p|sd)([^a-z0-9]|$)/.test(text)) return '480p';
            if (/(^|[^a-z0-9])(360p|ld|hq)([^a-z0-9]|$)/.test(text)) return '360p';

            if (/webrip|web-dl|webdl/.test(text)) {
                if (/2160p|4k/.test(text)) return '4k';
                if (/1080p/.test(text)) return '1080p';
                if (/720p/.test(text)) return '720p';
                if (/480p/.test(text)) return '480p';
                return '720p';
            }

            if (/xvid/.test(text)) return '480p';
            if (/divx/.test(text)) return '480p';
            if (/hdtv/.test(text)) return '720p';
            if (/dvdrip|bdrip/.test(text)) return '480p';
            if (/camrip|tsrip|telesync/.test(text)) return '360p';
            if (/vhsrip/.test(text)) return '360p';

            if (/x264|h\.264|avc/.test(text)) {
                if (/720p/.test(text)) return '720p';
                if (/1080p/.test(text)) return '1080p';
            }

            return 'Unknown Quality';
        }

        // Gather results
        for (var i = 0; i < scrapers.length; i++) {
            var scraper = scrapers[i];
            if (scraper && scraper.func) {
                try {
                    page.metadata.title = 'Searching ' + scraper.name + '...';
                    var results = scraper.func(page, title);
                    checkCancellation();

                    for (var j = 0; j < results.length; j++) {
                        var parts = results[j].split(' - ');
                        var magnet = parts[0];
                        var codec = parts[3] || 'Unknown';
                        var quality = analyzeQuality(magnet, codec);
                        if (!quality) quality = parts[1] || 'Unknown Quality';
                        if (!quality || quality === 'false') quality = 'Unknown Quality';
                        var seeders = parseInt(parts[2]) || 0;

                        combinedResults.push({
                            magnet: magnet,
                            quality: quality,
                            seeders: seeders,
                            source: scraper.name
                        });
                    }
                } catch (e) {
                    console.log('Scraper error: ' + scraper.name + ': ' + e.message);
                }
            }
        }

        checkCancellation();

        if (combinedResults.length === 0) {
            page.loading = false;
            page.error('No streams found.');
            return;
        }

        // quality order lowest → highest
        var qualityOrder = ['360p', '480p', '720p', '1080p', '4k'];

        function normalize(q) {
            q = q.toLowerCase();
            if (q === 'ultrahd') return '4k';
            if (q === 'fullhd') return '1080p';
            if (q === 'hd') return '720p';
            if (q === 'sd') return '480p';
            return q;
        }

        function pickBest(preferred) {
            var index = -1;
            for (var i = 0; i < qualityOrder.length; i++) {
                if (qualityOrder[i].toLowerCase() === preferred.toLowerCase()) {
                    index = i;
                    break;
                }
            }
            if (index === -1) return null;

            function matchQuality(q) {
                return function (r) {
                    return r.quality &&
                        r.quality.toLowerCase() === q.toLowerCase() &&
                        r.seeders >= service.minPreferredSeeders;
                };
            }

            // Preferred
            var preferredMatches = [];
            for (var a = 0; a < combinedResults.length; a++) {
                if (matchQuality(qualityOrder[index])(combinedResults[a])) {
                    preferredMatches.push(combinedResults[a]);
                }
            }
            if (preferredMatches.length > 0) {
                preferredMatches.sort(function (a, b) { return b.seeders - a.seeders; });
                return preferredMatches[0];
            }

            // Lower qualities
            for (var j = index - 1; j >= 0; j--) {
                var lowerMatches = [];
                for (var k = 0; k < combinedResults.length; k++) {
                    if (matchQuality(qualityOrder[j])(combinedResults[k])) {
                        lowerMatches.push(combinedResults[k]);
                    }
                }
                if (lowerMatches.length > 0) {
                    lowerMatches.sort(function (a, b) { return b.seeders - a.seeders; });
                    return lowerMatches[0];
                }
            }

            // Higher qualities
            for (var j = index + 1; j < qualityOrder.length; j++) {
                var higherMatches = [];
                for (var k = 0; k < combinedResults.length; k++) {
                    if (matchQuality(qualityOrder[j])(combinedResults[k])) {
                        higherMatches.push(combinedResults[k]);
                    }
                }
                if (higherMatches.length > 0) {
                    higherMatches.sort(function (a, b) { return b.seeders - a.seeders; });
                    return higherMatches[0];
                }
            }

            return null;
        }

        var preferred = normalize(service.selectQuality);
        var stream = pickBest(preferred);

        // fallback to most seeded overall
        if (!stream) {
            combinedResults.sort(function (a, b) { return b.seeders - a.seeders; });
            stream = combinedResults[0];
        }

        if (stream) {
            var isArchive = (stream.source === 'InternetArchive');

            var vparams = 'videoparams:' + JSON.stringify({
                title: title,
                canonicalUrl: isArchive ? stream.magnet : 'torrent://' + stream.magnet,
                no_fs_scan: true,
                sources: [{
                    url: isArchive ? stream.magnet : 'torrent:video:' + stream.magnet
                }],
                imdbid: imdbid
            });

            var popupMsg = stream.source + ' | ' + stream.quality;
            if (!isArchive) popupMsg += ' | ' + stream.seeders + ' seeders';

            popup.notify(popupMsg, 10);
            page.loading = false;
            page.redirect(vparams);
        } else {
            page.loading = false;
            popup.notify('No suitable stream found.', 5);
        }

        cleanup();

    } catch (e) {
        cleanup();
        popup.notify('Unexpected error: ' + e, 5);
    }
};
