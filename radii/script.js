var divisions = 20;
var width = 1024;
var height = 1024;
var centre = { x: width / 2, y: height / 2 };
var faderLength = 200;

var MoveTo = function(x, y) {
    return { code: "M", x: x, y: y, text: "M"+Number(x)+","+Number(y) };
}

var LineTo = function(x, y) {
    return { code: "L", x: x, y: y, text: "L"+Number(x)+","+Number(y) };
    //return { code: "C", x: x, y: y, text: 
    //    "C"+
    //        Number(x)+","+Number(y) + " " +     // Start control point
    //        Number(x)+","+Number(y) + " " +     // End control point
    //        Number(x)+","+Number(y)             // End point
    //};
}

var strokes1 = [];
var strokes2 = [];
var redoStrokes1 = [];
var redoStrokes2 = [];
var mouseDown = false;
var mouseOver = false;
var ctrlDown = false;
var mpos = {x:0,y:0};

var map = function(list, f) {
    var length = list.length;
    var result = [];
    for (var i = 0; i < length; i++) {
        result.push(f(list[i]));
    }
    return result;
}

var dot = function(a, b) { 
    return (a.x * b.x) + (a.y * b.Y);
}

var refresh = function() {
    var text = map(strokes1, function(x) { return x.text; }).join(" ") + 
               map(strokes2, function(x) { return x.text; }).join(" ");

    updatePaths(function(path) {
        path.setAttribute("d", text);
    });
}

var moveTo = function(x, y) {
    strokes1.push(MoveTo(x, y));

    x = x > centre.x
        ? x - ((x - centre.x)*2)
        : x + ((centre.x - x)*2);

    strokes2.push(MoveTo(x, y));

    redoStrokes1 = [];
    redoStrokes2 = [];
    refresh();
}

var lineTo = function(x, y) {
    strokes1.push(LineTo(x, y));

    x = x > centre.x
        ? x - ((x - centre.x)*2)
        : x + ((centre.x - x)*2);

    strokes2.push(LineTo(x, y));

    redoStrokes1 = [];
    redoStrokes2 = [];
    refresh();
}

var newPoint = function(x, y) {
    if(strokes1.length == 0) {
        moveTo(x, y);
    }
    else {
        lineTo(x, y);
    }
}

var undo = function() {
    if(strokes1.length > 0)
    {
        redoStrokes1.push(strokes1.pop());
        redoStrokes2.push(strokes2.pop());
        refresh();
    }
}

var redo = function() {
    if(redoStrokes1.length > 0)
    {
        strokes1.push(redoStrokes1.pop());
        strokes2.push(redoStrokes2.pop());
        refresh();
    }
}

var eventMouseDown = function(e) {
    if(!mouseDown) {
        var m = mousePos(e);
        moveTo(m.x, m.y);
        eventMouseMove(e);
    }
    mouseDown = true;
}

var eventMouseUp = function(e) {
    mouseDown = false;
}

var eventMouseMove = function(e) {
    mpos = mousePos(e);
    if(mouseDown && mouseOver) {
        newPoint(mpos.x, mpos.y);
    }
}

var eventMouseOver = function(e) {
    mouseOver = true;
}

var eventMouseOut = function(e) {
    mouseOver = false;
}

var mousePos = function(e) {
    //var zoom = detectZoom.device();
    //var sx = (e.screenX - window.screenX) / zoom;
    //var sy = (e.screenY - window.screenY) / zoom;
    //return {x:sx, y:sy};
    return {x:e.offsetX + 1, y:e.offsetY + 1};
}

var drawRadials = function(n) {
    var rs = [];
    var radius = width;

    for (var i = 0; i < divisions; i++) {
        var x = centre.x + radius * Math.cos(2 * Math.PI * i / divisions);
        var y = centre.y + radius * Math.sin(2 * Math.PI * i / divisions);

        rs.push("M"+centre.x+ " "+centre.y);
        rs.push("L"+x+ " "+y);
    }

    var path = document.getElementById("radials");
    path.setAttribute("d", rs.join(" "));

    updatePaths(function(path, i) {
        path.setAttribute("transform", "rotate("+((360/divisions)*i)+" "+centre.x+" "+centre.y+")");
    });
}

