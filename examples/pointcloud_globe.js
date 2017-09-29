/* global itowns, debug, dat, renderer */

// eslint-disable-next-line no-unused-vars
function showPointcloud(serverUrl, fileName, lopocsTable) {
    var pointcloud;
    var oldPostUpdate;
    var viewerDiv;
    var debugGui;
    var view;
    var positionOnGlobe;

    viewerDiv = document.getElementById('viewerDiv');
    viewerDiv.style.display = 'block';

    itowns.THREE.Object3D.DefaultUp.set(0, 0, 1);

    itowns.proj4.defs('EPSG:3946',
        '+proj=lcc +lat_1=45.25 +lat_2=46.75 +lat_0=46 +lon_0=3 +x_0=1700000 ' +
        '+y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');

    debugGui = new dat.GUI();

    positionOnGlobe = { longitude: 4.631512, latitude: 43.675626, altitude: 250 };

    // TODO: do we really need to disable logarithmicDepthBuffer ?
    view = new itowns.GlobeView(viewerDiv, positionOnGlobe, {
        renderer: renderer,
        handleCollision: false });
    // view.mainLoop.gfxEngine.renderer.setClearColor(0xcccccc);

    view.controls.minDistance = 0;
    function addLayerCb(layer) {
        return view.addLayer(layer);
    }

    // Configure Point Cloud layer
    pointcloud = new itowns.GeometryLayer('pointcloud', view.scene);
    pointcloud.file = fileName || 'infos/sources';
    pointcloud.protocol = 'potreeconverter';
    pointcloud.url = serverUrl;
    pointcloud.table = lopocsTable;

    // point selection on double-click
    function dblClickHandler(event) {
        var pick;
        var mouse = {
            x: event.offsetX,
            y: (event.currentTarget.height || event.currentTarget.offsetHeight) - event.offsetY,
        };

        pick = itowns.PointCloudProcessing.selectAt(view, pointcloud, mouse);

        if (pick) {
            console.log('Selected point #' + pick.index + ' in Points "' + pick.points.owner.name + '"');
        }
    }
    view.mainLoop.gfxEngine.renderer.domElement.addEventListener('dblclick', dblClickHandler);

    // add pointcloud to scene
    function onLayerReady() {
        debug.PointCloudDebug.initTools(view, pointcloud, debugGui);

        // view.controls.moveSpeed = pointcloud.root.bbox.getSize().length() / 3;

        // update stats window
        oldPostUpdate = pointcloud.postUpdate;
        pointcloud.postUpdate = function postUpdate() {
            var info = document.getElementById('info');
            oldPostUpdate.apply(pointcloud, arguments);
            info.textContent = 'Nb points: ' +
                pointcloud.counters.displayedCount.toLocaleString() + ' (' +
                Math.floor(100 * pointcloud.counters.displayedCount / pointcloud.counters.pointCount) + '%) (' +
                view.mainLoop.gfxEngine.renderer.info.memory.geometries + ')';
        };
    }

    itowns.View.prototype.addLayer.call(view, pointcloud).then(onLayerReady);

    itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb);
    itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb);
}
