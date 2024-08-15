const fileInput = document.querySelector('#file-input');
const clearButton = document.querySelector('#clear');
const selectProperties = document.querySelector('#properties')
const formProperties = document.querySelector('#properties-form')
const makeChartButton = document.querySelector('#make-chart');
const canvasContainer = document.querySelector('#canvas-container');
const downloadPdfButton = document.querySelector('#download-pdf');

fileInput.addEventListener('change', e => handelFile(e));
clearButton.addEventListener('click', e => clearFile(e));
downloadPdfButton.addEventListener('click', e => downloadPdf())

function downloadPdf() {
    const pdf = new jsPDF();
    const canvases = document.querySelectorAll('canvas');
    let x = 10;
    let y = 10;
    const spacing = 10;

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    canvases.forEach(canvas => {
        // Get the data URL of the canvas
        const imageData = canvas.toDataURL('image/png');

        // Calculate scaling factor to fit canvas within page dimensions
        const canvasAspectRatio = canvas.width / canvas.height;
        let scaledWidth = pageWidth - 2 * margin;
        let scaledHeight = (pageWidth - 2 * margin) / canvasAspectRatio;

        if (scaledHeight > pageHeight - 2 * margin) {
            scaledHeight = pageHeight - 2 * margin;
            scaledWidth = (pageHeight - 2 * margin) * canvasAspectRatio;
        }

        // Add the canvas image to the PDF
        pdf.addImage(imageData, 'PNG', x, y, scaledWidth, scaledHeight);

        // Add spacing between canvases
        y += scaledHeight + spacing;

        // Check if canvas position exceeds page height
        if (y > pageHeight - margin) {
            pdf.addPage(); // Add a new page
            y = margin; // Reset y position for new page
        }
    });

    pdf.save(`${new Date().toISOString()}.pdf`);
}


function handelFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        console.log(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });

        processJsonData(jsonData);

        bindingFunction(jsonData);
    };
    reader.onerror = function (event) {
        console.log('file reading error: ', event.targetformCheckboxes.error);
    };

    reader.readAsArrayBuffer(file);
}

function bindingFunction(myJsonData) {
    const chartData = countOccurrences(myJsonData);
    console.log(JSON.stringify(chartData));

    const formArray = getPropertiesArray(myJsonData);
    addFormLabels(formArray);

    makeChartButton.addEventListener('click', e => {
        
        const checkboxArray = getselectedCheckboxes();

        populateCanvasContainer(checkboxArray);

        if (document.querySelector('#canvas-container canvas') !== null) {
            const jsonDataOccurance = countOccurrences(myJsonData);
            const theChartData = getChartData(checkboxArray, jsonDataOccurance);
            makeChart(theChartData);
            console.log(document.querySelectorAll('#canvas-container canvas'));
        }

    })
}

function getPropertiesArray(myJsonData) {
    const arrayOfProperties = Object.keys(myJsonData[0]);
    console.log(arrayOfProperties);
    return arrayOfProperties;
}

function addFormLabels(arrayOfJsonProperties) {
    arrayOfJsonProperties.forEach(element => {
        formProperties.innerHTML += `<label>
        <input type="checkbox" name="property" value="${element}"> ${element} </label>`;
    });
}

function getselectedCheckboxes() {
    const formCheckboxes = document.querySelectorAll('#properties-form input[type="checkbox"]');
    console.log(formCheckboxes)
    const arrayOfSelectedCheckboxes = [];
    formCheckboxes.forEach(element => {
        if (element.checked) {
            arrayOfSelectedCheckboxes.push(element.value);
        }
    });
    console.log(arrayOfSelectedCheckboxes);
    return arrayOfSelectedCheckboxes;
}

function populateCanvasContainer(arrayOfcheckboxes) {
    canvasContainer.innerHTML = '';
    arrayOfcheckboxes.forEach(element => {
        const canvas = document.createElement('canvas');
        canvas.id = `${element.replace(/\s+/g, '')}-canvas`;
        canvasContainer.appendChild(canvas);
    })
}


function makeChart (chartData) {

    for(let property in chartData) {
        const canvasId = `${property.replace(/\s+/g, '')}-canvas`;
        const chartCanvas = document.querySelector(`#${canvasId}`);
        if (!chartCanvas) {
            console.error(`Canvas with ID '${canvasId}' not found.`);
            continue;
        }
        if (chartCanvas.chart) {
            chartCanvas.chart.destroy();
        }
        const ctx = chartCanvas.getContext('2d');
    
        chartCanvas.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(chartData[property]),
                datasets: [{
                    label: property,
                    data: Object.values(chartData[property]),
                }]
            },
            options: {
                responsive: true,
                // maintainAspectRatio: false,
            }
        })
    }

}
function getChartData (arrayOfSelectedProperties, obj) {
    const myChartData = {};
    arrayOfSelectedProperties.forEach(element => {
        const formattedElement = element.replace(/\s+/g, ' ').trim().toLowerCase();
        for (let prop in obj) {
            const formattedProp = prop.replace(/\s+/g, ' ').trim().toLowerCase();
            if (formattedElement === formattedProp) {
                myChartData[prop] = obj[prop];
            }
        }
    })
    return myChartData;
}

// [{ "Date": "01-Dec-23", "Particulars": "Zodina\tHrahsel", "Vch Type": "Sales-(Online)", "Vch No.": "307692324000112", "Debit": "81421.00" }, { "Date": "01-Dec-23", "Particulars": "Pradyumna\tShee", "Vch Type": "Sales-(Online)", "Vch No.": "307692324000113", "Debit": "1546.00" }, { "Date": "01-Dec-23", "Particulars": "Madhu\tN\tG", "Vch Type": "Sales-(Online)", "Vch No.": "307692324000114", "Debit": "3401.00" }, { "Date": "01-Dec-23", "Particulars": "PRANESH-6204866275", "Vch Type": "TAX INVOICE", "Vch No.": "MR/238/23-24/", "Debit": "20000.00" }]

function countOccurrences(jsonData) {
    const occurrences = {};

    // Iterate over each object in the JSON data array
    jsonData.forEach(obj => {
        // Iterate over each property in the current object
        Object.entries(obj).forEach(([key, value]) => {
            // If the property doesn't exist in the occurrences object, initialize it with an empty object
            if (!occurrences[key]) {
                occurrences[key] = {};
            }

            // If the value doesn't exist in the occurrences of the current property, initialize it with count 1
            if (!occurrences[key][value]) {
                occurrences[key][value] = 1;
            } else {
                // If the value already exists, increment its count
                occurrences[key][value]++;
            }
        });
    });

    return occurrences;
}



function processJsonData(myJsonData) {
    console.log(JSON.stringify(myJsonData))
}

function clearFile(event) {
    // Reset the file input value
    fileInput.value = '';
    formProperties.innerHTML = '';
    canvasContainer.innerHTML = '';
    console.log(document.querySelectorAll('#canvas-container canvas'));
    console.log('clear')
}
