$(document).ready(function () {
    if ($('#myChart').html() === "") {
        $.get('csvMerenje.csv', function (data) { dataToArrays(data) }, 'text');
    }

    document.getElementById('csvFile').addEventListener('change', upload, false);

    var vratiNaVrhBtn = document.getElementById("vratiNaVrhBtn");

    window.addEventListener("scroll", function() {
        if (window.pageYOffset > 100) {
            vratiNaVrhBtn.style.display = "block";
        } else {
            vratiNaVrhBtn.style.display = "none";
        }
    });

    vratiNaVrhBtn.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});

function dataToArrays(data) {
    let rawData = Papa.parse(data);
   
    createChart(rawData);
}

function createChart(parsedData) {
    let dataArray = parsedData.data;
    let dataMatrix = [];

    let headingArray = [];

    for (let i = 0; i < dataArray[0].length; i++) {
        dataMatrix[i] = [];

        headingArray.push({
            title: dataArray[0][i],
            unit: dataArray[1][i],
        })
    }

    for (let i = 0; i < dataArray.length; i++) {
        for (let j = 0; j < dataArray[i].length; j++) {
            if (!dataArray[i][j]) {
                dataArray[i][j] = null;
            }
            dataMatrix[j][i] = dataArray[i][j];
        }
    }

    let commentIndex = headingArray.findIndex(element => {
        if (element.title === 'Comment') {
            return true;
        }
    });
    if (commentIndex !== -1) {
        dataMatrix.splice(commentIndex, 1);
        headingArray.splice(commentIndex, 1);
    }

    let html = '';
    html += '<table class="table"><tbody>';

    parsedData.data.forEach(element => {
        if (element.some(function (el) { return el !== null; })) {
            html += '<tr>';
            element.forEach(element => {
                html += '<td>' + (element !== null ? element : '') + '</td>';
            });
            html += '</tr>';
        }
    });
    html += '</tbody></table>'
    $('#parsedData').html(html);

    console.log(parsedData);
    console.log(dataMatrix);
    console.log(headingArray);

    /* Global chart options */

    Chart.defaults.global.defaultFontFamily = 'Consolas';
    Chart.defaults.global.defaultFontSize = 18;
    Chart.defaults.global.defaultFontColor = 'black';

    Chart.defaults.global.elements.line.backgroundColor = 'transparent';

    /* /Global chart options */

    /* Data */

    let labels = dataMatrix[0];
    labels.splice(0, 3);

    let datasets = [];

    for (let i = 1; i < dataMatrix.length; i++) {
        let label = dataMatrix[i][0];

        let datasetData = dataMatrix[i];
        datasetData.splice(0, 3);

        datasets.push({
            label: label,
            data: datasetData,

            borderColor: '#' + getColor(),
            borderWidth: '1',

            pointRadius: 0,
        });
    }

    /* /Data */

    let myChart = document.getElementById('myChart').getContext('2d');
    let type = 'line';
    let data = {
        labels: labels.map(label => formatirajVreme(label)),
        datasets,
    };
    let options = {
        title: {
            display: true,
            text: ['Prikaz rezultata merenja'],
            fontSize: 23,
        },
        legend: {
            position: 'bottom',
            labels: {
                fontColor: 'black',
            }
        },
        tooltips: {
            intersect: false,
            callbacks: {
                title: (toolTipItem) => {
                    return headingArray[0].title + ": " + toolTipItem[0].label + " " + headingArray[0].unit;
                },
                label: (toolTipItem) => {
                    return toolTipItem.yLabel + " " + headingArray[toolTipItem.datasetIndex + 1].unit;

                },
            },
        },
    };

    chart = new Chart(myChart, { type, data, options });
}


function formatirajVreme(vreme) {
    var date = new Date(vreme * 1000);
    var minuti = date.getUTCMinutes();
    var sekunde = date.getUTCSeconds();
    return minuti.toString().padStart(2, '0') + ':' + sekunde.toString().padStart(2, '0');
}
let colorIndex = 0;

function getColor() {
    const colors = [
        'FF0000',
        'FF4500',
        'C71585',
        'FF8C00',
        'FF00FF',
        '1E90FF',
        '0000FF',
        'D2691E',
        'CD5C5C',
        '6A5ACD',
        '32CD32',
        '008080',
    ];

    const color = colors[colorIndex];

    colorIndex = (colorIndex + 1) % colors.length;

    return color;
}

function upload(evt) {
    if (chart != null) {
        chart.destroy();
    }

    let data = null;
    let file = evt.target.files[0];
    let reader = new FileReader();
    try { reader.readAsText(file); } catch (e) { console.log(e) }
    reader.onload = function (event) {
        let csvData = event.target.result;
        data = csvData;
        if (data && data.length > 0) {
            console.log('Imported -' + data.length + '- rows successfully!');
            dataToArrays(data);
        } else {
            console.log('No data to import!');
        }
    };
    reader.onerror = function () {
        console.log('Unable to read ' + file.fileName);
    };
}

function downloadDataAsCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    let table = document.getElementById('parsedData');
    let rows = table.querySelectorAll('tr');

    rows.forEach(function(row) {
        let rowData = [];
        let cols = row.querySelectorAll('td');
        cols.forEach(function(col) {
            rowData.push(col.textContent);
        });
        let rowCSV = rowData.join(",");
        csvContent += rowCSV + "\r\n";
    });

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link);
    link.click();
}
