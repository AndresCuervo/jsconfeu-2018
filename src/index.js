require('aframe')
//
// require('aframe-animation-component')
// // require('aframe-extras.ocean')
// require('aframe-gradient-sky')
// require('aframe-particle-system-component')
//
// require('aframe-gradient-sky')
require('aframe-physics-system')
require('aframe-event-set-component')
require('aframe-physics-extras')
require('aframe-environment-component')
// require('aframe-template-component')

// var THREE = require( 'three' );
// MeshLine = require( 'three.meshline' );
// require('aframe-meshline-component')
require('./aframe-meshline-component-local/aframe-meshline-component.min.js')
// require('aframe-curve-component')
require('./updated-curve-component')
require('./displacement-offset-shader.js')

// TODO: When next version of super-hands gets published this can be updated
// (as of today, April 6, 2018, the npm version is 5 months out of date, so I'm using a script to the git version)
require('./super-hands-local/super-hands.min.js');
require('./custom-clone-component');

const TWO_PI = Math.PI * 2

AFRAME.registerComponent('add-stations', {
    schema: {
        positionMultiplier: { default : 3.0 },
        numStations: { default : 6 },
        stationSize: { default : 1.5 }
    },
    init: function () {
        let scene = this.el.sceneEl
        let stationHolder = document.createElement('a-entity')
        stationHolder.setAttribute('position', '0 -2 -2.5')
        this.data.stationHolder = stationHolder

        for (let i = 1; i <= this.data.numStations; ++i) {
            let plane = document.createElement('a-plane')
            let {x,y} = plane.getAttribute('position')
            let angle = TWO_PI * (i / this.data.numStations)
            x += Math.sin(angle) * this.data.positionMultiplier
            y +=  Math.cos(angle) * this.data.positionMultiplier

            plane.setAttribute('position', `${x} ${y} -1`)
            plane.setAttribute('width', this.data.stationSize)
            plane.setAttribute('height', this.data.stationSize)
            plane.setAttribute('class', 'station')

            // plane.setAttribute('rotation', `0 0 ${i * (360 - 360 / 6)}`)
            plane.setAttribute('material', `src: ./assets/stations/${i}.jpg`)
            stationHolder.appendChild(plane)
        }
        scene.appendChild(stationHolder)
        this.data.stations = [...document.querySelectorAll('.station')]
    },
    tick: function (t, dt) {
        // 30, 30, 40, 40, 30, 30
        // 35, 70, 115, 155, 185, 215
        // console.log(`seconds: ${t/1000}`)
        for (let i = 0; i < this.data.numStations; ++i) {
            let station = this.data.stations[i]
            let {x,y,z} = AFRAME.utils.coordinates.parse(station.getAttribute('position'))
            // let angle = TWO_PI * (i / this.data.numStations) + (performance.now() * -0.0001)
            // let angle = TWO_PI * (i / this.data.numStations) + (performance.now() * -0.0001)
            // const angleMultiplier = (t/1000 * -0.1)
            let newT = t/1000;

            // Write actual easing function, sketch out the whole thing
            if (newT < 30) {
                newT = 1
            } else if (newT < 35) {
            } else if (newT > 40 && newT < 70) {
                newT = 2
            }

            // easeInOutQuad = function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t }

            const angleMultiplier = (Math.floor(newT % 6) / 6) * TWO_PI
            // const angleMultiplier = ((newT % 6) / 6) * TWO_PI
            const angle = TWO_PI * (i / this.data.numStations) + angleMultiplier
            x = Math.sin(angle) * this.data.positionMultiplier
            y = Math.cos(angle) * this.data.positionMultiplier
            // console.log(`${i}: ${x}, ${y}`)
            station.setAttribute('position', `${x} ${y} ${z}`)
        }
        // this.data.stationHolder.setAttribute('rotation', `0 0 ${performance.now() * 0.1}`)
    }
})
//color randomizer
AFRAME.registerComponent('color-randomizer', {
    play: function () {
        this.el.addEventListener('drag-drop', function (evt) {
            evt.detail.dropped.setAttribute('material', 'color',
                '#'+(Math.random()*0xFFFFFF<<0).toString(16));
            // color randomizer credit: http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript#comment6801353_5365036
        });
    }
});

