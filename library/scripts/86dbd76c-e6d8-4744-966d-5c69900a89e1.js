class MusicVisualizerController {
    constructor(instance) {
        if(MusicVisualizerController.instance == null) {
            this.jwt = localStorage.getItem("jwt");
            this.user = JSON.parse(localStorage.getItem("user"));
            this.spotifyEnabled = this.jwt != null && this.user != null && 'spotify' in this.user;
            this.isSpotifyPremium = false;
            this.playerActive = false;
            this.player;
            this.playerState = {};
            this.currentTrackURI;
            this.audioAnalysis;
            this.allAudioAnalysis = {};
            this.visualizations = [];
            this.selectedVisualization;
            this._apiUrl = "https://oh9m8to7dl.execute-api.us-east-1.amazonaws.com/development";
            this._update = this.update;
            this.update = this.preUpdate;
            MusicVisualizerController.instance = this;
        }
        if(instance != null) {
            MusicVisualizerController.instance._sampleMusicId = instance['Sample Music'];
            if(MusicVisualizerController.instance.spotifyEnabled) {
                let lock = createLoadingLock();
                $.ajax({
                    url: MusicVisualizerController.instance._apiUrl + '/user/spotify',
                    type: 'PUT',
                    contentType: 'application/json',
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", MusicVisualizerController.instance.jwt);
                    },
                    success: function(response) {
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        MusicVisualizerController.instance.spotifyToken = response.data.user.spotify.access_token;
                        MusicVisualizerController.instance._verifySpotifyPremium();
                        global.loadingAssets.delete(lock);
                    },
                    error: function(xhr, status, error) {
                        let response = xhr.responseJSON;
                        console.log(response);
                        //Should probably display to the user that there's an issue
                        //and they can't use the visualizer at this time lol
                    }
                });
            } else {
                MusicVisualizerController.instance._setupSample();
            }
        }
        return MusicVisualizerController.instance;
    }

    _setupSample() {
        this._sound = new THREE.Audio(global.audioListener);
        let filename = dataStore.audios[this._sampleMusicId].filename;
        let audioLoader = new THREE.AudioLoader();
        let lock = createLoadingLock();
        let scope = this;
        audioLoader.load(filename,
            function( buffer ) {
                scope._sound.setBuffer(buffer);
                //scope._sound.setVolume(0.2);
                scope.playerState.duration = buffer.duration;
                scope.playerState.paused = true;
                scope.getAudioPosition = scope.getAudioPositionFromSample;
                scope.playerActive = true;
                global.loadingAssets.delete(lock);
            }
        );
        let lock2 = createLoadingLock();
        $.ajax({
            url: 'https://gaurav-d-kale-public.s3.amazonaws.com/C-U-Again-spotify-data.json',
            type: 'GET',
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                scope.audioAnalysis = new AudioAnalysis(response);
                global.loadingAssets.delete(lock2);
            },
            error: function(xhr, status, error) {
                let response = xhr.responseJSON;
                console.log(response);
                //Should probably display to the user that there's an issue
                //and they can't use the visualizer at this time lol
            }
        });
    }

    _verifySpotifyPremium() {
        let lock = createLoadingLock();
        let scope = this;
        $.ajax({
            url: 'https://api.spotify.com/v1/me',
            type: 'GET',
            contentType: 'application/json',
            dataType: 'json',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + scope.spotifyToken);
            },
            success: function(response) {
                if(response.product == "premium") {
                    scope.isSpotifyPremium = true;
                    scope._setupSpotifyWebPlayer();
                } else {
                    scope._setupSample();
                }
                global.loadingAssets.delete(lock);
            },
            error: function(xhr, status, error) {
                let response = xhr.responseJSON;
                console.log(response);
                //Should probably display to the user that there's an issue
                //and they can't use the visualizer at this time lol
            }
        });
    }

    _setupSpotifyWebPlayer() {
        let lock = createLoadingLock();
        let scope = this;
        window.onSpotifyWebPlaybackSDKReady = () => {
            const token = '[My Spotify Web API access token]';
            scope.player = new Spotify.Player({
                name: 'Web Playback SDK Quick Start Player',
                getOAuthToken: cb => { cb(scope.spotifyToken); }
            });
      
            // Error handling
            scope.player.addListener('initialization_error', ({ message }) => { console.error(message); });
            scope.player.addListener('authentication_error', ({ message }) => { console.error(message); });
            scope.player.addListener('account_error', ({ message }) => { console.error(message); });
            scope.player.addListener('playback_error', ({ message }) => { console.error(message); });
      
            // Playback status updates
            scope.player.addListener('player_state_changed', state => {
                if(state != null) {
                    this.playerState.paused = state.paused;
                    this.playerState.position = state.position / 1000;
                    this.playerState.duration = state.duration / 1000;
                    this.playerState.lastStateChangeTime = performance.now();
                    if(this.currentTrackURI != state.track_window.current_track.uri) {
                        this.currentTrackURI = state.track_window.current_track.uri;
                        this.getAudioAnalysis(state.track_window.current_track.id);
                    }
                }
            });
      
            // Ready
            scope.player.addListener('ready', ({ device_id }) => {
                scope._deviceId = device_id;
                console.log('Ready with Device ID', device_id);
                $.ajax({
                    url: 'https://api.spotify.com/v1/me/player',
                    data: JSON.stringify({ "device_ids": [device_id] }),
                    type: "PUT",
                    contentType: 'application/json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "Bearer " + scope.spotifyToken);
                    },
                    success: function(response) {
                        MusicVisualizerController.instance.playerActive = true;
                    },
                    error: function(xhr, status, error) {
                        let response = xhr.responseJSON;
                        console.log(response);
                    },
                });
             });

            // Not Ready
            scope.player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
                MusicVisualizerController.instance.playerActive = true;
            });
      
            // Connect to the player!
            scope.player.connect();
        };
        loadScripts(["https://sdk.scdn.co/spotify-player.js"], function() {
            global.loadingAssets.delete(lock);
        });
    }

    getAudioPosition() {
        if(this.playerState.paused) {
            return this.playerState.position;
        } else {
            let position = this.playerState.position + (performance.now() - this.playerState.lastStateChangeTime) / 1000;
            return position > this.playerState.duration ? this.playerState.duration : position;
        }
    }

    getAudioPositionFromSample() {
        return this._sound.context.currentTime - this.playerState.lastStateChangeTime;
    }

    getAudioAnalysis(trackId) {
        if(trackId in this.allAudioAnalysis) {
            this.audioAnalysis = this.allAudioAnalysis[trackId];
            return;
        }
        this.audioAnalysis = null;
        let scope = this;
        $.ajax({
            url: 'https://api.spotify.com/v1/audio-analysis/' + trackId,
            type: "GET",
            beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + scope.spotifyToken);
            },
            success: function(response) {
                let audioAnalysis = new AudioAnalysis(response);
                scope.allAudioAnalysis[trackId] = audioAnalysis;
                if(scope.currentTrackURI.endsWith(trackId)) {
                    scope.audioAnalysis = audioAnalysis;
                }
            },
            error: function(xhr, status, error) {
                let response = xhr.responseJSON;
                if(!(trackId in scope.allAudioAnalysis)) {
                    setTimeout(function () {
                        scope.getAudioAnalysis(trackId);
                    }, 1000);
                }
            },
        });
    }

    playSample() {
        this.playerState.position = 0;
        this.playerState.lastStateChangeTime = performance.now();
        this.playerState.paused = false;
        this.playerState.lastStateChangeTime = this._sound.context.currentTime;
        this._sound.play();
    }

    playTrack(trackURI, playlistURI) {
        let scope = this;
        let body = {
            "context_uri": playlistURI,
            "offset": {"uri": trackURI}
        };
        $.ajax({
            url: 'https://api.spotify.com/v1/me/player/play',
            data: JSON.stringify(body),
            type: "PUT",
            contentType: 'application/json',
            beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + scope.spotifyToken);
            },
            success: function(response) {
                scope.currentTrackURI = trackURI;
            },
            error: function(xhr, status, error) {
                let response = xhr.responseJSON;
                console.error(response);
            },
        });
        this.getAudioAnalysis(trackURI.substring(trackURI.lastIndexOf(":") + 1));
    }

    pauseTrack() {
        let scope = this;
        $.ajax({ 
            url: 'https://api.spotify.com/v1/me/player/pause',
            type: "PUT", 
            contentType: 'application/json',
            beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + scope.spotifyToken);  
            },
            success: function(response) {
                console.log(response);
            },
            error: function(xhr, status, error) {
                let response = xhr.responseJSON;
                console.error(response);
            },
        });
    }

    resumeTrack() {
        let scope = this;
        $.ajax({ 
            url: 'https://api.spotify.com/v1/me/player/play',
            type: "PUT", 
            contentType: 'application/json',
            beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + scope.spotifyToken);  
            },
            success: function(response) {
                console.log(response);
            },
            error: function(xhr, status, error) {
                let response = xhr.responseJSON;
                console.error(response);
            },
        });
    }

    registerVisualization(visualization, name) {
        let newElement = { "object": visualization, "name": name };
        for(let i = 0; i < this.visualizations.length; i++) {
            if(name < this.visualizations[i].name) {
                this.visualizations.splice(i, 0, newElement);
                if(i == 0) {
                    this.selectedVisualization = visualization;
                }
                return;
            }
        }
        this.visualizations.push(newElement);
        if(this.visualizations.length == 1) {
            this.selectedVisualization = visualization;
        }
    }

    selectVisualization(index) {
        if(this.selectedVisualization == this.visualizations[index].object) {
            return;
        }
        this.selectedVisualization.removeFromScene(global.scene, true);
        this.selectedVisualization = this.visualizations[index].object;
        this.selectedVisualization.addToScene(global.scene, true);
    }

    preUpdate(timeDelta) {
        this.selectedVisualization.addToScene(global.scene, true);
        this.update = this._update;
    }

    update(timeDelta) {
        if(!this.playerState.paused) {
            this.selectedVisualization.update(timeDelta);
        }
    }

    canUpdate() {
        return true;
    }

    static getScriptType() {
        return ScriptType.POST_SCRIPT;
    }

    static getFields() {
        return [
            {
                "name": "Sample Music",
                "type": "audio",
                "default": ""
            },
        ];
    }
}

