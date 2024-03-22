window.onload = () => {
    let RPA_PetrolClaimProcess;

    UiPathRobot.init(10);

    UiPathRobot.getProcesses().then(function (results) {
        if (results.length === 0) {
            showError("Robot not connected to Orchestrator or no processes are available")
        }

        RPA_PetrolClaimProcess = results.find(e => e.name === 'RPA_PetrolClaim');

        if (RPA_PetrolClaimProcess) {
            console.log("RPA_PetrolClaim process is available")
        } else {
            showError("RPA_PetrolClaim process not found")
        }

    }, function (err) {
        console.log("Something else went wrong", err)
        showError("Something else went wrong " + err)
    });

    const runRPA_PetrolClaimProcess = () => {
        // Get the selected dates
        const selectedDates = fp.selectedDates.map(date => {
            // Format each date as "dd-MMM-yy"
            const day = ("0" + date.getDate()).slice(-2);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear().toString().slice(-2);
            return day + "-" + month + "-" + year;
        });

        // Log the selected dates array
        console.log("Selected dates:", selectedDates);

        // Get other input values
        let startDes = document.getElementById('startDes').value.trim();
        let stop1 = document.getElementById('stop1') ? document.getElementById('stop1').value.trim() : '';
        let stop2 = document.getElementById('stop2') ? document.getElementById('stop2').value.trim() : '';
        let stop3 = document.getElementById('stop3') ? document.getElementById('stop3').value.trim() : '';
        let endDes = document.getElementById('endDes').value.trim();

        // Get the month and year from the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const month = urlParams.get('month');
        const year = urlParams.get('year');

        // Construct the journey string
        let journey = startDes;

        if (stop1) {
            journey += " to " + stop1;
        }

        if (stop2) {
            journey += " to " + stop2;
        }

        if (stop3) {
            journey += " to " + stop3;
        }

        if (endDes) {
            journey += " to " + endDes;
        }

        // Pass selected dates, journey, and other input values to the function
        RPA_PetrolClaimProcess.start({
            dates: selectedDates,
            journey: journey,
            startDes: startDes,
            stop1: stop1,
            stop2: stop2,
            stop3: stop3,
            endDes: endDes,
            webMonth: month,
            webYear: year,
        }).onStatus((status) => {
            console.log("Status:", status);
            if (status) {
                // document.getElementById("process-status").innerHTML += `<li>${status}</li>`
            }
        }).then(
            processResults => {
                console.log(processResults)
                //alert("Process completed successfully! RM1 have been deducted from your touch N Go")
                // document.getElementById("process-result").innerHTML = `<b>Process output:</b> <br> Full Name : ${processResults.fullnameArgOut}<br> Age :  ${processResults.ageArgOut} <br> Subscription : ${processResults.booleanArgOut}`
            },
            err => {
                console.log(err)
                showError(err)
                alert("Something wrong... process failed!")

            }
        );
    }


    // Listen for form submission
    document.querySelector("#petrolForm").addEventListener("submit", function (event) {
        event.preventDefault();
        runRPA_PetrolClaimProcess();
    }, false);

    function showError(err) {
        document.getElementById("error-message").innerHTML = err;
    }
}
