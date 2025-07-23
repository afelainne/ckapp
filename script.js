document.addEventListener('DOMContentLoaded', () => {
  // Elementos de controle
  const rowsInput = document.getElementById('rows');
  const colsInput = document.getElementById('cols');
  const decRowsBtn = document.getElementById('dec-rows');
  const incRowsBtn = document.getElementById('inc-rows');
  const decColsBtn = document.getElementById('dec-cols');
  const incColsBtn = document.getElementById('inc-cols');

  const selRowInput = document.getElementById('selRow');
  const selColInput = document.getElementById('selCol');

  const vertRangeSlider = document.getElementById('vertRange');
  const vertRangeVal = document.getElementById('vertRangeVal');

  const horizRangeSlider = document.getElementById('horizRange');
  const horizRangeVal = document.getElementById('horizRangeVal');

  const intensitySlider = document.getElementById('intensity');
  const intensityVal = document.getElementById('intensityVal');

  // Slider para o tamanho da célula selecionada
  const cellSizeSlider = document.getElementById('cellSize');
  const cellSizeVal = document.getElementById('cellSizeVal');

  const paintColorPicker = document.getElementById('paintColor');
  const togglePaintBtn = document.getElementById('togglePaint');
  const eraserBtn = document.getElementById('eraserBtn');

  const randomSizeBtn = document.getElementById('randomSizeBtn');
  const persistBtn = document.getElementById('persistBtn');

  // Novo slider de força do Random Size
  const randomStrengthSlider = document.getElementById('randomStrength');
  const randomStrengthVal = document.getElementById('randomStrengthVal');

  randomStrengthSlider.addEventListener('input', () => {
    randomStrengthVal.textContent = randomStrengthSlider.value;
  });

  let paintingMode = true;
  let eraserMode = false;
  let randomSizeMode = false;
  let persistentMode = false;
  let isMouseDown = false;
  togglePaintBtn.textContent = 'Pintura ON';

  const updateGridBtn = document.getElementById('updateGrid');
  const exportPngBtn = document.getElementById('exportPng');
  const exportSvgBtn = document.getElementById('exportSvg');

  const gridContainer = document.getElementById('gridContainer');

  let tableElement = null;
  const fixedBaseSize = 40;
  let baseSize = fixedBaseSize;
  let vertRange = parseInt(vertRangeSlider.value);
  let horizRange = parseInt(horizRangeSlider.value);
  let intensity = parseFloat(intensitySlider.value);

  let currentRandomVert = vertRange;
  let currentRandomHoriz = horizRange;
  let currentRandomIntensity = intensity;
  // Alteração: usar 0 como mínimo para permitir tamanhos menores, se desejado
  let targetRandomVert = randomBetween(0, parseInt(vertRangeSlider.max));
  let targetRandomHoriz = randomBetween(0, parseInt(horizRangeSlider.max));
  let targetRandomIntensity = parseFloat((Math.random() * (parseFloat(intensitySlider.max) - parseFloat(intensitySlider.min)) + parseFloat(intensitySlider.min)).toFixed(1));

  let selectedCellSizeOverride = parseInt(cellSizeSlider.value);

  let persistentSelections = [];
  let cellColors = {};

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getColumnLetter(n) {
    let letter = '';
    while (n >= 0) {
      letter = String.fromCharCode((n % 26) + 65) + letter;
      n = Math.floor(n / 26) - 1;
    }
    return letter;
  }

  function columnLetterToIndex(letter) {
    letter = letter.toUpperCase();
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
      index *= 26;
      index += letter.charCodeAt(i) - 64;
    }
    return index - 1;
  }

  function highlightSelection(table, targetRow, targetCol) {
    const rowHeaders = table.querySelectorAll('tr:not(:first-child) > th');
    rowHeaders.forEach(th => th.classList.remove('selected-header'));
    const colHeaders = table.querySelectorAll('tr:first-child > th:not(:first-child)');
    colHeaders.forEach(th => th.classList.remove('selected-header'));
    const allCells = table.querySelectorAll('td');
    allCells.forEach(td => td.classList.remove('selected-cell'));

    const selectedRowHeader = rowHeaders[targetRow];
    if (selectedRowHeader) selectedRowHeader.classList.add('selected-header');
    const selectedColHeader = colHeaders[targetCol];
    if (selectedColHeader) selectedColHeader.classList.add('selected-header');
    const selectedTd = table.querySelector(`td[data-row="${targetRow}"][data-col="${targetCol}"]`);
    if (selectedTd) selectedTd.classList.add('selected-cell');
  }

  function createGrid() {
    gridContainer.innerHTML = '';
    tableElement = document.createElement('table');
    tableElement.style.width = '100%';
    tableElement.style.height = '100%';

    const rows = parseInt(rowsInput.value);
    const cols = parseInt(colsInput.value);

    const headerRow = document.createElement('tr');
    const cornerTh = document.createElement('th');
    cornerTh.textContent = '';
    headerRow.appendChild(cornerTh);
    for (let c = 0; c < cols; c++) {
      const th = document.createElement('th');
      th.textContent = getColumnLetter(c);
      headerRow.appendChild(th);
    }
    tableElement.appendChild(headerRow);

    for (let r = 0; r < rows; r++) {
      const tr = document.createElement('tr');
      const rowHeader = document.createElement('th');
      rowHeader.textContent = r + 1;
      tr.appendChild(rowHeader);

      for (let c = 0; c < cols; c++) {
        const td = document.createElement('td');
        td.dataset.row = r;
        td.dataset.col = c;
        td.style.width = baseSize + 'px';
        td.style.height = baseSize + 'px';

        const key = `${r}-${c}`;
        if (cellColors[key]) {
          td.style.backgroundColor = cellColors[key];
        }

        td.addEventListener('mousedown', () => {
          isMouseDown = true;
          if (eraserMode) {
            td.style.backgroundColor = '';
            delete cellColors[key];
          } else if (paintingMode) {
            td.style.backgroundColor = paintColorPicker.value;
            cellColors[key] = paintColorPicker.value;
          }
        });
        td.addEventListener('mouseover', () => {
          if (isMouseDown) {
            if (eraserMode) {
              td.style.backgroundColor = '';
              delete cellColors[key];
            } else if (paintingMode) {
              td.style.backgroundColor = paintColorPicker.value;
              cellColors[key] = paintColorPicker.value;
            }
          }
        });
        td.addEventListener('mouseup', () => {
          isMouseDown = false;
        });

        td.addEventListener('dblclick', () => {
          const clickedRow = parseInt(td.dataset.row);
          const clickedCol = parseInt(td.dataset.col);
          selRowInput.value = clickedRow + 1;
          selColInput.value = getColumnLetter(clickedCol);
          updateRegion();

          if (persistentMode) {
            const existingIndex = persistentSelections.findIndex(obj => obj.row === clickedRow && obj.col === clickedCol);
            if (existingIndex >= 0) {
              persistentSelections.splice(existingIndex, 1);
            } else {
              let rowHeader = tableElement.querySelector(`tr:nth-child(${clickedRow + 1}) th:first-child`);
              let colHeader = tableElement.querySelector(`tr:first-child th:nth-child(${clickedCol + 2})`);
              let computedRowHeight = rowHeader ? rowHeader.offsetHeight : baseSize * intensity;
              let computedColWidth = colHeader ? colHeader.offsetWidth : baseSize * intensity;
              persistentSelections.push({
                row: clickedRow,
                col: clickedCol,
                rowHeight: computedRowHeight,
                colWidth: computedColWidth
              });
            }
            updateRegion();
          }
        });

        tr.appendChild(td);
      }
      tableElement.appendChild(tr);
    }
    gridContainer.appendChild(tableElement);
    updateRegion();
  }

  function updateRegion() {
    if (!tableElement) return;

    const MAX_ROWS = 70;
    const MAX_COLS = 70;
    const containerRect = gridContainer.getBoundingClientRect();
    baseSize = Math.floor(Math.min(
      containerRect.width / (MAX_COLS + 1),
      containerRect.height / (MAX_ROWS + 1)
    ));
    
    const rows = parseInt(rowsInput.value);
    const cols = parseInt(colsInput.value);
    
    let selRow = Math.min(Math.max(1, parseInt(selRowInput.value)), rows);
    let selCol = columnLetterToIndex(selColInput.value);
    selCol = Math.min(Math.max(0, selCol), cols - 1);
    selRowInput.value = selRow;
    selColInput.value = getColumnLetter(selCol);
    const targetRow = selRow - 1;
    const targetCol = selCol;
    const legendSize = baseSize;
    const headerRowHeight = legendSize;

    // Use o valor do slider 'randomStrength' para controlar o lerpFactor
    const lerpFactor = parseFloat(randomStrengthSlider.value);

    let currentVert, currentHoriz, currentIntensity;
    if (randomSizeMode) {
      currentRandomVert += lerpFactor * (targetRandomVert - currentRandomVert);
      currentRandomHoriz += lerpFactor * (targetRandomHoriz - currentRandomHoriz);
      currentRandomIntensity += lerpFactor * (targetRandomIntensity - currentRandomIntensity);
      if (Math.abs(targetRandomVert - currentRandomVert) < 0.5) {
        targetRandomVert = randomBetween(0, parseInt(vertRangeSlider.max));
      }
      if (Math.abs(targetRandomHoriz - currentRandomHoriz) < 0.5) {
        targetRandomHoriz = randomBetween(0, parseInt(horizRangeSlider.max));
      }
      if (Math.abs(targetRandomIntensity - currentRandomIntensity) < 0.1) {
        targetRandomIntensity = parseFloat((Math.random() * (parseFloat(intensitySlider.max) - parseFloat(intensitySlider.min)) + parseFloat(intensitySlider.min)).toFixed(1));
      }
      currentVert = currentRandomVert;
      currentHoriz = currentRandomHoriz;
      currentIntensity = currentRandomIntensity;
    } else {
      currentVert = vertRange;
      currentHoriz = horizRange;
      currentIntensity = intensity;
    }

    let colWidths = [];
    for (let c = 0; c < cols; c++) {
      if (c === targetCol) {
        colWidths[c] = baseSize * currentIntensity;
      } else if (Math.abs(c - targetCol) <= currentHoriz) {
        colWidths[c] = baseSize * (1 + (currentIntensity - 1) / 2);
      } else {
        colWidths[c] = baseSize;
      }
    }

    let rowHeights = [];
    for (let r = 0; r < rows; r++) {
      if (r === targetRow) {
        rowHeights[r] = baseSize * currentIntensity;
      } else if (Math.abs(r - targetRow) <= currentVert) {
        rowHeights[r] = baseSize * (1 + (currentIntensity - 1) / 2);
      } else {
        rowHeights[r] = baseSize;
      }
    }

    if (selectedCellSizeOverride !== null) {
      rowHeights[targetRow] = selectedCellSizeOverride;
      colWidths[targetCol] = selectedCellSizeOverride;
    }

    const headerRow = tableElement.querySelector('tr');
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th');
      headerCells.forEach((cell, index) => {
        if (index === 0) {
          cell.style.width = legendSize + 'px';
          cell.style.height = headerRowHeight + 'px';
        } else {
          let colIndex = index - 1;
          cell.style.width = colWidths[colIndex] + 'px';
          cell.style.height = headerRowHeight + 'px';
        }
      });
    }

    const dataRows = tableElement.querySelectorAll('tr:not(:first-child)');
    dataRows.forEach((row, rIndex) => {
      const cells = row.querySelectorAll('td, th');
      cells.forEach((cell, index) => {
        if (index === 0) {
          cell.style.width = legendSize + 'px';
          cell.style.height = rowHeights[rIndex] + 'px';
        } else {
          let colIndex = index - 1;
          cell.style.width = colWidths[colIndex] + 'px';
          cell.style.height = rowHeights[rIndex] + 'px';
        }
      });
    });

    highlightSelection(tableElement, targetRow, targetCol);
  }

  let randomUpdatePending = false;
  gridContainer.addEventListener('mousemove', () => {
    if (randomSizeMode && !randomUpdatePending) {
      randomUpdatePending = true;
      requestAnimationFrame(() => {
        updateRegion();
        randomUpdatePending = false;
      });
    }
  });

  // Funções de exportação
  function exportToSvg() {
    if (!tableElement) return;
    const tableRect = tableElement.getBoundingClientRect();
    const tdElements = tableElement.querySelectorAll("td");
    let paintedCells = [];
    tdElements.forEach(cell => {
      if (cell.style.backgroundColor && cell.style.backgroundColor !== "") {
        const cellRect = cell.getBoundingClientRect();
        const x = cellRect.left - tableRect.left;
        const y = cellRect.top - tableRect.top;
        paintedCells.push({
          x, 
          y, 
          width: cellRect.width, 
          height: cellRect.height, 
          fill: cell.style.backgroundColor
        });
      }
    });

    if (paintedCells.length === 0) {
      alert("Nenhuma pintura foi encontrada para exportar.");
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    paintedCells.forEach(cell => {
      if(cell.x < minX) minX = cell.x;
      if(cell.y < minY) minY = cell.y;
      if(cell.x + cell.width > maxX) maxX = cell.x + cell.width;
      if(cell.y + cell.height > maxY) maxY = cell.y + cell.height;
    });
    const svgWidth = maxX - minX;
    const svgHeight = maxY - minY;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
    paintedCells.forEach(cell => {
      const adjX = cell.x - minX;
      const adjY = cell.y - minY;
      svgContent += `<rect x="${adjX}" y="${adjY}" width="${cell.width}" height="${cell.height}" fill="${cell.fill}" stroke="none"/>`;
    });
    svgContent += "</svg>";

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "pintura.svg";
    link.href = url;
    link.click();
  }

  function exportToPng() {
    if (!tableElement) return;
    const tableRect = tableElement.getBoundingClientRect();
    const tdElements = tableElement.querySelectorAll("td");
    let paintedCells = [];
    tdElements.forEach(cell => {
      if (cell.style.backgroundColor && cell.style.backgroundColor !== "") {
        const cellRect = cell.getBoundingClientRect();
        const x = cellRect.left - tableRect.left;
        const y = cellRect.top - tableRect.top;
        paintedCells.push({
          x, 
          y, 
          width: cellRect.width, 
          height: cellRect.height, 
          fill: cell.style.backgroundColor
        });
      }
    });

    if (paintedCells.length === 0) {
      alert("Nenhuma pintura foi encontrada para exportar.");
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    paintedCells.forEach(cell => {
      if(cell.x < minX) minX = cell.x;
      if(cell.y < minY) minY = cell.y;
      if(cell.x + cell.width > maxX) maxX = cell.x + cell.width;
      if(cell.y + cell.height > maxY) maxY = cell.y + cell.height;
    });
    const canvasWidth = Math.ceil(maxX - minX);
    const canvasHeight = Math.ceil(maxY - minY);

    let canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    let ctx = canvas.getContext("2d");
    // Fundo transparente

    paintedCells.forEach(cell => {
      const adjX = Math.floor(cell.x - minX);
      const adjY = Math.floor(cell.y - minY);
      const rectWidth = Math.ceil(cell.width);
      const rectHeight = Math.ceil(cell.height);
      ctx.fillStyle = cell.fill;
      ctx.fillRect(adjX, adjY, rectWidth, rectHeight);
    });

    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "pintura.png";
    link.href = dataURL;
    link.click();
  }

  function resetGrid() {
    cellColors = {};
    rowsInput.value = 20;
    colsInput.value = 10;
    selRowInput.value = 1;
    selColInput.value = "A";

    cellSizeSlider.value = 40;
    cellSizeVal.textContent = 40;
    selectedCellSizeOverride = parseInt(cellSizeSlider.value);

    vertRangeSlider.value = 2;
    vertRangeVal.textContent = 2;
    horizRangeSlider.value = 2;
    horizRangeVal.textContent = 2;
    intensitySlider.value = 1.0;
    intensityVal.textContent = 1.0;
    paintColorPicker.value = "#000000";

    paintingMode = true;
    eraserMode = false;
    randomSizeMode = false;
    persistentMode = false;
    persistentSelections = [];
    togglePaintBtn.textContent = 'Pintura ON';
    eraserBtn.textContent = 'Borracha';
    randomSizeBtn.textContent = 'Random Size OFF';
    persistBtn.textContent = 'Persistir Seleção OFF';

    createGrid();
  }

  rowsInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
      createGrid();
    }
  });
  colsInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
      createGrid();
    }
  });

  eraserBtn.addEventListener('click', () => {
    eraserMode = !eraserMode;
    if (eraserMode) {
      eraserBtn.textContent = 'Borracha ON';
      paintingMode = false;
      togglePaintBtn.textContent = 'Pintura OFF';
    } else {
      eraserBtn.textContent = 'Borracha';
    }
  });

  randomSizeBtn.addEventListener('click', () => {
    randomSizeMode = !randomSizeMode;
    if (randomSizeMode) {
      currentRandomVert = randomBetween(parseInt(vertRangeSlider.min), parseInt(vertRangeSlider.max));
      currentRandomHoriz = randomBetween(parseInt(horizRangeSlider.min), parseInt(horizRangeSlider.max));
      currentRandomIntensity = parseFloat((Math.random() * (parseFloat(intensitySlider.max) - parseFloat(intensitySlider.min)) + parseFloat(intensitySlider.min)).toFixed(1));
      targetRandomVert = randomBetween(0, parseInt(vertRangeSlider.max));
      targetRandomHoriz = randomBetween(0, parseInt(horizRangeSlider.max));
      targetRandomIntensity = parseFloat((Math.random() * (parseFloat(intensitySlider.max) - parseFloat(intensitySlider.min)) + parseFloat(intensitySlider.min)).toFixed(1));
      randomSizeBtn.textContent = 'Random Size ON';
    } else {
      randomSizeBtn.textContent = 'Random Size OFF';
    }
    updateRegion();
  });

  togglePaintBtn.addEventListener('click', () => {
    if (randomSizeMode) {
      randomSizeMode = false;
      randomSizeBtn.textContent = 'Random Size OFF';
    }
    paintingMode = !paintingMode;
    togglePaintBtn.textContent = paintingMode ? 'Pintura ON' : 'Pintura OFF';
  });

  persistBtn.addEventListener('click', () => {
    persistentMode = !persistentMode;
    persistBtn.textContent = persistentMode ? 'Persistir Seleção ON' : 'Persistir Seleção OFF';
  });

  document.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  vertRangeSlider.addEventListener('input', () => {
    vertRangeVal.textContent = vertRangeSlider.value;
    vertRange = parseInt(vertRangeSlider.value);
    updateRegion();
  });

  horizRangeSlider.addEventListener('input', () => {
    horizRangeVal.textContent = horizRangeSlider.value;
    horizRange = parseInt(horizRangeSlider.value);
    updateRegion();
  });

  intensitySlider.addEventListener('input', () => {
    intensityVal.textContent = intensitySlider.value;
    intensity = parseFloat(intensitySlider.value);
    updateRegion();
  });

  selRowInput.addEventListener('change', updateRegion);
  selColInput.addEventListener('change', updateRegion);

  incRowsBtn.addEventListener('click', () => {
    let r = parseInt(rowsInput.value);
    if (r < parseInt(rowsInput.max)) {
      rowsInput.value = r + 1;
      createGrid();
    }
  });

  decRowsBtn.addEventListener('click', () => {
    let r = parseInt(rowsInput.value);
    if (r > parseInt(rowsInput.min)) {
      rowsInput.value = r - 1;
      createGrid();
    }
  });

  incColsBtn.addEventListener('click', () => {
    let c = parseInt(colsInput.value);
    if (c < parseInt(colsInput.max)) {
      colsInput.value = c + 1;
      createGrid();
    }
  });

  decColsBtn.addEventListener('click', () => {
    let c = parseInt(colsInput.value);
    if (c > parseInt(colsInput.min)) {
      colsInput.value = c - 1;
      createGrid();
    }
  });

  updateGridBtn.addEventListener('click', resetGrid);
  exportPngBtn.addEventListener('click', exportToPng);
  exportSvgBtn.addEventListener('click', exportToSvg);

  cellSizeSlider.addEventListener('input', () => {
    const newSize = parseInt(cellSizeSlider.value);
    cellSizeVal.textContent = newSize;
    selectedCellSizeOverride = newSize;
    updateRegion();
  });

  // Botão de Alternar Tema com texto dinâmico
  const toggleThemeBtn = document.getElementById('toggleTheme');
  toggleThemeBtn.textContent = document.body.classList.contains('theme-dark') ? 'TEMA REDBUG' : 'TEMA BRANCO';
  toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
    if (document.body.classList.contains('theme-dark')) {
      toggleThemeBtn.textContent = 'TEMA REDBUG';
    } else {
      toggleThemeBtn.textContent = 'TEMA BRANCO';
    }
  });

  createGrid();
});
