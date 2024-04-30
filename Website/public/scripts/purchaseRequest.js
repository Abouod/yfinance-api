// Hide navbar on scroll down
// Get the navbar
let navbar = document.querySelector(".custom-navbar");

// Get the initial position of the page
let prevScrollpos = window.pageYOffset;

// Function to handle scroll event
window.onscroll = function () {
  // Get the current scroll position
  let currentScrollPos = window.pageYOffset;

  // If the user scrolls down
  if (prevScrollpos < currentScrollPos) {
    // Hide the navbar by adding a class
    navbar.classList.add("hidden");
  } else {
    // Show the navbar by removing the class
    navbar.classList.remove("hidden");
  }

  // Update the previous scroll position
  prevScrollpos = currentScrollPos;
};

// Counter for generating unique IDs
let collapseCount = 0;

// Function to generate unique IDs for collapse elements
function generateUniqueCollapseID() {
  collapseCount++;
  return "pd-collapse" + collapseCount;
}

document.getElementById("itemNumber").value = 1;

$(document).ready(function () {
  // Counter for item number
  let itemNumber = 1;

  // JavaScript to handle form validation on button click and display an alert
  // document
  //   .getElementById("submit_modal_btn")
  //   .addEventListener("click", function () {
  //     // Get the form element
  //     let form = document.getElementById("CreatePRForm");

  //     // Check if the form is valid
  //     if (form.checkValidity()) {
  //       // If the form is valid, Allow submission
  //       // form.submit();
  //     } else {
  //       // If the form is not valid, display an error message or handle it as needed
  //       alert("Please fill out all required fields.");
  //     }
  //   });

  //This function is triggered when any element with the class add_item_btn is clicked.
  $(".add_item_btn").click(function (e) {
    e.preventDefault(); //Prevent default action of form being submitted

    // Generate unique IDs for collapse elements
    let collapseID = generateUniqueCollapseID();

    // Increment item number
    itemNumber++;

    //dynamically adds a new set of input fields for product to the container with class .show-item
    $("#show-item").append(`<div class="row p-4">
                                                    <div class="col-md-1 mb-3">
                                                       <label class="labels">Item</label>
                                                            <input type="number" name="itemNumber" class="form-control"
                                                               value="${itemNumber}" id="itemNumber" readonly>
                                                    </div>

                                                     <div class="col-md-1 mb-3">
                                                        <label class="labels">Part No. *</label>
                                                        <input type="text" name="partNumber[]"
                                                            class="form-control " required>
                                                    </div>

                                                    <div class="col-md-2 mb-3">
                                                        <label class="labels">Brand *</label>
                                                        <input type="text" name="brand[]" class="form-control" required>
                                                    </div>
                                                    <div class="col-md-3 mb-3">
                                                        <label class="labels">Description *</label>
                                                        <textarea class="form-control" id="exampleFormControlTextarea1"
                                                            rows="2" name="description[]" required></textarea>
                                                    </div>
                                                   <div class="col-md-2 mb-3">
                                                        <label class="labels">Date Required *</label>
                                                        <input type="date" name="dateRequired[]"
                                                            class="form-control" required>
                                                    </div>
                                                    <div class="col-md-1 mb-3">
                                                         <label class="labels">Qty *</label>
                                                         <input id="quantity" type="number" name="quantity[]"
                                                                class="quantity form-control" min="0" required>
                                                    </div>
                                                   <div class="col-md-2 mb-3">
                                                        <label class="labels">Currency *</label>
                                                        <input name="currency[]" type="text"
                                                            class="form-control" list="currency"
                                                            id="currencyInput">
                                                        <datalist id="currency">
                                                            <option value="" selected disabled hidden>select
                                                                currency
                                                            </option>
                                                            <option value="MYR">Malaysian Ringgit</option>
                                                            <option value="ALL">Albanian Lek</option>
                                                            <option value="SAR">Saudi Riyal</option>
                                                            <option value="USD">US Dollar</option>
                                                            <option value="POD">UK Pound</option>
                                                        </datalist>
                                                        <div id="error" style="color: red;"></div>
                                                    </div>

                                                    <div class="row">
                                                        <div class="collapse" id="${collapseID}">
                                                            <div class="row">
                                                                <!-- DT Optional -->
                                                                <div class="col-md-3 mb-3">
                                                                    <label class="labels">Delivery Term
                                                                        <small>(Opt.)</small></label>
                                                                    <input name="deliveryTerm[]" type="text"
                                                                        class="form-control">
                                                                </div>

                                                                <!-- LT Optional -->
                                                                <div class="col-md-3 mb-3">
                                                                    <label class="labels">Lead Time
                                                                        <small>(Opt.)</small></label>
                                                                    <input name="leadTime[]" type="text"
                                                                        class="form-control">
                                                                </div>

                                                                <!-- Tax Optional -->
                                                                <div class="col-md-3 mb-3">
                                                                    <label class="labels">Tax (%)
                                                                    <small>(Opt.)</small></label>
                                                                    <input id="tax" name="tax[]" type="number"
                                                                            min="0" class="form-control">
                                                                </div>

                                                                <!-- Tax Optional -->
                                                                <div class="col-md-3 mb-3">
                                                                    <label class="labels">Exwork
                                                                        Address/Remark
                                                                        <small>(Opt.)</small></label>
                                                                    <input name="exwork[]" type="text"
                                                                        class="form-control">
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div class="row">
                                                        <div class="col-md-2 mb-3">
                                                            <label class="labels">Unit Price *</label>
                                                            <input id="unitPrice" type="number"
                                                                name="unitPrice[]" class="unitPrice form-control" min="0"
                                                                required>
                                                        </div>

                                                        <div class="col-md-2 mb-3">
                                                             <label class="labels">Total Price</label>
                                                            <input placeholder="Auto Calculated" id="totalPrice"
                                                                name="totalPrice[]" type="number"
                                                                class="totalPrice form-control"
                                                                value="" readonly>
                                                        </div>

                                                        <div class="col-md-6 mt-4">
                                                            <p class="d-inline-flex gap-1">
                                                                <button class="btn btn-outline-primary" type="button"
                                                                    data-bs-toggle="collapse"
                                                                    data-bs-target="#${collapseID}"
                                                                    aria-expanded="false"
                                                                    aria-controls="${collapseID}">
                                                                    See Optional Fields
                                                                </button>
                                                                <!-- Button trigger modal -->
                                                                <button class="btn btn-danger remove_item_btn m-auto">Remove</button>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>`);

    // Add event listeners for calculating total price to the newly added row
    addTotalPriceListeners();
  });

  $(document).on("click", ".remove_item_btn", function (e) {
    e.preventDefault();
    itemNumber--;
    let row_item = $(this).parent().parent().parent().parent();
    $(row_item).remove();
  });

  addTotalPriceListeners();
});