var eventKeyDown = function(e) {
    if(e.keyCode == 17) ctrlDown = true;
    if(ctrlDown) {
        switch(e.keyCode) {
            case 90: undo(); return false;
            case 89: redo(); return false;
            case 83: saveImage(); return false;
            case 65: animateToggle(); return false;
        }
    }

    if(e.keyCode == 32) {
        mouseDown = !mouseDown;
        if(mouseDown && mouseOver) {
            moveTo(mpos.x, mpos.y);    
        }
    }

    if(e.keyCode == 27) {
        resetImage(); 
        return false;
    }

    if(e.keyCode >= 49 && e.keyCode <= 57) {
        updatePaths(function(path) {
            var x = (e.keyCode-48)*.5;
            path.setAttribute("stroke-width", x );
        });
        return false;
    }
}

var eventKeyUp = function(e) {
    if(e.keyCode == 17) ctrlDown = false;
}

var eventSlicesSlider = function(e) {
    var x = e.offsetX / faderLength;
    var n = ((((60-6)*x)+6)>>1)<<1;
    document.getElementById("slices-slider-handle").style.left = (e.offsetX-3)+"px";
    slices(n);
}

var eventAnimStepSlider = function(e) {
    var x = e.offsetX / faderLength;
    var n = (((50)*x)+5)>>0;
    dash.length = n;
    document.getElementById("anim-step-slider-handle").style.left = (e.offsetX-3)+"px";
    animateToggle();
    animateToggle();
}

var updatePaths = function(f) {
    for(var i = 0; i < divisions; i++) {
        var path = document.getElementById("path"+i);
        f(path, i);
    }
}

var dash = {
    length: 10,
    step: 1,
    current: 0
}

var animateInterval = null;

var animateUpdate = function() {
    dash.current = dash.current + dash.step;
    updatePaths(function(path, i) {
        path.setAttribute("stroke-dashoffset", ""+dash.current);
    });
}

var animateToggle = function() {
    if(animateInterval) {
        clearInterval(animateInterval);
        animateInterval = null;

        updatePaths(function(path, i) {
            path.setAttribute("stroke-dasharray", null);
        });
    }
    else {
        updatePaths(function(path, i) {
            path.setAttribute("stroke-dasharray", ""+dash.length+" "+dash.length);
        });
        animateInterval = setInterval(animateUpdate, 16);
    }
}

var saveImage = function () {
  var html = document.getElementById("canvas").parentNode.innerHTML;

  var imgsrc = "data:image/svg+xml;base64,"+ btoa(html);
  var img = '<img src="'+imgsrc+'" style="width:2048;height:2048">'; 

  document.getElementById("svgdataurl").innerHTML = img;

  var canvas = document.querySelector("canvas");
  var context = canvas.getContext("2d");

  var image = new Image;
  image.src = imgsrc;

  image.onload = function() {
      context.drawImage(image, 0, 0);

      var canvasdata = canvas.toDataURL("image/png");
      var pngimg = '<img src="'+canvasdata+'">'; 

      document.getElementById("pngdataurl").innerHTML = pngimg;

      var a = document.createElement("a");
      a.download = "radii.png";
      a.href = canvasdata;
      a.click();
  };
}

var setup = function() {

    drawRadials();

    var h = document.getElementById("holder");
    h.onmouseover = eventMouseOver;
    h.onmouseout = eventMouseOut;
    h.onmousemove = eventMouseMove;
    h.style.width = width+"px";
    h.style.height = height+"px";

    var c = document.getElementById("canvas");
    c.style.width = width+"px";
    c.style.height = height+"px";
    c.setAttribute("viewBox", "0 0 "+width+" "+height);
    c.setAttribute("width", width);
    c.setAttribute("height", height);

    var bg = document.getElementById("bg");
    bg.setAttribute("width", width);
    bg.setAttribute("height", height);

    var sv = document.getElementById("save-image");
    sv.style.width = width+"px";
    sv.style.height = height+"px";

    window.onkeydown = eventKeyDown;
    window.onkeyup = eventKeyUp;
    window.onmousedown = eventMouseDown;
    window.onmouseup = eventMouseUp;

    var ss = document.getElementById("slices-slider");
    ss.onclick = eventSlicesSlider;

    var as = document.getElementById("anim-step-slider");
    as.onclick = eventAnimStepSlider;

}

var slices = function(n) {

    strokes1 = [];
    redoStrokes1 = [];
    strokes2 = [];
    redoStrokes2 = [];
    refresh();

    divisions = n;
    setup();
}

var resetImage = function() {
    slices(divisions);
}

setup();