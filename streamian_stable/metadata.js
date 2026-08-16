// TMDB Metadata Scout for Streamian | M7 / Movian Media Center
// Author: F0R3V3R50F7
exports.Scout = function (query, type, maxPages) {
    var apiKey = "a0d71cffe2d6693d462af9e4f336bc06";
    var posterEndpoint = "https://image.tmdb.org/t/p/w500";
    var results = [];

    function safeGet(obj, path, fallback) {
        try {
            var parts = path.split(".");
            for (var i = 0; i < parts.length; i++) obj = obj[parts[i]];
            return obj !== undefined ? obj : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function joinNames(arr) {
        var names = [];
        arr.forEach(function (p) { names.push(p.name); });
        return names.join(", ");
    }

    if (type === 'movie') {
        var queryParts = query.match(/^(.*?)(?:\s\((\d{4})\))?$/i);
        if (queryParts && queryParts.length > 1) {
            var movieTitle = queryParts[1].trim();
            var movieYear = queryParts[2];
            var movieApiUrl = "https://api.themoviedb.org/3/search/movie?api_key=" + apiKey + "&query=" + encodeURIComponent(movieTitle.toLowerCase());
            var movieData = JSON.parse(http.request(movieApiUrl));
            if (movieData.results && movieData.results.length > 0) {
                var movie = null;
                movieData.results.forEach(function (result) {
                    var resultYear = result.release_date ? result.release_date.split("-")[0] : null;
                    if (!movie && (!movieYear || resultYear === movieYear)) movie = result;
                });
                if (!movie) movie = movieData.results[0];

                var detailsUrl = "https://api.themoviedb.org/3/movie/" + movie.id + "?api_key=" + apiKey + "&append_to_response=credits,external_ids,videos";
                var details = JSON.parse(http.request(detailsUrl));

                var movieDescription = movie.overview || "No description available";
                var backdropUrl = movie.backdrop_path ? "https://image.tmdb.org/t/p/original" + movie.backdrop_path : "No backdrop available";
                var voteAverage = movie.vote_average ? movie.vote_average.toString() : "No rating";
                var releaseDate = movie.release_date || "No release date";
                var runtime = safeGet(details, "runtime", null);
                runtime = runtime ? runtime.toString() + " Minutes" : "No runtime available";
                var imdbId = safeGet(details, "external_ids.imdb_id", "");

                var trailerKey = "";
                if (details.videos && details.videos.results && details.videos.results.length > 0) {
                    trailerKey = details.videos.results[0].key;
                }
                var youtubetrailerthumbnail = trailerKey ? "https://img.youtube.com/vi/" + trailerKey + "/maxresdefault.jpg" : "No trailer available";

                var cast = safeGet(details, "credits.cast", []);
                var crew = safeGet(details, "credits.crew", []);

                var item = backdropUrl + " -|- " + youtubetrailerthumbnail + " -|- " + releaseDate + " -|- " + voteAverage +
                    " -|- " + runtime + " -|- " + movieDescription + " -|- " + joinNames(cast) + " -|- " + joinNames(crew) + " -|- " + imdbId;

                results.push(item);
            }
        }
    }


    if (type === 'episode') {
        console.log("Processing episode query: " + query);
        
        var queryParts = query.match(/^(.*?)\s(\d{4})\s(s\d{1,2}e\d{1,2})/i);
        console.log("Parsed query parts: " + JSON.stringify(queryParts));
    
        if (queryParts && queryParts.length === 4) {
            var showTitle = queryParts[1].trim();
            var showYear = queryParts[2];
            var seasonEpisode = queryParts[3];
    
            console.log("Show Title: " + showTitle + ", Year: " + showYear + ", Season/Episode: " + seasonEpisode);
    
            var showApiUrl = "https://api.themoviedb.org/3/search/tv?api_key=" + apiKey + "&query=" + encodeURIComponent(showTitle.toLowerCase());
            console.log("Show API URL: " + showApiUrl);
            
            var showResponse = http.request(showApiUrl, {method: 'GET'});
            console.log("Show API Response: " + showResponse);
            
            var showData = JSON.parse(showResponse.toString());
            console.log("Decoded Show Data: " + JSON.stringify(showData));
    
            if (showData.results && showData.results.length > 0) {
                var show = showData.results[0];
                console.log("Found Show: " + JSON.stringify(show));
    
                var showFirstAirDate = show.first_air_date ? show.first_air_date.split("-")[0] : null;
                console.log("Show First Air Date: " + showFirstAirDate);
                
                if (showFirstAirDate && showFirstAirDate === showYear) {
                    console.log("Year matched: " + showFirstAirDate + " === " + showYear);
                    
                    var seasonEpisodeMatch = seasonEpisode.match(/s(\d{1,2})e(\d{1,2})/i);
                    console.log("Season/Episode Match: " + JSON.stringify(seasonEpisodeMatch));
                    
                    if (seasonEpisodeMatch && seasonEpisodeMatch.length === 3) {
                        var season = seasonEpisodeMatch[1];
                        var episode = seasonEpisodeMatch[2];
    
                        console.log("Extracted Season: " + season + ", Episode: " + episode);
    
                        var episodeApiUrl = "https://api.themoviedb.org/3/tv/" + show.id + "/season/" + season + "/episode/" + episode + "?api_key=" + apiKey + "&append_to_response=external_ids";
                        console.log("Episode API URL: " + episodeApiUrl);
                        
                        var episodeResponse = http.request(episodeApiUrl, {method: 'GET'});
                        console.log("Episode API Response: " + episodeResponse);
                        
                        var episodeData = JSON.parse(episodeResponse.toString());
                        console.log("Decoded Episode Data: " + JSON.stringify(episodeData)); // Log the entire episode data
    
                        if (episodeData) {
                            console.log("Episode Data Found");
                            
                            var episodeDescription = episodeData.overview || "No description available";
                            var backdropUrl = show.backdrop_path ? "https://image.tmdb.org/t/p/original" + show.backdrop_path : "No backdrop available";
                            var episodeStill = episodeData.still_path ? "https://image.tmdb.org/t/p/w500" + episodeData.still_path : backdropUrl;
                            var voteAverage = episodeData.vote_average ? episodeData.vote_average.toString() : "No rating";
                            var imdbId = episodeData.external_ids && episodeData.external_ids.imdb_id ? episodeData.external_ids.imdb_id : "No IMDb ID available";
                            var episodeName = episodeData.name ? episodeData.name : '';
    
                            console.log("Episode Description: " + episodeDescription);
                            console.log("Episode Still: " + episodeStill);
                            console.log("Vote Average: " + voteAverage);
                            console.log("IMDb ID: " + imdbId);
    
                            var guestStars = "No guest stars"; // Default value
                            if (episodeData.guest_stars && episodeData.guest_stars.length > 0) {
                                guestStars = "";
                                for (var i = 0; i < episodeData.guest_stars.length; i++) {
                                    if (i > 0) guestStars += ", "; // Add comma for multiple guest stars
                                    guestStars += episodeData.guest_stars[i].name;
                                }
                            }
                            console.log("Guest Stars: " + guestStars);
                            
                            var recasedShowName = recaseShowTitle(showTitle);
                            
    
                            var item = backdropUrl + " -|- " + episodeStill + " -|- " + showFirstAirDate + " -|- " + voteAverage + " -|- " + guestStars + " -|- " + episodeDescription + " -|- " + showTitle + " " + seasonEpisode + " -|- " + imdbId + " -|- " + recasedShowName + " - " + episodeName ;
                            results.push(item);
                        }
                    }
                }
            }
        } else {
            console.log("Invalid query format: " + query);
        }
    }    

    if (type === 'show') {
        // Extract the title and the year from the query
        var yearMatch = query.match(/\((\d{4})\)$/);
        var year = yearMatch ? yearMatch[1] : null;
        var title = query.replace(/\(\d{4}\)$/, '').trim(); // Remove the year from the title

        // Build the TMDB API URL, including the year filter if available
        var apiUrl = "https://api.themoviedb.org/3/search/tv?api_key=" + apiKey + "&query=" + encodeURIComponent(title);
        if (year) {
            apiUrl += "&first_air_date_year=" + year;
        }

        // Fetch the show from TMDB
        var response = http.request(apiUrl);
        var json = JSON.parse(response);

        if (json.results && json.results.length > 0) {
            // Get the first result (nearest match)
            var show = json.results[0];
            var showId = show.id;

            // Fetch seasons for the show
            var seasonApiUrl = "https://api.themoviedb.org/3/tv/" + showId + "?api_key=" + apiKey;
            var seasonResponse = http.request(seasonApiUrl);
            var seasonJson = JSON.parse(seasonResponse);

            if (seasonJson.seasons && seasonJson.seasons.length > 0) {
                seasonJson.seasons.forEach(function (season) {
                    var seasonTitle = "Season " + season.season_number;
                    var icon = season.poster_path ? posterEndpoint + season.poster_path : '';
                    var item = seasonTitle + " -|- " + icon + " -|- season" + " -|- " + season.season_number + " -|- " + backdropUrl;
                    results.push(item);
                });
            }
        }
    }

    if (type === 'season') {
        // Extract the season number from the query (case-insensitive)
        var seasonMatch = query.match(/s(\d+)/i); // Match "s" followed by the season number, case-insensitive
        var seasonNumber = seasonMatch ? seasonMatch[1] : null;
    
        // Extract the year from the query (case-insensitive)
        var yearMatch = query.match(/\((\d{4})\)/i); // Match the year in parentheses, case-insensitive
        var year = yearMatch ? yearMatch[1] : null;
    
        // Extract the title by removing year and season from the query
        var title = query.replace(/\(\d{4}\)\s*s\d+/i, '').trim(); // Strip off the year and season number with more flexibility (case-insensitive)
    
        // Convert the title to title case for TMDB (capitalize the first letter of each word)
        var titleCased = title.replace(/\b\w/g, function(l){ return l.toUpperCase(); });
    
        // Debugging: Log extracted values to verify they are correct
        console.log("Query: " + query);
        console.log("Extracted Title: " + title);
        console.log("Title-Cased for TMDB: " + titleCased);
        console.log("Extracted Year: " + year);
        console.log("Extracted Season: " + seasonNumber);
    
        // Ensure both season number and year are found
        if (seasonNumber && year) {
            // Build the TMDB API URL
            var apiUrl = "https://api.themoviedb.org/3/search/tv?api_key=" + apiKey + "&query=" + encodeURIComponent(titleCased);
            if (year) {
                apiUrl += "&first_air_date_year=" + year;
            }
    
            // Debug: Log the constructed URL
            console.log("TMDB API URL: " + apiUrl);
    
            // Fetch the show from TMDB
            var response = http.request(apiUrl);
            var json = JSON.parse(response);
    
            if (json.results && json.results.length > 0) {
                // Get the first result (nearest match)
                var show = json.results[0];
                var showId = show.id;
    
                // Fetch episodes for the specific season
                var episodeApiUrl = "https://api.themoviedb.org/3/tv/" + showId + "/season/" + seasonNumber + "?api_key=" + apiKey;
                
                // Debug: Log the constructed episode URL
                console.log("TMDB Episode API URL: " + episodeApiUrl);
    
                var episodeResponse = http.request(episodeApiUrl);
                var episodeJson = JSON.parse(episodeResponse);
    
                if (episodeJson.episodes && episodeJson.episodes.length > 0) {
                    episodeJson.episodes.forEach(function (episode) {
                        var episodeTitle = "S" + seasonNumber + "E" + episode.episode_number + " - " + episode.name;
                        var episodeDescription = episode.overview
                        var icon = episode.still_path ? posterEndpoint + episode.still_path : null;
                        var item = episodeTitle + " -|- " + icon + " -|- " + title + " " + year + " s" + seasonNumber + "e" + episode.episode_number + " -|- " + episodeDescription;
                        results.push(item);
                    });
                } else {
                    console.log("No episodes found for season " + seasonNumber);
                }
            } else {
                console.log("Show not found for query: " + query);
            }
        } else {
            console.log("Invalid query format for season type - Missing season number or year");
        }
    }

    if (type === 'recommendations') {
        var parts = query.split(':');
        if (parts.length !== 3) return [];

        var title = parts[0];
        var year = parts[1];
        var tmdbType = parts[2]; // 'movie' or 'tv'

        function getBackdropImage(mediaType, id) {
            var imagesUrl = "https://api.themoviedb.org/3/" + mediaType + "/" + id + "/images?api_key=" + apiKey + "&language=en-US&include_image_language=en";
            var response = http.request(imagesUrl);
            var json = JSON.parse(response);
            if (json.backdrops && json.backdrops.length > 0) {
                return "https://image.tmdb.org/t/p/w780" + json.backdrops[0].file_path;
            }
            return null;
        }

        // Step 1: Search for the title to get its TMDB ID
        var searchUrl = "https://api.themoviedb.org/3/search/" + tmdbType + "?api_key=" + apiKey + "&query=" + encodeURIComponent(title) + "&year=" + year;
        var searchRes = JSON.parse(http.request(searchUrl));
        if (!searchRes.results || searchRes.results.length === 0) return [];

        var id = searchRes.results[0].id;

        // Step 2: Fetch recommendations
        var recUrl = "https://api.themoviedb.org/3/" + tmdbType + "/" + id + "/recommendations?api_key=" + apiKey;
        var recData = JSON.parse(http.request(recUrl));
        if (!recData.results) return [];

        var output = [];
        for (var i = 0; i < Math.min(5, recData.results.length); i++) {
            var item = recData.results[i];
            var recTitle = tmdbType === "tv" ? item.name : item.title;
            var date = tmdbType === "tv" ? item.first_air_date : item.release_date;
            var yearPart = date ? date.substring(0, 4) : "Unknown";
            var icon = getBackdropImage(tmdbType, item.id);
            if (!icon) continue;

            var itemString = recTitle + " (" + yearPart + ")" + " -|- " + icon + " -|- " + (tmdbType === "tv" ? "show" : "movie");
            output.push(itemString);
        }

        return output;
    }


    if (type === 'query') {
        var pages = maxPages || 10;
        var genreMap = {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
            80: 'Crime', 18: 'Drama', 14: 'Fantasy', 27: 'Horror',
            878: 'Science Fiction', 53: 'Thriller',
        };

        function getGenres(ids) {
            var out = [];
            ids.forEach(function (id) {
                if (genreMap[id]) out.push(genreMap[id]);
            });
            return out.length > 0 ? out.join(', ') : 'Unknown';
        }

        function getEnglishBackdrop(mediaType, id) {
            var imagesUrl = "https://api.themoviedb.org/3/" + mediaType + "/" + id + "/images?api_key=" + apiKey + "&language=en-US&include_image_language=en,null";
            try {
                var response = http.request(imagesUrl);
                var json = JSON.parse(response);
                if (json.backdrops && json.backdrops.length > 0) {
                    var fallback = null;
                    for (var i = 0; i < json.backdrops.length; i++) {
                        var backdrop = json.backdrops[i];
                        if (backdrop.iso_639_1 === 'en') {
                            return "https://image.tmdb.org/t/p/w780" + backdrop.file_path;
                        } else if (backdrop.iso_639_1 === null && !fallback) {
                            fallback = "https://image.tmdb.org/t/p/w780" + backdrop.file_path;
                        }
                    }
                    if (fallback) return fallback;
                }
            } catch (e) {}
            return Plugin.path + "images/cvrntfnd.png";
        }


        for (var page = 1; page <= pages; page++) {
            var apiUrl = "";
            if (query === 'popularshows') {
                apiUrl = "https://api.themoviedb.org/3/tv/popular?api_key=" + apiKey + "&page=" + page;
            } else if (query === 'popularmovies') {
                apiUrl = "https://api.themoviedb.org/3/movie/popular?api_key=" + apiKey + "&page=" + page;
            } else {
                apiUrl = "https://api.themoviedb.org/3/search/multi?api_key=" + apiKey + "&query=" + encodeURIComponent(query) + "&page=" + page;
            }

            try {
                var json = JSON.parse(http.request(apiUrl));
                if (!json.results || json.results.length === 0) continue;

                json.results.forEach(function (item) {
                    var type = null, title = "", year = "Unknown", genres = "Unknown", icon = "";

                    if ((item.media_type === 'movie' || query === 'popularmovies') && item.id) {
                        type = 'movie';
                        title = item.title || item.original_title || '';
                        year = item.release_date ? item.release_date.substring(0, 4) : 'Unknown';
                        genres = getGenres(item.genre_ids || []);
                        icon = getEnglishBackdrop('movie', item.id);
                        title += " (" + year + ")";
                    } else if ((item.media_type === 'tv' || query === 'popularshows') && item.id) {
                        type = 'show';
                        title = item.name || item.original_name || '';
                        year = item.first_air_date ? item.first_air_date.substring(0, 4) : 'Unknown';
                        genres = getGenres(item.genre_ids || []);
                        icon = getEnglishBackdrop('tv', item.id);
                        title += " (" + year + ")";
                    }

                    if (type && icon) {
                        var itemString = title + " -|- " + icon + " -|- " + type + " -|- " + encodeURIComponent(genres);
                        results.push(itemString);
                    }
                });
            } catch (e) {
                console.log("Error fetching TMDB data for page " + page + ": " + e);
            }
        }
    }

    return results;
};