// turn controller's physics presence on only while button held down
AFRAME.registerComponent('phase-shift', {
    init: function () {
        var el = this.el;
        el.addEventListener('gripdown', function () {
            el.setAttribute('collision-filter', {collisionForces: true});
        });
        el.addEventListener('gripup', function () {
            el.setAttribute('collision-filter', {collisionForces: false});
        });
    }
});

AFRAME.registerComponent('head-path', {
    schema : {
        path : { value : '-2 1 0, 0 2 0, 2 1 0' }
    },
    init: function() {
        let newEntity = document.createElement('a-entity')
        newEntity.id = "beep"
        newEntity.setAttribute('meshline', `lineWidth: 1 - Math.abs(${performance.now() * 2 % 5} * p - 1); path: ${this.data.path}; color: #E20049`)
        this.el.appendChild(newEntity)
        this.throttledFunction = AFRAME.utils.throttle(this.addPoints, 10, this);
    },
    addPoints: function() {
        // console.log("beep")
        let pos = document.querySelector('a-camera').getAttribute('position')

        this.data.path += pos.toArray().join(" ") + ', '
        let pathArray = this.data.path.split(',')
        let newString = ''
        for (let i in pathArray) {
            // Change z value of pathArray????
            let {x,y,z} = AFRAME.utils.coordinates.parse(pathArray[i])
            if (!Number.isNaN(x)) {
                newString += `${x} ${y} ${z + 0.1},`
            }
        }
        this.data.path = newString
        pathArray = this.data.path.split(',')
        // let lineWidth = `1 - Math.abs(${performance.now() * 2 % 5} * p - 1)`
        let lineWidth = 10
        document.querySelector('#beep').setAttribute('meshline', `lineWidth: ${lineWidth}; path: ${newString}; color: #E20049`)
    },
    tick: function (t, dt) {
        this.throttledFunction();
    }
});

// AFRAME.registerComponent('head-path', {
//     schema : {
//         curve: { default: '#headCurve', type: 'selector' },
//         camera: { default: '[camera]', type: 'selector' },
//         sample_inc: { default : 0.01 },
//         scale: { default : 1 }
//     },
//     init: function() {
//         // every second to every half second
//         this.throttledFunction = AFRAME.utils.throttle(this.everySecond, 1000, this);
//         // this.throttledFunction = AFRAME.utils.throttle(this.everySecond, 5, this);
//     },
//     everySecond: function (t) {
//         let point = document.createElement('a-curve-point')
//         let pos = document.querySelector('a-camera').getAttribute('position')
//         point.setAttribute('position', pos)
//
//         point.setAttribute('geometry', 'primitive:box; height:0.06; width:0.06; depth:0.06')
//         point.setAttribute('material', 'shader: displacement-offset;')
//
//         // for (let v in document.querySelector('a-draw-curve').object3DMap.mesh.geometry.vertices) {
//         //     // console.log(v)
//         // }
//
//         // point.setAttribute('bioluminescence', `initialTime: ${t}`)
//         this.data.curve.appendChild(point)
//         this.data.beta += this.data.sample_inc
//     },
//     tick: function (t, dt) {
//         this.throttledFunction(t);
//     }
// });

AFRAME.registerComponent('bioluminescence', {
    schema: {
        initialTime: { default : 0 }
    },
    init: function () {
        // this.data.initialTime = performance.now()
        // console.log('started at: ', this.data.initialTime)
        // this.el.setAttribute('geometry', "primitive:box; height:0.06; width:0.06; depth:0.06")
        // this.el.setAttribute('material', 'color: #2EAFAC;')
    },
    tick: function () {
        // console.log('tick => started at: ', this.data.initialTime)
        // let s = (this.data.initialTime + performance.now() % 1) + 0.1
        // this.el.setAttribute('scale', `${s} ${s} ${s}`)
    }
});
