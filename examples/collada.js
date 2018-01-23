/* global itowns, document, renderer, GuiTools, Promise */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Annecy lake.
// var positionOnGlobe = { longitude: 6.2230, latitude: 45.8532, altitude: 5000 };

// Position near Gerbier mountain.
var positionOnGlobe = { longitude: 4.22, latitude: 44.844, altitude: 2500 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe, { renderer: renderer });

var promises = [];

var menuGlobe = new GuiTools('menuDiv');

menuGlobe.view = globeView;

function addLayerCb(layer) {
    return globeView.addLayer(layer);
}
// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb));
// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promises.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
promises.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));

exports.view = globeView;
exports.initialPosition = positionOnGlobe;

function addMeshToScene() {
    // creation of the new mesh (a cylinder)
    var THREE = itowns.THREE;
    var elf;
    var addElf = function _addElf() {
        globeView.scene.add(elf);
        globeView.notifyChange(true);
    };
    // loading manager
    var loadingManager = new itowns.THREE.LoadingManager(addElf);
    // collada
    var loader = new itowns.THREE.ColladaLoader(loadingManager);

    // get the position on the globe, from the camera
    var cameraTargetPosition = globeView.controls.getCameraTargetGeoPosition();

    // position of the mesh
    var meshCoord = cameraTargetPosition;
    meshCoord.setAltitude(cameraTargetPosition.altitude());

    loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/collada/elf/elf.dae', function (collada) {
        elf = collada.scene;
        elf.position.copy(meshCoord.as(globeView.referenceCrs).xyz());
        elf.lookAt(new THREE.Vector3(0, 0, 0));
        elf.rotateX(-Math.PI);
        elf.scale.set(20, 20, 20);

        // update coordinate of the mesh
        elf.updateMatrixWorld();
    });
}

// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function () {
    // eslint-disable-next-line no-console
    console.info('Globe initialized');
    Promise.all(promises).then(function () {
        menuGlobe.addImageryLayersGUI(globeView.getLayers(function (l) { return l.type === 'color'; }));
        menuGlobe.addElevationLayersGUI(globeView.getLayers(function (l) { return l.type === 'elevation'; }));

        addMeshToScene();

        globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
    });
});
