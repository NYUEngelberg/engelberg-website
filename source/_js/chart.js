const d3 = require('d3');
const kebabCase = require('lodash.kebabcase');
const Chart = {
  legendColors() {
    return [
      '#394FA1',
      '#CF4827',
      '#EABF1E',
      '#00854D',
      '#ED76AD',
      '#20B6EA',
      '#572C86',
      '#EA576C',
      '#26396D',
      '#59AD85',
      '#FCA13D',
      '#449FB7',
      '#D11C88',
      '#B894D3'
    ];
  },
  htmlTableToJson(chart) {
    let data = [];
    let headers = Array.from(chart.firstChild.querySelectorAll('th')).map(th => th.innerHTML);
    // let headers = ['label', 'value'];
    let cells = Array.from(chart.firstChild.querySelectorAll('td')).map(td => td.innerHTML);
    let numRows = cells.length / headers.length; // 6
    let numCols = headers.length; // 2

    let dividedCells = [];
    for (let i = 0; i < cells.length; i += numCols) {
      let subArray = cells.slice(i, i + numCols);
      dividedCells.push(subArray);
    }

    dividedCells.map((container, idx) => {
      let dataContainer = new Object();
      container.forEach((cell, idx) => {
        dataContainer[headers[idx]] = cell;
      });
      data.push(dataContainer);
    });
    return data;
  },
  htmlTableToCsv(chart) {
    let data = [];
    let headers = Array.from(chart.parentElement.querySelector('.table__body').querySelectorAll('th')).map(
      th => th.innerHTML
    );
    // let headers = ['label', 'value'];
    let cells = Array.from(chart.parentElement.querySelector('.table__body').querySelectorAll('td')).map(
      td => td.innerHTML
    );
    let numRows = cells.length / headers.length; // 6
    let numCols = headers.length; // 2

    let dividedCells = [];
    dividedCells += headers.join(',') + '\n';
    for (let i = 0; i < cells.length; i += numCols) {
      let subArray = cells.slice(i, i + numCols);
      dividedCells += subArray.join(',') + '\n';
    }
    return dividedCells;
  },
  gatherTables() {
    let activeTables = document.querySelectorAll('.d3-chart');
    activeTables.forEach(chart => {
      if (chart.classList.contains('d3-horizontal-bar-chart')) {
        this.createHorizontalBarChart(chart);
      } else if (chart.classList.contains('d3-vertical-bar-chart')) {
        this.createBarChart(chart);
      }
    });
  },
  wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
        words = text
          .text()
          .split(/\s+/)
          .reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1, // ems
        y = text.attr('y'),
        dy = parseFloat(text.attr('dy')),
        tspan = text
          .text(null)
          .append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', dy + 'em');
      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > width && line.length > 1) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text
            .append('tspan')
            .attr('x', 0)
            .attr('y', y)
            .attr('dy', ++lineNumber * lineHeight + dy + 'em')
            .text(word);
        }
      }
    });
  },
  formatBarChartData(chart) {
    let csvData = this.htmlTableToCsv(chart);

    let data = Object.assign(d3.csvParse(csvData, d3.autoType));
    // List of subgroups = header of the csv files
    let subgroups = data.columns.slice(1);
    // create the stacks -- column 1 is x axis, row 1 is stacked content
    let stackedData = d3.stack().keys(subgroups)(data);

    let headers = data.columns;
    let groups = d3.map(data, function(data) {
      return data[headers[0]]; //requires the x axis to be the first column
    });
    return {
      subgroups,
      stackedData,
      headers,
      groups
    };
  },
  color(subgroups) {
    const color = key => {
      const scale = d3
        .scaleOrdinal()
        .domain(subgroups)
        .range(this.legendColors());
      return scale(key);
    };
    return color;
  },
  createBarChart(chart) {
    let dataUnit = chart.parentElement.getAttribute('data-unit');
    // https://observablehq.com/@d3/stacked-bar-chart/2
    // https://d3-graph-gallery.com/barplot.html

    let { subgroups, stackedData, headers, groups } = this.formatBarChartData(chart);

    const color = this.color(subgroups);

    this.appendChartContainer(chart);
    let chartAttrs = this.getBarChartAttributes();

    let tooltip = d3
      .select(`#${chart.id}`)
      .append('div')
      .attr('class', `tooltip`);
    // interactive
    let mouseover = function(d) {
      let keySlug = kebabCase(d3.select(this.parentElement).datum().key);
      d3.selectAll(`.${chart.id}.chart-item`).style('opacity', 0.2);
      d3.selectAll(`.${chart.id}.legend-button-container`).style('opacity', 0.2);

      d3.select(this).style('opacity', 1);
      d3.select(`.${chart.id}.legend-button-container[data-key="${keySlug}"]`).style('opacity', 1);
      tooltip.style('display', 'inline-block');
    };

    let mouseleave = function(d) {
      d3.selectAll(`.${chart.id}`).style('opacity', 1);
      tooltip.style('display', 'none');
    };

    let mousemove = function(e, d) {
      let unit = dataUnit === 'percent' ? '%' : '';
      let tooltipText = `<p class="tooltip-text"><span class="bold">${this.getAttribute(
        'data-type'
      )}</span></br>${this.getAttribute('data-prop')}: <span class="data-value">${this.getAttribute(
        'data-value'
      )}${unit}</span></p>`;
      tooltip
        .html(tooltipText)
        .style('left', e.pageX - 120 + 'px')
        .style('top', e.pageY - 100 + 'px');
    };

    // create svg and append under the table

    let svg = d3
      .select(`#${chart.id}-chart`)
      .append('svg')
      .attr('height', chartAttrs.height - chartAttrs.margin.top - chartAttrs.margin.bottom)
      .attr(
        'viewBox',
        `0 0 ${chartAttrs.width + chartAttrs.margin.left + chartAttrs.margin.right} ${chartAttrs.height +
          chartAttrs.margin.top +
          chartAttrs.margin.bottom}`
      )
      .attr('preserveAspectRatio', 'xMinYMin')
      .attr('class', 'barchart-svg')
      .append('g')
      .attr('transform', 'translate(' + chartAttrs.margin.left + ',' + chartAttrs.margin.top + ')');
    // Add x axis

    console.log(groups.length, 'len');

    const barPadding = groups.length > 5 ? [0.1] : [0.5];
    const x = d3
      .scaleBand()
      .domain(groups)
      .range([0, chartAttrs.width])
      .padding(barPadding);

    svg
      .append('g')
      .attr('transform', 'translate(0,' + chartAttrs.height + ')')
      .call(
        d3
          .axisBottom(x)
          .tickPadding(6)
          .tickSizeOuter(0)
          .tickSizeInner(0)
      )
      .call(g => g.selectAll('.tick text').call(this.wrap, x.bandwidth()));

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(stackedData, d => {
          // get yMax for appropriate ticks
          return d3.max(d, d => d[1]);
        })
      ])
      .range([chartAttrs.height, 0]);

    let axisFormat = d => {
      return dataUnit === 'percent' ? d / 1 + '%' : d;
    };
    svg
      .append('g')
      .call(
        d3
          .axisRight(y)
          .tickSize(chartAttrs.width)
          .tickFormat(d => axisFormat(d))
      )
      .call(g => g.select('.domain').remove())
      .call(g =>
        g
          .selectAll('.tick:not(:first-of-type) line')
          .attr('stroke-opacity', 0.2)
          .attr('stroke-solid', '2,2')
      )
      .call(g =>
        g
          .selectAll('.tick text')
          .attr('x', -20)
          .attr('dy', 3)
      );

    svg
      .append('g')
      .selectAll('g')
      // Enter in the stack data = loop key per key = group per group
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', `bar ${chart.id}`)
      .attr('data-key', function(d) {
        return kebabCase(d.key);
      })
      .attr('data-raw-key', function(d) {
        return d.key;
      })
      .selectAll('rect')
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function(d) {
        return d;
      })
      .enter()
      .append('rect')
      .attr('class', function(d) {
        return `${chart.id} chart-item`;
      })
      .attr('data-type', function(d) {
        return d.data[headers[0]];
      })
      .attr('x', function(d) {
        return x(d.data[headers[0]]);
      })
      .attr('y', function(d) {
        return y(d[1]);
      })
      .attr('height', function(d) {
        return y(d[0]) - y(d[1]);
      })
      .attr('width', x.bandwidth())
      .attr('data-prop', function(d) {
        return this.parentElement.getAttribute('data-raw-key');
      })
      .attr('data-value', d => {
        return d[1] - d[0];
      })
      .attr('fill', function(d) {
        return color(this.parentElement.getAttribute('data-raw-key'));
      })
      .on('mouseover', mouseover)
      .on('mouseleave', mouseleave)
      .on('mousemove', mousemove);

    // append legend container
    if (subgroups.length > 1) {
      let legendContainer = this.appendLegendContainer(chart);
      this.createLegend(legendContainer, subgroups, chart);
    }
  },
  createHorizontalBarChart(chart) {
    let dataUnit = chart.parentElement.getAttribute('data-unit');
    let { subgroups, stackedData, headers, groups } = this.formatBarChartData(chart);
    // color palette generated by number of subgroups
    const color = this.color(subgroups);

    this.appendChartContainer(chart);
    let chartAttrs = this.getHBarChartAttributes();

    // interactive
    let tooltip = d3
      .select(`#${chart.id}`)
      .append('div')
      .attr('class', `tooltip`)
      .attr('id', `tooltip-${chart.id}`);

    let mouseover = function(d) {
      let keySlug = kebabCase(d3.select(this.parentElement).datum().key);
      d3.selectAll(`.${chart.id}.chart-item`).style('opacity', 0.2);
      d3.selectAll(`.${chart.id}.legend-button-container`).style('opacity', 0.2);

      d3.select(this).style('opacity', 1);
      d3.select(`.${chart.id}.legend-button-container[data-key="${keySlug}"]`).style('opacity', 1);
      tooltip.style('display', 'inline-block');
    };

    let mouseleave = function(d) {
      d3.selectAll(`.${chart.id}`).style('opacity', 1);
      tooltip.style('display', 'none');
    };

    let mousemove = function(e, d) {
      let unit = dataUnit === 'percent' ? '%' : '';
      let tooltipText = `<p class="tooltip-text"><span class="bold">${this.getAttribute(
        'data-type'
      )}</span></br>${this.getAttribute('data-prop')}: <span class="data-value">${this.getAttribute(
        'data-value'
      )}${unit}</span></p>`;
      tooltip
        .html(tooltipText)
        .style('left', e.pageX - 120 + 'px')
        .style('top', e.pageY - 120 + 'px');
    };

    // create svg and append under the table
    let svg = d3
      .select(`#${chart.id}-chart`)
      .append('svg')
      .attr('width', chartAttrs.width - chartAttrs.margin.left - chartAttrs.margin.right)
      .attr(
        'viewBox',
        `0 0 ${chartAttrs.width + chartAttrs.margin.left + chartAttrs.margin.right} ${chartAttrs.height +
          chartAttrs.margin.top +
          chartAttrs.margin.bottom}`
      )
      .attr('preserveAspectRatio', 'xMinYMin')
      .attr('class', 'horizontal-barchart-svg')
      .append('g')
      .attr('transform', 'translate(' + chartAttrs.margin.left + ',' + chartAttrs.margin.top + ')');

    const x = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(stackedData, d => {
          return d3.max(d, d => d[1]);
        })
      ])
      .range([0, chartAttrs.width]);

    let axisFormat = d => {
      return dataUnit === 'percent' ? d / 1 + '%' : d;
    };

    svg
      .append('g')
      .attr('transform', 'translate(0,' + chartAttrs.height + ')')
      .call(
        d3
          .axisBottom(x)
          .tickSize(-chartAttrs.height)
          .tickFormat(d => axisFormat(d))
      )
      .call(g => g.select('.domain').remove())
      .call(g =>
        g
          .selectAll('.tick:not(:first-of-type) line')
          .attr('stroke-opacity', 0.2)
          .attr('stroke-solid', '2,2')
      );

    const barPadding = groups.length > 4 ? [0.1] : [0.4];
    const y = d3
      .scaleBand()
      .domain(groups)
      .padding(barPadding)
      .range([0, chartAttrs.height]);

    svg
      .append('g')
      .call(
        d3
          .axisLeft(y)
          .tickSizeOuter(0)
          .tickSizeInner(0)
          
          
      )
      .selectAll('.tick text')
      .call(this.wrap, 100)
      .selectAll('tspan')
      .attr('dx', -10)

    svg
      .append('g')
      .selectAll('g')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', `bar ${chart.id}`)
      .attr('data-key', function(d) {
        return kebabCase(d.key);
      })
      .attr('data-raw-key', function(d) {
        return d.key;
      })
      .selectAll('rect')
      .data(function(d) {
        return d;
      })
      .enter()
      .append('rect')
      .attr('class', function(d) {
        return `${chart.id} chart-item`;
      })
      .attr('data-type', function(d) {
        return d.data[headers[0]];
      })
      .attr('x', function(d) {
        return x(d[0]);
      })
      .attr('y', function(d) {
        return y(d.data[headers[0]]);
      })
      .attr('width', function(d) {
        return x(d[1]) - x(d[0]);
      })
      .attr('height', y.bandwidth())
      .attr('data-prop', function(d) {
        return this.parentElement.getAttribute('data-raw-key');
      })
      .attr('data-value', d => {
        return d[1] - d[0];
      })
      .attr('fill', function(d) {
        return color(this.parentElement.getAttribute('data-raw-key'));
      })
      .on('mouseover', mouseover)
      .on('mouseleave', mouseleave)
      .on('mousemove', mousemove);

    // decorater ticks

    // append legend container

    if (subgroups.length > 1) {
      let legendContainer = this.appendLegendContainer(chart);
      this.createLegend(legendContainer, subgroups, chart);
    }
  },
  createLegend(legendContainer, subgroups, chart) {
    let color = this.color(subgroups);
    subgroups.forEach(group => {
      let legendElContainer = document.createElement('div');
      legendElContainer.setAttribute('class', `legend-button-container ${chart.id}`);

      legendElContainer.addEventListener('mouseover', e => {
        let keySlug = e.target.dataset.key;
        d3.selectAll(`.${chart.id}.bar`).style('opacity', 0.2);
        d3.selectAll(`.${chart.id}.legend-button-container`).style('opacity', 0.2);

        d3.selectAll(`.${chart.id}[data-key='${keySlug}']`).style('opacity', 1);
      });

      legendElContainer.addEventListener('mouseleave', e => {
        d3.selectAll(`.${chart.id}`).style('opacity', 1);
      });

      legendElContainer.setAttribute('data-key', kebabCase(group));

      let buttonEl = document.createElement('button');
      buttonEl.setAttribute('id', `${kebabCase(group)}-button`);
      buttonEl.setAttribute('class', '${chart.id} legend-button');
      buttonEl.style.backgroundColor = color(group);
      legendElContainer.insertAdjacentElement('beforeend', buttonEl);

      legendText = document.createElement('span');
      legendText.setAttribute('class', `.${chart.id} legend-button-text`);
      legendText.innerText = group;

      legendElContainer.insertAdjacentElement('beforeend', legendText);

      legendContainer.insertAdjacentElement('beforeend', legendElContainer);
    });
  },
  getBarChartAttributes() {
    const defaultWidth = 600;
    const defaultHeight = 400;
    const margin = {
      top: 20,
      right: 0,
      bottom: 60,
      left: 40
    };

    return {
      margin,
      width: defaultWidth,
      height: defaultHeight
    };
  },
  getHBarChartAttributes() {
    const defaultWidth = 600;
    const defaultHeight = 450;
    const margin = {
      top: 20,
      right: 50,
      bottom: 40,
      left: 170
    };

    return {
      margin,
      width: defaultWidth,
      height: defaultHeight
    };
  },
  appendLegendContainer(chart) {
    let chartLocation = document.getElementById(`${chart.id}-chart`);
    let legendContainer = document.createElement('div');

    legendContainer.setAttribute('id', `${chart.id}-legend`);

    chart.classList.contains(`d3-horizontal-bar-chart`)
      ? legendContainer.setAttribute('class', `legend horizontal`)
      : legendContainer.setAttribute('class', `legend`);

    chartLocation.insertAdjacentElement('beforeend', legendContainer);
    return legendContainer;
  },

  appendChartContainer(chart) {
    let chartLocation = document.getElementById(`${chart.id}`);
    let visualizationContainer = document.createElement('div');
    visualizationContainer.setAttribute('id', `${chart.id}-chart`);
    visualizationContainer.setAttribute('class', 'visualization');
    chartLocation.insertAdjacentElement('beforebegin', visualizationContainer);
  },

  addUnitsToTable() {
    let percentTables = document.querySelectorAll(`.chart-container[data-unit='percent']`);

    let tds = Array.from(percentTables).map(table => table.querySelectorAll('tr > td:not(:first-of-type)'));
    tds.forEach(td => {
      td.forEach(item => {
        return (item.innerText = `${item.innerText}%`);
      });
    });
  },
  init() {
    this.gatherTables();
    this.addUnitsToTable();
  }
};

module.exports = Chart;
