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

                var chartEl = d3.select(element[0]);
                var config = angular.extend({}, defaultConfig, scope.config || {});
                var classNames = {
                    chart: 'radar' + config.id,
                    group: 'ysa-radar-group',
                    axisWrapper: 'ysa-radar-axis-wrapper',
                    glowCircle: 'glow-circle',
                    average: 'ysa-radar-average',
                    gradient: 'ysa-radar-gradient',
                    levelsWrapper: 'ysa-radar-levels',
                    level: 'ysa-radar-levels__item',
                    legendsWrapper: 'ysa-radar-legends',
                    legend: 'ysa-radar-legends__item',
                    hidden: 'ysa-radar-hidden',
                    arrow: 'legend-arrow',
                    progressWrapper: 'ysa-radar-progress-wrapper',
                    progress: 'ysa-radar-progress',
                    circlesWrapper: 'ysa-radar-circles',
                    circle: 'ysa-radar-circles__item',
                    areaWrapper: 'ysa-radar-area-wrapper',
                    area: 'ysa-radar-area'
                };

                var previousData = [];
                var getColor = d3.scale.ordinal().range(config.colors);
                var maxValue = 100; // TODO: Узнать как считать
                var total = 0; // The number of different axes
                var radius = Math.min(config.w / 2, config.h / 2); // Radius of the outermost circle
                var Format = d3.format('%'); // Percentage formatting
                var angleSlice = 0; // The width in radians of each "slice"

                var svg;
                var axis;
                var radarGroup;
                var averageText;
                var filter;
                var areaWrapper;
                var areas;
                var legendsWrapper;
                var progressWrapper;
                var axisGrid;

                // Scale for the radius
                var rScale = d3.scale.linear()
                    .range([0, radius])
                    .domain([0, config.domain]);

                var rScaleLegend = d3.scale.linear()
                    .range([0, radius])
                    .domain([0, config.domain]);

                // The radial line function
                var radarLine = d3.svg.line.radial()
                    .interpolate('cardinal-closed')
                    .tension(config.tension)
                    .radius(function (d) {
                        return rScale(d.percent);
                    })
                    .angle(function (d, i) {
                        return i * angleSlice;
                    });

                // Initiate the radar chart SVG
                svg = chartEl.append('svg')
                    .attr('class', classNames.chart)
                    .attr('width', config.w + config.margin.left + config.margin.right + 100)
                    .attr('height', config.h + config.margin.top + config.margin.bottom + 100);

                // Append a g element
                radarGroup = svg.append('g')
                    .attr('class', classNames.group)
                    .attr('transform', 'translate(' + (config.w / 2 + config.margin.left + 50) + ',' + (config.h / 2 + config.margin.top + 50) + ')');

                // Filter for the outside glow
                filter = radarGroup.append('defs')
                    .append('radialGradient')
                    .attr('class', classNames.gradient).attr('id', 'glow')
                    .attr('x1', '50%').attr('y1', '100%')
                    .attr('x2', '50%').attr('y2', '100%');

                filter.append("stop")
                    .attr('class', classNames.gradient + '__first')
                    .attr('offset', '50%');

                filter.append('stop')
                    .attr('class', classNames.gradient + '__second')
                    .attr('offset', '130%');

                radarGroup.append('circle')
                    .attr('class', classNames.glowCircle)
                    .attr('r', radius + 30)
                    .style('fill-opacity', '0.4')
                    .style('fill', 'url(#glow)');

                // Wrapper for the grid & axes
                axisGrid = radarGroup
                    .append('g')
                    .attr('class', classNames.axisWrapper);

                // Append average
                if (config.average) {
                    averageText = radarGroup.append('text')
                        .attr('class', classNames.average)
                        .attr('dy', '0.3em')
                        .text(scope.average);
                }

                // Draw the background circles
                var drawBackgroundCircles = function () {
                    // Clear all levels
                    radarGroup.selectAll('.' + classNames.levelsWrapper).remove();

                    var levels = radarGroup.append('g')
                        .attr('class', classNames.levelsWrapper);

                    for (var j = 0; j < config.levels; j++) {
                        var levelFactor = config.factor * radius * ((j + 1) / config.levels);
                        var level = levels.append('g')
                            .attr('class', classNames.level)
                            .attr('data-level', j);

                        level.selectAll('line')
                            .data(scope.data[0])
                            .enter()
                            .append('svg:line')
                            .attr('x1', function (d, i) {
                                return levelFactor * (1 - config.factor * Math.sin(i * config.radians / total));
                            })
                            .attr('y1', function (d, i) {
                                return levelFactor * (1 - config.factor * Math.cos(i * config.radians / total));
                            })
                            .attr('x2', function (d, i) {
                                return levelFactor * (1 - config.factor * Math.sin((i + 1) * config.radians / total));
                            })
                            .attr('y2', function (d, i) {
                                return levelFactor * (1 - config.factor * Math.cos((i + 1) * config.radians / total));
                            })
                            .attr('transform', 'translate(' + (-levelFactor) + ', ' + (-levelFactor) + ')');
                    }
                };

                var updateProgressBar = function (legend, percent) {
                    var rect = legend.selectAll('.ysa-radar-progress__rect');
                    var textPercent = legend.selectAll('tspan');

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

                var drawLegend = function () {
                    var scaleLegend = rScaleLegend(maxValue * config.labelFactor);
                    var getCoord = function (i) {
                        return {
                            x: scaleLegend * Math.cos(angleSlice * i - Math.PI / 2),
                            y: scaleLegend * Math.sin(angleSlice * i - Math.PI / 2)
                        }
                    }

                    radarGroup.select('.' + classNames.legendsWrapper).remove();
                    legendsWrapper = radarGroup.append('g').attr('class', classNames.legendsWrapper);

                    var legend = legendsWrapper.selectAll('.' + classNames.legend)
                        .data(scope.data[0])
                        .enter().append('g')
                        .attr('class', classNames.legend)
                        .attr('data-legend', function (d, i) {
                            return i
                        })
                        .attr('transform', function (d, i) {
                            return 'translate(' + getCoord(i).x + ',' + getCoord(i).y + ')'
                        });

                    // Определяем откуда должен начинаться текст, если это средний элемент или первый, и четное количество элементов
                    // то ставим middle, что бы текст отрисовался посередине
                    legend.append('text')
                        .attr('text-anchor', function (d, i) {
                            var anchor = 'start';
                            var isFirstOrMiddle = Math.floor(scope.data[0].length / 2) === i || 0 === i;
                            if (isFirstOrMiddle && scope.data[0].length % 2 === 0) {
                                anchor = 'middle';
                            } else {
                                anchor = getCoord(i).x >= 0 ? 'start' : 'end'
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
                        legend.append('g')
                            .classed(classNames.hidden, function (d) {
                                return d.change === 0;
                            })
                            .attr('transform', function (d, i) {
                                var text = this.parentNode.querySelector('text');
                                var textWidth = getCoord(i).x >= 0 ? text.getBoundingClientRect().width + 10 : 10;
                                var isFirstOrMiddle = Math.floor(scope.data[0].length / 2) === i || 0 === i;
                                if (isFirstOrMiddle && scope.data[0].length % 2 === 0) {
                                    textWidth = textWidth / 2;
                                }
                                return 'translate(' + textWidth + ',-11)'
                            })
                            .append('path')
                            .attr('d', 'M10 0H3c-.6 0-1 .4-1 1s.4 1 1 1h4.6l-7 7L2 10.4l7-7V8c0 .6.4 1 1 1s1-.4 1-1V1c0-.6-.4-1-1-1z')
                            .attr('class', classNames.arrow)
                            .classed(classNames.arrow + '--down', function (d) {
                                return d.change < 0;
                            });
                    }

                    // Рисуем progress bar, в случае, если config.compare === true,
                    // то изменяем значение при наведении на точку
                    progressWrapper = legend.append('g')
                        .attr('class', classNames.progressWrapper)
                        .attr('transform', function (d, i) {
                            var text = this.parentNode.querySelector('text');
                            var textWidth = getCoord(i).x >= 0 ? 0 : -(text.getBoundingClientRect().width) + 1;
                            var isFirstOrMiddle = Math.floor(scope.data[0].length / 2) === i || 0 === i;
                            if (isFirstOrMiddle && scope.data[0].length % 2 === 0) {
                                textWidth = -(text.getBoundingClientRect().width / 2);
                            }
                            return 'translate(' + textWidth + ',15)'
                        });

                    progressWrapper.append('rect')
                        .attr('class', classNames.progress)
                        .attr('width', config.labelIndicatorWidth)
                        .attr('x', 0);

                    progressWrapper.append('rect')
                        .attr('class', classNames.progress + '__rect')
                        .attr('width', function(d, i) {
                            return previousData[0] && previousData[0][i] ? previousData[0][i].percent * (config.labelIndicatorWidth / 100) : 0
                        })
                        .attr('x', 0);

                    updateProgressBar(legend);

                    // Скрываем все progress bars и проценты
                    if (config.compare) {
                        progressWrapper.attr('opacity', 0);
                        legendsWrapper.selectAll('tspan').style('opacity', 0);
                    }
                };


                // Create the straight lines radiating outward from the center
                var drawAxis = function () {
                    var scaleLegend = rScaleLegend(maxValue * 1.1);
                    axisGrid.selectAll(classNames.axisWrapper).remove();
                    axis = axisGrid.selectAll(classNames.axisWrapper)
                        .data(scope.data[0])
                        .enter()
                        .append('svg:line')
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', function (d, i) {
                            return scaleLegend * Math.cos(angleSlice * i - Math.PI / 2);
                        })
                        .attr('y2', function (d, i) {
                            return scaleLegend * Math.sin(angleSlice * i - Math.PI / 2);
                        });
                };

                var drawCircles = function () {
                    radarGroup.selectAll('.' + classNames.circlesWrapper).remove();

                    var circlesWrapper = radarGroup.append('g')
                        .attr('class', classNames.circlesWrapper);

                    var mouseoverHandler = function (d, i) {
                        // Ищем ноду по индексу, и показываем ее
                        var legend = legendsWrapper.select('.' + classNames.legend + '[data-legend="' + i + '"]');

                        legend.select('tspan')
                            .transition()
                            .duration(200)
                            .style('opacity', 1);

                        legend.select('.' + classNames.progressWrapper)
                            .transition()
                            .duration(200)
                            .style('opacity', 1);

                        updateProgressBar(legend, d.percent);

                        d3.select(this)
                            .transition()
                            .duration(200)
                            .style('opacity', 1);
                    }

                    var mouseoutHandler = function (d, i) {
                        // Ищем ноду по индексу, и скрываем ее
                        var legend = legendsWrapper.select('.' + classNames.legend + '[data-legend="' + i + '"]');

                        legend.select('tspan')
                            .transition()
                            .duration(200)
                            .style('opacity', 0);

                        legend.select('.' + classNames.progressWrapper)
                            .transition()
                            .duration(200)
                            .style('opacity', 0);

                        d3.select(this)
                            .transition()
                            .duration(200)
                            .style('opacity', 0);
                    }

                    // Рисуем точки на вершинах
                    circlesWrapper.selectAll('g')
                        .data(scope.data)
                        .enter().append('svg:g')
                        .selectAll('.' + classNames.circle)
                        .data(function (d) {
                            return d
                        })
                        .enter()
                        .append('svg:circle')
                        .attr('class', classNames.circle)
                        .attr('r', config.dotRadius)
                        .attr('cx', function (d, i) {
                            return rScale(d.percent) * Math.cos(angleSlice * i - Math.PI / 2);
                        })
                        .attr('cy', function (d, i) {
                            return rScale(d.percent) * Math.sin(angleSlice * i - Math.PI / 2);
                        })
                        .style('opacity', '0')
                        .on('mouseover', mouseoverHandler)
                        .on('mouseout', mouseoutHandler);
                };

                var drawArea = function () {
                    radarGroup.selectAll('.' + classNames.areaWrapper).remove();

                    // Create a wrapper for the areas
                    areaWrapper = radarGroup.selectAll('.' + classNames.areaWrapper)
                        .data(scope.data)
                        .enter().append('g')
                        .attr('class', classNames.areaWrapper);

                    // Append the backgrounds
                    areaWrapper.append("path")
                        .attr('class', classNames.area)
                        .style('fill', function (d, i) {
                            return getColor(i);
                        })
                        .style('stroke', function (d, i) {
                            return getColor(i);
                        })
                        .style('fill-opacity', config.opacityArea)
                        .style('stroke-width', config.strokeWidth);


                    areas = areaWrapper.selectAll('path')
                        .transition()
                        .duration(600)
                        .attrTween('d', function (d, i) {
                            var currentPath = previousData && previousData[i] ? radarLine(previousData[i]) : d3.select(this).attr('d');
                            var newPath = radarLine(d);
                            return d3.interpolatePath(currentPath, newPath);
                        });
                };


                var update = function () {
                    drawBackgroundCircles();
                    drawAxis();
                    drawLegend();
                    drawArea();

                    // Append the circlesm and append lines and value under legends on circle hover
                    if (config.compare && scope.data.length >= 2) {
                        drawCircles();
                    }
                };

                // Redraw chart if data updated
                scope.$watch('data', function (value, prevValue) {
                    if (!scope.data || !scope.data[0]) {
                        throw new Error('Нет данных для построения графика');
                        return false;
                    }
                    if (prevValue && prevValue.length) {
                        previousData = prevValue;
                    }
                    total = scope.data[0].length;
                    angleSlice = Math.PI * 2 / total;
                    update();
                });

                // Update average
                scope.$watch('average', function (value) {
                    averageText.text(value)
                });
            }
        }
    }]);