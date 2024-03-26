// window.onload = () => {
//     let RPA_CreateTravelRequestForm;

//     UiPathRobot.init(10);

//     UiPathRobot.getProcesses().then(function (results) {
//         if (results.length === 0) {
//             showError("Robot not connected to Orchestrator or no processes are available");
//         }

//         RPA_CreateTravelRequestForm = results.find(e => e.name === 'RPA_CreateTravelRequestForm');

//         if (RPA_CreateTravelRequestForm) {
//             console.log("RPA_CreateTravelRequestForm process is available");
//         } else {
//             showError("RPA_CreateTravelRequestForm process not found");
//         }

//     }).catch(function (err) {
//         console.error("Something else went wrong", err);
//         showError("Something else went wrong " + err);
//     });

//     const runRPA_CreateTravelRequestForm = (month, year, data) => {
//         RPA_CreateTravelRequestForm.start({
//             webMonth: month,
//             webYear: year,
//             ...data
//         }).onStatus((status) => {
//             console.log("Status:", status);
//             if (status) {
//                 // document.getElementById("process-status").innerHTML += `<li>${status}</li>`
//             }
//         }).then(
//             processResults => {
//                 console.log(processResults);
//                 console.log("Redirecting to index.html with month:", month, "and year:", year);
//                 window.location.href = `index.html?month=${month}&year=${year}`;
//             },
//             err => {
//                 console.error(err);
//                 showError(err);
//                 alert("File has already been created!");
//                 console.log("Redirecting to index.html with month:", month, "and year:", year);
//                 window.location.href = `index.html?month=${month}&year=${year}`;
//             }
//         );
//     }

//     document.querySelector("#travelForm").addEventListener("submit", function (event) {
//         event.preventDefault();
//         const formData = new FormData(event.target);

//         const data = {};
//         formData.forEach((value, key) => {
//             data[key] = value;
//         });

//         const departureDate = new Date(data.departureDate);
//         const returnDate = new Date(data.returnDate);
//         const totalDays = Math.round((returnDate - departureDate) / (1000 * 60 * 60 * 24));

//         data.totalDays = totalDays;

//         runRPA_CreateTravelRequestForm(departureDate.getMonth() + 1, departureDate.getFullYear(), data);
//     }, false);

//     function showError(err) {
//         console.error(err);
//         document.getElementById("error-message").innerHTML = err;
//     }
// }
window.onload = () => {
    let TravelRequestFormProcess;

    UiPathRobot.init(10);

    UiPathRobot.getProcesses().then(function (results) {
        if (results.length === 0) {
            showError("Robot not connected to Orchestrator or no processes are available");
        }

        TravelRequestFormProcess = results.find(e => e.name === 'TravelRequestForm');

        if (TravelRequestFormProcess) {
            console.log("TravelRequestForm process is available");
        } else {
            showError("TravelRequestForm process not found");
        }

    }).catch(function (err) {
        console.log("Something else went wrong", err);
        showError("Something else went wrong " + err);
    });

    const runTravelRequestFormProcess = () => {
        calculateExpenses();
        const formData = new FormData(document.getElementById('travelForm'));
        const amount2 = parseFloat(document.getElementById('amount2').value); // Retrieving amount6 value from input field
        const amount3 = parseFloat(document.getElementById('amount3').value); // Retrieving amount6 value from input field
        const amount4 = parseFloat(document.getElementById('amount4').value); // Retrieving amount6 value from input field
        const amount5 = parseFloat(document.getElementById('amount5').value); // Retrieving amount6 value from input field
        const amount6 = parseFloat(document.getElementById('amount6').value); // Retrieving amount6 value from input field
        const amount7 = parseFloat(document.getElementById('amount7').value); // Retrieving amount6 value from input field
        
        TravelRequestFormProcess.start({
            travelCategory: formData.get('travelCategory'),
            name: formData.get('name'),
            designation: formData.get('designation'),
            department: formData.get('department'),
            costCenter: formData.get('costCenter'),
            projectName: formData.get('projectName'),
            employeeID: formData.get('employeeID'),
            contactNumber: formData.get('contactNumber'),
            supervisor: formData.get('supervisor'),
            tripPaid: formData.get('tripPaid'),
            purpose: formData.get('purpose'),
            travelFrom: formData.get('travelFrom'),
            travelTo: formData.get('travelTo'),
            departureDate: formData.get('departureDate'),
            departureTime: formData.get('departureTime'),
            returnDate: formData.get('returnDate'),
            returnTime: formData.get('returnTime'),
            totalDays: formData.get('totalDays'),
            advanceAmount: formData.get('advanceAmount'),
            amount1: parseFloat(document.getElementById('amount1').value),
            amount2: amount2,
            amount3: amount3,
            amount4: amount4,
            amount5: amount5,
            amount6: amount6,
            otherDesc: formData.get('otherDesc'),
            amount7: amount7,
            
        }).onStatus((status) => {
            console.log("Status:", status);
        }).then(
            processResults => {
                console.log(processResults);
                // Handle process results as needed
            },
            err => {
                console.error(err);
                showError("Something went wrong. Process failed!");
            }
        );
    }

    // Listen for form submission
    document.querySelector("#travelForm").addEventListener("submit", function (event) {
        event.preventDefault();
        runTravelRequestFormProcess();
    }, false);

    function showError(err) {
        document.getElementById("error-message").innerHTML = err;
    }
}