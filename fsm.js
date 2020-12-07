function Link(a, b) {
	this.nodeA = a;
	this.nodeB = b;
	this.text = '';
	this.lineAngleAdjust = 0; // value to add to textAngle when link is straight line

	// make anchor point relative to the locations of nodeA and nodeB
	this.parallelPart = 0.5; // percentage from nodeA to nodeB
	this.perpendicularPart = 0; // pixels from line between nodeA and nodeB
}

Link.prototype.getAnchorPoint = function() {
	var dx = this.nodeB.x - this.nodeA.x;
	var dy = this.nodeB.y - this.nodeA.y;
	var scale = Math.sqrt(dx * dx + dy * dy);
	return {
		'x': this.nodeA.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
		'y': this.nodeA.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
	};
};

Link.prototype.setAnchorPoint = function(x, y) {
	var dx = this.nodeB.x - this.nodeA.x;
	var dy = this.nodeB.y - this.nodeA.y;
	var scale = Math.sqrt(dx * dx + dy * dy);
	this.parallelPart = (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
	this.perpendicularPart = (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;
	// snap to a straight line
	if(this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < snapToPadding) {
		this.lineAngleAdjust = (this.perpendicularPart < 0) * Math.PI;
		this.perpendicularPart = 0;
	}
};

Link.prototype.getEndPointsAndCircle = function() {
	if(this.perpendicularPart == 0) {
		var midX = (this.nodeA.x + this.nodeB.x) / 2;
		var midY = (this.nodeA.y + this.nodeB.y) / 2;
		var start = this.nodeA.closestPointOnCircle(midX, midY);
		var end = this.nodeB.closestPointOnCircle(midX, midY);
		return {
			'hasCircle': false,
			'startX': start.x,
			'startY': start.y,
			'endX': end.x,
			'endY': end.y,
		};
	}
	var anchor = this.getAnchorPoint();
	var circle = circleFromThreePoints(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y, anchor.x, anchor.y);
	var isReversed = (this.perpendicularPart > 0);
	var reverseScale = isReversed ? 1 : -1;
	var startAngle = Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) - reverseScale * nodeRadius / circle.radius;
	var endAngle = Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) + reverseScale * nodeRadius / circle.radius;
	var startX = circle.x + circle.radius * Math.cos(startAngle);
	var startY = circle.y + circle.radius * Math.sin(startAngle);
	var endX = circle.x + circle.radius * Math.cos(endAngle);
	var endY = circle.y + circle.radius * Math.sin(endAngle);
	return {
		'hasCircle': true,
		'startX': startX,
		'startY': startY,
		'endX': endX,
		'endY': endY,
		'startAngle': startAngle,
		'endAngle': endAngle,
		'circleX': circle.x,
		'circleY': circle.y,
		'circleRadius': circle.radius,
		'reverseScale': reverseScale,
		'isReversed': isReversed,
	};
};

Link.prototype.draw = function(c) {
	var stuff = this.getEndPointsAndCircle();
	// draw arc
	c.beginPath();
	if(stuff.hasCircle) {
		c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, stuff.isReversed);
	} else {
		c.moveTo(stuff.startX, stuff.startY);
		c.lineTo(stuff.endX, stuff.endY);
	}
	c.stroke();
	// draw the head of the arrow
	if(stuff.hasCircle) {
		drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle - stuff.reverseScale * (Math.PI / 2));
	} else {
		drawArrow(c, stuff.endX, stuff.endY, Math.atan2(stuff.endY - stuff.startY, stuff.endX - stuff.startX));
	}
	// draw the text
	if(stuff.hasCircle) {
		var startAngle = stuff.startAngle;
		var endAngle = stuff.endAngle;
		if(endAngle < startAngle) {
			endAngle += Math.PI * 2;
		}
		var textAngle = (startAngle + endAngle) / 2 + stuff.isReversed * Math.PI;
		var textX = stuff.circleX + stuff.circleRadius * Math.cos(textAngle);
		var textY = stuff.circleY + stuff.circleRadius * Math.sin(textAngle);
		drawText(c, this.text, textX, textY, textAngle, selectedObject == this);
	} else {
		var textX = (stuff.startX + stuff.endX) / 2;
		var textY = (stuff.startY + stuff.endY) / 2;
		var textAngle = Math.atan2(stuff.endX - stuff.startX, stuff.startY - stuff.endY);
		drawText(c, this.text, textX, textY, textAngle + this.lineAngleAdjust, selectedObject == this);
	}
};

Link.prototype.containsPoint = function(x, y) {
	var stuff = this.getEndPointsAndCircle();
	if(stuff.hasCircle) {
		var dx = x - stuff.circleX;
		var dy = y - stuff.circleY;
		var distance = Math.sqrt(dx*dx + dy*dy) - stuff.circleRadius;
		if(Math.abs(distance) < hitTargetPadding) {
			var angle = Math.atan2(dy, dx);
			var startAngle = stuff.startAngle;
			var endAngle = stuff.endAngle;
			if(stuff.isReversed) {
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}
			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}
			if(angle < startAngle) {
				angle += Math.PI * 2;
			} else if(angle > endAngle) {
				angle -= Math.PI * 2;
			}
			return (angle > startAngle && angle < endAngle);
		}
	} else {
		var dx = stuff.endX - stuff.startX;
		var dy = stuff.endY - stuff.startY;
		var length = Math.sqrt(dx*dx + dy*dy);
		var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
		var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
		return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
	}
	return false;
};

function Node(x, y) {
	this.x = x;
	this.y = y;
	this.mouseOffsetX = 0;
	this.mouseOffsetY = 0;
	this.isAcceptState = false;
	this.text = '';
}

Node.prototype.setMouseStart = function(x, y) {
	this.mouseOffsetX = this.x - x;
	this.mouseOffsetY = this.y - y;
};

Node.prototype.setAnchorPoint = function(x, y) {
	this.x = x + this.mouseOffsetX;
	this.y = y + this.mouseOffsetY;
};

Node.prototype.draw = function(c) {
	// draw the circle
	c.beginPath();
	c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
	c.stroke();

	// draw the text
	drawText(c, this.text, this.x, this.y, null, selectedObject == this);

	// draw a double circle for an accept state
	if(this.isAcceptState) {
		c.beginPath();
		c.arc(this.x, this.y, nodeRadius - 6, 0, 2 * Math.PI, false);
		c.stroke();
	}

	var startNode=getStart();
	if(this.text==startNode.text) {
	// drawText(c, this.text, this.x+1, this.y, null, selectedObject == this);
		drawArrow(c, this.x-nodeRadius, this.y, 0);
		c.beginPath();
		c.moveTo(this.x-nodeRadius, this.y);
		c.lineTo(this.x-1.7*nodeRadius, this.y);
		c.stroke();
	}
};