global.musicVisualizerController = new MusicVisualizerController();



//////////////////////////
// Audio Analysis Class //
//////////////////////////

class AudioAnalysis {
    constructor(rawData) {
        this._data = rawData;
        this._loudnessMax;
        this._loudnessMin;
        this._loudnessRange;
        this._loudnessClip = -25;
        this._orderedPitchIndices;//Ordered Highest to Lowest
        this._analyzeData();
    }

    _analyzeData() {
        this._analyzeBars();
        this._analyzeSegments();
    }

    _analyzeBars() {
        //Oddly enough bar.start+bar.duration does not line up with the following bar
        for(let i = 0; i < this._data.bars.length-1; i++) {
            let bar = this._data.bars[i];
            bar.end = this._data.bars[i+1].start;
        }
        let bar = this._data.bars[this._data.bars.length-1];
        bar.end = bar.start + bar.duration;
        this._barsEnd = bar.end;
    }

    _analyzeSegments() {
        let loudnessMin = 100;
        let loudnessMax = -100;
        let pitchTotals = [0,0,0,0,0,0,0,0,0,0,0,0];
        for(let i = 0; i < this._data.segments.length; i++) {
            let segment = this._data.segments[i];
            if(i != this._data.segments.length-1) {
                segment.end = this._data.segments[i+1].start;
            }
            segment.loudness_max_position = segment.start + segment.loudness_max_time;
            if(segment.loudness_max > loudnessMax) {
                loudnessMax = segment.loudness_max;
            }
            if(segment.loudness_max < loudnessMin) {
                loudnessMin = segment.loudness_max;
            }
            for(let j = 0; j < 12; j++) {
                pitchTotals[j] += segment.pitches[j];
            }
        }
        let segment = this._data.segments[this._data.segments.length-1];
        segment.end = segment.start + segment.duration;
        this._segmentsEnd = segment.end;
        //Loudness
        if(loudnessMax > this._loudnessClip) {
            loudnessMin = this._loudnessClip;
        }
        this._loudnessMax = loudnessMax;
        this._loudnessMin = loudnessMin;
        this._loudnessRange = loudnessMax - loudnessMin;
        //Pitches
        this._sortPitches(pitchTotals);
    }

