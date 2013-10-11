/**
 * Value Labels Plugin for flot.
 * http://leonardoeloy.github.com/flot-valuelabels
 * http://wiki.github.com/leonardoeloy/flot-valuelabels/
 *
 * Using canvas.fillText instead of divs, which is better for printing - by Leonardo Eloy, March 2010.
 * Tested with Flot 0.6 and JQuery 1.3.2.
 *
 * Original homepage: http://sites.google.com/site/petrsstuff/projects/flotvallab
 * Released under the MIT license by Petr Blahos, December 2009.
 * Modified by Davide Dolla (aka neoDD69), October 2013. Implementing valuelabels on more chart types 
 */
(function ($) {
	var options = {
		series: {
			valueLabels: {
				show: false,
				showAsHtml: false, // Set to true if you wanna switch back to DIV usage (you need plot.css for this)
				showLastValue: false, // Use this to show the label only for the last value in the series
				labelFormatter: function (v) { return v; }, // Format the label value to what you want
				align: 'start', // can also be 'center', 'left' or 'right'
				plotAxis: 'y', // Set to the axis values you wish to plot
				hideZero: false
			}
		}
	};

	function init(plot) {
		plot.hooks.draw.push(function (plot, ctx) {
			var last_val = null;
			var last_x = -1000;
			var last_y = -1000;
			var labelsAreDrawable = true;		//DD 05/10/2013 17:35:26	
			var labelsRects = Array();// to track rects of placed labels and resolve overlaps
			var firstDivLabels = null;//DD for remove the label if labelsAreDrawable  goes false

			$.each(plot.getData(), function (ii, series) {
				if (!series.valueLabels.show) return;
				if (!labelsAreDrawable) return;


				var showLastValue = series.valueLabels.showLastValue;
				var showAsHtml = series.valueLabels.showAsHtml;
				var plotAxis = series.valueLabels.plotAxis;
				var labelFormatter = series.valueLabels.labelFormatter;
				var fontcolor = series.valueLabels.fontcolor;
				var xoffset = series.valueLabels.xoffset;
				var yoffset = series.valueLabels.yoffset;
				var align = series.valueLabels.align;
				var font = series.valueLabels.font;
				var hideZero = series.valueLabels.hideZero;
				var itmp = 0;		//DD 05/10/2013 15:40:39	
				var rectBoundary = rectNew(plot.getPlotOffset().left, plot.getPlotOffset().top, plot.width(), plot.height());
				// Workaround, since Flot doesn't set this value anymore
				series.seriesIndex = ii;

				if (showAsHtml) {
					plot.getPlaceholder().find("#valueLabels" + ii).remove();
				}

				var html = '<div id="valueLabels' + series.seriesIndex + '" class="valueLabels">';

				//var categories = series.xaxis.options.mode == 'categories';
				//DD 05/10/2013 15:30:37	I use 2 vars beacuse we can have categories on 2 axes
				var Xcategories = series.xaxis.options.mode == 'categories';
				var Ycategories = series.yaxis.options.mode == 'categories';

				for (var i = 0; i < series.data.length; ++i) {

					if (series.data[i] === null || (showLastValue && i != series.data.length - 1)) continue;

					var x = series.data[i][0], y = series.data[i][1];

					//if (categories) {
					//	x = series.xaxis.categories[x];
					//}
					//DD 05/10/2013 15:31:33	START
					if (Xcategories) {
						x = series.xaxis.categories[x];
					}
					if (Ycategories) {
						y = series.yaxis.categories[y];
					}
					//DD 05/10/2013 15:31:33	END

					if (x < series.xaxis.min || x > series.xaxis.max || y < series.yaxis.min || y > series.yaxis.max) continue;

					var val = (plotAxis === 'x') ? x : y;

					if (val == null) { val = '' }

					if (val === 0 && hideZero) continue;

					if (series.valueLabels.valueLabelFunc) {
						val = series.valueLabels.valueLabelFunc({ series: series, seriesIndex: ii, index: i });
					}

					val = "" + val;
					val = labelFormatter(val);

					//if ( i == series.data.length - 1)
					{
						var xx =  series.xaxis.p2c(x) + plot.getPlotOffset().left;
						var yy =  series.yaxis.p2c(y) - 12 + plot.getPlotOffset().top;

						var originalX =xx;
						var originalY = yy;

						if (!showAsHtml) {	//DD 05/10/2013 17:44:45	touched nothing
							if (last_y < -900) last_y = yy;// not already setted. to maintain the same logic
							if (Math.abs(yy - last_y) > 20 || last_x < xx) {
								// Little 5 px padding here helps the number to get
								// closer to points
								x_pos = xx;
								y_pos = yy + 6;

								// If the value is on the top of the canvas, we need
								// to push it down a little
								if (yy <= 0) y_pos = 18;

								// The same happens with the x axis
								if (xx >= plot.width()) {
									x_pos = plot.width();
								}

								if (font) {
									ctx.font = font;
								}
								if (typeof (fontcolor) != 'undefined') {
									ctx.fillStyle = fontcolor;
								}
								ctx.shadowOffsetX = 0;
								ctx.shadowOffsetY = 0;
								ctx.shadowBlur = 1.5;
								if (typeof (fontcolor) != 'undefined') {
									ctx.shadowColor = fontcolor;
								}
								ctx.textAlign = align;

								ctx.fillText(val, x_pos, y_pos);
								last_y = yy;//DD to maintain the same logic
								last_x = xx + val.length * 8;//DD to maintain the same logic 
							}
						}
						else {
							//var head = '<div style="left:' + xx + 'px;top:' + yy + 'px;" class="valueLabel';
							//var tail = '">' + val + '</div>';
							//html += head + "Light" + tail + head + tail;


							//DD 05/10/2013 15:32:55	START	wrote a barnd new code 
							// put a temp DIV to know the size of the label when it will be drawed
							//itmp = Math.random();
							var divForMeasure = '<div id="forMeasure' + itmp + '" class="valueLabels" ><div  style="color:red;left:' + xx + 'px;top:' + (yy) + 'px;line-height:normal;" class="valueLabel">' + val + '</div></div>';
							plot.getPlaceholder().append(divForMeasure);
							var forMeasure = $("#forMeasure" + itmp);
							var w = forMeasure.children().width();
							var h = forMeasure.children().height();
							forMeasure.remove();
							// check wich type of series we drawn for and check boundaries and draw the label correctly ;apply logics to write the label only if we have more space
							var xCorrection = 0;
							var yCorrection = 0;
							var correctXcenter = true;
							var drawThisLabel = true;
							var rect;
							if (series.bars.show) {
								if (series.bars.horizontal) {
									// Draw Labels on Hor&Vert Bar Chart
									if (Math.abs(yy - last_y) < h) // no more vertical space
									{
										labelsAreDrawable = false;
									}

									var xxOri = xx;
									xx = xx - w - 4;// plotted inside of a bar
									if (xx < plot.getPlotOffset().left) xx = xxOri + 4;//plotted after end of the bar
									correctXcenter = false;
									yCorrection = h / 2 ;
								}
								else {
									yCorrection = h + 3;
									// miss bottom-limit-control
									// check if we are under the 0 of Yaxis
									if (yy + yCorrection + h > series.yaxis.p2c(0) - 2) {
										yCorrection = 0;
										yy = yy - 3;
									}
								}
							}
							else {
								yCorrection = -4;
							}

							if (!labelsAreDrawable) {		//DD are in serires of bar: the second series told that we dont have room for draqing labels=> remove the firstPlaced
								if (firstDivLabels != null) {
									$(firstDivLabels).find('#valueLabels' + (series.seriesIndex - 1)).remove();// remove the first label
									firstDivLabels = null;
								}
								break;
							}

							if (correctXcenter) {
								var xxOri = xx;
								xx = xx - w / 2;
								if (xx < plot.getPlotOffset().left)
									xx = xxOri + 4;//plotted after end of the bar
								else if (xx + w > plot.width() + plot.getPlotOffset().left)
									xx = xxOri - w - 4;
							}
							last_y = yy;
							last_x = xx;
							// correction serieType-specific
							xx = xx + xCorrection;
							yy = yy + yCorrection;
							
							var rnew = rectNew(xx, yy, w, h);
							var inters = false;
							if (labelsRects.length > 0) {
								prevRect = labelsRects[labelsRects.length - 1];
								rect = rectGetNewPos(prevRect, rnew, 4, rectBoundary);
								//intersec = rectIntersects(prevRect, rnew);
							}
							else {
								rect = rectNew(xx, yy, w, h);
								rect = rectGetNewPos(rect, rect, 4, rectBoundary);
							}
							labelsRects.push(rect);
							//var div = '<div style="' + (intersec ? 'color:green;' : '') + 'left:' + (rect.left) + 'px;top:' + (rect.top) + 'px;line-height:normal;" class="valueLabel">' + val + '</div>';
							var div = '<div style="' + 'left:' + (rect.left) + 'px;top:' + (rect.top) + 'px;line-height:normal;" class="valueLabel">' + val + '</div>';
							html += div;
							//var divDebug = '<div style="color:red;left:' + (originalX) + 'px;top:' + (originalY) + 'px;line-height:normal;" class="valueLabel">' + val + '</div>';
							//html += divDebug;

							//DD 05/10/2013 15:32:55	END	wrote a barnd new code 
						}
						//DD 05/10/2013 17:41:59	here is the right place to set the last_* values ;)
						last_val = val;
						//DD 05/10/2013 17:42:32	last_x = xx + val.length * 8;	this value was setted inside each branch of previous if
						//DD 05/10/2013 17:48:11	last_y = yy;					this value was setted inside each branch of previous if
					}

					if (!labelsAreDrawable) break;		//DD 05/10/2013 17:37:41	if cannot write one label, also the other labels are undrawable
				}
				if (labelsAreDrawable && showAsHtml) {
					html += "</div>";
					var divLbls = plot.getPlaceholder().append(html);
					if (firstDivLabels == null)
						firstDivLabels = divLbls;
				}
			});
		});
	}
	function rectNew(x, y, w, h) {
		return { left: x, right: x + w, top: y, bottom: y + h };
	}
	function rectIntersects(rect1, rect2) {
		return rect2.right > rect1.left
				&& rect2.bottom > rect1.top
				&& rect2.left < rect1.right
				&& rect2.top < rect1.bottom;
	}
	function rectIntersectWhere(rect1, rect2) {
		var x1 = Math.max(rect1.left, rect2.left),
			y1 = Math.max(rect1.top, rect2.top),
			x2 = Math.min(rect1.right, rect2.right),
			y2 = Math.min(rect1.bottom, rect2.bottom);
		return { left: x1, right: x2, top: y1, bottom: y2 };
	}
	function rectGetNewPos(rectPlaced, rectNew, minDistance, rectBoundary) {
		var rval = { left: rectNew.left, right: rectNew.right, top: rectNew.top, bottom: rectNew.bottom };
		if (!(rectPlaced.left == rectNew.left && rectPlaced.right == rectNew.right && rectPlaced.top == rectNew.top && rectPlaced.bottom == rectNew.bottom)) {// is not the same rect, check intersecation
			if (rectIntersects(rectPlaced, rectNew)) {
				var intersecRect = rectIntersectWhere(rectPlaced, rectNew);
				// the intersection will not be in BAR series
				//var halXfOfPlaced = rectPlaced.top + ((rectPlaced.bottom-rectPlaced.top)/2);
				if (rectNew.top <= rectPlaced.bottom && rectNew.top >= rectPlaced.top)// upper corner is inside
				{		//shift to bottom
					delta = rectPlaced.bottom + minDistance - rval.top;
					rval.top += delta;
					rval.bottom += delta;
					if (rval.bottom > rectBoundary.bottom) {// we are out of drawing surface
						delta = rval.bottom - rectPlaced.top - minDistance;
						rval.top -= delta;
						rval.bottom -= delta;
					}
				}
				else if (rectNew.bottom <= rectPlaced.bottom && rectNew.bottom >= rectPlaced.top) {// upper corner is inside
					//shift to top
					delta = rectPlaced.top + minDistance - rval.bottom;
					rval.top -= delta;
					rval.bottom -= delta;
					if (rval.top < rectBoundary.top) {// we are out of drawing surface
						delta = rectPlaced.bottom + minDistance - rval.top;
						rval.top += delta;
						rval.bottom += delta;
					}
				}
				//may be?// shift to right
				//delta = rectPlaced.right + minDistance - rval.left;
				//rval.right += delta;
				//rval.left += delta;
			}
		}
		if (rval.right > rectBoundary.right)
		{
			delta = rectBoundary.right - (rval.right + minDistance);
			rval.right -= delta;
			rval.left -= delta;
		}
		if (rval.top < rectBoundary.top)
		{
			delta = rectBoundary.top - (rval.top + minDistance)+4;
			rval.top += delta;
			rval.bottom += delta;
		}
		else if (rval.bottom > rectBoundary.bottom) {
			delta = (rval.bottom + minDistance) - rectBoundary.bottom + 4;
			rval.top -= delta;
			rval.bottom -= delta;
		}
		return rval;
	}
	$.plot.plugins.push({
		init: init,
		options: options,
		name: 'valueLabels',
		version: '1.2'
	});
})(jQuery);
