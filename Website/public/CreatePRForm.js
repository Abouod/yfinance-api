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

  const runRPA_CreatePurchaseRequestForm = (
    requisitionNo,
    requestDate,
    fullName,
    customerName,
    onlinePurchase,
    quotationNo
  ) => {
    //Initialize the process status and result
    document.getElementById("process-status").innerHTML = "";
    document.getElementById("process-result").innerHTML = "";
    // Run the process
    RPA_CreatePurchaseRequestForm.start({
      reqNo: requisitionNo,
      reqDate: requestDate,
      fName: fullName,
      cusName: customerName,
      oPurchase: onlinePurchase,
      qNo: quotationNo,
    })
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
            ).innerHTML = `<b>Process output:</b> <br> : ${processResults.requisitionNo}`)
          );
          console.log(
            (document.getElementById(
              "process-result"
            ).innerHTML = `<b>Process output:</b> <br> : ${processResults.reqNo}`)
          );
          document.getElementById(
            "process-result2"
          ).innerHTML = `<b>Process output reqNo:</b> <br> : ${processResults.reqDate}`;
        },
        (err) => {
          console.log(err);
          showError(err);
        }
      );
  };

  // Make it listen to the form submission
  document.getElementById("CreatePRForm").addEventListener(
    "submit",
    function (event) {
      // event.preventDefault();
      const requisitionNo = document.getElementById("requisitionNo").value;
      const requestDate = document.getElementById("requestDate").value;
      const fullName = document.getElementById("fullName").value;
      const customerName = document.getElementById("customerName").value;
      const onlinePurchase = document.getElementById("onlinePurchase").value;
      const quotationNo = document.getElementById("quotationNo").value;
      // const prType = document.getElementById("prType").value;

      runRPA_CreatePurchaseRequestForm(
        requisitionNo,
        requestDate,
        fullName,
        customerName,
        onlinePurchase,
        quotationNo
      );
    },
    false
  );
};

function showError(err) {
  document.getElementById("error-message").innerHTML = err;
}