    _sortPitches(pitchTotals) {
        for (var i = 0; i < pitchTotals.length; i++) {
            pitchTotals[i] = [pitchTotals[i], i];
        }
        pitchTotals.sort(function(left, right) {
            return left[0] > right[0] ? -1 : 1;
        });
        this._orderedPitchIndices = [];
        for (var j = 0; j < pitchTotals.length; j++) {
            this._orderedPitchIndices.push(pitchTotals[j][1]);
        }
    }

    _getCurrentIndex(type, audioPosition) {
        //Assumes audioPosition is within range of elements[0].start and elements[elements.length-1].end
        let elements;
        if(type == "BAR") {
            elements = this._data.bars;
        } else if(type == "SEGMENT") {
            elements = this._data.segments;
        }
        let i = 0;
        while(audioPosition > elements[i].start) {
            i++;
            if(i == elements.length) {
                return i - 1;
            }
        }
        i--;
        return i;
    }

    getTimeToNextBar(audioPosition, currentIndex) {
        if(audioPosition > this._barsEnd) {
            return null;
        }
        //Sanity checks on currentIndex
        if(currentIndex == null || currentIndex < 0 || currentIndex >= this._data.bars.length || audioPosition < this._data.bars[currentIndex].start) {
            currentIndex = this._getCurrentIndex("BAR", audioPosition);
        } else {
            while(currentIndex != this._data.bars.length && audioPosition >= this._data.bars[currentIndex].start) {
                currentIndex++;
            }
            currentIndex--;
        }
        let timeToNextBar;
        if(currentIndex == -1) {//Because the first bar doesn't start at position 0:00 in the track
            let nextBar = this._data.bars[0];
            timeToNextBar = nextBar.start - audioPosition;
        } else {
            let bar = this._data.bars[currentIndex];
            timeToNextBar = bar.end - audioPosition;
        }
        return { "index": currentIndex, "timeToNextBar": timeToNextBar };
    }

