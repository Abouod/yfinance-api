window.onload = () => {
    let RPA_CreateClaimFormProcess;

    UiPathRobot.init(10);

    UiPathRobot.getProcesses().then(function (results) {
        if (results.length === 0) {
            showError("Robot not connected to Orchestrator or no processes are available")
        }

        RPA_CreateClaimFormProcess = results.find(e => e.name === 'RPA_CreateClaimForm');

        if (RPA_CreateClaimFormProcess) {
            console.log("RPA_CreateClaimForm process is available")
        } else {
            showError("RPA_CreateClaimForm process not found")
        }

    }, function (err) {
        console.log("Something else went wrong", err)
        showError("Something else went wrong " + err)
    });

    const runRPA_CreateClaimFormProcess = (month, year, data) => {
        // Pass selected dates, journey, and other input values to the function
        RPA_CreateClaimFormProcess.start({
            webMonth:month,
            webYear:year,
            ...data
        }).onStatus((status) => {
            console.log("Status:", status);
            if (status) {
                // document.getElementById("process-status").innerHTML += `<li>${status}</li>`
            }
        }).then(
            processResults => {
                console.log(processResults)
                // Redirect to petrolClaim.html with month and year parameters
                console.log("Redirecting to petrolClaim.html with month:", month, "and year:", year);
                // setTimeout(() => {
                    window.location.href = `petrolClaim.html?month=${month}&year=${year}`;
                // }, 10000); // Delay of 10 seconds (10000 milliseconds)
            },
            err => {
                console.log(err)
                showError(err)
                alert("File have already created!")
                console.log("Redirecting to petrolClaim.html with month:", month, "and year:", year);
                // setTimeout(() => {
                    window.location.href = `petrolClaim.html?month=${month}&year=${year}`;
                // }, 10000); // Delay of 10 seconds (10000 milliseconds)
            }
        );
    }

    // Listen for form submission
    document.querySelector("#createClaimForm").addEventListener("submit", function (event) {
        event.preventDefault();
        const monthDropdown = document.getElementById("month"); // Get the month dropdown
        const monthIndex = monthDropdown.selectedIndex; // Get the selected index of the month dropdown
        const month = monthDropdown.options[monthIndex].text; // Get the full name of the selected month
        const year = document.getElementById("year").value; // Get selected year
        const data = generateClaimFormData(); // Call the function to get the generated data
        runRPA_CreateClaimFormProcess(month, year, data); // Pass the data to the RPA process
    }, false);

    function showError(err) {
        document.getElementById("error-message").innerHTML = err;
    }

    // Function to generate claim form data
    function generateClaimFormData() {
        // Get selected month and year
        var month = document.getElementById("month").value;
        var year = document.getElementById("year").value;

        // Initialize arrays to store dates and days of the week
        var arrayDate = [];
        var arrayDay = [];

        // Get the number of days in the selected month and year
        var daysInMonth = new Date(year, month, 0).getDate();

        // Loop through each day of the month
        for (var day = 1; day <= daysInMonth; day++) {
            // Create a Date object for the current day
            var currentDate = new Date(year, month - 1, day);

            // Format date as 'dd-MMM-yy' (e.g., 01-Mar-24)
            var dateString = currentDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
            }).replace(/\s/g, '-');

            // Push the formatted date to the dates array
            arrayDate.push(dateString);

            // Get the day of the week (e.g., 'Mon', 'Tue')
            var dayOfWeek = currentDate.toLocaleDateString('en-GB', { weekday: 'short' });

            // Push the day of the week to the days of the week array
            arrayDay.push(dayOfWeek);
        }

        // Return the generated data
        return {
            arrayDate: arrayDate,
            arrayDay: arrayDay,
        };
    }
}
