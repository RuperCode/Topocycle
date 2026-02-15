
export class Junction {
    constructor(id, lat, lng) {
        this.id = id;
        this.lat = lat;
        this.lng = lng;

        // Set of segment IDs connected to this junction
        this.connectedSegmentIds = new Set();
    }

    registerSegment(segmentId) {
        this.connectedSegmentIds.add(segmentId);
    }

    unregisterSegment(segmentId) {
        this.connectedSegmentIds.delete(segmentId);
    }

    isOrphan() {
        return this.connectedSegmentIds.size === 0;
    }
}





//>>>----------------------------------------------------------------------------------------------------------





export class Segment {
    constructor(id, junctionAId, junctionBId, intermediate = []) {
        this.id = id;
        this.a = junctionAId;
        this.b = junctionBId;
        this.intermediate = intermediate;

        // Leaflet polyline instance
        this._polyline = null;
    }

    buildLatLngs(junctionA, junctionB) {
        return [
            [junctionA.lat, junctionA.lng],
            ...this.intermediate,
            [junctionB.lat, junctionB.lng]
        ];
    }
}





//>>>----------------------------------------------------------------------------------------------------------






export class NetworkLayer {

    constructor(id = null, name) {
        this.id = id;
        this.name = name;

        this.junctions = {};   // id → Junction
        this.segments = {};    // id → Segment

        this.leaflet = L.layerGroup();

        //temporary functionality until server implemented
        this._junctionIdCounter = 1;
        this._segmentIdCounter = 1;
    }

    // -------------------------------------------------------------
    // Junctions
    // -------------------------------------------------------------

    addJunction(lat, lng) {
        const id = this._junctionIdCounter++;
        const j = new Junction(id, lat, lng);
        this.junctions[id] = j;
        return id;
    }

    moveJunction(id, newLat, newLng) {
        const j = this.junctions[id];
        if (!j) return false;

        j.lat = newLat;
        j.lng = newLng;

        // Rebuild only connected segments
        for (const segId of j.connectedSegmentIds) {
            this._buildSegmentPolyline(segId);
        }

        return true;
    }

    // -------------------------------------------------------------
    // Segments
    // -------------------------------------------------------------

    addSegment(junctionAId, junctionBId, intermediate = []) {
        const id = this._segmentIdCounter++;
        const seg = new Segment(id, junctionAId, junctionBId, intermediate);
        this.segments[id] = seg;

        // Register adjacency
        this.junctions[junctionAId].registerSegment(id);
        this.junctions[junctionBId].registerSegment(id);

        this._buildSegmentPolyline(id);
        return id;
    }

    updateSegmentGeometry(id, intermediate) {
        const seg = this.segments[id];
        if (!seg) return false;

        seg.intermediate = intermediate;
        this._buildSegmentPolyline(id);
        return true;
    }

    removeSegment(id) {
        const seg = this.segments[id];
        if (!seg) return false;

        // Remove polyline
        if (seg._polyline) {
            this.leaflet.removeLayer(seg._polyline);
        }

        // Unregister adjacency
        const jA = this.junctions[seg.a];
        const jB = this.junctions[seg.b];

        jA.unregisterSegment(id);
        jB.unregisterSegment(id);

        delete this.segments[id];

        // Remove orphaned junctions
        if (jA.isOrphan()) delete this.junctions[jA.id];
        if (jB.isOrphan()) delete this.junctions[jB.id];

        return true;
    }

    // -------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------

    _buildSegmentPolyline(id) {
        const seg = this.segments[id];
        if (!seg) return;

        if (seg._polyline) {
            this.leaflet.removeLayer(seg._polyline);
        }

        const jA = this.junctions[seg.a];
        const jB = this.junctions[seg.b];
        if (!jA || !jB) return;

        const latlngs = seg.buildLatLngs(jA, jB);

        seg._polyline = L.polyline(latlngs, {
            color: '#3388ff',
            weight: 4
        });

        seg._polyline.addTo(this.leaflet);
    }

    rebuildAllPolylines() {
        for (const id in this.segments) {
            this._buildSegmentPolyline(id);
        }
    }

    getLeaflet() {
        return this.leaflet;
    }
}





//>>>----------------------------------------------------------------------------------------------------------


export class NetworkLayerStack {

    layerOrder = [];
    layers = {};
    leaflet;

    constructor() {
      this.leaflet = L.layerGroup();
      this.activeLayer = null
    }

    addLayer(layerObject) {
        // Assign an ID if the layer doesn't already have one
        let id = layerObject.id;

        this.layers[id] = layerObject;
        this.layerOrder.push(id);
        this.leaflet.addLayer(layerObject.getLeaflet());

        return id;
    }

    removeLayer(id) {
        const layer = this.layers[id];
        if (!layer) {
            return null;
        }

        this.leaflet.removeLayer(layer.getLeaflet());
        delete this.layers[id];

        this.layerOrder = this.layerOrder.filter(function(x) {
            return x !== id;
        });

        return layer;
    }

    setActiveLayer(id) {
        if (this.layers[id]) {
            this.activeLayer = id;
            return true;
        } else {
            return false;
        }
    }

