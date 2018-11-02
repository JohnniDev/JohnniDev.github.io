'use strict';

angular.module('myApp.version.rating-directive', [])

    .directive('appRating', ['version', function ($state) {
        var defaultConfig = {
            id: 'rating-chart',
            w: 330, // Width of the circle
            h: 230, // Height of the circle
            margin: { // The margins of the SVG
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
            },
            levels: 3, // How many levels or inner circles should there be drawn
            maxValue: 0, // What is the value that the biggest circle will represent
            labelFactor: 1.4, // How much farther than the radius of the outer circle should the labels be placed
            // wrapWidth: 60, 		// The number of pixels after which a label needs to be given a new line
            opacityArea: 0.1, // The opacity of the area of the blob
            dotRadius: 5, // The size of the colored circles of each blog
            opacityCircles: 0.1, // The opacity of the circles of each blob
            strokeWidth: 2, // The width of the stroke around each blob
            roundStrokes: false, // If true the area and stroke will follow a round path (cardinal-closed)
            color: null, // Color function
            radians: 2 * Math.PI,
            factor: 1,
            tension: 0.7, // Smoothing for corners in interpolation lines,
            labelIndicatorWidth: 100, // Width for legend underline background
            domain: 1, // Domain for graph,
            average: false, // Average rating in the middle of the chart,
            arrows: false,
            compare: true
        };

        return {
            restrict: 'E',
            replace: true,
            template: '<div class="ysa-rating-chart"></div>',
            scope: {
                data: '=data',
                config: '=config',
                colors: '=colors',
                average: '=average',
                hovered: '&hovered'
            },
            link: function (scope, element, attrs) {

                var config = angular.extend({}, defaultConfig, scope.config || {});
                var chartEl = d3.select(element[0]);

                config.color = d3.scale.ordinal().range(scope.colors);

                // If the supplied maxValue is smaller than the actual one, replace by the max in the data
                // var maxValue = Math.max(config.maxValue, d3.max(scope.data, function (i) {
                //     return d3.max(i.map(function (o) {
                //         return o.percent;
                //     }))
                // }));
                var maxValue = 100; // TODO: Узнать как считать
                var axis;
                var allAxis, // Names of each axis
                    total = 0, // The number of different axes
                    radius = Math.min(config.w / 2, config.h / 2), // Radius of the outermost circle
                    Format = d3.format('%'), // Percentage formatting
                    angleSlice = 0; // The width in radians of each "slice"
                var areaWrapper;
                var legendsWrapper;

                // The radial line function
                var radarLine = d3.svg.line.radial()
                    .interpolate("linear")
                    .radius(function (d) {
                        return rScale(d.percent);
                    })
                    .angle(function (d, i) {
                        return i * angleSlice;
                    });


                // Scale for the radius
                var rScale = d3.scale.linear()
                    .range([0, radius])
                    .domain([0, config.domain]);

                var rScaleLegend = d3.scale.linear()
                    .range([0, radius])
                    .domain([0, config.domain]);


                // Initiate the radar chart SVG
                var svg = chartEl.append("svg")
                    .attr("width", config.w + config.margin.left + config.margin.right + 100)
                    .attr("height", config.h + config.margin.top + config.margin.bottom + 100)
                    .attr("class", "radar" + config.id);


                // Append a g element
                var g = svg.append("g")
                    .attr('class', 'ysa-radar-group')
                    .attr("transform", "translate(" + (config.w / 2 + config.margin.left + 50) + "," + (config.h / 2 + config.margin.top + 50) + ")");

                // Filter for the outside glow
                var filter = g.append("defs")
                    .append("radialGradient")
                    .attr("id", "glow")
                    .attr("x1", "50%")
                    .attr("y1", "100%")
                    .attr("x2", "50%")
                    .attr("y2", "100%");

                filter.append("stop")
                    .attr("offset", "50%")
                    .attr("stop-color", "#2E354E")
                    .attr("stop-opacity", 1);

                filter.append("stop")
                    .attr("offset", "130%")
                    .attr("stop-color", "rgba(0,9,40,0.00)")
                    .attr("stop-opacity", 1);


                // Wrapper for the grid & axes
                var axisGrid = g.append("g").attr("class", "axisWrapper");

                g.append("circle")
                    .attr("class", "glow-circle")
                    .attr("r", radius + 30)
                    .style("fill-opacity", "0.4")
                    .style("fill", "url(#glow)");


                if (config.average) {
                    g.append("text")
                        .attr("class", "ysa-radar-average")
                        .attr("dy", "0.3em")
                        .text(scope.average);
                }


                // Draw the background circles
                var drawBackgroundCircles = function () {
                    // Clear all levels
                    g.selectAll(".levels").remove();

                    var levels = g.append('g')
                        .attr('class', 'levels');

                    for (var j = 0; j < config.levels; j++) {
                        var levelFactor = config.factor * radius * ((j + 1) / config.levels);
                        var level = levels.append('g')
                            .attr('class', 'level')
                            .attr('data-level', j);

                        level.selectAll(".line")
                            .data(allAxis)
                            .enter()
                            .append("svg:line")
                            .attr("x1", function (d, i) {
                                return levelFactor * (1 - config.factor * Math.sin(i * config.radians / total));
                            })
                            .attr("y1", function (d, i) {
                                return levelFactor * (1 - config.factor * Math.cos(i * config.radians / total));
                            })
                            .attr("x2", function (d, i) {
                                return levelFactor * (1 - config.factor * Math.sin((i + 1) * config.radians / total));
                            })
                            .attr("y2", function (d, i) {
                                return levelFactor * (1 - config.factor * Math.cos((i + 1) * config.radians / total));
                            })
                            .attr("class", "line")
                            .style("stroke", "grey")
                            .style("stroke-opacity", "1")
                            .style("stroke-width", "0.35px")
                            .attr("transform", "translate(" + (-levelFactor) + ", " + (-levelFactor) + ")");
                    }
                };


                var getX = function (i) {
                    return rScaleLegend(maxValue * config.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2)
                };
                var getY = function (i) {
                    return rScaleLegend(maxValue * config.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2);
                };

                var drawLegend = function () {
                    g.select(".ysa-radar-legends").remove();

                    legendsWrapper = g.append("g").attr("class", "ysa-radar-legends");

                    var node = legendsWrapper.selectAll(".ysa-radar-node")
                        .data(scope.data[0])
                        .enter().append("g")
                        .attr("class", "ysa-radar-node")
                        .attr("data-node", function (d, i) {
                            return i;
                        })
                        .attr('transform', function (d, i) {
                            return 'translate(' + getX(i) + ',' + getY(i) + ')';
                        });

                    // Определяем откуда должен начинаться текст, если это средний элемент или первый, и четное количество элементов
                    // то ставим middle, что бы отрисовывалось посередине
                    node.append("text")
                        .attr('text-anchor', function (d, i) {
                            var anchor = 'start';
                            var isFirstOrMiddle = Math.floor(scope.data[0].length / 2) === i || 0 === i;
                            if (isFirstOrMiddle && scope.data[0].length % 2 === 0) {
                                anchor = 'middle';
                            } else {
                                anchor = getX(i) >= 0 ? 'start' : 'end'
                            }
                            return anchor;
                        })
                        .text(function (d) {
                            return d.title;
                        })
                        .append('tspan')
                        .attr('dx', '.5em')
                        .text(function (d) {
                            return d.percent.toFixed(2) + '%'
                        });


                    // Рисуем стрелки, в зависимости от изменения процентов
                    if (config.arrows) {
                        node.append("g")
                            .classed('legend-arrow--hidden', function (d) {
                                return d.change === 0;
                            })
                            .attr('transform', function (d, i) {
                                var text = this.parentNode.querySelector('text');
                                var textWidth = getX(i) >= 0 ? text.getBoundingClientRect().width + 10 : 10;
                                var isFirstOrMiddle = Math.floor(scope.data[0].length / 2) === i || 0 === i;
                                if (isFirstOrMiddle && scope.data[0].length % 2 === 0) {
                                    textWidth = textWidth / 2;
                                }
                                return 'translate(' + textWidth + ',-11)'
                            })
                            .append("path")
                            .attr('d', 'M10 0H3c-.6 0-1 .4-1 1s.4 1 1 1h4.6l-7 7L2 10.4l7-7V8c0 .6.4 1 1 1s1-.4 1-1V1c0-.6-.4-1-1-1z')
                            .attr('class', 'legend-arrow')
                            .classed('legend-arrow--down', function (d) {
                                return d.change < 0;
                            })
                            .attr("width", 16)
                            .attr("height", 16);
                    }

                    // Рисуем progress bar, в случае, если config.compare === true,
                    // то изменяем значение при наведении на точку
                    if (config.compare) {
                        var progressWrapper = node.append('g')
                            .attr('class', 'ysa-radar-progress-wrapper')
                            .attr('transform', function (d, i) {
                                var text = this.parentNode.querySelector('text');
                                var textWidth = getX(i) >= 0 ? 0 : -(text.getBoundingClientRect().width) + 1;
                                var isFirstOrMiddle = Math.floor(scope.data[0].length / 2) === i || 0 === i;
                                if (isFirstOrMiddle && scope.data[0].length % 2 === 0) {
                                    textWidth = -(text.getBoundingClientRect().width / 2);
                                }
                                return 'translate(' + textWidth + ',15)'
                            });

                        progressWrapper.append('rect')
                            .attr('class', 'ysa-radar-progress')
                            .attr('width', config.labelIndicatorWidth)
                            .attr('x', 0);

                        progressWrapper.append('rect')
                            .attr('class', 'ysa-radar-progress__rect')
                            .attr('width', 0)
                            .attr('x', 0);

                        updateProgressBar(node);
                    }
                };


                function updateProgressBar(node, percent) {
                    var rect = node.selectAll('.ysa-radar-progress__rect');
                    var textPercent = node.selectAll('tspan');

                    rect.attr('fill', function (d) {
                        var p = percent;
                        if (percent === null || percent === undefined) {
                            p = d.percent;
                        }
                        if (p < 30) {
                            return '#FF0000';
                        } else if (p >= 30 && p < 70) {
                            return '#F4BB25';
                        }
                        return '#5BDA18';
                    });

                    rect.transition()
                        .duration(400)
                        .attr('width', function (d) {
                            var p = percent;
                            if (percent === null || percent === undefined) {
                                p = d.percent;
                            }
                            return p * (config.labelIndicatorWidth / 100);
                        });

                    if (percent !== null && percent !== undefined) {
                        textPercent.text(function () {
                            return percent.toFixed(2) + '%';
                        })
                    }
                }


                // Create the straight lines radiating outward from the center
                var drawAxis = function () {
                    // Clear all axis, legends and lines
                    axisGrid.selectAll(".axis").remove();
                    axisGrid.selectAll(".line").remove();
                    axisGrid.selectAll(".legend").remove();

                    axis = axisGrid.selectAll(".axis")
                        .attr("class", "axis")
                        .data(allAxis)
                        .enter()
                        .append("g");

                    // Append the lines
                    axis.append("line")
                        .attr("class", "line")
                        .attr("x1", 0)
                        .attr("y1", 0)
                        .attr("x2", function (d, i) {
                            return rScaleLegend(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2);
                        })
                        .attr("y2", function (d, i) {
                            return rScaleLegend(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2);
                        })
                        .style("stroke", "rgb(38, 46, 71)")
                        .style("stroke-width", "1px")
                        .style("stroke-dasharray", "3px");
                };

                var drawCircles = function () {
                    axisGrid.selectAll(".ysa-radar-circles").remove();

                    var circlesWrapper = areaWrapper.append('g')
                        .attr('class', 'ysa-radar-circles');

                    // Скрываем проценты и progress bar
                    legendsWrapper.selectAll('tspan')
                        .attr('opacity', 0);
                    legendsWrapper.selectAll('.ysa-radar-progress-wrapper')
                        .attr('opacity', 0);

                    // Рисуем точки на вершинах
                    circlesWrapper.selectAll(".ysa-radar-circle")
                        .data(function (d, i) {
                            return d;
                        })
                        .enter().append("circle")
                        .attr("class", "ysa-radar-circle")
                        .attr("r", config.dotRadius)
                        .attr("cx", function (d, i) {
                            return rScale(d.percent) * Math.cos(angleSlice * i - Math.PI / 2);
                        })
                        .attr("cy", function (d, i) {
                            return rScale(d.percent) * Math.sin(angleSlice * i - Math.PI / 2);
                        })
                        .style("opacity", "0")
                        .on("mouseover", function (d, i) {
                            d3.select(this)
                                .transition()
                                .duration(200)
                                .style('opacity', 1);

                            // Ищем ноду по индексу, и показываем ее
                            var node = legendsWrapper.select('.ysa-radar-node[data-node="' + i + '"]');

                            node.select('tspan')
                                .transition()
                                .duration(200)
                                .style('opacity', 1);

                            node.select('.ysa-radar-progress-wrapper')
                                .transition()
                                .duration(200)
                                .style('opacity', 1);

                            updateProgressBar(node, d.percent);
                        })
                        .on('mouseout', function (d, i) {
                            d3.select(this)
                                .transition()
                                .duration(200)
                                .style('opacity', 0);

                            // Ищем ноду по индексу, и скрываем ее
                            var node = legendsWrapper.select('.ysa-radar-node[data-node="' + i + '"]');

                            node.select('tspan')
                                .transition()
                                .duration(200)
                                .style('opacity', 0);

                            node.select('.ysa-radar-progress-wrapper')
                                .transition()
                                .duration(200)
                                .style('opacity', 0);
                        });
                };


                var tweenArea = function (d) {
                    var interpolate = d3.svg.line.radial()
                        .interpolate("linear-closed")
                        .radius(function (d) {
                            return rScale(d.percent);
                        })
                        .angle(function (d, i) {
                            return i * angleSlice;
                        });
                    return function () {
                        return interpolate(d);
                    }
                };


                var update = function () {
                    allAxis = (scope.data[0].map(function (i) {
                        return {
                            axis: i.title,
                            value: i.percent
                        }
                    }));
                    total = allAxis.length;
                    angleSlice = Math.PI * 2 / total;

                    drawBackgroundCircles();
                    drawAxis();
                    drawLegend();

                    if (config.roundStrokes) {
                        radarLine
                            .interpolate("cardinal-closed")
                            .tension(config.tension);
                    }


                    // Clear all area wrappers
                    g.selectAll(".ysa-radar-area-wrapper").remove();

                    // Create a wrapper for the areas
                    areaWrapper = g.selectAll(".ysa-radar-area-wrapper")
                        .data(scope.data)
                        .enter().append("g")
                        .attr("class", "ysa-radar-area-wrapper");

                    // Append the backgrounds
                    areaWrapper.append("path")
                        .attr("class", "ysa-radar-area")
                        // .attr('d', function (d) {
                        //     return radarLine(d);
                        // })
                        .style("fill", function (d, i) {
                            return config.color(i);
                        })
                        .style("fill-opacity", config.opacityArea);

                    // Create the outlines
                    areaWrapper.append("path")
                        .attr("class", "ysa-radar-area-stroke")
                        .style("stroke-width", config.strokeWidth + "px")
                        .attr("stroke", function (d, i) {
                            return config.color(i);
                        })
                        .style("fill", "none");

                    var tween = function (d) {
                        return function () {
                            return d3.interpolate(radarLine(d));
                        }
                    }

                    areaWrapper.selectAll('path')
                        .transition()
                        .duration(12000)
                        .attr('d', function (d) {
                            return radarLine(d);
                        });



                    // Append the circlesm and append lines and value under legends on circle hover
                    if (config.compare && scope.data.length >= 2) {
                        drawCircles();
                    }
                };

                // Redraw chart if data updated
                scope.$watch('data', function (value) {
                    console.log(value)
                    update();
                });
            }
        }
    }]);