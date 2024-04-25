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
    let arguments = {
      reqNo: document.getElementById("requisitionNo").value,
      reqDate: document.getElementById("requestDate").value,
      fName: document.getElementById("fullName").value,
      cusName: document.getElementById("customerName").value,
      oPurchase: document.getElementById("onlinePurchase").value,
      qNo: document.getElementById("quotationNo").value,
      pType: document.querySelector("[name='prType']").value,
      spcValue: document.getElementById("SPC").value,
      tfp: document.querySelector("[name='TFP']").value,
      cusPo: document.getElementById("customerPo").value,
      supplierN: document.getElementById("supplierName").value,
      projectD: document.getElementById("projectDescription").value,
      supplierT: document.querySelector("[name='ST']").value,
      internalU: document.getElementById("internalUse").value,
      purchaseD: document.getElementById("purchaseDepartment").value,
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
          console.log(
            (document.getElementById(
              "process-result"
            ).innerHTML = `<b>Process output:</b> <br> : ${processResults}`)
          );
        },
        (err) => {
          console.log(err);
          showError(err);
        }
      );
  };

  // Make it listen to the button click
  document.getElementById("submit_modal_btn").addEventListener(
    "click",
    async function (event) {
      // Prevent the default form submission
      event.preventDefault();

      runRPA_CreatePurchaseRequestForm(arguments);

      //programmatically trigger a click
      document.getElementById("close-modal-button").click();

      // Set a timeout to delay the form submission after the UiPath process completes
      setTimeout(() => {
        // After UiPath process completes, submit the form programmatically
        console.log("Submitting the form");
        document.getElementById("CreatePRForm").submit();
      }, 4500); // Adjust the timeout duration as needed
    },
    false
  );
};

function showError(err) {
  document.getElementById("error-message").innerHTML = err;
}
