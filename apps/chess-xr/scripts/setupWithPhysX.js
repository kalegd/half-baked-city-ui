import Main from './Main.js';
import global from '/library/scripts/core/global.js';

global.deviceType = "MOBILE";
global.isChrome = navigator.userAgent.indexOf('Chrome') !== -1;
global.physicsObjects = {};

function start() {
    window.global = global;
    window.main = new Main();
}

function hasPointerLock() {
    let capableOfPointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    return capableOfPointerLock;
}

function checkIfPointer() {
    if(hasPointerLock()) {
        global.deviceType = "POINTER";
    }
}

function determineDeviceType() {
    if('xr' in navigator) {
        navigator.xr.isSessionSupported( 'immersive-vr' )
            .then(function (supported) {
                if (supported) {
                    global.deviceType = "XR";
                } else {
                    checkIfPointer();
                }
            }).catch(function() {
                checkIfPointer();
            }).finally(function() {
                start();
            });
    } else {
        checkIfPointer();
        start();
    }
}

function setupPhysicsEngine() {
    let version = PhysX.PX_PHYSICS_VERSION;
    let defaultErrorCallback = new PhysX.PxDefaultErrorCallback();
    let allocator = new PhysX.PxDefaultAllocator();
    let foundation = PhysX.PxCreateFoundation(
        version,
        allocator,
        defaultErrorCallback
    );
    let triggerCallback = {
        onContactBegin: (a1, a2) => { global.chessXR.processCollision(a1.getId(), a2.getId()); },
        onContactEnd: () => {},
        onContactPersist: () => {},
        onTriggerBegin: () => {},
        onTriggerEnd: () => {},
    }
    let physxSimulationCallbackInstance = PhysX.PxSimulationEventCallback.implement(
        triggerCallback
    );

    let toleranceScale = new PhysX.PxTolerancesScale();
    global.cooking = PhysX.PxCreateCooking(
        version,
        foundation,
        new PhysX.PxCookingParams(toleranceScale)
    );
    global.physics = PhysX.PxCreatePhysics(
        version,
        foundation,
        new PhysX.PxTolerancesScale(),
        false,
        null
    );
    PhysX.PxInitExtensions(global.physics, null)
    let sceneDesc = PhysX.getDefaultSceneDesc(
        global.physics.getTolerancesScale(),
        0,
        physxSimulationCallbackInstance
    );
    global.physicsScene = global.physics.createScene(sceneDesc)
    global.physicsScene.setGravity({x:0,y:0,z:0});
    global.physicsScale = 1;
    global.physicsDebug = false;
}

let PhysX = PHYSX({
    locateFile(path) {
        if (path.endsWith('.wasm')) {
            return '/library/scripts/physx/physx.release.wasm';
        }
        return path
    },
    onRuntimeInitialized() {
        console.log('PhysX loaded')
        setupPhysicsEngine();
        determineDeviceType();
    },
});

global.PhysX = PhysX;