Node.prototype.closestPointOnCircle = function(x, y) {
	var dx = x - this.x;
	var dy = y - this.y;
	var scale = Math.sqrt(dx * dx + dy * dy);
	return {
		'x': this.x + dx * nodeRadius / scale,
		'y': this.y + dy * nodeRadius / scale,
	};
};

Node.prototype.containsPoint = function(x, y) {
	return (x - this.x)*(x - this.x) + (y - this.y)*(y - this.y) < nodeRadius*nodeRadius;
};

function SelfLink(node, mouse) {
	this.node = node;
	this.anchorAngle = 0;
	this.mouseOffsetAngle = 0;
	this.text = '';
  this.mouse = mouse;

	if(mouse) {
		this.setAnchorPoint(mouse.x, mouse.y);
	}
}

SelfLink.prototype.setMouseStart = function(x, y) {
	this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
};

SelfLink.prototype.setAnchorPoint = function(x, y) {
	this.anchorAngle = Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
	// snap to 90 degrees
	var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
	if(Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
	// keep in the range -pi to pi so our containsPoint() function always works
	if(this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
	if(this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
};

SelfLink.prototype.getEndPointsAndCircle = function() {
	var circleX = this.node.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
	var circleY = this.node.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
	var circleRadius = 0.75 * nodeRadius;
	var startAngle = this.anchorAngle - Math.PI * 0.8;
	var endAngle = this.anchorAngle + Math.PI * 0.8;
	var startX = circleX + circleRadius * Math.cos(startAngle);
	var startY = circleY + circleRadius * Math.sin(startAngle);
	var endX = circleX + circleRadius * Math.cos(endAngle);
	var endY = circleY + circleRadius * Math.sin(endAngle);
	return {
		'hasCircle': true,
		'startX': startX,
		'startY': startY,
		'endX': endX,
		'endY': endY,
		'startAngle': startAngle,
		'endAngle': endAngle,
		'circleX': circleX,
		'circleY': circleY,
		'circleRadius': circleRadius
	};
};

SelfLink.prototype.draw = function(c) {
	var stuff = this.getEndPointsAndCircle();
	// draw arc
	c.beginPath();
	c.arc(stuff.circleX, stuff.circleY, stuff.circleRadius, stuff.startAngle, stuff.endAngle, false);
	c.stroke();
	// draw the text on the loop farthest from the node
	var textX = stuff.circleX + stuff.circleRadius * Math.cos(this.anchorAngle);
	var textY = stuff.circleY + stuff.circleRadius * Math.sin(this.anchorAngle);
	drawText(c, this.text, textX, textY, this.anchorAngle, selectedObject == this);
	// draw the head of the arrow
	drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle + Math.PI * 0.4);
};

SelfLink.prototype.containsPoint = function(x, y) {
	var stuff = this.getEndPointsAndCircle();
	var dx = x - stuff.circleX;
	var dy = y - stuff.circleY;
	var distance = Math.sqrt(dx*dx + dy*dy) - stuff.circleRadius;
	return (Math.abs(distance) < hitTargetPadding);
};

function StartLink(node, start) {
	this.node = node;
	this.deltaX = 0;
	this.deltaY = 0;
	this.text = '';

	if(start) {
		this.setAnchorPoint(start.x, start.y);
	}
}

StartLink.prototype.setAnchorPoint = function(x, y) {
	this.deltaX = x - this.node.x;
	this.deltaY = y - this.node.y;

	if(Math.abs(this.deltaX) < snapToPadding) {
		this.deltaX = 0;
	}

	if(Math.abs(this.deltaY) < snapToPadding) {
		this.deltaY = 0;
	}
};

StartLink.prototype.getEndPoints = function() {
	var startX = this.node.x + this.deltaX;
	var startY = this.node.y + this.deltaY;
	var end = this.node.closestPointOnCircle(startX, startY);
	return {
		'startX': startX,
		'startY': startY,
		'endX': end.x,
		'endY': end.y,
	};
};

StartLink.prototype.draw = function(c) {
	var stuff = this.getEndPoints();

	// draw the line
	c.beginPath();
	c.moveTo(stuff.startX, stuff.startY);
	c.lineTo(stuff.endX, stuff.endY);
	c.stroke();

	// draw the text at the end without the arrow
	var textAngle = Math.atan2(stuff.startY - stuff.endY, stuff.startX - stuff.endX);
	drawText(c, this.text, stuff.startX, stuff.startY, textAngle, selectedObject == this);

	// draw the head of the arrow
	drawArrow(c, stuff.endX, stuff.endY, Math.atan2(-this.deltaY, -this.deltaX));
};

StartLink.prototype.containsPoint = function(x, y) {
	var stuff = this.getEndPoints();
	var dx = stuff.endX - stuff.startX;
	var dy = stuff.endY - stuff.startY;
	var length = Math.sqrt(dx*dx + dy*dy);
	var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
	var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
	return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
};

function TemporaryLink(from, to) {
	this.from = from;
	this.to = to;
}

TemporaryLink.prototype.draw = function(c) {
	// draw the line
	c.beginPath();
	c.moveTo(this.to.x, this.to.y);
	c.lineTo(this.from.x, this.from.y);
	c.stroke();

	// draw the head of the arrow
	drawArrow(c, this.to.x, this.to.y, Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x));
};

startString="[S]";//{Start}

// draw using this instead of a canvas and call toLaTeX() afterward
function ExportAsLaTeX() {
	this._points = [];
	this._texData = '';
	this._scale = 0.1; // to convert pixels to document space (TikZ breaks if the numbers get too big, above 500?)

	this.toLaTeX = function() {
		return '\\documentclass[12pt]{article}\n' +
			'\\usepackage{tikz}\n' +
			'\\usetikzlibrary{automata,positioning,arrows.meta,calc,decorations.markings}%for start arrow\n' +
			'\n' +
			'\\begin{document}\n' +
			'\n' +
			'\\begin{center}\n' +
			'\\begin{tikzpicture}[scale=0.2]\n' +
			'\\tikzstyle{every node}+=[inner sep=0pt]\n' +
			this._texData +
			'\\end{tikzpicture}\n' +
			'\\end{center}\n' +
			'\n' +
			'\\end{document}\n';
	};

	this.beginPath = function() {
		this._points = [];
	};
	this.arc = function(x, y, radius, startAngle, endAngle, isReversed) {
		x *= this._scale;
		y *= this._scale;
		radius *= this._scale;
		if(endAngle - startAngle == Math.PI * 2) {
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x, 3) + ',' + fixed(-y, 3) + ') circle (' + fixed(radius, 3) + ');\n';
		} else {
			if(isReversed) {
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}
			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}
			// TikZ needs the angles to be in between -2pi and 2pi or it breaks
			if(Math.min(startAngle, endAngle) < -2*Math.PI) {
				startAngle += 2*Math.PI;
				endAngle += 2*Math.PI;
			} else if(Math.max(startAngle, endAngle) > 2*Math.PI) {
				startAngle -= 2*Math.PI;
				endAngle -= 2*Math.PI;
			}
			startAngle = -startAngle;
			endAngle = -endAngle;
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x + radius * Math.cos(startAngle), 3) + ',' + fixed(-y + radius * Math.sin(startAngle), 3) + ') arc (' + fixed(startAngle * 180 / Math.PI, 5) + ':' + fixed(endAngle * 180 / Math.PI, 5) + ':' + fixed(radius, 3) + ');\n';
		}
	};
	this.moveTo = this.lineTo = function(x, y) {
		x *= this._scale;
		y *= this._scale;
		this._points.push({ 'x': x, 'y': y });
	};
	this.stroke = function() {
		if(this._points.length == 0) return;
		this._texData += '\\draw [' + this.strokeStyle + ']';
		for(var i = 0; i < this._points.length; i++) {
			var p = this._points[i];
			this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
		}
		this._texData += ';\n';
	};
	this.fill = function() {
		if(this._points.length == 0) return;
		this._texData += '\\fill [' + this.strokeStyle + ']';
		for(var i = 0; i < this._points.length; i++) {
			var p = this._points[i];
			this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
		}
		this._texData += ';\n';
	};
	this.measureText = function(text) {
		var c = canvas.getContext('2d');
		c.font = '20px "Times New Romain", serif';
		return c.measureText(text);
	};
	startNode=getStart();
	this.advancedFillText = function(text, originalText, x, y, angleOrNull) {
		if(text.replace(' ', '').length > 0) {
			var nodeParams = '';
			// x and y start off as the center of the text, but will be moved to one side of the box when angleOrNull != null
			if(angleOrNull != null) {
				var width = this.measureText(text).width;
				var dx = Math.cos(angleOrNull);
				var dy = Math.sin(angleOrNull);
				if(Math.abs(dx) > Math.abs(dy)) {
					if(dx > 0) nodeParams = '[right,align=left] ', x -= width / 2;
					else nodeParams = '[left,align=left] ', x += width / 2;
				} else {
					if(dy > 0) nodeParams = '[below,align=left] ', y -= 10;
					else nodeParams = '[above,align=left] ', y += 10;
				}
			}
			x *= this._scale;
			y *= this._scale;
//       if(originalText==startNode.text) {
// originalText=originalText.substr(startString.length);

// 		this._texData += '\\draw [' + this.strokeStyle + ', ->, ultra thick]';
// 			this._texData += ' (' + fixed(x-5, 2) + ',' + fixed(-y, 2) + ')';
// 			this._texData += ' --' + ' (' + fixed(x-3, 2) + ',' + fixed(-y, 2) + ')';
// 		this._texData += ';\n';

//         // this._texData += '\\path[decoration={markings,mark=at position 1 with \\arrow{Classical TikZ Rightarrow[length=2mm]}}, decorate] (' + fixed(x-3, 2) + ',' + fixed(-y, 2) + ');\n';
//       }
			this._texData += '\\draw (' + fixed(x, 2) + ',' + fixed(-y, 2) + ') node ' + nodeParams + '{$' + originalText.replace(/#/g,'\\#').replace(/\\\\/g,'$\\\\$').replace(/ /g, '\\mbox{ }') + '$};\n';
		}
	};

	this.translate = this.save = this.restore = this.clearRect = function(){};
}