    getActiveLayer() {
        if (this.activeLayer && this.layers[this.activeLayer]) {
            return this.layers[this.activeLayer];
        } else {
            return null; 
        }
    }

    moveLayerUp(id) {
        const index = this.layerOrder.indexOf(id);
        if (index === -1) {
            return false;
        }
        if (index === this.layerOrder.length - 1) {
            return false;
        }

        const temp = this.layerOrder[index + 1];
        this.layerOrder[index + 1] = id;
        this.layerOrder[index] = temp;

        this.#rebuildLeafletOrder();
        return true;
    }

    moveLayerDown(id) {
        const index = this.layerOrder.indexOf(id);
        if (index === -1) {
            return false;
        }
        if (index === 0) {
            return false;
        }

        const temp = this.layerOrder[index - 1];
        this.layerOrder[index - 1] = id;
        this.layerOrder[index] = temp;

        this.#rebuildLeafletOrder();
        return true;
    }

    #rebuildLeafletOrder() {
        this.leaflet.clearLayers();

        for (let i = 0; i < this.layerOrder.length; i++) {
            const id = this.layerOrder[i];
            const layer = this.layers[id];
            if (layer) {
                this.leaflet.addLayer(layer.getLeaflet());
            }
        }
    }

    getLayer(id) {
        return this.layers[id] || null;
    }

    getLeaflet() {
        return this.leaflet;
    }
}







//>>>>----------------------------------------------------------------------------------------------------------







export class MapUILayer {

    constructor() {
        // The root Leaflet layer group that MapManagerUIC will add to the map
        this.leaflet = L.layerGroup();

        // Internal references to UI elements
        this._crosshair = null;
        this._rubberband = null;
        this._hoverMarker = null;
        this._highlight = null;
    }

    // -------------------------------------------------------------
    // Accessor
    // -------------------------------------------------------------
    getLeaflet() {
        return this.leaflet;
    }

    // -------------------------------------------------------------
    // Crosshair
    // -------------------------------------------------------------
    setCrosshair(lat, lng, options = {}) {
        if (this._crosshair) {
            this.leaflet.removeLayer(this._crosshair);
        }

        this._crosshair = L.circleMarker([lat, lng], {
            radius: 6,
            color: options.color || 'red',
            weight: 2,
            fillOpacity: 0,
            ...options
        });

        this._crosshair.addTo(this.leaflet);
    }

    clearCrosshair() {
        if (this._crosshair) {
            this.leaflet.removeLayer(this._crosshair);
            this._crosshair = null;
        }
    }

    // -------------------------------------------------------------
    // Rubberband line (dragging, measuring, drawing)
    // -------------------------------------------------------------
    startRubberband(startLatLng, options = {}) {
        if (this._rubberband) {
            this.leaflet.removeLayer(this._rubberband);
        }

        this._rubberband = L.polyline([startLatLng, startLatLng], {
            color: options.color || 'orange',
            weight: options.weight || 2,
            dashArray: options.dashArray || '4,4',
            ...options
        });

        this._rubberband.addTo(this.leaflet);
    }

    updateRubberband(endLatLng) {
        if (!this._rubberband) return;
        const latlngs = this._rubberband.getLatLngs();
        latlngs[1] = endLatLng;
        this._rubberband.setLatLngs(latlngs);
    }

    clearRubberband() {
        if (this._rubberband) {
            this.leaflet.removeLayer(this._rubberband);
            this._rubberband = null;
        }
    }

    // -------------------------------------------------------------
    // Hover marker (e.g. when cursor is near a junction)
    // -------------------------------------------------------------
    setHoverMarker(lat, lng, options = {}) {
        if (this._hoverMarker) {
            this.leaflet.removeLayer(this._hoverMarker);
        }

        this._hoverMarker = L.circleMarker([lat, lng], {
            radius: options.radius || 5,
            color: options.color || '#00aaff',
            weight: 2,
            fillColor: options.fillColor || '#00aaff',
            fillOpacity: 0.3,
            ...options
        });

        this._hoverMarker.addTo(this.leaflet);
    }

    clearHoverMarker() {
        if (this._hoverMarker) {
            this.leaflet.removeLayer(this._hoverMarker);
            this._hoverMarker = null;
        }
    }

    // -------------------------------------------------------------
    // Highlight (e.g. selected segment or junction)
    // -------------------------------------------------------------
    setHighlight(latlngs, options = {}) {
        if (this._highlight) {
            this.leaflet.removeLayer(this._highlight);
        }

        this._highlight = L.polyline(latlngs, {
            color: options.color || 'yellow',
            weight: options.weight || 6,
            opacity: 0.8,
            ...options
        });

        this._highlight.addTo(this.leaflet);
    }

    clearHighlight() {
        if (this._highlight) {
            this.leaflet.removeLayer(this._highlight);
            this._highlight = null;
        }
    }

    // -------------------------------------------------------------
    // Clear everything
    // -------------------------------------------------------------
    clearAll() {
        this.leaflet.clearLayers();
        this._crosshair = null;
        this._rubberband = null;
        this._hoverMarker = null;
        this._highlight = null;
    }
}