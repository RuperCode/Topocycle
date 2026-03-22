export class MapManagerMode {

    constructor(modeSelector) {
        this.modeSelector = modeSelector;

        // Bind all handlers once
        this._onClick = this._onClick.bind(this);
        this._onMove  = this._onMove.bind(this);
        this._onDown  = this._onDown.bind(this);
        this._onUp    = this._onUp.bind(this);
        this._onKey   = this._onKey.bind(this);
        this._onWheel = this._onWheel.bind(this);
    }

    activate(mapManager) {
        this.mapManager = mapManager;
        this.map = mapManager.map;
        this.UILayer = mapManager.mapUILayer;
        this.stack = mapManager.networkLayerStack;

        this.activeLayer = this.stack.getActiveLayer();

        // Register all handlers (unused ones are harmless)
        this.map.on('click', this._onClick);
        this.map.on('mousemove', this._onMove);
        this.map.on('mousedown', this._onDown);
        this.map.on('mouseup', this._onUp);
        this.map.on('keydown', this._onKey);
        this.map.on('wheel', this._onWheel);
    }

    deactivate() {
        // Remove all handlers
        this.map.off('click', this._onClick);
        this.map.off('mousemove', this._onMove);
        this.map.off('mousedown', this._onDown);
        this.map.off('mouseup', this._onUp);
        this.map.off('keydown', this._onKey);
        this.map.off('wheel', this._onWheel);

        //reset cursor appearance
        if (this.map && this.map._container) {
            this.map._container.style.cursor = '';
        }


        // Clear temporary UI
        if (this.UILayer) {
            this.UILayer.clearAll();
        }

        // Reset references
        this.mapManager = null;
        this.map = null;
        this.UILayer = null;
        this.stack = null;
        this.activeLayer = null;

        // Signal end of workflow
        this.modeSelector.onModeEnded(this);
    }

    cancel() {
        this.mapManager.exitMode();
    }

    // Default no-op handlers
    _onClick(e) {}
    _onMove(e) {}
    _onDown(e) {}
    _onUp(e) {}
    _onKey(e) {}
    _onWheel(e) {}
}





//>>>>>-------------------------------------------------------------------------------------------------------






export class AddSegmentMode extends MapManagerMode {

    activate(mapManager) {
            console.log("Called mode active");

        super.activate(mapManager);

       if (!this.activeLayer) {
            // No active layer: bail out cleanly
            this.modeSelector.dialogueBox.setState(
                "notifying",
                { message: "No active layer selected. Select a layer before adding segments." }
            );
            this.mapManager.exitMode();
            return;
        }

        // Reset workflow state
        this.junctionA = null;
        this.junctionB = null;

        // Crosshair cursor for add-segment mode
        this.map._container.style.cursor = 'crosshair';

        this.modeSelector.setState('segment-adding-a');
    }

    deactivate() {
        super.deactivate();

        // Reset workflow-specific state
        this.junctionA = null;
        this.junctionB = null;
    }

    _onClick(e) {
        const { lat, lng } = e.latlng;

        // First junction
        if (!this.junctionA) {
            this.junctionA = { lat, lng };

            this.UILayer.setCrosshairA(lat, lng);
            this.UILayer.startRubberband([lat, lng]);

            this.modeSelector.setState('segment-adding-b');
            return;
        }

        // Second junction
        if (!this.junctionB) {
            this.junctionB = { lat, lng };

            this.UILayer.updateRubberband({ lat, lng });
            this.UILayer.setCrosshairB(lat, lng);
            this.modeSelector.setState('segment-adding-c');
            return;
        }
    }

    _onMove(e) {
        if (!this.junctionA || this.junctionB) return;
        this.UILayer.updateRubberband(e.latlng);
    }

    confirmNewSegment() {
        if (!this.junctionA || !this.junctionB) return;

        // Commit to the active layer
        const j1 = this.activeLayer.addJunction(this.junctionA.lat, this.junctionA.lng);
        const j2 = this.activeLayer.addJunction(this.junctionB.lat, this.junctionB.lng);
        this.activeLayer.addSegment(j1, j2);

        // End the mode (MapManagerUIC will call deactivate)
    }

    confirm() {
        this.confirmNewSegment();
        this.mapManager.exitMode();
    }

    undo() {
        // Undo second junction
        if (this.junctionB) {
            this.junctionB = null;

            this.UILayer.clearAll();
            this.UILayer.setCrosshairA(this.junctionA.lat, this.junctionA.lng);
            this.UILayer.startRubberband([this.junctionA.lat, this.junctionA.lng]);

            this.modeSelector.setState('segment-adding-b');
            return;
        }

        // Undo first junction
        if (this.junctionA) {
            this.junctionA = null;

            this.UILayer.clearAll();
            this.modeSelector.setState('segment-adding-a');
            return;
        }
    }
    
    cancel() {
        this.mapManager.exitMode();
    }

}