// draw using this instead of a canvas and call toLaTeX() afterward
function ExportAsLaTeX2() {
	this._points = [];
	this._texData = '';
	this._scale = 0.1; // to convert pixels to document space (TikZ breaks if the numbers get too big, above 500?)

	this.toLaTeX2 = function() {
		return '\\documentclass[12pt]{article}\n' +
			'\\usepackage{tikz}\n' +
			'\n' +
			'\\begin{document}\n' +
			'\n' +
			'\\begin{center}\n' +
			'\\begin{tikzpicture}[scale=0.2]\n' +
			'\\tikzstyle{every node}+=[inner sep=0pt]\n' +
			this._texData +
			'\\end{tikzpicture}\n' +
			'\\end{center}\n' +
			'\n' +
			'\\end{document}\n';
	};

	this.beginPath = function() {
		this._points = [];
	};
	this.arc = function(x, y, radius, startAngle, endAngle, isReversed) {
		x *= this._scale;
		y *= this._scale;
		radius *= this._scale;
		if(endAngle - startAngle == Math.PI * 2) {
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x, 3) + ',' + fixed(-y, 3) + ') circle (' + fixed(radius, 3) + ');\n';
		} else {
			if(isReversed) {
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}
			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}
			// TikZ needs the angles to be in between -2pi and 2pi or it breaks
			if(Math.min(startAngle, endAngle) < -2*Math.PI) {
				startAngle += 2*Math.PI;
				endAngle += 2*Math.PI;
			} else if(Math.max(startAngle, endAngle) > 2*Math.PI) {
				startAngle -= 2*Math.PI;
				endAngle -= 2*Math.PI;
			}
			startAngle = -startAngle;
			endAngle = -endAngle;
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x + radius * Math.cos(startAngle), 3) + ',' + fixed(-y + radius * Math.sin(startAngle), 3) + ') arc (' + fixed(startAngle * 180 / Math.PI, 5) + ':' + fixed(endAngle * 180 / Math.PI, 5) + ':' + fixed(radius, 3) + ');\n';
		}
	};
	this.moveTo = this.lineTo = function(x, y) {
		x *= this._scale;
		y *= this._scale;
		this._points.push({ 'x': x, 'y': y });
	};
	this.stroke = function() {
		if(this._points.length == 0) return;
		this._texData += '\\draw [' + this.strokeStyle + ']';
		for(var i = 0; i < this._points.length; i++) {
			var p = this._points[i];
			this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
		}
		this._texData += ';\n';
	};
	this.fill = function() {
		if(this._points.length == 0) return;
		this._texData += '\\fill [' + this.strokeStyle + ']';
		for(var i = 0; i < this._points.length; i++) {
			var p = this._points[i];
			this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
		}
		this._texData += ';\n';
	};
	this.measureText = function(text) {
		var c = canvas.getContext('2d');
		c.font = '20px "Times New Romain", serif';
		return c.measureText(text);
	};
	this.advancedFillText = function(text, originalText, x, y, angleOrNull) {
		if(text.replace(' ', '').length > 0) {
			var nodeParams = '';
			// x and y start off as the center of the text, but will be moved to one side of the box when angleOrNull != null
			if(angleOrNull != null) {
				var width = this.measureText(text).width;
				var dx = Math.cos(angleOrNull);
				var dy = Math.sin(angleOrNull);
				if(Math.abs(dx) > Math.abs(dy)) {
					if(dx > 0) nodeParams = '[right] ', x -= width / 2;
					else nodeParams = '[left] ', x += width / 2;
				} else {
					if(dy > 0) nodeParams = '[below] ', y -= 10;
					else nodeParams = '[above] ', y += 10;
				}
			}
			x *= this._scale;
			y *= this._scale;
			this._texData += '\\draw (' + fixed(x, 2) + ',' + fixed(-y, 2) + ') node ' + nodeParams + '{$' + originalText.replace(/ /g, '\\mbox{ }') + '$};\n';
		}
	};

	this.translate = this.save = this.restore = this.clearRect = function(){};
}
/*

\documentclass[12pt]{article}
\usepackage[english]{babel}
\usepackage[utf8x]{inputenc}
\usepackage{amsmath}
\usepackage{tikz}
\usetikzlibrary{arrows,automata}
\begin{document}
\begin{tikzpicture}[->,>=stealth',shorten >=1pt,auto,node distance=3.5cm,double distance=1.5pt, initial text = {},
        scale = 1,transform shape]
  \node[state,accepting,initial] (S1) {$S$};

  \path (S1) edge[loop above]              node {$A$} (S1);

\end{tikzpicture}
\end{document}

 * */

