window.onload = () => {
  let RPA_CreatePurchaseRequestForm;

  UiPathRobot.init(10);

  /**
   * Get a list of processes from local robot
   */
  UiPathRobot.getProcesses().then(
    function (results) {
      if (results.length === 0) {
        showError(
          "Robot not connected to Orchestrator or no processes are available"
        );
      }

      // Get the ID for the sample process
      RPA_CreatePurchaseRequestForm = results.find((e) =>
        e.name.includes("RPA_CreatePurchaseRequestForm")
      );

      if (RPA_CreatePurchaseRequestForm) {
        console.log("Process is available");
      } else {
        showError("RPA_CreatePurchaseRequestForm not found");
      }
    },
    function (err) {
      console.log("Something else went wrong", err);
      showError("Something else went wrong " + err);
    }
  );

  const runRPA_CreatePurchaseRequestForm = () => {
    return new Promise((resolve, reject) => {
      let arguments = {
        reqNo: document.getElementById("requisitionNo").value,
        reqDate: document.getElementById("requestDate").value,
        fName: document.getElementById("fullName").value,
        cusName: document.getElementById("customerName").value,
        oPurchase: document.getElementById("onlinePurchase").value,
        qNo: document.getElementById("quotationNo").value,
        pType: document.querySelector("[name='prType']:checked").value,
        spcValue: document.getElementById("SPC").value,
        tfp: document.querySelector("[name='TFP']:checked").value,
        cusPo: document.getElementById("customerPo").value,
        supplierN: document.getElementById("supplierName").value,
        projectD: document.getElementById("projectDescription").value,
        supplierT: document.querySelector("[name='ST']:checked").value,
        internalU: document.getElementById("internalUse").value,
        purchaseD: document.getElementById("purchaseDepartment").value,
        procurementCat: document.getElementById("ProcurementCategory").value,
      };

      //Initialize the process status and result
      document.getElementById("process-status").innerHTML = "";
      document.getElementById("process-result").innerHTML = "";

      // Run the process
      RPA_CreatePurchaseRequestForm.start(arguments)
        .onStatus((status) => {
          // Log the status to the console
          console.log("Status:", status);
          if (status) {
            document.getElementById(
              "process-status"
            ).innerHTML += `<li>${status}</li>`;
          }
        })
        .then(
          (processResults) => {
            console.log(processResults);
            document.getElementById(
              "process-result"
            ).innerHTML = `<b>Process output:</b> <br> : ${processResults}`;
            resolve(processResults); // Resolve the promise with process results
          },
          (err) => {
            console.log(err);
            showError(err);
            reject(err); // Reject the promise with error
          }
        );
    });
  };

  // Make the submit button run the RPA process when clicked
  document
    .getElementById("submit_modal_btn")
    .addEventListener("click", async function (event) {
      // Check if all required fields are filled
      if (!document.getElementById("CreatePRForm").checkValidity()) {
        // If any required field is empty, the browser will display the default validation message
        return;
      }
      // Prevent the default form submission
      event.preventDefault();

      try {
        // Close the modal
        document.getElementById("close-modal-button").click();

        // Call the RPA function and wait for it to complete
        await runRPA_CreatePurchaseRequestForm(arguments);

        // After the RPA process completes successfully, submit the form
        console.log("Submitting the form");
        document.getElementById("CreatePRForm").submit();
      } catch (err) {
        // If there's an error in the RPA process, handle it
        console.error("Error running UiPath process:", err);
        showError(err);
      }
    });
};

function showError(err) {
  document.getElementById("error-message").innerHTML = err;
}