// Validate currency input
document.getElementById("currencyInput").addEventListener("blur", function () {
  let input = this.value;
  let datalist = document.getElementById("currency");
  let options = datalist.getElementsByTagName("option");
  let isValid = false;

  for (let i = 0; i < options.length; i++) {
    if (input === options[i].value) {
      isValid = true;
      break;
    }
  }

  if (!isValid) {
    this.value = ""; // Clear invalid value
    document.getElementById("error").textContent =
      "Invalid currency. Please select from the list.";
  } else {
    document.getElementById("error").textContent = ""; // Clear error message
  }
});

// Function to add event listeners for calculating total price
function addTotalPriceListeners() {
  // Get relevant input elements for the newly added row
  const quantityInputs = document.querySelectorAll(".quantity");
  const unitPriceInputs = document.querySelectorAll(".unitPrice");
  const taxInputs = document.querySelectorAll('input[name="tax[]"]'); // Corrected selector
  const totalPriceInputs = document.querySelectorAll(".totalPrice");

  // Loop through each newly added row and apply event listeners
  quantityInputs.forEach((quantityInput, index) => {
    const unitPriceInput = unitPriceInputs[index];
    const taxInput = taxInputs[index];
    const totalPriceInput = totalPriceInputs[index];

    // Add event listener to calculate total price dynamically
    [quantityInput, unitPriceInput, taxInput].forEach((input) => {
      input.addEventListener("input", () => {
        calculateTotalPrice(
          quantityInput,
          unitPriceInput,
          taxInput,
          totalPriceInput
        );
        calculateGrandTotal();
      });
    });
  });
}

// Function to calculate total price
function calculateTotalPrice(
  quantityInput,
  unitPriceInput,
  taxInput,
  totalPriceInput
) {
  // Get values from input fields
  const quantity = parseFloat(quantityInput.value) || 0;
  const unitPrice = parseFloat(unitPriceInput.value) || 0;
  const tax = parseFloat(taxInput.value) || 0;

  // Calculate total price
  const totalPrice = quantity * unitPrice * (1 + tax / 100);

  // Update total price input field
  totalPriceInput.value = totalPrice.toFixed(2);
}

// Function to calculate grand total
function calculateGrandTotal() {
  let totalPrices = document.querySelectorAll('input[name="totalPrice[]"]');
  let grandTotal = 0;
  totalPrices.forEach(function (input) {
    grandTotal += parseFloat(input.value) || 0;
  });
  document.getElementById("grandTotal").value = grandTotal.toFixed(2);
}

// Event listener for dynamic changes
document.addEventListener("input", function (event) {
  if (event.target && event.target.matches('input[name="totalPrice[]"]')) {
    calculateGrandTotal();
    // Add event listeners for calculating total price to the newly added row
    addTotalPriceListeners();
  }
});

// Initial calculation
calculateGrandTotal();