// draw using this instead of a canvas and call toSVG() afterward
function ExportAsSVG() {
	this.fillStyle = 'black';
	this.strokeStyle = 'black';
	this.lineWidth = 1;
	this.font = '12px Arial, sans-serif';
	this._points = [];
	this._svgData = '';
	this._transX = 0;
	this._transY = 0;

	this.toSVG = function() {
		return '<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n\n<svg width="800" height="600" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' + this._svgData + '</svg>\n';
	};

	this.beginPath = function() {
		this._points = [];
	};
	this.arc = function(x, y, radius, startAngle, endAngle, isReversed) {
		x += this._transX;
		y += this._transY;
		var style = 'stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" fill="none"';

		if(endAngle - startAngle == Math.PI * 2) {
			this._svgData += '\t<ellipse ' + style + ' cx="' + fixed(x, 3) + '" cy="' + fixed(y, 3) + '" rx="' + fixed(radius, 3) + '" ry="' + fixed(radius, 3) + '"/>\n';
		} else {
			if(isReversed) {
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}

			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}

			var startX = x + radius * Math.cos(startAngle);
			var startY = y + radius * Math.sin(startAngle);
			var endX = x + radius * Math.cos(endAngle);
			var endY = y + radius * Math.sin(endAngle);
			var useGreaterThan180 = (Math.abs(endAngle - startAngle) > Math.PI);
			var goInPositiveDirection = 1;

			this._svgData += '\t<path ' + style + ' d="';
			this._svgData += 'M ' + fixed(startX, 3) + ',' + fixed(startY, 3) + ' '; // startPoint(startX, startY)
			this._svgData += 'A ' + fixed(radius, 3) + ',' + fixed(radius, 3) + ' '; // radii(radius, radius)
			this._svgData += '0 '; // value of 0 means perfect circle, others mean ellipse
			this._svgData += +useGreaterThan180 + ' ';
			this._svgData += +goInPositiveDirection + ' ';
			this._svgData += fixed(endX, 3) + ',' + fixed(endY, 3); // endPoint(endX, endY)
			this._svgData += '"/>\n';
		}
	};
	this.moveTo = this.lineTo = function(x, y) {
		x += this._transX;
		y += this._transY;
		this._points.push({ 'x': x, 'y': y });
	};
	this.stroke = function() {
		if(this._points.length == 0) return;
		this._svgData += '\t<polygon stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" points="';
		for(var i = 0; i < this._points.length; i++) {
			this._svgData += (i > 0 ? ' ' : '') + fixed(this._points[i].x, 3) + ',' + fixed(this._points[i].y, 3);
		}
		this._svgData += '"/>\n';
	};
	this.fill = function() {
		if(this._points.length == 0) return;
		this._svgData += '\t<polygon fill="' + this.fillStyle + '" stroke-width="' + this.lineWidth + '" points="';
		for(var i = 0; i < this._points.length; i++) {
			this._svgData += (i > 0 ? ' ' : '') + fixed(this._points[i].x, 3) + ',' + fixed(this._points[i].y, 3);
		}
		this._svgData += '"/>\n';
	};
	this.measureText = function(text) {
		var c = canvas.getContext('2d');
		c.font = '20px "Times New Romain", serif';
		return c.measureText(text);
	};
	this.fillText = function(text, x, y) {
		x += this._transX;
		y += this._transY;
		if(text.replace(' ', '').length > 0) {
			this._svgData += '\t<text x="' + fixed(x, 3) + '" y="' + fixed(y, 3) + '" font-family="Times New Roman" font-size="20">' + textToXML(text) + '</text>\n';
		}
	};
	this.translate = function(x, y) {
		this._transX = x;
		this._transY = y;
	};

	this.save = this.restore = this.clearRect = function(){};
}

var greekLetterNames = [ 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega' ];

function convertLatexShortcuts(text) {
	// html greek characters
	for(var i = 0; i < greekLetterNames.length; i++) {
		var name = greekLetterNames[i];
		text = text.replace(new RegExp('\\\\' + name, 'g'), String.fromCharCode(913 + i + (i > 16)));
		text = text.replace(new RegExp('\\\\' + name.toLowerCase(), 'g'), String.fromCharCode(945 + i + (i > 16)));
	}

	// subscripts
	for(var i = 0; i < 10; i++) {
		text = text.replace(new RegExp('_' + i, 'g'), String.fromCharCode(8320 + i));
	}

	return text;
}

function textToXML(text) {
	text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	var result = '';
	for(var i = 0; i < text.length; i++) {
		var c = text.charCodeAt(i);
		if(c >= 0x20 && c <= 0x7E) {
			result += text[i];
		} else {
			result += '&#' + c + ';';
		}
	}
	return result;
}

function drawArrow(c, x, y, angle) {
	var dx = Math.cos(angle);
	var dy = Math.sin(angle);
	c.beginPath();
	c.moveTo(x, y);
	c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
	c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
	c.fill();
}

function canvasHasFocus() {
	return (document.activeElement || document.body) == document.body;
}

function drawText(c, originalText, x, y, angleOrNull, isSelected) {
	text = convertLatexShortcuts(originalText);
	c.font = '20px "Times New Roman", serif';
	var width = c.measureText(text).width;

	// center the text
	x -= width / 2;

	// position the text intelligently if given an angle
	if(angleOrNull != null) {
		var cos = Math.cos(angleOrNull);
		var sin = Math.sin(angleOrNull);
		var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
		var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
		var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
		x += cornerPointX - sin * slide;
		y += cornerPointY + cos * slide;
	}

	// draw text and caret (round the coordinates so the caret falls on a pixel)
	if('advancedFillText' in c) {
		c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull);
	} else {
		x = Math.round(x);
		y = Math.round(y);
		c.fillText(text, x, y + 6);
		if(isSelected && caretVisible && canvasHasFocus() && document.hasFocus()) {
			x += width;
			c.beginPath();
			c.moveTo(x, y - 10);
			c.lineTo(x, y + 10);
			c.stroke();
		}
	}
}

