
class Junction {
    constructor(id, lat, lng) {
        this.id = id
        this.lat = lat
        this.lng = lng

        // Set of segment IDs connected to this junction
        this.connectedSegmentIds = new Set()
    }

    registerSegment(segmentId) {
        this.connectedSegmentIds.add(segmentId)
    }

    unregisterSegment(segmentId) {
        this.connectedSegmentIds.delete(segmentId)
    }

    isOrphan() {
        return this.connectedSegmentIds.size === 0
    }
}




class Segment {
    constructor(id, junctionAId, junctionBId, intermediate = []) {
        this.id = id
        this.a = junctionAId
        this.b = junctionBId
        this.intermediate = intermediate

        // Leaflet polyline instance
        this._polyline = null
    }

    buildLatLngs(junctionA, junctionB) {
        return [
            [junctionA.lat, junctionA.lng],
            ...this.intermediate,
            [junctionB.lat, junctionB.lng]
        ]
    }
}


export class NetworkLayer {

    constructor(id = null, name) {
        this.id = id
        this.name = name

        this.junctions = {}   // id → Junction
        this.segments = {}    // id → Segment

        this.layerGroup = L.layerGroup()

        //temporary functionality until server implemented
        this._junctionIdCounter = 1
        this._segmentIdCounter = 1
    }

    // -------------------------------------------------------------
    // Junctions
    // -------------------------------------------------------------

    addJunction(lat, lng) {
        const id = this._junctionIdCounter++
        const j = new Junction(id, lat, lng)
        this.junctions[id] = j
        return id
    }

    moveJunction(id, newLat, newLng) {
        const j = this.junctions[id]
        if (!j) return false

        j.lat = newLat
        j.lng = newLng

        // Rebuild only connected segments
        for (const segId of j.connectedSegmentIds) {
            this._buildSegmentPolyline(segId)
        }

        return true
    }

    // -------------------------------------------------------------
    // Segments
    // -------------------------------------------------------------

    addSegment(junctionAId, junctionBId, intermediate = []) {
        const id = this._segmentIdCounter++
        const seg = new Segment(id, junctionAId, junctionBId, intermediate)
        this.segments[id] = seg

        // Register adjacency
        this.junctions[junctionAId].registerSegment(id)
        this.junctions[junctionBId].registerSegment(id)

        this._buildSegmentPolyline(id)
        return id
    }

    updateSegmentGeometry(id, intermediate) {
        const seg = this.segments[id]
        if (!seg) return false

        seg.intermediate = intermediate
        this._buildSegmentPolyline(id)
        return true
    }

    removeSegment(id) {
        const seg = this.segments[id]
        if (!seg) return false

        // Remove polyline
        if (seg._polyline) {
            this.layerGroup.removeLayer(seg._polyline)
        }

        // Unregister adjacency
        const jA = this.junctions[seg.a]
        const jB = this.junctions[seg.b]

        jA.unregisterSegment(id)
        jB.unregisterSegment(id)

        delete this.segments[id]

        // Remove orphaned junctions
        if (jA.isOrphan()) delete this.junctions[jA.id]
        if (jB.isOrphan()) delete this.junctions[jB.id]

        return true
    }

    // -------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------

    _buildSegmentPolyline(id) {
        const seg = this.segments[id]
        if (!seg) return

        if (seg._polyline) {
            this.layerGroup.removeLayer(seg._polyline)
        }

        const jA = this.junctions[seg.a]
        const jB = this.junctions[seg.b]
        if (!jA || !jB) return

        const latlngs = seg.buildLatLngs(jA, jB)

        seg._polyline = L.polyline(latlngs, {
            color: '#3388ff',
            weight: 4
        })

        seg._polyline.addTo(this.layerGroup)
    }

    rebuildAllPolylines() {
        for (const id in this.segments) {
            this._buildSegmentPolyline(id)
        }
    }

    getLeafletLayerGroup() {
        return this.layerGroup
    }
}