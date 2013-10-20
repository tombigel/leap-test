/**
 * Leap Motion experiment
 * By Tom Bigelajzen
 *
 * Using:
 * Leap.js
 * FabricJS
 * jQuery
 * Underscore
 *
 *
 */


var controller = new Leap.Controller({enableGestures: true});
var fingers = [];
var hands = [];
var canvas = new fabric.StaticCanvas('canvas');

function setLeapEvents(controller) {
    // Print Pointables output
    // Using Underscore 'throttle' so it will update only every 200ms
    controller.on('frame', _.throttle(onFrame, 200));

    // Print Gestures output
    controller.on('gesture', onGesture);

    // Main loop for drawing on canvas
    controller.on('frame', updateCanvas);

    // Throw some messages on connect and disconnect
    controller.on('connect', function () {
        console.log("Successfully connected.");
    });
    controller.on('deviceConnected', function () {
        console.log("A Leap device has been connected.");
    });
    controller.on('deviceDisconnected', function () {
        console.log("A Leap device has been disconnected.");
    });

    // Connect to the leap
    controller.connect();
}

/**
 * Calculate the finger circles
 * @param x
 * @param y
 * @param z
 * @param [r] radius base size
 * @param [colorClose] Color of the circle when its before the middle point of the device
 * @param [colorFar] Color of the circle when its after the middle point of the device
 * @returns {{}}
 */
function getCircleParams(x, y, z, r, colorClose, colorFar) {
    var params = {};
    r = r || 5;
    var color = (z < 0) ? colorFar || 'red' : colorClose || 'green';

    var canvasCenter = canvas.getCenter();
    params.left = canvasCenter.left + (x * (canvasCenter.left / 200));
    params.top = canvasCenter.top * 2 - (y * (canvasCenter.top / 200));
    params.radius = r + Math.abs(z / 3);
    params.fill = color;
    params.visible = true;
    return params;
}

/**
 * Throw a circle onto the canvas
 * @param xyz
 * @returns {fabric.Circle}
 */
function createCircle(xyz) {
    var params = getCircleParams.apply(this, xyz);
    return new fabric.Circle(params);
}

/**
 * Print out the Gestures data
 * @param gestures
 */
function onGesture(gestures) {
    $('#gestures').html(JSON.stringify(gestures, undefined, 4));
}

/**
 * Print out the Pointables data
 * @param frame
 */
function onFrame(frame) {
    if (frame.data.pointables.length) {
        $('#pointables').html(JSON.stringify(frame.data.pointables, undefined, 4));
    }
    if (frame.data.hands.length) {
        $('#hands').html(JSON.stringify(frame.data.hands, undefined, 4));
    }

}

/**
 * Update the canvas
 * I'm never deleting fingers, just adding (to save CPU time)
 * When identifying less fingers I hide a finger.
 * @param frame
 */
function updateCanvas(frame) {
    var countFingers = frame.data.pointables.length;
    var countHands = frame.data.hands.length;

    //Draw fingers
    _.each(frame.data.pointables, function (pointable, index) {
        if (fingers[index]) {
            fingers[index].set(getCircleParams.apply(this, pointable.stabilizedTipPosition));
        } else {
            fingers.push(createCircle(pointable.stabilizedTipPosition));
            canvas.add(fingers[index]);
        }
    });

    _.each(fingers, function (finger, index) {
        if (index >= countFingers) {
            finger.set({visible: false});
        }
    });

    //Draw hands
    _.each(frame.data.hands, function (hand, index) {
        if (hands[index]) {
            var params = hand.stabilizedPalmPosition;
            // Override circle size
            params.push(40);
            //Override circle color
            params.push('blue');
            params.push('purple');

            hands[index].set(getCircleParams.apply(this, params));
        } else {
            hands.push(createCircle(hand.stabilizedPalmPosition));
            canvas.add(hands[index]);
        }
    });

    _.each(hands, function (hand, index) {
        if (index >= countHands) {
            hand.set({visible: false});
        }
    });

    canvas.renderAll();
}

$(function () {
    setLeapEvents(controller);
});