var caretTimer;
var caretVisible = true;

function resetCaret() {
	clearInterval(caretTimer);
	caretTimer = setInterval('caretVisible = !caretVisible; draw()', 500);
	caretVisible = true;
}

var canvas;
var nodeRadius = 30;
var nodes = [];
var links = [];

var cursorVisible = true;
var snapToPadding = 6; // pixels
var hitTargetPadding = 6; // pixels
var selectedObject = null; // either a Link or a Node
var currentLink = null; // a Link
var movingObject = false;
var originalClick;

function drawUsing(c) {
	c.clearRect(0, 0, canvas.width, canvas.height);
	c.save();
	c.translate(0.5, 0.5);

	for(var i = 0; i < nodes.length; i++) {
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = (nodes[i] == selectedObject) ? 'blue' : 'black';
		nodes[i].draw(c);
	}
	for(var i = 0; i < links.length; i++) {
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = (links[i] == selectedObject) ? 'blue' : 'black';
		links[i].draw(c);
	}
	if(currentLink != null) {
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = 'black';
		currentLink.draw(c);
	}

	c.restore();
}

function draw() {
	drawUsing(canvas.getContext('2d'));
	saveBackup();
}

function selectObject(x, y) {
	for(var i = 0; i < nodes.length; i++) {
		if(nodes[i].containsPoint(x, y)) {
			return nodes[i];
		}
	}
	for(var i = 0; i < links.length; i++) {
		if(links[i].containsPoint(x, y)) {
			return links[i];
		}
	}
	return null;
}

function snapNode(node) {
	for(var i = 0; i < nodes.length; i++) {
		if(nodes[i] == node) continue;

		if(Math.abs(node.x - nodes[i].x) < snapToPadding) {
			node.x = nodes[i].x;
		}

		if(Math.abs(node.y - nodes[i].y) < snapToPadding) {
			node.y = nodes[i].y;
		}
	}
}

window.onload = function() {

	canvas = document.getElementById('canvas');
	restoreBackup();
	draw();

	canvas.onmousedown = function(e) {
		var mouse = crossBrowserRelativeMousePos(e);
		selectedObject = selectObject(mouse.x, mouse.y);
		movingObject = false;
		originalClick = mouse;

		if(selectedObject != null) {
			if(shift && selectedObject instanceof Node) {
				currentLink = new SelfLink(selectedObject, mouse);
			} else {
				movingObject = true;
				deltaMouseX = deltaMouseY = 0;
				if(selectedObject.setMouseStart) {
					selectedObject.setMouseStart(mouse.x, mouse.y);
				}
			}
			resetCaret();
		} else if(shift) {
			currentLink = new TemporaryLink(mouse, mouse);
		}

		draw();

		if(canvasHasFocus()) {
			// disable drag-and-drop only if the canvas is already focused
			return false;
		} else {
			// otherwise, let the browser switch the focus away from wherever it was
			resetCaret();
			return true;
		}
	};

	canvas.ondblclick = function(e) {
		var mouse = crossBrowserRelativeMousePos(e);
		selectedObject = selectObject(mouse.x, mouse.y);

		if(selectedObject == null) {
			selectedObject = new Node(mouse.x, mouse.y);
			nodes.push(selectedObject);
			resetCaret();
			draw();
		} else if(selectedObject instanceof Node) {
			selectedObject.isAcceptState = !selectedObject.isAcceptState;
			draw();
		}
	};

	canvas.onmousemove = function(e) {
		var mouse = crossBrowserRelativeMousePos(e);

		if(currentLink != null) {
			var targetNode = selectObject(mouse.x, mouse.y);
			if(!(targetNode instanceof Node)) {
				targetNode = null;
			}

			if(selectedObject == null) {
				if(targetNode != null) {
					currentLink = new StartLink(targetNode, originalClick);
				} else {
					currentLink = new TemporaryLink(originalClick, mouse);
				}
			} else {
				if(targetNode == selectedObject) {
					currentLink = new SelfLink(selectedObject, mouse);
				} else if(targetNode != null) {
					currentLink = new Link(selectedObject, targetNode);
				} else {
					currentLink = new TemporaryLink(selectedObject.closestPointOnCircle(mouse.x, mouse.y), mouse);
				}
			}
			draw();
		}

		if(movingObject) {
			selectedObject.setAnchorPoint(mouse.x, mouse.y);
			if(selectedObject instanceof Node) {
				snapNode(selectedObject);
			}
			draw();
		}
	};

	canvas.onmouseup = function(e) {
		movingObject = false;

		if(currentLink != null) {
			if(!(currentLink instanceof TemporaryLink)) {
				selectedObject = currentLink;
				links.push(currentLink);
				resetCaret();
			}
			currentLink = null;
			draw();
		}
	};

  var code=getUrlVars()["code"];
  if(!(code===undefined)){
	  loadCode(code);
  }
  document.getElementById("bulkCheck").checked=false;
}

function loadCode(code2) {
    // console.log(code);
    code=decodeURI(code2);
    // console.log(code);
    var xs = JSON.parse(code);
    // console.log(nodes);
    // console.log(xs);
    nodes=[];
    for(var i=0;i<xs[0].length;i++) {
      var xNode=xs[0][i];
      var n = new Node(xNode.x, xNode.y);
      n.mouseOffsetX=xNode.mouseOffsetX;
      n.mouseOffsetY=xNode.mouseOffsetY;
      n.isAcceptState=xNode.isAcceptState;
      n.text=xNode.text;
      nodes.push(n);
    }
    links=[];
    for(var i=0;i<xs[1].length;i++) {
      var xLink=xs[1][i];
      var l;
      if(xLink.sort==0){
        l=new SelfLink(nodes[xLink.node], xLink.mouse);
        l.anchorAngle=xLink.angle;
        l.mouseOffsetAngle=xLink.mouseOffset;
        l.text=xLink.text;
      }else{
        l=new Link(nodes[xLink.nodeA], nodes[xLink.nodeB]);
        l.text=xLink.text;
        l.lineAngleAdjust=xLink.lineAngleAdjust;
        l.parallelPart=xLink.parallelPart;
        l.perpendicularPart=xLink.perpendicularPart;
      }
      links.push(l);
    }
    drawUsing(canvas.getContext('2d'));
    // console.log(nodes);
}

var shift = false;

