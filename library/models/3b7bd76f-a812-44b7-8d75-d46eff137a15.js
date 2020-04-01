class MusicVisualizerMenu {
    constructor(instance) {
        this._instance = instance;
        this._pivotPoint = new THREE.Object3D();
        if(global.isVR) {
            this._pointerPoint = global.renderer.xr.getController(0);
        } else {
            this._pointerPoint = new THREE.Object3D();
            this._pointerPoint.position.setX(0.2);
            global.camera.add(this._pointerPoint);
            document.addEventListener('keydown', event =>
                { this._onKeyDown(event) }, false );
            document.addEventListener('keyup', event =>
                { this._onKeyUp(event) }, false );
        }
        this._lineMesh;
        this._scene;
        this._canvas = document.createElement("canvas");
        this._activeHand = "RIGHT";
        this._texture;
        this._menuMesh;
        this._state;
        this._priorState;
        this._playlists;
        this._playlistsOffset = 0;
        this._playlistsPage = 0;
        this._selectedPlaylist;
        this._playlistTracks;
        this._playlistTracksOffset = 0;
        this._playlistTracksPage = 0;
        this._selectedPlaylistTrack;
        this._visuals = global.musicVisualizerController.visualizations;
        this._visualsPage = 0;
        this._samplePlaying = false;
        this._playerActive = false;
        this._menuLock = true;

        this._pivotPoint.translateX(instance['Initial X Position']);
        this._pivotPoint.translateY(instance['Initial Y Position']);
        this._pivotPoint.translateZ(instance['Initial Z Position']);

        this._pivotPoint.rotation.set(getRadians(instance['Initial X Rotation']), getRadians(instance['Initial Y Rotation']), getRadians(instance['Initial Z Rotation']));

        this._createMeshes(instance);
    }

    _createMeshes(instance) {
        let width = 900;
        let height = 600;
        this._canvas.width = width;
        this._canvas.height = height;
        let context = this._getContextAndClearMenu();
        context.textAlign = "center";
        context.textBaseline = "middle";
        this._texture = new THREE.Texture(this._canvas);
        if(global.musicVisualizerController.spotifyEnabled) {
            this._state = "PLAYLISTS";
            this._writePlaylistsMenu();
            //this._getPlaylists();
        } else {
            this._menuLock = false;
            this._state = "SAMPLE";
            this._writeSampleMenu();
        }

        let geometry = new THREE.PlaneBufferGeometry(3 * this._instance['Scale'], 2 * this._instance['Scale']);
        let material = new THREE.MeshBasicMaterial({
            map: this._texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this._instance['Opacity'],
        });
        this._menuMesh = new THREE.Mesh( geometry, material );
        this._pivotPoint.add(this._menuMesh);
        this._menuMesh.material.map.needsUpdate = true;
        let lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
        let lineGeometry = new THREE.BufferGeometry();
        let vertices = new Float32Array( [
            0.0, 0.0, 0.0,
            0.0, 0.0, -2.0
        ]);
        lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        lineGeometry.setDrawRange(0, 2);
        this._lineMesh = new THREE.Line( lineGeometry, lineMaterial );
        this._lineMesh.visible = false;
        this._pointerPoint.add(this._lineMesh);
    }

    _writeSampleMenu() {
        let context = this._getContextAndClearMenu();
        context.strokeStyle = "#FFFFFF";
        context.fillStyle = "#55FF55";
        context.font = '30px Arial';
        let text;
        if(global.musicVisualizerController.jwt == null) {
            text = "Log In and Connect your Spotify Premium Account to play music from your playlists";
        } else if(global.musicVisualizerController.spotifyEnabled) {
            text = "Upgrade to Spotify Premium to play music from your playlists";
        } else {
            text = "Connect your Spotify Premium Account to play music from your playlists";
        }
        insertWrappedTextToCanvas(context, text, this._canvas.width / 2, this._canvas.height * 0.25, this._canvas.width * 0.9, 40);
        //context.fillText(text, this._canvas.width / 2, this._canvas.height * 0.25);
        context.fillText("Sample", this._canvas.width / 2, this._canvas.height * 0.1);
        if(!this._samplePlaying) {
            context.fillText("Play Sample", this._canvas.width / 2, this._canvas.height * 0.8);
            context.strokeRect(this._canvas.width * 0.37, this._canvas.height * 0.74, this._canvas.width * 0.26, this._canvas.height * 0.12);
        }
        this._texture.needsUpdate = true;
    }

    _writePlaylistsMenu() {
        let context = this._getContextAndClearMenu();
        context.strokeStyle = "#FFFFFF";
        context.fillStyle = "#55FF55";
        context.font = '30px Arial';
        context.fillText("Playlists", this._canvas.width / 2, this._canvas.height * 0.1);
        context.strokeRect(this._canvas.width * 0.75, this._canvas.height * 0.05, this._canvas.width * 0.15, this._canvas.height * 0.1);
        context.fillText("Visuals", this._canvas.width * 0.825, this._canvas.height * 0.1);
        if(this._menuLock) {
            context.fillText("Loading", this._canvas.width / 2, this._canvas.height * 0.5);
        } else {
            let startingIndex = this._playlistsPage * 5 - this._playlistsOffset;
            let j = 0;
            if(this._playlistsPage != 0) {
                context.strokeRect(this._canvas.width * 0.02, this._canvas.height * 0.175, this._canvas.width * 0.06, this._canvas.height * 0.75);
                context.fillText("<", this._canvas.width * 0.05, this._canvas.height * 0.5625);
            }
            if(this._playlistsPage != Math.floor(Math.abs((this._totalPlaylists - 1) / 5))) {
                context.strokeRect(this._canvas.width * 0.92, this._canvas.height * 0.175, this._canvas.width * 0.06, this._canvas.height * 0.75);
                context.fillText(">", this._canvas.width * 0.95, this._canvas.height * 0.5625);
            }
            context.textAlign = "left";
            for(let i = startingIndex; i < Math.min(startingIndex + 5, this._playlists.length); i++) {
                context.strokeRect(this._canvas.width * 0.1, this._canvas.height * (0.175 + j * 0.15), this._canvas.width * 0.8, this._canvas.height * 0.15);
                context.fillText(this._playlists[i].name, this._canvas.width * 0.15, this._canvas.height * (0.25 + 0.15 * j));
                j++;
            }
        }
        this._texture.needsUpdate = true;
    }

    _writePlaylistTracksMenu() {
        let context = this._getContextAndClearMenu();
        context.strokeStyle = "#FFFFFF";
        context.fillStyle = "#55FF55";
        context.font = '30px Arial';
        context.fillText(this._selectedPlaylist.name, this._canvas.width / 2, this._canvas.height * 0.1);
        context.strokeRect(this._canvas.width * 0.1, this._canvas.height * 0.05, this._canvas.width * 0.15, this._canvas.height * 0.1);
        context.fillText("Playlists", this._canvas.width * 0.175, this._canvas.height * 0.1);
        context.strokeRect(this._canvas.width * 0.75, this._canvas.height * 0.05, this._canvas.width * 0.15, this._canvas.height * 0.1);
        context.fillText("Visuals", this._canvas.width * 0.825, this._canvas.height * 0.1);
        if(this._menuLock) {
            context.fillText("Loading", this._canvas.width / 2, this._canvas.height * 0.5);
        } else {
            let startingIndex = this._playlistTracksPage * 5 - this._playlistTracksOffset;
            let j = 0;
            if(this._playlistTracksPage != 0) {
                context.strokeRect(this._canvas.width * 0.02, this._canvas.height * 0.175, this._canvas.width * 0.06, this._canvas.height * 0.75);
                context.fillText("<", this._canvas.width * 0.05, this._canvas.height * 0.5625);
            }
            if(this._playlistTracksPage != Math.floor(Math.abs((this._totalPlaylistTracks - 1) / 5))) {
                context.strokeRect(this._canvas.width * 0.92, this._canvas.height * 0.175, this._canvas.width * 0.06, this._canvas.height * 0.75);
                context.fillText(">", this._canvas.width * 0.95, this._canvas.height * 0.5625);
            }
            context.textAlign = "left";
            for(let i = startingIndex; i < Math.min(startingIndex + 5, this._playlistTracks.length); i++) {
                context.strokeRect(this._canvas.width * 0.1, this._canvas.height * (0.175 + j * 0.15), this._canvas.width * 0.8, this._canvas.height * 0.15);
                context.fillText(this._playlistTracks[i].track.name, this._canvas.width * 0.15, this._canvas.height * (0.25 + 0.15 * j));
                j++;
            }
        }
        this._texture.needsUpdate = true;
    }

    _writeVisualsMenu() {
        let context = this._getContextAndClearMenu();
        context.strokeStyle = "#FFFFFF";
        context.fillStyle = "#55FF55";
        context.font = '30px Arial';
        context.fillText("Visuals", this._canvas.width / 2, this._canvas.height * 0.1);
        context.strokeRect(this._canvas.width * 0.1, this._canvas.height * 0.05, this._canvas.width * 0.15, this._canvas.height * 0.1);
        context.fillText("Back", this._canvas.width * 0.175, this._canvas.height * 0.1);
        let startingIndex = this._visualsPage * 5
        let j = 0;
        if(this._visualsPage != 0) {
            context.strokeRect(this._canvas.width * 0.02, this._canvas.height * 0.175, this._canvas.width * 0.06, this._canvas.height * 0.75);
            context.fillText("<", this._canvas.width * 0.05, this._canvas.height * 0.5625);
        }
        if(this._visualsPage != Math.floor(Math.abs((this._visuals.length - 1) / 5))) {
            context.strokeRect(this._canvas.width * 0.92, this._canvas.height * 0.175, this._canvas.width * 0.06, this._canvas.height * 0.75);
            context.fillText(">", this._canvas.width * 0.95, this._canvas.height * 0.5625);
        }
        context.textAlign = "left";
        for(let i = startingIndex; i < Math.min(startingIndex + 5, this._visuals.length); i++) {
            context.strokeRect(this._canvas.width * 0.1, this._canvas.height * (0.175 + j * 0.15), this._canvas.width * 0.8, this._canvas.height * 0.15);
            context.fillText(this._visuals[i].name, this._canvas.width * 0.15, this._canvas.height * (0.25 + 0.15 * j));
            j++;
        }
        this._texture.needsUpdate = true;
    }

    _getContextAndClearMenu() {
        let context = this._canvas.getContext('2d');
        //context.fillStyle = "#080808";
        context.fillStyle = "#051616";
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        context.textAlign = "center";
        return context;
    }

    _getPlaylists() {
        let scope = this;
        $.ajax({
            url: 'https://api.spotify.com/v1/me/playlists?limit=50&offset=' + scope._playlistsOffset,
            type: "GET",
            beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + global.musicVisualizerController.spotifyToken);
            },
            success: function(response) {
                scope._playlists = response.items;
                scope._totalPlaylists = response.total;
                scope._menuLock = false;
                scope._writePlaylistsMenu();
            },
            error: function(xhr, status, error) {
                let response = xhr.responseJSON;
                console.log(response);
            },
        });
    }

    _getPlaylistTracks() {
        let scope = this;
        $.ajax({
            url: 'https://api.spotify.com/v1/playlists/' + scope._selectedPlaylist.id + '/tracks?limit=100&offset=' + scope._playlistTracksOffset,
            type: "GET",
            beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + global.musicVisualizerController.spotifyToken);
            },
            success: function(response) {
                //console.log(response);
                scope._playlistTracks = response.items;
                scope._totalPlaylistTracks = response.total;
                scope._menuLock = false;
                scope._writePlaylistTracksMenu();
            },
            error: function(xhr, status, error) {
                let response = xhr.responseJSON;
                console.log(response);
            },
        });
    }

    _pressTriggerOnMenu(intersection) {
        if(this._menuLock) {
            return;
        }
        this._triggerPressed = true;
        if(intersection == null) {
            intersection = this._getIntersection();
        }
        if(intersection != null) {
            let point = intersection.point.clone();
            this._pivotPoint.worldToLocal(point);
            let width = 3 * this._instance['Scale'];
            let height = 2 * this._instance['Scale'];
            if(this._state == "SAMPLE") {
                if(!this._samplePlaying) {
                    if(height * -0.36 < point.y && point.y < height * -0.24) {
                        if(width * -0.13 < point.x && point.x < width * 0.13) {
                            global.musicVisualizerController.playSample();
                            this._samplePlaying = true;
                            this._writeSampleMenu();
                        }
                    }
                }
            } else if(this._state == "PLAYLISTS") {
                if(height * -0.425 < point.y && point.y < height * 0.325) {
                    if(this._playlistsPage != Math.floor(Math.abs((this._totalPlaylists - 1) / 5)) && width * 0.42 < point.x && point.x < width * 0.48) {
                        this._playlistsPage++;
                        if(this._playlistsPage * 5 >= this._playlistsOffset + 50) {
                            this._menuLock = true;
                            this._writePlaylistsMenu();
                            this._playlistsOffset = this._playlistsOffset + 50;
                            this._getPlaylists();
                        } else {
                            this._writePlaylistsMenu();
                        }
                    } else if(this._playlistsPage != 0 && width * -0.48 < point.x && point.x < width * -0.42) {
                        this._playlistsPage--;
                        if(this._playlistsPage * 5 < this._playlistsOffset) {
                            this._menuLock = true;
                            this._writePlaylistsMenu();
                            this._playlistsOffset = this._playlistsOffset - 50;
                            this._getPlaylists();
                        } else {
                            this._writePlaylistsMenu();
                        }
                    } else if(width * -0.4 < point.x && point.x < width * 0.4) {
                        let index = Math.floor((point.y - (height * 0.325)) / -0.375);
                        index = this._playlistsPage * 5 + index - this._playlistsOffset;
                        if(index < this._playlists.length) {
                            this._selectedPlaylist = this._playlists[index];
                            //console.log(this._selectedPlaylist);
                            this._playlistTracksOffset = 0;
                            this._playlistTracksPage = 0;
                            this._menuLock = true;
                            this._state = "PLAYLIST_TRACKS";
                            this._writePlaylistTracksMenu();
                            this._getPlaylistTracks();
                        }
                    }
                } else if(height * 0.35 < point.y && point.y < height * 0.45) {
                    if(width * 0.25 < point.x && point.x < width * 0.4) {
                        this._state = "VISUALS";
                        this._priorState = "PLAYLISTS";
                        this._writeVisualsMenu();
                    }
                }
            } else if(this._state == "PLAYLIST_TRACKS") {
                if(height * -0.425 < point.y && point.y < height * 0.325) {
                    if(this._playlistTracksPage != Math.floor(Math.abs((this._totalPlaylistTracks - 1) / 5)) && width * 0.42 < point.x && point.x < width * 0.48) {
                        this._playlistTracksPage++;
                        if(this._playlistTracksPage * 5 >= this._playlistTracksOffset + 50) {
                            this._menuLock = true;
                            this._writePlaylistTracksMenu();
                            this._playlistTracksOffset = this._playlistTracksOffset + 50;
                            this._getPlaylistTracks();
                        } else {
                            this._writePlaylistTracksMenu();
                        }
                    } else if(this._playlistTracksPage != 0 && width * -0.48 < point.x && point.x < width * -0.42) {
                        this._playlistTracksPage--;
                        if(this._playlistTracksPage * 5 < this._playlistTracksOffset) {
                            this._menuLock = true;
                            this._writePlaylistTracksMenu();
                            this._playlistTracksOffset = this._playlistTracksOffset - 50;
                            this._getPlaylistTracks();
                        } else {
                            this._writePlaylistTracksMenu();
                        }
                    } else if(width * -0.4 < point.x && point.x < width * 0.4) {
                        let index = Math.floor((point.y - (height * 0.325)) / -0.375);
                        index = this._playlistTracksPage * 5 + index - this._playlistTracksOffset;
                        if(index < this._playlistTracks.length) {
                            this._selectedPlaylistTrack = this._playlistTracks[index];
                            //console.log(this._selectedPlaylistTrack);
                            global.musicVisualizerController.playTrack(this._selectedPlaylistTrack.track.uri, this._selectedPlaylist.uri);
                        }
                    }
                } else if(height * 0.35 < point.y && point.y < height * 0.45) {
                    if(width * -0.4 < point.x && point.x < width * -0.25) {
                        this._state = "PLAYLISTS";
                        this._writePlaylistsMenu();
                    } else if(width * 0.25 < point.x && point.x < width * 0.4) {
                        this._state = "VISUALS";
                        this._priorState = "PLAYLIST_TRACKS";
                        this._writeVisualsMenu();
                    }
                }
            } else if(this._state == "VISUALS") {
                if(height * -0.425 < point.y && point.y < height * 0.325) {
                    //TODO: Populate options and select them
                    if(this._visualsPage != Math.floor(Math.abs((this._totalPlaylists - 1) / 5)) && width * 0.42 < point.x && point.x < width * 0.48) {
                        this._visualsPage++;
                        this._writeVisualsMenu();
                    } else if(this._visualsPage != 0 && width * -0.48 < point.x && point.x < width * -0.42) {
                        this._visualsPage--;
                        this._writeVisualsMenu();
                    } else if(width * -0.4 < point.x && point.x < width * 0.4) {
                        let index = Math.floor((point.y - (height * 0.325)) / -0.375);
                        index = this._visualsPage * 5 + index;
                        if(index < this._visuals.length) {
                            global.musicVisualizerController.selectVisualization(index);
                            //console.log(this._visuals[index]);
                        }
                    }
                } else if(height * 0.35 < point.y && point.y < height * 0.45) {
                    if(width * -0.4 < point.x && point.x < width * -0.25) {
                        this._state = this._priorState;
                        if(this._state == "PLAYLISTS") {
                            this._writePlaylistsMenu();
                        } else if(this._state == "PLAYLIST_TRACKS") {
                            this._writePlaylistTracksMenu();
                        }
                    }
                }
            }
        }
    }

    _pressTriggerOffMenu(intersection) {
        this._triggerPressed = true;
        this._pivotPoint.visible = !this._pivotPoint.visible;
        //if(this._pivotPoint.parent == null) {
        //    this._scene.add(this._pivotPoint);
        //} else {
        //    this._scene.remove(this._pivotPoint);
        //}
    }

    _releaseTrigger() {
        this._triggerPressed = false;
    }

    _onKeyDown(event) {
        event = event || window.event;
        var keycode = event.keyCode;
        if(keycode == 90) { //z
            if(!this._triggerPressed) {
                let intersection = null;
                if(this._pivotPoint.visible) {
                    intersection = this._getIntersection();
                }
                if(intersection != null) {
                    this._pressTriggerOnMenu(intersection);
                } else {
                    this._pressTriggerOffMenu();
                }
            }
        }
    }

    _onKeyUp(event) {
        event = event || window.event;
        var keycode = event.keyCode;
        if(keycode == 90) { //z
            this._releaseTrigger();
        }
    }

    _getIntersection() {
        let position = new THREE.Vector3();
        let direction = new THREE.Vector3();
        this._pointerPoint.getWorldPosition(position);
        this._pointerPoint.getWorldDirection(direction);
        direction.negate();
        let raycaster = new THREE.Raycaster(position, direction, 0.01, 5);
        let intersections = raycaster.intersectObject(this._menuMesh);
        if(intersections.length > 0) {
            return intersections[0];
        } else {
            return null;
        }
    }

    _updateLine(intersection) {
        let localIntersection = intersection.point.clone();
        this._pointerPoint.worldToLocal(localIntersection);
        let positions = this._lineMesh.geometry.attributes.position.array;
        positions[3] = localIntersection.x;
        positions[4] = localIntersection.y;
        positions[5] = localIntersection.z;
        this._lineMesh.geometry.attributes.position.needsUpdate = true;
    }

    _changeHands(newHand) {
        if(global.isVR) {
            let oldPointerPoint = this._pointerPoint;
            if(newHand == "RIGHT") {
                this._pointerPoint = global.renderer.xr.getController(0);
                this._activeHand = "RIGHT";
            } else if(newHand == "LEFT") {
                this._pointerPoint = global.renderer.xr.getController(1);
                this._activeHand = "LEFT";
            }
            oldPointerPoint.parent.add(this._pointerPoint);
            while(oldPointerPoint.children.length > 0) {
                this._pointerPoint.add(oldPointerPoint.children[0]);
            }
            oldPointerPoint.parent.remove(oldPointerPoint);
        }
    }

    addToScene(scene) {
        this._scene = scene;
        scene.add(this._pivotPoint);
        if(global.isVR) {
            global.user.add(this._pointerPoint);
        }
    }

    removeFromScene() {
        this._pivotPoint.parent.remove(this._pivotPoint);
        fullDispose(this._pivotPoint);
    }

    update(timeDelta) {
        if(this._playerActive != global.musicVisualizerController.playerActive) {
            if(!global.musicVisualizerController.isSpotifyPremium) {
                this._menuLock = false;
                this._state = "SAMPLE";
                this._writeSampleMenu();
            } else if(global.musicVisualizerController.playerActive) {
                this._getPlaylists();
            } else {
                //TODO: Notify User Spotify is not connected
                console.error("TODO: Notify User Spotify is not conencted");
            }
            this._playerActive = global.musicVisualizerController.playerActive;
        }
        let intersection = null;
        if(this._pivotPoint.visible) {
            intersection = this._getIntersection();
        }
        if(intersection != null) {
            this._updateLine(intersection);

            if(!this._lineMesh.visible) {
                this._lineMesh.visible = true;
            }
            if(global.rightInputSource != null) {
                let buttons;
                if(this._activeHand == "RIGHT") {
                    buttons = global.rightInputSource.gamepad.buttons;
                } else {
                    buttons = global.leftInputSource.gamepad.buttons;
                }
                if(!this._triggerPressed) {
                    if(buttons[0].pressed) {
                        this._pressTriggerOnMenu(intersection);
                    }
                } else if(!buttons[0].pressed) {
                    this._releaseTrigger();
                }
            }
        } else {
            if(this._lineMesh.visible) {
                this._lineMesh.visible = false;
            }
            if(global.rightInputSource != null) {
                let buttons;
                if(this._activeHand == "RIGHT") {
                    buttons = global.rightInputSource.gamepad.buttons;
                } else {
                    buttons = global.leftInputSource.gamepad.buttons;
                }
                if(!this._triggerPressed) {
                    if(buttons[0].pressed) {
                        this._pressTriggerOffMenu(intersection);
                    }
                } else if(!buttons[0].pressed) {
                    this._releaseTrigger();
                }
            }
        }
        if(this._state == "SAMPLE" && this._samplePlaying && !global.musicVisualizerController._sound.isPlaying) {
            this._samplePlaying = false;
            this._writeSampleMenu();
        }
    }

    canUpdate() {
        return "musicVisualizerController" in global;
    }

    static getScriptType() {
        return ScriptType.ASSET;
    }

    static getFields() {
        return [
            {
                "name": "Scale",
                "type": "float",
                "default": 1
            },
            {
                "name": "Opacity",
                "type": "float",
                "default": 1
            },
            {
                "name": "Initial X Position",
                "type": "float",
                "default": 0
            },
            {
                "name": "Initial Y Position",
                "type": "float",
                "default": 2
            },
            {
                "name": "Initial Z Position",
                "type": "float",
                "default": -4
            },
            {
                "name": "Initial X Rotation",
                "type": "float",
                "default": 0
            },
            {
                "name": "Initial Y Rotation",
                "type": "float",
                "default": 0
            },
            {
                "name": "Initial Z Rotation",
                "type": "float",
                "default": 0
            },
        ];
    }

}