    getCurrentLoudness(audioPosition, currentIndex) {
        if(audioPosition > this._segmentsEnd) {
            return null;
        }
        //Sanity checks on currentIndex
        if(currentIndex == null || currentIndex < 0 || currentIndex >= this._data.segments.length || audioPosition < this._data.segments[currentIndex].start) {
            currentIndex = this._getCurrentIndex("SEGMENT", audioPosition);
        } else {
            while(currentIndex != this._data.segments.length && audioPosition >= this._data.segments[currentIndex].start) {
                currentIndex++;
            }
            currentIndex--;
        }
        let currentLoudness;
        let thisSegment = this._data.segments[currentIndex];
        if(audioPosition < thisSegment.loudness_max_position) {
            if(currentIndex == 0) {
                currentLoudness = thisSegment.loudness_max;
            } else {
                let lastSegment = this._data.segments[currentIndex-1];
                let timeFactor = thisSegment.loudness_max_position - lastSegment.loudness_max_position;
                timeFactor = (audioPosition - lastSegment.loudness_max_position) / timeFactor;
                currentLoudness = (thisSegment.loudness_max - lastSegment.loudness_max) * timeFactor + lastSegment.loudness_max;
            }
        } else {
            if(currentIndex == this._data.segments.length-1) {
                currentLoudness = thisSegment.loudnessMax;
            } else {
                let nextSegment = this._data.segments[currentIndex+1];
                let timeFactor = nextSegment.loudness_max_position - thisSegment.loudness_max_position;
                timeFactor = (audioPosition - thisSegment.loudness_max_position) / timeFactor;
                currentLoudness = (nextSegment.loudness_max - thisSegment.loudness_max) * timeFactor + thisSegment.loudness_max;
            }
        }
        return { "index": currentIndex, "currentLoudness": currentLoudness };
    }

    clipLoudness(loudness) {
        if(loudness < this._loudnessClip) {
            return this._loudnessClip;
        } else {
            return loudness;
        }
    }

    scaleLoudness(loudness) {
        return (loudness - this._loudnessMin) / this._loudnessRange;
    }

    getCurrentPitches(audioPosition, currentIndex) {
        if(audioPosition > this._segmentsEnd) {
            return null;
        }
        //Sanity checks on currentIndex
        if(currentIndex == null || currentIndex < 0 || currentIndex >= this._data.segments.length || audioPosition < this._data.segments[currentIndex].start) {
            currentIndex = this._getCurrentIndex("SEGMENT", audioPosition);
        } else {
            while(currentIndex != this._data.segments.length && audioPosition >= this._data.segments[currentIndex].start) {
                currentIndex++;
            }
            currentIndex--;
        }
        let currentPitches;
        let thisSegment = this._data.segments[currentIndex];
        if(currentIndex == this._data.segments.length-1) {
            currentPitches = thisSegment.pitches;
        } else {
            currentPitches = [];
            let nextSegment = this._data.segments[currentIndex+1];
            let timeFactor = nextSegment.start - thisSegment.start;
            timeFactor = (audioPosition - thisSegment.start) / timeFactor;
            for(let i = 0; i < 12; i++) {
                let pitchIndex = this._orderedPitchIndices[i];
                currentPitches[i] = (nextSegment.pitches[pitchIndex] - thisSegment.pitches[pitchIndex]) * timeFactor + thisSegment.pitches[pitchIndex];

            }
        }
        return { "index": currentIndex, "currentPitches": currentPitches };
    }
}