document.onkeydown = function(e) {
	var key = crossBrowserKey(e);

	if(key == 16) {
		shift = true;
	} else if(!canvasHasFocus()) {
		// don't read keystrokes when other things have focus
		return true;
	} else if(key == 8) { // backspace key
		if(selectedObject != null && 'text' in selectedObject) {
			selectedObject.text = selectedObject.text.substr(0, selectedObject.text.length - 1);
			resetCaret();
			draw();
		}

		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	} else if(key == 46) { // delete key
		if(selectedObject != null) {
			for(var i = 0; i < nodes.length; i++) {
				if(nodes[i] == selectedObject) {
					nodes.splice(i--, 1);
				}
			}
			for(var i = 0; i < links.length; i++) {
				if(links[i] == selectedObject || links[i].node == selectedObject || links[i].nodeA == selectedObject || links[i].nodeB == selectedObject) {
					links.splice(i--, 1);
				}
			}
			selectedObject = null;
			draw();
		}
	}
};

document.onkeyup = function(e) {
	var key = crossBrowserKey(e);

	if(key == 16) {
		shift = false;
	}
};

document.onkeypress = function(e) {
    if (e.code === "Period") {
        document.spacePressed()
      return false;
    }
	// don't read keystrokes when other things have focus
	var key = crossBrowserKey(e);
	if(!canvasHasFocus()) {
    console.log("No focus");
    if (e.code === "Space") {
        document.spacePressed();
      return false;
    }
		// don't read keystrokes when other things have focus
		return true;
	} else if(key >= 0x20 && key <= 0x7E && !e.metaKey && !e.altKey && !e.ctrlKey && selectedObject != null && 'text' in selectedObject) {
		selectedObject.text += String.fromCharCode(key);
		resetCaret();
		draw();

		// don't let keys do their actions (like space scrolls down the page)
		return false;
	} else if(key == 8) {
		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	}
};

function crossBrowserKey(e) {
	e = e || window.event;
	return e.which || e.keyCode;
}

function crossBrowserElementPos(e) {
	e = e || window.event;
	var obj = e.target || e.srcElement;
	var x = 0, y = 0;
	while(obj.offsetParent) {
		x += obj.offsetLeft;
		y += obj.offsetTop;
		obj = obj.offsetParent;
	}
	return { 'x': x, 'y': y };
}

function crossBrowserMousePos(e) {
	e = e || window.event;
	return {
		'x': e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
		'y': e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop,
	};
}

function crossBrowserRelativeMousePos(e) {
	var element = crossBrowserElementPos(e);
	var mouse = crossBrowserMousePos(e);
	return {
		'x': mouse.x - element.x,
		'y': mouse.y - element.y
	};
}

function output(text) {
	var element = document.getElementById('output');
	element.style.display = 'block';
	element.value = text;
}

function saveAsPNG() {
	var oldSelectedObject = selectedObject;
	selectedObject = null;
	drawUsing(canvas.getContext('2d'));
	selectedObject = oldSelectedObject;
	var pngData = canvas.toDataURL('image/png');

  document.getElementById("overleafExport").style.display = "none";

  var iframe = "<iframe width='100%' height='100%' src='" + pngData + "'></iframe>"
  var x = window.open();
  x.document.open();
  x.document.write(iframe);
  x.document.close();

	// document.location.href = pngData;
}

function saveAsSVG() {
	var exporter = new ExportAsSVG();
	var oldSelectedObject = selectedObject;
	selectedObject = null;
	drawUsing(exporter);
	selectedObject = oldSelectedObject;
	var svgData = exporter.toSVG();
  document.getElementById("overleafExport").style.display="none";
	output(svgData);
	// Chrome isn't ready for this yet, the 'Save As' menu item is disabled
	// document.location.href = 'data:image/svg+xml;base64,' + btoa(svgData);
}

function saveAsLaTeX() {
	var exporter = new ExportAsLaTeX();
	var oldSelectedObject = selectedObject;
	selectedObject = null;
	drawUsing(exporter);
	selectedObject = oldSelectedObject;
	var texData = exporter.toLaTeX();
  document.getElementById("overleafExport").style.display="block";
	output(texData);
}

function simulateTuringDetWord(currentNode, word, blank, verbose) {
  console.log(word);
  var tapeLeft=[];
  var tapeRight=word.split('');
  if(tapeRight.length==0){
    tapeRight=[blank];
  }
  var max=10000;
  var steps=0;
  var data="";
  while(steps<max || max<0) {
    found=false;
    out:
    for(var i = 0; i < links.length; i++) {
      var nodeA;
      var nodeB;
      var text;
      if(links[i] instanceof SelfLink){
        nodeA = links[i].node;
        nodeB = nodeA;
        text = links[i].text;
      }else if(links[i] instanceof Link){
        nodeA = links[i].nodeA;
        nodeB = links[i].nodeB;
        text = links[i].text;
      } else {
        continue;
      }
      transitions=text.split("\\\\");
      for(var k=0;k<transitions.length;k++){
        var read;
        var write;
        var direction;
        if(transitions[k][0]=="("){
          parts=transitions[k].substring(1, transitions[k].length - 1).split(",");
          read=parts[0];
          write=parts[1];
          direction=parts[2];
        }else{
          parts=transitions[k].split(",");
          parts1=parts[0].split(";");
          read=parts1[0];
          write=parts1[1];
          direction=parts[1];
        }
        if(nodeA!=currentNode)
          continue;
        if(read==tapeRight[0]){
          tapeRight[0]=write;
          move=direction.toLowerCase()[0];
          if(move=="r"){
            tapeLeft.unshift(tapeRight[0]);
            tapeRight.shift();
            if(tapeRight.length==0){
              tapeRight.unshift(blank);
            }
          }else if(move=="l"){
            if(tapeLeft.length==0){
              tapeLeft.unshift(blank);
            }
            tapeRight.unshift(tapeLeft[0]);
            tapeLeft.shift();
          }
          currentNode=nodeB;
          found=true;
          break out;
        }
      }
    }
    if(!found){
      break;
    }
    steps+=1;
    if(verbose){
      data+="Step: "+steps+"\n";
      data+=calcTape(tapeLeft,tapeRight)+"\n";
    }
    // console.log(tapeLeft);
    // console.log(tapeRight);
    // console.log("Step: "+steps);
    // console.log(tape);
    // console.log("");
  }
  if(!verbose){
    return calcTape(tapeLeft,tapeRight);
  }else{
    return data+"End: "+calcTape(tapeLeft,tapeRight);
  }
}

function calcTape(tapeLeft,tapeRight){
    var tape="";
    tapeLeftRev=tapeLeft.slice().reverse();
    for(var i = 0; i < tapeLeftRev.length; i++) {
      tape+=tapeLeftRev[i];
    }
    for(var i = 0; i < tapeRight.length; i++) {
      if(i==0){
        tape+="<";
      }
      tape+=tapeRight[i];
      if(i==0){
        tape+=">";
      }
    }
  return tape;
}

