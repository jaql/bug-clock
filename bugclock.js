; /* Critter clock */ ;

/* Licensed under AGPL */

/* Namespace */
var namespace = window.namespace || {};
namespace.model = namespace.model || {};

/* Model */
namespace.model.Bug = function(vigor, derpitude, position, colour) {
    this.vigor = vigor;
    this.derpitude = derpitude;
    this.acceleration = {x: 0, y: 0};
    this.velocity = {x: 0, y: 0};
    this.homePosition = position;
    this.position = position;
    this.colour = colour;        
}

namespace.model.ClockBitmap = function(width, height) {
    var bitmap = new Array(width * height);
    var points = [];
    var centreX = width / 2;
    var centreY = height / 2;
    var hourLength = ((width > height) ? width : height) / 4;
    var minuteSecondLength = ((width > height)  ? width : height) / 2;

    function clear() {
      points = [];
      for (var i = 0; i < bitmap.length; i++) {
        bitmap[i] = false;
      }
    }
    
    function _bresenhamLine(x0, y0, x1, y1) {
      var dx = Math.abs(x1 - x0);
      var dy = Math.abs(y1 - y0);
      var sx = (x0 < x1) ? 1 : -1;
      var sy = (y0 < y1) ? 1 : -1;
      var err = dx - dy;
      
      while (x0 != x1 || y0 != y1) {
        if (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) {
            bitmap[y0 * width + x0] = true;   
        }
        points.push({x: x0, y: y0});
        var e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
      }
    }
    
    function bresenhamLine(x0, y0, x1, y1) {
      // Normalise parameters
      x0 = Math.floor(x0);
      x1 = Math.floor(x1);
      y0 = Math.floor(y0);
      y1 = Math.floor(y1);
      _bresenhamLine(x0, x0, x1, y1);
    }
    
    this.setDate = function(date) {        
        var hour = date.getHours() % 12;
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        
        var hourRadians = (hour / 12) * 2 * Math.PI - Math.PI / 2;
        var minuteRadians = (minutes / 60) * 2 * Math.PI - Math.PI / 2;
        var secondRadians = (seconds / 60) * 2 * Math.PI - Math.PI / 2;

        var hourX = centreX + Math.cos(hourRadians) * hourLength;
        var hourY = centreY + Math.sin(hourRadians) * hourLength;

        var minuteX = centreX + Math.cos(minuteRadians) * minuteSecondLength;
        var minuteY = centreY + Math.sin(minuteRadians) * minuteSecondLength;
        
        var secondX = centreX + Math.cos(secondRadians) * minuteSecondLength;
        var secondY = centreY + Math.sin(secondRadians) * minuteSecondLength;
        
        // Draw
        clear();
        bresenhamLine(centreX, centreY, hourX, hourY);
        bresenhamLine(centreX, centreY, minuteX, minuteY);
        bresenhamLine(centreX, centreY, secondX, secondY);
    }
    
    this.getBit = function(x, y) {
        return bitmap[y * width + x];
    }
    
    this.getPoints = function() {
        return points;
    }
    
    this.setDate(new Date());
    
};

/* View */
namespace.View = function(width, height, bugs) {
    this.width = width;
    this.height = height;
    this.bugs = bugs;
}

/* Controller */
namespace.Controller = function(width, height, startTime) {
    var friction = 0.85;
    var previousTime = startTime;
    var clockBitmap = new namespace.model.ClockBitmap(width, height);
    var bugs = [];
        
    this.tick = function(newTime) {
        // Update time
        var elapsedSeconds = (newTime.getTime() - previousTime.getTime()) / 1000.0;
        previousTime = newTime;
                
        // Set clock
        clockBitmap.setDate(newTime);
                
        // Update bugs
          var points = clockBitmap.getPoints();
        
          // 1. Find bug targets, update their colour
          var bugTargets = [];
                    
          for (var i = 0; i < bugs.length; i++) {
            var bug = bugs[i];
            var pointForBug = points[Math.floor(Math.random() * points.length)];
          
            for (var j = 0; j < points.length; j++) {
                var point = points[j];
                var diffX = point.x - bug.position.x;
                var diffY = point.y - bug.position.y;
                point.distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
            }

            for (var j = 0; j < points.length; j++) {
                var point = points[j];
                if (point.distance < pointForBug.distance) {
                    pointForBug = point;
                }
            }
            
            bug.colour.a = 1; //Math.min(0.5, (1 / Math.ceil(pointForBug.distance)));
            
            bugTargets.push(pointForBug);
          }
          
          // 2. Update bugs        
          for (var i = 0; i < bugs.length; i++) {
            // Newton!
            var bug = bugs[i];
            var point = bugTargets[i];
            
            var deltaX = point.x - bug.position.x;
            var deltaY = point.y - bug.position.y;
            bug.acceleration.x += deltaX;
            bug.acceleration.y += deltaY;
            bug.acceleration.x = Math.max(-bug.vigor, Math.min(bug.vigor, bug.acceleration.x)) + (Math.random() * bug.derpitude - bug.derpitude / 2);
            bug.acceleration.y = Math.max(-bug.vigor, Math.min(bug.vigor, bug.acceleration.y)) + (Math.random() * bug.derpitude - bug.derpitude / 2);
                        
            bug.velocity.x += bug.acceleration.x * elapsedSeconds;
            bug.velocity.y += bug.acceleration.y * elapsedSeconds;
            bug.velocity.x *= friction;
            bug.velocity.y *= friction;
            
            bug.position.x += bug.velocity.x * elapsedSeconds;
            bug.position.y += bug.velocity.y * elapsedSeconds;
          }
        
        // Return bugs
        return new namespace.View(width, height, bugs);
    }
    
    // Create bugs
    for (var i = 0; i < 64; i++) {
        var position = {x: Math.random() * width, y: Math.random() * height};
        var r = Math.round(Math.random() * 255);
        var g = Math.round(Math.random() * 255);
        var b = Math.round(Math.random() * 255);
        var colour = {r: r, g: g, b: b, a: 0};
        var vigor = Math.random() * 6 + 4;
        var derpitude = Math.random() * 4 + 1;
        var bug = new namespace.model.Bug(vigor, derpitude, position, colour);
        bugs.push(bug);
    }
}

/* Renderer */
namespace.Renderer = function(canvas) {
    var context = canvas.getContext('2d');
    
    this.render = function(view) {
        // X scale
        var xScale = canvas.width / view.width;
        var yScale = canvas.height / view.height;
        var biggestScale = Math.max(xScale, yScale);
        
        // Clear
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw bugs
        var bugs = view.bugs;
        for (var i = 0; i < bugs.length; i++) {
            var bug = bugs[i];
            context.fillStyle = 'rgba(' + bug.colour.r + ', ' + bug.colour.g + ', ' + bug.colour.b + ',' + bug.colour.a + ')';
            context.beginPath();
            context.arc(bug.position.x * xScale, bug.position.y * yScale, biggestScale, 0, Math.PI*2, true); 
            context.closePath();
            context.fill();
        }
    }
}

/* Main loop */
window.addEventListener('load', function() {
    var width = 64;
    var height = 64;
    var canvas = document.getElementById('bug-clock');
    
    var controller = new namespace.Controller(width, height, new Date());
    var renderer = new namespace.Renderer(canvas);
    
    function loop() {
        var view = controller.tick(new Date());
        renderer.render(view);
    }
    
    window.setInterval(loop, 50);
});