function getStart() {
  var currentNode;
	for(var i = 0; i < nodes.length; i++) {
		if((undefined===currentNode && nodes[i].text=="S") || nodes[i].text.toLowerCase().startsWith(startString.toLowerCase())){
			currentNode=nodes[i];
		}
	}
	return currentNode;
}

// function simulateTuringDetWord(currentNode, word, blank, verbose) {
function simulateTuringDet() {
  var currentNode=getStart();
  if(undefined === currentNode){
    alert("No starting node S or \""+startString+"\" found!");
  }

  if(undefined === document.blank) {
    document.blank="#";
  }

  var data;
  var bulk=document.getElementById("bulkCheck").checked;
  if(bulk){
    var words=document.getElementById("bulkInput").value.split("\n");
    data="";
    for(var i=0;i<words.length;i++){
      var word=words[i];
      data+=word+" => "+simulateTuringDetWord(currentNode,word,document.blank,false);
      data+="\n";
    }
  }else{
    var word=document.getElementById("tapeInput").value;
    data=simulateTuringDetWord(currentNode,word,document.blank,true);
    document.setTuring(word,nodes,links);
  }
  
  output(data);
  document.getElementById("overleafExport").style.display="none";
}

String.prototype.repeat = function(length) {
 return Array(length + 1).join(this);
};

function simulateNFAWord(startNode, word,verbose=false) {
  word=word.split('');
  var currentNodes=[[word,startNode,0,undefined]];
  var data="";
  var enddata="declined";
  out:
  while(true) {
    var newNodes=[]
    console.log("CN:",currentNodes);
    found=false;
    for(var j=0;j<currentNodes.length;j++){
      var word=currentNodes[j][0];
      var cNode=currentNodes[j][1];
	  var depth=currentNodes[j][2];
	  var lastNode=currentNodes[j][3];
	//   console.log(depth,cNode.text,word);
		if (lastNode)
			last="("+lastNode.text+" ->) ";
		else
			last="";
      if(word.length==0){
        console.log("empty in "+cNode.text);
        if(cNode.isAcceptState){
          console.log("accept");
          enddata="accepted in "+cNode.text;
        //   data+="accepted in "+cNode.text+"\n";
          break out;
        }else {
			data+=" ".repeat(depth)+last+cNode.text+": declined\n";
        //   data+="accepted in "+cNode.text+"\n";
          // data="declined";
        }
        // break;
      }else{
		data+=" ".repeat(depth)+last+cNode.text+": "+word+"\n";
	  }
      for(var i = 0; i < links.length; i++) {
        var nodeA;
        var nodeB;
        var text;
        if(links[i] instanceof SelfLink){
          nodeA = links[i].node;
          nodeB = nodeA;
          text = links[i].text;
        }else if(links[i] instanceof Link){
          nodeA = links[i].nodeA;
          nodeB = links[i].nodeB;
          text = links[i].text;
        } else {
          continue;
        }
        if(nodeA!=cNode)
          continue;
        found=true;
        transitions=text.split("\\\\");
        for(var k=0;k<transitions.length;k++){
          transitions2=transitions[k].split(",");
          for(var l=0;l<transitions2.length;l++){
            if(transitions2[l]==word[0]){
              var word2=word.slice();
              word2.shift();
              newNodes.push([word2,nodeB,depth+1,cNode]);
            }else if(transitions2[l]=="\\epsilon"){
              newNodes.push([word,nodeB,depth+1,cNode]);
            }
          }
        }
      }
    }
    if(!found){
      break out;
    }
    currentNodes=newNodes;
  }
  return data+enddata;
}

function simulateNFA() {
  var currentNode=getStart();
  if(undefined === currentNode){
    alert("No starting node S or \""+startString+"\" found!");
  }
  var data;
  var bulk=document.getElementById("bulkCheck").checked;
  if(bulk){
    var words=document.getElementById("bulkInput").value.split("\n");
    data="";
    for(var i=0;i<words.length;i++){
      var word=words[i];
	  data+=word+" => "+simulateNFAWord(currentNode,word);
	//   console.log("NF: "+data);
      data+="\n";
    }
  }else{
    var word=document.getElementById("tapeInput").value;
    data=simulateNFAWord(currentNode,word,true);
  }
  output(data);
  document.getElementById("overleafExport").style.display="none";
}

function simulateDFAWord(currentNode, word,verbose=false) {
  word=word.split('');
  var data="";
  while(true) {
    if(word.length==0){
      if(currentNode.isAcceptState){
        data+="accepted in "+currentNode.text;
      }else {
        data+="declined in "+currentNode.text;
      }
      break;
	} else if(verbose){
		data+=currentNode.text+": "+word.join("")+"\n";
	}
    found=false;
    out:
    for(var i = 0; i < links.length; i++) {
      var nodeA;
      var nodeB;
      var text;
      if(links[i] instanceof SelfLink){
        nodeA = links[i].node;
        nodeB = nodeA;
        text = links[i].text;
      }else if(links[i] instanceof Link){
        nodeA = links[i].nodeA;
        nodeB = links[i].nodeB;
        text = links[i].text;
      } else {
        continue;
      }
      transitions=text.split("\\\\");
      for(var k=0;k<transitions.length;k++){
        transitions2=transitions[k].split(",");
        for(var l=0;l<transitions2.length;l++){
          if(nodeA!=currentNode)
            continue;
          if(transitions2[l]==word[0]){
            word.shift();
            currentNode=nodeB;
            found=true;
            break out;
          }
        }
      }
    }
    if(!found){
      data+="declined in "+currentNode.text+" (no move possible)";
      break;
    }
  }
  return data;
}

function simulateDFA() {
  var currentNode=getStart();
  if(undefined === currentNode){
    alert("No starting node S or \""+startString+"\" found!");
  }
  var data;
  var bulk=document.getElementById("bulkCheck").checked;
  if(bulk){
    var words=document.getElementById("bulkInput").value.split("\n");
    data="";
    for(var i=0;i<words.length;i++){
      var word=words[i];
      data+=word+" => "+simulateDFAWord(currentNode,word);
      data+="\n";
    }
  }else{
    var word=document.getElementById("tapeInput").value;
    data=simulateDFAWord(currentNode,word,true);
  }
  output(data);
  document.getElementById("overleafExport").style.display="none";
}

function saveAsText() {
  var data = "";
	for(var i = 0; i < nodes.length; i++) {
    data+=nodes[i].text+(nodes[i].isAcceptState ? ' (accepting)' : '')+"\n";
	}
	for(var i = 0; i < links.length; i++) {
    var textA="";
    var textB="";
    var textL="";
    // if(links[i] instanceof StartLink{
      // textA = "Start_"+links[i].node.text;
      // textB = textA;
      // textL = links[i].text;
    // }else 
    if(links[i] instanceof SelfLink){
      textA = links[i].node.text;
      textB = textA;
      textL = links[i].text;
    }else if(links[i] instanceof Link){
      textA = links[i].nodeA.text;
      textB = links[i].nodeB.text;
      textL = links[i].text;
    } else {
      continue;
    }
    data+=textA + " -> " + textB + " ("+textL+")" + "\n";
	}
  output(data);
}

function saveAsLaTeX2() {
	var exporter = new ExportAsLaTeX2();
	var oldSelectedObject = selectedObject;
	selectedObject = null;
	drawUsing(exporter);
	selectedObject = oldSelectedObject;
	var texData = exporter.toLaTeX2();
  document.getElementById("overleafExport").style.display="block";
	output(texData);
}

function getUrlVars() {
	return getUriVars(window.location.href);
}

function getUriVars(url) {
	var vars = {};
	console.log(url);
    var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getIndex(node) {
  for(var i=0;i<nodes.length;i++){
    if(node.text==nodes[i].text &&
      node.x==nodes[i].x &&
      node.y==nodes[i].y){
      return i;
    }
  }
  return -1;
}

function load() {
  var completeUrl=document.getElementById("output").value;
  var code=getUriVars(completeUrl)["code"];
//   console.log(code);
  if(!(code===undefined)){
	  loadCode(code);
  }
}

function share() {
	document.getElementById("loadSpan").style.display="";
  var shareLinks=[];
  for(var i=0;i<links.length;i++){
    if(links[i] instanceof SelfLink) {
      shareLinks.push({
        sort: 0,
        node: getIndex(links[i].node),
        angle: links[i].anchorAngle,
        mouseOffset: links[i].mouseOffsetAngle,
        mouse: links[i].mouse,
        text: links[i].text
      });
    }else if(links[i] instanceof Link) {
      shareLinks.push({
        sort: 1,
        nodeA: getIndex(links[i].nodeA),
        nodeB: getIndex(links[i].nodeB),
        lineAngleAdjust: links[i].lineAngleAdjust,
        parallelPart: links[i].parallelPart,
        perpendicularPart: links[i].perpendicularPart,
        text: links[i].text
      });
    }
  }
  var str=encodeURI(JSON.stringify([nodes,shareLinks]));
  // console.log();
  document.getElementById("overleafExport").style.display="none";
  var url = window.location.href.split('?')[0];
  var completeUrl=url+"?code="+str;
	output(completeUrl);
  document.getElementById("longurl").value=completeUrl;
// location.protocol + '//' + location.host + location.pathname
}

function changeBulk() {
  var bulk=document.getElementById("bulkCheck").checked;
  if(bulk){
    document.getElementById("bulkInput").style.display="block";
    document.getElementById("tapeInput").style.display="none";
  }else{
    document.getElementById("bulkInput").style.display="none";
    document.getElementById("tapeInput").style.display="block";
  }
}

function det(a, b, c, d, e, f, g, h, i) {
	return a*e*i + b*f*g + c*d*h - a*f*h - b*d*i - c*e*g;
}

function circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
	var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
	var bx = -det(x1*x1 + y1*y1, y1, 1, x2*x2 + y2*y2, y2, 1, x3*x3 + y3*y3, y3, 1);
	var by = det(x1*x1 + y1*y1, x1, 1, x2*x2 + y2*y2, x2, 1, x3*x3 + y3*y3, x3, 1);
	var c = -det(x1*x1 + y1*y1, x1, y1, x2*x2 + y2*y2, x2, y2, x3*x3 + y3*y3, x3, y3);
	return {
		'x': -bx / (2*a),
		'y': -by / (2*a),
		'radius': Math.sqrt(bx*bx + by*by - 4*a*c) / (2*Math.abs(a))
	};
}

function fixed(number, digits) {
	return number.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
}

function restoreBackup() {
	if(!localStorage || !JSON) {
		return;
	}

	try {
		var backup = JSON.parse(localStorage['fsm']);

		for(var i = 0; i < backup.nodes.length; i++) {
			var backupNode = backup.nodes[i];
			var node = new Node(backupNode.x, backupNode.y);
			node.isAcceptState = backupNode.isAcceptState;
			node.text = backupNode.text;
			nodes.push(node);
		}
		for(var i = 0; i < backup.links.length; i++) {
			var backupLink = backup.links[i];
			var link = null;
			if(backupLink.type == 'SelfLink') {
				link = new SelfLink(nodes[backupLink.node]);
				link.anchorAngle = backupLink.anchorAngle;
				link.text = backupLink.text;
			} else if(backupLink.type == 'StartLink') {
				link = new StartLink(nodes[backupLink.node]);
				link.deltaX = backupLink.deltaX;
				link.deltaY = backupLink.deltaY;
				link.text = backupLink.text;
			} else if(backupLink.type == 'Link') {
				link = new Link(nodes[backupLink.nodeA], nodes[backupLink.nodeB]);
				link.parallelPart = backupLink.parallelPart;
				link.perpendicularPart = backupLink.perpendicularPart;
				link.text = backupLink.text;
				link.lineAngleAdjust = backupLink.lineAngleAdjust;
			}
			if(link != null) {
				links.push(link);
			}
		}
	} catch(e) {
		localStorage['fsm'] = '';
	}
}

function saveBackup() {
	if(!localStorage || !JSON) {
		return;
	}

	var backup = {
		'nodes': [],
		'links': [],
	};
	for(var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		var backupNode = {
			'x': node.x,
			'y': node.y,
			'text': node.text,
			'isAcceptState': node.isAcceptState,
		};
		backup.nodes.push(backupNode);
	}
	for(var i = 0; i < links.length; i++) {
		var link = links[i];
		var backupLink = null;
		if(link instanceof SelfLink) {
			backupLink = {
				'type': 'SelfLink',
				'node': nodes.indexOf(link.node),
				'text': link.text,
				'anchorAngle': link.anchorAngle,
			};
		} else if(link instanceof StartLink) {
			backupLink = {
				'type': 'StartLink',
				'node': nodes.indexOf(link.node),
				'text': link.text,
				'deltaX': link.deltaX,
				'deltaY': link.deltaY,
			};
		} else if(link instanceof Link) {
			backupLink = {
				'type': 'Link',
				'nodeA': nodes.indexOf(link.nodeA),
				'nodeB': nodes.indexOf(link.nodeB),
				'text': link.text,
				'lineAngleAdjust': link.lineAngleAdjust,
				'parallelPart': link.parallelPart,
				'perpendicularPart': link.perpendicularPart,
			};
		}
		if(backupLink != null) {
			backup.links.push(backupLink);
		}
	}

	localStorage['fsm'] = JSON.stringify(backup);
}
